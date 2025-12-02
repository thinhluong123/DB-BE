const http = require('http');
const app = require('./app');
const { initDb } = require('./config/db');

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await initDb();
    const server = http.createServer(app);
    server.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

start();


