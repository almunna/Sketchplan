import mongoose from "mongoose";

const pricingSchema = new mongoose.Schema(
  {
    staticPrice: { type: Number, required: true, default: 100 },
    satellitePrice: { type: Number, required: true, default: 200 },
    comboDiscount: { type: Number, required: true, default: 50 },
    promoEnabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const PricingSetting = mongoose.model("PricingSetting", pricingSchema);
export default PricingSetting;
