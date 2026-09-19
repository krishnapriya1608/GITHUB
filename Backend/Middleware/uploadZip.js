const multer = require('multer')

const MAX_ZIP_SIZE = 25 * 1024 * 1024 // 25 MB

const storage = multer.memoryStorage() // never touches disk

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
    limits: { fileSize: MAX_ZIP_SIZE }
})

module.exports = uploadZip