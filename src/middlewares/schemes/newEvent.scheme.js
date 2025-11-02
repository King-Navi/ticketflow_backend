import Joi from "joi";

/** 24h time: HH:mm o HH:mm:ss */
const TIME_24H = /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

export const newEventSchema = Joi.object({
    event_name: Joi.string().trim().max(150).required().messages({
        "string.empty": `"event_name" is required`,
        "string.max": `"event_name" must not exceed 150 characters`,
    }),

    category: Joi.string().trim().max(100).required().messages({
        "string.empty": `"category" is required`,
        "string.max": `"category" must not exceed 100 characters`,
    }),

    description: Joi.string().trim().max(500).required().messages({
        "string.empty": `"description" is required`,
        "string.max": `"description" must not exceed 500 characters`,
    }),

    // YYYY-MM-DD
    event_date: Joi.date().iso().required().messages({
        "date.base": `"event_date" must be a valid date`,
        "date.format": `"event_date" must be in ISO format (YYYY-MM-DD)`,
        "any.required": `"event_date" is required`,
    }),

    // HH:mm o HH:mm:ss (24h)
    start_time: Joi.string().pattern(TIME_24H).required().messages({
        "string.pattern.base": `"start_time" must be HH:mm or HH:mm:ss (24h)`,
        "string.empty": `"start_time" is required`,
    }),

    // HH:mm o HH:mm:ss (24h) or null
    end_time: Joi.alternatives()
        .try(Joi.string().pattern(TIME_24H), Joi.allow(null))
        .messages({
            "string.pattern.base": `"end_time" must be HH:mm or HH:mm:ss (24h)`,
        }),

    company_id: Joi.number().integer().positive().required().messages({
        "number.base": `"company_id" must be a number`,
        "number.integer": `"company_id" must be an integer`,
        "number.positive": `"company_id" must be positive`,
        "any.required": `"company_id" is required`,
    }),

    event_location_id: Joi.number().integer().positive().required().messages({
        "number.base": `"event_location_id" must be a number`,
        "number.integer": `"event_location_id" must be an integer`,
        "number.positive": `"event_location_id" must be positive`,
        "any.required": `"event_location_id" is required`,
    }),
}).custom((value, helpers) => {
    const { start_time, end_time } = value;

    if (!end_time || end_time === null) return value;

    const pad = (t) => (t.length === 5 ? `${t}:00` : t);
    const s = pad(start_time);
    const e = pad(end_time);

    if (e <= s) {
        return helpers.error("any.custom", {
            message: `"end_time" must be greater than "start_time"`,
        });
    }
    return value;
},
"start/end time validation"
).messages({
    "any.custom": "{{#message}}",
});

