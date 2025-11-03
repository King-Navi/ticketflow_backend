import Joi from "joi";

export const updateOrganizerBodySchema = Joi.object({
  first_name: Joi.string()
    .trim()
    .min(1)
    .max(100),

  last_name: Joi.string()
    .trim()
    .min(1)
    .max(100),

  middle_name: Joi.alternatives()
    .try(
      Joi.string().trim().min(1).max(100),
      Joi.valid(null)
    ),

  company_id: Joi.alternatives()
    .try(
      Joi.number().integer().positive(),
      Joi.valid(null)
    ),
})
  .or("first_name", "last_name", "middle_name", "company_id")
  .messages({
    "object.missing":
      "At least one of 'first_name', 'last_name', 'middle_name', or 'company_id' is required.",
  });
