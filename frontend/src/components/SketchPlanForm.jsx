import React, { useState, useEffect } from "react";

const SketchPlanForm = () => {
  const [formData, setFormData] = useState({
    plotNumber: "",
    address: "",
    landUse: "Residential",
    email: "",
    mobile: "",
    agentEmail: "",
    notes: "",
    sketchOption: "A",
    sketchType: "Both",
    length: "",
    width: "",
    lat: "",
    lon: "",
    landTransfer: null,
    utmSketch: null,
    idProof: null,
  });

  const [latLngCorners, setLatLngCorners] = useState([{ lat: "", lon: "" }]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  useEffect(() => {
    if (formData.sketchOption === "A" && window.google) {
      const map = new window.google.maps.Map(document.getElementById("map"), {
        center: { lat: 13.4432, lng: -15.3101 },
        zoom: 13,
      });

      let marker;
      map.addListener("click", (e) => {
        const lat = e.latLng.lat();
        const lon = e.latLng.lng();

        if (marker) marker.setMap(null);
        marker = new window.google.maps.Marker({
          position: { lat, lng: lon },
          map: map,
        });

        setFormData((prev) => ({
          ...prev,
          lat: lat.toFixed(6),
          lon: lon.toFixed(6),
        }));
      });
    }
  }, [formData.sketchOption]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      formData.sketchOption === "A" &&
      (!formData.length || !formData.width || !formData.lat || !formData.lon)
    ) {
      alert("Please provide length, width, and select a location on the map.");
      return;
    }

    if (formData.sketchOption === "C" && !formData.utmSketch) {
      alert("Please upload the UTM Sketch for Option C.");
      return;
    }

    const sketchOption = formData.sketchOption;
    const data = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      if (sketchOption !== "A" && ["lat", "lon"].includes(key)) return;
      if (sketchOption !== "C" && key === "utmSketch") return;
      if (value) data.append(key, value);
    });

    if (sketchOption === "B") {
      data.append("latLngCorners", JSON.stringify(latLngCorners));
    }

    let result = null;
    try {
      setLoading(true);
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/submissions`,
        {
          method: "POST",
          body: data,
        }
      );

      result = await res.json();
      if (!res.ok) throw new Error(result.error || "Submission failed");

      if (result.submission_id) {
        window.location.href = `http://localhost:5173/payment/${result.submission_id}`;
      } else {
        alert("Submission saved but no ID returned.");
      }
    } catch (err) {
      if (
        err.message.includes("We couldn’t read the ownerName") ||
        err.message.includes("We couldn’t read the transferredTo")
      ) {
        sessionStorage.setItem(
          "fallbackFormData",
          JSON.stringify(Object.fromEntries(data))
        );
        if (result?.submission_id) {
          sessionStorage.setItem("fallbackSubmissionId", result.submission_id);
        }
        alert(err.message);
        window.location.href = `/fallback/${result?.submission_id}`;
      } else {
        alert(err.message || "Submission failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-xl bg-white border rounded-lg shadow-md p-8">
        <h2 className="text-xl font-bold text-center text-blue-600 mb-6">
          Sketch Plan Generator
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            ["email", "Your Email Address"],
            ["agentEmail", "Agent's Email Address (if applicable)"],
            ["plotNumber", "Plot Number"],
            ["address", "Location (Village, Town, Region)"],
            ["mobile", "Mobile Number"],
            ["notes", "Any Additional Notes"],
          ].map(([field, label]) => (
            <label key={field} className="block text-sm font-medium">
              {label}:
              <input
                name={field}
                value={formData[field]}
                onChange={handleChange}
                type="text"
                className="w-full border rounded px-3 py-2 mt-1"
              />
            </label>
          ))}

          <label className="block text-sm font-medium">
            Purpose of Land:
            <select
              name="landUse"
              value={formData.landUse}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 mt-1"
            >
              <option>Residential</option>
              <option>Commercial</option>
              <option>Agriculture</option>
            </select>
          </label>

          <label className="block text-sm font-medium">
            Sketch Option:
            <select
              name="sketchOption"
              value={formData.sketchOption}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 mt-1"
            >
              <option value="A">A - Length/Width + Map</option>
              <option value="B">B - Lat/Lon Points</option>
              <option value="C">C - Upload UTM Sketch</option>
            </select>
          </label>

          {/* ✅ Always show length/width */}
          <label className="block text-sm font-medium">
            Length (in meters):
            <input
              type="number"
              name="length"
              value={formData.length}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 mt-1"
            />
          </label>
          <label className="block text-sm font-medium">
            Width (in meters):
            <input
              type="number"
              name="width"
              value={formData.width}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 mt-1"
            />
          </label>

          {formData.sketchOption === "A" && (
            <div>
              <p className="text-sm font-medium mb-1">
                Select Location on Map:
              </p>
              <div id="map" className="w-full h-64 border rounded" />
              {formData.lat && formData.lon && (
                <p className="text-xs mt-1 text-gray-600">
                  Selected: {formData.lat}, {formData.lon}
                </p>
              )}
            </div>
          )}

          {formData.sketchOption === "B" &&
            latLngCorners.map((pt, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input
                  type="number"
                  placeholder="Latitude"
                  value={pt.lat}
                  onChange={(e) => {
                    const updated = [...latLngCorners];
                    updated[idx].lat = e.target.value;
                    setLatLngCorners(updated);
                  }}
                  className="w-1/2 border px-2 py-1 rounded"
                />
                <input
                  type="number"
                  placeholder="Longitude"
                  value={pt.lon}
                  onChange={(e) => {
                    const updated = [...latLngCorners];
                    updated[idx].lon = e.target.value;
                    setLatLngCorners(updated);
                  }}
                  className="w-1/2 border px-2 py-1 rounded"
                />
              </div>
            ))}

          {formData.sketchOption === "B" && (
            <button
              type="button"
              onClick={() =>
                setLatLngCorners([...latLngCorners, { lat: "", lon: "" }])
              }
              className="text-sm text-blue-600 underline"
            >
              + Add New Point
            </button>
          )}

          {formData.sketchOption === "C" && (
            <>
              <p className="text-xs text-gray-600">
                UTM coordinates will be extracted from uploaded sketch.
              </p>
              <label className="block text-sm font-medium">
                Upload UTM Sketch (image/PDF):
                <input
                  type="file"
                  name="utmSketch"
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2 mt-1"
                  accept="image/*,application/pdf"
                />
              </label>
            </>
          )}

          <label className="block text-sm font-medium">
            Sketch Type:
            <select
              name="sketchType"
              value={formData.sketchType}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 mt-1"
            >
              <option value="Static Only">Static Only</option>
              <option value="Satellite Only">Satellite Only</option>
              <option value="Both">Both</option>
            </select>
          </label>

          {["landTransfer", "idProof"].map((name) => (
            <label key={name} className="block text-sm font-medium">
              {`Upload ${
                name === "landTransfer" ? "Land Transfer Document" : "ID Proof"
              }:`}
              <input
                type="file"
                name={name}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 mt-1"
                accept="image/*,application/pdf"
              />
            </label>
          ))}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit Request"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SketchPlanForm;
