import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SketchPlanForm from "./components/SketchPlanForm";

function HomePage() {
  return (
    <div className="min-h-screen bg-gray-100 mr-7">
      <SketchPlanForm />
    </div>
  );
}

function AboutPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 text-xl">
      About Sketch Plan Generator
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </Router>
  );
}

export default App;
