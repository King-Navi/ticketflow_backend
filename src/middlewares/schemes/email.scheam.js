import Joi from 'joi';


const emailOnlySchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required(),
});

export default emailOnlySchema;