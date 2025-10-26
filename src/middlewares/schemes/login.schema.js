import Joi from "joi";
const loginSchema = Joi.object({
  username: Joi.string().trim().min(3).max(50).required()
    .messages({
      "string.empty": `"username" is required`,
      "string.min": `"username" must have at least 3 characters`,
    }),
  passwordHash: Joi.string().trim().min(6).required()
    .messages({
      "string.empty": `"passwordHash" is required`,
      "string.min": `"passwordHash" must have at least 6 characters`,
    }),
});
export default loginSchema;