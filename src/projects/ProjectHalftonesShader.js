// // ProjectHalftonesShader.js
// export function initHalftoneShader(gl) {
//   const vsSource = `#version 300 es
//   in vec2 a_position;
//   out vec2 v_uv;
//   void main() {
//     v_uv = a_position * 0.5 + 0.5;
//     gl_Position = vec4(a_position, 0, 1);
//   }`;

//   const fsSource = `#version 300 es
//   precision highp float;
//   in vec2 v_uv;
//   out vec4 outColor;

//   uniform float uDotSpacing;
//   uniform float uDotRadius;
//   uniform float uAngleC;
//   uniform float uAngleM;
//   uniform float uAngleY;
//   uniform float uAngleK;
//   uniform vec2 uResolution;

//   float renderDot(vec2 uv, float angleDeg) {
//     float angle = radians(angleDeg);
//     mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
//     vec2 rotated = rot * uv;

//     vec2 grid = rotated / uDotSpacing;
//     vec2 index = floor(grid);
//     vec2 center = (index + 0.5) * uDotSpacing;
//     float dist = length(rotated - center);

//     float radius = 0.5 * uDotSpacing * uDotRadius;

//     // Inverted smoothstep: 1.0 inside, 0.0 outside
//     return 1.0 - smoothstep(radius, radius + 0.005, dist);
//   }


//   void main() {
//     vec2 uv = (v_uv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);

//     float dotC = renderDot(uv, uAngleC);
//     float dotM = renderDot(uv, uAngleM);
//     float dotY = renderDot(uv, uAngleY);
//     float dotK = renderDot(uv, uAngleK);

//     vec3 color = vec3(1.0); // Start with white paper

//     // Subtract red from cyan → reduce R
//     color.r *= 1.0 - dotC;

//     // Subtract green from magenta → reduce G
//     color.g *= 1.0 - dotM;

//     // Subtract blue from yellow → reduce B
//     color.b *= 1.0 - dotY;

//     // Black ink darkens all channels equally
//     color *= 1.0 - dotK;

//     outColor = vec4(color, 1.0);
//   }
// `;

//   function compileShader(source, type) {
//     const shader = gl.createShader(type);
//     gl.shaderSource(shader, source);
//     gl.compileShader(shader);
//     if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
//       console.error(gl.getShaderInfoLog(shader));
//       gl.deleteShader(shader);
//       return null;
//     }
//     return shader;
//   }

//   const vertexShader = compileShader(vsSource, gl.VERTEX_SHADER);
//   const fragmentShader = compileShader(fsSource, gl.FRAGMENT_SHADER);

//   const program = gl.createProgram();
//   gl.attachShader(program, vertexShader);
//   gl.attachShader(program, fragmentShader);
//   gl.linkProgram(program);
//   if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
//     console.error(gl.getProgramInfoLog(program));
//     return null;
//   }

//   const positionBuffer = gl.createBuffer();
//   gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
//   gl.bufferData(
//     gl.ARRAY_BUFFER,
//     new Float32Array([
//       -1, -1,
//        1, -1,
//       -1,  1,
//       -1,  1,
//        1, -1,
//        1,  1
//     ]),
//     gl.STATIC_DRAW
//   );

//   const vao = gl.createVertexArray();
//   gl.bindVertexArray(vao);
//   const posLoc = gl.getAttribLocation(program, "a_position");
//   gl.enableVertexAttribArray(posLoc);
//   gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

//   const uniformLocations = {
//     dotSpacing: gl.getUniformLocation(program, "uDotSpacing"),
//     dotRadius: gl.getUniformLocation(program, "uDotRadius"),
//     angleC: gl.getUniformLocation(program, "uAngleC"),
//     angleM: gl.getUniformLocation(program, "uAngleM"),
//     angleY: gl.getUniformLocation(program, "uAngleY"),
//     angleK: gl.getUniformLocation(program, "uAngleK"),
//     resolution: gl.getUniformLocation(program, "uResolution"),
//   };

//   function render(uniforms) {
//     gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
//     gl.useProgram(program);
//     gl.bindVertexArray(vao);

//     gl.clearColor(1.0, 1.0, 1.0, 1.0); // white background
//     gl.clear(gl.COLOR_BUFFER_BIT);

//     gl.uniform1f(uniformLocations.dotSpacing, uniforms.dotSpacing);
//     gl.uniform1f(uniformLocations.dotRadius, uniforms.dotRadius);
//     gl.uniform1f(uniformLocations.angleC, uniforms.angleC);
//     gl.uniform1f(uniformLocations.angleM, uniforms.angleM);
//     gl.uniform1f(uniformLocations.angleY, uniforms.angleY);
//     gl.uniform1f(uniformLocations.angleK, uniforms.angleK);
//     gl.uniform2f(uniformLocations.resolution, gl.canvas.width, gl.canvas.height);

//     gl.drawArrays(gl.TRIANGLES, 0, 6);
//   }


//   return { render };
// }



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
      vec2 sampleUV = unrotatedCenter / aspect + 0.5;

      vec3 rgb = texture(uImage, sampleUV).rgb;

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
  };

  let imageTexture = null;

  function setImageTexture(tex) {
    imageTexture = tex;
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

    if (imageTexture) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, imageTexture);
      gl.uniform1i(uniformLocations.image, 0);
    }

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  return {
    render,
    setImageTexture,
  };
}

