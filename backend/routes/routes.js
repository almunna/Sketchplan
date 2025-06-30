// routes/submissions.js
import express from "express";
import multer from "multer";
import { handleSubmission } from "../controller/Submission.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// ✅ Updated to accept specific file fields
const fileFields = [
  { name: "landTransfer", maxCount: 1 },
  { name: "utmSketch", maxCount: 1 },
  { name: "idProof", maxCount: 1 },
];

router.post("/", upload.fields(fileFields), handleSubmission);

export default router;
