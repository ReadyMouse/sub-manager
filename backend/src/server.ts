import { env } from './config/env';
import { app } from './app';
import StartupService from './services/startupService';

// ========================================
// SERVER START
// ========================================

const PORT = parseInt(env.PORT) || 3001;

const server = app.listen(PORT, async () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   StableRent Backend API                                ║
║                                                       ║
║   Environment: ${env.NODE_ENV.padEnd(40, ' ')}║
║   Port:        ${PORT.toString().padEnd(40, ' ')}║
║   API URL:     ${env.API_URL.padEnd(40, ' ')}║
║                                                       ║
║   Health:      /health${' '.repeat(40 - 7)}║
║   Docs:        /api${' '.repeat(40 - 4)}║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);

  // Initialize background services
  try {
    const startupService = new StartupService();
    await startupService.initialize();
    console.log('✅ Background services initialized');
  } catch (error) {
    console.error('❌ Failed to initialize background services:', error);
  }
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}, closing server gracefully...`);

  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

