// // ProjectVoronoiShader.js — CCPD stippling + grayscale mosaic preview (robust)
// // - Full-iteration redraws (no drawing during assignment)
// // - Darkness-weighted seeding with soft min-spacing (strictly zero on whites)
// // - Cranley–Patterson grid translation + jitter (no rotating patch)
// // - Convergence requires small motion AND low capacity RMS
// // - SHOW IMAGE draws a grayscale mosaic in the EXACT same area (no warp)
// // - Rebuilds mosaic on upload/resize/slider/toggle

// function initVoronoiStippling(canvas, userOptions = {}) {
//   const opt = {
//     numPoints: 5000,

//     // Density mapping
//     intensityGamma: 1.2,
//     blurRadius: 1.0,
//     // Whites handling: <= whiteCutoff counts as zero density (no dots there).
//     // 0 = only pure white empty. Raise to 0.01..0.05 if you want near-white also empty.
//     whiteCutoff: 0.0,

//     // Iteration sampler
//     sampleResolution: 200,
//     frameTimeBudgetMs: 0,

//     // CCPD-like dynamics (capacity equalization via power weights)
//     underRelax: 0.9,
//     capacityStrength: 0.6,
//     weightLearningRate: 0.25,
//     etaDecay: 0.9995,
//     maxMove: 1.0,

//     // Seeding
//     seedMinSpacingFactor: 0.6,
//     seedRetries: 10,

//     // Dot radius (auto from coverage)
//     autoRadius: true,
//     coverageScale: 1.0,
//     radiusMin: 0.3,
//     radiusMax: 6.0,

//     // Preview (grayscale mosaic when showImage = true)
//     showImage: false,

//     // Spatial hash
//     hashCellFactor: 3.0,

//     // Convergence (both must pass)
//     moveEpsNorm: 0.002,
//     capRmsEps: 0.08,

//     onConvergence: null,
//     ...userOptions,
//   };

//   const ctx = canvas.getContext("2d");
//   const dpr = window.devicePixelRatio || 1;

//   // Solver arrays
//   let N = 0;
//   let px = new Float32Array(0), py = new Float32Array(0), pw = new Float32Array(0);
//   let ssx = new Float32Array(0), ssy = new Float32Array(0), sc = new Float32Array(0);
//   let dpx = new Float32Array(0), dpy = new Float32Array(0);

//   let running = false, rafId = null;

//   // Assignment sampler
//   let gridStep = 4;
//   let totalSamples = 0;

//   // Spatial hash (IMPORTANT: do not shadow these)
//   let hashCell = 16, cols = 1, rows = 1, buckets = [];

//   // Convergence state
//   let eta = opt.weightLearningRate;
//   let lastNormStep = Infinity, lastCapRms = Infinity, lastPercent = 0, isConverged = false;

//   // Image density
//   let srcCanvasOriginal = null;
//   const densityCanvas = document.createElement("canvas");
//   const densityCtx = densityCanvas.getContext("2d", { willReadFrequently: true });
//   let densityData = null; // 0..255, 255=dark (after gamma)
//   let fitRect = { x: 0, y: 0, w: 0, h: 0 };

//   // Grayscale mosaic preview
//   let pixelCanvas = null, pixelW = 0, pixelH = 0;

//   // RNG/util
//   let iterSeed = 1337;
//   const clamp = (v,a,b)=> v<a?a : (v>b?b:v);
//   const rand  = (a,b)=> a + Math.random()*(b-a);
//   const cssSize = () => ({ W:(canvas.width/dpr)|0, H:(canvas.height/dpr)|0 });
//   const insideActive = (x,y)=> x>=fitRect.x && x<fitRect.x+fitRect.w && y>=fitRect.y && y<fitRect.y+fitRect.h;
//   function lcg() { iterSeed = (1103515245 * iterSeed + 12345) >>> 0; return iterSeed / 0xffffffff; }

//   function computeContainFit(sw, sh, dw, dh){
//     const s = Math.min(dw/sw, dh/sh);
//     const w = Math.max(1, (sw*s)|0), h = Math.max(1, (sh*s)|0);
//     const x = ((dw - w)/2)|0, y = ((dh - h)/2)|0;
//     return { x, y, w, h };
//   }

//   // ---------- Density + preview ----------
//   function buildDensity(){
//     const { W, H } = cssSize();
//     densityCanvas.width = W; densityCanvas.height = H;
//     densityCtx.setTransform(1,0,0,1,0,0);
//     densityCtx.clearRect(0,0,W,H);

//     if (srcCanvasOriginal){
//       fitRect = computeContainFit(srcCanvasOriginal.width, srcCanvasOriginal.height, W, H);
//       densityCtx.filter = (opt.blurRadius>0) ? `blur(${opt.blurRadius}px)` : "none";
//       densityCtx.drawImage(srcCanvasOriginal, 0,0, srcCanvasOriginal.width, srcCanvasOriginal.height, fitRect.x,fitRect.y,fitRect.w,fitRect.h);

//       const id = densityCtx.getImageData(0,0,W,H).data;
//       densityData = new Uint8ClampedArray(W*H);
//       const invG = 1 / Math.max(0.01, opt.intensityGamma || 1);
//       for (let i=0,p=0; i<id.length; i+=4, p++){
//         const y = 0.2126*id[i] + 0.7152*id[i+1] + 0.0722*id[i+2];
//         let d = 1 - (y/255);       // darkness 0..1
//         d = Math.pow(d, invG);     // gamma corrected
//         densityData[p] = (d*255 + 0.5)|0;
//       }
//     } else {
//       const { W, H } = cssSize();
//       fitRect = { x:0, y:0, w:W, h:H };
//       densityData = null;
//     }
//     autoRadius();
//     rebuildPreview();       // ensure mosaic matches current image + N
//     deriveGridAndHash();
//   }

//   // ---------- Mosaic dims (area+aspect, capped to device pixels) ----------
//   // Pick mosaic dims by area+aspect (no GCD), so pixelW*pixelH ≈ N and aspect preserved.
//   function chooseMosaicDimsForN(N) {
//     N = Math.max(1, N|0);

//     const fw = Math.max(1, Math.round(fitRect.w * (window.devicePixelRatio || 1)));
//     const fh = Math.max(1, Math.round(fitRect.h * (window.devicePixelRatio || 1)));
//     const aspect = fw / fh;

//     const Ncap = Math.min(N, fw * fh);

//     let w0 = Math.max(1, Math.min(fw, Math.round(Math.sqrt(Ncap * aspect))));
//     let h0 = Math.max(1, Math.min(fh, Math.round(Ncap / w0)));

//     let best = { w: w0, h: h0, score: Number.POSITIVE_INFINITY };
//     function score(w, h) {
//       const areaErr = Math.abs((w * h) - Ncap);
//       const aspErr  = Math.abs((w / h) - aspect) / Math.max(1e-9, aspect);
//       return areaErr + 0.35 * aspErr * Ncap;
//     }
//     for (let dw = -6; dw <= 6; dw++) {
//       let w = Math.max(1, Math.min(fw, w0 + dw));
//       let h = Math.max(1, Math.min(fh, Math.round(Ncap / w)));
//       const s = score(w, h);
//       if (s < best.score) best = { w, h, score: s };
//     }
//     for (let dh = -6; dh <= 6; dh++) {
//       let h = Math.max(1, Math.min(fh, h0 + dh));
//       let w = Math.max(1, Math.min(fw, Math.round(Ncap / h)));
//       const s = score(w, h);
//       if (s < best.score) best = { w, h, score: s };
//     }
//     best.w = Math.max(1, Math.min(fw, best.w|0));
//     best.h = Math.max(1, Math.min(fh, best.h|0));
//     return { w: best.w, h: best.h };
//   }

//   function rebuildPreview() {
//     if (!srcCanvasOriginal) { pixelCanvas = null; return; }

//     const dims = chooseMosaicDimsForN(Math.max(1, N || opt.numPoints));
//     pixelW = Math.max(1, dims.w|0);
//     pixelH = Math.max(1, dims.h|0);

//     pixelCanvas = document.createElement("canvas");
//     pixelCanvas.width  = pixelW;
//     pixelCanvas.height = pixelH;

//     // Downsample the oriented source to the mosaic grid (grayscale)
//     const pctx = pixelCanvas.getContext("2d", { willReadFrequently: true });
//     pctx.imageSmoothingEnabled = true; // good quality when reducing
//     pctx.clearRect(0, 0, pixelW, pixelH);
//     pctx.drawImage(
//       srcCanvasOriginal,
//       0, 0, srcCanvasOriginal.width, srcCanvasOriginal.height,
//       0, 0, pixelW, pixelH
//     );

//     const img = pctx.getImageData(0, 0, pixelW, pixelH);
//     const a = img.data;
//     for (let i = 0; i < a.length; i += 4) {
//       const Y = 0.2126*a[i] + 0.7152*a[i+1] + 0.0722*a[i+2];
//       a[i] = a[i+1] = a[i+2] = Y;
//     }
//     pctx.putImageData(img, 0, 0);
//   }

//   // ---------- Density sampler (0..1), whites = 0 ----------
//   function dens(x,y){
//     if (!densityData) return 1.0;
//     if (!insideActive(x,y)) return 0.0;
//     const W = densityCanvas.width, H = densityCanvas.height;
//     let x0 = clamp(Math.floor(x),0,W-2), y0 = clamp(Math.floor(y),0,H-2);
//     const x1=x0+1, y1=y0+1, fx=x-x0, fy=y-y0;
//     const i00=y0*W+x0, i10=y0*W+x1, i01=y1*W+x0, i11=y1*W+x1;
//     const d0=densityData[i00]*(1-fx)+densityData[i10]*fx;
//     const d1=densityData[i01]*(1-fx)+densityData[i11]*fx;
//     const dark01 = ((d0*(1-fy)+d1*fy)/255); // 0..1 darkness
//     const cutoff = Math.max(0, opt.whiteCutoff || 0);
//     return (dark01 <= cutoff) ? 0 : dark01;
//   }

//   // ---------- Arrays & seeding ----------
//   function allocArrays(n){
//     N=n|0;
//     px=new Float32Array(N); py=new Float32Array(N); pw=new Float32Array(N);
//     ssx=new Float32Array(N); ssy=new Float32Array(N); sc=new Float32Array(N);
//     dpx=new Float32Array(N); dpy=new Float32Array(N);
//   }

//   function expectedSpacing(){
//     const A = Math.max(1, fitRect.w*fitRect.h);
//     return Math.sqrt(A / Math.max(1, N||opt.numPoints));
//   }

//   function weightedSeed(){
//     allocArrays(Math.max(1, opt.numPoints));
//     const W = densityCanvas.width, H = densityCanvas.height;

//     if (!densityData || fitRect.w<=0 || fitRect.h<=0){
//       for (let i=0;i<N;i++){ px[i]=rand(fitRect.x,fitRect.x+fitRect.w); py[i]=rand(fitRect.y,fitRect.y+fitRect.h); }
//     } else {
//       const x0=clamp(fitRect.x|0,0,W-1), y0=clamp(fitRect.y|0,0,H-1);
//       const x1=clamp((fitRect.x+fitRect.w)|0,0,W), y1=clamp((fitRect.y+fitRect.h)|0,0,H);
//       const rw=x1-x0, rh=y1-y0, count=rw*rh;

//       // Build CDF strictly from image darkness (whites contribute 0)
//       const cdf = new Float32Array(count);
//       let acc=0, idx=0;
//       const cutoff = Math.max(0, opt.whiteCutoff || 0);

//       for (let yy=y0; yy<y1; yy++){
//         let base=yy*W + x0;
//         for (let xx=x0; xx<x1; xx++, base++, idx++){
//           const dark01 = densityData[base]/255;
//           const prob = (dark01 <= cutoff) ? 0 : dark01;
//           acc += prob;
//           cdf[idx]=acc;
//         }
//       }

//       if (acc<=0){
//         // fully white image -> fallback to uniform
//         for (let i=0;i<N;i++){ px[i]=rand(fitRect.x,fitRect.x+fitRect.w); py[i]=rand(fitRect.y,fitRect.y+fitRect.h); }
//       } else {
//         // soft min-spacing using a coarse grid
//         const target = expectedSpacing()*opt.seedMinSpacingFactor;
//         const cell = Math.max(2, Math.floor(target));
//         const colsG = Math.max(1, Math.ceil(fitRect.w/cell));
//         const rowsG = Math.max(1, Math.ceil(fitRect.h/cell));
//         const bins = Array.from({length:colsG*rowsG}, ()=>[]);

//         function tooClose(x,y){
//           const cx=clamp(((x-fitRect.x)/cell)|0,0,colsG-1);
//           const cy=clamp(((y-fitRect.y)/cell)|0,0,rowsG-1);
//           for (let dy=-1; dy<=1; dy++){
//             const yy=cy+dy; if (yy<0||yy>=rowsG) continue;
//             for (let dx=-1; dx<=1; dx++){
//               const xx=cx+dx; if (xx<0||xx>=colsG) continue;
//               const arr=bins[yy*colsG+xx];
//               for (let k=0;k<arr.length;k++){
//                 const j=arr[k]; const dxp=x-px[j], dyp=y-py[j];
//                 if (dxp*dxp+dyp*dyp < target*target) return true;
//               }
//             }
//           }
//           return false;
//         }
//         function addBin(i,x,y){
//           const cx=clamp(((x-fitRect.x)/cell)|0,0,colsG-1);
//           const cy=clamp(((y-fitRect.y)/cell)|0,0,rowsG-1);
//           bins[cy*colsG+cx].push(i);
//         }

//         for (let i=0;i<N;i++){
//           let placed=false;
//           for (let r=0;r<opt.seedRetries && !placed; r++){
//             const u=Math.random()*acc;
//             // binary search CDF
//             let lo=0, hi=count-1;
//             while (lo<hi){ const m=(lo+hi)>>1; (cdf[m]<u)? lo=m+1 : hi=m; }
//             const rel=lo, ry=(rel/rw)|0, rx=rel%rw;
//             const x=x0+rx+Math.random(), y=y0+ry+Math.random();
//             if (!tooClose(x,y) || r===opt.seedRetries-1){ px[i]=x; py[i]=y; addBin(i,x,y); placed=true; }
//           }
//         }
//       }
//     }
//     pw.fill(0); dpx.set(px); dpy.set(py);
//   }

//   // ---------- Grid / hash (no shadowing) ----------
//   function deriveGridAndHash(){
//     const { W, H } = cssSize();
//     const minSide = Math.max(1, Math.min(W,H));
//     const denom = Math.max(40, opt.sampleResolution|0);
//     gridStep = Math.max(2, (minSide/denom)|0);

//     // spacing-sized hash
//     const A = Math.max(1, fitRect.w*fitRect.h);
//     const n = Math.max(1, N||opt.numPoints);
//     const expected = Math.sqrt(A/n);
//     hashCell = Math.max(8, (expected*opt.hashCellFactor)|0);

//     cols = Math.max(1, Math.ceil(W/hashCell));
//     rows = Math.max(1, Math.ceil(H/hashCell));
//     const size = cols*rows;

//     if (buckets.length !== size) buckets = new Array(size);
//     for (let i=0;i<size;i++){ const b=buckets[i]; if (b) b.length=0; else buckets[i]=[]; }
//     for (let i=0;i<N;i++){
//       const cx=clamp((px[i]/hashCell)|0,0,cols-1);
//       const cy=clamp((py[i]/hashCell)|0,0,rows-1);
//       buckets[cy*cols+cx].push(i);
//     }
//   }

//   function forEachCandidate(x,y,fn){
//     const cx=clamp((x/hashCell)|0,0,cols-1);
//     const cy=clamp((y/hashCell)|0,0,rows-1);
//     for (let dy=-1; dy<=1; dy++){
//       const iy=cy+dy; if (iy<0||iy>=rows) continue;
//       for (let dx=-1; dx<=1; dx++){
//         const ix=cx+dx; if (ix<0||ix>=cols) continue;
//         const cell=buckets[iy*cols+ix];
//         if (!cell || cell.length===0) continue;
//         for (let k=0;k<cell.length;k++) fn(cell[k]);
//       }
//     }
//   }

//   // ---------- Assignment (full pass, CP-translation + jitter) ----------
//   function runAssignmentFull(){
//     ssx.fill(0); ssy.fill(0); sc.fill(0);
//     totalSamples = 0;

//     const offX = lcg() * gridStep;
//     const offY = lcg() * gridStep;
//     const jitterAmp = 0.33 * gridStep;

//     for (let y = fitRect.y + offY + gridStep*0.5; y < fitRect.y + fitRect.h; y += gridStep){
//       for (let x = fitRect.x + offX + gridStep*0.5; x < fitRect.x + fitRect.w; x += gridStep){
//         const sx = x + (lcg()*2 - 1) * jitterAmp;
//         const sy = y + (lcg()*2 - 1) * jitterAmp;
//         if (!insideActive(sx, sy)) continue;
//         const d = dens(sx, sy); if (d<=0) continue;

//         let best=-1, bestVal=1e30;
//         forEachCandidate(sx, sy, (i)=>{
//           const dx=sx - px[i], dy=sy - py[i];
//           const power = dx*dx + dy*dy - pw[i];
//           if (power < bestVal){ bestVal=power; best=i; }
//         });
//         if (best>=0){ ssx[best]+=sx*d; ssy[best]+=sy*d; sc[best]+=d; totalSamples+=d; }
//       }
//     }
//   }

//   function updateAfterAssignment(){
//     const { W, H } = cssSize();
//     const invMinSide = 1 / Math.max(1, Math.min(W,H));
//     const target = totalSamples / Math.max(1, N);

//     let maxDx2 = 0;
//     const capMove2 = opt.maxMove * opt.maxMove;
//     for (let i=0;i<N;i++){
//       const c = sc[i];
//       if (c > 0){
//         let cx = clamp(ssx[i]/c, fitRect.x, fitRect.x+fitRect.w);
//         let cy = clamp(ssy[i]/c, fitRect.y, fitRect.y+fitRect.h);
//         let dx = (cx - px[i]) * opt.underRelax;
//         let dy = (cy - py[i]) * opt.underRelax;
//         const d2 = dx*dx + dy*dy;
//         if (d2 > capMove2){
//           const s = opt.maxMove / Math.sqrt(d2);
//           dx *= s; dy *= s;
//         }
//         px[i] += dx; py[i] += dy;
//         const mv2 = dx*dx + dy*dy;
//         if (mv2 > maxDx2) maxDx2 = mv2;
//       }
//     }

//     // Capacity equalization (power weights)
//     let meanW = 0;
//     for (let i=0;i<N;i++){
//       const err = target - (sc[i] || 0);
//       pw[i] += opt.capacityStrength * eta * err;
//       meanW += pw[i];
//     }
//     meanW /= Math.max(1,N);
//     for (let i=0;i<N;i++) pw[i] -= meanW;
//     eta *= opt.etaDecay;

//     // Convergence metrics
//     const normStep = Math.sqrt(maxDx2) * invMinSide;
//     let e2=0;
//     const tgt = Math.max(1e-12, target);
//     for (let i=0;i<N;i++){
//       const rel = ((sc[i] || 0) - tgt) / tgt;
//       e2 += rel*rel;
//     }
//     const capRms = Math.sqrt(e2 / Math.max(1,N));

//     lastNormStep = normStep;
//     lastCapRms   = capRms;

//     const moveOk = normStep < Math.max(1e-12, opt.moveEpsNorm);
//     const capOk  = capRms  < Math.max(1e-6,  opt.capRmsEps);
//     isConverged  = moveOk && capOk;

//     const pMove = 1 - clamp(normStep / Math.max(1e-12, opt.moveEpsNorm), 0, 1);
//     const pCap  = 1 - clamp(capRms  / Math.max(1e-6,  opt.capRmsEps),   0, 1);
//     lastPercent = clamp(Math.min(pMove, pCap), 0, 1);

//     if (typeof opt.onConvergence === "function"){
//       opt.onConvergence({
//         normStep: lastNormStep, capRms: lastCapRms,
//         threshold: opt.moveEpsNorm, percent: lastPercent, done: isConverged
//       });
//     }

//     deriveGridAndHash();
//   }

//   // ---------- Rendering ----------
//   function render(){
//     // clear in device space
//     ctx.setTransform(1,0,0,1,0,0);
//     ctx.clearRect(0,0,canvas.width,canvas.height);
//     ctx.fillStyle = "#fff";
//     ctx.fillRect(0,0,canvas.width,canvas.height);

//     // switch to CSS space
//     ctx.setTransform(dpr,0,0,dpr,0,0);

//     // SHOW IMAGE: draw grayscale mosaic EXACTLY in the image area (no crop, no stretch)
//     // We paint one device-pixel-aligned rectangle per mosaic pixel using rounded edges mapping.
//     if (srcCanvasOriginal && opt.showImage && pixelCanvas) {
//       ctx.setTransform(1, 0, 0, 1, 0, 0);

//       const fx = Math.round(fitRect.x * dpr);
//       const fy = Math.round(fitRect.y * dpr);
//       const fw = Math.round(fitRect.w * dpr);
//       const fh = Math.round(fitRect.h * dpr);

//       const pctx = pixelCanvas.getContext("2d", { willReadFrequently: true });
//       const data = pctx.getImageData(0, 0, pixelW, pixelH).data;

//       // Rounded linear mapping to distribute remainder evenly => no warp
//       const xEdge = new Int32Array(pixelW + 1);
//       const yEdge = new Int32Array(pixelH + 1);
//       for (let i = 0; i <= pixelW; i++)  xEdge[i] = fx + Math.round(i * fw / pixelW);
//       for (let j = 0; j <= pixelH; j++)  yEdge[j] = fy + Math.round(j * fh / pixelH);

//       ctx.fillStyle = "#fff";
//       ctx.fillRect(fx, fy, fw, fh);

//       for (let y = 0; y < pixelH; y++) {
//         const y0 = yEdge[y], y1 = yEdge[y+1];
//         const h = y1 - y0; if (h <= 0) continue;
//         for (let x = 0; x < pixelW; x++) {
//           const x0 = xEdge[x], x1 = xEdge[x+1];
//           const w = x1 - x0; if (w <= 0) continue;
//           const idx = (y * pixelW + x) * 4;
//           const g = data[idx]; // grayscale
//           ctx.fillStyle = `rgb(${g},${g},${g})`;
//           ctx.fillRect(x0, y0, w, h);
//         }
//       }

//       ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
//       return; // mosaic only in this mode
//     }

//     // dots
//     dpx.set(px); dpy.set(py);
//     ctx.save();
//     ctx.beginPath();
//     ctx.rect(fitRect.x, fitRect.y, fitRect.w, fitRect.h);
//     ctx.clip();

//     const r = opt.pointRadius || 1.6;
//     ctx.beginPath();
//     for (let i=0;i<N;i++){
//       const x=dpx[i], y=dpy[i];
//       ctx.moveTo(x + r, y);
//       ctx.arc(x, y, r, 0, Math.PI*2);
//     }
//     ctx.fillStyle = "#111";
//     ctx.fill();
//     ctx.restore();
//   }

//   // ---------- Loop ----------
//   function iteration(){
//     runAssignmentFull();
//     updateAfterAssignment();
//     render();
//   }
//   function tick(){
//     iteration();
//     if (running && !isConverged) rafId = requestAnimationFrame(tick);
//     else { running=false; rafId=null; }
//   }
//   function run(){ if (!running){ running=true; rafId=requestAnimationFrame(tick); } }
//   function pause(){ running=false; if (rafId) cancelAnimationFrame(rafId); rafId=null; }

//   // ---------- Reset / resize / image ----------
//   function reset(n = opt.numPoints){
//     opt.numPoints = Math.max(1, n|0);
//     weightedSeed();
//     autoRadius();
//     deriveGridAndHash();
//     rebuildPreview();  // ensure mosaic matches the slider's N
//     lastNormStep = Infinity; lastCapRms = Infinity; lastPercent = 0; isConverged = false;
//     iterSeed = 1337 + Math.floor(Math.random()*1e6);
//     render();
//   }

//   function resize(){
//     const rect = canvas.getBoundingClientRect();
//     canvas.width  = Math.max(1, (rect.width  * dpr)|0);
//     canvas.height = Math.max(1, (rect.height * dpr)|0);
//     buildDensity();                    // updates fitRect + density + mosaic
//     if (N===0) reset(opt.numPoints); else { deriveGridAndHash(); rebuildPreview(); render(); }
//   }

//   // Ensure new uploads show pixelated image immediately (even if Show Image is on)
//   function setDensityFromImageCanvas(orientedCanvas){
//     srcCanvasOriginal = orientedCanvas;
//     buildDensity();                    // updates fitRect + density
//     rebuildPreview();                  // build mosaic for NEW image
//     render();                          // draw it if showImage is true
//     // Keep solver behavior as before:
//     reset(N>0?N:opt.numPoints);
//   }

//   function setImageVisibility(v){
//     opt.showImage = !!v;
//     if (opt.showImage) rebuildPreview(); // fresh mosaic on toggle
//     render();
//   }

//   function autoRadius(){
//     if (!opt.autoRadius) return;
//     const A = Math.max(1, fitRect.w*fitRect.h);
//     const n = Math.max(1, N||opt.numPoints);
//     let avgD = 0.5;
//     if (densityData){
//       const W=densityCanvas.width, H=densityCanvas.height;
//       const x0=clamp(fitRect.x|0,0,W-1), y0=clamp(fitRect.y|0,0,H-1);
//       const x1=clamp((fitRect.x+fitRect.w)|0,0,W), y1=clamp((fitRect.y+fitRect.h)|0,0,H);
//       let sum=0,cnt=0;
//       for (let y=y0;y<y1;y++){
//         let base=y*W + x0;
//         for (let x=x0;x<x1;x++,base++) sum+=densityData[base];
//         cnt += (x1-x0);
//       }
//       if (cnt>0) avgD = (sum/cnt)/255;
//     }
//     const areaPerDot = (avgD*A)/Math.max(1,n);
//     opt.pointRadius = clamp(Math.sqrt(areaPerDot/Math.PI)*opt.coverageScale, opt.radiusMin, opt.radiusMax);
//   }

//   // Init
//   resize();

//   return {
//     run, pause, reset, render, resize,
//     setDensityFromImageCanvas,
//     setImageVisibility,
//     getConvergence: ()=>({
//       percent: lastPercent,
//       normStep: lastNormStep,
//       capRms: lastCapRms,
//       threshold: opt.moveEpsNorm,
//       done: isConverged
//     }),
//   };
// }

// export { initVoronoiStippling };
// export default initVoronoiStippling;



// ProjectVoronoiShader.js — CCPD stippling + grayscale mosaic preview (with Contrast slider)
// - Non-warping grayscale mosaic (Show Image)
// - Darkness-weighted CCPD-ish relaxation (full-iteration redraws)
// - Whites can be empty via whiteCutoff
// - NEW: imageContrast applied to uploaded image for higher/lower contrast

function initVoronoiStippling(canvas, userOptions = {}) {
  const opt = {
    numPoints: 5000,

    // Density mapping
    intensityGamma: 1.2,
    blurRadius: 1.0,
    imageContrast: 1.0,   // NEW: 1.0 = neutral, >1 more contrast, <1 less
    whiteCutoff: 0.0,     // <= cutoff treated as pure white => zero density

    // Iteration sampler
    sampleResolution: 200,
    frameTimeBudgetMs: 0,

    // CCPD-like dynamics
    underRelax: 0.9,
    capacityStrength: 0.6,
    weightLearningRate: 0.25,
    etaDecay: 0.9995,
    maxMove: 1.0,

    // Seeding
    seedMinSpacingFactor: 0.6,
    seedRetries: 10,

    // Dot radius (auto from coverage)
    autoRadius: true,
    coverageScale: 1.0,
    radiusMin: 0.3,
    radiusMax: 6.0,

    // Preview
    showImage: false,

    // Spatial hash
    hashCellFactor: 3.0,

    // Convergence
    moveEpsNorm: 0.002,
    capRmsEps: 0.08,

    onConvergence: null,
    ...userOptions,
  };

  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;

  // ==== solver state ====
  let N = 0;
  let px = new Float32Array(0), py = new Float32Array(0), pw = new Float32Array(0);
  let ssx = new Float32Array(0), ssy = new Float32Array(0), sc = new Float32Array(0);
  let dpx = new Float32Array(0), dpy = new Float32Array(0);

  let running = false, rafId = null;
  let gridStep = 4, totalSamples = 0;

  // spatial hash (do not shadow)
  let hashCell = 16, cols = 1, rows = 1, buckets = [];

  // convergence
  let eta = opt.weightLearningRate;
  let lastNormStep = Infinity, lastCapRms = Infinity, lastPercent = 0, isConverged = false;

  // image density + preview
  let srcCanvasOriginal = null;
  const densityCanvas = document.createElement("canvas");
  const densityCtx = densityCanvas.getContext("2d", { willReadFrequently: true });
  let densityData = null;   // Uint8Clamped (0..255 darkness after gamma & contrast)
  let fitRect = { x:0, y:0, w:0, h:0 };

  let pixelCanvas = null, pixelW = 0, pixelH = 0;

  // utils
  let iterSeed = 1337;
  const clamp = (v,a,b)=> v<a?a : (v>b?b:v);
  const rand  = (a,b)=> a + Math.random()*(b-a);
  const cssSize = () => ({ W:(canvas.width/dpr)|0, H:(canvas.height/dpr)|0 });
  const insideActive = (x,y)=> x>=fitRect.x && x<fitRect.x+fitRect.w && y>=fitRect.y && y<fitRect.y+fitRect.h;
  function lcg() { iterSeed = (1103515245 * iterSeed + 12345) >>> 0; return iterSeed / 0xffffffff; }

  function computeContainFit(sw, sh, dw, dh){
    const s = Math.min(dw/sw, dh/sh);
    const w = Math.max(1, (sw*s)|0), h = Math.max(1, (sh*s)|0);
    const x = ((dw - w)/2)|0, y = ((dh - h)/2)|0;
    return { x, y, w, h };
  }

  // Contrast mapping in [0..1]
  function applyContrast01(g, c){
    // c=1 -> identity, >1 expand away from 0.5, <1 compress toward 0.5
    return clamp(0.5 + (g - 0.5) * c, 0, 1);
  }

  // ---------- Density + preview ----------
  function buildDensity(){
    const { W, H } = cssSize();
    densityCanvas.width = W; densityCanvas.height = H;
    densityCtx.setTransform(1,0,0,1,0,0);
    densityCtx.clearRect(0,0,W,H);

    if (srcCanvasOriginal){
      fitRect = computeContainFit(srcCanvasOriginal.width, srcCanvasOriginal.height, W, H);
      densityCtx.filter = (opt.blurRadius>0) ? `blur(${opt.blurRadius}px)` : "none";
      densityCtx.drawImage(
        srcCanvasOriginal,
        0,0, srcCanvasOriginal.width, srcCanvasOriginal.height,
        fitRect.x, fitRect.y, fitRect.w, fitRect.h
      );

      const id = densityCtx.getImageData(0,0,W,H).data;
      densityData = new Uint8ClampedArray(W*H);

      const invG = 1 / Math.max(0.01, opt.intensityGamma || 1);
      const c = Math.max(0.1, opt.imageContrast || 1);

      for (let i=0,p=0; i<id.length; i+=4, p++){
        // grayscale in [0..1]
        let g = (0.2126*id[i] + 0.7152*id[i+1] + 0.0722*id[i+2]) / 255;
        // apply contrast
        g = applyContrast01(g, c);
        // to darkness + gamma
        let d = 1 - g;
        d = Math.pow(d, invG);
        densityData[p] = (d*255 + 0.5)|0;
      }
    } else {
      const { W, H } = cssSize();
      fitRect = { x:0, y:0, w:W, h:H };
      densityData = null;
    }

    autoRadius();
    rebuildPreview();       // preview honors contrast too
    deriveGridAndHash();
  }

  // Pick mosaic dims by area+aspect (no GCD), so pixelW*pixelH ≈ N and aspect preserved.
  function chooseMosaicDimsForN(N) {
    N = Math.max(1, N|0);

    const fw = Math.max(1, Math.round(fitRect.w * (window.devicePixelRatio || 1)));
    const fh = Math.max(1, Math.round(fitRect.h * (window.devicePixelRatio || 1)));
    const aspect = fw / fh;

    const Ncap = Math.min(N, fw * fh);

    let w0 = Math.max(1, Math.min(fw, Math.round(Math.sqrt(Ncap * aspect))));
    let h0 = Math.max(1, Math.min(fh, Math.round(Ncap / w0)));

    let best = { w: w0, h: h0, score: Number.POSITIVE_INFINITY };
    function score(w, h) {
      const areaErr = Math.abs((w * h) - Ncap);
      const aspErr  = Math.abs((w / h) - aspect) / Math.max(1e-9, aspect);
      return areaErr + 0.35 * aspErr * Ncap;
    }
    for (let dw = -6; dw <= 6; dw++) {
      let w = Math.max(1, Math.min(fw, w0 + dw));
      let h = Math.max(1, Math.min(fh, Math.round(Ncap / w)));
      const s = score(w, h);
      if (s < best.score) best = { w, h, score: s };
    }
    for (let dh = -6; dh <= 6; dh++) {
      let h = Math.max(1, Math.min(fh, h0 + dh));
      let w = Math.max(1, Math.min(fw, Math.round(Ncap / h)));
      const s = score(w, h);
      if (s < best.score) best = { w, h, score: s };
    }
    best.w = Math.max(1, Math.min(fw, best.w|0));
    best.h = Math.max(1, Math.min(fh, best.h|0));
    return { w: best.w, h: best.h };
  }

  function rebuildPreview() {
    if (!srcCanvasOriginal) { pixelCanvas = null; return; }

    const dims = chooseMosaicDimsForN(Math.max(1, N || opt.numPoints));
    pixelW = Math.max(1, dims.w|0);
    pixelH = Math.max(1, dims.h|0);

    pixelCanvas = document.createElement("canvas");
    pixelCanvas.width  = pixelW;
    pixelCanvas.height = pixelH;

    const pctx = pixelCanvas.getContext("2d", { willReadFrequently: true });
    pctx.imageSmoothingEnabled = true;
    pctx.clearRect(0, 0, pixelW, pixelH);
    pctx.drawImage(
      srcCanvasOriginal,
      0, 0, srcCanvasOriginal.width, srcCanvasOriginal.height,
      0, 0, pixelW, pixelH
    );

    const img = pctx.getImageData(0, 0, pixelW, pixelH);
    const a = img.data;
    const c = Math.max(0.1, opt.imageContrast || 1);
    for (let i = 0; i < a.length; i += 4) {
      let g = (0.2126*a[i] + 0.7152*a[i+1] + 0.0722*a[i+2]) / 255;
      g = applyContrast01(g, c);
      const Y = (g*255)|0;
      a[i] = a[i+1] = a[i+2] = Y;
      // alpha untouched
    }
    pctx.putImageData(img, 0, 0);
  }

  // Bilinear density [0..1] (whites can be zero via whiteCutoff)
  function dens(x,y){
    if (!densityData) return 1.0;
    if (!insideActive(x,y)) return 0.0;
    const W = densityCanvas.width, H = densityCanvas.height;
    let x0 = clamp(Math.floor(x),0,W-2), y0 = clamp(Math.floor(y),0,H-2);
    const x1=x0+1, y1=y0+1, fx=x-x0, fy=y-y0;
    const i00=y0*W+x0, i10=y0*W+x1, i01=y1*W+x0, i11=y1*W+x1;
    const d0=densityData[i00]*(1-fx)+densityData[i10]*fx;
    const d1=densityData[i01]*(1-fx)+densityData[i11]*fx;
    const dark01 = ((d0*(1-fy)+d1*fy)/255);
    const cutoff = Math.max(0, opt.whiteCutoff || 0);
    return (dark01 <= cutoff) ? 0 : dark01;
  }

  // ---------- Arrays & seeding ----------
  function allocArrays(n){
    N=n|0;
    px=new Float32Array(N); py=new Float32Array(N); pw=new Float32Array(N);
    ssx=new Float32Array(N); ssy=new Float32Array(N); sc=new Float32Array(N);
    dpx=new Float32Array(N); dpy=new Float32Array(N);
  }

  function expectedSpacing(){
    const A = Math.max(1, fitRect.w*fitRect.h);
    return Math.sqrt(A / Math.max(1, N||opt.numPoints));
  }

  function weightedSeed(){
    allocArrays(Math.max(1, opt.numPoints));
    const W = densityCanvas.width, H = densityCanvas.height;

    if (!densityData || fitRect.w<=0 || fitRect.h<=0){
      for (let i=0;i<N;i++){ px[i]=rand(fitRect.x,fitRect.x+fitRect.w); py[i]=rand(fitRect.y,fitRect.y+fitRect.h); }
    } else {
      const x0=clamp(fitRect.x|0,0,W-1), y0=clamp(fitRect.y|0,0,H-1);
      const x1=clamp((fitRect.x+fitRect.w)|0,0,W), y1=clamp((fitRect.y+fitRect.h)|0,0,H);
      const rw=x1-x0, rh=y1-y0, count=rw*rh;

      const cdf = new Float32Array(count);
      let acc=0, idx=0;
      const cutoff = Math.max(0, opt.whiteCutoff || 0);

      for (let yy=y0; yy<y1; yy++){
        let base=yy*W + x0;
        for (let xx=x0; xx<x1; xx++, base++, idx++){
          const dark01 = densityData[base]/255;
          const prob = (dark01 <= cutoff) ? 0 : dark01;
          acc += prob;
          cdf[idx]=acc;
        }
      }

      if (acc<=0){
        // fully white image -> uniform fallback
        for (let i=0;i<N;i++){ px[i]=rand(fitRect.x,fitRect.x+fitRect.w); py[i]=rand(fitRect.y,fitRect.y+fitRect.h); }
      } else {
        const target = expectedSpacing()*opt.seedMinSpacingFactor;
        const cell = Math.max(2, Math.floor(target));
        const colsG = Math.max(1, Math.ceil(fitRect.w/cell));
        const rowsG = Math.max(1, Math.ceil(fitRect.h/cell));
        const bins = Array.from({length:colsG*rowsG}, ()=>[]);

        function tooClose(x,y){
          const cx=clamp(((x-fitRect.x)/cell)|0,0,colsG-1);
          const cy=clamp(((y-fitRect.y)/cell)|0,0,rowsG-1);
          for (let dy=-1; dy<=1; dy++){
            const yy=cy+dy; if (yy<0||yy>=rowsG) continue;
            for (let dx=-1; dx<=1; dx++){
              const xx=cx+dx; if (xx<0||xx>=colsG) continue;
              const arr=bins[yy*colsG+xx];
              for (let k=0;k<arr.length;k++){
                const j=arr[k]; const dxp=x-px[j], dyp=y-py[j];
                if (dxp*dxp+dyp*dyp < target*target) return true;
              }
            }
          }
          return false;
        }
        function addBin(i,x,y){
          const cx=clamp(((x-fitRect.x)/cell)|0,0,colsG-1);
          const cy=clamp(((y-fitRect.y)/cell)|0,0,rowsG-1);
          bins[cy*colsG+cx].push(i);
        }

        for (let i=0;i<N;i++){
          let placed=false;
          for (let r=0;r<opt.seedRetries && !placed; r++){
            const u=Math.random()*acc;
            let lo=0, hi=count-1;
            while (lo<hi){ const m=(lo+hi)>>1; (cdf[m]<u)? lo=m+1 : hi=m; }
            const rel=lo, ry=(rel/rw)|0, rx=rel%rw;
            const x=x0+rx+Math.random(), y=y0+ry+Math.random();
            if (!tooClose(x,y) || r===opt.seedRetries-1){ px[i]=x; py[i]=y; addBin(i,x,y); placed=true; }
          }
        }
      }
    }
    pw.fill(0); dpx.set(px); dpy.set(py);
  }

  // ---------- Grid / hash ----------
  function deriveGridAndHash(){
    const { W, H } = cssSize();
    const minSide = Math.max(1, Math.min(W,H));
    const denom = Math.max(40, opt.sampleResolution|0);
    gridStep = Math.max(2, (minSide/denom)|0);

    const A = Math.max(1, fitRect.w*fitRect.h);
    const n = Math.max(1, N||opt.numPoints);
    const expected = Math.sqrt(A/n);
    hashCell = Math.max(8, (expected*opt.hashCellFactor)|0);

    cols = Math.max(1, Math.ceil(W/hashCell));
    rows = Math.max(1, Math.ceil(H/hashCell));
    const size = cols*rows;

    if (buckets.length !== size) buckets = new Array(size);
    for (let i=0;i<size;i++){ const b=buckets[i]; if (b) b.length=0; else buckets[i]=[]; }
    for (let i=0;i<N;i++){
      const cx=clamp((px[i]/hashCell)|0,0,cols-1);
      const cy=clamp((py[i]/hashCell)|0,0,rows-1);
      buckets[cy*cols+cx].push(i);
    }
  }

  function forEachCandidate(x,y,fn){
    const cx=clamp((x/hashCell)|0,0,cols-1);
    const cy=clamp((y/hashCell)|0,0,rows-1);
    for (let dy=-1; dy<=1; dy++){
      const iy=cy+dy; if (iy<0||iy>=rows) continue;
      for (let dx=-1; dx<=1; dx++){
        const ix=cx+dx; if (ix<0||ix>=cols) continue;
        const cell=buckets[iy*cols+ix];
        if (!cell || cell.length===0) continue;
        for (let k=0;k<cell.length;k++) fn(cell[k]);
      }
    }
  }

  // ---------- Iteration (full pass) ----------
  function runAssignmentFull(){
    ssx.fill(0); ssy.fill(0); sc.fill(0);
    totalSamples = 0;

    const offX = lcg() * gridStep;
    const offY = lcg() * gridStep;
    const jitterAmp = 0.33 * gridStep;

    for (let y = fitRect.y + offY + gridStep*0.5; y < fitRect.y + fitRect.h; y += gridStep){
      for (let x = fitRect.x + offX + gridStep*0.5; x < fitRect.x + fitRect.w; x += gridStep){
        const sx = x + (lcg()*2 - 1) * jitterAmp;
        const sy = y + (lcg()*2 - 1) * jitterAmp;
        if (!insideActive(sx, sy)) continue;
        const d = dens(sx, sy); if (d<=0) continue;

        let best=-1, bestVal=1e30;
        forEachCandidate(sx, sy, (i)=>{
          const dx=sx - px[i], dy=sy - py[i];
          const power = dx*dx + dy*dy - pw[i];
          if (power < bestVal){ bestVal=power; best=i; }
        });
        if (best>=0){ ssx[best]+=sx*d; ssy[best]+=sy*d; sc[best]+=d; totalSamples+=d; }
      }
    }
  }

  function updateAfterAssignment(){
    const { W, H } = cssSize();
    const invMinSide = 1 / Math.max(1, Math.min(W,H));
    const target = totalSamples / Math.max(1, N);

    let maxDx2 = 0;
    const capMove2 = opt.maxMove * opt.maxMove;
    for (let i=0;i<N;i++){
      const c = sc[i];
      if (c > 0){
        let cx = clamp(ssx[i]/c, fitRect.x, fitRect.x+fitRect.w);
        let cy = clamp(ssy[i]/c, fitRect.y, fitRect.y+fitRect.h);
        let dx = (cx - px[i]) * opt.underRelax;
        let dy = (cy - py[i]) * opt.underRelax;
        const d2 = dx*dx + dy*dy;
        if (d2 > capMove2){
          const s = opt.maxMove / Math.sqrt(d2);
          dx *= s; dy *= s;
        }
        px[i] += dx; py[i] += dy;
        const mv2 = dx*dx + dy*dy;
        if (mv2 > maxDx2) maxDx2 = mv2;
      }
    }

    // Capacity equalization (power weights)
    let meanW = 0;
    for (let i=0;i<N;i++){
      const err = target - (sc[i] || 0);
      pw[i] += opt.capacityStrength * eta * err;
      meanW += pw[i];
    }
    meanW /= Math.max(1,N);
    for (let i=0;i<N;i++) pw[i] -= meanW;
    eta *= opt.etaDecay;

    // Convergence metrics
    const normStep = Math.sqrt(maxDx2) * invMinSide;
    let e2=0;
    const tgt = Math.max(1e-12, target);
    for (let i=0;i<N;i++){
      const rel = ((sc[i] || 0) - tgt) / tgt;
      e2 += rel*rel;
    }
    const capRms = Math.sqrt(e2 / Math.max(1,N));

    lastNormStep = normStep;
    lastCapRms   = capRms;

    const moveOk = normStep < Math.max(1e-12, opt.moveEpsNorm);
    const capOk  = capRms  < Math.max(1e-6,  opt.capRmsEps);
    isConverged  = moveOk && capOk;

    const pMove = 1 - clamp(normStep / Math.max(1e-12, opt.moveEpsNorm), 0, 1);
    const pCap  = 1 - clamp(capRms  / Math.max(1e-6,  opt.capRmsEps),   0, 1);
    lastPercent = clamp(Math.min(pMove, pCap), 0, 1);

    if (typeof opt.onConvergence === "function"){
      opt.onConvergence({
        normStep: lastNormStep, capRms: lastCapRms,
        threshold: opt.moveEpsNorm, percent: lastPercent, done: isConverged
      });
    }

    deriveGridAndHash();
  }

  // ---------- Rendering ----------
  function render(){
    // clear in device space
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // switch to CSS space
    ctx.setTransform(dpr,0,0,dpr,0,0);

    // SHOW IMAGE: draw grayscale mosaic EXACTLY in the image area
    if (srcCanvasOriginal && opt.showImage && pixelCanvas) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      const fx = Math.round(fitRect.x * dpr);
      const fy = Math.round(fitRect.y * dpr);
      const fw = Math.round(fitRect.w * dpr);
      const fh = Math.round(fitRect.h * dpr);

      const pctx = pixelCanvas.getContext("2d", { willReadFrequently: true });
      const data = pctx.getImageData(0, 0, pixelW, pixelH).data;

      const xEdge = new Int32Array(pixelW + 1);
      const yEdge = new Int32Array(pixelH + 1);
      for (let i = 0; i <= pixelW; i++)  xEdge[i] = fx + Math.round(i * fw / pixelW);
      for (let j = 0; j <= pixelH; j++)  yEdge[j] = fy + Math.round(j * fh / pixelH);

      ctx.fillStyle = "#fff";
      ctx.fillRect(fx, fy, fw, fh);

      for (let y = 0; y < pixelH; y++) {
        const y0 = yEdge[y], y1 = yEdge[y+1];
        const h = y1 - y0; if (h <= 0) continue;
        for (let x = 0; x < pixelW; x++) {
          const x0 = xEdge[x], x1 = xEdge[x+1];
          const w = x1 - x0; if (w <= 0) continue;
          const idx = (y * pixelW + x) * 4;
          const g = data[idx]; // grayscale
          ctx.fillStyle = `rgb(${g},${g},${g})`;
          ctx.fillRect(x0, y0, w, h);
        }
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return; // mosaic only in this mode
    }

    // dots
    dpx.set(px); dpy.set(py);
    ctx.save();
    ctx.beginPath();
    ctx.rect(fitRect.x, fitRect.y, fitRect.w, fitRect.h);
    ctx.clip();

    const r = opt.pointRadius || 1.6;
    ctx.beginPath();
    for (let i=0;i<N;i++){
      const x=dpx[i], y=dpy[i];
      ctx.moveTo(x + r, y);
      ctx.arc(x, y, r, 0, Math.PI*2);
    }
    ctx.fillStyle = "#111";
    ctx.fill();
    ctx.restore();
  }

  // ---------- Loop ----------
  function iteration(){
    runAssignmentFull();
    updateAfterAssignment();
    render();
  }
  function tick(){
    iteration();
    if (running && !isConverged) rafId = requestAnimationFrame(tick);
    else { running=false; rafId=null; }
  }
  function run(){ if (!running){ running=true; rafId=requestAnimationFrame(tick); } }
  function pause(){ running=false; if (rafId) cancelAnimationFrame(rafId); rafId=null; }

  // ---------- Reset / resize / image ----------
  function reset(n = opt.numPoints){
    opt.numPoints = Math.max(1, n|0);
    weightedSeed();
    autoRadius();
    deriveGridAndHash();
    rebuildPreview();
    lastNormStep = Infinity; lastCapRms = Infinity; lastPercent = 0; isConverged = false;
    iterSeed = 1337 + Math.floor(Math.random()*1e6);
    render();
  }

  function resize(){
    const rect = canvas.getBoundingClientRect();
    canvas.width  = Math.max(1, (rect.width  * dpr)|0);
    canvas.height = Math.max(1, (rect.height * dpr)|0);
    buildDensity();
    if (N===0) reset(opt.numPoints); else { deriveGridAndHash(); rebuildPreview(); render(); }
  }

  function setDensityFromImageCanvas(orientedCanvas){
    srcCanvasOriginal = orientedCanvas;
    buildDensity();
    rebuildPreview();
    render();
    reset(N>0?N:opt.numPoints);
  }

  function setImageVisibility(v){
    opt.showImage = !!v;
    if (opt.showImage) rebuildPreview();
    render();
  }

  // NEW: live contrast setter (does NOT reset dots)
  function setImageContrast(value){
    opt.imageContrast = Math.max(0.1, Math.min(5, Number(value) || 1));
    buildDensity();          // rebuild density + preview with new contrast
    render();                // dots will reflow as iterations continue
  }

  function autoRadius(){
    if (!opt.autoRadius) return;
    const A = Math.max(1, fitRect.w*fitRect.h);
    const n = Math.max(1, N||opt.numPoints);
    let avgD = 0.5;
    if (densityData){
      const W=densityCanvas.width, H=densityCanvas.height;
      const x0=clamp(fitRect.x|0,0,W-1), y0=clamp(fitRect.y|0,0,H-1);
      const x1=clamp((fitRect.x+fitRect.w)|0,0,W), y1=clamp((fitRect.y+fitRect.h)|0,0,H);
      let sum=0,cnt=0;
      for (let y=y0;y<y1;y++){
        let base=y*W + x0;
        for (let x=x0;x<x1;x++,base++) sum+=densityData[base];
        cnt += (x1-x0);
      }
      if (cnt>0) avgD = (sum/cnt)/255;
    }
    const areaPerDot = (avgD*A)/Math.max(1,n);
    opt.pointRadius = clamp(Math.sqrt(areaPerDot/Math.PI)*opt.coverageScale, opt.radiusMin, opt.radiusMax);
  }

  // Init
  resize();

  return {
    run, pause, reset, render, resize,
    setDensityFromImageCanvas,
    setImageVisibility,
    setImageContrast,    // NEW API
    getConvergence: ()=>({
      percent: lastPercent,
      normStep: lastNormStep,
      capRms: lastCapRms,
      threshold: opt.moveEpsNorm,
      done: isConverged
    }),
  };
}

export { initVoronoiStippling };
export default initVoronoiStippling;


