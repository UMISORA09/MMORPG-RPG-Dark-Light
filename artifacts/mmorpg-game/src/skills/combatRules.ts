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

export const MAX_LEVEL = 999;

/**
 * 2. EXP cần thiết để đạt cấp độ tiếp theo (Đường cong đa giai đoạn Lv.1 -> Lv.999):
 * - Lv.1..3: Giữ nguyên [100, 150, 225] đảm bảo tương thích hoàn hảo với kiểm thử cũ.
 * - Lv.4..50 (Tân Thủ & Lục Địa): Tăng trưởng mượt mà.
 * - Lv.51..300 (Sa Mạc, Ai Cập & Đại Dương): Lũy tiến thử thách.
 * - Lv.301..999 (Thần Thoại & Siêu Việt): Đường cong EXP hàm mũ kết hợp săn Boss.
 * - Lv.999: Đạt giới hạn tối thượng (Max Level).
 */
export function getExpForLevel(level: number): number {
  if (level < 1) return 100;
  if (level >= MAX_LEVEL) return Number.MAX_SAFE_INTEGER;

  if (level === 1) return 100;
  if (level === 2) return 150;
  if (level === 3) return 225;

  if (level <= 50) {
    const offset = level - 3;
    return Math.floor(225 + offset * 120 + Math.pow(offset, 1.8) * 45);
  }

  const base50 = Math.floor(225 + 47 * 120 + Math.pow(47, 1.8) * 45);
  if (level <= 300) {
    const offset = level - 50;
    return Math.floor(base50 + offset * 1500 + Math.pow(offset, 1.95) * 450);
  }

  const base300 = Math.floor(base50 + 250 * 1500 + Math.pow(250, 1.95) * 450);
  const offset = level - 300;
  return Math.floor(base300 + offset * 12000 + Math.pow(offset, 2.15) * 1800);
}

export const getExpRequiredForLevel = getExpForLevel;

/**
 * 3. Tính toán thăng cấp lũy kế từ điểm kinh nghiệm nhận được (Authoritative Level-Up Lv.1 -> Lv.999):
 * Mỗi cấp tăng: 5 Điểm Tiềm Năng (statPoints) + 1 Điểm Kỹ Năng (skillPoints).
 */
export function calculateLevelProgression(
  currentExp: number,
  currentLevel: number,
  expGained: number
): LevelProgressionResult & { statPointsGained: number; skillPointsGained: number } {
  let newExp = Math.max(0, currentExp + expGained);
  let newLevel = Math.min(MAX_LEVEL, Math.max(1, currentLevel));
  let leveledUp = false;
  let statPointsGained = 0;
  let skillPointsGained = 0;

  if (newLevel >= MAX_LEVEL) {
    return {
      newLevel: MAX_LEVEL,
      newExp: 0,
      leveledUp: false,
      expToNextLevel: Number.MAX_SAFE_INTEGER,
      statPointsGained: 0,
      skillPointsGained: 0,
    };
  }

  let expToNext = getExpForLevel(newLevel);

  while (newLevel < MAX_LEVEL && newExp >= expToNext) {
    newExp -= expToNext;
    newLevel++;
    leveledUp = true;
    statPointsGained += 5;
    skillPointsGained += 1;
    expToNext = getExpForLevel(newLevel);
  }

  return {
    newLevel,
    newExp: newLevel >= MAX_LEVEL ? 0 : newExp,
    leveledUp,
    expToNextLevel: expToNext,
    statPointsGained,
    skillPointsGained,
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
