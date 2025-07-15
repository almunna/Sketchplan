// routes/sketchRoutes.js or a new file
import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import os from "os";

const router = express.Router();
const upload = multer();

router.post(
  "/extract-transfer-names",
  upload.single("image"),
  async (req, res) => {
    try {
      const tempPath = path.join(os.tmpdir(), req.file.originalname);
      fs.writeFileSync(tempPath, req.file.buffer);

      const python = spawn("python", ["./utils/extract_names.py", tempPath]);

      let output = "";
      python.stdout.on("data", (data) => (output += data.toString()));
      python.stderr.on("data", (err) =>
        console.error("Tesseract error:", err.toString())
      );

      python.on("close", () => {
        try {
          const result = JSON.parse(output);
          fs.unlinkSync(tempPath); // clean up
          res.json(result);
        } catch (err) {
          res.status(500).json({ error: "Failed to parse OCR output" });
        }
      });
    } catch (err) {
      console.error("OCR Extract Error:", err);
      res.status(500).json({ error: "Server error during extraction" });
    }
  }
);

export default router;
