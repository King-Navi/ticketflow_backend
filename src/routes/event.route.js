import express from 'express'
import {authRequired, requireRole} from '../middlewares/authVerify.middleware.js'
import { ROLE } from '../model_db/utils/role.js';
import { createEventController, searchCompanyEventsController } from '../controller/event.controller.js';
import { validateBody, validateParams, validateQuery } from '../middlewares/validateBody.js';
import { newEventSchema } from '../middlewares/schemes/newEvent.scheme.js';
import {searchCompanyEventsQuerySchema} from '../middlewares/schemes/eventSearchSchemas.js';
import {companyIdParamsSchema} from '../middlewares/schemes/companyIdParam.scheme.js';

const router = express.Router();


const EVENT_ROUTE = "/v1/event";


router.put(
    `${EVENT_ROUTE}/new`,
    authRequired(),
    requireRole(ROLE.ORGANIZER),
    validateBody(newEventSchema),
    createEventController,
);

router.get(
  `${EVENT_ROUTE}/events/search`,
  validateQuery(searchCompanyEventsQuerySchema),
  searchCompanyEventsController
);


//Recuperar evento

//EDitar evento

//BorrarEvento



export default router;