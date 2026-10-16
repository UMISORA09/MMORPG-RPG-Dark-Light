// ==============================================================================
// PixelAvatarPortrait.tsx
// Pixel-Clean Heroic Chibi Avatar Portrait (Top-Left HUD Frame)
// Crisp anime eyes, spiky hero hair, sharp white-gold border frame
// ==============================================================================

import { memo, useMemo } from "react";

interface PixelAvatarPortraitProps {
  classId: string;
  classNameTitle: string;
  colorHex: string;
  size?: number;
}

export const PixelAvatarPortrait = memo(function PixelAvatarPortrait({
  classId,
  classNameTitle: _classNameTitle,
  colorHex: _colorHex,
  size = 54,
}: PixelAvatarPortraitProps) {
  // Generate a clean 64x64 pixel art face portrait
  const portraitDataUrl = useMemo(() => {
    if (typeof document === "undefined") return "";

    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    ctx.imageSmoothingEnabled = false;

    // Background gradient for portrait box
    const grad = ctx.createLinearGradient(0, 0, 0, 64);
    grad.addColorStop(0, "#2a1f3d");
    grad.addColorStop(1, "#150d24");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    // Resolve hair & armor palette
    let hairMain = "#fcd34d";
    let hairLight = "#fef08a";
    let armorMain = "#3b78a8";
    if (classId === "gunner") {
      hairMain = "#38bdf8";
      hairLight = "#bae6fd";
      armorMain = "#3da854";
    } else if (classId === "shield") {
      hairMain = "#f59e0b";
      hairLight = "#fde68a";
      armorMain = "#d9623b";
    } else if (classId === "assassin") {
      hairMain = "#c084fc";
      hairLight = "#f3e8ff";
      armorMain = "#8c489f";
    }

    const outline = "#1a1026";

    // 1. Armor Collar / Shoulders at bottom
    ctx.fillStyle = outline;
    ctx.fillRect(10, 48, 44, 16);
    ctx.fillStyle = armorMain;
    ctx.fillRect(12, 50, 40, 14);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(16, 52, 6, 4);

    // 2. Neck
    ctx.fillStyle = "#e0ac7e";
    ctx.fillRect(26, 44, 12, 8);

    // 3. Face / Head
    ctx.fillStyle = outline;
    ctx.fillRect(16, 16, 32, 30);
    ctx.fillStyle = "#fcd3a1"; // Skin
    ctx.fillRect(18, 18, 28, 26);

    // Soft blush on cheeks
    ctx.fillStyle = "#ffb3ba";
    ctx.fillRect(19, 34, 4, 3);
    ctx.fillRect(41, 34, 4, 3);

    // 4. Large Expressive Anime Eyes
    // Sclera (White)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(22, 26, 6, 8);
    ctx.fillRect(36, 26, 6, 8);

    // Dark Iris & Pupil
    ctx.fillStyle = "#1e1b2e";
    ctx.fillRect(23, 27, 4, 7);
    ctx.fillRect(37, 27, 4, 7);

    // Cyan/Blue Iris base
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(23, 31, 4, 3);
    ctx.fillRect(37, 31, 4, 3);

    // Specular Glint (Twinkle in the eyes)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(24, 28, 2, 2);
    ctx.fillRect(38, 28, 2, 2);

    // 5. Spiky Hero Hair (Large sweeps with outline)
    ctx.fillStyle = outline;
    // Top spikes
    ctx.fillRect(10, 4, 44, 16);
    ctx.fillRect(22, 0, 20, 6);
    // Side tufts
    ctx.fillRect(8, 14, 8, 18);
    ctx.fillRect(48, 14, 8, 18);

    // Hair Base Color
    ctx.fillStyle = hairMain;
    ctx.fillRect(12, 6, 40, 14);
    ctx.fillRect(24, 2, 16, 6);
    ctx.fillRect(10, 16, 6, 14);
    ctx.fillRect(48, 16, 6, 14);

    // Front bangs dipping over forehead
    ctx.fillRect(20, 18, 6, 8);
    ctx.fillRect(32, 18, 5, 6);
    ctx.fillRect(38, 18, 4, 8);

    // Hair Light Highlights
    ctx.fillStyle = hairLight;
    ctx.fillRect(16, 8, 10, 4);
    ctx.fillRect(26, 4, 8, 3);
    ctx.fillRect(38, 8, 8, 4);

    return canvas.toDataURL();
  }, [classId]);

  return (
    <div
      className="relative shrink-0 rounded-xl overflow-hidden border-2 border-white/90 shadow-[0_0_12px_rgba(255,255,255,0.35)] bg-[#0d071a]"
      style={{
        width: size,
        height: size,
        imageRendering: "pixelated",
      }}
    >
      {portraitDataUrl && (
        <img
          src={portraitDataUrl}
          alt="Hero Portrait"
          className="w-full h-full object-cover"
          style={{ imageRendering: "pixelated" }}
        />
      )}
      {/* Crisp Inner Gold Border */}
      <div className="absolute inset-0 border border-amber-400/60 pointer-events-none rounded-lg" />
    </div>
  );
});
