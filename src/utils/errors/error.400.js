//TODO: i18n
class BadRequest extends Error {
  constructor(message = "Client error, check request syntax") {
    super(message);
    this.name = "BadRequest";
    this.code = 400;
  }
}

class Unauthorized extends Error {
  constructor(message = "Lacks valid authentication credentials") {
    super(message);
    this.name = "Unauthorized";
    this.code = 401;
  }
}

class Teapot extends Error {
  constructor(message = "I’m a teapot") {
    super(message);
    this.name = "Teapot";
    this.code = 418;
  }
}

export { BadRequest, Unauthorized, Teapot };
