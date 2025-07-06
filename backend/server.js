require('cross-fetch/polyfill');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const envConfig = require('./config/env');
const { supabase } = require('./supabase.config');
const morgan = require('morgan');
const Joi = require('joi');
const { createClient } = require('@supabase/supabase-js');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const { csrfSync } = require('csrf-sync');
const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');
const path = require('path');
const cache = require('memory-cache');
const fs = require('fs');

// Simple logger for backend
const isDev = process.env.NODE_ENV === 'development';
const logger = {
  info: (msg, data) => isDev && console.log(`[INFO] ${msg}`, data || ''),
  error: (msg, err) => console.error(`[ERROR] ${msg}`, err || ''),
  warn: (msg, data) => console.warn(`[WARN] ${msg}`, data || ''),
  success: (msg, data) => isDev && console.log(`[SUCCESS] ${msg}`, data || ''),
  db: (msg, data) => isDev && console.log(`[DB] ${msg}`, data || '')
};

const app = express();
const config = envConfig.getConfig();
const PORT = config.server.port;
const LOG_PATH = process.env.AUDIT_LOG_PATH || './backend/logs/audit.log';

// --- Sentry Initialization ---
if (config.isProd && !config.sentry.dsn) {
  console.error('FATAL: Production ortamında Sentry DSN tanımlı değil! Lütfen .env dosyasına SENTRY_DSN ekleyin.');
  process.exit(1);
}
if (config.sentry.dsn) {
  Sentry.init({
    dsn: config.sentry.dsn,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
      new ProfilingIntegration(),
    ],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
    environment: process.env.NODE_ENV || 'development'
  });
  logger.info('Sentry monitoring enabled.');
  app.use(Sentry.requestHandler());
  app.use(Sentry.tracingHandler());
}
// --- End Sentry Initialization ---

// Initialize Supabase
const supabaseClient = createClient(
  process.env.SUPABASE_URL || config.supabase.url,
  process.env.SUPABASE_SERVICE_KEY || config.supabase.serviceKey
);

supabaseClient.from('diary_entries').select('count').limit(1)
  .then(() => logger.success('Supabase connection established'))
  .catch(err => logger.error('Supabase connection failed:', err));

// ==========================================
// ROUTE HANDLERS
// ==========================================

const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Yetkilendirme başarısız: Token bulunamadı.' });
  }
  
  const { data: { user }, error } = await supabaseClient.auth.getUser(token);
  
  if (error) {
    return res.status(401).json({ error: 'Yetkilendirme başarısız: Geçersiz token.', details: error.message });
  }

  req.user = user;
  next();
};

const getEntries = async (req, res) => {
    const { page = 1, limit = 10, sort = 'desc', favorites_only } = req.query;
    const offset = (page - 1) * limit;

    let query = supabaseClient
        .from('diary_entries')
        .select('*', { count: 'exact' })
        .eq('user_id', req.user.id);

    if (favorites_only === 'true') {
        query = query.eq('is_favorite', true);
    }
    
    query = query.order('entry_date', { ascending: sort === 'asc' }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) return res.status(500).json({ error: 'Girdiler alınamadı.', details: error.message });
    res.json({
        data,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            totalEntries: count,
            totalPages: Math.ceil(count / limit)
        }
    });
};

const getEntry = async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabaseClient
        .from('diary_entries')
        .select('*')
        .eq('id', id)
        .eq('user_id', req.user.id)
        .single();

    if (error) return res.status(404).json({ error: 'Girdi bulunamadı.', details: error.message });
    res.json(data);
};

const createEntry = async (req, res) => {
    const { data, error } = await supabaseClient
        .from('diary_entries')
        .insert([{ ...req.body, user_id: req.user.id }])
        .select()
        .single();
    
    if (error) return res.status(500).json({ error: 'Girdi oluşturulamadı.', details: error.message });
    res.status(201).json(data);
};

const updateEntry = async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabaseClient
        .from('diary_entries')
        .update(req.body)
        .eq('id', id)
        .eq('user_id', req.user.id)
        .select()
        .single();

    if (error) return res.status(500).json({ error: 'Girdi güncellenemedi.', details: error.message });
    res.json(data);
};

const deleteEntry = async (req, res) => {
    const { id } = req.params;
    const { error } = await supabaseClient
        .from('diary_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', req.user.id);

    if (error) return res.status(500).json({ error: 'Girdi silinemedi.', details: error.message });
    res.status(204).send();
};

const getStats = async (req, res) => {
    const cacheKey = `__stats__${req.user.id}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
        logger.info('Stats served from cache for user:', { userId: req.user.id });
        return res.json(cachedData);
    }
    
    logger.info('Generating new stats for user:', { userId: req.user.id });
    const { data: entries, error } = await supabaseClient
        .from('diary_entries')
        .select('content, sentiment, tags, entry_date')
        .eq('user_id', req.user.id);

    if (error) return res.status(500).json({ error: 'İstatistikler için veriler alınamadı.', details: error.message });

    if (!entries || entries.length === 0) {
        return res.json({
            totalEntries: 0,
            totalWords: 0,
            sentimentDistribution: {},
            tagDistribution: {},
            currentStreak: 0,
            longestStreak: 0,
            entriesByMonth: {}
        });
    }

    let totalWords = 0;
    const sentimentDistribution = {};
    const tagDistribution = {};
    const entriesByMonth = {};
    const entryDates = new Set();

    entries.forEach(entry => {
        totalWords += entry.content ? entry.content.split(/\s+/).length : 0;
        if (entry.sentiment) {
            sentimentDistribution[entry.sentiment] = (sentimentDistribution[entry.sentiment] || 0) + 1;
        }
        if (entry.tags) {
            entry.tags.forEach(tag => {
                tagDistribution[tag] = (tagDistribution[tag] || 0) + 1;
            });
        }
        const date = new Date(entry.entry_date).toISOString().split('T')[0];
        entryDates.add(date);
        const monthKey = new Date(entry.entry_date).toISOString().slice(0, 7);
        entriesByMonth[monthKey] = (entriesByMonth[monthKey] || 0) + 1;
    });

    const sortedDates = Array.from(entryDates).sort().map(d => new Date(d));
    let currentStreak = 0;
    let longestStreak = 0;
    if (sortedDates.length > 0) {
        longestStreak = 1;
        currentStreak = 1;
        for (let i = 1; i < sortedDates.length; i++) {
            const diff = (sortedDates[i] - sortedDates[i-1]) / (1000 * 60 * 60 * 24);
            if (diff === 1) {
                currentStreak++;
            } else {
                longestStreak = Math.max(longestStreak, currentStreak);
                currentStreak = 1;
            }
        }
        longestStreak = Math.max(longestStreak, currentStreak);
        
        const lastEntryDate = sortedDates[sortedDates.length-1];
        const today = new Date();
        today.setHours(0,0,0,0);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0,0,0,0);
        
        if (lastEntryDate.getTime() !== today.getTime() && lastEntryDate.getTime() !== yesterday.getTime()) {
          currentStreak = 0;
        }
    }

    const stats = {
        totalEntries: entries.length,
        totalWords,
        sentimentDistribution,
        tagDistribution,
        currentStreak,
        longestStreak,
        entriesByMonth
    };

    cache.put(cacheKey, stats, 600 * 1000); // 10 min cache
    res.json(stats);
};

const updatePassword = async (req, res) => {
    const { password } = req.body;
    if (!password) {
        return res.status(400).json({ error: "Şifre alanı boş olamaz." });
    }
    const { error } = await supabaseClient.auth.updateUser({ password });

    if (error) return res.status(500).json({ error: 'Şifre güncellenemedi.', details: error.message });
    res.json({ message: 'Şifre başarıyla güncellendi.' });
};

const requestPasswordReset = async (req, res) => {
    const { email } = req.body;
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: config.frontend.url + '/update-password',
    });
    if (error) {
        logger.error('Password reset request failed', error);
        return res.status(500).json({ error: 'Şifre sıfırlama talebi gönderilemedi.', details: error.message });
    }
    return res.json({ message: 'Şifre sıfırlama e-postası gönderildi. Lütfen gelen kutunuzu kontrol edin.' });
};

// Security Configuration
const securityConfig = {
  rateLimiting: {
    general: {
      windowMs: 10 * 60 * 1000,
      max: 30,
      message: { error: 'Çok fazla istek! 10 dakika sonra tekrar deneyiniz.' },
      standardHeaders: true, legacyHeaders: false,
      skip: (req) => req.path === '/api/v1/health'
    },
    strict: {
      windowMs: 15 * 60 * 1000, max: 10,
      message: { error: 'Çok fazla güvenlik denemesi! 15 dakika sonra tekrar deneyiniz.' },
      standardHeaders: true, legacyHeaders: false
    },
    password: {
      windowMs: 60 * 60 * 1000, max: 5,
      message: { error: 'Çok fazla şifre değiştirme denemesi! 1 saat sonra tekrar deneyiniz.' },
      standardHeaders: true, legacyHeaders: false
    }
  },
  helmet: {
    // Add any necessary helmet options here
  }
};

// Input Validation Schemas
const validationSchemas = {
  createEntry: Joi.object({
    title: Joi.string().trim().min(1).max(255).required(),
    content: Joi.string().trim().min(1).max(50000).required(),
    entry_date: Joi.date().iso().max('now').optional(),
    sentiment: Joi.string().valid('positive', 'negative', 'neutral').optional(),
    tags: Joi.array().items(Joi.string().trim().max(50)).max(10).optional(),
    weather: Joi.string().trim().max(100).optional(),
    location: Joi.string().trim().max(200).optional()
  }),
  updateEntry: Joi.object({
    title: Joi.string().trim().min(1).max(255).optional(),
    content: Joi.string().trim().min(1).max(50000).optional(),
    entry_date: Joi.date().iso().max('now').optional(),
    sentiment: Joi.string().valid('positive', 'negative', 'neutral').optional(),
    tags: Joi.array().items(Joi.string().trim().max(50)).max(10).optional(),
    is_favorite: Joi.boolean().optional()
  }).min(1),
  updatePassword: Joi.object({
    password: Joi.string().min(8).max(128).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required()
  }),
  requestPasswordReset: Joi.object({
    email: Joi.string().email().required()
  })
};

// Validation Middleware
const validateInput = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(detail => ({ field: detail.path.join('.'), message: detail.message }));
    logger.warn('Input validation failed:', { errors, body: req.body });
    return res.status(400).json({ error: 'Girdi doğrulama hatası', details: errors });
  }
  next();
};

const createEntryValidation = validateInput(validationSchemas.createEntry);
const updateEntryValidation = validateInput(validationSchemas.updateEntry);
const passwordUpdateValidation = validateInput(validationSchemas.updatePassword);
const requestPasswordResetValidation = validateInput(validationSchemas.requestPasswordReset);

// Security Audit Middleware
const auditMiddleware = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logEntry = {
      method: req.method, path: req.path, status: res.statusCode, duration: `${duration}ms`,
      ip: req.ip, userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    };
    logger.info('API Log', logEntry);
    // Dosyaya da yaz
    try {
      fs.appendFileSync(LOG_PATH, JSON.stringify(logEntry) + '\n');
    } catch (err) {
      logger.error('Audit log dosyaya yazılamadı', err);
    }
  });
  next();
};

// General Middlewares
app.use(helmet(securityConfig.helmet));
app.use(compression());
app.use(express.json({ limit: '10kb' })); 
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// --- YENİ: Session Middleware Yapılandırması ---
// Not: Production ortamında 'secret' kesinlikle bir ortam değişkeninden (environment variable) alınmalıdır.
// `genid` her session için benzersiz bir ID oluşturur.
app.use(session({
  secret: process.env.SESSION_SECRET || 'super-secret-key-for-dev', // DEV için geçici, PROD'da değiştirilmeli
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: config.isProd, // Production'da true olmalı
    httpOnly: true, 
    sameSite: 'strict' 
  },
  genid: (req) => uuidv4()
}));
// --- Bitiş ---

const corsOptions = {
  origin: config.frontend.url,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable pre-flight for all routes

app.use(auditMiddleware);

// Rate Limiters
const generalLimiter = rateLimit(securityConfig.rateLimiting.general);
const strictLimiter = rateLimit(securityConfig.rateLimiting.strict);
const passwordUpdateLimiter = rateLimit(securityConfig.rateLimiting.password);
const entryCreationLimiter = rateLimit({ ...securityConfig.rateLimiting.general, max: 20, windowMs: 5 * 60 * 1000 });

// --- YENİ: Doğru CSRF Yapılandırması ---
const {
  generateToken,
  csrfSynchronisedProtection
} = csrfSync({
  getTokenFromRequest: (req) => req.headers['x-csrf-token'],
  // Diğer tüm ayarlar (token'ı session'a yazma vb.) varsayılan olarak doğrudur.
});

const csrfProtection = csrfSynchronisedProtection;
// --- Bitiş ---

// We need to use csrfProtection on all routes that change state,
// but the /api/v1/csrf-token route needs to be exempted to *get* the token.
// Health check and auth routes that don't use cookies can also be exempted.
app.get('/api/v1/health', (req, res) => res.status(200).json({ status: 'ok' }));

// CSRF token endpoint'ini güncelle
app.get('/api/v1/csrf-token', (req, res) => {
  const csrfToken = generateToken(req);
  res.json({ csrfToken });
});

app.use('/api/v1/auth', strictLimiter);
app.post('/api/v1/auth/request-password-reset', requestPasswordResetValidation, requestPasswordReset);

// Apply CSRF protection to all subsequent state-changing routes
app.post('/api/v1/entries', protect, csrfProtection, entryCreationLimiter, createEntryValidation, createEntry);
app.put('/api/v1/entries/:id', protect, csrfProtection, updateEntryValidation, updateEntry);
app.delete('/api/v1/entries/:id', protect, csrfProtection, deleteEntry);
app.put('/api/v1/user/password', protect, csrfProtection, passwordUpdateLimiter, passwordUpdateValidation, updatePassword);

// Routes that don't change state don't need CSRF protection
app.get('/api/v1/entries', protect, getEntries);
app.get('/api/v1/entries/:id', protect, getEntry);
app.get('/api/v1/entries/stats', protect, getStats);

// Serve Frontend in Production
if (config.isProd) {
  const buildPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(buildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

// Global Error Handler
if (config.sentry.dsn) {
    app.use(Sentry.errorHandler());
}

app.use((err, req, res, next) => {
  logger.error('Global Error Handler caught:', err);
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ error: 'Geçersiz veya eksik CSRF token.' });
  }
  res.status(500).send({ error: 'Beklenmedik bir sunucu hatası oluştu.' });
});

app.listen(PORT, '0.0.0.0', () => {
  logger.success(`Server listening on http://0.0.0.0:${PORT}`);
});