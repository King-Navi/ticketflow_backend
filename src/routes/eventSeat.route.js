import express from 'express'
import {authRequired, requireRole} from '../middlewares/authVerify.middleware.js'
import { ROLE } from '../model_db/utils/role.js';
import { createEventWithInventoryController } from '../controller/eventInventory.controller.js';

const router = express.Router();

const EVENTSEAT_ROUTE = "/v1/eventseats";


router.put(
  `${EVENTSEAT_ROUTE}/with-event`,
  authRequired(),
  requireRole(ROLE.ORGANIZER, ROLE.ADMIN),
  createEventWithInventoryController
);


export default router;