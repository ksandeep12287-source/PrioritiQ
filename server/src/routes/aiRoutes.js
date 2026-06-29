const express = require('express');
const router = express.Router();
const { analyzeTaskController, chatController } = require('../controllers/aiController');

// Purana route
router.post('/analyze', analyzeTaskController);

// Naya Agent Chat Route - Ab controller use hoga
router.post('/chat', chatController);

module.exports = router;