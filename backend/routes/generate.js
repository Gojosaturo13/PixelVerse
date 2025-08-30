const express = require('express');
const { generateImage } = require('../controllers/clipdrop');

const router = express.Router();

// POST /api/generate-image
router.post('/', generateImage);

module.exports = router;
