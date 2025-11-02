import { newEventService, searchCompanyEventsService } from "../service/event.service.js";


export async function createEventController(req, res) {
    try {
        const organizerCredentialId = req.user?.sub;
        const event_id = await newEventService(req.body, organizerCredentialId);

        return res.status(201).json({ event_id });
    } catch (err) {
    }
    return res.status(500).json({ message: "Error" });
}

export async function recoverEventController(req, res) {
    try {
        const result = recoverEventController();
        return res.status(201).json({ msg: "Ok" });
    } catch (err) {
    }
    return res.status(500).json({ message: "Error" });
}

export async function editEventController(req, res) {
    try {
        const result = editEventController();
        return res.status(201).json({ msg: "Ok" });
    } catch (err) {
    }
    return res.status(500).json({ message: "Error" });
}

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

        const { name, date, category, limit, offset, orderBy, orderDir, full } = q;
        const { rows, count } = await searchCompanyEventsService({
            name, date, category, limit, offset, orderBy, orderDir, include: full ? undefined : undefined
        });
        return res.json({ count, rows });
    } catch (err) {
        console.log(err)
    }
    return res.status(500).json({ message: "Error" });
}