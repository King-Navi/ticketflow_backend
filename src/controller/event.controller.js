import { newEventService } from "../service/event.service.js";


export async function createEventController(req, res) {
    try {
        const organizerCredentialId = req.user?.sub;
        const event_id = await newEventService(req.body, organizerCredentialId);

        return res.status(201).json({ event_id });
    } catch (err) {
        console.log(err)
    }
    return res.status(500).json({ message: "Error" });
}