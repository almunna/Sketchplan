// routes/adminRoutes.js
import express from "express";
import { loginAdmin } from "../controller/adminAuth.js";

const router = express.Router();
router.post("/login", loginAdmin);
export default router;
