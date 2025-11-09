import dotenv from 'dotenv';
dotenv.config();
import https from 'https'
import http from 'http'
import express from 'express';
import cors from 'cors';
import { errorHandler } from './utils/errors/handler.js';
import authRoute from './routes/auth.route.js'
import companyRoute from './routes/company.route.js'
import eventRoute from './routes/event.route.js'
import eventImagesRoute from './routes/eventImages.route.js'
import eventLocationRoute from './routes/eventLocation.route.js'
import eventSeatRoute from './routes/eventSeat.route.js'
import locationRoute from './routes/locations.route.js'
import loginRoute from './routes/login.route.js'
import organizerRoute from './routes/organizer.route.js'
import reserveRoute from './routes/reservation.route.js'
import stripeWebhookRoute from './routes/stripeWebhook.route.js'
import ticketRoute from './routes/ticket.route.js'
import userRoute from './routes/user.route.js'
import { initDatabase } from './config/initPostgre.js';
import { fileURLToPath } from "url";
import path from "path";
import swaggerUi from "swagger-ui-express";


function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`[FATAL] La variable de entorno ${name} no está definida.`);
    process.exit(1);
  }
  return value;
}
const UPLOAD_BASE = requireEnv('UPLOAD_BASE');
const TMP_DIR = requireEnv('TMP_DIR');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const eventsDir = path.resolve(__dirname, '..', UPLOAD_BASE);
const tmpDir = path.resolve(__dirname, '..', TMP_DIR);

const httpsPort = process.env.PORT || 3000;
const httpPort = 6970;

const app = express();

app.use(cors());

const specDir = path.join(__dirname, "utils/doc");
const specFile = path.join(specDir, "openapi.yaml");


/**
 * webhook before express.json()
 */
app.use(stripeWebhookRoute);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(authRoute);
app.use(companyRoute);
app.use(eventRoute);
app.use(eventImagesRoute);
app.use(eventLocationRoute);
app.use(eventSeatRoute);
app.use(locationRoute);
app.use(loginRoute);
app.use(organizerRoute);
app.use(reserveRoute);
app.use(ticketRoute);
app.use(userRoute);

// ... rutes

app.use("/spec", express.static(specDir));
app.get("/spec/openapi.yaml", (req, res) => res.sendFile(specFile));

app.use("/docs", swaggerUi.serve, swaggerUi.setup(null, {
  explorer: true,
  swaggerOptions: { url: "/spec/openapi.yaml" }
}));

app.use('/static/events', express.static(eventsDir));


app.use(errorHandler);

async function start() {
  try {
    await initDatabase();
    //TODO: https
    http.createServer(app).listen(httpPort, () => {
      console.log(`Server running on http://localhost:${httpPort}`);
    });
  } catch (err) {
    console.error('Failed to start app:', err);
    process.exit(1);
  }
}

await start();
