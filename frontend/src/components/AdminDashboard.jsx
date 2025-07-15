import React, { useEffect, useState } from "react";
import PricingSettings from "./PricingSettings";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const [submissions, setSubmissions] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingId, setLoadingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [expandedRows, setExpandedRows] = useState({});
  const [pricing, setPricing] = useState({
    staticPrice: 100,
    satellitePrice: 200,
    comboDiscount: 50,
    comboPrice: 250,
    promoEnabled: false,
  });

  const fetchSubmissions = () => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/submissions`)
      .then((res) => res.json())
      .then((data) => setSubmissions(data.submissions || []))
      .catch((err) => console.error("Failed to fetch submissions", err));
  };

  useEffect(() => {
    fetchSubmissions();
    const interval = setInterval(fetchSubmissions, 5000);
    return () => clearInterval(interval);
  }, []);

  const markAsCompleted = async (id) => {
    await fetch(
      `${
        import.meta.env.VITE_API_BASE_URL
      }/api/submissions/mark-completed/${id}`,
      {
        method: "POST",
      }
    );
    fetchSubmissions();
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/api/submissions/update-status/${id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      if (!res.ok) throw new Error("Failed to update status");
      setSubmissions((prev) =>
        prev.map((s) =>
          s.submission_id === id ? { ...s, status: newStatus } : s
        )
      );
    } catch (err) {
      console.error("Status update failed:", err);
      alert("Failed to update status.");
    }
  };

  const viewDocuments = (submission) => {
    const urls = Object.values(submission.documents || {})
      .map((doc) => doc.url)
      .filter(Boolean);
    urls.forEach((url) => window.open(url, "_blank"));
  };

  const viewSketch = (submission) => {
    if (submission.renderedSketch?.url) {
      window.open(submission.renderedSketch.url, "_blank");
    } else {
      alert("Sketch not available yet.");
    }
  };

  const renderSketch = async (submission) => {
    try {
      setLoadingId(submission.submission_id);
      setSuccessMessage("");

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/sketch/generate/${
          submission.submission_id
        }`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transferredTo: submission.transferredTo || "",
          }),
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error response:", errorText);
        alert("Sketch generation failed.");
        return;
      }

      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);

      // 🟢 Show user-friendly confirmation instead of auto-open
      setSuccessMessage(
        "✅ Sketch rendered successfully! Click 'Download PDF' to download."
      );

      // 🟢 Update submission's renderedSketch.url temporarily in memory
      setSubmissions((prev) =>
        prev.map((s) =>
          s.submission_id === submission.submission_id
            ? {
                ...s,
                renderedSketch: { url: downloadUrl },
              }
            : s
        )
      );

      await markAsCompleted(submission.submission_id);
      fetchSubmissions();
    } catch (err) {
      console.error(err);
      alert("An error occurred while rendering.");
    } finally {
      setLoadingId(null);
    }
  };

  const filtered = submissions
    .filter((s) => {
      const q = searchTerm.toLowerCase();
      return (
        s.ownerName?.toLowerCase().includes(q) ||
        s.address?.toLowerCase().includes(q) ||
        s.mobile?.toLowerCase().includes(q) ||
        s.submission_id?.toLowerCase().includes(q)
      );
    })
    .filter((s) => {
      const isPaid = s.paymentStatus === "paid";
      if (filterType === "paid") return isPaid;
      if (filterType === "unpaid") return !isPaid;
      return true;
    });

  if (filterType === "name") {
    filtered.sort((a, b) => a.ownerName.localeCompare(b.ownerName));
  } else if (filterType === "date") {
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  const navigate = useNavigate();
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>

      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 text-green-800 rounded">
          {successMessage}
        </div>
      )}

      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <input
          type="text"
          placeholder="Search by name, location, phone, ID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border px-4 py-2 rounded w-full sm:w-64"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border px-4 py-2 rounded"
        >
          <option value="all">All</option>
          <option value="name">Sort A–Z</option>
          <option value="date">Newest</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
        </select>
        <button
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          onClick={() => navigate("/sketch")}
        >
          Create Manual Order
        </button>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Name</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">Phone</th>
            <th className="border p-2">Date</th>
            <th className="border p-2">Type</th>
            <th className="border p-2">Payment</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((s) => (
            <React.Fragment key={s.submission_id}>
              <tr
                className="hover:bg-gray-50"
                onClick={(e) => {
                  if (
                    e.target.tagName !== "BUTTON" &&
                    e.target.tagName !== "SELECT" &&
                    e.target.tagName !== "OPTION"
                  ) {
                    setExpandedRows((prev) => ({
                      ...prev,
                      [s.submission_id]: !prev[s.submission_id],
                    }));
                  }
                }}
              >
                <td className="border p-2 cursor-pointer">{s.ownerName}</td>
                <td className="border p-2 cursor-pointer">{s.email}</td>
                <td className="border p-2">{s.mobile}</td>
                <td className="border p-2">
                  {new Date(s.createdAt).toLocaleDateString()}
                </td>
                <td className="border p-2">{s.sketchType}</td>
                <td className="border p-2">
                  {s.paymentStatus === "paid" ? (
                    <span className="text-green-600 font-semibold">Paid</span>
                  ) : (
                    <span className="text-red-600 font-semibold">Unpaid</span>
                  )}
                </td>
                <td className="border p-2">
                  <select
                    value={s.status || "New"}
                    onChange={(e) =>
                      updateStatus(s.submission_id, e.target.value)
                    }
                    className="border rounded px-2 py-1 text-xs"
                  >
                    <option value="New">New</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </td>
                <td className="border p-2 space-x-1 space-y-1">
                  <button
                    onClick={() => viewDocuments(s)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs"
                  >
                    View Docs
                  </button>
                  {s.renderedSketch?.url && (
                    <>
                      <button
                        onClick={() => {
                          const link = document.createElement("a");
                          link.href = s.renderedSketch.url;
                          link.download = `SketchPlan-${s.submission_id}.pdf`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-xs"
                      >
                        Download PDF
                      </button>
                    </>
                  )}

                  <button
                    disabled={
                      s.paymentStatus !== "paid" ||
                      loadingId === s.submission_id
                    }
                    onClick={() => renderSketch(s)}
                    className={`px-2 py-1 text-xs rounded text-white ${
                      s.paymentStatus !== "paid"
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {loadingId === s.submission_id ? "Rendering..." : "Render"}
                  </button>
                </td>
              </tr>

              {expandedRows[s.submission_id] && (
                <tr>
                  <td colSpan="8" className="bg-gray-50 text-xs p-4">
                    <strong>Plot:</strong> {s.plotNumber || "N/A"} <br />
                    <strong>Location:</strong> {s.address} <br />
                    <strong>Option:</strong> {s.sketchOption} <br />
                    <strong>Notes:</strong> {s.notes || "None"} <br />
                    <strong>Submitted:</strong>{" "}
                    {new Date(s.createdAt).toLocaleString()}
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan="8" className="text-center text-gray-500 py-6">
                No matching submissions found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="mb-6 border rounded-md shadow-sm bg-white p-4">
        <PricingSettings onChange={setPricing} />
      </div>
    </div>
  );
};

export default AdminDashboard;
