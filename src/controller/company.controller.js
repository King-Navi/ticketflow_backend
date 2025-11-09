import { recoverEventsService } from "../service/company.service.js";

export async function recoverEventsController(req, res) {
  try {
    const { companyId } = req.params;
    const {
      limit,
      offset,
      dateFrom,
      dateTo,
      category,
      status,
      name,
      full,
      orderBy,
      orderDir,
      "status[]": statusArray
    } = req.query;
    const effectiveStatus = typeof status !== "undefined" ? status : statusArray;

    const { rows, count } = await recoverEventsService(companyId, {
      limit,
      offset,
      dateFrom,
      dateTo,
      category,
      status: effectiveStatus,
      name,
      full,
      orderBy,
      orderDir
    });

    return res.json({ count, rows });
  } catch (error) {
  }
  return res.status(500).json({ msg: "error" });
}
