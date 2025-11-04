import EventRepository from "../repositories/event.repository.js";

/**
 * Recover events for a company with filtering/pagination.
 *
 * @param {number|string} companyId
 * @param {object} options
 * @param {number} [options.limit=50]
 * @param {number} [options.offset=0]
 * @param {string|Date} [options.dateFrom]
 * @param {string|Date} [options.dateTo]
 * @param {string|string[]} [options.category]
 * @param {boolean} [options.full=false]
 * @param {string} [options.orderBy="event_date"] // "event_date" | "start_time" | "created_at"
 * @param {string} [options.orderDir="ASC"]       // "ASC" | "DESC"
 * @returns {Promise<{rows: any[], count: number}>}
 */
export async function recoverEventsService(
  companyId,
  {
    limit = 50,
    offset = 0,
    dateFrom,
    dateTo,
    category,
    full = false,
    orderBy = "event_date",
    orderDir = "ASC",
  } = {}
) {
  const repo = new EventRepository();

  const norm = {
    limit: Number(limit),
    offset: Number(offset),
    dateFrom: dateFrom ?? undefined,
    dateTo: dateTo ?? undefined,
    category,
    full: typeof full === "string" ? full.toLowerCase() === "true" : Boolean(full),
    orderBy: String(orderBy),
    orderDir: String(orderDir).toUpperCase() === "DESC" ? "DESC" : "ASC",
  };

  const order = [[norm.orderBy, norm.orderDir]];
  if (norm.orderBy !== "start_time") {
    order.push(["start_time", "ASC"]);
  }

  return repo.findAllByCompanyId(Number(companyId), {
    limit: norm.limit,
    offset: norm.offset,
    dateFrom: norm.dateFrom,
    dateTo: norm.dateTo,
    category: norm.category,
    full: norm.full,
    order,
  });
}
