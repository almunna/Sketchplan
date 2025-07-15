import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export async function sendSketchEmail(toEmail, downloadUrl, fileName) {
  if (!toEmail) return console.warn("❗No email address provided");

  const transporter = nodemailer.createTransport({
    service: "Gmail", // or use SMTP config
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"SketchPlan Service" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `Your Land Sketch Plan: ${fileName}`,
    html: `
      <p>Hello,</p>
      <p>Your land sketch plan has been successfully generated.</p>
      <p>You can download it here:</p>
      <p><a href="${downloadUrl}" target="_blank">${fileName}</a></p>
      <p>Thank you,<br/>SketchPlan Team</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.messageId);
  } catch (error) {
    console.error("❌ Failed to send email:", error);
  }
}
