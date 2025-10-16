import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { ValidationError } from '../types';

/**
 * Middleware to handle validation errors from express-validator
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    // Check for errors
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error) => ({
        field: error.type === 'field' ? error.path : undefined,
        message: error.msg,
      }));

      next(new ValidationError('Validation failed', errorMessages));
      return;
    }

    next();
  };
};

