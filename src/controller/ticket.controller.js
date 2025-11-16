import { buyTicketService, checkInWithQrService, getTicketQrService, getAttendeeTicketsService, refundTicketService } from "../service/ticket.service.js";
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

export async function checkInController(req, res, next) {
  try {
    const { token, scanner_id } = req.body || {};

    if (!token) {
      throw new BadRequest("token is required.");
    }

    const result = await checkInWithQrService({
      token,
      scannerId: scanner_id ?? null,
    });

    return res.status(200).json(result);
  } catch (error) {
    if (process.env.DEBUG === "true") {
      console.log(error)
    }
    return next(error);
  }
}

export async function getTicketQrController(req, res, next) {
  try {
    const { ticketId } = req.params;

    if (!ticketId) {
      throw new BadRequest("ticketId param is required.");
    }
    const attendeeId = req.user?.id;

    const result = await getTicketQrService(Number(ticketId), attendeeId);

    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

export async function getAttendeeTicketsController(req, res, next) {
  try {
    const attendeeId = req.user?.id;
    if (!attendeeId) {
      throw new BadRequest("attendee_id is missing in auth context.");
    }
    const eventStatusCode = req.query.event_status_code || null;

    const result = await getAttendeeTicketsService(
      Number(attendeeId),
      eventStatusCode
    );

    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

export async function refundTicketController(req, res, next) {
  try {
    const { ticketId } = req.params;
    if (!ticketId) {
      throw new BadRequest("ticketId param is required.");
    }

    const attendeeId = req.user?.id;
    if (!attendeeId) {
      throw new BadRequest("attendee_id is missing in auth context.");
    }

    const { reason } = req.body || {};
    if (!reason || typeof reason !== "string") {
      throw new BadRequest("reason is required and must be a string.");
    }

    const result = await refundTicketService({
      ticketId: Number(ticketId),
      attendeeId: Number(attendeeId),
      reason,
    });

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
      console.error("refundTicketController error:", error);
    }
    return next(error);
  }
}