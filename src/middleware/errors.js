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
        res.status(400).send({ status: 400, error: err.details.map(detail => detail.message) });
        break;
      case 'RequestError':
        res.status(err.status).send({ status: err.status, error: err.message });
        break;
      case 'JsonWebTokenError':
        res.status(400).send({ status: 400 , error: err.message });
      default: //Internal server error
        res.status(500).send({ status: 500, error: err.message });
    }
    console.log(err);
    next();
  },
  RequestError
}