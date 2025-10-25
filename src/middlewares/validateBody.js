import Joi from "joi";
import { BadRequest } from "../utils/errors/error.400.js"
/**
 * Middleware factory to validate req.body using a Joi schema.
 *
 * @param {Joi.ObjectSchema} schema - Joi schema to validate `req.body`.
 *
 * If validation fails:
 *   - Responds with HTTP 400 and the validation error message.
 *
 * Example usage:
 *   router.post('/login', validateBody(loginSchema), loginController);
 */
export function validateBody(schema) {
  return (req, res, next) => {
    if (!req.body || Object.keys(req.body).length === 0) {
      return next(new BadRequest("Request body cannot be empty."));
    }

    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      let badreq = new BadRequest();
      return res.status(400).json({
        status: badreq.name,
        message: error.details.map((d) => d.message).join(", "),
      });
    }
    next();
  };
}

