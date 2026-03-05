/**
 * Transaction Model
 * Defines transaction schema for tracking income and expenses
 * Automatically updates budget spent amount
 */

import mongoose from 'mongoose';

// Define transaction schema
const transactionSchema = new mongoose.Schema(
  {
    // Transaction description
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [3, 'Description must be at least 3 characters'],
      maxlength: [100, 'Description cannot exceed 100 characters'],
    },

    // Transaction amount
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
      validate: {
        validator: function (value) {
          return !isNaN(parseFloat(value)) && parseFloat(value) > 0;
        },
        message: 'Amount must be a valid positive number',
      },
    },

    // Transaction type: income or expense
    type: {
      type: String,
      enum: {
        values: ['income', 'expense'],
        message: 'Transaction type must be either income or expense',
      },
      default: 'expense',
    },

    // Budget this transaction belongs to
    budgetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Budget',
      required: true,
    },

    // User who created this transaction
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Transaction date
    date: {
      type: Date,
      default: Date.now,
    },

    // Optional notes/comments about the transaction
    notes: {
      type: String,
      trim: true,
      maxlength: [250, 'Notes cannot exceed 250 characters'],
    },

    // Payment method
    paymentMethod: {
      type: String,
      enum: {
        values: ['cash', 'credit_card', 'debit_card', 'bank_transfer', 'digital_wallet'],
        message: 'Invalid payment method',
      },
      default: 'cash',
    },

    // Receipt/reference number
    referenceNumber: {
      type: String,
      trim: true,
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

// Index for faster queries
transactionSchema.index({ userId: 1, budgetId: 1 });
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ budgetId: 1, date: -1 });
transactionSchema.index({ type: 1 });

// Middleware: Update budget spent amount after transaction is saved
transactionSchema.post('save', async function (doc) {
  try {
    const Budget = mongoose.model('Budget');
    const budget = await Budget.findById(doc.budgetId);

    if (budget) {
      // Recalculate total expenses for this budget
      const result = await mongoose.model('Transaction').aggregate([
        {
          $match: {
            budgetId: mongoose.Types.ObjectId.createFromHexString(doc.budgetId.toString()),
            type: 'expense',
          },
        },
        {
          $group: {
            _id: null,
            totalSpent: { $sum: '$amount' },
          },
        },
      ]);

      budget.spent = result.length > 0 ? result[0].totalSpent : 0;
      await budget.save();
    }
  } catch (error) {
    console.error('Error updating budget spent amount:', error);
  }
});

// Middleware: Update budget spent when transaction is deleted
transactionSchema.post('findByIdAndDelete', async function (doc) {
  if (doc) {
    try {
      const Budget = mongoose.model('Budget');
      const budget = await Budget.findById(doc.budgetId);

      if (budget) {
        const result = await mongoose.model('Transaction').aggregate([
          {
            $match: {
              budgetId: mongoose.Types.ObjectId.createFromHexString(
                doc.budgetId.toString()
              ),
              type: 'expense',
            },
          },
          {
            $group: {
              _id: null,
              totalSpent: { $sum: '$amount' },
            },
          },
        ]);

        budget.spent = result.length > 0 ? result[0].totalSpent : 0;
        await budget.save();
      }
    } catch (error) {
      console.error('Error updating budget after transaction deletion:', error);
    }
  }
});

// Create and export Transaction model
const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;