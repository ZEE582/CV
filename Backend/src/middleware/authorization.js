/**
 * @fileoverview authorization Middleware
 * @description Role-based authorization middleware.
 *              Restricts access to protected routes
 *              depending on the user's role.
 */
const authorization = (...roles) => {
    return (req, res, next) => {
        // Access authenticated user from req.user
        const user = req.user;
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
