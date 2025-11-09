import { ConflictError } from "../service/error/classes.js";
import { editEventService, newEventService, searchCompanyEventsService, updateEventStatusService } from "../service/event.service.js";
import { Unauthorized } from "../utils/errors/error.400.js";


export async function createEventController(req, res) {
  try {
    const organizerCredentialId = req.user?.sub;
    const event_id = await newEventService(req.body, organizerCredentialId);

    return res.status(201).json({ event_id });
  } catch (err) {
    if (err instanceof ConflictError) {
      return res.status(err.statusCode).json({
        message: err.message,
        code: err.code
      });
    }
    if (err instanceof Unauthorized) {
      return res.status(err.code).json({
        message: err.message,
        code: err.name
      });
    }
  }
  return res.status(500).json({ message: "Error" });
}


export async function editEventController(req, res) {
  try {
    const organizerCredentialId = req.user?.sub;
    const { eventId } = req.params;
    const payload = req.body;
    const updatedEvent = await editEventService(eventId, payload, organizerCredentialId);
    return res.status(200).json({
      message: "Event updated successfully.",
      event: updatedEvent,
    });
  } catch (err) {
    if (err instanceof ConflictError || err.code === "EVENT_TIME_CONFLICT" || err.statusCode === 409) {
      return res.status(409).json({
        message: "This location is already booked for that time range.",
        code: "EVENT_TIME_CONFLICT",
      });
    }
    if (err.message === "Event not found.") {
      return res.status(404).json({
        message: "Event not found.",
      });
    }
    if (
      err.message === "Organizer cannot edit this event." ||
      err.message === "Organizer for this credential does not exist." ||
      err.message === "Organizer cannot move this event to another company."
    ) {
      return res.status(403).json({
        message: err.message,
      });
    }
    if (
      err.message === "event_name cannot be empty." ||
      err.message === "category cannot be empty." ||
      err.message === "description cannot be empty." ||
      err.message === "event_date cannot be empty." ||
      err.message === "start_time cannot be empty." ||
      err.message === "end_time must be greater than start_time." ||
      err.message === "company_id cannot be null." ||
      err.message === "event_location_id cannot be null."
    ) {
      return res.status(400).json({
        message: err.message,
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}


//TODO:
export async function deleteEventController(req, res) {
  try {
    const result = deleteEventController();
    return res.status(201).json({ msg: "Ok" });
  } catch (err) {
  }
  return res.status(500).json({ message: "Error" });
}

export async function searchCompanyEventsController(req, res) {
  try {
    const q = (res.locals?.validated?.query) ?? req.query;

    const {
      name,
      date,
      category,
      status,
      limit,
      offset,
      orderBy,
      orderDir,
      full
    } = q;
    const { rows, count } = await searchCompanyEventsService({
      name,
      date,
      category,
      status,
      limit,
      offset,
      orderBy,
      orderDir,
      include: full ? undefined : undefined
    });
    return res.json({ count, rows });
  } catch (err) {
    if(process.env.DEBUG === "true"){
      console.error(err)
    }
  }
  return res.status(500).json({ message: "Error" });
}

export async function updateEventStatusController(req, res) {
  try {
    const { eventId } = req.params;
    const { status } = req.body;
    const organizerCredentialId =
      req.user?.credential_id ||
      req.user?.sub ||
      null;

    const updated = await updateEventStatusService(
      eventId,
      status,
      organizerCredentialId
    );
    return res.status(200).json({
      message: "Event status updated successfully.",
      event: updated,
    });
  } catch (error) {
    if (process.env.DEBUG === "true") {
      console.error("[updateEventStatus] ERROR ->", error);
    }

    if (error instanceof Unauthorized) {
      return res.status(error.code ?? 401).json({ message: error.message });
    }
    if (error instanceof ConflictError) {
      return res.status(error.code ?? 409).json({
        message: error.message,
        details: error.details ?? undefined,
      });
    }
    if (error?.message === "Organizer for this credential does not exist.") {
      return res.status(401).json({ message: error.message });
    }
    if (error?.message === "Event not found.") {
      return res.status(404).json({ message: error.message });
    }
    if (error?.message === "Invalid event status id.") {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Error updating event status." });
  }
}