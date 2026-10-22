/**
 * SECURITY & INTEGRITY VERIFICATION TEST SUITE
 * MMORPG 2.5D Chiến Long Bí Sử
 *
 * Verifies:
 * 1. 401 Unauthorized on protected routes without session/token.
 * 2. 403 Forbidden on GM & administrative endpoints for non-admin accounts.
 * 3. Insecure Direct Object Reference (IDOR) defense (character theft & cross-account modification).
 * 4. Input validation, schema bounds, and SQL Injection (SQLi) prevention via parameterized queries.
 */

import assert from "node:assert/strict";
import http from "node:http";
import handler from "../api/index.mjs";

async function runSecurityTests() {
  const server = http.createServer((req, res) => {
    handler(req, res);
  });
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;

  console.log("══════════════════════════════════════════════════════════════════════════");
  console.log("🛡️  MMORPG SECURITY & ACCESS CONTROL TEST SUITE");
  console.log(`📡 Ephemeral Test Server listening on: ${baseUrl}`);
  console.log("══════════════════════════════════════════════════════════════════════════\n");

  try {
    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 1: 401 UNAUTHORIZED ON PROTECTED ROUTES WITHOUT SESSION / TOKEN
    // ──────────────────────────────────────────────────────────────────────────
    console.log("▶ [Suite 1] 401 Unauthorized Authentication Guard Verification:");

    const unauthRoutes = [
      { method: "GET", path: "/auth/me", name: "Current User Profile" },
      { method: "GET", path: "/characters", name: "User Character List" },
      { method: "POST", path: "/characters", body: { name: "HackerChar", classId: "fighter" }, name: "Character Creation" },
      { method: "POST", path: "/characters/1/battle", body: { monsterId: "slime" }, name: "Battle Trigger" },
      { method: "PUT", path: "/characters/1/full-sync", body: { gold: 999999, revision: 1 }, name: "FullSync State Overwrite" },
      { method: "POST", path: "/characters/1/inventory/unlock-slot", name: "Inventory Slot Unlock" },
      { method: "POST", path: "/characters/1/gm/action", body: { action: "set_level", level: 999 }, name: "GM Admin Action" },
      { method: "POST", path: "/characters/1/blacksmith/enhance", body: { userItemId: 1 }, name: "Blacksmith Enhance" },
      { method: "GET", path: "/characters/1/battle-log", name: "Battle Log History" },
    ];

    for (const route of unauthRoutes) {
      const res = await fetch(`${baseUrl}${route.path}`, {
        method: route.method,
        headers: { "Content-Type": "application/json" },
        body: route.body ? JSON.stringify(route.body) : undefined,
      });

      assert.strictEqual(
        res.status,
        401,
        `Expected 401 Unauthorized on unauthenticated ${route.method} ${route.path}, got ${res.status}`
      );
      console.log(`  ✔ PASS: ${route.method} ${route.path} (${route.name}) -> 401 Unauthorized`);
    }

    // Verify invalid/tampered Bearer tokens are rejected with 401
    const invalidTokenRes = await fetch(`${baseUrl}/characters`, {
      headers: { Authorization: "Bearer forged_or_expired_token_signature_xyz" },
    });
    assert.strictEqual(invalidTokenRes.status, 401, "Invalid Bearer token must return 401 Unauthorized");
    console.log("  ✔ PASS: Forged/Tampered Bearer Token rejected with 401 Unauthorized");

    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 2: 403 FORBIDDEN ON GM / ADMIN ENDPOINTS FOR NON-ADMIN ACCOUNTS
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\n▶ [Suite 2] 403 Forbidden Authorization & GM Isolation:");

    const nonceA = Math.floor(Math.random() * 899999 + 100000);
    const userA_name = `player_norm_${nonceA}`;
    const userA_pass = "PlayerSecure123!";

    const regResA = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: userA_name, password: userA_pass }),
    });
    assert.strictEqual(regResA.status, 201, "User A registration must succeed");
    const { token: tokenA } = await regResA.json();

    const charResA = await fetch(`${baseUrl}/characters`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ name: `Hero_${nonceA.toString().slice(-4)}`, classId: "fighter" }),
    });
    assert.strictEqual(charResA.status, 201, "Character creation must succeed");
    const charA = await charResA.json();
    const charIdA = charA.id;
    console.log(`  Created regular player character ID ${charIdA} (${charA.name})`);

    // 2.1 Non-admin attempts GM set_level action
    const gmLevelRes = await fetch(`${baseUrl}/characters/${charIdA}/gm/action`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ action: "set_level", level: 999 }),
    });
    assert.strictEqual(gmLevelRes.status, 403, "Non-admin must receive 403 Forbidden on GM set_level");
    console.log("  ✔ PASS: GM Action 'set_level' rejected with 403 Forbidden for non-admin");

    // 2.2 Non-admin attempts GM spawn_legendary_weapon
    const gmWeaponRes = await fetch(`${baseUrl}/characters/${charIdA}/gm/action`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ action: "spawn_legendary_weapon" }),
    });
    assert.strictEqual(gmWeaponRes.status, 403, "Non-admin must receive 403 Forbidden on GM spawn_legendary_weapon");
    console.log("  ✔ PASS: GM Action 'spawn_legendary_weapon' rejected with 403 Forbidden");

    // 2.3 Non-admin attempts GM add_gold
    const gmGoldRes = await fetch(`${baseUrl}/characters/${charIdA}/gm/action`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ action: "add_gold", amount: 999999 }),
    });
    assert.strictEqual(gmGoldRes.status, 403, "Non-admin must receive 403 Forbidden on GM add_gold");
    console.log("  ✔ PASS: GM Action 'add_gold' rejected with 403 Forbidden");

    // 2.4 Non-admin attempts with forged x-gm-secret header
    const gmForgedSecretRes = await fetch(`${baseUrl}/characters/${charIdA}/gm/action`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
        "x-gm-secret": "fake_gm_secret_attacker_guess",
      },
      body: JSON.stringify({ action: "enhance_all_15" }),
    });
    assert.strictEqual(gmForgedSecretRes.status, 403, "Forged x-gm-secret header must return 403 Forbidden");
    console.log("  ✔ PASS: Forged GM header secret rejected with 403 Forbidden");

    // 2.5 Locked client self-reward endpoint (/3d-reward)
    const lockedRewardRes = await fetch(`${baseUrl}/characters/${charIdA}/3d-reward`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ expGained: 500000, goldGained: 500000, kills: 100 }),
    });
    assert.strictEqual(lockedRewardRes.status, 403, "Client self-declared reward /3d-reward must return 403 Forbidden");
    console.log("  ✔ PASS: Client self-declared reward endpoint (/3d-reward) locked with 403 Forbidden");

    // 2.6 Dangerous account wipe endpoint without valid ADMIN_SECRET_KEY
    const resetAccountsRes = await fetch(`${baseUrl}/auth/reset-all-accounts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ adminSecret: "wrong_secret" }),
    });
    assert.strictEqual(resetAccountsRes.status, 403, "Database reset without valid ADMIN_SECRET_KEY must return 403");
    console.log("  ✔ PASS: Wipe accounts endpoint protected with 403 Forbidden");

    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 3: INSECURE DIRECT OBJECT REFERENCE (IDOR) PREVENTION
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\n▶ [Suite 3] IDOR Cross-Account Character Tampering Defense:");

    const nonceB = Math.floor(Math.random() * 899999 + 100000);
    const userB_name = `player_norm_${nonceB}`;
    const userB_pass = "PlayerSecure123!";

    const regResB = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: userB_name, password: userB_pass }),
    });
    assert.strictEqual(regResB.status, 201, "User B registration must succeed");
    const { token: tokenB } = await regResB.json();

    const charResB = await fetch(`${baseUrl}/characters`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ name: `Hero_${nonceB.toString().slice(-4)}`, classId: "gunner" }),
    });
    assert.strictEqual(charResB.status, 201);
    const charB = await charResB.json();
    const charIdB = charB.id;
    console.log(`  Created User B character ID ${charIdB} (${charB.name})`);

    // 3.1 User B attempts to trigger battle on User A's character
    const idorBattleRes = await fetch(`${baseUrl}/characters/${charIdA}/battle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ monsterId: "slime" }),
    });
    assert.ok(
      idorBattleRes.status === 404 || idorBattleRes.status === 403,
      `IDOR Battle must be blocked with 404/403, got ${idorBattleRes.status}`
    );
    console.log(`  ✔ PASS: Anti-IDOR - Cross-account battle blocked with status ${idorBattleRes.status}`);

    // 3.2 User B attempts to FullSync overwrite User A's character
    const idorSyncRes = await fetch(`${baseUrl}/characters/${charIdA}/full-sync`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ gold: 888888, hp: 1, revision: 2 }),
    });
    assert.ok(
      idorSyncRes.status === 404 || idorSyncRes.status === 403,
      `IDOR FullSync must be blocked with 404/403, got ${idorSyncRes.status}`
    );
    console.log(`  ✔ PASS: Anti-IDOR - Cross-account FullSync state overwrite blocked with status ${idorSyncRes.status}`);

    // Verify User A's gold was NOT altered
    const verifyCharARes = await fetch(`${baseUrl}/characters/${charIdA}/full-state`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.strictEqual(verifyCharARes.status, 200);
    const charAState = await verifyCharARes.json();
    assert.strictEqual(charAState.character.gold, 100, "Character A gold must remain untampered at 100");
    console.log("  ✔ PASS: Anti-IDOR - Target character state integrity confirmed untampered");

    // 3.3 User B attempts to unlock slot on User A's character
    const idorUnlockRes = await fetch(`${baseUrl}/characters/${charIdA}/inventory/unlock-slot`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.ok(
      idorUnlockRes.status === 404 || idorUnlockRes.status === 403,
      `IDOR unlock-slot must be blocked with 404/403, got ${idorUnlockRes.status}`
    );
    console.log(`  ✔ PASS: Anti-IDOR - Cross-account inventory slot unlock blocked with status ${idorUnlockRes.status}`);

    // 3.4 User B attempts to view User A's private battle logs
    const idorLogRes = await fetch(`${baseUrl}/characters/${charIdA}/battle-log`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.ok(
      idorLogRes.status === 404 || idorLogRes.status === 403,
      `IDOR battle-log reading must be blocked with 404/403, got ${idorLogRes.status}`
    );
    console.log(`  ✔ PASS: Anti-IDOR - Cross-account battle-log reading blocked with status ${idorLogRes.status}`);

    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 4: INPUT VALIDATION & SQL INJECTION (SQLi) SAFETY
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\n▶ [Suite 4] Input Validation, Boundaries & SQLi Safety:");

    // 4.1 SQL Injection in login username
    const sqliLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "admin' OR '1'='1' --",
        password: "ArbitraryPassword123!",
      }),
    });
    assert.strictEqual(sqliLoginRes.status, 401, "SQLi auth bypass must fail with 401 Unauthorized");
    console.log("  ✔ PASS: SQL Injection authentication bypass (' OR '1'='1) safely rejected with 401");

    // 4.2 SQL Injection / Path Traversal in character ID parameter
    const sqliParamRoutes = [
      `/characters/1' OR '1'='1/battle`,
      `/characters/NaN/full-sync`,
      `/characters/1;DROP TABLE users;--/battle-log`,
    ];

    for (const urlPath of sqliParamRoutes) {
      const res = await fetch(`${baseUrl}${urlPath}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.ok(
        res.status === 400 || res.status === 404,
        `SQLi in path parameter '${urlPath}' must return 400 or 404, got ${res.status}`
      );
      console.log(`  ✔ PASS: Parameter Injection '${urlPath}' safely trapped with HTTP ${res.status}`);
    }

    // 4.3 Schema validation on character creation
    const invalidCharBodies = [
      { body: { name: "", classId: "fighter" }, desc: "Empty character name" },
      { body: { name: "A".repeat(50), classId: "fighter" }, desc: "Excessively long name (>24 chars)" },
      { body: { name: "ValidName", classId: "nonexistent_class" }, desc: "Invalid classId enum" },
      { body: {}, desc: "Empty request body" },
    ];

    for (const item of invalidCharBodies) {
      const res = await fetch(`${baseUrl}/characters`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify(item.body),
      });
      assert.strictEqual(res.status, 400, `${item.desc} must fail with 400 Bad Request`);
      console.log(`  ✔ PASS: Input boundary validation: ${item.desc} -> 400 Bad Request`);
    }

    // 4.4 Anti-Negative gold prevention
    const negGoldRes = await fetch(`${baseUrl}/characters/${charIdA}/inventory/unlock-slot`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.strictEqual(negGoldRes.status, 400, "Unlocking slot with 100 gold (costs 500) must return 400");
    console.log("  ✔ PASS: Anti-Negative Gold - Insufficient funds transaction blocked with 400");

    // 4.5 Combat Anti-Cheat Rate Limiting (< 450ms spam)
    const battle1 = await fetch(`${baseUrl}/characters/${charIdA}/battle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ monsterId: "slime" }),
    });
    assert.strictEqual(battle1.status, 200, "First battle must succeed with 200");

    const spamBattle = await fetch(`${baseUrl}/characters/${charIdA}/battle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ monsterId: "slime" }),
    });
    assert.strictEqual(spamBattle.status, 429, "Rapid battle spam (<450ms) must return 429 Too Many Requests");
    console.log("  ✔ PASS: Anti-Cheat Rate Limiter - Packet flood intercepted with 429 Too Many Requests");

    console.log("\n══════════════════════════════════════════════════════════════════════════");
    console.log("🎉 ALL SECURITY & ACCESS CONTROL TEST SUITES PASSED! (100% SECURE)");
    console.log("══════════════════════════════════════════════════════════════════════════\n");
    process.exit(0);
  } finally {
    server.close();
  }
}

runSecurityTests().catch((err) => {
  console.error("❌ SECURITY TEST FAILED:", err);
  process.exit(1);
});
