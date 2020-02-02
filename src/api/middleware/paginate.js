
const escapeRgx = str => str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

module.exports = (req, res, next) => {
  const { search, tags, sort, page, size } = req.query;

  const paginator = {
    query: {},
    sort: {},
    page: parseInt(page) || 1,
    size: parseInt(size) || 10
  };

  if (search) paginator.query.name = new RegExp(escapeRgx(search), 'gi');
  if (tags) paginator.query.tags = { $in: tags.split(',') };

  switch (sort) {
    case 'latest':
      paginator.sort = { updatedAt: -1 };
      break;
    case 'rating':
      paginator.sort = { rating: -1, score: -1, updatedAt: -1 };
      break;
    case 'popular':
      paginator.sort = { nComments: -1, updatedAt: -1 };
  }
  req.paginator = paginator;
  next();
};