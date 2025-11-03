export function validateEventIdParam(req, res, next) {
  const { eventId } = req.params;

  if (eventId === undefined) {
    return res.status(400).json({
      message: "Path param 'eventId' is required."
    });
  }
  const num = Number(eventId);
  if (!Number.isInteger(num) || num <= 0) {
    return res.status(400).json({
      message: "'eventId' must be a positive integer."
    });
  }
  req.params.eventId = num;

  next();
}
