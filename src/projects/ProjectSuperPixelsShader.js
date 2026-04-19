// ProjectSuperPixelsShader.js
// Native-resolution SLIC-style segmentation with vector region rendering and SVG export

export function initSuperpixelSegmentation(canvas, options = {}) {
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("2D canvas not supported");

  let width = (canvas.width = canvas.clientWidth || 1);
  let height = (canvas.height = canvas.clientHeight || 1);

  const onUpdate =
    typeof options.onUpdate === "function" ? options.onUpdate : null;

  let superpixelCount = clampInt(options.superpixelCount ?? 120, 10, 1000);
  let source = null;
  let isVideo = false;
  let running = true;
  let rafId = null;
  let lastProcessTime = 0;
  let processing = false;

  let userPalette = [];
  let useUserPalette = false;

  let fitted = {
    dx: 0,
    dy: 0,
    dw: width,
    dh: height,
    sw: width,
    sh: height,
  };

  const analysisCanvas = document.createElement("canvas");
  const analysisCtx = analysisCanvas.getContext("2d", {
    willReadFrequently: true,
  });

  let segmentation = null;

  function resize() {
    width = canvas.width = canvas.clientWidth || 1;
    height = canvas.height = canvas.clientHeight || 1;
    redraw();
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
  }

  function setSuperpixelCount(n) {
    superpixelCount = clampInt(n, 10, 1000);
    processCurrentFrame(true);
  }

  function setUserPalette(hexes) {
    userPalette = (hexes || []).map(normaliseHex).filter(Boolean);
    rebuildMappedColours();
    redraw();
    notify();
  }

  function setUseUserPalette(v) {
    useUserPalette = !!v;
    redraw();
    notify();
  }

  function useImage(img) {
    source = img;
    isVideo = false;
    processCurrentFrame(true);
  }

  function useVideo(videoEl) {
    source = videoEl;
    isVideo = true;
    processCurrentFrame(true);
  }

  function redraw() {
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    if (!segmentation || !segmentation.labels || !segmentation.regions) {
      if (source) drawSourceOnly();
      ctx.restore();
      return;
    }

    drawVectorSegmentation();
    ctx.restore();
  }

  function drawSourceOnly() {
    const dims = getSourceDims();
    if (!dims) return;
    fitted = fitRect(dims.sw, dims.sh, width, height);
    ctx.drawImage(source, fitted.dx, fitted.dy, fitted.dw, fitted.dh);
  }

  function drawVectorSegmentation() {
    const { aw, ah, regions } = segmentation;
    const dims = getSourceDims();
    if (!dims) return;

    fitted = fitRect(dims.sw, dims.sh, width, height);

    const sx = fitted.dw / aw;
    const sy = fitted.dh / ah;

    ctx.save();
    ctx.translate(fitted.dx, fitted.dy);
    ctx.scale(sx, sy);

    for (const region of regions) {
      const fillHex = useUserPalette ? region.mappedHex : region.avgHex;
      ctx.fillStyle = fillHex;
      fillRegionPaths(ctx, region.paths);
    }

    ctx.strokeStyle = "rgba(0,0,0,0.28)";
    ctx.lineWidth = Math.max(0.35, 1 / Math.max(sx, sy));
    for (const region of regions) {
      strokeRegionPaths(ctx, region.paths);
    }

    ctx.restore();
  }

  function fillRegionPaths(targetCtx, paths) {
    if (!paths || !paths.length) return;
    targetCtx.beginPath();
    for (const path of paths) {
      if (!path || path.length < 2) continue;
      targetCtx.moveTo(path[0][0], path[0][1]);
      for (let i = 1; i < path.length; i++) {
        targetCtx.lineTo(path[i][0], path[i][1]);
      }
      targetCtx.closePath();
    }
    targetCtx.fill("evenodd");
  }

  function strokeRegionPaths(targetCtx, paths) {
    if (!paths || !paths.length) return;
    targetCtx.beginPath();
    for (const path of paths) {
      if (!path || path.length < 2) continue;
      targetCtx.moveTo(path[0][0], path[0][1]);
      for (let i = 1; i < path.length; i++) {
        targetCtx.lineTo(path[i][0], path[i][1]);
      }
      targetCtx.closePath();
    }
    targetCtx.stroke();
  }

  function getSourceDims() {
    if (!source) return null;
    const sw = source.videoWidth || source.naturalWidth || source.width;
    const sh = source.videoHeight || source.naturalHeight || source.height;
    if (!sw || !sh) return null;
    return { sw, sh };
  }

  function processCurrentFrame(force = false) {
    if (!source || processing) return;

    const now = performance.now();
    if (!force && now - lastProcessTime < 150) return;

    const dims = getSourceDims();
    if (!dims) return;

    processing = true;
    lastProcessTime = now;

    try {
      // Use the uploaded/native frame size exactly.
      const aw = Math.max(1, Math.round(dims.sw));
      const ah = Math.max(1, Math.round(dims.sh));

      analysisCanvas.width = aw;
      analysisCanvas.height = ah;
      analysisCtx.clearRect(0, 0, aw, ah);
      analysisCtx.drawImage(source, 0, 0, aw, ah);

      const img = analysisCtx.getImageData(0, 0, aw, ah);
      segmentation = computeSuperpixels(img, aw, ah, superpixelCount);

      buildRegionVectorPaths(segmentation);

      rebuildMappedColours();
      redraw();
      notify();
    } finally {
      processing = false;
    }
  }

  function rgbSaturation(r, g, b) {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    if (max === 0) return 0;
    return (max - min) / max;
  }

  function rgbToHsl(r, g, b) {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;

    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const l = (max + min) * 0.5;

    if (max === min) {
      return { h: 0, s: 0, l };
    }

    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    let h = 0;
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
        break;
    }

    h /= 6;
    return { h: h * 360, s, l };
  }

  function hueDistanceDeg(a, b) {
    const d = Math.abs(a - b) % 360;
    return d > 180 ? 360 - d : d;
  }

  function labChroma(lab) {
    return Math.sqrt(lab[1] * lab[1] + lab[2] * lab[2]);
  }

  function isNearBlack(r, g, b) {
    return r < 20 && g < 20 && b < 20;
  }

  function isNearWhite(r, g, b) {
    return r > 235 && g > 235 && b > 235;
  }

  function isNearNeutralRgb(r, g, b) {
    const sat = rgbSaturation(r, g, b);
    return sat < 0.08;
  }

  function rebuildMappedColours() {
    if (!segmentation || !segmentation.regions) return;

    const paletteRgb = userPalette.map(hexToRgb);
    const paletteMeta = paletteRgb.map((rgb, index) => {
      const [r, g, b] = rgb;
      const lab = rgbToLab(r, g, b);
      const hsl = rgbToHsl(r, g, b);

      return {
        index,
        rgb,
        lab,
        hsl,
        sat: rgbSaturation(r, g, b),
        chroma: labChroma(lab),
        isBlack: isNearBlack(r, g, b),
        isWhite: isNearWhite(r, g, b),
        isNeutral: isNearNeutralRgb(r, g, b),
      };
    });

    for (const region of segmentation.regions) {
      region.avgHex = rgbToHex(region.avgRgb);

      if (!paletteMeta.length) {
        region.mappedRgb = region.avgRgb.slice();
        region.mappedHex = region.avgHex;
        region.numberLabel = String(region.id + 1);
        continue;
      }

      const [rr, rg, rb] = region.avgRgb;
      const regionLab = region.avgLab;
      const regionHsl = rgbToHsl(rr, rg, rb);
      const regionSat = rgbSaturation(rr, rg, rb);
      const regionChroma = labChroma(regionLab);
      const regionIsNeutral = regionSat < 0.10 || regionChroma < 12;

      let bestIdx = 0;
      let bestScore = Infinity;

      for (let i = 0; i < paletteMeta.length; i++) {
        const p = paletteMeta[i];

        let score = labDistanceSq(regionLab, p.lab);

        // Strongly discourage neutrals for colourful regions
        if (!regionIsNeutral && p.isNeutral) {
          score += 1200;
        }

        // Strongly discourage black/white for colourful regions
        if (!regionIsNeutral && (p.isBlack || p.isWhite)) {
          score += 1600;
        }

        // Prefer colours with similar hue when both region and palette are colourful
        if (!regionIsNeutral && !p.isNeutral && regionHsl.s > 0.12 && p.hsl.s > 0.12) {
          const hDist = hueDistanceDeg(regionHsl.h, p.hsl.h);
          score += hDist * 6.0;
        }

        // Penalise huge saturation mismatch
        if (!regionIsNeutral) {
          const satMismatch = Math.abs(regionHsl.s - p.hsl.s);
          score += satMismatch * 500;
        }

        // Penalise chroma mismatch, so vivid colours don't collapse into dull ones
        if (!regionIsNeutral) {
          const chromaMismatch = Math.abs(regionChroma - p.chroma);
          score += chromaMismatch * 8.0;
        }

        // If the region is neutral, do the opposite: prefer neutral palette colours
        if (regionIsNeutral && !p.isNeutral) {
          score += 500;
        }

        if (score < bestScore) {
          bestScore = score;
          bestIdx = i;
        }
      }

      const chosen = paletteMeta[bestIdx];
      region.mappedRgb = chosen.rgb.slice();
      region.mappedHex = rgbToHex(chosen.rgb);
      region.numberLabel = String(chosen.index + 1);
    }
  }

  function getSuggestedPaletteColour() {
    if (!segmentation || !segmentation.regions || !segmentation.regions.length) {
      return null;
    }

    const existingPalette = userPalette.map(hexToRgb);
    const existingPaletteLab = existingPalette.map(([r, g, b]) => rgbToLab(r, g, b));
    const existingHexSet = new Set(userPalette.map((h) => normaliseHex(h)));

    if (!existingPalette.length) {
      let biggest = segmentation.regions[0];
      for (const region of segmentation.regions) {
        if (region.pixels > biggest.pixels) biggest = region;
      }
      return biggest.avgHex;
    }

    const buckets = new Map();

    for (const region of segmentation.regions) {
      let best = Infinity;

      for (let i = 0; i < existingPaletteLab.length; i++) {
        const d = labDistanceSq(region.avgLab, existingPaletteLab[i]);
        if (d < best) best = d;
      }

      if (best < 80) continue;

      const exactHex = normaliseHex(rgbToHex(region.avgRgb));
      if (existingHexSet.has(exactHex)) continue;

      const bucketHex = normaliseHex(
        rgbToHex(
          region.avgRgb.map((v) => {
            const q = Math.round(v / 16) * 16;
            return Math.max(0, Math.min(255, q));
          })
        )
      );

      if (existingHexSet.has(bucketHex)) continue;

      if (!buckets.has(bucketHex)) {
        buckets.set(bucketHex, {
          hex: bucketHex,
          score: 0,
          pixels: 0,
          sumR: 0,
          sumG: 0,
          sumB: 0,
        });
      }

      const bucket = buckets.get(bucketHex);
      bucket.score += best * region.pixels;
      bucket.pixels += region.pixels;
      bucket.sumR += region.avgRgb[0] * region.pixels;
      bucket.sumG += region.avgRgb[1] * region.pixels;
      bucket.sumB += region.avgRgb[2] * region.pixels;
    }

    if (!buckets.size) return null;

    const ranked = [...buckets.values()].sort((a, b) => b.score - a.score);
    const bestBucket = ranked[0];

    return rgbToHex([
      Math.round(bestBucket.sumR / bestBucket.pixels),
      Math.round(bestBucket.sumG / bestBucket.pixels),
      Math.round(bestBucket.sumB / bestBucket.pixels),
    ]);
  }

  function notify() {
    if (!onUpdate || !segmentation) return;
    onUpdate({
      regionCount: segmentation.regions.length,
      regionHexes: segmentation.regions.map((r) => r.avgHex),
      mappedHexes: segmentation.regions.map((r) => r.mappedHex),
    });
  }

  function animate() {
    if (!running) return;
    if (isVideo && source) processCurrentFrame(false);
    rafId = requestAnimationFrame(animate);
  }

  function downloadColorByNumbersSvg({ useUserPalette: preferMapped = false } = {}) {
    if (!segmentation) return;

    const { aw, ah, regions } = segmentation;

    // ✅ ADD THIS BACK
    const getRegionHex = (region) =>
      preferMapped ? region.mappedHex : region.avgHex;

    // 1. Collect unique colours
    const uniqueColours = Array.from(
      new Set(regions.map((r) => getRegionHex(r)))
    );

    // 2. Sort from #000000 → #FFFFFF
    uniqueColours.sort((a, b) => {
      const na = parseInt(a.slice(1), 16);
      const nb = parseInt(b.slice(1), 16);
      return na - nb;
    });

    // 3. Build mapping
    const colourToNumber = new Map();
    const legendEntries = [];

    uniqueColours.forEach((hex, i) => {
      const number = i + 1;
      colourToNumber.set(hex, number);
      legendEntries.push({ number, hex });
    });

    const pathParts = [];
    const textParts = [];

    for (const region of regions) {
      const regionPathD = regionPathsToSvgD(region.paths);
      pathParts.push(
        `<path d="${regionPathD}" fill="white" stroke="#000" stroke-width="0.6"/>`
      );

      const labelNumber = colourToNumber.get(getRegionHex(region));
      const tx = round2(region.cx);
      const ty = round2(region.cy);
      const fontSize = Math.max(
        8,
        0.045 * Math.sqrt((aw * ah) / Math.max(regions.length, 1))
      );

      textParts.push(
        `<text x="${tx}" y="${ty}" font-size="${fontSize}" text-anchor="middle" dominant-baseline="middle">${escapeXml(
          String(labelNumber)
        )}</text>`
      );
    }

    const legendSvg = legendEntries
      .map(({ number, hex }, i) => {
        const y = 20 + i * 22;
        return `
          <rect x="${aw + 20}" y="${y - 11}" width="14" height="14" fill="${hex}" stroke="#000" stroke-width="0.5"/>
          <text x="${aw + 42}" y="${y}" font-size="12" dominant-baseline="middle">${escapeXml(
            String(number)
          )} = ${escapeXml(hex)}</text>
        `;
      })
      .join("");

    const svgWidth = aw + 260;
    const svgHeight = Math.max(ah, 40 + legendEntries.length * 22);

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
  <rect width="100%" height="100%" fill="white"/>
  <g transform="translate(0,0)">
    ${pathParts.join("\n")}
    <g fill="#000" font-family="Arial, Helvetica, sans-serif">
      ${textParts.join("\n")}
    </g>
  </g>
  <g font-family="Arial, Helvetica, sans-serif" fill="#000">
    ${legendSvg}
  </g>
</svg>`.trim();

    const blob = new Blob([svg], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = preferMapped
      ? "colour-by-numbers-user-palette.svg"
      : "colour-by-numbers-generated-palette.svg";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  animate();

  return {
    useImage,
    useVideo,
    resize,
    stop,
    setSuperpixelCount,
    setUserPalette,
    setUseUserPalette,
    downloadColorByNumbersSvg,
    getSuggestedPaletteColour,
  };
}

function computeSuperpixels(imageData, w, h, targetCount) {
  const data = imageData.data;
  const N = w * h;

  const lab = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const j = i * 4;
    const [L, a, b] = rgbToLab(data[j], data[j + 1], data[j + 2]);
    const k = i * 3;
    lab[k + 0] = L;
    lab[k + 1] = a;
    lab[k + 2] = b;
  }

  const step = Math.max(4, Math.sqrt(N / Math.max(1, targetCount)));
  const compactness = 12;
  const centers = [];

  const xStart = step / 2;
  const yStart = step / 2;

  for (let y = yStart; y < h; y += step) {
    for (let x = xStart; x < w; x += step) {
      const ix = Math.min(w - 1, Math.max(0, Math.round(x)));
      const iy = Math.min(h - 1, Math.max(0, Math.round(y)));
      const idx = iy * w + ix;
      const k = idx * 3;
      centers.push({
        x: ix,
        y: iy,
        L: lab[k + 0],
        a: lab[k + 1],
        b: lab[k + 2],
      });
    }
  }

  const labels = new Int32Array(N);
  labels.fill(-1);
  const dist = new Float32Array(N);
  dist.fill(Infinity);

  const S = step;
  const invS2 = 1 / (S * S);
  const invM2 = 1 / (compactness * compactness);

  for (let iter = 0; iter < 6; iter++) {
    dist.fill(Infinity);

    for (let ci = 0; ci < centers.length; ci++) {
      const c = centers[ci];
      const xmin = Math.max(0, Math.floor(c.x - 2 * S));
      const xmax = Math.min(w - 1, Math.ceil(c.x + 2 * S));
      const ymin = Math.max(0, Math.floor(c.y - 2 * S));
      const ymax = Math.min(h - 1, Math.ceil(c.y + 2 * S));

      for (let y = ymin; y <= ymax; y++) {
        for (let x = xmin; x <= xmax; x++) {
          const idx = y * w + x;
          const k = idx * 3;
          const dL = lab[k + 0] - c.L;
          const da = lab[k + 1] - c.a;
          const db = lab[k + 2] - c.b;
          const dc = (dL * dL + da * da + db * db) * invM2;
          const dx = x - c.x;
          const dy = y - c.y;
          const ds = (dx * dx + dy * dy) * invS2;
          const D = dc + ds;

          if (D < dist[idx]) {
            dist[idx] = D;
            labels[idx] = ci;
          }
        }
      }
    }

    const sums = new Array(centers.length).fill(0).map(() => ({
      x: 0,
      y: 0,
      L: 0,
      a: 0,
      b: 0,
      n: 0,
    }));

    for (let i = 0; i < N; i++) {
      const ci = labels[i];
      if (ci < 0) continue;
      const x = i % w;
      const y = (i / w) | 0;
      const k = i * 3;
      const s = sums[ci];
      s.x += x;
      s.y += y;
      s.L += lab[k + 0];
      s.a += lab[k + 1];
      s.b += lab[k + 2];
      s.n++;
    }

    for (let ci = 0; ci < centers.length; ci++) {
      const s = sums[ci];
      if (s.n > 0) {
        centers[ci].x = s.x / s.n;
        centers[ci].y = s.y / s.n;
        centers[ci].L = s.L / s.n;
        centers[ci].a = s.a / s.n;
        centers[ci].b = s.b / s.n;
      }
    }
  }

  const connected = enforceConnectivity(labels, w, h);

  const regionMap = new Map();
  for (let i = 0; i < N; i++) {
    const rid = connected[i];
    let region = regionMap.get(rid);
    if (!region) {
      region = {
        id: regionMap.size,
        oldId: rid,
        pixels: 0,
        sumR: 0,
        sumG: 0,
        sumB: 0,
        sumX: 0,
        sumY: 0,
        avgRgb: [0, 0, 0],
        avgLab: [0, 0, 0],
        avgHex: "#000000",
        mappedRgb: [0, 0, 0],
        mappedHex: "#000000",
        cx: 0,
        cy: 0,
        paths: [],
      };
      regionMap.set(rid, region);
    }

    const px = i % w;
    const py = (i / w) | 0;
    const j = i * 4;

    region.pixels++;
    region.sumR += data[j + 0];
    region.sumG += data[j + 1];
    region.sumB += data[j + 2];
    region.sumX += px;
    region.sumY += py;
  }

  const oldToNew = new Map();
  const regions = [...regionMap.values()];
  regions.forEach((region, idx) => {
    oldToNew.set(region.oldId, idx);
    region.id = idx;
    region.avgRgb = [
      Math.round(region.sumR / region.pixels),
      Math.round(region.sumG / region.pixels),
      Math.round(region.sumB / region.pixels),
    ];
    region.avgLab = rgbToLab(
      region.avgRgb[0],
      region.avgRgb[1],
      region.avgRgb[2]
    );
    region.avgHex = rgbToHex(region.avgRgb);
    region.mappedRgb = region.avgRgb.slice();
    region.mappedHex = region.avgHex;
    region.cx = region.sumX / region.pixels;
    region.cy = region.sumY / region.pixels;
  });

  const finalLabels = new Int32Array(N);
  for (let i = 0; i < N; i++) {
    finalLabels[i] = oldToNew.get(connected[i]);
  }

  return {
    aw: w,
    ah: h,
    labels: finalLabels,
    regions,
  };
}

function buildRegionVectorPaths(segmentation) {
  const { aw, ah, labels, regions } = segmentation;
  const regionEdges = new Array(regions.length)
    .fill(0)
    .map(() => new Map());

  function addEdge(regionId, x1, y1, x2, y2) {
    const key = `${x1},${y1}->${x2},${y2}`;
    regionEdges[regionId].set(key, [x1, y1, x2, y2]);
  }

  for (let y = 0; y < ah; y++) {
    for (let x = 0; x < aw; x++) {
      const idx = y * aw + x;
      const r = labels[idx];

      if (y === 0 || labels[idx - aw] !== r) {
        addEdge(r, x, y, x + 1, y);
      }
      if (x === aw - 1 || labels[idx + 1] !== r) {
        addEdge(r, x + 1, y, x + 1, y + 1);
      }
      if (y === ah - 1 || labels[idx + aw] !== r) {
        addEdge(r, x + 1, y + 1, x, y + 1);
      }
      if (x === 0 || labels[idx - 1] !== r) {
        addEdge(r, x, y + 1, x, y);
      }
    }
  }

  for (let r = 0; r < regions.length; r++) {
    const edges = [...regionEdges[r].values()];
    regions[r].paths = edgesToPaths(edges);
  }
}

function edgesToPaths(edges) {
  if (!edges.length) return [];

  const outgoing = new Map();
  for (const e of edges) {
    const startKey = `${e[0]},${e[1]}`;
    if (!outgoing.has(startKey)) outgoing.set(startKey, []);
    outgoing.get(startKey).push(e);
  }

  const used = new Set();
  const paths = [];

  for (let i = 0; i < edges.length; i++) {
    if (used.has(i)) continue;

    const seed = edges[i];
    const path = [[seed[0], seed[1]], [seed[2], seed[3]]];
    used.add(i);

    let cx = seed[2];
    let cy = seed[3];

    while (!(cx === seed[0] && cy === seed[1])) {
      const key = `${cx},${cy}`;
      const candidates = outgoing.get(key) || [];
      let foundEdgeIndex = -1;
      let foundEdge = null;

      for (const candidate of candidates) {
        const idx = edges.indexOf(candidate);
        if (idx >= 0 && !used.has(idx)) {
          foundEdgeIndex = idx;
          foundEdge = candidate;
          break;
        }
      }

      if (!foundEdge) break;

      used.add(foundEdgeIndex);
      path.push([foundEdge[2], foundEdge[3]]);
      cx = foundEdge[2];
      cy = foundEdge[3];
    }

    const simplified = simplifyOrthogonalPath(path);
    if (simplified.length >= 3) {
      paths.push(simplified);
    }
  }

  return paths;
}

function simplifyOrthogonalPath(path) {
  if (path.length <= 2) return path.slice();

  const out = [path[0]];
  for (let i = 1; i < path.length - 1; i++) {
    const a = out[out.length - 1];
    const b = path[i];
    const c = path[i + 1];

    const abx = b[0] - a[0];
    const aby = b[1] - a[1];
    const bcx = c[0] - b[0];
    const bcy = c[1] - b[1];

    const collinear =
      (abx === 0 && bcx === 0) || (aby === 0 && bcy === 0);

    if (!collinear) {
      out.push(b);
    }
  }

  out.push(path[path.length - 1]);

  if (
    out.length > 2 &&
    out[0][0] === out[out.length - 1][0] &&
    out[0][1] === out[out.length - 1][1]
  ) {
    const first = out[0];
    const prev = out[out.length - 2];
    const next = out[1];
    const prevDx = first[0] - prev[0];
    const prevDy = first[1] - prev[1];
    const nextDx = next[0] - first[0];
    const nextDy = next[1] - first[1];
    const redundant =
      (prevDx === 0 && nextDx === 0) || (prevDy === 0 && nextDy === 0);
    if (redundant) {
      out.shift();
    }
  }

  return out;
}

function regionPathsToSvgD(paths) {
  return paths
    .map((path) => {
      if (!path.length) return "";
      let d = `M ${round2(path[0][0])} ${round2(path[0][1])}`;
      for (let i = 1; i < path.length; i++) {
        d += ` L ${round2(path[i][0])} ${round2(path[i][1])}`;
      }
      d += " Z";
      return d;
    })
    .join(" ");
}

function enforceConnectivity(labels, w, h) {
  const N = w * h;
  const visited = new Uint8Array(N);
  const out = new Int32Array(N);
  out.fill(-1);

  const dx = [1, -1, 0, 0];
  const dy = [0, 0, 1, -1];
  const minSize = Math.max(8, Math.floor(N / 2000));
  let newLabel = 0;

  for (let i = 0; i < N; i++) {
    if (visited[i]) continue;

    const oldLabel = labels[i];
    const queue = [i];
    const component = [];
    visited[i] = 1;

    while (queue.length) {
      const p = queue.pop();
      component.push(p);
      const x = p % w;
      const y = (p / w) | 0;

      for (let k = 0; k < 4; k++) {
        const nx = x + dx[k];
        const ny = y + dy[k];
        if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
        const ni = ny * w + nx;
        if (visited[ni] || labels[ni] !== oldLabel) continue;
        visited[ni] = 1;
        queue.push(ni);
      }
    }

    if (component.length < minSize) {
      let bestNeighbor = -1;
      for (const p of component) {
        const x = p % w;
        const y = (p / w) | 0;
        for (let k = 0; k < 4; k++) {
          const nx = x + dx[k];
          const ny = y + dy[k];
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
          const ni = ny * w + nx;
          if (labels[ni] !== oldLabel && out[ni] >= 0) {
            bestNeighbor = out[ni];
            break;
          }
        }
        if (bestNeighbor >= 0) break;
      }

      if (bestNeighbor >= 0) {
        for (const p of component) out[p] = bestNeighbor;
        continue;
      }
    }

    for (const p of component) out[p] = newLabel;
    newLabel++;
  }

  return out;
}

function fitRect(sw, sh, dw, dh) {
  const scale = Math.min(dw / sw, dh / sh);
  const rw = sw * scale;
  const rh = sh * scale;
  return {
    dx: (dw - rw) * 0.5,
    dy: (dh - rh) * 0.5,
    dw: rw,
    dh: rh,
    sw,
    sh,
  };
}

function clampInt(v, lo, hi) {
  v = Math.round(v);
  if (v < lo) v = lo;
  if (v > hi) v = hi;
  return v;
}

function normaliseHex(value) {
  let v = String(value || "").trim();
  if (!v) return "";
  if (!v.startsWith("#")) v = `#${v}`;
  if (/^#[0-9a-fA-F]{3}$/.test(v)) {
    v =
      "#" +
      v[1] + v[1] +
      v[2] + v[2] +
      v[3] + v[3];
  }
  return /^#[0-9a-fA-F]{6}$/.test(v) ? v.toUpperCase() : "";
}

function hexToRgb(hex) {
  const h = normaliseHex(hex);
  return [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
}

function rgbToHex(rgb) {
  return (
    "#" +
    rgb
      .map((v) =>
        Math.max(0, Math.min(255, Math.round(v)))
          .toString(16)
          .padStart(2, "0")
      )
      .join("")
  ).toUpperCase();
}

function srgbToLinear(v) {
  v /= 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function rgbToLab(r, g, b) {
  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);

  let x = R * 0.4124564 + G * 0.3575761 + B * 0.1804375;
  let y = R * 0.2126729 + G * 0.7151522 + B * 0.072175;
  let z = R * 0.0193339 + G * 0.119192 + B * 0.9503041;

  x /= 0.95047;
  z /= 1.08883;

  const fx = xyzF(x);
  const fy = xyzF(y);
  const fz = xyzF(z);

  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

function xyzF(t) {
  return t > 0.008856 ? Math.cbrt(t) : 7.787037 * t + 16 / 116;
}

function labDistanceSq(a, b) {
  const d0 = a[0] - b[0];
  const d1 = a[1] - b[1];
  const d2 = a[2] - b[2];
  return d0 * d0 + d1 * d1 + d2 * d2;
}

function round2(v) {
  return Math.round(v * 100) / 100;
}

function escapeXml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}