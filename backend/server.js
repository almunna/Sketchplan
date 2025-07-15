// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors"; // ✅ Import CORS
import submissionsRouter from "./routes/routes.js";
import stripeRoutes from "./routes/stripe.js";
import webhookRouter from "./routes/webhook.js";
import sketchRoutes from "./routes/sketchRoute.js";
import pricingRoutes from "./routes/pricing.js";
import verifyRoutes from "./routes/verifyRoute.js";
import sketchRoute from "./routes/sketchRoutes.js";
import extractRoute from "./routes/extractRoute.js";
import adminRoutes from "./routes/adminRoutes.js";

dotenv.config();
const app = express();

// ✅ Enable CORS
app.use(
  cors({
    origin: "http://localhost:5173", // or use "*" for dev only
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use("/api/stripe", webhookRouter);
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

app.use("/api", submissionsRouter);
app.use("/api/sketch", sketchRoutes);
app.use("/api/pricing", pricingRoutes);
app.use("/api", verifyRoutes);
app.use("/api/extract", extractRoute);
app.use("/api/sketch", sketchRoute);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("Backend Connected successfully");
});

app.use("/api/payments", stripeRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
