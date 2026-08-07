const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
require('dotenv').config();

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

// Routes
app.use('/api/companies', require('./routes/companies'));
app.use('/api/company',   require('./routes/company'));
app.use('/api/search',    require('./routes/search'));
app.use('/api/topics',    require('./routes/topics'));
app.use('/api/stats',     require('./routes/stats'));
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/progress',  require('./routes/progress'));
app.use('/api/bookmarks', require('./routes/bookmarks'));
app.get('/health', (_, res) => res.json({ status: 'ok' }));

// Global error handler
app.use(require('./middleware/errorHandler'));

module.exports = app;
