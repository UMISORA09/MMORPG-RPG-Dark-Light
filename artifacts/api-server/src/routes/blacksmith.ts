import { Router } from "express";
import { and, eq, inArray } from "drizzle-orm";
import {
  db,
  charactersTable,
  characterItemsTable,
  itemsTable,
  characterQuestsTable,
  questsTable,
} from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { recalculateCharacterStats } from "../services/CharacterInventoryService";
import { listInventory } from "../lib/inventory";

const router = Router();

// Tỉ lệ thành công chuẩn theo yêu cầu Hạng mục 2
function getEnhanceSuccessRate(currentLevel: number): number {
  if (currentLevel < 5) return 1.0; // +1 đến +5: 100%
  if (currentLevel === 5) return 0.75; // lên +6: 75%
  if (currentLevel === 6) return 0.70;
  if (currentLevel === 7) return 0.60;
  if (currentLevel === 8) return 0.50;
  if (currentLevel === 9) return 0.45; // lên +10: 45%
  if (currentLevel === 10) return 0.30; // lên +11: 30%
  if (currentLevel === 11) return 0.25;
  if (currentLevel === 12) return 0.20;
  if (currentLevel === 13) return 0.15;
  if (currentLevel === 14) return 0.10; // lên +15: 10%
  return 0.05;
}

function getEnhanceStonesCost(currentLevel: number): number {
  if (currentLevel < 5) return 1;
  if (currentLevel < 10) return 2;
  return 4;
}

// ── 1. CƯỜNG HÓA TRANG BỊ (+0 -> +15) ──
router.post("/characters/:characterId/blacksmith/enhance", requireAuth, async (req, res): Promise<void> => {
  const characterId = Number(req.params.characterId);
  const userId = req.session.userId!;
  const { ownershipId, useProtection = false } = req.body;

  const [character] = await db
    .select()
    .from(charactersTable)
    .where(and(eq(charactersTable.id, characterId), eq(charactersTable.userId, userId)))
    .limit(1);

  if (!character) {
    res.status(404).json({ error: "Không tìm thấy nhân vật" });
    return;
  }

  const [owned] = await db
    .select({
      id: characterItemsTable.id,
      itemId: characterItemsTable.itemId,
      enhanceLevel: characterItemsTable.enhanceLevel,
      bonusCombatPower: characterItemsTable.bonusCombatPower,
      equipped: characterItemsTable.equipped,
      item: itemsTable,
    })
    .from(characterItemsTable)
    .innerJoin(itemsTable, eq(characterItemsTable.itemId, itemsTable.id))
    .where(
      and(
        eq(characterItemsTable.id, Number(ownershipId)),
        eq(characterItemsTable.characterId, characterId),
      ),
    )
    .limit(1);

  if (!owned) {
    res.status(404).json({ error: "Vật phẩm không có trong túi nhân vật" });
    return;
  }

  if (owned.item.category !== "equipment") {
    res.status(400).json({ error: "Chỉ có thể cường hóa trang bị" });
    return;
  }

  const curLevel = Number(owned.enhanceLevel || 0);
  if (curLevel >= 15) {
    res.status(400).json({ error: "Trang bị đã đạt mức cường hóa tối đa (+15)!" });
    return;
  }

  const nextLevel = curLevel + 1;
  const goldCost = nextLevel * 150;
  const stoneCost = getEnhanceStonesCost(curLevel);

  if (character.gold < goldCost) {
    res.status(400).json({ error: `Không đủ vàng! Cần ${goldCost} Vàng.` });
    return;
  }

  // Kiểm tra Đá Cường Hóa
  const [stoneItem] = await db
    .select()
    .from(characterItemsTable)
    .where(
      and(
        eq(characterItemsTable.characterId, characterId),
        eq(characterItemsTable.itemId, "material_enhance_stone"),
        eq(characterItemsTable.equipped, false),
      ),
    )
    .limit(1);

  if (!stoneItem || stoneItem.quantity < stoneCost) {
    res.status(400).json({ error: `Cần ${stoneCost} Đá Cường Hóa Tinh Khiết!` });
    return;
  }

  // Kiểm tra Bùa Bảo Hộ nếu cấp >= 10 và có yêu cầu bảo hộ (TRƯỚC KHI TRỪ TÀI NGUYÊN)
  let protectionUsed = false;
  let protectionCharmItem: any = null;

  if (curLevel >= 10 && useProtection) {
    const [charm] = await db
      .select()
      .from(characterItemsTable)
      .where(
        and(
          eq(characterItemsTable.characterId, characterId),
          eq(characterItemsTable.itemId, "charm_protection"),
          eq(characterItemsTable.equipped, false),
        ),
      )
      .limit(1);

    if (charm && charm.quantity > 0) {
      protectionCharmItem = charm;
      protectionUsed = true;
    } else {
      res.status(400).json({ error: "Bạn không có Bùa Bảo Hộ Cường Hóa trong túi đồ!" });
      return;
    }
  }

  // Sau khi xác thực hợp lệ cả Vàng, Đá Cường Hóa VÀ Bùa Bảo Hộ (nếu yêu cầu), mới thực hiện trừ tài nguyên
  await db
    .update(charactersTable)
    .set({ gold: character.gold - goldCost })
    .where(eq(charactersTable.id, characterId));

  if (stoneItem.quantity <= stoneCost) {
    await db.delete(characterItemsTable).where(eq(characterItemsTable.id, stoneItem.id));
  } else {
    await db
      .update(characterItemsTable)
      .set({ quantity: stoneItem.quantity - stoneCost })
      .where(eq(characterItemsTable.id, stoneItem.id));
  }

  if (protectionUsed && protectionCharmItem) {
    if (protectionCharmItem.quantity <= 1) {
      await db.delete(characterItemsTable).where(eq(characterItemsTable.id, protectionCharmItem.id));
    } else {
      await db
        .update(characterItemsTable)
        .set({ quantity: protectionCharmItem.quantity - 1 })
        .where(eq(characterItemsTable.id, protectionCharmItem.id));
    }
  }

  // Quay tỉ lệ
  const successRate = getEnhanceSuccessRate(curLevel);
  const roll = Math.random();
  const isSuccess = roll < successRate;

  let newEnhanceLevel = curLevel;
  let bonusCombatPower = Number(owned.bonusCombatPower || 0);
  let failureReason = "";

  if (isSuccess) {
    newEnhanceLevel = nextLevel;
    // Mỗi cấp cường hóa tăng thêm 10% chỉ số cơ bản trang bị (bonus CP tương ứng)
    bonusCombatPower += nextLevel * 100;

    await db
      .update(characterItemsTable)
      .set({
        enhanceLevel: newEnhanceLevel,
        bonusCombatPower,
      })
      .where(eq(characterItemsTable.id, owned.id));

    // Tự động kiểm tra và cập nhật tiến độ Quest 4 (Cường hóa +1)
    const [q4] = await db
      .select()
      .from(characterQuestsTable)
      .where(
        and(
          eq(characterQuestsTable.characterId, characterId),
          eq(characterQuestsTable.questId, "q4_cuong_hoa_1"),
          eq(characterQuestsTable.status, "IN_PROGRESS"),
        ),
      )
      .limit(1);

    if (q4) {
      await db
        .update(characterQuestsTable)
        .set({ progress: 1, status: "READY_TO_CLAIM", updatedAt: new Date() })
        .where(eq(characterQuestsTable.id, q4.id));
    }
  } else {
    // THẤT BẠI: Từ cấp 10 trở lên nếu không có Bùa Bảo Hộ sẽ bị rớt cấp
    if (curLevel >= 10) {
      if (protectionUsed) {
        failureReason = `🛡️ Bùa Bảo Hộ đã kích hoạt bảo vệ! Trang bị được giữ nguyên cấp +${curLevel}.`;
      } else {
        newEnhanceLevel = Math.max(0, curLevel - 1);
        bonusCombatPower = Math.max(0, bonusCombatPower - curLevel * 100);
        await db
          .update(characterItemsTable)
          .set({
            enhanceLevel: newEnhanceLevel,
            bonusCombatPower,
          })
          .where(eq(characterItemsTable.id, owned.id));
        failureReason = `⚠️ Cường hóa thất bại ở tỉ lệ ${Math.round(successRate * 100)}%! Do không dùng Bùa Bảo Hộ, trang bị đã bị rớt xuống cấp +${newEnhanceLevel}!`;
      }
    } else {
      failureReason = `⚠️ Cường hóa thất bại ở tỉ lệ ${Math.round(successRate * 100)}%! Trang bị được giữ nguyên cấp +${curLevel}.`;
    }
  }

  const updatedChar = await recalculateCharacterStats(characterId);

  res.status(200).json({
    success: isSuccess,
    oldLevel: curLevel,
    newLevel: newEnhanceLevel,
    goldCost,
    stoneCost,
    successRate: Math.round(successRate * 100),
    bonusCombatPower,
    protectionUsed,
    character: {
      id: updatedChar.id,
      gold: updatedChar.gold,
      combatPower: updatedChar.combatPower,
    },
    inventory: await listInventory(characterId),
    message: isSuccess
      ? `🎉 Chúc mừng! Cường hóa thành công lên +${newEnhanceLevel}!`
      : failureReason,
  });
});

// ── 2. PHÂN GIẢI ĐỒ THỪA (DISMANTLE / SALVAGE) ──
router.post("/characters/:characterId/blacksmith/dismantle", requireAuth, async (req, res): Promise<void> => {
  const characterId = Number(req.params.characterId);
  const userId = req.session.userId!;
  const { ownershipIds } = req.body;

  if (!Array.isArray(ownershipIds) || ownershipIds.length === 0) {
    res.status(400).json({ error: "Chưa chọn trang bị để phân giải" });
    return;
  }

  const [character] = await db
    .select()
    .from(charactersTable)
    .where(and(eq(charactersTable.id, characterId), eq(charactersTable.userId, userId)))
    .limit(1);

  if (!character) {
    res.status(404).json({ error: "Không tìm thấy nhân vật" });
    return;
  }

  const itemsToDismantle = await db
    .select({
      id: characterItemsTable.id,
      itemId: characterItemsTable.itemId,
      equipped: characterItemsTable.equipped,
      rarity: itemsTable.rarity,
      name: itemsTable.name,
    })
    .from(characterItemsTable)
    .innerJoin(itemsTable, eq(characterItemsTable.itemId, itemsTable.id))
    .where(
      and(
        eq(characterItemsTable.characterId, characterId),
        inArray(characterItemsTable.id, ownershipIds.map(Number)),
      ),
    );

  // Không cho phân giải đồ đang mặc
  const validItems = itemsToDismantle.filter((i: any) => !i.equipped);
  if (validItems.length === 0) {
    res.status(400).json({ error: "Không thể phân giải trang bị đang mặc trên người" });
    return;
  }

  let totalEnhanceStones = 0;
  let totalSteelOre = 0;
  let totalDarkShards = 0;
  let totalGoldGained = 0;

  for (const item of validItems) {
    if (item.rarity === "common") {
      totalEnhanceStones += 1;
      totalSteelOre += 2;
      totalGoldGained += 40;
    } else if (item.rarity === "rare") {
      totalEnhanceStones += 3;
      totalSteelOre += 5;
      totalDarkShards += 1;
      totalGoldGained += 120;
    } else if (item.rarity === "epic") {
      totalEnhanceStones += 8;
      totalSteelOre += 10;
      totalDarkShards += 3;
      totalGoldGained += 350;
    } else if (item.rarity === "legendary") {
      totalEnhanceStones += 20;
      totalSteelOre += 25;
      totalDarkShards += 8;
      totalGoldGained += 1000;
    }
  }

  // Xóa các món đã phân giải
  const idsToDelete = validItems.map((i: any) => i.id);
  await db.delete(characterItemsTable).where(inArray(characterItemsTable.id, idsToDelete));

  // Hàm thêm vật phẩm vào kho
  async function addMaterial(matId: string, count: number) {
    if (count <= 0) return;
    const [existing] = await db
      .select()
      .from(characterItemsTable)
      .where(
        and(
          eq(characterItemsTable.characterId, characterId),
          eq(characterItemsTable.itemId, matId),
          eq(characterItemsTable.equipped, false),
        ),
      )
      .limit(1);

    if (existing) {
      await db
        .update(characterItemsTable)
        .set({ quantity: existing.quantity + count })
        .where(eq(characterItemsTable.id, existing.id));
    } else {
      await db.insert(characterItemsTable).values({
        characterId,
        itemId: matId,
        quantity: count,
        equipped: false,
        enhanceLevel: 0,
        bonusCombatPower: 0,
      });
    }
  }

  await addMaterial("material_enhance_stone", totalEnhanceStones);
  await addMaterial("material_steel_ore", totalSteelOre);
  await addMaterial("material_dark_shard", totalDarkShards);

  // Cộng vàng
  await db
    .update(charactersTable)
    .set({ gold: character.gold + totalGoldGained })
    .where(eq(charactersTable.id, characterId));

  res.status(200).json({
    success: true,
    dismantledCount: validItems.length,
    materialsReceived: {
      enhanceStones: totalEnhanceStones,
      steelOre: totalSteelOre,
      darkShards: totalDarkShards,
      gold: totalGoldGained,
    },
    message: `Đã phân giải ${validItems.length} trang bị thành công! Nhận được ${totalEnhanceStones} Đá Cường Hóa & ${totalSteelOre} Quặng Thép.`,
  });
});

// ── 3. CHẾ TẠO THẦN BINH (CRAFTING) ──
const CRAFT_RECIPES = [
  {
    recipeId: "craft_rare_weapon",
    targetPrefix: "gear_{class}_main_weapon_rare",
    name: "Vũ Khí Hiếm (Rare)",
    type: "weapon",
    rarity: "rare",
    goldCost: 450,
    materials: [
      { id: "material_steel_ore", name: "Quặng Huyền Thiết", count: 8 },
      { id: "material_enhance_stone", name: "Đá Cường Hóa", count: 4 },
    ],
  },
  {
    recipeId: "craft_rare_armor",
    targetPrefix: "gear_{class}_armor_rare",
    name: "Chiến Giáp Hiếm (Rare)",
    type: "armor",
    rarity: "rare",
    goldCost: 400,
    materials: [
      { id: "material_steel_ore", name: "Quặng Huyền Thiết", count: 6 },
      { id: "material_enhance_stone", name: "Đá Cường Hóa", count: 3 },
    ],
  },
  {
    recipeId: "craft_epic_weapon",
    targetPrefix: "gear_{class}_main_weapon_epic",
    name: "Thần Khí Sử Thi (Epic)",
    type: "weapon",
    rarity: "epic",
    goldCost: 1500,
    materials: [
      { id: "material_steel_ore", name: "Quặng Huyền Thiết", count: 20 },
      { id: "material_enhance_stone", name: "Đá Cường Hóa", count: 12 },
      { id: "material_dark_shard", name: "Mảnh Vỡ Hắc Ám", count: 5 },
    ],
  },
  {
    recipeId: "craft_legendary_weapon",
    targetPrefix: "gear_{class}_main_weapon_legendary",
    name: "Thần Binh Long Vương (Legendary)",
    type: "weapon",
    rarity: "legendary",
    goldCost: 4000,
    materials: [
      { id: "material_dragon_crystal", name: "Tinh Thể Rồng", count: 3 },
      { id: "material_dark_shard", name: "Mảnh Vỡ Hắc Ám", count: 15 },
      { id: "material_enhance_stone", name: "Đá Cường Hóa", count: 25 },
    ],
  },
  {
    recipeId: "craft_potion_bundle",
    targetItemId: "potion_hp_greater",
    targetCount: 5,
    name: "Gói 5 Bình Máu Đại",
    type: "consumable",
    rarity: "common",
    goldCost: 150,
    materials: [
      { id: "material_dark_shard", name: "Mảnh Vỡ Hắc Ám", count: 4 },
    ],
  },
];

router.get("/blacksmith/recipes", (_req, res) => {
  res.status(200).json(CRAFT_RECIPES);
});

router.post("/characters/:characterId/blacksmith/craft", requireAuth, async (req, res): Promise<void> => {
  const characterId = Number(req.params.characterId);
  const userId = req.session.userId!;
  const { recipeId } = req.body;

  const [character] = await db
    .select()
    .from(charactersTable)
    .where(and(eq(charactersTable.id, characterId), eq(charactersTable.userId, userId)))
    .limit(1);

  if (!character) {
    res.status(404).json({ error: "Không tìm thấy nhân vật" });
    return;
  }

  const recipe = CRAFT_RECIPES.find((r) => r.recipeId === recipeId);
  if (!recipe) {
    res.status(404).json({ error: "Công thức chế tạo không tồn tại" });
    return;
  }

  if (character.gold < recipe.goldCost) {
    res.status(400).json({ error: `Không đủ vàng! Cần ${recipe.goldCost} Vàng.` });
    return;
  }

  // Xác định Target Item ID
  let targetItemId = recipe.targetItemId;
  if (!targetItemId && recipe.targetPrefix) {
    targetItemId = recipe.targetPrefix.replace("{class}", character.classId);
  }

  // Kiểm tra đủ nguyên liệu không
  for (const mat of recipe.materials) {
    const [matInInv] = await db
      .select()
      .from(characterItemsTable)
      .where(
        and(
          eq(characterItemsTable.characterId, characterId),
          eq(characterItemsTable.itemId, mat.id),
          eq(characterItemsTable.equipped, false),
        ),
      )
      .limit(1);

    if (!matInInv || matInInv.quantity < mat.count) {
      res.status(400).json({ error: `Thiếu nguyên liệu: ${mat.name} (Cần ${mat.count}, có ${matInInv?.quantity || 0})` });
      return;
    }
  }

  // Trừ nguyên liệu
  for (const mat of recipe.materials) {
    const [matInInv] = await db
      .select()
      .from(characterItemsTable)
      .where(
        and(
          eq(characterItemsTable.characterId, characterId),
          eq(characterItemsTable.itemId, mat.id),
          eq(characterItemsTable.equipped, false),
        ),
      )
      .limit(1);

    if (matInInv.quantity <= mat.count) {
      await db.delete(characterItemsTable).where(eq(characterItemsTable.id, matInInv.id));
    } else {
      await db
        .update(characterItemsTable)
        .set({ quantity: matInInv.quantity - mat.count })
        .where(eq(characterItemsTable.id, matInInv.id));
    }
  }

  // Trừ vàng
  await db
    .update(charactersTable)
    .set({ gold: character.gold - recipe.goldCost })
    .where(eq(charactersTable.id, characterId));

  // Trao vật phẩm mới vào túi đồ
  const targetCount = recipe.targetCount || 1;
  const [existingGear] = await db
    .select()
    .from(characterItemsTable)
    .where(
      and(
        eq(characterItemsTable.characterId, characterId),
        eq(characterItemsTable.itemId, targetItemId!),
        eq(characterItemsTable.equipped, false),
      ),
    )
    .limit(1);

  if (existingGear && recipe.type === "consumable") {
    await db
      .update(characterItemsTable)
      .set({ quantity: existingGear.quantity + targetCount })
      .where(eq(characterItemsTable.id, existingGear.id));
  } else {
    await db.insert(characterItemsTable).values({
      characterId,
      itemId: targetItemId!,
      quantity: targetCount,
      equipped: false,
      enhanceLevel: 0,
      bonusCombatPower: 0,
    });
  }

  // Tự động kiểm tra và cập nhật tiến độ Quest 7 (Chế tạo Rare)
  if (recipe.rarity === "rare" || recipe.rarity === "epic" || recipe.rarity === "legendary") {
    const [q7] = await db
      .select()
      .from(characterQuestsTable)
      .where(
        and(
          eq(characterQuestsTable.characterId, characterId),
          eq(characterQuestsTable.questId, "q7_che_tao_rare"),
          eq(characterQuestsTable.status, "IN_PROGRESS"),
        ),
      )
      .limit(1);

    if (q7) {
      await db
        .update(characterQuestsTable)
        .set({ progress: 1, status: "READY_TO_CLAIM", updatedAt: new Date() })
        .where(eq(characterQuestsTable.id, q7.id));
    }
  }

  res.status(200).json({
    success: true,
    craftedItem: {
      itemId: targetItemId,
      count: targetCount,
      name: recipe.name,
      rarity: recipe.rarity,
    },
    message: `🎉 Chúc mừng! Chế tạo thành công ${recipe.name}!`,
  });
});

// ── 4. KHẢM BẢO THẠCH VÀO TRANG BỊ (GEM SOCKETING) ──
router.post("/characters/:characterId/blacksmith/socket", requireAuth, async (req, res): Promise<void> => {
  const characterId = Number(req.params.characterId);
  const userId = req.session.userId!;
  const { ownershipId, socketIndex, gemOwnershipId } = req.body;

  const [character] = await db
    .select()
    .from(charactersTable)
    .where(and(eq(charactersTable.id, characterId), eq(charactersTable.userId, userId)))
    .limit(1);

  if (!character) {
    res.status(404).json({ error: "Không tìm thấy nhân vật" });
    return;
  }

  const [gear] = await db
    .select()
    .from(characterItemsTable)
    .where(and(eq(characterItemsTable.id, Number(ownershipId)), eq(characterItemsTable.characterId, characterId)))
    .limit(1);

  if (!gear) {
    res.status(404).json({ error: "Không tìm thấy trang bị" });
    return;
  }

  let rarity = (gear.rarity || "common").toLowerCase();
  if (rarity === "common") {
    const [it] = await db.select().from(itemsTable).where(eq(itemsTable.id, gear.itemId)).limit(1);
    if (it?.rarity) rarity = it.rarity.toLowerCase();
  }
  const maxSockets = rarity === "miracle" || rarity === "legendary" ? 3 : rarity === "epic" ? 2 : rarity === "rare" ? 1 : 0;
  if (maxSockets <= 0) {
    res.status(400).json({ error: "Trang bị phẩm chất Rare trở lên mới có lỗ khảm ngọc!" });
    return;
  }

  if (socketIndex < 0 || socketIndex >= maxSockets) {
    res.status(400).json({ error: `Vị trí lỗ khảm không hợp lệ (Trang bị này có tối đa ${maxSockets} lỗ)` });
    return;
  }

  // Lấy viên ngọc từ túi đồ
  const [gemItem] = await db
    .select()
    .from(characterItemsTable)
    .where(and(eq(characterItemsTable.id, Number(gemOwnershipId)), eq(characterItemsTable.characterId, characterId)))
    .limit(1);

  if (!gemItem || !gemItem.itemId.startsWith("gem_")) {
    res.status(400).json({ error: "Vật phẩm chọn không phải là Bảo Thạch hợp lệ" });
    return;
  }

  // Parse ngọc
  const parts = gemItem.itemId.split("_");
  const gemType = parts[1]; // ruby, sapphire, topaz, emerald
  const level = Number(parts[2]) || 1;

  let currentSockets: any[] = [];
  try {
    currentSockets = typeof gear.socketsJson === "string" ? JSON.parse(gear.socketsJson) : (gear.socketsJson || []);
  } catch {
    currentSockets = [];
  }

  // Nếu lỗ đã có ngọc, tháo trả ngọc cũ vào túi
  const existingSocket = currentSockets.find((s) => s.index === socketIndex);
  if (existingSocket && existingSocket.gemId) {
    await db.insert(characterItemsTable).values({
      characterId,
      itemId: existingSocket.gemId,
      quantity: 1,
      equipped: false,
    });
  }

  // Trừ 1 viên ngọc vừa dùng
  if (gemItem.quantity <= 1) {
    await db.delete(characterItemsTable).where(eq(characterItemsTable.id, gemItem.id));
  } else {
    await db
      .update(characterItemsTable)
      .set({ quantity: gemItem.quantity - 1 })
      .where(eq(characterItemsTable.id, gemItem.id));
  }

  // Ghi nhận ngọc mới vào sockets
  currentSockets = currentSockets.filter((s) => s.index !== socketIndex);
  currentSockets.push({
    index: socketIndex,
    gemId: gemItem.itemId,
    gemType,
    level,
  });

  await db
    .update(characterItemsTable)
    .set({ socketsJson: JSON.stringify(currentSockets) })
    .where(eq(characterItemsTable.id, gear.id));

  await recalculateCharacterStats(characterId);
  const updatedInv = await listInventory(characterId);

  res.status(200).json({
    success: true,
    message: `✨ Khảm thành công ${gemItem.itemId} vào lỗ ${socketIndex + 1}!`,
    sockets: currentSockets,
    inventory: updatedInv,
  });
});

// ── 5. THÁO BẢO THẠCH KHỎI TRANG BỊ (UNSOCKET) ──
router.post("/characters/:characterId/blacksmith/unsocket", requireAuth, async (req, res): Promise<void> => {
  const characterId = Number(req.params.characterId);
  const userId = req.session.userId!;
  const { ownershipId, socketIndex } = req.body;

  const [character] = await db
    .select()
    .from(charactersTable)
    .where(and(eq(charactersTable.id, characterId), eq(charactersTable.userId, userId)))
    .limit(1);

  if (!character) {
    res.status(404).json({ error: "Không tìm thấy nhân vật" });
    return;
  }

  const [gear] = await db
    .select()
    .from(characterItemsTable)
    .where(and(eq(characterItemsTable.id, Number(ownershipId)), eq(characterItemsTable.characterId, characterId)))
    .limit(1);

  if (!gear) {
    res.status(404).json({ error: "Không tìm thấy trang bị" });
    return;
  }

  let currentSockets: any[] = [];
  try {
    currentSockets = typeof gear.socketsJson === "string" ? JSON.parse(gear.socketsJson) : (gear.socketsJson || []);
  } catch {
    currentSockets = [];
  }

  const targetSocket = currentSockets.find((s) => s.index === socketIndex);
  if (!targetSocket || !targetSocket.gemId) {
    res.status(400).json({ error: "Lỗ khảm này hiện đang rỗng, không có ngọc để tháo" });
    return;
  }

  // Hoàn trả ngọc về túi
  await db.insert(characterItemsTable).values({
    characterId,
    itemId: targetSocket.gemId,
    quantity: 1,
    equipped: false,
  });

  currentSockets = currentSockets.filter((s) => s.index !== socketIndex);

  await db
    .update(characterItemsTable)
    .set({ socketsJson: JSON.stringify(currentSockets) })
    .where(eq(characterItemsTable.id, gear.id));

  await recalculateCharacterStats(characterId);
  const updatedInv = await listInventory(characterId);

  res.status(200).json({
    success: true,
    message: `💎 Đã tháo ngọc ${targetSocket.gemId} thành công và đưa vào túi đồ!`,
    sockets: currentSockets,
    inventory: updatedInv,
  });
});

// ── 6. GHÉP BẢO THẠCH CẤP CAO (FUSE GEMS: 3 GEM LV.N -> 1 GEM LV.N+1) ──
router.post("/characters/:characterId/blacksmith/fuse-gems", requireAuth, async (req, res): Promise<void> => {
  const characterId = Number(req.params.characterId);
  const userId = req.session.userId!;
  const { gemType, fromLevel } = req.body;

  const levelNum = Number(fromLevel);
  if (levelNum < 1 || levelNum >= 5) {
    res.status(400).json({ error: "Cấp độ bảo thạch để ghép chỉ từ cấp 1 đến cấp 4!" });
    return;
  }

  const [character] = await db
    .select()
    .from(charactersTable)
    .where(and(eq(charactersTable.id, characterId), eq(charactersTable.userId, userId)))
    .limit(1);

  if (!character) {
    res.status(404).json({ error: "Không tìm thấy nhân vật" });
    return;
  }

  const sourceGemId = `gem_${gemType}_${levelNum}`;
  const targetGemId = `gem_${gemType}_${levelNum + 1}`;
  const goldCost = levelNum * 300;

  if (character.gold < goldCost) {
    res.status(400).json({ error: `Không đủ vàng để ghép ngọc (Cần ${goldCost} Vàng)` });
    return;
  }

  // Đếm tổng số ngọc cùng loại
  const gemsInInv = await db
    .select()
    .from(characterItemsTable)
    .where(and(eq(characterItemsTable.characterId, characterId), eq(characterItemsTable.itemId, sourceGemId), eq(characterItemsTable.equipped, false)));

  const totalCount = gemsInInv.reduce((sum: number, g: any) => sum + (g.quantity || 1), 0);
  if (totalCount < 3) {
    res.status(400).json({ error: `Cần ít nhất 3 viên ${sourceGemId} để ghép lên cấp ${levelNum + 1} (Hiện có ${totalCount})` });
    return;
  }

  // Trừ 3 viên ngọc
  let needToDeduct = 3;
  for (const g of gemsInInv) {
    if (needToDeduct <= 0) break;
    if (g.quantity <= needToDeduct) {
      needToDeduct -= g.quantity;
      await db.delete(characterItemsTable).where(eq(characterItemsTable.id, g.id));
    } else {
      await db
        .update(characterItemsTable)
        .set({ quantity: g.quantity - needToDeduct })
        .where(eq(characterItemsTable.id, g.id));
      needToDeduct = 0;
    }
  }

  // Trừ vàng
  await db
    .update(charactersTable)
    .set({ gold: character.gold - goldCost })
    .where(eq(charactersTable.id, characterId));

  // Trao 1 viên ngọc cấp cao
  await db.insert(characterItemsTable).values({
    characterId,
    itemId: targetGemId,
    quantity: 1,
    equipped: false,
  });

  const updatedInv = await listInventory(characterId);
  res.status(200).json({
    success: true,
    message: `🎉 Chúc mừng! Ghép thành công 1 viên ${targetGemId}!`,
    newGemId: targetGemId,
    inventory: updatedInv,
  });
});

// ── 7. TẨY LUYỆN DÒNG CHỈ SỐ PHỤ (SUB-STAT REFORGING) ──
router.post("/characters/:characterId/blacksmith/reforge", requireAuth, async (req, res): Promise<void> => {
  const characterId = Number(req.params.characterId);
  const userId = req.session.userId!;
  const { ownershipId, lockedIndexes = [] } = req.body;

  const [character] = await db
    .select()
    .from(charactersTable)
    .where(and(eq(charactersTable.id, characterId), eq(charactersTable.userId, userId)))
    .limit(1);

  if (!character) {
    res.status(404).json({ error: "Không tìm thấy nhân vật" });
    return;
  }

  const [gear] = await db
    .select()
    .from(characterItemsTable)
    .where(and(eq(characterItemsTable.id, Number(ownershipId)), eq(characterItemsTable.characterId, characterId)))
    .limit(1);

  if (!gear) {
    res.status(404).json({ error: "Không tìm thấy trang bị" });
    return;
  }

  // Kiểm tra đá tẩy luyện
  const [reforgeStone] = await db
    .select()
    .from(characterItemsTable)
    .where(and(eq(characterItemsTable.characterId, characterId), eq(characterItemsTable.itemId, "material_reforge_stone"), eq(characterItemsTable.equipped, false)))
    .limit(1);

  if (!reforgeStone || reforgeStone.quantity < 1) {
    res.status(400).json({ error: "Thiếu Đá Tẩy Luyện Thần Bí (Cần 1 viên)" });
    return;
  }

  // Chi phí vàng: 300 vàng + 200 vàng mỗi dòng khóa
  const goldCost = 300 + (lockedIndexes.length * 200);
  if (character.gold < goldCost) {
    res.status(400).json({ error: `Không đủ Vàng (Cần ${goldCost} Vàng)` });
    return;
  }

  // Trừ đá tẩy luyện & vàng
  if (reforgeStone.quantity <= 1) {
    await db.delete(characterItemsTable).where(eq(characterItemsTable.id, reforgeStone.id));
  } else {
    await db.update(characterItemsTable).set({ quantity: reforgeStone.quantity - 1 }).where(eq(characterItemsTable.id, reforgeStone.id));
  }

  await db.update(charactersTable).set({ gold: character.gold - goldCost }).where(eq(charactersTable.id, characterId));

  // Tạo các dòng chỉ số ngẫu nhiên
  const statTemplates = [
    { key: "lifesteal", name: "Hút máu khi đánh trúng", suffix: "%", minVal: 1.0, maxVal: 5.0 },
    { key: "boss_dmg", name: "Sát thương lên Boss", suffix: "%", minVal: 4.0, maxVal: 18.0 },
    { key: "cooldown_reduction", name: "Giảm thời gian hồi chiêu", suffix: "%", minVal: 3.0, maxVal: 12.0 },
    { key: "bonus_atk", name: "Sát thương tấn công", suffix: "", minVal: 15, maxVal: 90 },
    { key: "crit_rate", name: "Tỉ lệ bạo kích", suffix: "%", minVal: 2.0, maxVal: 9.0 },
    { key: "def_ignore", name: "Bỏ qua phòng thủ", suffix: "%", minVal: 3.0, maxVal: 15.0 },
  ];

  const rollStatLine = () => {
    const roll = Math.random() * 100;
    let rank = "C";
    let mult = 0.3;
    if (roll < 2.0) { rank = "SS"; mult = 1.0; } // 2% SS Cực Phẩm
    else if (roll < 10.0) { rank = "S"; mult = 0.85; } // 8% S Vàng
    else if (roll < 25.0) { rank = "A"; mult = 0.65; } // 15% A Tím
    else if (roll < 55.0) { rank = "B"; mult = 0.45; } // 30% B Xanh
    else { rank = "C"; mult = 0.3; } // 45% C Xám

    const tmpl = statTemplates[Math.floor(Math.random() * statTemplates.length)];
    const val = tmpl.suffix === "%"
      ? Number((tmpl.minVal + (tmpl.maxVal - tmpl.minVal) * mult).toFixed(1))
      : Math.floor(tmpl.minVal + (tmpl.maxVal - tmpl.minVal) * mult);

    return {
      key: tmpl.key,
      name: tmpl.name,
      value: val,
      suffix: tmpl.suffix,
      rank,
    };
  };

  let currentLines: any[] = [];
  try {
    currentLines = typeof gear.reforgeStatsJson === "string" ? JSON.parse(gear.reforgeStatsJson) : (gear.reforgeStatsJson || []);
  } catch {
    currentLines = [];
  }

  // Luôn đảm bảo có 3 dòng
  while (currentLines.length < 3) {
    currentLines.push(rollStatLine());
  }

  const nextLines = currentLines.map((line, idx) => {
    if (lockedIndexes.includes(idx)) {
      return { ...line, isLocked: true };
    }
    return rollStatLine();
  });

  await db
    .update(characterItemsTable)
    .set({ reforgeStatsJson: JSON.stringify(nextLines) })
    .where(eq(characterItemsTable.id, gear.id));

  await recalculateCharacterStats(characterId);
  const updatedInv = await listInventory(characterId);

  res.status(200).json({
    success: true,
    message: "🔮 Tẩy luyện dòng thuộc tính ẩn thành công!",
    reforgeStats: nextLines,
    inventory: updatedInv,
  });
});

export default router;
