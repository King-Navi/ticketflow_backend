import Joi from "joi";

export const createReservationSchema = Joi.object({
  event_id: Joi.number().integer().positive().required()
    .messages({
      "any.required": "event_id is required.",
      "number.base": "event_id must be a number.",
      "number.integer": "event_id must be an integer.",
      "number.positive": "event_id must be a positive number.",
    }),
  event_seat_id: Joi.number().integer().positive().required()
    .messages({
      "any.required": "event_seat_id is required.",
      "number.base": "event_seat_id must be a number.",
      "number.integer": "event_seat_id must be an integer.",
      "number.positive": "event_seat_id must be a positive number.",
    }),
  expiration_at: Joi.date().iso().messages({
    "date.base": "expiration_at must be a valid ISO date.",
    "date.format": "expiration_at must be a valid ISO date.",
  }),
});
