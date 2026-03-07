const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetFlow,
  getBudgetsByDepartment
} = require('../controllers/budgetController');

// @route   GET /api/budgets
router.get('/', auth, getBudgets);

// @route   GET /api/budgets/department/:deptId
router.get('/department/:deptId', auth, getBudgetsByDepartment);

// @route   GET /api/budgets/:id/flow
router.get('/:id/flow', auth, getBudgetFlow);

// @route   GET /api/budgets/:id
router.get('/:id', auth, getBudgetById);

// @route   POST /api/budgets
router.post('/', auth, createBudget);

// @route   PUT /api/budgets/:id
router.put('/:id', auth, updateBudget);

// @route   DELETE /api/budgets/:id
router.delete('/:id', auth, deleteBudget);

module.exports = router;
