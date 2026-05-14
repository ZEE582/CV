/**
 * @fileoverview requireAuth Middleware
 * @description JWT authentication middleware.
 *              Validates the Bearer token in the Authorization header and
 *              attaches the decoded payload to `req.user` for downstream handlers.
 *
 * Usage:
 *   import requireAuth from "../middleware/requireAuth.ts";
 *   router.get("/protected", requireAuth, handler);
 *
 * Token payload shape (set in authroutes.ts / verify-code):
 *   { id: string, role: "student" | "admin", iat: number, exp: number }
 *
 * @module middleware/requireAuth
 */

import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

/**
 * Express middleware that enforces JWT authentication.
 *
 * Expects the request to include an Authorization header in the format:
 *   Authorization: Bearer <jwt_token>
 *
 * On success: attaches `decoded` payload to `req.user` and calls `next()`.
 * On failure: responds with 401 and a descriptive error message.
 *
 * @param {Request}  req  - Express request object
 * @param {Response} res  - Express response object
 * @param {NextFunction} next - Express next middleware function
 */
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  // Header must be present and follow the "Bearer <token>" format
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "غير مصرح — يرجى تسجيل الدخول" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // jwt.verify throws if the token is expired, malformed, or has a bad signature
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

    // Attach decoded payload so route handlers can access req.user.id / req.user.role
    (req as any).user = decoded;

    next();
  } catch (error: any) {
    // Distinguish expired tokens from other invalid tokens for better UX
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً" });
    }

    return res.status(401).json({ message: "توكن غير صحيح" });
  }
};

export default requireAuth;