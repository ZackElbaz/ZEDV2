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
    uniform float u_glyphCols;
    uniform float u_glyphRows;
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

    float colorDistance(vec3 a, vec3 b) {
      vec3 diff = a - b;
      return dot(diff, diff);
    }

    int findClosestGlyph(vec3 color) {
      float minDist = 9999.0;
      int minIndex = 0;
      float luminance = dot(color, vec3(0.299, 0.587, 0.114));

      for (int i = 0; i < 100; i++) {
        if (i >= u_glyphCount) break;
        float d = (u_glyphAvgColors[i].g == 0.0 && u_glyphAvgColors[i].b == 0.0)
          ? abs(luminance - u_glyphAvgColors[i].r)
          : colorDistance(u_glyphAvgColors[i], color);
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
      if (u_isWebcamFront == 1) {
        centeredUV.x = 1.0 - centeredUV.x;
      }

      vec2 blockSize = vec2(u_pixelation) / u_textureSize;
      vec2 blockCoord = floor(centeredUV / blockSize);
      vec2 blockUV = (blockCoord + 0.5) * blockSize;

      if (blockUV.x < 0.0 || blockUV.x > 1.0 || blockUV.y < 0.0 || blockUV.y > 1.0) {
        discard;
      }

      vec2 uv = vec2(blockUV.x, 1.0 - blockUV.y);

      vec2 texel = vec2(1.0) / u_textureSize;
      vec3 color = texture2D(u_texture, uv).rgb;
      vec3 north = texture2D(u_texture, uv + vec2(0.0, texel.y)).rgb;
      vec3 south = texture2D(u_texture, uv - vec2(0.0, texel.y)).rgb;
      vec3 east  = texture2D(u_texture, uv + vec2(texel.x, 0.0)).rgb;
      vec3 west  = texture2D(u_texture, uv - vec2(texel.x, 0.0)).rgb;

      vec3 sharpColor = (color * 5.0 - north - south - east - west);
      vec3 blended = mix(color, sharpColor, u_sharpness);
      vec3 adjustedColor = adjustSaturation(adjustContrast(blended, u_contrast), u_saturation);

      if (u_useGlyphs) {
        int index = findClosestGlyph(adjustedColor);
        float col = mod(float(index), u_glyphCols);
        float row = float(floor(float(index) / u_glyphCols));
        row = u_glyphRows - 1.0 - row;

        vec2 blockOrigin = blockCoord * blockSize;
        vec2 relUV = (centeredUV - blockOrigin) / blockSize;
        relUV = clamp(relUV, vec2(0.0), vec2(1.0));

        if (u_isWebcamFront == 1) {
          relUV.x = 1.0 - relUV.x;
        }

        vec2 glyphUV = relUV / vec2(u_glyphCols, u_glyphRows) + vec2(col, row) / vec2(u_glyphCols, u_glyphRows);
        gl_FragColor = texture2D(u_glyphAtlas, glyphUV);
      } else {
        gl_FragColor = vec4(adjustedColor, 1.0);
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
  matchByIntensity,
  glyphAtlasReady,
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
  const u_glyphCols = gl.getUniformLocation(program, "u_glyphCols");
  const u_glyphRows = gl.getUniformLocation(program, "u_glyphRows");
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

    if (!texWidth || !texHeight || texWidth === 0 || texHeight === 0) {
      rafId = requestAnimationFrame(renderLoop);
      return;
    }

    const useGlyphs = glyphAtlasReady && showGlyphPreview && glyphAtlas && glyphAvgColors && glyphAvgColors.length > 0;

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, imageTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceElement);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.uniform1i(u_texture, 0);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.uniform2f(u_textureSize, texWidth, texHeight);
    gl.uniform2f(u_canvasSize, canvas.width, canvas.height);
    gl.uniform1i(u_isWebcamFront, mediaType === "webcam" && isFrontFacing ? 1 : 0);
    gl.uniform1f(u_contrast, contrast);
    gl.uniform1f(u_sharpness, sharpness);
    gl.uniform1f(u_saturation, saturation);

    const maxDim = Math.max(texWidth, texHeight);
    const t = pixelation / 100;
    const easedT = 1.0 - Math.pow(1.0 - t, 2.2);
    const minBlocks = maxDim / 2;
    const maxBlocks = 1;
    const blocksLongSide = minBlocks * (1.0 - easedT) + maxBlocks * easedT;
    const pixelSize = maxDim / blocksLongSide;
    gl.uniform1f(u_pixelation, pixelSize);

    gl.uniform1i(u_useGlyphs, useGlyphs ? 1 : 0);
    gl.uniform1i(u_glyphCount, useGlyphs ? glyphAvgColors.length : 0);

    if (useGlyphs) {
      const flatAvg = new Float32Array(
        (matchByIntensity
          ? glyphAvgColors.map(([r, g, b]) => {
              const i = 0.299 * r + 0.587 * g + 0.114 * b;
              return [i, 0, 0];
            })
          : glyphAvgColors
        ).flat()
      );
      gl.uniform3fv(u_glyphAvgColors, flatAvg);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, glyphTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, glyphAtlas);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.uniform1i(u_glyphAtlas, 1);

      const cols = Math.ceil(Math.sqrt(glyphAvgColors.length));
      const rows = Math.ceil(glyphAvgColors.length / cols);
      gl.uniform1f(u_glyphCols, cols);
      gl.uniform1f(u_glyphRows, rows);
    }

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    if (mediaType === "image") setNeedsUpdate(false);
    rafId = requestAnimationFrame(renderLoop);
  };

  renderLoop();
  return () => cancelAnimationFrame(rafId);
}

