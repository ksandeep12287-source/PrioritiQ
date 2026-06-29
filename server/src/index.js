// STEP 1: .env file ko sabse pehle load karo. Ye line hamesha top pe rahegi.
require('dotenv').config();

const dns = require('dns');
// Force public DNS resolvers to circumvent Node.js v22/v24 SRV record lookup bugs on Windows
dns.setServers(['1.1.1.1', '8.8.8.8']);

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const startServer = async () => {
  // Connect to MongoDB Atlas
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 PrioritiQ API Server Running`);
    console.log(`🌐 Port: ${PORT}`);
    console.log(`🔧 Mode: ${NODE_ENV}`);
    console.log(`=========================================`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error(`🔴 Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error(`🔴 Uncaught Exception: ${err.message}`);
    server.close(() => process.exit(1));
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      console.log('💤 Process terminated.');
    });
  });
};

startServer().catch((err) => {
  console.error(`🔴 Server Boot Failure: ${err.message}`);
  process.exit(1);
});