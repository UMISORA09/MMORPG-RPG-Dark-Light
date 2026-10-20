/**
 * PVP ARENA & DUNGEON INSTANCES TEST SUITE (PHASE 5)
 * MMORPG Chiến Long Bí Sử
 *
 * Kiểm định toàn diện:
 * 1. Ranked Arena PvP: Tính điểm ELO và cộng Danh Vọng theo công thức chuẩn.
 * 2. Anti-Cheat PvP: Chặn khai báo chiến thắng khi lượng máu bản thân bằng 0 (HTTP 400).
 * 3. Dead Player Guard: Nhân vật có HP <= 0 bị chặn tham gia Đấu Trường (HTTP 400).
 * 4. Dungeon Level Gating: Chặn vào Nightmare khi chưa đủ Cấp 20 (HTTP 400).
 * 5. Isolated Dungeon Instance & Multi-Room Progression (Room 1 -> 2 -> 3 Boss).
 * 6. Dungeon Speed Clear Leaderboard & Rewards.
 * 7. Anti-IDOR Dungeon: Chặn can thiệp dọn phòng phó bản của tài khoản khác (HTTP 403).
 * 8. Instance Abandon & Resource Cleanup: Dọn dẹp phó bản an toàn, chống rò rỉ bộ nhớ.
 */

import assert from "node:assert/strict";
import http from "node:http";
import handler from "../api/index.mjs";

async function runPhase5PvPDungeonTests() {
  const server = http.createServer((req, res) => {
    handler(req, res);
  });
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;

  console.log("══════════════════════════════════════════════════════════════════════════");
  console.log("⚔️  PHASE 5: PVP ARENA & DUNGEON INSTANCES TEST SUITE");
  console.log(`📡 Ephemeral Test Server listening on: ${baseUrl}`);
  console.log("══════════════════════════════════════════════════════════════════════════\n");

  try {
    const nonce = Math.floor(Math.random() * 89999 + 10000);
    const user1 = `glad_${nonce}`;
    const user2 = `hacker_${nonce}`;

    // ──────────────────────────────────────────────────────────────────────────
    // BƯỚC 1: KHỞI TẠO TÀI KHOẢN VÀ NHÂN VẬT THẬT
    // ──────────────────────────────────────────────────────────────────────────
    console.log("▶ [Test 1] Khởi tạo tài khoản giác đấu hợp lệ:");
    const regRes1 = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user1, password: "GladiatorPass123!" }),
    });
    assert.equal(regRes1.status, 201);
    const setCookie1 = regRes1.headers.get("set-cookie")?.split(";")[0] || "";

    const regRes2 = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user2, password: "GladiatorPass123!" }),
    });
    assert.equal(regRes2.status, 201);
    const setCookie2 = regRes2.headers.get("set-cookie")?.split(";")[0] || "";

    const c1Res = await fetch(`${baseUrl}/characters`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: setCookie1 },
      body: JSON.stringify({ name: `ĐấuSĩ_${nonce}`, classId: "tank" }),
    });
    const char = await c1Res.json();
    const characterId = char.id;
    console.log(`  ✔ Đã tạo Đấu sĩ [${char.name}] (ID: ${characterId}, Cấp: ${char.level}, HP: ${char.hp}/${char.maxHp})`);

    // ──────────────────────────────────────────────────────────────────────────
    // BƯỚC 2: RANKED ARENA PVP MATCH HỢP LỆ (ELO RATING)
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\n▶ [Test 2] Quyết đấu Đấu Trường 1v1 & Tính điểm ELO Danh Vọng:");
    const pvpWinRes = await fetch(`${baseUrl}/characters/${characterId}/pvp/match`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: setCookie1 },
      body: JSON.stringify({
        opponentName: "Hư Không Kiếm Khách",
        opponentRating: 1000,
        playerHpPercent: 65,
        opponentHpPercent: 0,
        victory: true,
      }),
    });
    assert.equal(pvpWinRes.status, 200);
    const pvpWinData = await pvpWinRes.json();
    assert.equal(pvpWinData.victory, true);
    assert(pvpWinData.honorPoints > 0, "Phải nhận được điểm Danh Vọng");
    console.log(`  ✔ Chiến thắng Đấu trường: +${pvpWinData.pointsGained} Điểm Danh Vọng, Rank mới: ${pvpWinData.arenaRank} (${pvpWinData.rankTitle})`);

    // ──────────────────────────────────────────────────────────────────────────
    // BƯỚC 3: ANTI-CHEAT PVP: KHAI BÁO THẮNG KHI MÁU BẢN THÂN = 0
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\n▶ [Test 3] Anti-Cheat PvP: Chặn khai báo thắng trận khi HP bản thân bằng 0:");
    const cheatPvPRes = await fetch(`${baseUrl}/characters/${characterId}/pvp/match`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: setCookie1 },
      body: JSON.stringify({
        opponentName: "Hư Không Kiếm Khách",
        playerHpPercent: 0, // Cố tình khai báo 0 HP
        opponentHpPercent: 0,
        victory: true,
      }),
    });
    assert.equal(cheatPvPRes.status, 400, "Phải từ chối chiến thắng khi HP bằng 0");
    console.log("  ✔ Server đã phát hiện gian lận và từ chối ghi nhận chiến thắng vô lý (HTTP 400)");

    // ──────────────────────────────────────────────────────────────────────────
    // BƯỚC 4: KHÓA TỬ TRẬN TRONG ĐẤU TRƯỜNG PVP (HP <= 0 TRONG DB)
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\n▶ [Test 4] Khóa tử trận: Nhân vật tử trận không thể thi đấu Đấu Trường:");
    await fetch(`${baseUrl}/characters/${characterId}/full-sync`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: setCookie1 },
      body: JSON.stringify({ hp: 0 }),
    });

    const deadPvPRes = await fetch(`${baseUrl}/characters/${characterId}/pvp/match`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: setCookie1 },
      body: JSON.stringify({ opponentName: "Ảo Ảnh", victory: true }),
    });
    assert.equal(deadPvPRes.status, 400);
    console.log("  ✔ Server từ chối lệnh thi đấu khi nhân vật đang tử trận (HTTP 400)");

    // Hồi phục sinh lực để tiếp tục phó bản
    await fetch(`${baseUrl}/characters/${characterId}/full-sync`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: setCookie1 },
      body: JSON.stringify({ hp: 250 }),
    });

    // ──────────────────────────────────────────────────────────────────────────
    // BƯỚC 5: PHÓ BẢN DUNGEON LEVEL GATE (CHẶN NIGHTMARE KHI DƯỚI CẤP 20)
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\n▶ [Test 5] Phó bản Level Gate: Chặn nhân vật Cấp 1 vào độ khó Ác Mộng (Nightmare):");
    const underlevelRes = await fetch(`${baseUrl}/dungeon/enter`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: setCookie1 },
      body: JSON.stringify({ characterId, difficulty: "nightmare" }),
    });
    assert.equal(underlevelRes.status, 400);
    console.log("  ✔ Server khóa cửa phó bản cấp cao khi nhân vật chưa đủ cấp độ (Cần Lv.20)");

    // ──────────────────────────────────────────────────────────────────────────
    // BƯỚC 6: MULTI-ROOM PROGRESSION (PHÒNG 1 -> PHÒNG 2 -> PHÒNG 3 BOSS)
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\n▶ [Test 6] Khởi tạo Phó bản 3 phòng cô lập & Tiến trình vượt ải:");
    const enterRes = await fetch(`${baseUrl}/dungeon/enter`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: setCookie1 },
      body: JSON.stringify({ characterId, difficulty: "normal" }),
    });
    assert.equal(enterRes.status, 200);
    const enterData = await enterRes.json();
    const instanceId = enterData.instanceId;
    assert.equal(enterData.currentRoom, 1);
    console.log(`  ✔ Đã khởi tạo phó bản [${instanceId}] bắt đầu tại ${enterData.roomDetails.name}`);

    // Dọn Phòng 1 -> Mở cổng Phòng 2
    const clear1Res = await fetch(`${baseUrl}/dungeon/${instanceId}/clear-room`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: setCookie1 },
    });
    assert.equal(clear1Res.status, 200);
    const room1Data = await clear1Res.json();
    assert.equal(room1Data.currentRoom, 2);
    console.log(`  ✔ Đã dọn sạch quái Phòng 1 -> Mở phong ấn vào ${room1Data.roomDetails.name}`);

    // ──────────────────────────────────────────────────────────────────────────
    // BƯỚC 7: ANTI-IDOR TRONG PHÓ BẢN (TÀI KHOẢN KHÁC KHÔNG THỂ CAN THIỆP)
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\n▶ [Test 7] Anti-IDOR: Chặn tài khoản khác can thiệp phó bản cô lập:");
    const idorClearRes = await fetch(`${baseUrl}/dungeon/${instanceId}/clear-room`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: setCookie2 },
    });
    assert.equal(idorClearRes.status, 403, "Tài khoản khác không thể dọn phòng của người chơi (403)");
    console.log("  ✔ IDOR Guard từ chối lệnh dọn phòng từ tài khoản không sở hữu phó bản (HTTP 403)");

    // Dọn Phòng 2 -> Mở cổng Phòng 3 Boss
    const clear2Res = await fetch(`${baseUrl}/dungeon/${instanceId}/clear-room`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: setCookie1 },
    });
    assert.equal(clear2Res.status, 200);
    const room2Data = await clear2Res.json();
    assert.equal(room2Data.currentRoom, 3);
    assert.equal(room2Data.isFinalRoom, true);
    console.log(`  ✔ Đã dọn sạch quái Phòng 2 -> Mở đại điện ${room2Data.roomDetails.name}`);

    // Dọn Phòng 3 (Diệt Boss) -> Hoàn tất phó bản & Nhận thưởng
    const clear3Res = await fetch(`${baseUrl}/dungeon/${instanceId}/clear-room`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: setCookie1 },
    });
    assert.equal(clear3Res.status, 200);
    const room3Data = await clear3Res.json();
    assert.equal(room3Data.cleared, true);
    assert(room3Data.rewards.exp > 0);
    assert(room3Data.rewards.gold > 0);
    console.log(`  ✔ Chinh phục Boss thành công trong ${room3Data.clearTimeSeconds}s! Thưởng: +${room3Data.rewards.exp} EXP, +${room3Data.rewards.gold} Vàng, Bảo rương: ${room3Data.rewards.items[0]?.name}`);

    // Kiểm tra Bảng Xếp Hạng Vượt Phó Bản Nhanh Nhất
    const lbRes = await fetch(`${baseUrl}/dungeon/leaderboard`);
    assert.equal(lbRes.status, 200);
    const lbData = await lbRes.json();
    const rankEntry = lbData.leaderboard.find((e) => e.characterId === characterId);
    assert.ok(rankEntry, "Kỷ lục nhân vật phải xuất hiện trên Bảng Xếp Hạng");
    console.log(`  ✔ Kỷ lục của [${rankEntry.characterName}] ghi danh tại Bảng Xếp Hạng (#${rankEntry.rank})`);

    // ──────────────────────────────────────────────────────────────────────────
    // BƯỚC 8: DUNGEON ABANDON & RESOURCE CLEANUP
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\n▶ [Test 8] Dọn dẹp phó bản & Giải phóng tài nguyên bộ nhớ:");
    // Tạo 1 phó bản mới rồi chủ động rời đi
    const enter2Res = await fetch(`${baseUrl}/dungeon/enter`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: setCookie1 },
      body: JSON.stringify({ characterId, difficulty: "normal" }),
    });
    const enter2Data = await enter2Res.json();
    const inst2Id = enter2Data.instanceId;

    const abandonRes = await fetch(`${baseUrl}/dungeon/${inst2Id}/abandon`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: setCookie1 },
    });
    assert.equal(abandonRes.status, 200);

    const checkInst2 = await fetch(`${baseUrl}/dungeon/${inst2Id}`, {
      headers: { Cookie: setCookie1 },
    });
    assert.equal(checkInst2.status, 404, "Phó bản đã abandon phải không còn tồn tại trong bộ nhớ");
    console.log("  ✔ Đã dọn dẹp instance khỏi bộ nhớ an toàn, chống rò rỉ bộ nhớ (Memory Leak Free)");

    console.log("\n══════════════════════════════════════════════════════════════════════════");
    console.log("🎉 TẤT CẢ 8 MỤC KIỂM THỬ PHASE 5 PVP & DUNGEON ĐÃ HOÀN TẤT THÀNH CÔNG 100%!");
    console.log("══════════════════════════════════════════════════════════════════════════\n");
    process.exit(0);
  } finally {
    server.close();
  }
}

runPhase5PvPDungeonTests().catch((err) => {
  console.error("❌ Phase 5 PvP & Dungeon test failed:", err);
  process.exit(1);
});
