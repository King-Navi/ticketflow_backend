import EventRepository from "../../repositories/event.repository.js";
import OrganizerRepository from "../../repositories/organizer.repository.js";

const eventRepo = new EventRepository();
const organizerRepo = new OrganizerRepository();

export async function checkEventOwnership(req, res, next) {
  try {
    const { eventId } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ msg: "Unauthorized" });
    }

    const event = await eventRepo.findById(Number(eventId));
    if (!event) {
      return res.status(404).json({ msg: "Event not found." });
    }

    if (user.role === "admin") {
      req.event = event;
      return next();
    }

    if (user.role === "organizer") {
      const organizer = await organizerRepo.findOrganizerByCredentialId(user.credential_id);
      if (!organizer) {
        return res.status(403).json({ msg: "Organizer not found." });
      }

      if (Number(event.company_id) !== Number(organizer.company_id)) {
        return res.status(403).json({ msg: "You cannot upload images for events of another company." });
      }

      req.event = event;
      return next();
    }

    return res.status(403).json({ msg: "Forbidden" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Error checking event ownership." });
  }
}