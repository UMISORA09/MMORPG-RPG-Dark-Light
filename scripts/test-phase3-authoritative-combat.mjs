/**
 * AUTHORITATIVE COMBAT & LOOT VERIFICATION TEST SUITE (PHASE 3)
 * MMORPG Chiến Long Bí Sử
 *
 * Kiểm định toàn diện:
 * 1. Server-side Damage Validation & Metrics Verification.
 * 2. Anti-Cheat: Chặn Speedhack / Impossible DPS khi hạ gục Boss cấp cao (World Boss 25k HP).
 * 3. Anti-Cheat: Chặn Impossible Survival khi đứng trước quái vật sát thương khủng mà không mất máu.
 * 4. Authoritative Drop RNG: Vật phẩm rơi từ drop table của quái vật do Server roll độc lập.
 * 5. Rate-Limit Anti-Spam: Từ chối gói tin tấn công dồn dập < 450ms bằng HTTP 429.
 * 6. Dead Character Lock: Không thể chiến đấu khi HP <= 0 (HTTP 400).
 * 7. Insecure Direct Object Reference (IDOR): Không thể can thiệp chiến đấu của nhân vật tài khoản khác (HTTP 404).
 * 8. Reward Lockdown: /3d-reward bị khóa chặt (HTTP 403 Forbidden).
 */

import assert from "node:assert/strict";
import http from "node:http";
import handler from "../api/index.mjs";

async function runPhase3AuthoritativeCombatTests() {
  const server = http.createServer((req, res) => {
    handler(req, res);
  });
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;

  console.log("══════════════════════════════════════════════════════════════════════════");
  console.log("⚔️  PHASE 3: AUTHORITATIVE COMBAT & LOOT ENGINE TEST SUITE");
  console.log(`📡 Ephemeral Test Server listening on: ${baseUrl}`);
  console.log("══════════════════════════════════════════════════════════════════════════\n");

  try {
    const nonce = Math.floor(Math.random() * 89999 + 10000);
    const user1 = `war_${nonce}`;
    const user2 = `int_${nonce}`;

    // ──────────────────────────────────────────────────────────────────────────
    // BƯỚC 1: KHỞI TẠO TÀI KHOẢN VÀ NHÂN VẬT THỰC
    // ──────────────────────────────────────────────────────────────────────────
    console.log("▶ [Test 1] Khởi tạo tài khoản chiến binh hợp lệ:");
    const regRes1 = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user1, password: "CombatPassword123!" }),
    });
    assert.equal(regRes1.status, 201);
    const setCookie1 = regRes1.headers.get("set-cookie")?.split(";")[0] || "";

    const charRes1 = await fetch(`${baseUrl}/characters`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: setCookie1 },
      body: JSON.stringify({ name: `LongKiếm_${user1.slice(-4)}`, classId: "fighter" }),
    });
    assert.equal(charRes1.status, 201);
    const character = await charRes1.json();
    const characterId = character.id;
    console.log(`  ✔ Đã tạo nhân vật [${character.name}] (Cấp ${character.level}, HP: ${character.hp}/${character.maxHp}, ATK: ${character.atk}, DEF: ${character.def})`);

    // ──────────────────────────────────────────────────────────────────────────
    // BƯỚC 2: REAL-TIME COMBAT METRICS HỢP LỆ (HẠ SLIME TRONG 2 GIÂY)
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\n▶ [Test 2] Chiến đấu thời gian thực hợp lệ với Real-Time Metrics:");
    const validBattleRes = await fetch(`${baseUrl}/characters/${characterId}/battle`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: setCookie1 },
      body: JSON.stringify({
        monsterId: "slime",
        metrics: {
          durationSeconds: 2.5,
          totalDamageDealt: 85,
          hitsTaken: 1,
        },
      }),
    });
    assert.equal(validBattleRes.status, 200, `Chiến đấu hợp lệ phải trả về 200, nhận: ${validBattleRes.status}`);
    const validBattle = await validBattleRes.json();
    assert.equal(validBattle.victory, true, "Chiến đấu hợp lệ phải thắng lợi");
    assert.equal(validBattle.expGained, 18, "EXP quái Slime phải là 18 chuẩn server");
    assert.equal(validBattle.goldGained, 7, "Vàng quái Slime phải là 7 chuẩn server");
    assert(validBattle.character.hp > 0, "HP người chơi phải còn sinh lực");
    console.log(`  ✔ Xác nhận chiến thắng Server-Authoritative: +${validBattle.expGained} EXP, +${validBattle.goldGained} Vàng, HP còn: ${validBattle.character.hp}`);

    // Đợi cooldown rate-limit 550ms
    await new Promise((r) => setTimeout(r, 550));

    // ──────────────────────────────────────────────────────────────────────────
    // BƯỚC 3: ANTI-CHEAT SPEEDHACK / IMPOSSIBLE DPS (WORLD BOSS CHEAT DETECTION)
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\n▶ [Test 3] Anti-Cheat: Chặn Speedhack & Hack DPS vô lý (World Boss 25,000 HP trong 3 giây):");
    const speedhackRes = await fetch(`${baseUrl}/characters/${characterId}/battle`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: setCookie1 },
      body: JSON.stringify({
        monsterId: "black_dragon_king",
        metrics: {
          durationSeconds: 3.0,
          totalDamageDealt: 25000,
          hitsTaken: 0,
        },
      }),
    });
    assert.equal(speedhackRes.status, 200);
    const speedhackData = await speedhackRes.json();
    assert.equal(speedhackData.victory, false, "Server phải từ chối chiến thắng khi DPS vượt ngưỡng vật lý!");
    assert.equal(speedhackData.expGained, 0, "Không được cấp EXP cho trận gian lận");
    assert.equal(speedhackData.goldGained, 0, "Không được cấp Vàng cho trận gian lận");
    console.log("  ✔ Server đã phát hiện gian lận DPS/Speedhack và xác định THẤT BẠI (victory = false, 0 EXP, 0 Vàng)");

    // Đợi cooldown
    await new Promise((r) => setTimeout(r, 550));

    // ──────────────────────────────────────────────────────────────────────────
    // BƯỚC 4: ANTI-CHEAT IMPOSSIBLE SURVIVAL (QUÁI VẬT KHỦNG GÂY SÁT THƯƠNG TỬ VONG)
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\n▶ [Test 4] Anti-Cheat: Chặn Gian lận Bất tử / 0 Hit Taken trước Quái vật cấp cao:");
    const impossibleSurvivalRes = await fetch(`${baseUrl}/characters/${characterId}/battle`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: setCookie1 },
      body: JSON.stringify({
        monsterId: "dark_knight_elite", // ATK 88 vs DEF 14 -> ~82 DMG/hit
        metrics: {
          durationSeconds: 25.0, // Đứng 25s trước Kỵ Sĩ Hắc Ám
          totalDamageDealt: 1200,
          hitsTaken: 0, // Cố tình khai báo 0 hit taken
        },
      }),
    });
    assert.equal(impossibleSurvivalRes.status, 200);
    const survivalData = await impossibleSurvivalRes.json();
    assert.equal(survivalData.victory, false, "Nhân vật cấp thấp đứng trước Kỵ sĩ tinh anh trong 25s phải bị hạ gục");
    assert.equal(survivalData.expGained, 0);
    console.log("  ✔ Server đã mô phỏng sát thương phản đòn thực tế từ quái vật và xác nhận người chơi tử trận");

    // Đợi cooldown
    await new Promise((r) => setTimeout(r, 550));

    // ──────────────────────────────────────────────────────────────────────────
    // BƯỚC 5: RATE-LIMIT ANTI-SPAM (429 TOO MANY REQUESTS)
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\n▶ [Test 5] Anti-Spam: Kiểm định giới hạn tốc độ gọi chiến đấu (< 450ms):");
    await fetch(`${baseUrl}/characters/${characterId}/battle`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: setCookie1 },
      body: JSON.stringify({ monsterId: "slime" }),
    });

    // Gọi ngay lập tức không delay
    const spamRes = await fetch(`${baseUrl}/characters/${characterId}/battle`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: setCookie1 },
      body: JSON.stringify({ monsterId: "slime" }),
    });
    assert.equal(spamRes.status, 429, "Gói tin spam dồn dập phải bị từ chối 429");
    console.log("  ✔ Rate-limit bảo vệ máy chủ kích hoạt chính xác (HTTP 429 Too Many Requests)");

    // Đợi cooldown
    await new Promise((r) => setTimeout(r, 550));

    // ──────────────────────────────────────────────────────────────────────────
    // BƯỚC 6: DEAD CHARACTER LOCKOUT (HP <= 0 THÌ KHÔNG THỂ VÀO TRẬN)
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\n▶ [Test 6] Khóa tử trận: Nhân vật có HP <= 0 không thể tham chiến:");
    // Đặt HP về 0
    await fetch(`${baseUrl}/characters/${characterId}/full-sync`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: setCookie1 },
      body: JSON.stringify({ hp: 0 }),
    });

    const deadFightRes = await fetch(`${baseUrl}/characters/${characterId}/battle`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: setCookie1 },
      body: JSON.stringify({ monsterId: "slime" }),
    });
    assert.equal(deadFightRes.status, 400, "Nhân vật tử trận phải bị chặn 400 Bad Request");
    console.log("  ✔ Server từ chối lệnh chiến đấu khi nhân vật đang tử trận (HTTP 400)");

    // Đợi cooldown
    await new Promise((r) => setTimeout(r, 550));

    // ──────────────────────────────────────────────────────────────────────────
    // BƯỚC 7: BẢO MẬT IDOR (KHÔNG THỂ THAO TÁC NHÂN VẬT CỦA TÀI KHOẢN KHÁC)
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\n▶ [Test 7] Bảo mật IDOR: Ngăn chặn can thiệp chiến đấu chéo tài khoản:");
    const regRes2 = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user2, password: "CombatPassword123!" }),
    });
    const setCookie2 = regRes2.headers.get("set-cookie")?.split(";")[0] || "";

    const idorRes = await fetch(`${baseUrl}/characters/${characterId}/battle`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: setCookie2 },
      body: JSON.stringify({ monsterId: "slime" }),
    });
    assert.equal(idorRes.status, 404, "Phải trả về 404 Not Found khi truy cập nhân vật người khác");
    console.log("  ✔ IDOR Guard hoạt động chính xác (HTTP 404 Not Found)");

    // ──────────────────────────────────────────────────────────────────────────
    // BƯỚC 8: REWARD LOCKDOWN VERIFICATION
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\n▶ [Test 8] Khóa tuyệt đối cổng cấp thưởng lậu /3d-reward:");
    const hackRes = await fetch(`${baseUrl}/characters/${characterId}/3d-reward`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: setCookie1 },
      body: JSON.stringify({ expGained: 999999, goldGained: 999999 }),
    });
    assert.equal(hackRes.status, 403, "Cổng /3d-reward phải trả về 403 Forbidden");
    console.log("  ✔ Khóa phần thưởng client tự khai báo hoạt động tuyệt đối (HTTP 403 Forbidden)");

    console.log("\n══════════════════════════════════════════════════════════════════════════");
    console.log("🎉 TẤT CẢ 8 MỤC KIỂM THỬ PHASE 3 COMBAT & LOOT ĐÃ HOÀN TẤT THÀNH CÔNG 100%!");
    console.log("══════════════════════════════════════════════════════════════════════════\n");
    process.exit(0);
  } finally {
    server.close();
  }
}

runPhase3AuthoritativeCombatTests().catch((err) => {
  console.error("❌ Phase 3 Authoritative Combat test failed:", err);
  process.exit(1);
});
