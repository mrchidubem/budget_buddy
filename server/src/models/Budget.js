/**
 * Budget Model
 * Defines budget schema with category and spending limits
 * Automatically updates spent amount through transactions
 */

import mongoose from 'mongoose';

// Define budget schema
const budgetSchema = new mongoose.Schema(
  {
    // Budget category name (must be from predefined list)
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: [
          'Food',
          'Transportation',
          'Entertainment',
          'Shopping',
          'Utilities',
          'Health',
          'Education',
          'Other',
        ],
        message: 'Invalid budget category',
      },
    },

    // Monthly budget limit amount
    limit: {
      type: Number,
      required: [true, 'Budget limit is required'],
      min: [0, 'Budget limit must be a positive number'],
      validate: {
        validator: function (value) {
          return value > 0;
        },
        message: 'Budget limit must be greater than 0',
      },
    },

    // Current amount spent (calculated from transactions)
    spent: {
      type: Number,
      default: 0,
      min: 0,
    },

    // User who owns this budget (reference to User model)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Budget description or notes
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },

    // Alert threshold (alert when spent reaches this percentage)
    alertThreshold: {
      type: Number,
      default: 80,
      min: 0,
      max: 100,
    },

    // Is budget active
    isActive: {
      type: Boolean,
      default: true,
    },

    // Created at timestamp
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },

    // Updated at timestamp
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

// Virtual: Calculate percentage spent
budgetSchema.virtual('percentageSpent').get(function () {
  return this.limit > 0 ? Math.round((this.spent / this.limit) * 100) : 0;
});

// Virtual: Calculate remaining budget
budgetSchema.virtual('remaining').get(function () {
  return Math.max(0, this.limit - this.spent);
});

// Virtual: Check if over budget
budgetSchema.virtual('isOverBudget').get(function () {
  return this.spent > this.limit;
});

// Index for faster queries
budgetSchema.index({ userId: 1, category: 1 });
budgetSchema.index({ userId: 1, createdAt: -1 });

// Middleware: Delete associated transactions when budget is deleted
budgetSchema.post('findByIdAndDelete', async function (doc) {
  if (doc) {
    try {
      const Transaction = mongoose.model('Transaction');
      await Transaction.deleteMany({ budgetId: doc._id });
    } catch (error) {
      console.error('Error deleting transactions:', error);
    }
  }
});

// Create and export Budget model
const Budget = mongoose.model('Budget', budgetSchema);
export default Budget;