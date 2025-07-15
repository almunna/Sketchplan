import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const FallbackForm = () => {
  const [ownerName, setOwnerName] = useState("");
  const [transferredTo, setTransferredTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [submissionId, setSubmissionId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const id = sessionStorage.getItem("fallbackSubmissionId");
    if (id) setSubmissionId(id);
  }, []);

  const handleRetry = async (e) => {
    e.preventDefault();

    if (!submissionId) {
      alert("Missing submission ID. Please try again.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/api/submissions/fallback/${submissionId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ownerName, transferredTo }),
        }
      );

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Fallback update failed");

      // Redirect to payment
      navigate(`/payment/${submissionId}`);
    } catch (err) {
      alert(err.message || "Submission failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center">
      <div className="bg-white border rounded-lg shadow p-8 w-full max-w-md">
        <h2 className="text-lg font-semibold text-red-600 mb-4 text-center">
          We couldn’t read the owner name. Please type it below to continue.
        </h2>
        <form onSubmit={handleRetry} className="space-y-4">
          <label className="block text-sm font-medium">
            Owner Name:
            <input
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="w-full border rounded px-3 py-2 mt-1"
              required
            />
          </label>
          <label className="block text-sm font-medium">
            Transferred To:
            <input
              type="text"
              value={transferredTo}
              onChange={(e) => setTransferredTo(e.target.value)}
              className="w-full border rounded px-3 py-2 mt-1"
              required
            />
          </label>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Continue Submission"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FallbackForm;
