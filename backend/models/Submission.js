import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
  ownerName: { type: String, required: true }, // Owner’s Name
  plotNumber: { type: String, default: "" }, // Plot Number (optional)
  address: { type: String, required: true }, // Village. Town, District, Region
  landUse: { type: String, required: true }, // Land Use

  coordinates: {
    lat: { type: Number, required: false }, // Optional
    lon: { type: Number, required: false }, // Optional
  },

  documents: [
    {
      name: String,
      url: String,
    },
  ],

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Submission", submissionSchema);
