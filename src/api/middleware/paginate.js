const ResponseError = require('../../utils').ResponseError;

const escapeRgx = str => str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

const backDate = Date.now() - 1000 * 60 * 60 * 24; // 1 day
const sortOptions = {
  course: {
    latest: { updatedAt: -1 },
    rating: { rating: -1, score: -1, updatedAt: -1 },
    popular: { nComments: -1, updatedAt: -1 }
  },
  post: {
    latest: { updatedAt: -1 },
    rating: { rating: -1, nLikes: -1, updatedAt: -1 },
    popular: { nComments: -1, rating: -1, nLikes: -1, updatedAt: -1 }
  }
};

module.exports = docType => {
  if (!docType) throw new ResponseError(500, 'internal server error');
  return (req, res, next) => {
    const { search, tags, sort, page, size } = req.query;

    const paginator = {
      query: {},
      sort: {},
      page: parseInt(page) || 1,
      size: parseInt(size) || 10
    };

    if (docType === 'post' && ['rating', 'popular'].includes(sort)) paginator.query.createdAt = { $gt: backDate };
    if (search) paginator.query[docType === 'post' ? 'title' : 'name'] = new RegExp(escapeRgx(search), 'gi');
    if (tags) paginator.query.tags = { $in: tags.split(',') };

    paginator.sort = sortOptions[docType][sort];

    req.paginator = paginator;
    next();
  };
}