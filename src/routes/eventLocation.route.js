import express from 'express'
import { listAllLocationsController, getEventLocationLayoutController } from '../controller/location.controller.js';
import { validateParams } from '../middlewares/validateBody.js';
import { eventLocationIdParamsSchema } from '../middlewares/schemes/eventLocationIdParamsSchema.scheme.js';

const router = express.Router();

const EVENTLOCATION_ROUTE = "/v1/location";

router.get(
  `${EVENTLOCATION_ROUTE}/search/all`,
  listAllLocationsController
);

router.get(
    `${EVENTLOCATION_ROUTE}/:eventLocationId/layout`,
    validateParams(eventLocationIdParamsSchema),
    getEventLocationLayoutController
);


export default router;