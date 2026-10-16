// ==============================================================================
// 3D Loot Drops Types & Rarity Definitions
// Parabolic Physics, Proximity Magnet, Rarity Beams & Database Sync
// ==============================================================================

export type LootRarity = "common" | "rare" | "epic" | "legendary";

export type LootType = "weapon" | "armor" | "accessory" | "gold" | "potion";

export interface DroppedItem {
  id: string; // Unique drop instance ID
  itemId: string; // DB template item_id
  name: string;
  type: LootType;
  rarity: LootRarity;
  position: [number, number, number];
  velocity: [number, number, number];
  value: number; // Gold amount or stat boost
  quantity?: number;
  icon: string;
  color: string;
  statText?: string; // e.g. "ATK +45" or "HP +120"
  bounceCount: number;
  isGrounded: boolean;
  lifetime: number;
}

export const RARITY_COLORS: Record<LootRarity, { beam: string; glow: string; text: string }> = {
  common: {
    beam: "#ffffff",
    glow: "#94a3b8",
    text: "Phổ Thông",
  },
  rare: {
    beam: "#00f2ff",
    glow: "#0284c7",
    text: "Hiếm",
  },
  epic: {
    beam: "#c084fc",
    glow: "#9333ea",
    text: "Sử Thi",
  },
  legendary: {
    beam: "#fbbf24",
    glow: "#ea580c",
    text: "Huyền Thoại",
  },
};
