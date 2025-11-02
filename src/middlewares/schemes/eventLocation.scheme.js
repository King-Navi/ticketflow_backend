import Joi from "joi";


const idSchema = Joi.number().integer().positive();

const safeString = (max) =>
  Joi.string()
    .trim()
    .max(max);

const nullableString = (max) =>
  Joi.alternatives().try(safeString(max), Joi.valid(null, ""));

export const newEventLocationSchema = Joi.object({
  venue_name: safeString(150).required().messages({
    "string.empty": `"venue_name" is required`,
    "string.max": `"venue_name" must not exceed 150 characters`,
  }),
  address_line1: safeString(200).required().messages({
    "string.empty": `"address_line1" is required`,
    "string.max": `"address_line1" must not exceed 200 characters`,
  }),
  address_line2: nullableString(200).messages({
    "string.max": `"address_line2" must not exceed 200 characters`,
  }),
  city: safeString(100).required().messages({
    "string.empty": `"city" is required`,
    "string.max": `"city" must not exceed 100 characters`,
  }),
  state: nullableString(100).messages({
    "string.max": `"state" must not exceed 100 characters`,
  }),
  country: safeString(100).required().messages({
    "string.empty": `"country" is required`,
    "string.max": `"country" must not exceed 100 characters`,
  }),
  postal_code: nullableString(20).messages({
    "string.max": `"postal_code" must not exceed 20 characters`,
  }),
  capacity: Joi.alternatives()
    .try(Joi.number().integer().min(0), Joi.valid(null))
    .messages({
      "number.base": `"capacity" must be a number`,
      "number.integer": `"capacity" must be an integer`,
      "number.min": `"capacity" must be greater than or equal to 0`,
    }),
});

export const newSectionSchema = Joi.object({
  section_name: safeString(100).required().messages({
    "string.empty": `"section_name" is required`,
    "string.max": `"section_name" must not exceed 100 characters`,
  }),
  event_location_id: idSchema.required().messages({
    "number.base": `"event_location_id" must be a number`,
    "number.integer": `"event_location_id" must be an integer`,
    "number.positive": `"event_location_id" must be a positive integer`,
    "any.required": `"event_location_id" is required`,
  }),
});

export const newSeatSchema = Joi.object({
  seat_no: safeString(100).required().messages({
    "string.empty": `"seat_no" is required`,
    "string.max": `"seat_no" must not exceed 100 characters`,
  }),
  row_no: safeString(100).required().messages({
    "string.empty": `"row_no" is required`,
    "string.max": `"row_no" must not exceed 100 characters`,
  }),
  section_id: idSchema.required().messages({
    "number.base": `"section_id" must be a number`,
    "number.integer": `"section_id" must be an integer`,
    "number.positive": `"section_id" must be a positive integer`,
    "any.required": `"section_id" is required`,
  }),
});


export const newSeatsBulkSchema = Joi.object({
  section_id: idSchema.required().messages({
    "number.base": `"section_id" must be a number`,
    "number.integer": `"section_id" must be an integer`,
    "number.positive": `"section_id" must be a positive integer`,
    "any.required": `"section_id" is required`,
  }),
  seats: Joi.array()
    .min(1)
    .items(
      Joi.object({
        seat_no: safeString(100).required().messages({
          "string.empty": `"seats[].seat_no" is required`,
          "string.max": `"seats[].seat_no" must not exceed 100 characters`,
        }),
        row_no: safeString(100).required().messages({
          "string.empty": `"seats[].row_no" is required`,
          "string.max": `"seats[].row_no" must not exceed 100 characters`,
        }),
      })
    )
    .required()
    .messages({
      "array.base": `"seats" must be an array`,
      "array.min": `"seats" must contain at least one element`,
      "any.required": `"seats" is required`,
    }),
});
