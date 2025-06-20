// import React, { useState, useEffect, useRef } from "react";
// import { useNavigate } from "react-router-dom";
// import "./HomePageProject.css";
// import { initialProjects as unsortedProjects } from "./ProjectData";

// const initialProjects = [...unsortedProjects].sort((a, b) => new Date(b.date) - new Date(a.date));

// const VISIBLE_COUNT = 4;

// function HomePageProject() {
//   const navigate = useNavigate();
//   const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
//   const [currentProjectIndex, setCurrentProjectIndex] = useState(1);
//   const [dragX, setDragX] = useState(0);
//   const [isDragging, setIsDragging] = useState(false);
//   const [transitionEnabled, setTransitionEnabled] = useState(true);
//   const [clickPrevented, setClickPrevented] = useState(false);
//   const [landscapeIndex, setLandscapeIndex] = useState(initialProjects.length);
//   const [landscapeDragX, setLandscapeDragX] = useState(0);
//   const [landscapeTransition, setLandscapeTransition] = useState(true);
//   const touchStartX = useRef(0);
//   const startDragX = useRef(0);
//   const isMouseDown = useRef(false);

//   const fullPortraitProjects = [initialProjects[initialProjects.length - 1], ...initialProjects, initialProjects[0]];
//   const fullLandscapeProjects = [...initialProjects, ...initialProjects, ...initialProjects];

//   useEffect(() => {
//     const handleResize = () => setIsLandscape(window.innerWidth > window.innerHeight);
//     window.addEventListener("resize", handleResize);
//     return () => window.removeEventListener("resize", handleResize);
//   }, []);

//   const handleMouseDownPortrait = (e) => {
//     isMouseDown.current = true;
//     touchStartX.current = e.clientX;
//     startDragX.current = dragX;
//     setIsDragging(true);
//     setTransitionEnabled(false);
//     setClickPrevented(false);
//   };

//   const handleMouseMovePortrait = (e) => {
//     if (!isMouseDown.current || !isDragging) return;
//     const delta = e.clientX - touchStartX.current;
//     if (Math.abs(delta) > 5) setClickPrevented(true);
//     setDragX(startDragX.current + delta);
//   };

//   const handleMouseUpPortrait = (e) => {
//     if (!isMouseDown.current) return;
//     isMouseDown.current = false;
//     setIsDragging(false);
//     setTransitionEnabled(true);
//     const deltaX = e.clientX - touchStartX.current;
//     const swipeThreshold = window.innerWidth * 0.1;
//     if (deltaX > swipeThreshold) setCurrentProjectIndex((prev) => prev - 1);
//     else if (deltaX < -swipeThreshold) setCurrentProjectIndex((prev) => prev + 1);
//     setDragX(0);
//   };

//   const handleMouseDownLandscape = (e) => {
//     isMouseDown.current = true;
//     touchStartX.current = e.clientX;
//     startDragX.current = landscapeDragX;
//     setLandscapeTransition(false);
//     setClickPrevented(false);
//   };

//   const handleMouseMoveLandscape = (e) => {
//     if (!isMouseDown.current) return;
//     const delta = e.clientX - touchStartX.current;
//     if (Math.abs(delta) > 5) setClickPrevented(true);
//     setLandscapeDragX(startDragX.current + delta);
//   };

//   const handleMouseUpLandscape = (e) => {
//     if (!isMouseDown.current) return;
//     isMouseDown.current = false;
//     const slideWidth = window.innerWidth / VISIBLE_COUNT;
//     const movedSlides = Math.round(-landscapeDragX / slideWidth);
//     const newIndex = landscapeIndex + movedSlides;
//     setLandscapeTransition(true);
//     setLandscapeIndex(newIndex);
//     setLandscapeDragX(0);
//   };

//   const handleEndPortrait = (clientX) => {
//     setIsDragging(false);
//     setTransitionEnabled(true);
//     const deltaX = clientX - touchStartX.current;
//     const swipeThreshold = window.innerWidth * 0.1;
//     if (deltaX > swipeThreshold) setCurrentProjectIndex((prev) => prev - 1);
//     else if (deltaX < -swipeThreshold) setCurrentProjectIndex((prev) => prev + 1);
//     setDragX(0);
//   };

//   useEffect(() => {
//     if (currentProjectIndex === 0) {
//       setTimeout(() => {
//         setTransitionEnabled(false);
//         setCurrentProjectIndex(initialProjects.length);
//       }, 400);
//     } else if (currentProjectIndex === initialProjects.length + 1) {
//       setTimeout(() => {
//         setTransitionEnabled(false);
//         setCurrentProjectIndex(1);
//       }, 400);
//     }
//   }, [currentProjectIndex]);

//   useEffect(() => {
//     if (landscapeIndex <= initialProjects.length - VISIBLE_COUNT) {
//       setTimeout(() => {
//         setLandscapeTransition(false);
//         setLandscapeIndex(initialProjects.length * 2 - VISIBLE_COUNT);
//       }, 400);
//     } else if (landscapeIndex >= initialProjects.length * 2) {
//       setTimeout(() => {
//         setLandscapeTransition(false);
//         setLandscapeIndex(initialProjects.length);
//       }, 400);
//     }
//   }, [landscapeIndex]);

//   const getProjectStyle = (project, isPortrait = false) => {
//     const portraitSpacing = 2.5;
//     const landscapeSpacing = 1.5;
//     if (isPortrait) {
//       return {
//         flex: "0 0 95%",
//         margin: `0 ${portraitSpacing}%`,
//         backgroundImage: `url('${project.image}')`,
//       };
//     } else {
//       const tileWidthPercent = (100 - landscapeSpacing * 2 * VISIBLE_COUNT) / VISIBLE_COUNT;
//       return {
//         flex: `0 0 ${tileWidthPercent}%`,
//         margin: `0 ${landscapeSpacing}%`,
//         backgroundImage: `url('${project.image}')`,
//       };
//     }
//   };

//   const renderProjectContent = (project, isLandscape) => {
//     const words = project.name.split(" ");
//     return (
//       <div style={{ position: "absolute", inset: 0, display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden", pointerEvents: "none", padding: "5%", textAlign: "center" }}>
//         <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%" }}>
//           {words.map((word, idx) => (
//             <div key={idx} style={{
//               fontSize: isLandscape ? "min(3vw, 10vh)" : "min(10vw, 8vh)",
//               fontWeight: "bold",
//               color: "white",
//               mixBlendMode: "difference",
//               whiteSpace: "nowrap",
//               lineHeight: "1",
//               filter: "drop-shadow(0 0 3px black) drop-shadow(0 0 6px black)",
//               fontFamily: "var(--font-main)",
//             }}>{word}</div>
//           ))}
//         </div>
//         <div style={{ position: "absolute", inset: 0, backgroundColor: "white", zIndex: -1 }} />
//       </div>
//     );
//   };

//   const handleTileClick = (project) => {
//     if (!clickPrevented && project.name === "GLYPHS") {
//       navigate("/glyphs");
//     }
//   };

//   if (isLandscape) {
//     return (
//       <div className="homepage-project-container homepage-project-landscape"
//         onTouchStart={(e) => handleMouseDownLandscape(e.touches[0])}
//         onTouchMove={(e) => handleMouseMoveLandscape(e.touches[0])}
//         onTouchEnd={handleMouseUpLandscape}
//         onMouseDown={handleMouseDownLandscape}
//         onMouseMove={handleMouseMoveLandscape}
//         onMouseUp={handleMouseUpLandscape}
//         onMouseLeave={handleMouseUpLandscape}>
//         <div className="homepage-project-inner" style={{
//           transform: `translateX(calc(${-landscapeIndex * (100 / VISIBLE_COUNT)}% + ${landscapeDragX}px))`,
//           transition: landscapeTransition ? "transform 400ms ease" : "none",
//           display: "flex"
//         }}>
//           {fullLandscapeProjects.map((project, index) => (
//             <div key={index} className="project-tile" style={getProjectStyle(project, false)} onClick={() => handleTileClick(project)}>
//               {renderProjectContent(project, true)}
//             </div>
//           ))}
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="homepage-project-container homepage-project-portrait"
//       onTouchStart={(e) => handleMouseDownPortrait(e.touches[0])}
//       onTouchMove={(e) => handleMouseMovePortrait(e.touches[0])}
//       onTouchEnd={(e) => handleMouseUpPortrait(e.changedTouches[0])}
//       onMouseDown={handleMouseDownPortrait}
//       onMouseMove={handleMouseMovePortrait}
//       onMouseUp={handleMouseUpPortrait}
//       onMouseLeave={handleMouseUpPortrait}>
//       <div className="homepage-project-inner" style={{
//         transform: `translateX(calc(${-currentProjectIndex * 100}% + ${dragX}px))`,
//         transition: transitionEnabled ? "transform 400ms ease" : "none",
//         display: "flex"
//       }}>
//         {fullPortraitProjects.map((project, index) => {
//           const realProject = index === 0
//             ? initialProjects[initialProjects.length - 1]
//             : index === fullPortraitProjects.length - 1
//               ? initialProjects[0]
//               : initialProjects[index - 1];
//           return (
//             <div key={index} className="project-tile" style={getProjectStyle(realProject, true)} onClick={() => handleTileClick(realProject)}>
//               {renderProjectContent(realProject, false)}
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

// export default HomePageProject;


import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./HomePageProject.css";
import { initialProjects as unsortedProjects } from "./ProjectData";

const initialProjects = [...unsortedProjects].sort((a, b) => new Date(b.date) - new Date(a.date));

const VISIBLE_COUNT = 4;

function HomePageProject() {
  const navigate = useNavigate();
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
  const [currentProjectIndex, setCurrentProjectIndex] = useState(1);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [clickPrevented, setClickPrevented] = useState(false);
  const [landscapeIndex, setLandscapeIndex] = useState(initialProjects.length);
  const [landscapeDragX, setLandscapeDragX] = useState(0);
  const [landscapeTransition, setLandscapeTransition] = useState(true);
  const touchStartX = useRef(0);
  const startDragX = useRef(0);
  const isMouseDown = useRef(false);

  const fullPortraitProjects = [initialProjects[initialProjects.length - 1], ...initialProjects, initialProjects[0]];
  const fullLandscapeProjects = [...initialProjects, ...initialProjects, ...initialProjects];

  useEffect(() => {
    const handleResize = () => setIsLandscape(window.innerWidth > window.innerHeight);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleMouseDownPortrait = (e) => {
    isMouseDown.current = true;
    touchStartX.current = e.clientX;
    startDragX.current = dragX;
    setIsDragging(true);
    setTransitionEnabled(false);
    setClickPrevented(false);
  };

  const handleMouseMovePortrait = (e) => {
    if (!isMouseDown.current || !isDragging) return;
    const delta = e.clientX - touchStartX.current;
    if (Math.abs(delta) > 5) setClickPrevented(true);
    setDragX(startDragX.current + delta);
  };

  const handleMouseUpPortrait = (e) => {
    if (!isMouseDown.current) return;
    isMouseDown.current = false;
    setIsDragging(false);
    setTransitionEnabled(true);
    const deltaX = e.clientX - touchStartX.current;
    const swipeThreshold = window.innerWidth * 0.1;
    if (deltaX > swipeThreshold) setCurrentProjectIndex((prev) => prev - 1);
    else if (deltaX < -swipeThreshold) setCurrentProjectIndex((prev) => prev + 1);
    setDragX(0);
  };

  const handleMouseDownLandscape = (e) => {
    isMouseDown.current = true;
    touchStartX.current = e.clientX;
    startDragX.current = landscapeDragX;
    setLandscapeTransition(false);
    setClickPrevented(false);
  };

  const handleMouseMoveLandscape = (e) => {
    if (!isMouseDown.current) return;
    const delta = e.clientX - touchStartX.current;
    if (Math.abs(delta) > 5) setClickPrevented(true);
    setLandscapeDragX(startDragX.current + delta);
  };

  const handleMouseUpLandscape = (e) => {
    if (!isMouseDown.current) return;
    isMouseDown.current = false;
    const slideWidth = window.innerWidth / VISIBLE_COUNT;
    const movedSlides = Math.round(-landscapeDragX / slideWidth);
    const newIndex = landscapeIndex + movedSlides;
    setLandscapeTransition(true);
    setLandscapeIndex(newIndex);
    setLandscapeDragX(0);
  };

  const handleEndPortrait = (clientX) => {
    setIsDragging(false);
    setTransitionEnabled(true);
    const deltaX = clientX - touchStartX.current;
    const swipeThreshold = window.innerWidth * 0.1;
    if (deltaX > swipeThreshold) setCurrentProjectIndex((prev) => prev - 1);
    else if (deltaX < -swipeThreshold) setCurrentProjectIndex((prev) => prev + 1);
    setDragX(0);
  };

  useEffect(() => {
    if (currentProjectIndex === 0) {
      setTimeout(() => {
        setTransitionEnabled(false);
        setCurrentProjectIndex(initialProjects.length);
      }, 400);
    } else if (currentProjectIndex === initialProjects.length + 1) {
      setTimeout(() => {
        setTransitionEnabled(false);
        setCurrentProjectIndex(1);
      }, 400);
    }
  }, [currentProjectIndex]);

  useEffect(() => {
    if (landscapeIndex <= initialProjects.length - VISIBLE_COUNT) {
      setTimeout(() => {
        setLandscapeTransition(false);
        setLandscapeIndex(initialProjects.length * 2 - VISIBLE_COUNT);
      }, 400);
    } else if (landscapeIndex >= initialProjects.length * 2) {
      setTimeout(() => {
        setLandscapeTransition(false);
        setLandscapeIndex(initialProjects.length);
      }, 400);
    }
  }, [landscapeIndex]);

  const getProjectStyle = (project, isPortrait = false) => {
    const portraitSpacing = 2.5;
    const landscapeSpacing = 1.5;
    if (isPortrait) {
      return {
        flex: "0 0 95%",
        margin: `0 ${portraitSpacing}%`,
        backgroundImage: `url('${project.image}')`,
      };
    } else {
      const tileWidthPercent = (100 - landscapeSpacing * 2 * VISIBLE_COUNT) / VISIBLE_COUNT;
      return {
        flex: `0 0 ${tileWidthPercent}%`,
        margin: `0 ${landscapeSpacing}%`,
        backgroundImage: `url('${project.image}')`,
      };
    }
  };

  const renderProjectContent = (project, isLandscape) => {
    const words = project.name.split(" ");
    return (
      <div style={{ position: "absolute", inset: 0, display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden", pointerEvents: "none", padding: "5%", textAlign: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%" }}>
          {words.map((word, idx) => (
            <div key={idx} style={{
              fontSize: isLandscape ? "min(3vw, 10vh)" : "min(10vw, 8vh)",
              fontWeight: "bold",
              color: "white",
              mixBlendMode: "difference",
              whiteSpace: "nowrap",
              lineHeight: "1",
              filter: "drop-shadow(0 0 3px black) drop-shadow(0 0 6px black)",
              fontFamily: "var(--font-main)",
            }}>{word}</div>
          ))}
        </div>
        <div style={{ position: "absolute", inset: 0, backgroundColor: "white", zIndex: -1 }} />
      </div>
    );
  };

  const handleTileClick = (project) => {
    if (!clickPrevented && project.route) {
      navigate(project.route);
    }
  };

  if (isLandscape) {
    return (
      <div className="homepage-project-container homepage-project-landscape"
        onTouchStart={(e) => handleMouseDownLandscape(e.touches[0])}
        onTouchMove={(e) => handleMouseMoveLandscape(e.touches[0])}
        onTouchEnd={handleMouseUpLandscape}
        onMouseDown={handleMouseDownLandscape}
        onMouseMove={handleMouseMoveLandscape}
        onMouseUp={handleMouseUpLandscape}
        onMouseLeave={handleMouseUpLandscape}>
        <div className="homepage-project-inner" style={{
          transform: `translateX(calc(${-landscapeIndex * (100 / VISIBLE_COUNT)}% + ${landscapeDragX}px))`,
          transition: landscapeTransition ? "transform 400ms ease" : "none",
          display: "flex"
        }}>
          {fullLandscapeProjects.map((project, index) => (
            <div key={index} className="project-tile" style={getProjectStyle(project, false)} onClick={() => handleTileClick(project)}>
              {renderProjectContent(project, true)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="homepage-project-container homepage-project-portrait"
      onTouchStart={(e) => handleMouseDownPortrait(e.touches[0])}
      onTouchMove={(e) => handleMouseMovePortrait(e.touches[0])}
      onTouchEnd={(e) => handleMouseUpPortrait(e.changedTouches[0])}
      onMouseDown={handleMouseDownPortrait}
      onMouseMove={handleMouseMovePortrait}
      onMouseUp={handleMouseUpPortrait}
      onMouseLeave={handleMouseUpPortrait}>
      <div className="homepage-project-inner" style={{
        transform: `translateX(calc(${-currentProjectIndex * 100}% + ${dragX}px))`,
        transition: transitionEnabled ? "transform 400ms ease" : "none",
        display: "flex"
      }}>
        {fullPortraitProjects.map((project, index) => {
          const realProject = index === 0
            ? initialProjects[initialProjects.length - 1]
            : index === fullPortraitProjects.length - 1
              ? initialProjects[0]
              : initialProjects[index - 1];
          return (
            <div key={index} className="project-tile" style={getProjectStyle(realProject, true)} onClick={() => handleTileClick(realProject)}>
              {renderProjectContent(realProject, false)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default HomePageProject;
