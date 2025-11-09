import Joi from "joi";

const seatId = Joi.number().integer().positive().required();

export const buyTicketSchema = Joi.object({
  event_seat_id: Joi.alternatives().try(
    seatId,
    Joi.array().items(
      Joi.number().integer().positive().required()
    ).min(1)
  ).required()
    .messages({
      "any.required": "event_seat_id is required.",
      "alternatives.match": "event_seat_id must be a number or an array of numbers.",
    }),
  holdMinutes: Joi.number().integer().min(1).max(60)
    .optional()
    .messages({
      "number.base": "holdMinutes must be a number.",
      "number.min": "holdMinutes must be at least 1.",
    }),
});
