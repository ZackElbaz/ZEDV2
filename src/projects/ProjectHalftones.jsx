// // ProjectHalftones.jsx
import React, { useRef, useEffect, useState } from "react";
import HeaderBar from "../components/HeaderBar";
import FooterBar from "../components/FooterBar";
import { initHalftoneShader } from "./ProjectHalftonesShader";
import "./ProjectHalftones.css";

export default function ProjectHalftones() {
  const canvasRef = useRef(null);
  const shaderRef = useRef(null);
  const activeSliderRef = useRef(null);
  
  const refJpg = useRef(null);
  const [jpgHeight, setJpgHeight] = useState(null);


  const paramsRef = useRef({
    dotRadius: 0.5,
    dotSpacing: 0.1,
    angleC: 15,
    angleM: 75,
    angleY: 0,
    angleK: 45,
    showC: true,
    showM: true,
    showY: true,
    showK: true,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext("webgl2");
    if (!gl) {
      console.error("WebGL2 not supported");
      return;
    }

    const resizeCanvas = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    shaderRef.current = initHalftoneShader(gl);

    const renderLoop = () => {
      shaderRef.current.render(paramsRef.current);
      requestAnimationFrame(renderLoop);
    };
    renderLoop();

    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  useEffect(() => {
    const updateHeight = () => {
      if (refJpg.current) {
        setJpgHeight(refJpg.current.clientHeight);
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);


  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      const gl = canvas.getContext("webgl2");

      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);

      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      shaderRef.current.setImageTexture(texture);
    };

    img.src = URL.createObjectURL(file);
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

  const sliderLabels = {
    dotRadius: "Dot Size",
    dotSpacing: "Dot Concentration",
    angleC: "Cyan Grid Angle",
    angleM: "Magenta Grid Angle",
    angleY: "Yellow Grid Angle",
    angleK: "Black Grid Angle",
  };


  return (
    <div className="halftone-wrapper">
      <HeaderBar />
      <main className="halftone-main">
        <div className="intro-section">
          <h1>Halftones</h1>
          <p>
            Halftones are a clever optical illusion used in real life printing to turn just a few ink colours 
            (Cyan, Magenta, Yellow, and Black) into full-colour images. By varying the size and spacing 
            of tiny coloured dots, printers trick your eyes into seeing smooth shades and millions of colours. 
            It’s the same technique that brought newspapers, comic books, and vintage posters to life, and it’s still used today.
          </p>  
          <img
            ref={refJpg}
            src={`${process.env.PUBLIC_URL}/HalftoneHeroes.jpg`}
            alt="Halftone Heroes"
            className="intro-image"
          />
          <p>
            Halftone images may look smooth and natural, but under the surface they’re built on a carefully planned system of dots. 
            Each colour's dots are placed on their own invisible grid, and these grids are rotated at different angles to avoid 
            something called <strong>moiré patterns </strong> (strange ripples or wavy lines that show up when dot patterns overlap the wrong way). 
            If two grids line up too closely, they interfere with each other and create messy visual artefacts. To fix this, 
            printers rotate each layer just enough so the dots blend naturally to the eye. For example, cyan dots might be angled 
            at 15°, magenta at 75°, yellow at 0°, and black at 45°.
          </p>
          <img
            src={`${process.env.PUBLIC_URL}/MoireGif_noahhradek.gif`}
            alt="Moire Gif from [https://medium.com/@noahhradek/moir%C3%A9-patterns-5ebce7c299ae]"
            className="intro-image"
            style={{
              height: jpgHeight ? `${jpgHeight}px` : "auto",
              objectFit: "cover",
            }}
          />
          <p>
            These coloured layers work together using a process called <strong>subtractive colour mixing</strong>. Unlike screens, 
            which use light to mix red, green, and blue (additive mixing), printing uses ink to absorb light. Each ink subtracts 
            certain wavelengths from white light. For instance, cyan ink absorbs red, magenta absorbs green, and yellow absorbs blue.
             By layering these inks as overlapping halftone dots, printers can create a wide range of colours, with black ink added 
             to deepen shadows and enhance contrast. It’s a subtle trick, but it makes all the difference, keeping printed images
              clean, detailed, and smooth.
          </p>
          <img
            src={`${process.env.PUBLIC_URL}/AdditiveAndSubtractiveColourMixing_mayurij.gif`}
            alt="Colour Theory Gif from [https://medium.com/@mayurij/introduction-to-color-theory-part-i-f16da6cad220]"
            className="intro-image"
            style={{
              height: jpgHeight ? `${jpgHeight}px` : "auto",
              objectFit: "cover",
            }}
          />
          <p>
            Try experimenting with the sliders below to see how the halftone system responds. Adjust the rotation angles of the 
            coloured grids to make moiré patterns emerge. You can also toggle colours on and off to see how subtractive colour mixing
             works in real time. For an even deeper look, upload your own image and watch how it's transformed into overlapping dot
             patterns, just like in real-world printing. Whether you're exploring for fun or learning the science behind print, 
             this tool is designed to help you visualise it all.
          </p>

        </div>

        <div className="canvas-wrapper">
          <canvas ref={canvasRef} className="halftone-canvas" />
          <input type="file" accept="image/*" onChange={handleImageUpload} />
          <div className="slider-stack">
            {/* Non-angle sliders */}
            {["dotRadius", "dotSpacing"].map((name) => (
              <label key={name} className="slider-label">
                {sliderLabels[name]}
                <input
                  type="range"
                  min={name === "dotSpacing" ? 0.01 : 0.0}
                  max={name === "dotSpacing" ? 0.5 : 1.5}
                  step={0.01}
                  defaultValue={paramsRef.current[name]}
                  onChange={(e) => (paramsRef.current[name] = parseFloat(e.target.value))}
                  onPointerDown={handleSliderFocus}
                  onPointerUp={handleSliderBlur}
                  onTouchStart={handleSliderFocus}
                  onTouchEnd={handleSliderBlur}
                  onBlur={handleSliderBlur}
                />
              </label>
            ))}


            {/* CMYK angle sliders with toggle buttons */}
            {["C", "M", "Y", "K"].map((letter) => {
            const angleKey = `angle${letter}`;
            const showKey = `show${letter}`;
            return (
              <label key={angleKey} className="slider-label">
                {sliderLabels[angleKey]}
                <div className="visibility-slider-row">
                  <button
                    className={`visibility-toggle ${
                      paramsRef.current[showKey] ? "" : "inactive"
                    }`}
                    onClick={(e) => {
                      paramsRef.current[showKey] = !paramsRef.current[showKey];
                      e.target.classList.toggle("inactive");
                      e.target.textContent = paramsRef.current[showKey]
                        ? "Visibility: On"
                        : "Visibility: Off";
                    }}
                  >
                    {paramsRef.current[showKey] ? "Visibility: On" : "Visibility: Off"}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={180}
                    step={1}
                    defaultValue={paramsRef.current[angleKey]}
                    onChange={(e) =>
                      (paramsRef.current[angleKey] = parseFloat(e.target.value))
                    }
                    onPointerDown={handleSliderFocus}
                    onPointerUp={handleSliderBlur}
                    onTouchStart={handleSliderFocus}
                    onTouchEnd={handleSliderBlur}
                    onBlur={handleSliderBlur}
                  />
                </div>
              </label>
            );
          })}

          </div>
        </div>
      </main>
      <FooterBar />
    </div>
  );
}
