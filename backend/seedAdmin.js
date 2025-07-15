// seedAdmin.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import Admin from "./models/Admin.js";

dotenv.config();
await mongoose.connect(process.env.MONGODB_URI);

const password = await bcrypt.hash("admin123", 10);
await Admin.create({ email: "admin@sketch.com", password });
console.log("✅ Admin seeded");
process.exit();
