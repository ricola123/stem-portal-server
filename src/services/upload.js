const mongoose = require('mongoose');
const { ResponseError } = require('../utils');

let gfs;
require('../loaders/database').gfs()
    .then(res => gfs = res);

class UploadService {

    async findFile (filename, user) {
        const files = await gfs
            .find({ filename })
    }

    async deleteFile (filename, user) {
        const files = await gfs
            .find({ filename, 'metadata.uploader': user.id })
            .toArray()
        if (files.length !== 1) throw new ResponseError(404, 'unable to find deletable file');

        const [file] = files;
        await gfs.delete(file._id);
    }
}

module.exports = new UploadService();