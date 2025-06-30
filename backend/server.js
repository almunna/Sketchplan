// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors"; // ✅ Import CORS
import submissionsRouter from "./routes/routes.js";

dotenv.config();
const app = express();

// ✅ Enable CORS
app.use(
  cors({
    origin: "*", // Change to your frontend domain in production
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

app.use("/api/submissions", submissionsRouter);
app.get("/", (req, res) => {
  res.send("Backend Connected");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
