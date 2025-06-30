import React, { useState, useEffect } from "react";

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

  const [locationOption, setLocationOption] = useState("");
  const [latLngCorners, setLatLngCorners] = useState([{ lat: "", lon: "" }]);
  const [utmCoords, setUtmCoords] = useState([
    { zone: "", easting: "", northing: "" },
  ]);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  // Google Map Embed (Option A)
  useEffect(() => {
    if (locationOption === "A") {
      const initMap = () => {
        const map = new window.google.maps.Map(document.getElementById("map"), {
          center: { lat: 13.4549, lng: -16.579 },
          zoom: 14,
        });

        let marker = null;

        map.addListener("click", (e) => {
          const lat = e.latLng.lat();
          const lon = e.latLng.lng();
          setFormData((prev) => ({ ...prev, lat, lon }));

          if (marker) marker.setMap(null);
          marker = new window.google.maps.Marker({
            position: { lat, lng: lon },
            map,
          });
        });
      };

      if (!window.google) {
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY`;
        script.async = true;
        script.onload = initMap;
        document.body.appendChild(script);
      } else {
        initMap();
      }
    }
  }, [locationOption]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      (locationOption === "A" && (!formData.lat || !formData.lon)) ||
      (locationOption === "B" && latLngCorners.length < 4) ||
      (locationOption === "C" && utmCoords.length < 4)
    ) {
      alert("Please complete the selected location input method.");
      return;
    }

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value) data.append(key, value);
    });

    if (locationOption === "B") {
      data.append("latLngCorners", JSON.stringify(latLngCorners));
    } else if (locationOption === "C") {
      data.append("utmCoords", JSON.stringify(utmCoords));
    }

    try {
      setLoading(true);
      const res = await fetch(
        "https://sketchplan.onrender.com/api/submissions",
        {
          method: "POST",
          body: data,
        }
      );

      if (!res.ok) throw new Error("Submission failed");
      const json = await res.json();
      setResponse(json);
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
      setLatLngCorners([{ lat: "", lon: "" }]);
      setUtmCoords([{ zone: "", easting: "", northing: "" }]);
      setLocationOption("");
    } catch (err) {
      alert("Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderLatLngInputs = () => (
    <>
      {latLngCorners.map((pair, idx) => (
        <div className="flex gap-2 mb-2" key={idx}>
          <input
            type="number"
            step="any"
            placeholder="Latitude"
            className="w-1/2 border px-2 py-1"
            value={pair.lat}
            onChange={(e) => {
              const updated = [...latLngCorners];
              updated[idx].lat = e.target.value;
              setLatLngCorners(updated);
            }}
          />
          <input
            type="number"
            step="any"
            placeholder="Longitude"
            className="w-1/2 border px-2 py-1"
            value={pair.lon}
            onChange={(e) => {
              const updated = [...latLngCorners];
              updated[idx].lon = e.target.value;
              setLatLngCorners(updated);
            }}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          setLatLngCorners([...latLngCorners, { lat: "", lon: "" }])
        }
      >
        ➕ Add Point
      </button>
    </>
  );

  const renderUtmInputs = () => (
    <>
      {utmCoords.map((point, idx) => (
        <div className="flex gap-2 mb-2" key={idx}>
          <input
            type="text"
            placeholder="Zone"
            className="w-1/3 border px-2 py-1"
            value={point.zone}
            onChange={(e) => {
              const updated = [...utmCoords];
              updated[idx].zone = e.target.value;
              setUtmCoords(updated);
            }}
          />
          <input
            type="number"
            placeholder="Easting"
            className="w-1/3 border px-2 py-1"
            value={point.easting}
            onChange={(e) => {
              const updated = [...utmCoords];
              updated[idx].easting = e.target.value;
              setUtmCoords(updated);
            }}
          />
          <input
            type="number"
            placeholder="Northing"
            className="w-1/3 border px-2 py-1"
            value={point.northing}
            onChange={(e) => {
              const updated = [...utmCoords];
              updated[idx].northing = e.target.value;
              setUtmCoords(updated);
            }}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          setUtmCoords([...utmCoords, { zone: "", easting: "", northing: "" }])
        }
      >
        ➕ Add UTM
      </button>
    </>
  );

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow mt-6">
      <h2 className="text-xl font-bold mb-4">Sketch Plan Form</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* General Form Fields */}
        {[
          "ownerName",
          "plotNumber",
          "address",
          "email",
          "agentEmail",
          "notes",
        ].map((field) => (
          <input
            key={field}
            name={field}
            type="text"
            value={formData[field]}
            onChange={handleChange}
            placeholder={field}
            className="w-full border px-3 py-2"
          />
        ))}

        {/* Select Land Use */}
        <select
          name="landUse"
          value={formData.landUse}
          onChange={handleChange}
          className="w-full border px-3 py-2"
        >
          <option>Residential</option>
          <option>Commercial</option>
          <option>Agriculture</option>
        </select>

        {/* Location Input Options */}
        <div>
          <label className="block font-semibold mb-1">
            Select Location Input Method
          </label>
          {["A", "B", "C"].map((opt) => (
            <div key={opt}>
              <input
                type="radio"
                id={`opt${opt}`}
                name="locationOption"
                value={opt}
                checked={locationOption === opt}
                onChange={(e) => setLocationOption(e.target.value)}
              />
              <label htmlFor={`opt${opt}`} className="ml-2">
                {opt === "A"
                  ? "Drop Google Map pin and enter length/width"
                  : opt === "B"
                  ? "Enter lat/lon corner coordinates"
                  : "Enter UTM coordinates"}
              </label>
            </div>
          ))}
        </div>

        {/* Dynamic Sections */}
        {locationOption === "A" && (
          <>
            <div id="map" style={{ height: "300px" }} className="my-3" />
            <input
              type="number"
              name="lat"
              value={formData.lat}
              readOnly
              className="border px-2 py-1"
            />
            <input
              type="number"
              name="lon"
              value={formData.lon}
              readOnly
              className="border px-2 py-1"
            />
            <input
              type="number"
              name="length"
              placeholder="Length (m)"
              onChange={handleChange}
              className="border px-2 py-1"
            />
            <input
              type="number"
              name="width"
              placeholder="Width (m)"
              onChange={handleChange}
              className="border px-2 py-1"
            />
          </>
        )}
        {locationOption === "B" && renderLatLngInputs()}
        {locationOption === "C" && renderUtmInputs()}

        {/* File Uploads */}
        {["landTransfer", "utmSketch", "idProof"].map((name) => (
          <input
            key={name}
            type="file"
            name={name}
            onChange={handleChange}
            accept=".pdf,image/*"
            className="w-full border px-3 py-2"
          />
        ))}

        {/* Sketch Type */}
        <select
          name="sketchOption"
          value={formData.sketchOption}
          onChange={handleChange}
          className="w-full border px-3 py-2"
        >
          <option value="A">Static Only</option>
          <option value="B">Satellite Only</option>
          <option value="C">Both</option>
        </select>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          {loading ? "Submitting..." : "Generate Sketch Plan"}
        </button>

        {response?.message && (
          <div className="mt-4 bg-green-100 border border-green-400 p-3 rounded">
            <strong>{response.message}</strong>
            {response.generatedPDFs?.staticPDF && (
              <p>
                Static:{" "}
                <a
                  href={response.generatedPDFs.staticPDF}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline"
                >
                  View PDF
                </a>
              </p>
            )}
            {response.generatedPDFs?.satellitePDF && (
              <p>
                Satellite:{" "}
                <a
                  href={response.generatedPDFs.satellitePDF}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline"
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
