import Joi from "joi";

export const eventIdParamSchema = Joi.object({
  eventId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      "any.required": "Path param 'eventId' is required.",
      "number.base": "'eventId' must be a number.",
      "number.integer": "'eventId' must be an integer.",
      "number.positive": "'eventId' must be > 0."
    })
});
