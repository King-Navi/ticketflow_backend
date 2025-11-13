import { Router } from "express";
import { validateBody } from "../middlewares/validateBody.js";
import { authRequired, requireRole } from "../middlewares/authVerify.middleware.js";
import { ROLE } from "../model_db/utils/role.js";
import { buyTicketController } from "../controller/ticket.controller.js";
import {buyTicketSchema} from "../middlewares/schemes/buyTicket.schema.js"
const TICKET_ROUTE = "/v1/ticket";
const router = Router();


//TODO: documentar
router.post(
    `${TICKET_ROUTE}/buy`,
    authRequired(),
    requireRole(ROLE.ATTENDEE),
    validateBody(buyTicketSchema),
    buyTicketController
);

//TODO: /qr/<token>.png que dibuja y devuelve el PNG/SVG.

export default router;




