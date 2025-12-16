import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err);

    if (err instanceof ZodError) {
        res.status(400).json({ error: 'Validation Error', details: err.errors });
        return;
    }

    if (err.message === 'Unauthorized' || err.message === 'Invalid token') {
        res.status(401).json({ error: err.message });
        return
    }

    if (err.message === 'Refresh token expired' || err.message === 'Invalid refresh token') {
        res.status(403).json({ error: err.message });
        return;
    }

    if (err.message === 'User already exists') {
        res.status(409).json({ error: err.message });
        return;
    }

    res.status(500).json({ error: 'Internal Server Error', message: err.message });
};
