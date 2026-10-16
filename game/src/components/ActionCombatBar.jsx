// ==============================================================================
// ActionCombatBar.jsx — Interactive Controls & Skill Triggers (JSX Component)
// ==============================================================================

import React from 'react';

export default function ActionCombatBar({
  onAttack,
  onAnimeSkill,
  onFlameWave,
  onDodge,
  onToggleDebug,
  onToggleLighting,
  onToggleSound,
  onRespawn,
  cooldowns,
  debugMode,
  dynamicLighting,
  isMuted
}) {
  return (
    <div className="controls-overlay">
      <button className="btn" onClick={onAttack} title="Đòn đánh cơ bản [J]">
        ⚔️ [J] Chém Đại Kiếm
      </button>

      <button className="btn btn-anime" onClick={onAnimeSkill} title="Vũ điệu kiếm Anime [K]">
        ✨ [K] Anime Skill VFX {cooldowns.skillK > 0 && `(${cooldowns.skillK.toFixed(1)}s)`}
      </button>

      <button className="btn btn-flame" onClick={onFlameWave} title="Kiếm khí bay tầm xa Bonfire [L]">
        🔥 [L] Kiếm Khí Long Bá {cooldowns.skillL > 0 && `(${cooldowns.skillL.toFixed(1)}s)`}
      </button>

      <button className="btn btn-secondary" onClick={onDodge} title="Lướt né bất tử [Space]">
        💨 [Space] Lướt Né {cooldowns.dodgeSpace > 0 && `(${cooldowns.dodgeSpace.toFixed(1)}s)`}
      </button>

      <button className="btn btn-secondary" onClick={onToggleDebug} title="Bật tắt debug tầm nhìn và hitbox [F1]">
        🛠️ [F1] Debug <span className={`debug-badge ${debugMode ? 'badge-on' : 'badge-off'}`}>{debugMode ? 'BẬT' : 'TẮT'}</span>
      </button>

      <button className="btn btn-secondary" onClick={onToggleLighting} title="Bật tắt ánh sáng hắc ám đêm tối">
        💡 Ánh Sáng <span className={`debug-badge ${dynamicLighting ? 'badge-on' : 'badge-off'}`}>{dynamicLighting ? 'BẬT' : 'TẮT'}</span>
      </button>

      <button className="btn btn-secondary" onClick={onToggleSound} title="Bật tắt âm thanh Web Audio SFX">
        {isMuted ? '🔇 Tắt Tiếng' : '🔊 Âm Thanh'}
      </button>

      <button className="btn btn-secondary" onClick={onRespawn} title="Hồi sinh quái vật [R]">
        🔄 [R] Hồi Sinh
      </button>
    </div>
  );
}

