import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./HomePageProject.css";

const projects = [
  { name: "REACTION DIFFUSION", image: process.env.PUBLIC_URL + "/ReactionDiffusion.png" },
  { name: "GLYPHS", image: process.env.PUBLIC_URL + "/Blocks.jpg" },
  { name: "SINGLE LINE", image: process.env.PUBLIC_URL + "/SingleLine.jpg" },
  { name: "HALFTONES", image: process.env.PUBLIC_URL + "/Halftones.jpg" },
];

function HomePageProject() {
  const navigate = useNavigate();
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
  const [currentProjectIndex, setCurrentProjectIndex] = useState(1);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [transitionEnabled, setTransitionEnabled] = useState(true);

  const touchStartX = useRef(0);
  const startDragX = useRef(0);

  const fullProjects = [projects[projects.length - 1], ...projects, projects[0]];

  useEffect(() => {
    const handleResize = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const nextProject = () => setCurrentProjectIndex((prev) => prev + 1);
  const prevProject = () => setCurrentProjectIndex((prev) => prev - 1);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    startDragX.current = dragX;
    setIsDragging(true);
    setTransitionEnabled(false);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    setDragX(startDragX.current + (currentX - touchStartX.current));
  };

  const handleTouchEnd = (e) => {
    setIsDragging(false);
    setTransitionEnabled(true);
    const endX = e.changedTouches[0].clientX;
    const deltaX = endX - touchStartX.current;
    const swipeThreshold = window.innerWidth * 0.1;

    if (deltaX > swipeThreshold) {
      prevProject();
    } else if (deltaX < -swipeThreshold) {
      nextProject();
    }

    setDragX(0);
  };

  useEffect(() => {
    if (currentProjectIndex === 0) {
      setTimeout(() => {
        setTransitionEnabled(false);
        setCurrentProjectIndex(projects.length);
      }, 300);
    }
    if (currentProjectIndex === projects.length + 1) {
      setTimeout(() => {
        setTransitionEnabled(false);
        setCurrentProjectIndex(1);
      }, 300);
    }
  }, [currentProjectIndex]);

  const getProjectStyle = (project, isPortrait = false) => ({
    flex: isPortrait ? "0 0 95%" : "1",
    margin: isPortrait ? "0 2.5%" : "0",
    backgroundImage: `url('${project.image}')`,
  });

  const renderProjectContent = (project, isLandscape) => {
    const words = project.name.split(" ");
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
          pointerEvents: "none",
          padding: "5%",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
          }}
        >
          {words.map((word, idx) => (
            <div
              key={idx}
              style={{
                fontSize: isLandscape ? "min(3vw, 10vh)" : "min(10vw, 8vh)",
                fontWeight: "bold",
                color: "white",
                mixBlendMode: "difference",
                whiteSpace: "nowrap",
                lineHeight: "1",
                filter: "drop-shadow(0 0 3px black) drop-shadow(0 0 6px black)",
                fontFamily: "var(--font-main)",
              }}
            >
              {word}
            </div>
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "white",
            zIndex: -1,
          }}
        />
      </div>
    );
  };

  if (isLandscape) {
    return (
      <div className="homepage-project-container homepage-project-landscape">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: "100%", width: "100%", gap: "4%" }}>
          {projects.map((project, index) => (
            <div
              key={index}
              className="project-tile"
              style={getProjectStyle(project, false)}
              onClick={() => {
                if (project.name === "GLYPHS") navigate("/glyphs");
              }}
            >
              {renderProjectContent(project, true)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="homepage-project-container homepage-project-portrait"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="homepage-project-inner"
        style={{
          transform: `translateX(calc(${-currentProjectIndex * 100}% + ${dragX}px))`,
          transition: transitionEnabled ? "transform 0.3s ease" : "none",
        }}
      >
        {fullProjects.map((project, index) => {
          const realProject =
            index === 0
              ? projects[projects.length - 1]
              : index === fullProjects.length - 1
              ? projects[0]
              : projects[index - 1];

          return (
            <div
              key={index}
              className="project-tile"
              style={getProjectStyle(realProject, true)}
              onClick={() => {
                if (realProject.name === "GLYPHS") navigate("/glyphs");
              }}
            >
              {renderProjectContent(realProject, false)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default HomePageProject;
