
class ResponseError extends Error {
  constructor (status, message) {
    super();
    this.status = status;
    this.message = message;
    this.name = 'ResponseError';
  }
}

module.exports = {
  ResponseError
};