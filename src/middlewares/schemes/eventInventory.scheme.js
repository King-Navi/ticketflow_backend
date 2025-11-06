import Joi from "joi";

export const AllowedEventSeatStatuses = ["available", "reserved", "blocked", "sold"];

const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const eventCoreSchema = Joi.object({
  event_name: Joi.string().trim().min(1).max(150).required(),
  category: Joi.string().trim().min(1).max(100).required(),
  description: Joi.string().trim().min(1).max(500).required(),

  event_date: Joi.string().trim().pattern(datePattern).required()
    .messages({ "string.pattern.base": `"event_date" must be in YYYY-MM-DD format` }),

  start_time: Joi.string().trim().pattern(timePattern).required()
    .messages({ "string.pattern.base": `"start_time" must be in HH:mm:ss format (24h)` }),

  end_time: Joi.string().trim().pattern(timePattern).allow(null).optional()
    .messages({ "string.pattern.base": `"end_time" must be in HH:mm:ss format (24h)` }),

  company_id: Joi.number().integer().positive().required(),
  event_location_id: Joi.number().integer().positive().required(),

  event_status_id: Joi.number().integer().positive().optional(),
})
  .custom((value, helpers) => {
    if (value.end_time === undefined || value.end_time === null) return value;
    if (value.end_time <= value.start_time) {
      return helpers.error("any.custom", { message: `"end_time" must be greater than "start_time"` });
    }
    return value;
  }, "time order validation");

const inventoryItemSchema = Joi.object({
  seat_id: Joi.number().integer().positive().required(),
  base_price: Joi.number().precision(2).min(0).required(),
  status: Joi.string().valid(...AllowedEventSeatStatuses).default("available"),
  category_label: Joi.string().trim().min(1).max(100).optional(),
}).required();

export const createEventWithInventorySchema = Joi.object({
  event: eventCoreSchema.required(),
  inventory: Joi.array()
    .items(inventoryItemSchema)
    .min(1)
    .unique("seat_id")
    .required(),
});
