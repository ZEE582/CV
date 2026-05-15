/**
 * @fileoverview authentication Middleware
 * @description JWT authentication middleware.
 *              Validates JWT tokens and protects private routes.
 */

import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

const authentication = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  // Check Authorization header
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  try {
    // Extract token
    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    );

    // Attach user payload
    (req as any).user = decoded;

    next();
  } catch (error: any) {
    // Expired token
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Session expired. Please login again.",
      });
    }

    // Invalid token
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

export default authentication;