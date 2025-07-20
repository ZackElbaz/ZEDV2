// import React, { useEffect, useRef, useState } from "react";
// import HeaderBar from "../components/HeaderBar";
// import FooterBar from "../components/FooterBar";
// import { initBoidSimulation } from "./ProjectBoidsShader";
// import "./ProjectBoids.css";

// export default function ProjectBoids() {
//   const canvasRef = useRef(null);
//   const diagramRef = useRef(null);
//   const simRef = useRef(null);
//   const paramsRef = useRef({
//     alignment: 1.0,
//     cohesion: 1.0,
//     separation: 1.0,
//     perception: 50,
//     types: 3,
//     maxSpeed: 1.0,
//     maxForce: 0.05,
//     drag: 0.98,
//     wanderStrength: 0.2,
//     });


//   const [sliders, setSliders] = useState({ ...paramsRef.current });
//   const [paused, setPaused] = useState(false);
//   const [counts, setCounts] = useState([]);

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (canvas && !simRef.current) {
//       simRef.current = initBoidSimulation(canvas, paramsRef, setCounts);
//     }
//   }, []);

//   useEffect(() => {
//     const canvas = diagramRef.current;
//     const types = sliders.types;
//     if (!canvas) return;
//     const ctx = canvas.getContext("2d");
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//     const centerX = canvas.width / 2;
//     const centerY = canvas.height / 2;
//     const radius = 100;
//     const angleStep = (2 * Math.PI) / types;
//     const points = Array.from({ length: types }, (_, i) => {
//       const angle = i * angleStep - Math.PI / 2;
//       return {
//         x: centerX + radius * Math.cos(angle),
//         y: centerY + radius * Math.sin(angle),
//         color: `hsl(${(i * 360) / types}, 100%, 50%)`,
//       };
//     });

//     function drawArrow(ctx, fromX, fromY, toX, toY, color) {
//       const headlen = 10;
//       const dx = toX - fromX;
//       const dy = toY - fromY;
//       const angle = Math.atan2(dy, dx);
//       ctx.beginPath();
//       ctx.moveTo(fromX, fromY);
//       ctx.lineTo(toX, toY);
//       ctx.strokeStyle = color;
//       ctx.lineWidth = 3;
//       ctx.stroke();

//       ctx.beginPath();
//       ctx.moveTo(toX, toY);
//       ctx.lineTo(
//         toX - headlen * Math.cos(angle - Math.PI / 6),
//         toY - headlen * Math.sin(angle - Math.PI / 6)
//       );
//       ctx.lineTo(
//         toX - headlen * Math.cos(angle + Math.PI / 6),
//         toY - headlen * Math.sin(angle + Math.PI / 6)
//       );
//       ctx.lineTo(toX, toY);
//       ctx.fillStyle = color;
//       ctx.fill();
//     }

//     points.forEach((from, i) => {
//       points.forEach((to, j) => {
//         if ((i - j + types) % types > types / 2) {
//           drawArrow(ctx, from.x, from.y, to.x, to.y, from.color);
//         }
//       });
//     });
//   }, [sliders.types]);

//   const handleSliderChange = (key, value) => {
//     const newVal = parseFloat(value);
//     setSliders((prev) => ({ ...prev, [key]: newVal }));
//     paramsRef.current[key] = newVal;
//   };

//   const togglePause = () => {
//     if (paused) {
//       simRef.current?.resume();
//     } else {
//       simRef.current?.pause();
//     }
//     setPaused(!paused);
//   };

//   const resetSimulation = () => {
//     simRef.current?.reset();
//   };

//   const incrementTypes = () => {
//     const next = Math.min(100, paramsRef.current.types + 1);
//     paramsRef.current.types = next;
//     setSliders((prev) => ({ ...prev, types: next }));
//     resetSimulation();
//   };

//   const decrementTypes = () => {
//     const next = Math.max(1, paramsRef.current.types - 1);
//     paramsRef.current.types = next;
//     setSliders((prev) => ({ ...prev, types: next }));
//     resetSimulation();
//   };

//   const total = counts.reduce((a, b) => a + b, 0) || 1;
//   const maxIndex = counts.reduce((maxIdx, val, i, arr) => (
//     val > arr[maxIdx] ? i : maxIdx
//   ), 0);
//   const leaderName = `Boid ${maxIndex + 1}`;

//   const typeColors = (i) => `hsl(${(i * 360) / sliders.types}, 100%, 50%)`;

//   return (
//     <div className="project-wrapper">
//       <HeaderBar />
//       <main className="project-main">
//         <div className="intro-section">
//           <h1>Boids</h1>
//           <p>This project simulates flocking behavior with evolving competitive types.</p>
//         </div>

//         <div className="canvas-wrapper">
//           <canvas ref={canvasRef} className="project-canvas" />
//         </div>

//         {/* Visual Population Bar */}
//         <div
//           style={{
//             position: "relative",
//             height: "20px",
//             width: "100%",
//             display: "flex",
//             margin: "1rem 0",
//             border: "1px solid #ccc",
//           }}
//         >
//           {Array.from({ length: sliders.types }).map((_, i) => (
//             <div
//               key={i}
//               style={{
//                 width: `${((counts[i] || 0) / total) * 100}%`,
//                 backgroundColor: typeColors(i),
//                 position: "relative",
//               }}
//             >
//               {i === maxIndex && (
//                 <div
//                   style={{
//                     position: "absolute",
//                     top: 0,
//                     left: 0,
//                     right: 0,
//                     bottom: 0,
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                     color: "black",
//                     fontWeight: "bold",
//                     fontSize: "14px",
//                     textShadow: "1px 1px 2px white",
//                   }}
//                 >
//                   {leaderName}
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>

//         {/* Diagram Canvas */}
//         <canvas
//           ref={diagramRef}
//           width={300}
//           height={300}
//           style={{ margin: "1rem auto", display: "block" }}
//         />

//         {/* Control Buttons */}
//         <div className="upload-buttons" style={{ marginBottom: "1rem" }}>
//           <button onClick={togglePause}>{paused ? "Resume" : "Pause"}</button>
//           <button onClick={resetSimulation}>Reset</button>
//           <button onClick={decrementTypes}>-</button>
//           <button onClick={incrementTypes}>+</button>
//         </div>

//         {/* Slider Section */}
//         <div className="slider-stack">
//           {["alignment", "cohesion", "separation", "perception"].map((key) => (
//             <label className="slider-label" key={key}>
//               {key.charAt(0).toUpperCase() + key.slice(1)}: {sliders[key]}
//               <input
//                 type="range"
//                 value={sliders[key]}
//                 min={key === "perception" ? 10 : 0}
//                 max={key === "perception" ? 150 : 5}
//                 step={key === "perception" ? 1 : 0.1}
//                 onChange={(e) => handleSliderChange(key, e.target.value)}
//               />
//             </label>
//           ))}
//         </div>
//       </main>
//       <FooterBar />
//     </div>
//   );
// }


// ProjectBoids.jsx
import React, { useEffect, useRef, useState } from "react";
import HeaderBar from "../components/HeaderBar";
import FooterBar from "../components/FooterBar";
import { initBoidSimulation } from "./ProjectBoidsShader";
import "./ProjectBoids.css";

export default function ProjectBoids() {
  const canvasRef = useRef(null);
  const diagramRef = useRef(null);
  const simRef = useRef(null);
  const activeSliderRef = useRef(null);

  const paramsRef = useRef({
    boidSpeed: 2.0,
    sameSpeciesFlocking: 1.0,
    preyAttract: 1.0,
    predatorFear: 1.0,
    types: 3,
  });

  const [sliders, setSliders] = useState({
    boidSpeed: 2.0,
    sameSpeciesFlocking: 1.0,
    preyAttract: 1.0,
    predatorFear: 1.0,
  });

  const [paused, setPaused] = useState(true);
  const [counts, setCounts] = useState([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && !simRef.current) {
      simRef.current = initBoidSimulation(canvas, paramsRef, setCounts);
      simRef.current.pause();
    }

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      simRef.current?.reset(); // Optional: reinitialize boids to fit new canvas size
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Trigger once on mount

    return () => window.removeEventListener("resize", handleResize);
  }, []);


  useEffect(() => {
    const canvas = diagramRef.current;
    const types = paramsRef.current.types;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 100;
    const angleStep = (2 * Math.PI) / types;
    const points = Array.from({ length: types }, (_, i) => {
      const angle = i * angleStep - Math.PI / 2;
      return {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        color: `hsl(${(i * 360) / types}, 100%, 50%)`,
      };
    });

    function drawArrow(ctx, fromX, fromY, toX, toY, color) {
      const headlen = 10;
      const dx = toX - fromX;
      const dy = toY - fromY;
      const angle = Math.atan2(dy, dx);

      ctx.beginPath();
      ctx.arc(fromX, fromY, 6, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(toX, toY);
      ctx.lineTo(
        toX - headlen * Math.cos(angle - Math.PI / 6),
        toY - headlen * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        toX - headlen * Math.cos(angle + Math.PI / 6),
        toY - headlen * Math.sin(angle + Math.PI / 6)
      );
      ctx.lineTo(toX, toY);
      ctx.fillStyle = color;
      ctx.fill();
    }

    points.forEach((from, i) => {
      ctx.beginPath();
      ctx.arc(from.x, from.y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = from.color;
      ctx.fill();

      points.forEach((to, j) => {
        if ((i - j + types) % types > types / 2) {
          drawArrow(ctx, from.x, from.y, to.x, to.y, from.color);
        }
      });
    });
  }, [paramsRef.current.types]);

  const handleSliderChange = (key, value) => {
    const newVal = parseFloat(value);
    setSliders(prev => ({ ...prev, [key]: newVal }));
    paramsRef.current[key] = newVal;
  };

  function handleSliderFocus(e) {
    const hue = Math.floor(Math.random() * 360);
    const thumbColor = `hsl(${hue}, 100%, 50%)`;
    const trackColor = `hsl(${(hue + 180) % 360}, 100%, 50%)`;
    e.target.style.setProperty("--thumb-color", thumbColor);
    e.target.style.setProperty("--track-color", trackColor);
    activeSliderRef.current = e.target;
  }

  function handleSliderBlur(e) {
    e.target.style.removeProperty("--thumb-color");
    e.target.style.removeProperty("--track-color");
    activeSliderRef.current = null;
  }

  const togglePause = () => {
    if (paused) simRef.current?.resume();
    else simRef.current?.pause();
    setPaused(!paused);
  };

  const resetSimulation = () => {
    simRef.current?.reset();
  };

  const incrementTypes = () => {
    paramsRef.current.types = Math.min(100, paramsRef.current.types + 1);
    resetSimulation();
  };

  const decrementTypes = () => {
    paramsRef.current.types = Math.max(1, paramsRef.current.types - 1);
    resetSimulation();
  };

  const total = counts.reduce((a, b) => a + b, 0) || 1;
  const maxIndex = counts.reduce(
    (maxIdx, val, i, arr) => (val > arr[maxIdx] ? i : maxIdx),
    0
  );
  const leaderName = `Boid ${maxIndex + 1}`;

  const typeColors = i => `hsl(${(i * 360) / paramsRef.current.types}, 100%, 50%)`;

  return (
    <div className="project-wrapper">
      <HeaderBar />
      <main className="project-main">
        <div className="intro-section">
          <h1>Boids</h1>
          <p>
            This project was inspired by <a href="https://www.youtube.com/watch?v=iujUAB0c42c" target="_blank" rel="noopener noreferrer">a video</a> by Airapport.
            <br /><br />
            Nature is full of mesmerizing patterns—flocks of birds sweeping through the sky, shoals of fish darting through the ocean, or swarms of insects moving like a single living cloud. These movements seem almost magical, but they’re often driven by a few simple rules followed which control how an individual reacts to their surroundings.
            <br /><br />
            <img src={`${process.env.PUBLIC_URL}/Swarm.gif`} alt="Swarm simulation" className="intro-image" />
            <br /><br />
            That’s exactly what this simulation is based on. A <a href="https://en.wikipedia.org/wiki/Boids" target="_blank" rel="noopener noreferrer"><strong>boid</strong></a> (short for “bird-oid”) is a little virtual creature that mimics this natural group behavior. Each boid doesn't know what the whole flock is doing—it just looks around, responds to its nearby neighbors, and follows three core instincts.
            <br /><br />
            <strong>Cohesion</strong>: Boids try to stay close to others of their species, much like fish do when grouping together for protection.<br />
            <strong>Separation</strong>: They avoid getting too close to each other, as no one wants to crash!<br />
            <strong>Alignment</strong>: They match direction with their nearby species so they all flow together and can capitalise on their numbers for both hunting prey and avoiding predators.
            <br /><br />
            With just these three rules, boids start to behave like real animals in flowing flocks, gliding around obstacles, and even reacting to predators or prey.
            <br /><br />
            That’s where the sliders below come in. They let you fine-tune how the boids behave:
            <br /><br />
            • <strong>Flocking</strong> adjusts how strongly they stick together as a group.<br />
            • <strong>Boid Speed</strong> controls how fast everything moves—slow for smooth patterns, fast for wild chaos.<br />
            • <strong>Prey Attraction</strong> makes predator boids aggressively hunt their prey.<br />
            • <strong>Predator Avoidance</strong> causes prey to be more alert and scatter when something’s chasing them.
            <br /><br />
            Boids in this simulation move across what’s called a <a href="https://en.wikipedia.org/wiki/Toroid" target="_blank" rel="noopener noreferrer"><strong>toroidal surface</strong></a>, this is a looping world where the left edge connects to the right, and the top to the bottom. It means no matter where a boid goes, it never hits a boundary, it just wraps around. Think of it like <a href="https://en.wikipedia.org/wiki/Pac-Man" target="_blank" rel="noopener noreferrer"><strong>Pac-Man</strong></a> escaping out one side of the maze and reappearing on the other.
            <br /><br />
            <img
              src={`${process.env.PUBLIC_URL}/Pacman.gif`}
              alt="Toroidal movement illustration with Pac-Man"
              className="intro-image"
            />

            <br /><br />
            Run the simulation below and tweak the sliders to watch the flock shift from calm to chaotic, from graceful to frantic. Even though each boid is following only local rules, the group behavior that emerges is surprisingly lifelike—and endlessly fun to explore.
            <br /><br />
            Welcome to the flock 🐦
          </p>
        </div>

        <div className="canvas-wrapper">
          <canvas ref={canvasRef} className="project-canvas" />
          <div style={{ position: "relative", height: "20px", display: "flex", margin: "1rem 0", border: "1px solid #ccc", width: canvasRef.current?.clientWidth || '100%' }}>
            {Array.from({ length: paramsRef.current.types }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: `${((counts[i] || 0) / total) * 100}%`,
                  backgroundColor: typeColors(i),
                  position: "relative",
                }}
              >
                {i === maxIndex && (
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "black", fontWeight: "bold", fontSize: "14px", textShadow: "1px 1px 2px white" }}>
                    {leaderName}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="upload-buttons" style={{ marginBottom: "1rem" }}>
          <button onClick={togglePause}>
            {paused ? "Run Simulation" : "Pause Simulation"}
          </button>
          <button onClick={resetSimulation}>Reset</button>
        </div>

        <div className="intro-section">
          <p>
            This diagram shows how different boid types interact in a cycle of predator and prey—kind of like a game of <a href="https://en.wikipedia.org/wiki/Rock_paper_scissors" target="_blank" rel="noopener noreferrer">rock-paper-scissors</a>... or even <a href="https://en.wikipedia.org/wiki/Rock_paper_scissors#Rock-Paper-Scissors-Spock-Lizard" target="_blank" rel="noopener noreferrer">rock-paper-scissors-lizard-Spock</a>. Each boid can “hunt” some of the other boids and “be hunted” by others, creating a loop of conversions. For example, if a boid from type A touches the back of type B (its prey), it converts B into another A. But if type B beats type C, and type C beats type A, you’ve got a loop!  
            <br /><br />
            The trick? This system will always give a clear winner when using an <strong>odd number</strong> of boid types for example: 3, 5, 7, and so on. This ensures there’s always a balance of power with no ties. Over time, one dominant type tends to emerge as the winner… unless you tweak the sliders and mix things up again!
          </p>
        </div>

        <div style={{ marginTop: "1rem", textAlign: "center" }}>
          <p>
            Add or remove boid species (<strong>{paramsRef.current.types}</strong>):
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
            <button onClick={decrementTypes}>-</button>
            <button onClick={incrementTypes}>+</button>
          </div>
        </div>


        <canvas ref={diagramRef} width={300} height={300} style={{ margin: "1rem auto", display: "block" }} />
        
        <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
          <p>
            Number of species: <strong>{paramsRef.current.types}</strong><br />
            Outcome:{" "}
            <strong>
              {paramsRef.current.types % 2 === 1
                ? "Decisive — a dominant species will always emerge"
                : "Indecisive — the system can loop without a definitive winner"}
            </strong>
          </p>
        </div>


        <div className="slider-stack">
          {Object.entries(sliders).map(([key, value]) => (
            <label key={key} className="slider-label">
              {key.replace(/([A-Z])/g, ' $1')}: {value.toFixed(2)}
              <input
                type="range"
                min={key === "sameSpeciesFlocking" ? -2 : 0.5}
                max={5}
                step={0.1}
                value={value}
                onChange={(e) => handleSliderChange(key, e.target.value)}
                onPointerDown={handleSliderFocus}
                onPointerUp={handleSliderBlur}
                onTouchStart={handleSliderFocus}
                onTouchEnd={handleSliderBlur}
                onBlur={handleSliderBlur}
              />
            </label>
          ))}
        </div>
      </main>
      <FooterBar />
    </div>
  );
}
