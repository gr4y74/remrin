'use client';

import React, { useEffect } from 'react';

export default function CustomCursor() {
  useEffect(() => {
    const cursor = document.getElementById('cursor');
    const ring = document.getElementById('cursorRing');
    if (!cursor || !ring) return;

    let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;
    let animationFrameId: number;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursor.style.transform = `translate(${mouseX - 6}px, ${mouseY - 6}px)`;
    };

    document.addEventListener('mousemove', onMouseMove);

    const animateRing = () => {
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;
      ring.style.transform = `translate(${ringX - 18}px, ${ringY - 18}px)`;
      animationFrameId = requestAnimationFrame(animateRing);
    };
    animateRing();

    // Hover effects on interactive elements
    const interactiveEls = document.querySelectorAll('button, a, .w-option, .distro-pill, .feature-card');
    const onMouseEnter = () => {
      cursor.style.transform += ' scale(1.5)';
      ring.style.width = '52px';
      ring.style.height = '52px';
    };
    const onMouseLeave = () => {
      ring.style.width = '36px';
      ring.style.height = '36px';
    };

    interactiveEls.forEach(el => {
      el.addEventListener('mouseenter', onMouseEnter);
      el.addEventListener('mouseleave', onMouseLeave);
    });

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animationFrameId);
      interactiveEls.forEach(el => {
        el.removeEventListener('mouseenter', onMouseEnter);
        el.removeEventListener('mouseleave', onMouseLeave);
      });
    };
  }, []);

  return (
    <>
      <div className="cursor" id="cursor"></div>
      <div className="cursor-ring" id="cursorRing"></div>
    </>
  );
}
