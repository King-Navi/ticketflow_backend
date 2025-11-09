import Joi from "joi";

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/; // HH:MM:SS 00-23:59:59
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;               // YYYY-MM-DD

export const editEventBodySchema = Joi.object({
  event_name: Joi.string()
    .trim()
    .min(1)
    .max(255),

  category: Joi.string()
    .trim()
    .min(1)
    .max(100),

  description: Joi.string()
    .trim()
    .min(1),

  event_date: Joi.string()
    .pattern(DATE_REGEX)
    .message('"event_date" must be in format YYYY-MM-DD'),

  start_time: Joi.string()
    .pattern(TIME_REGEX)
    .message('"start_time" must be in format HH:MM:SS (24h)'),

  end_time: Joi.alternatives().try(
    Joi.string()
      .pattern(TIME_REGEX)
      .message('"end_time" must be in format HH:MM:SS (24h)'),
    Joi.valid(null)
  ),

  company_id: Joi.number()
    .integer()
    .positive(),

})
  .or(
    "event_name",
    "category",
    "description",
    "event_date",
    "start_time",
    "end_time",
    "company_id",
    "event_location_id"
  )
  .messages({
    "object.missing":
      "At least one of 'event_name', 'category', 'description', 'event_date', 'start_time', 'end_time', 'company_id', or 'event_location_id' is required.",
  });
