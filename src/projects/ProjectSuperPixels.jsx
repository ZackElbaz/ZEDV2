// ProjectSuperPixels.jsx
import React, { useEffect, useRef, useState } from "react";
import HeaderBar from "../components/HeaderBar";
import FooterBar from "../components/FooterBar";
import { initSuperpixelSegmentation } from "./ProjectSuperPixelsShader";
import "./ProjectSuperPixels.css";

export default function ProjectSuperPixels() {
  const canvasRef = useRef(null);
  const simRef = useRef(null);
  const videoRef = useRef(null);      // holds <video> for camera or file
  const fileInputRef = useRef(null);

  const paramsRef = useRef({
    numColors: 8,
    edgeStrength: 0.0, // no borders
  });

  const [numColors, setNumColors] = useState(8);
  const [showCameraPicker, setShowCameraPicker] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [cameraRunning, setCameraRunning] = useState(false); // <-- toggle state

  const activeSliderRef = useRef(null);

  // Init renderer once and keep canvas sized to the element
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && !simRef.current) {
      simRef.current = initSuperpixelSegmentation(canvas, paramsRef, null);
      simRef.current.setEdgeStrength(paramsRef.current.edgeStrength);
    }

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      simRef.current?.resize();
    };
    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      stopCamera(true); // don't snapshot on unmount
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------- slider --------
  const onNumColorsChange = (v) => {
    const k = Math.max(2, Math.min(64, Math.round(parseFloat(v))));
    setNumColors(k);
    paramsRef.current.numColors = k;
    simRef.current?.setNumColors(k);
  };

  function handleSliderFocus(e) {
    const hue = Math.floor(Math.random() * 360);
    e.target.style.setProperty("--thumb-color", `hsl(${hue}, 100%, 50%)`);
    e.target.style.setProperty("--track-color", `hsl(${(hue + 180) % 360}, 100%, 50%)`);
    activeSliderRef.current = e.target;
  }
  function handleSliderBlur(e) {
    e.target.style.removeProperty("--thumb-color");
    e.target.style.removeProperty("--track-color");
    activeSliderRef.current = null;
  }

  // -------- upload media (image / video / gif) --------
  const openMediaPicker = () => fileInputRef.current?.click();

  const onMediaPicked = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);

    if (file.type.startsWith("image/")) {
      const img = new Image();
      img.onload = () => {
        simRef.current?.useImage(img);
        setCameraRunning(false); // we are no longer using a camera stream
        URL.revokeObjectURL(url);
      };
      img.src = url;
    } else if (file.type.startsWith("video/")) {
      const vid = document.createElement("video");
      vid.src = url;
      vid.loop = true;
      vid.muted = true;
      vid.playsInline = true;
      vid.autoplay = true;
      vid.onloadeddata = async () => {
        try { await vid.play(); } catch {}
        videoRef.current = vid;
        simRef.current?.useVideo(vid);
        setCameraRunning(false); // file video is not a camera
      };
    } else {
      alert("Unsupported file type. Please choose an image or video.");
      URL.revokeObjectURL(url);
    }
  };

  // -------- camera picker --------
  const ensureCameraList = async () => {
    try {
      let devices = await navigator.mediaDevices.enumerateDevices();
      if (!devices.some(d => d.label)) {
        const temp = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        temp.getTracks().forEach(t => t.stop());
        devices = await navigator.mediaDevices.enumerateDevices();
      }
      const list = devices.filter(d => d.kind === "videoinput");
      setCameras(list);
      if (list.length && !selectedDeviceId) setSelectedDeviceId(list[0].deviceId);
    } catch (err) {
      console.error(err);
      alert("Could not enumerate cameras. Check browser permissions.");
    }
  };

  const openCameraPicker = async () => {
    await ensureCameraList();
    setShowCameraPicker(true);
  };

  const startCamera = async (deviceId) => {
    try {
      // stop any existing stream first
      stopCamera(true);

      const constraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const vid = document.createElement("video");
      vid.autoplay = true;
      vid.playsInline = true;
      vid.muted = true;
      vid.srcObject = stream;
      await vid.play();
      videoRef.current = vid;
      simRef.current?.useVideo(vid);
      setSelectedDeviceId(deviceId || selectedDeviceId);
      setCameraRunning(true);         // <-- now running
      setShowCameraPicker(false);
    } catch (err) {
      console.error("Camera error", err);
      alert("Couldn't access selected camera: " + err.message);
    }
  };

  // -------- freeze to still + stop --------
  const snapshotVideoToStill = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth || !v.videoHeight) return false;

    const snap = document.createElement("canvas");
    snap.width = v.videoWidth;
    snap.height = v.videoHeight;
    const sctx = snap.getContext("2d");
    sctx.drawImage(v, 0, 0, snap.width, snap.height);

    const img = new Image();
    img.onload = () => {
      simRef.current?.useImage(img); // switch renderer to still image source
    };
    try {
      img.src = snap.toDataURL("image/png");
      return true;
    } catch {
      return false;
    }
  };

  const stopCamera = (skipSnapshot = false) => {
    // If we are actually on a camera stream, snapshot the frame first
    const isCamStream = !!(videoRef.current && videoRef.current.srcObject);
    if (!skipSnapshot && isCamStream) snapshotVideoToStill();

    const v = videoRef.current;
    if (v && v.srcObject) {
      for (const t of v.srcObject.getTracks()) t.stop();
      v.srcObject = null;
    }
    setCameraRunning(false); // <-- now frozen / not running
  };

  // -------- toggle button: Freeze <-> Resume --------
  const handleFreezeResume = async () => {
    if (cameraRunning) {
      // Freeze camera to still
      stopCamera(false);
    } else {
      // Resume camera using selected device, or open picker if none chosen yet
      if (selectedDeviceId) {
        await startCamera(selectedDeviceId);
      } else {
        await openCameraPicker();
      }
    }
  };

  return (
    <div className="project-wrapper">
      <HeaderBar />
      <main className="project-main">
        <div className="intro-section">
          <h1>Superpixels</h1>
          <p>
            Superpixel segmentation groups nearby pixels with similar color into larger,
            meaningful regions. We learn an optimal <strong>K-color palette</strong> from your
            media (photo/video/camera) and assign each pixel to its nearest palette color in
            perceptual Lab space.
          </p>
        </div>

        <div className="canvas-wrapper">
          <canvas
            ref={canvasRef}
            className="project-canvas"
            title="Upload media or start a camera to see segmentation"
          />
        </div>

        <div className="upload-buttons" style={{ marginTop: "1rem" }}>
          <button onClick={openMediaPicker}>Upload Media</button>
          <button onClick={openCameraPicker}>Camera…</button>
          <button onClick={handleFreezeResume}>
            {cameraRunning ? "Freeze Camera" : "Resume Camera"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            style={{ display: "none" }}
            onChange={onMediaPicked}
          />
        </div>

        {showCameraPicker && (
          <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              style={{ padding: "0.4rem", minWidth: 240 }}
            >
              {cameras.map((cam, i) => (
                <option key={cam.deviceId} value={cam.deviceId}>
                  {cam.label || `Camera ${i + 1}`}
                </option>
              ))}
            </select>
            <button onClick={() => startCamera(selectedDeviceId)}>Start</button>
            <button onClick={() => setShowCameraPicker(false)}>Close</button>
          </div>
        )}

        <div className="slider-stack">
          <label className="slider-label">
            Number of colors: {numColors}
            <input
              type="range"
              min={2}
              max={64}
              step={1}
              value={numColors}
              onChange={(e) => onNumColorsChange(e.target.value)}
              onPointerDown={handleSliderFocus}
              onPointerUp={handleSliderBlur}
              onTouchStart={handleSliderFocus}
              onTouchEnd={handleSliderBlur}
              onBlur={handleSliderBlur}
            />
          </label>
        </div>
      </main>
      <FooterBar />
    </div>
  );
}

