// src/components/ScrollToTop.jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // Always scroll to top on path change
    window.scrollTo(0, 0);
  }, [pathname, hash]); // track hash changes too

  return null;
}
