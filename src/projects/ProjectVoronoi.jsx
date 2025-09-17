// // ProjectVoronoi.jsx
// // Canvas + always-visible explainer + inline convergence bar under controls.
// // Starts paused, seeds random points, image overlay hidden by default.

// import React, { useEffect, useRef, useState } from "react";
// import HeaderBar from "../components/HeaderBar";
// import FooterBar from "../components/FooterBar";
// import "./ProjectVoronoi.css";
// import initVoronoiStippling from "./ProjectVoronoiShader"; // default export

// export default function ProjectVoronoi() {
//   const canvasRef = useRef(null);
//   const simRef = useRef(null);

//   // UI state
//   const [isRunning, setIsRunning] = useState(false); // start paused
//   const [showImage, setShowImage] = useState(false); // overlay OFF by default
//   const [numPoints, setNumPoints] = useState(5000);

//   // Convergence (raw from solver) + smoothed progress bar
//   const [conv, setConv] = useState({
//     normStep: Infinity,
//     threshold: 0.002,
//     done: false,
//   });
//   const [progress, setProgress] = useState(0); // 0..1 (smoothed)
//   const initialStepRef = useRef(null);         // for log-range mapping

//   // Tunables
//   const POINT_RADIUS = 1.6;
//   const GAMMA = 1.2;
//   const SAMPLE_RES = 200;
//   const CAP_STRENGTH = 0.6;
//   const WEIGHT_LR = 0.25;
//   const MAX_MOVE = 2.0;
//   const BLUR_RADIUS = 1.0;
//   const EPS = 0.002;

//   // Initialize solver once (random seeds; paused)
//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (!canvas || simRef.current) return;

//     simRef.current = initVoronoiStippling(canvas, {
//       numPoints,
//       pointRadius: POINT_RADIUS,
//       intensityGamma: GAMMA,
//       sampleResolution: SAMPLE_RES,
//       capacityStrength: CAP_STRENGTH,
//       weightLearningRate: WEIGHT_LR,
//       maxMove: MAX_MOVE,
//       blurRadius: BLUR_RADIUS,
//       convergenceEps: EPS,
//       showImage, // false initially

//       // Fixed preview settings (no UI sliders)
//       bwPreview: true,
//       bwThreshold: 0.5,
//       bwDither: "bayer8",
//       bwDitherStrength: 0.7,

//       onConvergence: ({ normStep, threshold, done }) => {
//         if (initialStepRef.current == null) {
//           const safeStart = Math.max(normStep, threshold * 50);
//           initialStepRef.current = Number.isFinite(safeStart) ? safeStart : 1;
//         }
//         const start = initialStepRef.current;
//         const thr = Math.max(1e-12, threshold || EPS);
//         const stepClamped = Math.max(normStep, thr);
//         const raw = Math.log(start / stepClamped) / Math.log(start / thr);
//         const rawClamped = Math.max(0, Math.min(1, raw));
//         const alpha = 0.08;
//         setProgress((p) => (done ? 1 : p + alpha * (rawClamped - p)));
//         setConv({ normStep, threshold: thr, done });
//       },
//     });

//     // Draw initial random dots (paused)
//     simRef.current.render();

//     // Preload /public/Giraffe.png (does NOT auto-run)
//     preloadDefaultImage();

//     const onResize = () => simRef.current?.resize();
//     window.addEventListener("resize", onResize);
//     return () => {
//       window.removeEventListener("resize", onResize);
//       simRef.current?.pause();
//       simRef.current = null;
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // ---------- EXIF Orientation (JPEG) ----------
//   async function readExifOrientation(file) {
//     try {
//       const buf = await file.arrayBuffer();
//       const view = new DataView(buf);
//       if (view.getUint16(0) !== 0xffd8) return 1; // not JPEG
//       let offset = 2;
//       const length = view.byteLength;
//       while (offset < length) {
//         const marker = view.getUint16(offset); offset += 2;
//         if (marker === 0xffe1) {
//           const exifLength = view.getUint16(offset); offset += 2;
//           if (view.getUint32(offset) === 0x45786966 && view.getUint16(offset + 4) === 0x0000) {
//             const tiffOffset = offset + 6;
//             const little = view.getUint16(tiffOffset) === 0x4949;
//             const get16 = (o) => view.getUint16(o, little);
//             const get32 = (o) => view.getUint32(o, little);
//             const firstIFD = get32(tiffOffset + 4) + tiffOffset;
//             const entries = get16(firstIFD);
//             for (let i = 0; i < entries; i++) {
//               const entry = firstIFD + 2 + i * 12;
//               const tag = get16(entry);
//               if (tag === 0x0112) return get16(entry + 8) || 1;
//             }
//           }
//           break;
//         } else if ((marker & 0xff00) !== 0xff00) {
//           break;
//         } else {
//           offset += view.getUint16(offset);
//         }
//       }
//     } catch {}
//     return 1;
//   }

//   function drawOrientedToCanvas(img, orientation) {
//     const w = img.naturalWidth || img.width;
//     const h = img.naturalHeight || img.height;
//     const oc = document.createElement("canvas");
//     const octx = oc.getContext("2d");
//     const swap = orientation >= 5 && orientation <= 8;
//     oc.width = swap ? h : w;
//     oc.height = swap ? w : h;

//     octx.save();
//     switch (orientation) {
//       case 2: octx.translate(oc.width, 0); octx.scale(-1, 1); break;
//       case 3: octx.translate(oc.width, oc.height); octx.rotate(Math.PI); break;
//       case 4: octx.translate(0, oc.height); octx.scale(1, -1); break;
//       case 5: octx.rotate(0.5 * Math.PI); octx.scale(1, -1); break;
//       case 6: octx.rotate(0.5 * Math.PI); octx.translate(0, -oc.width); break;
//       case 7: octx.rotate(-0.5 * Math.PI); octx.scale(1, -1); octx.translate(-oc.height, 0); break;
//       case 8: octx.rotate(-0.5 * Math.PI); octx.translate(-oc.height, 0); break;
//       default: break;
//     }
//     octx.drawImage(img, 0, 0);
//     octx.restore();
//     return oc;
//   }

//   // Preload from /public (served at /Giraffe.png) — paused after load
//   async function preloadDefaultImage() {
//     try {
//       const url = (process.env.PUBLIC_URL || "") + "/Giraffe.png";
//       const img = new Image();
//       img.decoding = "async";
//       img.src = url;
//       await img.decode();
//       const orientedCanvas = drawOrientedToCanvas(img, 1);
//       simRef.current?.setDensityFromImageCanvas(orientedCanvas);

//       // stay paused by default on preload
//       setIsRunning(false);
//       initialStepRef.current = null;
//       setProgress(0);
//       setConv((c) => ({ ...c, normStep: Infinity, done: false }));
//     } catch {
//       // ignore if missing
//     }
//   }

//   // Upload handler: load density, then auto-run if currently paused
//   async function handleFile(e) {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     const orientation = file.type === "image/jpeg" ? await readExifOrientation(file) : 1;

//     const src = URL.createObjectURL(file);
//     const img = new Image();
//     img.decoding = "async";
//     img.src = src;
//     await img.decode();

//     const orientedCanvas = drawOrientedToCanvas(img, orientation);
//     simRef.current?.setDensityFromImageCanvas(orientedCanvas);

//     if (!isRunning) { simRef.current?.run(); setIsRunning(true); }

//     URL.revokeObjectURL(src);

//     initialStepRef.current = null;
//     setProgress(0);
//     setConv((c) => ({ ...c, normStep: Infinity, done: false }));
//   }

//   // Run / Pause
//   const handleRunPause = () => {
//     if (!simRef.current) return;
//     if (isRunning) { simRef.current.pause(); setIsRunning(false); }
//     else { simRef.current.run(); setIsRunning(true); }
//   };

//   // Reset (uses current numPoints)
//   const handleReset = () => {
//     simRef.current?.reset(numPoints);
//     simRef.current?.render();
//     initialStepRef.current = null;
//     setProgress(0);
//     setConv((c) => ({ ...c, normStep: Infinity, done: false }));
//   };

//   // Toggle image visibility
//   const handleToggleImage = () => {
//     const next = !showImage;
//     setShowImage(next);
//     simRef.current?.setImageVisibility(next);
//   };

//   // Points slider
//   const handlePointsChange = (e) => {
//     const n = Number(e.target.value);
//     setNumPoints(n);
//     simRef.current?.reset(n);
//     simRef.current?.render();
//     initialStepRef.current = null;
//     setProgress(0);
//     setConv((c) => ({ ...c, normStep: Infinity, done: false }));
//   };

//   const percentLabel = conv.done ? "Converged" : `${Math.round(progress * 100)}%`;

//   // Small helper: inline style to mimic .intro-image from Boids if not present here
//   const imgStyle = { display: "block", margin: "0.5rem auto", maxWidth: "100%", height: "auto", borderRadius: 6 };

//   // Reusable inline convergence bar (goes under buttons)
//   const ConvergenceBar = () => (
//     <div style={{ marginTop: 12 }}>
//       <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, color: "#334155" }}>
//         <strong>Convergence:</strong>
//         <div style={{ flex: 1, height: 8, background: "#e5e7eb", borderRadius: 999 }}>
//           <div
//             style={{
//               width: `${conv.done ? 100 : Math.round(progress * 100)}%`,
//               height: "100%",
//               background: conv.done ? "#10b981" : "#6366f1",
//               borderRadius: 999,
//               transition: "width 180ms linear",
//             }}
//           />
//         </div>
//         <div style={{ minWidth: 100, textAlign: "right" }}>
//           {percentLabel}
//         </div>
//       </div>
//     </div>
//   );

//   return (
//   <div className="project-wrapper">
//     <HeaderBar />

//     <main className="project-main">
//       <div className="intro-section">
//         <h2>Dots, Cells &amp; Giraffes: A Tiny Tour of Stippling</h2>

//         {/* What is stippling + how artists actually do it */}
//         <p style={{ marginTop: 6, color: "#475569" }}>
//           <a href="https://en.wikipedia.org/wiki/Stippling" target="_blank" rel="noreferrer">Stippling</a> is drawing with tiny dots. To make shadows,
//           artists simply pack more dots into darker areas and leave highlights almost empty.
//           Along curves and edges they’ll sometimes lay down little chains of dots to echo the form and
//           keep everything feeling smooth and alive.
//         </p>

//         {/* Hand-stippling GIF (first) */}
//         <img
//           src={`${process.env.PUBLIC_URL}/HandStippling.gif`}
//           alt="Hand stippling"
//           className="intro-image"
//           style={imgStyle}
//         />

//         {/* How computers can do it (Voronoi + relaxation, giraffes, centers) */}
//         <h3 style={{ marginTop: 12 }}>How computers can do it</h3>
//         <p>
//           A computer can “stipple” an image by sprinkling a bunch of dots and
//           letting them self-organize. The trick is to let each dot claim the
//           pixels closest to it, this makes a patchwork called a{" "}
//           <a href="https://en.wikipedia.org/wiki/Voronoi_diagram" target="_blank" rel="noreferrer">Voronoi diagram</a>.
//           Then we nudge each dot toward the center of its patch and repeat. This gentle nudge-and-repeat step is
//           called <a href="https://en.wikipedia.org/wiki/Lloyd%27s_algorithm" target="_blank" rel="noreferrer">relaxation</a>.
//         </p>
//         <p>
//           There are two “centers” you’ll hear about:
//           <br />
//           • <a href="https://en.wikipedia.org/wiki/Centroid" target="_blank" rel="noreferrer">Geometric centre</a>: the plain middle of the cell.<br />
//           • <a href="https://en.wikipedia.org/wiki/Center_of_mass" target="_blank" rel="noreferrer">Centre of mass</a>: the darkness-weighted middle, so darker
//           pixels pull harder. Think of it like a hammer—the geometric centre isn’t the same as the centre of mass.
//           Using weighted centres makes dots drift into shadows, exactly what an artist would do by hand.
//         </p>
//         <p>
//           This patchwork isn’t just a computer thing—you see similar tiling in
//           nature, like the blocky mosaics on a <a
//                 href="https://en.wikipedia.org/wiki/Giraffe#Species_and_subspecies"
//                 target="_blank"
//                 rel="noreferrer"
//               >
//                 giraffe’s coat
//               </a>
//               . Different
//           processes make those patterns, but the look is very Voronoi-ish.
//         </p>

//         {/* Voronoi (two GIFs side-by-side) */}
//         <div
//           style={{
//             display: "grid",
//             gridTemplateColumns: "1fr 1fr",
//             gap: "8px",
//             alignItems: "center",
//             marginTop: "12px",
//           }}
//         >
//           <img
//             src={`${process.env.PUBLIC_URL}/Voronoi1.gif`}
//             alt="Voronoi cells forming"
//             className="intro-image"
//             style={{ ...imgStyle, margin: 0 }}
//           />
//           <img
//             src={`${process.env.PUBLIC_URL}/Voronoi2.gif`}
//             alt="Dots sliding to density-weighted centroids"
//             className="intro-image"
//             style={{ ...imgStyle, margin: 0 }}
//           />
//         </div>

//         {/* Hexagonal crystallinity + Shade Balls link */}
//         <h3 style={{ marginTop: 12 }}>Why hexagons keep popping up</h3>
//         <p>
//           Keep relaxing and the dots start arranging themselves like a{" "}
//           <a href="https://en.wikipedia.org/wiki/Crystal" target="_blank" rel="noreferrer">crystal</a>.
//           Locally, the patches want to be as even as possible, so the dots settle into a hexagonal packing—the same way soap
//           bubbles and real crystals often organize when they’re minimising “energy”. Don’t worry though: it’s just the universe whispering,
//           “hexagons are efficient.”
//         </p>
//         <p>
//           If you like satisfying packing stories, Veritasium’s video on{" "}
//           <a
//             href="https://www.youtube.com/watch?v=uxPdPpi5W4o"
//             target="_blank"
//             rel="noreferrer"
//           >
//             Shade Balls
//           </a>{" "}
//           shows how millions of spheres self-arrange on water, another glimpse of
//           order emerging from simple rules.
//         </p>

//         {/* CCPD GIF (last) */}
//         <img
//           src={`${process.env.PUBLIC_URL}/CrystalineStructure.gif`}
//           alt="Crystalline hexagonal structure emerging"
//           className="intro-image"
//           style={imgStyle}
//         />

//         {/* Capacity Constrained Point Distribution */}
//         <h3 style={{ marginTop: 12 }}>Capacity-Constrained: cleaner dots, fewer artifacts</h3>
//         <p>
//           Pure relaxation tends to over-crystallize (hello, hexagons).
//           <a
//             href="https://graphics.uni-konstanz.de/publikationen/Balzer2009CapacityconstrainedPoint/Balzer2009CapacityconstrainedPoint.pdf"
//             target="_blank"
//             rel="noreferrer"
//           >
//             Capacity-Constrained Point Distribution (CCPD)
//           </a>
//           fixes that by giving every dot the same amount of image mass to “own”.
//           Dark pixels weigh more than light ones. Instead of equal areas, each dot balances equal capacity.
//           The result keeps dots concentrated where the image is dark, without locking into a rigid honeycomb.
//         </p>
//         <p>
//         That’s why CCPD ends up looking like{" "}
//         <a href="https://en.wikipedia.org/wiki/Colors_of_noise#Blue_noise" target="_blank" rel="noreferrer">blue noise</a>
//         (dots that feel evenly sprinkled, with no clumps and no obvious grid). Our eyes are very good at spotting
//         stripes, bands, or checkerboard patterns, which can look distracting (that’s the “moiré” effect). Blue-noise
//         spreads tiny differences around so nothing lines up into bands, and the texture fades into the picture causing you to
//          just see smooth shading. Think of it like “salt shaken evenly over a surface”: you don’t notice the grains,
//         only the even tone.
//       </p>

//       </div>


//       {/* Canvas */}
//       <div className="canvas-wrapper" style={{ minHeight: 420, marginTop: 12 }}>
//         <canvas
//           ref={canvasRef}
//           className="project-canvas"
//           style={{ width: "100%", height: "100%", display: "block" }}
//         />
//       </div>

//       {/* Controls */}
//       <div className="upload-buttons" style={{ flexWrap: "wrap", gap: 8 }}>
//         <label className="upload-button" style={{ cursor: "pointer" }}>
//           Upload Photo
//           <input type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
//         </label>

//         <button onClick={handleRunPause} className="upload-button">
//           {isRunning ? "Pause" : "Run"}
//         </button>

//         <button onClick={handleReset} className="upload-button">
//           Reset
//         </button>

//         <button onClick={handleToggleImage} className="upload-button">
//           {showImage ? "Hide Image" : "Show Image"}
//         </button>
//       </div>

//       {/* Inline convergence bar (right under the buttons) */}
//       <ConvergenceBar />

//       {/* Points slider */}
//       <div className="slider-stack" style={{ marginTop: 12 }}>
//         <label className="slider-label">
//           Points: {numPoints.toLocaleString()}
//           <input
//             type="range"
//             min={500}
//             max={20000}
//             step={100}
//             value={numPoints}
//             onChange={handlePointsChange}
//           />
//         </label>
//       </div>
//     </main>

//     <FooterBar />
//   </div>
// );

// }
// ProjectVoronoi.jsx
// Canvas + always-visible explainer + inline convergence bar under controls.
// Starts paused, seeds random points, image overlay hidden by default.
// Now with a Contrast slider that remaps the uploaded image (and the pixel preview).

import React, { useEffect, useRef, useState } from "react";
import HeaderBar from "../components/HeaderBar";
import FooterBar from "../components/FooterBar";
import "./ProjectVoronoi.css";
import initVoronoiStippling from "./ProjectVoronoiShader"; // default export

export default function ProjectVoronoi() {
  const canvasRef = useRef(null);
  const simRef = useRef(null);

  // UI state
  const [isRunning, setIsRunning] = useState(false); // start paused
  const [showImage, setShowImage] = useState(false); // overlay OFF by default
  const [numPoints, setNumPoints] = useState(5000);
  const [contrast, setContrast] = useState(1.0);     // NEW: image contrast (1.0 = neutral)

  // Convergence (raw from solver) + smoothed progress bar
  const [conv, setConv] = useState({
    normStep: Infinity,
    threshold: 0.002,
    done: false,
  });
  const [progress, setProgress] = useState(0); // 0..1 (smoothed)
  const initialStepRef = useRef(null);         // for log-range mapping

  // Tunables
  const POINT_RADIUS = 1.6;
  const GAMMA = 1.2;
  const SAMPLE_RES = 200;
  const CAP_STRENGTH = 0.6;
  const WEIGHT_LR = 0.25;
  const MAX_MOVE = 2.0;
  const BLUR_RADIUS = 1.0;
  const EPS = 0.002;

  // Initialize solver once (random seeds; paused)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || simRef.current) return;

    simRef.current = initVoronoiStippling(canvas, {
      numPoints,
      pointRadius: POINT_RADIUS,
      intensityGamma: GAMMA,
      sampleResolution: SAMPLE_RES,
      capacityStrength: CAP_STRENGTH,
      weightLearningRate: WEIGHT_LR,
      maxMove: MAX_MOVE,
      blurRadius: BLUR_RADIUS,
      convergenceEps: EPS,
      showImage,             // false initially
      imageContrast: contrast, // NEW: start with current contrast

      // Fixed preview settings (kept as in your file)
      bwPreview: true,
      bwThreshold: 0.5,
      bwDither: "bayer8",
      bwDitherStrength: 0.7,

      onConvergence: ({ normStep, threshold, done }) => {
        if (initialStepRef.current == null) {
          const safeStart = Math.max(normStep, threshold * 50);
          initialStepRef.current = Number.isFinite(safeStart) ? safeStart : 1;
        }
        const start = initialStepRef.current;
        const thr = Math.max(1e-12, threshold || EPS);
        const stepClamped = Math.max(normStep, thr);
        const raw = Math.log(start / stepClamped) / Math.log(start / thr);
        const rawClamped = Math.max(0, Math.min(1, raw));
        const alpha = 0.08;
        setProgress((p) => (done ? 1 : p + alpha * (rawClamped - p)));
        setConv({ normStep, threshold: thr, done });
      },
    });

    // Draw initial random dots (paused)
    simRef.current.render();

    // Preload /public/Giraffe.png (does NOT auto-run)
    preloadDefaultImage();

    const onResize = () => simRef.current?.resize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      simRef.current?.pause();
      simRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- EXIF Orientation (JPEG) ----------
  async function readExifOrientation(file) {
    try {
      const buf = await file.arrayBuffer();
      const view = new DataView(buf);
      if (view.getUint16(0) !== 0xffd8) return 1; // not JPEG
      let offset = 2;
      const length = view.byteLength;
      while (offset < length) {
        const marker = view.getUint16(offset); offset += 2;
        if (marker === 0xffe1) {
          const exifLength = view.getUint16(offset); offset += 2;
          if (view.getUint32(offset) === 0x45786966 && view.getUint16(offset + 4) === 0x0000) {
            const tiffOffset = offset + 6;
            const little = view.getUint16(tiffOffset) === 0x4949;
            const get16 = (o) => view.getUint16(o, little);
            const get32 = (o) => view.getUint32(o, little);
            const firstIFD = get32(tiffOffset + 4) + tiffOffset;
            const entries = get16(firstIFD);
            for (let i = 0; i < entries; i++) {
              const entry = firstIFD + 2 + i * 12;
              const tag = get16(entry);
              if (tag === 0x0112) return get16(entry + 8) || 1;
            }
          }
          break;
        } else if ((marker & 0xff00) !== 0xff00) {
          break;
        } else {
          offset += view.getUint16(offset);
        }
      }
    } catch {}
    return 1;
  }

  function drawOrientedToCanvas(img, orientation) {
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    const oc = document.createElement("canvas");
    const octx = oc.getContext("2d");
    const swap = orientation >= 5 && orientation <= 8;
    oc.width = swap ? h : w;
    oc.height = swap ? w : h;

    octx.save();
    switch (orientation) {
      case 2: octx.translate(oc.width, 0); octx.scale(-1, 1); break;
      case 3: octx.translate(oc.width, oc.height); octx.rotate(Math.PI); break;
      case 4: octx.translate(0, oc.height); octx.scale(1, -1); break;
      case 5: octx.rotate(0.5 * Math.PI); octx.scale(1, -1); break;
      case 6: octx.rotate(0.5 * Math.PI); octx.translate(0, -oc.width); break;
      case 7: octx.rotate(-0.5 * Math.PI); octx.scale(1, -1); octx.translate(-oc.height, 0); break;
      case 8: octx.rotate(-0.5 * Math.PI); octx.translate(-oc.height, 0); break;
      default: break;
    }
    octx.drawImage(img, 0, 0);
    octx.restore();
    return oc;
  }

  // Preload from /public (served at /Giraffe.png) — paused after load
  async function preloadDefaultImage() {
    try {
      const url = (process.env.PUBLIC_URL || "") + "/Giraffe.png";
      const img = new Image();
      img.decoding = "async";
      img.src = url;
      await img.decode();
      const orientedCanvas = drawOrientedToCanvas(img, 1);
      simRef.current?.setDensityFromImageCanvas(orientedCanvas);

      // stay paused by default on preload
      setIsRunning(false);
      initialStepRef.current = null;
      setProgress(0);
      setConv((c) => ({ ...c, normStep: Infinity, done: false }));
    } catch {
      // ignore if missing
    }
  }

  // Upload handler: load density, then auto-run if currently paused
  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const orientation = file.type === "image/jpeg" ? await readExifOrientation(file) : 1;

    const src = URL.createObjectURL(file);
    const img = new Image();
    img.decoding = "async";
    img.src = src;
    await img.decode();

    const orientedCanvas = drawOrientedToCanvas(img, orientation);
    simRef.current?.setDensityFromImageCanvas(orientedCanvas);

    if (!isRunning) { simRef.current?.run(); setIsRunning(true); }

    URL.revokeObjectURL(src);

    initialStepRef.current = null;
    setProgress(0);
    setConv((c) => ({ ...c, normStep: Infinity, done: false }));
  }

  // Run / Pause
  const handleRunPause = () => {
    if (!simRef.current) return;
    if (isRunning) { simRef.current.pause(); setIsRunning(false); }
    else { simRef.current.run(); setIsRunning(true); }
  };

  // Reset (uses current numPoints)
  const handleReset = () => {
    simRef.current?.reset(numPoints);
    simRef.current?.render();
    initialStepRef.current = null;
    setProgress(0);
    setConv((c) => ({ ...c, normStep: Infinity, done: false }));
  };

  // Toggle image visibility
  const handleToggleImage = () => {
    const next = !showImage;
    setShowImage(next);
    simRef.current?.setImageVisibility(next);
  };

  // Points slider
  const handlePointsChange = (e) => {
    const n = Number(e.target.value);
    setNumPoints(n);
    simRef.current?.reset(n);
    simRef.current?.render();
    initialStepRef.current = null;
    setProgress(0);
    setConv((c) => ({ ...c, normStep: Infinity, done: false }));
  };

  // Contrast slider — behave exactly like the points slider
  const handleContrastChange = (e) => {
    const v = parseFloat(e.target.value);
    setContrast(v);

    const s = simRef.current;
    if (!s) return;

    // apply contrast to rebuild density & pixel preview
    s.setImageContrast?.(v);

    // re-seed + redraw using the current point count (same as points slider)
    s.reset?.(numPoints);
    s.render?.();

    // reset convergence UI just like the points slider does
    initialStepRef.current = null;
    setProgress(0);
    setConv((c) => ({ ...c, normStep: Infinity, done: false }));
  };


  const percentLabel = conv.done ? "Converged" : `${Math.round(progress * 100)}%`;

  // Small helper: inline style to mimic .intro-image from Boids if not present here
  const imgStyle = { display: "block", margin: "0.5rem auto", maxWidth: "100%", height: "auto", borderRadius: 6 };

  // Reusable inline convergence bar (goes under buttons)
  const ConvergenceBar = () => (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, color: "#334155" }}>
        <strong>Convergence:</strong>
        <div style={{ flex: 1, height: 8, background: "#e5e7eb", borderRadius: 999 }}>
          <div
            style={{
              width: `${conv.done ? 100 : Math.round(progress * 100)}%`,
              height: "100%",
              background: conv.done ? "#10b981" : "#6366f1",
              borderRadius: 999,
              transition: "width 180ms linear",
            }}
          />
        </div>
        <div style={{ minWidth: 100, textAlign: "right" }}>
          {percentLabel}
        </div>
      </div>
    </div>
  );

  return (
    <div className="project-wrapper">
      <HeaderBar />

      <main className="project-main">
        <div className="intro-section">
          <h2>Dots, Cells &amp; Giraffes: A Tiny Tour of Stippling</h2>

          {/* What is stippling + how artists actually do it */}
          <p style={{ marginTop: 6, color: "#475569" }}>
            <a href="https://en.wikipedia.org/wiki/Stippling" target="_blank" rel="noreferrer">Stippling</a> is drawing with tiny dots. To make shadows,
            artists simply pack more dots into darker areas and leave highlights almost empty.
            Along curves and edges they’ll sometimes lay down little chains of dots to echo the form and
            keep everything feeling smooth and alive.
          </p>

          {/* Hand-stippling GIF (first) */}
          <img
            src={`${process.env.PUBLIC_URL}/HandStippling.gif`}
            alt="Hand stippling"
            className="intro-image"
            style={imgStyle}
          />

          {/* How computers can do it (Voronoi + relaxation, giraffes, centers) */}
          <h3 style={{ marginTop: 12 }}>How computers can do it</h3>
          <p>
            A computer can “stipple” an image by sprinkling a bunch of dots and
            letting them self-organize. The trick is to let each dot claim the
            pixels closest to it, this makes a patchwork called a{" "}
            <a href="https://en.wikipedia.org/wiki/Voronoi_diagram" target="_blank" rel="noreferrer">Voronoi diagram</a>.
            Then we nudge each dot toward the center of its patch and repeat. This gentle nudge-and-repeat step is
            called <a href="https://en.wikipedia.org/wiki/Lloyd%27s_algorithm" target="_blank" rel="noreferrer">relaxation</a>.
          </p>
          <p>
            There are two “centers” you’ll hear about:
            <br />
            • <a href="https://en.wikipedia.org/wiki/Centroid" target="_blank" rel="noreferrer">Geometric centre</a>: the plain middle of the cell.<br />
            • <a href="https://en.wikipedia.org/wiki/Center_of_mass" target="_blank" rel="noreferrer">Centre of mass</a>: the darkness-weighted middle, so darker
            pixels pull harder. Think of it like a hammer—the geometric centre isn’t the same as the centre of mass.
            Using weighted centres makes dots drift into shadows, exactly what an artist would do by hand.
          </p>
          <p>
            This patchwork isn’t just a computer thing—you see similar tiling in
            nature, like the blocky mosaics on a <a
                  href="https://en.wikipedia.org/wiki/Giraffe#Species_and_subspecies"
                  target="_blank"
                  rel="noreferrer"
                >
                  giraffe’s coat
                </a>
                . Different
            processes make those patterns, but the look is very Voronoi-ish.
          </p>

          {/* Voronoi (two GIFs side-by-side) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
              alignItems: "center",
              marginTop: "12px",
            }}
          >
            <img
              src={`${process.env.PUBLIC_URL}/Voronoi1.gif`}
              alt="Voronoi cells forming"
              className="intro-image"
              style={{ ...imgStyle, margin: 0 }}
            />
            <img
              src={`${process.env.PUBLIC_URL}/Voronoi2.gif`}
              alt="Dots sliding to density-weighted centroids"
              className="intro-image"
              style={{ ...imgStyle, margin: 0 }}
            />
          </div>

          {/* Hexagonal crystallinity + Shade Balls link */}
          <h3 style={{ marginTop: 12 }}>Why hexagons keep popping up</h3>
          <p>
            Keep relaxing and the dots start arranging themselves like a{" "}
            <a href="https://en.wikipedia.org/wiki/Crystal" target="_blank" rel="noreferrer">crystal</a>.
            Locally, the patches want to be as even as possible, so the dots settle into a hexagonal packing—the same way soap
            bubbles and real crystals often organize when they’re minimising “energy”. Don’t worry though: it’s just the universe whispering,
            “hexagons are efficient.”
          </p>
          <p>
            If you like satisfying packing stories, Veritasium’s video on{" "}
            <a
              href="https://www.youtube.com/watch?v=uxPdPpi5W4o"
              target="_blank"
              rel="noreferrer"
            >
              Shade Balls
            </a>{" "}
            shows how millions of spheres self-arrange on water, another glimpse of
            order emerging from simple rules.
          </p>

          {/* CCPD GIF (last) */}
          <img
            src={`${process.env.PUBLIC_URL}/CrystalineStructure.gif`}
            alt="Crystalline hexagonal structure emerging"
            className="intro-image"
            style={imgStyle}
          />

          {/* Capacity Constrained Point Distribution */}
          <h3 style={{ marginTop: 12 }}>Capacity-Constrained: cleaner dots, fewer artifacts</h3>
          <p>
            Pure relaxation tends to over-crystallize (hello, hexagons).
            <a
              href="https://graphics.uni-konstanz.de/publikationen/Balzer2009CapacityconstrainedPoint/Balzer2009CapacityconstrainedPoint.pdf"
              target="_blank"
              rel="noreferrer"
            >
              Capacity-Constrained Point Distribution (CCPD)
            </a>
            fixes that by giving every dot the same amount of image mass to “own”.
            Dark pixels weigh more than light ones. Instead of equal areas, each dot balances equal capacity.
            The result keeps dots concentrated where the image is dark, without locking into a rigid honeycomb.
          </p>
          <p>
            That’s why CCPD ends up looking like{" "}
            <a href="https://en.wikipedia.org/wiki/Colors_of_noise#Blue_noise" target="_blank" rel="noreferrer">blue noise</a>
            (dots that feel evenly sprinkled, with no clumps and no obvious grid). Our eyes are very good at spotting
            stripes, bands, or checkerboard patterns, which can look distracting (that’s the “moiré” effect). Blue-noise
            spreads tiny differences around so nothing lines up into bands, and the texture fades into the picture causing you to
            just see smooth shading. Think of it like “salt shaken evenly over a surface”: you don’t notice the grains,
            only the even tone.
          </p>
        </div>

        {/* Canvas */}
        <div className="canvas-wrapper" style={{ minHeight: 420, marginTop: 12 }}>
          <canvas
            ref={canvasRef}
            className="project-canvas"
            style={{ width: "100%", height: "100%", display: "block" }}
          />
        </div>

        {/* Controls */}
        <div className="upload-buttons" style={{ flexWrap: "wrap", gap: 8 }}>
          <label className="upload-button" style={{ cursor: "pointer" }}>
            Upload Photo
            <input type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
          </label>

          <button onClick={handleRunPause} className="upload-button">
            {isRunning ? "Pause" : "Run"}
          </button>

          <button onClick={handleReset} className="upload-button">
            Reset
          </button>

          <button onClick={handleToggleImage} className="upload-button">
            {showImage ? "Hide Image" : "Show Image"}
          </button>
        </div>

        {/* Inline convergence bar (right under the buttons) */}
        <ConvergenceBar />

        {/* Sliders */}
        <div className="slider-stack" style={{ marginTop: 12 }}>
          <label className="slider-label">
            Points: {numPoints.toLocaleString()}
            <input
              type="range"
              min={500}
              max={20000}
              step={100}
              value={numPoints}
              onChange={handlePointsChange}
            />
          </label>

          {/* NEW: Contrast slider */}
          <label className="slider-label" style={{ marginTop: 8 }}>
            Contrast: {contrast.toFixed(2)}
            <input
              type="range"
              min={0.3}
              max={2.5}
              step={0.01}
              value={contrast}
              onChange={handleContrastChange}
            />
          </label>
        </div>
      </main>

      <FooterBar />
    </div>
  );
}
