import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CheckoutForm = ({
  clientSecret,
  price,
  submission,
  onConfirm,
  paymentRef,
}) => {
  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    if (paymentRef) {
      paymentRef.current = async () => {
        if (!stripe || !elements) return false;

        const result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: elements.getElement(CardElement),
          },
        });

        if (result.error) {
          console.error("❌ Payment failed:", result.error.message);
          alert("Payment failed: " + result.error.message);
          return false;
        } else if (result.paymentIntent.status === "succeeded") {
          alert(
            "✅ Payment successful. You will receive your rendered sketch in your mail shortly."
          );
          return true;
        }

        return false;
      };
    }
  }, [stripe, elements, clientSecret, onConfirm, paymentRef]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    document.activeElement?.blur(); // prevent aria-hidden issue
    onConfirm(); // open modal
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <CardElement className="p-4 border rounded-md bg-white" />
      <button
        type="submit"
        className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded text-lg"
      >
        Pay Now
      </button>
    </form>
  );
};

const PaymentPageContent = () => {
  const { submission_id } = useParams();
  const [method, setMethod] = useState("stripe");
  const [submission, setSubmission] = useState(null);
  const [price, setPrice] = useState(0);
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [processing, setProcessing] = useState(false);

  const paymentRef = useRef(null);

  const renderSketch = async () => {
    try {
      const res = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/api/sketch/generate/${submission_id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transferredTo: submission?.transferredTo || "",
          }),
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        console.error("Sketch generation error:", errText);
        setSuccessMessage("❌ Sketch generation failed.");
        return;
      }

      await res.blob();
      setSuccessMessage("✅ Sketch rendered and email sent successfully.");
    } catch (err) {
      console.error("Render failed:", err);
      setSuccessMessage("❌ An error occurred during sketch rendering.");
    }
  };

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const res = await fetch(
          `${
            import.meta.env.VITE_API_BASE_URL
          }/api/submissions/${submission_id}`
        );
        const data = await res.json();
        setSubmission(data.submission);

        const pricingRes = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/pricing`
        );
        const pricing = await pricingRes.json();

        let priceVal = 0;
        const type = data.submission.sketchType;

        if (type === "Static Only") {
          priceVal = pricing.staticPrice;
        } else if (type === "Satellite Only") {
          priceVal = pricing.satellitePrice;
        } else if (type === "Both") {
          priceVal =
            pricing.staticPrice +
            pricing.satellitePrice -
            pricing.comboDiscount;
        }

        setPrice(priceVal);

        const intentRes = await fetch(
          `${
            import.meta.env.VITE_API_BASE_URL
          }/api/payments/create-payment-intent`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount: priceVal * 100,
              submission_id,
              email: data.submission.email,
            }),
          }
        );
        const intentData = await intentRes.json();
        setClientSecret(intentData.clientSecret);
      } catch (err) {
        console.error("Error fetching submission:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [submission_id]);

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-600 text-lg">
        Loading payment details...
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="text-center py-20 text-red-600 text-lg">
        Submission not found.
      </div>
    );
  }

  return (
    <div className="relative max-w-md mx-auto py-10 px-6 bg-white min-h-screen">
      <h1 className="text-4xl font-bold text-center mb-10">Payment</h1>

      {successMessage && (
        <div className="mb-6 p-4 bg-green-100 text-green-800 border border-green-300 rounded relative">
          {successMessage}
          <button
            onClick={() => setSuccessMessage("")}
            className="absolute top-1 right-2 text-lg font-bold text-green-800 hover:text-red-600"
          >
            ×
          </button>
        </div>
      )}

      <div className="border rounded-lg p-5 mb-8 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Order Amount</h2>
          <span className="text-lg font-bold">D{price}</span>
        </div>
        <hr className="mb-4" />
        <h3 className="text-md font-semibold mb-2">Land Details</h3>
        <p className="mb-1">
          <strong>Plot No:</strong> {submission.plotNumber || "N/A"}
        </p>
        <p className="mb-1">
          <strong>Location:</strong> {submission.address}
        </p>
        <p className="mb-1">
          <strong>Land Use:</strong> {submission.landUse}
        </p>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold mb-3">Pay With</h3>
        <div className="flex gap-4">
          <button
            className={`flex-1 border p-4 rounded-lg flex items-center justify-center gap-2 ${
              method === "stripe" ? "ring-2 ring-green-500" : ""
            }`}
            onClick={() => setMethod("stripe")}
          >
            <img
              src="https://img.icons8.com/color/48/000000/stripe.png"
              alt="Stripe"
              className="h-6"
            />
            <span className="text-lg font-semibold text-gray-700">stripe</span>
          </button>
          <button
            className={`flex-1 border p-4 rounded-lg flex items-center justify-center gap-2 ${
              method === "wave" ? "ring-2 ring-green-500" : ""
            }`}
            onClick={() => setMethod("wave")}
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Wave-logo.png/80px-Wave-logo.png"
              alt="WAVE"
              className="h-6"
            />
            <span className="text-lg font-semibold text-gray-700">Wave</span>
          </button>
        </div>
      </div>

      {method === "stripe" && clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm
            clientSecret={clientSecret}
            price={price}
            submission={submission}
            onConfirm={() => setShowModal(true)}
            paymentRef={paymentRef}
          />
        </Elements>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-[90%] max-w-lg rounded shadow-xl p-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-xl font-bold"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold text-center mb-6">
              Please Confirm Your Information
            </h2>
            <table className="w-full text-sm mb-6 border">
              <tbody>
                <tr className="border">
                  <td className="font-bold p-2">Name</td>
                  <td className="p-2">{submission.ownerName}</td>
                </tr>
                <tr className="border">
                  <td className="font-bold p-2">Village / Town</td>
                  <td className="p-2">{submission.address?.split(",")[0]}</td>
                </tr>
                <tr className="border">
                  <td className="font-bold p-2">District / Region</td>
                  <td className="p-2">
                    {submission.address?.split(",").slice(1).join(" / ")}
                  </td>
                </tr>
                <tr className="border">
                  <td className="font-bold p-2">Plot Number</td>
                  <td className="p-2">{submission.plotNumber}</td>
                </tr>
                <tr className="border">
                  <td className="font-bold p-2">Plot Dimensions</td>
                  <td className="p-2">
                    {submission.length}m x {submission.width}m x{" "}
                    {submission.length}m x {submission.width}m
                  </td>
                </tr>
                <tr className="border">
                  <td className="font-bold p-2">Land Use</td>
                  <td className="p-2">{submission.landUse}</td>
                </tr>
                <tr className="border">
                  <td className="font-bold p-2">Total Payment</td>
                  <td className="p-2">D{price}</td>
                </tr>
              </tbody>
            </table>
            <button
              onClick={async () => {
                setProcessing(true);
                setShowModal(false);
                if (paymentRef.current) {
                  const success = await paymentRef.current();
                  if (success) {
                    await renderSketch();
                  }
                }
                setProcessing(false);
              }}
              disabled={processing}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded text-lg"
            >
              {processing ? "Processing..." : "Confirm Purchase"}
            </button>
          </div>
        </div>
      )}

      <p className="text-center text-sm text-gray-500 mt-4">
        You will be charged in Gambian Dalasi (GMD)
      </p>
    </div>
  );
};

const PaymentPage = () => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentPageContent />
    </Elements>
  );
};

export default PaymentPage;
