// generateSketchPlan.js
import QRCode from "qrcode";
import puppeteer from "puppeteer";
import { v4 as uuidv4 } from "uuid";
import bucket from "./firebase.js";

/**
 * Generates sketch plan PDFs with embedded QR code and uploads them to Firebase.
 *
 * @param {Object} options
 * @param {string} options.clientName
 * @param {"A"|"B"|"C"} options.option - A: Static, B: Satellite, C: Both
 * @param {string} options.qrData - Data to encode in QR
 * @param {string} options.staticMapHTML - HTML for static map (optional)
 * @param {string} options.satelliteMapHTML - HTML for satellite map (optional)
 * @returns {Promise<Object>} Firebase URLs of generated PDFs
 */
export async function generateSketchPlanPDFs({
  clientName,
  option,
  qrData,
  staticMapHTML,
  satelliteMapHTML,
}) {
  const date = new Date().toISOString().split("T")[0];
  const uid = uuidv4().split("-")[0];
  const safeClientName = clientName.replace(/\s+/g, "_");

  // Generate QR code as data URI (no image saved)
  const qrDataURL = await QRCode.toDataURL(qrData);

  // Launch Puppeteer
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const result = {};

  // Helper to render and upload PDF
  async function renderAndUploadPDF(htmlContent, type) {
    const page = await browser.newPage();

    const fullHTML = `
      <html>
        <head>
          <style>
            body { margin: 0; padding: 0; }
            .page-container {
              width: 842px; height: 595px;
              position: relative;
              font-family: sans-serif;
            }
            .qr-code {
              position: absolute;
              bottom: 20px;
              right: 20px;
              width: 100px;
            }
          </style>
        </head>
        <body>
          <div class="page-container">
            ${htmlContent}
            <img src="${qrDataURL}" class="qr-code" />
          </div>
        </body>
      </html>
    `;

    await page.setContent(fullHTML, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
    });

    const filename = `Sketchplan/${type}_SketchPlan_${safeClientName}_${date}_${uid}.pdf`;
    const file = bucket.file(filename);

    await file.save(pdfBuffer, {
      metadata: { contentType: "application/pdf" },
    });

    const [url] = await file.getSignedUrl({
      action: "read",
      expires: "03-01-2030",
    });

    return url;
  }

  if (option === "A" || option === "C") {
    result.staticPDF = await renderAndUploadPDF(staticMapHTML, "Static");
  }

  if (option === "B" || option === "C") {
    result.satellitePDF = await renderAndUploadPDF(
      satelliteMapHTML,
      "Satellite"
    );
  }

  await browser.close();
  return result;
}
