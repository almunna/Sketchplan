import express from "express";
import { verifySubmission } from "../controller/qrController.js";

const router = express.Router();

router.get("/verify/:submission_id", verifySubmission);

export default router;
