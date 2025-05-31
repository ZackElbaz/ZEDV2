import React, { useState, useEffect, useRef } from "react";

const projects = [
  { name: "REACTION DIFFUSION", image: "/ReactionDiffusion.png" },
  { name: "GLYPHS", image: "/Blocks.jpg" },
  { name: "SINGLE LINE", image: "/SingleLine.jpg" },
  { name: "HALFTONES", image: "/Halftones.jpg" },
];

function HomePageProject() {
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
  const [currentProjectIndex, setCurrentProjectIndex] = useState(1);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [transitionEnabled, setTransitionEnabled] = useState(true);

  const landscapePadding = "4%";
  const portraitPadding = "10%";
  const backgroundColor = "#DDDDDD";

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
    flex: isPortrait ? "0 0 95%" : "1", // In portrait, we slide each 95% width; landscape they flex equally
    margin: isPortrait ? "0 2.5%" : "0",
    height: "100%",
    borderRadius: "20px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
    background: `url('${project.image}') center center / cover no-repeat`,
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    boxShadow: "0 10px 20px rgba(0, 0, 0, 0.2)",
    transition: "box-shadow 0.3s ease",
    cursor: "pointer",
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

  // LANDSCAPE: show all 4
  if (isLandscape) {
    return (
      <div
        style={{
          height: "100%",
          width: "100%",
          padding: `${landscapePadding}`,
          boxSizing: "border-box",
          backgroundColor: backgroundColor,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            height: "100%",
            width: "100%",
            gap: landscapePadding,
          }}
        >
          {projects.map((project, index) => (
            <div
              key={index}
              style={getProjectStyle(project, false)}
              onClick={() => {
                if (project.name === "GLYPHS") {
                  window.location.href = "/glyphs";
                }
              }}
            >
              {renderProjectContent(project, true)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // PORTRAIT: swipeable one-at-a-time view
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        padding: `${portraitPadding}`,
        boxSizing: "border-box",
        overflow: "hidden",
        touchAction: "pan-y",
        position: "relative",
        backgroundColor: backgroundColor,
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        style={{
          display: "flex",
          height: "100%",
          transform: `translateX(calc(${-currentProjectIndex * 100}% + ${dragX}px))`,
          transition: transitionEnabled ? "transform 0.3s ease" : "none",
        }}
      >
        {fullProjects.map((project, index) => {
          let realProject;
          if (index === 0) {
            realProject = projects[projects.length - 1];
          } else if (index === fullProjects.length - 1) {
            realProject = projects[0];
          } else {
            realProject = projects[index - 1];
          }

          return (
            <div
              key={index}
              style={getProjectStyle(realProject, true)}
              onClick={() => {
                if (realProject.name === "GLYPHS") {
                  window.location.href = "/glyphs";
                }
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
