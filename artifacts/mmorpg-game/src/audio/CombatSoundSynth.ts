// ==============================================================================
// Pure Web Audio API SFX Synthesizer for 2.5D Real-Time Combat
// Zero external audio files required — Ultra-low latency procedural sound
// ==============================================================================

import type { SFXSynthPreset } from "../skills/types";

class CombatSoundSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  constructor() {
    if (typeof window !== "undefined") {
      this.isMuted = localStorage.getItem("game_sound_muted") === "true";
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (typeof window !== "undefined") {
      localStorage.setItem("game_sound_muted", muted ? "true" : "false");
    }
  }

  public toggleMute(): boolean {
    const next = !this.isMuted;
    this.setMuted(next);
    return next;
  }

  public isMutedState(): boolean {
    return this.isMuted;
  }

  public play(preset: SFXSynthPreset, volume: number = 0.35) {
    if (this.isMuted) return;

    // Decouple AudioContext creation & synthesis from synchronous event handlers.
    // This allows the browser to paint the frame immediately (<16ms) and eliminates INP (Interaction to Next Paint) latency!
    setTimeout(() => {
      const ctx = this.getContext();
      if (!ctx) return;

      try {
        const now = ctx.currentTime;
        switch (preset) {
          case "laser_pew":
            this.synthesizeLaserPew(ctx, now, volume);
            break;
          case "blade_slash":
            this.synthesizeBladeSlash(ctx, now, volume);
            break;
          case "heavy_slam":
            this.synthesizeHeavySlam(ctx, now, volume);
            break;
          case "dragon_roar":
            this.synthesizeDragonRoar(ctx, now, volume);
            break;
          case "holy_bell":
            this.synthesizeHolyBell(ctx, now, volume);
            break;
          case "coin_chime":
            this.synthesizeCoinChime(ctx, now, volume);
            break;
          case "loot_drop":
            this.synthesizeLootDrop(ctx, now, volume);
            break;
          case "rarity_chime":
            this.synthesizeRarityChime(ctx, now, volume);
            break;
          case "level_up_fanfare":
            this.synthesizeLevelUpFanfare(ctx, now, volume);
            break;
        }
      } catch {
        // Audio autoplay policy fallback
      }
    }, 0);
  }

  // ── Laser Pew: Rapid pitch sweep downwards ─────────────────────────────────
  private synthesizeLaserPew(ctx: AudioContext, t: number, vol: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.18);

    gain.gain.setValueAtTime(vol * 0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.22);
  }

  // ── Blade Slash: Filtered white noise with metallic ping ───────────────────
  private synthesizeBladeSlash(ctx: AudioContext, t: number, vol: number) {
    // Metal whoosh
    const bufferSize = ctx.sampleRate * 0.15;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1800, t);
    filter.frequency.exponentialRampToValueAtTime(600, t + 0.15);
    filter.Q.setValueAtTime(3.0, t);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(vol * 1.1, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    whiteNoise.start(t);
    whiteNoise.stop(t + 0.16);

    // High metal ring
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(2400, t);
    osc.frequency.exponentialRampToValueAtTime(1800, t + 0.12);

    oscGain.gain.setValueAtTime(vol * 0.4, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.14);
  }

  // ── Heavy Slam: Sub-bass boom with distortion punch ────────────────────────
  private synthesizeHeavySlam(ctx: AudioContext, t: number, vol: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(38, t + 0.35);

    gain.gain.setValueAtTime(vol * 1.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.42);
  }

  // ── Dragon Roar: Growling frequency modulated oscillator ───────────────────
  private synthesizeDragonRoar(ctx: AudioContext, t: number, vol: number) {
    const carrier = ctx.createOscillator();
    const modulator = ctx.createOscillator();
    const modGain = ctx.createGain();
    const masterGain = ctx.createGain();

    carrier.type = "sawtooth";
    carrier.frequency.setValueAtTime(160, t);
    carrier.frequency.exponentialRampToValueAtTime(80, t + 0.6);

    modulator.type = "square";
    modulator.frequency.setValueAtTime(45, t);

    modGain.gain.setValueAtTime(120, t);

    modulator.connect(carrier.frequency);

    masterGain.gain.setValueAtTime(vol * 1.2, t);
    masterGain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

    carrier.connect(masterGain);
    masterGain.connect(ctx.destination);

    carrier.start(t);
    modulator.start(t);
    carrier.stop(t + 0.7);
    modulator.stop(t + 0.7);
  }

  // ── Holy Bell: Shimmering resonant chime with harmonic overtones ───────────
  private synthesizeHolyBell(ctx: AudioContext, t: number, vol: number) {
    const freqs = [880, 1760, 2640];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);

      const decay = 0.8 + idx * 0.4;
      gain.gain.setValueAtTime((vol * 0.6) / (idx + 1), t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + decay);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + decay);
    });
  }

  // ── Coin Chime: Classic double ping ────────────────────────────────────────
  private synthesizeCoinChime(ctx: AudioContext, t: number, vol: number) {
    const ping1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    ping1.type = "sine";
    ping1.frequency.setValueAtTime(987.77, t); // B5
    gain1.gain.setValueAtTime(vol * 0.6, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    ping1.connect(gain1);
    gain1.connect(ctx.destination);
    ping1.start(t);
    ping1.stop(t + 0.16);

    const ping2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    ping2.type = "sine";
    ping2.frequency.setValueAtTime(1318.51, t + 0.08); // E6
    gain2.gain.setValueAtTime(vol * 0.7, t + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    ping2.connect(gain2);
    gain2.connect(ctx.destination);
    ping2.start(t + 0.08);
    ping2.stop(t + 0.36);
  }

  // ── Level Up Fanfare: Major triad arpeggio ─────────────────────────────────
  private synthesizeLevelUpFanfare(ctx: AudioContext, t: number, vol: number) {
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const startT = t + idx * 0.09;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, startT);

      gain.gain.setValueAtTime(vol * 0.7, startT);
      gain.gain.exponentialRampToValueAtTime(0.001, startT + (idx === 3 ? 0.6 : 0.25));

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startT);
      osc.stop(startT + 0.65);
    });
  }

  // ── Loot Drop: Metallic item ground impact & resonance ────────────────────
  private synthesizeLootDrop(ctx: AudioContext, t: number, vol: number) {
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(1480, t);
    osc1.frequency.exponentialRampToValueAtTime(880, t + 0.12);
    gain1.gain.setValueAtTime(vol * 0.75, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(t);
    osc1.stop(t + 0.15);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(1175, t + 0.05);
    osc2.frequency.exponentialRampToValueAtTime(660, t + 0.18);
    gain2.gain.setValueAtTime(vol * 0.6, t + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t + 0.05);
    osc2.stop(t + 0.23);
  }

  // ── Rarity Chime: Shimmering celestial harmony for Epic / Legendary ────────
  private synthesizeRarityChime(ctx: AudioContext, t: number, vol: number) {
    const notes = [1046.5, 1318.5, 1567.98, 2093.0, 2637.0]; // C6, E6, G6, C7, E7
    notes.forEach((freq, idx) => {
      const startT = t + idx * 0.05;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startT);

      const decay = 0.65 + idx * 0.15;
      gain.gain.setValueAtTime((vol * 0.7) / (1 + idx * 0.2), startT);
      gain.gain.exponentialRampToValueAtTime(0.001, startT + decay);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startT);
      osc.stop(startT + decay + 0.05);
    });
  }
}

export const combatSoundSynth = new CombatSoundSynthesizer();

export function playCombatSFX(preset: SFXSynthPreset, volume: number = 0.35) {
  combatSoundSynth.play(preset, volume);
}

export function isAudioMuted(): boolean {
  return combatSoundSynth.isMutedState();
}

export function toggleAudioMute(): boolean {
  return combatSoundSynth.toggleMute();
}

export function setAudioMuted(muted: boolean): void {
  combatSoundSynth.setMuted(muted);
}
