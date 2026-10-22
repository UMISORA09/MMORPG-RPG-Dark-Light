/**
 * Test Suite: Single-Session Enforcement & Duplicate Session Kickout
 * Verifies that:
 * 1. Only 1 active session can play 1 account/character at any time.
 * 2. When a duplicate session claims the character/account, the previous session is immediately displaced.
 * 3. The displaced session's autosave is rejected (409 Conflict) to prevent data corruption.
 * 4. The displaced session's multiplayer sync returns { kick: true }.
 */

import http from "node:http";
import handler from "../api/index.mjs";

async function run() {
  console.log("══════════════════════════════════════════════════════════════════════════");
  console.log("🛡️ KIỂM THỬ: SINGLE-SESSION ENFORCEMENT & DUPLICATE DISPLACEMENT");
  console.log("══════════════════════════════════════════════════════════════════════════");

  const server = http.createServer((req, res) => {
    handler(req, res);
  });
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;

  try {
    const testUser = `usr_${Date.now().toString().slice(-8)}`;
    const password = "Password123!";

    // 1. Register Account
    console.log(`1. Đăng ký tài khoản thử nghiệm (${testUser})...`);
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: testUser, password }),
    });
    if (!regRes.ok) {
      const errText = await regRes.text();
      throw new Error(`Đăng ký thất bại: ${regRes.status} - ${errText}`);
    }
    const regData = await regRes.json();
    const token1 = regData.token;
    const userId = regData.user.id;
    console.log(`   -> Tạo thành công user ID: ${userId}, token 1 cấp`);

    // 2. Create Character
    console.log("2. Tạo nhân vật cho tài khoản...");
    const charRes = await fetch(`${baseUrl}/characters`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({
        name: `H_${Date.now().toString().slice(-6)}`,
        classId: "fighter",
        gender: "male",
      }),
    });
    if (!charRes.ok) {
      const errText = await charRes.text();
      throw new Error(`Tạo nhân vật thất bại: ${charRes.status} - ${errText}`);
    }
    const charData = await charRes.json();
    const charId = charData.id;
    console.log(`   -> Nhân vật ID: ${charId} (${charData.name})`);

    // 3. Tab 1: Claim session #1
    const session1 = `tab_session_1_${Date.now()}`;
    console.log(`3. Tab 1 tham gia game với Session: ${session1}...`);
    const claim1Res = await fetch(`${baseUrl}/session/claim`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token1}`,
        "x-session-id": session1,
      },
      body: JSON.stringify({ characterId: charId, sessionId: session1 }),
    });
    const claim1Data = await claim1Res.json();
    if (!claim1Data.success) throw new Error("Tab 1 claim session thất bại");
    console.log("   -> Tab 1 đã đăng ký quyền sở hữu phiên chơi thành công.");

    // 4. Tab 1: Sync & AutoSave check
    console.log("4. Tab 1 gửi autosave và multiplayer sync...");
    const save1Res = await fetch(`${baseUrl}/characters/${charId}/autosave`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token1}`,
        "x-session-id": session1,
      },
      body: JSON.stringify({ posX: 50, posZ: 60, hp: 500 }),
    });
    if (!save1Res.ok) throw new Error(`Tab 1 autosave lỗi: ${save1Res.status}`);
    console.log("   -> Tab 1 autosave thành công!");

    // 5. Tab 2: Duplicate session opens same character
    const session2 = `tab_session_2_DUPLICATE_${Date.now()}`;
    console.log(`5. Tab 2 (Thiết bị mới/Cửa sổ trùng lặp) mở cùng nhân vật với Session: ${session2}...`);
    const claim2Res = await fetch(`${baseUrl}/session/claim`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token1}`,
        "x-session-id": session2,
      },
      body: JSON.stringify({ characterId: charId, sessionId: session2 }),
    });
    const claim2Data = await claim2Res.json();
    if (!claim2Data.success) throw new Error("Tab 2 claim session thất bại");
    console.log(`   -> Tab 2 đã chiếm quyền sở hữu! Phiên bị thay thế: ${claim2Data.displacedSessionId}`);
    if (claim2Data.displacedSessionId !== session1) {
      throw new Error(`Kỳ vọng displacedSessionId là ${session1}, nhưng nhận được ${claim2Data.displacedSessionId}`);
    }

    // 6. Tab 1: Attempts to AutoSave with stale session1 -> MUST BE REJECTED WITH 409 CONFLICT!
    console.log("6. Kiểm tra Tab 1 (phiên cũ) cố gắng gửi autosave...");
    const staleSaveRes = await fetch(`${baseUrl}/characters/${charId}/autosave`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token1}`,
        "x-session-id": session1,
      },
      body: JSON.stringify({ posX: 999, posZ: 999, hp: 10 }), // Stale conflicting state
    });

    console.log(`   -> Kết quả AutoSave từ Tab 1: Status HTTP ${staleSaveRes.status}`);
    if (staleSaveRes.status !== 409) {
      throw new Error(`Kỳ vọng HTTP 409 Conflict nhưng nhận được ${staleSaveRes.status}`);
    }
    const staleSaveData = await staleSaveRes.json();
    console.log(`   -> Phản hồi:`, staleSaveData);
    if (!staleSaveData.kick || staleSaveData.error !== "DUPLICATE_SESSION") {
      throw new Error("Phản hồi không chứa mã DUPLICATE_SESSION hoặc kick: true");
    }

    // 7. Tab 1: Attempts Multiplayer Sync with stale session1 -> MUST RECEIVE KICK NOTIFICATION!
    console.log("7. Kiểm tra Tab 1 gửi realtime multiplayer sync...");
    const staleSyncRes = await fetch(`${baseUrl}/multiplayer/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token1}`,
        "x-session-id": session1,
      },
      body: JSON.stringify({ characterId: charId, sessionId: session1, posX: 999, posZ: 999 }),
    });
    const staleSyncData = await staleSyncRes.json();
    console.log(`   -> Phản hồi Sync từ Tab 1:`, staleSyncData);
    if (!staleSyncData.kick || staleSyncData.error !== "DUPLICATE_SESSION") {
      throw new Error("Phản hồi sync không kích hoạt kick: true cho phiên cũ");
    }

    console.log("══════════════════════════════════════════════════════════════════════════");
    console.log("🎉 TẤT CẢ CÁC ĐIỀU KIỆN SINGLE-SESSION VÀ DISPLACEMENT ĐỀU ĐẠT CHUẨN 100%!");
    console.log("══════════════════════════════════════════════════════════════════════════");
  } finally {
    server.close(() => {
      process.exit(0);
    });
    // Fallback in case callback is delayed
    setTimeout(() => process.exit(0), 100).unref();
  }
}

run().catch((err) => {
  console.error("❌ TEST FAILED:", err);
  process.exit(1);
});
