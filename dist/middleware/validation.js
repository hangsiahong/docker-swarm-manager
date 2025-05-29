"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSwarmInitialization = exports.validateStackCreation = exports.validateServiceCreation = void 0;
const express_validator_1 = require("express-validator");
exports.validateServiceCreation = [
    (0, express_validator_1.body)('name').isString().notEmpty().withMessage('Service name is required'),
    (0, express_validator_1.body)('image').isString().notEmpty().withMessage('Image is required'),
    (0, express_validator_1.body)('replicas').isInt({ min: 1 }).withMessage('Replicas must be a positive integer'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];
exports.validateStackCreation = [
    (0, express_validator_1.body)('name').isString().notEmpty().withMessage('Stack name is required'),
    (0, express_validator_1.body)('services').isArray().withMessage('Services must be an array'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];
exports.validateSwarmInitialization = [
    (0, express_validator_1.body)('advertiseAddr').isString().notEmpty().withMessage('Advertise address is required'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];
