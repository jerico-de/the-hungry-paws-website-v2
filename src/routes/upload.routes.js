const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const { uploadFile, getFileUrl } = require("../config/s3");
const { requireAuth } = require("../middleware/auth");

// POST /api/upload/pet-photo
router.post("/upload/pet-photo", requireAuth, upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const fileName = `pet-photos/${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
    await uploadFile(file.buffer, fileName, file.mimetype);
    res.json({ success: true, fileName });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Pet photo upload failed" });
  }
});

// POST /api/upload/vet-record
router.post("/upload/vet-record", requireAuth, upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const fileName = `vet-records/${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
    await uploadFile(file.buffer, fileName, file.mimetype);
    res.json({ success: true, fileName });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Vet record upload failed" });
  }
});

// GET /api/file?name=... — get signed URL
router.get("/file", requireAuth, async (req, res) => {
  try {
    const url = await getFileUrl(req.query.name);
    res.json({ success: true, url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Could not retrieve file" });
  }
});

module.exports = router;
