// // ProjectGlyphsShader.js

// export function getShaders() {
//   const vertexShaderSource = `
//     attribute vec2 a_position;
//     varying vec2 v_uv;
//     void main() {
//       v_uv = a_position * 0.5 + 0.5;
//       gl_Position = vec4(a_position, 0, 1);
//     }
//   `;

//   const fragmentShaderSource = `
//     precision mediump float;
//     varying vec2 v_uv;
//     uniform float u_pixelation;
//     uniform sampler2D u_texture;
//     uniform vec2 u_textureSize;
//     uniform vec2 u_canvasSize;
//     uniform int u_isWebcamFront;
//     uniform float u_contrast;
//     uniform float u_sharpness;
//     uniform float u_saturation;

//     vec3 adjustContrast(vec3 color, float contrast) {
//       return (color - 0.5) * contrast + 0.5;
//     }

//     vec3 adjustSaturation(vec3 color, float saturation) {
//       float grey = dot(color, vec3(0.299, 0.587, 0.114));
//       return mix(vec3(grey), color, saturation);
//     }

//     vec3 applySharpen(vec2 uv) {
//       vec2 texel = 1.0 / u_textureSize;
//       vec3 color = texture2D(u_texture, uv).rgb * (1.0 + 4.0 * u_sharpness);
//       color -= texture2D(u_texture, uv + vec2(texel.x, 0)).rgb * u_sharpness;
//       color -= texture2D(u_texture, uv - vec2(texel.x, 0)).rgb * u_sharpness;
//       color -= texture2D(u_texture, uv + vec2(0, texel.y)).rgb * u_sharpness;
//       color -= texture2D(u_texture, uv - vec2(0, texel.y)).rgb * u_sharpness;
//       return color;
//     }

//     void main() {
//       float texAspect = u_textureSize.x / u_textureSize.y;
//       float canAspect = u_canvasSize.x / u_canvasSize.y;
//       vec2 scale = (texAspect > canAspect)
//         ? vec2(1.0, canAspect / texAspect)
//         : vec2(texAspect / canAspect, 1.0);

//       vec2 centeredUV = (v_uv - 0.5) / scale + 0.5;

//       vec2 pixelSize = vec2(u_pixelation) / u_textureSize;
//       centeredUV = (floor(centeredUV / pixelSize) + 0.5) * pixelSize;

//       if (u_isWebcamFront == 1) {
//         centeredUV.x = 1.0 - centeredUV.x;
//       }

//       if (centeredUV.x < 0.0 || centeredUV.x > 1.0 || centeredUV.y < 0.0 || centeredUV.y > 1.0) {
//         discard;
//       } else {
//         vec3 color = applySharpen(vec2(centeredUV.x, 1.0 - centeredUV.y));
//         color = adjustContrast(color, u_contrast);
//         color = adjustSaturation(color, u_saturation);
//         gl_FragColor = vec4(color, 1.0);
//       }
//     }
//   `;

//   return { vertexShaderSource, fragmentShaderSource };
// }

// export function setupWebGLRenderer({
//   canvas,
//   imageRef,
//   videoRef,
//   webcamRef,
//   mediaType,
//   contrast,
//   sharpness,
//   saturation,
//   pixelation,
//   isFrontFacing,
//   needsUpdate,
//   setNeedsUpdate,
// }) {
//   const gl = canvas.getContext("webgl");
//   if (!gl) {
//     console.error("WebGL not supported");
//     return;
//   }

//   const { vertexShaderSource, fragmentShaderSource } = getShaders();

//   const compileShader = (type, source) => {
//     const shader = gl.createShader(type);
//     gl.shaderSource(shader, source);
//     gl.compileShader(shader);
//     if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
//       console.error(gl.getShaderInfoLog(shader));
//       return null;
//     }
//     return shader;
//   };

//   const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
//   const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
//   const program = gl.createProgram();
//   gl.attachShader(program, vertexShader);
//   gl.attachShader(program, fragmentShader);
//   gl.linkProgram(program);
//   gl.useProgram(program);

//   const positionLoc = gl.getAttribLocation(program, "a_position");
//   const positionBuffer = gl.createBuffer();
//   gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
//   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
//     -1, -1, 1, -1, -1, 1,
//     -1, 1, 1, -1, 1, 1
//   ]), gl.STATIC_DRAW);
//   gl.enableVertexAttribArray(positionLoc);
//   gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

//   const texture = gl.createTexture();
//   const u_texture = gl.getUniformLocation(program, "u_texture");
//   const u_textureSize = gl.getUniformLocation(program, "u_textureSize");
//   const u_canvasSize = gl.getUniformLocation(program, "u_canvasSize");
//   const u_isWebcamFront = gl.getUniformLocation(program, "u_isWebcamFront");
//   const u_contrast = gl.getUniformLocation(program, "u_contrast");
//   const u_sharpness = gl.getUniformLocation(program, "u_sharpness");
//   const u_saturation = gl.getUniformLocation(program, "u_saturation");
//   const u_pixelation = gl.getUniformLocation(program, "u_pixelation");

//   let rafId;
//   const renderLoop = () => {
//     const sourceElement =
//       mediaType === "image" ? imageRef.current :
//       mediaType === "video" ? videoRef.current :
//       webcamRef.current;

//     const texWidth = sourceElement?.videoWidth || sourceElement?.naturalWidth;
//     const texHeight = sourceElement?.videoHeight || sourceElement?.naturalHeight;
//     if (!texWidth || !texHeight) {
//       rafId = requestAnimationFrame(renderLoop);
//       return;
//     }

//     gl.bindTexture(gl.TEXTURE_2D, texture);
//     gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceElement);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, pixelation > 2 ? gl.NEAREST : gl.LINEAR);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, pixelation > 2 ? gl.NEAREST : gl.LINEAR);

//     gl.viewport(0, 0, canvas.width, canvas.height);
//     gl.clear(gl.COLOR_BUFFER_BIT);

//     gl.uniform1i(u_texture, 0);
//     gl.uniform2f(u_textureSize, texWidth, texHeight);
//     gl.uniform2f(u_canvasSize, canvas.width, canvas.height);
//     gl.uniform1i(u_isWebcamFront, mediaType === "webcam" && isFrontFacing ? 1 : 0);
//     gl.uniform1f(u_contrast, contrast);
//     gl.uniform1f(u_sharpness, sharpness);
//     gl.uniform1f(u_saturation, saturation);
//         // NEW PIXELATION MAPPING (0–100 slider -> block size)
//     // Nonlinear pixelation mapping (slider 0–100 mapped exponentially)
//     const maxDim = Math.max(texWidth, texHeight);

//     // Exponentially remap slider value (0–100) to [0, 1] range
//     const t = pixelation / 100;
//     // Apply inverse exponential easing to t
//     const easedT = 1.0 - Math.pow(1.0 - t, 2.2);

//     // Interpolate between min and max number of blocks
//     const minBlocks = maxDim / 2; // fine detail (slider = 0)
//     const maxBlocks = 1;          // single block (slider = 100)
//     const blocksLongSide = minBlocks * (1.0 - easedT) + maxBlocks * easedT;

//     // Convert to pixel size
//     const pixelSize = maxDim / blocksLongSide;
//     gl.uniform1f(u_pixelation, pixelSize);




//     gl.drawArrays(gl.TRIANGLES, 0, 6);

//     if (mediaType !== "video" && mediaType !== "webcam") setNeedsUpdate(false);
//     rafId = requestAnimationFrame(renderLoop);
//   };

//   renderLoop();
//   return () => cancelAnimationFrame(rafId);
// }










// ProjectGlyphsShader.js

export function getShaders() {
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
    uniform sampler2D u_glyphAtlas;
    uniform vec3 u_glyphAvgColors[100];
    uniform int u_glyphCount;
    uniform vec2 u_textureSize;
    uniform vec2 u_canvasSize;
    uniform int u_isWebcamFront;
    uniform float u_contrast;
    uniform float u_sharpness;
    uniform float u_saturation;
    uniform bool u_useGlyphs;

    vec3 adjustContrast(vec3 color, float contrast) {
      return (color - 0.5) * contrast + 0.5;
    }

    vec3 adjustSaturation(vec3 color, float saturation) {
      float grey = dot(color, vec3(0.299, 0.587, 0.114));
      return mix(vec3(grey), color, saturation);
    }

    int findClosestGlyph(vec3 color) {
      float minDist = 9999.0;
      int minIndex = 0;
      for (int i = 0; i < 100; i++) {
        if (i >= u_glyphCount) break;
        float d = distance(u_glyphAvgColors[i], color);
        if (d < minDist) {
          minDist = d;
          minIndex = i;
        }
      }
      return minIndex;
    }

    void main() {
      float texAspect = u_textureSize.x / u_textureSize.y;
      float canAspect = u_canvasSize.x / u_canvasSize.y;
      vec2 scale = (texAspect > canAspect)
        ? vec2(1.0, canAspect / texAspect)
        : vec2(texAspect / canAspect, 1.0);

      vec2 centeredUV = (v_uv - 0.5) / scale + 0.5;
      vec2 pixelSize = vec2(u_pixelation) / u_textureSize;
      vec2 blockUV = (floor(centeredUV / pixelSize) + 0.5) * pixelSize;

      if (u_isWebcamFront == 1) {
        centeredUV.x = 1.0 - centeredUV.x;
        blockUV.x = 1.0 - blockUV.x;
      }

      if (blockUV.x < 0.0 || blockUV.x > 1.0 || blockUV.y < 0.0 || blockUV.y > 1.0) {
        discard;
      }

      vec2 uv = vec2(blockUV.x, 1.0 - blockUV.y);
      vec3 color = texture2D(u_texture, uv).rgb;
      color = adjustContrast(color, u_contrast);
      color = adjustSaturation(color, u_saturation);

      if (u_useGlyphs) {
        int index = findClosestGlyph(color);
        float cols = float(ceil(sqrt(float(u_glyphCount))));
        float col = mod(float(index), cols);
        float row = floor(float(index) / cols);

        // Local UV within the pixel block
        vec2 relUV = fract(centeredUV * u_textureSize / u_pixelation);
        relUV.y = 1.0 - relUV.y; // 👈 Flip Y inside the glyph
        // Map local UV to atlas tile
        vec2 glyphUV = relUV / cols + vec2(col, row) / cols;
        gl_FragColor = texture2D(u_glyphAtlas, vec2(glyphUV.x, 1.0 - glyphUV.y));

      } else {
        gl_FragColor = vec4(color, 1.0);
      }
    }
  `;

  return { vertexShaderSource, fragmentShaderSource };
}

export function setupWebGLRenderer({
  canvas,
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
}) {
  const gl = canvas.getContext("webgl");
  if (!gl) {
    console.error("WebGL not supported");
    return;
  }

  const { vertexShaderSource, fragmentShaderSource } = getShaders();

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
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1, 1, -1, -1, 1,
    -1, 1, 1, -1, 1, 1
  ]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(positionLoc);
  gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

  const u_texture = gl.getUniformLocation(program, "u_texture");
  const u_glyphAtlas = gl.getUniformLocation(program, "u_glyphAtlas");
  const u_glyphAvgColors = gl.getUniformLocation(program, "u_glyphAvgColors");
  const u_glyphCount = gl.getUniformLocation(program, "u_glyphCount");
  const u_useGlyphs = gl.getUniformLocation(program, "u_useGlyphs");
  const u_textureSize = gl.getUniformLocation(program, "u_textureSize");
  const u_canvasSize = gl.getUniformLocation(program, "u_canvasSize");
  const u_isWebcamFront = gl.getUniformLocation(program, "u_isWebcamFront");
  const u_contrast = gl.getUniformLocation(program, "u_contrast");
  const u_sharpness = gl.getUniformLocation(program, "u_sharpness");
  const u_saturation = gl.getUniformLocation(program, "u_saturation");
  const u_pixelation = gl.getUniformLocation(program, "u_pixelation");

  const imageTexture = gl.createTexture();
  const glyphTexture = gl.createTexture();

  let rafId;
  const renderLoop = () => {
    const sourceElement =
      mediaType === "image" ? imageRef.current :
      mediaType === "video" ? videoRef.current :
      webcamRef.current;

    const texWidth = sourceElement?.videoWidth || sourceElement?.naturalWidth;
    const texHeight = sourceElement?.videoHeight || sourceElement?.naturalHeight;
    if (!texWidth || !texHeight) {
      rafId = requestAnimationFrame(renderLoop);
      return;
    }

    // Upload media texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, imageTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceElement);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.uniform1i(u_texture, 0);

    // Upload glyph atlas if available
    const useGlyphs = showGlyphPreview && glyphAtlas && glyphAvgColors && glyphAvgColors.length > 0;
    gl.uniform1i(u_useGlyphs, useGlyphs ? 1 : 0);
    gl.uniform1i(u_glyphCount, useGlyphs ? glyphAvgColors.length : 0);
    if (useGlyphs) {
      const flatAvg = new Float32Array(glyphAvgColors.flat());
      gl.uniform3fv(u_glyphAvgColors, flatAvg);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, glyphTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, glyphAtlas);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.uniform1i(u_glyphAtlas, 1);
    }

    // Upload uniforms
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.uniform2f(u_textureSize, texWidth, texHeight);
    gl.uniform2f(u_canvasSize, canvas.width, canvas.height);
    gl.uniform1i(u_isWebcamFront, mediaType === "webcam" && isFrontFacing ? 1 : 0);
    gl.uniform1f(u_contrast, contrast);
    gl.uniform1f(u_sharpness, sharpness);
    gl.uniform1f(u_saturation, saturation);

    // Pixelation mapping (slider to pixel size)
    const maxDim = Math.max(texWidth, texHeight);
    const t = pixelation / 100;
    const easedT = 1.0 - Math.pow(1.0 - t, 2.2);
    const minBlocks = maxDim / 2;
    const maxBlocks = 1;
    const blocksLongSide = minBlocks * (1.0 - easedT) + maxBlocks * easedT;
    const pixelSize = maxDim / blocksLongSide;
    gl.uniform1f(u_pixelation, pixelSize);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    if (mediaType !== "video" && mediaType !== "webcam") setNeedsUpdate(false);
    rafId = requestAnimationFrame(renderLoop);
  };

  renderLoop();
  return () => cancelAnimationFrame(rafId);
}

