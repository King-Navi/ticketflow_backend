import express from 'express'
import { listAllLocationsController } from '../controller/eventLocation.controller.js';

const router = express.Router();

const EVENTLOCATION_ROUTE = "/v1/location";

router.get(
  `${EVENTLOCATION_ROUTE}/search/all`,
  listAllLocationsController
);

export default router;