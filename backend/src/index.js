require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const groupRoutes = require('./routes/groups');
const studentRoutes = require('./routes/students');
const assessmentRoutes = require('./routes/assessments');
const aiRoutes = require('./routes/ai');
const adminRoutes = require('./routes/admin');

const app = express();

// Trust proxy (required for Render and other cloud platforms)
app.set('trust proxy', 1);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'https://ai-teacher-frontend-ysh4.onrender.com'
  ].filter(Boolean),
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// AI rate limiting
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50
});
app.use('/api/ai/', aiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'AI Teacher Assistant API',
    version: '1.0.0',
    college: 'ККТиС - Караганда',
    endpoints: {
      auth: '/api/auth',
      tasks: '/api/tasks',
      groups: '/api/groups',
      students: '/api/students',
      assessments: '/api/assessments',
      ai: '/api/ai',
      admin: '/api/admin'
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Что-то пошло не так!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint не найден' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 AI Teacher Assistant - ККТиС College`);
});
