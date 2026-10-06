import { User } from "../models/User.js";
import { verifyToken } from "../utils/jwt.js";

export async function protect(req, res, next) {
  try {
    let token = null;

    const auth = req.headers.authorization;
    if (auth?.startsWith("Bearer ")) token = auth.substring(7);

    if (!token && req.cookies?.hrd_token) token = req.cookies.hrd_token;

    if (!token) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select("-password");

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: "Invalid or inactive account." });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token." });
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }
    next();
  };
}
