/**
 * UNIFIED TEST AUTOMATION RUNNER
 * MMORPG 2.5D Chiến Long Bí Sử
 *
 * Runs all integrated test suites sequentially with clean reporting:
 * 1. Security & Privilege Isolation (scripts/test-security.mjs)
 * 2. Database OCC & Auto-Save (scratch/test-phase2-database.mjs)
 * 3. Combat Engine & Boss AI (scratch/test-phase3-combat.mjs)
 * 4. Multiplayer & Realtime AOI (scratch/test-phase4-multiplayer.mjs)
 * 5. PvP Arena & Dungeon Instances (scratch/test-phase5-pvp-dungeon.mjs)
 * 6. RPG Economy & Progression (scratch/test-phase6-economy.mjs)
 * 7. Encounter Rules & Lifecycle (scripts/test-encounter.mjs)
 * 8. Admin Security & RBAC Guard (scripts/test-admin-security.mjs)
 */

import { spawn } from "node:child_process";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import handler from "../api/index.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const TEST_SUITES = [
  {
    id: 1,
    name: "Security & Privilege Isolation",
    script: "scripts/test-security.mjs",
    description: "401 Unauth, 403 GM Isolation, IDOR Defense, SQLi/Input Safety",
  },
  {
    id: 2,
    name: "Database OCC & Auto-Save",
    script: "scripts/test-phase2-integrity.mjs",
    description: "Optimistic Concurrency Control rev check, 409 Conflict, AutoSave",
  },
  {
    id: 3,
    name: "Combat Engine & Boss AI",
    script: "scripts/test-phase3-authoritative-combat.mjs",
    description: "Authoritative combat, 429 spam throttle, speedhack & impossible DPS prevention",
  },
  {
    id: 4,
    name: "Multiplayer & Realtime AOI",
    script: "scripts/test-phase4-multiplayer.mjs",
    description: "Spatial sync, AOI <=50m culling, party invite-player & anti-IDOR guard",
  },
  {
    id: 5,
    name: "PvP Arena & Dungeon Instances",
    script: "scripts/test-phase5-pvp-dungeon.mjs",
    description: "Ranked PvP honor/ELO, 3-room isolated dungeon progression & clear",
  },
  {
    id: 6,
    name: "RPG Economy & Progression",
    script: "scripts/test-phase6-economy.mjs",
    description: "Blacksmith +1..+15, gem socketing, auction house 2% fee / 5% tax",
  },
  {
    id: 7,
    name: "Encounter Rules & Lifecycle",
    script: "scripts/test-encounter.mjs",
    description: "Shared combat formulas, 403 reward lock, authoritative level-up",
    needsServerBridge: true,
  },
  {
    id: 8,
    name: "Admin Security & RBAC Guard",
    script: "scripts/test-admin-security.mjs",
    description: "RBAC deny-by-default, 401 unauth, 403 player block, zero passwordHash leak",
  },
  {
    id: 9,
    name: "Single-Session & Duplicate Displacement",
    script: "scripts/test-duplicate-session-kickout.mjs",
    description: "1 account 1 character enforcement, instant duplicate session kickout, 409 stale save defense",
  },
];

function runProcess(cmd, args, options = {}) {
  return new Promise((resolve) => {
    const start = Date.now();
    const child = spawn(cmd, args, {
      cwd: rootDir,
      stdio: ["ignore", "pipe", "pipe"],
      ...options,
    });

    let stdout = "";
    let stderr = "";

    if (child.stdout) {
      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });
    }

    if (child.stderr) {
      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
    }

    child.on("close", (code) => {
      resolve({
        code: code ?? 1,
        stdout,
        stderr,
        duration: ((Date.now() - start) / 1000).toFixed(2),
      });
    });

    child.on("error", (err) => {
      resolve({
        code: 1,
        stdout,
        stderr: stderr + "\n" + err.message,
        duration: ((Date.now() - start) / 1000).toFixed(2),
      });
    });
  });
}

async function main() {
  console.log("══════════════════════════════════════════════════════════════════════════");
  console.log("🚀 CHIẾN LONG BÁ — UNIFIED TEST RUNNER (ALL INTEGRATED SUITES)");
  console.log(`📅 Execution Time: ${new Date().toISOString()}`);
  console.log(`📦 Workspace Root: ${rootDir}`);
  console.log(`🧪 Total Test Suites: ${TEST_SUITES.length}`);
  console.log("══════════════════════════════════════════════════════════════════════════\n");

  const results = [];
  let allPassed = true;

  // Start background ephemeral server bridge if needed for scripts that expect an active server
  const sharedServer = http.createServer((req, res) => {
    handler(req, res);
  });
  await new Promise((resolve) => sharedServer.listen(0, resolve));
  const sharedPort = sharedServer.address().port;

  try {
    for (const suite of TEST_SUITES) {
      process.stdout.write(`[${suite.id}/${TEST_SUITES.length}] Đang chạy: ${suite.name} (${suite.script})... `);

      const env = {
        ...process.env,
        TEST_SERVER_PORT: String(sharedPort),
        PORT: String(sharedPort),
        NODE_ENV: "test",
      };

      const res = await runProcess("node", [suite.script], { env });

      if (res.code === 0) {
        console.log(`✅ PASS (${res.duration}s)`);
        results.push({
          id: suite.id,
          name: suite.name,
          script: suite.script,
          status: "PASS",
          duration: `${res.duration}s`,
        });
      } else {
        console.log(`❌ FAIL (${res.duration}s)`);
        console.error(`\n--- [ERROR LOG: ${suite.name}] ---`);
        console.error(res.stderr || res.stdout || "Unknown error occurred during test execution");
        console.error("----------------------------------\n");
        results.push({
          id: suite.id,
          name: suite.name,
          script: suite.script,
          status: "FAIL",
          duration: `${res.duration}s`,
        });
        allPassed = false;
        break;
      }
    }
  } finally {
    sharedServer.close();
  }

  console.log("\n══════════════════════════════════════════════════════════════════════════");
  console.log("📊 TEST EXECUTION SUMMARY MATRIX");
  console.log("══════════════════════════════════════════════════════════════════════════");
  console.log("ID  Suite Name                        Script Path                           Status    Duration");
  console.log("──────────────────────────────────────────────────────────────────────────────────────────────");

  for (const r of results) {
    const paddedId = `#${r.id}`.padEnd(3, " ");
    const paddedName = r.name.padEnd(32, " ");
    const paddedScript = r.script.padEnd(36, " ");
    const paddedStatus = (r.status === "PASS" ? "✅ PASS" : "❌ FAIL").padEnd(9, " ");
    console.log(`${paddedId} ${paddedName} ${paddedScript} ${paddedStatus} ${r.duration}`);
  }

  const totalDuration = results.reduce((sum, r) => sum + parseFloat(r.duration), 0).toFixed(2);
  console.log("──────────────────────────────────────────────────────────────────────────────────────────────");
  console.log(`Kết quả: ${results.filter(r => r.status === "PASS").length}/${TEST_SUITES.length} bộ kiểm thử thành công | Tổng thời gian: ${totalDuration}s`);
  console.log("══════════════════════════════════════════════════════════════════════════\n");

  if (allPassed && results.length === TEST_SUITES.length) {
    console.log("🎉 TẤT CẢ CÁC BỘ KIỂM THỬ TÍCH HỢP ĐỀU HOÀN TOÀN VƯỢT QUA 100%!\n");
    process.exit(0);
  } else {
    console.error("💥 CÓ BỘ KIỂM THỬ THẤT BẠI. Vui lòng rà soát log ở trên để khắc phục.\n");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Lỗi thực thi bộ kiểm thử tổng:", err);
  process.exit(1);
});
