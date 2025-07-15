// controller/fallbackController.js
import Submission from "../models/Submission.js";

/**
 * Handles manual fallback input for ownerName and transferredTo
 * Route: POST /api/submissions/fallback/:submission_id
 * Body: { ownerName, transferredTo }
 */
export const fallbackOwnerTransfer = async (req, res) => {
  const { submission_id } = req.params;
  const { ownerName, transferredTo } = req.body;

  if (!ownerName || !transferredTo) {
    return res.status(400).json({
      error: "ownerName and transferredTo are required.",
    });
  }

  try {
    const submission = await Submission.findOne({ submission_id });
    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    submission.ownerName = ownerName;
    submission.transferredTo = transferredTo;
    submission.status = "New"; // optional: move out of "draft"

    await submission.save();

    res.json({
      message: "Owner and transfer names updated successfully.",
      submission,
    });
  } catch (err) {
    console.error("Fallback update error:", err);
    res.status(500).json({ error: "Server error during fallback update." });
  }
};
