// // ProjectHalftonesShader.js
export function initHalftoneShader(gl) {
  const vsSource = `#version 300 es
  in vec2 a_position;
  out vec2 v_uv;
  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0, 1);
  }`;

  const fsSource = `#version 300 es
  precision highp float;
  in vec2 v_uv;
  out vec4 outColor;

  uniform float uDotSpacing;
  uniform float uDotRadius;
  uniform float uAngleC;
  uniform float uAngleM;
  uniform float uAngleY;
  uniform float uAngleK;
  uniform vec2 uResolution;
  uniform sampler2D uImage;
  uniform bool uShowC;
  uniform bool uShowM;
  uniform bool uShowY;
  uniform bool uShowK;
  uniform vec2 uImageResolution;
  uniform bool uFlipX;

  float drawDot(vec2 fragPos, vec2 dotCenter, float radius) {
    float dist = length(fragPos - dotCenter);
    return dist < radius ? 1.0 : 0.0;
  }

  vec3 rgbToCmy(vec3 rgb) {
    return 1.0 - rgb;
  }

  void main() {
    vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
    vec2 uv = (v_uv - 0.5) * aspect;
    vec3 finalColor = vec3(1.0);

    for (int i = 0; i < 4; i++) {
      float angleDeg = i == 0 ? uAngleC :
                       i == 1 ? uAngleM :
                       i == 2 ? uAngleY : uAngleK;

      bool show = i == 0 ? uShowC :
                  i == 1 ? uShowM :
                  i == 2 ? uShowY : uShowK;

      if (!show) continue;

      float angle = radians(angleDeg);
      mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
      vec2 rotated = rot * uv;

      vec2 gridIndex = floor(rotated / uDotSpacing);
      vec2 dotCenter = (gridIndex + 0.5) * uDotSpacing;

      vec2 unrotatedCenter = inverse(rot) * dotCenter;
      vec2 imageAspect = vec2(uImageResolution.x / uImageResolution.y, 1.0);
      vec2 fitScale = aspect / imageAspect;

      vec2 sampleUV = (unrotatedCenter / aspect) * fitScale + 0.5;
      
      if (uFlipX) {
        sampleUV.x = 1.0 - sampleUV.x;
      }

      bool outOfBounds = any(lessThan(sampleUV, vec2(0.0))) || any(greaterThan(sampleUV, vec2(1.0)));
      
      vec3 rgb = outOfBounds ? vec3(1.0) : texture(uImage, sampleUV).rgb;

      


      

      // If image hasn't loaded yet, WebGL returns black (0,0,0) — treat as "placeholder"
      bool isImageLoaded = any(greaterThan(rgb, vec3(0.0)));

      float scale;
      if (!isImageLoaded) {
        scale = 1.0; // Uniform dot size
      } else {
        vec3 cmy = rgbToCmy(rgb);
        float k = min(min(cmy.r, cmy.g), cmy.b);
        vec3 cmyPure = (cmy - vec3(k)) / (1.0 - k + 0.0001);
        scale = i == 0 ? cmyPure.r :
                i == 1 ? cmyPure.g :
                i == 2 ? cmyPure.b : k;
      }


      float radius = 0.5 * uDotSpacing * uDotRadius * scale;
      float dot = drawDot(rotated, dotCenter, radius);

      if (i == 0) finalColor.r *= 1.0 - dot;
      if (i == 1) finalColor.g *= 1.0 - dot;
      if (i == 2) finalColor.b *= 1.0 - dot;
      if (i == 3) finalColor *= 1.0 - dot;
    }

    outColor = vec4(finalColor, 1.0);
  }`;

  function compileShader(source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vertexShader = compileShader(vsSource, gl.VERTEX_SHADER);
  const fragmentShader = compileShader(fsSource, gl.FRAGMENT_SHADER);

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    return null;
  }

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW
  );

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const posLoc = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  const uniformLocations = {
    dotSpacing: gl.getUniformLocation(program, "uDotSpacing"),
    dotRadius: gl.getUniformLocation(program, "uDotRadius"),
    angleC: gl.getUniformLocation(program, "uAngleC"),
    angleM: gl.getUniformLocation(program, "uAngleM"),
    angleY: gl.getUniformLocation(program, "uAngleY"),
    angleK: gl.getUniformLocation(program, "uAngleK"),
    resolution: gl.getUniformLocation(program, "uResolution"),
    image: gl.getUniformLocation(program, "uImage"),
    showC: gl.getUniformLocation(program, "uShowC"),
    showM: gl.getUniformLocation(program, "uShowM"),
    showY: gl.getUniformLocation(program, "uShowY"),
    showK: gl.getUniformLocation(program, "uShowK"),
    imageResolution: gl.getUniformLocation(program, "uImageResolution"),
    flipX: gl.getUniformLocation(program, "uFlipX"),
  };

  let imageTexture = null;
  let imageSize = [1, 1]; // Default

  let videoElement = null;
  let videoTexture = null;

  let isFlipped = false;

  let mediaType = "none"; // can be "image" or "video"


  function setImageTexture(tex, width, height) {
    stopVideoStream();  // 👈 Add this line
    imageTexture = tex;
    imageSize = [width, height];
    isFlipped = false;
    mediaType = "image";
    
  }

  function setVideoTexture(video, width, height, flip = false) {
    videoElement = video;
    isFlipped = flip;
    imageSize = [width, height];
    mediaType = "video";

    if (!videoTexture) {
      videoTexture = gl.createTexture();
    }
  }

  function stopVideoStream() {
    if (videoElement && videoElement.srcObject) {
      const tracks = videoElement.srcObject.getTracks();
      tracks.forEach((track) => track.stop()); // Stop all tracks
      videoElement.srcObject = null;
    }
    videoElement = null;
    isFlipped = false;
    mediaType = "none";
  }


  function render(uniforms) {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.useProgram(program);
    gl.bindVertexArray(vao);

    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.uniform1f(uniformLocations.dotSpacing, uniforms.dotSpacing);
    gl.uniform1f(uniformLocations.dotRadius, uniforms.dotRadius);
    gl.uniform1f(uniformLocations.angleC, uniforms.angleC);
    gl.uniform1f(uniformLocations.angleM, uniforms.angleM);
    gl.uniform1f(uniformLocations.angleY, uniforms.angleY);
    gl.uniform1f(uniformLocations.angleK, uniforms.angleK);
    gl.uniform2f(uniformLocations.resolution, gl.canvas.width, gl.canvas.height);
    gl.uniform1i(uniformLocations.showC, uniforms.showC);
    gl.uniform1i(uniformLocations.showM, uniforms.showM);
    gl.uniform1i(uniformLocations.showY, uniforms.showY);
    gl.uniform1i(uniformLocations.showK, uniforms.showK);
    gl.uniform1i(uniformLocations.flipX, isFlipped ? 1 : 0);

    if (mediaType === "video" && videoElement && videoElement.readyState >= 2) {
      gl.bindTexture(gl.TEXTURE_2D, videoTexture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        videoElement
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, videoTexture);
      gl.uniform1i(uniformLocations.image, 0);
    } else if (mediaType === "image" && imageTexture) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, imageTexture);
      gl.uniform1i(uniformLocations.image, 0);
    }




    gl.uniform2f(uniformLocations.imageResolution, imageSize[0], imageSize[1]);


    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  return {
    render,
    setImageTexture,
    setVideoTexture, // <--- ADD THIS
  };
}

