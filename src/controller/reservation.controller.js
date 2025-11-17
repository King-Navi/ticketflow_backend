import { createReservationService } from "../service/reservation.service.js";
import { BadRequest, Conflict, NotFound } from "../utils/errors/error.400.js";

export async function createReservationController(req, res) {
  try {
    const attendee_id = req.user?.id;
    if (!attendee_id) {
      return res.status(401).json({ msg: "Missing attendee in token." });
    }
    const { event_id, event_seat_id, expiration_at } = req.body || {};

    const result = await createReservationService(
      event_id,
      attendee_id,
      event_seat_id,
      expiration_at
    );

    return res.status(201).json(result);

  } catch (err) {
    if (process.env.DEBUG === "true"){
      console.log(err);
    }    
    if (err instanceof BadRequest) {
      return res.status(400).json({ msg: err.message });
    }

    if (err instanceof NotFound) {
      return res.status(404).json({ msg: err.message });
    }

    if (err instanceof Conflict) {
      return res.status(409).json({
        msg: err.message,
        ...(err.meta ? { meta: err.meta } : {}),
      });
    }
    const msg = String(err?.message || "");
    if (msg === "Cannot connect to the database.") {
      return res.status(503).json({ msg });
    }
    if (msg === "Database error occurred.") {
      return res.status(409).json({ msg });
    }
    return res.status(500).json({ msg: "Error", detail: msg });
  }
}