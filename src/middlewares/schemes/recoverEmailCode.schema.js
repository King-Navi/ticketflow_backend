import Joi from 'joi';


const emailAndCodeSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  code: Joi.string().alphanum().min(6).max(12).required(),
});

export default emailAndCodeSchema;