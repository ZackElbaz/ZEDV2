// // ProjectBoids.jsx
// import React, { useEffect, useRef, useState } from "react";
// import HeaderBar from "../components/HeaderBar";
// import FooterBar from "../components/FooterBar";
// import { initBoidSimulation } from "./ProjectBoidsShader";
// import "./ProjectBoids.css";

// export default function ProjectBoids() {
//   const canvasRef = useRef(null);
//   const diagramRef = useRef(null);
//   const simRef = useRef(null);
//   const activeSliderRef = useRef(null);

//   const paramsRef = useRef({
//     boidSpeed: 2.0,
//     sameSpeciesFlocking: 1.0,
//     preyAttract: 1.0,
//     predatorFear: 1.0,
//     types: 3,
//   });

//   const [sliders, setSliders] = useState({
//     boidSpeed: 2.0,
//     sameSpeciesFlocking: 1.0,
//     preyAttract: 1.0,
//     predatorFear: 1.0,
//   });

//   const [paused, setPaused] = useState(true);
//   const [counts, setCounts] = useState([]);

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (canvas && !simRef.current) {
//       simRef.current = initBoidSimulation(canvas, paramsRef, setCounts);
//       simRef.current.pause();
//     }

//     const handleResize = () => {
//       if (!canvas) return;
//       canvas.width = canvas.clientWidth;
//       canvas.height = canvas.clientHeight;
//       simRef.current?.reset(); // Optional: reinitialize boids to fit new canvas size
//     };

//     window.addEventListener("resize", handleResize);
//     handleResize(); // Trigger once on mount

//     return () => window.removeEventListener("resize", handleResize);
//   }, []);


//   useEffect(() => {
//     const canvas = diagramRef.current;
//     const types = paramsRef.current.types;
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
//       ctx.arc(fromX, fromY, 6, 0, 2 * Math.PI);
//       ctx.fillStyle = color;
//       ctx.fill();

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
//       ctx.beginPath();
//       ctx.arc(from.x, from.y, 6, 0, 2 * Math.PI);
//       ctx.fillStyle = from.color;
//       ctx.fill();

//       points.forEach((to, j) => {
//         if ((i - j + types) % types > types / 2) {
//           drawArrow(ctx, from.x, from.y, to.x, to.y, from.color);
//         }
//       });
//     });
//   }, [paramsRef.current.types]);

//   const handleSliderChange = (key, value) => {
//     const newVal = parseFloat(value);
//     setSliders(prev => ({ ...prev, [key]: newVal }));
//     paramsRef.current[key] = newVal;
//   };

//   function handleSliderFocus(e) {
//     const hue = Math.floor(Math.random() * 360);
//     const thumbColor = `hsl(${hue}, 100%, 50%)`;
//     const trackColor = `hsl(${(hue + 180) % 360}, 100%, 50%)`;
//     e.target.style.setProperty("--thumb-color", thumbColor);
//     e.target.style.setProperty("--track-color", trackColor);
//     activeSliderRef.current = e.target;
//   }

//   function handleSliderBlur(e) {
//     e.target.style.removeProperty("--thumb-color");
//     e.target.style.removeProperty("--track-color");
//     activeSliderRef.current = null;
//   }

//   const togglePause = () => {
//     if (paused) simRef.current?.resume();
//     else simRef.current?.pause();
//     setPaused(!paused);
//   };

//   const resetSimulation = () => {
//     simRef.current?.reset();
//   };

//   const incrementTypes = () => {
//     paramsRef.current.types = Math.min(100, paramsRef.current.types + 1);
//     resetSimulation();
//   };

//   const decrementTypes = () => {
//     paramsRef.current.types = Math.max(1, paramsRef.current.types - 1);
//     resetSimulation();
//   };

//   const total = counts.reduce((a, b) => a + b, 0) || 1;
//   const maxIndex = counts.reduce(
//     (maxIdx, val, i, arr) => (val > arr[maxIdx] ? i : maxIdx),
//     0
//   );
//   const leaderName = `Boid ${maxIndex + 1}`;

//   const typeColors = i => `hsl(${(i * 360) / paramsRef.current.types}, 100%, 50%)`;

//   return (
//     <div className="project-wrapper">
//       <HeaderBar />
//       <main className="project-main">
//         <div className="intro-section">
//           <h1>Boids</h1>
//           <p>
//             This project was inspired by <a href="https://www.youtube.com/watch?v=iujUAB0c42c" target="_blank" rel="noopener noreferrer">a video</a> by Airapport.
//             <br /><br />
//             Nature is full of mesmerizing patterns—flocks of birds sweeping through the sky, shoals of fish darting through the ocean, or swarms of insects moving like a single living cloud. These movements seem almost magical, but they’re often driven by a few simple rules followed which control how an individual reacts to their surroundings.
//             <br /><br />
//             <img src={`${process.env.PUBLIC_URL}/Swarm.gif`} alt="Swarm simulation" className="intro-image" />
//             <br /><br />
//             That’s exactly what this simulation is based on. A <a href="https://en.wikipedia.org/wiki/Boids" target="_blank" rel="noopener noreferrer"><strong>boid</strong></a> (short for “bird-oid”) is a little virtual creature that mimics this natural group behavior. Each boid doesn't know what the whole flock is doing—it just looks around, responds to its nearby neighbors, and follows three core instincts.
//             <br /><br />
//             <strong>Cohesion</strong>: Boids try to stay close to others of their species, much like fish do when grouping together for protection.<br />
//             <strong>Separation</strong>: They avoid getting too close to each other, as no one wants to crash!<br />
//             <strong>Alignment</strong>: They match direction with their nearby species so they all flow together and can capitalise on their numbers for both hunting prey and avoiding predators.
//             <br /><br />
//             With just these three rules, boids start to behave like real animals in flowing flocks, gliding around obstacles, and even reacting to predators or prey.
//             <br /><br />
//             That’s where the sliders below come in. They let you fine-tune how the boids behave:
//             <br /><br />
//             • <strong>Flocking</strong> adjusts how strongly they stick together as a group.<br />
//             • <strong>Boid Speed</strong> controls how fast everything moves—slow for smooth patterns, fast for wild chaos.<br />
//             • <strong>Prey Attraction</strong> makes predator boids aggressively hunt their prey.<br />
//             • <strong>Predator Avoidance</strong> causes prey to be more alert and scatter when something’s chasing them.
//             <br /><br />
//             Boids in this simulation move across what’s called a <a href="https://en.wikipedia.org/wiki/Toroid" target="_blank" rel="noopener noreferrer"><strong>toroidal surface</strong></a>, this is a looping world where the left edge connects to the right, and the top to the bottom. It means no matter where a boid goes, it never hits a boundary, it just wraps around. Think of it like <a href="https://en.wikipedia.org/wiki/Pac-Man" target="_blank" rel="noopener noreferrer"><strong>Pac-Man</strong></a> escaping out one side of the maze and reappearing on the other.
//             <br /><br />
//             <img
//               src={`${process.env.PUBLIC_URL}/Pacman.gif`}
//               alt="Toroidal movement illustration with Pac-Man"
//               className="intro-image"
//             />

//             <br /><br />
//             Run the simulation below and tweak the sliders to watch the flock shift from calm to chaotic, from graceful to frantic. Even though each boid is following only local rules, the group behavior that emerges is surprisingly lifelike—and endlessly fun to explore.
//             <br /><br />
//             Welcome to the flock 🐦
//           </p>
//         </div>

//         <div className="canvas-wrapper">
//           <canvas ref={canvasRef} className="project-canvas" />
//           <div style={{ position: "relative", height: "20px", display: "flex", margin: "1rem 0", border: "1px solid #ccc", width: canvasRef.current?.clientWidth || '100%' }}>
//             {Array.from({ length: paramsRef.current.types }).map((_, i) => (
//               <div
//                 key={i}
//                 style={{
//                   width: `${((counts[i] || 0) / total) * 100}%`,
//                   backgroundColor: typeColors(i),
//                   position: "relative",
//                 }}
//               >
//                 {i === maxIndex && (
//                   <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "black", fontWeight: "bold", fontSize: "14px", textShadow: "1px 1px 2px white" }}>
//                     {leaderName}
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         </div>

//         <div className="upload-buttons" style={{ marginBottom: "1rem" }}>
//           <button onClick={togglePause}>
//             {paused ? "Run Simulation" : "Pause Simulation"}
//           </button>
//           <button onClick={resetSimulation}>Reset</button>
//         </div>

//         <div className="intro-section">
//           <p>
//             This diagram shows how different boid types interact in a cycle of predator and prey—kind of like a game of <a href="https://en.wikipedia.org/wiki/Rock_paper_scissors" target="_blank" rel="noopener noreferrer">rock-paper-scissors</a>... or even <a href="https://en.wikipedia.org/wiki/Rock_paper_scissors#Rock-Paper-Scissors-Spock-Lizard" target="_blank" rel="noopener noreferrer">rock-paper-scissors-lizard-Spock</a>. Each boid can “hunt” some of the other boids and “be hunted” by others, creating a loop of conversions. For example, if a boid from type A touches the back of type B (its prey), it converts B into another A. But if type B beats type C, and type C beats type A, you’ve got a loop!  
//             <br /><br />
//             The trick? This system will always give a clear winner when using an <strong>odd number</strong> of boid types for example: 3, 5, 7, and so on. This ensures there’s always a balance of power with no ties. Over time, one dominant type tends to emerge as the winner… unless you tweak the sliders and mix things up again!
//           </p>
//         </div>

//         <div style={{ marginTop: "1rem", textAlign: "center" }}>
//           <p>
//             Add or remove boid species (<strong>{paramsRef.current.types}</strong>):
//           </p>
//           <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
//             <button onClick={decrementTypes}>-</button>
//             <button onClick={incrementTypes}>+</button>
//           </div>
//         </div>


//         <canvas ref={diagramRef} width={300} height={300} style={{ margin: "1rem auto", display: "block" }} />
        
//         <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
//           <p>
//             Number of species: <strong>{paramsRef.current.types}</strong><br />
//             Outcome:{" "}
//             <strong>
//               {paramsRef.current.types % 2 === 1
//                 ? "Decisive — a dominant species will always emerge"
//                 : "Indecisive — the system can loop without a definitive winner"}
//             </strong>
//           </p>
//         </div>


//         <div className="slider-stack">
//           {Object.entries(sliders).map(([key, value]) => (
//             <label key={key} className="slider-label">
//               {key.replace(/([A-Z])/g, ' $1')}: {value.toFixed(2)}
//               <input
//                 type="range"
//                 min={key === "sameSpeciesFlocking" ? -2 : 0.5}
//                 max={5}
//                 step={0.1}
//                 value={value}
//                 onChange={(e) => handleSliderChange(key, e.target.value)}
//                 onPointerDown={handleSliderFocus}
//                 onPointerUp={handleSliderBlur}
//                 onTouchStart={handleSliderFocus}
//                 onTouchEnd={handleSliderBlur}
//                 onBlur={handleSliderBlur}
//               />
//             </label>
//           ))}
//         </div>
//       </main>
//       <FooterBar />
//     </div>
//   );
// }

///////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////

// // ProjectBoids.jsx
// // -----------------------------------------------------------------------------
// // React UI + canvas (anti-jitter turning version)
// // -----------------------------------------------------------------------------
// import React, { useEffect, useRef, useState } from "react";
// import { initBoidSimulation } from "./ProjectBoidsShader";

// export default function ProjectBoids() {
//   const canvasRef = useRef(null);
//   const simRef = useRef(null);

//   const [ui, setUI] = useState({
//     separation: 0.85,
//     alignment: 2.15,
//     cohesion: 2.35,
//     viewDistance: 120,
//     viewAngle: 140,
//   });

//   const [types, setTypes] = useState(3);
//   const [paused, setPaused] = useState(true);
//   const [counts, setCounts] = useState([]);

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (!canvas || simRef.current) return;

//     const sim = initBoidSimulation(
//       canvas,
//       {
//         numBoids: 220,
//         boidRadius: 6,
//         // Calmer flight
//         maxSpeed: 1.6,
//         minSpeed: 0.7,
//         flightMin: 1.05,

//         // Adaptive turning baseline
//         baseTurn: 0.055,
//         turnRefSpeed: 1.8,

//         // Anti-jitter yaw dynamics
//         turnGain: 0.9,
//         maxYawRate: 0.055,
//         maxYawAcc: 0.020,
//         yawFriction: 0.08,
//         turnDeadband: 0.010,
//         turnHysteresis: 0.45,

//         // Steering feel
//         desireSmooth: 0.42,
//         wanderStrength: 0.040,

//         // Accel/decel shaping
//         maxDvUp: 0.006,
//         maxDvDown: 0.025,

//         // Engine & gameplay
//         maxForce: 0.06,
//         drag: 0.002,
//         conversionRadius: 10,

//         // Awareness beyond FOV
//         preyAlertDist: 140,
//         predPeripheralDist: 160,
//         predPeripheralWeight: 0.45,
//       },
//       {
//         separation: ui.separation,
//         alignment: ui.alignment,
//         cohesion: ui.cohesion,
//         viewDistance: ui.viewDistance,
//         viewAngleDeg: ui.viewAngle,
//         types,
//       },
//       setCounts
//     );

//     simRef.current = sim;
//     sim.pause();

//     const handleResize = () => {
//       if (!canvas) return;
//       canvas.width = canvas.clientWidth;
//       canvas.height = canvas.clientHeight;
//       sim.resize(canvas.width, canvas.height);
//     };

//     window.addEventListener("resize", handleResize);
//     handleResize();

//     return () => {
//       window.removeEventListener("resize", handleResize);
//       sim.stop();
//       simRef.current = null;
//     };
//   }, []);

//   useEffect(() => {
//     simRef.current?.setParams({
//       separation: ui.separation,
//       alignment: ui.alignment,
//       cohesion: ui.cohesion,
//       viewDistance: ui.viewDistance,
//       viewAngleDeg: ui.viewAngle,
//       types,
//     });
//   }, [ui, types]);

//   const toggleRun = () => { if (!simRef.current) return; if (paused) simRef.current.resume(); else simRef.current.pause(); setPaused(p => !p); };
//   const reset = () => { simRef.current?.reset(types); };
//   const decTypes = () => { const t = Math.max(1, types - 1); setTypes(t); simRef.current?.reset(t); };
//   const incTypes = () => { const t = Math.min(99, types + 1); setTypes(t); simRef.current?.reset(t); };

//   const total = Math.max(1, counts.reduce((a, b) => a + b, 0));
//   const maxIdx = counts.reduce((m, v, i, a) => (v > (a[m] || 0) ? i : m), 0);

//   return (
//     <div className="project-wrapper" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
//       <header style={{ padding: "0.75rem 1rem", borderBottom: "1px solid #ddd" }}>
//         <h1 style={{ margin: 0 }}>Boids — Anti‑Jitter Flight</h1>
//         <p style={{ margin: "0.25rem 0 0", color: "#555" }}>
//           Swoopy flocking with yaw inertia, adaptive turn radius, avoidance, and lead pursuit.
//         </p>
//       </header>

//       <main style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 320px", gap: "1rem", padding: "1rem", alignItems: "stretch" }}>
//         <section style={{ position: "relative", border: "1px solid #eee", borderRadius: 12, overflow: "hidden" }}>
//           <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
//           <div style={{ position: "absolute", left: 16, bottom: 16, right: 16, height: 20, display: "flex", border: "1px solid #ccc", background: "#fff8", backdropFilter: "blur(2px)" }}>
//             {Array.from({ length: types }).map((_, i) => {
//               const w = ((counts[i] || 0) / total) * 100;
//               return (
//                 <div key={i} style={{ width: `${w}%`, backgroundColor: hslColor(i, types, 45), position: "relative" }}>
//                   {i === maxIdx && w > 8 && (
//                     <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>Type {i + 1}</div>
//                   )}
//                 </div>
//               );
//             })}
//           </div>
//         </section>

//         <aside style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
//           <fieldset style={panelStyle}>
//             <legend style={legendStyle}>Simulation</legend>
//             <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 8 }}>
//               <button onClick={toggleRun} style={btnStyle}>{paused ? "Run" : "Pause"}</button>
//               <button onClick={reset} style={btnStyle}>Reset</button>
//             </div>
//             <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 8, marginTop: 8, alignItems: "center" }}>
//               <span>Types</span>
//               <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
//                 <button onClick={decTypes} style={btnStyle}>−</button>
//                 <div style={{ minWidth: 28, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{types}</div>
//                 <button onClick={incTypes} style={btnStyle}>+</button>
//               </div>
//               <span />
//             </div>
//           </fieldset>

//           <fieldset style={panelStyle}>
//             <legend style={legendStyle}>Flocking (per species)</legend>
//             <Slider label="Separation" min={0} max={3} step={0.05} value={ui.separation} onChange={(v) => setUI((s) => ({ ...s, separation: v }))} />
//             <Slider label="Alignment"  min={0} max={3} step={0.05} value={ui.alignment}  onChange={(v) => setUI((s) => ({ ...s, alignment: v }))} />
//             <Slider label="Cohesion"    min={0} max={3} step={0.05} value={ui.cohesion}    onChange={(v) => setUI((s) => ({ ...s, cohesion: v }))} />
//           </fieldset>

//           <fieldset style={panelStyle}>
//             <legend style={legendStyle}>Sensing (field of view)</legend>
//             <Slider label="View distance" min={30} max={300} step={1} value={ui.viewDistance} onChange={(v) => setUI((s) => ({ ...s, viewDistance: v }))} />
//             <Slider label="View angle"    min={20} max={180} step={1} value={ui.viewAngle}    onChange={(v) => setUI((s) => ({ ...s, viewAngle: v }))} suffix="°" />
//           </fieldset>
//         </aside>
//       </main>

//       <footer style={{ padding: "0.5rem 1rem", borderTop: "1px solid #eee", color: "#666" }}>
//         Yaw inertia • Adaptive turn radius • No hover • Lead pursuit • Toroidal world.
//       </footer>
//     </div>
//   );
// }

// function Slider({ label, min, max, step, value, onChange, suffix }) {
//   return (
//     <label style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 8 }}>
//       <span>{label}</span>
//       <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} style={{ appearance: "none", width: "100%" }} />
//       <span style={{ minWidth: 52, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{value.toFixed?.(typeof step === "number" && step >= 1 ? 0 : 2)}{suffix || ""}</span>
//     </label>
//   );
// }

// const panelStyle = { border: "1px solid #eee", borderRadius: 12, padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" };
// const legendStyle = { padding: "0 0.25rem", fontWeight: 600 };
// const btnStyle = { padding: "0.35rem 0.6rem", border: "1px solid #ddd", borderRadius: 8, background: "#fff" };

// function hslColor(i, n, l = 50) { return `hsl(${(i * 360) / Math.max(1, n)}, 100%, ${l}%)`; }
// ///////////////////////////////////////////////////////////////////////////////////////////
// //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////////

import React, { useEffect, useRef, useState, useCallback } from "react";
import ProjectTemplate from "../components/ProjectTemplate/ProjectTemplate";
import { initBoidSimulation } from "./ProjectBoidsShader";

export default function ProjectBoids() {
  const canvasRef = useRef(null);
  const diagramRef = useRef(null);
  const simRef = useRef(null);

  const [ui, setUI] = useState({
    separation: 0.85,
    alignment: 2.15,
    cohesion: 2.35,
    viewDistance: 120,
    viewAngle: 140,
  });

  const [types, setTypes] = useState(3);
  const [paused, setPaused] = useState(true);
  const pausedRef = useRef(true);
  const [counts, setCounts] = useState([]);

  const renderOne = useCallback(() => {
    const sim = simRef.current;
    if (!sim) return;

    if (typeof sim.renderOnce === "function") {
      try {
        sim.renderOnce();
      } catch {}
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || simRef.current) return;

    const sim = initBoidSimulation(
      canvas,
      {
        numBoids: 220,
        boidRadius: 6,
        maxSpeed: 1.6,
        minSpeed: 0.7,
        flightMin: 1.05,
        baseTurn: 0.055,
        turnRefSpeed: 1.8,
        turnGain: 0.9,
        maxYawRate: 0.055,
        maxYawAcc: 0.02,
        yawFriction: 0.08,
        turnDeadband: 0.01,
        turnHysteresis: 0.45,
        desireSmooth: 0.42,
        wanderStrength: 0.04,
        maxDvUp: 0.006,
        maxDvDown: 0.025,
        maxForce: 0.06,
        drag: 0.002,
        conversionRadius: 10,
        preyAlertDist: 140,
        predPeripheralDist: 160,
        predPeripheralWeight: 0.45,
      },
      {
        separation: ui.separation,
        alignment: ui.alignment,
        cohesion: ui.cohesion,
        viewDistance: ui.viewDistance,
        viewAngleDeg: ui.viewAngle,
        types,
      },
      setCounts
    );

    simRef.current = sim;

    const handleResize = () => {
      const c = canvasRef.current;
      if (!c || !simRef.current) return;
      c.width = c.clientWidth;
      c.height = c.clientHeight;
      simRef.current.resize(c.width, c.height);
      if (pausedRef.current) renderOne();
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    sim.pause();
    pausedRef.current = true;
    setPaused(true);
    renderOne();

    return () => {
      window.removeEventListener("resize", handleResize);
      sim.stop();
      simRef.current = null;
    };
  }, [renderOne]);

  useEffect(() => {
    simRef.current?.setParams({
      separation: ui.separation,
      alignment: ui.alignment,
      cohesion: ui.cohesion,
      viewDistance: ui.viewDistance,
      viewAngleDeg: ui.viewAngle,
      types,
    });

    if (pausedRef.current) {
      renderOne();
    }
  }, [ui, types, renderOne]);

  useEffect(() => {
    const canvas = diagramRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const n = Math.max(1, types);
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = 100;
    const step = (2 * Math.PI) / n;

    const pts = Array.from({ length: n }, (_, i) => {
      const a = i * step - Math.PI / 2;
      return {
        x: cx + radius * Math.cos(a),
        y: cy + radius * Math.sin(a),
        color: `hsl(${(i * 360) / n}, 100%, 50%)`,
      };
    });

    const arrow = (x1, y1, x2, y2, color) => {
      const head = 10;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const ang = Math.atan2(dy, dx);

      ctx.beginPath();
      ctx.arc(x1, y1, 6, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(
        x2 - head * Math.cos(ang - Math.PI / 6),
        y2 - head * Math.sin(ang - Math.PI / 6)
      );
      ctx.lineTo(
        x2 - head * Math.cos(ang + Math.PI / 6),
        y2 - head * Math.sin(ang + Math.PI / 6)
      );
      ctx.lineTo(x2, y2);
      ctx.fillStyle = color;
      ctx.fill();
    };

    pts.forEach((from, i) => {
      ctx.beginPath();
      ctx.arc(from.x, from.y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = from.color;
      ctx.fill();

      pts.forEach((to, j) => {
        if ((i - j + n) % n > n / 2) {
          arrow(from.x, from.y, to.x, to.y, from.color);
        }
      });
    });
  }, [types]);

  const forcePauseUi = () => {
    simRef.current?.pause();
    pausedRef.current = true;
    setPaused(true);
  };

  const togglePause = () => {
    const sim = simRef.current;
    if (!sim) return;

    setPaused((p) => {
      const next = !p;
      pausedRef.current = next;
      if (next) sim.pause();
      else sim.resume();
      return next;
    });
  };

  const resetSimulation = () => {
    const sim = simRef.current;
    if (!sim) return;

    sim.reset(types);
    if (pausedRef.current) {
      renderOne();
    } else {
      sim.resume();
    }
  };

  const incrementTypes = () => {
    const t = Math.min(99, types + 1);
    setTypes(t);

    const sim = simRef.current;
    if (!sim) return;

    sim.reset(t);
    if (pausedRef.current) {
      renderOne();
    } else {
      sim.resume();
    }
  };

  const decrementTypes = () => {
    const t = Math.max(1, types - 1);
    setTypes(t);

    const sim = simRef.current;
    if (!sim) return;

    sim.reset(t);
    if (pausedRef.current) {
      renderOne();
    } else {
      sim.resume();
    }
  };

  const total = Math.max(1, counts.reduce((a, b) => a + b, 0));
  const maxIdx = counts.reduce((m, v, i, a) => (v > (a[m] || 0) ? i : m), 0);
  const leaderName = `Boid ${maxIdx + 1}`;
  const typeColor = (i) => `hsl(${(i * 360) / Math.max(1, types)}, 100%, 50%)`;

  const intro = [
    {
      type: "paragraph",
      content: (
        <>
          This project was inspired by{" "}
          <a
            href="https://www.youtube.com/watch?v=iujUAB0c42c"
            target="_blank"
            rel="noopener noreferrer"
          >
            a video
          </a>{" "}
          by Airapport.
          <br />
          <br />
          Nature is full of mesmerizing patterns—flocks of birds sweeping
          through the sky, shoals of fish darting through the ocean, or swarms
          of insects moving like a single living cloud. These movements seem
          almost magical, but they’re often driven by a few simple rules
          followed which control how an individual reacts to their surroundings.
        </>
      ),
    },
    {
      type: "media",
      items: [
        {
          type: "image",
          src: `${process.env.PUBLIC_URL}/Swarm.gif`,
          alt: "Swarm simulation",
        },
      ],
    },
    {
      type: "paragraph",
      content: (
        <>
          That’s exactly what this simulation is based on. A{" "}
          <a
            href="https://en.wikipedia.org/wiki/Boids"
            target="_blank"
            rel="noopener noreferrer"
          >
            <strong>boid</strong>
          </a>{" "}
          (short for “bird-oid”) is a little virtual creature that mimics this
          natural group behavior. Each boid doesn't know what the whole flock is
          doing—it just looks around, responds to its nearby neighbors, and
          follows three core instincts.
          <br />
          <br />
          <strong>Cohesion</strong>: Boids try to stay close to others of their
          species, much like fish do when grouping together for protection.
          <br />
          <strong>Separation</strong>: They avoid getting too close to each
          other, as no one wants to crash!
          <br />
          <strong>Alignment</strong>: They match direction with their nearby
          species so they all flow together and can capitalise on their numbers
          for both hunting prey and avoiding predators.
          <br />
          <br />
          With just these three rules, boids start to behave like real animals
          in flowing flocks, gliding around obstacles, and even reacting to
          predators or prey.
          <br />
          <br />
          That’s where the sliders below come in. They let you fine-tune how the
          boids behave:
          <br />
          <br />
          • <strong>Cohesion</strong>, <strong>Alignment</strong>, and{" "}
          <strong>Separation</strong> adjust flocking strength per species.
          <br />
          • <strong>View Distance</strong> and <strong>View Angle</strong> shape
          their field of view.
          <br />
          <br />
          Boids in this simulation move across what’s called a{" "}
          <a
            href="https://en.wikipedia.org/wiki/Toroid"
            target="_blank"
            rel="noopener noreferrer"
          >
            <strong>toroidal surface</strong>
          </a>
          , this is a looping world where the left edge connects to the right,
          and the top to the bottom. It means no matter where a boid goes, it
          never hits a boundary, it just wraps around. Think of it like{" "}
          <a
            href="https://en.wikipedia.org/wiki/Pac-Man"
            target="_blank"
            rel="noopener noreferrer"
          >
            <strong>Pac-Man</strong>
          </a>{" "}
          escaping out one side of the maze and reappearing on the other.
        </>
      ),
    },
    {
      type: "media",
      items: [
        {
          type: "image",
          src: `${process.env.PUBLIC_URL}/Pacman.gif`,
          alt: "Toroidal movement illustration with Pac-Man",
        },
      ],
    },
    {
      type: "paragraph",
      content: (
        <>
          Run the simulation below and tweak the sliders to watch the flock
          shift from calm to chaotic, from graceful to frantic. Even though each
          boid is following only local rules, the group behavior that emerges is
          surprisingly lifelike—and endlessly fun to explore.
          <br />
          <br />
          Welcome to the flock
        </>
      ),
    },
  ];

  const canvasBlock = (
    <div className="template-canvas-shell">
      <canvas ref={canvasRef} className="template-project-canvas" />
      <div
        style={{
          position: "relative",
          height: "20px",
          display: "flex",
          margin: "1rem 0",
          border: "1px solid #ccc",
          width: "100%",
          background: "#fff8",
          backdropFilter: "blur(2px)",
        }}
      >
        {Array.from({ length: types }).map((_, i) => {
          const w = ((counts[i] || 0) / total) * 100;
          return (
            <div
              key={i}
              style={{
                width: `${w}%`,
                backgroundColor: typeColor(i),
                position: "relative",
              }}
            >
              {i === maxIdx && w > 8 && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "black",
                    fontWeight: "bold",
                    fontSize: "14px",
                    textShadow: "1px 1px 2px white",
                  }}
                >
                  {leaderName}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const buttons = [
    {
      label: paused ? "Run Simulation" : "Pause Simulation",
      onClick: togglePause,
      active: !paused,
    },
    {
      label: "Reset",
      onClick: resetSimulation,
    },
  ];

  const sliders = [
    {
      label: "Separation",
      value: ui.separation,
      min: 0,
      max: 3,
      step: 0.05,
      onChange: (e) => {
        forcePauseUi();
        setUI((s) => ({ ...s, separation: parseFloat(e.target.value) }));
      },
      showValue: true,
      formatValue: (v) => Number(v).toFixed(2),
    },
    {
      label: "Alignment",
      value: ui.alignment,
      min: 0,
      max: 3,
      step: 0.05,
      onChange: (e) => {
        forcePauseUi();
        setUI((s) => ({ ...s, alignment: parseFloat(e.target.value) }));
      },
      showValue: true,
      formatValue: (v) => Number(v).toFixed(2),
    },
    {
      label: "Cohesion",
      value: ui.cohesion,
      min: 0,
      max: 3,
      step: 0.05,
      onChange: (e) => {
        forcePauseUi();
        setUI((s) => ({ ...s, cohesion: parseFloat(e.target.value) }));
      },
      showValue: true,
      formatValue: (v) => Number(v).toFixed(2),
    },
    {
      label: "View Distance",
      value: ui.viewDistance,
      min: 30,
      max: 300,
      step: 1,
      onChange: (e) => {
        forcePauseUi();
        setUI((s) => ({ ...s, viewDistance: parseFloat(e.target.value) }));
      },
      showValue: true,
      formatValue: (v) => Number(v).toFixed(0),
    },
    {
      label: "View Angle",
      value: ui.viewAngle,
      min: 20,
      max: 180,
      step: 1,
      onChange: (e) => {
        forcePauseUi();
        setUI((s) => ({ ...s, viewAngle: parseFloat(e.target.value) }));
      },
      showValue: true,
      formatValue: (v) => `${Number(v).toFixed(0)}°`,
    },
  ];

  const sections = [
    {
      paragraphs: [
        <>
          The diagram below shows how different boid types interact in a cycle
          of predator and prey—kind of like a game of{" "}
          <a
            href="https://en.wikipedia.org/wiki/Rock_paper_scissors"
            target="_blank"
            rel="noopener noreferrer"
          >
            rock-paper-scissors
          </a>
          ... or even{" "}
          <a
            href="https://en.wikipedia.org/wiki/Rock_paper_scissors#Rock-Paper-Scissors-Spock-Lizard"
            target="_blank"
            rel="noopener noreferrer"
          >
            rock-paper-scissors-lizard-Spock
          </a>
          . Each boid can “hunt” some of the other boids and “be hunted” by
          others, creating a loop of conversions. For example, if a boid from
          type A touches the back of type B (its prey), it converts B into
          another A. But if type B beats type C, and type C beats type A, you’ve
          got a loop!
          <br />
          <br />
          Using an <strong>odd number</strong> of species (3, 5, 7, …) yields a
          decisive outcome: the cycle of advantages ensures one species
          ultimately dominates. With an <strong>even number</strong> of species
          (4, 6, 8, …), the interaction splits into pairs with no clear
          superiority between them, so the system can stabilise with two
          surviving species instead of one.
        </>,
      ],
    },
    {
      custom: (
        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          <p>
            Add or remove boid species (<strong>{types}</strong>):
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "0.5rem",
              marginBottom: "1rem",
            }}
          >
            <button className="template-button" onClick={decrementTypes}>
              -
            </button>
            <button className="template-button" onClick={incrementTypes}>
              +
            </button>
          </div>

          <canvas
            ref={diagramRef}
            width={300}
            height={300}
            style={{ margin: "1rem auto", display: "block" }}
          />

          <p>
            Number of species: <strong>{types}</strong>
            <br />
            Outcome:{" "}
            <strong>
              {types % 2 === 1
                ? "Decisive — a dominant species will always emerge"
                : "Indecisive — the system can loop without a definitive winner"}
            </strong>
          </p>
        </div>
      ),
    },
  ];

  return (
    <ProjectTemplate
      title="Boids"
      intro={intro}
      canvasBlock={canvasBlock}
      buttons={buttons}
      sliders={sliders}
      sections={sections}
    />
  );
}