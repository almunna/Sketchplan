import express from "express";
import multer from "multer";
import handleSubmission, {
  updateSubmissionStatus,
} from "../controller/Submission.js";
import Submission from "../models/Submission.js";
import { fallbackOwnerTransfer } from "../controller/fallbackController.js"; // ✅ Add import

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  "/submissions",
  upload.fields([
    { name: "landTransfer", maxCount: 1 },
    { name: "utmSketch", maxCount: 1 },
    { name: "idProof", maxCount: 1 },
  ]),
  handleSubmission
);

router.get("/submissions/:submission_id", async (req, res) => {
  const { submission_id } = req.params;

  try {
    const submission = await Submission.findOne({ submission_id });
    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }
    res.json({ submission });
  } catch (err) {
    console.error("Fetch submission error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/submissions", async (req, res) => {
  try {
    const submissions = await Submission.find().sort({ createdAt: -1 });
    res.json({ submissions });
  } catch (err) {
    console.error("Error fetching all submissions:", err);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

// ✅ Add update-status route
router.post(
  "/submissions/update-status/:submission_id",
  updateSubmissionStatus
);

// ✅ Add fallback ownerName / transferredTo route
router.post("/submissions/fallback/:submission_id", fallbackOwnerTransfer);

export default router;
