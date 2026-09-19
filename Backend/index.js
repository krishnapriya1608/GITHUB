require('dotenv').config()

const express = require('express')
const cors = require('cors')
const connectDB = require('./DB/connection')
const router = require('./Route/route')
const projectRouter = require('./Route/projectRoute')
const fileRoute = require('./Route/fileRoute')

const app = express()
app.use(cors())
app.use(express.json())

connectDB()

app.get('/', (req, res) => {
    res.send('Hello World')
})

app.use('/api', router)
app.use('/api/projects', projectRouter)
app.use('/api/projects', projectRouter)
app.use((err, req, res, next) => {
    if (err && err.name === 'MulterError') {
        return res.status(400).json({ message: err.message })
    }
    if (err) {
        console.log(err.message)
        return res.status(500).json({ message: err.message || "Internal server error" })
    }
    next()
})
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})