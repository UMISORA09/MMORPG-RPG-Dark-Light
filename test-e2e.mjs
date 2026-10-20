// Automated End-to-End Verification Test Suite
import http from "node:http";

let BASE_URL = process.env.BASE_URL || (process.env.PORT ? `http://127.0.0.1:${process.env.PORT}` : "http://127.0.0.1:3000");

async function detectActiveServer() {
  if (process.env.BASE_URL) return process.env.BASE_URL;
  if (process.env.PORT) return `http://127.0.0.1:${process.env.PORT}`;
  const candidatePorts = [3000, 3001];
  for (const p of candidatePorts) {
    try {
      const isUp = await new Promise((resolve) => {
        const testReq = http.get(`http://127.0.0.1:${p}/api/healthz`, { timeout: 350 }, (res) => {
          resolve(res.statusCode === 200);
        });
        testReq.on("error", () => resolve(false));
        testReq.on("timeout", () => { testReq.destroy(); resolve(false); });
      });
      if (isUp) return `http://127.0.0.1:${p}`;
    } catch {}
  }
  return "http://127.0.0.1:3000";
}

function request(path, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    };

    const req = http.request(url, reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let parsed = data;
        try {
          parsed = JSON.parse(data);
        } catch {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: parsed,
        });
      });
    });

    req.on("error", reject);
    if (body) {
      req.write(typeof body === "string" ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  BASE_URL = await detectActiveServer();
  console.log("====================================================");
  console.log("🎮 AUTOMATED E2E TEST: 2.5D MMORPG COMBINED GAME");
  console.log(`📡 Mục tiêu máy chủ: ${BASE_URL}`);
  console.log("====================================================\n");

  let cookie = "";

  // Test 1: Healthcheck
  process.stdout.write("1. Kiểm tra API Healthcheck (/api/healthz)... ");
  const health = await request("/api/healthz");
  if (health.status === 200 && health.data.status === "ok") {
    console.log("✅ PASS (200 OK)");
  } else {
    console.error("❌ FAILED:", health);
    process.exit(1);
  }

  // Test 2: Classes
  process.stdout.write("2. Kiểm tra danh sách 4 Chức Nghiệp (/api/classes)... ");
  const classes = await request("/api/classes");
  if (classes.status === 200 && Array.isArray(classes.data) && classes.data.length === 4) {
    const names = classes.data.map((c) => c.name).join(", ");
    console.log(`✅ PASS (${classes.data.length} chức nghiệp: ${names})`);
  } else {
    console.error("❌ FAILED:", classes);
    process.exit(1);
  }

  // Test 3: Frontend Static HTML
  process.stdout.write("3. Kiểm tra phục vụ Giao Diện Web Tĩnh (/)... ");
  const frontend = await request("/");
  if (frontend.status === 200 && typeof frontend.data === "string" && frontend.data.includes("<div id=\"root\">")) {
    console.log("✅ PASS (Phục vụ Web Client SPA)");
  } else {
    console.error("❌ FAILED:", frontend);
    process.exit(1);
  }

  // Test 4: Register User
  const randomUser = `tester_${Date.now()}`;
  process.stdout.write(`4. Đăng ký tài khoản tự động (${randomUser})... `);
  const registerRes = await request(
    "/api/auth/register",
    { method: "POST" },
    { username: randomUser, password: "password123" }
  );
  if (registerRes.status === 201) {
    const setCookie = registerRes.headers["set-cookie"];
    if (setCookie && setCookie.length > 0) {
      cookie = setCookie[0].split(";")[0];
    }
    console.log(`✅ PASS (ID: ${registerRes.data.user.id}, Cookie nhận dạng: ${cookie ? "Có" : "Không"})`);
  } else {
    console.error("❌ FAILED:", registerRes);
    process.exit(1);
  }

  // Test 5: Get Current User Profile
  process.stdout.write("5. Xác thực phiên làm việc (/api/auth/me)... ");
  const meRes = await request("/api/auth/me", {
    headers: { Cookie: cookie },
  });
  if (meRes.status === 200 && (meRes.data.username === randomUser || meRes.data.user?.username === randomUser)) {
    console.log(`✅ PASS (Xác thực user: ${meRes.data.username || meRes.data.user?.username})`);
  } else {
    console.error("❌ FAILED:", meRes);
    process.exit(1);
  }

  // Test 6: Create Character (Xạ Thủ - Gunner)
  process.stdout.write("6. Tạo nhân vật mới (Xạ Thủ)... ");
  const charRes = await request(
    "/api/characters",
    { method: "POST", headers: { Cookie: cookie } },
    { name: "LongThan_Gunner", classId: "gunner" }
  );
  let characterId = 0;
  if (charRes.status === 201 && charRes.data.name === "LongThan_Gunner") {
    characterId = charRes.data.id;
    console.log(`✅ PASS (Nhân vật: ${charRes.data.name}, Cấp: ${charRes.data.level}, HP: ${charRes.data.hp})`);
  } else {
    console.error("❌ FAILED:", charRes);
    process.exit(1);
  }

  // Test 7: Simulated Dungeon Battle
  process.stdout.write("7. Kiểm tra Chiến Đấu Phó Bản (/api/characters/:id/battle)... ");
  const battleRes = await request(
    `/api/characters/${characterId}/battle`,
    { method: "POST", headers: { Cookie: cookie } },
    { monsterId: "slime" }
  );
  if (battleRes.status === 200 && battleRes.data.rounds) {
    console.log(`✅ PASS (Kết quả: ${battleRes.data.victory ? "Chiến Thắng 🏆" : "Thất Bại"}, Vòng đấu: ${battleRes.data.rounds.length}, EXP nhận: +${battleRes.data.expGained})`);
  } else {
    console.error("❌ FAILED:", battleRes);
    process.exit(1);
  }

  // Test 8: Authoritative Real-time Battle Reward Sync
  await new Promise((resolve) => setTimeout(resolve, 550));
  process.stdout.write("8. Kiểm tra Đồng Bộ Thưởng Chiến Đấu Server-Authoritative (/api/characters/:id/battle)... ");
  const syncRes = await request(
    `/api/characters/${characterId}/battle`,
    { method: "POST", headers: { Cookie: cookie } },
    { monsterId: "slime", mode: "realtime" }
  );
  if (syncRes.status === 200 && syncRes.data.character) {
    console.log(`✅ PASS (Kết quả: ${syncRes.data.victory ? "Chiến Thắng 🏆" : "Thất Bại"}, Cấp mới: ${syncRes.data.character.level}, Vàng: ${syncRes.data.character.gold}, Kills: ${syncRes.data.character.kills})`);
  } else {
    console.error("❌ FAILED:", syncRes);
    process.exit(1);
  }

  // Test 9: Leaderboard
  process.stdout.write("9. Kiểm tra Bảng Xếp Hạng Toàn Cầu (/api/leaderboard)... ");
  const lbRes = await request("/api/leaderboard");
  if (lbRes.status === 200 && Array.isArray(lbRes.data)) {
    console.log(`✅ PASS (${lbRes.data.length} nhân vật trên bảng xếp hạng)`);
  } else {
    console.error("❌ FAILED:", lbRes);
    process.exit(1);
  }

  console.log("\n====================================================");
  console.log("🎉 TẤT CẢ 9/9 BƯỚC KIỂM TRA ĐỀU HOÀN TOÀN THÀNH CÔNG!");
  console.log("🚀 MÁY CHỦ VÀ CLIENT ĐÃ HOÀN TOÀN CHẠY TRƠN TRU!");
  console.log("====================================================");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
