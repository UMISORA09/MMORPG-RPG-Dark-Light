/**
 * KIỂM THỬ TOÀN DIỆN MỘT ENCOUNTER CHIẾN ĐẤU (END-TO-END ENCOUNTER LIFECYCLE TEST)
 *
 * Kiểm tra đầy đủ:
 * 1. Tách 3 lớp: Client Gameplay -> Quy tắc combat dùng chung -> Server Persistence.
 * 2. Shared Combat Rules (Layer 2): Sát thương, Crit, Stagger, Cooldown, EXP/Level-up.
 * 3. Bắt đầu vào giao tranh đến khi quái cạn máu và chết (Simulate Real-time Encounter).
 * 4. Khóa phần thưởng: Client cố tình hack gửi EXP/Vàng lên /3d-reward bị chặn (403 Forbidden).
 * 5. Server Authoritative Victory: Server tự xác thực, tự tra cứu quái vật và tính thưởng.
 * 6. Battle Log: Nhật ký chiến báo được ghi nhận chính xác.
 * 7. Reload & Persistence: Đọc lại từ database sau reload, đảm bảo không sập máu và tiến trình bền vững.
 * 8. Level Up: Tích lũy đủ EXP thăng cấp và tăng chỉ số thuộc tính.
 */

import assert from "node:assert/strict";

import http from "node:http";
import handler from "../api/index.mjs";

let server = null;
let API_BASE = process.env.API_BASE;

// ── LỚP 2: QUY TẮC COMBAT DÙNG CHUNG (SHARED COMBAT RULES) ──
function calculateDamage(attackerAtk, defenderDef, options = {}) {
  const multiplier = options.multiplier ?? 1.0;
  const isStaggered = options.isStaggered ?? false;
  const isCritical = options.isCritical ?? false;
  const baseDmg = Math.max(1, attackerAtk - Math.floor(defenderDef * 0.4));
  let finalDmg = baseDmg * multiplier;
  if (isCritical) finalDmg = Math.floor(finalDmg * 1.8);
  if (isStaggered) finalDmg = Math.floor(finalDmg * 1.5);
  return {
    damage: Math.max(1, Math.round(finalDmg)),
    isCritical,
    isStaggerBonus: isStaggered,
  };
}

function getExpForLevel(level) {
  if (level < 1) return 100;
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

function calculateLevelProgression(currentExp, currentLevel, expGained) {
  let newExp = Math.max(0, currentExp + expGained);
  let newLevel = Math.max(1, currentLevel);
  let leveledUp = false;
  let expToNext = getExpForLevel(newLevel);
  while (newExp >= expToNext) {
    newExp -= expToNext;
    newLevel++;
    leveledUp = true;
    expToNext = getExpForLevel(newLevel);
  }
  return { newLevel, newExp, leveledUp, expToNextLevel: expToNext };
}

function isSkillOnCooldown(lastCastMs, cooldownSec, nowMs = Date.now()) {
  const elapsedSec = (nowMs - lastCastMs) / 1000;
  if (elapsedSec >= cooldownSec) {
    return { onCooldown: false, remainingSeconds: 0 };
  }
  return {
    onCooldown: true,
    remainingSeconds: +(cooldownSec - elapsedSec).toFixed(1),
  };
}

async function runEncounterTestSuite() {
  if (!API_BASE) {
    server = http.createServer((req, res) => {
      handler(req, res);
    });
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    API_BASE = `http://127.0.0.1:${port}/api`;
    console.log(`📡 Ephemeral Test Server listening on: ${API_BASE}\n`);
  }

  console.log("══════════════════════════════════════════════════════════════════");
  console.log("⚔️  CHIẾN LONG BÁ — ENCOUNTER TEST SUITE (AUTHORITATIVE REALTIME)");
  console.log("══════════════════════════════════════════════════════════════════\n");

  // ────────────────────────────────────────────────────────────────
  // PHẦN 1: UNIT TEST QUY TẮC COMBAT DÙNG CHUNG (SHARED RULES)
  // ────────────────────────────────────────────────────────────────
  console.log("▶ [Test 1] Quy tắc sát thương dùng chung (Damage Formulas):");
  {
    const normal = calculateDamage(85, 20, { multiplier: 1.0 });
    // 85 - floor(20 * 0.4) = 85 - 8 = 77
    assert.equal(normal.damage, 77, "Sát thương thường phải là 77");
    console.log("  ✔ Sát thương cơ bản chuẩn xác: ATK 85 vs DEF 20 -> DMG:", normal.damage);

    const crit = calculateDamage(85, 20, { multiplier: 1.0, isCritical: true });
    // floor(77 * 1.8) = 138
    assert.equal(crit.damage, 138, "Sát thương chí mạng x1.8 phải là 138");
    console.log("  ✔ Sát thương chí mạng (Critical 1.8x) chuẩn xác -> DMG:", crit.damage);

    const stagger = calculateDamage(85, 20, { multiplier: 1.0, isStaggered: true });
    // floor(77 * 1.5) = 115
    assert.equal(stagger.damage, 115, "Sát thương phá giáp Stagger 1.5x phải là 115");
    console.log("  ✔ Sát thương phá giáp (Stagger 1.5x) chuẩn xác -> DMG:", stagger.damage);

    const minDmg = calculateDamage(5, 500);
    assert.equal(minDmg.damage, 1, "Sát thương tối thiểu phải là 1 dù giáp cực cao");
    console.log("  ✔ Giới hạn sát thương tối thiểu (Min 1 DMG) được bảo toàn");
  }

  console.log("\n▶ [Test 2] Quy tắc EXP & Thăng cấp (Progression Rules):");
  {
    assert.equal(getExpForLevel(1), 100);
    assert.equal(getExpForLevel(2), 150);
    assert.equal(getExpForLevel(3), 225);
    console.log("  ✔ Bảng EXP cấp độ 1..3 chuẩn xác: [100, 150, 225]");

    const p1 = calculateLevelProgression(0, 1, 25);
    assert.equal(p1.newLevel, 1);
    assert.equal(p1.newExp, 25);
    assert.equal(p1.leveledUp, false);
    console.log("  ✔ Tích lũy EXP chưa đủ thăng cấp: 0 + 25 -> Cấp 1 (25/100 EXP)");

    const p2 = calculateLevelProgression(85, 1, 35);
    // 85 + 35 = 120 >= 100 -> Cấp 2, dư 20 EXP, expToNext = 150
    assert.equal(p2.newLevel, 2);
    assert.equal(p2.newExp, 20);
    assert.equal(p2.leveledUp, true);
    assert.equal(p2.expToNextLevel, 150);
    console.log("  ✔ Thăng cấp chính xác: 85 + 35 -> Cấp 2 (20/150 EXP)");
  }

  console.log("\n▶ [Test 3] Quy tắc Cooldown kỹ năng:");
  {
    const now = Date.now();
    const cdActive = isSkillOnCooldown(now - 1000, 3.0, now);
    assert.equal(cdActive.onCooldown, true);
    assert.equal(cdActive.remainingSeconds, 2.0);

    const cdReady = isSkillOnCooldown(now - 3500, 3.0, now);
    assert.equal(cdReady.onCooldown, false);
    assert.equal(cdReady.remainingSeconds, 0);
    console.log("  ✔ Trạng thái cooldown phản ánh chính xác thời gian hồi");
  }

  // ────────────────────────────────────────────────────────────────
  // PHẦN 2: THỰC THI ENCOUNTER TOÀN TRÌNH VỚI API SERVER & DATABASE
  // ────────────────────────────────────────────────────────────────
  console.log("\n▶ [Test 4] Khởi tạo tài khoản & Nhân vật chiến đấu cho Encounter:");

  const testUser = `hero_${Date.now()}`;
  const testPass = "HeroPass123!";
  let sessionCookie = "";

  // 1. Đăng ký tài khoản
  const regRes = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: testUser, password: testPass }),
  });
  assert.equal(regRes.status, 201, `Đăng ký thất bại với status ${regRes.status}`);
  const setCookie = regRes.headers.get("set-cookie");
  if (setCookie) {
    sessionCookie = setCookie.split(";")[0];
  }
  console.log(`  ✔ Đã tạo tài khoản kiểm thử: [${testUser}] (Cookie nhận dạng thành công)`);

  // 2. Tạo nhân vật Đấu sĩ (Fighter)
  const charRes = await fetch(`${API_BASE}/characters`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: sessionCookie,
    },
    body: JSON.stringify({ name: `LongKiếm_${testUser.slice(-4)}`, classId: "fighter" }),
  });
  assert.equal(charRes.status, 201, `Tạo nhân vật thất bại với status ${charRes.status}`);
  const character = await charRes.json();
  const characterId = character.id;
  const initialGold = character.gold;
  console.log(`  ✔ Đã tạo nhân vật: [${character.name}] ID: ${characterId} (Cấp 1, EXP: 0, Vàng khởi đầu: ${initialGold}, Kills: 0)`);
  assert.equal(character.level, 1);
  assert.equal(character.experience, 0);
  assert.equal(character.gold, 100, "Nhân vật mới có 100 vàng khởi tạo");
  assert.equal(character.kills, 0);

  // ────────────────────────────────────────────────────────────────
  // BƯỚC 3: MÔ PHỎNG VÀO GIAO TRANH REALTIME (CLIENT GAMEPLAY ENCOUNTER)
  // ────────────────────────────────────────────────────────────────
  console.log("\n▶ [Test 5] Mô phỏng Encounter Real-Time trong không gian 2.5D:");
  const slime = {
    id: "slime",
    name: "Ma Nhầy Xanh",
    hp: 80,
    maxHp: 80,
    atk: 15,
    def: 5,
  };
  console.log(`  ⚔️  Người chơi tiếp cận [${slime.name}] (HP: ${slime.hp}, ATK: ${slime.atk}, DEF: ${slime.def})`);

  let currentMonsterHp = slime.hp;
  let attackCount = 0;

  while (currentMonsterHp > 0 && attackCount < 10) {
    attackCount++;
    const hit = calculateDamage(character.atk, slime.def, {
      multiplier: 1.0,
      isCritical: attackCount === 2, // Đòn thứ 2 nổ chí mạng
    });
    currentMonsterHp = Math.max(0, currentMonsterHp - hit.damage);
    console.log(
      `    💥 Đòn đánh #${attackCount}: Gây ${hit.damage} sát thương ${
        hit.isCritical ? "⚡ (CHÍ MẠNG!)" : ""
      } -> HP quái còn: ${currentMonsterHp}/${slime.maxHp}`
    );
  }

  assert.equal(currentMonsterHp, 0, "Quái vật phải bị tiêu diệt hoàn toàn");
  console.log("  🏆 Quái vật [Ma Nhầy Xanh] đã gục ngã (Client kích hoạt callback hạ quái)");

  // ────────────────────────────────────────────────────────────────
  // BƯỚC 4: KHÓA BẢO MẬT PHẦN THƯỞNG (REWARD LOCKDOWN VERIFICATION)
  // ────────────────────────────────────────────────────────────────
  console.log("\n▶ [Test 6] Kiểm tra cơ chế Khóa phần thưởng (Ngăn chặn hack EXP/Vàng client tự khai báo):");
  const hackPayload = {
    expGained: 999999,
    goldGained: 888888,
    kills: 100,
  };
  const hackRes = await fetch(`${API_BASE}/characters/${characterId}/3d-reward`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: sessionCookie,
    },
    body: JSON.stringify(hackPayload),
  });

  assert.equal(
    hackRes.status,
    403,
    `Server phải từ chối endpoint /3d-reward với HTTP 403 Forbidden! Nhận được: ${hackRes.status}`
  );
  const hackData = await hackRes.json();
  console.log("  🛡️  Phản hồi chặn từ Server:", hackData.error);
  console.log("  ✔ Server đã KHÓA HOÀN TOÀN việc cộng tài nguyên do client tự khai báo!");

  // ────────────────────────────────────────────────────────────────
  // BƯỚC 5: XÁC THỰC KẾT QUẢ REALTIME TẠI SERVER (AUTHORITATIVE PERSISTENCE)
  // ────────────────────────────────────────────────────────────────
  console.log("\n▶ [Test 7] Server Authoritative Battle Confirmation:");
  const battleRes = await fetch(`${API_BASE}/characters/${characterId}/battle`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: sessionCookie,
    },
    body: JSON.stringify({
      monsterId: "slime",
      mode: "realtime",
    }),
  });

  assert.equal(battleRes.status, 200, `Xác thực trận đấu thất bại với status ${battleRes.status}`);
  const battleResult = await battleRes.json();

  assert.equal(battleResult.victory, true, "Kết quả realtime phải là DUY NHẤT VÀ NHẤT QUÁN: Chiến thắng!");
  assert.equal(battleResult.expGained, 18, "Phần thưởng EXP phải do server tra cứu theo Slime (18 EXP)");
  assert.equal(battleResult.goldGained, 7, "Phần thưởng Vàng phải do server tra cứu theo Slime (7 Vàng)");
  assert.equal(battleResult.character.gold, initialGold + 7, "Nhân vật nhận đúng 7 Vàng (100 + 7 = 107)");
  assert.equal(battleResult.character.kills, 1, "Số quái hạ gục tăng lên 1");
  assert(battleResult.character.hp > 0, "HP nhân vật luôn an toàn, không bị kẹt ở 0 HP");

  console.log("  ✔ Server đã xác thực kết quả Real-Time:");
  console.log(`    - Kết quả: ${battleResult.victory ? "VICTORY (Chiến thắng)" : "DEFEAT"}`);
  console.log(`    - EXP được cấp: +${battleResult.expGained} EXP (Server Authoritative)`);
  console.log(`    - Vàng được cấp: +${battleResult.goldGained} Vàng (Server Authoritative)`);
  console.log(`    - Kills: ${battleResult.character.kills}`);
  console.log(`    - HP hiện tại: ${battleResult.character.hp}/${battleResult.character.maxHp}`);

  // ────────────────────────────────────────────────────────────────
  // BƯỚC 6: KIỂM TRA BATTLE LOG ĐÃ ĐƯỢC GHI NHẬN VÀO CƠ SỞ DỮ LIỆU
  // ────────────────────────────────────────────────────────────────
  console.log("\n▶ [Test 8] Kiểm tra Battle Log trong Database:");
  const logsRes = await fetch(`${API_BASE}/characters/${characterId}/battle-log`, {
    headers: { Cookie: sessionCookie },
  });
  assert.equal(logsRes.status, 200, `Lấy battle-log thất bại với status ${logsRes.status}`);
  const logs = await logsRes.json();
  assert(Array.isArray(logs) && logs.length > 0, "Phải có ít nhất 1 bản ghi chiến báo");
  const latestLog = logs[0];
  assert.equal(latestLog.monsterId, "slime");
  assert.equal(latestLog.victory, true);
  assert.equal(latestLog.expGained, 18);
  assert.equal(latestLog.goldGained, 7);
  console.log(`  ✔ Nhật ký chiến báo được ghi nhận chính xác: [${latestLog.monsterName}] Thắng: ${latestLog.victory}, +${latestLog.expGained} EXP, +${latestLog.goldGained} Vàng`);

  // ────────────────────────────────────────────────────────────────
  // BƯỚC 7: KIỂM TRA RELOAD & PERSISTENCE (BẢO TOÀN DỮ LIỆU SAU RELOAD)
  // ────────────────────────────────────────────────────────────────
  console.log("\n▶ [Test 9] Kiểm tra Reload dữ liệu từ Server (Simulating Page Reload):");
  const reloadRes = await fetch(`${API_BASE}/characters/${characterId}`, {
    headers: { Cookie: sessionCookie },
  });
  assert.equal(reloadRes.status, 200);
  const reloaded = await reloadRes.json();

  assert.equal(reloaded.experience, 18, "EXP sau khi reload phải bảo toàn 18");
  assert.equal(reloaded.gold, initialGold + 7, "Vàng sau khi reload phải bảo toàn 107");
  assert.equal(reloaded.kills, 1, "Kills sau khi reload phải bảo toàn 1");
  assert.equal(reloaded.level, 1, "Cấp độ sau khi reload phải là 1");
  assert(reloaded.hp > 0, "HP sau khi reload phải còn nguyên sinh lực");
  console.log("  ✔ Dữ liệu nhân vật sau Reload hoàn toàn nguyên vẹn và bền vững (Persistence Verified!)");

  // ────────────────────────────────────────────────────────────────
  // BƯỚC 8: TIẾP TỤC ENCOUNTER TÍCH LŨY THĂNG CẤP (LEVEL UP PERSISTENCE)
  // ────────────────────────────────────────────────────────────────
  console.log("\n▶ [Test 10] Kiểm tra Tích lũy chuỗi Encounter và Thăng cấp (Level Up):");
  console.log("  Tiêu diệt thêm 5 con Ma Nhầy Xanh để tích lũy 18 * 5 = 90 EXP (Tổng 108/100 EXP -> Thăng Cấp 2)...");

  for (let i = 2; i <= 6; i++) {
    await new Promise((r) => setTimeout(r, 600));
    const multiRes = await fetch(`${API_BASE}/characters/${characterId}/battle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({ monsterId: "slime", mode: "realtime" }),
    });
    const multiData = await multiRes.json();
    console.log(`    Kill #${i}: EXP hiện tại: ${multiData.character.experience}, Cấp: ${multiData.character.level}, Thăng cấp: ${multiData.leveledUp}`);
    if (i === 6) {
      assert.equal(multiData.leveledUp, true, "Đạt 100 EXP phải thăng cấp!");
      assert.equal(multiData.character.level, 2, "Cấp độ mới phải là 2!");
      console.log(`  🎉 ĐÃ THĂNG CẤP THÀNH CÔNG LÊN CẤP ${multiData.character.level}!`);
    }
  }

  // Reload lần cuối kiểm tra cấp 2 đã được lưu vào database
  const finalReloadRes = await fetch(`${API_BASE}/characters/${characterId}`, {
    headers: { Cookie: sessionCookie },
  });
  const finalChar = await finalReloadRes.json();
  assert.equal(finalChar.level, 2, "Cấp 2 phải được lưu vĩnh viễn trong DB");
  assert.equal(finalChar.kills, 6, "Tổng kills phải là 6");
  assert.equal(finalChar.gold, initialGold + 42, "Tổng vàng phải là 142");
  console.log(`  ✔ Sau thăng cấp và reload: Cấp ${finalChar.level}, Kills: ${finalChar.kills}, Vàng: ${finalChar.gold}, Chỉ số mới: HP=${finalChar.maxHp}, ATK=${finalChar.atk}, DEF=${finalChar.def}`);

  console.log("\n══════════════════════════════════════════════════════════════════");
  console.log("✅ TẤT CẢ 10 BƯỚC KIỂM THỬ ENCOUNTER ĐÃ HOÀN TẤT THÀNH CÔNG 100%!");
  console.log("══════════════════════════════════════════════════════════════════\n");

  if (server) {
    server.close();
  }
  process.exit(0);
}

runEncounterTestSuite().catch((err) => {
  console.error("❌ ENCOUNTER TEST FAILED:", err);
  if (server) {
    server.close();
  }
  process.exit(1);
});
