import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const documentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
});

const submissionSchema = new mongoose.Schema(
  {
    submission_id: {
      type: String,
      default: uuidv4,
      unique: true,
      index: true,
    },
    ownerName: { type: String },
    transferredTo: { type: String },
    plotNumber: { type: String },
    address: { type: String, required: true },
    landUse: { type: String, required: true },
    email: { type: String, required: true },
    mobile: { type: String, required: true },
    agentEmail: { type: String },
    notes: { type: String },
    sketchOption: { type: String, required: true },
    sketchType: {
      type: String,
      enum: ["Static Only", "Satellite Only", "Both"],
      required: true,
    },

    country: {
      type: String,
      // for Option A: derive from map-location lookup
      // for Option B: derive from land & lot data
      // for Option C: derive from the coordinates themselves
    },
    district: {
      type: String,
      // same sourcing rules as `country`
    },
    dimensions: {
      type: String,
      // always store as "<A> x <B>" in meters,
      // where A = length, B = width
      // for Option A: taken directly from the input
      // for Option B: computed from the land & lot data
      // for Option C: computed from the coordinate set
    },

    coordinates: {
      length: Number,
      width: Number,
      lat: Number, // ✅ Sketch Option A
      lon: Number, // ✅ Sketch Option A
      latLngCorners: [
        {
          lat: Number,
          lon: Number,
        },
      ],
      utmCoords: [
        {
          zone: String,
          easting: Number,
          northing: Number,
        },
      ],
    },

    paymentStatus: {
      type: String,
      default: "unpaid", // Values: "unpaid", "paid"
    },
    paid: {
      type: Boolean,
      default: false,
    },

    documents: {
      landTransfer: { type: documentSchema, required: true },
      utmSketch: { type: documentSchema, required: false },
      idProof: { type: documentSchema, required: true },
    },

    // ✅ New fields for rendered sketch support
    renderStatus: {
      type: String,
      enum: ["pending", "in_progress", "completed"],
      default: "pending",
    },
    sketchDownloadURL: {
      type: String,
    },
    renderedSketch: {
      name: { type: String },
      url: { type: String },
    },

    // ✅ New field for manual order status tracking
    status: {
      type: String,
      enum: ["New", "In Progress", "Delivered", "draft"], // <-- added "draft"
      default: "New",
    },
  },
  { timestamps: true }
);

const Submission = mongoose.model("Submission", submissionSchema);
export default Submission;
