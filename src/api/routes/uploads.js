const upload = require('../middleware/upload')
const authorize = require('../middleware/authorize');

const UploadService = require('../../services/upload');

module.exports = router => {
  router.route('/uploads').post(authorize(), upload.single('file'), (req, res) => {
    res.status(201).send({ status: 200, file: req.file });
  });
  router.route('/uploads/:filename').delete(authorize(), async (req, res) => {
    await UploadService.deleteFile(req.params.filename, req.user);
    res.status(204).send();
  });
  router.route('/download/:filename').get(authorize('optional'), async (req, res) => {
    const { gfs, file } = await UploadService.getFile(req.params.filename, req.user);
    res.set('Content-Type', file.contentType);
    res.set('Content-Disposition', 'attachment; filename="' + file.filename + '"');
    gfs.openDownloadStreamByName(req.params.filename).pipe(res);
  });
};