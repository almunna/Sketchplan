import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Incorrect email or password.");
        return;
      }

      if (data.token && data.admin) {
        localStorage.setItem("isAdminLoggedIn", "true");
        localStorage.setItem("adminToken", data.token); // Optional
        navigate("/admin");
      } else {
        setError("Unexpected server response.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed. Please try again.");
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-50 ">
      <div className="w-full max-w-sm bg-white shadow-xl rounded-lg p-7 pt-20 pb-20">
        <h2 className="text-2xl font-bold mb-10 text-center text-gray-800">
          Admin Login
        </h2>
        {error && (
          <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
        )}
        <form onSubmit={handleLogin}>
          <input
            type="email"
            className="w-full border border-gray-300 rounded p-2 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="relative mb-4">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full border border-gray-300 rounded p-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span
              className="absolute top-2 right-3 text-sm cursor-pointer text-blue-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </span>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
