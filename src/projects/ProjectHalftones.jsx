import React, { useRef, useEffect, useState } from "react";
import ProjectTemplate from "../components/ProjectTemplate/ProjectTemplate";
import { initHalftoneShader } from "./ProjectHalftonesShader";

export default function ProjectHalftones() {
  const canvasRef = useRef(null);
  const shaderRef = useRef(null);
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

  const [, forceRender] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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

    let rafId = 0;
    const renderLoop = () => {
      shaderRef.current?.render(paramsRef.current);
      rafId = requestAnimationFrame(renderLoop);
    };
    renderLoop();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(rafId);
    };
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
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);

    if (file.type.startsWith("video/")) {
      const video = document.createElement("video");
      video.src = url;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      video.crossOrigin = "anonymous";

      video.addEventListener("loadeddata", () => {
        shaderRef.current?.setVideoTexture(
          video,
          video.videoWidth,
          video.videoHeight
        );

        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            console.warn("Autoplay prevented — try tapping the canvas");
          });
        }
      });
    } else {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const gl = canvas.getContext("webgl2");
        if (!gl) return;

        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        shaderRef.current?.setImageTexture(texture, img.width, img.height);
      };
      img.src = url;
    }

    e.target.value = "";
  };

  const handleOpenCamera = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        const video = document.createElement("video");
        video.srcObject = stream;
        video.muted = true;
        video.autoplay = true;
        video.playsInline = true;

        video.addEventListener("loadeddata", () => {
          const track = stream.getVideoTracks()[0];
          const settings = track.getSettings();
          const isUserFacing = settings.facingMode === "user";

          shaderRef.current?.setVideoTexture(
            video,
            video.videoWidth,
            video.videoHeight,
            isUserFacing
          );

          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {
              console.warn("Autoplay prevented — try tapping to activate.");
            });
          }
        });
      })
      .catch((err) => {
        alert("Camera access denied or not available.");
        console.error(err);
      });
  };

  const sliderLabels = {
    dotRadius: "Dot Size",
    dotSpacing: "Dot Concentration",
    angleC: "Cyan Grid Angle",
    angleM: "Magenta Grid Angle",
    angleY: "Yellow Grid Angle",
    angleK: "Black Grid Angle",
  };

  const intro = [
    {
      type: "paragraph",
      content: (
        <>
          This project was inspired by{" "}
          <a
            href="https://www.youtube.com/watch?v=VckU9UXI_XE"
            target="_blank"
            rel="noopener noreferrer"
          >
            THIS VIDEO
          </a>{" "}
          by Posy, who explains how halftones work in a much more fun way than I
          ever could. If you want to learn more about halftones on this website
          feel free to keep reading below!
        </>
      ),
    },
    {
      type: "paragraph",
      content: (
        <>
          <a
            href="https://en.wikipedia.org/wiki/Halftone"
            target="_blank"
            rel="noopener noreferrer"
          >
            Halftones
          </a>{" "}
          are a clever optical illusion used in real life printing to turn just
          a few ink colours (Cyan, Magenta, Yellow, and Black) into full-colour
          images. By varying the size and spacing of tiny coloured dots,
          printers trick your eyes into seeing smooth shades and millions of
          colours. It’s the same technique that brought newspapers, comic books,
          and vintage posters to life, and it’s still used today.
        </>
      ),
    },
    {
      type: "media",
      items: [
        {
          type: "image",
          src: `${process.env.PUBLIC_URL}/HalftoneHeroes.jpg`,
          alt: "Halftone Heroes",
          className: "intro-image",
        },
      ],
    },
    {
      type: "paragraph",
      content: (
        <>
          Halftone images may look smooth and natural, but under the surface
          they’re built on a carefully planned system of dots. Each colour's
          dots are placed on their own invisible grid, and these grids are
          rotated at different angles to avoid something called{" "}
          <a
            href="https://en.wikipedia.org/wiki/Moir%C3%A9_pattern"
            target="_blank"
            rel="noopener noreferrer"
          >
            moiré patterns
          </a>{" "}
          (strange ripples or wavy lines that show up when dot patterns overlap
          the wrong way). If two grids line up too closely, they interfere with
          each other and create messy visual artefacts. To fix this, printers
          rotate each layer just enough so the dots blend naturally to the eye.
          For example, cyan dots might be angled at 15°, magenta at 75°, yellow
          at 0°, and black at 45°.
        </>
      ),
    },
    {
      type: "media",
      items: [
        {
          type: "image",
          src: `${process.env.PUBLIC_URL}/MoireGif_noahhradek.gif`,
          alt: "Moire Gif from [https://medium.com/@noahhradek/moir%C3%A9-patterns-5ebce7c299ae]",
          className: "intro-image",
          style: {
            height: jpgHeight ? `${jpgHeight}px` : "auto",
            objectFit: "cover",
          },
        },
      ],
    },
    {
      type: "paragraph",
      content: (
        <>
          These coloured layers work together using a process called{" "}
          <a
            href="https://en.wikipedia.org/wiki/Subtractive_color"
            target="_blank"
            rel="noopener noreferrer"
          >
            subtractive colour mixing
          </a>
          . Unlike screens, which use light to mix red, green, and blue
          (additive mixing), printing uses ink to absorb light. Each ink
          subtracts certain wavelengths from white light. For instance, cyan ink
          absorbs red, magenta absorbs green, and yellow absorbs blue. By
          layering these inks as overlapping halftone dots, printers can create
          a wide range of colours, with black ink added to deepen shadows and
          enhance contrast. It’s a subtle trick, but it makes all the
          difference, keeping printed images clean, detailed, and smooth.
        </>
      ),
    },
    {
      type: "media",
      items: [
        {
          type: "image",
          src: `${process.env.PUBLIC_URL}/AdditiveAndSubtractiveColourMixing_mayurij.gif`,
          alt: "Colour Theory Gif from [https://medium.com/@mayurij/introduction-to-color-theory-part-i-f16da6cad220]",
          className: "intro-image",
          style: {
            height: jpgHeight ? `${jpgHeight}px` : "auto",
            objectFit: "cover",
          },
        },
      ],
    },
    {
      type: "paragraph",
      content: (
        <>
          Try experimenting with the sliders below to see how the halftone
          system responds. Adjust the rotation angles of the coloured grids to
          make moiré patterns emerge. You can also toggle colours on and off to
          see how subtractive colour mixing works in real time. For an even
          deeper look, upload your own image and watch how it's transformed into
          overlapping dot patterns, just like in real-world printing. Whether
          you're exploring for fun or learning the science behind print, this
          tool is designed to help you visualise it all.
        </>
      ),
    },
  ];

  const canvasBlock = (
    <div className="template-canvas-shell">
      <canvas ref={canvasRef} className="template-project-canvas" />
    </div>
  );

  const buttons = [
    {
      label: "UPLOAD FILE",
      kind: "file",
      accept: "image/*,video/*",
      onChange: handleImageUpload,
    },
    {
      label: "USE CAMERA",
      onClick: handleOpenCamera,
    },
  ];

  const sliders = [
    {
      label: sliderLabels.dotRadius,
      value: paramsRef.current.dotRadius,
      min: 0.0,
      max: 1.5,
      step: 0.0001,
      onChange: (e) => {
        const raw = parseFloat(e.target.value);
        const min = 0.0;
        const max = 1.5;
        const result = Math.min(Math.max(raw, min), max);
        paramsRef.current.dotRadius = result;
        forceRender((n) => n + 1);
      },
      showValue: true,
      formatValue: (v) => Number(v).toFixed(4),
    },
    {
      label: sliderLabels.dotSpacing,
      value: paramsRef.current.dotSpacing,
      min: 0.005,
      max: 1.0,
      step: 0.0001,
      onChange: (e) => {
        paramsRef.current.dotSpacing = parseFloat(e.target.value);
        forceRender((n) => n + 1);
      },
      showValue: true,
      formatValue: (v) => Number(v).toFixed(4),
    },
    ...["C", "M", "Y", "K"].map((letter) => {
      const angleKey = `angle${letter}`;
      const showKey = `show${letter}`;
      return {
        type: "visibility-row",
        label: sliderLabels[angleKey],
        toggleLabel: paramsRef.current[showKey]
          ? "Visibility: On"
          : "Visibility: Off",
        toggleActive: paramsRef.current[showKey],
        onToggle: () => {
          paramsRef.current[showKey] = !paramsRef.current[showKey];
          forceRender((n) => n + 1);
        },
        value: paramsRef.current[angleKey],
        min: 0,
        max: 180,
        step: 1,
        onChange: (e) => {
          paramsRef.current[angleKey] = parseFloat(e.target.value);
          forceRender((n) => n + 1);
        },
      };
    }),
  ];

  return (
    <ProjectTemplate
      title="Halftones"
      intro={intro}
      canvasBlock={canvasBlock}
      buttons={buttons}
      sliders={sliders}
      sections={[]}
    />
  );
}