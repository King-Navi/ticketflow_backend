import { updateOrganizerProfileService } from "../service/organizer.service.js";

export async function updateOrganizerProfileController(req, res, next) {
  try {
    const credentialId = req.user?.sub;
    const updated = await updateOrganizerProfileService(credentialId, req.body);

    return res.status(200).json({
      message: "Organizer profile updated successfully.",
      organizer: updated,
    });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
}
