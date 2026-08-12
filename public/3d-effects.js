/**
 * Hacker House Goa 2026 — Optimized 3D Motion & Parallax Engine
 * Highly performant, single-loop hardware-accelerated 3D effects.
 */

(function () {
  'use strict';

  const SELECTOR = '.action-card, .panel, .tilt-3d, .hero-stamp, .card-frame, .crew-canvas-container';

  function init3DEffects() {
    const tiltElements = document.querySelectorAll(SELECTOR);

    // 1. Setup 3D Tilt for cards
    tiltElements.forEach((el) => {
      el.style.transformStyle = 'preserve-3d';
      el.style.willChange = 'transform';

      let bounds = null;
      let currentRotateX = 0;
      let currentRotateY = 0;
      let targetRotateX = 0;
      let targetRotateY = 0;
      let isHovered = false;
      let animId = null;

      function updateBounds() {
        bounds = el.getBoundingClientRect();
      }

      function onMouseEnter() {
        updateBounds();
        isHovered = true;
        animLoop();
      }

      function onMouseMove(e) {
        if (!bounds) updateBounds();
        const x = e.clientX - bounds.left;
        const y = e.clientY - bounds.top;

        const normX = (x / bounds.width) * 2 - 1;
        const normY = (y / bounds.height) * 2 - 1;

        targetRotateX = -normY * 12;
        targetRotateY = normX * 12;

        const pctX = (x / bounds.width) * 100;
        const pctY = (y / bounds.height) * 100;
        el.style.setProperty('--mouse-x', `${pctX}%`);
        el.style.setProperty('--mouse-y', `${pctY}%`);
      }

      function onMouseLeave() {
        isHovered = false;
        targetRotateX = 0;
        targetRotateY = 0;
      }

      function animLoop() {
        currentRotateX += (targetRotateX - currentRotateX) * 0.14;
        currentRotateY += (targetRotateY - currentRotateY) * 0.14;

        if (isHovered || Math.abs(currentRotateX) > 0.05 || Math.abs(currentRotateY) > 0.05) {
          const translateZ = isHovered ? 12 : 0;
          const scale = isHovered ? 1.02 : 1;
          el.style.transform = `perspective(1000px) rotateX(${currentRotateX.toFixed(2)}deg) rotateY(${currentRotateY.toFixed(2)}deg) translateZ(${translateZ}px) scale3d(${scale}, ${scale}, ${scale})`;
          animId = requestAnimationFrame(animLoop);
        } else {
          el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale3d(1, 1, 1)';
          cancelAnimationFrame(animId);
        }
      }

      el.addEventListener('mouseenter', onMouseEnter, { passive: true });
      el.addEventListener('mousemove', onMouseMove, { passive: true });
      el.addEventListener('mouseleave', onMouseLeave, { passive: true });
    });

    // 2. Optimized Unified Master Animation Loop for Background Parallax & Particles
    initMasterBackgroundEngine();
  }

  function initMasterBackgroundEngine() {
    // Create cursor glow orb
    let cursorOrb = document.querySelector('.cursor-3d-glow');
    if (!cursorOrb) {
      cursorOrb = document.createElement('div');
      cursorOrb.className = 'cursor-3d-glow';
      document.body.appendChild(cursorOrb);
    }

    // Create interactive background canvas
    let canvas = document.getElementById('bg-interactive-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'bg-interactive-canvas';
      canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:-2;will-change:transform;';
      document.body.appendChild(canvas);
    }

    const ctx = canvas.getContext('2d', { alpha: true });
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }, { passive: true });

    // Track mouse coordinates
    let mouseX = width / 2;
    let mouseY = height / 2;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }, { passive: true });

    // Background DOM elements for parallax
    const gridBg = document.querySelector('.grid-3d-bg');
    const palms = document.querySelectorAll('.floating-palm');
    const glowingSun = document.querySelector('.glowing-sun');
    const glowOrbs = document.querySelectorAll('.glow-orb');

    // Smooth position lerp variables
    let curCursorX = mouseX;
    let curCursorY = mouseY;
    let currentParallaxX = 0;
    let currentParallaxY = 0;

    // Optimized particle list (18 particles for silky smooth performance)
    const particleCount = 18;
    const particles = [];
    const colors = ['#ffe000', '#ff007f', '#147b70', '#e9a33f'];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: Math.random() * 2.2 + 1,
        color: colors[i % colors.length],
        alpha: Math.random() * 0.6 + 0.3,
        symbol: i % 4 === 0 ? '✦' : null
      });
    }

    // Unified 60fps Frame Master Loop
    function masterLoop() {
      // 1. Smooth Cursor Orb Lerp
      curCursorX += (mouseX - curCursorX) * 0.15;
      curCursorY += (mouseY - curCursorY) * 0.15;
      cursorOrb.style.transform = `translate3d(${(curCursorX - 150).toFixed(1)}px, ${(curCursorY - 150).toFixed(1)}px, 0)`;

      // 2. Smooth Background Elements Parallax Shift
      const normX = (mouseX / width) * 2 - 1;
      const normY = (mouseY / height) * 2 - 1;
      const targetParallaxX = normX * 25;
      const targetParallaxY = normY * 18;

      currentParallaxX += (targetParallaxX - currentParallaxX) * 0.08;
      currentParallaxY += (targetParallaxY - currentParallaxY) * 0.08;

      if (gridBg) {
        gridBg.style.transform = `perspective(600px) rotateX(60deg) translate3d(${currentParallaxX.toFixed(1)}px, ${(currentParallaxY - 100).toFixed(1)}px, 0) scale(2.2)`;
      }

      palms.forEach((palm, idx) => {
        const factor = (idx + 1) * -0.5;
        palm.style.transform = `translate3d(${(currentParallaxX * factor).toFixed(1)}px, ${(currentParallaxY * factor).toFixed(1)}px, 0)`;
      });

      if (glowingSun) {
        glowingSun.style.transform = `translate3d(${(currentParallaxX * 0.35).toFixed(1)}px, ${(currentParallaxY * 0.35).toFixed(1)}px, 0)`;
      }

      glowOrbs.forEach((orb, idx) => {
        const factor = idx % 2 === 0 ? 0.5 : -0.5;
        orb.style.transform = `translate3d(${(currentParallaxX * factor).toFixed(1)}px, ${(currentParallaxY * factor).toFixed(1)}px, 0)`;
      });

      // 3. Lightweight Canvas Particle Renderer
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < particleCount; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;

        if (p.symbol) {
          ctx.font = '11px sans-serif';
          ctx.fillText(p.symbol, p.x, p.y);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      requestAnimationFrame(masterLoop);
    }

    requestAnimationFrame(masterLoop);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init3DEffects);
  } else {
    init3DEffects();
  }
})();
