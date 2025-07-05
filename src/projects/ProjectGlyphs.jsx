// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// // working but not text for credit
// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// import React, { useEffect, useRef, useState } from "react";
// import HeaderBar from "../components/HeaderBar";
// import FooterBar from "../components/FooterBar";
// import { setupWebGLRenderer } from "./ProjectGlyphsShader";

// function ProjectGlyphs() {
//   const MAX_SIZE = 1600;
//   const [headerHeight] = useState(80);
//   const [footerHeight] = useState(60);
//   const [mediaType, setMediaType] = useState(null);
//   const [mediaSource, setMediaSource] = useState(null);
//   const [contrast, setContrast] = useState(1.0);
//   const [sharpness, setSharpness] = useState(0.0);
//   const [saturation, setSaturation] = useState(1.0);
//   const [needsUpdate, setNeedsUpdate] = useState(true);
//   const [pixelation, setPixelation] = useState(50);
//   const [videoDevices, setVideoDevices] = useState([]);
//   const [selectedDeviceId, setSelectedDeviceId] = useState("");
//   const [isFrontFacing, setIsFrontFacing] = useState(false);
//   const [glyphImages, setGlyphImages] = useState([]);
//   const [glyphAtlas, setGlyphAtlas] = useState(null);
//   const [showGlyphPreview, setShowGlyphPreview] = useState(false);
//   const [glyphAvgColors, setGlyphAvgColors] = useState([]);

//   const headerRef = useRef(null);
//   const footerRef = useRef(null);
//   const canvasRef = useRef(null);
//   const imageRef = useRef(null);
//   const videoRef = useRef(null);
//   const webcamRef = useRef(null);

//   const getAverageRGB = (ctx, width, height) => {
//     const imageData = ctx.getImageData(0, 0, width, height).data;
//     let r = 0, g = 0, b = 0;
//     for (let i = 0; i < imageData.length; i += 4) {
//       r += imageData[i];
//       g += imageData[i + 1];
//       b += imageData[i + 2];
//     }
//     const total = imageData.length / 4;
//     return [r / total, g / total, b / total];
//   };

//   const processAndCropGlyphs = async (files) => {
//     const imageEntries = files
//       .filter(file => file.type.startsWith("image"))
//       .map((file, index) => ({ file, index }));

//     const results = await Promise.all(imageEntries.map(({ file, index }) =>
//       new Promise(resolve => {
//         const image = new Image();
//         image.onload = () => {
//           const side = Math.min(image.width, image.height);
//           const canvas = document.createElement("canvas");
//           canvas.width = canvas.height = 64;
//           const ctx = canvas.getContext("2d");

//           ctx.clearRect(0, 0, 64, 64);
//           ctx.drawImage(
//             image,
//             (image.width - side) / 2,
//             (image.height - side) / 2,
//             side,
//             side,
//             0,
//             0,
//             64,
//             64
//           );

//           const [avgR, avgG, avgB] = getAverageRGB(ctx, 64, 64);
//           canvas.toBlob((blob) => {
//             const url = URL.createObjectURL(blob);
//             resolve({
//               index,
//               avgColor: [avgR / 255, avgG / 255, avgB / 255],
//               glyph: { id: index, url, blob, loading: false },
//             });
//           }, "image/jpeg", 0.9);
//         };
//         image.src = URL.createObjectURL(file);
//       })
//     ));

//     // Sort by index to guarantee consistency
//     results.sort((a, b) => a.index - b.index);

//     const realGlyphs = results.map(r => r.glyph);
//     const realAvgColors = results.map(r => r.avgColor);

//     // 🧩 Build the grid dimensions
//     const totalGlyphs = realGlyphs.length;
//     const cols = Math.ceil(Math.sqrt(totalGlyphs));
//     const rows = Math.ceil(totalGlyphs / cols);
//     const fullCount = cols * rows;

//     // ➕ Pad with dummy blank glyphs
//     const paddedGlyphs = [...realGlyphs];
//     const paddedAvgColors = [...realAvgColors];

//     while (paddedGlyphs.length < fullCount) {
//       const dummyCanvas = document.createElement("canvas");
//       dummyCanvas.width = dummyCanvas.height = 64;
//       const blankCtx = dummyCanvas.getContext("2d");
//       blankCtx.clearRect(0, 0, 64, 64);

//       const dummyUrl = dummyCanvas.toDataURL("image/png");
//       paddedGlyphs.push({ id: -1, url: dummyUrl, blob: null, loading: false });
//       paddedAvgColors.push([999, 999, 999]); // Unmatchable color
//     }

//     // 🎨 Create the atlas
//     const atlasCanvas = document.createElement("canvas");
//     atlasCanvas.width = cols * 64;
//     atlasCanvas.height = rows * 64;
//     const ctx = atlasCanvas.getContext("2d");

//     await Promise.all(
//       paddedGlyphs.map((img, i) =>
//         new Promise(resolve => {
//           const image = new Image();
//           image.onload = () => {
//             const x = (i % cols) * 64;
//             const y = Math.floor(i / cols) * 64;
//             ctx.drawImage(image, x, y, 64, 64);
//             resolve();
//           };
//           image.src = img.url;
//         })
//       )
//     );

//     // 🔁 Flip atlas vertically to match WebGL
//     const flippedCanvas = document.createElement("canvas");
//     flippedCanvas.width = atlasCanvas.width;
//     flippedCanvas.height = atlasCanvas.height;
//     const flippedCtx = flippedCanvas.getContext("2d");
//     flippedCtx.translate(0, atlasCanvas.height);
//     flippedCtx.scale(1, -1);
//     flippedCtx.drawImage(atlasCanvas, 0, 0);

//     // 🧠 Update state
//     setGlyphAtlas(flippedCanvas);
//     setGlyphImages(realGlyphs);            // Only real glyphs shown in preview
//     setGlyphAvgColors(realAvgColors);      // Only real glyphs used for matching
//     setShowGlyphPreview(true);
//     setNeedsUpdate(true);
//   };



//   const onFileChange = (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     if (webcamRef.current?.srcObject) {
//       webcamRef.current.srcObject.getTracks().forEach((t) => t.stop());
//       webcamRef.current.srcObject = null;
//     }

//     setSelectedDeviceId("");
//     setIsFrontFacing(false);

//     const isVideo = file.type.startsWith("video");

//     if (!isVideo) {
//       const reader = new FileReader();
//       reader.onload = () => {
//         const img = new Image();
//         img.onload = () => {
//           const canvas = document.createElement("canvas");
//           const ctx = canvas.getContext("2d");
//           const scale = Math.min(1, MAX_SIZE / Math.max(img.width, img.height));
//           const newWidth = img.width * scale;
//           const newHeight = img.height * scale;
//           canvas.width = newWidth;
//           canvas.height = newHeight;
//           ctx.drawImage(img, 0, 0, newWidth, newHeight);
//           const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.8);

//           setMediaSource(null);
//           setMediaType(null);
//           setTimeout(() => {
//             setMediaType("image");
//             setMediaSource(jpegDataUrl);
//             setNeedsUpdate(true);
//           }, 50);
//         };
//         img.src = reader.result;
//       };
//       reader.readAsDataURL(file);
//     } else {
//       const url = URL.createObjectURL(file);
//       setMediaSource(null);
//       setMediaType(null);
//       setTimeout(() => {
//         setMediaType("video");
//         setMediaSource(url);
//         setNeedsUpdate(true);
//       }, 50);
//     }

//     e.target.value = null;
//   };

//   useEffect(() => {
//     const resizeCanvas = () => {
//       const canvas = canvasRef.current;
//       if (!canvas) return;
//       const dpr = window.devicePixelRatio || 1;
//       const width = canvas.clientWidth * dpr;
//       const height = canvas.clientHeight * dpr;
//       if (canvas.width !== width || canvas.height !== height) {
//         canvas.width = width;
//         canvas.height = height;
//         setNeedsUpdate(true);
//       }
//     };
//     resizeCanvas();
//     window.addEventListener("resize", resizeCanvas);
//     return () => window.removeEventListener("resize", resizeCanvas);
//   }, []);

//   useEffect(() => {
//     const img = new Image();
//     img.onload = () => {
//       const canvas = document.createElement("canvas");
//       const ctx = canvas.getContext("2d");
//       const scale = Math.min(1, MAX_SIZE / Math.max(img.width, img.height));
//       const newWidth = img.width * scale;
//       const newHeight = img.height * scale;
//       canvas.width = newWidth;
//       canvas.height = newHeight;
//       ctx.drawImage(img, 0, 0, newWidth, newHeight);
//       const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.8);

//       if (imageRef.current) {
//         imageRef.current.onload = () => {
//           setMediaType("image");
//           setMediaSource(jpegDataUrl);
//           setNeedsUpdate(true);
//         };
//         imageRef.current.src = jpegDataUrl;
//       }
//     };
//     img.src = `${process.env.PUBLIC_URL}/SkyWhales_Noracored.png`;
//   }, []);

//   useEffect(() => {
//     async function getVideoDevices() {
//       try {
//         const devices = await navigator.mediaDevices.enumerateDevices();
//         const videoInputs = devices.filter((d) => d.kind === "videoinput");
//         setVideoDevices(videoInputs);
//       } catch (e) {
//         console.error("Error enumerating devices", e);
//       }
//     }
//     getVideoDevices();
//   }, []);

//   useEffect(() => {
//     async function startCamera() {
//       if (!selectedDeviceId) {
//         if (webcamRef.current?.srcObject) {
//           webcamRef.current.srcObject.getTracks().forEach((t) => t.stop());
//           webcamRef.current.srcObject = null;
//         }
//         setMediaType(null);
//         setMediaSource(null);
//         setIsFrontFacing(false);
//         return;
//       }

//       try {
//         if (webcamRef.current?.srcObject) {
//           webcamRef.current.srcObject.getTracks().forEach((t) => t.stop());
//           webcamRef.current.srcObject = null;
//         }

//         const stream = await navigator.mediaDevices.getUserMedia({
//           video: { deviceId: { exact: selectedDeviceId } },
//         });

//         if (webcamRef.current) {
//           webcamRef.current.srcObject = stream;
//           try {
//             await webcamRef.current.play();
//           } catch {}
//           setMediaType("webcam");
//           setMediaSource("webcam");
//         }

//         const device = videoDevices.find((d) => d.deviceId === selectedDeviceId);
//         if (device) {
//           const label = device.label.toLowerCase();
//           const frontKeywords = ["front", "user", "selfie"];
//           setIsFrontFacing(frontKeywords.some((kw) => label.includes(kw)));
//         } else {
//           setIsFrontFacing(false);
//         }
//       } catch (error) {
//         console.error("Error accessing camera", error);
//         alert("Cannot access camera: " + error.message);
//         setSelectedDeviceId("");
//       }
//     }
//     startCamera();
//     return () => {
//       if (webcamRef.current?.srcObject) {
//         webcamRef.current.srcObject.getTracks().forEach((t) => t.stop());
//       }
//     };
//   }, [selectedDeviceId, videoDevices]);

//   useEffect(() => {
//     if (mediaType === "video" && videoRef.current) {
//       videoRef.current.src = mediaSource;
//       videoRef.current.loop = true;
//       videoRef.current.play().catch(() => {});
//     } else if (mediaType === "image" && imageRef.current) {
//       imageRef.current.onload = () => setNeedsUpdate(true);
//       imageRef.current.src = mediaSource;
//     }
//   }, [mediaSource, mediaType]);

//   useEffect(() => {
//     if (!canvasRef.current || !mediaType || !mediaSource) return;
//     const stopRendering = setupWebGLRenderer({
//       canvas: canvasRef.current,
//       imageRef,
//       videoRef,
//       webcamRef,
//       mediaType,
//       contrast,
//       sharpness,
//       saturation,
//       pixelation,
//       isFrontFacing,
//       needsUpdate,
//       setNeedsUpdate,
//       glyphAvgColors,
//       glyphAtlas,
//       showGlyphPreview,
//     });
//     return () => stopRendering?.();
//   }, [
//     mediaSource,
//     mediaType,
//     contrast,
//     sharpness,
//     saturation,
//     needsUpdate,
//     pixelation,
//     isFrontFacing,
//     glyphAvgColors,
//     glyphAtlas,
//     showGlyphPreview,
//   ]);

//   return (
//     <div style={{ minHeight: "100vh", overflowY: "auto", position: "relative" }}>
//       <HeaderBar ref={headerRef} />
//       <div style={{ paddingTop: `${headerHeight}px`, minHeight: `calc(100vh - ${headerHeight}px - ${footerHeight}px)`, paddingBottom: `${footerHeight}px`, backgroundColor: "#f5f5f5" }}>
//         <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px", fontFamily: "sans-serif", color: "#222" }}>
//           <h2>Photomosaic Project</h2>

//           <div style={{ marginTop: "2rem" }}>
//             <label htmlFor="fileInput" style={{ cursor: "pointer", padding: "0.5em 1em", border: "1px solid #ccc", borderRadius: "4px", backgroundColor: "#f0f0f0" }}>
//               🗂️ File from Computer (Image or Video)
//             </label>
//             <input id="fileInput" type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={onFileChange} />
//             {videoDevices.length > 0 && (
//               <select value={selectedDeviceId} onChange={(e) => setSelectedDeviceId(e.target.value)}>
//                 <option value="">-- Select Camera --</option>
//                 {videoDevices.map((device) => (
//                   <option key={device.deviceId} value={device.deviceId}>{device.label || `Camera ${device.deviceId}`}</option>
//                 ))}
//               </select>
//             )}
//           </div>

//           <div style={{ marginTop: "2rem" }}>
//             <label htmlFor="glyphInput" style={{ cursor: "pointer", padding: "0.5em 1em", border: "1px solid #ccc", borderRadius: "4px", backgroundColor: "#e0f7fa" }}>
//               📂 Upload Glyph Folder
//             </label>
//             <input id="glyphInput" type="file" accept="image/*" webkitdirectory="true" directory="" multiple style={{ display: "none" }} onChange={(e) => processAndCropGlyphs([...e.target.files])} />
//           </div>

//           <canvas ref={canvasRef} width={800} height={500} style={{ width: "100%", height: "auto", display: "block", backgroundColor: "#000" }} />

//           <div style={{ marginTop: "2rem" }}>
//             <label>Contrast: <input type="range" min="0" max="3" step="0.01" value={contrast} onChange={(e) => { setContrast(parseFloat(e.target.value)); setNeedsUpdate(true); }} /></label>
//             <label>Sharpness: <input type="range" min="0" max="1" step="0.01" value={sharpness} onChange={(e) => { setSharpness(parseFloat(e.target.value)); setNeedsUpdate(true); }} /></label>
//             <label>Saturation: <input type="range" min="0" max="2" step="0.01" value={saturation} onChange={(e) => { setSaturation(parseFloat(e.target.value)); setNeedsUpdate(true); }} /></label>
//             <label>Pixelation: <input type="range" min="1" max="100" step="1" value={pixelation} onChange={(e) => { setPixelation(parseFloat(e.target.value)); setNeedsUpdate(true); }} /></label>
//           </div>

//           {glyphImages.length > 0 && (
//             <div style={{ marginTop: "2rem" }}>
//               <button onClick={() => setShowGlyphPreview(!showGlyphPreview)} style={{ padding: "0.5em 1em", border: "1px solid #aaa", backgroundColor: "#fff3e0", borderRadius: "4px" }}>
//                 {showGlyphPreview ? "Hide Cropped Glyphs" : "View Cropped Glyphs"}
//               </button>
//               {showGlyphPreview && (
//                 <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: "8px", marginTop: "1rem" }}>
//                   {glyphImages.map((glyph) => (
//                     <div key={glyph.id} style={{ width: "100%", height: "80px", backgroundColor: "#eee", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
//                       <img src={glyph.url} alt={`glyph-${glyph.id}`} style={{ width: "100%", height: "auto", borderRadius: "4px" }} />
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           )}

//           <video ref={webcamRef} playsInline muted autoPlay style={{ display: "none" }} />
//           <video ref={videoRef} autoPlay muted loop playsInline style={{ display: "none" }} />
//           <img ref={imageRef} alt="input" style={{ display: "none" }} />
//         </div>
//       </div>
//       <FooterBar ref={footerRef} />
//     </div>
//   );
// }

// export default ProjectGlyphs;





///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// working but not text for credit
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import React, { useEffect, useRef, useState } from "react";
import HeaderBar from "../components/HeaderBar";
import FooterBar from "../components/FooterBar";
import { setupWebGLRenderer } from "./ProjectGlyphsShader";

function ProjectGlyphs() {
  const MAX_SIZE = 1600;
  const [headerHeight] = useState(80);
  const [footerHeight] = useState(60);
  const [mediaType, setMediaType] = useState(null);
  const [mediaSource, setMediaSource] = useState(null);
  const [contrast, setContrast] = useState(1.0);
  const [sharpness, setSharpness] = useState(0.0);
  const [saturation, setSaturation] = useState(1.0);
  const [needsUpdate, setNeedsUpdate] = useState(true);
  const [pixelation, setPixelation] = useState(50);
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [isFrontFacing, setIsFrontFacing] = useState(false);
  const [glyphImages, setGlyphImages] = useState([]);
  const [glyphAtlas, setGlyphAtlas] = useState(null);
  const [showGlyphPreview, setShowGlyphPreview] = useState(false);
  const [glyphAvgColors, setGlyphAvgColors] = useState([]);
  const [matchByIntensity, setMatchByIntensity] = useState(false);


  const headerRef = useRef(null);
  const footerRef = useRef(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const videoRef = useRef(null);
  const webcamRef = useRef(null);

  const getAverageRGB = (ctx, width, height) => {
    const imageData = ctx.getImageData(0, 0, width, height).data;
    let r = 0, g = 0, b = 0;
    for (let i = 0; i < imageData.length; i += 4) {
      r += imageData[i];
      g += imageData[i + 1];
      b += imageData[i + 2];
    }
    const total = imageData.length / 4;
    return [r / total, g / total, b / total];
  };

  const processAndCropGlyphs = async (files) => {
    const imageEntries = files
      .filter(file => file.type.startsWith("image"))
      .map((file, index) => ({ file, index }));

    const results = await Promise.all(imageEntries.map(({ file, index }) =>
      new Promise(resolve => {
        const image = new Image();
        image.onload = () => {
          const side = Math.min(image.width, image.height);
          const canvas = document.createElement("canvas");
          canvas.width = canvas.height = 64;
          const ctx = canvas.getContext("2d");

          ctx.clearRect(0, 0, 64, 64);
          ctx.drawImage(
            image,
            (image.width - side) / 2,
            (image.height - side) / 2,
            side,
            side,
            0,
            0,
            64,
            64
          );

          const [avgR, avgG, avgB] = getAverageRGB(ctx, 64, 64);
          const avgIntensity = 0.299 * avgR + 0.587 * avgG + 0.114 * avgB;

          canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            resolve({
              index,
              avgColor: [avgR / 255, avgG / 255, avgB / 255],
              intensity: avgIntensity,
              glyph: { id: index, url, blob, loading: false },
            });
          }, "image/jpeg", 0.9);
        };
        image.src = URL.createObjectURL(file);
      })
    ));

    // Sort by index to guarantee consistency
    results.sort((a, b) => a.index - b.index);

    const realGlyphs = results.map(r => r.glyph);
    const realAvgColors = results.map(r => r.avgColor);
    const realIntensities = results.map(r => r.intensity);
    setGlyphAvgColors(realGlyphs.map((_, i) => realIntensities[i])); // Save as backup for intensity mode


    // 🧩 Build the grid dimensions
    const totalGlyphs = realGlyphs.length;
    const cols = Math.ceil(Math.sqrt(totalGlyphs));
    const rows = Math.ceil(totalGlyphs / cols);
    const fullCount = cols * rows;

    // ➕ Pad with dummy blank glyphs
    const paddedGlyphs = [...realGlyphs];
    const paddedAvgColors = [...realAvgColors];

    while (paddedGlyphs.length < fullCount) {
      const dummyCanvas = document.createElement("canvas");
      dummyCanvas.width = dummyCanvas.height = 64;
      const blankCtx = dummyCanvas.getContext("2d");
      blankCtx.clearRect(0, 0, 64, 64);

      const dummyUrl = dummyCanvas.toDataURL("image/png");
      paddedGlyphs.push({ id: -1, url: dummyUrl, blob: null, loading: false });
      paddedAvgColors.push([999, 999, 999]); // Unmatchable color
    }

    // 🎨 Create the atlas
    const atlasCanvas = document.createElement("canvas");
    atlasCanvas.width = cols * 64;
    atlasCanvas.height = rows * 64;
    const ctx = atlasCanvas.getContext("2d");

    await Promise.all(
      paddedGlyphs.map((img, i) =>
        new Promise(resolve => {
          const image = new Image();
          image.onload = () => {
            const x = (i % cols) * 64;
            const y = Math.floor(i / cols) * 64;
            ctx.drawImage(image, x, y, 64, 64);
            resolve();
          };
          image.src = img.url;
        })
      )
    );

    // 🔁 Flip atlas vertically to match WebGL
    const flippedCanvas = document.createElement("canvas");
    flippedCanvas.width = atlasCanvas.width;
    flippedCanvas.height = atlasCanvas.height;
    const flippedCtx = flippedCanvas.getContext("2d");
    flippedCtx.translate(0, atlasCanvas.height);
    flippedCtx.scale(1, -1);
    flippedCtx.drawImage(atlasCanvas, 0, 0);

    // 🧠 Update state
    setGlyphAtlas(flippedCanvas);
    setGlyphImages(realGlyphs);            // Only real glyphs shown in preview
    setGlyphAvgColors(realAvgColors);      // Only real glyphs used for matching
    setShowGlyphPreview(true);
    setNeedsUpdate(true);
  };



  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (webcamRef.current?.srcObject) {
      webcamRef.current.srcObject.getTracks().forEach((t) => t.stop());
      webcamRef.current.srcObject = null;
    }

    setSelectedDeviceId("");
    setIsFrontFacing(false);

    const isVideo = file.type.startsWith("video");

    if (!isVideo) {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          const scale = Math.min(1, MAX_SIZE / Math.max(img.width, img.height));
          const newWidth = img.width * scale;
          const newHeight = img.height * scale;
          canvas.width = newWidth;
          canvas.height = newHeight;
          ctx.drawImage(img, 0, 0, newWidth, newHeight);
          const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.8);

          setMediaSource(null);
          setMediaType(null);
          setTimeout(() => {
            setMediaType("image");
            setMediaSource(jpegDataUrl);
            setNeedsUpdate(true);
          }, 50);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    } else {
      const url = URL.createObjectURL(file);
      setMediaSource(null);
      setMediaType(null);
      setTimeout(() => {
        setMediaType("video");
        setMediaSource(url);
        setNeedsUpdate(true);
      }, 50);
    }

    e.target.value = null;
  };

  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth * dpr;
      const height = canvas.clientHeight * dpr;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        setNeedsUpdate(true);
      }
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const scale = Math.min(1, MAX_SIZE / Math.max(img.width, img.height));
      const newWidth = img.width * scale;
      const newHeight = img.height * scale;
      canvas.width = newWidth;
      canvas.height = newHeight;
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.8);

      if (imageRef.current) {
        imageRef.current.onload = () => {
          setMediaType("image");
          setMediaSource(jpegDataUrl);
          setNeedsUpdate(true);
        };
        imageRef.current.src = jpegDataUrl;
      }
    };
    img.src = `${process.env.PUBLIC_URL}/SkyWhales_Noracored.png`;
  }, []);

  useEffect(() => {
    async function getVideoDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === "videoinput");
        setVideoDevices(videoInputs);
      } catch (e) {
        console.error("Error enumerating devices", e);
      }
    }
    getVideoDevices();
  }, []);

  useEffect(() => {
    async function startCamera() {
      if (!selectedDeviceId) {
        if (webcamRef.current?.srcObject) {
          webcamRef.current.srcObject.getTracks().forEach((t) => t.stop());
          webcamRef.current.srcObject = null;
        }
        setMediaType(null);
        setMediaSource(null);
        setIsFrontFacing(false);
        return;
      }

      try {
        if (webcamRef.current?.srcObject) {
          webcamRef.current.srcObject.getTracks().forEach((t) => t.stop());
          webcamRef.current.srcObject = null;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: selectedDeviceId } },
        });

        if (webcamRef.current) {
          webcamRef.current.srcObject = stream;
          try {
            await webcamRef.current.play();
          } catch {}
          setMediaType("webcam");
          setMediaSource("webcam");
        }

        const device = videoDevices.find((d) => d.deviceId === selectedDeviceId);
        if (device) {
          const label = device.label.toLowerCase();
          const frontKeywords = ["front", "user", "selfie"];
          setIsFrontFacing(frontKeywords.some((kw) => label.includes(kw)));
        } else {
          setIsFrontFacing(false);
        }
      } catch (error) {
        console.error("Error accessing camera", error);
        alert("Cannot access camera: " + error.message);
        setSelectedDeviceId("");
      }
    }
    startCamera();
    return () => {
      if (webcamRef.current?.srcObject) {
        webcamRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
    };
  }, [selectedDeviceId, videoDevices]);

  useEffect(() => {
    if (mediaType === "video" && videoRef.current) {
      videoRef.current.src = mediaSource;
      videoRef.current.loop = true;
      videoRef.current.play().catch(() => {});
    } else if (mediaType === "image" && imageRef.current) {
      imageRef.current.onload = () => setNeedsUpdate(true);
      imageRef.current.src = mediaSource;
    }
  }, [mediaSource, mediaType]);

  useEffect(() => {
    if (!canvasRef.current || !mediaType || !mediaSource) return;
    const stopRendering = setupWebGLRenderer({
      canvas: canvasRef.current,
      imageRef,
      videoRef,
      webcamRef,
      mediaType,
      contrast,
      sharpness,
      saturation,
      pixelation,
      isFrontFacing,
      needsUpdate,
      setNeedsUpdate,
      glyphAvgColors,
      glyphAtlas,
      showGlyphPreview,
      matchByIntensity,
    });

    return () => stopRendering?.();
  }, [
    mediaSource,
    mediaType,
    contrast,
    sharpness,
    saturation,
    needsUpdate,
    pixelation,
    isFrontFacing,
    glyphAvgColors,
    glyphAtlas,
    showGlyphPreview,
    matchByIntensity,
  ]);

  return (
    <div style={{ minHeight: "100vh", overflowY: "auto", position: "relative" }}>
      <HeaderBar ref={headerRef} />
      <div style={{ paddingTop: `${headerHeight}px`, minHeight: `calc(100vh - ${headerHeight}px - ${footerHeight}px)`, paddingBottom: `${footerHeight}px`, backgroundColor: "#f5f5f5" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px", fontFamily: "sans-serif", color: "#222" }}>
          <h2>Photomosaic Project</h2>

          <div style={{ marginTop: "2rem" }}>
            <label htmlFor="fileInput" style={{ cursor: "pointer", padding: "0.5em 1em", border: "1px solid #ccc", borderRadius: "4px", backgroundColor: "#f0f0f0" }}>
              🗂️ File from Computer (Image or Video)
            </label>
            <input id="fileInput" type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={onFileChange} />
            {videoDevices.length > 0 && (
              <select value={selectedDeviceId} onChange={(e) => setSelectedDeviceId(e.target.value)}>
                <option value="">-- Select Camera --</option>
                {videoDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>{device.label || `Camera ${device.deviceId}`}</option>
                ))}
              </select>
            )}
          </div>

          <div style={{ marginTop: "2rem" }}>
            <label htmlFor="glyphInput" style={{ cursor: "pointer", padding: "0.5em 1em", border: "1px solid #ccc", borderRadius: "4px", backgroundColor: "#e0f7fa" }}>
              📂 Upload Glyph Folder
            </label>
            <input id="glyphInput" type="file" accept="image/*" webkitdirectory="true" directory="" multiple style={{ display: "none" }} onChange={(e) => processAndCropGlyphs([...e.target.files])} />
          </div>

          <canvas ref={canvasRef} width={800} height={500} style={{ width: "100%", height: "auto", display: "block", backgroundColor: "#000" }} />

          <div style={{ marginTop: "2rem" }}>
            <label>Contrast: <input type="range" min="0" max="3" step="0.01" value={contrast} onChange={(e) => { setContrast(parseFloat(e.target.value)); setNeedsUpdate(true); }} /></label>
            <label>Sharpness: <input type="range" min="0" max="1" step="0.01" value={sharpness} onChange={(e) => { setSharpness(parseFloat(e.target.value)); setNeedsUpdate(true); }} /></label>
            <label>Saturation: <input type="range" min="0" max="2" step="0.01" value={saturation} onChange={(e) => { setSaturation(parseFloat(e.target.value)); setNeedsUpdate(true); }} /></label>
            <label>Pixelation: <input type="range" min="1" max="100" step="1" value={pixelation} onChange={(e) => { setPixelation(parseFloat(e.target.value)); setNeedsUpdate(true); }} /></label>
          </div>

          {glyphImages.length > 0 && (
            <div style={{ marginTop: "2rem" }}>
              <button onClick={() => setShowGlyphPreview(!showGlyphPreview)} style={{ padding: "0.5em 1em", border: "1px solid #aaa", backgroundColor: "#fff3e0", borderRadius: "4px" }}>
                {showGlyphPreview ? "Hide Cropped Glyphs" : "View Cropped Glyphs"}
              </button>
              
              <button
                onClick={() => { setMatchByIntensity(prev => !prev); setNeedsUpdate(true); }}
                style={{ padding: "0.5em 1em", border: "1px solid #aaa", backgroundColor: "#e8f5e9", borderRadius: "4px" }}
              >
                Matching by: {matchByIntensity ? "Intensity" : "Color"}
              </button>
              {showGlyphPreview && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: "8px", marginTop: "1rem" }}>
                  {glyphImages.map((glyph) => (
                    <div key={glyph.id} style={{ width: "100%", height: "80px", backgroundColor: "#eee", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <img src={glyph.url} alt={`glyph-${glyph.id}`} style={{ width: "100%", height: "auto", borderRadius: "4px" }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <video ref={webcamRef} playsInline muted autoPlay style={{ display: "none" }} />
          <video ref={videoRef} autoPlay muted loop playsInline style={{ display: "none" }} />
          <img ref={imageRef} alt="input" style={{ display: "none" }} />
        </div>
      </div>
      <FooterBar ref={footerRef} />
    </div>
  );
}

export default ProjectGlyphs;