import express from 'express'
import { authRequired, requireRole } from '../middlewares/authVerify.middleware.js'
import { ROLE } from '../model_db/utils/role.js';
import {
    createEventLocationController,
    createSectionController,
    createSeatController,
    bulkCreateSeatsController
} from '../controller/location.controller.js';
import { validateBody } from '../middlewares/validateBody.js';
import { newEventLocationSchema, newSeatSchema, newSeatsBulkSchema, newSectionSchema } from '../middlewares/schemes/eventLocation.scheme.js';
const router = express.Router();


const LOCATION_ROUTE = "/v1/location";


router.put(
    `${LOCATION_ROUTE}/newEventLocation`,
    authRequired(),
    requireRole(ROLE.ADMIN),
    validateBody(newEventLocationSchema),
    createEventLocationController
);

router.put(
    `${LOCATION_ROUTE}/newSection`,
    authRequired(),
    requireRole(ROLE.ADMIN),
    validateBody(newSectionSchema),
    createSectionController
);

router.put(
    `${LOCATION_ROUTE}/newSeat`,
    authRequired(),
    requireRole(ROLE.ADMIN),
    validateBody(newSeatSchema),
    createSeatController
);

router.put(
    `${LOCATION_ROUTE}/newBulkSeat`,
    authRequired(),
    requireRole(ROLE.ADMIN),
    validateBody(newSeatsBulkSchema),
    bulkCreateSeatsController
);

export default router;