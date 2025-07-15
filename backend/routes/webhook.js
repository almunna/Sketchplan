import express from "express";
import Stripe from "stripe";
import bodyParser from "body-parser";
import Submission from "../models/Submission.js"; // Adjust if needed

const router = express.Router();

const stripe = new Stripe(
  "sk_test_51RfjzC03tzIOrrPSz7VTeet0uC8sSJOTwuTpghNyXoPPyXnoHZzzdiDke0kfa7zAoqVQb6IXwLpPaoMi7FQDvdJp006PdlLuw2",
  {
    apiVersion: "2023-10-16",
  }
);

// ✅ Use the Thin Payload secret from your working destination
const endpointSecret = "whsec_qLUTIGRR03JwAn6QdEWWoZuyA2RkR4Oi";

// Stripe requires raw body to verify the webhook signature
router.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error("⚠️ Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // ✅ Stripe Elements (PaymentIntent)
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      const submissionId = paymentIntent.metadata?.submission_id;

      console.log("💰 PaymentIntent succeeded for:", submissionId);

      if (submissionId) {
        try {
          const updated = await Submission.findOneAndUpdate(
            { submission_id: submissionId },
            { $set: { paymentStatus: "paid", paid: true } },
            { new: true }
          );
          console.log("✅ Submission marked as paid:", updated?.submission_id);
        } catch (updateErr) {
          console.error("❌ Failed to update Submission:", updateErr);
        }
      }
    }

    // ✅ Legacy Checkout support
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const submissionId = session.metadata?.submission_id;

      console.log("🧾 Checkout session completed for:", submissionId);

      if (submissionId) {
        try {
          const updated = await Submission.findOneAndUpdate(
            { submission_id: submissionId },
            { $set: { paymentStatus: "paid", paid: true } },
            { new: true }
          );
          console.log("✅ Submission marked as paid:", updated?.submission_id);
        } catch (updateErr) {
          console.error("❌ Failed to update Submission:", updateErr);
        }
      }
    }

    res.status(200).json({ received: true });
  }
);

export default router;
