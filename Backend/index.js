require('dotenv').config()

const express = require('express')
const cors = require('cors')
const connectDB = require('./DB/connection')
const router = require('./Route/route')
const projectRouter = require('./Route/projectRoute')

const app = express()
app.use(cors())
app.use(express.json())

connectDB()

app.get('/', (req, res) => {
    res.send('Hello World')
})

app.use('/api', router)
app.use('/api/projects', projectRouter)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})