const multer = require('multer')

const MAX_ZIP_SIZE = 100 * 1024 * 1024 // 100 MB

const storage = multer.memoryStorage() 

const fileFilter = (req, file, cb) => {
    const isZip =
        file.mimetype === 'application/zip' ||
        file.mimetype === 'application/x-zip-compressed' ||
        file.originalname.toLowerCase().endsWith('.zip')

    if (!isZip) {
        return cb(new Error('Only .zip files are allowed'))
    }
    cb(null, true)
}

const uploadZip = multer({
    storage,
    fileFilter,
limits: { fileSize: MAX_ZIP_SIZE, files: 10 }})

module.exports = uploadZip