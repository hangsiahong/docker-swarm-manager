"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = void 0;
const authenticate = (req, res, next) => {
    const token = req.headers["authorization"];
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    // Here you would typically verify the token and extract user information
    // For example, using a library like jsonwebtoken
    // jwt.verify(token, secretKey, (err, decoded) => {
    //     if (err) {
    //         return res.status(403).json({ message: 'Forbidden' });
    //     }
    //     req.user = decoded; // Attach user information to the request
    //     next();
    // });
    // Placeholder for token verification logic
    next();
};
exports.authenticate = authenticate;
const authorize = (roles) => {
    return (req, res, next) => {
        var _a;
        const userRole = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role; // Assuming user role is attached to the request
        if (!userRole || !roles.includes(userRole)) {
            return res.status(403).json({ message: "Forbidden" });
        }
        next();
    };
};
exports.authorize = authorize;
