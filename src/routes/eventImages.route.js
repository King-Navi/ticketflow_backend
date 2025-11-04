import express from "express";
import { authRequired, requireRole } from "../middlewares/authVerify.middleware.js";
import { ROLE } from "../model_db/utils/role.js";
import { uploadEventImage } from "../middlewares/uploadEventImage.middleware.js";
import { createEventImageController } from "../controller/eventImage.controller.js";

import {
  validateParams,
  validate,
} from "../middlewares/validateBody.js";
import {
  eventImageParamsSchema,
  eventImageBodySchema,
} from "../middlewares/schemes/eventImage.scheme.js";
import { validateEventIdParam } from "../middlewares/validateIdParams.middleware.js";

const EVENT_IMG_ROUTE = "/v1/event/img";


const router = express.Router();

router.post(
  `${EVENT_IMG_ROUTE}/:eventId/new`,
  authRequired(),
  requireRole(ROLE.ORGANIZER, ROLE.ADMIN),
  validateEventIdParam,
  uploadEventImage.single("image"),
  validateParams(eventImageParamsSchema),
  validate(eventImageBodySchema, "body"), 
  createEventImageController
);

export default router;
