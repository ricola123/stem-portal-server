class RequestError extends Error {
  constructor (status, message) {
    super();
    this.status = status;
    this.message = message;
    this.name = 'RequestError';
  }
}

module.exports = {
  errorHandler: (err, req, res, next) => {
    switch (err.name) {
      case 'ValidationError':
      case 'JsonWebTokenError':
        res.status(400).send({ status: 400, error: err.message });
        break;
      case 'RequestError':
        res.status(err.status).send({ status: err.status, error: err.message });
        break;
      default: //Internal server error
        res.status(500).send({ status: 500, error: 'internal server error' });
        console.log(err);
    }
    next();
  },
  RequestError
}