const express = require('express')
const fileController = require('../Controller/fileController')
const authMiddleware = require('../Middleware/authMiddleware')
const uploadZip = require('../Middleware/uploadZip')

const router = express.Router({ mergeParams: true }) // needed to read :projectId

router.use(authMiddleware)

router.post('/upload', uploadZip.single('zipfile'), fileController.uploadProjectZip)
router.post('/search', fileController.searchProject)
router.post('/ask-stream', fileController.askProjectStream)
router.get('/messages', fileController.getChatHistory)
router.delete('/messages', fileController.clearChatHistory)
router.get('/analysis', fileController.getProjectAnalysis)
router.get('/analysis/summary', fileController.getProjectSummary)
router.post('/ask', fileController.askProject)
router.post('/reindex', fileController.reindexProject)
router.get('/', fileController.getProjectFiles)
router.get('/index-status', fileController.getIndexStatus)
router.get('/:fileId', fileController.getFileById)
router.delete('/:fileId', fileController.deleteFile)
router.post('/import-github', fileController.importFromGithub)

module.exports = router