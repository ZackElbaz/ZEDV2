// ProjectSuperPixelsShader.js
// Live superpixel-like segmentation with adjustable K (slider).
// - Fix: UNPACK_FLIP_Y_WEBGL to correct upside-down image
// - Fix: Use alpha-masked letterboxing so segmentation happens only over the image area

export function initSuperpixelSegmentation(canvas, paramsRef, report) {
  const gl = canvas.getContext("webgl");
  if (!gl) throw new Error("WebGL not supported");

  let width = (canvas.width = canvas.clientWidth);
  let height = (canvas.height = canvas.clientHeight);

  const MAX_K = 64;

  const vertSrc = `
    attribute vec2 a_pos;
    attribute vec2 a_uv;
    varying vec2 v_uv;
    void main(){
      v_uv = a_uv;
      gl_Position = vec4(a_pos, 0.0, 1.0);
    }
  `;

  const fragSrc = `
    precision mediump float;
    varying vec2 v_uv;

    uniform sampler2D u_image;
    uniform sampler2D u_paletteTex; // 1D palette texture (width=MAX_K)
    uniform int u_k;
    uniform float u_edge;
    uniform vec2 u_texSize;

    const int MAXK = ${MAX_K};

    vec3 toLinear(vec3 c){ return pow(c, vec3(2.2)); }

    vec3 rgbLinear_to_lab(vec3 c){
      float r=c.r, g=c.g, b=c.b;
      float x = r*0.4124 + g*0.3576 + b*0.1805;
      float y = r*0.2126 + g*0.7152 + b*0.0722;
      float z = r*0.0193 + g*0.1192 + b*0.9505;
      x /= 0.95047; y /= 1.0; z /= 1.08883;
      float e = 216.0/24389.0;
      float k = 24389.0/27.0;
      float fx = x > e ? pow(x, 1.0/3.0) : (k*x + 16.0)/116.0;
      float fy = y > e ? pow(y, 1.0/3.0) : (k*y + 16.0)/116.0;
      float fz = z > e ? pow(z, 1.0/3.0) : (k*z + 16.0)/116.0;
      return vec3(116.0*fy - 16.0, 500.0*(fx - fy), 200.0*(fy - fz));
    }

    vec3 paletteFetchSRGB(int i){
      float u = (float(i) + 0.5) / float(MAXK);
      return texture2D(u_paletteTex, vec2(u, 0.5)).rgb;
    }

    vec3 quantizeColor(vec3 srgb, out int label){
      vec3 lab = rgbLinear_to_lab(toLinear(srgb));
      float best = 1e20;
      int idx = 0;
      for (int i=0; i<MAXK; ++i){
        if (i >= u_k) break;
        vec3 p_srgb = paletteFetchSRGB(i);
        vec3 p_lab  = rgbLinear_to_lab(toLinear(p_srgb));
        vec3 d = lab - p_lab;
        float dist = dot(d,d);
        if (dist < best){ best = dist; idx = i; }
      }
      label = idx;
      return paletteFetchSRGB(idx);
    }

    void main(){
        vec4 src = texture2D(u_image, v_uv);

        // outside the drawn image? keep white
        if (src.a < 0.5) {
            gl_FragColor = vec4(1.0);
            return;
        }

        int label;
        vec3 col = quantizeColor(src.rgb, label);
        gl_FragColor = vec4(col, 1.0);
        }
  `;

  function compile(type, src){
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(sh) || "Shader compile error");
    }
    return sh;
  }

  const vs = compile(gl.VERTEX_SHADER, vertSrc);
  const fs = compile(gl.FRAGMENT_SHADER, fragSrc);
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(prog) || "Program link error");
  }
  gl.useProgram(prog);

  const loc = {
    a_pos: gl.getAttribLocation(prog, "a_pos"),
    a_uv: gl.getAttribLocation(prog, "a_uv"),
    u_image: gl.getUniformLocation(prog, "u_image"),
    u_paletteTex: gl.getUniformLocation(prog, "u_paletteTex"),
    u_k: gl.getUniformLocation(prog, "u_k"),
    u_edge: gl.getUniformLocation(prog, "u_edge"),
    u_texSize: gl.getUniformLocation(prog, "u_texSize"),
  };

  // Fullscreen triangle
  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1, 0, 0,
     3, -1, 2, 0,
    -1,  3, 0, 2,
  ]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(loc.a_pos);
  gl.vertexAttribPointer(loc.a_pos, 2, gl.FLOAT, false, 16, 0);
  gl.enableVertexAttribArray(loc.a_uv);
  gl.vertexAttribPointer(loc.a_uv, 2, gl.FLOAT, false, 16, 8);

  // Input texture (unit 0)
  const texImage = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texImage);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(loc.u_image, 0);

  // Palette texture (unit 1)
  const texPalette = gl.createTexture();
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, texPalette);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(loc.u_paletteTex, 1);

  // Defaults
  gl.uniform1f(loc.u_edge, (paramsRef.current.edgeStrength ?? 0.6));
  gl.uniform2f(loc.u_texSize, width, height);

  let K = clampInt(paramsRef.current.numColors ?? 8, 2, MAX_K);

  // ---- Source & CPU palette learning ----
  let source = null;
  let isVideo = false;

  const cpuCanvas = document.createElement("canvas");
  const cpuCtx = cpuCanvas.getContext("2d", { willReadFrequently: true });

  function resizeCPUBuffer(sw, sh){
    const targetW = Math.min(320, sw);
    const scale = targetW / sw;
    cpuCanvas.width  = Math.max(1, Math.round(sw * scale));
    cpuCanvas.height = Math.max(1, Math.round(sh * scale));
  }

  function hsv2rgb(h,s,v){
    const i = Math.floor(h*6);
    const f = h*6 - i;
    const p = v*(1-s);
    const q = v*(1-f*s);
    const t = v*(1-(1-f)*s);
    switch(i%6){
      case 0: return [v,t,p];
      case 1: return [q,v,p];
      case 2: return [p,v,t];
      case 3: return [p,q,v];
      case 4: return [t,p,v];
      case 5: return [v,p,q];
    }
    return [v,v,v];
  }

  function defaultPaletteRGB888(k){
    const arr = [];
    for(let i=0;i<k;i++){
      const [r,g,b] = hsv2rgb(i/k, 0.6, 0.9);
      arr.push([Math.round(r*255), Math.round(g*255), Math.round(b*255)]);
    }
    return arr;
  }

  function uploadPaletteTexture(rgb888){
    const data = new Uint8Array(MAX_K * 4);
    for (let i=0; i<MAX_K; i++){
      const base = i*4;
      if (i < K) {
        const [r,g,b] = rgb888[i] || [0,0,0];
        data[base+0] = r|0;
        data[base+1] = g|0;
        data[base+2] = b|0;
        data[base+3] = 255;
      } else {
        data[base+0] = data[base+1] = data[base+2] = 0;
        data[base+3] = 255;
      }
    }
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texPalette);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, MAX_K, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.useProgram(prog);
    gl.uniform1i(loc.u_k, K);
  }

  function learnPaletteFromCurrentFrame(k){
    if (!source) return;

    const sw = source.videoWidth || source.naturalWidth || source.width;
    const sh = source.videoHeight || source.naturalHeight || source.height;
    if (!sw || !sh) return;

    resizeCPUBuffer(sw, sh);
    cpuCtx.drawImage(source, 0, 0, cpuCanvas.width, cpuCanvas.height);
    const { data } = cpuCtx.getImageData(0, 0, cpuCanvas.width, cpuCanvas.height);

    const N = (data.length / 4) | 0;

    const centroids = new Array(k).fill(0).map(() => {
      const idx = ((Math.random() * N) | 0) * 4;
      return [data[idx], data[idx+1], data[idx+2]];
    });

    const counts = new Array(k).fill(0);
    const iters = 5;

    for (let it=0; it<iters; it++){
      const sum = new Array(k).fill(0).map(()=>[0,0,0]);
      counts.fill(0);

      const step = 2;
      for (let y=0; y<cpuCanvas.height; y+=step){
        for (let x=0; x<cpuCanvas.width; x+=step){
          const idx = (y*cpuCanvas.width + x)*4;
          const r = data[idx], g = data[idx+1], b = data[idx+2];
          let best = 1e20, bi = 0;
          for (let i=0; i<k; i++){
            const dr = r-centroids[i][0], dg = g-centroids[i][1], db = b-centroids[i][2];
            const d = dr*dr + dg*dg + db*db;
            if (d<best){ best=d; bi=i; }
          }
          sum[bi][0]+=r; sum[bi][1]+=g; sum[bi][2]+=b; counts[bi]++;
        }
      }
      for (let i=0;i<k;i++){
        if (counts[i]>0){
          centroids[i][0]=sum[i][0]/counts[i];
          centroids[i][1]=sum[i][1]/counts[i];
          centroids[i][2]=sum[i][2]/counts[i];
        }
      }
    }

    for (let i=0;i<k;i++){
      if (!isFinite(centroids[i][0])) {
        centroids[i] = [Math.random()*255, Math.random()*255, Math.random()*255];
        counts[i] = 1;
      }
    }

    centroids.sort((a,b)=>
      (0.2126*a[0]+0.7152*a[1]+0.0722*a[2]) - (0.2126*b[0]+0.7152*b[1]+0.0722*b[2])
    );

    uploadPaletteTexture(centroids);

    if (report){
      const hist = new Array(k).fill(0);
      const step2 = 3;
      for (let y=0; y<cpuCanvas.height; y+=step2){
        for (let x=0; x<cpuCanvas.width; x+=step2){
          const idx = (y*cpuCanvas.width + x)*4;
          const r = data[idx], g = data[idx+1], b = data[idx+2];
          let best = 1e20, bi = 0;
          for (let i=0; i<k; i++){
            const dr = r-centroids[i][0], dg = g-centroids[i][1], db = b-centroids[i][2];
            const d = dr*dr + dg*dg + db*db;
            if (d<best){ best=d; bi=i; }
          }
          hist[bi]++;
        }
      }
      report({ counts: hist, palette: centroids });
    }
  }

  uploadPaletteTexture(defaultPaletteRGB888(K));

  function render(){
    gl.viewport(0,0,width,height);
    gl.clearColor(1,1,1,1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function uploadTextureFromSource(){
    if (!source) return;
    const sw = source.videoWidth || source.naturalWidth || source.width;
    const sh = source.videoHeight || source.naturalHeight || source.height;
    if (!sw || !sh) return;

    // Draw the source into a temp canvas with transparent letterboxing.
    const tmp = document.createElement("canvas");
    tmp.width = width; tmp.height = height;
    const tctx = tmp.getContext("2d");
    tctx.clearRect(0,0,width,height); // transparent background
    const scale = Math.min(width/sw, height/sh);
    const dw = Math.floor(sw*scale), dh = Math.floor(sh*scale);
    const dx = Math.floor((width - dw)/2), dy = Math.floor((height - dh)/2);
    tctx.imageSmoothingEnabled = true;
    tctx.drawImage(source, 0,0, sw,sh, dx,dy, dw,dh);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texImage);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // <— fix upside-down
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tmp);

    gl.useProgram(prog);
    gl.uniform2f(loc.u_texSize, width, height);
  }

  let pausedRef = { current: false };
  let runningRef = { current: true };
  let animationId = null;
  let frameCounter = 0;

  function animate(){
    if (!runningRef.current) return;
    if (!pausedRef.current){
      uploadTextureFromSource();
      render();
      if (isVideo){
        frameCounter = (frameCounter + 1) % 6;
        if (frameCounter === 0) learnPaletteFromCurrentFrame(K);
      }
    }
    animationId = requestAnimationFrame(animate);
  }
  animate();

  function useImage(img){
    source = img; isVideo = false;
    K = clampInt(paramsRef.current?.numColors ?? K, 2, MAX_K);
    learnPaletteFromCurrentFrame(K);
    uploadTextureFromSource();
    render();
  }

  function useVideo(videoEl){
    source = videoEl; isVideo = true;
    K = clampInt(paramsRef.current?.numColors ?? K, 2, MAX_K);
    learnPaletteFromCurrentFrame(K);
  }

  function setNumColors(n){
    K = clampInt(n, 2, MAX_K);
    learnPaletteFromCurrentFrame(K);
  }

  function setEdgeStrength(v){
    gl.useProgram(prog);
    gl.uniform1f(loc.u_edge, Math.max(0, Math.min(1, v)));
  }

  function resize(){
    width = canvas.width = canvas.clientWidth;
    height = canvas.height = canvas.clientHeight;
    gl.viewport(0,0,width,height);
    if (source) uploadTextureFromSource();
    render();
  }

  function reset(){
    if (source){
      learnPaletteFromCurrentFrame(K);
      uploadTextureFromSource();
      render();
    }
  }

  function stop(){ runningRef.current = false; if (animationId) cancelAnimationFrame(animationId); }
  function pause(){ pausedRef.current = true; }
  function resume(){ pausedRef.current = false; }

  return { useImage, useVideo, setNumColors, setEdgeStrength, resize, reset, stop, pause, resume };
}

function clampInt(v, lo, hi){
  v = Math.round(v);
  if (v < lo) v = lo;
  if (v > hi) v = hi;
  return v;
}
