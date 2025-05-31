// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// // Correctly Selects And Displays Media Files and sliders to edit the image and creates square pixelation!!!
// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import React, { useEffect, useRef, useState } from "react";
import HeaderBar from "../components/HeaderBar";
import FooterBar from "../components/FooterBar";

function ProjectGlyphs() {
  const [headerHeight, setHeaderHeight] = useState(80);
  const [footerHeight, setFooterHeight] = useState(60);
  const [mediaType, setMediaType] = useState(null);
  const [mediaSource, setMediaSource] = useState(null);
  const [contrast, setContrast] = useState(1.0);
  const [sharpness, setSharpness] = useState(0.0);
  const [saturation, setSaturation] = useState(1.0);
  const [needsUpdate, setNeedsUpdate] = useState(true);
  const [pixelation, setPixelation] = useState(50);

  const headerRef = useRef(null);
  const footerRef = useRef(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const videoRef = useRef(null);
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || (!mediaSource && mediaType !== "webcam")) return;
    const canvas = canvasRef.current;
    const gl = canvas.getContext("webgl");
    if (!gl) {
      console.error("WebGL not supported");
      return;
    }

    const vertexShaderSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;

      void main() {
        v_uv = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0, 1);
      }
    `;

    const fragmentShaderSource = `
      precision mediump float;
      varying vec2 v_uv;
      uniform float u_pixelation;
      uniform sampler2D u_texture;
      uniform vec2 u_textureSize;
      uniform vec2 u_canvasSize;
      uniform int u_isWebcam;
      uniform float u_contrast;
      uniform float u_sharpness;
      uniform float u_saturation;

      vec3 adjustContrast(vec3 color, float contrast) {
        return (color - 0.5) * contrast + 0.5;
      }

      vec3 adjustSaturation(vec3 color, float saturation) {
        float grey = dot(color, vec3(0.299, 0.587, 0.114));
        return mix(vec3(grey), color, saturation);
      }

      vec3 applySharpen(vec2 uv) {
        vec2 texel = 1.0 / u_textureSize;
        vec3 color = texture2D(u_texture, uv).rgb * (1.0 + 4.0 * u_sharpness);
        color -= texture2D(u_texture, uv + vec2(texel.x, 0)).rgb * u_sharpness;
        color -= texture2D(u_texture, uv - vec2(texel.x, 0)).rgb * u_sharpness;
        color -= texture2D(u_texture, uv + vec2(0, texel.y)).rgb * u_sharpness;
        color -= texture2D(u_texture, uv - vec2(0, texel.y)).rgb * u_sharpness;
        return color;
      }

      void main() {
        float texAspect = u_textureSize.x / u_textureSize.y;
        float canAspect = u_canvasSize.x / u_canvasSize.y;
        vec2 scale = (texAspect > canAspect)
          ? vec2(1.0, canAspect / texAspect)
          : vec2(texAspect / canAspect, 1.0);

        vec2 centeredUV = (v_uv - 0.5) / scale + 0.5;

        vec2 pixelSize = vec2(1.0) / (u_pixelation * u_textureSize / min(u_textureSize.x, u_textureSize.y));
        centeredUV = (floor(centeredUV / pixelSize) + 0.5) * pixelSize;

        if (u_isWebcam == 1) {
          centeredUV.x = 1.0 - centeredUV.x;
        }

        if (centeredUV.x < 0.0 || centeredUV.x > 1.0 || centeredUV.y < 0.0 || centeredUV.y > 1.0) {
          discard;
        } else {
          vec3 color = applySharpen(vec2(centeredUV.x, 1.0 - centeredUV.y));
          color = adjustContrast(color, u_contrast);
          color = adjustSaturation(color, u_saturation);
          gl_FragColor = vec4(color, 1.0);
        }
      }
    `;

    const compileShader = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    const positionLoc = gl.getAttribLocation(program, "a_position");
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture();
    const u_texture = gl.getUniformLocation(program, "u_texture");
    const u_textureSize = gl.getUniformLocation(program, "u_textureSize");
    const u_canvasSize = gl.getUniformLocation(program, "u_canvasSize");
    const u_isWebcam = gl.getUniformLocation(program, "u_isWebcam");
    const u_contrast = gl.getUniformLocation(program, "u_contrast");
    const u_sharpness = gl.getUniformLocation(program, "u_sharpness");
    const u_saturation = gl.getUniformLocation(program, "u_saturation");
    const u_pixelation = gl.getUniformLocation(program, "u_pixelation");

    const updateTexture = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      let sourceElement;
      if (mediaType === "image") sourceElement = imageRef.current;
      else if (mediaType === "video") sourceElement = videoRef.current;
      else if (mediaType === "webcam") sourceElement = webcamRef.current;
      if (!sourceElement) return;

      const texWidth = sourceElement.videoWidth || sourceElement.naturalWidth;
      const texHeight = sourceElement.videoHeight || sourceElement.naturalHeight;
      if (!texWidth || !texHeight) return;

      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceElement);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.uniform1i(u_texture, 0);
      gl.uniform2f(u_textureSize, texWidth, texHeight);
      gl.uniform2f(u_canvasSize, canvas.width, canvas.height);
      gl.uniform1i(u_isWebcam, mediaType === "webcam" ? 1 : 0);
      gl.uniform1f(u_contrast, contrast);
      gl.uniform1f(u_sharpness, sharpness);
      gl.uniform1f(u_saturation, saturation);
      gl.uniform1f(u_pixelation, pixelation);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    let rafId;
    const renderLoop = () => {
      const isDynamicMedia = mediaType === "video" || mediaType === "webcam";
      if (isDynamicMedia || needsUpdate) {
        updateTexture();
        if (!isDynamicMedia) setNeedsUpdate(false);
      }
      rafId = requestAnimationFrame(renderLoop);
    };

    renderLoop();
    return () => cancelAnimationFrame(rafId);
  }, [mediaSource, mediaType, contrast, sharpness, saturation, needsUpdate, pixelation]);

  useEffect(() => {
    if (mediaType === "video" && videoRef.current) {
      videoRef.current.src = mediaSource;
      videoRef.current.loop = true;
      videoRef.current.play();
    } else if (mediaType === "image" && imageRef.current) {
      imageRef.current.onload = () => setNeedsUpdate(true);
      imageRef.current.src = mediaSource;
    }
  }, [mediaSource, mediaType]);

  return (
    <div style={{ minHeight: "100vh", overflowY: "auto", position: "relative" }}>
      <HeaderBar ref={headerRef} />
      <div style={{ paddingTop: `${headerHeight}px`, minHeight: `calc(100vh - ${headerHeight}px - ${footerHeight}px)`, paddingBottom: `${footerHeight}px`, backgroundColor: "#f5f5f5" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px", fontFamily: "sans-serif", color: "#222" }}>
          <h2>This project is inspired by <a href="https://www.instagram.com/p/DAb7eYAx8q3/" target="_blank" rel="noopener noreferrer">@the.well.tarot</a></h2>
          <p style={{ lineHeight: "1.6" }}>
            This project explores photomosaics — images built from smaller component images (or “glyphs”). Each glyph is chosen to match the color or intensity of a region of the source image.
          </p>

          <div style={{ marginTop: "2rem" }}>
            <strong>Select media source:</strong>
            <div style={{ display: "flex", gap: "1rem", margin: "1rem 0", flexWrap: "wrap" }}>
              <button onClick={() => fileInputRef.current.click()}>🗂️ File from Computer (Image or Video)</button>
              <input ref={fileInputRef} type="file" accept="image/*,video/*" hidden onChange={(e) => {
                const file = e.target.files[0];
                if (!file) return;
                const url = URL.createObjectURL(file);
                const isVideo = file.type.startsWith("video");
                setMediaType(isVideo ? "video" : "image");
                setMediaSource(url);
                setNeedsUpdate(true);
              }} />
              <button onClick={async () => {
                try {
                  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                  if (webcamRef.current) {
                    webcamRef.current.srcObject = stream;
                    webcamRef.current.play();
                    setMediaType("webcam");
                    setMediaSource("webcam");
                  }
                } catch (error) {
                  console.error("Webcam error:", error);
                }
              }}>📡 Live Webcam</button>
            </div>
          </div>

          <canvas ref={canvasRef} width={800} height={500} style={{ width: "100%", height: "auto", display: "block", backgroundColor: "#000" }} />

          <div style={{ marginTop: "2rem" }}>
            <strong>Adjust image:</strong>
            <div style={{ display: "grid", gap: "1rem", maxWidth: "500px" }}>
              <label>Contrast: <input type="range" min="0" max="3" step="0.01" value={contrast} onChange={(e) => { setContrast(parseFloat(e.target.value)); setNeedsUpdate(true); }} /></label>
              <label>Sharpness: <input type="range" min="0" max="1" step="0.01" value={sharpness} onChange={(e) => { setSharpness(parseFloat(e.target.value)); setNeedsUpdate(true); }} /></label>
              <label>Saturation: <input type="range" min="0" max="2" step="0.01" value={saturation} onChange={(e) => { setSaturation(parseFloat(e.target.value)); setNeedsUpdate(true); }} /></label>
              <label>Pixelation: <input type="range" min="1" max="100" step="1" value={pixelation} onChange={(e) => { setPixelation(parseFloat(e.target.value)); setNeedsUpdate(true); }} /></label>
            </div>
          </div>

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


















// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// // Next step: Upload glyph FOLDER (not glyph image) and take the largest centre square of each glyph image as a "glyph pixel" then within the shader colour match the pixelated "pixels" with the "glyph pixels"
// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

