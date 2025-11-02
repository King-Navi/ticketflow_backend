import Joi from "joi";

export const companyIdParamsSchema = Joi.object({
    companyId: Joi.number().integer().positive().required()
});
