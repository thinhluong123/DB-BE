const http = require('http');
const app = require('./app');
const config = require('./config/env');
const { pool } = require('./config/database');

const startServer = async () => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Cannot connect to MySQL. Please check your credentials.', error);
    process.exit(1);
  }

  const server = http.createServer(app);
  server.listen(config.app.port, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 Server listening on port ${config.app.port}`);
  });
};

startServer();

