import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend/.env or root .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import payrollRoutes from './routes/payrollRoutes.js';
import shiftRoutes from './routes/shiftRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import taxRoutes from './routes/taxRoutes.js';
import trackingRoutes from './routes/trackingRoutes.js';
import noticeRoutes from './routes/noticeRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import securityRoutes from './routes/securityRoutes.js';
import employeePortalRoutes from './routes/employeePortalRoutes.js';
import workplaceRoutes from './routes/workplaceRoutes.js';

const app = express();

// Database auto-connection middleware for serverless / requests
app.use(async (req, res, next) => {
  // Allow health checks to run even if DB is still connecting
  if (req.path === '/api/health' || req.path === '/api/v1/health') {
    return next();
  }

  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('[DB Middleware Error]:', error.message);
    res.status(503).json({
      success: false,
      message: 'Database connection failed. Please ensure MONGO_URI is properly configured.',
      error: error.message,
    });
  }
});

// Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false,
}));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Private-Network', 'true');
  next();
});

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or Postman)
    if (!origin) return callback(null, true);
    if (
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    }
    return callback(null, true); // Allow all
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health Check Endpoints
const healthHandler = (req, res) => {
  const envKeys = ['MONGO_URI', 'MONGODB_URI', 'MONGODB_URL', 'DATABASE_URL', 'MONGO_URL'];
  const detectedKey = envKeys.find(k => !!process.env[k]);

  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'CBDP HR API',
    nodeEnv: process.env.NODE_ENV || 'production',
    version: '2.0.2-prod',
    hasMongoUri: !!detectedKey,
    detectedEnvVar: detectedKey || 'NONE (Please add MONGO_URI in Vercel Settings -> Environment Variables)'
  });
};

app.get('/api/health', healthHandler);
app.get('/api/v1/health', healthHandler);
app.get('/api', (req, res) => {
  res.json({
    name: 'CBDP Management API',
    version: '1.0.0',
    status: 'online',
    endpoints: '/api/v1/*'
  });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/v1/leave', leaveRoutes);
app.use('/api/v1/leaves', leaveRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/v1/payroll', payrollRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/v1/shifts', shiftRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/v1/taxes', taxRoutes);
app.use('/api/taxes', taxRoutes);
app.use('/api/v1/tracking', trackingRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/v1/notices', noticeRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/v1/security', securityRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/v1/employee-portal', employeePortalRoutes);
app.use('/api/v1/employee', employeePortalRoutes);
app.use('/api/employee-portal', employeePortalRoutes);
app.use('/api/employee', employeePortalRoutes);
app.use('/api/v1/workplaces', workplaceRoutes);
app.use('/api/workplaces', workplaceRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

export default app;
