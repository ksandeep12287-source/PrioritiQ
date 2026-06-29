/**
 * @desc    Get Server & System Status Diagnostics
 * @route   GET /api/status
 * @access  Public
 */
exports.getStatus = (req, res, next) => {
  try {
    const memoryUsage = process.memoryUsage();
    
    res.status(200).json({
      success: true,
      message: 'PrioritiQ API server is healthy',
      data: {
        environment: process.env.NODE_ENV || 'development',
        uptime: `${Math.floor(process.uptime())}s`,
        memory: {
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100} MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100} MB`,
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100} MB`
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};
