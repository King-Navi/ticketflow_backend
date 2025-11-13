import express from 'express';
import { validateBody } from "../middlewares/validateBody.js";
import {updateOrganizerBodySchema} from '../middlewares/schemes/editOrganizer.scheme.js';
import { updateOrganizerProfileController, getOrganizerBasicInfoController } from '../controller/organizer.controller.js'
import { authRequired, requireRole } from '../middlewares/authVerify.middleware.js';
import { ROLE } from '../model_db/utils/role.js';

const router = express.Router();

//TODO: test
const ORGANIZER_ROUTE = "/v1/organizer";


router.patch(`${ORGANIZER_ROUTE}/edit`,
    validateBody(updateOrganizerBodySchema),
    authRequired(),
    requireRole(ROLE.ORGANIZER),    
    updateOrganizerProfileController
);

router.get(
  `${ORGANIZER_ROUTE}/me`,
  authRequired(),
  requireRole(ROLE.ORGANIZER),
  getOrganizerBasicInfoController
);


export default router;