/**
 * Database Configuration
 * MongoDB connection and initialization
 */

import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const connectDatabase = async () => {
  try {
    const mongoUri =
      process.env.NODE_ENV === 'production'
        ? process.env.MONGODB_URI_PROD
        : process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error('MongoDB URI is not configured');
    }

    logger.info('Connecting to MongoDB...');

    await mongoose.connect(mongoUri);

    logger.info('✅ MongoDB connected successfully', {
      host: mongoose.connection.host,
    });

    // Handle connection events
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', err);
    });

    return mongoose.connection;
  } catch (error) {
    logger.error('❌ Failed to connect to MongoDB', error);
    process.exit(1);
  }
};

export default connectDatabase;
