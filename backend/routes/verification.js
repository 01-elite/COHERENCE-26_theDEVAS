const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getVerificationDashboard,
  analyzeAnomaliesWithAI,
  compareBudgetPatterns,
  getVerificationQueue,
  bulkVerifyAnomalies
} = require('../controllers/verificationController');

// @route   GET /api/verification/dashboard
router.get('/dashboard', auth, getVerificationDashboard);

// @route   GET /api/verification/queue
router.get('/queue', auth, getVerificationQueue);

// @route   POST /api/verification/analyze
router.post('/analyze', auth, analyzeAnomaliesWithAI);

// @route   POST /api/verification/compare-patterns
router.post('/compare-patterns', auth, compareBudgetPatterns);

// @route   POST /api/verification/bulk-verify
router.post('/bulk-verify', auth, bulkVerifyAnomalies);

module.exports = router;
