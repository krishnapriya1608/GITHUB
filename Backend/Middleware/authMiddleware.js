const jwt = require('jsonwebtoken')

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: "No token provided, authorization denied" })
        }

        const token = authHeader.split(' ')[1]

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'devsecret')
        req.user = decoded // { id, role }
        next()
    }
    catch (err) {
        console.log(err.message)
        return res.status(401).json({ message: "Invalid or expired token" })
    }
}

module.exports = authMiddleware