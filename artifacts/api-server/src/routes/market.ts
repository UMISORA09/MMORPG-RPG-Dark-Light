import { Router } from "express";
import { and, eq, desc } from "drizzle-orm";
import {
  db,
  charactersTable,
  characterItemsTable,
  itemsTable,
  marketListingsTable,
} from "@workspace/db";
import { requireAuth, getAuthUserId } from "../middlewares/requireAuth";
import { listInventory } from "../lib/inventory";

const router = Router();

// Seed các món đồ mẫu từ thương nhân liên server nếu chợ còn trống
async function ensureMarketSeedListings() {
  const activeCount = await db
    .select({ id: marketListingsTable.id })
    .from(marketListingsTable)
    .where(eq(marketListingsTable.status, "ACTIVE"));

  if (activeCount.length >= 10) return;

  const sampleListings = [
    {
      sellerCharacterId: 999901,
      sellerName: "Thương Nhân Lôi Đình",
      sellerServerId: "server-1",
      itemId: "gear_assassin_weapon_epic",
      itemName: "Song Đoản Kiếm U Hồn",
      itemCategory: "equipment",
      itemType: "weapon",
      itemEquipSlot: "main_weapon",
      itemRarity: "epic",
      enhanceLevel: 7,
      bonusCombatPower: 350,
      priceGold: 2500,
      socketsJson: JSON.stringify([{ index: 0, gemId: "gem_ruby_2", gemType: "ruby", level: 2 }]),
      reforgeStatsJson: JSON.stringify([
        { key: "lifesteal", name: "Hút máu khi đánh trúng", value: 3.2, suffix: "%", rank: "A" },
        { key: "boss_dmg", name: "Sát thương lên Boss", value: 12.0, suffix: "%", rank: "S" },
      ]),
    },
    {
      sellerCharacterId: 999902,
      sellerName: "Hiệp Sĩ Long Tộc",
      sellerServerId: "server-1",
      itemId: "gear_warrior_weapon_legendary",
      itemName: "Cự Kiếm Cuồng Long",
      itemCategory: "equipment",
      itemType: "weapon",
      itemEquipSlot: "main_weapon",
      itemRarity: "legendary",
      enhanceLevel: 10,
      bonusCombatPower: 920,
      priceGold: 8500,
      socketsJson: JSON.stringify([
        { index: 0, gemId: "gem_ruby_3", gemType: "ruby", level: 3 },
        { index: 1, gemId: "gem_topaz_3", gemType: "topaz", level: 3 },
      ]),
      reforgeStatsJson: JSON.stringify([
        { key: "boss_dmg", name: "Sát thương lên Boss", value: 16.5, suffix: "%", rank: "SS" },
        { key: "bonus_atk", name: "Sát thương tấn công", value: 75, suffix: "", rank: "S" },
      ]),
    },
    {
      sellerCharacterId: 999903,
      sellerName: "Thần Hộ Mệnh",
      sellerServerId: "server-1",
      itemId: "gear_tank_armor_epic",
      itemName: "Chiến Giáp Kim Cương",
      itemCategory: "equipment",
      itemType: "armor",
      itemEquipSlot: "armor",
      itemRarity: "epic",
      enhanceLevel: 8,
      bonusCombatPower: 480,
      priceGold: 3200,
      socketsJson: JSON.stringify([{ index: 0, gemId: "gem_sapphire_3", gemType: "sapphire", level: 3 }]),
      reforgeStatsJson: JSON.stringify([
        { key: "hp", name: "Máu tối đa", value: 450, suffix: "", rank: "S" },
      ]),
    },
    {
      sellerCharacterId: 999904,
      sellerName: "Cơ Quan Sư Tinh Anh",
      sellerServerId: "server-1",
      itemId: "gear_gunner_weapon_rare",
      itemName: "Pháo Năng Lượng Tinh Chuẩn",
      itemCategory: "equipment",
      itemType: "weapon",
      itemEquipSlot: "main_weapon",
      itemRarity: "rare",
      enhanceLevel: 5,
      bonusCombatPower: 180,
      priceGold: 1200,
      socketsJson: JSON.stringify([{ index: 0, gemId: "gem_emerald_2", gemType: "emerald", level: 2 }]),
      reforgeStatsJson: JSON.stringify([
        { key: "crit_rate", name: "Tỉ lệ bạo kích", value: 5.5, suffix: "%", rank: "A" },
      ]),
    },
    {
      sellerCharacterId: 999905,
      sellerName: "Thợ Săn Thâm Uyên",
      sellerServerId: "server-1",
      itemId: "gear_assassin_armor_legendary",
      itemName: "Dạ Hành Y Huyết Nguyệt",
      itemCategory: "equipment",
      itemType: "armor",
      itemEquipSlot: "armor",
      itemRarity: "legendary",
      enhanceLevel: 9,
      bonusCombatPower: 760,
      priceGold: 7000,
      socketsJson: JSON.stringify([
        { index: 0, gemId: "gem_emerald_3", gemType: "emerald", level: 3 },
        { index: 1, gemId: "gem_sapphire_3", gemType: "sapphire", level: 3 },
      ]),
      reforgeStatsJson: JSON.stringify([
        { key: "cooldown_reduction", name: "Giảm thời gian hồi chiêu", value: 9.0, suffix: "%", rank: "S" },
      ]),
    },
    {
      sellerCharacterId: 999906,
      sellerName: "Kỳ Trân Thương Hội",
      sellerServerId: "server-1",
      itemId: "gear_warrior_accessory_rare",
      itemName: "Vòng Tay Chiến Binh Cổ",
      itemCategory: "equipment",
      itemType: "accessory",
      itemEquipSlot: "ring_1",
      itemRarity: "rare",
      enhanceLevel: 4,
      bonusCombatPower: 140,
      priceGold: 800,
      socketsJson: "[]",
      reforgeStatsJson: "[]",
    },
  ];

  for (const item of sampleListings) {
    await db.insert(marketListingsTable).values({
      ...item,
      status: "ACTIVE",
    });
  }
}

// ── 1. DUYỆT DANH SÁCH CHỢ ĐẤU GIÁ LIÊN SERVER (BROWSE) ──
router.get("/market/listings", async (req, res): Promise<void> => {
  try {
    await ensureMarketSeedListings();

    const { category, rarity, search, minEnhance } = req.query;

    const listings = await db
      .select()
      .from(marketListingsTable)
      .where(eq(marketListingsTable.status, "ACTIVE"))
      .orderBy(desc(marketListingsTable.listedAt));

    let filtered = listings;
    if (category && category !== "all") {
      filtered = filtered.filter((l: any) => l.itemEquipSlot === category || l.itemCategory === category);
    }
    if (rarity && rarity !== "all") {
      filtered = filtered.filter((l: any) => l.itemRarity?.toLowerCase() === String(rarity).toLowerCase());
    }
    if (minEnhance) {
      filtered = filtered.filter((l: any) => l.enhanceLevel >= Number(minEnhance));
    }
    if (search) {
      const q = String(search).toLowerCase();
      filtered = filtered.filter((l: any) => l.itemName.toLowerCase().includes(q) || l.sellerName.toLowerCase().includes(q));
    }

    const safeParse = (val: any) => {
      if (!val) return null;
      if (typeof val === "object") return val;
      try { return JSON.parse(val); } catch { return null; }
    };

    const mapped = filtered.map((l: any) => ({
      ...l,
      socketsJson: safeParse(l.socketsJson),
      reforgeStatsJson: safeParse(l.reforgeStatsJson),
    }));

    res.status(200).json({ success: true, listings: mapped });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Lỗi tải chợ đấu giá" });
  }
});

// ── 2. MUA NGAY VẬT PHẨM (BUYOUT IN db.transaction()) ──
router.post("/market/buy/:id", requireAuth, async (req, res): Promise<void> => {
  const listingId = Number(req.params.id);
  const userId = getAuthUserId(req);
  const buyerCharacterId = req.body.buyerCharacterId || req.body.characterId;

  if (!buyerCharacterId) {
    res.status(400).json({ error: "Thiếu buyerCharacterId" });
    return;
  }

  try {
    const result = await db.transaction(async (tx: any) => {
      // 1. Kiểm tra người mua
      const [buyer] = await tx
        .select()
        .from(charactersTable)
        .where(and(eq(charactersTable.id, Number(buyerCharacterId)), eq(charactersTable.userId, userId)))
        .limit(1);

      if (!buyer) {
        throw new Error("Không tìm thấy nhân vật người mua hoặc không có quyền sở hữu.");
      }

      // 2. Kiểm tra mặt hàng
      const [listing] = await tx
        .select()
        .from(marketListingsTable)
        .where(eq(marketListingsTable.id, listingId))
        .limit(1);

      if (!listing || listing.status !== "ACTIVE") {
        throw new Error("Món đồ này đã được bán hoặc đã bị hủy đăng!");
      }

      if (listing.sellerCharacterId === buyer.id) {
        throw new Error("Bạn không thể tự mua vật phẩm của chính mình!");
      }

      // 3. Kiểm tra vàng
      if (buyer.gold < listing.priceGold) {
        throw new Error(`Bạn không đủ Vàng để mua (Cần ${listing.priceGold.toLocaleString()} Vàng, hiện có ${buyer.gold.toLocaleString()} Vàng)`);
      }

      // 4. Kiểm tra sức chứa túi đồ
      const currentItems = await tx
        .select()
        .from(characterItemsTable)
        .where(and(eq(characterItemsTable.characterId, buyer.id), eq(characterItemsTable.equipped, false)));

      const maxSlots = buyer.unlockedSlots || 18;
      if (currentItems.length >= maxSlots) {
        throw new Error(`Hành trang của bạn đã đầy (${currentItems.length}/${maxSlots}). Hãy dọn túi đồ trước khi mua!`);
      }

      // 5. Trừ Vàng người mua
      await tx
        .update(charactersTable)
        .set({ gold: buyer.gold - listing.priceGold })
        .where(eq(charactersTable.id, buyer.id));

      // 6. Tính thuế sàn 5% và cộng tiền cho người bán nếu người bán là người chơi thực
      const sellerProfit = Math.floor(listing.priceGold * 0.95);
      const [seller] = await tx
        .select()
        .from(charactersTable)
        .where(eq(charactersTable.id, listing.sellerCharacterId))
        .limit(1);

      if (seller) {
        await tx
          .update(charactersTable)
          .set({ gold: seller.gold + sellerProfit })
          .where(eq(charactersTable.id, seller.id));
      }

      // 7. Cập nhật trạng thái niêm yết
      await tx
        .update(marketListingsTable)
        .set({
          status: "SOLD",
          buyerCharacterId: buyer.id,
          soldAt: new Date(),
        })
        .where(eq(marketListingsTable.id, listing.id));

      // 8. Chuyển vật phẩm nguyên vẹn vào túi người mua
      const [createdItem] = await tx
        .insert(characterItemsTable)
        .values({
          characterId: buyer.id,
          itemId: listing.itemId,
          equipped: false,
          enhanceLevel: listing.enhanceLevel,
          bonusCombatPower: listing.bonusCombatPower,
          rarity: listing.itemRarity,
          miraclePassive1: listing.miraclePassive1,
          miraclePassive2: listing.miraclePassive2,
          socketsJson: listing.socketsJson,
          reforgeStatsJson: listing.reforgeStatsJson,
          quantity: 1,
        })
        .returning();

      return {
        listing,
        sellerProfit,
        createdItem,
        buyerGoldLeft: buyer.gold - listing.priceGold,
      };
    });

    const updatedInv = await listInventory(Number(buyerCharacterId));

    res.status(200).json({
      success: true,
      message: `🎉 Mua thành công [${result.listing.itemName} +${result.listing.enhanceLevel}] với giá ${result.listing.priceGold.toLocaleString()} Vàng!`,
      buyerGoldLeft: result.buyerGoldLeft,
      inventory: updatedInv,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Lỗi mua hàng trên chợ" });
  }
});

// ── 3. ĐĂNG BÁN VẬT PHẨM LÊN CHỢ (SELL ITEM) ──
router.post("/market/sell", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req);
  const { characterId, ownershipId, priceGold } = req.body;

  const price = Math.floor(Number(priceGold));
  if (isNaN(price) || price < 10 || price > 99999999) {
    res.status(400).json({ error: "Giá bán không hợp lệ (Tối thiểu 10 Vàng, tối đa 99,999,999 Vàng)" });
    return;
  }

  try {
    const result = await db.transaction(async (tx: any) => {
      const [char] = await tx
        .select()
        .from(charactersTable)
        .where(and(eq(charactersTable.id, Number(characterId)), eq(charactersTable.userId, userId)))
        .limit(1);

      if (!char) throw new Error("Không tìm thấy nhân vật sở hữu");

      // Phí niêm yết sàn 2% (chống spam / chống chuyển vàng ảo)
      const listingFee = Math.max(1, Math.floor(price * 0.02));
      if (char.gold < listingFee) {
        throw new Error(`Bạn không đủ Vàng để trả phí niêm yết 2% (Cần ${listingFee} Vàng, hiện có ${char.gold} Vàng)`);
      }

      await tx
        .update(charactersTable)
        .set({ gold: char.gold - listingFee })
        .where(eq(charactersTable.id, char.id));

      const [itemRow] = await tx
        .select({
          owned: characterItemsTable,
          item: itemsTable,
        })
        .from(characterItemsTable)
        .innerJoin(itemsTable, eq(characterItemsTable.itemId, itemsTable.id))
        .where(and(eq(characterItemsTable.id, Number(ownershipId)), eq(characterItemsTable.characterId, char.id)))
        .limit(1);

      if (!itemRow) throw new Error("Vật phẩm không có trong túi đồ");
      const owned = itemRow.owned || itemRow;
      const item = itemRow.item || itemRow;

      if (owned.equipped) throw new Error("Không thể bán trang bị đang mặc trên người. Hãy tháo ra trước!");

      // Đăng bán vào marketListingsTable
      const [listing] = await tx
        .insert(marketListingsTable)
        .values({
          sellerCharacterId: char.id,
          sellerName: char.name,
          sellerServerId: char.serverId || "server-1",
          itemId: owned.itemId || item.id,
          itemName: item.name || owned.itemName || "Vật phẩm",
          itemCategory: item.category || "equipment",
          itemType: item.type || "weapon",
          itemEquipSlot: item.equipSlot || "none",
          itemRarity: owned.rarity || item.rarity || "common",
          enhanceLevel: owned.enhanceLevel || 0,
          bonusCombatPower: owned.bonusCombatPower || 0,
          miraclePassive1: owned.miraclePassive1 || null,
          miraclePassive2: owned.miraclePassive2 || null,
          socketsJson: owned.socketsJson || null,
          reforgeStatsJson: owned.reforgeStatsJson || null,
          priceGold: price,
          status: "ACTIVE",
        })
        .returning();

      // Xóa vật phẩm khỏi túi đồ người bán
      await tx.delete(characterItemsTable).where(eq(characterItemsTable.id, owned.id));

      return listing;
    });

    const updatedInv = await listInventory(Number(characterId));

    res.status(200).json({
      success: true,
      message: `📤 Đăng bán thành công [${result.itemName} +${result.enhanceLevel}] với giá ${price.toLocaleString()} Vàng!`,
      listing: result,
      inventory: updatedInv,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Lỗi đăng bán vật phẩm" });
  }
});

// ── 4. LẤY DANH SÁCH MÓN ĐỒ ĐANG RAO BÁN CỦA TÔI ──
router.get("/market/my-listings/:characterId", requireAuth, async (req, res): Promise<void> => {
  const characterId = Number(req.params.characterId);
  const userId = getAuthUserId(req);

  const [char] = await db
    .select()
    .from(charactersTable)
    .where(and(eq(charactersTable.id, characterId), eq(charactersTable.userId, userId)))
    .limit(1);

  if (!char) {
    res.status(404).json({ error: "Không tìm thấy nhân vật" });
    return;
  }

  const myListings = await db
    .select()
    .from(marketListingsTable)
    .where(eq(marketListingsTable.sellerCharacterId, characterId))
    .orderBy(desc(marketListingsTable.listedAt));

  res.status(200).json({ success: true, listings: myListings });
});

// ── 5. HỦY ĐĂNG BÁN & NHẬN LẠI ĐỒ VÀO TÚI ──
router.post("/market/cancel/:id", requireAuth, async (req, res): Promise<void> => {
  const listingId = Number(req.params.id);
  const userId = getAuthUserId(req);
  const { characterId } = req.body;

  try {
    const result = await db.transaction(async (tx: any) => {
      const [char] = await tx
        .select()
        .from(charactersTable)
        .where(and(eq(charactersTable.id, Number(characterId)), eq(charactersTable.userId, userId)))
        .limit(1);

      if (!char) throw new Error("Không tìm thấy nhân vật");

      const [listing] = await tx
        .select()
        .from(marketListingsTable)
        .where(and(eq(marketListingsTable.id, listingId), eq(marketListingsTable.sellerCharacterId, char.id)))
        .limit(1);

      if (!listing || listing.status !== "ACTIVE") {
        throw new Error("Món hàng không tồn tại hoặc đã được bán");
      }

      // Cập nhật trạng thái niêm yết
      await tx
        .update(marketListingsTable)
        .set({ status: "CANCELLED" })
        .where(eq(marketListingsTable.id, listing.id));

      // Trả lại vật phẩm vào túi đồ
      await tx.insert(characterItemsTable).values({
        characterId: char.id,
        itemId: listing.itemId,
        equipped: false,
        enhanceLevel: listing.enhanceLevel,
        bonusCombatPower: listing.bonusCombatPower,
        rarity: listing.itemRarity,
        miraclePassive1: listing.miraclePassive1,
        miraclePassive2: listing.miraclePassive2,
        socketsJson: listing.socketsJson,
        reforgeStatsJson: listing.reforgeStatsJson,
        quantity: 1,
      });

      return listing;
    });

    const updatedInv = await listInventory(Number(characterId));

    res.status(200).json({
      success: true,
      message: `📥 Đã hủy đăng bán và nhận lại [${result.itemName}] vào túi đồ!`,
      inventory: updatedInv,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Lỗi hủy niêm yết" });
  }
});

export default router;
