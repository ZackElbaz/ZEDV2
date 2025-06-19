import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { initialProjects } from "./ProjectData";
import "./SearchBar.css";

function invertColor(hex) {
  hex = hex.replace("#", "");
  const r = 255 - parseInt(hex.substring(0, 2), 16);
  const g = 255 - parseInt(hex.substring(2, 4), 16);
  const b = 255 - parseInt(hex.substring(4, 6), 16);
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

function SearchBar({ placeholder = "SEARCH..." }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const textColor = "black";
  const focusBackgroundColor = "#ff0059";
  const flashColor = invertColor(focusBackgroundColor);

  const [isHovered, setIsHovered] = useState(false);
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const sortedProjects = [...initialProjects].sort((a, b) => a.name.localeCompare(b.name));
  const filtered = sortedProjects.filter((project) =>
    project.name.toLowerCase().startsWith(query.toLowerCase())
  );

  const visibleProjects = query ? filtered : sortedProjects;
  const highlightedProject = visibleProjects[highlightedIndex];

  const handleSelect = (project) => {
    const path = project.route || `/projects/${project.name.toLowerCase().replace(/\s+/g, "-")}`;
    navigate(path);
    setQuery("");
    setIsFocused(false);
  };

  const handleKeyDown = (e) => {
    if (!visibleProjects.length) return;

    if (e.key === "Tab") {
      e.preventDefault();
      setQuery(highlightedProject.name);
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSelect(highlightedProject);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % visibleProjects.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev === 0 ? visibleProjects.length - 1 : prev - 1
      );
    }
  };

  return (
    <div className="search-container">
      <div className="search-autocomplete-wrapper">
        <div className={`search-input-overlay${isFocused ? " focused" : ""}`}>
          <span className="search-combined">
            <span className="search-typed">{query}</span>
            {query.length > 0 && (
              <span className="search-ghost">
                {highlightedProject?.name.toLowerCase().startsWith(query.toLowerCase())
                  ? highlightedProject.name.slice(query.length)
                  : ""}
              </span>
            )}
          </span>
        </div>

        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlightedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          className={`search-bar${isFocused ? " open" : ""}`} // ← add conditional class
          style={{
            color: "transparent",        // Hide real text
            caretColor: textColor,       // Show real caret
            textAlign: "left",           // LEFT aligned typing
            backgroundColor: isHovered ? focusBackgroundColor : "white",
            transition: "background-color 0.3s ease, box-shadow 0.3s ease",
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onFocus={(e) => {
            setIsFocused(true);
            e.target.style.backgroundColor = flashColor;
            setTimeout(() => {
              e.target.style.backgroundColor = focusBackgroundColor;
            }, 150);
            e.target.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.3)";
          }}
          onBlur={(e) => {
            setTimeout(() => setIsFocused(false), 200);
            setIsHovered(false);
            e.target.style.backgroundColor = "white";
            e.target.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.2)";
          }}
        />
      </div>

      {isFocused && (
        <ul className="search-results">
          {visibleProjects.map((project, idx) => (
            <li
              key={idx}
              className={`search-item${idx === highlightedIndex ? " highlighted" : ""}`}
              onMouseEnter={() => setHighlightedIndex(idx)}
              onMouseDown={() => handleSelect(project)}
            >
              {project.name}
            </li>
          ))}
          {visibleProjects.length === 0 && <li className="search-item">No results</li>}
        </ul>
      )}
    </div>
  );
}

export default SearchBar;

