import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const VerifyPage = () => {
  const { submission_id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`https://sketchplan.onrender.com/api/verify/${submission_id}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.error) {
          setError(res.error);
        } else {
          setData(res);
        }
      })
      .catch(() => setError("Failed to fetch verification details."));
  }, [submission_id]);

  if (error) return <div className="p-6 text-red-600">❌ {error}</div>;
  if (!data) return <div className="p-6">Loading verification...</div>;

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 border rounded shadow bg-white">
      <h1 className="text-2xl font-bold mb-4 text-green-700">
        ✅ Sketch Plan Verified
      </h1>
      <p>
        <strong>Submission ID:</strong> {data.submission_id}
      </p>
      <p>
        <strong>Client Name:</strong> {data.client}
      </p>
      <p>
        <strong>Date Generated:</strong>{" "}
        {new Date(data.createdAt).toLocaleString()}
      </p>
      <p>
        <strong>Verification Status:</strong> {data.verificationStatus}
      </p>

      <div className="mt-4">
        <strong>Coordinates:</strong>
        <ul className="list-disc pl-5 mt-1">
          {data.coordinates.lat && data.coordinates.lon && (
            <li>
              Lat: {data.coordinates.lat}, Lon: {data.coordinates.lon}
            </li>
          )}
          {Array.isArray(data.coordinates.utmCoords) &&
            data.coordinates.utmCoords.map((c, i) => (
              <li key={i}>
                Zone {c.zone} – Easting: {c.easting}, Northing: {c.northing}
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
};

export default VerifyPage;
