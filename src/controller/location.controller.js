import {
    newEventLocationService,
    newSectionService,
    newSeatService,
    newSeatsBulkService,
    listAllLocationsService,
    recoverEventLocationLayoutService
} from "../service/location.service.js";

import {
    newEventLocationSchema,
    newSectionSchema,
    newSeatSchema,
    newSeatsBulkSchema,
} from "../middlewares/schemes/eventLocation.scheme.js";

//TODO: put HTTP codes of /utils/error and /utils/code.http 


export async function createEventLocationController(req, res) {
    try {
        const { error, value } = newEventLocationSchema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });
        if (error) throw error;

        const result = await newEventLocationService(value);
        return res.status(201).json(result); // TODO: specify { event_location_id }
    } catch (err) {
    }
    return res.status(500).json({ msg: "Error" });
}


export async function createSectionController(req, res) {
    try {
        const { error, value } = newSectionSchema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });
        if (error) throw error;

        const result = await newSectionService(value);
        return res.status(201).json(result); // { section_id }
    } catch (err) {
    }
    return res.status(500).json({ msg: "Error" });

}


export async function createSeatController(req, res) {
    try {
        const { error, value } = newSeatSchema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });
        if (error) throw error;

        const result = await newSeatService(value);
        return res.status(201).json(result); // { seat_id }
    } catch (err) {
    }
    return res.status(500).json({ msg: "Error" });

}


export async function bulkCreateSeatsController(req, res) {
    try {
        const { error, value } = newSeatsBulkSchema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });
        if (error) throw error;

        const result = await newSeatsBulkService(value.section_id, value.seats);
        return res.status(201).json(result); // { created }
    } catch (err) {
    }
    return res.status(500).json({ msg: "Error" });

}

export async function listAllLocationsController(req, res, next) {
  try {
    const { limit, offset } = req.query;
    const result = await listAllLocationsService({
      limit: limit ?? 50,
      offset: offset ?? 0,
    });

    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

export async function getEventLocationLayoutController(req, res) {
    try {
        const { eventLocationId } = req.params;

        const payload = await recoverEventLocationLayoutService(eventLocationId);

        return res.status(200).json(payload);
    } catch (err) {
        if (err && err.message === "Invalid eventLocationId.") {
            return res.status(400).json({ msg: err.message });
        }

        if (err && err.message === "Event location not found.") {
            return res.status(404).json({ msg: err.message });
        }
    }

    return res.status(500).json({ msg: "Error" });
}