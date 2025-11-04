import { createEventImageService, getEventImagesService } from "../service/eventImage.service.js";

export async function createEventImageController(req, res) {
  try {
    const { eventId } = req.params;
    const { imageType, altText, sortOrder } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ msg: "Image file is required (field 'image')." });
    }

    const result = await createEventImageService({
      eventId,
      imageTypeCode: imageType || "cover",
      altText: altText || null,
      sortOrder: sortOrder || null,
      tmpFilePath: file.path,
      originalFilename: file.originalname,
    });

    return res.status(201).json({
      message: "Image uploaded successfully.",
      ...result,
    });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({
      msg: err.message || "Error uploading image.",
    });
  }
}


export async function getEventImagesController(req, res) {
  try {
    const { eventId } = req.params;

    const result = await getEventImagesService(eventId);

    return res.status(200).json(result);
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({
      msg: err.message || "Error retrieving event images.",
    });
  }
}