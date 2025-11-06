import { Router } from "express";
import { createReservationController } from "../controller/reservation.controller.js";
import { createReservationSchema } from "../middlewares/schemes/reservation.scheme.js";
import { validate } from "../middlewares/validateBody.js"; // tu archivo
import { authRequired, requireRole } from "../middlewares/authVerify.middleware.js";
import { ROLE } from "../model_db/utils/role.js";


const RESERVATION_ROUTE = "/v1/reservations";


const router = Router();

router.post(
  `${RESERVATION_ROUTE}/reserve`,
  authRequired(),
  requireRole(ROLE.ATTENDEE),
  validate(createReservationSchema),
  createReservationController
);

export default router;
