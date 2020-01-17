const Tag = require('../models/tags');

module.exports = {
  read: (req, res, next) => {
    Tag.find().sort('name').distinct('name', (err, tags) => {
      if (err) return res.status(500).send();
      res.status(200).send(tags);
    });
  }
}