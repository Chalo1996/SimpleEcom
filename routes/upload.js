// routes/upload.js
import express from "express";
import { upload } from "../util/multer-config.js";
import { uploadImage } from "../util/cloudinaryService.js";

const router = express.Router();

router.post("/upload-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const result = await uploadImage(req.file.buffer);

    res.json({
      imageUrl: result.secure_url,
      optimizedUrl: result.secure_url,
    });
  } catch (error) {
    console.error("Image upload error:", error);
    res.status(500).json({
      error: error.message || "Failed to process image upload",
    });
  }
});

export default router;
