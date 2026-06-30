const express = require('express');
const router = express.Router();
const { analyzeTaskController, chatController } = require('../controllers/aiController');

const { generateSpeech } = require('../controllers/ttsController.js'); // <-- YE LINE ADD KAR


// Purana route
router.post('/analyze', analyzeTaskController);

// Naya Agent Chat Route - Ab controller use hoga
router.post('/chat', chatController);

// Naya TTS Route - Edge + Mobile ke liye 
router.post('/speak', generateSpeech); // <-- Ye line add kar

module.exports = router;