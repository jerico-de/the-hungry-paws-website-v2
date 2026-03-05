const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedImages = ["image/jpeg", "image/png", "image/webp"];
    const allowedDocs = ["application/pdf"];
    const allowed = [...allowedImages, ...allowedDocs];

    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only images (JPG, PNG, WEBP) and PDFs are allowed"), false);
    }
  },
});

module.exports = upload;
