import { updateOrganizerProfileService, getOrganizerBasicInfoService } from "../service/organizer.service.js";

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

export async function getOrganizerBasicInfoController(req, res, next) {
  try {
    const credentialId = req.user?.credential_id ?? req.user?.sub;
    if (!credentialId) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    const info = await getOrganizerBasicInfoService(credentialId);

    return res.status(200).json(info);
  } catch (err) {
    if (err.message === "Organizer not found.") {
      return res.status(404).json({ message: "Organizer not found." });
    }
    console.log(err)
    return res.status(500).json({ message: "Internal server error" });
  }
}