// ==============================================================================
// ConflictFreeKeybindManager.ts — Chuẩn Hóa Hệ Thống Phím Tắt & Tổ Hợp 2 Phím
// Tuyệt đối không xung đột với WASD di chuyển và các phím kỹ năng/giao diện
// ==============================================================================

import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { useGameStore } from "@/stores";

export interface KeybindDef {
  key: string;
  modifiers?: { alt?: boolean; shift?: boolean; ctrl?: boolean };
  label: string;
  category: "MOVEMENT" | "COMBAT" | "CONSUMABLE" | "CHORDED_SYSTEM" | "INTERFACE";
  description: string;
}

export const GAME_KEYBINDS: Record<string, KeybindDef> = {
  // ── Di chuyển thuần khiết (Bảo vệ tuyệt đối, cấm đè menu/kỹ năng) ──
  MOVE_FORWARD: { key: "KeyW", label: "W / ↑", category: "MOVEMENT", description: "Tiến về phía trước" },
  MOVE_BACK: { key: "KeyS", label: "S / ↓", category: "MOVEMENT", description: "Lùi lại phía sau" },
  MOVE_LEFT: { key: "KeyA", label: "A / ←", category: "MOVEMENT", description: "Di chuyển sang trái" },
  MOVE_RIGHT: { key: "KeyD", label: "D / →", category: "MOVEMENT", description: "Di chuyển sang phải" },
  DASH_JUMP: { key: "Space", label: "Space", category: "MOVEMENT", description: "Nhảy vọt / Lướt né chiêu (Dash)" },

  // ── Chiến đấu ──
  ATTACK_NORMAL: { key: "KeyJ", label: "J / Chuột Trái", category: "COMBAT", description: "Đánh thường / Kích hoạt chuỗi Combo 1-2-3" },
  SKILL_1: { key: "KeyQ", label: "Q", category: "COMBAT", description: "Kỹ năng 1" },
  SKILL_2: { key: "KeyE", label: "E", category: "COMBAT", description: "Kỹ năng 2" },
  SKILL_3: { key: "KeyR", label: "R", category: "COMBAT", description: "Kỹ năng 3" },
  SKILL_ULT: { key: "KeyT", label: "T", category: "COMBAT", description: "Tuyệt Kỹ / Cuồng Nộ Thức Tỉnh" },
  INTERACT: { key: "KeyF", label: "F", category: "COMBAT", description: "Tương tác NPC / Cổng Phó bản / Nhặt đồ" },

  // ── Vật phẩm tiêu hao ──
  POTION_HP: { key: "KeyZ", label: "Z / 4", category: "CONSUMABLE", description: "Uống Bình Máu (Hồi HP)" },
  POTION_MP: { key: "KeyX", label: "X / 5", category: "CONSUMABLE", description: "Uống Bình Năng Lượng (Hồi MP)" },
  BUFF_ATK: { key: "KeyC", label: "C / 8", category: "CONSUMABLE", description: "Dùng Bùa / Cuộn Khiên Buff" },

  // ── Giao diện cũ giữ nguyên ──
  TOGGLE_VIEW: { key: "KeyV", label: "V", category: "INTERFACE", description: "Chuyển đổi góc nhìn 2.5D Sprite / 3D Model" },
  BAG: { key: "KeyB", label: "B", category: "INTERFACE", description: "Mở Túi Đồ & Trang Bị" },
  SHOP: { key: "KeyP", label: "P", category: "INTERFACE", description: "Mở Cửa Hàng Tiệm Tạp Hóa" },
  LEADERBOARD: { key: "KeyO", label: "O", category: "INTERFACE", description: "Bảng Xếp Hạng Cao Thủ" },
  BATTLE_REPORT: { key: "KeyH", label: "H", category: "INTERFACE", description: "Chiến Báo Săn Quái / Lịch Sử Chiến Đấu" },
  GM_ADMIN: { key: "F12", label: "F12", category: "INTERFACE", description: "GM Panel Quản Trị Hệ Thống" },

  // ── TỔ HỢP 2 PHÍM MỚI (CHORDED KEYBINDINGS - Alt + Phím) ──
  AUTO_COMBAT: {
    key: "KeyA",
    modifiers: { alt: true },
    label: "Alt + A",
    category: "CHORDED_SYSTEM",
    description: "Bật / Tắt Tự Động Chiến Đấu (Smart Auto-Combat)",
  },
  MOUNT_CHORD: {
    key: "KeyM",
    modifiers: { alt: true },
    label: "Alt + M / Shift + Space",
    category: "CHORDED_SYSTEM",
    description: "Triệu Hồi / Xuống Thú Cưỡi",
  },
  BLACKSMITH_CHORD: {
    key: "KeyU",
    modifiers: { alt: true },
    label: "Alt + U",
    category: "CHORDED_SYSTEM",
    description: "Mở Lò Rèn (Cường Hóa / Khảm Ngọc / Tẩy Luyện)",
  },
  AUCTION_HOUSE_CHORD: {
    key: "KeyK",
    modifiers: { alt: true },
    label: "Alt + K",
    category: "CHORDED_SYSTEM",
    description: "Mở Chợ Đấu Giá Liên Người Chơi",
  },
  TALENTS_CHORD: {
    key: "KeyN",
    modifiers: { alt: true },
    label: "Alt + N",
    category: "CHORDED_SYSTEM",
    description: "Mở Thức Tỉnh Chuyển Chức & Cây Thiên Phú",
  },
  CODEX_CHORD: {
    key: "KeyL",
    modifiers: { alt: true },
    label: "Alt + L",
    category: "CHORDED_SYSTEM",
    description: "Mở Sách Đồ Giám Sưu Tầm (Quái Vật & Trang Bị)",
  },
  QUEST_LOG_CHORD: {
    key: "KeyQ",
    modifiers: { alt: true },
    label: "Alt + Q",
    category: "CHORDED_SYSTEM",
    description: "Mở Sổ Tay Nhiệm Vụ",
  },
  MANUAL_SYNC_CHORD: {
    key: "KeyS",
    modifiers: { alt: true },
    label: "Alt + S",
    category: "CHORDED_SYSTEM",
    description: "Lưu Nhanh Toàn Diện Trạng Thái (Manual Full-Sync Save)",
  },
  WORLD_ATLAS_CHORD: {
    key: "KeyW",
    modifiers: { alt: true },
    label: "Alt + W",
    category: "CHORDED_SYSTEM",
    description: "Mở Bản Đồ Thế Giới 100 Khu Vực (World Atlas)",
  },
};

/**
 * Xử lý tổ hợp phím có phím biến đổi (Alt / Shift)
 * Trả về true nếu sự kiện đã được tiêu thụ.
 */
export function handleChordedKeydown(e: KeyboardEvent): boolean {
  const worldStore = useGameWorldStore.getState();
  const gameStore = useGameStore.getState();
  const code = e.code;

  // 1. Shift + Space: Triệu hồi / Xuống thú cưỡi
  if (e.shiftKey && code === "Space") {
    e.preventDefault();
    worldStore.toggleMount();
    return true;
  }

  // 2. Các tổ hợp phím Alt + [Key]
  if (e.altKey) {
    if (code === "KeyA") {
      // Alt + A: Bật / Tắt Tự Động Chiến Đấu
      e.preventDefault();
      worldStore.toggleAutoCombat();
      return true;
    }

    if (code === "KeyM") {
      // Alt + M: Thú cưỡi
      e.preventDefault();
      worldStore.toggleMount();
      return true;
    }

    if (code === "KeyU") {
      // Alt + U: Lò rèn (Cường Hóa / Khảm Ngọc / Tẩy Luyện)
      e.preventDefault();
      if (worldStore.activeModal === "blacksmith") {
        worldStore.closeActiveModal();
      } else {
        worldStore.setActiveModal("blacksmith");
      }
      return true;
    }

    if (code === "KeyK") {
      // Alt + K: Chợ đấu giá
      e.preventDefault();
      if (worldStore.activeModal === "auctionHouse") {
        worldStore.closeActiveModal();
      } else {
        worldStore.setActiveModal("auctionHouse");
      }
      return true;
    }

    if (code === "KeyN") {
      // Alt + N: Thiên phú & Chuyển chức
      e.preventDefault();
      if (worldStore.activeModal === "talents") {
        worldStore.closeActiveModal();
      } else {
        worldStore.setActiveModal("talents");
      }
      return true;
    }

    if (code === "KeyL") {
      // Alt + L: Đồ giám (Codex)
      e.preventDefault();
      if (worldStore.activeModal === "codex") {
        worldStore.closeActiveModal();
      } else {
        worldStore.setActiveModal("codex");
      }
      return true;
    }

    if (code === "KeyQ") {
      // Alt + Q: Sổ tay nhiệm vụ
      e.preventDefault();
      if (worldStore.activeModal === "quests") {
        worldStore.closeActiveModal();
      } else {
        worldStore.setActiveModal("quests");
      }
      return true;
    }

    if (code === "KeyS") {
      // Alt + S: Lưu nhanh toàn bộ trạng thái (Manual Full-Sync Save)
      e.preventDefault();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("game:manual-save"));
      }
      return true;
    }

    if (code === "KeyW") {
      // Alt + W: Mở Bản Đồ Thế Giới 100 Khu Vực (World Atlas)
      e.preventDefault();
      if (worldStore.activeModal === "worldAtlas") {
        worldStore.closeActiveModal();
      } else {
        worldStore.setActiveModal("worldAtlas");
      }
      return true;
    }
  }

  return false;
}
