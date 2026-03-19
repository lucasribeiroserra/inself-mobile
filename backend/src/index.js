import "dotenv/config";
import express from "express";
import cors from "cors";
import { OAuth2Client } from "google-auth-library";
import { query } from "./db.js";
import { requireAuth, signToken } from "./auth.js";
import bcrypt from "bcryptjs";

function getGoogleClientIds() {
  const ids = process.env.GOOGLE_CLIENT_IDS || "";
  return ids.split(",").map((s) => s.trim()).filter(Boolean);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ----- Server time (para conferir fuso do servidor / horário do push) -----
app.get("/server-time", (_req, res) => {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  const offsetMin = -now.getTimezoneOffset();
  const offsetHours = Math.floor(offsetMin / 60);
  const offsetMins = Math.abs(offsetMin % 60);
  const offsetSign = offsetMin >= 0 ? "+" : "-";
  const offsetStr = `UTC${offsetSign}${String(Math.abs(offsetHours)).padStart(2, "0")}:${String(offsetMins).padStart(2, "0")}`;
  return res.json({
    iso: now.toISOString(),
    local: now.toString(),
    timeForReminder: timeStr,
    timezoneOffset: offsetStr,
    timezoneOffsetMinutes: now.getTimezoneOffset(),
  });
});

// ----- Auth -----

app.post("/auth/register", async (req, res) => {
  const { email, password, full_name } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email e senha são obrigatórios" });
  }
  const password_hash = await bcrypt.hash(password, 10);
  try {
    const r = await query(
      "INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name, created_at",
      [email.trim().toLowerCase(), password_hash, full_name || null]
    );
    const user = r.rows[0];
    await query(
      "INSERT INTO user_profiles (user_id, display_name, locale) VALUES ($1, $2, 'pt-BR') ON CONFLICT (user_id) DO UPDATE SET display_name = COALESCE(EXCLUDED.display_name, user_profiles.display_name)",
      [user.id, full_name || null]
    );
    await query("INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING", [user.id]);
    await query("INSERT INTO user_streaks (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING", [user.id]);
    const token = signToken({ userId: user.id });
    return res.json({ user: { id: user.id, email: user.email, full_name: user.full_name }, token });
  } catch (e) {
    if (e.code === "23505") return res.status(400).json({ error: "Email já cadastrado" });
    throw e;
  }
});

app.get("/auth/me", requireAuth, async (req, res) => {
  const r = await query(
    "SELECT u.id, u.email, u.full_name, p.avatar_url FROM users u LEFT JOIN user_profiles p ON p.user_id = u.id WHERE u.id = $1",
    [req.userId]
  );
  const row = r.rows[0];
  if (!row) return res.status(401).json({ error: "Usuário não encontrado" });
  return res.json({
    user: { id: row.id, email: row.email, full_name: row.full_name, avatar_url: row.avatar_url ?? null },
  });
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email e senha são obrigatórios" });
  }
  const r = await query(
    "SELECT id, email, full_name, password_hash FROM users WHERE email = $1",
    [email.trim().toLowerCase()]
  );
  const user = r.rows[0];
  if (!user) return res.status(401).json({ error: "Email ou senha inválidos" });
  if (!user.password_hash) return res.status(401).json({ error: "Esta conta usa login com Google. Use \"Entrar com Google\"." });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Email ou senha inválidos" });
  const token = signToken({ userId: user.id });
  const profileRow = (await query("SELECT avatar_url FROM user_profiles WHERE user_id = $1", [user.id])).rows[0];
  return res.json({
    user: { id: user.id, email: user.email, full_name: user.full_name, avatar_url: profileRow?.avatar_url ?? null },
    token,
  });
});

app.post("/auth/google", async (req, res) => {
  const { id_token } = req.body || {};
  if (!id_token) return res.status(400).json({ error: "id_token é obrigatório" });
  const clientIds = getGoogleClientIds();
  if (clientIds.length === 0) return res.status(503).json({ error: "Login com Google não configurado" });
  const client = new OAuth2Client();
  let payload;
  try {
    const ticket = await client.verifyIdToken({ idToken: id_token, audience: clientIds });
    payload = ticket.getPayload();
  } catch (e) {
    return res.status(401).json({ error: "Token Google inválido ou expirado" });
  }
  const email = payload.email?.trim().toLowerCase();
  if (!email) return res.status(400).json({ error: "Email não disponível na conta Google" });
  const full_name = payload.name || payload.given_name || null;
  const avatar_url = payload.picture || null;

  const existing = await query(
    "SELECT id, full_name FROM users WHERE email = $1",
    [email]
  );
  let user;
  if (existing.rows[0]) {
    user = existing.rows[0];
    await query(
      "UPDATE users SET full_name = COALESCE($2, users.full_name), updated_at = now() WHERE id = $1",
      [user.id, full_name]
    );
    await query(
      `INSERT INTO user_profiles (user_id, display_name, avatar_url, locale, updated_at)
       VALUES ($1, $2, $3, 'pt-BR', now())
       ON CONFLICT (user_id) DO UPDATE SET
         display_name = COALESCE($2, user_profiles.display_name),
         avatar_url = COALESCE($3, user_profiles.avatar_url),
         updated_at = now()`,
      [user.id, full_name, avatar_url]
    );
  } else {
    const ins = await query(
      "INSERT INTO users (email, password_hash, full_name) VALUES ($1, NULL, $2) RETURNING id, email, full_name",
      [email, full_name]
    );
    user = ins.rows[0];
    await query(
      "INSERT INTO user_profiles (user_id, display_name, avatar_url, locale) VALUES ($1, $2, $3, 'pt-BR') ON CONFLICT (user_id) DO NOTHING",
      [user.id, full_name, avatar_url]
    );
    await query("INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING", [user.id]);
    await query("INSERT INTO user_streaks (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING", [user.id]);
  }
  const profileRow = (await query("SELECT avatar_url FROM user_profiles WHERE user_id = $1", [user.id])).rows[0];
  const token = signToken({ userId: user.id });
  return res.json({
    user: { id: user.id, email: user.email, full_name: user.full_name ?? full_name, avatar_url: profileRow?.avatar_url ?? avatar_url },
    token,
  });
});

// ----- Profile -----

app.get("/profile", requireAuth, async (req, res) => {
  const u = await query("SELECT full_name FROM users WHERE id = $1", [req.userId]);
  const p = await query("SELECT display_name, gender, birth_date, avatar_url FROM user_profiles WHERE user_id = $1", [req.userId]);
  const user = u.rows[0];
  const profile = p.rows[0];
  return res.json({
    full_name: user?.full_name ?? profile?.display_name ?? null,
    display_name: profile?.display_name ?? null,
    gender: profile?.gender ?? null,
    birth_date: profile?.birth_date ?? null,
    avatar_url: profile?.avatar_url ?? null,
  });
});

function normalizeBirthDate(input) {
  if (input === undefined || input === null) return null;
  const raw = String(input).trim();
  if (!raw) return null;

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  // DD/MM/YYYY or DD-MM-YYYY
  const m = raw.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (m) {
    const dd = m[1].padStart(2, "0");
    const mm = m[2].padStart(2, "0");
    const yyyy = m[3];
    return `${yyyy}-${mm}-${dd}`;
  }

  // Somente dígitos: YYYYMMDD (ano no começo) ou DDMMYYYY (ano no final)
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 8) {
    const a0 = digits.slice(0, 4);
    const maybeYear = Number(a0);
    if (maybeYear >= 1900 && maybeYear <= 2100) {
      // YYYYMMDD
      const yyyy = a0;
      const mm = digits.slice(4, 6);
      const dd = digits.slice(6, 8);
      return `${yyyy}-${mm}-${dd}`;
    }
    // DDMMYYYY
    const dd = digits.slice(0, 2);
    const mm = digits.slice(2, 4);
    const yyyy = digits.slice(4, 8);
    return `${yyyy}-${mm}-${dd}`;
  }

  return null;
}

app.patch("/profile", requireAuth, async (req, res) => {
  const { display_name, full_name, gender, birth_date } = req.body || {};
  const safeBirthDate = normalizeBirthDate(birth_date);
  try {
    if (full_name !== undefined) {
      await query("UPDATE users SET full_name = $2, updated_at = now() WHERE id = $1", [req.userId, full_name || null]);
    }
    await query(
      `INSERT INTO user_profiles (user_id, display_name, gender, birth_date, updated_at)
       VALUES ($1, $2, $3, $4::date, now())
       ON CONFLICT (user_id) DO UPDATE SET
         display_name = COALESCE($2, user_profiles.display_name),
         gender = COALESCE($3, user_profiles.gender),
         birth_date = COALESCE($4::date, user_profiles.birth_date),
         updated_at = now()`,
      [req.userId, display_name ?? full_name ?? null, gender || null, safeBirthDate]
    );
    return res.json({ ok: true });
  } catch (err) {
    return res.status(400).json({
      error: err instanceof Error ? err.message : "Falha ao atualizar perfil",
    });
  }
});

// ----- Settings -----

app.get("/settings", requireAuth, async (req, res) => {
  const r = await query(
    "SELECT theme, reminder_enabled, reminder_time, preferred_category_ids, expo_push_token FROM user_settings WHERE user_id = $1",
    [req.userId]
  );
  const row = r.rows[0];
  if (!row) {
    return res.json({ theme: "light", reminder_enabled: true, reminder_time: "07:00", preferred_category_slugs: [], language: "pt" });
  }
  const ids = row.preferred_category_ids || [];
  let preferred_category_slugs = [];
  if (ids.length > 0) {
    const cat = await query("SELECT slug FROM categories WHERE id = ANY($1)", [ids]);
    preferred_category_slugs = cat.rows.map((c) => c.slug);
  }

  const localeRow = await query("SELECT locale FROM user_profiles WHERE user_id = $1", [req.userId]);
  const locale = localeRow.rows[0]?.locale ?? "pt-BR";
  const language = String(locale).toLowerCase().startsWith("en") ? "en" : "pt";

  return res.json({
    theme: row.theme,
    reminder_enabled: row.reminder_enabled,
    reminder_time: row.reminder_time,
    preferred_category_slugs,
    expo_push_token: row.expo_push_token ?? null,
    language,
  });
});

app.patch("/settings", requireAuth, async (req, res) => {
  const { theme, reminder_enabled, reminder_time, preferred_category_slugs, expo_push_token, language } = req.body || {};
  let preferred_category_ids_param = null;
  if (preferred_category_slugs !== undefined && Array.isArray(preferred_category_slugs)) {
    const r = await query("SELECT id FROM categories WHERE slug = ANY($1)", [preferred_category_slugs]);
    preferred_category_ids_param = r.rows.map((x) => x.id);
  }
  const updates = [
    "theme = COALESCE($2, theme)",
    "reminder_enabled = COALESCE($3, reminder_enabled)",
    "reminder_time = COALESCE($4, reminder_time)",
    "preferred_category_ids = COALESCE($5, preferred_category_ids)",
    "updated_at = now()",
  ];
  const params = [req.userId, theme, reminder_enabled, reminder_time, preferred_category_ids_param];
  if (expo_push_token !== undefined) {
    updates.push("expo_push_token = $6");
    params.push(expo_push_token === "" || expo_push_token === null ? null : expo_push_token);
  }
  await query(
    `UPDATE user_settings SET ${updates.join(", ")} WHERE user_id = $1`,
    params
  );

  if (language !== undefined) {
    const lang = language === "en" ? "en" : "pt-BR";
    await query(
      `INSERT INTO user_profiles (user_id, locale, updated_at)
       VALUES ($1, $2, now())
       ON CONFLICT (user_id) DO UPDATE SET locale = COALESCE($2, user_profiles.locale), updated_at = now()`,
      [req.userId, lang]
    );
  }
  return res.json({ ok: true });
});

// ----- Check-in count -----

app.get("/checkin-count", requireAuth, async (req, res) => {
  const r = await query(
    "SELECT COUNT(*)::int AS count FROM user_reflections WHERE user_id = $1",
    [req.userId]
  );
  return res.json({ count: r.rows[0].count });
});

// ----- Reflections -----

function mapReflectionRows(rows, badgeMap, favSet = null, checkoutByDate = null) {
  return rows.map((row) => {
    const day = row.completed_at ? String(row.completed_at).slice(0, 10) : null;
    const checkout = day && checkoutByDate ? checkoutByDate.get(day) : null;
    return {
      id: row.id,
      date: row.completed_at,
      message: row.message,
      quote: row.quote,
      author: row.author,
      firstPrompt: row.first_prompt ?? null,
      answers: {
        identifique: row.answer_identifique ?? "",
        aceite: row.answer_aceite ?? "",
        aja: row.answer_aja ?? "",
      },
      checkinCount: row.checkin_count_at_time,
      badgeEarned: row.badge_earned_id ? badgeMap.get(row.badge_earned_id) || null : null,
      favorited: favSet ? favSet.has(row.id) : true,
      category: row.category_slug,
      virtue: row.virtue_slug,
      checkoutEmotion: checkout ? { slug: checkout.slug, label: checkout.label_pt } : null,
    };
  });
}

app.get("/reflections", requireAuth, async (req, res) => {
  const badges = await query("SELECT id, slug, name_pt, description_pt, required_checkins, icon FROM badges");
  const badgeMap = new Map(badges.rows.map((b) => [b.id, { id: b.slug, name: b.name_pt, description: b.description_pt || "", requiredCheckins: b.required_checkins, icon: b.icon }]));
  const fav = await query("SELECT user_reflection_id FROM user_reflection_favorites WHERE user_id = $1", [req.userId]);
  const favSet = new Set(fav.rows.map((x) => x.user_reflection_id));
  const checkouts = await query(
    `SELECT ec.checked_at, e.slug, e.label_pt
     FROM emotional_checkouts ec
     JOIN emotions e ON e.id = ec.emotion_id
     WHERE ec.user_id = $1
     ORDER BY ec.checked_at DESC`,
    [req.userId]
  );
  const checkoutByDate = new Map();
  for (const c of checkouts.rows) {
    const d = c.checked_at ? String(c.checked_at).slice(0, 10) : null;
    if (d && !checkoutByDate.has(d)) checkoutByDate.set(d, { slug: c.slug, label_pt: c.label_pt });
  }
  let r;
  try {
    r = await query(
      `SELECT ur.id, ur.completed_at, ur.message, ur.quote, ur.author,
        ur.answer_identifique, ur.answer_aceite, ur.answer_aja, ur.first_prompt,
        ur.checkin_count_at_time, ur.category_slug, ur.virtue_slug, ur.badge_earned_id
       FROM user_reflections ur WHERE ur.user_id = $1 ORDER BY ur.completed_at DESC`,
      [req.userId]
    );
  } catch (err) {
    if (err.code === "42703") {
      r = await query(
        `SELECT ur.id, ur.completed_at, ur.message, ur.quote, ur.author,
          ur.answer_identifique, ur.answer_aceite, ur.answer_aja,
          ur.checkin_count_at_time, ur.category_slug, ur.virtue_slug, ur.badge_earned_id
         FROM user_reflections ur WHERE ur.user_id = $1 ORDER BY ur.completed_at DESC`,
        [req.userId]
      );
      r.rows.forEach((row) => { row.first_prompt = null; });
    } else throw err;
  }
  const list = mapReflectionRows(r.rows, badgeMap, favSet, checkoutByDate);
  return res.json(list);
});

app.post("/reflections", requireAuth, async (req, res) => {
  const { message, quote, author, answers, first_prompt, category_slug, virtue_slug } = req.body || {};
  if (!message || !quote || !author || !answers?.identifique?.trim() || !answers?.aceite?.trim() || !answers?.aja?.trim()) {
    return res.status(400).json({ error: "message, quote, author e as três respostas da jornada são obrigatórios" });
  }
  const today = new Date().toISOString().slice(0, 10);
  const existing = await query(
    "SELECT id, checkin_count_at_time, badge_earned_id FROM user_reflections WHERE user_id = $1 AND completed_at::date = $2::date AND answer_identifique IS NOT NULL LIMIT 1",
    [req.userId, today]
  );
  if (existing.rows[0]) {
    const row = existing.rows[0];
    let badge = null;
    if (row.badge_earned_id) {
      const badgeR = await query(
        "SELECT id, slug, name_pt, description_pt, required_checkins, icon FROM badges WHERE id = $1",
        [row.badge_earned_id]
      );
      badge = badgeR.rows[0] || null;
    }
    return res.status(201).json({
      id: row.id,
      checkinCount: row.checkin_count_at_time,
      badgeEarned: badge ? { id: badge.slug, name: badge.name_pt, description: badge.description_pt || "", requiredCheckins: badge.required_checkins, icon: badge.icon } : null,
    });
  }
  const countR = await query("SELECT COUNT(*)::int AS c FROM user_reflections WHERE user_id = $1 AND answer_identifique IS NOT NULL", [req.userId]);
  const newCount = countR.rows[0].c + 1;
  const badgeR = await query(
    "SELECT id, slug, name_pt, description_pt, required_checkins, icon FROM badges WHERE required_checkins <= $1 ORDER BY required_checkins DESC LIMIT 1",
    [newCount]
  );
  const badge = badgeR.rows[0] || null;
  const r = await query(
    `INSERT INTO user_reflections (user_id, message, quote, author, answer_identifique, answer_aceite, answer_aja, first_prompt, checkin_count_at_time, category_slug, virtue_slug, badge_earned_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING id, checkin_count_at_time, badge_earned_id`,
    [req.userId, message, quote, author, answers.identifique, answers.aceite, answers.aja, first_prompt || null, newCount, category_slug || null, virtue_slug || null, badge?.id || null]
  );
  const row = r.rows[0];
  if (badge) {
    await query(
      "INSERT INTO user_badges (user_id, badge_id, user_reflection_id) VALUES ($1, $2, $3) ON CONFLICT (user_id, badge_id) DO UPDATE SET user_reflection_id = $3",
      [req.userId, badge.id, row.id]
    );
  }
  return res.status(201).json({
    id: row.id,
    checkinCount: row.checkin_count_at_time,
    badgeEarned: badge ? { id: badge.slug, name: badge.name_pt, description: badge.description_pt || "", requiredCheckins: badge.required_checkins, icon: badge.icon } : null,
  });
});

app.post("/reflections/:id/favorite", requireAuth, async (req, res) => {
  const id = req.params.id;
  const exists = await query(
    "SELECT 1 FROM user_reflection_favorites WHERE user_id = $1 AND user_reflection_id = $2",
    [req.userId, id]
  );
  if (exists.rows.length) {
    await query("DELETE FROM user_reflection_favorites WHERE user_id = $1 AND user_reflection_id = $2", [req.userId, id]);
    return res.json({ favorited: false });
  }
  await query("INSERT INTO user_reflection_favorites (user_id, user_reflection_id) VALUES ($1, $2)", [req.userId, id]);
  return res.json({ favorited: true });
});

app.get("/favorites", requireAuth, async (req, res) => {
  const badges = await query("SELECT id, slug, name_pt, description_pt, required_checkins, icon FROM badges");
  const badgeMap = new Map(badges.rows.map((b) => [b.id, { id: b.slug, name: b.name_pt, description: b.description_pt || "", requiredCheckins: b.required_checkins, icon: b.icon }]));
  const checkouts = await query(
    `SELECT ec.checked_at, e.slug, e.label_pt
     FROM emotional_checkouts ec
     JOIN emotions e ON e.id = ec.emotion_id
     WHERE ec.user_id = $1
     ORDER BY ec.checked_at DESC`,
    [req.userId]
  );
  const checkoutByDate = new Map();
  for (const c of checkouts.rows) {
    const d = c.checked_at ? String(c.checked_at).slice(0, 10) : null;
    if (d && !checkoutByDate.has(d)) checkoutByDate.set(d, { slug: c.slug, label_pt: c.label_pt });
  }
  let r;
  try {
    r = await query(
      `SELECT ur.id, ur.completed_at, ur.message, ur.quote, ur.author, ur.first_prompt,
        ur.answer_identifique, ur.answer_aceite, ur.answer_aja,
        ur.checkin_count_at_time, ur.category_slug, ur.virtue_slug, ur.badge_earned_id
       FROM user_reflections ur
       JOIN user_reflection_favorites f ON f.user_reflection_id = ur.id AND f.user_id = ur.user_id
       WHERE ur.user_id = $1 ORDER BY ur.completed_at DESC`,
      [req.userId]
    );
  } catch (err) {
    if (err.code === "42703") {
      r = await query(
        `SELECT ur.id, ur.completed_at, ur.message, ur.quote, ur.author,
          ur.answer_identifique, ur.answer_aceite, ur.answer_aja,
          ur.checkin_count_at_time, ur.category_slug, ur.virtue_slug, ur.badge_earned_id
         FROM user_reflections ur
         JOIN user_reflection_favorites f ON f.user_reflection_id = ur.id AND f.user_id = ur.user_id
         WHERE ur.user_id = $1 ORDER BY ur.completed_at DESC`,
        [req.userId]
      );
      r.rows.forEach((row) => { row.first_prompt = null; });
    } else throw err;
  }
  const favSet = new Set(r.rows.map((row) => row.id));
  const list = mapReflectionRows(r.rows, badgeMap, favSet, checkoutByDate);
  return res.json(list);
});

// ----- Emotional check-in / check-out -----

/** Check-in emocional: um por dia. Retorna o de hoje se existir. Aceita ?date=YYYY-MM-DD (data local do app). */
app.get("/emotional-checkin/today", requireAuth, async (req, res) => {
  const today = req.query.date && /^\d{4}-\d{2}-\d{2}$/.test(String(req.query.date))
    ? String(req.query.date)
    : new Date().toISOString().slice(0, 10);
  const r = await query(
    `SELECT e.slug, e.label_pt
     FROM emotional_checkins ec
     JOIN emotions e ON e.id = ec.emotion_id
     WHERE ec.user_id = $1 AND (ec.client_date = $2::date OR (ec.client_date IS NULL AND ec.checked_at::date = $2::date))
     ORDER BY ec.checked_at DESC LIMIT 1`,
    [req.userId, today]
  );
  if (!r.rows[0]) return res.status(204).end();
  return res.json({ emotion_slug: r.rows[0].slug, label: r.rows[0].label_pt });
});

app.post("/emotional-checkin", requireAuth, async (req, res) => {
  const { emotion_slug, date: bodyDate } = req.body || {};
  if (!emotion_slug) return res.status(400).json({ error: "emotion_slug obrigatório" });
  const em = await query("SELECT id FROM emotions WHERE slug = $1 AND type = 'initial'", [emotion_slug]);
  if (!em.rows[0]) return res.status(400).json({ error: "Emoção não encontrada" });
  const today = bodyDate && /^\d{4}-\d{2}-\d{2}$/.test(String(bodyDate))
    ? String(bodyDate)
    : new Date().toISOString().slice(0, 10);
  const existing = await query(
    `SELECT 1 FROM emotional_checkins WHERE user_id = $1 AND (client_date = $2::date OR (client_date IS NULL AND checked_at::date = $2::date)) LIMIT 1`,
    [req.userId, today]
  );
  if (existing.rows[0]) return res.status(200).json({ ok: true, already_today: true });
  await query(
    "INSERT INTO emotional_checkins (user_id, emotion_id, client_date) VALUES ($1, $2, $3::date)",
    [req.userId, em.rows[0].id, today]
  );
  return res.status(201).json({ ok: true });
});

app.post("/emotional-checkout", requireAuth, async (req, res) => {
  const { emotion_slug } = req.body || {};
  if (!emotion_slug) return res.status(400).json({ error: "emotion_slug obrigatório" });
  const em = await query("SELECT id FROM emotions WHERE slug = $1 AND type = 'final'", [emotion_slug]);
  if (!em.rows[0]) return res.status(400).json({ error: "Emoção não encontrada" });
  await query("INSERT INTO emotional_checkouts (user_id, emotion_id) VALUES ($1, $2)", [req.userId, em.rows[0].id]);
  return res.status(201).json({ ok: true });
});

// ----- Health -----

app.get("/health", (req, res) => res.json({ ok: true }));

// ----- Push notifications (lembrete diário) -----

const DAILY_REFLECTION_MESSAGES_PT = [
  "Você não precisa controlar o dia inteiro. Apenas controle a próxima decisão.",
  "A adversidade não é sua inimiga. Sua reação é o que define o caminho.",
  "Seus pensamentos moldam sua realidade. Escolha-os com cuidado.",
  "A disciplina começa com clareza sobre quem você quer ser.",
  "Viva de acordo com seus princípios, não com as expectativas dos outros.",
  "Os relacionamentos florescem quando paramos de tentar mudar o outro.",
  "Os obstáculos não estão bloqueando seu caminho. Eles são o caminho.",
  "Reserve um momento para pensar antes de agir. A clareza precede a ação.",
];

const DAILY_REFLECTION_MESSAGES_EN = [
  "You don’t need to control the whole day. Just control your next decision.",
  "Adversity is not your enemy. Your reaction defines the path.",
  "Your thoughts shape your reality. Choose them carefully.",
  "Discipline begins with clarity about who you want to be.",
  "Live by your principles, not other people’s expectations.",
  "Relationships thrive when we stop trying to change the other person.",
  "Obstacles aren’t blocking your path. They are the path.",
  "Take a moment to think before acting. Clarity comes before action.",
];

function getDailyReflectionMessage(lang) {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const arr = lang === "en" ? DAILY_REFLECTION_MESSAGES_EN : DAILY_REFLECTION_MESSAGES_PT;
  return arr[dayOfYear % arr.length];
}

async function sendExpoPush(to, title, body) {
  const payload = {
    to,
    title,
    body,
    sound: "default",
    priority: "high",
    channelId: "daily_reminder",
  };
  const res = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Expo push failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  if (data.data?.status === "error") {
    throw new Error(data.data.message || "Expo push error");
  }
  return data;
}

async function runReminderPushJob(ignoreTime = false) {
  try {
    let r;
    if (ignoreTime) {
      r = await query(
        `SELECT us.user_id, us.expo_push_token, us.reminder_time, up.locale
         FROM user_settings us
         LEFT JOIN user_profiles up ON up.user_id = us.user_id
         WHERE us.reminder_enabled = true AND us.expo_push_token IS NOT NULL AND us.expo_push_token != ''`
      );
    } else {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      r = await query(
        `SELECT us.user_id, us.expo_push_token, up.locale
         FROM user_settings us
         LEFT JOIN user_profiles up ON up.user_id = us.user_id
         WHERE us.reminder_enabled = true AND us.reminder_time = $1 AND us.expo_push_token IS NOT NULL AND us.expo_push_token != ''`,
        [timeStr]
      );
    }

    if (r.rows.length === 0) return { sent: 0 };

    let sent = 0;
    for (const row of r.rows) {
      const locale = row.locale || "pt-BR";
      const lang = String(locale).toLowerCase().startsWith("en") ? "en" : "pt";
      const title = lang === "en" ? "It’s time to reflect with InSelf!" : "Chegou a hora de refletir com o InSelf!";
      const body = getDailyReflectionMessage(lang);
      try {
        await sendExpoPush(row.expo_push_token, title, body);
        sent++;
      } catch (err) {
        console.error(`Push failed for user ${row.user_id}:`, err.message);
      }
    }
    return { sent };
  } catch (err) {
    if (err.code !== "42703") console.error("Reminder push job error:", err);
    return { sent: 0, error: err.message };
  }
}

// Diagnóstico: por que sent=0? (reminder_enabled, token preenchido, etc.)
app.get("/reminder-push-debug", async (_req, res) => {
  try {
    const [withReminder, withToken, eligible] = await Promise.all([
      query("SELECT COUNT(*)::int AS c FROM user_settings WHERE reminder_enabled = true"),
      query("SELECT COUNT(*)::int AS c FROM user_settings WHERE expo_push_token IS NOT NULL AND expo_push_token != ''"),
      query(
        "SELECT COUNT(*)::int AS c FROM user_settings WHERE reminder_enabled = true AND expo_push_token IS NOT NULL AND expo_push_token != ''"
      ),
    ]);
    return res.json({
      users_with_reminder_enabled: withReminder.rows[0].c,
      users_with_expo_push_token: withToken.rows[0].c,
      users_eligible_for_push: eligible.rows[0].c,
      hint: eligible.rows[0].c === 0 && withToken.rows[0].c === 0
        ? "Nenhum token salvo. Abra o app logado, ative o lembrete e confira se o projectId está em app.json (extra.eas.projectId)."
        : eligible.rows[0].c === 0 && withReminder.rows[0].c > 0
          ? "Lembrete ativo mas nenhum token: o app precisa enviar o token (permissão + projectId)."
          : null,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Disparo manual do job (para teste): envia push para todos com lembrete ativo + token, sem checar horário
app.get("/trigger-reminder-push", async (_req, res) => {
  const result = await runReminderPushJob(true);
  return res.json({ ok: true, ...result });
});

setInterval(() => runReminderPushJob(false), 60 * 1000);
runReminderPushJob(false);

// ----- Error handler -----

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Erro interno" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`InSelf API rodando em http://localhost:${PORT}`);
});
