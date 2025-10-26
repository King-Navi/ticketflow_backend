import dotenv from 'dotenv';
import https from 'https'
import http from 'http'
import express from 'express';
import { errorHandler } from './utils/errors/handler.js';
import loginRoute from './routes/login.route.js'
import userRoute from './routes/user.route.js'

import { initDatabase } from './config/initPostgre.js';


import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import swaggerUi from "swagger-ui-express";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const httpsPort = process.env.PORT || 3000;
const httpPort = 6970;

const app = express();

const specDir  = path.join(__dirname, "utils/doc");       // <-- cambia si tu server.js NO está en la raíz
const specFile = path.join(specDir, "openapi.yaml");          // nombre exacto (yaml vs yml)

app.use(express.json());
app.use(express.urlencoded({ extended: true }));



app.use(loginRoute);
app.use(userRoute);
// ... rutes

app.use("/spec", express.static(specDir));
app.get("/spec/openapi.yaml", (req, res) => res.sendFile(specFile));

app.use("/docs", swaggerUi.serve, swaggerUi.setup(null, {
  explorer: true,
  swaggerOptions: { url: "/spec/openapi.yaml" }
}));

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
