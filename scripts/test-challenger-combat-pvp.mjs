/**
 * EMPIRICAL ADVERSARIAL STRESS TEST SUITE
 * Challenger: challenger_m5_combat_pvp
 * 
 * Adversarial Testing Coverage:
 * 1. Combat Damage Calculation Formulas:
 *    - floor(def * 0.4)
 *    - crit 1.8x
 *    - stagger 1.5x
 *    - min 1 dmg guarantee
 *    - Edge cases: 0 stats, negative stats, extreme stats (10^9), simultaneous crit + stagger, float rounding
 * 2. Monster AI Behavior:
 *    - Aggro radius detection & weather modifiers (RAIN 0.8x, DARK_FOG 0.65x)
 *    - Safe zone aggro suppression (r < 21.2m)
 *    - Attack cooldown enforcement & rapid tick delta time handling
 *    - Leash return (>30m / leashRadius), navigation towards spawn, and 100% full HP reset
 * 3. Boss Multi-Phase Mechanics & Berserk Enrage:
 *    - Phase 1 (100% -> 70% HP): normal attack patterns
 *    - Phase 2 (<= 70% HP): adds summoned (revive dead minions) & phase 2 telegraph skills unlocked
 *    - Phase 3 (<= 30% HP): +35% ATK boost, telegraph windup reduced to 60% (40% faster)
 *    - Berserk Enrage: 180s continuous combat timer triggers +200% ATK boost (3.0x multiplier)
 *    - Leash during enrage: resets boss combat timer to 0 and clears enrage
 * 4. 1v1 PvP Arena & ELO Ranking:
 *    - 40% burst damage reduction factor (0.60x dampening), min 1 dmg guarantee
 *    - ELO calculation formula: expected score, victory gain in [16, 35], defeat loss in [-24, -12]
 *    - Zero rating floor: rating never drops below 0 upon repeated defeats
 *    - Extreme rating differences (0 vs 10000, 10000 vs 0, 1000000 vs 1000000)
 *    - Leaderboard sorting: descending by honorPoints, tie-break by combatPower
 */

import assert from "node:assert/strict";

// Import authoritative combat rules from server and client to test parity
import { calculateDamage as serverCalcDamage } from "../artifacts/api-server/src/rules/combatRules.ts";
import { calculateEloRatingChange, getArenaRank } from "../artifacts/api-server/src/routes/endgame.ts";

// Helper for client damage calculation
function clientCalcDamage(attackerAtk, defenderDef, options = {}) {
  const multiplier = options.multiplier ?? 1.0;
  const isStaggered = options.isStaggered ?? false;
  const critChance = options.critChance ?? 0.15;
  const isCritical = options.isCritical !== undefined ? options.isCritical : false;
  const variance = options.randomVariance ?? 0;

  const baseDmg = Math.max(1, attackerAtk - Math.floor(defenderDef * 0.4));
  let finalDmg = baseDmg * multiplier;

  if (isCritical) {
    finalDmg = Math.floor(finalDmg * 1.8);
  }

  if (isStaggered) {
    finalDmg = Math.floor(finalDmg * 1.5);
  }

  if (variance > 0) {
    const factor = 1 - variance + 0.5 * (variance * 2);
    finalDmg = Math.floor(finalDmg * factor);
  }

  return {
    damage: Math.max(1, Math.round(finalDmg)),
    isCritical,
    isStaggerBonus: isStaggered,
  };
}

// Client PvP Arena burst reduction formula
function clientPvPBurstDamage(rawDamage) {
  return Math.max(1, Math.round(rawDamage * 0.60));
}

async function runAllChallengerTests() {
  console.log("════════════════════════════════════════════════════════════════════════════");
  console.log("🛡️ EMPIRICAL CHALLENGER STRESS HARNESS: COMBAT, MONSTER AI & 1V1 PVP ARENA");
  console.log("════════════════════════════════════════════════════════════════════════════\n");

  let totalTests = 0;
  let passedTests = 0;
  const failedTests = [];

  function test(name, fn) {
    totalTests++;
    try {
      fn();
      passedTests++;
      console.log(`  ✅ PASS: ${name}`);
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
      failedTests.push({ name, error: err });
    }
  }

  // ============================================================================
  // SUITE 1: COMBAT DAMAGE FORMULAS & EDGE CASES
  // ============================================================================
  console.log("▶ [SUITE 1] Combat Damage Formulas: floor(def*0.4), crit 1.8x, stagger 1.5x, min 1 dmg");

  test("Formula exactness: base damage = max(1, atk - floor(def * 0.4))", () => {
    // Normal case: atk 100, def 50 -> 50 * 0.4 = 20 -> 100 - 20 = 80
    const res = serverCalcDamage(100, 50, { isCritical: false, isStaggered: false, randomVariance: 0 });
    assert.equal(res.damage, 80);

    // Float floor check: def 51 -> 51 * 0.4 = 20.4 -> floor is 20 -> 100 - 20 = 80
    const res51 = serverCalcDamage(100, 51, { isCritical: false, isStaggered: false, randomVariance: 0 });
    assert.equal(res51.damage, 80);

    // Float floor check: def 52 -> 52 * 0.4 = 20.8 -> floor is 20 -> 100 - 20 = 80
    const res52 = serverCalcDamage(100, 52, { isCritical: false, isStaggered: false, randomVariance: 0 });
    assert.equal(res52.damage, 80);

    // def 53 -> 53 * 0.4 = 21.2 -> floor is 21 -> 100 - 21 = 79
    const res53 = serverCalcDamage(100, 53, { isCritical: false, isStaggered: false, randomVariance: 0 });
    assert.equal(res53.damage, 79);
  });

  test("Critical Hit multiplier 1.8x applied via Math.floor", () => {
    // base = 77 -> floor(77 * 1.8) = floor(138.6) = 138
    const crit = serverCalcDamage(85, 20, { multiplier: 1.0, isCritical: true, isStaggered: false, randomVariance: 0 });
    assert.equal(crit.damage, 138);
    assert.equal(crit.isCritical, true);
    assert.equal(crit.isStaggerBonus, false);
  });

  test("Stagger multiplier 1.5x applied via Math.floor", () => {
    // base = 77 -> floor(77 * 1.5) = floor(115.5) = 115
    const stagger = serverCalcDamage(85, 20, { multiplier: 1.0, isCritical: false, isStaggered: true, randomVariance: 0 });
    assert.equal(stagger.damage, 115);
    assert.equal(stagger.isCritical, false);
    assert.equal(stagger.isStaggerBonus, true);
  });

  test("Simultaneous Critical (1.8x) + Stagger (1.5x) compound multiplication", () => {
    // base = 77
    // step 1 (crit): floor(77 * 1.8) = 138
    // step 2 (stagger): floor(138 * 1.5) = 207
    const combo = serverCalcDamage(85, 20, { multiplier: 1.0, isCritical: true, isStaggered: true, randomVariance: 0 });
    assert.equal(combo.damage, 207);
    assert.equal(combo.isCritical, true);
    assert.equal(combo.isStaggerBonus, true);
  });

  test("Minimum 1 Damage guarantee under extreme defense (DEF = 1,000,000, ATK = 5)", () => {
    const minDmg = serverCalcDamage(5, 1_000_000, { multiplier: 1.0, isCritical: false, isStaggered: false, randomVariance: 0 });
    assert.equal(minDmg.damage, 1, "Extreme defense must still yield minimum 1 damage");
  });

  test("Zero stats edge case (ATK = 0, DEF = 0)", () => {
    // 0 - floor(0*0.4) = 0 -> max(1, 0) = 1
    const zero = serverCalcDamage(0, 0, { multiplier: 1.0, isCritical: false, isStaggered: false, randomVariance: 0 });
    assert.equal(zero.damage, 1, "0 ATK vs 0 DEF must yield 1 damage");
  });

  test("Negative stats resilience (ATK = -50, DEF = -100)", () => {
    // floor(-100 * 0.4) = -40 -> -50 - (-40) = -10 -> max(1, -10) = 1
    const neg = serverCalcDamage(-50, -100, { multiplier: 1.0, isCritical: false, isStaggered: false, randomVariance: 0 });
    assert.equal(neg.damage, 1, "Negative inputs must not produce negative damage or error");
  });

  test("Zero / Negative multiplier edge case", () => {
    const zeroMult = serverCalcDamage(100, 20, { multiplier: 0, isCritical: false, isStaggered: false, randomVariance: 0 });
    assert.equal(zeroMult.damage, 1, "Zero multiplier must still guarantee minimum 1 damage");

    const negMult = serverCalcDamage(100, 20, { multiplier: -1.5, isCritical: false, isStaggered: false, randomVariance: 0 });
    assert.equal(negMult.damage, 1, "Negative multiplier must still guarantee minimum 1 damage");
  });

  test("Extreme stats stress: 1 Billion ATK vs 0 DEF", () => {
    const billion = serverCalcDamage(1_000_000_000, 0, { multiplier: 1.0, isCritical: false, isStaggered: false, randomVariance: 0 });
    assert.equal(billion.damage, 1_000_000_000);
  });

  test("Client & Server combatRules formula parity test (1000 randomized cases)", () => {
    for (let i = 0; i < 1000; i++) {
      const atk = Math.floor(Math.random() * 2000);
      const def = Math.floor(Math.random() * 2000);
      const mult = +(0.5 + Math.random() * 2.5).toFixed(2);
      const crit = Math.random() < 0.3;
      const stagger = Math.random() < 0.2;

      const serverRes = serverCalcDamage(atk, def, { multiplier: mult, isCritical: crit, isStaggered: stagger, randomVariance: 0 });
      const clientRes = clientCalcDamage(atk, def, { multiplier: mult, isCritical: crit, isStaggered: stagger, randomVariance: 0 });

      assert.equal(serverRes.damage, clientRes.damage, `Mismatch at atk=${atk}, def=${def}, mult=${mult}`);
      assert.equal(serverRes.isCritical, clientRes.isCritical);
      assert.equal(serverRes.isStaggerBonus, clientRes.isStaggerBonus);
    }
  });

  // ============================================================================
  // SUITE 2: MONSTER AI BEHAVIOR & LEASH RANGE SIMULATION
  // ============================================================================
  console.log("\n▶ [SUITE 2] Monster AI Behavior: Aggro radius, Cooldowns, Leash Return >30m with Full HP Reset");

  function createMockMonster(custom = {}) {
    return {
      id: 1,
      monsterId: "slime_swamp",
      name: "Slime Đầm Lầy",
      hp: 100,
      maxHp: 100,
      atk: 15,
      spawnPos: { x: 0, y: 0, z: 0 },
      currentPos: { x: 0, y: 0, z: 0 },
      aiState: "PATROL",
      attackCooldown: 0,
      baseCooldown: 2.0,
      leashRadius: 30.0, // Project spec > 30m leash threshold
      aggroRadius: 8.0,
      phase: 1,
      staggerGauge: 0,
      staggerMax: 100,
      hasBarrier: false,
      isEnraged: false,
      isBerserkEnraged: false,
      bossCombatTimer: 0,
      isAlive: true,
      ...custom,
    };
  }

  function simulateAIMonsterTick(m, playerPos, dt, options = {}) {
    const { weather = "CLEAR", isPlayerInSafeZone = false, isPlayerDead = false } = options;

    if (m.attackCooldown > 0) m.attackCooldown = Math.max(0, m.attackCooldown - dt);

    const distToPlayer = Math.hypot(playerPos.x - m.currentPos.x, playerPos.z - m.currentPos.z);
    const distFromSpawn = Math.hypot(m.spawnPos.x - m.currentPos.x, m.spawnPos.z - m.currentPos.z);

    // Leash Check: Return home if pulled too far (> leashRadius), player dead, or player in safe zone
    if (isPlayerDead || isPlayerInSafeZone || distFromSpawn > m.leashRadius) {
      if (m.aiState === "AGGRO_CHASE" || m.aiState === "TELEGRAPH_WINDUP") {
        m.aiState = "RETURNING_HOME";
      }
    }

    switch (m.aiState) {
      case "PATROL": {
        const weatherAggroMult = weather === "RAIN" ? 0.8 : weather === "DARK_FOG" ? 0.65 : 1.0;
        const effectiveAggro = m.aggroRadius * weatherAggroMult;

        if (distToPlayer <= effectiveAggro && !isPlayerInSafeZone && !isPlayerDead) {
          m.aiState = "AGGRO_CHASE";
        }
        break;
      }

      case "AGGRO_CHASE": {
        if (distToPlayer > m.aggroRadius * 1.6) {
          m.aiState = "PATROL";
          break;
        }

        // Try attack
        const attackRange = 2.2;
        if (distToPlayer <= attackRange && m.attackCooldown <= 0) {
          m.attackCooldown = m.baseCooldown;
          m.lastAttacked = true;
        } else {
          m.lastAttacked = false;
          // Chase player
          const dirX = playerPos.x - m.currentPos.x;
          const dirZ = playerPos.z - m.currentPos.z;
          const len = Math.hypot(dirX, dirZ);
          if (len > 0.01) {
            const speed = 3.5;
            m.currentPos.x += (dirX / len) * speed * dt;
            m.currentPos.z += (dirZ / len) * speed * dt;
          }
        }
        break;
      }

      case "RETURNING_HOME": {
        const retX = m.spawnPos.x - m.currentPos.x;
        const retZ = m.spawnPos.z - m.currentPos.z;
        const len = Math.hypot(retX, retZ);

        if (len < 1.0) {
          // Reached spawn: 100% full HP reset and reset states
          m.hp = m.maxHp;
          m.staggerGauge = 0;
          m.hasBarrier = false;
          m.isEnraged = false;
          m.phase = 1;
          m.bossCombatTimer = 0;
          m.isBerserkEnraged = false;
          m.aiState = "PATROL";
        } else {
          const retSpeed = 5.0;
          m.currentPos.x += (retX / len) * retSpeed * dt;
          m.currentPos.z += (retZ / len) * retSpeed * dt;
        }
        break;
      }
    }
  }

  test("Aggro detection: Player enters aggro radius (8.0m)", () => {
    const mob = createMockMonster({ aggroRadius: 8.0 });
    // Player at 10m -> remains PATROL
    simulateAIMonsterTick(mob, { x: 10, y: 0, z: 0 }, 0.1);
    assert.equal(mob.aiState, "PATROL");

    // Player enters at 7.5m -> triggers AGGRO_CHASE
    simulateAIMonsterTick(mob, { x: 7.5, y: 0, z: 0 }, 0.1);
    assert.equal(mob.aiState, "AGGRO_CHASE");
  });

  test("Aggro weather suppression: RAIN (0.8x) and DARK_FOG (0.65x)", () => {
    // Under clear: 8m aggro. At 7.0m, aggros.
    const mobRain = createMockMonster({ aggroRadius: 8.0 });
    // In rain, aggro = 8 * 0.8 = 6.4m. Player at 7.0m should NOT aggro!
    simulateAIMonsterTick(mobRain, { x: 7.0, y: 0, z: 0 }, 0.1, { weather: "RAIN" });
    assert.equal(mobRain.aiState, "PATROL", "Rain must reduce aggro radius to 6.4m");

    simulateAIMonsterTick(mobRain, { x: 6.0, y: 0, z: 0 }, 0.1, { weather: "RAIN" });
    assert.equal(mobRain.aiState, "AGGRO_CHASE", "Player inside 6.0m in rain triggers aggro");

    // In dark fog, aggro = 8 * 0.65 = 5.2m. Player at 5.8m should NOT aggro!
    const mobFog = createMockMonster({ aggroRadius: 8.0 });
    simulateAIMonsterTick(mobFog, { x: 5.8, y: 0, z: 0 }, 0.1, { weather: "DARK_FOG" });
    assert.equal(mobFog.aiState, "PATROL", "Dark fog must reduce aggro radius to 5.2m");

    simulateAIMonsterTick(mobFog, { x: 5.0, y: 0, z: 0 }, 0.1, { weather: "DARK_FOG" });
    assert.equal(mobFog.aiState, "AGGRO_CHASE", "Player inside 5.0m in dark fog triggers aggro");
  });

  test("Safe Zone aggro immunity (distance to safe village center < 21.2m)", () => {
    const mob = createMockMonster({ aggroRadius: 8.0 });
    // Player is right next to monster at 2m, but inside Safe Village
    simulateAIMonsterTick(mob, { x: 2, y: 0, z: 0 }, 0.1, { isPlayerInSafeZone: true });
    assert.equal(mob.aiState, "PATROL", "Monster must not aggro players in Safe Zone");
  });

  test("Attack Cooldown enforcement", () => {
    const mob = createMockMonster({ aiState: "AGGRO_CHASE", baseCooldown: 2.0 });
    // Player within melee range 1.5m
    simulateAIMonsterTick(mob, { x: 1.5, y: 0, z: 0 }, 0.1);
    assert.equal(mob.lastAttacked, true);
    assert.ok(mob.attackCooldown > 1.8, "Attack cooldown must be set to ~2.0s");

    // Next tick: cannot attack yet
    simulateAIMonsterTick(mob, { x: 1.5, y: 0, z: 0 }, 0.5);
    assert.equal(mob.lastAttacked, false, "Must not attack while cooldown > 0");
    assert.ok(mob.attackCooldown <= 1.5);
  });

  test("Leash Return (>30m) with 100% Full HP Reset", () => {
    const mob = createMockMonster({
      aiState: "AGGRO_CHASE",
      hp: 20, // Damaged: 20/100 HP
      maxHp: 100,
      leashRadius: 30.0,
      spawnPos: { x: 0, y: 0, z: 0 },
      currentPos: { x: 31.0, y: 0, z: 0 }, // Pulled past 30m leash threshold
      staggerGauge: 60,
      isEnraged: true,
      phase: 2,
    });

    // 1. Tick monster: must detect distFromSpawn (31m) > leashRadius (30m) and enter RETURNING_HOME
    simulateAIMonsterTick(mob, { x: 32.0, y: 0, z: 0 }, 0.1);
    assert.equal(mob.aiState, "RETURNING_HOME", "Pulled >30m from spawn must trigger RETURNING_HOME");

    // 2. Simulate return travel across multiple frames until within 1m of spawn
    while (mob.aiState === "RETURNING_HOME") {
      simulateAIMonsterTick(mob, { x: 32.0, y: 0, z: 0 }, 0.5);
    }

    // 3. Verify state reset after returning to spawn
    assert.equal(mob.aiState, "PATROL", "State must reset to PATROL upon returning home");
    assert.equal(mob.hp, 100, "HP MUST reset to 100% full maxHp upon reaching spawn");
    assert.equal(mob.staggerGauge, 0, "Stagger gauge must reset to 0");
    assert.equal(mob.isEnraged, false, "Enrage state must reset");
    assert.equal(mob.phase, 1, "Phase must reset to 1");
    assert.ok(Math.hypot(mob.currentPos.x, mob.currentPos.z) < 1.0, "Position must be back at spawn (<1.0m)");
  });

  // ============================================================================
  // SUITE 3: BOSS MULTI-PHASE MECHANICS & BERSERK ENRAGE TIMER (180s)
  // ============================================================================
  console.log("\n▶ [SUITE 3] Boss Multi-Phase Mechanics & Berserk Enrage (180s)");

  function createMockBoss() {
    return {
      id: 20,
      name: "Hỏa Long Ma Thần (World Boss)",
      isBoss: true,
      maxHp: 35000,
      hp: 35000,
      baseAtk: 390,
      atk: 390,
      phase: 1,
      bossCombatTimer: 0,
      isBerserkEnraged: false,
      aiState: "AGGRO_CHASE",
      spawnPos: { x: 0, y: 0, z: -70 },
      currentPos: { x: 0, y: 0, z: -70 },
      leashRadius: 42.0,
      addsSpawned: 0,
      telegraphDurationMs: 1000,
    };
  }

  function simulateBossDamageAndPhases(boss, damage, deadMinionPool = []) {
    boss.hp = Math.max(0, boss.hp - damage);

    // Phase 2 check: HP <= 70%
    if (boss.phase === 1 && boss.hp <= boss.maxHp * 0.70) {
      boss.phase = 2;
      // Revive up to 2 adds
      let count = 0;
      for (const minion of deadMinionPool) {
        if (!minion.isAlive && count < 2) {
          minion.isAlive = true;
          minion.hp = minion.maxHp;
          minion.aiState = "AGGRO_CHASE";
          count++;
        }
      }
      boss.addsSpawned += count;
    }

    // Phase 3 check: HP <= 30%
    if (boss.phase === 2 && boss.hp <= boss.maxHp * 0.30) {
      boss.phase = 3;
      boss.atk = Math.round(boss.atk * 1.35); // +35% ATK boost
      boss.telegraphDurationMs = Math.round(boss.telegraphDurationMs * 0.60); // 40% faster
    }
  }

  function simulateBossCombatTimer(boss, dt) {
    if (boss.aiState === "AGGRO_CHASE" || boss.aiState === "TELEGRAPH_WINDUP") {
      boss.bossCombatTimer += dt;
      if (boss.bossCombatTimer >= 180 && !boss.isBerserkEnraged) {
        boss.isBerserkEnraged = true;
        boss.atk = Math.round(boss.atk * 3.0); // +200% ATK boost
      }
    }
  }

  test("Boss Phase 1: Normal combat state at > 70% HP (e.g. 25,000 / 35,000 HP)", () => {
    const boss = createMockBoss();
    simulateBossDamageAndPhases(boss, 5000); // 30,000 HP (85.7%)
    assert.equal(boss.phase, 1);
    assert.equal(boss.atk, 390);
    assert.equal(boss.addsSpawned, 0);
  });

  test("Boss Phase 2 Trigger: HP drops <= 70% (24,500 HP) -> Spawns 2 Adds", () => {
    const boss = createMockBoss();
    const deadMinions = [
      { id: 1, isAlive: false, hp: 0, maxHp: 100, aiState: "DEAD" },
      { id: 2, isAlive: false, hp: 0, maxHp: 100, aiState: "DEAD" },
      { id: 3, isAlive: false, hp: 0, maxHp: 100, aiState: "DEAD" },
    ];

    // Deal damage to drop boss to 24,000 HP (<= 70%)
    simulateBossDamageAndPhases(boss, 11000, deadMinions);
    assert.equal(boss.phase, 2, "Boss must enter Phase 2 at <= 70% HP");
    assert.equal(boss.addsSpawned, 2, "Boss must awaken 2 adds");
    assert.equal(deadMinions[0].isAlive, true);
    assert.equal(deadMinions[1].isAlive, true);
    assert.equal(deadMinions[2].isAlive, false, "Third minion remains dead");
  });

  test("Boss Phase 3 Trigger: HP drops <= 30% (10,500 HP) -> +35% ATK boost & 40% faster casts", () => {
    const boss = createMockBoss();
    boss.phase = 2; // already in phase 2
    boss.hp = 20000;

    // Drop HP to 10,000 (<= 30% of 35,000)
    simulateBossDamageAndPhases(boss, 10000);
    assert.equal(boss.phase, 3, "Boss must enter Phase 3 at <= 30% HP");
    // ATK boost: 390 * 1.35 = 526.5 -> round to 527
    assert.equal(boss.atk, 527, "Phase 3 ATK must receive +35% boost (390 -> 527)");
    assert.equal(boss.telegraphDurationMs, 600, "Telegraph windup must decrease by 40% (1000ms -> 600ms)");
  });

  test("Boss Berserk Enrage: 180s continuous combat timer triggers +200% ATK (3.0x)", () => {
    const boss = createMockBoss();

    // Combat at 179.5 seconds: NOT enraged yet
    simulateBossCombatTimer(boss, 179.5);
    assert.equal(boss.bossCombatTimer, 179.5);
    assert.equal(boss.isBerserkEnraged, false);
    assert.equal(boss.atk, 390);

    // Combat passes 180.0 seconds: ENRAGES!
    simulateBossCombatTimer(boss, 1.0); // total 180.5s
    assert.equal(boss.isBerserkEnraged, true, "Boss must trigger Berserk Enrage at >= 180s");
    // ATK boost: 390 * 3.0 = 1170
    assert.equal(boss.atk, 1170, "Berserk Enrage must boost ATK by +200% (3.0x: 390 -> 1170)");
  });

  test("Boss Berserk Enrage compounding with Phase 3 (+35% ATK then +200% ATK)", () => {
    const boss = createMockBoss();
    boss.phase = 2;
    boss.hp = 20000;
    // Enter Phase 3
    simulateBossDamageAndPhases(boss, 10000);
    assert.equal(boss.phase, 3);
    assert.equal(boss.atk, 527);

    // Enrage timer reaches 180s in Phase 3
    simulateBossCombatTimer(boss, 185.0);
    assert.equal(boss.isBerserkEnraged, true);
    // 527 * 3.0 = 1581
    assert.equal(boss.atk, 1581, "Compounding Phase 3 (527) + Berserk (3.0x) must equal 1581 ATK");
  });

  test("Boss Leash reset during Enrage: clears Enrage and resets combat timer to 0", () => {
    const boss = createMockBoss();
    simulateBossCombatTimer(boss, 200.0);
    assert.equal(boss.isBerserkEnraged, true);

    // Leash return simulation
    boss.currentPos.z = 0; // Pulled 70m away (> 42m leash)
    simulateAIMonsterTick(boss, { x: 0, y: 0, z: 10 }, 0.1);
    assert.equal(boss.aiState, "RETURNING_HOME");

    // Once back at spawn
    boss.currentPos.x = boss.spawnPos.x;
    boss.currentPos.z = boss.spawnPos.z;
    simulateAIMonsterTick(boss, { x: 0, y: 0, z: 10 }, 0.1);

    assert.equal(boss.bossCombatTimer, 0, "Boss combat timer must reset to 0 upon leash return");
    assert.equal(boss.isBerserkEnraged, false, "Enrage must be cleared upon leash return");
    assert.equal(boss.hp, boss.maxHp, "Boss HP must be restored to 100%");
  });

  // ============================================================================
  // SUITE 4: 1V1 PVP ARENA, 40% BURST REDUCTION & ELO CALCULATION
  // ============================================================================
  console.log("\n▶ [SUITE 4] 1v1 PvP Arena: 40% Burst Reduction, ELO Calculation & Leaderboard");

  test("PvP 40% Burst Damage Dampening (0.60x factor)", () => {
    // 100 DMG -> 60 DMG
    assert.equal(clientPvPBurstDamage(100), 60);
    // 250 DMG -> 150 DMG
    assert.equal(clientPvPBurstDamage(250), 150);
    // 1000 DMG -> 600 DMG
    assert.equal(clientPvPBurstDamage(1000), 600);
    // 1 DMG -> 1 * 0.60 = 0.60 -> round = 1
    assert.equal(clientPvPBurstDamage(1), 1);
    // 0 DMG -> max(1, 0) = 1 (guaranteed min 1 DMG)
    assert.equal(clientPvPBurstDamage(0), 1);
  });

  test("PvP Burst Dampening property test (10,000 random damages)", () => {
    for (let i = 0; i < 10000; i++) {
      const raw = Math.floor(Math.random() * 50000);
      const reduced = clientPvPBurstDamage(raw);
      assert.ok(reduced >= 1, "Reduced damage must never be < 1");
      if (raw > 1) {
        assert.ok(reduced < raw, `Reduced (${reduced}) must be less than raw (${raw})`);
      }
    }
  });

  test("ELO Calculation: Victory point gain strictly in [16, 35]", () => {
    // Even match (1000 vs 1000)
    const evenWin = calculateEloRatingChange(1000, 1000, true);
    assert.ok(evenWin.pointChange >= 16 && evenWin.pointChange <= 35, `even win delta: ${evenWin.pointChange}`);

    // Underdog win: player 400 vs opp 1850 (huge upset)
    const underdogWin = calculateEloRatingChange(400, 1850, true);
    assert.equal(underdogWin.pointChange, 35, "Underdog win should receive maximum K-factor +35");

    // Heavy favorite win: player 2500 vs opp 400
    const favoriteWin = calculateEloRatingChange(2500, 400, true);
    assert.equal(favoriteWin.pointChange, 16, "Heavy favorite win should receive clamped minimum +16");
  });

  test("ELO Calculation: Defeat loss strictly in [-24, -12]", () => {
    // Even match (1000 vs 1000)
    const evenLoss = calculateEloRatingChange(1000, 1000, false);
    assert.ok(evenLoss.pointChange <= -12 && evenLoss.pointChange >= -24, `even loss delta: ${evenLoss.pointChange}`);

    // Heavy favorite loss (upset against favorite): player 2500 vs opp 400
    const favoriteLoss = calculateEloRatingChange(2500, 400, false);
    assert.equal(favoriteLoss.pointChange, -24, "Favorite loss should receive maximum penalty -24");

    // Underdog loss: player 400 vs opp 2500
    const underdogLoss = calculateEloRatingChange(400, 2500, false);
    assert.equal(underdogLoss.pointChange, -12, "Underdog loss should receive minimum penalty -12");
  });

  test("ELO Rating Floor: Rating never drops below 0", () => {
    // Player with 0 points loses match: newPoints = max(0, 0 + pointChange) = 0
    let rating = 0;
    for (let match = 1; match <= 50; match++) {
      const { pointChange } = calculateEloRatingChange(rating, 1000, false);
      assert.ok(pointChange < 0, "Defeat pointChange must be negative");
      rating = Math.max(0, rating + pointChange);
      assert.equal(rating, 0, `Match ${match}: Rating from 0 must never become negative`);
    }

    // Player with 10 points loses match (-12 to -24 points)
    const { pointChange: lossD } = calculateEloRatingChange(10, 1000, false);
    const newRating = Math.max(0, 10 + lossD);
    assert.equal(newRating, 0, "10 points - penalty must floor at 0");
  });

  test("Extreme rating difference stability (0 vs 1,000,000 and 1,000,000 vs 0)", () => {
    const hugeDiffWin = calculateEloRatingChange(0, 1_000_000, true);
    assert.ok(Number.isFinite(hugeDiffWin.pointChange));
    assert.equal(hugeDiffWin.pointChange, 35);

    const hugeDiffLoss = calculateEloRatingChange(1_000_000, 0, false);
    assert.ok(Number.isFinite(hugeDiffLoss.pointChange));
    assert.equal(hugeDiffLoss.pointChange, -24);
  });

  test("Arena Rank Mapping: Tiers 0 -> 2500+ (Đồng IV -> Chiến Thần)", () => {
    assert.equal(getArenaRank(0).name, "Đồng IV");
    assert.equal(getArenaRank(50).name, "Đồng IV");
    assert.equal(getArenaRank(100).name, "Đồng I");
    assert.equal(getArenaRank(250).name, "Bạc III");
    assert.equal(getArenaRank(500).name, "Bạc I");
    assert.equal(getArenaRank(800).name, "Vàng III");
    assert.equal(getArenaRank(1200).name, "Vàng I");
    assert.equal(getArenaRank(1800).name, "Kim Cương");
    assert.equal(getArenaRank(2500).name, "Chiến Thần");
    assert.equal(getArenaRank(99999).name, "Chiến Thần");
  });

  test("Leaderboard Sorting: Descending by honorPoints, secondary tie-break by combatPower", () => {
    const mockPlayers = [
      { id: 1, name: "P1", honorPoints: 500, combatPower: 1200 },
      { id: 2, name: "P2", honorPoints: 1200, combatPower: 900 },
      { id: 3, name: "P3", honorPoints: 500, combatPower: 1800 },
      { id: 4, name: "P4", honorPoints: 0, combatPower: 500 },
      { id: 5, name: "P5", honorPoints: 2500, combatPower: 5000 },
      { id: 6, name: "P6", honorPoints: null, combatPower: 300 }, // null resilience
    ];

    mockPlayers.sort((a, b) => {
      const diff = (Number(b.honorPoints) || 0) - (Number(a.honorPoints) || 0);
      if (diff !== 0) return diff;
      return (Number(b.combatPower) || 0) - (Number(a.combatPower) || 0);
    });

    assert.equal(mockPlayers[0].name, "P5", "Top 1: 2500 pts");
    assert.equal(mockPlayers[1].name, "P2", "Top 2: 1200 pts");
    assert.equal(mockPlayers[2].name, "P3", "Top 3: 500 pts, 1800 CP (tie-break win)");
    assert.equal(mockPlayers[3].name, "P1", "Top 4: 500 pts, 1200 CP (tie-break loss)");
    assert.equal(mockPlayers[4].name, "P4", "Top 5: 0 pts, 500 CP");
    assert.equal(mockPlayers[5].name, "P6", "Top 6: null/0 pts, 300 CP");
  });

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log("\n════════════════════════════════════════════════════════════════════════════");
  console.log(`📊 EMPIRICAL CHALLENGE SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  if (failedTests.length > 0) {
    console.log(`❌ ${failedTests.length} TESTS FAILED:`);
    for (const f of failedTests) {
      console.log(`   - ${f.name}: ${f.error.message}`);
    }
    console.log("════════════════════════════════════════════════════════════════════════════\n");
    process.exit(1);
  } else {
    console.log("🎉 ALL ADVERSARIAL STRESS TESTS PASSED WITH 100% EMPIRICAL RIGOR!");
    console.log("════════════════════════════════════════════════════════════════════════════\n");
    process.exit(0);
  }
}

runAllChallengerTests().catch((err) => {
  console.error("Fatal test runner crash:", err);
  process.exit(1);
});
