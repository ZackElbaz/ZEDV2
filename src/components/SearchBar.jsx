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
//   const containerRef = useRef(null);
//   const dropdownRef = useRef(null);

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

//   // Smooth scroll state
//   let scrollTarget = null;
//   let animating = false;

//   // Capture all wheel/touch and forward to dropdown
//   useEffect(() => {
//     if (!isFocused) return;

//     const dropdown = dropdownRef.current;
//     if (!dropdown) return;

//     const speedFactor = 0.3;
//     const smoothFactor = 0.2;

//     const handleWheel = (e) => {
//       e.preventDefault();
//       const delta = e.deltaY * speedFactor;
//       if (scrollTarget === null) scrollTarget = dropdown.scrollTop;
//       scrollTarget += delta;
//       scrollTarget = Math.max(
//         0,
//         Math.min(scrollTarget, dropdown.scrollHeight - dropdown.clientHeight)
//       );
//       if (!animating) {
//         animating = true;
//         requestAnimationFrame(smoothScrollStep);
//       }
//     };

//     const smoothScrollStep = () => {
//       const current = dropdown.scrollTop;
//       const diff = scrollTarget - current;
//       const step = diff * smoothFactor;

//       if (Math.abs(diff) > 0.5) {
//         dropdown.scrollTop += step;
//         requestAnimationFrame(smoothScrollStep);
//       } else {
//         dropdown.scrollTop = scrollTarget;
//         animating = false;
//         scrollTarget = null;
//       }
//     };

//     const touchStartY = { current: 0 };
//     const handleTouchStart = (e) => {
//       if (e.touches.length === 1) {
//         touchStartY.current = e.touches[0].clientY;
//       }
//     };

//     const handleTouchMove = (e) => {
//       e.preventDefault();
//       const touch = e.touches[0];
//       const nowY = touch.clientY;
//       const deltaY = touchStartY.current - nowY;
//       touchStartY.current = nowY;

//       dropdown.scrollTop += deltaY * 0.5; // or smooth this too if needed
//     };

//     window.addEventListener("wheel", handleWheel, { passive: false });
//     window.addEventListener("touchstart", handleTouchStart, { passive: false });
//     window.addEventListener("touchmove", handleTouchMove, { passive: false });

//     return () => {
//       window.removeEventListener("wheel", handleWheel);
//       window.removeEventListener("touchstart", handleTouchStart);
//       window.removeEventListener("touchmove", handleTouchMove);
//     };
//   }, [isFocused]);

//   // Close dropdown on outside click
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
//         <ul
//           className="search-results"
//           ref={dropdownRef}
//           style={{
//             maxHeight: "300px",
//             overflowY: "auto",
//             overscrollBehavior: "contain",
//             WebkitOverflowScrolling: "touch",
//             scrollBehavior: "auto",
//           }}
//         >
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

  const [isHovered, setIsHovered] = useState(false);
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isPortrait, setIsPortrait] = useState(window.matchMedia("(orientation: portrait)").matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(orientation: portrait)");
    const handleOrientationChange = (e) => {
      setIsPortrait(e.matches);
    };
    mediaQuery.addEventListener("change", handleOrientationChange);
    return () => mediaQuery.removeEventListener("change", handleOrientationChange);
  }, []);

  const dynamicPlaceholder = isPortrait ? "SEARCH" : placeholder;

  const sortedProjects = [...initialProjects].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const filtered = sortedProjects.filter((project) =>
    project.name.toLowerCase().startsWith(query.toLowerCase())
  );
  const visibleProjects = query ? filtered : sortedProjects;
  const highlightedProject = visibleProjects[highlightedIndex];

  const handleSelect = (project) => {
    const path =
      project.route ||
      `/projects/${project.name.toLowerCase().replace(/\s+/g, "-")}`;
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

  useEffect(() => {
    const event = new CustomEvent("searchbar-scroll-lock", { detail: isFocused });
    window.dispatchEvent(event);
  }, [isFocused]);

  let scrollTarget = null;
  let animating = false;

  useEffect(() => {
    if (!isFocused) return;
    const dropdown = dropdownRef.current;
    if (!dropdown) return;

    const speedFactor = 0.3;
    const smoothFactor = 0.2;

    const handleWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY * speedFactor;
      if (scrollTarget === null) scrollTarget = dropdown.scrollTop;
      scrollTarget += delta;
      scrollTarget = Math.max(
        0,
        Math.min(scrollTarget, dropdown.scrollHeight - dropdown.clientHeight)
      );
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
      if (e.touches.length === 1) {
        touchStartY.current = e.touches[0].clientY;
      }
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
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsFocused(false);
        setIsHovered(false);
        setQuery("");
        setHighlightedIndex(0);
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
            <span className="search-typed">{query}</span>
            {query.length > 0 && (
              <span className="search-ghost">
                {highlightedProject?.name
                  .toLowerCase()
                  .startsWith(query.toLowerCase())
                  ? highlightedProject.name.slice(query.length)
                  : ""}
              </span>
            )}
          </span>
        </div>

        <input
          ref={inputRef}
          type="text"
          placeholder={dynamicPlaceholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlightedIndex(0);
          }}
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
              className={`search-item${
                idx === highlightedIndex ? " highlighted" : ""
              }`}
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
