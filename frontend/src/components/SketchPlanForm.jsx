import React, { useState } from "react";

const SketchPlanForm = () => {
  const [formData, setFormData] = useState({
    ownerName: "",
    plotNumber: "",
    address: "",
    landUse: "Residential",
    email: "",
    agentEmail: "",
    notes: "",
    lat: "",
    lon: "",
    sketchOption: "C",
    landTransfer: null,
    utmSketch: null,
    idProof: null,
  });

  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== "") {
        data.append(key, value);
      }
    });

    try {
      setLoading(true);
      const res = await fetch("https://sketchplan.onrender.com/api/submissions", {
        method: "POST",
        body: data,
      });

      if (!res.ok) throw new Error("Submission failed");
      const json = await res.json();
      setResponse(json);

      // Reset form
      setFormData({
        ownerName: "",
        plotNumber: "",
        address: "",
        landUse: "Residential",
        email: "",
        agentEmail: "",
        notes: "",
        lat: "",
        lon: "",
        sketchOption: "C",
        landTransfer: null,
        utmSketch: null,
        idProof: null,
      });
    } catch (err) {
      console.error(err);
      alert("Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white shadow-md rounded-lg p-6 mt-10">
      <h2 className="text-2xl font-bold mb-6">Generate Sketch Plan</h2>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Text Fields */}
        {[
          ["ownerName", "Owner’s Name", "John Doe"],
          ["plotNumber", "Plot Number", "Plot-45"],
          ["address", "Village, Town, District, Region", "Full address"],
          ["email", "Email", "john@example.com"],
          ["agentEmail", "Agent’s Email", "agent@example.com"],
          ["notes", "Notes", "Additional instructions"],
        ].map(([name, label, placeholder]) => (
          <div key={name}>
            <label className="block text-sm font-medium mb-1">{label}</label>
            <input
              type="text"
              name={name}
              value={formData[name]}
              onChange={handleChange}
              placeholder={placeholder}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required={[
                "ownerName",
                "address",
                "landUse",
                "sketchOption",
              ].includes(name)}
            />
          </div>
        ))}

        {/* Land Use Select */}
        <div>
          <label className="block text-sm font-medium mb-1">Land Use</label>
          <select
            name="landUse"
            value={formData.landUse}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Residential">Residential</option>
            <option value="Commercial">Commercial</option>
            <option value="Agriculture">Agriculture</option>
          </select>
        </div>

        {/* Latitude and Longitude */}
        <div className="flex gap-2">
          {["lat", "lon"].map((coord) => (
            <div className="w-1/2" key={coord}>
              <label className="block text-sm font-medium mb-1">
                {coord === "lat" ? "Latitude" : "Longitude"}
              </label>
              <input
                type="number"
                step="any"
                name={coord}
                value={formData[coord]}
                onChange={handleChange}
                placeholder={coord === "lat" ? "23.7806" : "90.2794"}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>

        {/* Sketch Option */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Sketch Option (A = Static, B = Satellite, C = Both)
          </label>
          <select
            name="sketchOption"
            value={formData.sketchOption}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="A">Static Only</option>
            <option value="B">Satellite Only</option>
            <option value="C">Both</option>
          </select>
        </div>

        {/* File Uploads */}
        {[
          ["landTransfer", "Land Transfer Document"],
          ["utmSketch", "UTM Sketch File"],
          ["idProof", "ID Proof"],
        ].map(([name, label]) => (
          <div key={name}>
            <label className="block text-sm font-medium mb-1">{label}</label>
            <input
              type="file"
              name={name}
              onChange={handleChange}
              accept=".pdf,image/*"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            />
          </div>
        ))}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
        >
          {loading ? "Submitting..." : "Generate Sketch"}
        </button>

        {/* Response */}
        {response?.message && (
          <div className="mt-6 rounded-md bg-green-100 p-4 border border-green-300">
            <h3 className="text-green-800 font-semibold mb-1">
              🎉 {response.message}
            </h3>
            {response.generatedPDFs?.staticPDF && (
              <p className="text-sm mt-2 text-green-700">
                📄 Static Sketch Plan:{" "}
                <a
                  href={response.generatedPDFs.staticPDF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-blue-600 hover:text-blue-800"
                >
                  View PDF
                </a>
              </p>
            )}
            {response.generatedPDFs?.satellitePDF && (
              <p className="text-sm mt-1 text-green-700">
                🛰️ Satellite Sketch Plan:{" "}
                <a
                  href={response.generatedPDFs.satellitePDF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-blue-600 hover:text-blue-800"
                >
                  View PDF
                </a>
              </p>
            )}
          </div>
        )}
      </form>
    </div>
  );
};

export default SketchPlanForm;
