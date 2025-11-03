import { recoverEventsService } from "../service/company.service.js";

export async function recoverEventsController(req, res) {
    try {
        const { companyId } = req.params;
        const {
            limit, offset, dateFrom, dateTo, category,
            full, orderBy, orderDir
        } = req.query;
        const { rows, count } = await recoverEventsService(companyId, {
            limit, offset, dateFrom, dateTo, category, full, orderBy, orderDir
        });

        return res.json({ count, rows });
    } catch (error) {
    }
    return res.status(500).json({ msg: "error" });
}