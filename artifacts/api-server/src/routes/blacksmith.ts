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

  // Trừ tài nguyên
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

  // Kiểm tra Bùa Bảo Hộ nếu cấp >= 10 và có yêu cầu bảo hộ
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
      if (charm.quantity <= 1) {
        await db.delete(characterItemsTable).where(eq(characterItemsTable.id, charm.id));
      } else {
        await db
          .update(characterItemsTable)
          .set({ quantity: charm.quantity - 1 })
          .where(eq(characterItemsTable.id, charm.id));
      }
    } else {
      res.status(400).json({ error: "Bạn không có Bùa Bảo Hộ Cường Hóa trong túi đồ!" });
      return;
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

export default router;
