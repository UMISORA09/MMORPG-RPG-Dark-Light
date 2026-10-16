// ==============================================================================
// VirtualJoystick.jsx — Mobile Touch Controller & Floating Analog (JSX Component)
// ==============================================================================

import React, { useRef, useEffect } from 'react';

export default function VirtualJoystick({
  onMoveLeft,
  onMoveRight,
  onStopMove,
  onAttack,
  onAnimeSkill,
  onFlameWave,
  onDodge,
  cooldowns
}) {
  const stickRef = useRef(null);
  const zoneRef = useRef(null);

  useEffect(() => {
    const zone = zoneRef.current;
    const stick = stickRef.current;
    if (!zone || !stick) return;

    let touchActive = false;
    let startX = 0;

    const handleTouchStart = (e) => {
      touchActive = true;
      startX = e.touches[0].clientX;
    };

    const handleTouchMove = (e) => {
      if (!touchActive) return;
      const currentX = e.touches[0].clientX;
      const diffX = currentX - startX;
      const clampedX = Math.max(-35, Math.min(35, diffX));
      stick.style.transform = `translate(calc(-50% + ${clampedX}px), -50%)`;

      if (clampedX < -10) {
        onMoveLeft();
      } else if (clampedX > 10) {
        onMoveRight();
      } else {
        onStopMove();
      }
    };

    const handleTouchEnd = () => {
      touchActive = false;
      stick.style.transform = 'translate(-50%, -50%)';
      onStopMove();
    };

    zone.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      zone.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [onMoveLeft, onMoveRight, onStopMove]);

  return (
    <div className="touch-controls">
      {/* Left Touch Joystick */}
      <div className="touch-joystick-zone" ref={zoneRef}>
        <div className="touch-stick" ref={stickRef} />
      </div>

      {/* Right Touch Actions Arc */}
      <div className="touch-actions">
        <div
          className="touch-btn btn-k"
          onTouchStart={(e) => { e.preventDefault(); onAnimeSkill(); }}
          title="Anime Skill"
        >
          ✨
          {cooldowns.skillK > 0 && <span className="cd-overlay">{cooldowns.skillK.toFixed(0)}</span>}
        </div>

        <div
          className="touch-btn btn-l"
          onTouchStart={(e) => { e.preventDefault(); onFlameWave(); }}
          title="Kiếm Khí"
        >
          🔥
          {cooldowns.skillL > 0 && <span className="cd-overlay">{cooldowns.skillL.toFixed(0)}</span>}
        </div>

        <div
          className="touch-btn btn-j"
          onTouchStart={(e) => { e.preventDefault(); onAttack(); }}
          title="Chém Thường"
        >
          ⚔️
        </div>

        <div
          className="touch-btn btn-space"
          onTouchStart={(e) => { e.preventDefault(); onDodge(); }}
          title="Lướt Né"
        >
          💨
          {cooldowns.dodgeSpace > 0 && <span className="cd-overlay">{cooldowns.dodgeSpace.toFixed(0)}</span>}
        </div>
      </div>
    </div>
  );
}

