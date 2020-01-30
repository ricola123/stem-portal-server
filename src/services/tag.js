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

  getTags () {
    return Tag.find().select('name references');
  }
}

module.exports = new TagService();