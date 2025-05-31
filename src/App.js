// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ContactPage from "./pages/ContactPage";
import ProjectGlyphs from "./projects/ProjectGlyphs"; // ✅ updated import

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/glyphs" element={<ProjectGlyphs />} /> {/* ✅ correct route */}
        {/* You can add more projects here */}
      </Routes>
    </Router>
  );
}

export default App;

