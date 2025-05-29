import { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        role: string;
        [key: string]: any;
      };
    }
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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

export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role; // Assuming user role is attached to the request

    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  };
};
