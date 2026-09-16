const express = require('express')
const userController = require('../Controller/userController')
const router = express.Router()

router.post('/register', userController.registerUser)
router.post('/login', userController.login)
router.post('/verifyOtp', userController.verifyOtp)
router.post('/resendOtp', userController.resendOtp)
router.post('/forgotPassword', userController.forgotPassword)
router.post('/resetPassword/:token', userController.resetPassword)

module.exports = router