import Joi from "joi";

export const eventLocationIdParamsSchema = Joi.object({
    eventLocationId: Joi.number()
        .integer()
        .positive()
        .required()
});
