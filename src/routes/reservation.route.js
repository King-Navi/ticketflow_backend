import { Router } from "express";
import { createReservationController } from "../controller/reservation.controller.js";
import { createReservationSchema } from "../middlewares/schemes/reservation.scheme.js";
import { validate } from "../middlewares/validateBody.js"; // tu archivo


const RESERVATION_ROUTE = "/v1/reservations";


const router = Router();

router.post(
  "/reserve",
  validate(createReservationSchema),
  createReservationController
);

export default router;
