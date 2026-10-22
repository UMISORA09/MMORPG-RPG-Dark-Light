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
  {
    rank: 4,
    characterId: 9005,
    characterName: "SatThu_VoAnh",
    difficulty: "normal",
    clearTimeSeconds: 84,
    clearedAt: new Date(Date.now() - 3600000 * 36).toISOString(),
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

// Set explicit CORS header on dungeon router
router.use((_req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

// Helper: Monster definitions per room & difficulty
function getDungeonMonsters(room: number, difficulty: "normal" | "hard" | "nightmare") {
  if (room === 1) {
    if (difficulty === "nightmare") {
      return [
        { id: 1, name: "Hắc Long Tiền Phong", hp: 1600, maxHp: 1600, isBoss: false },
        { id: 2, name: "Kỵ Sĩ Diệt Vong", hp: 1850, maxHp: 1850, isBoss: false },
        { id: 3, name: "Hắc Ám Vu Sư", hp: 1500, maxHp: 1500, isBoss: false },
        { id: 4, name: "Thống Lĩnh Dạ Quỷ", hp: 2200, maxHp: 2200, isBoss: false },
      ];
    }
    if (difficulty === "hard") {
      return [
        { id: 1, name: "Chiến Binh Orc Cổ", hp: 750, maxHp: 750, isBoss: false },
        { id: 2, name: "Kỵ Sĩ Xương Hắc Ám", hp: 820, maxHp: 820, isBoss: false },
        { id: 3, name: "Chiến Binh Orc Cuồng Nộ", hp: 950, maxHp: 950, isBoss: false },
        { id: 4, name: "Pháp Sư Xương Triệu Hồi", hp: 780, maxHp: 780, isBoss: false },
      ];
    }
    return [
      { id: 1, name: "Yêu Tinh Đao Phủ", hp: 320, maxHp: 320, isBoss: false },
      { id: 2, name: "Slime Đỏ Biến Dị", hp: 260, maxHp: 260, isBoss: false },
      { id: 3, name: "Yêu Tinh Cung Thủ", hp: 290, maxHp: 290, isBoss: false },
      { id: 4, name: "Slime Chúa Khổng Lồ", hp: 480, maxHp: 480, isBoss: false },
    ];
  }

  if (room === 2) {
    if (difficulty === "nightmare") {
      return [
        { id: 11, name: "Kỵ Sĩ Diệt Vong Tinh Anh", hp: 3200, maxHp: 3200, isBoss: false },
        { id: 12, name: "Chiến Tướng Vong Hồn", hp: 3500, maxHp: 3500, isBoss: false },
        { id: 13, name: "Ác Ma Thâm Uyên", hp: 4200, maxHp: 4200, isBoss: false },
      ];
    }
    if (difficulty === "hard") {
      return [
        { id: 11, name: "Chiến Binh Orc Cổ Tinh Anh", hp: 1400, maxHp: 1400, isBoss: false },
        { id: 12, name: "Kỵ Sĩ Hắc Ám Tinh Anh", hp: 1650, maxHp: 1650, isBoss: false },
        { id: 13, name: "Pháp Sư Xương Hắc Ám", hp: 1300, maxHp: 1300, isBoss: false },
      ];
    }
    return [
      { id: 11, name: "Chiến Binh Orc Tinh Anh", hp: 650, maxHp: 650, isBoss: false },
      { id: 12, name: "Kỵ Sĩ Xương Tinh Anh", hp: 700, maxHp: 700, isBoss: false },
      { id: 13, name: "Thợ Săn Goblin Tinh Nhuệ", hp: 580, maxHp: 580, isBoss: false },
    ];
  }

  // Room 3 (Boss Room)
  return [
    {
      id: 99,
      name: difficulty === "nightmare" ? "Hắc Long Vương Viễn Cổ (Nightmare Boss)" : "Hắc Long Vương Viễn Cổ",
      hp: difficulty === "nightmare" ? 18000 : difficulty === "hard" ? 9500 : 4500,
      maxHp: difficulty === "nightmare" ? 18000 : difficulty === "hard" ? 9500 : 4500,
      isBoss: true,
    },
  ];
}

// ── 1. KHỞI TẠO INSTANCE PHÓ BẢN (ISOLATED DUNGEON ROOM) ──
router.post("/dungeon/enter", requireAuth, async (req, res): Promise<void> => {
  const userId = Number((req as any).authUserId || req.session?.userId);
  const { characterId, difficulty = "normal" } = req.body;

  if (!characterId) {
    res.status(400).json({ error: "Thiếu ID nhân vật" });
    return;
  }

  const parsedCharId = Number(characterId);
  if (!parsedCharId || isNaN(parsedCharId)) {
    res.status(400).json({ error: "ID nhân vật không hợp lệ" });
    return;
  }

  const [character] = await db
    .select()
    .from(charactersTable)
    .where(and(eq(charactersTable.id, parsedCharId), eq(charactersTable.userId, userId)))
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

  const instanceId = `dungeon_${parsedCharId}_${Date.now().toString(36)}`;
  const instance: DungeonInstance = {
    instanceId,
    characterId: parsedCharId,
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

  const room1Monsters = getDungeonMonsters(1, difficulty);

  res.status(200).json({
    success: true,
    message: `🏰 Đã tạo phòng phó bản cô lập cấp độ ${difficulty.toUpperCase()}!`,
    instance,
    instanceId,
    currentRoom: 1,
    totalRooms: 3,
    difficulty,
    startTime: instance.startTime,
    monsters: room1Monsters,
    monstersCount: room1Monsters.length,
    roomDetails: {
      room: 1,
      name: "Phòng 1: Tiền Đồn Quái Vật",
      description: "Tiêu diệt toàn bộ bầy Yêu Tinh & Slime để mở phong ấn cửa phòng tiếp theo.",
      monstersCount: room1Monsters.length,
    },
  });
});

// ── 2. DỌN SẠCH PHÒNG & TIẾN VÀO PHÒNG KẾ TIẾP (MULTI-ROOM PROGRESSION) ──
router.post("/dungeon/:instanceId/clear-room", requireAuth, async (req, res): Promise<void> => {
  const { instanceId } = req.params;
  const userId = Number((req as any).authUserId || req.session?.userId);

  const instance = activeDungeonInstances.get(instanceId);
  if (!instance) {
    res.status(404).json({ error: "Phó bản không tồn tại hoặc đã hết hạn" });
    return;
  }

  if (Number(instance.userId) !== userId && (req as any).authUser?.role !== "ADMIN") {
    res.status(403).json({ error: "Từ chối truy cập: Bạn không thuộc phó bản này" });
    return;
  }

  if (instance.cleared) {
    res.status(400).json({ error: "Phó bản này đã được chinh phục hoàn tất!" });
    return;
  }

  // Tiến phòng 1 -> 2 hoặc 2 -> 3
  if (instance.currentRoom < instance.totalRooms) {
    instance.currentRoom += 1;
    const isFinalRoom = instance.currentRoom === instance.totalRooms;
    const nextMonsters = getDungeonMonsters(instance.currentRoom, instance.difficulty);

    const nextRoomDetails =
      instance.currentRoom === 2
        ? {
            room: 2,
            name: "Phòng 2: Hẻm Núi Quái Tinh Anh",
            description: "Hạ gục Chiến Binh Orc & Kỵ Sĩ Hắc Ám Tinh Anh để mở cổng cấm địa.",
            monstersCount: nextMonsters.length,
          }
        : {
            room: 3,
            name: "Phòng 3: Cung Điện Hắc Long Vương (Boss Room)",
            description: "Đại chiến Boss Hắc Long Vương tối thượng!",
            monstersCount: nextMonsters.length,
          };

    res.status(200).json({
      success: true,
      currentRoom: instance.currentRoom,
      nextRoom: instance.currentRoom,
      isFinalRoom,
      cleared: false,
      monsters: nextMonsters,
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

  let updatedChar: any = null;
  if (character) {
    const newGold = Math.max(0, Number(character.gold || 0) + Number(reward.gold));
    const newExp = Math.max(0, Number(character.experience || 0) + Number(reward.exp));
    await db
      .update(charactersTable)
      .set({
        gold: newGold,
        experience: newExp,
      })
      .where(eq(charactersTable.id, instance.characterId));

    try {
      updatedChar = await recalculateCharacterStats(instance.characterId);
    } catch {
      updatedChar = { ...character, gold: newGold, experience: newExp };
    }
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
  if (dungeonLeaderboard.length > 50) {
    dungeonLeaderboard.length = 50;
  }

  res.status(200).json({
    success: true,
    cleared: true,
    currentRoom: instance.currentRoom,
    nextRoom: null,
    clearTimeSeconds,
    rewards: {
      exp: reward.exp,
      gold: reward.gold,
      stones: reward.stones,
      items: [
        {
          id: "dungeon_reward_chest",
          name:
            instance.difficulty === "nightmare"
              ? "Long Thần Kiếm (Legendary)"
              : instance.difficulty === "hard"
              ? "Hoàng Giáp Long Tộc (Epic)"
              : "Đồ Hiếm (Rare)",
          rarity:
            instance.difficulty === "nightmare"
              ? "legendary"
              : instance.difficulty === "hard"
              ? "epic"
              : "rare",
          count: 1,
        },
      ],
    },
    character: updatedChar,
    message: `🎉 CHINH PHỤC THÀNH CÔNG HANG ĐỘNG PHÓ BẢN! Thời gian: ${clearTimeSeconds} giây. Nhận +${reward.exp} EXP, +${reward.gold} Vàng, +${reward.stones} Đá Cường Hóa!`,
  });
});

// ── 3. BẢNG XẾP HẠNG THỜI GIAN VƯỢT PHÓ BẢN (DUNGEON SPEED CLEAR LEADERBOARD) ──
router.get("/dungeon/leaderboard", (req, res): void => {
  const { difficulty } = req.query;
  let list = dungeonLeaderboard;
  if (difficulty && typeof difficulty === "string" && difficulty !== "all") {
    list = list.filter((item) => item.difficulty === difficulty);
  }

  res.status(200).json({
    success: true,
    leaderboard: list.slice(0, 20),
  });
});

// ── 4. LẤY TRẠNG THÁI PHÓ BẢN ĐANG HOẠT ĐỘNG (GET ACTIVE INSTANCE) ──
router.get("/dungeon/active", requireAuth, async (req, res): Promise<void> => {
  const userId = Number((req as any).authUserId || req.session?.userId);
  const characterId = req.query.characterId ? Number(req.query.characterId) : null;

  for (const inst of activeDungeonInstances.values()) {
    if (
      Number(inst.userId) === userId &&
      (!characterId || Number(inst.characterId) === characterId) &&
      !inst.cleared
    ) {
      res.status(200).json({
        success: true,
        instance: inst,
      });
      return;
    }
  }

  res.status(200).json({
    success: true,
    instance: null,
  });
});

// ── 5. THÔNG TIN INSTANCE THEO ID (GET INSTANCE BY ID) ──
router.get("/dungeon/:instanceId", requireAuth, async (req, res): Promise<void> => {
  const { instanceId } = req.params;
  const userId = Number((req as any).authUserId || req.session?.userId);

  const instance = activeDungeonInstances.get(instanceId);
  if (!instance) {
    res.status(404).json({ error: "Phó bản không tồn tại hoặc đã hết hạn" });
    return;
  }

  if (Number(instance.userId) !== userId && (req as any).authUser?.role !== "ADMIN") {
    res.status(403).json({ error: "Từ chối truy cập: Bạn không thuộc phó bản này" });
    return;
  }

  res.status(200).json({
    success: true,
    instance,
  });
});

// ── 6. RỜI KHỎI PHÓ BẢN & DỌN DẸP INSTANCE (ABANDON DUNGEON) ──
router.post("/dungeon/:instanceId/abandon", requireAuth, async (req, res): Promise<void> => {
  const { instanceId } = req.params;
  const userId = Number((req as any).authUserId || req.session?.userId);

  const instance = activeDungeonInstances.get(instanceId);
  if (instance) {
    if (Number(instance.userId) !== userId && (req as any).authUser?.role !== "ADMIN") {
      res.status(403).json({ error: "Từ chối truy cập: Bạn không thuộc phó bản này" });
      return;
    }
    activeDungeonInstances.delete(instanceId);
  }

  res.status(200).json({
    success: true,
    message: "Đã rời khỏi phó bản và dọn dẹp tài nguyên thành công.",
  });
});

export default router;

