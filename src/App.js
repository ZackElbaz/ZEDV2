// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ContactPage from "./pages/ContactPage";
import ProjectPage from "./pages/ProjectPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/project1" element={<ProjectPage title="Project 1" />} />
        {/* You can add more projects here */}
      </Routes>
    </Router>
  );
}

export default App;

