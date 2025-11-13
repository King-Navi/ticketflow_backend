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
      console.log(error)
      let badreq = new BadRequest();
      return res.status(400).json({
        status: badreq.name,
        message: error.details.map((d) => d.message).join(", "),
      });
    }
    next();
  };
}

export function validate(schema, source = "body") {
  return function (req, res, next) {
    const { value, error } = schema.validate(req[source], {
      abortEarly: false,
      convert: true,
    });

    if (error) {
      return res.status(400).json({
        message: "Validation error",
        details: error.details.map(d => ({ message: d.message, path: d.path })),
      });
    }

    if (source === "query" || source === "params") {
      Object.assign(req[source], value);
    } else {
      req[source] = value;
    }
    next();
  };
}

export function validateParams(schema) {
  return validate(schema, "params");
}

export function validateQuery(schema) {
  return validate(schema, "query");
}