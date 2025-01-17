const Tag = require('../models/tags');

class TagService {

  async updateCourseTags (_courseId, tags) {
    const currentTags = await Tag.find({ courses: _courseId }).distinct('name');
    const tagsToRemove = currentTags.filter(tag => !tags.includes(tag));
    const saveTagOperations = tags
      .filter(tag => !currentTags.includes(tag))
      .map(tag => ({
        updateOne: {
          filter: { name: tag },
          update: { $push: { courses: _courseId }, $inc: { courseReferences: 1 } },
          upsert: true
        }
      }));
    const removeTagOperation = {
      updateMany: {
        filter: { name: { $in: tagsToRemove } },
        update: { $pull: { courses: _courseId }, $inc: { courseReferences: -1 } }
      }
    };
    await Tag.bulkWrite([ ...saveTagOperations, removeTagOperation ]);
    await Tag.deleteMany({ courseReferences: 0, postReferences: 0 });
  }

  async deRegisterCourseTags (_courseId, tags) {
    await Tag.updateMany({ name: { $in: tags } }, { $pull: { courses: _courseId }, $inc: { courseReferences: -1 } });
    await Tag.deleteMany({ courseReferences: 0, postReferences: 0 });
  }

  async updatePostTags (_postId, tags) {
    const currentTags = await Tag.find({ posts: _postId }).distinct('name');
    const tagsToRemove = currentTags.filter(tag => !tags.includes(tag));
    const saveTagOperations = tags
      .filter(tag => !currentTags.includes(tag))
      .map(tag => ({
        updateOne: {
          filter: { name: tag },
          update: { $push: { posts: _postId }, $inc: { postReferences: 1 } },
          upsert: true
        }
      }));
    const removeTagOperation = {
      updateMany: {
        filter: { name: { $in: tagsToRemove } },
        update: { $pull: { posts: _postId }, $inc: { postReferences: -1 } }
      }
    };
    await Tag.bulkWrite([ ...saveTagOperations, removeTagOperation ]);
    await Tag.deleteMany({ postReferences: 0, postReferences: 0 });
  }

  async deRegisterPostTags (_postId, tags) {
    await Tag.updateMany({ name: { $in: tags } }, { $pull: { posts: _postId }, $inc: { postReferences: -1 } });
    await Tag.deleteMany({ postReferences: 0, postReferences: 0 });
  }

  getTags () {
    return Tag.find().select('name postReferences courseReferences');
  }

  getCourseTags () {
    return Tag
      .find({ courseReferences: { $gt: 0 } })
      .sort('-courseReferences')
      .select('name courseReferences');
  }

  getPostTags () {
    return Tag
      .find({ postReferences: { $gt: 0 } })
      .sort('-postReferences')
      .select('name postReferences');
  }
}

module.exports = new TagService();