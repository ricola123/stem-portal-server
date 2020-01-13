const Post = require('../models/posts');
const Tag = require('../models/tags');
const User = require('../models/users');

// const saveTags = (tags, course_id) => {
//   // save or update new tags
//   Tag.find({ courses: course_id }).distinct('name', (err, currentTags) => {
//     if (err) return;
//     const newTags = tags.filter(tag => !currentTags.includes(tag));
//     newTags.forEach(tag => {
//       Tag.updateOne({ name: tag }, { $push: { courses: course_id } }, { upsert: true }, err => { console.log(err || '') });
//     });
//     // update (or delete) removed tags
//     const removedTags = currentTags.filter(tag => !tags.includes(tag));
//     Tag.updateMany({ name: { $in: removedTags } }, { $pull: { courses: course_id } }, err => {
//       console.log(err || '');
//       Tag.deleteMany({ courses: { $size: 0 } }, err => { console.log(err || '') });
//     });
//   });
// };
module.exports = {
  create: (req, res) => {
    const { username } = req.decoded;
    User.findOne({ username }, (err, user) => {
      if (err) return res.status(500).send();
      if (user.type !== 'teacher') return res.status(401).send();
      const { author, title, tags, content } = req.body;
      post = new Post({ title, author, content });
      post.save((err, post) => {
        if (err) return res.status(500).send();
        const id = post._id
        const author = post.author
        const title = post.title
        const content = post.content
        res.status(201).send({ id, title, author, content });
      });
    });
  },
  getAll: (req, res) => {

  }
}