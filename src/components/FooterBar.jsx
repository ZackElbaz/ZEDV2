import React, { useState, forwardRef } from "react";
import { Link } from "react-router-dom";
import "./FooterBar.css";

function invertColor(hex) {
  hex = hex.replace("#", "");
  const r = 255 - parseInt(hex.substring(0, 2), 16);
  const g = 255 - parseInt(hex.substring(2, 4), 16);
  const b = 255 - parseInt(hex.substring(4, 6), 16);
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

const FooterBar = forwardRef((props, ref) => {
  const pink = "#ff0059";
  const flashColor = invertColor(pink);

  const [hovered, setHovered] = useState(false);

  return (
    <footer className="footer-bar" ref={ref}>
      <Link
        to="/contact"
        className="footer-link"
        style={{
          color: hovered ? pink : "white",
          transition: "color 0.3s ease",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={(e) => {
          e.target.style.color = flashColor;
          setTimeout(() => {
            e.target.style.color = pink;
          }, 250); // quick flash on focus
        }}
        onBlur={(e) => {
          setHovered(false);
          e.target.style.color = "white";
        }}
      >
        CONTACT INFO
      </Link>
    </footer>
  );
});

export default FooterBar;
