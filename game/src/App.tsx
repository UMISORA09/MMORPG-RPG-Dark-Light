// ==============================================================================
// App.tsx — Master Bonfire 2.5D ARPG Game Application (React TSX Component)
// ==============================================================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GameCanvas, type GameCanvasHandle } from './components/GameCanvas';
import GameHUD from './components/GameHUD';
import ActionCombatBar from './components/ActionCombatBar';
import VirtualJoystick from './components/VirtualJoystick';
import ComboBanner from './components/ComboBanner';
import CombatLog from './components/CombatLog';
import { soundSynth } from './audio/SoundSynth';
import type { KnightState, SlimeBossState, CombatEvent, GameStats, SkillCooldowns } from './types';

export default function App() {
  const canvasRef = useRef<GameCanvasHandle | null>(null);

  // High-Level React State
  const [knight, setKnight] = useState<KnightState>({
    x: 200,
    y: 270,
    facing: 1,
    currentAnim: 'knight_idle',
    frameIndex: 0,
    animTimer: 0,
    isAttacking: false,
    speed: 135,
    vx_force: 0,
    maxHp: 100,
    hp: 100,
    lagHp: 100,
    isInvincible: false,
    invincibleTimer: 0,
    dodgeTimer: 0,
    energy: 100,
    maxEnergy: 100,
    vfxSpawnedThisAttack: false,
  });

  const [slime, setSlime] = useState<SlimeBossState>({
    x: 750,
    spawnX: 750,
    y: 270,
    facing: -1,
    currentAnim: 'slime_idle',
    frameIndex: 0,
    animTimer: 0,
    maxHp: 150,
    hp: 150,
    lagHp: 150,
    isDead: false,
    vx_force: 0,
    speedPatrol: 45,
    speedChase: 100,
    aiState: 'patrol',
    visionRadius: 280,
    attackRadius: 65,
    attackCooldown: 1.6,
    attackCooldownTimer: 0,
    patrolTimer: 2.0,
    patrolDirection: -1,
    isWindingUp: false,
    windupTimer: 0,
    poise: 100,
    maxPoise: 100,
    isStaggered: false,
    staggerTimer: 0,
  });

  const [combatEvents, setCombatEvents] = useState<CombatEvent[]>([
    { id: '1', time: '00:01', text: 'Chào mừng bước vào đấu trường Chiến Long Bá!', type: 'skill' }
  ]);

  const [gameStats, setGameStats] = useState<GameStats>({
    comboCount: 0,
    comboTimer: 0,
    comboMultiplier: 1.0,
    totalDamage: 0,
    kills: 0,
  });

  const [cooldowns, setCooldowns] = useState<SkillCooldowns>({
    skillK: 0,
    skillL: 0,
    dodgeSpace: 0,
  });

  const [debugMode, setDebugMode] = useState<boolean>(true);
  const [dynamicLighting, setDynamicLighting] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Add Combat Event
  const addCombatEvent = useCallback((event: Omit<CombatEvent, 'id' | 'time'>) => {
    const d = new Date();
    const time = `${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
    setCombatEvents((prev) => [...prev.slice(-12), { ...event, id: Math.random().toString(), time }]);
  }, []);

  // Combo Streak Hit
  const handleComboHit = useCallback(() => {
    setGameStats((prev) => {
      const nextCount = prev.comboCount + 1;
      const nextMult = 1.0 + Math.min(1.5, Math.floor(nextCount / 3) * 0.15);
      return {
        ...prev,
        comboCount: nextCount,
        comboTimer: 2.8,
        comboMultiplier: nextMult,
      };
    });
  }, []);

  // Skill Execution Wrappers
  const handleAttack = useCallback(() => {
    canvasRef.current?.triggerAttack();
  }, []);

  const handleAnimeSkill = useCallback(() => {
    if (cooldowns.skillK > 0) return;
    canvasRef.current?.triggerAnimeSkill();
    setCooldowns((prev) => ({ ...prev, skillK: 2.2 }));
  }, [cooldowns.skillK]);

  const handleFlameWave = useCallback(() => {
    if (cooldowns.skillL > 0) return;
    canvasRef.current?.triggerFlameWave();
    setCooldowns((prev) => ({ ...prev, skillL: 3.0 }));
  }, [cooldowns.skillL]);

  const handleDodge = useCallback(() => {
    if (cooldowns.dodgeSpace > 0) return;
    canvasRef.current?.triggerDodge();
    setCooldowns((prev) => ({ ...prev, dodgeSpace: 1.5 }));
  }, [cooldowns.dodgeSpace]);

  const handleRespawn = useCallback(() => {
    canvasRef.current?.respawnSlime();
  }, []);

  // Keyboard Event Routing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'a' || e.key === 'ArrowLeft') canvasRef.current?.setMoveInput(true, false);
      if (k === 'd' || e.key === 'ArrowRight') canvasRef.current?.setMoveInput(false, true);

      if (k === 'j') { e.preventDefault(); handleAttack(); }
      if (k === 'k') { e.preventDefault(); handleAnimeSkill(); }
      if (k === 'l') { e.preventDefault(); handleFlameWave(); }
      if (e.code === 'Space') { e.preventDefault(); handleDodge(); }
      if (k === 'r') { e.preventDefault(); handleRespawn(); }
      if (e.key === 'F1') { e.preventDefault(); setDebugMode((prev) => !prev); }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'a' || e.key === 'ArrowLeft' || k === 'd' || e.key === 'ArrowRight') {
        canvasRef.current?.setMoveInput(false, false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleAttack, handleAnimeSkill, handleFlameWave, handleDodge, handleRespawn]);

  // Tick Cooldowns & Combo Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCooldowns((prev) => ({
        skillK: Math.max(0, prev.skillK - 0.1),
        skillL: Math.max(0, prev.skillL - 0.1),
        dodgeSpace: Math.max(0, prev.dodgeSpace - 0.1),
      }));

      setGameStats((prev) => {
        if (prev.comboTimer > 0) {
          const nextTimer = prev.comboTimer - 0.1;
          if (nextTimer <= 0) {
            return { ...prev, comboTimer: 0, comboCount: 0, comboMultiplier: 1.0 };
          }
          return { ...prev, comboTimer: nextTimer };
        }
        return prev;
      });
    }, 100);

    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <div className="game-viewport">
        {/* Top HUD Cards (Bonfire Dual-Layer Bars) */}
        <GameHUD
          knight={knight}
          slime={slime}
          currentAnimText={`${knight.currentAnim} [${knight.frameIndex}]`}
        />

        {/* 60FPS Canvas Core Engine */}
        <GameCanvas
          ref={canvasRef}
          knightState={knight}
          slimeState={slime}
          onKnightUpdate={setKnight}
          onSlimeUpdate={setSlime}
          onCombatEvent={addCombatEvent}
          onComboHit={handleComboHit}
          comboMultiplier={gameStats.comboMultiplier}
          debugMode={debugMode}
          dynamicLighting={dynamicLighting}
        />

        {/* Dynamic Combo Rank Banner */}
        <ComboBanner
          comboCount={gameStats.comboCount}
          comboTimer={gameStats.comboTimer}
          comboMultiplier={gameStats.comboMultiplier}
        />

        {/* Scrolling Combat Event Log */}
        <CombatLog events={combatEvents} />

        {/* Mobile Virtual Joystick & Touch Pad */}
        <VirtualJoystick
          onMoveLeft={() => canvasRef.current?.setMoveInput(true, false)}
          onMoveRight={() => canvasRef.current?.setMoveInput(false, true)}
          onStopMove={() => canvasRef.current?.setMoveInput(false, false)}
          onAttack={handleAttack}
          onAnimeSkill={handleAnimeSkill}
          onFlameWave={handleFlameWave}
          onDodge={handleDodge}
          cooldowns={cooldowns}
        />
      </div>

      {/* Action Bar & Tooling */}
      <ActionCombatBar
        onAttack={handleAttack}
        onAnimeSkill={handleAnimeSkill}
        onFlameWave={handleFlameWave}
        onDodge={handleDodge}
        onToggleDebug={() => setDebugMode((prev) => !prev)}
        onToggleLighting={() => setDynamicLighting((prev) => !prev)}
        onToggleSound={() => {
          setIsMuted((prev) => {
            soundSynth.setMuted(!prev);
            return !prev;
          });
        }}
        onRespawn={handleRespawn}
        cooldowns={cooldowns}
        debugMode={debugMode}
        dynamicLighting={dynamicLighting}
        isMuted={isMuted}
      />

      <div className="keyboard-hint">
        Phím: <kbd>A</kbd>/<kbd>D</kbd> Chạy · <kbd>Space</kbd> Lướt né · <kbd>J</kbd> Chém thường · <kbd>K</kbd> Skill Anime · <kbd>L</kbd> Kiếm khí đạn đạo · <kbd>F1</kbd> Debug Bonfire · <kbd>R</kbd> Reset
      </div>
    </>
  );
}

