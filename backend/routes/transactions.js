const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionsByBudget,
  flagTransaction
} = require('../controllers/transactionController');

// @route   GET /api/transactions
router.get('/', auth, getTransactions);

// @route   GET /api/transactions/budget/:budgetId
router.get('/budget/:budgetId', auth, getTransactionsByBudget);

// @route   GET /api/transactions/:id
router.get('/:id', auth, getTransactionById);

// @route   POST /api/transactions
router.post('/', auth, createTransaction);

// @route   PUT /api/transactions/:id/flag
router.put('/:id/flag', auth, flagTransaction);

// @route   PUT /api/transactions/:id
router.put('/:id', auth, updateTransaction);

// @route   DELETE /api/transactions/:id
router.delete('/:id', auth, deleteTransaction);

module.exports = router;
