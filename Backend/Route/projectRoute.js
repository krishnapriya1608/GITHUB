const express = require('express')
const projectController = require('../Controller/projectController')
const authMiddleware = require('../Middleware/authMiddleware')
const router = express.Router()

router.use(authMiddleware) // every route below requires a valid JWT

router.post('/', projectController.createProject)
router.get('/', projectController.getMyProjects)
router.get('/:id', projectController.getProjectById)
router.put('/:id', projectController.updateProject)
router.delete('/:id', projectController.deleteProject)

module.exports = router