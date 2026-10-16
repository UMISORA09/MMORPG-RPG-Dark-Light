// ==============================================================================
// GameHUD.jsx — Dual-Layer Health Bar & Boss Status Display (JSX Component)
// ==============================================================================

import React from 'react';

export default function GameHUD({
  knight,
  slime,
  currentAnimText
}) {
  const kPct = Math.max(0, (knight.hp / knight.maxHp) * 100);
  const kLagPct = Math.max(0, (knight.lagHp / knight.maxHp) * 100);
  const kEnergyPct = Math.max(0, (knight.energy / knight.maxEnergy) * 100);

  const sPct = Math.max(0, (slime.hp / slime.maxHp) * 100);
  const sLagPct = Math.max(0, (slime.lagHp / slime.maxHp) * 100);
  const sPoisePct = Math.max(0, (slime.poise / slime.maxPoise) * 100);

  return (
    <div className="hud-header">
      {/* Player Frame Card */}
      <div className="hud-card">
        <div className="card-title player-title">
          <span>⚔️ CHIBI KNIGHT</span>
          <span style={{ fontSize: '10px', color: '#94a3b8' }}>(Lv.1)</span>
        </div>

        {/* Dual-layer HP bar (Bonfire UseBarLife) */}
        <div className="hp-bar-container">
          <div className="hp-bar-lag" style={{ width: `${kLagPct}%` }} />
          <div className="hp-bar-fill" style={{ width: `${kPct}%` }} />
        </div>

        {/* Energy Bar for Skills */}
        <div className="energy-bar-container">
          <div className="energy-fill" style={{ width: `${kEnergyPct}%` }} />
        </div>

        <div className="stat-subtext">
          <span>{currentAnimText}</span>
          <span>{Math.round(knight.hp)} / {knight.maxHp} HP</span>
        </div>
      </div>

      {/* Boss Frame Card */}
      <div className="hud-card" style={{ textAlign: 'right' }}>
        <div className="card-title boss-title" style={{ justifyContent: 'flex-end' }}>
          <span>👹 ONI SLIME BOSS</span>
          <span style={{ fontSize: '10px', color: '#fca5a5' }}>(Lv.5)</span>
        </div>

        {/* Dual-layer HP bar */}
        <div className="hp-bar-container">
          <div className="hp-bar-lag" style={{ width: `${sLagPct}%` }} />
          <div className="hp-bar-fill boss-fill" style={{ width: `${sPct}%` }} />
        </div>

        {/* Boss Stagger / Poise Gauge */}
        <div className="poise-bar-container">
          <div className="poise-fill" style={{ width: `${sPoisePct}%` }} />
        </div>

        <div className="stat-subtext" style={{ justifyContent: 'flex-end', gap: '10px' }}>
          <span className={`ai-badge state-${slime.aiState}`}>
            {slime.isStaggered ? 'STAGGERED!' : slime.aiState}
          </span>
          <span>{Math.round(slime.hp)} / {slime.maxHp} HP</span>
        </div>
      </div>
    </div>
  );
}

