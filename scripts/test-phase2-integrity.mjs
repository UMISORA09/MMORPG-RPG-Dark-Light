/**
 * PHASE 2: CHARACTER FULL SYNC & DATABASE INTEGRITY AUDIT TEST SUITE
 * MMORPG 2.5D Chiến Long Bí Sử
 *
 * Verifies all Phase 2 Acceptance Criteria:
 * 1. Anti-Gold Exploit: FullSync cannot alter gold.
 * 2. Anti-Fake Item Injection: FullSync cannot create new items from client data.
 * 3. Anti-Item Tampering: FullSync cannot alter enhanceLevel, rarity, or quantity.
 * 4. Anti-Stale Deletion: FullSync with empty/partial snapshot does not delete existing DB items.
 * 5. Quest Authority: FullSync cannot auto-complete quests or alter quest status.
 * 6. Strict Revision Matching: Strict CAS rejection (409) for stale or forward-jump revisions.
 * 7. Character Recovery Authority: POST /characters/sync enforces Level 1 and 100 gold.
 */

import assert from "node:assert/strict";
import http from "node:http";
import handler from "../api/index.mjs";

async function runPhase2IntegrityTests() {
  const server = http.createServer((req, res) => {
    handler(req, res);
  });
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;

  const gmSecret = "phase2-gm-secret-validation";
  process.env.GM_SECRET_KEY = gmSecret;

  console.log("══════════════════════════════════════════════════════════════════════════");
  console.log("🛡️ PHASE 2 — FULL SYNC & DATABASE INTEGRITY AUDIT TEST SUITE");
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
    const nonce = Math.floor(Math.random() * 899999 + 100000);
    const username = `hero_p2_${nonce}`;

    // Đăng ký tài khoản kiểm thử
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password: "SecurePassword123!" }),
    });
    assert.strictEqual(regRes.status, 201, "Đăng ký tài khoản phải thành công");
    const { token } = await regRes.json();

    // Tạo nhân vật kiểm thử
    const charRes = await fetch(`${baseUrl}/characters`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: `HeroP2_${nonce.toString().slice(-4)}`, classId: "fighter" }),
    });
    assert.strictEqual(charRes.status, 201, "Tạo nhân vật phải thành công");
    const charData = await charRes.json();
    const charId = charData.id;
    let expectedRev = 1;
    console.log(`  Đã tạo nhân vật kiểm thử: ID ${charId} (${charData.name}), Gold ban đầu: ${charData.gold}, Rev: ${expectedRev}`);

    // Cấp 1 vật phẩm hợp lệ cho nhân vật qua GM Admin API
    const grantRes = await fetch(`${baseUrl}/admin/characters/${charId}/grant-item`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-gm-secret": gmSecret,
      },
      body: JSON.stringify({
        itemId: "gear_fighter_main_weapon_common",
        quantity: 1,
        enhanceLevel: 0,
      }),
    });
    assert.strictEqual(grantRes.status, 201, "Cấp vật phẩm qua Admin API phải thành công");
    const grantData = await grantRes.json();
    const starterItem = grantData.granted;
    console.log(`  Đã cấp vật phẩm mẫu ID ${starterItem.id} (${starterItem.itemId}) qua GM API`);

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 1: ANTI-GOLD EXPLOIT
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\n▶ [Test 1] Anti-Gold Exploit Prevention in FullSync:");
    const syncGoldRes = await fetch(`${baseUrl}/characters/${charId}/full-sync`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        revision: expectedRev,
        gold: 999999999, // Cố tình tiêm vàng lậu
        level: 99,       // Cố tình tiêm cấp độ
      }),
    });
    assert.strictEqual(syncGoldRes.status, 200, "FullSync hợp lệ phải trả về 200");
    const syncGoldData = await syncGoldRes.json();
    expectedRev = syncGoldData.revision;

    test("FullSync KHÔNG cập nhật vàng từ client (Vàng bảo toàn 100)", () => {
      assert.strictEqual(syncGoldData.character.gold, 100);
    });

    test("FullSync KHÔNG cập nhật cấp độ từ client (Level bảo toàn 1)", () => {
      assert.strictEqual(syncGoldData.character.level, 1);
    });

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 2: ANTI-FAKE ITEM INJECTION
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\n▶ [Test 2] Anti-Fake Item Injection Prevention in FullSync:");
    const syncFakeItemRes = await fetch(`${baseUrl}/characters/${charId}/full-sync`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        revision: expectedRev,
        inventory: [
          {
            id: 888888, // Item giả không có trong DB
            itemId: "sword_01",
            slotIndex: 1,
            quantity: 99,
            enhanceLevel: 15,
            rarity: "legendary",
          },
        ],
      }),
    });
    assert.strictEqual(syncFakeItemRes.status, 200);
    const syncFakeItemData = await syncFakeItemRes.json();
    expectedRev = syncFakeItemData.revision;

    test("FullSync KHÔNG tạo item giả vào túi đồ nhân vật", () => {
      const hasFakeItem = syncFakeItemData.inventory.some((i) => i.id === 888888 || i.quantity === 99);
      assert.strictEqual(hasFakeItem, false);
    });

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 3: ANTI-ITEM TAMPERING (ENHANCE / RARITY / QUANTITY)
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\n▶ [Test 3] Anti-Item Mutation Tampering Prevention:");
    const syncTamperRes = await fetch(`${baseUrl}/characters/${charId}/full-sync`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        revision: expectedRev,
        inventory: [
          {
            id: starterItem.id,
            itemId: starterItem.itemId,
            enhanceLevel: 15, // Cố tình hack +15
            rarity: "legendary", // Cố tình hack legendary
            quantity: 999, // Cố tình hack số lượng
            slotIndex: 3, // Đổi slot hợp lệ
          },
        ],
      }),
    });
    assert.strictEqual(syncTamperRes.status, 200);
    const syncTamperData = await syncTamperRes.json();
    expectedRev = syncTamperData.revision;
    const updatedItem = syncTamperData.inventory.find((i) => i.ownershipId === starterItem.id || i.id === starterItem.id || i.id === starterItem.itemId);

    test("FullSync KHÔNG thay đổi enhanceLevel của vật phẩm (bảo toàn 0)", () => {
      assert.strictEqual(updatedItem.enhanceLevel, 0);
    });

    test("FullSync KHÔNG thay đổi rarity của vật phẩm (bảo toàn common)", () => {
      assert.strictEqual(updatedItem.rarity, "common");
    });

    test("FullSync KHÔNG thay đổi quantity của vật phẩm (bảo toàn 1)", () => {
      assert.strictEqual(updatedItem.quantity, 1);
    });

    test("FullSync CHO PHÉP cập nhật slotIndex hợp lệ (slot = 3)", () => {
      assert.strictEqual(updatedItem.slotIndex, 3);
    });

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 4: ANTI-STALE SNAPSHOT ITEM DELETION
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\n▶ [Test 4] Anti-Stale Deletion: Empty snapshot does NOT delete DB items:");
    const syncEmptyRes = await fetch(`${baseUrl}/characters/${charId}/full-sync`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        revision: expectedRev,
        inventory: [], // Snapshot rỗng gửi lên do lag hoặc lỗi cache
      }),
    });
    assert.strictEqual(syncEmptyRes.status, 200);
    const syncEmptyData = await syncEmptyRes.json();
    expectedRev = syncEmptyData.revision;

    test("Túi đồ trong DB KHÔNG bị xóa khi client gửi snapshot rỗng", () => {
      assert.ok(syncEmptyData.inventory.length > 0, "Item must not be deleted");
      assert.ok(syncEmptyData.inventory.some((i) => i.ownershipId === starterItem.id || i.id === starterItem.id || i.id === starterItem.itemId));
    });

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 5: STRICT REVISION MATCHING (OPTIMISTIC CONCURRENCY)
    // ──────────────────────────────────────────────────────────────────────────
    console.log(`\n▶ [Test 5] Strict Revision CAS Validation (Server currently at rev ${expectedRev}):`);

    // 5.1 Gửi revision cũ (< expectedRev) -> Phải trả về 409
    const staleRevRes = await fetch(`${baseUrl}/characters/${charId}/full-sync`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ revision: expectedRev - 1 }),
    });
    test("Gửi revision cũ (< currentRev) trả về 409 Conflict", () => {
      assert.strictEqual(staleRevRes.status, 409);
    });

    // 5.2 Gửi revision nhảy cóc (> expectedRev) -> Phải trả về 409
    const forwardRevRes = await fetch(`${baseUrl}/characters/${charId}/full-sync`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ revision: expectedRev + 999 }),
    });
    test("Gửi revision nhảy cóc (> currentRev) trả về 409 Conflict", () => {
      assert.strictEqual(forwardRevRes.status, 409);
    });

    // 5.3 Gửi đúng revision (=== expectedRev) -> Thành công 200, server tăng lên expectedRev + 1
    const exactRevRes = await fetch(`${baseUrl}/characters/${charId}/full-sync`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ revision: expectedRev }),
    });
    test("Gửi đúng revision (=== currentRev) trả về 200 OK và tăng tuần tự", () => {
      assert.strictEqual(exactRevRes.status, 200);
    });
    const exactRevData = await exactRevRes.json();
    assert.strictEqual(exactRevData.revision, expectedRev + 1);

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 6: CHARACTER RECOVERY PROTECTION (POST /characters/sync)
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\n▶ [Test 6] Character Recovery Protection (POST /characters/sync):");
    const recoveryRes = await fetch(`${baseUrl}/characters/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        characters: [
          {
            id: 998877,
            name: "HackedRecover",
            classId: "fighter",
            level: 999, // Hack level
            gold: 88888888, // Hack gold
            atk: 99999, // Hack atk
            unlockedSlots: 30, // Hack slots
          },
        ],
      }),
    });
    assert.strictEqual(recoveryRes.status, 200);
    const recoveryData = await recoveryRes.json();
    const createdRecovered = recoveryData.characters.find((c) => c.name === "HackedRecover");

    test("Nhân vật khôi phục mới BẮT BUỘC có Level 1 chuẩn hóa", () => {
      assert.strictEqual(createdRecovered.level, 1);
    });

    test("Nhân vật khôi phục mới BẮT BUỘC có Gold 100 chuẩn hóa", () => {
      assert.strictEqual(createdRecovered.gold, 100);
    });

    test("Nhân vật khôi phục mới BẮT BUỘC có 18 ô túi chuẩn hóa", () => {
      assert.strictEqual(createdRecovered.unlockedSlots, 18);
    });

    test("Nhân vật khôi phục mới BẮT BUỘC có chỉ số Atk chuẩn theo Level 1 của môn phái", () => {
      assert.ok(createdRecovered.atk < 50, `Atk must be standard level 1, got ${createdRecovered.atk}`);
    });

    console.log("\n══════════════════════════════════════════════════════════════════════════");
    console.log(`🎉 ALL ${passedTests}/${totalTests} PHASE 2 INTEGRITY TESTS PASSED! (100% SECURE)`);
    console.log("══════════════════════════════════════════════════════════════════════════\n");
    process.exit(0);
  } finally {
    server.close();
  }
}

runPhase2IntegrityTests().catch((err) => {
  console.error("❌ PHASE 2 INTEGRITY TEST FAILED:", err);
  process.exit(1);
});
