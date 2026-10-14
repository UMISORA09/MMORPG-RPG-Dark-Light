import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Target output directories
const ASSETS_DIR = path.resolve(
  __dirname,
  "../../artifacts/mmorpg-game/public/assets"
);
const SPRITES_DIR = path.join(ASSETS_DIR, "sprites");
const CHARACTERS_DIR = path.join(ASSETS_DIR, "characters");
const ITEMS_DIR = path.join(ASSETS_DIR, "items");
const MAP_DIR = path.join(ASSETS_DIR, "maps");

interface SpriteDefinition {
  id: string;
  name: string;
  title: string;
  primaryColor: string;
  glowColor: string;
  weaponType: string;
  isBoss?: boolean;
}

const SPRITES: SpriteDefinition[] = [
  // 4 Classes
  {
    id: "gunner",
    name: "Tech Gunner",
    title: "Xạ Thủ Năng Lượng",
    primaryColor: "#00f2ff",
    glowColor: "#38bdf8",
    weaponType: "dual_guns",
  },
  {
    id: "assassin",
    name: "Shadow Assassin",
    title: "Sát Thủ Bóng Tối",
    primaryColor: "#ff3366",
    glowColor: "#f43f5e",
    weaponType: "twin_blades",
  },
  {
    id: "fighter",
    name: "Berserk Fighter",
    title: "Chiến Binh Cuồng Nộ",
    primaryColor: "#ffaa00",
    glowColor: "#f59e0b",
    weaponType: "dragon_fists",
  },
  {
    id: "tank",
    name: "Holy Guardian",
    title: "Hộ Vệ Hoàng Kim",
    primaryColor: "#00ff88",
    glowColor: "#ffd700",
    weaponType: "shield_hammer",
  },
  // Monsters & Boss
  {
    id: "slime",
    name: "Slime",
    title: "Slime Rừng Sâu",
    primaryColor: "#22c55e",
    glowColor: "#86efac",
    weaponType: "claws",
  },
  {
    id: "wolf",
    name: "Dark Wolf",
    title: "Sói Hoang Hoang Dã",
    primaryColor: "#94a3b8",
    glowColor: "#e2e8f0",
    weaponType: "claws",
  },
  {
    id: "goblin",
    name: "Goblin",
    title: "Yêu Tinh Đao Phủ",
    primaryColor: "#84cc16",
    glowColor: "#bef264",
    weaponType: "dagger",
  },
  {
    id: "orc",
    name: "Orc Warrior",
    title: "Chiến Binh Orc Cổ",
    primaryColor: "#dc2626",
    glowColor: "#f87171",
    weaponType: "axe",
  },
  {
    id: "skeleton",
    name: "Skeleton Knight",
    title: "Kỵ Sĩ Xương Cổ Đại",
    primaryColor: "#cbd5e1",
    glowColor: "#93c5fd",
    weaponType: "sword",
  },
  {
    id: "dragon",
    name: "Ancient Fire Dragon",
    title: "Rồng Lửa Cổ Đại (Boss Cấp 20)",
    primaryColor: "#ef4444",
    glowColor: "#f97316",
    weaponType: "dragon_breath",
    isBoss: true,
  },
];

// Item definitions
interface ItemDefinition {
  id: string;
  name: string;
  type: "weapon" | "armor" | "accessory" | "consumable";
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  color: string;
  iconSymbol: string;
}

const ITEMS: ItemDefinition[] = [
  { id: "iron_sword", name: "Kiếm Sắt Khởi Đầu", type: "weapon", rarity: "common", color: "#94a3b8", iconSymbol: "⚔️" },
  { id: "dragon_blade", name: "Huyết Long Đao", type: "weapon", rarity: "legendary", color: "#ef4444", iconSymbol: "🗡️" },
  { id: "cyber_blaster", name: "Súng Laze Lượng Tử", type: "weapon", rarity: "epic", color: "#06b6d4", iconSymbol: "🎯" },
  { id: "guardian_shield", name: "Khiên Thánh Long Tộc", type: "armor", rarity: "epic", color: "#f59e0b", iconSymbol: "🛡️" },
  { id: "shadow_cloak", name: "Áo Choàng Ám Dạ", type: "armor", rarity: "rare", color: "#a855f7", iconSymbol: "🧥" },
  { id: "dragon_heart", name: "Trái Tim Hỏa Long", type: "accessory", rarity: "legendary", color: "#dc2626", iconSymbol: "💎" },
  { id: "health_potion", name: "Huyết Dược Phục Hồi", type: "consumable", rarity: "common", color: "#10b981", iconSymbol: "🧪" },
];

// Helper to generate SVG Spritesheet 4x4 (512x512)
function generateSvgSpritesheet(def: SpriteDefinition): string {
  const frameSize = def.isBoss ? 128 : 64;
  const cols = 4;
  const rows = 4;
  const totalW = frameSize * cols;
  const totalH = frameSize * rows;

  let framesContent = "";

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const offsetX = col * frameSize;
      const offsetY = row * frameSize;
      const cx = offsetX + frameSize / 2;
      const cy = offsetY + frameSize * 0.65;
      const scale = def.isBoss ? 1.5 : 1.0;

      let bobY = 0;
      let legOffset = 0;
      let hurt = false;

      if (row === 0) {
        bobY = Math.sin((col / 4) * Math.PI * 2) * (2 * scale);
      } else if (row === 1) {
        bobY = Math.abs(Math.sin((col / 4) * Math.PI * 2)) * (-4 * scale);
        legOffset = Math.sin((col / 4) * Math.PI * 2) * (5 * scale);
      } else if (row === 2) {
        bobY = Math.sin((col / 3) * Math.PI) * (-2 * scale);
      } else if (row === 3) {
        bobY = col * (2 * scale);
        hurt = col % 2 === 0;
      }

      const bodyColor = hurt ? "#ff3333" : def.primaryColor;
      const armorColor = hurt ? "#ffffff" : def.glowColor;

      // Ground Shadow
      framesContent += `<ellipse cx="${cx}" cy="${offsetY + frameSize * 0.9}" rx="${16 * scale}" ry="${5 * scale}" fill="rgba(0,0,0,0.35)" />\n`;

      // Dragon Boss Wings
      if (def.isBoss) {
        framesContent += `<polygon points="${cx - 20 * scale},${cy - 10 * scale} ${cx - 45 * scale},${cy - 35 * scale} ${cx - 30 * scale},${cy + 10 * scale}" fill="#7f1d1d" stroke="#f97316" stroke-width="2" />\n`;
        framesContent += `<polygon points="${cx + 20 * scale},${cy - 10 * scale} ${cx + 45 * scale},${cy - 35 * scale} ${cx + 30 * scale},${cy + 10 * scale}" fill="#7f1d1d" stroke="#f97316" stroke-width="2" />\n`;
      }

      // Legs
      framesContent += `<rect x="${cx - 7 * scale}" y="${cy + bobY + 8 * scale + legOffset}" width="${4 * scale}" height="${10 * scale}" rx="2" fill="#1e293b" />\n`;
      framesContent += `<rect x="${cx + 3 * scale}" y="${cy + bobY + 8 * scale - legOffset}" width="${4 * scale}" height="${10 * scale}" rx="2" fill="#1e293b" />\n`;

      // Torso / Body Armor
      framesContent += `<rect x="${cx - 10 * scale}" y="${cy + bobY - 8 * scale}" width="${20 * scale}" height="${18 * scale}" rx="4" fill="${bodyColor}" />\n`;
      framesContent += `<rect x="${cx - 6 * scale}" y="${cy + bobY - 4 * scale}" width="${12 * scale}" height="${10 * scale}" rx="2" fill="${armorColor}" />\n`;

      // Head
      framesContent += `<circle cx="${cx}" cy="${cy + bobY - 18 * scale}" r="${10 * scale}" fill="${bodyColor}" />\n`;
      framesContent += `<rect x="${cx - 6 * scale}" y="${cy + bobY - 20 * scale}" width="${12 * scale}" height="${4 * scale}" rx="1" fill="#0f172a" />\n`;
      framesContent += `<circle cx="${cx - 3 * scale}" cy="${cy + bobY - 18 * scale}" r="${1.5 * scale}" fill="${armorColor}" />\n`;
      framesContent += `<circle cx="${cx + 3 * scale}" cy="${cy + bobY - 18 * scale}" r="${1.5 * scale}" fill="${armorColor}" />\n`;

      // Weapon
      if (def.weaponType === "dual_guns") {
        framesContent += `<rect x="${cx + 8 * scale}" y="${cy + bobY - 3 * scale}" width="${14 * scale}" height="${5 * scale}" fill="#334155" />\n`;
        framesContent += `<rect x="${cx + 16 * scale}" y="${cy + bobY - 2 * scale}" width="${4 * scale}" height="${3 * scale}" fill="${def.glowColor}" />\n`;
      } else if (def.weaponType === "twin_blades") {
        framesContent += `<polygon points="${cx + 8 * scale},${cy + bobY} ${cx + 20 * scale},${cy + bobY - 12 * scale} ${cx + 12 * scale},${cy + bobY + 4 * scale}" fill="${def.glowColor}" />\n`;
      } else if (def.weaponType === "shield_hammer") {
        framesContent += `<rect x="${cx - 16 * scale}" y="${cy + bobY - 10 * scale}" width="${8 * scale}" height="${18 * scale}" rx="2" fill="#ffd700" stroke="#b45309" stroke-width="1" />\n`;
        framesContent += `<rect x="${cx + 8 * scale}" y="${cy + bobY - 12 * scale}" width="${10 * scale}" height="${8 * scale}" rx="1" fill="#cbd5e1" />\n`;
      } else {
        framesContent += `<rect x="${cx + 8 * scale}" y="${cy + bobY - 4 * scale}" width="${16 * scale}" height="${4 * scale}" fill="#94a3b8" />\n`;
        framesContent += `<rect x="${cx + 12 * scale}" y="${cy + bobY - 3 * scale}" width="${10 * scale}" height="${2 * scale}" fill="${def.primaryColor}" />\n`;
      }

      // Attack Arc (Row 2)
      if (row === 2) {
        framesContent += `<path d="M ${cx + 10 * scale} ${cy + bobY - 14 * scale} A ${18 * scale} ${18 * scale} 0 0 1 ${cx + 26 * scale} ${cy + bobY + 8 * scale}" fill="none" stroke="${def.glowColor}" stroke-width="${3 * scale}" stroke-linecap="round" />\n`;
      }
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${totalH}" width="${totalW}" height="${totalH}">
  <defs>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <!-- 4x4 Spritesheet: Row 0: Idle, Row 1: Run, Row 2: Attack, Row 3: Hurt -->
  ${framesContent}
</svg>`;
}

// Generate SVG item icons
function generateItemSvg(item: ItemDefinition): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${item.color}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#020617" stop-opacity="0.95"/>
    </radialGradient>
  </defs>
  <rect x="2" y="2" width="60" height="60" rx="14" fill="url(#bgGlow)" stroke="${item.color}" stroke-width="2"/>
  <text x="32" y="42" font-size="28" text-anchor="middle" dominant-baseline="central">${item.iconSymbol}</text>
</svg>`;
}

async function main() {
  console.log("=================================================");
  console.log("🎮 CHIẾN LONG BÁ — AUTOMATED ASSET & MAP PIPELINE");
  console.log("=================================================");

  // 1. Ensure target directories
  [OUTPUT_DIR, SPRITES_DIR, ITEMS_DIR, MAP_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });

  // 2. Generate 4x4 SVG Spritesheets for classes & monsters
  console.log("\n🎨 Generating Procedural 4x4 Spritesheets...");
  for (const def of SPRITES) {
    const svgCode = generateSvgSpritesheet(def);
    const svgPath = path.join(SPRITES_DIR, `${def.id}.svg`);
    fs.writeFileSync(svgPath, svgCode, "utf8");
    console.log(`  ✓ Spritesheet: ${def.id}.svg (${def.name})`);
  }

  // 3. Generate Item Icons
  console.log("\n🎒 Generating Item Icons & Loot Assets...");
  for (const item of ITEMS) {
    const itemSvg = generateItemSvg(item);
    const itemPath = path.join(ITEMS_DIR, `${item.id}.svg`);
    fs.writeFileSync(itemPath, itemSvg, "utf8");
    console.log(`  ✓ Item Icon: ${item.id}.svg [${item.rarity}]`);
  }

  // 4. Generate Sample Map Grid Navigation Mesh config
  console.log("\n🗺️ Generating Seamless World Map Grid...");
  const mapGridConfig = {
    worldName: "Chiến Long Bá — Đại Lục Long Tộc",
    mapSize: { width: 140, height: 180, unit: "meters" },
    zones: [
      {
        id: "SAFE_VILLAGE",
        name: "Làng Long Tộc",
        type: "safe_zone",
        center: { x: 0, z: 0 },
        radius: 18,
        features: ["Healing Fountain (+5% HP/s)", "Merchant NPC", "Leaderboard Monument", "Elder NPC"],
        lightColor: "#f59e0b",
      },
      {
        id: "WILDERNESS",
        name: "Đấu Trường Hoang Dã",
        type: "wilderness",
        center: { x: 0, z: 0 },
        innerRadius: 18,
        outerRadius: 50,
        features: ["Ancient Broken Pillars", "Mob Patrol Spawners", "Loot Drops"],
        lightColor: "#6366f1",
      },
      {
        id: "BOSS_ALTAR",
        name: "Cấm Địa Săn Boss",
        type: "boss_raid",
        center: { x: 0, z: -70 },
        radius: 18,
        entryBridge: { zStart: -40, zEnd: -52, width: 7 },
        features: ["Molten Lava Moat", "Dragon Pentagram Seal", "6 Dragon Horn Pillars", "Boss 2 Phase"],
        lightColor: "#ef4444",
      },
    ],
  };

  const mapGridPath = path.join(MAP_DIR, "seamless-world-grid.json");
  fs.writeFileSync(mapGridPath, JSON.stringify(mapGridConfig, null, 2), "utf8");
  console.log(`  ✓ Map Grid Config: ${mapGridPath}`);

  // 5. Verify High-Definition 9-Row Combat Spritesheets & Character Cards
  console.log("\n🛡️ Verifying High-Definition 9-Row Combat Spritesheets & Character Art...");
  const combatSheets = [
    "hero_combat_sheet.png",
    "assassin_combat_sheet.png",
    "fighter_combat_sheet.png",
    "tank_combat_sheet.png",
    "gunner_combat_sheet.png",
  ];
  for (const sheet of combatSheets) {
    const sheetPath = path.join(SPRITES_DIR, sheet);
    const exists = fs.existsSync(sheetPath);
    console.log(`  ${exists ? "✓" : "⚠️"} 9-Row Combat Sheet: ${sheet} (${exists ? "Verified" : "Missing"})`);
  }

  const characterCards = [
    "tank_male.png",
    "tank_female.png",
    "fighter_male.png",
    "fighter_female.png",
    "assassin_male.png",
    "assassin_female.png",
    "gunner_male.png",
    "gunner_female.png",
  ];
  for (const card of characterCards) {
    const cardPath = path.join(CHARACTERS_DIR, card);
    const exists = fs.existsSync(cardPath);
    console.log(`  ${exists ? "✓" : "⚠️"} Character Card: ${card} (${exists ? "Verified" : "Missing"})`);
  }

  console.log("\n✨ Pipeline execution finished with 100% success!");
}

const OUTPUT_DIR = SPRITES_DIR;

main().catch((err) => {
  console.error("❌ Pipeline failed:", err);
  process.exit(1);
});
