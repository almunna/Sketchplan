// routes/stripe.js
import express from "express";
import Stripe from "stripe";

const router = express.Router();

const stripe = new Stripe(
  "sk_test_51RfjzC03tzIOrrPSz7VTeet0uC8sSJOTwuTpghNyXoPPyXnoHZzzdiDke0kfa7zAoqVQb6IXwLpPaoMi7FQDvdJp006PdlLuw2",
  {
    apiVersion: "2023-10-16",
  }
);

// Create Payment Intent for inline card payments
router.post("/create-payment-intent", async (req, res) => {
  try {
    const { amount, submission_id, email } = req.body;

    if (!amount || !submission_id) {
      return res
        .status(400)
        .json({ error: "Missing amount or submission_id." });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount, // amount in cents (e.g. 250 GMD = 25000 cents if using USD)
      currency: "usd",
      metadata: {
        submission_id,
      },
      receipt_email: email,
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    console.error("Stripe PaymentIntent creation failed:", err);
    res.status(500).json({ error: "Stripe PaymentIntent failed" });
  }
});

export default router;
