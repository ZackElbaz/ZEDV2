import React, { useState } from "react";
import "./SearchBar.css";

function invertColor(hex) {
  hex = hex.replace("#", "");
  const r = 255 - parseInt(hex.substring(0, 2), 16);
  const g = 255 - parseInt(hex.substring(2, 4), 16);
  const b = 255 - parseInt(hex.substring(4, 6), 16);
  const invertedColor = `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
  return invertedColor;
}

function SearchBar({ placeholder = "SEARCH..." }) {
  const textColor = "black";
  const focusBackgroundColor = "#ff0059"; // pink
  const flashColor = invertColor(focusBackgroundColor); // inverse of pink

  const [isHovered, setIsHovered] = useState(false);

  return (
    <input
      type="text"
      placeholder={placeholder}
      className="search-bar"
      style={{
        color: textColor,
        backgroundColor: isHovered ? focusBackgroundColor : "white",
        transition: "background-color 0.3s ease, box-shadow 0.3s ease",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={(e) => {
        e.target.style.backgroundColor = flashColor;
        setTimeout(() => {
          e.target.style.backgroundColor = focusBackgroundColor;
        }, 150); // quick flash (adjust timing if you want)
        e.target.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.3)";
      }}
      onBlur={(e) => {
        setIsHovered(false);
        e.target.style.backgroundColor = "white";
        e.target.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.2)";
      }}
    />
  );
}

export default SearchBar;
