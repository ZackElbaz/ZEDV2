export function setupWebGLRenderer({
  canvas,
  imageRef,
  videoRef,
  webcamRef,
  mediaType,
  contrast,
  sharpness,
  saturation,
  needsUpdate,
  pixelation,
  isFrontFacing,
  setNeedsUpdate,
}) {
  const gl = canvas.getContext("webgl");
  if (!gl) {
    console.error("WebGL not supported");
    return;
  }

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

  const vertexShaderSource = `
    attribute vec2 a_position;
    varying vec2 v_uv;
    void main() {
      v_uv = a_position * 0.5 + 0.5;
      gl_Position = vec4(a_position, 0, 1);
    }
  `;

  const fragmentShaderSource = `
// shader code continues (unchanged)... [continued in next message if needed]
`;

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
  const u_isWebcamFront = gl.getUniformLocation(program, "u_isWebcamFront");
  const u_contrast = gl.getUniformLocation(program, "u_contrast");
  const u_sharpness = gl.getUniformLocation(program, "u_sharpness");
  const u_saturation = gl.getUniformLocation(program, "u_saturation");
  const u_pixelation = gl.getUniformLocation(program, "u_pixelation");

  const renderLoop = () => {
    const sourceElement =
      mediaType === "image"
        ? imageRef.current
        : mediaType === "video"
        ? videoRef.current
        : webcamRef.current;

    const texWidth = sourceElement?.videoWidth || sourceElement?.naturalWidth;
    const texHeight = sourceElement?.videoHeight || sourceElement?.naturalHeight;
    if (!texWidth || !texHeight) return;

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceElement);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, pixelation > 50 ? gl.NEAREST : gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, pixelation > 50 ? gl.NEAREST : gl.LINEAR);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.uniform1i(u_texture, 0);
    gl.uniform2f(u_textureSize, texWidth, texHeight);
    gl.uniform2f(u_canvasSize, canvas.width, canvas.height);
    gl.uniform1i(u_isWebcamFront, mediaType === "webcam" && isFrontFacing ? 1 : 0);
    gl.uniform1f(u_contrast, contrast);
    gl.uniform1f(u_sharpness, sharpness);
    gl.uniform1f(u_saturation, saturation);
    gl.uniform1f(u_pixelation, pixelation);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    requestAnimationFrame(renderLoop);
  };

  requestAnimationFrame(renderLoop);

  return () => cancelAnimationFrame(renderLoop);
}
