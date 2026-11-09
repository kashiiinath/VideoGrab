import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { initDatabase } from './db';
import analyzeRouter from './routes/analyze';
import downloadsRouter from './routes/downloads';
import historyRouter from './routes/history';
import streamRouter from './routes/stream';
import musicRouter from './routes/music';
import { cleanupExpiredFiles } from './utils/cleanup';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      process.env.NODE_ENV !== 'production'
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Routes
app.use('/api/analyze', analyzeRouter);
app.use('/api/music', musicRouter);
app.use('/api/downloads', downloadsRouter);
app.use('/api/history', historyRouter);
app.use('/api/stream', streamRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0', app: 'VidGrab' });
});

// Initialize DB and start server
async function start() {
  await initDatabase();
  
  // Schedule cleanup every 30 minutes
  setInterval(() => {
    cleanupExpiredFiles().catch(console.error);
  }, 30 * 60 * 1000);

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`\n🎬 VidGrab Backend running at http://0.0.0.0:${PORT}`);
    console.log(`   Health: http://0.0.0.0:${PORT}/api/health\n`);
  });
}

start().catch(console.error);
