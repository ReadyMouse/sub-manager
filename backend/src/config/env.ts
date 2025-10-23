import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

// Load from main .env file (project root) for blockchain variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Load from backend .env file for backend-specific variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Load from backend .env.local file for local development (overrides .env)
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // Server
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_URL: z.string().url(),

  // Frontend
  FRONTEND_URL: z.string().url(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  REFRESH_TOKEN_SECRET: z.string().min(32),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),

  // Email
  SMTP_HOST: z.string(),
  SMTP_PORT: z.string().default('587'),
  SMTP_USER: z.string(),
  SMTP_PASSWORD: z.string(),
  FROM_EMAIL: z.string().email(),
  FROM_NAME: z.string().default('StableRent'),

  // Envio
  ENVIO_WEBHOOK_SECRET: z.string(),

  // Blockchain
  DEFAULT_CHAIN_ID: z.string().default('1'),
  CONTRACT_ADDRESS_SEPOLIA: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  SEPOLIA_RPC_URL: z.string().url().optional(),
  PROCESSOR_PRIVATE_KEY: z.string().min(64).optional(), // Private key for automation wallet
  
  // Processor Fee Configuration
  PROCESSOR_FEE_PERCENT: z.string().default('0.05'),
  
  // Hardhat/Development (from main .env)
  ALCHEMY_API_KEY: z.string().optional(),
  ETHERSCAN_API_KEY: z.string().optional(),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),
});

const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((e) => e.path.join('.')).join(', ');
      throw new Error(
        `Missing or invalid environment variables: ${missingVars}\n` +
        `Please check your .env file and ensure all required variables are set.`
      );
    }
    throw error;
  }
};

export const env = parseEnv();

export default env;

