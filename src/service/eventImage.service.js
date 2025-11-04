import fs from "fs";
import path from "path";
import EventRepository from "../repositories/event.repository.js";
import EventImageRepository from "../repositories/eventImage.repository.js";
import EventImageTypeRepository from "../repositories/eventImageType.repository.js";

const FINAL_BASE = process.env.UPLOAD_BASE || "uploads/events";
//TODO: solve hardcoded
const PUBLIC_BASE = "static/events";
const eventRepo = new EventRepository();
const eventImageRepo = new EventImageRepository();
const eventImageTypeRepo = new EventImageTypeRepository();

/**
 * Orchestrates the event image creation:
 * - checks event exists
 * - checks image type exists
 * - moves file from tmp to final place
 * - creates DB record
 *
 * @param {{
 *  eventId: number|string,
 *  imageTypeCode: string,
 *  altText?: string|null,
 *  sortOrder?: number|null,
 *  tmpFilePath: string,           // req.file.path
 *  originalFilename?: string|null
 * }} input
 * @returns {Promise<{event_image_id:number, image_path:string}>}
 */
export async function createEventImageService(input) {
  const {
    eventId,
    imageTypeCode,
    altText = null,
    sortOrder = null,
    tmpFilePath,
  } = input || {};

  if (!eventId) throw new Error("eventId is required.");
  if (!tmpFilePath) throw new Error("tmpFilePath is required.");
  const event_id = Number(eventId);

  const event = await eventRepo.findById(event_id);
  if (!event) {
    safeUnlink(tmpFilePath);
    const err = new Error("Event not found.");
    err.statusCode = 404;
    throw err;
  }

  const imgType = await eventImageTypeRepo.findByCode(imageTypeCode || "cover");
  if (!imgType) {
    safeUnlink(tmpFilePath);
    const err = new Error(`Unknown image type '${imageTypeCode}'.`);
    err.statusCode = 400;
    throw err;
  }

  const eventDir = path.join(FINAL_BASE, String(event_id));
  if (!fs.existsSync(eventDir)) {
    fs.mkdirSync(eventDir, { recursive: true });
  }
  const finalPath = path.join(eventDir, path.basename(tmpFilePath));
  fs.renameSync(tmpFilePath, finalPath);

  const event_image_id = await eventImageRepo.create({
    event_id,
    event_image_type_id: imgType.event_image_type_id,
    image_path: finalPath,
    alt_text: altText,
    sort_order: sortOrder ? Number(sortOrder) : null,
  });

  const publicPath = `/${PUBLIC_BASE}/${event_id}/${path.basename(finalPath)}`;
  return {
    event_image_id,
    image_path: publicPath,
  };
}

function safeUnlink(p) {
  try {
    if (p && fs.existsSync(p)) {
      fs.unlinkSync(p);
    }
  } catch (_) {
    // ignore
  }
}



/**
 * Get all images for an event and map to public paths
 *
 * @param {number|string} eventId
 * @returns {Promise<{event_id:number, images:Array<object>}>}
 */
export async function getEventImagesService(eventId) {
  const id = Number(eventId);
  if (!Number.isInteger(id) || id <= 0) {
    const err = new Error("'eventId' must be a positive integer.");
    err.statusCode = 400;
    throw err;
  }

  const event = await eventRepo.findById(id);
  if (!event) {
    const err = new Error("Event not found.");
    err.statusCode = 404;
    throw err;
  }

  const raws = await eventImageRepo.findAllByEventId(id);

  // mapeamos para devolver rutas públicas
  const images = raws.map((row) => {
    // si guardaste ruta física:
    const storedPath = row.image_path; // ej: uploads/events/1/xxx.png
    const filename = path.basename(storedPath);
    const publicPath = `/${PUBLIC_BASE}/${id}/${filename}`;

    return {
      event_image_id: row.event_image_id,
      event_id: row.event_id,
      image_type: row.event_image_type
        ? row.event_image_type.code
        : undefined,
      alt_text: row.alt_text,
      sort_order: row.sort_order,
      image_path: publicPath,
    };
  });

  return {
    event_id: id,
    images,
  };
}