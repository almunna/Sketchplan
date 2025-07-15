// controller/submissionController.js

import Submission from "../models/Submission.js";
import bucket from "../firebase.js";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import {
  lookupCountry,
  lookupDistrict,
  computeUtmCentroid,
} from "./geoService.js";

// === Create New Submission ===
const handleSubmission = async (req, res) => {
  try {
    const {
      plotNumber,
      address,
      landUse,
      email,
      mobile,
      agentEmail,
      notes,
      sketchOption,
      sketchType,
      latLngCorners,
      utmCoords,
      length,
      width,
      ownerName: manualOwner,
      transferredTo: manualTransferred,
    } = req.body;

    const files = req.files || {};
    let ownerName = "";
    let transferredTo = "";

    const uploadToFirebase = async (file, label) => {
      const safeName = "temp";
      const filePath = `uploads/${safeName}_${label}_${Date.now()}_${
        file.originalname
      }`;
      const fileUpload = bucket.file(filePath);
      await fileUpload.save(file.buffer, {
        metadata: { contentType: file.mimetype },
      });
      const [url] = await fileUpload.getSignedUrl({
        action: "read",
        expires: "03-01-2030",
      });
      return { name: file.originalname, url };
    };

    if (!address || !landUse || !sketchOption || !email || !mobile) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const allowedTypes = ["Static Only", "Satellite Only", "Both"];
    if (!sketchType || !allowedTypes.includes(sketchType)) {
      return res.status(400).json({ error: "Invalid or missing sketchType." });
    }

    const sketchOpt = sketchOption.trim().toUpperCase();
    let coordinates = {};
    let uploadedFiles = {};

    if (sketchOpt === "A") {
      const { lat, lon } = req.body;
      if (!length || !width || !lat || !lon) {
        return res.status(400).json({
          error:
            "Missing required fields for Sketch Option A (length, width, map location).",
        });
      }
      coordinates = {
        length: parseFloat(length),
        width: parseFloat(width),
        lat: parseFloat(lat),
        lon: parseFloat(lon),
      };
    } else if (sketchOpt === "B") {
      const parsed = JSON.parse((latLngCorners || "[]").trim());
      if (parsed.length < 4) {
        return res.status(400).json({
          error: "At least 4 lat/lon pairs are required for Sketch Option B.",
        });
      }
      coordinates = {
        latLngCorners: parsed,
        length: parseFloat(length),
        width: parseFloat(width),
      };
    } else if (sketchOpt === "C") {
      if (!files.utmSketch?.[0]) {
        return res
          .status(400)
          .json({ error: "utmSketch file is required for Sketch Option C." });
      }

      const uploadedUtmSketch = await uploadToFirebase(
        files.utmSketch[0],
        "utmSketch"
      );
      const tempPath = path.join(os.tmpdir(), files.utmSketch[0].originalname);
      fs.writeFileSync(tempPath, files.utmSketch[0].buffer);

      const python = spawn("python", ["./utils/extract_utm.py", tempPath]);
      const ocrResult = await new Promise((resolve, reject) => {
        let data = "";
        python.stdout.on("data", (chunk) => (data += chunk));
        python.stderr.on("data", (err) =>
          console.error("OCR Error:", err.toString())
        );
        python.on("close", (code) => {
          try {
            const parsed = JSON.parse(data);
            if (!Array.isArray(parsed) || parsed.length < 1) {
              return reject("No valid UTM coordinates extracted.");
            }
            resolve(parsed);
          } catch (err) {
            reject("Failed to parse OCR output.");
          }
        });
      });

      coordinates = {
        utmCoords: ocrResult,
        length: parseFloat(length),
        width: parseFloat(width),
      };
      fs.unlinkSync(tempPath);
      uploadedFiles.utmSketch = uploadedUtmSketch;
    } else {
      return res.status(400).json({ error: "Invalid sketch option." });
    }

    if (files.landTransfer?.[0]) {
      const landTransferFile = files.landTransfer[0];
      uploadedFiles.landTransfer = await uploadToFirebase(
        landTransferFile,
        "landTransfer"
      );
      const tempPath = path.join(os.tmpdir(), landTransferFile.originalname);
      fs.writeFileSync(tempPath, landTransferFile.buffer);

      const ocrResult = await new Promise((resolve, reject) => {
        const python = spawn("python", ["./utils/extract_names.py", tempPath]);
        let output = "";

        python.stdout.on("data", (data) => (output += data.toString()));
        python.stderr.on("data", (err) =>
          console.error("Tesseract error:", err.toString())
        );
        python.on("close", () => {
          try {
            fs.unlinkSync(tempPath);
            const result = JSON.parse(output.trim());
            resolve(result);
          } catch (err) {
            reject("Failed to parse OCR output.");
          }
        });
      });

      ownerName = ocrResult.ownerName || manualOwner || "";
      transferredTo = ocrResult.transferredTo || manualTransferred || "";

      if (!files.idProof?.[0]) {
        return res.status(400).json({
          error: "idProof file is required.",
        });
      }

      uploadedFiles.idProof = await uploadToFirebase(
        files.idProof[0],
        "idProof"
      );

      if (!ownerName || !transferredTo) {
        const tempSubmission = new Submission({
          ownerName,
          transferredTo,
          plotNumber,
          address,
          landUse,
          email,
          mobile,
          agentEmail,
          notes,
          sketchOption: sketchOpt,
          sketchType,
          coordinates,
          documents: uploadedFiles,
          country: "",
          district: "",
          dimensions:
            !isNaN(length) && !isNaN(width)
              ? `${parseFloat(length)}m x ${parseFloat(width)}m`
              : "",
          renderStatus: "pending",
          status: "draft",
        });

        await tempSubmission.save();

        return res.status(400).json({
          error:
            "We couldn’t read the ownerName. Please type it below to continue.",
          submission_id: tempSubmission.submission_id,
        });
      }
    } else {
      return res.status(400).json({
        error:
          "landTransfer file is required for extracting ownerName and transferredTo.",
      });
    }

    if (!files.idProof?.[0]) {
      return res.status(400).json({
        error: "idProof file is required.",
      });
    }

    uploadedFiles.idProof = await uploadToFirebase(files.idProof[0], "idProof");

    let country, district;
    const centroid = computeUtmCentroid(coordinates.utmCoords || []);

    if (sketchOpt === "A") {
      country = await lookupCountry(coordinates.lat, coordinates.lon);
      district = await lookupDistrict(coordinates.lat, coordinates.lon);
    } else if (sketchOpt === "B") {
      const avgLat =
        coordinates.latLngCorners.reduce((sum, p) => sum + p.lat, 0) /
        coordinates.latLngCorners.length;
      const avgLon =
        coordinates.latLngCorners.reduce((sum, p) => sum + p.lon, 0) /
        coordinates.latLngCorners.length;
      country = await lookupCountry(avgLat, avgLon);
      district = await lookupDistrict(avgLat, avgLon);
    } else if (sketchOpt === "C") {
      country = await lookupCountry(centroid.lat, centroid.lon);
      district = await lookupDistrict(centroid.lat, centroid.lon);
    }

    const parsedLength = parseFloat(length);
    const parsedWidth = parseFloat(width);
    const formattedDimensions =
      !isNaN(parsedLength) && !isNaN(parsedWidth)
        ? `${parsedLength}m x ${parsedWidth}m`
        : "";

    const submission = new Submission({
      ownerName,
      transferredTo,
      plotNumber,
      address,
      landUse,
      email,
      mobile,
      agentEmail,
      notes,
      sketchOption: sketchOpt,
      sketchType,
      coordinates,
      documents: uploadedFiles,
      country,
      district,
      dimensions: formattedDimensions,
    });

    await submission.save();

    res.status(201).json({
      message: "Submission saved!",
      submission_id: submission.submission_id,
      submission,
    });
  } catch (err) {
    console.error("Submission Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const updateSubmissionStatus = async (req, res) => {
  const { submission_id } = req.params;
  const { status } = req.body;

  try {
    const submission = await Submission.findOne({ submission_id });
    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    submission.status = status;
    await submission.save();

    res.json({ message: "Status updated successfully", submission });
  } catch (err) {
    console.error("Error updating submission status:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export default handleSubmission;
