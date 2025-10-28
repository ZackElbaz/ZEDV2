// // ProjectBoidsShader.js
// export function initBoidSimulation(canvas, paramsRef, reportCounts) {
//   const ctx = canvas.getContext("2d");
//   const width = (canvas.width = canvas.clientWidth);
//   const height = (canvas.height = canvas.clientHeight);

//   const NUM_BOIDS = 200;
//   const pausedRef = { current: false };
//   const isRunningRef = { current: false };
//   let animationId = null;
//   let boids = [];

//   function createBoids() {
//     const types = paramsRef.current.types;
//     boids = [];
//     for (let i = 0; i < NUM_BOIDS; i++) {
//       const angle = Math.random() * 2 * Math.PI;
//       boids.push({
//         x: Math.random() * width,
//         y: Math.random() * height,
//         vx: Math.cos(angle),
//         vy: Math.sin(angle),
//         ax: 0,
//         ay: 0,
//         type: i % types,
//       });
//     }
//   }

//   createBoids();

//   function typeBeats(a, b, n) {
//     return ((a - b + n) % n) > n / 2;
//   }

//   function updateBoids() {
//     const {
//       boidSpeed,
//       sameSpeciesFlocking,
//       preyAttract,
//       predatorFear,
//       types,
//     } = paramsRef.current;

//     for (let boid of boids) {
//       let align = { x: 0, y: 0 }, cohesion = { x: 0, y: 0 }, separate = { x: 0, y: 0 };
//       let flee = { x: 0, y: 0 }, chase = { x: 0, y: 0 };
//       let countAlign = 0;

//       for (let other of boids) {
//         if (other === boid) continue;

//         const dx = other.x - boid.x;
//         const dy = other.y - boid.y;
//         const dist = Math.hypot(dx, dy);

//         if (other.type === boid.type && dist < 80) {
//           align.x += other.vx;
//           align.y += other.vy;
//           cohesion.x += other.x;
//           cohesion.y += other.y;
//           separate.x += boid.x - other.x;
//           separate.y += boid.y - other.y;
//           countAlign++;
//         }

//         if (dist < 10 && typeBeats(boid.type, other.type, types)) {
//           other.type = boid.type;
//         }

//         if (dist < 90) {
//           if (typeBeats(other.type, boid.type, types)) {
//             flee.x += boid.x - other.x;
//             flee.y += boid.y - other.y;
//           } else if (typeBeats(boid.type, other.type, types)) {
//             chase.x += other.x - boid.x;
//             chase.y += other.y - boid.y;
//           }
//         }
//       }

//       if (countAlign > 0) {
//         align.x /= countAlign;
//         align.y /= countAlign;
//         cohesion.x /= countAlign;
//         cohesion.y /= countAlign;
//         separate.x /= countAlign;
//         separate.y /= countAlign;

//         boid.ax += align.x * 0.1 * sameSpeciesFlocking;
//         boid.ay += align.y * 0.1 * sameSpeciesFlocking;
//         boid.ax += (cohesion.x - boid.x) * 0.005 * sameSpeciesFlocking;
//         boid.ay += (cohesion.y - boid.y) * 0.005 * sameSpeciesFlocking;

//         if (sameSpeciesFlocking < 0) {
//           boid.ax += separate.x * 0.2 * -sameSpeciesFlocking;
//           boid.ay += separate.y * 0.2 * -sameSpeciesFlocking;
//         }
//       }

//       boid.ax += flee.x * predatorFear * 0.001;
//       boid.ay += flee.y * predatorFear * 0.001;
//       boid.ax += chase.x * preyAttract * 0.001;
//       boid.ay += chase.y * preyAttract * 0.001;

//       boid.vx += boid.ax;
//       boid.vy += boid.ay;

//       const mag = Math.hypot(boid.vx, boid.vy);
//       boid.vx = (boid.vx / (mag || 1)) * boidSpeed;
//       boid.vy = (boid.vy / (mag || 1)) * boidSpeed;

//       boid.x += boid.vx;
//       boid.y += boid.vy;

//       if (boid.x < 0) boid.x += width;
//       if (boid.y < 0) boid.y += height;
//       if (boid.x > width) boid.x -= width;
//       if (boid.y > height) boid.y -= height;

//       boid.ax = 0;
//       boid.ay = 0;
//     }
//   }

//   function renderBoids() {
//     ctx.clearRect(0, 0, width, height);
//     for (let boid of boids) {
//       const angle = Math.atan2(boid.vy, boid.vx);
//       ctx.save();
//       ctx.translate(boid.x, boid.y);
//       ctx.rotate(angle);
//       ctx.beginPath();
//       ctx.moveTo(6, 0);
//       ctx.lineTo(-5, 3);
//       ctx.lineTo(-5, -3);
//       ctx.closePath();
//       ctx.fillStyle = `hsl(${(boid.type * 360) / paramsRef.current.types}, 100%, 40%)`;
//       ctx.fill();
//       ctx.restore();
//     }
//   }

//   function animate() {
//     if (!isRunningRef.current) return;
//     if (!pausedRef.current) {
//       updateBoids();
//       renderBoids();
//       if (reportCounts) {
//         const liveCounts = new Array(paramsRef.current.types).fill(0);
//         for (let boid of boids) {
//           liveCounts[boid.type]++;
//         }
//         reportCounts([...liveCounts]);
//       }
//     }
//     animationId = requestAnimationFrame(animate);
//   }

//   isRunningRef.current = true;
//   animate();

//   return {
//     pause: () => (pausedRef.current = true),
//     resume: () => (pausedRef.current = false),
//     reset: () => {
//       createBoids();
//       if (pausedRef.current) renderBoids();
//       if (reportCounts) {
//         const freshCounts = new Array(paramsRef.current.types).fill(0);
//         for (let boid of boids) {
//           freshCounts[boid.type]++;
//         }
//         reportCounts([...freshCounts]);
//       }
//     },
//     stop: () => {
//       isRunningRef.current = false;
//       if (animationId) cancelAnimationFrame(animationId);
//     },
//   };
// }



// ProjectBoidsShader.js
// -----------------------------------------------------------------------------
// Bird-like boids with anti-jitter turning
// - Speed-adaptive turning radius (same arc feel at different speeds)
// - NEW: yaw inertia + hysteresis + deadband to prevent flip/flop
// - Smooth, momentum-preserving flight with non-hover speed floor
// - Smart pursuit (lead) + rear awareness; anticipatory avoidance as steering
// API: initBoidSimulation(canvas, config, params, onCounts)
// -----------------------------------------------------------------------------

export function initBoidSimulation(canvas, config, params, onCounts) {
  const ctx = canvas.getContext("2d", { alpha: true });
  let width = (canvas.width = canvas.clientWidth);
  let height = (canvas.height = canvas.clientHeight);

  // ---------------- Tunables (calmer, swoopy defaults) -----------------------
  const NUM = config.numBoids ?? 220;
  const R = config.boidRadius ?? 6;

  const MAX_SPEED = config.maxSpeed ?? 1.9;
  const MIN_SPEED = config.minSpeed ?? 0.7;
  const FLIGHT_MIN = config.flightMin ?? Math.max(MIN_SPEED, 1.05);

  // Adaptive turn baseline (keeps radius consistent across speeds)
  const BASE_TURN = config.baseTurn ?? 0.055;        // radians/frame at TURN_REF_SPEED
  const TURN_REF_SPEED = config.turnRefSpeed ?? 2.2; // speed where BASE_TURN was tuned

  // Anti-jitter yaw dynamics (all radians-based)
  const TURN_GAIN = config.turnGain ?? 0.9;          // maps angle error -> desired yaw rate
  const MAX_YAW_RATE = config.maxYawRate ?? 0.055;   // hard cap on yaw rate per frame
  const MAX_YAW_ACC  = config.maxYawAcc  ?? 0.020;   // cap on how fast yaw rate can change
  const YAW_FRICTION = config.yawFriction ?? 0.08;   // 0..1, damps yaw over time
  const TURN_DEADBAND = config.turnDeadband ?? 0.010; // ignore tiny angle chatter
  const TURN_HYSTERESIS = config.turnHysteresis ?? 0.45; // 0..1 reduction when flipping turn sign

  // Desire smoothing & wander (reduced to remove buzz)
  const DESIRE_SMOOTH = config.desireSmooth ?? 0.42; // higher = smoother intent
  const WANDER_STRENGTH = config.wanderStrength ?? 0.040;
  const WANDER_FREQ = 0.007;

  // Light global drag (numerical damping)
  const DRAG = config.drag ?? 0.002;

  // Asymmetric speed change caps (per frame)
  const MAX_DV_UP   = config.maxDvUp   ?? 0.006;  // slower accel
  const MAX_DV_DOWN = config.maxDvDown ?? 0.025;  // gentle decel

  const MAX_FORCE = config.maxForce ?? 0.06;      // safety cap for diffs
  const CONVERT_R = config.conversionRadius ?? 10;

  // Flocking weights (scaled by UI params)
  const ALIGN_W = 0.9, COHESION_W = 0.55, SEPARATION_W = 1.15;
  const FLEE_W = 1.1, CHASE_W = 1.0;

  // Anticipatory avoidance (steering, not braking)
  const LOOK_AHEAD = 22, LATERAL_GAIN = 0.16, RADIAL_GAIN = 0.015;

  // Awareness beyond FOV (prey/predator blind-spot handling)
  const PREY_ALERT_DIST = config.preyAlertDist ?? 140;
  const PRED_PERIPH_DIST = config.predPeripheralDist ?? 160;
  const PRED_PERIPH_WEIGHT = config.predPeripheralWeight ?? 0.45;

  const boids = [];

  // ---------------- Utility ---------------------------------------------------
  function randAngle() { return Math.random() * Math.PI * 2; }
  function wrap(x, a) { if (x < 0) return x + a; if (x >= a) return x - a; return x; }
  function shortestDelta(dx, size) { if (dx > size * 0.5) dx -= size; else if (dx < -size * 0.5) dx += size; return dx; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function publishCounts() { if (!onCounts) return; const n = params.types; const arr = Array.from({ length: n }, () => 0); for (const b of boids) arr[b.type]++; onCounts(arr); }

  function makeBoids(nTypes) {
    boids.length = 0;
    for (let i = 0; i < NUM; i++) {
      const ang = randAngle();
      const speed = FLIGHT_MIN + Math.random() * (MAX_SPEED - FLIGHT_MIN);
      const hx = Math.cos(ang), hy = Math.sin(ang);
      boids.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: hx * speed, vy: hy * speed,
        hx, hy,                 // heading unit vector
        dx: hx, dy: hy,         // filtered desired heading
        angVel: 0,              // NEW: yaw rate state (rad/frame)
        speedTarget: clamp(speed + (Math.random() * 0.5 - 0.25), FLIGHT_MIN, MAX_SPEED),
        phase: Math.random() * Math.PI * 2,
        type: i % nTypes,
        ax: 0, ay: 0,
      });
    }
    publishCounts();
  }

  function typeBeats(a, b, n) { return ((a - b + n) % n) > n / 2; }

  function fovAllows(observer, toX, toY) {
    const dx = shortestDelta(toX - observer.x, width);
    const dy = shortestDelta(toY - observer.y, height);
    const dist = Math.hypot(dx, dy);
    if (dist > params.viewDistance) return null;
    const vmag = Math.hypot(observer.vx, observer.vy) || 1;
    const ux = observer.vx / vmag, uy = observer.vy / vmag;
    const tx = dx / (dist || 1), ty = dy / (dist || 1);
    const cosAng = ux * tx + uy * ty;
    const limit = Math.cos((params.viewAngleDeg * Math.PI) / 180);
    if (cosAng < limit) return null;
    return { dx, dy, dist, tx, ty };
  }

  function omniSense(from, to, radius) {
    const dx = shortestDelta(to.x - from.x, width);
    const dy = shortestDelta(to.y - from.y, height);
    const dist = Math.hypot(dx, dy);
    if (dist > radius) return null;
    return { dx, dy, dist };
  }

  function rotateToward(ux, uy, angle) {
    // rotate (ux,uy) by angle, return normalized
    const c = Math.cos(angle), s = Math.sin(angle);
    const rx = ux * c - uy * s;
    const ry = ux * s + uy * c;
    const m = Math.hypot(rx, ry) || 1; return [rx / m, ry / m];
  }

  function signedAngle(ax, ay, bx, by) {
    // angle to rotate a->b, in (-pi, pi]
    const dot = clamp(ax * bx + ay * by, -1, 1);
    const cross = ax * by - ay * bx;
    return Math.atan2(cross, dot);
  }

  // Lead interception for predator pursuit (prevents wiggle)
  function leadDirection(b, o, maxT = 40) {
    let rx = shortestDelta(o.x - b.x, width);
    let ry = shortestDelta(o.y - b.y, height);
    const rvx = o.vx, rvy = o.vy;
    const s = Math.max(FLIGHT_MIN, Math.hypot(b.vx, b.vy));

    const vv = rvx*rvx + rvy*rvy; const ss = s*s;
    const a = vv - ss; const b2 = 2 * (rx*rvx + ry*rvy); const c = rx*rx + ry*ry;
    let t;
    if (Math.abs(a) < 1e-8) { t = c / Math.max(1e-6, -b2); if (!isFinite(t) || t < 0) t = Math.sqrt(c) / s; }
    else {
      const disc = b2*b2 - 4*a*c; if (disc > 0) {
        const sd = Math.sqrt(disc); const t1 = (-b2 + sd) / (2*a); const t2 = (-b2 - sd) / (2*a);
        const pos = [t1, t2].filter(tt => tt > 0); t = pos.length ? Math.min(...pos) : Math.sqrt(c) / s;
      } else t = Math.sqrt(c) / s;
    }
    t = clamp(t, 0, maxT);
    const px = rx + rvx * t; const py = ry + rvy * t; const m = Math.hypot(px, py) || 1;
    return { x: px / m, y: py / m, t };
  }

  // ---------------- Main update ---------------------------------------------
  function update() {
    const nTypes = params.types;

    for (let i = 0; i < boids.length; i++) {
      const b = boids[i];
      let alignX = 0, alignY = 0, alignC = 0;
      let cohX = 0, cohY = 0, cohC = 0;
      let sepX = 0, sepY = 0;
      let fleeX = 0, fleeY = 0, fleeC = 0;
      let chaseX = 0, chaseY = 0, chaseC = 0;

      let nearestPred = null, nearestPredD2 = Infinity;
      let nearestPrey = null, nearestPreyD2 = Infinity;

      for (let j = 0; j < boids.length; j++) {
        if (i === j) continue;
        const o = boids[j];

        const seen = fovAllows(b, o.x, o.y);
        if (seen && o.type === b.type) {
          const { dx, dy, dist } = seen;
          alignX += o.vx; alignY += o.vy; alignC++;
          cohX += b.x + dx; cohY += b.y + dy; cohC++;
          const inv = Math.max(8, dist - R);
          sepX += -(dx / (inv * inv));
          sepY += -(dy / (inv * inv));
        }

        const rdx = shortestDelta(o.x - b.x, width);
        const rdy = shortestDelta(o.y - b.y, height);
        const d2 = rdx*rdx + rdy*rdy;

        if (typeBeats(o.type, b.type, nTypes)) {
          if (d2 < nearestPredD2) { nearestPredD2 = d2; nearestPred = o; }
          const alert = omniSense(b, o, PREY_ALERT_DIST);
          if (alert) { const m = Math.hypot(alert.dx, alert.dy) || 1; fleeX += -(alert.dx / m); fleeY += -(alert.dy / m); fleeC++; }
          else if (seen) { const m = Math.hypot(seen.dx, seen.dy) || 1; fleeX += -(seen.dx / m); fleeY += -(seen.dy / m); fleeC++; }
        } else if (typeBeats(b.type, o.type, nTypes)) {
          if (d2 < nearestPreyD2) { nearestPreyD2 = d2; nearestPrey = o; }
          if (!seen) { const periph = omniSense(b, o, PRED_PERIPH_DIST); if (periph) { const m = Math.hypot(periph.dx, periph.dy) || 1; chaseX += (periph.dx / m) * PRED_PERIPH_WEIGHT; chaseY += (periph.dy / m) * PRED_PERIPH_WEIGHT; chaseC++; } }
          else { const m = Math.hypot(seen.dx, seen.dy) || 1; chaseX += (seen.dx / m); chaseY += (seen.dy / m); chaseC++; }
        }
      }

      if (nearestPrey) { const lead = leadDirection(b, nearestPrey, 40); chaseX += lead.x * 2.0; chaseY += lead.y * 2.0; chaseC += 2.0; }
      if (nearestPred) { const dx = shortestDelta(nearestPred.x - b.x, width); const dy = shortestDelta(nearestPred.y - b.y, height); const m = Math.hypot(dx, dy) || 1; fleeX += -(dx / m) * 1.5; fleeY += -(dy / m) * 1.5; fleeC += 1.5; }

      let desX = 0, desY = 0;
      if (alignC > 0) { alignX /= alignC; alignY /= alignC; const am = Math.hypot(alignX, alignY) || 1; desX += (alignX / am) * ALIGN_W * params.alignment; desY += (alignY / am) * ALIGN_W * params.alignment; }
      if (cohC > 0) { cohX /= cohC; cohY /= cohC; const toCx = shortestDelta(cohX - b.x, width); const toCy = shortestDelta(cohY - b.y, height); const cm = Math.hypot(toCx, toCy) || 1; desX += (toCx / cm) * COHESION_W * params.cohesion; desY += (toCy / cm) * COHESION_W * params.cohesion; }
      if (sepX !== 0 || sepY !== 0) { const sm = Math.hypot(sepX, sepY) || 1; desX += (sepX / sm) * SEPARATION_W * params.separation; desY += (sepY / sm) * SEPARATION_W * params.separation; }
      if (fleeC > 0) { const fm = Math.hypot(fleeX, fleeY) || 1; desX += (fleeX / fm) * FLEE_W; desY += (fleeY / fm) * FLEE_W; }
      if (chaseC > 0) { const cm = Math.hypot(chaseX, chaseY) || 1; desX += (chaseX / cm) * CHASE_W; desY += (chaseY / cm) * CHASE_W; }

      // Anticipatory avoidance -> steering
      {
        const minSep = R * 2.2; const minSep2 = minSep * minSep; const bv = Math.hypot(b.vx, b.vy) || 1; const bux = b.vx / bv, buy = b.vy / bv;
        for (let j = 0; j < boids.length; j++) { if (i === j) continue; const o = boids[j];
          let rx = shortestDelta(o.x - b.x, width); let ry = shortestDelta(o.y - b.y, height); const r2 = rx*rx + ry*ry; if (r2 > (minSep + 3*R) * (minSep + 3*R)) continue;
          const rvx = o.vx - b.vx; const rvy = o.vy - b.vy; const rv2 = rvx*rvx + rvy*rvy; let tStar = 0; if (rv2 > 1e-8) { tStar = -(rx*rvx + ry*rvy) / rv2; tStar = clamp(tStar, 0, LOOK_AHEAD); }
          const cx = rx + rvx * tStar; const cy = ry + rvy * tStar; const c2 = cx*cx + cy*cy; if (c2 < minSep2) {
            const side = (bux * cy - buy * cx) >= 0 ? 1 : -1; const sideX = -buy * side; const sideY =  bux * side;
            const imminence = 1 / (1 + tStar); const penetration = Math.max(0, (minSep2 - c2) / minSep2); const lat = LATERAL_GAIN * (0.4 + 0.6 * imminence) * (0.4 + 0.6 * penetration);
            desX += sideX * lat; desY += sideY * lat; const c = Math.sqrt(c2) || 1; desX += -(cx / c) * RADIAL_GAIN * penetration; desY += -(cy / c) * RADIAL_GAIN * penetration;
          }
        }
      }

      // Wander (tiny)
      b.phase += WANDER_FREQ; desX += Math.cos(b.phase) * WANDER_STRENGTH * 0.18; desY += Math.sin(b.phase * 1.3) * WANDER_STRENGTH * 0.18;

      // Normalize & low-pass to desired heading
      const dm = Math.hypot(desX, desY); if (dm > 1e-6) { desX /= dm; desY /= dm; } else { desX = b.hx; desY = b.hy; }
      b.dx = (1 - DESIRE_SMOOTH) * desX + DESIRE_SMOOTH * b.dx; b.dy = (1 - DESIRE_SMOOTH) * desY + DESIRE_SMOOTH * b.dy; const dnm = Math.hypot(b.dx, b.dy) || 1; b.dx /= dnm; b.dy /= dnm;

      b.ax = clamp(b.dx - b.hx, -MAX_FORCE, MAX_FORCE); b.ay = clamp(b.dy - b.hy, -MAX_FORCE, MAX_FORCE);
    }

    // Integrate heading & speed with yaw inertia (anti-jitter)
    for (const b of boids) {
      const speedNow = Math.max(FLIGHT_MIN, Math.hypot(b.vx, b.vy) || FLIGHT_MIN);
      const turnLimit = Math.max(0.015, BASE_TURN * (speedNow / TURN_REF_SPEED));

      // Compute signed angle to desired, apply deadband & hysteresis
      let phi = signedAngle(b.hx, b.hy, b.dx, b.dy); // (-pi, pi]
      if (Math.abs(phi) < TURN_DEADBAND) phi = 0;
      else phi = phi - Math.sign(phi) * TURN_DEADBAND; // small deadband removal

      // If commanding a reversal against current yaw, soften it
      if (phi !== 0 && Math.sign(phi) !== Math.sign(b.angVel) && Math.abs(b.angVel) > 1e-4) {
        phi *= (1 - TURN_HYSTERESIS);
      }

      // Target yaw rate proportional to remaining angle
      const desiredRate = clamp(phi * TURN_GAIN, -turnLimit, turnLimit);
      const err = desiredRate - b.angVel;
      const yawAcc = clamp(err * 0.8, -MAX_YAW_ACC, MAX_YAW_ACC);
      b.angVel = clamp(b.angVel + yawAcc, -MAX_YAW_RATE, MAX_YAW_RATE);
      b.angVel *= (1 - YAW_FRICTION);

      // Apply rotation by current yaw rate
      const [nhx, nhy] = rotateToward(b.hx, b.hy, b.angVel);
      b.hx = nhx; b.hy = nhy;

      // Speed target drift
      const drift = Math.sin(b.phase * 0.67) * 0.016;
      b.speedTarget = clamp(b.speedTarget + drift, FLIGHT_MIN, MAX_SPEED);

      const target = clamp(b.speedTarget - DRAG * speedNow, FLIGHT_MIN, MAX_SPEED);
      const usedTurn = Math.min(Math.abs(b.angVel), turnLimit);
      const turnSlowdown = 1 - Math.min(1, usedTurn / turnLimit);
      const upCap = Math.max(0.002, MAX_DV_UP * turnSlowdown);

      let dv = target - speedNow;
      if (dv > 0) dv = Math.min(dv, upCap); else dv = Math.max(dv, -MAX_DV_DOWN);

      const nextSpeed = clamp(speedNow + dv, FLIGHT_MIN, MAX_SPEED);
      b.vx = b.hx * nextSpeed; b.vy = b.hy * nextSpeed;
      b.x = wrap(b.x + b.vx, width); b.y = wrap(b.y + b.vy, height);

      b.ax = 0; b.ay = 0;
    }

    // Conversions (momentum preserved)
    for (let i = 0; i < boids.length; i++) {
      const A = boids[i];
      for (let j = i + 1; j < boids.length; j++) {
        const B = boids[j];
        const dx = shortestDelta(B.x - A.x, width);
        const dy = shortestDelta(B.y - A.y, height);
        const d2 = dx*dx + dy*dy;
        const Av = Math.hypot(A.vx, A.vy) || 1; const Bv = Math.hypot(B.vx, B.vy) || 1;
        const Afx = A.vx / Av, Afy = A.vy / Av; const Bfx = B.vx / Bv, Bfy = B.vy / Bv;
        const invd = 1 / (Math.sqrt(d2) || 1);
        const toBdx = dx * invd, toBdy = dy * invd; const toAdx = -toBdx, toAdy = -toBdy;
        const AFacing = Afx * toBdx + Afy * toBdy; const BFacing = Bfx * toAdx + Bfy * toAdy;
        if (d2 <= CONVERT_R * CONVERT_R) {
          if (typeBeats(A.type, B.type, params.types) && AFacing > -0.2) B.type = A.type;
          else if (typeBeats(B.type, A.type, params.types) && BFacing > -0.2) A.type = B.type;
        }
      }
    }

    publishCounts();
  }

  // ---------------- Render ---------------------------------------------------
  function render() {
    ctx.clearRect(0, 0, width, height);
    for (const b of boids) {
      const ang = Math.atan2(b.vy, b.vx);
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(ang);
      ctx.beginPath(); ctx.moveTo(R + 2, 0); ctx.lineTo(-R, R * 0.6); ctx.lineTo(-R, -R * 0.6); ctx.closePath();
      ctx.fillStyle = hslColor(b.type, params.types, 45); ctx.fill();
      ctx.restore();
    }
  }

  // ---------------- Loop & API ----------------------------------------------
  let running = true, paused = false, rafId = 0;
  function tick() { if (!running) return; if (!paused) { update(); render(); } rafId = requestAnimationFrame(tick); }
  rafId = requestAnimationFrame(tick);

  makeBoids(params.types ?? 3);

  return {
    setParams(next) { params = { ...params, ...next }; },
    resize(w, h) { width = w; height = h; },
    pause() { paused = true; },
    resume() { paused = false; },
    reset(nTypes) { params = { ...params, types: nTypes }; makeBoids(nTypes); },
    stop() { running = false; cancelAnimationFrame(rafId); },
  };
}

function hslColor(i, n, l = 50) { return `hsl(${(i * 360) / Math.max(1, n)}, 100%, ${l}%)`; }


