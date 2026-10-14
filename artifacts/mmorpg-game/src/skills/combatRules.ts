/**
 * Quy chuẩn Quy tắc Combat Dùng Chung (Shared Combat Rules - Client & Server)
 * Pure functions: Độc lập với Three.js / React DOM, phục vụ tính toán sát thương,
 * thăng cấp, phần thưởng và cooldown.
 */

export interface DamageCalculationOptions {
  multiplier?: number;
  isCritical?: boolean;
  isStaggered?: boolean;
  critChance?: number;
  randomVariance?: number;
}

export interface DamageCalculationResult {
  damage: number;
  isCritical: boolean;
  isStaggerBonus: boolean;
}

export interface LevelProgressionResult {
  newLevel: number;
  newExp: number;
  leveledUp: boolean;
  expToNextLevel: number;
}

/**
 * 1. Tính toán sát thương chuẩn:
 * damage = max(1, atk - floor(def * 0.4)) * skillMultiplier * (crit ? 1.8 : 1.0) * (stagger ? 1.5 : 1.0)
 */
export function calculateDamage(
  attackerAtk: number,
  defenderDef: number,
  options?: DamageCalculationOptions
): DamageCalculationResult {
  const multiplier = options?.multiplier ?? 1.0;
  const isStaggered = options?.isStaggered ?? false;
  const critChance = options?.critChance ?? 0.15;
  const isCritical =
    options?.isCritical !== undefined ? options.isCritical : Math.random() < critChance;
  const variance = options?.randomVariance ?? 0;

  const baseDmg = Math.max(1, attackerAtk - Math.floor(defenderDef * 0.4));
  let finalDmg = baseDmg * multiplier;

  if (isCritical) {
    finalDmg = Math.floor(finalDmg * 1.8);
  }

  if (isStaggered) {
    finalDmg = Math.floor(finalDmg * 1.5);
  }

  if (variance > 0) {
    const factor = 1 - variance + Math.random() * (variance * 2);
    finalDmg = Math.floor(finalDmg * factor);
  }

  return {
    damage: Math.max(1, Math.round(finalDmg)),
    isCritical,
    isStaggerBonus: isStaggered,
  };
}

/**
 * 2. EXP cần thiết để đạt cấp độ tiếp theo:
 * floor(100 * 1.5^(level - 1))
 */
export function getExpForLevel(level: number): number {
  if (level < 1) return 100;
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

/**
 * 3. Tính toán thăng cấp lũy kế từ điểm kinh nghiệm nhận được:
 */
export function calculateLevelProgression(
  currentExp: number,
  currentLevel: number,
  expGained: number
): LevelProgressionResult {
  let newExp = Math.max(0, currentExp + expGained);
  let newLevel = Math.max(1, currentLevel);
  let leveledUp = false;
  let expToNext = getExpForLevel(newLevel);

  while (newExp >= expToNext) {
    newExp -= expToNext;
    newLevel++;
    leveledUp = true;
    expToNext = getExpForLevel(newLevel);
  }

  return {
    newLevel,
    newExp,
    leveledUp,
    expToNextLevel: expToNext,
  };
}

/**
 * 4. Kiểm tra hồi chiêu kỹ năng (Cooldown Check)
 */
export function isSkillOnCooldown(
  lastCastTimestampMs: number,
  cooldownSeconds: number,
  currentTimestampMs: number = Date.now()
): { onCooldown: boolean; remainingSeconds: number } {
  const elapsedSec = (currentTimestampMs - lastCastTimestampMs) / 1000;
  if (elapsedSec >= cooldownSeconds) {
    return { onCooldown: false, remainingSeconds: 0 };
  }
  return {
    onCooldown: true,
    remainingSeconds: Math.max(0, +(cooldownSeconds - elapsedSec).toFixed(1)),
  };
}
