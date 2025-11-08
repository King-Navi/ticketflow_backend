import express from 'express'
import {authRequired, requireRole} from '../middlewares/authVerify.middleware.js'
import { ROLE } from '../model_db/utils/role.js';
import { createEventWithInventoryController } from '../controller/eventInventory.controller.js';
import { getEventSeatsByEventIdController } from '../controller/eventSeat.controller.js';
import { validateEventIdParam } from '../middlewares/validateIdParams.middleware.js';

const router = express.Router();

const EVENTSEAT_ROUTE = "/v1/eventseats";


router.put(
  `${EVENTSEAT_ROUTE}/with-event`,
  authRequired(),
  requireRole(ROLE.ORGANIZER, ROLE.ADMIN),
  createEventWithInventoryController
);


router.get(
  `${EVENTSEAT_ROUTE}/:eventId/seats`,
  authRequired(),
  validateEventIdParam,
  getEventSeatsByEventIdController
);

export default router;