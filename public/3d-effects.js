/**
 * Hacker House Goa 2026 — Interactive Background & Cursor Motion Engine
 * Keeps Builder ID card, Crew frame, and form panels 100% stationary while providing dynamic background motion.
 */

(function () {
  'use strict';

  function init3DEffects() {
    // Note: Builder ID card frame, Crew frame, and form panels are kept 100% stationary as requested.

    // 1. Cursor Light Follower
    initCursorGlow();

    // 2. Cursor-Reactive Background Grid & Parallax Motion
    initBackgroundParallax();

    // 3. Interactive Background Particle System
    initInteractiveBackgroundParticles();
  }

  function initCursorGlow() {
    let cursorOrb = document.querySelector('.cursor-3d-glow');
    if (!cursorOrb) {
      cursorOrb = document.createElement('div');
      cursorOrb.className = 'cursor-3d-glow';
      document.body.appendChild(cursorOrb);
    }

    let curX = window.innerWidth / 2;
    let curY = window.innerHeight / 2;
    let targetX = curX;
    let targetY = curY;

    window.addEventListener('mousemove', (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
    }, { passive: true });

    function moveCursor() {
      curX += (targetX - curX) * 0.14;
      curY += (targetY - curY) * 0.14;
      cursorOrb.style.transform = `translate3d(${(curX - 150).toFixed(1)}px, ${(curY - 150).toFixed(1)}px, 0)`;
      requestAnimationFrame(moveCursor);
    }
    requestAnimationFrame(moveCursor);
  }

  function initBackgroundParallax() {
    const gridBg = document.querySelector('.grid-3d-bg');
    const palms = document.querySelectorAll('.floating-palm');
    const glowingSun = document.querySelector('.glowing-sun');
    const glowOrbs = document.querySelectorAll('.glow-orb');

    let targetOffsetX = 0;
    let targetOffsetY = 0;
    let currentOffsetX = 0;
    let currentOffsetY = 0;

    window.addEventListener('mousemove', (e) => {
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = (e.clientY / window.innerHeight) * 2 - 1;

      targetOffsetX = normX * 25;
      targetOffsetY = normY * 18;
    }, { passive: true });

    function renderParallax() {
      currentOffsetX += (targetOffsetX - currentOffsetX) * 0.08;
      currentOffsetY += (targetOffsetY - currentOffsetY) * 0.08;

      if (gridBg) {
        gridBg.style.transform = `perspective(600px) rotateX(60deg) translate3d(${currentOffsetX.toFixed(1)}px, ${(currentOffsetY - 100).toFixed(1)}px, 0) scale(2.2)`;
      }

      palms.forEach((palm, idx) => {
        const factor = (idx + 1) * -0.4;
        palm.style.transform = `translate3d(${(currentOffsetX * factor).toFixed(1)}px, ${(currentOffsetY * factor).toFixed(1)}px, 0)`;
      });

      if (glowingSun) {
        glowingSun.style.transform = `translate3d(${(currentOffsetX * 0.3).toFixed(1)}px, ${(currentOffsetY * 0.3).toFixed(1)}px, 0)`;
      }

      glowOrbs.forEach((orb, idx) => {
        const factor = idx % 2 === 0 ? 0.4 : -0.4;
        orb.style.transform = `translate3d(${(currentOffsetX * factor).toFixed(1)}px, ${(currentOffsetY * factor).toFixed(1)}px, 0)`;
      });

      requestAnimationFrame(renderParallax);
    }

    requestAnimationFrame(renderParallax);
  }

  function initInteractiveBackgroundParticles() {
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

    let mouseX = width / 2;
    let mouseY = height / 2;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }, { passive: true });

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

    function animateParticles() {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particleCount; i++) {
        const p = particles[i];

        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 220) {
          const force = (220 - dist) / 220;
          p.vx += (dx / dist) * force * 0.03;
          p.vy += (dy / dist) * force * 0.03;
        }

        p.vx *= 0.98;
        p.vy *= 0.98;

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

      requestAnimationFrame(animateParticles);
    }

    requestAnimationFrame(animateParticles);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init3DEffects);
  } else {
    init3DEffects();
  }
})();
