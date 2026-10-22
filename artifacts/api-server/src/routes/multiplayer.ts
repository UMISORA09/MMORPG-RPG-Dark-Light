import { Router } from "express";
import { requireAuth, getAuthUserId } from "../middlewares/requireAuth";
import { db, charactersTable } from "@workspace/db";
import { eq, and, gte } from "drizzle-orm";

const router = Router();

async function verifyCharacterOwnership(characterId: number, userId?: number): Promise<boolean> {
  if (!userId || !characterId) return false;
  const [char] = await db
    .select({ id: charactersTable.id })
    .from(charactersTable)
    .where(and(eq(charactersTable.id, characterId), eq(charactersTable.userId, userId)))
    .limit(1);
  return Boolean(char);
}


// ==============================================================================
// In-Memory Multiplayer State & Session Manager
// ==============================================================================
export interface RemotePlayerState {
  characterId: number;
  name: string;
  classId: string;
  level: number;
  gender: "male" | "female";
  posX: number;
  posZ: number;
  facing: number;
  facingLeft?: boolean;
  animState: string;
  enhanceLevel: number;
  hp: number;
  maxHp: number;
  chatBubble?: string | null;
  chatTime?: number;
  zoneId: string;
  serverId: string;
  lastHeartbeat: number;
  isBot?: boolean;
  hairStyle?: string;
  hairColor?: string;
  outfitId?: string;
  auraIds?: string;
  isMounted?: boolean;
  mountId?: string;
  petId?: string;
}

const activePlayers = new Map<number, RemotePlayerState>();

// Throttled DB write cache for positions across Vercel instances
const lastDbWriteTime = new Map<number, number>();
const lastDbPositions = new Map<number, { x: number; z: number; zoneId: string }>();

// Short TTL cache for online players queried from Supabase
let cachedDbPlayers: RemotePlayerState[] = [];
let lastDbQueryTime = 0;

// Simulated AI Adventurers for vibrant MMORPG world
const AI_ADVENTURERS: RemotePlayerState[] = [
  {
    characterId: 9001,
    name: "LongKiem_Vip",
    classId: "fighter",
    level: 14,
    gender: "male",
    posX: -5.0,
    posZ: -3.0,
    facing: 0,
    facingLeft: false,
    animState: "IDLE",
    enhanceLevel: 10,
    hp: 750,
    maxHp: 750,
    chatBubble: "Ai đi săn Boss Hắc Long không?",
    chatTime: Date.now(),
    zoneId: "SAFE_VILLAGE",
    serverId: "s1_long_vuong",
    lastHeartbeat: Date.now(),
    isBot: true,
  },
  {
    characterId: 9002,
    name: "BangTam_Nu",
    classId: "assassin",
    level: 12,
    gender: "female",
    posX: 12.0,
    posZ: -5.0,
    facing: 1.5,
    facingLeft: true,
    animState: "IDLE",
    enhanceLevel: 8,
    hp: 420,
    maxHp: 420,
    chatBubble: "Vừa chế tạo được Song Đao Epic nè!",
    chatTime: Date.now() - 3000,
    zoneId: "SAFE_VILLAGE",
    serverId: "s1_long_vuong",
    lastHeartbeat: Date.now(),
    isBot: true,
  },
  {
    characterId: 9003,
    name: "ThienXa_99",
    classId: "gunner",
    level: 11,
    gender: "male",
    posX: -15.0,
    posZ: -10.0,
    facing: -1.2,
    facingLeft: true,
    animState: "IDLE",
    enhanceLevel: 7,
    hp: 450,
    maxHp: 450,
    chatBubble: "Đang cày Slime làm nhiệm vụ Q2...",
    chatTime: Date.now() - 6000,
    zoneId: "WILDERNESS",
    serverId: "s1_long_vuong",
    lastHeartbeat: Date.now(),
    isBot: true,
  },
  {
    characterId: 9004,
    name: "HoVe_KimCang",
    classId: "tank",
    level: 15,
    gender: "male",
    posX: 0.0,
    posZ: -40.0,
    facing: 3.14,
    facingLeft: false,
    animState: "IDLE",
    enhanceLevel: 13,
    hp: 1200,
    maxHp: 1200,
    chatBubble: "Cần tuyển DPS cứng vào Hang Động Ác Mộng!",
    chatTime: Date.now() - 8000,
    zoneId: "BOSS_ALTAR",
    serverId: "s1_long_vuong",
    lastHeartbeat: Date.now(),
    isBot: true,
  },
];

// Clean up stale sessions (> 15 seconds)
setInterval(() => {
  const now = Date.now();
  for (const [id, player] of activePlayers.entries()) {
    if (now - player.lastHeartbeat > 15000) {
      activePlayers.delete(id);
    }
  }

  // Update AI bot wander motion
  const t = now * 0.001;
  AI_ADVENTURERS[0].posX = -5 + Math.cos(t * 0.5) * 3;
  AI_ADVENTURERS[0].posZ = -3 + Math.sin(t * 0.5) * 3;
  AI_ADVENTURERS[1].posX = 12 + Math.sin(t * 0.4) * 2;
  AI_ADVENTURERS[2].posX = -25 + Math.sin(t * 0.6) * 4;
  AI_ADVENTURERS[2].posZ = -14 + Math.cos(t * 0.6) * 3;
}, 3000);

const OPEN_WORLD_ZONES = new Set([
  "SAFE_VILLAGE",
  "WILDERNESS",
  "DEAD_MARSH",
  "BOSS_ALTAR",
  "DRAGON_VALLEY",
  "FOREST",
  "FROST_PEAK",
]);

function areInSameRealm(z1?: string, z2?: string): boolean {
  if (!z1 || !z2) return true;
  if (z1 === z2) return true;
  if (OPEN_WORLD_ZONES.has(z1) && OPEN_WORLD_ZONES.has(z2)) return true;
  return false;
}

function matchesServer(s1?: string, s2?: string): boolean {
  if (!s1 || !s2) return true;
  return s1 === s2;
}

// Helper: Query online players from Supabase with 1.5s caching
async function getOnlinePlayersFromSupabase(serverId: string, currentZoneId: string, currentCharacterId: number): Promise<RemotePlayerState[]> {
  const now = Date.now();
  if (now - lastDbQueryTime < 1500 && cachedDbPlayers.length > 0) {
    return cachedDbPlayers.filter(
      (p) => p.characterId !== currentCharacterId && matchesServer(p.serverId, serverId) && areInSameRealm(p.zoneId, currentZoneId)
    );
  }

  try {
    const activeCutoff = new Date(now - 120000); // Online in the last 120 seconds
    const rows = await db
      .select({
        id: charactersTable.id,
        name: charactersTable.name,
        classId: charactersTable.classId,
        level: charactersTable.level,
        gender: charactersTable.gender,
        posX: charactersTable.posX,
        posZ: charactersTable.posZ,
        facing: charactersTable.facing,
        hp: charactersTable.hp,
        maxHp: charactersTable.maxHp,
        zoneId: charactersTable.zoneId,
        serverId: charactersTable.serverId,
        hairStyle: charactersTable.hairStyle,
        hairColor: charactersTable.hairColor,
        outfitId: charactersTable.outfitId,
        auraIds: charactersTable.auraIds,
        isMounted: charactersTable.isMounted,
        activeMountId: charactersTable.activeMountId,
        activePetId: charactersTable.activePetId,
        lastSavedAt: charactersTable.lastSavedAt,
      })
      .from(charactersTable)
      .where(
        and(
          eq(charactersTable.serverId, serverId),
          gte(charactersTable.lastSavedAt, activeCutoff)
        )
      )
      .limit(50);

    lastDbQueryTime = now;
    cachedDbPlayers = rows.map((r: any) => ({
      characterId: r.id,
      name: r.name || "Hiệp Khách",
      classId: r.classId || "fighter",
      level: Number(r.level || 1),
      gender: (r.gender === "female" ? "female" : "male") as "male" | "female",
      posX: Number(r.posX || 0),
      posZ: Number(r.posZ || 0),
      facing: r.facing === "left" ? -Math.PI / 2 : Math.PI / 2,
      facingLeft: r.facing === "left",
      animState: "IDLE",
      enhanceLevel: 7,
      hp: Number(r.hp || 500),
      maxHp: Number(r.maxHp || 500),
      chatBubble: null,
      zoneId: r.zoneId || "SAFE_VILLAGE",
      serverId: r.serverId || "s1_long_vuong",
      lastHeartbeat: new Date(r.lastSavedAt).getTime(),
      hairStyle: r.hairStyle,
      hairColor: r.hairColor,
      outfitId: r.outfitId,
      auraIds: r.auraIds,
      isMounted: Boolean(r.isMounted),
      mountId: r.activeMountId,
      petId: r.activePetId,
      isBot: false,
    }));

    return cachedDbPlayers.filter(
      (p) => p.characterId !== currentCharacterId && matchesServer(p.serverId, serverId) && areInSameRealm(p.zoneId, currentZoneId)
    );
  } catch (err) {
    console.warn("[Multiplayer] Supabase query fallback to in-memory:", err);
    return [];
  }
}

// ── 1. REALTIME MULTIPLAYER SYNC (3 SOURCES: SUPABASE + VERCEL + CLIENT) ──
router.post("/multiplayer/sync", async (req, res): Promise<void> => {
  const {
    characterId,
    name,
    classId,
    level,
    gender = "male",
    posX = 0,
    posZ = 0,
    facing = 0,
    facingLeft = false,
    animState = "IDLE",
    enhanceLevel = 0,
    hp = 500,
    maxHp = 500,
    chatBubble = null,
    zoneId = "SAFE_VILLAGE",
    serverId = "s1_long_vuong",
    hairStyle,
    hairColor,
    outfitId,
    auraIds,
    isMounted,
    mountId,
    petId,
  } = req.body;

  if (!characterId) {
    res.status(400).json({ error: "Thiếu characterId" });
    return;
  }

  const charNumId = Number(characterId);
  const now = Date.now();
  const existing = activePlayers.get(charNumId);
  const updatedBubble = chatBubble ?? (existing?.chatBubble && now - (existing.chatTime || 0) < 6000 ? existing.chatBubble : null);

  // 1. Cập nhật In-memory player state
  activePlayers.set(charNumId, {
    characterId: charNumId,
    name,
    classId,
    level,
    gender,
    posX,
    posZ,
    facing,
    facingLeft,
    animState,
    enhanceLevel,
    hp,
    maxHp,
    chatBubble: updatedBubble,
    chatTime: chatBubble ? now : (existing?.chatTime || now),
    zoneId,
    serverId,
    lastHeartbeat: now,
    hairStyle,
    hairColor,
    outfitId,
    auraIds,
    isMounted,
    mountId,
    petId,
  });

  // 2. Throttled update to Supabase Cloud Database (Mỗi 2.5s hoặc khi di chuyển > 1.5m)
  const lastWrite = lastDbWriteTime.get(charNumId) || 0;
  const lastPos = lastDbPositions.get(charNumId);
  const distMoved = lastPos ? Math.hypot((posX || 0) - lastPos.x, (posZ || 0) - lastPos.z) : 999;
  const zoneChanged = lastPos ? lastPos.zoneId !== zoneId : true;

  if (now - lastWrite > 2500 || distMoved > 1.5 || zoneChanged) {
    lastDbWriteTime.set(charNumId, now);
    lastDbPositions.set(charNumId, { x: posX || 0, z: posZ || 0, zoneId: zoneId || "SAFE_VILLAGE" });

    // Non-blocking async update to Supabase
    (async () => {
      try {
        await db.update(charactersTable)
          .set({
            posX: Number((posX || 0).toFixed(2)),
            posZ: Number((posZ || 0).toFixed(2)),
            facing: facingLeft ? "left" : "right",
            zoneId: zoneId || "SAFE_VILLAGE",
            lastSavedAt: new Date(now),
          })
          .where(eq(charactersTable.id, charNumId));
      } catch {}
    })();
  }

  // 3. Kết hợp người chơi từ 2 nguồn: In-Memory (Vercel Lambda) + Supabase (Các Vercel Lambdas khác)
  const mergedMap = new Map<number, RemotePlayerState>();

  // A. Thêm người chơi từ Supabase
  const dbPlayers = await getOnlinePlayersFromSupabase(serverId, zoneId, charNumId);
  for (const dbPlayer of dbPlayers) {
    mergedMap.set(dbPlayer.characterId, dbPlayer);
  }

  // B. Thêm/Ghi đè bằng người chơi In-Memory (có animState, chatBubble tức thời)
  for (const [id, other] of activePlayers.entries()) {
    if (id !== charNumId && matchesServer(other.serverId, serverId) && areInSameRealm(other.zoneId, zoneId)) {
      mergedMap.set(id, other);
    }
  }

  // 4. Lọc Area of Interest (AOI <= 50m)
  const othersInZone: RemotePlayerState[] = [];
  const MAX_AOI_DIST_SQ = 50 * 50; // Bán kính nhìn thấy 50 units

  for (const other of mergedMap.values()) {
    const dx = (other.posX || 0) - (posX || 0);
    const dz = (other.posZ || 0) - (posZ || 0);
    if (dx * dx + dz * dz <= MAX_AOI_DIST_SQ) {
      othersInZone.push(other);
    }
  }

  // 5. Thêm AI Adventurers cùng server và zone trong AOI để thế giới luôn sống động
  for (const bot of AI_ADVENTURERS) {
    if (areInSameRealm(bot.zoneId, zoneId)) {
      const dx = (bot.posX || 0) - (posX || 0);
      const dz = (bot.posZ || 0) - (posZ || 0);
      if (dx * dx + dz * dz <= MAX_AOI_DIST_SQ) {
        othersInZone.push(bot);
      }
    }
  }

  res.status(200).json({
    success: true,
    players: othersInZone,
    serverTime: now,
    totalOnline: mergedMap.size + AI_ADVENTURERS.length + 1,
  });
});

router.post("/multiplayer/disconnect", async (req, res): Promise<void> => {
  const { characterId } = req.body;
  if (characterId) {
    const numId = Number(characterId);
    activePlayers.delete(numId);
    cachedDbPlayers = cachedDbPlayers.filter((p) => p.characterId !== numId);
    try {
      await db
        .update(charactersTable)
        .set({ lastSavedAt: new Date(Date.now() - 120000) })
        .where(eq(charactersTable.id, numId));
    } catch {}
  }
  res.status(200).json({ success: true, message: "Đã ngắt kết nối session realtime thành công." });
});

// ==============================================================================
// Party System (Tổ Đội 4 Người)
// ==============================================================================
export interface PartyMember {
  characterId: number;
  name: string;
  classId: string;
  level: number;
  gender: "male" | "female";
  hp: number;
  maxHp: number;
  isLeader: boolean;
  isBot?: boolean;
}

export interface PartyGroup {
  id: string;
  leaderId: number;
  leaderName: string;
  members: PartyMember[];
  dungeonDifficulty?: "normal" | "hard" | "nightmare";
}

export const parties = new Map<string, PartyGroup>();
export const playerPartyMap = new Map<number, string>();

router.get("/party/:characterId", (req, res): void => {
  const characterId = Number(req.params.characterId);
  const partyId = playerPartyMap.get(characterId);

  if (!partyId || !parties.has(partyId)) {
    res.status(200).json({ hasParty: false, party: null });
    return;
  }

  res.status(200).json({
    hasParty: true,
    party: parties.get(partyId),
  });
});

router.post("/party/create", requireAuth, async (req, res): Promise<void> => {
  const { characterId, name, classId, level, gender = "male", hp = 500, maxHp = 500 } = req.body;

  if (!characterId) {
    res.status(400).json({ error: "Thiếu characterId" });
    return;
  }

  if (!(await verifyCharacterOwnership(Number(characterId), getAuthUserId(req)))) {
    res.status(403).json({ error: "Không có quyền thao tác trên nhân vật này" });
    return;
  }

  // Rời tổ đội cũ nếu có
  const oldPartyId = playerPartyMap.get(characterId);
  if (oldPartyId && parties.has(oldPartyId)) {
    const oldParty = parties.get(oldPartyId)!;
    oldParty.members = oldParty.members.filter((m) => m.characterId !== characterId);
    if (oldParty.members.length === 0) parties.delete(oldPartyId);
  }

  const partyId = `party_${characterId}_${Date.now().toString(36)}`;
  const leaderMember: PartyMember = {
    characterId,
    name,
    classId,
    level,
    gender,
    hp,
    maxHp,
    isLeader: true,
  };

  const newParty: PartyGroup = {
    id: partyId,
    leaderId: characterId,
    leaderName: name,
    members: [leaderMember],
  };

  parties.set(partyId, newParty);
  playerPartyMap.set(characterId, partyId);

  res.status(200).json({
    success: true,
    message: "Tạo tổ đội thành công! Toàn đội nhận Buff: +15% EXP & +10% Lực Chiến.",
    party: newParty,
  });
});

router.post("/party/invite-bot", requireAuth, async (req, res): Promise<void> => {
  const { characterId, botType = "tank" } = req.body;

  if (!(await verifyCharacterOwnership(Number(characterId), getAuthUserId(req)))) {
    res.status(403).json({ error: "Không có quyền thao tác trên nhân vật này" });
    return;
  }

  const partyId = playerPartyMap.get(Number(characterId));

  if (!partyId || !parties.has(partyId)) {
    res.status(400).json({ error: "Bạn chưa có tổ đội để mời đồng hành!" });
    return;
  }

  const party = parties.get(partyId)!;
  if (party.members.length >= 4) {
    res.status(400).json({ error: "Tổ đội đã đầy (tối đa 4 thành viên)!" });
    return;
  }

  const botId = 8000 + party.members.length;
  const botName = botType === "tank" ? "Hộ Vệ Thanh Long" : "Thánh Nữ Trị Liệu";
  const botClass = botType === "tank" ? "tank" : "gunner";

  const companion: PartyMember = {
    characterId: botId,
    name: botName,
    classId: botClass,
    level: 12,
    gender: "female",
    hp: 850,
    maxHp: 850,
    isLeader: false,
    isBot: true,
  };

  party.members.push(companion);

  res.status(200).json({
    success: true,
    message: `Đã chiêu mộ Hộ Vệ đồng hành ${botName} vào tổ đội!`,
    party,
  });
});

router.post("/party/invite-player", requireAuth, async (req, res): Promise<void> => {
  try {
    const characterId = Number(req.body.characterId);
    const targetCharacterId = Number(req.body.targetCharacterId);

    if (!characterId || !targetCharacterId) {
      res.status(400).json({ error: "Thiếu characterId hoặc targetCharacterId hợp lệ" });
      return;
    }

    if (!(await verifyCharacterOwnership(characterId, getAuthUserId(req)))) {
      res.status(403).json({ error: "Không có quyền thao tác trên nhân vật này" });
      return;
    }

    const partyId = playerPartyMap.get(characterId);
    if (!partyId || !parties.has(partyId)) {
      res.status(400).json({ error: "Bạn chưa có tổ đội!" });
      return;
    }

    const party = parties.get(partyId)!;
    if (party.leaderId !== characterId) {
      res.status(403).json({ error: "Chỉ trưởng nhóm mới có quyền mời thành viên" });
      return;
    }

    if (party.members.length >= 4) {
      res.status(400).json({ error: "Tổ đội đã đầy (tối đa 4 thành viên)!" });
      return;
    }

    const [targetChar] = await db
      .select()
      .from(charactersTable)
      .where(eq(charactersTable.id, targetCharacterId))
      .limit(1);

    if (!targetChar) {
      res.status(404).json({ error: "Không tìm thấy người chơi cần mời" });
      return;
    }

    const targetOldParty = playerPartyMap.get(targetCharacterId);
    if (targetOldParty && parties.has(targetOldParty)) {
      const oldP = parties.get(targetOldParty)!;
      oldP.members = oldP.members.filter((m) => m.characterId !== targetCharacterId);
      if (oldP.members.length === 0) parties.delete(targetOldParty);
    }

    party.members.push({
      characterId: targetChar.id,
      name: targetChar.name,
      classId: targetChar.classId,
      level: targetChar.level,
      gender: (targetChar.gender as any) || "male",
      hp: targetChar.hp,
      maxHp: targetChar.maxHp,
      isLeader: false,
      isBot: false,
    });
    playerPartyMap.set(targetCharacterId, partyId);

    res.status(200).json({
      success: true,
      message: `Đã mời thành viên ${targetChar.name} vào tổ đội thành công!`,
      party,
    });
  } catch (err: any) {
    console.error("[Party Invite Player Error]:", err);
    res.status(500).json({ error: "Lỗi nội bộ khi mời người chơi", details: err?.message });
  }
});

router.post("/party/leave", requireAuth, async (req, res): Promise<void> => {
  try {
    const characterId = Number(req.body.characterId);
    if (!characterId) {
      res.status(400).json({ error: "Thiếu characterId" });
      return;
    }

    if (!(await verifyCharacterOwnership(characterId, getAuthUserId(req)))) {
      res.status(403).json({ error: "Không có quyền thao tác trên nhân vật này" });
      return;
    }

    const partyId = playerPartyMap.get(characterId);

    if (partyId && parties.has(partyId)) {
      const party = parties.get(partyId)!;
      party.members = party.members.filter((m) => m.characterId !== characterId);
      if (party.members.length === 0 || party.leaderId === characterId) {
        parties.delete(partyId);
      }
      playerPartyMap.delete(characterId);
    }

    res.status(200).json({ success: true, message: "Đã rời khỏi tổ đội." });
  } catch (err: any) {
    console.error("[Party Leave Error]:", err);
    res.status(500).json({ error: "Lỗi nội bộ khi rời tổ đội", details: err?.message });
  }
});

export default router;
