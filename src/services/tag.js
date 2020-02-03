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
          update: { $push: { courses: _courseId }, $inc: { references: 1 } },
          upsert: true
        }
      }));
    const removeTagOperation = {
      updateMany: {
        filter: { name: { $in: tagsToRemove } },
        update: { $pull: { courses: _courseId }, $inc: { references: -1 } }
      }
    };
    await Tag.bulkWrite([ ...saveTagOperations, removeTagOperation ]);
    await Tag.deleteMany({ references: 0 });
  }

  async deRegisterCourseTags (_courseId) {
    await Tag.updateMany({ courses: _courseId }, { $pull: { courses: _courseId } });
    await Tag.deleteMany({ references: 0 });
  }

  async updatePostTags (_postId, tags) {
    const currentTags = await Tag.find({ posts: _postId }).distinct('name');
    const tagsToRemove = currentTags.filter(tag => !tags.includes(tag));
    const saveTagOperations = tags
      .filter(tag => !currentTags.includes(tag))
      .map(tag => ({
        updateOne: {
          filter: { name: tag },
          update: { $push: { posts: _postId }, $inc: { references: 1 } },
          upsert: true
        }
      }));
    const removeTagOperation = {
      updateMany: {
        filter: { name: { $in: tagsToRemove } },
        update: { $pull: { posts: _postId }, $inc: { references: -1 } }
      }
    };
    await Tag.bulkWrite([ ...saveTagOperations, removeTagOperation ]);
    await Tag.deleteMany({ references: 0 });
  }

  async deRegisterPostTags (_postId) {
    await Tag.updateMany({ posts: _postId }, { $pull: { posts: _postId } });
    await Tag.deleteMany({ references: 0 });
  }

  getTags () {
    return Tag.find().select('name references');
  }
}

module.exports = new TagService();