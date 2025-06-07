import React, { useEffect } from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import HomePage from "./pages/HomePage";
import ContactPage from "./pages/ContactPage";
import ProjectGlyphs from "./projects/ProjectGlyphs";

function App() {
  useEffect(() => {
    // Disable scroll restoration on refresh
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    // Force scroll to top
    window.scrollTo(0, 0);
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/glyphs" element={<ProjectGlyphs />} />
      </Routes>
    </Router>
  );
}

export default App;



