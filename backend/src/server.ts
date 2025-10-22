import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import prisma from './config/database';

// Middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';

// Routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import connectedWalletRoutes from './routes/connectedWallets';
import subscriptionRoutes from './routes/subscriptions';
import paymentRoutes from './routes/payments';
import notificationRoutes from './routes/notifications';
import webhookRoutes from './routes/webhooks';
import automationRoutes from './routes/automation';
import StartupService from './services/startupService';

// Initialize Express app
const app = express();

// Trust proxy for Railway deployment
app.set('trust proxy', 1);

// ========================================
// MIDDLEWARE
// ========================================

// Security headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: [
      env.FRONTEND_URL,
      'https://stablerent.vercel.app', // Your Vercel frontend URL
      'http://localhost:5173', // For local development
      'http://localhost:3000', // For local development
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting (apply to API routes only)
app.use('/api', apiLimiter);

// ========================================
// HEALTH CHECK
// ========================================

app.get('/health', async (_req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      database: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ========================================
// API ROUTES
// ========================================

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/wallets', connectedWalletRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/automation', automationRoutes);

// API info endpoint
app.get('/api', (_req, res) => {
  res.json({
    name: 'StableRent Backend API',
    version: '1.0.0',
    description: 'User management and subscription metadata API',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      wallets: '/api/wallets',
      subscriptions: '/api/subscriptions',
      payments: '/api/payments',
      notifications: '/api/notifications',
      webhooks: '/api/webhooks',
      automation: '/api/automation',
    },
  });
});

// ========================================
// ERROR HANDLING
// ========================================

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

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

export default app;

