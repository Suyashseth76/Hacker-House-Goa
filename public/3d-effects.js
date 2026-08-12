/**
 * Hacker House Goa 2026 — Interactive 3D Motion & Background Parallax Engine
 * Provides real-time 3D card tilt, cursor light reflection, interactive particle system, and dynamic background parallax motion.
 */

(function () {
  'use strict';

  const SELECTOR = '.action-card, .panel, .tilt-3d, .hero-stamp, .card-frame, .crew-canvas-container';

  function init3DEffects() {
    const tiltElements = document.querySelectorAll(SELECTOR);

    // 1. Card 3D Tilt Engine
    tiltElements.forEach((el) => {
      el.style.transformStyle = 'preserve-3d';

      let bounds = null;
      let currentRotateX = 0;
      let currentRotateY = 0;
      let targetRotateX = 0;
      let targetRotateY = 0;
      let isHovered = false;
      let animFrameId = null;

      function updateBounds() {
        bounds = el.getBoundingClientRect();
      }

      function onMouseEnter() {
        updateBounds();
        isHovered = true;
        el.classList.add('is-tilting');
        animLoop();
      }

      function onMouseMove(e) {
        if (!bounds) updateBounds();
        const x = e.clientX - bounds.left;
        const y = e.clientY - bounds.top;

        const normX = (x / bounds.width) * 2 - 1;
        const normY = (y / bounds.height) * 2 - 1;

        const MAX_TILT = 14;
        targetRotateX = -normY * MAX_TILT;
        targetRotateY = normX * MAX_TILT;

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
        currentRotateX += (targetRotateX - currentRotateX) * 0.12;
        currentRotateY += (targetRotateY - currentRotateY) * 0.12;

        if (isHovered || Math.abs(currentRotateX) > 0.05 || Math.abs(currentRotateY) > 0.05) {
          const translateZ = isHovered ? 15 : 0;
          const scale = isHovered ? 1.025 : 1;
          el.style.transform = `perspective(1000px) rotateX(${currentRotateX.toFixed(2)}deg) rotateY(${currentRotateY.toFixed(2)}deg) translateZ(${translateZ}px) scale3d(${scale}, ${scale}, ${scale})`;
          animFrameId = requestAnimationFrame(animLoop);
        } else {
          el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale3d(1, 1, 1)';
          el.classList.remove('is-tilting');
          cancelAnimationFrame(animFrameId);
        }
      }

      el.addEventListener('mouseenter', onMouseEnter);
      el.addEventListener('mousemove', onMouseMove);
      el.addEventListener('mouseleave', onMouseLeave);
      window.addEventListener('resize', updateBounds);
    });

    // 2. Cursor 3D Light Follower
    initCursorGlow();

    // 3. Dynamic Cursor-Reactive Background Grid & Parallax Motion
    initBackgroundParallax();

    // 4. Dynamic Interactive Cursor Background Particle Trail Engine
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
    });

    function moveCursor() {
      curX += (targetX - curX) * 0.14;
      curY += (targetY - curY) * 0.14;
      cursorOrb.style.transform = `translate3d(${curX - 150}px, ${curY - 150}px, 0)`;
      requestAnimationFrame(moveCursor);
    }
    requestAnimationFrame(moveCursor);
  }

  // Shift background 3D grid and ambient elements dynamically with cursor move
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
      const normX = (e.clientX / window.innerWidth) * 2 - 1; // -1 to 1
      const normY = (e.clientY / window.innerHeight) * 2 - 1; // -1 to 1

      targetOffsetX = normX * 35; // shift up to 35px
      targetOffsetY = normY * 25; // shift up to 25px
    });

    function renderParallax() {
      currentOffsetX += (targetOffsetX - currentOffsetX) * 0.08;
      currentOffsetY += (targetOffsetY - currentOffsetY) * 0.08;

      if (gridBg) {
        gridBg.style.transform = `perspective(600px) rotateX(60deg) translate3d(${currentOffsetX * 0.8}px, ${currentOffsetY * 0.8 - 100}px, 0) scale(2.2)`;
      }

      palms.forEach((palm, idx) => {
        const factor = (idx + 1) * -0.6;
        palm.style.transform = `translate3d(${currentOffsetX * factor}px, ${currentOffsetY * factor}px, 0)`;
      });

      if (glowingSun) {
        glowingSun.style.transform = `translate3d(${currentOffsetX * 0.4}px, ${currentOffsetY * 0.4}px, 0)`;
      }

      glowOrbs.forEach((orb, idx) => {
        const factor = idx % 2 === 0 ? 0.7 : -0.7;
        orb.style.transform = `translate3d(${currentOffsetX * factor}px, ${currentOffsetY * factor}px, 0)`;
      });

      requestAnimationFrame(renderParallax);
    }

    requestAnimationFrame(renderParallax);
  }

  // Interactive Background Particle System that follows and reacts to cursor
  function initInteractiveBackgroundParticles() {
    let canvas = document.getElementById('bg-interactive-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'bg-interactive-canvas';
      canvas.style.position = 'fixed';
      canvas.style.inset = '0';
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '-2';
      document.body.appendChild(canvas);
    }

    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    let mouseX = width / 2;
    let mouseY = height / 2;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    const particles = [];
    const particleCount = 55;
    const colors = ['#ffe000', '#ff007f', '#147b70', '#ffffff', '#e9a33f'];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: Math.random() * 2.5 + 1.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.7 + 0.3,
        symbol: Math.random() > 0.65 ? '✦' : null
      });
    }

    function animateParticles() {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        // Move towards mouse slightly with subtle spring force
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 280) {
          const force = (280 - dist) / 280;
          p.vx += (dx / dist) * force * 0.04;
          p.vy += (dy / dist) * force * 0.04;
        }

        // Apply friction
        p.vx *= 0.98;
        p.vy *= 0.98;

        p.x += p.vx;
        p.y += p.vy;

        // Wrap boundaries
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Draw particle or star symbol
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;

        if (p.symbol) {
          ctx.font = '12px "Trebuchet MS", sans-serif';
          ctx.fillText(p.symbol, p.x, p.y);
        } else {
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // Draw faint connecting neon lines between nearby particles near mouse
      ctx.strokeStyle = 'rgba(255, 224, 0, 0.07)';
      ctx.lineWidth = 0.8;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
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
