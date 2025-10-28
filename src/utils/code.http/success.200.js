export class HttpSuccess {
  /**
   * @param {string} message - Human-readable message.
   * @param {number} status  - HTTP status code (2xx).
   * @param {any} [data]     - Optional payload to return to the client.
   * @param {Record<string,string>} [headers] - Optional headers to include.
   */
  constructor(message = 'OK', status = 200, data = undefined, headers = {}) {
    this.ok = true;
    this.status = status;       // alias: code if you prefer symmetry with errors
    this.code = status;
    this.message = message;
    this.data = data;
    this.headers = headers;
  }
}

export class Ok extends HttpSuccess {
  constructor(data = undefined, message = 'OK', headers = {}) {
    super(message, 200, data, headers);
    this.name = 'Ok';
  }
}

export class Created extends HttpSuccess {
  constructor(data = undefined, message = 'Created', headers = {}) {
    super(message, 201, data, headers);
    this.name = 'Created';
  }
}

export class Accepted extends HttpSuccess {
  constructor(data = undefined, message = 'Accepted', headers = {}) {
    super(message, 202, data, headers);
    this.name = 'Accepted';
  }
}

export class NoContent extends HttpSuccess {
  constructor(headers = {}) {
    super('No Content', 204, undefined, headers);
    this.name = 'NoContent';
  }
}

export class PartialContent extends HttpSuccess {
  constructor(data = undefined, message = 'Partial Content', headers = {}) {
    super(message, 206, data, headers);
    this.name = 'PartialContent';
  }
}
