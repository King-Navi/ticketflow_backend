export class ConflictError extends Error {
  constructor(message = "Resource conflict", details = {}) {
    super(message);
    this.name = "ConflictError";
    this.statusCode = 409;
    this.code = "EVENT_TIME_CONFLICT";
    this.details = details;
  }
}
