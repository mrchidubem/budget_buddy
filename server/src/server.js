/**
 * Server Entry Point
 * Initializes Express application, connects to MongoDB,
 * and starts the server with all middleware and routes.
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';

import logger from './utils/logger.js';
import connectDatabase from './config/database.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import recurringTransactionRoutes from './routes/recurringTransactionRoutes.js';
import goalRoutes from './routes/goalRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import alertRoutes from './routes/alertRoutes.js';

dotenv.config();

const app = express();

// Security & Logging
app.use(helmet());
app.use(morgan('combined'));

// CORS configuration
const defaultCorsOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

const normalizeOrigin = (value = '') => value.trim().replace(/\/+$/, '').toLowerCase();

const envCorsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
  : [];

const allowedOriginSet = new Set(
  [...defaultCorsOrigins, ...envCorsOrigins].map((origin) => normalizeOrigin(origin))
);

const localhostPattern = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    const normalizedRequestOrigin = normalizeOrigin(origin);
    if (
      allowedOriginSet.has(normalizedRequestOrigin) ||
      localhostPattern.test(normalizedRequestOrigin)
    ) {
      callback(null, true);
      return;
    }

    logger.warn('CORS blocked request origin', { origin });
    callback(null, false);
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

/**
 * Root route for frontend or health check
 */
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Budget Buddy API is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Health check route (for monitoring)
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/recurring-transactions', recurringTransactionRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/alerts', alertRoutes);

// 404 & error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await connectDatabase();

    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      logger.info('Server started successfully', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        apiUrl: `http://localhost:${PORT}`,
      });
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT signal received: closing HTTP server');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

startServer();

export default app;