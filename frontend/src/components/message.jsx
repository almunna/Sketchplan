import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  setDoc,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { loadStripe } from "@stripe/stripe-js";

const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";
const firebaseConfig = {
  apiKey: "AIzaSyDEmY5KhZzgh3e7dLPZJfdZYgJmfuJliDA",
  authDomain: "sketchplan-b2046.firebaseapp.com",
  projectId: "sketchplan-b2046",
  storageBucket: "sketchplan-b2046.appspot.com",
  messagingSenderId: "429895007193",
  appId: "1:429895007193:web:93c0fae76848d4762e19de",
};

const initialAuthToken =
  typeof __initial_auth_token !== "undefined" ? __initial_auth_token : null;

const STRIPE_PUBLIC_KEY = "pk_test_YOUR_STRIPE_PUBLIC_KEY";
let stripePromise;

const showMessage = (message, type = "info") => {
  const messageBox = document.getElementById("message-box");
  const messageText = document.getElementById("message-text");
  if (messageBox && messageText) {
    messageText.textContent = message;
    messageBox.className = `fixed inset-x-0 bottom-4 mx-auto p-4 rounded-lg shadow-lg text-white max-w-sm text-center z-50 ${
      type === "error"
        ? "bg-red-600"
        : type === "success"
        ? "bg-green-600"
        : "bg-blue-600"
    } transition-opacity duration-300 opacity-100`;

    setTimeout(() => {
      messageBox.className += " opacity-0";
    }, 5000); // Hide after 5 seconds
  }
  // Hide after 5 seconds
};
function Message() {
  const [formData, setFormData] = useState({
    fullName: "",
    mobileNumber: "",
    emailAddress: "",
    confirmEmailAddress: "",
    villageTown: "",
    district: "",
    region: "",
    landUse: "",
    plotNumber: "",
    purposeOfSketchPlan: "",
    coordinatesUpload: null, // File object
    isAgent: false,
    agentEmailAddress: "",
    paymentMethod: "stripe", // 'stripe' or 'wave'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [storage, setStorage] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Initialize Firebase and set up authentication listener
  useEffect(() => {
    try {
      const app = initializeApp(firebaseConfig);
      const firestoreDb = getFirestore(app);
      const firebaseAuth = getAuth(app);
      const firebaseStorage = getStorage(app);

      setDb(firestoreDb);
      setAuth(firebaseAuth);
      setStorage(firebaseStorage);

      // Sign in with custom token if available, otherwise anonymously
      const signInUser = async () => {
        try {
          if (initialAuthToken) {
            await signInWithCustomToken(firebaseAuth, initialAuthToken);
          } else {
            await signInAnonymously(firebaseAuth);
          }
        } catch (error) {
          console.error("Firebase authentication failed:", error);
          showMessage("Authentication failed. Please try again.", "error");
        }
      };

      signInUser();

      // Listen for auth state changes
      const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
        if (user) {
          setUserId(user.uid);
          console.log("User authenticated:", user.uid);
        } else {
          setUserId(null);
          console.log("No user authenticated.");
        }
        setIsAuthReady(true); // Auth state is ready after initial check
      });

      // Load Stripe
      if (!stripePromise) {
        stripePromise = loadStripe(STRIPE_PUBLIC_KEY);
      }

      return () => unsubscribe(); // Clean up auth listener on unmount
    } catch (error) {
      console.error("Failed to initialize Firebase:", error);
      showMessage(
        "Failed to initialize the application. Please check console for details.",
        "error"
      );
    }
  }, []); // Empty dependency array ensures this runs once on mount

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "file") {
      setFormData({ ...formData, [name]: files[0] });
    } else if (type === "checkbox") {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.fullName.trim()) errors.push("Full Name is required.");
    if (!formData.mobileNumber.trim())
      errors.push("Mobile Number is required.");
    if (!formData.emailAddress.trim())
      errors.push("Email Address is required.");
    if (formData.emailAddress !== formData.confirmEmailAddress)
      errors.push("Email addresses do not match.");
    if (!formData.villageTown.trim()) errors.push("Village/Town is required.");
    if (!formData.district.trim()) errors.push("District is required.");
    if (!formData.region.trim()) errors.push("Region is required.");
    if (!formData.landUse) errors.push("Land Use is required.");
    if (!formData.purposeOfSketchPlan.trim())
      errors.push("Purpose of Sketch Plan is required.");
    if (!formData.coordinatesUpload)
      errors.push("Coordinates Upload is required.");
    if (formData.isAgent && !formData.agentEmailAddress.trim())
      errors.push("Agent Email Address is required if submitting as an agent.");

    if (errors.length > 0) {
      showMessage(errors.join("\n"), "error");
      return false;
    }
    return true;
  };

  const handleStripePayment = async (submissionId) => {
    if (!stripePromise) {
      showMessage("Stripe is not initialized. Please try again.", "error");
      return false;
    }
    const stripe = await stripePromise;
    try {
      showMessage("Initiating payment via Stripe...", "info");
      console.log(
        "Simulating Stripe payment success for submission:",
        submissionId
      );
      showMessage("Stripe payment simulated successfully!", "success");
      return true; // Simulate success
    } catch (error) {
      console.error("Stripe payment error:", error);
      showMessage(
        "An error occurred during Stripe payment. Please try again.",
        "error"
      );
      return false;
    }
  };

  const handleWavePayment = async (submissionId) => {
    showMessage("Initiating payment via WAVE Africa (placeholder)...", "info");
    console.log("Simulating WAVE Africa payment for submission:", submissionId);
    // Simulate a delay for payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    showMessage("WAVE Africa payment simulated successfully!", "success");
    return true; // Simulate success
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthReady || !db || !auth || !storage || !userId) {
      showMessage(
        "Application is still initializing. Please wait a moment.",
        "info"
      );
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    showMessage("Submitting your request...", "info");

    try {
      // 1. Save initial form data to Firestore
      const submissionsCollectionRef = collection(
        db,
        `artifacts/${appId}/users/${userId}/submissions`
      );
      const docRef = await addDoc(submissionsCollectionRef, {
        ...formData,
        coordinatesUpload: null, // Will store URL after upload
        timestamp: new Date(),
        status: "pending_payment",
        userId: userId, // Store the user ID for security rules
      });
      const submissionId = docRef.id;
      console.log("Initial submission saved with ID:", submissionId);

      // 2. Handle Payment
      let paymentSuccessful = false;
      if (formData.paymentMethod === "stripe") {
        paymentSuccessful = await handleStripePayment(submissionId);
      } else if (formData.paymentMethod === "wave") {
        paymentSuccessful = await handleWavePayment(submissionId);
      }

      if (!paymentSuccessful) {
        showMessage(
          "Payment was not successful. Please complete the payment to proceed.",
          "error"
        );
        // Optionally, delete the pending submission or mark it as failed payment
        await setDoc(
          doc(
            db,
            `artifacts/${appId}/users/${userId}/submissions, submissionId`
          ),
          { status: "payment_failed" },
          { merge: true }
        );
        setIsSubmitting(false);
        return;
      }

      setPaymentSuccess(true);
      showMessage(
        "Payment received. Your sketch plan is now being generated and will be emailed shortly.",
        "success"
      );

      // 3. Upload Coordinates Image to Firebase Storage
      let coordinatesImageUrl = null;
      if (formData.coordinatesUpload) {
        const storageRef = ref(
          storage,
          `artifacts/${appId}/users/${userId}/coordinates_uploads/${submissionId}_${formData.coordinatesUpload.name}`
        );
        await uploadBytes(storageRef, formData.coordinatesUpload);
        coordinatesImageUrl = await getDownloadURL(storageRef);
        console.log("Coordinates image uploaded:", coordinatesImageUrl);
      }

      await setDoc(
        doc(db, `artifacts/${appId}/users/${userId}/submissions`, submissionId),
        { coordinatesUpload: coordinatesImageUrl, status: "processing" },
        { merge: true }
      );

      showMessage(
        "Backend processing triggered (OCR, Map, PDF, Email).",
        "info"
      );
      console.log(
        "Simulating backend processing for submission:",
        submissionId
      );

      // Simulate backend processing time
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Simulate backend success
      await setDoc(
        doc(db, `artifacts/${appId}/users/${userId}/submissions`, submissionId),
        {
          status: "completed",
          pdfUrl: `https://example.com/sketch_plan_${submissionId}.pdf`,
        },
        { merge: true }
      );

      setSubmissionSuccess(true);
    } catch (error) {
      console.error("Submission error:", error);
      showMessage(
        `An error occurred during submission: ${error.message}`,
        "error"
      );

      setPaymentSuccess(false);
    } finally {
      setIsSubmitting(false);
    }

    const displayUserId = userId || "Loading...";

    if (!isAuthReady) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
          <div className="text-center text-lg font-semibold text-gray-700">
            Loading application...
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 font-inter text-gray-800 flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8">
        {/* Message Box */}
        <div
          id="message-box"
          className="fixed inset-x-0 bottom-4 mx-auto p-4 rounded-lg shadow-lg text-white max-w-sm text-center z-50 opacity-0 transition-opacity duration-300"
        >
          <span id="message-text"></span>
        </div>

        <div className="w-full max-w-3xl bg-white rounded-xl shadow-2xl p-6 sm:p-8 md:p-10 border border-gray-200">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-center text-green-700 mb-6 sm:mb-8">
            Land Sketch Plan Generator
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Automate your land sketch plan generation in The Gambia.
          </p>

          <div className="text-sm text-gray-500 text-center mb-6">
            Your User ID:{" "}
            <span className="font-mono text-gray-700 break-all">
              {displayUserId}
            </span>
          </div>

          {submissionSuccess ? (
            <div className="text-center p-8 bg-green-50 rounded-lg shadow-inner">
              <svg
                className="mx-auto h-20 w-20 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <h2 className="text-2xl font-bold text-green-700 mt-4">
                Submission Successful!
              </h2>
              <p className="text-gray-700 mt-2">
                Payment received. Your sketch plan is now being generated and
                will be emailed shortly.
              </p>
              <p className="text-sm text-gray-500 mt-4">
                You can close this page.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <fieldset className="border border-gray-300 p-4 rounded-lg shadow-sm">
                <legend className="text-lg font-semibold text-gray-700 px-2">
                  Personal Details
                </legend>
                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="mobileNumber"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    id="mobileNumber"
                    name="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="emailAddress"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="emailAddress"
                    name="emailAddress"
                    value={formData.emailAddress}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="confirmEmailAddress"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Confirm Email Address
                  </label>
                  <input
                    type="email"
                    id="confirmEmailAddress"
                    name="confirmEmailAddress"
                    value={formData.confirmEmailAddress}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </fieldset>

              <fieldset className="border border-gray-300 p-4 rounded-lg shadow-sm">
                <legend className="text-lg font-semibold text-gray-700 px-2">
                  Land Details
                </legend>
                <div>
                  <label
                    htmlFor="villageTown"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Village / Town
                  </label>
                  <input
                    type="text"
                    id="villageTown"
                    name="villageTown"
                    value={formData.villageTown}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="district"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    District
                  </label>
                  <input
                    type="text"
                    id="district"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="region"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Region
                  </label>
                  <select
                    id="region"
                    name="region"
                    value={formData.region}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Select Region</option>
                    <option value="Banjul">Banjul</option>
                    <option value="Kanifing">Kanifing</option>
                    <option value="Brikama">Brikama (West Coast Region)</option>
                    <option value="Mansa Konko">
                      Mansa Konko (Lower River Region)
                    </option>
                    <option value="Kerewan">Kerewan (North Bank Region)</option>
                    <option value="Janjangbureh">
                      Janjangbureh (Central River Region)
                    </option>
                    <option value="Basang">Basang (Upper River Region)</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="landUse"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Land Use
                  </label>
                  <select
                    id="landUse"
                    name="landUse"
                    value={formData.landUse}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Select Land Use</option>
                    <option value="Residential">Residential</option>
                    <option value="Agricultural">Agricultural</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="plotNumber"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Plot Number (Optional)
                  </label>
                  <input
                    type="text"
                    id="plotNumber"
                    name="plotNumber"
                    value={formData.plotNumber}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="purposeOfSketchPlan"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Purpose of Sketch Plan
                  </label>
                  <input
                    type="text"
                    id="purposeOfSketchPlan"
                    name="purposeOfSketchPlan"
                    value={formData.purposeOfSketchPlan}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="coordinatesUpload"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Coordinates Upload (JPG/PNG photo or PDF)
                  </label>
                  <input
                    type="file"
                    id="coordinatesUpload"
                    name="coordinatesUpload"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {formData.coordinatesUpload && (
                    <p className="mt-2 text-sm text-gray-500">
                      Selected file: {formData.coordinatesUpload.name}
                    </p>
                  )}
                </div>
              </fieldset>
              <fieldset className="border border-gray-300 p-4 rounded-lg shadow-sm">
                <legend className="text-lg font-semibold text-gray-700 px-2">
                  Agent Details (Optional)
                </legend>
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="isAgent"
                    name="isAgent"
                    checked={formData.isAgent}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="isAgent"
                    className="ml-2 block text-sm font-medium text-gray-700"
                  >
                    I am submitting this request on behalf of the client
                  </label>
                </div>
                {formData.isAgent && (
                  <div>
                    <label
                      htmlFor="agentEmailAddress"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Agent Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      id="agentEmailAddress"
                      name="agentEmailAddress"
                      value={formData.agentEmailAddress}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                )}
              </fieldset>
              <fieldset className="border border-gray-300 p-4 rounded-lg shadow-sm">
                <legend className="text-lg font-semibold text-gray-700 px-2">
                  Payment Method
                </legend>
                <div className="mt-2 space-y-4">
                  <div className="flex items-center">
                    <input
                      id="payment-stripe"
                      name="paymentMethod"
                      type="radio"
                      value="stripe"
                      checked={formData.paymentMethod === "stripe"}
                      onChange={handleChange}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                    />
                    <label
                      htmlFor="payment-stripe"
                      className="ml-3 block text-sm font-medium text-gray-700"
                    >
                      Stripe Checkout (Card payments, International)
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="payment-wave"
                      name="paymentMethod"
                      type="radio"
                      value="wave"
                      checked={formData.paymentMethod === "wave"}
                      onChange={handleChange}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                    />
                    <label
                      htmlFor="payment-wave"
                      className="ml-3 block text-sm font-medium text-gray-700"
                    >
                      WAVE Africa (Mobile Money - placeholder)
                    </label>
                  </div>
                </div>
              </fieldset>
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-semibold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-300 ease-in-out ${
                    isSubmitting ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                >
                  {isSubmitting ? "Processing..." : "Submit Request & Pay"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  };
}

export default Message;
