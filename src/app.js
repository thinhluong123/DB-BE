const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');
const config = require('./config/env');
const { notFoundHandler, errorHandler } = require('./middlewares/errorMiddleware');

const app = express();

const allowedOrigins = config.app.clientOrigins || ['*'];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }),
);

app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(config.app.env === 'production' ? 'combined' : 'dev'));

app.get('/health', (req, res) =>
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }),
);

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

