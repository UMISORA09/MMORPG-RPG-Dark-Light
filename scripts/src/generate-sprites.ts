import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Target output directory
const OUTPUT_DIR = path.resolve(
  __dirname,
  "../../artifacts/mmorpg-game/public/assets/sprites"
);

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

      // Row states: 0 = Idle, 1 = Run, 2 = Attack, 3 = Hurt
      let bobY = 0;
      let legOffset = 0;
      let armAngle = 0;
      let hurt = false;

      if (row === 0) {
        bobY = Math.sin((col / 4) * Math.PI * 2) * (2 * scale);
      } else if (row === 1) {
        bobY = Math.abs(Math.sin((col / 4) * Math.PI * 2)) * (-4 * scale);
        legOffset = Math.sin((col / 4) * Math.PI * 2) * (5 * scale);
      } else if (row === 2) {
        armAngle = (col / 3) * 45;
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
      // Eyes / Visor
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
        // Sword / Fist
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

async function main() {
  console.log("=================================================");
  console.log("🎮 CHIẾN LONG BÁ — SPRITE GENERATOR PIPELINE");
  console.log("=================================================");

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`📁 Created directory: ${OUTPUT_DIR}`);
  }

  // 1. Generate Procedural 4x4 SVG Spritesheets
  console.log("\n🎨 Generating Procedural 4x4 Spritesheets...");
  for (const def of SPRITES) {
    const svgCode = generateSvgSpritesheet(def);
    const svgFilePath = path.join(OUTPUT_DIR, `${def.id}.svg`);
    fs.writeFileSync(svgFilePath, svgCode, "utf8");
    console.log(`  ✓ Generated Spritesheet: ${def.id}.svg (${def.name})`);
  }

  // 2. Generate AI Image Prompts (Midjourney / SDXL / Gemini Imagen)
  console.log("\n🤖 Generating AI Generation Prompts...");
  const aiPrompts: Record<string, any> = {};

  for (const def of SPRITES) {
    const isHero = ["gunner", "assassin", "fighter", "tank"].includes(def.id);
    const baseStyle =
      "HD-2D 16-bit Octopath Traveler style, dark fantasy MMORPG, pixel art warrior sprite sheet, 4x4 animation grid, row 0 idle, row 1 running, row 2 attacking, row 3 damaged, game asset, pure transparent background, sharp pixels, volumetric dramatic lighting";

    aiPrompts[def.id] = {
      name: def.name,
      title: def.title,
      type: isHero ? "Hero Class" : "Monster/Boss",
      primaryColor: def.primaryColor,
      glowColor: def.glowColor,
      weapon: def.weaponType,
      prompt: `${def.name}, ${def.title}, wielding ${def.weaponType}, glowing ${def.primaryColor} neon aura, ${baseStyle} --ar 1:1 --v 6.0`,
      negativePrompt:
        "blurry, 3d realistic render, photorealistic, deformed limbs, messy background, extra rows, text, watermark, bad anatomy",
      gridFormat: {
        cols: 4,
        rows: 4,
        rowMapping: {
          0: "Idle animation (4 frames breathing loop)",
          1: "Run cycle (4 frames walking stride)",
          2: "Attack windup and strike (4 frames slashing/shooting)",
          3: "Hurt and defeat reaction (4 frames flashing red)",
        },
      },
    };
  }

  const promptsPath = path.join(OUTPUT_DIR, "ai-sprite-prompts.json");
  fs.writeFileSync(promptsPath, JSON.stringify(aiPrompts, null, 2), "utf8");
  console.log(`  ✓ Generated AI Prompts: ${promptsPath}`);

  console.log("\n✨ Pipeline completed successfully!");
}

main().catch((err) => {
  console.error("❌ Pipeline failed:", err);
  process.exit(1);
});
