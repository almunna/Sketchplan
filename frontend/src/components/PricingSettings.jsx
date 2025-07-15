import React, { useEffect, useState } from "react";

const PricingSettings = ({ onChange }) => {
  const [staticPrice, setStaticPrice] = useState(100);
  const [satellitePrice, setSatellitePrice] = useState(200);
  const [comboDiscount, setComboDiscount] = useState(50);
  const [promoEnabled, setPromoEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Load pricing on mount
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/pricing`
        );
        const data = await res.json();
        setStaticPrice(data.staticPrice || 100);
        setSatellitePrice(data.satellitePrice || 200);
        setComboDiscount(data.comboDiscount || 50);
        setPromoEnabled(data.promoEnabled || false);
      } catch (err) {
        console.error("Failed to load pricing:", err);
      }
    };
    fetchPricing();
  }, []);

  // Notify parent of changes
  useEffect(() => {
    const comboPrice = staticPrice + satellitePrice - comboDiscount;
    onChange({
      staticPrice,
      satellitePrice,
      comboDiscount,
      comboPrice,
      promoEnabled,
    });
  }, [staticPrice, satellitePrice, comboDiscount, promoEnabled]);

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg("");
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/pricing/update`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            staticPrice,
            satellitePrice,
            comboDiscount,
            promoEnabled,
          }),
        }
      );

      const result = await res.json();
      if (res.ok) {
        setSuccessMsg("✅ Pricing updated successfully");
      } else {
        alert(result.error || "Failed to update pricing.");
      }
    } catch (err) {
      console.error("Error saving pricing:", err);
      alert("An error occurred while saving pricing.");
    } finally {
      setSaving(false);
    }
  };

  const handleNumberInput = (setter) => (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setter(Number(value));
    }
  };

  return (
    <div className="border rounded p-4 bg-white shadow mb-6">
      <h2 className="text-xl font-bold mb-4">💰 Pricing Settings</h2>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <label>
          Static Price (GMD)
          <input
            type="text"
            inputMode="numeric"
            pattern="\d*"
            value={staticPrice.toString()}
            onChange={handleNumberInput(setStaticPrice)}
            className="w-full border rounded px-3 py-2 mt-1"
          />
        </label>
        <label>
          Satellite Price (GMD)
          <input
            type="text"
            inputMode="numeric"
            pattern="\d*"
            value={satellitePrice.toString()}
            onChange={handleNumberInput(setSatellitePrice)}
            className="w-full border rounded px-3 py-2 mt-1"
          />
        </label>
        <label>
          Combo Discount (GMD)
          <input
            type="text"
            inputMode="numeric"
            pattern="\d*"
            value={comboDiscount.toString()}
            onChange={handleNumberInput(setComboDiscount)}
            className="w-full border rounded px-3 py-2 mt-1"
          />
        </label>
        <label className="flex items-center gap-2 mt-6">
          <input
            type="checkbox"
            checked={promoEnabled}
            onChange={() => setPromoEnabled((prev) => !prev)}
          />
          <span>Enable Promo Pricing</span>
        </label>
      </div>

      <div className="font-semibold mb-4">
        Combo Price (auto-calculated):{" "}
        <span className="text-blue-600">
          GMD {staticPrice + satellitePrice - comboDiscount}
        </span>
      </div>

      <button
        onClick={handleSave}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        disabled={saving}
      >
        {saving ? "Saving..." : "Save Settings"}
      </button>

      {successMsg && (
        <div className="mt-3 text-green-600 text-sm font-semibold">
          {successMsg}
        </div>
      )}
    </div>
  );
};

export default PricingSettings;
