// import React, { useState, useRef, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { initialProjects } from "./ProjectData";
// import "./SearchBar.css";

// function invertColor(hex) {
//   hex = hex.replace("#", "");
//   const r = 255 - parseInt(hex.substring(0, 2), 16);
//   const g = 255 - parseInt(hex.substring(2, 4), 16);
//   const b = 255 - parseInt(hex.substring(4, 6), 16);
//   return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
// }

// function SearchBar({ placeholder = "SEARCH..." }) {
//   const navigate = useNavigate();
//   const inputRef = useRef(null);
//   const containerRef = useRef(null); // 🆕 to detect outside clicks

//   const textColor = "black";
//   const focusBackgroundColor = "#ff0059";
//   const flashColor = invertColor(focusBackgroundColor);

//   const [isHovered, setIsHovered] = useState(false);
//   const [query, setQuery] = useState("");
//   const [isFocused, setIsFocused] = useState(false);
//   const [highlightedIndex, setHighlightedIndex] = useState(0);

//   const sortedProjects = [...initialProjects].sort((a, b) =>
//     a.name.localeCompare(b.name)
//   );
//   const filtered = sortedProjects.filter((project) =>
//     project.name.toLowerCase().startsWith(query.toLowerCase())
//   );

//   const visibleProjects = query ? filtered : sortedProjects;
//   const highlightedProject = visibleProjects[highlightedIndex];

//   const handleSelect = (project) => {
//     const path =
//       project.route ||
//       `/projects/${project.name.toLowerCase().replace(/\s+/g, "-")}`;
//     navigate(path);
//     setQuery("");
//     setIsFocused(false);
//   };

//   const handleKeyDown = (e) => {
//     if (!visibleProjects.length) return;

//     if (e.key === "Tab") {
//       e.preventDefault();
//       setQuery(highlightedProject.name);
//     } else if (e.key === "Enter") {
//       e.preventDefault();
//       handleSelect(highlightedProject);
//     } else if (e.key === "ArrowDown") {
//       e.preventDefault();
//       setHighlightedIndex((prev) => (prev + 1) % visibleProjects.length);
//     } else if (e.key === "ArrowUp") {
//       e.preventDefault();
//       setHighlightedIndex((prev) =>
//         prev === 0 ? visibleProjects.length - 1 : prev - 1
//       );
//     }
//   };

//   // 🆕 Reset search bar when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (
//         containerRef.current &&
//         !containerRef.current.contains(event.target)
//       ) {
//         setIsFocused(false);
//         setIsHovered(false);
//         setQuery("");
//         setHighlightedIndex(0);
//       }
//     };

//     if (isFocused) {
//       document.addEventListener("mousedown", handleClickOutside);
//     }

//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, [isFocused]);

//   return (
//     <div className="search-container" ref={containerRef}>
//       <div className="search-autocomplete-wrapper">
//         <div className={`search-input-overlay${isFocused ? " focused" : ""}`}>
//           <span className="search-combined">
//             <span className="search-typed">{query}</span>
//             {query.length > 0 && (
//               <span className="search-ghost">
//                 {highlightedProject?.name
//                   .toLowerCase()
//                   .startsWith(query.toLowerCase())
//                   ? highlightedProject.name.slice(query.length)
//                   : ""}
//               </span>
//             )}
//           </span>
//         </div>

//         <input
//           ref={inputRef}
//           type="text"
//           placeholder={placeholder}
//           value={query}
//           onChange={(e) => {
//             setQuery(e.target.value);
//             setHighlightedIndex(0);
//           }}
//           onKeyDown={handleKeyDown}
//           className={`search-bar${isFocused ? " open" : ""}`}
//           style={{
//             color: "transparent",
//             caretColor: textColor,
//             textAlign: "left",
//             backgroundColor: isHovered ? focusBackgroundColor : "white",
//             transition: "background-color 0.3s ease, box-shadow 0.3s ease",
//           }}
//           onMouseEnter={() => setIsHovered(true)}
//           onMouseLeave={() => setIsHovered(false)}
//           onFocus={(e) => {
//             setIsFocused(true);
//             e.target.style.backgroundColor = flashColor;
//             setTimeout(() => {
//               e.target.style.backgroundColor = focusBackgroundColor;
//             }, 150);
//             e.target.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.3)";
//           }}
//         />
//       </div>

//       {isFocused && (
//         <ul className="search-results">
//           {visibleProjects.map((project, idx) => (
//             <li
//               key={idx}
//               className={`search-item${
//                 idx === highlightedIndex ? " highlighted" : ""
//               }`}
//               onMouseEnter={() => setHighlightedIndex(idx)}
//               onMouseDown={() => handleSelect(project)}
//             >
//               {project.name}
//             </li>
//           ))}
//           {visibleProjects.length === 0 && (
//             <li className="search-item">No results</li>
//           )}
//         </ul>
//       )}
//     </div>
//   );
// }

// export default SearchBar;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import React, { useState, useRef, useEffect } from "react";
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
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);

  const textColor = "black";
  const focusBackgroundColor = "#ff0059";
  const flashColor = invertColor(focusBackgroundColor);

  const [typedQuery, setTypedQuery] = useState("");
  const [displayedQuery, setDisplayedQuery] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isPortrait, setIsPortrait] = useState(window.matchMedia("(orientation: portrait)").matches);
  const [lastTypedWasTab, setLastTypedWasTab] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(orientation: portrait)");
    const handleOrientationChange = (e) => setIsPortrait(e.matches);
    mediaQuery.addEventListener("change", handleOrientationChange);
    return () => mediaQuery.removeEventListener("change", handleOrientationChange);
  }, []);

  const dynamicPlaceholder = isPortrait ? "SEARCH" : placeholder;

  const sortedProjects = [...initialProjects].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const filtered = sortedProjects.filter((project) =>
    project.name.toLowerCase().includes(typedQuery.toLowerCase())
  );

  const visibleProjects = typedQuery ? filtered : sortedProjects;
  const highlightedProject = visibleProjects[highlightedIndex];

  const handleSelect = (project) => {
    const path = project.route || `/projects/${project.name.toLowerCase().replace(/\s+/g, "-")}`;
    navigate(path);
    setTypedQuery("");
    setDisplayedQuery("");
    setIsFocused(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!visibleProjects.length) return;

    if (e.key === "Tab") {
      e.preventDefault();
      const newIndex = highlightedIndex === -1
        ? 0
        : e.shiftKey
          ? (highlightedIndex === 0 ? visibleProjects.length - 1 : highlightedIndex - 1)
          : (highlightedIndex + 1) % visibleProjects.length;

      const suggestion = visibleProjects[newIndex]?.name || "";
      setHighlightedIndex(newIndex);
      setDisplayedQuery(suggestion);
      setLastTypedWasTab(true);

      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(suggestion.length, suggestion.length);
        }
      }, 0);
    } else if (e.key === "Enter") {
      e.preventDefault();

      const exactMatch = visibleProjects.find(
        (project) => project.name.toLowerCase() === typedQuery.toLowerCase()
      );

      const fallbackProject = exactMatch || highlightedProject || visibleProjects[0];

      if (fallbackProject) {
        handleSelect(fallbackProject);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % visibleProjects.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev <= 0 ? visibleProjects.length - 1 : prev - 1
      );
    }
  };

  const handleChange = (e) => {
    const input = e.target.value;
    if (lastTypedWasTab) {
      const lastFull = displayedQuery;
      const added = input.slice(lastFull.length);
      const newQuery = lastFull + added;
      setTypedQuery(newQuery);
      setDisplayedQuery(newQuery);
    } else {
      setTypedQuery(input);
      setDisplayedQuery(input);
    }
    setHighlightedIndex(-1);
    setLastTypedWasTab(false);
  };

  useEffect(() => {
    const event = new CustomEvent("searchbar-scroll-lock", { detail: isFocused });
    window.dispatchEvent(event);
  }, [isFocused]);

  useEffect(() => {
    if (!isFocused) return;
    const dropdown = dropdownRef.current;
    if (!dropdown) return;

    let scrollTarget = null;
    let animating = false;
    const speedFactor = 0.3;
    const smoothFactor = 0.2;

    const handleWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY * speedFactor;
      if (scrollTarget === null) scrollTarget = dropdown.scrollTop;
      scrollTarget += delta;
      scrollTarget = Math.max(0, Math.min(scrollTarget, dropdown.scrollHeight - dropdown.clientHeight));
      if (!animating) {
        animating = true;
        requestAnimationFrame(smoothScrollStep);
      }
    };

    const smoothScrollStep = () => {
      const current = dropdown.scrollTop;
      const diff = scrollTarget - current;
      const step = diff * smoothFactor;
      if (Math.abs(diff) > 0.5) {
        dropdown.scrollTop += step;
        requestAnimationFrame(smoothScrollStep);
      } else {
        dropdown.scrollTop = scrollTarget;
        animating = false;
        scrollTarget = null;
      }
    };

    const touchStartY = { current: 0 };
    const handleTouchStart = (e) => {
      if (e.touches.length === 1) touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      const nowY = e.touches[0].clientY;
      const deltaY = touchStartY.current - nowY;
      touchStartY.current = nowY;
      dropdown.scrollTop += deltaY * 0.5;
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [isFocused]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsFocused(false);
        setIsHovered(false);
        setTypedQuery("");
        setDisplayedQuery("");
        setHighlightedIndex(-1);
      }
    };
    if (isFocused) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFocused]);

  return (
    <div className="search-container" ref={containerRef}>
      <div className="search-autocomplete-wrapper">
        <div className={`search-input-overlay${isFocused ? " focused" : ""}`}>
          <span className="search-combined">
            <span className="search-typed">{displayedQuery}</span>
            {typedQuery &&
              highlightedProject?.name.toLowerCase().includes(typedQuery.toLowerCase()) &&
              highlightedProject.name.startsWith(typedQuery) && (
                <span className="search-ghost">
                  {highlightedProject.name.slice(typedQuery.length)}
                </span>
              )}
          </span>
        </div>

        <input
          ref={inputRef}
          type="text"
          placeholder={dynamicPlaceholder}
          value={displayedQuery}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className={`search-bar${isFocused ? " open" : ""}`}
          style={{
            color: "transparent",
            caretColor: textColor,
            textAlign: "left",
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
        />
      </div>

      {isFocused && (
        <ul
          className="search-results"
          ref={dropdownRef}
          style={{
            maxHeight: "300px",
            overflowY: "auto",
            overscrollBehavior: "contain",
            WebkitOverflowScrolling: "touch",
          }}
        >
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
          {visibleProjects.length === 0 && (
            <li className="search-item">No results</li>
          )}
        </ul>
      )}
    </div>
  );
}

export default SearchBar;


