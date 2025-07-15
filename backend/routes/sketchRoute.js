// routes/sketchRoutes.js
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import Submission from "../models/Submission.js";
import { generateQRCode } from "../controller/qrController.js";
import bucket from "../firebase.js";
import { sendSketchEmail } from "../utils/emailSender.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

async function generateSketchImage(submission) {
  const { coordinates, plotNumber, address } = submission;
  const input = { plotNumber, address };

  if (
    coordinates.lat &&
    coordinates.lon &&
    coordinates.length &&
    coordinates.width
  ) {
    Object.assign(input, {
      lat: coordinates.lat,
      lon: coordinates.lon,
      length: coordinates.length,
      width: coordinates.width,
    });
  } else if (
    Array.isArray(coordinates.latLngCorners) &&
    coordinates.latLngCorners.length >= 3
  ) {
    input.latLngCorners = coordinates.latLngCorners;
  } else if (
    Array.isArray(coordinates.utmCoords) &&
    coordinates.utmCoords.length >= 1
  ) {
    input.utmCoords = coordinates.utmCoords;
  }

  return new Promise((resolve, reject) => {
    const py = spawn("python", [
      path.resolve(__dirname, "../utils/generate_sketch.py"),
      submission.submission_id,
      JSON.stringify(input),
    ]);
    let output = "";
    py.stdout.on("data", (chunk) => (output += chunk.toString()));
    py.stderr.on("data", (err) =>
      console.error("Sketch gen error:", err.toString())
    );
    py.on("close", (code) => {
      if (code !== 0) return reject(new Error("Sketch generation failed"));
      const filePath = output.trim();
      if (!fs.existsSync(filePath))
        return reject(new Error("Generated sketch not found"));
      resolve(filePath);
    });
  });
}

router.post(
  "/g/:submission_id",
  express.json({ limit: "2mb" }),
  async (req, res) => {
    const { submission_id } = req.params;
    const submission = await Submission.findOne({ submission_id });
    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }
    const ownerName = submission.ownerName;
    const sketchType = submission.sketchType;
    const { transferredTo = "" } = req.body || {};

    const addressParts = submission.address.split(",").map((s) => s.trim());
    const district = addressParts[0] || "";
    const location = addressParts.slice(1).join(", ") || "";
    const dimensions = submission.dimensions || "";

    const templatePath = path.resolve(
      __dirname,
      "../templates/SketchPlanTemplate.pdf"
    );
    if (!fs.existsSync(templatePath)) {
      return res.status(500).send("Template missing");
    }

    const templateBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);
    const outPdf = await PDFDocument.create();

    const drawStaticPage = async () => {
      const [templatePage] = await outPdf.copyPages(pdfDoc, [0]);
      const page = templatePage;
      outPdf.addPage(page);

      const helvetica = await outPdf.embedFont(StandardFonts.Helvetica);
      const { width: pageWidth, height: pageHeight } = page.getSize();
      const fontSize = 24;

      const coords = {
        location: { x: 350, y: pageHeight - 65 },
        registered: { x: 130, y: pageHeight - 100 },
        dimensions: { x: 860, y: pageHeight - 100 },
        transferred: { x: 280, y: pageHeight - 180 },
        district: { x: 830, y: pageHeight - 125 },
      };

      const plotLabel = "Plot of Land Located in: ";
      const plotW = helvetica.widthOfTextAtSize(plotLabel, fontSize);
      page.drawText(location, {
        x: coords.location.x + plotW + 5,
        y: coords.location.y,
        size: fontSize,
        font: helvetica,
        color: rgb(0, 0, 0),
      });

      const regLabel = "Previously Registered to: ";
      const regW = helvetica.widthOfTextAtSize(regLabel, fontSize);
      page.drawText(ownerName, {
        x: coords.registered.x + regW + 5,
        y: coords.registered.y,
        size: fontSize,
        font: helvetica,
        color: rgb(0, 0, 0),
      });

      page.drawText(dimensions, {
        x: coords.dimensions.x,
        y: coords.dimensions.y,
        size: fontSize,
        font: helvetica,
        color: rgb(0, 0, 0),
      });

      page.drawText(transferredTo, {
        x: coords.transferred.x,
        y: coords.transferred.y,
        size: fontSize,
        font: helvetica,
        color: rgb(0, 0, 0),
      });

      page.drawText(district, {
        x: coords.district.x,
        y: coords.district.y,
        size: fontSize,
        font: helvetica,
        color: rgb(0, 0, 0),
      });

      return { page, pageWidth, pageHeight };
    };

    const {
      page: staticPage,
      pageWidth: staticW,
      pageHeight: staticH,
    } = await drawStaticPage();

    let satellitePage = null;
    let pageWidth = staticW;
    let pageHeight = staticH;

    if (sketchType === "Both") {
      const second = await drawStaticPage();
      satellitePage = second.page;
      pageWidth = second.pageWidth;
      pageHeight = second.pageHeight;
    } else if (sketchType === "Satellite Only") {
      satellitePage = staticPage;
    }

    if (satellitePage) {
      try {
        const sketchPath = await generateSketchImage(submission);
        const imgBytes = fs.readFileSync(sketchPath);
        const mapImage = await outPdf.embedPng(imgBytes);

        const marginX = 30;
        const marginY = 190;
        const imgX = marginX;
        const imgY = 200;
        const imgW = pageWidth - marginX * 2;
        const imgH = pageHeight - imgY - marginY;

        satellitePage.drawImage(mapImage, {
          x: imgX,
          y: imgY,
          width: imgW,
          height: imgH,
        });

        fs.unlinkSync(sketchPath);
      } catch (err) {
        console.error("Sketch embed failed:", err);
      }
    }

    try {
      const qrFilePath = await generateQRCode(submission_id);
      const qrBytes = fs.readFileSync(qrFilePath);
      const qrImage = await outPdf.embedPng(qrBytes);
      const qrWidth = 150,
        qrHeight = 150;
      const lastPage = outPdf.getPage(outPdf.getPageCount() - 1);
      const { width: pageWidth } = lastPage.getSize();
      const qrX = pageWidth - qrWidth - 5,
        qrY = 2;
      lastPage.drawImage(qrImage, {
        x: qrX,
        y: qrY,
        width: qrWidth,
        height: qrHeight,
      });
      fs.unlinkSync(qrFilePath);
    } catch (err) {
      console.error("QR embed failed:", err);
    }

    const pdfBytes = await outPdf.save();
    const fileDate = new Date().toISOString().split("T")[0];
    const clientName = ownerName.replace(/\s+/g, "_");
    let fileName = "";

    if (sketchType === "Static Only") {
      fileName = `Static_SketchPlan_${clientName}_${fileDate}.pdf`;
    } else if (sketchType === "Satellite Only") {
      fileName = `Satellite_SketchPlan_${clientName}_${fileDate}.pdf`;
    } else {
      fileName = `Static_SketchPlan_Satellite_${clientName}_${fileDate}.pdf`;
    }

    const firebaseFile = bucket.file(`sketchplans/${fileName}`);
    await firebaseFile.save(pdfBytes, {
      metadata: { contentType: "application/pdf" },
    });

    const [firebaseUrl] = await firebaseFile.getSignedUrl({
      action: "read",
      expires: "03-01-2030",
    });

    const outputDir = path.resolve(__dirname, "../generated_pdfs");
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, fileName), pdfBytes);

    await Submission.updateOne(
      { submission_id },
      {
        $set: {
          renderedSketch: { url: firebaseUrl, name: fileName },
          sketchDownloadURL: firebaseUrl,
          renderStatus: "completed",
        },
      }
    );

    // ✅ Send download email to the user
    await sendSketchEmail(submission.email, firebaseUrl, fileName);

    const preview = req.query.preview === "true";
    if (preview) {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename=${fileName}`);
      return res.send(pdfBytes);
    }

    res.status(200).json({
      message: "Sketch rendered and uploaded successfully",
      downloadUrl: firebaseUrl,
    });
  }
);

export default router;
