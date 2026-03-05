import test from 'node:test';
import assert from 'node:assert/strict';

import {
  validateEmail,
  validatePassword,
  validateMongoId,
  validateBudgetAmount,
  validateTransactionType,
  validateBudgetCategory,
} from '../utils/validators.js';

test('validateEmail accepts valid emails and rejects invalid ones', () => {
  assert.equal(validateEmail('user@example.com'), true);
  assert.equal(validateEmail('invalid-email'), false);
});

test('validatePassword enforces uppercase and number requirements', () => {
  assert.equal(validatePassword('Password1'), true);
  assert.equal(validatePassword('password1'), false);
  assert.equal(validatePassword('Password'), false);
});

test('validateMongoId validates 24-char hex IDs', () => {
  assert.equal(validateMongoId('507f1f77bcf86cd799439011'), true);
  assert.equal(validateMongoId('not-a-mongo-id'), false);
});

test('validateBudgetAmount allows positive numbers only', () => {
  assert.equal(validateBudgetAmount(100), true);
  assert.equal(validateBudgetAmount('50.25'), true);
  assert.equal(validateBudgetAmount(0), false);
  assert.equal(validateBudgetAmount(-5), false);
});

test('validateTransactionType allows only income and expense', () => {
  assert.equal(validateTransactionType('income'), true);
  assert.equal(validateTransactionType('expense'), true);
  assert.equal(validateTransactionType('transfer'), false);
});

test('validateBudgetCategory allows predefined categories', () => {
  assert.equal(validateBudgetCategory('Food'), true);
  assert.equal(validateBudgetCategory('Other'), true);
  assert.equal(validateBudgetCategory('Travel'), false);
});
