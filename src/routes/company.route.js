import express from 'express'
import { validateParams, validateQuery } from '../middlewares/validateBody.js';
import { recoverEventsController } from '../controller/company.controller.js';
import {listEventsQuerySchema} from '../middlewares/schemes/recoverEvent.scheme.js';
import {companyIdParamsSchema} from '../middlewares/schemes/companyIdParam.scheme.js';
const router = express.Router();


const COMPANIES_ROUTE = "/v1/company";



router.get(
    `${COMPANIES_ROUTE}/:companyId/events`,
    validateParams(companyIdParamsSchema),
    validateQuery(listEventsQuerySchema),
    recoverEventsController
);


export default router;