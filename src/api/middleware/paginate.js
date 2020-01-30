
const escapeRgx = str => str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

module.exports = (req, res, next) => {
  const { search, tags, sort, page, size } = req.query;

  const paginator = {
    query: {},
    sort: {},
    page: parseInt(page) || 1,
    size: parseInt(size) || 10,
  };

  if (search) paginator.query.name = new RegExp(escapeRgx(search), 'gi');
  if (tags) paginator.query.tags = { $in: tags.split(',') };

  switch (sort) {
    case 'rating':
      paginator.sort = { rating: -1, score: -1 };
      break;
    case 'created':
      paginator.sort = { createdAt: -1 };
      break;
    case 'updated':
      paginator.sort = { updatedAt: -1 };
      break;
  }
  req.paginator = paginator;
  next();
};