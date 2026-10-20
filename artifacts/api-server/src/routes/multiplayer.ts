import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

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

// Clean up stale sessions (> 12 seconds)
setInterval(() => {
  const now = Date.now();
  for (const [id, player] of activePlayers.entries()) {
    if (now - player.lastHeartbeat > 12000) {
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

// ── 1. REALTIME MULTIPLAYER SYNC ──
router.post("/multiplayer/sync", (req, res): void => {
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

  const now = Date.now();
  const existing = activePlayers.get(characterId);
  const updatedBubble = chatBubble ?? (existing?.chatBubble && now - (existing.chatTime || 0) < 6000 ? existing.chatBubble : null);

  activePlayers.set(characterId, {
    characterId,
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

  // Lấy các người chơi khác cùng serverId và cùng zoneId với Area of Interest (AOI <= 50m)
  const othersInZone: RemotePlayerState[] = [];
  const MAX_AOI_DIST_SQ = 50 * 50; // Bán kính nhìn thấy 50 units

  for (const [id, other] of activePlayers.entries()) {
    if (id !== characterId && other.serverId === serverId && other.zoneId === zoneId) {
      const dx = (other.posX || 0) - (posX || 0);
      const dz = (other.posZ || 0) - (posZ || 0);
      if (dx * dx + dz * dz <= MAX_AOI_DIST_SQ) {
        othersInZone.push(other);
      }
    }
  }

  // Thêm AI Adventurers cùng server và zone trong AOI
  for (const bot of AI_ADVENTURERS) {
    if (bot.zoneId === zoneId) {
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
    totalOnline: activePlayers.size + AI_ADVENTURERS.length,
  });
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

router.post("/party/create", requireAuth, (req, res): void => {
  const { characterId, name, classId, level, gender = "male", hp = 500, maxHp = 500 } = req.body;

  if (!characterId) {
    res.status(400).json({ error: "Thiếu characterId" });
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

router.post("/party/invite-bot", requireAuth, (req, res): void => {
  const { characterId, botType = "tank" } = req.body;
  const partyId = playerPartyMap.get(characterId);

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

router.post("/party/leave", requireAuth, (req, res): void => {
  const { characterId } = req.body;
  const partyId = playerPartyMap.get(characterId);

  if (partyId && parties.has(partyId)) {
    const party = parties.get(partyId)!;
    party.members = party.members.filter((m) => m.characterId !== characterId);
    if (party.members.length === 0 || party.leaderId === characterId) {
      // Nếu trưởng nhóm rời, giải tán đội hoặc chuyển quyền
      parties.delete(partyId);
    }
    playerPartyMap.delete(characterId);
  }

  res.status(200).json({ success: true, message: "Đã rời khỏi tổ đội." });
});

export default router;

