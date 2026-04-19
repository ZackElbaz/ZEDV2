import React, { useEffect, useMemo, useRef, useState } from "react";
import ProjectTemplate from "../components/ProjectTemplate/ProjectTemplate";
import { initSuperpixelSegmentation } from "./ProjectSuperPixelsShader";

const DEFAULT_USER_COLOURS = [
  "#2F3E46",
  "#52796F",
  "#84A98C",
  "#A8DADC",
  "#F1FAEE",
  "#FFAD8E",
];

const CAMERA_PLACEHOLDER = "__SELECT_CAMERA__";
const MOBILE_BREAKPOINT = 768;

function normaliseHex(value) {
  let v = String(value || "").trim();
  if (!v) return "";
  if (!v.startsWith("#")) v = `#${v}`;

  if (/^#[0-9a-fA-F]{3}$/.test(v)) {
    v =
      "#" +
      v[1] + v[1] +
      v[2] + v[2] +
      v[3] + v[3];
  }

  return /^#[0-9a-fA-F]{6}$/.test(v) ? v.toUpperCase() : "";
}

function randomButtonVars() {
  const hue = Math.floor(Math.random() * 360);
  return {
    "--thumb-color": `hsl(${hue}, 100%, 50%)`,
    "--thumb-text-color": "black",
  };
}

function TemplateLikeButton({
  children,
  className = "",
  inactive = false,
  disabled = false,
  onClick,
  type = "button",
  style = {},
}) {
  const [vars, setVars] = useState({});

  const apply = () => {
    if (inactive || disabled) return;
    setVars(randomButtonVars());
  };

  const clear = () => {
    setVars({});
  };

  return (
    <button
      type={type}
      className={`template-button ${className} ${inactive ? "is-inactive" : ""}`.trim()}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={apply}
      onMouseLeave={clear}
      onFocus={apply}
      onBlur={clear}
      onPointerDown={apply}
      style={{ ...vars, ...style }}
    >
      {children}
    </button>
  );
}

export default function ProjectSuperPixels() {
  const canvasRef = useRef(null);
  const simRef = useRef(null);
  const videoRef = useRef(null);
  const preloadDoneRef = useRef(false);
  const colourPopoverRef = useRef(null);
  const currentCameraStreamRef = useRef(null);

  const [superpixelCount, setSuperpixelCount] = useState(120);
  const [cameras, setCameras] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(CAMERA_PLACEHOLDER);

  const [regionColours, setRegionColours] = useState([]);
  const [mappedRegionColours, setMappedRegionColours] = useState([]);
  const [regionCount, setRegionCount] = useState(0);

  const [userColours, setUserColours] = useState(DEFAULT_USER_COLOURS);
  const [useMappedColours, setUseMappedColours] = useState(false);

  const [hasVideoSource, setHasVideoSource] = useState(false);
  const [videoPaused, setVideoPaused] = useState(false);

  const [isMobileView, setIsMobileView] = useState(
    typeof window !== "undefined" ? window.innerWidth <= MOBILE_BREAKPOINT : false
  );
  const [showGeneratedPanel, setShowGeneratedPanel] = useState(true);
  const [showUserPanel, setShowUserPanel] = useState(true);

  const [pickerState, setPickerState] = useState({
    open: false,
    index: -1,
    top: 0,
    left: 0,
    draftValue: "#808080",
  });

  const [, forceRender] = useState(0);

  const closePickerWithoutCommit = () => {
    setPickerState({
      open: false,
      index: -1,
      top: 0,
      left: 0,
      draftValue: "#808080",
    });
  };

  const setUserColourAt = (index, value) => {
    setUserColours((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const commitPickerColour = (forcedValue) => {
    const idx = pickerState.index;
    const nextValue = normaliseHex(forcedValue ?? pickerState.draftValue);

    if (idx < 0) {
      closePickerWithoutCommit();
      return;
    }

    if (nextValue) {
      setUserColours((prev) => {
        const next = [...prev];
        next[idx] = nextValue;
        return next;
      });
    }

    closePickerWithoutCommit();
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= MOBILE_BREAKPOINT;
      setIsMobileView(mobile);

      if (!mobile) {
        setShowGeneratedPanel(true);
        setShowUserPanel(true);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      simRef.current?.resize();
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    simRef.current = initSuperpixelSegmentation(canvas, {
      superpixelCount,
      onUpdate: ({ regionHexes, mappedHexes, regionCount: rc }) => {
        setRegionColours(regionHexes || []);
        setMappedRegionColours(mappedHexes || []);
        setRegionCount(rc || 0);
      },
    });

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      stopCurrentVideoSource(true);
      simRef.current?.stop?.();
      simRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!simRef.current || preloadDoneRef.current) return;

    const img = new Image();
    img.onload = () => {
      simRef.current?.useImage(img);
      preloadDoneRef.current = true;
      setHasVideoSource(false);
      setVideoPaused(false);
    };
    img.src = `${process.env.PUBLIC_URL}/AthenasRock.jpeg`;
  }, []);

  useEffect(() => {
    const loadCameras = async () => {
      try {
        let devices = await navigator.mediaDevices.enumerateDevices();

        if (!devices.some((d) => d.label)) {
          try {
            const temp = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false,
            });
            temp.getTracks().forEach((t) => t.stop());
            devices = await navigator.mediaDevices.enumerateDevices();
          } catch {}
        }

        const list = devices.filter((d) => d.kind === "videoinput");
        setCameras(list);
      } catch (err) {
        console.error(err);
      }
    };

    loadCameras();
  }, []);

  useEffect(() => {
    if (!pickerState.open) return;

    const handlePointerDown = (e) => {
      if (!colourPopoverRef.current) return;
      if (!colourPopoverRef.current.contains(e.target)) {
        commitPickerColour();
      }
    };

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        closePickerWithoutCommit();
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [pickerState.open, pickerState.index, pickerState.draftValue]);

  const cleanedUserColours = useMemo(() => {
    const seen = new Set();
    const out = [];

    for (const c of userColours) {
      const n = normaliseHex(c);
      if (!n || seen.has(n)) continue;
      seen.add(n);
      out.push(n);
    }

    return out;
  }, [userColours]);

  useEffect(() => {
    if (!simRef.current) return;
    simRef.current.setUserPalette(cleanedUserColours);
  }, [cleanedUserColours]);

  const addUserColour = () => {
    setUserColours((prev) => [...prev, "#808080"]);
  };

  const handleSuggestColour = () => {
    const suggested = simRef.current?.getSuggestedPaletteColour?.();
    if (!suggested) return;

    const safe = normaliseHex(suggested);
    if (!safe) return;

    setUserColours((prev) => {
      const alreadyExists = prev.some((c) => normaliseHex(c) === safe);
      if (alreadyExists) return prev;
      return [...prev, safe];
    });
  };

  const removeUserColour = (index) => {
    setUserColours((prev) => {
      if (prev.length <= 2) return prev;
      return prev.filter((_, i) => i !== index);
    });

    setPickerState((prev) =>
      prev.index === index
        ? {
            open: false,
            index: -1,
            top: 0,
            left: 0,
            draftValue: "#808080",
          }
        : prev
    );
  };

  const openColourPopover = (index, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const popoverWidth = 230;
    const popoverHeight = 74;
    const gap = 8;

    let left = rect.right + gap;
    let top = rect.top;

    if (left + popoverWidth > window.innerWidth - 8) {
      left = rect.left - popoverWidth - gap;
    }
    if (left < 8) left = 8;

    if (top + popoverHeight > window.innerHeight - 8) {
      top = window.innerHeight - popoverHeight - 8;
    }
    if (top < 8) top = 8;

    setPickerState({
      open: true,
      index,
      top,
      left,
      draftValue: normaliseHex(userColours[index]) || "#808080",
    });
  };

  const stopCurrentVideoSource = (skipSnapshot = false) => {
    const v = videoRef.current;

    if (!skipSnapshot && v && v.videoWidth && v.videoHeight) {
      const snap = document.createElement("canvas");
      snap.width = v.videoWidth;
      snap.height = v.videoHeight;
      const snapCtx = snap.getContext("2d");
      snapCtx.drawImage(v, 0, 0, snap.width, snap.height);

      const img = new Image();
      img.onload = () => {
        simRef.current?.useImage(img);
      };

      try {
        img.src = snap.toDataURL("image/png");
      } catch {}
    }

    if (v) {
      try {
        v.pause();
      } catch {}

      if (v.srcObject) {
        for (const t of v.srcObject.getTracks()) t.stop();
        v.srcObject = null;
      }

      if (v.src) {
        v.removeAttribute("src");
        try {
          v.load();
        } catch {}
      }
    }

    if (currentCameraStreamRef.current) {
      currentCameraStreamRef.current.getTracks().forEach((t) => t.stop());
      currentCameraStreamRef.current = null;
    }

    videoRef.current = null;
    setHasVideoSource(false);
    setVideoPaused(false);
  };

  const handleMediaUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    stopCurrentVideoSource(true);
    setSelectedDeviceId(CAMERA_PLACEHOLDER);

    const url = URL.createObjectURL(file);

    if (file.type.startsWith("image/")) {
      const img = new Image();
      img.onload = () => {
        simRef.current?.useImage(img);
        setHasVideoSource(false);
        setVideoPaused(false);
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
      vid.crossOrigin = "anonymous";

      vid.addEventListener("loadeddata", async () => {
        try {
          await vid.play();
        } catch {}
        videoRef.current = vid;
        simRef.current?.useVideo(vid);
        setHasVideoSource(true);
        setVideoPaused(false);
      });
    } else {
      alert("Unsupported file type. Please choose an image or video.");
      URL.revokeObjectURL(url);
    }

    e.target.value = "";
  };

  const startCamera = async (deviceId) => {
    if (!deviceId || deviceId === CAMERA_PLACEHOLDER) return;

    try {
      stopCurrentVideoSource(true);

      const constraints = {
        video: { deviceId: { exact: deviceId } },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      currentCameraStreamRef.current = stream;

      const vid = document.createElement("video");
      vid.srcObject = stream;
      vid.muted = true;
      vid.autoplay = true;
      vid.playsInline = true;

      vid.addEventListener("loadeddata", async () => {
        try {
          await vid.play();
        } catch {}
        videoRef.current = vid;
        simRef.current?.useVideo(vid);
        setHasVideoSource(true);
        setVideoPaused(false);
      });

      setSelectedDeviceId(deviceId);
    } catch (err) {
      console.error(err);
      alert("Camera access denied or not available.");
    }
  };

  const handleCameraSelect = async (e) => {
    const deviceId = e.target.value;
    setSelectedDeviceId(deviceId);

    if (!deviceId || deviceId === CAMERA_PLACEHOLDER) return;

    await startCamera(deviceId);
  };

  const handlePausePlayVideo = async () => {
    const v = videoRef.current;

    if (!hasVideoSource) {
      if (selectedDeviceId && selectedDeviceId !== CAMERA_PLACEHOLDER) {
        await startCamera(selectedDeviceId);
      }
      return;
    }

    if (!v) return;

    if (v.paused) {
      try {
        await v.play();
        setVideoPaused(false);
      } catch (err) {
        console.error(err);
      }
    } else {
      v.pause();
      setVideoPaused(true);
    }
  };

  const handleToggleColourMode = () => {
    const next = !useMappedColours;
    simRef.current?.setUseUserPalette(next);
    setUseMappedColours(next);
    forceRender((n) => n + 1);
  };

  const handleDownloadColourByNumbers = () => {
    simRef.current?.downloadColorByNumbersSvg({
      useUserPalette: useMappedColours,
    });
  };

  const intro = [
    {
      type: "paragraph",
      content: (
        <>
          This tool segments an uploaded image, video, or camera feed into
          superpixel regions, averages the colour inside each region, and lets
          you remap those regions to a limited set of colours you actually have
          available.
        </>
      ),
    },
    {
      type: "paragraph",
      content: (
        <>
          It preloads an example painting on page load, and you can export the
          result as a colour-by-numbers SVG with region borders and labels.
        </>
      ),
    },
  ];

  const canvasBlock = (
    <div className="template-canvas-shell">
      <canvas ref={canvasRef} className="template-project-canvas" />
    </div>
  );

  const topControls = [
    {
      label: "UPLOAD FILE",
      kind: "file",
      accept: "image/*,video/*",
      onChange: handleMediaUpload,
    },
    {
      kind: "select",
      value: selectedDeviceId,
      onChange: handleCameraSelect,
      options: [
        { value: CAMERA_PLACEHOLDER, label: "SELECT CAMERA" },
        ...cameras.map((cam, i) => ({
          value: cam.deviceId,
          label: cam.label || `Camera ${i + 1}`,
        })),
      ],
    },
    {
      label: hasVideoSource
        ? videoPaused
          ? "PLAY VIDEO"
          : "PAUSE VIDEO"
        : selectedDeviceId !== CAMERA_PLACEHOLDER
          ? "PLAY VIDEO"
          : "PAUSE / PLAY VIDEO",
      onClick: handlePausePlayVideo,
      inactive: !hasVideoSource && selectedDeviceId === CAMERA_PLACEHOLDER,
    },
    {
      label: useMappedColours
        ? "GENERATED COLOURS"
        : "APPLY YOUR OWN COLOURS",
      onClick: handleToggleColourMode,
    },
    {
      label: "COLOUR BY NUMBERS",
      onClick: handleDownloadColourByNumbers,
    },
  ];

  const sliders = [
    {
      label: "Approximate Superpixel Count",
      value: superpixelCount,
      min: 10,
      max: 1000,
      step: 1,
      onChange: (e) => {
        const n = Math.max(
          10,
          Math.min(1000, Math.round(parseFloat(e.target.value)))
        );
        setSuperpixelCount(n);
        simRef.current?.setSuperpixelCount(n);
        forceRender((v) => v + 1);
      },
      showValue: true,
    },
  ];

  const displayedRegionColours = useMappedColours
    ? mappedRegionColours
    : regionColours;

  const uniqueDisplayedColours = useMemo(() => {
    const seen = new Set();
    const out = [];

    for (const hex of displayedRegionColours) {
      const safe = normaliseHex(hex);
      if (!safe || seen.has(safe)) continue;
      seen.add(safe);
      out.push(safe);
    }

    return out;
  }, [displayedRegionColours]);

  const colourPanelStyle = {
    minWidth: 0,
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    padding: "1rem",
    boxSizing: "border-box",
  };

  const mobileToggleButtonStyle = {
    width: "100%",
    justifyContent: "space-between",
    marginBottom: "0.75rem",
  };

  const generatedColourRows = uniqueDisplayedColours.map((hex, index) => {
    const safeValue = normaliseHex(hex) || "#808080";

    return (
      <div
        key={`${safeValue}-${index}`}
        style={{
          display: "grid",
          gridTemplateColumns: "42px minmax(0, 1fr)",
          gap: "0.6rem",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 8,
            border: "1px solid #cbd5e1",
            backgroundColor: safeValue,
            flexShrink: 0,
          }}
        />
        <input
          type="text"
          value={safeValue}
          readOnly
          style={{
            minWidth: 0,
            width: "100%",
            padding: "0.65rem 0.75rem",
            borderRadius: 8,
            border: "1px solid #cbd5e1",
            fontFamily: "var(--font-main, sans-serif)",
            fontSize: "0.95rem",
            boxSizing: "border-box",
            background: "white",
            color: "#111827",
          }}
        />
      </div>
    );
  });

  const userColourRows = userColours.map((value, index) => {
    const safeValue = normaliseHex(value) || "#808080";
    const canRemove = userColours.length > 2;

    return (
      <div
        key={index}
        style={{
          display: "grid",
          gridTemplateColumns: "42px minmax(0, 1fr) auto",
          gap: "0.6rem",
          alignItems: "center",
        }}
      >
        <button
          type="button"
          onClick={(e) => openColourPopover(index, e)}
          title="Pick colour"
          style={{
            width: 42,
            height: 42,
            borderRadius: 8,
            border: "1px solid #cbd5e1",
            backgroundColor: safeValue,
            cursor: "pointer",
            flexShrink: 0,
          }}
        />

        <input
          type="text"
          value={value}
          placeholder="#RRGGBB"
          onChange={(e) => setUserColourAt(index, e.target.value)}
          style={{
            minWidth: 0,
            width: "100%",
            padding: "0.65rem 0.75rem",
            borderRadius: 8,
            border: "1px solid #cbd5e1",
            fontFamily: "var(--font-main, sans-serif)",
            fontSize: "0.95rem",
            boxSizing: "border-box",
          }}
        />

        <TemplateLikeButton
          inactive={!canRemove}
          disabled={!canRemove}
          onClick={() => removeUserColour(index)}
        >
          REMOVE
        </TemplateLikeButton>
      </div>
    );
  });

  const generatedPanel = (
    <div style={colourPanelStyle}>
      <h2 className="template-subtitle" style={{ marginTop: 0 }}>
        Superpixel Colours
      </h2>

      <p className="template-text" style={{ marginBottom: "0.75rem" }}>
        Unique colours: {uniqueDisplayedColours.length}
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.6rem",
          maxHeight: 500,
          overflowY: "auto",
          paddingRight: "0.25rem",
        }}
      >
        {generatedColourRows}
      </div>
    </div>
  );

  const userPanel = (
    <div style={colourPanelStyle}>
      <h2 className="template-subtitle" style={{ marginTop: 0 }}>
        Your Colours
      </h2>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.6rem",
        }}
      >
        {userColourRows}
      </div>

      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          flexWrap: "wrap",
          marginTop: "1rem",
        }}
      >
        <TemplateLikeButton onClick={addUserColour}>
          ADD COLOUR
        </TemplateLikeButton>

        <TemplateLikeButton onClick={handleSuggestColour}>
          SUGGEST COLOUR
        </TemplateLikeButton>
      </div>
    </div>
  );

  const afterSliders = (
    <>
      {!isMobileView ? (
        <div
          style={{
            width: "100%",
            marginTop: "2rem",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
            alignItems: "start",
          }}
        >
          {generatedPanel}
          {userPanel}
        </div>
      ) : (
        <div
          style={{
            width: "100%",
            marginTop: "2rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div>
            <TemplateLikeButton
              onClick={() => setShowGeneratedPanel((v) => !v)}
              style={mobileToggleButtonStyle}
            >
              {showGeneratedPanel
                ? "HIDE SUPERPIXEL COLOURS"
                : "SHOW SUPERPIXEL COLOURS"}
            </TemplateLikeButton>
            {showGeneratedPanel && generatedPanel}
          </div>

          <div>
            <TemplateLikeButton
              onClick={() => setShowUserPanel((v) => !v)}
              style={mobileToggleButtonStyle}
            >
              {showUserPanel ? "HIDE YOUR COLOURS" : "SHOW YOUR COLOURS"}
            </TemplateLikeButton>
            {showUserPanel && userPanel}
          </div>
        </div>
      )}

      {pickerState.open && pickerState.index >= 0 && (
        <div
          ref={colourPopoverRef}
          style={{
            position: "fixed",
            top: pickerState.top,
            left: pickerState.left,
            zIndex: 2000,
            background: "white",
            border: "1px solid #cbd5e1",
            borderRadius: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,0.16)",
            padding: "0.75rem",
            width: 220,
            boxSizing: "border-box",
          }}
        >
          <div className="template-text" style={{ marginBottom: "0.5rem" }}>
            Pick colour
          </div>

          <input
            type="color"
            value={normaliseHex(pickerState.draftValue) || "#808080"}
            onChange={(e) =>
              setPickerState((prev) => ({
                ...prev,
                draftValue: e.target.value.toUpperCase(),
              }))
            }
            style={{
              width: "100%",
              height: 42,
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              background: "white",
              padding: 0,
              cursor: "pointer",
            }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "0.75rem",
            }}
          >
            <TemplateLikeButton onClick={() => commitPickerColour()}>
              SELECT
            </TemplateLikeButton>
          </div>
        </div>
      )}
    </>
  );

  const status = [
    `Current mode: ${useMappedColours ? "User palette remap" : "Generated colours"}`,
    `Detected regions: ${regionCount}`,
    `Active video source: ${
      hasVideoSource ? (videoPaused ? "Paused" : "Playing") : "None"
    }`,
  ];

  return (
    <ProjectTemplate
      title="Superpixels"
      intro={intro}
      canvasBlock={canvasBlock}
      topControls={topControls}
      sliders={sliders}
      afterSliders={afterSliders}
      status={status}
      sections={[]}
    />
  );
}