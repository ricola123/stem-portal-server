const crypto = require('crypto');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const path = require('path');

const storage = new GridFsStorage({
    url: process.env.MONGO_URL,
    options: { useUnifiedTopology: true },
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) return reject(err);
                const filename = buf.toString('hex') + '_' + path.basename(file.originalname);
                const fileInfo = {
                    filename,
                    metadata: { uploader: req.user.id },
                    bucketName: 'uploads'
                };
                resolve(fileInfo);
            });
        });
    }
});

module.exports = multer({ storage });