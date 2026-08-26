// src/routes/wordRoutes.js

const express = require('express');
const router = express.Router();
const wordController = require('../controllers/wordController');

// GET /:word — relative to wherever this router gets mounted.
// app.js will mount this at /api/words, making the full path
// GET /api/words/:word
router.get('/:word', wordController.getWord);

module.exports = router;