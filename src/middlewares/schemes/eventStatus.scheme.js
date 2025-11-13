import Joi from "joi";

const statusSchema = Joi.alternatives()
  .try(
    Joi.number().integer().min(0),  
    Joi.string().trim().pattern(/^\d+$/).custom((v) => +v),
    Joi.string().trim().min(1)  
)
  .required();

export const updateEventStatusBodySchema = Joi.object({
  status: statusSchema,
})
  .prefs({
    convert: true,
    abortEarly: false,
    stripUnknown: true,
  });
