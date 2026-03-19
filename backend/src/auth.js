import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/** Middleware: req.headers.authorization = "Bearer <token>" -> req.userId */
export function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  const payload = token ? verifyToken(token) : null;
  if (!payload?.userId) {
    return res.status(401).json({ error: "Não autorizado" });
  }
  req.userId = payload.userId;
  next();
}
