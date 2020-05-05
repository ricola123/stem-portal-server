const upload = require('../middleware/upload')
const authorize = require('../middleware/authorize');

const UploadService = require('../../services/upload');

module.exports = router => {
    router.route('/uploads').post(authorize(), upload.single('file'), (req, res) => {
        res.status(201).send({ file: req.file });
    });
    router.route('/uploads/:filename').delete(authorize(), async (req, res) => {
        await UploadService.deleteFile(req.params.filename, req.user);
        res.status(204).send();
    });
    router.route('/uploads/:filename').get(authorize('optional'), async (req, res) => {
        const gfs = await UploadService.findFile(req.params.filename, req.user);
        gfs.openDownloadStreamByName(req.params.filename).pipe(res);
    });
};