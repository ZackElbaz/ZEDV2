import React, { useRef, useEffect } from "react";

function ParticleBackground() {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let particles = [];
    const color = `hsl(${Math.floor(Math.random() * 360)}, 100%, 60%)`;

    function initializeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const aspectRatio = Math.max(canvas.width, canvas.height) / Math.min(canvas.width, canvas.height);
      const aspectScale = Math.pow(aspectRatio, 0.6);

      particles = [];

      const numParticles = Math.floor(60 / Math.pow(aspectScale, 2.5));
      const minRadius = 15 * Math.exp(-0.3 * (aspectScale - 1));
      const maxRadius = 75 * Math.exp(-0.3 * (aspectScale - 1));

      class Particle {
        constructor() {
          this.reset();
        }
        reset() {
          this.x = Math.random() * canvas.width;
          this.y = Math.random() * canvas.height;
          this.vx = (Math.random() - 0.5) * 0.3;
          this.vy = (Math.random() - 0.5) * 0.3;
          this.radius = Math.random() * (maxRadius - minRadius) + minRadius;
          this.color = color;
        }
        update() {
          this.x += this.vx;
          this.y += this.vy;

          if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
            this.reset();
          }
        }
        draw() {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
          ctx.fillStyle = this.color;
          ctx.fill();
        }
      }

      for (let i = 0; i < numParticles; i++) {
        particles.push(new Particle());
      }
    }

    function drawLines() {
      const aspectRatio = Math.max(canvas.width, canvas.height) / Math.min(canvas.width, canvas.height);
      const baseDistance = 150;
      const connectionDistance = baseDistance * (1.5 * Math.log1p(aspectRatio - 1));
      const lineWidth = 100 * (1 - Math.exp(-0.2 * (1 / aspectRatio))); // fast thinning then plateau

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectionDistance) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.lineWidth = lineWidth;
            ctx.strokeStyle = color;
            ctx.stroke();
          }
        }
      }
    }

    function animate() {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      drawLines();
      requestAnimationFrame(animate);
    }

    initializeCanvas();
    animate();

    const resize = () => {
      initializeCanvas();
    };
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 0,
        width: "100%",
        height: "100%",
      }}
    />
  );
}

export default ParticleBackground;
