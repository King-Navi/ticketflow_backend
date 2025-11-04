import Joi from "joi";

export const allowedEventImageTypes = ["cover", "banner", "gallery"];

export const eventImageParamsSchema = Joi.object({
  eventId: Joi.number().integer().positive().required(),
});

export const eventImageBodySchema = Joi.object({
  imageType: Joi.string().valid(...allowedEventImageTypes).default("cover"),
  altText: Joi.string().trim().max(200).allow(null, "").optional(),
  sortOrder: Joi.number().integer().min(0).optional(),
});
