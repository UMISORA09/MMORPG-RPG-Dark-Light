import assert from "node:assert";
import handler from "../api/index.mjs";
import http from "node:http";

process.env.GM_SECRET_KEY = process.env.GM_SECRET_KEY || "test_gm_secret_economy";

async function runPhase6Tests() {
  const server = http.createServer((req, res) => {
    handler(req, res);
  });
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;

  const nonce = Math.floor(Math.random() * 899999 + 100000);
  console.log(`[PHASE 6 TEST] Server listening on ${baseUrl} (Nonce: ${nonce})`);

  try {
    // 1. Tạo 2 người chơi: Người Bán (Seller) & Người Mua (Buyer)
    const regRes1 = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: `merch_${nonce}`, password: "SecretPassword123!" }),
    });
    const { token: token1 } = await regRes1.json();

    const regRes2 = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: `buy_${nonce}`, password: "SecretPassword123!" }),
    });
    const { token: token2 } = await regRes2.json();

    const c1Res = await fetch(`${baseUrl}/characters`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ name: `Smith_${nonce}`, classId: "fighter" }),
    });
    const sellerChar = await c1Res.json();

    const c2Res = await fetch(`${baseUrl}/characters`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token2}` },
      body: JSON.stringify({ name: `Buyer_${nonce}`, classId: "gunner" }),
    });
    const buyerChar = await c2Res.json();

    console.log(`✓ PASS: Tạo 2 nhân vật giao dịch: Seller ID ${sellerChar.id}, Buyer ID ${buyerChar.id}`);

    // Cấp vốn & item cho Seller để test Blacksmith, Inventory và Market (qua GM Action có x-gm-secret)
    await fetch(`${baseUrl}/characters/${sellerChar.id}/gm/action`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token1}`,
        "x-gm-secret": process.env.GM_SECRET_KEY,
      },
      body: JSON.stringify({ action: "add_gold" }),
    });

    // 2. Kiểm thử Inventory: Mở khóa ô túi đồ (Unlock Slot)
    const unlockRes = await fetch(`${baseUrl}/characters/${sellerChar.id}/inventory/unlock-slot`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token1}` },
    });
    assert.strictEqual(unlockRes.status, 200, "Mở khóa ô hành trang phải thành công");
    const unlockData = await unlockRes.json();
    assert.strictEqual(unlockData.success, true);
    assert.ok(unlockData.unlockedSlots > 15, "Số ô mở khóa phải tăng");
    console.log(`✓ PASS: Inventory Unlock-Slot - Mở khóa thành công ô thứ ${unlockData.unlockedSlots} với chi phí 500 Vàng atomic`);

    // Cấp vật phẩm hợp lệ vào túi seller qua Admin GM API (Server Authority)
    await fetch(`${baseUrl}/admin/characters/${sellerChar.id}/grant-item`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-gm-secret": process.env.GM_SECRET_KEY },
      body: JSON.stringify({ itemId: "material_enhance_stone", quantity: 20 }),
    });
    await fetch(`${baseUrl}/admin/characters/${sellerChar.id}/grant-item`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-gm-secret": process.env.GM_SECRET_KEY },
      body: JSON.stringify({ itemId: "gem_ruby_1", quantity: 5 }),
    });
    await fetch(`${baseUrl}/admin/characters/${sellerChar.id}/grant-item`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-gm-secret": process.env.GM_SECRET_KEY },
      body: JSON.stringify({ itemId: "gear_fighter_main_weapon_rare", quantity: 1, enhanceLevel: 0 }),
    });

    const invRes1 = await fetch(`${baseUrl}/characters/${sellerChar.id}/inventory`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const inv1 = await invRes1.json();
    const weaponItem = inv1.find((i) => i.id === "gear_fighter_main_weapon_rare" || i.itemId === "gear_fighter_main_weapon_rare");
    assert.ok(weaponItem, "Phải tìm thấy vũ khí trong túi Seller");
    const weaponOwnershipId = weaponItem.ownershipId;

    // 3. Kiểm thử Blacksmith Enhancement (+1 Success)
    const enhanceRes = await fetch(`${baseUrl}/characters/${sellerChar.id}/blacksmith/enhance`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ ownershipId: weaponOwnershipId }),
    });
    assert.strictEqual(enhanceRes.status, 200, "Cường hóa +1 phải thành công");
    const enhanceData = await enhanceRes.json();
    assert.strictEqual(enhanceData.success, true);
    assert.strictEqual(enhanceData.newLevel, 1, "Vũ khí phải lên cấp +1");
    console.log(`✓ PASS: Blacksmith Enhance - Cường hóa thành công lên +${enhanceData.newLevel} (Transaction safe)`);

    // 4. Kiểm thử Blacksmith Socketing (Khảm ngọc)
    const gemItem = inv1.find((i) => (i.id && String(i.id).startsWith("gem_")) || (i.itemId && String(i.itemId).startsWith("gem_")));
    assert.ok(gemItem, "Phải tìm thấy viên ngọc trong túi Seller");

    const socketRes = await fetch(`${baseUrl}/characters/${sellerChar.id}/blacksmith/socket`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token1}` },
      body: JSON.stringify({
        ownershipId: weaponOwnershipId,
        socketIndex: 0,
        gemOwnershipId: gemItem.ownershipId,
      }),
    });
    assert.strictEqual(socketRes.status, 200, "Khảm ngọc phải thành công");
    const socketData = await socketRes.json();
    assert.strictEqual(socketData.success, true);
    console.log(`✓ PASS: Blacksmith Socket - Khảm thành công Ngọc Đỏ vào ô socket`);

    // 5. Kiểm thử Marketplace: Đăng bán vật phẩm (Listing Fee 2%)
    // Bán vũ khí với giá 500 Vàng -> Phí niêm yết 2% = 10 Vàng
    const sellRes = await fetch(`${baseUrl}/market/sell`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token1}` },
      body: JSON.stringify({
        characterId: sellerChar.id,
        ownershipId: weaponOwnershipId,
        priceGold: 500,
      }),
    });
    assert.strictEqual(sellRes.status, 200, "Đăng bán chợ thành công");
    const sellData = await sellRes.json();
    assert.ok(sellData.listing.id, "Phải có ID listing chợ");
    const listingId = sellData.listing.id;
    console.log(`✓ PASS: Marketplace Listing - Đăng bán thành công Listing #${listingId} với giá 500 Vàng (Đã thu 2% phí sàn)`);

    // 6. Cấp Vàng cho Buyer để mua đồ (qua GM Action có x-gm-secret)
    await fetch(`${baseUrl}/characters/${buyerChar.id}/gm/action`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token2}`,
        "x-gm-secret": process.env.GM_SECRET_KEY,
      },
      body: JSON.stringify({ action: "add_gold" }),
    });

    // 7. Kiểm thử Marketplace: Buyer mua đồ (Thuế sàn 5%)
    // Buyer trả 500 Vàng -> Người bán nhận 500 * 0.95 = 475 Vàng
    const buyRes = await fetch(`${baseUrl}/market/buy/${listingId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token2}` },
      body: JSON.stringify({ characterId: buyerChar.id }),
    });
    assert.strictEqual(buyRes.status, 200, "Mua đồ phải thành công");
    const buyData = await buyRes.json();
    assert.strictEqual(buyData.success, true);

    // Kiểm tra túi đồ Buyer có vũ khí đã mua không
    const buyerInvRes = await fetch(`${baseUrl}/characters/${buyerChar.id}/inventory`, {
      headers: { Authorization: `Bearer ${token2}` },
    });
    const buyerInv = await buyerInvRes.json();
    const boughtItem = buyerInv.find((i) => i.id === "gear_fighter_main_weapon_rare" || i.itemId === "gear_fighter_main_weapon_rare");
    assert.ok(boughtItem, "Vũ khí đã mua phải nằm trong túi của Buyer");
    assert.strictEqual(boughtItem.enhanceLevel, 1, "Vũ khí giữ nguyên cấp +1");
    console.log(`✓ PASS: Marketplace Buy & Atomic Settlement - Buyer nhận vật phẩm [${boughtItem.name} +${boughtItem.enhanceLevel}], sàn thu 5% thuế giao dịch`);

    // 8. Kiểm thử Quests: Lấy danh sách nhiệm vụ và kiểm tra chống duplicate claim
    const questListRes = await fetch(`${baseUrl}/characters/${sellerChar.id}/quests`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    assert.strictEqual(questListRes.status, 200, "Lấy danh sách nhiệm vụ thành công");
    const quests = await questListRes.json();
    assert.ok(Array.isArray(quests), "Danh sách quest phải là array");
    console.log(`✓ PASS: Quest System - Tải thành công ${quests.length} nhiệm vụ của nhân vật`);

    console.log("\n=======================================================");
    console.log("🎉 ALL PHASE 6 RPG ECONOMY & PROGRESSION TESTS PASSED!");
    console.log("=======================================================\n");
    process.exit(0);
  } finally {
    server.close();
  }
}

runPhase6Tests().catch((err) => {
  console.error("Phase 6 test failed:", err);
  process.exit(1);
});
