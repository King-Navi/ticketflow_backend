import dotenv from 'dotenv';
dotenv.config()
import jwt from "jsonwebtoken";
import { toRoleCode, ROLE_CODE } from "../model_db/utils/role.js";

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

function attachUser(req, res, payload) {
  const { sub, id, email, nickname, first_name, typeUser, iat, exp } = payload || {};
  req.user = { sub, id, email, nickname, first_name, typeUser, iat, exp };
  res.locals.user = req.user;
}


/**
 * Authentication middleware for protected routes.
 *
 * This middleware enforces **JWT-based authentication** for incoming requests.
 * It extracts a Bearer token from:
 *   - the `Authorization` header (preferred),
 *   - cookies (names: `"token"` or `"access_token"`),
 *   - or (optionally) a query string parameter (`access_token`).
 *
 * Once a valid token is found, it:
 *   - verifies the JWT using `process.env.JWT_SECRET`,
 *   - decodes its payload,
 *   - attaches a normalized user object to `req.user` and `res.locals.user`,
 *     preserving claims such as:
 *       - `sub` → Credential ID
 *       - `id`  → Profile ID (attendee/organizer/admin)
 *       - `email`, `nickname`, `first_name`, `typeUser`, `iat`, `exp`
 *
 * You can also optionally restrict access to specific roles (numeric or string),
 * using the `roles` array in the `options` parameter.
 *
 * ---
 * @function authRequired
 * @param {Object} [options={}] Optional configuration.
 * @param {string[]} [options.algorithms=["HS256"]] - Allowed JWT signing algorithms.
 * @param {number} [options.clockTolerance=5] - Allowed clock skew (in seconds).
 * @param {Array<string|number>} [options.roles=null] - Allowed roles; e.g. `["admin"]` or `[3]`.
 * @param {boolean} [options.allowQueryToken=false] - If true, accepts `access_token` in query string.
 *
 * @returns {import("express").RequestHandler}
 *   Express middleware that authenticates the request.
 *
 * @throws {Error} If `JWT_SECRET` is not defined in environment variables.
 *
 * @example
 * // Protect a route with JWT auth only
 * router.get("/private", authRequired(), privateController);
 *
 * @example
 * // Protect a route and restrict to specific roles
 * router.put("/admin", authRequired({ roles: [ROLE_CODE.ADMIN] }), adminController);
 *
 * @example
 * // Allow query tokens for testing purposes
 * router.get("/test", authRequired({ allowQueryToken: true }), testController);
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
  const allowedCodes = new Set(
    allowed.map(v => typeof v === "number" ? v : toRoleCode(v))
  );
  return function (req, res, next) {
    if (!req.user?.typeUser) {
      return res.status(401).json({ code: "UNAUTHORIZED", message: "Authentication required." });
    }
    const codeFromUser =
      typeof req.user.typeUser === "number"
        ? req.user.typeUser
        : toRoleCode(req.user.typeUser ?? req.user.role ?? req.user.roleName);
    if (!allowedCodes.has(codeFromUser)) {
      return res.status(403).json({ code: "FORBIDDEN", message: "Insufficient role." });
    }
    next();
  };
}
