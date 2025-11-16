import Joi from "joi";

export const searchCompanyEventsQuerySchema = Joi.object({
  name: Joi.string().trim().empty(""),

  date: Joi.alternatives()
    .try(
      Joi.date().iso(),
      Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/)
    )
    .empty("")
    .messages({
      "alternatives.match": "date must be an ISO date or 'YYYY-MM-DD'."
    }),

  category: Joi.alternatives()
    .try(
      Joi.string().trim().empty(""),
      Joi.array().items(Joi.string().trim()).min(1)
    )
    .optional(),

  status: Joi.alternatives()
    .try(
      Joi.number().integer().positive(),
      Joi.string().trim().lowercase(),
      Joi.array()
        .items(
          Joi.alternatives().try(
            Joi.number().integer().positive(),
            Joi.string().trim().lowercase()
          )
        )
        .min(1)
    )
    .empty(""),

  limit: Joi.number().integer().min(1).max(500).default(50),
  offset: Joi.number().integer().min(0).default(0),
  orderBy: Joi.string()
    .valid("event_date", "start_time", "created_at")
    .default("event_date"),
  orderDir: Joi.string().valid("ASC", "DESC").insensitive().default("ASC"),
  full: Joi.boolean().default(false)
})
  .or("name", "date", "category", "status")
  .messages({
    "object.missing":
      "At least one of 'name', 'date', 'category' or 'status' must be provided."
  });