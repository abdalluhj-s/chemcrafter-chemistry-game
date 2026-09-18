// Visual Canvas Reaction Simulator: Particles, Flares, Sparks, and Fluid Bubbles
export class ParticleEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.particles = [];
    this.animating = false;
    this.flaskColor = "rgba(0, 229, 255, 0.25)";
    this.liquidHeight = 0.35; // 35% fill
    this.ambientBubbles = [];
    this.flashAlpha = 0;
    this.flashColor = "#ffffff";
    this.shakeAmount = 0;

    this.resize();
    window.addEventListener("resize", () => this.resize());
    this.initAmbientBubbles();
    this.startLoop();
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  initAmbientBubbles() {
    this.ambientBubbles = [];
    for (let i = 0; i < 15; i++) {
      this.ambientBubbles.push({
        x: Math.random() * this.canvas.width,
        y: this.canvas.height - Math.random() * (this.canvas.height * this.liquidHeight),
        radius: 2 + Math.random() * 4,
        speedY: 0.4 + Math.random() * 0.8,
        wobble: Math.random() * Math.PI * 2
      });
    }
  }

  setFlaskColor(colorHex, alpha = 0.3) {
    this.flaskColor = colorHex;
  }

  triggerReactionVisual(visualEffect) {
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height * 0.65;
    const count = 40 + (visualEffect.explosionLevel || 1) * 30;

    if (visualEffect.flash) {
      this.flashAlpha = 0.7;
      this.flashColor = visualEffect.color || "#ffffff";
      this.shakeAmount = (visualEffect.explosionLevel || 1) * 8;
    }

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * (3 + (visualEffect.explosionLevel || 1) * 4);
      this.particles.push({
        x: cx + (Math.random() - 0.5) * 40,
        y: cy + (Math.random() - 0.5) * 30,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (visualEffect.particles === "smoke" ? 2 : 1),
        radius: 2 + Math.random() * 5,
        life: 1.0,
        decay: 0.015 + Math.random() * 0.02,
        color: visualEffect.color || "#00E5FF",
        type: visualEffect.particles || "spark",
        rotation: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 0.1
      });
    }
  }

  startLoop() {
    const loop = () => {
      this.update();
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  update() {
    // Shake decay
    if (this.shakeAmount > 0) {
      this.shakeAmount *= 0.88;
      if (this.shakeAmount < 0.2) this.shakeAmount = 0;
    }

    // Flash decay
    if (this.flashAlpha > 0) {
      this.flashAlpha *= 0.9;
      if (this.flashAlpha < 0.01) this.flashAlpha = 0;
    }

    // Update ambient bubbles in flask
    const liquidTop = this.canvas.height * (1 - this.liquidHeight);
    for (let b of this.ambientBubbles) {
      b.y -= b.speedY;
      b.wobble += 0.05;
      b.x += Math.sin(b.wobble) * 0.4;
      if (b.y < liquidTop) {
        b.y = this.canvas.height - 10;
        b.x = this.canvas.width * 0.3 + Math.random() * (this.canvas.width * 0.4);
      }
    }

    // Update active reaction particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      p.rotation += p.rotSpeed;

      if (p.type === "smoke" || p.type === "mist") {
        p.radius += 0.15;
        p.vy -= 0.05; // float upwards
      } else if (p.type === "spark") {
        p.vy += 0.08; // gravity
      } else if (p.type === "crystals" || p.type === "white_curd") {
        p.vy += 0.04; // sink to bottom
      }

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply shake offset
    this.ctx.save();
    if (this.shakeAmount > 0) {
      const sx = (Math.random() - 0.5) * this.shakeAmount;
      const sy = (Math.random() - 0.5) * this.shakeAmount;
      this.ctx.translate(sx, sy);
    }

    // Draw ambient bubbles in reactor zone
    for (let b of this.ambientBubbles) {
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
      this.ctx.fill();
    }

    // Draw reaction particles
    for (let p of this.particles) {
      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation);
      this.ctx.globalAlpha = Math.max(0, p.life);

      if (p.type === "spark" || p.type === "lilac_flame" || p.type === "blinding_light") {
        // Glowing star / spark
        this.ctx.shadowBlur = 12;
        this.ctx.shadowColor = p.color;
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (p.type === "crystals" || p.type === "gem_sparkle") {
        // Diamond crystal
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = p.color;
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -p.radius * 1.5);
        this.ctx.lineTo(p.radius, 0);
        this.ctx.lineTo(0, p.radius * 1.5);
        this.ctx.lineTo(-p.radius, 0);
        this.ctx.closePath();
        this.ctx.fill();
      } else {
        // Soft round smoke/mist/bubble
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.restore();
    }

    // Reaction Flash overlay
    if (this.flashAlpha > 0) {
      this.ctx.fillStyle = this.flashColor;
      this.ctx.globalAlpha = this.flashAlpha;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.globalAlpha = 1.0;
    }

    this.ctx.restore();
  }
}
