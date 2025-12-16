import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import authRoutes from './interfaces/http/routes/auth.routes';
import { config } from './config/env.config';

const app = express();

// Middlewares
app.use(helmet());
app.use(cors({
    origin: true, // Allow all for boilerplate. In prod, strict whitelist.
    credentials: true,
}));
app.use(cookieParser());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);

// Error Middleware
import { errorHandler } from './interfaces/http/middlewares/error.middleware';
app.use(errorHandler);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Start Server
if (require.main === module) {
    app.listen(config.PORT, () => {
        console.log(`Server running on port ${config.PORT}`);
    });
}

export default app;
