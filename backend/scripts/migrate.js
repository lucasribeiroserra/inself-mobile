import "dotenv/config";
import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(__dirname, "../../database/migrations");

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://inself:inself@localhost:5432/inself",
});

async function run() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name text PRIMARY KEY,
        run_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql") && !f.startsWith("000_"))
      .sort();
    for (const file of files) {
      const name = path.basename(file, ".sql");
      const { rows: done } = await client.query("SELECT 1 FROM _migrations WHERE name = $1", [name]);
      if (done.length > 0) {
        console.log("Skip (already run):", file);
        continue;
      }
      if (name === "001_standalone_postgres") {
        const { rows: u } = await client.query(
          "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users'"
        );
        if (u.length > 0) {
          console.log("Skip 001 (tables already exist):", file);
          await client.query("INSERT INTO _migrations (name) VALUES ($1)", [name]);
          continue;
        }
      }
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      await client.query(sql);
      await client.query("INSERT INTO _migrations (name) VALUES ($1)", [name]);
      console.log("Ran:", file);
    }
    console.log("Migrations done.");
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error(err);
  if (err.code === "42501") {
    console.error("\nDica: rode as migrations com o usuário DONO do banco (ex.: postgres).");
    console.error("Exemplo: DATABASE_URL=postgresql://postgres:senha@localhost:5432/inself npm run migrate");
  }
  process.exit(1);
});
