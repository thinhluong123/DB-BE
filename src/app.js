const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');

// Load env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');
const apiRouter = require('./routes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// API routes
app.use('/api', apiRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'OK' });
});

// 404 & error handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;


