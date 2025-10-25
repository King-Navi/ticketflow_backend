import verifyJwtToken from '../utils/jwt.js'

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyJwtToken(token);

    if (!decoded) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    req.user = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
    };
    if (process.env.ENVIROMENT == "development") {
      console.debug(`[DEBUG] decode for ${JSON.stringify(decoded, null, 1)}`);
    }
    next();
  } catch (err) {
    console.error("[verifyToken] Token verification error:", err.message);
    return res.status(403).json({ message: "Invalid token" });
  }
};

export default verifyToken;
