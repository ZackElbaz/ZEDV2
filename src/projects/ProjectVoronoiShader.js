// ProjectVoronoiShader.js (FAST + STABLE + LOW-ARTEFACT + CONVERGENCE UI + SMOOTH DISPLAY + FREEZE + BETTER DITHER)
//
// CCPD + image density + region confinement + image toggle + auto radius
// Stabilizers: no jitter, micro-move deadband, under-relaxation, eta anneal.
// Artefact reducers: bilinear density sampling, 4-phase subgrid, adaptive polish, better neighbor hash.
// Convergence reporting + fluid display smoothing (drawn positions follow solver positions).
// NEW:
//  - Freeze-on-converge: play/pause won't reintroduce motion after convergence unless state changed or you call resumeFromHere().
//  - Better B/W pixel preview dithering: bwDither = 'none' | 'bayer4' | 'bayer8' | 'floyd'.

function initVoronoiStippling(canvas, userOptions = {}) {
  // ---------- Options ----------
  const opt = {
    numPoints: 1717,
    pointRadius: 1.6,       // auto-updated by coverage math
    sampleResolution: 180,  // baseline sampling grid density (higher = finer/slower)
    capacityStrength: 0.6,
    weightLearningRate: 0.25,
    maxMove: 1.0,
    convergenceEps: 0.002,
    frameTimeBudgetMs: 5.5, // per-frame CPU budget
    hashCellFactor: 3.0,

    // Image density
    intensityGamma: 1.0,
    blurRadius: 0.0,
    minSpacing: 0.0,
    showImage: true,

    // Anti-stuck helpers
    baseDensity: 0.02,
    nudgeStrength: 0.5,
    gradientStep: 2.0,

    // Auto radius = total dot area ~= avg darkness * active area
    autoRadius: true,
    coverageScale: 1.0,
    radiusMin: 0.3,
    radiusMax: 6.0,

    // Optional micro-tuning
    orphanNudgePx: 4.0,       // step for orphan sites (no samples)
    candidateCapPerCell: 1e9, // set ~12–16 for extreme speed on huge N

    // Stabilizers (anti-wobble)
    underRelax: 0.7,          // 0..1 fraction of centroid step to apply
    microStepPx: 0.15,        // ignore steps smaller than this
    etaDecay: 0.9995,         // gently cool capacity learning

    // Display smoothing (visual only; solver still uses px/py)
    displayLerp: 0.25,        // 0..1: 0.25 = smooth; raise for snappier

    // Freeze behavior
    freezeOnConverge: true,   // when converged, Play won't resume solving unless state changed or resumeFromHere() is called

    // Convergence callback (optional): ({normStep, threshold, percent, done}) => { ... }
    onConvergence: null,

    // Pixel preview B/W controls
    bwPreview: true,              // show pixel preview in black/white (not gray)
    bwThreshold: 0.5,             // 0..1 (0.5 = mid-gray cutoff)
    // Dither: 'none' | 'bayer4' | 'bayer8' | 'floyd'
    bwDither: 'bayer8',
    bwDitherStrength: 0.5,        // 0..1 amount for ordered matrices; Floyd ignores this

    ...userOptions,
  };

  // ---------- State ----------
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;

  // Points (Structure of Arrays) - solver positions
  let N = 0;
  let px = new Float32Array(0);
  let py = new Float32Array(0);
  let pw = new Float32Array(0); // power weight

  // Display positions (visual smoothing only)
  let dpx = new Float32Array(0);
  let dpy = new Float32Array(0);

  // Per-iteration accumulators (SoA)
  let ssx = new Float32Array(0);
  let ssy = new Float32Array(0);
  let sc  = new Float32Array(0);

  let running = false;
  let rafId = null;
  let gridStep = 4;
  let phase = "assign";
  let assignY = 0;
  let totalSamples = 0;

  // Spatial grid (flat arrays-of-arrays; no string keys)
  let hashCell = 16;
  let cols = 1, rows = 1;
  let buckets = []; // length = cols*rows, each is an Array<number> of point indices

  // learning
  let eta = opt.weightLearningRate;

  // Subgrid multi-phase (4-phase offsets to kill striping)
  let phase4 = 0;
  const subOffsets = [
    [0.0, 0.0],
    [0.5, 0.0],
    [0.0, 0.5],
    [0.5, 0.5],
  ];

  // Adaptive finishing
  let settleCount = 0;

  // Convergence tracking
  let lastNormStep = Infinity;  // normalized max step this iteration
  let lastConvPercent = 0;      // 0..1
  let isConverged = false;
  let frozen = false;           // hard-freeze after convergence

  // Image density pipeline
  let srcCanvasOriginal = null;
  const densityCanvas = document.createElement("canvas");
  const densityCtx = densityCanvas.getContext("2d", { willReadFrequently: true });
  let densityData = null; // Uint8ClampedArray grayscale [0..255]
  let fitRect = { x: 0, y: 0, w: 0, h: 0 };

  // Pixelated preview (grayscale -> B/W with dithering)
  let pixelCanvas = null, pixelW = 0, pixelH = 0;

  // Internal handle to allow tick() to call optional API hooks
  const stipplerApi = { onConverged: null };

  // ---------- Small helpers ----------
  const clamp = (v, a, b) => (v < a ? a : (v > b ? b : v));
  const rand  = (a, b) => a + Math.random() * (b - a);

  function markDirty() {
    isConverged = false;
    frozen = false;
    settleCount = 0;
    // keep positions; just restart assignment pass
    beginAssignment();
  }

  function computeContainFit(srcW, srcH, dstW, dstH) {
    const s = Math.min(dstW / srcW, dstH / srcH);
    const w = Math.max(1, (srcW * s) | 0);
    const h = Math.max(1, (srcH * s) | 0);
    const x = ((dstW - w) / 2) | 0;
    const y = ((dstH - h) / 2) | 0;
    return { x, y, w, h };
  }

  // aspect-aware, count-near-N pixel grid
  function choosePixelGridDims(n, aspect) {
    if (n < 1) return { w: 1, h: 1 };
    const targetH = Math.sqrt(n / Math.max(1e-6, aspect));
    const minH = Math.max(1, Math.floor(targetH * 0.5));
    const maxH = Math.max(minH, Math.ceil(targetH * 1.5));

    let bestW = 1, bestH = Math.max(1, Math.round(targetH)), bestCost = Infinity;
    const W_ASPECT = 1.0, W_COUNT = 0.6;

    for (let h = minH; h <= maxH; h++) {
      const baseW = Math.max(1, Math.round(n / h));
      for (let dw = -2; dw <= 2; dw++) {
        const w = Math.max(1, baseW + dw);
        const cells = w * h;
        const aspectErr = Math.abs(Math.log((w / h) / Math.max(1e-6, aspect)));
        const countErr  = Math.abs(cells - n) / n;
        const cost = W_ASPECT * aspectErr + W_COUNT * countErr;
        if (cost < bestCost) { bestCost = cost; bestW = w; bestH = h; }
      }
    }
    return { w: bestW, h: bestH };
  }

  function buildDensity() {
    const W = (canvas.width / dpr) | 0;
    const H = (canvas.height / dpr) | 0;

    densityCanvas.width = Math.max(1, W);
    densityCanvas.height = Math.max(1, H);
    densityCtx.setTransform(1, 0, 0, 1, 0, 0);
    densityCtx.clearRect(0, 0, W, H);

    if (srcCanvasOriginal) {
      fitRect = computeContainFit(srcCanvasOriginal.width, srcCanvasOriginal.height, W, H);
      densityCtx.filter = (opt.blurRadius && opt.blurRadius > 0) ? `blur(${opt.blurRadius}px)` : "none";
      densityCtx.drawImage(
        srcCanvasOriginal,
        0, 0, srcCanvasOriginal.width, srcCanvasOriginal.height,
        fitRect.x, fitRect.y, fitRect.w, fitRect.h
      );

      const id = densityCtx.getImageData(0, 0, W, H);
      const a = id.data;
      densityData = new Uint8ClampedArray(W * H);

      const invGamma = 1 / Math.max(0.01, opt.intensityGamma || 1.0);
      for (let i = 0, px_i = 0; i < a.length; i += 4, px_i++) {
        const r = a[i], g = a[i + 1], b = a[i + 2];
        let y = 0.2126 * r + 0.7152 * g + 0.0722 * b; // [0..255]
        let dens = 1 - (y * (1/255));                 // dark => high density
        dens = Math.pow(dens, invGamma);
        densityData[px_i] = (dens * 255 + 0.5) | 0;
      }
    } else {
      fitRect = { x: 0, y: 0, w: W, h: H };
      densityData = null;
    }

    recomputePointRadiusForCoverage();
    rebuildPixelatedPreview();
  }

  function insideActive(x, y) {
    return (x >= fitRect.x && x < fitRect.x + fitRect.w &&
            y >= fitRect.y && y < fitRect.y + fitRect.h);
  }

  // ---- Bilinear density sampling ----
  function sampleDensityNormed(x, y) {
    if (!densityData) return 1.0;
    if (!insideActive(x, y)) return 0.0;

    const W = densityCanvas.width, H = densityCanvas.height;
    let x0 = Math.floor(x), y0 = Math.floor(y);
    x0 = x0 < 0 ? 0 : (x0 >= W - 1 ? W - 2 : x0);
    y0 = y0 < 0 ? 0 : (y0 >= H - 1 ? H - 2 : y0);
    const x1 = x0 + 1, y1 = y0 + 1;

    const fx = x - x0, fy = y - y0;
    const i00 = y0 * W + x0, i10 = y0 * W + x1, i01 = y1 * W + x0, i11 = y1 * W + x1;

    const d0 = densityData[i00] * (1 - fx) + densityData[i10] * fx;
    const d1 = densityData[i01] * (1 - fx) + densityData[i11] * fx;
    const dens = ((d0 * (1 - fy) + d1 * fy) / 255);

    return dens > opt.baseDensity ? dens : opt.baseDensity;
  }

  function setDensityFromImageCanvas(orientedCanvas) {
    srcCanvasOriginal = orientedCanvas;
    buildDensity();
    regenerate(N > 0 ? N : opt.numPoints, /*seedInsideRegion=*/true);
    beginAssignment();
    markDirty();
    render();
  }

  function setImageVisibility(show) { opt.showImage = !!show; render(); }

  // ---------- Auto radius (coverage match) ----------
  function recomputePointRadiusForCoverage() {
    if (!opt.autoRadius) return;

    const A = Math.max(1, fitRect.w * fitRect.h);
    const n = Math.max(1, N || opt.numPoints);

    let avgD = 0.5;
    const W = densityCanvas.width, H = densityCanvas.height;
    if (densityData && fitRect.w > 0 && fitRect.h > 0) {
      const x0 = Math.max(0, fitRect.x | 0);
      const y0 = Math.max(0, fitRect.y | 0);
      const x1 = Math.min(W, (fitRect.x + fitRect.w) | 0);
      const y1 = Math.min(H, (fitRect.y + fitRect.h) | 0);
      let sum = 0, cnt = 0;
      for (let y = y0; y < y1; y++) {
        let base = y * W + x0;
        for (let x = x0; x < x1; x++, base++) sum += densityData[base];
        cnt += (x1 - x0);
      }
      if (cnt > 0) avgD = (sum / cnt) * (1/255);
    }

    const targetAreaPerDot = (avgD * A) / n;
    const r = Math.sqrt((targetAreaPerDot / Math.PI)) * (opt.coverageScale || 1.0);
    opt.pointRadius = clamp(r, opt.radiusMin, opt.radiusMax);
  }

  // ---------- Pixelated preview (B/W with dithering) ----------
  function rebuildPixelatedPreview() {
    if (!srcCanvasOriginal) { pixelCanvas = null; return; }

    const aspect = fitRect.w > 0 && fitRect.h > 0 ? fitRect.w / fitRect.h : 1;
    const { w, h } = choosePixelGridDims(Math.max(1, N || opt.numPoints), Math.max(1e-6, aspect));

    pixelCanvas = document.createElement("canvas");
    pixelW = Math.max(1, w | 0);
    pixelH = Math.max(1, h | 0);
    pixelCanvas.width = pixelW;
    pixelCanvas.height = pixelH;

    const pctx = pixelCanvas.getContext("2d", { willReadFrequently: true });

    // Downscale with smoothing (for proper averaging)
    pctx.imageSmoothingEnabled = true;
    pctx.clearRect(0, 0, pixelW, pixelH);
    pctx.drawImage(
      srcCanvasOriginal,
      0, 0, srcCanvasOriginal.width, srcCanvasOriginal.height,
      0, 0, pixelW, pixelH
    );

    // Grayscale buffer
    const img = pctx.getImageData(0, 0, pixelW, pixelH);
    const a = img.data; // RGBA
    const T = Math.max(0, Math.min(1, opt.bwThreshold)) * 255;
    const mode = String(opt.bwDither || 'none').toLowerCase();
    const strength = Math.max(0, Math.min(1, opt.bwDitherStrength || 0));

    // Ordered dither matrices
    const bayer4 = new Uint8Array([ 0,8,2,10, 12,4,14,6, 3,11,1,9, 15,7,13,5 ]); // 0..15
    const bayer8 = new Uint8Array([
       0,48,12,60, 3,51,15,63,
      32,16,44,28,35,19,47,31,
       8,56, 4,52,11,59, 7,55,
      40,24,36,20,43,27,39,23,
       2,50,14,62, 1,49,13,61,
      34,18,46,30,33,17,45,29,
      10,58, 6,54, 9,57, 5,53,
      42,26,38,22,41,25,37,21
    ]); // 0..63

    if (mode === 'floyd') {
      // Floyd–Steinberg error diffusion on tiny canvas
      const W = pixelW, H = pixelH;
      const buf = new Float32Array(W * H);

      // fill grayscale
      for (let i = 0, p = 0; i < buf.length; i++, p += 4) {
        const r = a[p], g = a[p+1], b = a[p+2];
        buf[i] = 0.2126*r + 0.7152*g + 0.0722*b; // 0..255
      }

      // diffuse
      for (let y = 0; y < H; y++) {
        const row = y * W;
        for (let x = 0; x < W; x++) {
          const i = row + x;
          const old = buf[i];
          const out = (old >= T) ? 255 : 0;
          const err = old - out;
          // write pixel
          const p = i << 2;
          a[p] = a[p+1] = a[p+2] = out;

          // distribute error
          if (x + 1 < W)         buf[i + 1]       += err * (7/16);
          if (y + 1 < H) {
            if (x > 0)           buf[i + W - 1]   += err * (3/16);
                                  buf[i + W]       += err * (5/16);
            if (x + 1 < W)       buf[i + W + 1]   += err * (1/16);
          }
        }
      }
      pctx.putImageData(img, 0, 0);
      return;
    }

    // Ordered dithering (bayer4/bayer8) or plain threshold
    for (let y = 0, p = 0; y < pixelH; y++) {
      for (let x = 0; x < pixelW; x++, p += 4) {
        const r = a[p], g = a[p+1], b = a[p+2];
        const Y = 0.2126*r + 0.7152*g + 0.0722*b; // 0..255

        let cutoff = T;
        if (mode === 'bayer4') {
          const d = bayer4[((y & 3) << 2) | (x & 3)]; // 0..15 (center 7.5)
          cutoff = T + ((d - 7.5) / 16) * 255 * (strength * 0.5);
        } else if (mode === 'bayer8') {
          const d = bayer8[((y & 7) << 3) | (x & 7)]; // 0..63 (center 31.5)
          cutoff = T + ((d - 31.5) / 64) * 255 * (strength * 0.9);
        }

        const v = (Y >= cutoff) ? 255 : 0;
        a[p] = a[p+1] = a[p+2] = v;
      }
    }
    pctx.putImageData(img, 0, 0);
  }

  // ---------- Spatial grid ----------
  function rebuildBuckets(Wcss, Hcss) {
    cols = Math.max(1, Math.ceil(Wcss / hashCell));
    rows = Math.max(1, Math.ceil(Hcss / hashCell));
    const size = cols * rows;

    if (buckets.length !== size) buckets = new Array(size);
    for (let i = 0; i < size; i++) {
      const b = buckets[i];
      if (b) b.length = 0; else buckets[i] = [];
    }
    for (let i = 0; i < N; i++) {
      const cx = clamp((px[i] / hashCell) | 0, 0, cols - 1);
      const cy = clamp((py[i] / hashCell) | 0, 0, rows - 1);
      buckets[cy * cols + cx].push(i);
    }
  }

  // ---------- CCPD arrays ----------
  function allocArrays(n) {
    N = n | 0;
    px = new Float32Array(N);
    py = new Float32Array(N);
    pw = new Float32Array(N);
    dpx = new Float32Array(N);
    dpy = new Float32Array(N);
    ssx = new Float32Array(N);
    ssy = new Float32Array(N);
    sc  = new Float32Array(N);
  }

  // ---------- Derive steps ----------
  function deriveGridStep() {
    const W = (canvas.width / dpr) | 0;
    const H = (canvas.height / dpr) | 0;
    const minSide = Math.max(1, Math.min(W, H));
    const denom = Math.max(20, (opt.sampleResolution | 0));

    // Base sampling step
    gridStep = Math.max(2, (minSide / denom) | 0);

    // Expected inter-site spacing in CSS px (use active rect if available)
    const activeW = (fitRect && fitRect.w) ? fitRect.w : W;
    const activeH = (fitRect && fitRect.h) ? fitRect.h : H;
    const A = Math.max(1, activeW * activeH);
    const n = Math.max(1, N || opt.numPoints);
    const expectedSpacing = Math.sqrt(A / n);

    // Hash cells ~ a couple spacings wide (better candidate coverage)
    hashCell = Math.max(8, (expectedSpacing * opt.hashCellFactor) | 0);
  }

  function activeBounds() {
    const W = canvas.width / dpr;
    const H = canvas.height / dpr;
    if (srcCanvasOriginal && fitRect && fitRect.w > 0 && fitRect.h > 0) {
      return { x0: fitRect.x, y0: fitRect.y, x1: fitRect.x + fitRect.w, y1: fitRect.y + fitRect.h };
    }
    return { x0: 0, y0: 0, x1: W, y1: H };
  }

  // ---------- Init / reset ----------
  function regenerate(n = opt.numPoints, seedInsideRegion = false) {
    allocArrays(n);
    const b = activeBounds();
    const W = (canvas.width / dpr) | 0;
    const H = (canvas.height / dpr) | 0;

    const x0 = seedInsideRegion ? b.x0 : 0;
    const y0 = seedInsideRegion ? b.y0 : 0;
    const x1 = seedInsideRegion ? b.x1 : W;
    const y1 = seedInsideRegion ? b.y1 : H;

    for (let i = 0; i < N; i++) {
      px[i] = rand(x0, x1);
      py[i] = rand(y0, y1);
      pw[i] = 0;
      dpx[i] = px[i];   // display starts at solver pos
      dpy[i] = py[i];
    }
    eta = opt.weightLearningRate;

    rebuildBuckets(W, H);
    beginAssignment();

    recomputePointRadiusForCoverage();
    rebuildPixelatedPreview();

    // reset convergence readouts
    lastNormStep = Infinity;
    lastConvPercent = 0;
    isConverged = false;
    frozen = false;
  }

  function beginAssignment() {
    ssx.fill(0); ssy.fill(0); sc.fill(0);
    const off = subOffsets[phase4 & 3];
    assignY = gridStep * (0.5 + off[1]); // phase-shifted sweep to reduce striping
    totalSamples = 0;
    phase = "assign";
  }

  // ---------- Candidate lookup (NO allocations) ----------
  function forEachCandidate(x, y, fn) {
    const cx = clamp((x / hashCell) | 0, 0, cols - 1);
    const cy = clamp((y / hashCell) | 0, 0, rows - 1);
    const cap = opt.candidateCapPerCell | 0;

    for (let dy = -1; dy <= 1; dy++) {
      const iy = cy + dy; if (iy < 0 || iy >= rows) continue;
      for (let dx = -1; dx <= 1; dx++) {
        const ix = cx + dx; if (ix < 0 || ix >= cols) continue;
        const cell = buckets[iy * cols + ix];
        if (!cell || cell.length === 0) continue;

        if (cap < cell.length) {
          for (let k = 0; k < cap; k++) fn(cell[(k / cap * cell.length) | 0]);
        } else {
          for (let k = 0; k < cell.length; k++) fn(cell[k]);
        }
      }
    }
  }

  // ---------- Assignment / update ----------
  function assignSample(W, H, x, y) {
    if (!insideActive(x, y)) return;

    const dens = sampleDensityNormed(x, y);
    if (dens <= 0) return;

    let best = -1, bestVal = 1e30;
    forEachCandidate(x, y, (i) => {
      const dx = x - px[i];
      const dy = y - py[i];
      const power = dx * dx + dy * dy - pw[i];
      if (power < bestVal) { bestVal = power; best = i; }
    });

    if (best >= 0) {
      ssx[best] += x * dens;
      ssy[best] += y * dens;
      sc[best]  += dens;
      totalSamples += dens;
    }
  }

  function processAssignmentChunk(W, H) {
    const t0 = performance.now();
    const off = subOffsets[phase4 & 3];
    const gx0 = gridStep * (0.5 + off[0]);

    for (; assignY < H; assignY += gridStep) {
      for (let x = gx0; x < W; x += gridStep) assignSample(W, H, x, assignY);
      if ((performance.now() - t0) >= opt.frameTimeBudgetMs) break;
    }
    return assignY >= H;
  }

  function densAt(x, y) { return sampleDensityNormed(x, y); }
  function densityGradient(x, y) {
    const h = opt.gradientStep;
    const gx = densAt(x + h, y) - densAt(x - h, y);
    const gy = densAt(x, y + h) - densAt(x, y - h);
    return { gx, gy };
  }

  function updateAfterAssignment(W, H) {
    const b = activeBounds();
    const invMinSide = 1 / Math.max(1, Math.min(W, H));
    const target = totalSamples / Math.max(1, N);

    let maxDx2 = 0;
    const maxMove2 = opt.maxMove * opt.maxMove;
    const micro2 = opt.microStepPx * opt.microStepPx;
    const relax = clamp(opt.underRelax, 0.0, 1.0);

    for (let i = 0; i < N; i++) {
      const c = sc[i];

      if (c > 0) {
        let cx = ssx[i] / c;
        let cy = ssy[i] / c;
        cx = clamp(cx, b.x0, b.x1);
        cy = clamp(cy, b.y0, b.y1);

        let dx = cx - px[i];
        let dy = cy - py[i];

        // limit step by maxMove
        let d2 = dx*dx + dy*dy;
        if (d2 > maxMove2) {
          const inv = 1 / Math.sqrt(d2);
          const f = opt.maxMove * inv;
          dx *= f; dy *= f;
          d2 = maxMove2;
        }

        // under-relaxation
        dx *= relax; dy *= relax; d2 *= (relax*relax);

        // micro-move deadband
        if (d2 >= micro2) {
          px[i] = clamp(px[i] + dx, b.x0, b.x1);
          py[i] = clamp(py[i] + dy, b.y0, b.y1);
          if (d2 > maxDx2) maxDx2 = d2;
        }
      } else {
        // Orphan: deterministic gradient nudge
        const { gx, gy } = densityGradient(px[i], py[i]);
        const len = Math.hypot(gx, gy) || 1;
        const nx = clamp(px[i] + (gx / len) * opt.orphanNudgePx, b.x0, b.x1);
        const ny = clamp(py[i] + (gy / len) * opt.orphanNudgePx, b.y0, b.y1);
        const dx = nx - px[i], dy = ny - py[i];
        px[i] = nx; py[i] = ny;
        const step2 = dx*dx + dy*dy;
        if (step2 > maxDx2) maxDx2 = step2;
      }
    }

    // capacity equalization (weights) with gentle anneal
    let meanW = 0;
    for (let i = 0; i < N; i++) {
      const err = target - (sc[i] || 0);
      pw[i] += opt.capacityStrength * eta * err;
      meanW += pw[i];
    }
    meanW /= N;
    for (let i = 0; i < N; i++) pw[i] -= meanW;

    eta *= opt.etaDecay;

    // ----- Adaptive "polish" step near convergence -----
    const normStep = Math.sqrt(maxDx2) * invMinSide;

    // Convergence metrics
    lastNormStep = normStep;
    const thr = Math.max(1e-12, opt.convergenceEps);
    lastConvPercent = Math.max(0, Math.min(1, 1 - (normStep / thr)));

    if (typeof opt.onConvergence === "function") {
      opt.onConvergence({
        normStep: lastNormStep,
        threshold: opt.convergenceEps,
        percent: lastConvPercent,
        done: false
      });
    }

    if (normStep < opt.convergenceEps * 2 && gridStep > 2) {
      if (++settleCount >= 3) {
        gridStep = Math.max(2, (gridStep / 2) | 0);
        const activeW = (fitRect && fitRect.w) ? fitRect.w : (canvas.width / dpr);
        const activeH = (fitRect && fitRect.h) ? fitRect.h : (canvas.height / dpr);
        const A = Math.max(1, activeW * activeH);
        const n = Math.max(1, N || opt.numPoints);
        const expectedSpacing = Math.sqrt(A / n);
        hashCell = Math.max(8, (expectedSpacing * opt.hashCellFactor) | 0);
        settleCount = 0;
      }
    } else {
      settleCount = 0;
    }

    // Rebuild spatial index
    rebuildBuckets(W, H);

    // 4-phase subgrid
    phase4 = (phase4 + 1) & 3;

    beginAssignment();
    return { done: (normStep) < opt.convergenceEps };
  }

  // ---------- Rendering ----------
  function render() {
    const Wd = canvas.width, Hd = canvas.height;

    // Draw in DEVICE space
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, Wd, Hd);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, Wd, Hd);

    const showPic = !!(srcCanvasOriginal && opt.showImage && pixelCanvas && opt.bwPreview);
    if (showPic) {
      // Draw pixelated B/W image (square blocks, centered)
      const fx = Math.round(fitRect.x * dpr);
      const fy = Math.round(fitRect.y * dpr);
      const fw = Math.round(fitRect.w * dpr);
      const fh = Math.round(fitRect.h * dpr);

      const s = Math.min(fw / pixelW, fh / pixelH);
      const dw = Math.max(1, Math.round(pixelW * s));
      const dh = Math.max(1, Math.round(pixelH * s));
      const dx = fx + ((fw - dw) >> 1);
      const dy = fy + ((fh - dh) >> 1);

      const prevSmooth = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(pixelCanvas, 0, 0, pixelW, pixelH, dx, dy, dw, dh);
      ctx.imageSmoothingEnabled = prevSmooth;

      ctx.restore();
      return; // image-only mode
    }

    ctx.restore();   // leave device space

    // Update display positions (visual smoothing)
    const a = Math.max(0, Math.min(1, opt.displayLerp));
    if (a > 0 && a < 1) {
      for (let i = 0; i < N; i++) {
        dpx[i] += (px[i] - dpx[i]) * a;
        dpy[i] += (py[i] - dpy[i]) * a;
      }
    } else { // snap if a==0 or a>=1
      for (let i = 0; i < N; i++) { dpx[i] = px[i]; dpy[i] = py[i]; }
    }

    // Draw points (CSS space)
    const b = activeBounds();
    ctx.save();
    ctx.beginPath();
    ctx.rect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0);
    ctx.clip();

    ctx.beginPath();
    const r = opt.pointRadius;
    for (let i = 0; i < N; i++) {
      const x = dpx[i], y = dpy[i]; // smoothed display positions
      ctx.moveTo(x + r, y);
      ctx.arc(x, y, r, 0, Math.PI * 2);
    }
    ctx.fillStyle = "#111";
    ctx.fill();

    ctx.restore();
  }

  // ---------- Main loop ----------
  function tick() {
    // If we're frozen (converged and not dirtied) don't do any solver work.
    if (frozen && opt.freezeOnConverge) {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      render(); // still allow redraw
      return;
    }

    const W = (canvas.width / dpr) | 0;
    const H = (canvas.height / dpr) | 0;

    if (phase === "assign") {
      const finished = processAssignmentChunk(W, H);
      render();
      if (finished) phase = "update";
    } else { // "update"
      const { done } = updateAfterAssignment(W, H);
      render();
      if (done) {
        isConverged = true;
        if (typeof stipplerApi?.onConverged === "function") stipplerApi.onConverged();
        if (typeof opt.onConvergence === "function") {
          opt.onConvergence({
            normStep: lastNormStep,
            threshold: opt.convergenceEps,
            percent: 1,
            done: true
          });
        }
        if (opt.freezeOnConverge) {
          frozen = true; // <---- lock the solver
          running = false;
          if (rafId) cancelAnimationFrame(rafId);
          rafId = null;
          return;
        } else {
          pause();
        }
      }
      phase = "assign";
    }

    if (running) rafId = requestAnimationFrame(tick);
  }

  function run(force = false){
    // If frozen and not forced, don't restart motion.
    if (frozen && opt.freezeOnConverge && !force) {
      render();
      return;
    }
    if (!running){ running = true; rafId = requestAnimationFrame(tick); }
  }
  function pause(){ running = false; if (rafId) cancelAnimationFrame(rafId); rafId = null; }
  function reset(n = opt.numPoints){ regenerate(n, !!srcCanvasOriginal); render(); }

  // Explicit continue from the current configuration (unfreeze without reseeding)
  function resumeFromHere() {
    frozen = false;
    isConverged = false;
    settleCount = 0;
    beginAssignment();
    run(true);
  }

  function deriveGridAndBuckets() {
    deriveGridStep();
    rebuildBuckets(canvas.width / dpr, canvas.height / dpr);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, (rect.width  * dpr) | 0);
    canvas.height= Math.max(1, (rect.height * dpr) | 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    deriveGridAndBuckets();
    buildDensity(); // recomputes radius + pixel preview + fitRect
    if (N === 0) regenerate(opt.numPoints, !!srcCanvasOriginal);
    beginAssignment();
    markDirty();
    render();
  }

  // ---------- Init ----------
  resize();
  regenerate(opt.numPoints, /*seedInsideRegion=*/false);
  render();

  return {
    run, pause, reset, render, resize,
    setDensityFromImageCanvas,
    setImageVisibility: (v) => { opt.showImage = !!v; render(); },

    // perf/stability knobs
    setCandidateCap: (k) => { opt.candidateCapPerCell = Math.max(1, k|0); },
    setFrameBudgetMs: (ms) => { opt.frameTimeBudgetMs = Math.max(1, ms|0); },
    setUnderRelax: (u) => { opt.underRelax = Math.min(1, Math.max(0, u)); markDirty(); },
    setMicroStepPx: (p) => { opt.microStepPx = Math.max(0, p); markDirty(); },
    setDisplayLerp: (v) => { opt.displayLerp = Math.max(0, Math.min(1, v)); },
    setCoverageScale: (s) => { opt.coverageScale = Math.max(0.1, s); recomputePointRadiusForCoverage(); render(); },
    setAutoRadius: (v) => { opt.autoRadius = !!v; recomputePointRadiusForCoverage(); render(); },

    // Dither controls
    setBWPreview: (v) => { opt.bwPreview = !!v; render(); },
    setBWDither: (mode) => { opt.bwDither = String(mode||'none'); rebuildPixelatedPreview(); render(); },
    setBWThreshold: (t) => { opt.bwThreshold = +t; rebuildPixelatedPreview(); render(); },
    setBWDitherStrength: (s) => { opt.bwDitherStrength = Math.max(0, Math.min(1, s)); rebuildPixelatedPreview(); render(); },

    // Freeze / resume
    resumeFromHere,

    // Convergence access + hook
    getConvergence: () => ({
      percent: lastConvPercent,
      normStep: lastNormStep,
      threshold: opt.convergenceEps,
      done: isConverged
    }),
    onConverged: (fn) => { stipplerApi.onConverged = (typeof fn === 'function') ? fn : null; },
  };
}

export { initVoronoiStippling };
export default initVoronoiStippling;