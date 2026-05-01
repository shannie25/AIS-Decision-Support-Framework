const express = require('express');
const router = express.Router();
const { analyzeController } = require('./analyzeController');

// POST /api/analyze
// Accepts institutional profile and returns scored results
router.post('/', analyzeController);

module.exports = router;
