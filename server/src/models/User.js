/**
 * User Model
 * Defines user schema with authentication fields
 * Uses bcryptjs for password hashing
 */

import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import logger from '../utils/logger.js';

const SUPPORTED_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'NGN',
  'CAD',
  'AUD',
  'INR',
  'JPY',
];

// Define user schema
const userSchema = new mongoose.Schema(
  {
    // User's full name
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },

    // User's email address (unique)
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },

    // User's password (hashed, never returned in queries by default)
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't return password by default in queries
    },

    preferredCurrency: {
      type: String,
      enum: {
        values: SUPPORTED_CURRENCIES,
        message: 'Unsupported currency',
      },
      default: 'USD',
    },

    alertPreferences: {
      emailEnabled: {
        type: Boolean,
        default: false,
      },
      dailyThresholdPercent: {
        type: Number,
        min: 50,
        max: 100,
        default: 85,
      },
      budgetThresholdPercent: {
        type: Number,
        min: 50,
        max: 100,
        default: 80,
      },
    },

    refreshTokenHash: {
      type: String,
      select: false,
    },

    refreshTokenExpiresAt: {
      type: Date,
      select: false,
    },

    // Account creation timestamp
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },

    // Last updated timestamp
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Middleware: Hash password before saving
userSchema.pre('save', async function () {
  // Only hash if password is modified
  if (!this.isModified('password')) return;

  // Generate salt
  const salt = await bcryptjs.genSalt(10);

  // Hash password
  this.password = await bcryptjs.hash(this.password, salt);

  logger.debug('Password hashed successfully for user', {
    email: this.email,
  });
});

// Method: Compare provided password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcryptjs.compare(enteredPassword, this.password);
};

// Method: Return user data without password
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Create and export User model
const User = mongoose.model('User', userSchema);
export default User;
