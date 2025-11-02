import {
    newEventLocationService,
    newSectionService,
    newSeatService,
    newSeatsBulkService,
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
        console.log(err)
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
