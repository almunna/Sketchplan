import React from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import SketchPlanForm from "./components/SketchPlanForm";
import Message from "./components/message";
import PaymentPage from "./components/PaymentPage";
import HomePage from "./components/HomePage";
import AdminDashboard from "./components/AdminDashboard";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import VerifyPage from "./components/VerifyPage";
import FallbackForm from "./components/FallbackForm";
import AdminLogin from "./components/AdminLogin"; // ✅ import

const stripePromise = loadStripe(
  "pk_test_51RfjzC03tzIOrrPSdCPjpJpIUyS0I9xyh0sjeO85m4MzbxrIcVEBjNDF8eMCU5IkhvjYPEvGmv2ooEq8PxB0nrtj00ky9RijMs"
);

// ✅ Protected Route
const RequireAuth = ({ children }) => {
  const isLoggedIn = localStorage.getItem("isAdminLoggedIn") === "true";
  return isLoggedIn ? children : <Navigate to="/admin/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/verify/:submission_id" element={<VerifyPage />} />
        <Route path="/sketch" element={<SketchPlanForm />} />
        <Route
          path="/payment/:submission_id"
          element={
            <Elements stripe={stripePromise}>
              <div className="App">
                <h1 className="text-2xl font-bold text-center mt-8">
                  SketchPlan Payment
                </h1>
                <PaymentPage />
              </div>
            </Elements>
          }
        />
        <Route
          path="/success"
          element={
            <div className="text-center mt-10">
              <h1 className="text-green-600 text-2xl font-bold">
                ✅ Payment Successful!
              </h1>
              <p className="mt-2">
                Your sketch plan will be processed shortly.
              </p>
            </div>
          }
        />
        <Route
          path="/cancel"
          element={
            <div className="text-center mt-10">
              <h1 className="text-red-600 text-2xl font-bold">
                ❌ Payment Cancelled
              </h1>
              <p className="mt-2">Feel free to try again when you're ready.</p>
            </div>
          }
        />

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminDashboard />
            </RequireAuth>
          }
        />

        <Route path="/fallback/:submission_id" element={<FallbackForm />} />
      </Routes>
    </Router>
  );
}

export default App;
