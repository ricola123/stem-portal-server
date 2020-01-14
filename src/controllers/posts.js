const Post = require('../models/posts');
const Tag = require('../models/tags');
const User = require('../models/users');

const saveTags = (tags, post_id) => {
  // save or update new tags
  Tag.find({ posts: post_id }).distinct('name', (err, currentTags) => {
    if (err) return;
    const newTags = tags.filter(tag => !currentTags.includes(tag));
    newTags.forEach(tag => {
      Tag.updateOne({ name: tag }, { $push: { posts: post_id } }, { upsert: true }, err => { console.log(err || '') });
    });
    // update (or delete) removed tags
    const removedTags = currentTags.filter(tag => !tags.includes(tag));
    Tag.updateMany({ name: { $in: removedTags } }, { $pull: { posts: post } }, err => {
      console.log(err || '');
      Tag.deleteMany({ posts: { $size: 0 } }, err => { console.log(err || '') });
    });
  });
};

module.exports = {
  create: (req, res) => {
    const { username } = req.decoded;
    User.findOne({ username }, (err, user) => {
      if (err) return res.status(500).send();
      if (user.type !== 'teacher') return res.status(401).send();
      const { author, title, tags, content } = req.body;
      const cid = 0
      post = new Post({ title, author, content, tags, cid });
      saveTags(tags, post._id);
      post.save((err, post) => {
        if (err) return res.status(500).send();
        const tags = post.tags
        const id = post._id
        const author = post.author
        const title = post.title
        const content = post.content
        res.status(201).send({ id, title, author, content, tags });
      });
    });
  },
  getAll: (req, res) => {
    console.log('hi')
    Post.find({}, (err, posts) => {
      if (err) return res.status(500).send();
      console.log(posts[0])
      console.log(posts[0].disliked)
      res.status(200).send(posts);
    });
  },
}