const mongoose = require('mongoose');
const { ResponseError } = require('../utils');

let gfs;
require('../loaders/database').gfs()
  .then(res => gfs = res);

class UploadService {

  async getFile (filename, user) {
    const files = await gfs
      .find({ filename })
      .toArray()
    if (!files.length) throw new ResponseError(404, 'unable to find requested file');

    const file = files[0];
    if (file.metadata.type === 'teaching-materials') {
      if (!user) throw new ResponseError(401, 'unauthorized access');
      if (user.type !== 'teacher') throw new ResponseError(403, 'forbidden');
      // await TeacherCircleService.consumeMaterial
    }
    return { gfs, file };
  }

  async getFileMetadatas (filenames) {
    const files = await gfs
      .find({ filename: { $in: filenames } })
      .toArray()
    if (!files.length) throw new ResponseError(404, 'unable to find the requested file');
    return files;
  }

  async deleteFile (filename, user) {
    const files = await gfs
      .find({ filename, 'metadata.uploader': user.id })
      .toArray()
    if (!files.length) throw new ResponseError(404, 'unable to find deletable file');

    const file = files[0];
    await gfs.delete(file._id);
  }
}

module.exports = new UploadService();