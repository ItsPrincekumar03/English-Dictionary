// src/routes/wordRoutes.js

const express = require('express');
const router = express.Router();
const wordController = require('../controllers/wordController');

// GET /suggest/:prefix — must be registered BEFORE /:word,
// otherwise Express would treat "suggest" as a literal word lookup.
router.get('/suggest/:prefix', wordController.getSuggestions);

// GET /:word — relative to wherever this router gets mounted.
// app.js will mount this at /api/words, making the full path
// GET /api/words/:word
router.get('/:word', wordController.getWord);

module.exports = router;