import { buyTicketService } from "../service/ticket.service.js";
import { BadRequest, Conflict, NotFound } from "../utils/errors/error.400.js";


export async function buyTicketController(req, res) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const attendeeId = user.profile_id ?? user.id;
    if (!attendeeId) {
      return res.status(400).json({
        message: "attendee_id not found in JWT payload.",
      });
    }
    const { event_seat_id, holdMinutes } = req.body ?? {};
    const result = await buyTicketService(event_seat_id, attendeeId, { holdMinutes });
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof BadRequest) {
      return res.status(error.code).json({ message: error.message, meta: error.meta });
    }
    if (error instanceof Conflict) {
      return res.status(error.code).json({ message: error.message, meta: error.meta });
    }
    if (error instanceof NotFound) {
      return res.status(error.code).json({ message: error.message, meta: error.meta });
    }
    if (process.env.DEBUG === "true") {
      console.error("buyTicketController error:", error);
    }
    return res.status(500).json({
      message: "Error creating payment intent for ticket purchase.",
    });
  }
}