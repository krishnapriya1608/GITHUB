const bcrypt = require('bcrypt')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const User = require('../Schema/userSchema')
const sendMail = require('../utils/SendMail')

const FRONTEND_URL = process.env.FRONTEND_URL

// ---------------- REGISTER ----------------
exports.registerUser = async (req, res) => {
    console.log("Inside register User")
    try {
        const { name, email, password, role } = req.body

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Please fill all required fields" })
        }

        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" })
        }

        const otp = Math.floor(100000 + Math.random() * 900000) // always 6 digits
        const hashOtp = await bcrypt.hash(otp.toString(), 10)
        const passwordHash = await bcrypt.hash(password, 10)

        const newUser = new User({
            name,
            email,
            password: passwordHash,
            role,
            otp: hashOtp,
            otpExpireAt: new Date(Date.now() + 5 * 60 * 1000),
            isActive: false
        })

       

        await sendMail(
             email,
             "OTP for registration",
             `Your OTP is ${otp}. It expires in 5 minutes.`
        )
         await newUser.save()

        res.status(200).json({ message: "User registered successfully. OTP sent to email.", userID: newUser._id })
        
    }
    catch (err) {
        console.log(err.message)
        return res.status(500).json({ message: err.message })
    }
}

// ---------------- VERIFY OTP ----------------
exports.verifyOtp = async (req, res) => {
    console.log("Inside verify otp")
    try {
        const { email, otp } = req.body
        const user = await User.findOne({ email })

        if (!user) {
            return res.status(400).json({ message: "User not found" })
        }
        if (user.isActive) {
            return res.status(400).json({ message: "User already verified" })
        }
        if (!user.otp || !user.otpExpireAt) {
            return res.status(400).json({ message: "OTP not found, please request a new one" })
        }
        if (user.otpExpireAt < Date.now()) {
            return res.status(400).json({ message: "OTP expired" })
        }

        const isOtpValid = await bcrypt.compare(otp.toString(), user.otp)
        if (!isOtpValid) {
            return res.status(400).json({ message: "Invalid OTP" })
        }

        user.isActive = true
        user.otp = undefined
        user.otpExpireAt = undefined
        await user.save()

        res.status(200).json({ message: "User verified successfully" })
    }
    catch (err) {
        console.log(err.message)
        return res.status(500).json({ message: err.message })
    }
}

// ---------------- RESEND OTP ----------------
exports.resendOtp = async (req, res) => {
    console.log("Inside Resend Otp")
    try {
        const { email } = req.body
        const user = await User.findOne({ email })

        if (!user) {
            return res.status(400).json({ message: "User not found" })
        }
        if (user.isActive) {
            return res.status(400).json({ message: "User already verified" })
        }

        const otp = Math.floor(100000 + Math.random() * 900000)
        const hashOtp = await bcrypt.hash(otp.toString(), 10)

        user.otp = hashOtp
        user.otpExpireAt = new Date(Date.now() + 5 * 60 * 1000)
        await user.save()

        await sendMail({
            to: email,
            subject: "OTP for registration",
            message: `Your OTP is ${otp}. It expires in 5 minutes.`
        })

        res.status(200).json({ message: "OTP resent successfully" })
    }
    catch (err) {
        console.log(err.message)
        return res.status(500).json({ message: "Internal server error" })
    }
}

// ---------------- LOGIN ----------------
exports.login = async (req, res) => {
    console.log("Inside login")
    try {
        const { email, password } = req.body
        if (!email || !password) {
            return res.status(400).json({ message: "Please fill all fields" })
        }

        const user = await User.findOne({ email })
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" })
        }
        if (!user.isActive) {
            return res.status(400).json({ message: "Please verify your email before logging in" })
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid email or password" })
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'devsecret',
            { expiresIn: '7d' }
        )

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        })
    }
    catch (err) {
        console.log(err.message)
        return res.status(500).json({ message: "Internal server error" })
    }
}

// ---------------- FORGOT PASSWORD ----------------
exports.forgotPassword = async (req, res) => {
    console.log("Inside forgot password")
    try {
        const email = (req.body.email || '').trim().toLowerCase()
        if (!email) {
            return res.status(400).json({ message: "Email is required" })
        }

        const user = await User.findOne({ email })
        if (!user) {
            return res.status(400).json({ message: "User not found" })
        }

        const resetToken = crypto.randomBytes(32).toString('hex')
        const hashResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')

        const resetLink = `${FRONTEND_URL}/reset-password/${resetToken}`

        user.resetPasswordToken = hashResetToken
        user.resetPasswordExpiry = new Date(Date.now() + 10 * 60 * 1000)
        await user.save()

        await sendMail(
             email,
          "Reset Your Password",
            `
              <h3>Password Reset Request</h3>
              <p>Click the link below to reset your password:</p>
              <a href="${resetLink}" target="_blank">${resetLink}</a>
              <p>This link will expire in 10 minutes.</p>
            `
        )

        return res.status(200).json({ message: "Password reset link sent successfully" })
    }
    catch (err) {
        console.log(err.message)
        return res.status(500).json({ message: "Internal server error" })
    }
}

// ---------------- RESET PASSWORD ----------------
exports.resetPassword = async (req, res) => {
    console.log("Inside reset password")
    try {
        const { newPassword } = req.body
        const { token } = req.params

        if (!newPassword) {
            return res.status(400).json({ message: "New password is required" })
        }

        const hashToken = crypto.createHash('sha256').update(token).digest('hex')

        const user = await User.findOne({
            resetPasswordToken: hashToken,
            resetPasswordExpiry: { $gt: Date.now() }
        })

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token" })
        }

        user.password = await bcrypt.hash(newPassword, 10)
        user.resetPasswordToken = undefined
        user.resetPasswordExpiry = undefined
        await user.save()

        return res.status(200).json({ message: "Password reset successful" })
    }
    catch (err) {
        console.log(err.message)
        return res.status(500).json({ message: "Internal server error" })
    }
}