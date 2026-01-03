import express from "express";
import { authRequired, requireRole } from "../middlewares/authVerify.middleware.js";
import { validateQuery } from "../middlewares/validateBody.js";
import { ROLE } from "../model_db/utils/role.js";

import {
  organizationSalesReportController,
  ticketSalesDetailController,
} from "../controller/report.controller.js";

import {
  organizationSalesReportQuerySchema,
  ticketSalesDetailQuerySchema,
} from "../middlewares/schemes/sales.schemas.js";

const router = express.Router();

const REPORT_ROUTE = "/v1/report";

router.get(
  `${REPORT_ROUTE}/sales`,
  authRequired(),
  requireRole(ROLE.ORGANIZER, ROLE.ADMIN),
  validateQuery(organizationSalesReportQuerySchema),
  organizationSalesReportController
);

router.get(
  `${REPORT_ROUTE}/sales/details`,
  authRequired(),
  requireRole(ROLE.ORGANIZER, ROLE.ADMIN),
  validateQuery(ticketSalesDetailQuerySchema),
  ticketSalesDetailController
);

export default router;