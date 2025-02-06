import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  role: string;
  _active: boolean;
  [key: string]: any;
}

const auth = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      res.status(401).json({ message: 'Please login to continue' });
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

      // Role check
      if (!allowedRoles.includes(decoded.role)) {
        res.status(403).json({ message: 'Access denied' });
        return;
      }

      // Active status check
      if (!decoded._active==false) {
        res.status(403).json({ message: 'Account is inactive' });
        return;
      }

      next();
      
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({ 
          message: 'Token expired',
          tokenExpired: true 
        });
        return;
      }
      
      res.status(401).json({ message: 'Invalid token' });
    }
  };
};

// Create middleware for each role
export const userAuth = auth(['patient']);
export const doctorAuth = auth(['doctor']);
export const adminAuth = auth(['admin']);