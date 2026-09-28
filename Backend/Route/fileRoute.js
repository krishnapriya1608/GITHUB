const express = require('express')
const fileController = require('../Controller/fileController')
const authMiddleware = require('../Middleware/authMiddleware')
const uploadZip = require('../Middleware/uploadZip')

const router = express.Router({ mergeParams: true }) // needed to read :projectId

router.use(authMiddleware)

router.post('/upload', uploadZip.single('zipfile'), fileController.uploadProjectZip)
router.post('/search', fileController.searchProject)
router.post('/ask', fileController.askProject)
router.post('/reindex', fileController.reindexProject)
router.get('/', fileController.getProjectFiles)
router.get('/index-status', fileController.getIndexStatus)
router.get('/:fileId', fileController.getFileById)
router.delete('/:fileId', fileController.deleteFile)

module.exports = router