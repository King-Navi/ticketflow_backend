import { Router } from "express";
import { validateBody } from "../middlewares/validateBody.js";
import { authRequired, requireRole } from "../middlewares/authVerify.middleware.js";
import { ROLE } from "../model_db/utils/role.js";
import { buyTicketController, checkInController, getTicketQrController, getAttendeeTicketsController, refundTicketController } from "../controller/ticket.controller.js";
import {buyTicketSchema} from "../middlewares/schemes/buyTicket.schema.js"
const TICKET_ROUTE = "/v1/ticket";
const router = Router();


router.post(
    `${TICKET_ROUTE}/buy`,
    authRequired(),
    requireRole(ROLE.ATTENDEE),
    validateBody(buyTicketSchema),
    buyTicketController
);

router.post(
    `${TICKET_ROUTE}/check-in`,
    checkInController
);

router.get(
  `${TICKET_ROUTE}/:ticketId/qr`,
  authRequired(),
  requireRole(ROLE.ATTENDEE),
  getTicketQrController
);


router.get(
  `${TICKET_ROUTE}/my-event`,
  authRequired(),
  requireRole(ROLE.ATTENDEE),
  getAttendeeTicketsController
);


// TODO: doc
router.post(
  `${TICKET_ROUTE}/:ticketId/refund`,
  authRequired(),
  requireRole(ROLE.ATTENDEE),
  // TODO: esquema con razón, etc:
  // validateBody(refundTicketSchema),
  refundTicketController
);


export default router;




