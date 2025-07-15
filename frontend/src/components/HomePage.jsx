import React from "react";
import { Link } from "react-router-dom";
import sketchPlan from "../assets/sketch-plan.png";

const HomePage = () => {
  return (
    <div className="bg-blue-600 min-h-screen text-white font-sans" id="home">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6">
        <div className="text-2xl font-bold flex items-center gap-2">
          <span role="img" aria-label="home">
            🏠
          </span>{" "}
          SketchPlan
        </div>
        <ul className="flex gap-6 text-white text-sm">
          <li>
            <a href="#home" className="hover:underline">
              Home
            </a>
          </li>
          <li>
            <a href="#about" className="hover:underline">
              About
            </a>
          </li>
          <li>
            <a href="#contact" className="hover:underline">
              Contact
            </a>
          </li>
          <li>
            <Link
              to="/payment"
              className="border border-white px-4 py-1 rounded hover:bg-white hover:text-blue-600 transition"
            >
              Get Started
            </Link>
          </li>
        </ul>
      </nav>

      {/* Hero Section */}
      <section className="px-6 lg:px-20 py-12 flex flex-col lg:flex-row items-center justify-between">
        {/* Left Text */}
        <div className="lg:w-1/2 mb-10 lg:mb-0">
          <h1 className="text-4xl font-extrabold leading-snug mb-4">
            Quickly Generate a <br /> Sketch Plan of <br /> Your Land
          </h1>
          <p className="mb-6 text-lg">
            Simply enter the details of your land, complete payment, and receive
            a sketch plan in minutes.
          </p>
          <Link
            to="/sketch"
            className="bg-white text-blue-600 font-semibold px-6 py-3 rounded shadow hover:bg-gray-100"
          >
            Generate Sketch Plan
          </Link>
        </div>
        {/* Right Card */}

        <div className="lg:w-1/2 flex justify-center">
          <div className="w-80">
            <img
              src={sketchPlan}
              alt="Sketch Plan"
              className="w-full h-auto border rounded-lg shadow-lg"
            />
          </div>
        </div>
      </section>
      <section className="flex-row">
        {/* About Section */}
        <section id="about" className="bg-white text-black px-6 lg:px-20 py-12">
          <h2 className="text-3xl font-bold mb-4">About Us</h2>
          <p className="text-lg max-w-3xl">
            SketchPlan is a modern tool to help landowners, surveyors, and
            buyers quickly generate clean and official-style sketch plans for
            plots of land. We aim to simplify the process by automating data
            collection, design generation, and delivery — all within minutes.
          </p>
        </section>

        {/* Contact Section */}
        <section
          id="contact"
          className="bg-gray-100 text-black px-6 lg:px-20 py-12"
        >
          <h2 className="text-3xl font-bold mb-4">Contact</h2>
          <p className="text-lg max-w-3xl mb-2">
            For support, custom plan requests, or business inquiries, email us
            at:
          </p>
          <p className="font-semibold">support@sketchplan.app</p>
        </section>
      </section>

      {/* Footer */}
      <footer className="bg-blue-700 text-white py-4 text-center text-sm">
        © 2024 SketchPlan ·{" "}
        <a href="#" className="underline">
          Privacy Policy
        </a>{" "}
        ·{" "}
        <a href="#" className="underline">
          Terms of Service
        </a>
      </footer>
    </div>
  );
};

export default HomePage;
