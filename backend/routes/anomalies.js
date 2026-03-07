const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getAnomalies,
  getAnomalyById,
  runAnomalyDetection,
  getHighRiskAnomalies,
  updateAnomaly,
  resolveAnomaly,
  getAnomalyStats,
  getYearComparison
} = require('../controllers/anomalyController');

// @route   GET /api/anomalies
router.get('/', auth, getAnomalies);

// @route   GET /api/anomalies/detect
router.get('/detect', auth, runAnomalyDetection);

// @route   GET /api/anomalies/high-risk
router.get('/high-risk', auth, getHighRiskAnomalies);

// @route   GET /api/anomalies/stats
router.get('/stats', auth, getAnomalyStats);

// @route   GET /api/anomalies/year-comparison
router.get('/year-comparison', auth, getYearComparison);

// @route   GET /api/anomalies/:id
router.get('/:id', auth, getAnomalyById);

// @route   PUT /api/anomalies/:id
router.put('/:id', auth, updateAnomaly);

// @route   PUT /api/anomalies/:id/resolve
router.put('/:id/resolve', auth, resolveAnomaly);

module.exports = router;
