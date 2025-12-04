const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath, override: true });

const config = {
  app: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5000', 10),
    clientOrigins: process.env.CLIENT_URL
      ? process.env.CLIENT_URL.split(',').map((origin) => origin.trim())
      : ['http://localhost:3000'],
  },
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'btl2',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'change_me',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  payos: {
    clientId: process.env.PAYOS_CLIENT_ID || '',
    apiKey: process.env.PAYOS_API_KEY || '',
    checksumKey: process.env.PAYOS_CHECKSUM_KEY || '',
    returnUrl: process.env.PAYOS_RETURN_URL || 'http://localhost:3000/payment/success',
    cancelUrl: process.env.PAYOS_CANCEL_URL || 'http://localhost:3000/payment/cancel',
  },
};

module.exports = config;

