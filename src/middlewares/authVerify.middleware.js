import jwt from "jsonwebtoken";

/**
 * Extract Bearer token from Authorization header, cookie, or (optionally) query string.
 */
function extractToken(req, { cookieNames = ["token", "access_token"], allowQueryToken = false } = {}) {
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (typeof authHeader === "string") {
    const parts = authHeader.trim().split(/\s+/);
    if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
      return parts[1];
    }
  }

  if (req.cookies && cookieNames.length) {
    for (const name of cookieNames) {
      if (req.cookies[name]) return req.cookies[name];
    }
  }

  if (allowQueryToken && req.query?.access_token) {
    return String(req.query.access_token);
  }

  return null;
}

/**
 * Attach a normalized user object to req.user and res.locals.user.
 * The shape mirrors your generateToken payload.
 */
function attachUser(req, res, payload) {
  const { id, email, nickname, username, typeUser, iat, exp } = payload || {};
  req.user = { id, email, nickname, username, typeUser, iat, exp };
  res.locals.user = req.user;
}

/**
 * Required authentication middleware.
 * - Verifies JWT using process.env.JWT_SECRET
 * - Injects payload into req.user
 * - Optionally enforces allowed roles
 */
export function authRequired(options = {}) {
  const {
    algorithms = ["HS256"],
    clockTolerance = 5,
    roles = null,
    allowQueryToken = false,
  } = options;

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set.");
  }

  return function (req, res, next) {
    try {
      const token = extractToken(req, { allowQueryToken });
      if (!token) {
        return res.status(401).json({ code: "UNAUTHORIZED", message: "Missing Bearer token." });
      }

      const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms, clockTolerance });
      attachUser(req, res, payload);

      if (Array.isArray(roles) && roles.length > 0) {
        if (!req.user?.typeUser || !roles.includes(req.user.typeUser)) {
          return res.status(403).json({ code: "FORBIDDEN", message: "Insufficient role." });
        }
      }

      return next();
    } catch (err) {
      return res.status(401).json({ code: "UNAUTHORIZED", message: "Invalid or expired token." });
    }
  };
}

/**
 * Optional authentication middleware.
 * - If a valid token is present, injects req.user
 * - If no token or invalid, continues without failing the request
 */
export function authOptional(options = {}) {
  const {
    algorithms = ["HS256"],
    clockTolerance = 5,
    allowQueryToken = false,
  } = options;

  return function (req, res, next) {
    const token = extractToken(req, { allowQueryToken });
    if (!token) return next();

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms, clockTolerance });
      attachUser(req, res, payload);
    } catch {
    }
    return next();
  };
}

/**
 * Role guard — use after authRequired/authOptional.
 * Example: router.get('/admin', authRequired(), requireRole('admin'), controller)
 */
export function requireRole(...allowed) {
  return function (req, res, next) {
    if (!req.user?.typeUser) {
      return res.status(401).json({ code: "UNAUTHORIZED", message: "Authentication required." });
    }
    if (!allowed.includes(req.user.typeUser)) {
      return res.status(403).json({ code: "FORBIDDEN", message: "Insufficient role." });
    }
    next();
  };
}
