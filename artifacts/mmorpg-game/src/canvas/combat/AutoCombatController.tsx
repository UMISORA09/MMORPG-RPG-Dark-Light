// ==============================================================================
// AutoCombatController.tsx — Vòng Lặp AI Tự Động Chiến Đấu & Treo Máy Thông Minh
// Tự tìm quái (18m), giữ cự ly, xoay kỹ năng Q-E-R-T, né Telegraph, tự bơm HP/MP & lọc nhặt đồ
// ==============================================================================

import { memo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameWorldStore } from "@/stores/useGameWorldStore";

const clampMapBounds = (pos: THREE.Vector3) => {
  pos.x = Math.max(-48, Math.min(48, pos.x));
  pos.z = Math.max(-48, Math.min(48, pos.z));
};

export const AutoCombatController = memo(function AutoCombatController() {
  const autoCombatEnabled = useGameWorldStore((s) => s.autoCombatEnabled);
  const autoCombatSettings = useGameWorldStore((s) => s.autoCombatSettings);
  const isManualMovementOverridden = useGameWorldStore((s) => s.isManualMovementOverridden);
  const manualMovementOverrideTimer = useGameWorldStore((s) => s.manualMovementOverrideTimer);

  const playerPosition = useGameWorldStore((s) => s.playerPosition);
  const playerClassId = useGameWorldStore((s) => s.playerClassId);
  const playerLevel = useGameWorldStore((s) => s.playerLevel);
  const playerHealth = useGameWorldStore((s) => s.playerHealth);
  const playerMaxHealth = useGameWorldStore((s) => s.playerMaxHealth);
  const playerPp = useGameWorldStore((s) => s.playerPp);
  const playerMaxPp = useGameWorldStore((s) => s.playerMaxPp);
  const feverGauge = useGameWorldStore((s) => s.feverGauge);

  const nearbyTargetEnemies = useGameWorldStore((s) => s.nearbyTargetEnemies);
  const monsterMarkers = useGameWorldStore((s) => s.monsterMarkers);
  const droppedLoot = useGameWorldStore((s) => s.droppedLoot);

  const triggerComboAttack = useGameWorldStore((s) => s.triggerComboAttack);
  const triggerSkill = useGameWorldStore((s) => s.triggerSkill);
  const activateFever = useGameWorldStore((s) => s.activateFever);
  const useQuickPotionHp = useGameWorldStore((s) => s.useQuickPotionHp);
  const useQuickPotionMp = useGameWorldStore((s) => s.useQuickPotionMp);
  const pickUpNearbyLoot = useGameWorldStore((s) => s.pickUpNearbyLoot);
  const updatePlayerPosition = useGameWorldStore((s) => s.updatePlayerPosition);
  const setAutoCombatStatusText = useGameWorldStore((s) => s.setAutoCombatStatusText);

  // Timers
  const lastPotionHpTime = useRef<number>(0);
  const lastPotionMpTime = useRef<number>(0);
  const lastAttackTime = useRef<number>(0);
  const lastLootCheckTime = useRef<number>(0);
  const currentPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const isFacingLeft = useRef<boolean>(false);

  useFrame((_, delta) => {
    // 1. Quản lý đếm lùi quyền điều khiển thủ công (Manual WASD Override 1.2s)
    if (isManualMovementOverridden) {
      const nextTimer = manualMovementOverrideTimer - delta;
      if (nextTimer <= 0) {
        useGameWorldStore.setState({
          isManualMovementOverridden: false,
          manualMovementOverrideTimer: 0,
        });
      } else {
        useGameWorldStore.setState({ manualMovementOverrideTimer: nextTimer });
      }
    }

    if (!autoCombatEnabled) return;

    currentPos.current.copy(playerPosition);
    const now = performance.now();

    // 2. Tự Động Bơm Máu (HP) & Mana (MP)
    const hpRatio = playerHealth / Math.max(1, playerMaxHealth);
    if (hpRatio < (autoCombatSettings.hpThreshold / 100) && now - lastPotionHpTime.current > 1800) {
      lastPotionHpTime.current = now;
      useQuickPotionHp();
    }

    const mpRatio = playerPp / Math.max(1, playerMaxPp);
    if (mpRatio < (autoCombatSettings.mpThreshold / 100) && now - lastPotionMpTime.current > 1800) {
      lastPotionMpTime.current = now;
      useQuickPotionMp();
    }

    // 3. Tự Động Lọc & Nhặt Đồ (Loot Filter)
    if (now - lastLootCheckTime.current > 400 && droppedLoot.length > 0) {
      lastLootCheckTime.current = now;
      const minRarity = autoCombatSettings.lootFilterMinRarity;
      const rarityRank: Record<string, number> = {
        all: 0,
        common: 0,
        uncommon: 1,
        rare: 2,
        epic: 3,
        legendary: 4,
        miracle: 5,
      };
      const requiredRank = rarityRank[minRarity] || 0;

      // Tìm món đồ gần nhất đạt điều kiện bộ lọc
      let closestLoot: any = null;
      let minLootDist = 14.0;
      let closestLootX = 0;
      let closestLootZ = 0;

      for (const loot of droppedLoot) {
        const itemRank = rarityRank[loot.rarity?.toLowerCase() || "common"] || 0;
        if (itemRank >= requiredRank) {
          const lx = Array.isArray(loot.position) ? loot.position[0] : (loot.position as any)?.x ?? 0;
          const lz = Array.isArray(loot.position) ? loot.position[2] : (loot.position as any)?.z ?? 0;
          const d = Math.hypot(lx - currentPos.current.x, lz - currentPos.current.z);
          if (d < minLootDist) {
            minLootDist = d;
            closestLoot = loot;
            closestLootX = lx;
            closestLootZ = lz;
          }
        }
      }

      if (closestLoot) {
        if (minLootDist < 3.5) {
          pickUpNearbyLoot(4.0);
        } else if (!isManualMovementOverridden) {
          // Tự di chuyển nhẹ về phía vật phẩm rơi
          const dx = closestLootX - currentPos.current.x;
          const dz = closestLootZ - currentPos.current.z;
          const dist = Math.hypot(dx, dz);
          if (dist > 0.1) {
            const step = Math.min(dist, 5.0 * delta);
            currentPos.current.x += (dx / dist) * step;
            currentPos.current.z += (dz / dist) * step;
            isFacingLeft.current = dx < 0;
            clampMapBounds(currentPos.current);
            updatePlayerPosition(currentPos.current, isFacingLeft.current, "run");
            setAutoCombatStatusText("📦 Đang nhặt vật phẩm rơi...");
            return;
          }
        }
      }
    }

    // 4. Vòng Lặp Săn Quái & Chiến Đấu (Auto-Hunt State Machine)
    // Tìm quái còn sống gần nhất trong bán kính 18m
    let targetEnemy: any = null;
    let closestDist = autoCombatSettings.huntRadius || 18.0;

    // Quét từ monsterMarkers (tọa độ 3D thực tế)
    for (const marker of monsterMarkers) {
      const dist = Math.hypot(marker.x - currentPos.current.x, marker.z - currentPos.current.z);
      if (dist < closestDist) {
        closestDist = dist;
        targetEnemy = marker;
      }
    }

    if (!targetEnemy) {
      setAutoCombatStatusText("🔍 Đang tìm quái vật trong bán kính 18m...");
      return;
    }

    setAutoCombatStatusText(`⚔️ Mục tiêu: ${targetEnemy.name} (${closestDist.toFixed(1)}m)`);

    // Khoảng cách duy trì tối ưu theo hệ phái (Xạ thủ 6.5m, Cận chiến 2.2m)
    const isRanged = playerClassId === "gunner";
    const desiredDistance = isRanged ? 6.2 : 2.2;

    const dx = targetEnemy.x - currentPos.current.x;
    const dz = targetEnemy.z - currentPos.current.z;
    const distToTarget = Math.hypot(dx, dz);

    // Di chuyển áp sát hoặc giữ khoảng cách thả diều
    if (!isManualMovementOverridden && distToTarget > desiredDistance) {
      const step = Math.min(distToTarget - desiredDistance + 0.2, 5.2 * delta);
      currentPos.current.x += (dx / distToTarget) * step;
      currentPos.current.z += (dz / distToTarget) * step;
      isFacingLeft.current = dx < 0;
      clampMapBounds(currentPos.current);
      updatePlayerPosition(currentPos.current, isFacingLeft.current, "run");
    } else {
      isFacingLeft.current = dx < 0;
    }

    // Xoay vòng Kỹ năng & Combo thông minh khi đã vào tầm đánh
    if (distToTarget <= desiredDistance + 1.2 && now - lastAttackTime.current > 320) {
      lastAttackTime.current = now;

      // 1. Kích hoạt Nộ Khí Cuồng Nộ nếu đầy 100%
      if (feverGauge >= 100) {
        activateFever();
        return;
      }

      // 2. Xoay tua kỹ năng Q, E, R, T xen kẽ combo đánh thường J
      const roll = Math.random();
      if (roll < 0.25) {
        triggerSkill(3); // Ult / Skill 3
      } else if (roll < 0.50) {
        triggerSkill(2); // Skill 2
      } else if (roll < 0.75) {
        triggerSkill(1); // Skill 1
      } else {
        triggerComboAttack(); // Combo 1-2-3
      }
    }
  });

  return null;
});
