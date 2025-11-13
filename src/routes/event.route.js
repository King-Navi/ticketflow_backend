import express from 'express'
import {authRequired, requireRole} from '../middlewares/authVerify.middleware.js'
import { ROLE } from '../model_db/utils/role.js';
import { createEventController, searchCompanyEventsController, editEventController, updateEventStatusController } from '../controller/event.controller.js';
import { validateBody, validateParams, validateQuery } from '../middlewares/validateBody.js';
import { newEventSchema } from '../middlewares/schemes/newEvent.scheme.js';
import {searchCompanyEventsQuerySchema} from '../middlewares/schemes/eventSearchSchemas.js';
import {editEventBodySchema} from '../middlewares/schemes/editEvent.scheme.js';
import { validateEventIdParam } from '../middlewares/validateIdParams.middleware.js';
import { updateEventStatusBodySchema } from '../middlewares/schemes/eventStatus.scheme.js';

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
  `${EVENT_ROUTE}/search`,
  validateQuery(searchCompanyEventsQuerySchema),
  searchCompanyEventsController
);



router.patch(
  `${EVENT_ROUTE}/edit/:eventId`,
  authRequired(),
  requireRole(ROLE.ORGANIZER),
  validateEventIdParam,
  validateBody(editEventBodySchema),
  editEventController
);

router.patch(
  `${EVENT_ROUTE}/:eventId/status`,
  authRequired(),
  requireRole(ROLE.ORGANIZER, ROLE.ADMIN),
  validateEventIdParam,
  validateBody(updateEventStatusBodySchema),
  updateEventStatusController
);

//TODO: BorrarEvento



export default router;