import Joi from "joi";

const registerSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .max(100)
    .required()
    .messages({
      "string.empty": `"email" is required`,
      "string.email": `"email" must be a valid email address`,
      "string.max": `"email" must not exceed 100 characters`,
    }),

  nickname: Joi.string()
    .trim()
    .max(100)
    .allow(null, "")
    .messages({
      "string.max": `"nickname" must not exceed 100 characters`,
    }),

  passwordHash: Joi.string()
    .trim()
    .min(6)
    .max(255)
    .required()
    .messages({
      "string.empty": `"passwordHash" is required`,
      "string.min": `"passwordHash" must have at least 6 characters`,
      "string.max": `"passwordHash" must not exceed 255 characters`,
    }),

  role: Joi.string()
    .valid("attendee", "organizer")
    .required()
    .messages({
      "any.only": `"role" must be one of 'attendee', 'organizer', or 'admin'`,
      "string.empty": `"role" is required`,
    }),

  attendee: Joi.object({
    firstName: Joi.string().trim().max(100).required()
      .messages({
        "string.empty": `"attendee.firstName" is required`,
        "string.max": `"attendee.firstName" must not exceed 100 characters`,
      }),
    lastName: Joi.string().trim().max(100).required()
      .messages({
        "string.empty": `"attendee.lastName" is required`,
        "string.max": `"attendee.lastName" must not exceed 100 characters`,
      }),
    middleName: Joi.string().trim().max(100).allow(null, "")
      .messages({
        "string.max": `"attendee.middleName" must not exceed 100 characters`,
      }),
  }).when("role", { is: "attendee", then: Joi.required(), otherwise: Joi.forbidden() }),

  organizer: Joi.object({
    firstName: Joi.string().trim().max(100).required()
      .messages({
        "string.empty": `"organizer.firstName" is required`,
        "string.max": `"organizer.firstName" must not exceed 100 characters`,
      }),
    lastName: Joi.string().trim().max(100).required()
      .messages({
        "string.empty": `"organizer.lastName" is required`,
        "string.max": `"organizer.lastName" must not exceed 100 characters`,
      }),
    middleName: Joi.string().trim().max(100).allow(null, "")
      .messages({
        "string.max": `"organizer.middleName" must not exceed 100 characters`,
      }),
    idCompany: Joi.number().integer().positive().allow(null),
  }).when("role", { is: "organizer", then: Joi.required(), otherwise: Joi.forbidden() }),
});

export default registerSchema;
