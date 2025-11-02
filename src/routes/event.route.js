import express from 'express'
import {authRequired, requireRole} from '../middlewares/authVerify.middleware.js'
import { ROLE } from '../model_db/utils/role.js';
import { createEventController } from '../controller/event.controller.js';
import { validateBody } from '../middlewares/validateBody.js';
import { newEventSchema } from '../middlewares/schemes/event.scheme.js';

const router = express.Router();


const EVENT_ROUTE = "/v1/event";


router.put(
    `${EVENT_ROUTE}/new`,
    authRequired(),
    requireRole(ROLE.ORGANIZER),
    validateBody(newEventSchema),
    createEventController,
);


export default router;