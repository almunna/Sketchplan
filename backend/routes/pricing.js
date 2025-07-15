import express from "express";
import PricingSetting from "../models/PricingSetting.js";

const router = express.Router();

// GET current pricing
router.get("/", async (req, res) => {
  try {
    let setting = await PricingSetting.findOne();
    if (!setting) {
      setting = await PricingSetting.create({});
    }
    res.json(setting);
  } catch (err) {
    console.error("Fetch pricing error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// UPDATE pricing
router.post("/update", async (req, res) => {
  const { staticPrice, satellitePrice, comboDiscount, promoEnabled } = req.body;
  try {
    let setting = await PricingSetting.findOne();
    if (!setting) {
      setting = new PricingSetting();
    }
    setting.staticPrice = staticPrice;
    setting.satellitePrice = satellitePrice;
    setting.comboDiscount = comboDiscount;
    setting.promoEnabled = promoEnabled;
    await setting.save();
    res.json({ message: "Pricing updated", setting });
  } catch (err) {
    console.error("Update pricing error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
