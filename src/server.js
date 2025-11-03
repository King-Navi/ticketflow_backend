import dotenv from 'dotenv';
dotenv.config();
import https from 'https'
import http from 'http'
import express from 'express';
import { errorHandler } from './utils/errors/handler.js';
import authRoute from './routes/auth.route.js'
import companyRoute from './routes/company.route.js'
import eventRoute from './routes/event.route.js'
import eventLocationRoute from './routes/eventLocation.route.js'
import locationRoute from './routes/locations.route.js'
import loginRoute from './routes/login.route.js'
import organizerRoute from './routes/organizer.route.js'
import userRoute from './routes/user.route.js'

import { initDatabase } from './config/initPostgre.js';


import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import swaggerUi from "swagger-ui-express";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const httpsPort = process.env.PORT || 3000;
const httpPort = 6970;

const app = express();

const specDir = path.join(__dirname, "utils/doc");
const specFile = path.join(specDir, "openapi.yaml");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(authRoute);
app.use(companyRoute);
app.use(eventRoute);
app.use(eventLocationRoute);
app.use(locationRoute);
app.use(loginRoute);
app.use(organizerRoute);
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
