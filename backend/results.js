const express = require('express');
const router = express.Router();
const { getResult, listResults } = require('./resultsController');

// GET /api/results/:id  — fetch one saved result
router.get('/:id', getResult);

// GET /api/results      — list all saved results (admin use)
router.get('/', listResults);

module.exports = router;
