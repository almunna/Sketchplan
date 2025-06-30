// controllers/Submission.js
import Submission from "../models/Submission.js";
import bucket from "../firebase.js";
import { generateSketchPlanPDFs } from "../generateSketchPlan.js";

export const handleSubmission = async (req, res) => {
  try {
    const {
      ownerName,
      plotNumber,
      address,
      landUse,
      lat,
      lon,
      email,
      agentEmail,
      notes,
      sketchOption, // "A", "B", or "C"
    } = req.body;

    if (!ownerName || !address || !landUse || !sketchOption || !email) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const uploadedFiles = {};

    // Helper to upload a file to Firebase
    const uploadToFirebase = async (file, label) => {
      const safeName = ownerName.replace(/\s+/g, "_");
      const path = `uploads/${safeName}_${label}_${Date.now()}_${
        file.originalname
      }`;
      const fileUpload = bucket.file(path);

      await fileUpload.save(file.buffer, {
        metadata: { contentType: file.mimetype },
      });

      const [url] = await fileUpload.getSignedUrl({
        action: "read",
        expires: "03-01-2030",
      });

      return { name: file.originalname, url };
    };

    // Multer uses fields, so req.files is an object
    const files = req.files || {};

    if (files.landTransfer?.[0]) {
      uploadedFiles.landTransfer = await uploadToFirebase(
        files.landTransfer[0],
        "landTransfer"
      );
    }
    if (files.utmSketch?.[0]) {
      uploadedFiles.utmSketch = await uploadToFirebase(
        files.utmSketch[0],
        "utmSketch"
      );
    }
    if (files.idProof?.[0]) {
      uploadedFiles.idProof = await uploadToFirebase(
        files.idProof[0],
        "idProof"
      );
    }

    // Create and save submission in MongoDB
    const submission = new Submission({
      ownerName,
      plotNumber,
      address,
      landUse,
      email,
      agentEmail,
      notes,
      coordinates: {
        lat: lat || undefined,
        lon: lon || undefined,
      },
      documents: uploadedFiles,
    });

    await submission.save();

    // Generate sketch plan PDFs (static + satellite)
    const staticHTML = `<div style="width:842px;height:595px;background:#e5e5e5;text-align:center;font-size:30px;padding-top:250px;">Static Map</div>`;
    const satelliteHTML = `<div style="width:842px;height:595px;background:#ddd;text-align:center;font-size:30px;padding-top:250px;">Satellite Map</div>`;

    const generatedPDFs = await generateSketchPlanPDFs({
      clientName: ownerName,
      option: sketchOption,
      qrData: `https://example.com/sketch/${submission._id}`,
      staticMapHTML: staticHTML,
      satelliteMapHTML: satelliteHTML,
    });

    res.status(201).json({
      message: "Submission saved!",
      submission,
      generatedPDFs,
    });
  } catch (err) {
    console.error("Submission Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
