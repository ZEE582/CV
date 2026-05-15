/**
 * @fileoverview authorization Middleware
 * @description Role-based authorization middleware.
 *              Restricts access to protected routes
 *              depending on the user's role.
 */

import type { Request, Response, NextFunction } from "express";

const authorization = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {

    // Access authenticated user from req.user
    const user = (req as any).user;

    /**
     * Check:
     * - user exists
     * - user role is included in allowed roles
     */
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    // User has permission → continue
    next();
  };
};

export default authorization;