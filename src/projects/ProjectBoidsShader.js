// export function initBoidSimulation(canvas, paramsRef, reportCounts) {
//   const ctx = canvas.getContext("2d");
//   const width = (canvas.width = canvas.clientWidth);
//   const height = (canvas.height = canvas.clientHeight);

//   const NUM_BOIDS = 100;
//   const SPEED = 0.3;

//   const pausedRef = { current: false };
//   const isRunningRef = { current: false };
//   let animationId = null;

//   let boids = [];

//   function createBoids() {
//     const types = paramsRef.current.types;
//     boids = [];
//     for (let i = 0; i < NUM_BOIDS; i++) {
//       boids.push({
//         x: Math.random() * width,
//         y: Math.random() * height,
//         vx: (Math.random() - 0.5) * SPEED,
//         vy: (Math.random() - 0.5) * SPEED,
//         ax: 0,
//         ay: 0,
//         type: i % types,
//       });
//     }
//   }

//   createBoids();

//   function distance(a, b) {
//     return Math.hypot(a.x - b.x, a.y - b.y);
//   }

//   function angleBetween(a, b) {
//     const angleA = Math.atan2(a.vy, a.vx);
//     const dx = b.x - a.x;
//     const dy = b.y - a.y;
//     const angleToB = Math.atan2(dy, dx);
//     let diff = angleToB - angleA;
//     while (diff > Math.PI) diff -= 2 * Math.PI;
//     while (diff < -Math.PI) diff += 2 * Math.PI;
//     return diff;
//   }

//   function typeBeats(a, b, n) {
//     return ((a - b + n) % n) > n / 2;
//   }

//   function updateBoids() {
//     const { alignment, cohesion, separation, perception, types } = paramsRef.current;

//     for (let boid of boids) {
//       let align = { x: 0, y: 0 }, cohere = { x: 0, y: 0 }, separate = { x: 0, y: 0 };
//       let count = 0;
//       let flee = { x: 0, y: 0 }, chase = { x: 0, y: 0 };

//       for (let other of boids) {
//         if (other === boid) continue;
//         const d = distance(boid, other);
//         if (d < perception) {
//           const angleDiff = angleBetween(boid, other);
//           const facing = Math.abs(angleDiff) < Math.PI / 4;

//           if (facing && d < 10 && typeBeats(boid.type, other.type, types)) {
//             other.type = boid.type;
//           }

//           if (other.type === boid.type) {
//             align.x += other.vx;
//             align.y += other.vy;
//             cohere.x += other.x;
//             cohere.y += other.y;
//             separate.x += boid.x - other.x;
//             separate.y += boid.y - other.y;
//             count++;
//           } else {
//             if (typeBeats(other.type, boid.type, types)) {
//               flee.x += boid.x - other.x;
//               flee.y += boid.y - other.y;
//             } else if (typeBeats(boid.type, other.type, types)) {
//               chase.x += other.x - boid.x;
//               chase.y += other.y - boid.y;
//             }
//           }
//         }
//       }

//       if (count > 0) {
//         align.x /= count;
//         align.y /= count;
//         cohere.x /= count;
//         cohere.y /= count;
//         separate.x /= count;
//         separate.y /= count;

//         boid.ax += (align.x - boid.vx) * alignment * 0.2;
//         boid.ay += (align.y - boid.vy) * alignment * 0.2;

//         boid.ax += (cohere.x - boid.x) * cohesion * 0.01;
//         boid.ay += (cohere.y - boid.y) * cohesion * 0.01;

//         boid.ax += separate.x * separation * 0.05;
//         boid.ay += separate.y * separation * 0.05;
//       }

//       boid.ax += flee.x * 0.01;
//       boid.ay += flee.y * 0.01;
//       boid.ax += chase.x * 0.01;
//       boid.ay += chase.y * 0.01;

//       // Cap acceleration
//       const maxAccel = 0.2;
//       const accMag = Math.hypot(boid.ax, boid.ay);
//       if (accMag > maxAccel) {
//         boid.ax = (boid.ax / accMag) * maxAccel;
//         boid.ay = (boid.ay / accMag) * maxAccel;
//       }

//       // Apply acceleration
//       boid.vx += boid.ax;
//       boid.vy += boid.ay;

//       // Reset acceleration
//       boid.ax = 0;
//       boid.ay = 0;

//       // Apply drag to create smooth coasting
//       const drag = 0.98;
//       boid.vx *= drag;
//       boid.vy *= drag;

//       // Limit max speed
//       const speed = Math.hypot(boid.vx, boid.vy);
//       if (speed > SPEED) {
//         boid.vx = (boid.vx / speed) * SPEED;
//         boid.vy = (boid.vy / speed) * SPEED;
//       }

//       // Move position
//       boid.x += boid.vx;
//       boid.y += boid.vy;

//       // Wrap edges
//       if (boid.x < 0) boid.x += width;
//       if (boid.y < 0) boid.y += height;
//       if (boid.x > width) boid.x -= width;
//       if (boid.y > height) boid.y -= height;
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
//         const types = paramsRef.current.types;
//         const liveCounts = new Array(types).fill(0);
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
//     pause: () => {
//       pausedRef.current = true;
//     },
//     resume: () => {
//       pausedRef.current = false;
//     },
//     reset: () => {
//       createBoids();
//       if (pausedRef.current) renderBoids();

//       if (reportCounts) {
//         const types = paramsRef.current.types;
//         const freshCounts = new Array(types).fill(0);
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


// ProjectBoidsShader.js - Updated with gliding, minSpeed, wander, and smooth turning

// ProjectBoidsShader.js
export function initBoidSimulation(canvas, paramsRef, reportCounts) {
  const ctx = canvas.getContext("2d");
  const width = (canvas.width = canvas.clientWidth);
  const height = (canvas.height = canvas.clientHeight);

  const NUM_BOIDS = 200;
  const pausedRef = { current: false };
  const isRunningRef = { current: false };
  let animationId = null;
  let boids = [];

  function createBoids() {
    const types = paramsRef.current.types;
    boids = [];
    for (let i = 0; i < NUM_BOIDS; i++) {
      const angle = Math.random() * 2 * Math.PI;
      boids.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: Math.cos(angle),
        vy: Math.sin(angle),
        ax: 0,
        ay: 0,
        type: i % types,
      });
    }
  }

  createBoids();

  function typeBeats(a, b, n) {
    return ((a - b + n) % n) > n / 2;
  }

  function updateBoids() {
    const {
      boidSpeed,
      sameSpeciesFlocking,
      preyAttract,
      predatorFear,
      types,
    } = paramsRef.current;

    for (let boid of boids) {
      let align = { x: 0, y: 0 }, cohesion = { x: 0, y: 0 }, separate = { x: 0, y: 0 };
      let flee = { x: 0, y: 0 }, chase = { x: 0, y: 0 };
      let countAlign = 0;

      for (let other of boids) {
        if (other === boid) continue;

        const dx = other.x - boid.x;
        const dy = other.y - boid.y;
        const dist = Math.hypot(dx, dy);

        if (other.type === boid.type && dist < 80) {
          align.x += other.vx;
          align.y += other.vy;
          cohesion.x += other.x;
          cohesion.y += other.y;
          separate.x += boid.x - other.x;
          separate.y += boid.y - other.y;
          countAlign++;
        }

        if (dist < 10 && typeBeats(boid.type, other.type, types)) {
          other.type = boid.type;
        }

        if (dist < 90) {
          if (typeBeats(other.type, boid.type, types)) {
            flee.x += boid.x - other.x;
            flee.y += boid.y - other.y;
          } else if (typeBeats(boid.type, other.type, types)) {
            chase.x += other.x - boid.x;
            chase.y += other.y - boid.y;
          }
        }
      }

      if (countAlign > 0) {
        align.x /= countAlign;
        align.y /= countAlign;
        cohesion.x /= countAlign;
        cohesion.y /= countAlign;
        separate.x /= countAlign;
        separate.y /= countAlign;

        boid.ax += align.x * 0.1 * sameSpeciesFlocking;
        boid.ay += align.y * 0.1 * sameSpeciesFlocking;
        boid.ax += (cohesion.x - boid.x) * 0.005 * sameSpeciesFlocking;
        boid.ay += (cohesion.y - boid.y) * 0.005 * sameSpeciesFlocking;

        if (sameSpeciesFlocking < 0) {
          boid.ax += separate.x * 0.2 * -sameSpeciesFlocking;
          boid.ay += separate.y * 0.2 * -sameSpeciesFlocking;
        }
      }

      boid.ax += flee.x * predatorFear * 0.001;
      boid.ay += flee.y * predatorFear * 0.001;
      boid.ax += chase.x * preyAttract * 0.001;
      boid.ay += chase.y * preyAttract * 0.001;

      boid.vx += boid.ax;
      boid.vy += boid.ay;

      const mag = Math.hypot(boid.vx, boid.vy);
      boid.vx = (boid.vx / (mag || 1)) * boidSpeed;
      boid.vy = (boid.vy / (mag || 1)) * boidSpeed;

      boid.x += boid.vx;
      boid.y += boid.vy;

      if (boid.x < 0) boid.x += width;
      if (boid.y < 0) boid.y += height;
      if (boid.x > width) boid.x -= width;
      if (boid.y > height) boid.y -= height;

      boid.ax = 0;
      boid.ay = 0;
    }
  }

  function renderBoids() {
    ctx.clearRect(0, 0, width, height);
    for (let boid of boids) {
      const angle = Math.atan2(boid.vy, boid.vx);
      ctx.save();
      ctx.translate(boid.x, boid.y);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.lineTo(-5, 3);
      ctx.lineTo(-5, -3);
      ctx.closePath();
      ctx.fillStyle = `hsl(${(boid.type * 360) / paramsRef.current.types}, 100%, 40%)`;
      ctx.fill();
      ctx.restore();
    }
  }

  function animate() {
    if (!isRunningRef.current) return;
    if (!pausedRef.current) {
      updateBoids();
      renderBoids();
      if (reportCounts) {
        const liveCounts = new Array(paramsRef.current.types).fill(0);
        for (let boid of boids) {
          liveCounts[boid.type]++;
        }
        reportCounts([...liveCounts]);
      }
    }
    animationId = requestAnimationFrame(animate);
  }

  isRunningRef.current = true;
  animate();

  return {
    pause: () => (pausedRef.current = true),
    resume: () => (pausedRef.current = false),
    reset: () => {
      createBoids();
      if (pausedRef.current) renderBoids();
      if (reportCounts) {
        const freshCounts = new Array(paramsRef.current.types).fill(0);
        for (let boid of boids) {
          freshCounts[boid.type]++;
        }
        reportCounts([...freshCounts]);
      }
    },
    stop: () => {
      isRunningRef.current = false;
      if (animationId) cancelAnimationFrame(animationId);
    },
  };
}