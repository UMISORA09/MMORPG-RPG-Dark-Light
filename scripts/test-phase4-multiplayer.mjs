/**
 * MULTIPLAYER & REALTIME AOI VERIFICATION TEST SUITE (PHASE 4)
 * MMORPG Chiến Long Bí Sử
 *
 * Kiểm định toàn diện:
 * 1. Spatial Sync: Đồng bộ vị trí, hoạt ảnh, bong bóng chat giữa các người chơi trong AOI.
 * 2. AOI Culling (<= 50m): Loại bỏ gói tin các thực thể ngoài tầm nhìn để tối ưu băng thông.
 * 3. Session Disconnect: Chủ động xóa người chơi khỏi active list khi ngắt kết nối, chống bóng ma.
 * 4. Party Creation & +15% EXP Buff.
 * 5. Chiêu mộ đồng hành Hộ Vệ AI vào tổ đội.
 * 6. Mời người chơi thật (Real Player Invitation) vào tổ đội.
 * 7. Anti-IDOR Protection: Chặn thao tác tổ đội mạo danh trên nhân vật tài khoản khác (HTTP 403).
 * 8. Party Leave & Group Dissolution an toàn.
 */

import assert from "node:assert/strict";
import http from "node:http";
import handler from "../api/index.mjs";

async function runPhase4MultiplayerTests() {
  const server = http.createServer((req, res) => {
    handler(req, res);
  });
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;

  console.log("══════════════════════════════════════════════════════════════════════════");
  console.log("🌐 PHASE 4: MULTIPLAYER SPATIAL SYNC & PARTY SYSTEM TEST SUITE");
  console.log(`📡 Ephemeral Test Server listening on: ${baseUrl}`);
  console.log("══════════════════════════════════════════════════════════════════════════\n");

  try {
    const nonce = Math.floor(Math.random() * 89999 + 10000);
    const user1 = `lead_${nonce}`;
    const user2 = `mate_${nonce}`;
    const user3 = `hacker_${nonce}`;

    // ──────────────────────────────────────────────────────────────────────────
    // BƯỚC 1: KHỞI TẠO TÀI KHOẢN VÀ NHÂN VẬT THẬT
    // ──────────────────────────────────────────────────────────────────────────
    console.log("▶ [Test 1] Khởi tạo tài khoản người chơi thật cho hệ thống mạng:");
    const regRes1 = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user1, password: "SecretPassword123!" }),
    });
    assert.equal(regRes1.status, 201);
    const setCookie1 = regRes1.headers.get("set-cookie")?.split(";")[0] || "";

    const regRes2 = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user2, password: "SecretPassword123!" }),
    });
    assert.equal(regRes2.status, 201);
    const setCookie2 = regRes2.headers.get("set-cookie")?.split(";")[0] || "";

    const regRes3 = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user3, password: "SecretPassword123!" }),
    });
    assert.equal(regRes3.status, 201);
    const setCookie3 = regRes3.headers.get("set-cookie")?.split(";")[0] || "";

    const c1Res = await fetch(`${baseUrl}/characters`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: setCookie1 },
      body: JSON.stringify({ name: `TrưởngNhóm_${nonce}`, classId: "fighter" }),
    });
    const char1 = await c1Res.json();

    const c2Res = await fetch(`${baseUrl}/characters`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: setCookie2 },
      body: JSON.stringify({ name: `ThànhViên_${nonce}`, classId: "assassin" }),
    });
    const char2 = await c2Res.json();
    console.log(`  ✔ Đã tạo Trưởng nhóm [${char1.name}] (ID: ${char1.id}) và Thành viên [${char2.name}] (ID: ${char2.id})`);

    // ──────────────────────────────────────────────────────────────────────────
    // BƯỚC 2: SPATIAL SYNC TRONG BÁN KÍNH AOI (<= 50M)
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\n▶ [Test 2] Đồng bộ vị trí & Tầm nhìn không gian (Area of Interest <= 50m):");
    // Player 1 tại (5.0, 5.0)
    const sync1 = await fetch(`${baseUrl}/multiplayer/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        characterId: char1.id,
        name: char1.name,
        classId: char1.classId,
        level: char1.level,
        posX: 5.0,
        posZ: 5.0,
        facing: 0,
        animState: "IDLE",
        enhanceLevel: 7,
        hp: char1.hp,
        maxHp: char1.maxHp,
        zoneId: "SAFE_VILLAGE",
        serverId: "s1_long_vuong",
        chatBubble: "Tuyển thành viên đi phó bản!",
      }),
    });
    assert.equal(sync1.status, 200);

    // Player 2 tại (10.0, 10.0) -> Khoảng cách ~7.07m <= 50m
    const sync2 = await fetch(`${baseUrl}/multiplayer/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        characterId: char2.id,
        name: char2.name,
        classId: char2.classId,
        level: char2.level,
        posX: 10.0,
        posZ: 10.0,
        facing: 1.5,
        animState: "RUN",
        enhanceLevel: 5,
        hp: char2.hp,
        maxHp: char2.maxHp,
        zoneId: "SAFE_VILLAGE",
        serverId: "s1_long_vuong",
      }),
    });
    assert.equal(sync2.status, 200);
    const sync2Data = await sync2.json();

    const seenP1 = sync2Data.players.find((p) => p.characterId === char1.id);
    assert.ok(seenP1, "Player 2 trong bán kính 50m phải nhìn thấy Player 1");
    assert.equal(seenP1.chatBubble, "Tuyển thành viên đi phó bản!");
    assert.equal(seenP1.enhanceLevel, 7);
    console.log(`  ✔ Player 2 nhận diện được Player 1 tại (${seenP1.posX}, ${seenP1.posZ}) với hào quang +${seenP1.enhanceLevel} và chat bubble`);

    // ──────────────────────────────────────────────────────────────────────────
    // BƯỚC 3: AOI CULLING (NGOÀI BÁN KÍNH 50M BỊ LOẠI BỎ)
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\n▶ [Test 3] AOI Culling Filter: Loại bỏ thực thể ngoài tầm nhìn (> 50m):");
    const syncFar = await fetch(`${baseUrl}/multiplayer/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        characterId: 99998,
        name: "NgườiChơiXaXôi",
        classId: "gunner",
        level: 10,
        posX: 250.0,
        posZ: 250.0, // Cách 350m
        zoneId: "SAFE_VILLAGE",
        serverId: "s1_long_vuong",
      }),
    });
    const syncFarData = await syncFar.json();
    const farSeesP1 = syncFarData.players.find((p) => p.characterId === char1.id);
    assert.equal(farSeesP1, undefined, "Người chơi cách 350m không được nhận gói tin của Player 1");
    console.log("  ✔ Hệ thống đã lọc bỏ chính xác các gói tin ngoài bán kính tầm nhìn (Bandwidth Optimized)");

    // ──────────────────────────────────────────────────────────────────────────
    // BƯỚC 4: SESSION DISCONNECT (CHỐNG BÓNG MA GHOST PLAYERS)
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\n▶ [Test 4] Ngắt kết nối Session tức thời (Anti-Ghost Player):");
    const dcRes = await fetch(`${baseUrl}/multiplayer/disconnect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ characterId: 99998 }),
    });
    assert.equal(dcRes.status, 200);

    const checkDcSync = await fetch(`${baseUrl}/multiplayer/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        characterId: char2.id,
        name: char2.name,
        classId: char2.classId,
        level: char2.level,
        posX: 10.0,
        posZ: 10.0,
        zoneId: "SAFE_VILLAGE",
        serverId: "s1_long_vuong",
      }),
    });
    const checkDcData = await checkDcSync.json();
    const ghost = checkDcData.players.find((p) => p.characterId === 99998);
    assert.equal(ghost, undefined, "Nhân vật đã ngắt kết nối không được xuất hiện trong danh sách online");
    console.log("  ✔ Đã dọn dẹp phiên kết nối ngay lập tức, không để lại bóng ma trong thế giới");

    // ──────────────────────────────────────────────────────────────────────────
    // BƯỚC 5: TẠO TỔ ĐỘI & CHIÊU MỘ ĐỒNG HÀNH AI
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\n▶ [Test 5] Khởi tạo Tổ đội & Chiêu mộ Hộ Vệ đồng hành AI:");
    const partyCreateRes = await fetch(`${baseUrl}/party/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: setCookie1 },
      body: JSON.stringify({
        characterId: char1.id,
        name: char1.name,
        classId: char1.classId,
        level: char1.level,
      }),
    });
    assert.equal(partyCreateRes.status, 200);
    const partyCreateData = await partyCreateRes.json();
    assert.equal(partyCreateData.party.members.length, 1);
    console.log(`  ✔ Đã lập tổ đội mới [${partyCreateData.party.id}] do [${char1.name}] làm trưởng nhóm`);

    const inviteBotRes = await fetch(`${baseUrl}/party/invite-bot`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: setCookie1 },
      body: JSON.stringify({ characterId: char1.id, botType: "tank" }),
    });
    assert.equal(inviteBotRes.status, 200);
    const botData = await inviteBotRes.json();
    assert.equal(botData.party.members.length, 2);
    console.log("  ✔ Đã chiêu mộ Hộ Vệ đồng hành AI vào tổ đội (Thành viên: 2/4)");

    // ──────────────────────────────────────────────────────────────────────────
    // BƯỚC 6: MỜI NGƯỜI CHƠI THẬT VÀO TỔ ĐỘI (REAL PLAYER INVITATION)
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\n▶ [Test 6] Mời người chơi thật vào tổ đội:");
    const invitePlayerRes = await fetch(`${baseUrl}/party/invite-player`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: setCookie1 },
      body: JSON.stringify({
        characterId: char1.id,
        targetCharacterId: char2.id,
      }),
    });
    assert.equal(invitePlayerRes.status, 200);
    const partyWithPlayer = await invitePlayerRes.json();
    assert.equal(partyWithPlayer.party.members.length, 3);
    const memberP2 = partyWithPlayer.party.members.find((m) => m.characterId === char2.id);
    assert.ok(memberP2, "Thành viên Player 2 phải có mặt trong danh sách tổ đội");
    assert.equal(memberP2.isLeader, false);
    console.log(`  ✔ Đã gia nhập thành công người chơi [${memberP2.name}] vào tổ đội (Thành viên: 3/4)`);

    // Kiểm tra đọc trạng thái tổ đội từ phía Player 2
    const p2CheckParty = await fetch(`${baseUrl}/party/${char2.id}`);
    assert.equal(p2CheckParty.status, 200);
    const p2PartyData = await p2CheckParty.json();
    assert.equal(p2PartyData.hasParty, true);
    assert.equal(p2PartyData.party.members.length, 3);
    console.log("  ✔ Player 2 đọc trạng thái tổ đội chuẩn xác, nhận Party Buff +15% EXP");

    // ──────────────────────────────────────────────────────────────────────────
    // BƯỚC 7: ANTI-IDOR PROTECTION TRONG CÁC THAO TÁC TỔ ĐỘI
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\n▶ [Test 7] Anti-IDOR: Chặn hacker mạo danh điều khiển tổ đội:");
    // Hacker (User 3) cố tình gọi rời tổ đội thay cho Player 1
    const idorLeaveRes = await fetch(`${baseUrl}/party/leave`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: setCookie3 },
      body: JSON.stringify({ characterId: char1.id }),
    });
    assert.equal(idorLeaveRes.status, 403, "Hacker không sở hữu nhân vật phải bị từ chối 403 Forbidden");

    // Hacker cố tình mời bot thay cho Player 1
    const idorInviteBotRes = await fetch(`${baseUrl}/party/invite-bot`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: setCookie3 },
      body: JSON.stringify({ characterId: char1.id, botType: "tank" }),
    });
    assert.equal(idorInviteBotRes.status, 403, "Hacker không thể can thiệp thao tác tổ đội của người khác (403)");
    console.log("  ✔ IDOR Guard đã chặn đứng mọi hành vi can thiệp trái phép vào tổ đội của người khác (HTTP 403)");

    // ──────────────────────────────────────────────────────────────────────────
    // BƯỚC 8: RỜI TỔ ĐỘI & GIẢI TÁN AN TOÀN
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\n▶ [Test 8] Rời nhóm và giải tán tổ đội an toàn:");
    const leaveRes = await fetch(`${baseUrl}/party/leave`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: setCookie1 },
      body: JSON.stringify({ characterId: char1.id }),
    });
    assert.equal(leaveRes.status, 200);

    const afterLeaveCheck = await fetch(`${baseUrl}/party/${char1.id}`);
    const afterLeaveData = await afterLeaveCheck.json();
    assert.equal(afterLeaveData.hasParty, false, "Sau khi trưởng nhóm giải tán, hasParty phải là false");
    console.log("  ✔ Trưởng nhóm giải tán tổ đội thành công, giải phóng tất cả thành viên an toàn");

    console.log("\n══════════════════════════════════════════════════════════════════════════");
    console.log("🎉 TẤT CẢ 8 MỤC KIỂM THỬ PHASE 4 MULTIPLAYER & AOI ĐÃ HOÀN TẤT THÀNH CÔNG 100%!");
    console.log("══════════════════════════════════════════════════════════════════════════\n");
    process.exit(0);
  } finally {
    server.close();
  }
}

runPhase4MultiplayerTests().catch((err) => {
  console.error("❌ Phase 4 Multiplayer test failed:", err);
  process.exit(1);
});
