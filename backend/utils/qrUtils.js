import QRCode from "qrcode";

/**
 * Generates QR image buffer from submission ID
 */
export const getQRBuffer = async (submission_id) => {
  const qrURL = `https://sketchplan.onrender.com/verify/${submission_id}`;
  return await QRCode.toBuffer(qrURL, { type: "png", width: 256 });
};
