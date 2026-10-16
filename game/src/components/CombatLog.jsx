// ==============================================================================
// CombatLog.jsx — Scrolling Live Battle Event Stream (JSX Component)
// ==============================================================================

import React from 'react';

export default function CombatLog({ events }) {
  if (!events || events.length === 0) return null;

  return (
    <div className="combat-log-container">
      {events.slice(-4).map((ev) => (
        <div key={ev.id} className={`log-line log-${ev.type}`}>
          <span className="log-time">[{ev.time}]</span>
          <span>{ev.text}</span>
        </div>
      ))}
    </div>
  );
}

