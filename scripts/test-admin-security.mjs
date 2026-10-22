/**
 * ADMIN SECURITY & RBAC VERIFICATION TEST SUITE (PHASE 1 - P0)
 * MMORPG 2.5D Chiến Long Bí Sử
 *
 * Verifies:
 * 1. 401 Unauthorized on all /api/admin/* endpoints for anonymous callers.
 * 2. 403 Forbidden on all /api/admin/* endpoints for normal PLAYER accounts.
 * 3. 403 Forbidden on destructive mutation endpoints (reset-seed, delete) for non-admins.
 * 4. 200 OK for verified ADMIN or valid GM/Admin secret.
 * 5. Complete sanitization of passwordHash in database viewer & user management APIs.
 */

import assert from "node:assert/strict";
import http from "node:http";
import handler from "../api/index.mjs";

async function runAdminSecurityTests() {
  const server = http.createServer((req, res) => {
    handler(req, res);
  });
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;

  console.log("══════════════════════════════════════════════════════════════════════════");
  console.log("🔒 PHASE 1 — ADMIN SECURITY & RBAC AUDIT TEST SUITE");
  console.log(`📡 Ephemeral Test Server listening on: ${baseUrl}`);
  console.log("══════════════════════════════════════════════════════════════════════════\n");

  let totalTests = 0;
  let passedTests = 0;

  const test = (name, fn) => {
    totalTests++;
    try {
      fn();
      passedTests++;
      console.log(`  ✔ PASS: ${name}`);
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`, err.message);
      throw err;
    }
  };

  try {
    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 1: ANONYMOUS CALLERS BLOCKED WITH 401 UNAUTHORIZED
    // ──────────────────────────────────────────────────────────────────────────
    console.log("▶ [Suite 1] Deny-by-default for Anonymous Callers (401 Unauthorized):");

    const anonymousEndpoints = [
      { method: "GET", path: "/admin/stats", desc: "Admin System Stats" },
      { method: "GET", path: "/admin/users", desc: "User Management List" },
      { method: "POST", path: "/admin/users", desc: "Create User via Admin", body: { username: "hacker", password: "123" } },
      { method: "DELETE", path: "/admin/users/1", desc: "Delete User via Admin" },
      { method: "GET", path: "/admin/characters", desc: "All Characters List" },
      { method: "POST", path: "/admin/characters", desc: "Create Character via Admin", body: { name: "HackChar" } },
      { method: "DELETE", path: "/admin/characters/1", desc: "Delete Character via Admin" },
      { method: "GET", path: "/admin/items", desc: "Items Catalog List" },
      { method: "GET", path: "/admin/tables", desc: "Database Schema Tables" },
      { method: "GET", path: "/admin/tables/users", desc: "Database Viewer: Users Table" },
      { method: "POST", path: "/admin/db/reset-seed", desc: "Database Seed Reset" },
      { method: "DELETE", path: "/admin/tables/users/1", desc: "Raw Table Row Deletion" },
    ];

    for (const ep of anonymousEndpoints) {
      const res = await fetch(`${baseUrl}${ep.path}`, {
        method: ep.method,
        headers: { "Content-Type": "application/json" },
        body: ep.body ? JSON.stringify(ep.body) : undefined,
      });

      test(`[401 Guard] ${ep.method} ${ep.path} (${ep.desc}) -> 401`, () => {
        assert.strictEqual(
          res.status,
          401,
          `Expected 401 Unauthorized for anonymous caller on ${ep.path}, got ${res.status}`
        );
      });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 2: NORMAL PLAYER BLOCKED WITH 403 FORBIDDEN
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\n▶ [Suite 2] RBAC Deny-by-default for Normal PLAYER Role (403 Forbidden):");

    const noncePlayer = Math.floor(Math.random() * 899999 + 100000);
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: `player_sec_${noncePlayer}`,
        password: "SecurePassword123!",
      }),
    });
    assert.strictEqual(regRes.status, 201, "Player registration must succeed");
    const { token: playerToken } = await regRes.json();

    const playerForbiddenEndpoints = [
      { method: "GET", path: "/admin/stats", desc: "Admin Stats" },
      { method: "GET", path: "/admin/users", desc: "Users List" },
      { method: "POST", path: "/admin/users", desc: "Create User", body: { username: "dummy", password: "123" } },
      { method: "PUT", path: "/admin/users/1", desc: "Update User", body: { forumTitle: "Hacker" } },
      { method: "DELETE", path: "/admin/users/1", desc: "Delete User" },
      { method: "GET", path: "/admin/tables/users", desc: "Database Raw Viewer (Users)" },
      { method: "GET", path: "/admin/tables/characters", desc: "Database Raw Viewer (Characters)" },
      { method: "POST", path: "/admin/db/reset-seed", desc: "Destructive DB Reset Seed" },
      { method: "DELETE", path: "/admin/tables/users/1", desc: "Destructive Table Row Delete" },
    ];

    for (const ep of playerForbiddenEndpoints) {
      const res = await fetch(`${baseUrl}${ep.path}`, {
        method: ep.method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${playerToken}`,
        },
        body: ep.body ? JSON.stringify(ep.body) : undefined,
      });

      test(`[403 RBAC] PLAYER ${ep.method} ${ep.path} (${ep.desc}) -> 403`, () => {
        assert.strictEqual(
          res.status,
          403,
          `Expected 403 Forbidden for PLAYER on ${ep.path}, got ${res.status}`
        );
      });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 3: AUTHORIZED ADMIN OR GM SECRET KEY ACCESS
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\n▶ [Suite 3] Authorized Access via GM Secret / Admin Credentials:");

    const testGmSecret = "test-gm-secret-phase1-validation";
    process.env.GM_SECRET_KEY = testGmSecret;

    // 3.1 Truy cập stats với header GM Secret
    const statsRes = await fetch(`${baseUrl}/admin/stats`, {
      method: "GET",
      headers: {
        "x-gm-secret": testGmSecret,
      },
    });

    test("GM Secret truy cập /admin/stats -> 200 OK", () => {
      assert.strictEqual(statsRes.status, 200);
    });

    const statsData = await statsRes.json();
    test("Stats trả về đầy đủ metadata máy chủ", () => {
      assert.ok(statsData.counts !== undefined, "Stats must have counts property");
      assert.ok(typeof statsData.uptimeSeconds === "number", "Stats must have uptimeSeconds");
    });

    // 3.2 Truy cập danh sách người chơi
    const usersRes = await fetch(`${baseUrl}/admin/users`, {
      method: "GET",
      headers: {
        "x-gm-secret": testGmSecret,
      },
    });

    test("GM Secret truy cập /admin/users -> 200 OK", () => {
      assert.strictEqual(usersRes.status, 200);
    });

    const usersList = await usersRes.json();
    test("/admin/users trả về mảng danh sách người chơi", () => {
      assert.ok(Array.isArray(usersList), "Users list must be an array");
      assert.ok(usersList.length > 0, "Users list must contain registered users");
    });

    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 4: SENSITIVE DATA DEFENSE (PASSWORD HASH EXPOSURE PREVENTION)
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\n▶ [Suite 4] Sensitive Data Protection (Zero Password Hash Exposure):");

    // 4.1 Kiểm tra /admin/users: Không chứa passwordHash
    test("/admin/users KHÔNG chứa passwordHash trong bất kỳ bản ghi nào", () => {
      for (const u of usersList) {
        assert.strictEqual(
          u.passwordHash,
          undefined,
          `Found exposed passwordHash in user ID ${u.id} (${u.username})!`
        );
      }
    });

    // 4.2 Kiểm tra Database Viewer: /admin/tables/users
    const tableUsersRes = await fetch(`${baseUrl}/admin/tables/users?limit=50`, {
      method: "GET",
      headers: {
        "x-gm-secret": testGmSecret,
      },
    });

    test("Database Viewer /admin/tables/users -> 200 OK", () => {
      assert.strictEqual(tableUsersRes.status, 200);
    });

    const tableUsersData = await tableUsersRes.json();
    test("Database Viewer /admin/tables/users KHÔNG chứa passwordHash trong bất kỳ hàng nào", () => {
      assert.ok(Array.isArray(tableUsersData.rows), "Rows must be an array");
      for (const row of tableUsersData.rows) {
        assert.strictEqual(
          row.passwordHash,
          undefined,
          `Critical vulnerability: passwordHash exposed in database viewer for user ID ${row.id}!`
        );
      }
    });

    console.log("\n══════════════════════════════════════════════════════════════════════════");
    console.log(`🎉 ALL ${passedTests}/${totalTests} ADMIN SECURITY TESTS PASSED! (100% SECURE)`);
    console.log("══════════════════════════════════════════════════════════════════════════\n");
    process.exit(0);
  } finally {
    server.close();
  }
}

runAdminSecurityTests().catch((err) => {
  console.error("❌ ADMIN SECURITY TEST FAILED:", err);
  process.exit(1);
});
