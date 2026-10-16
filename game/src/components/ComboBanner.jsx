// ==============================================================================
// ComboBanner.jsx — Real-time Combo Multiplier & Rank Display (JSX Component)
// ==============================================================================

import React from 'react';

export default function ComboBanner({ comboCount, comboTimer, comboMultiplier }) {
  if (comboCount <= 1) return null;

  let rank = 'C';
  let rankClass = 'rank-c';
  if (comboCount >= 15) {
    rank = 'SSS'; rankClass = 'rank-sss';
  } else if (comboCount >= 10) {
    rank = 'S'; rankClass = 'rank-s';
  } else if (comboCount >= 6) {
    rank = 'A'; rankClass = 'rank-a';
  } else if (comboCount >= 3) {
    rank = 'B'; rankClass = 'rank-b';
  }

  const timerPct = Math.max(0, Math.min(100, (comboTimer / 3.0) * 100));

  return (
    <div className="combo-banner combo-active">
      <div className="combo-digits">
        {comboCount}<span>HITS</span>
      </div>

      <div className={`combo-rank ${rankClass}`}>
        RANK {rank} ({comboMultiplier.toFixed(1)}x DMG)
      </div>

      <div className="combo-timer-bar">
        <div className="timer-fill" style={{ width: `${timerPct}%` }} />
      </div>
    </div>
  );
}

