import { listAllLocationsService } from "../service/location.service.js";

export async function listAllLocationsController(req, res, next) {
  try {
    const { limit, offset } = req.query;
    const result = await listAllLocationsService({
      limit: limit ?? 50,
      offset: offset ?? 0,
    });

    return res.json(result);
  } catch (err) {
    return next(err);
  }
}
 