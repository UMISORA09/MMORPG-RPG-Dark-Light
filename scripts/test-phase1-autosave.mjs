// scripts/test-phase1-autosave.mjs
// Verification suite for Phase 1: Auto Save & Character Data Authority
import assert from "node:assert/strict";
import http from "node:http";
import handler from "../api/index.mjs";

let server;
let baseUrl;

async function setupTestServer() {
  return new Promise((resolve) => {
    server = http.createServer((req, res) => {
      handler(req, res);
    });
    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}/api`;
      resolve();
    });
  });
}

async function request(path, options = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data, headers: res.headers };
}

async function runPhase1Tests() {
  console.log("══════════════════════════════════════════════════════════════════════");
  console.log("🛡️  PHASE 1 VERIFICATION: AUTO SAVE & CHARACTER DATA INTEGRITY");
  console.log("══════════════════════════════════════════════════════════════════════\n");

  await setupTestServer();

  try {
    const nonce = Math.floor(Math.random() * 100000);
    const userA = `p1_user_a_${nonce}`;
    const userB = `p1_user_b_${nonce}`;

    // 1. Register User A
    const regARes = await request("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        username: userA,
        password: "password123",
        email: `${userA}@clb.vn`,
      }),
    });
    assert.strictEqual(regARes.status, 201, "User A register must succeed");
    const tokenA = regARes.data.token;
    const cookieA = regARes.headers.get("set-cookie")?.split(";")[0] || "";

    // 2. Create Character for User A
    const createCharARes = await request("/characters", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}`, Cookie: cookieA },
      body: JSON.stringify({
        name: `HeroA_${nonce}`,
        classId: "fighter",
        gender: "male",
      }),
    });
    assert.strictEqual(createCharARes.status, 201, "Char A creation must succeed");
    const charA = createCharARes.data;
    const charIdA = charA.id;
    const initialGoldA = Number(charA.gold);
    const initialLevelA = Number(charA.level);
    const initialStrA = Number(charA.str);
    const initialSlotsA = Number(charA.unlockedSlots);

    console.log(`[Init] Nhân vật A (ID ${charIdA}) khởi tạo: Cấp ${initialLevelA}, Vàng: ${initialGoldA}, STR: ${initialStrA}, Ô túi: ${initialSlotsA}`);

    // 3. Test 1: Unauthenticated Auto-Save Request -> Phải từ chối 401
    const unauthSave = await request(`/characters/${charIdA}/autosave`, {
      method: "PUT",
      body: JSON.stringify({ posX: 100, posZ: 200 }),
    });
    assert.strictEqual(unauthSave.status, 401, "AutoSave không có token/session phải bị chặn 401");
    console.log("  ✔ PASS: Unauthenticated AutoSave rejected with 401 Unauthorized");

    // 4. Test 2: IDOR Cross-Account Auto-Save -> User B cố tình ghi đè nhân vật A -> Phải từ chối 403
    const regBRes = await request("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        username: userB,
        password: "password123",
        email: `${userB}@clb.vn`,
      }),
    });
    assert.strictEqual(regBRes.status, 201);
    const tokenB = regBRes.data.token;
    const cookieB = regBRes.headers.get("set-cookie")?.split(";")[0] || "";

    const idorSave = await request(`/characters/${charIdA}/autosave`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenB}`, Cookie: cookieB },
      body: JSON.stringify({ posX: 999, posZ: 999 }),
    });
    assert.strictEqual(idorSave.status, 403, "AutoSave trái chủ sở hữu phải bị chặn 403");
    console.log("  ✔ PASS: Cross-account IDOR AutoSave rejected with 403 Forbidden");

    // 5. Test 3: Client tự ý gửi Auto-Save với +100,000 Vàng và Cấp 99
    // Máy chủ phải bỏ qua các trường server-authoritative này và giữ nguyên dữ liệu gốc!
    const exploitSaveRes = await request(`/characters/${charIdA}/autosave`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenA}`, Cookie: cookieA },
      body: JSON.stringify({
        gold: 100000,
        level: 99,
        experience: 999999,
        kills: 5000,
        str: 999,
        vit: 999,
        unlockedSlots: 30,
        // Dữ liệu hợp lệ:
        posX: 125,
        posZ: -350,
        zoneId: "WILDERNESS",
        hp: 85,
        uiPreferencesJson: JSON.stringify({ showFps: true, bgmVolume: 0.8 }),
      }),
    });
    assert.strictEqual(exploitSaveRes.status, 200, "AutoSave hợp lệ về quyền phải trả về 200");
    const updatedA = exploitSaveRes.data.character;

    // Kiểm tra tính toàn vẹn: Vàng, Level, STR, Ô túi KHÔNG bị hack
    assert.strictEqual(updatedA.gold, initialGoldA, `Vàng phải được bảo toàn nguyên vẹn (${initialGoldA}), không được tự tăng thành 100000`);
    assert.strictEqual(updatedA.level, initialLevelA, `Cấp độ phải được bảo toàn (${initialLevelA}), không được tự tăng thành 99`);
    assert.strictEqual(updatedA.str, initialStrA, `Chỉ số STR phải được bảo toàn (${initialStrA}), không được tự tăng thành 999`);
    assert.strictEqual(updatedA.unlockedSlots, initialSlotsA, `Dung lượng túi phải được bảo toàn (${initialSlotsA}), không được tự tăng thành 30`);

    // Kiểm tra dữ liệu runtime hợp lệ được cập nhật thành công:
    assert.strictEqual(updatedA.posX, 125, "Tọa độ posX hợp lệ phải được cập nhật");
    assert.strictEqual(updatedA.posZ, -350, "Tọa độ posZ hợp lệ phải được cập nhật");
    assert.strictEqual(updatedA.zoneId, "WILDERNESS", "ZoneId hợp lệ phải được cập nhật");
    assert.strictEqual(updatedA.hp, 85, "HP hợp lệ phải được cập nhật");
    console.log("  ✔ PASS: Injection Attack Thwarted: Server-authoritative Gold, Level, Stats & Slots intact!");
    console.log("  ✔ PASS: Runtime Movement, Coordinates & HP safely saved.");

    // 6. Test 4: Reload / Re-fetch từ Server xác nhận dữ liệu bền vững
    const fetchCharRes = await request(`/characters/${charIdA}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${tokenA}`, Cookie: cookieA },
    });
    assert.strictEqual(fetchCharRes.status, 200);
    const reloadedChar = fetchCharRes.data;
    assert.strictEqual(reloadedChar.gold, initialGoldA);
    assert.strictEqual(reloadedChar.level, initialLevelA);
    assert.strictEqual(reloadedChar.posX, 125);
    assert.strictEqual(reloadedChar.zoneId, "WILDERNESS");
    console.log("  ✔ PASS: Reload Verification: Persisted database state is 100% consistent!");

    // 7. Test 5: UI Preferences persistence
    assert.ok(reloadedChar.uiPreferencesJson.includes("showFps"), "UI Settings phải được lưu bền vững");
    console.log("  ✔ PASS: Client UI Preferences saved and retrieved intact.");

    console.log("\n══════════════════════════════════════════════════════════════════════");
    console.log("🎉 ALL PHASE 1 TESTS PASSED! DATA INTEGRITY CONFIRMED!");
    console.log("══════════════════════════════════════════════════════════════════════\n");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ PHASE 1 TEST FAILED:", err);
    process.exit(1);
  } finally {
    if (server) server.close();
  }
}

runPhase1Tests();
