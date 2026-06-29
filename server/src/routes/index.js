const express = require('express');
const router = express.Router();

const statusController = require('../controllers/statusController');
const taskRoutes = require('./taskRoutes');
const aiRoutes = require('./aiRoutes'); // <-- YE ADD KAR

// System status verification route
router.get('/v1/status', statusController.getStatus); // <-- /v1 ADD KAR

// Task CRUD routes  
router.use('/v1/tasks', taskRoutes); // <-- /v1 ADD KAR

// AI routes
router.use('/v1/ai', aiRoutes); // <-- YE ADD KAR

module.exports = router;