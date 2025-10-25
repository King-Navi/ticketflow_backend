import dotenv from 'dotenv';
import https from 'https'
import http from 'http'
import express from 'express';
import { errorHandler } from './utils/errors/handler.js';
import loginRoute from './routes/login.route.js'
import { initDatabase } from './config/initPostgre.js';
dotenv.config();
const httpsPort = process.env.PORT || 3000;
const httpPort = 6970;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(loginRoute);
// ... rutes


app.use(errorHandler);

async function start() {
  try {
    await initDatabase();

    http.createServer(app).listen(httpPort, () => {
      console.log(`Server running on http://localhost:${httpPort}`);
    });
  } catch (err) {
    console.error('Failed to start app:', err);
    process.exit(1);
  }
}

await start();
