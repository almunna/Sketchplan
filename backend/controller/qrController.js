import Submission from "../models/Submission.js";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";

// Ensure folder exists
const qrFolder = path.join("qr_codes");
if (!fs.existsSync(qrFolder)) {
  fs.mkdirSync(qrFolder);
}

/**
 * Generate and save QR Code for a submission
 * @param {String} submission_id
 * @returns {String} file path to saved QR image
 */
export const generateQRCode = async (submission_id) => {
  const verifyURL = `https://sketchplan.onrender.com/verify/${submission_id}`;
  const filePath = path.join(qrFolder, `${submission_id}.png`);

  await QRCode.toFile(filePath, verifyURL, {
    width: 300,
    margin: 1,
  });

  return filePath;
};

/**
 * API: Get submission metadata and generate QR file
 */
export const verifySubmission = async (req, res) => {
  const { submission_id } = req.params;

  try {
    const submission = await Submission.findOne({ submission_id });

    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    // Determine status
    let verificationStatus = "Invalid";
    if (
      submission.status === "Delivered" &&
      submission.renderStatus === "completed"
    ) {
      verificationStatus = "Authentic";
    } else if (submission.status === "Delivered") {
      verificationStatus = "Previously Edited";
    }

    // Generate and save QR code file
    const qrPath = await generateQRCode(submission_id);

    res.json({
      submission_id,
      client: submission.ownerName,
      createdAt: submission.createdAt,
      coordinates: submission.coordinates,
      verificationStatus,
      qrFilePath: qrPath, // ✅ local path to PNG
    });
  } catch (err) {
    console.error("QR verification failed:", err);
    res.status(500).json({ error: "Server error" });
  }
};
