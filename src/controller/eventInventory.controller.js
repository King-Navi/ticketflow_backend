import { createEventWithInventoryService } from "../service/eventInventory.service.js";
import { createEventWithInventorySchema } from "../middlewares/schemes/eventInventory.scheme.js";

export async function createEventWithInventoryController(req, res) {
  try {
    if (createEventWithInventorySchema) {
      const { error, value } = createEventWithInventorySchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) throw error;
      req.body = value;
    }
    const result = await createEventWithInventoryService(req.body);
    return res.status(201).json(result);

  } catch (err) {
    if (err && err.isJoi) {
      return res.status(400).json({
        msg: "Invalid request body.",
        details: err.details?.map(d => d.message) ?? [],
      });
    }
    const msg = String(err?.message || "");
    if (
      msg === "Payload is required." ||
      msg === "'event' is required." ||
      msg === "'inventory' must be a non-empty array."
    ) {
      return res.status(400).json({ msg });
    }
    if (msg.startsWith("Some seats do not belong to event_location_id")) {
      return res.status(400).json({ msg });
    }
    if (msg.startsWith("Invalid seat status:")) {
      return res.status(400).json({ msg });
    }

    if (msg === "Cannot connect to the database.") {
      return res.status(503).json({ msg });
    }
    if (msg === "Database error occurred.") {
      return res.status(409).json({ msg });
    }
    if (err?.code === "EVENT_TIME_CONFLICT" || String(err?.message) === "This location is already booked for that time range.") {
      return res.status(409).json({ msg: err.message });
    }
    return res.status(500).json({ msg: "Error" });
  }
}
