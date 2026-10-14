// ==============================================================================
// Studio-Grade AI Sprite Sheet Prompt Builder
// Generates character-sprite-prompts.json for Midjourney / SD / ComfyUI / Gemini
// ==============================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CharacterPromptConfig {
  classId: string;
  name: string;
  englishTitle: string;
  silhouette: string;
  colors: {
    primary: string;
    secondary: string;
    trim: string;
    energy: string;
  };
  headgear: string;
  weapon: string;
  backAttachment: string;
}

const CHARACTERS: CharacterPromptConfig[] = [
  {
    classId: "gunner",
    name: "Xạ Thủ (Tech Gunner)",
    englishTitle: "Cyberpunk Dual Pistol Tech Ranger",
    silhouette: "tactical athletic modern military silhouette with sleek aerodynamic combat suit",
    colors: {
      primary: "neon cyan #00F2FF",
      secondary: "deep navy tech composite #0369A1",
      trim: "holographic sky blue #38BDF8",
      energy: "high-voltage plasma blue #00F2FF",
    },
    headgear: "sleek glowing cyber visor targeting system",
    weapon: "dual heavy plasma revolvers with glowing cyan power cells and muzzle flash",
    backAttachment: "compact twin-exhaust micro energy jetpack emitting blue ionization trail",
  },
  {
    classId: "assassin",
    name: "Sát Thủ (Shadow Assassin)",
    englishTitle: "Crimson Night Shinobi Shadow Blade",
    silhouette: "slim agile lethal assassin silhouette with dark ninja lightweight tactical garbs",
    colors: {
      primary: "crimson blood red #F43F5E",
      secondary: "obsidian stealth black #4C0519",
      trim: "rose red edge weave #FB7185",
      energy: "ghostly crimson ectoplasm glow #E11D48",
    },
    headgear: "shadow hood cowl with glowing slit eyes and sinister jaw mask",
    weapon: "twin reverse-grip curved obsidian wakizashi daggers with bleeding red aura",
    backAttachment: "long tattered shadow ribbon scarf trailing dynamically in the wind",
  },
  {
    classId: "fighter",
    name: "Chiến Binh (Berserk Fighter)",
    englishTitle: "Dragonkin Berserker Brawler",
    silhouette: "muscular heavy broad-shouldered dragon barbarian brawler with spiked draconian armor",
    colors: {
      primary: "molten magma orange #EA580C",
      secondary: "burnt umber dragon scale #C2410C",
      trim: "solar flare amber gold #F59E0B",
      energy: "raging inferno flame #F97316",
    },
    headgear: "draconic horned battle helmet forged from ancient dragon skull",
    weapon: "massive blazing spiked dragon gauntlets wreathed in roaring fire shockwaves",
    backAttachment: "twin ceremonial war banners emblazoned with golden dragon insignias",
  },
  {
    classId: "tank",
    name: "Hộ Vệ (Holy Guardian)",
    englishTitle: "Paladin Aegis Fortress of Holy Light",
    silhouette: "colossus heavy plate armored paladin juggernaut with massive interlocking gilded plates",
    colors: {
      primary: "radiant imperial gold #EAB308",
      secondary: "bronze sanctuary steel #A16207",
      trim: "celestial ivory white #FEF08A",
      energy: "sacred divine luminescence #FFD700",
    },
    headgear: "winged paladin crown helmet with glowing visor slit and celestial plume",
    weapon: "tower fortress shield etched with holy eagle plus a massive golden judgment warhammer",
    backAttachment: "floating radiant sacred halo hovering gently behind upper armor",
  },
];

function buildStudioPrompt(char: CharacterPromptConfig) {
  const commonArtStyle =
    "2.5D video game sprite sheet, 8 columns by 5 rows of perfectly aligned animation frames, isometric three-quarter 2.5D camera perspective, clean dark fantasy neon cel-shaded pixel art aesthetic, sharp clean line art, rich contrasting highlights and deep shadows, solid flat magenta #FF00FF chroma key background for alpha cutout, zero artifacts, consistent character proportions across every frame";

  const rowLayout =
    "Row 1: 8 frames idle breathing animation; Row 2: 8 frames dynamic running sprint cycle with flowing accessories; Row 3: 8 frames combo attack swing 1 and 2 with luminous weapon trails; Row 4: 8 frames combo attack 3 finisher and ultimate skill cast with explosive particle shockwave; Row 5: 4 frames high-speed dash blur afterimage plus 4 frames damage recoil hurt reaction";

  const subjectDescription = `${char.englishTitle}, ${char.silhouette}, wearing ${char.headgear}, wielding ${char.weapon}, equipped with ${char.backAttachment}. Armor colors: ${char.colors.primary} and ${char.colors.secondary}, decorated with ${char.colors.trim}, radiating intense ${char.colors.energy}`;

  const midjourneyPrompt = `/imagine prompt: ${commonArtStyle}, ${subjectDescription}, ${rowLayout} --ar 1:1 --tile --v 6.1 --style raw --stop 100 --no blurry, realistic human photo, background scenery, gradient backdrop, watermark, text`;

  const stableDiffusion = {
    positive: `${commonArtStyle}, ${subjectDescription}, ${rowLayout}, masterpiece, best quality, ultra-detailed game asset, 8k spritesheet`,
    negative: `blurry, deformed limbs, realistic photo, modern background, gradient background, watermark, messy alignment, inconsistent scale, text, UI elements`,
  };

  const geminiImagenPrompt = `Create a professional game-ready 2.5D billboard sprite sheet for a real-time Action RPG. The sprite sheet must have exactly 8 columns and 5 rows of equal-sized animation frames on a solid uniform magenta (#FF00FF) background for chroma-keying. Character: ${char.englishTitle}. Visual anatomy: ${char.silhouette}, wearing ${char.headgear}, armed with ${char.weapon}, with ${char.backAttachment}. Color scheme: ${char.colors.primary}, ${char.colors.secondary}, with ${char.colors.energy} particle effects. Frame animations from top to bottom: Row 1 Idle (8 frames), Row 2 Run (8 frames), Row 3 Combo 1-2 (8 frames), Row 4 Finisher Cast (8 frames), Row 5 Dash/Hurt (8 frames). Cel-shaded game asset style, crisp contours.`;

  return {
    characterId: char.classId,
    name: char.name,
    gridSpec: {
      columns: 8,
      rows: 5,
      frameWidth: 128,
      frameHeight: 128,
      chromaKeyColor: "#FF00FF",
      viewPerspective: "2.5D Isometric 3/4 View",
    },
    midjourney: midjourneyPrompt,
    stableDiffusion,
    geminiImagen: geminiImagenPrompt,
  };
}

export function generateAllPrompts() {
  const prompts = CHARACTERS.map(buildStudioPrompt);
  const outDir = path.resolve(__dirname, "../../artifacts/mmorpg-game/public/assets/sprites");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outFile = path.join(outDir, "character-sprite-prompts.json");
  fs.writeFileSync(outFile, JSON.stringify(prompts, null, 2), "utf-8");
  console.log(`[AI Prompt Builder] Successfully generated: ${outFile}`);
}

generateAllPrompts();
