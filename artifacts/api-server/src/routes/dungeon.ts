import { Router } from "express";
import { and, eq } from "drizzle-orm";
import { db, charactersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { recalculateCharacterStats } from "../services/CharacterInventoryService";

const router = Router();

export interface DungeonInstance {
  instanceId: string;
  characterId: number;
  userId: number;
  characterName: string;
  difficulty: "normal" | "hard" | "nightmare";
  currentRoom: number; // 1: Tiền Đồn, 2: Hẻm Quái Tinh Anh, 3: Điện Hắc Long Vương
  totalRooms: number;
  startTime: number;
  revivesRemaining: number;
  cleared: boolean;
  clearTimeSeconds?: number;
}

export interface DungeonLeaderboardEntry {
  rank: number;
  characterId: number;
  characterName: string;
  difficulty: "normal" | "hard" | "nightmare";
  clearTimeSeconds: number;
  clearedAt: string;
}

// In-Memory Dungeon State & Weekly Leaderboard
const activeDungeonInstances = new Map<string, DungeonInstance>();
const dungeonLeaderboard: DungeonLeaderboardEntry[] = [
  {
    rank: 1,
    characterId: 9001,
    characterName: "LongKiem_Vip",
    difficulty: "nightmare",
    clearTimeSeconds: 142,
    clearedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    rank: 2,
    characterId: 9002,
    characterName: "BangTam_Nu",
    difficulty: "nightmare",
    clearTimeSeconds: 168,
    clearedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    rank: 3,
    characterId: 9004,
    characterName: "HoVe_KimCang",
    difficulty: "hard",
    clearTimeSeconds: 115,
    clearedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
];

// Clean up abandoned instances older than 2 hours
setInterval(() => {
  const now = Date.now();
  for (const [id, inst] of activeDungeonInstances.entries()) {
    if (now - inst.startTime > 2 * 3600 * 1000) {
      activeDungeonInstances.delete(id);
    }
  }
}, 60000);

// ── 1. KHỞI TẠO INSTANCE PHÓ BẢN (ISOLATED DUNGEON ROOM) ──
router.post("/dungeon/enter", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const { characterId, difficulty = "normal" } = req.body;

  if (!characterId) {
    res.status(400).json({ error: "Thiếu ID nhân vật" });
    return;
  }

  const [character] = await db
    .select()
    .from(charactersTable)
    .where(and(eq(charactersTable.id, characterId), eq(charactersTable.userId, userId)))
    .limit(1);

  if (!character) {
    res.status(404).json({ error: "Không tìm thấy nhân vật hoặc không có quyền sở hữu" });
    return;
  }

  // Cấp độ tối thiểu theo độ khó
  const minLevels: Record<string, number> = {
    normal: 1,
    hard: 10,
    nightmare: 20,
  };

  const reqLevel = minLevels[difficulty] || 1;
  if (character.level < reqLevel) {
    res.status(400).json({
      error: `Cấp độ không đủ! Chế độ ${difficulty.toUpperCase()} yêu cầu đạt tối thiểu Cấp ${reqLevel}.`,
    });
    return;
  }

  const instanceId = `dungeon_${characterId}_${Date.now().toString(36)}`;
  const instance: DungeonInstance = {
    instanceId,
    characterId,
    userId,
    characterName: character.name,
    difficulty,
    currentRoom: 1,
    totalRooms: 3,
    startTime: Date.now(),
    revivesRemaining: difficulty === "nightmare" ? 3 : 5,
    cleared: false,
  };

  activeDungeonInstances.set(instanceId, instance);

  res.status(200).json({
    success: true,
    message: `🏰 Đã tạo phòng phó bản cô lập cấp độ ${difficulty.toUpperCase()}!`,
    instance,
    roomDetails: {
      room: 1,
      name: "Phòng 1: Tiền Đồn Quái Vật",
      description: "Tiêu diệt toàn bộ bầy Slime & Goblin để mở phong ấn cửa phòng tiếp theo.",
      monstersCount: 4,
    },
  });
});

// ── 2. DỌN SẠCH PHÒNG & TIẾN VÀO PHÒNG KẾ TIẾP (MULTI-ROOM PROGRESSION) ──
router.post("/dungeon/:instanceId/clear-room", requireAuth, async (req, res): Promise<void> => {
  const { instanceId } = req.params;
  const userId = req.session.userId!;

  const instance = activeDungeonInstances.get(instanceId);
  if (!instance) {
    res.status(404).json({ error: "Phó bản không tồn tại hoặc đã hết hạn" });
    return;
  }

  if (instance.userId !== userId) {
    res.status(403).json({ error: "Từ chối truy cập: Bạn không thuộc phó bản này" });
    return;
  }

  if (instance.cleared) {
    res.status(400).json({ error: "Phó bản này đã được chinh phục hoàn tất!" });
    return;
  }

  // Tiến phòng
  if (instance.currentRoom < instance.totalRooms) {
    instance.currentRoom += 1;

    const nextRoomDetails =
      instance.currentRoom === 2
        ? {
            room: 2,
            name: "Phòng 2: Hẻm Núi Quái Tinh Anh",
            description: "Hạ gục Chiến Binh Orc & Kỵ Sĩ Hắc Ám Tinh Anh để mở cổng cấm địa.",
            monstersCount: 3,
          }
        : {
            room: 3,
            name: "Phòng 3: Cung Điện Hắc Long Vương (Boss Room)",
            description: "Đại chiến Boss Hắc Long Vương tối thượng!",
            monstersCount: 1,
          };

    res.status(200).json({
      success: true,
      currentRoom: instance.currentRoom,
      isFinalRoom: instance.currentRoom === instance.totalRooms,
      roomDetails: nextRoomDetails,
      message: `🔓 Đã mở phong ấn! Tiến vào ${nextRoomDetails.name}.`,
    });
    return;
  }

  // ── HOÀN TẤT CHINH PHỤC PHÓ BẢN (ROOM 3 CLEARED) ──
  instance.cleared = true;
  const clearTimeSeconds = Math.max(1, Math.round((Date.now() - instance.startTime) / 1000));
  instance.clearTimeSeconds = clearTimeSeconds;

  // Tính toán phần thưởng chính thức từ server
  const rewardsByDiff: Record<string, { exp: number; gold: number; stones: number }> = {
    normal: { exp: 350, gold: 180, stones: 2 },
    hard: { exp: 1200, gold: 650, stones: 5 },
    nightmare: { exp: 4500, gold: 2400, stones: 12 },
  };

  const reward = rewardsByDiff[instance.difficulty] || rewardsByDiff.normal;

  // Cập nhật kinh nghiệm và vàng cho nhân vật
  const [character] = await db
    .select()
    .from(charactersTable)
    .where(eq(charactersTable.id, instance.characterId))
    .limit(1);

  if (character) {
    await db
      .update(charactersTable)
      .set({
        gold: character.gold + reward.gold,
        experience: character.experience + reward.exp,
      })
      .where(eq(charactersTable.id, instance.characterId));
  }

  // Cập nhật Bảng Xếp Hạng Phó Bản Nhanh Nhất
  const newEntry: DungeonLeaderboardEntry = {
    rank: 0,
    characterId: instance.characterId,
    characterName: instance.characterName,
    difficulty: instance.difficulty,
    clearTimeSeconds,
    clearedAt: new Date().toISOString(),
  };

  dungeonLeaderboard.push(newEntry);
  dungeonLeaderboard.sort((a, b) => a.clearTimeSeconds - b.clearTimeSeconds);
  dungeonLeaderboard.forEach((item, idx) => {
    item.rank = idx + 1;
  });
  if (dungeonLeaderboard.length > 20) {
    dungeonLeaderboard.length = 20;
  }

  const updatedChar = await recalculateCharacterStats(instance.characterId);

  res.status(200).json({
    success: true,
    cleared: true,
    clearTimeSeconds,
    rewards: reward,
    character: updatedChar,
    message: `🎉 CHINH PHỤC THÀNH CÔNG HANG ĐỘNG PHÓ BẢN! Thời gian: ${clearTimeSeconds} giây. Nhận +${reward.exp} EXP, +${reward.gold} Vàng, +${reward.stones} Đá Cường Hóa!`,
  });
});

// ── 3. BẢNG XẾP HẠNG THỜI GIAN VƯỢT PHÓ BẢN (DUNGEON SPEED CLEAR LEADERBOARD) ──
router.get("/dungeon/leaderboard", (_req, res): void => {
  res.status(200).json({
    success: true,
    leaderboard: dungeonLeaderboard.slice(0, 10),
  });
});

export default router;
