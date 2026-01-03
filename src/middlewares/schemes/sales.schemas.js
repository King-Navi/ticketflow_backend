import Joi from "joi";

const dateOnlySchema = Joi.string()
  .pattern(/^\d{4}-\d{2}-\d{2}$/)
  .message("Date must be in YYYY-MM-DD format.");

const baseSalesQuerySchema = Joi.object({
  companyId: Joi.number().integer().positive().required(),
  startDate: dateOnlySchema.optional(),
  endDate: dateOnlySchema.optional(),
}).unknown(false);

export const organizationSalesReportQuerySchema = baseSalesQuerySchema;
export const ticketSalesDetailQuerySchema = baseSalesQuerySchema;
