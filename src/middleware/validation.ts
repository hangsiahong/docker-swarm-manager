import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const validateServiceCreation = [
    body('name').isString().notEmpty().withMessage('Service name is required'),
    body('image').isString().notEmpty().withMessage('Image is required'),
    body('replicas').isInt({ min: 1 }).withMessage('Replicas must be a positive integer'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

export const validateStackCreation = [
    body('name').isString().notEmpty().withMessage('Stack name is required'),
    body('services').isArray().withMessage('Services must be an array'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

export const validateSwarmInitialization = [
    body('advertiseAddr').isString().notEmpty().withMessage('Advertise address is required'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];