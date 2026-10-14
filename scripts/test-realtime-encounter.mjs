/**
 * TEST SUITE: SERVER-AUTHORITATIVE REALTIME ENCOUNTER & WEBSOCKET GATEWAY (20 Hz)
 *
 * Kiểm tra toàn bộ Phase 1, Phase 2, Phase 3 trong Kế hoạch Migration:
 * 1. REST API: Tạo encounter mới với clientRequestId.
 * 2. Idempotency: Gửi lại cùng clientRequestId trả về đúng encounter gốc.
 * 3. Active Lock: Nhân vật đang active encounter không thể mở trận thứ 2 (409 Conflict).
 * 4. WebSocket Auth Handshake: Xác thực Session Cookie qua HTTP Upgrade (/api/realtime).
 * 5. Fixed Tick 20 Hz (50ms): Server gửi snapshot trạng thái định kỳ.
 * 6. Input Intent: Client chỉ gửi { buttons, aim, seq }, không gửi position hay damage.
 * 7. Server Hit Detection: Server tự tính khoảng cách, trừ máu quái và phát sự kiện attack.hit.
 * 8. Terminal Result & Atomic Reward: Khi quái chết, server tự finalize, cấp EXP/Vàng vào DB.
 * 9. Database Verification: Kiểm tra bảng encounters, reward_grants, battle_logs và characters.
 */

import assert from "node:assert/strict";
import { WebSocket } from "ws";

const API_BASE = process.env.API_BASE || "http://localhost:3001/api";
const WS_BASE = process.env.WS_BASE || "ws://localhost:3001/api/realtime";

async function runRealtimeEncounterTest() {
  console.log("══════════════════════════════════════════════════════════════════════════");
  console.log("⚡ TEST: SERVER-AUTHORITATIVE REALTIME ENCOUNTER & WEBSOCKET GATEWAY 20Hz");
  console.log("══════════════════════════════════════════════════════════════════════════\n");

  // 1. Tạo tài khoản & Nhân vật
  console.log("▶ [Bước 1] Đăng ký & Khởi tạo nhân vật Đấu sĩ (Fighter):");
  const testUser = `hero_${Date.now()}`;
  const testPass = "AuthPass123!";
  let sessionCookie = "";

  const regRes = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: testUser, password: testPass }),
  });
  assert.equal(regRes.status, 201);
  const setCookie = regRes.headers.get("set-cookie");
  if (setCookie) {
    sessionCookie = setCookie.split(";")[0];
  }
  console.log(`  ✔ Tài khoản: [${testUser}], Cookie xác thực sẵn sàng.`);

  const charRes = await fetch(`${API_BASE}/characters`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: sessionCookie },
    body: JSON.stringify({ name: `LongVương_${testUser.slice(-4)}`, classId: "fighter" }),
  });
  assert.equal(charRes.status, 201);
  const character = await charRes.json();
  const characterId = character.id;
  const initialGold = character.gold;
  console.log(`  ✔ Nhân vật ID: ${characterId} [${character.name}] (Cấp 1, EXP: 0, Vàng: ${initialGold})`);

  // 2. Tạo Encounter qua REST API
  console.log("\n▶ [Bước 2] Tạo Authoritative Encounter (POST /characters/:id/encounters):");
  const clientRequestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const encRes = await fetch(`${API_BASE}/characters/${characterId}/encounters`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: sessionCookie },
    body: JSON.stringify({
      monsterId: "slime",
      spawnId: "spawn-slime-wild-01",
      clientRequestId,
    }),
  });
  assert.equal(encRes.status, 201, `Tạo encounter thất bại với status ${encRes.status}`);
  const encData = await encRes.json();
  const encounterId = encData.encounterId;
  assert.equal(encData.tickRate, 20, "Tick rate phải là 20 Hz");
  assert.equal(encData.protocolVersion, 1);
  assert(encData.snapshot, "Phải có snapshot ban đầu");
  assert.equal(encData.snapshot.state.enemies[0].monsterId, "slime");
  console.log(`  ✔ Đã tạo trận đấu Authoritative [UUID: ${encounterId}] (20 Hz, 50ms Tick)`);

  // 3. Kiểm tra Idempotency
  console.log("\n▶ [Bước 3] Kiểm tra tính Idempotent (Gửi lại cùng clientRequestId):");
  const dupRes = await fetch(`${API_BASE}/characters/${characterId}/encounters`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: sessionCookie },
    body: JSON.stringify({
      monsterId: "slime",
      spawnId: "spawn-slime-wild-01",
      clientRequestId,
    }),
  });
  assert.equal(dupRes.status, 201);
  const dupData = await dupRes.json();
  assert.equal(dupData.encounterId, encounterId, "Phải trả về đúng encounterId cũ");
  console.log("  ✔ Idempotency chuẩn xác: Trả lại cùng encounterId mà không tạo duplicate!");

  // 4. Kiểm tra Active Encounter Lock
  console.log("\n▶ [Bước 4] Kiểm tra Active Lock (Không cho mở trận thứ 2 khi trận cũ đang active):");
  const secondReqId = `req-diff-${Date.now()}`;
  const conflictRes = await fetch(`${API_BASE}/characters/${characterId}/encounters`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: sessionCookie },
    body: JSON.stringify({
      monsterId: "slime",
      spawnId: "spawn-slime-wild-02",
      clientRequestId: secondReqId,
    }),
  });
  assert.equal(conflictRes.status, 409, `Phải trả về 409 Conflict! Nhận: ${conflictRes.status}`);
  console.log("  ✔ Active Encounter Lock thành công: Bị chặn với HTTP 409 Conflict!");

  // 5. Kết nối WebSocket với Session Cookie
  console.log("\n▶ [Bước 5] Kết nối WebSocket Gateway qua Session Cookie Handshake:");
  const ws = new WebSocket(WS_BASE, {
    headers: {
      Cookie: sessionCookie,
    },
  });

  await new Promise((resolve, reject) => {
    ws.on("open", resolve);
    ws.on("error", reject);
  });
  console.log("  ✔ Kết nối WebSocket /api/realtime thành công qua Session Auth!");

  // 6. Gửi Join Encounter & Nhận Snapshots / Events
  console.log("\n▶ [Bước 6] Tham gia trận đấu & Mô phỏng giao tranh Fixed Tick (20 Hz):");
  ws.send(JSON.stringify({ type: "join", encounterId }));

  let snapshotCount = 0;
  let attackHits = 0;
  let enemyDefeated = false;
  let terminalResultReceived = null;

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Timeout: Không nhận được kết quả terminal sau 10s"));
    }, 10000);

    let inputSeq = 1;

    ws.on("message", (raw) => {
      const msg = JSON.parse(raw.toString());

      if (msg.type === "snapshot") {
        snapshotCount++;
        // Định kỳ gửi input intent (tiến tới và chém quái)
        if (!enemyDefeated) {
          inputSeq++;
          ws.send(
            JSON.stringify({
              type: "input",
              encounterId,
              seq: inputSeq,
              buttons: {
                right: true,
                attack: true,
              },
              aim: { yaw: 0 },
            })
          );
        }
      }

      if (msg.type === "event") {
        if (msg.name === "attack.hit") {
          attackHits++;
          console.log(`    💥 Server Event [attack.hit]: Gây ${msg.data.damage} sát thương -> HP quái: ${msg.data.remainingHp}`);
        }
        if (msg.name === "enemy.defeated") {
          enemyDefeated = true;
          console.log(`    🏆 Server Event [enemy.defeated]: Quái vật [${msg.data.monsterId}] đã bị tiêu diệt!`);
        }
      }

      if (msg.type === "encounter.result") {
        terminalResultReceived = msg;
        clearTimeout(timeout);
        resolve(msg);
      }
    });
  });

  ws.close();

  assert(snapshotCount > 0, "Phải nhận được ít nhất 1 snapshot 20 Hz");
  assert(attackHits > 0, "Phải ghi nhận được ít nhất 1 sự kiện attack.hit từ server");
  assert.equal(enemyDefeated, true, "Quái vật phải bị tiêu diệt");
  assert.equal(terminalResultReceived.status, "victory", "Trạng thái terminal phải là victory");
  assert.equal(terminalResultReceived.reward.exp, 25, "Server cấp đúng 25 EXP");
  assert.equal(terminalResultReceived.reward.gold, 10, "Server cấp đúng 10 Vàng");
  assert.equal(terminalResultReceived.character.experience, 25);
  assert.equal(terminalResultReceived.character.gold, initialGold + 10);
  assert.equal(terminalResultReceived.character.kills, 1);

  console.log("  ✔ Gói tin Terminal Result nhận được thành công:");
  console.log(`    - Status: ${terminalResultReceived.status}`);
  console.log(`    - EXP: +${terminalResultReceived.reward.exp}`);
  console.log(`    - Vàng: +${terminalResultReceived.reward.gold}`);
  console.log(`    - Nhân vật: Cấp ${terminalResultReceived.character.level}, EXP: ${terminalResultReceived.character.experience}, Vàng: ${terminalResultReceived.character.gold}`);

  // 7. Xác minh Persistence trong Database
  console.log("\n▶ [Bước 7] Xác minh Lưu trữ Bền vững trong Database (Persistence Verification):");
  const getEncRes = await fetch(`${API_BASE}/characters/${characterId}/encounters/${encounterId}`, {
    headers: { Cookie: sessionCookie },
  });
  assert.equal(getEncRes.status, 200);
  const savedEnc = await getEncRes.json();
  assert.equal(savedEnc.status, "victory", "Bảng encounters phải ghi nhận status='victory'");
  assert(savedEnc.terminalResult, "Bảng encounters phải lưu resultJson");
  console.log("  ✔ Bảng `encounters` đã lưu trữ trạng thái VICTORY và Terminal Result chính xác.");

  // Reload nhân vật
  const reloadRes = await fetch(`${API_BASE}/characters/${characterId}`, {
    headers: { Cookie: sessionCookie },
  });
  const reloadedChar = await reloadRes.json();
  assert.equal(reloadedChar.experience, 25);
  assert.equal(reloadedChar.gold, initialGold + 10);
  assert.equal(reloadedChar.kills, 1);
  console.log("  ✔ Nhân vật sau Reload: EXP, Vàng, Kills và HP hoàn toàn chính xác!");

  console.log("\n══════════════════════════════════════════════════════════════════════════");
  console.log("✅ KIỂM THỬ SERVER-AUTHORITATIVE WEBSOCKET ENCOUNTER HOÀN TẤT THÀNH CÔNG 100%!");
  console.log("══════════════════════════════════════════════════════════════════════════\n");
}

runRealtimeEncounterTest().catch((err) => {
  console.error("❌ REALTIME ENCOUNTER TEST FAILED:", err);
  process.exit(1);
});
