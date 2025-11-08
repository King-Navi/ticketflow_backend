import { getEventSeatsByEventIdService } from "../service/eventSeat.service.js";
import { BadRequest, NotFound } from "../utils/errors/error.400.js";

export async function getEventSeatsByEventIdController(req, res) {
  try {
    const eventId =
      req.params?.eventId
        ? Number(req.params.eventId)
        : req.query?.event_id
          ? Number(req.query.event_id)
          : null;

    const result = await getEventSeatsByEventIdService(eventId, {
      transaction: req.tx,
    });

    return res.status(200).json(result);
  } catch (err) {
    if (err instanceof BadRequest) {
      return res.status(400).json({ msg: err.message });
    }
    if (err instanceof NotFound) {
      return res.status(404).json({ msg: err.message });
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
