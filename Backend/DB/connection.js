const mongoose = require('mongoose')

const connectDB = async () => {
    try {
        const mongodb_uri = process.env.MONGODB_URI
        await mongoose.connect(mongodb_uri)
        console.log("Database connected")
    } catch (err) {
        console.log("DB connection error:", err.message)
        process.exit(1)
    }
}

module.exports = connectDB