import SalesRepository from "../repositories/salesReport.repository.js";
import { BadRequest } from "../utils/errors/error.400.js";

const salesRepo = new SalesRepository();

function toPositiveIntOrUndefined(value, fieldName) {
  if (value === undefined || value === null || value === "") return undefined;

  const num = typeof value === "number" ? value : Number.parseInt(String(value), 10);

  if (!Number.isInteger(num) || num <= 0) {
    throw new BadRequest(`${fieldName} must be a positive integer.`);
  }

  return num;
}

function parseDateOrUndefined(value, fieldName) {
  if (value === undefined || value === null || value === "") return undefined;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new BadRequest(`${fieldName} is not a valid date.`);
    }
    return value.toISOString();
  }
  const raw = String(value).trim();
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(raw);
  if (isDateOnly) {
    const d = new Date(`${raw}T00:00:00Z`);
    if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== raw) {
      throw new BadRequest(`${fieldName} must be a valid date in YYYY-MM-DD format.`);
    }
    return raw;
  }
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    throw new BadRequest(`${fieldName} is not a valid date.`);
  }

  return raw;
}

function normalizeFilters(filters = {}) {
  const companyId = toPositiveIntOrUndefined(filters.companyId, "companyId");
  const startDate = parseDateOrUndefined(filters.startDate, "startDate");
  const endDate = parseDateOrUndefined(filters.endDate, "endDate");

  if (startDate && endDate) {
    const start = new Date(/^\d{4}-\d{2}-\d{2}$/.test(startDate) ? `${startDate}T00:00:00Z` : startDate);
    const end = new Date(/^\d{4}-\d{2}-\d{2}$/.test(endDate) ? `${endDate}T00:00:00Z` : endDate);

    if (start.getTime() > end.getTime()) {
      throw new BadRequest("startDate must be less than or equal to endDate.");
    }
  }

  return { companyId, startDate, endDate };
}

/**
 * Service: Organization sales report (aggregated).
 *
 * @param {{ companyId?: number|string, startDate?: string|Date, endDate?: string|Date }} [filters]
 * @param {{ transaction?: import("sequelize").Transaction }} [options]
 */
export async function getOrganizationSalesReportService(filters = {}, options = {}) {
  const normalized = normalizeFilters(filters);
  return salesRepo.getOrganizationSalesReport(normalized, options);
}

/**
 * Service: Ticket sales detail (per ticket rows).
 *
 * @param {{ companyId?: number|string, startDate?: string|Date, endDate?: string|Date }} [filters]
 * @param {{ transaction?: import("sequelize").Transaction }} [options]
 */
export async function getTicketSalesDetailService(filters = {}, options = {}) {
  const normalized = normalizeFilters(filters);
  return salesRepo.getTicketSalesDetail(normalized, options);
}
