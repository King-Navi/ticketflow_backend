import Joi from "joi";

export const passwordForgotBodySchema = Joi.object({
  email: Joi.string().trim().email().max(100).required(),
});

export const passwordResetValidateQuerySchema = Joi.object({
  token: Joi.string().trim().min(10).max(300).required(),
});

export const passwordResetBodySchema = Joi.object({
  token: Joi.string().trim().min(10).max(300).required(),
  newPassword: Joi.string().min(8).max(255).required(),
});
