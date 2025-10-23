import dotenv from 'dotenv';
import https from 'https'
import http from 'http'
import express from 'express';
import { errorHandler } from './utils/errors/handler.js';
import db from './config/database.js'

import loginRoute from './routes/login.route.js'

dotenv.config();
const httpsPort = process.env.PORT || 3000;
const httpPort = 6970;

const app = express();

app.use(loginRoute);
// ... rutes


app.use(errorHandler);


db()
    .then(async () => {

        http.createServer(app).listen(httpPort, () => {
            console.log(`Server running on http://localhost:${httpPort}`);
        });
    })
    .catch((err) => {
        console.error("Error:", err);
        process.exit(1);
    });