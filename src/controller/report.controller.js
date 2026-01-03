import {
  getOrganizationSalesReportService,
  getTicketSalesDetailService,
} from "../service/report.service.js";

import { NotFound, BadRequest } from "../utils/errors/error.400.js";

function pickFilters(req) {
  const src = req.query ?? {};
  const body = req.body ?? {};

  return {
    companyId: src.companyId ?? body.companyId,
    startDate: src.startDate ?? body.startDate,
    endDate: src.endDate ?? body.endDate,
  };
}

export async function organizationSalesReportController(req, res) {
  try {
    const filters = pickFilters(req);

    const rows = await getOrganizationSalesReportService(filters);

    if (process.env.DEBUG === "true") {
      console.log({ filters, rowsCount: rows.length });
    }

    return res.status(200).json({
      message: "Organization sales report fetched successfully.",
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    if (error instanceof BadRequest) {
      return res.status(error.code).json({ message: error.message });
    }
    if (error instanceof NotFound) {
      return res.status(error.code).json({ message: error.message });
    }

    if (process.env.DEBUG === "true") {
      console.log(error);
    }

    return res.status(500).json({
      message: "Error fetching organization sales report.",
    });
  }
}

export async function ticketSalesDetailController(req, res) {
  try {
    const filters = pickFilters(req);

    const rows = await getTicketSalesDetailService(filters);

    if (process.env.DEBUG === "true") {
      console.log({ filters, rowsCount: rows.length });
    }

    return res.status(200).json({
      message: "Ticket sales detail fetched successfully.",
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    if (error instanceof BadRequest) {
      return res.status(error.code).json({ message: error.message });
    }
    if (error instanceof NotFound) {
      return res.status(error.code).json({ message: error.message });
    }

    if (process.env.DEBUG === "true") {
      console.log(error);
    }

    return res.status(500).json({
      message: "Error fetching ticket sales detail.",
    });
  }
}
