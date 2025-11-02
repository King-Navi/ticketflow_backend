import Joi from "joi";

export const listEventsQuerySchema = Joi.object({
    limit: Joi.number().integer().min(1).max(500).default(50),
    offset: Joi.number().integer().min(0).default(0),
    dateFrom: Joi.alternatives().try(Joi.date().iso(), Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/)),
    dateTo: Joi.alternatives().try(Joi.date().iso(), Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/)),
    category: Joi.alternatives().try(
        Joi.string().trim(),
        Joi.array().items(Joi.string().trim()).min(1)
    ),
    full: Joi.boolean().default(false),
    orderBy: Joi.string().valid("event_date", "start_time", "created_at").default("event_date"),
    orderDir: Joi.string().valid("ASC", "DESC").insensitive().default("ASC")
})
    .custom((value, helpers) => {
        const { dateFrom, dateTo } = value;
        if (dateFrom && dateTo) {
            const from = new Date(dateFrom);
            const to = new Date(dateTo);
            if (Number.isFinite(from.getTime()) && Number.isFinite(to.getTime()) && from > to) {
                return helpers.error("any.invalid", { message: "dateFrom must be <= dateTo." });
            }
        }
        return value;
    }, "date range check")
    .messages({
        "any.invalid": "{{#message}}"
    });
