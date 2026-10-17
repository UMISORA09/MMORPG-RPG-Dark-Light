// ==============================================================================
// Unified Input Router for Chiến Long Bá (Game2.5D)
// Ergonomic, conflict-free Keyboard, Mouse & Touch Input Management
// ==============================================================================

import { cameraControls, PITCH_MIN, PITCH_MAX } from "../cameraControls";
import { mobileState } from "../mobileControls";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { useGameStore } from "@/stores";
import { handleChordedKeydown } from "@/controls/ConflictFreeKeybindManager";

export interface InputState {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  dash: boolean;
  attack: boolean;
  interact: boolean;
  isRightMouseDown: boolean;
}

// Active pressed key codes
const activeKeyCodes = new Set<string>();

// Transient edge-triggered actions
let wantsAttackEdge = false;
let isRightMouseDown = false;
let lastMouseX = 0;
let lastMouseY = 0;

// Helper: Check if an active input element has focus
function isInputElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    target.isContentEditable ||
    target.getAttribute("role") === "textbox"
  );
}

// Clear all input states (used on window blur, alt-tab, modal open)
export function clearAllInputs() {
  activeKeyCodes.clear();
  wantsAttackEdge = false;
  isRightMouseDown = false;
  mobileState.attack = false;
  mobileState.shoot = false;
  mobileState.jump = false;
}

// Initialize Global Window Listeners safely (Singleton)
let isInitialized = false;

export function initInputRouter() {
  if (typeof window === "undefined" || isInitialized) return;
  isInitialized = true;

  window.addEventListener("keydown", (e: KeyboardEvent) => {
    // 1. Chặn phím hoàn toàn khi người chơi đang gõ chữ trong <input>, <textarea>
    if (isInputElement(e.target)) return;

    // 2. Xử lý Tổ hợp 2 Phím (Chorded Keybindings: Alt + A, Alt + M, Alt + U, Alt + K, Alt + N, Alt + L, Alt + Q, Alt + S)
    if (handleChordedKeydown(e)) {
      activeKeyCodes.delete(e.code);
      return;
    }

    // 3. Nếu phím ấn kèm Alt / Ctrl / Meta, không ghi nhận vào danh sách di chuyển
    if (e.altKey || e.ctrlKey || e.metaKey) return;

    const code = e.code;
    activeKeyCodes.add(code);

    // Bất cứ khi nào người chơi chủ động bấm WASD, kích hoạt cờ ưu tiên điều khiển thủ công 1.2s (Manual Override)
    if (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(code)) {
      useGameWorldStore.getState().triggerManualMovementOverride();
    }

    // Prevent default browser scrolling for game navigation keys
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(code)) {
      e.preventDefault();
    }

    const worldStore = useGameWorldStore.getState();
    const gameStore = useGameStore.getState();
    const hasModal = !!worldStore.activeModal || !!gameStore.game.menuOpen;

    // ESCAPE: Close modal first
    if (code === "Escape") {
      worldStore.closeActiveModal();
      gameStore.closeActiveModal();
      clearAllInputs();
      return;
    }

    // Interface Modals Toggle: B (Túi đồ), P (Cửa hàng), O (BXH), H (Chiến báo), V (Đổi 2.5D/3D Mode)
    if (code === "KeyB") {
      if (worldStore.activeModal === "inventory") {
        worldStore.closeActiveModal();
        gameStore.closeActiveModal();
      } else {
        worldStore.setActiveModal("inventory");
        gameStore.setActiveModal("inventory");
      }
      return;
    } else if (code === "KeyP") {
      if (worldStore.activeModal === "shop") {
        worldStore.closeActiveModal();
      } else {
        worldStore.setActiveModal("shop");
        gameStore.setActiveModal("shop");
      }
      return;
    } else if (code === "KeyO") {
      if (worldStore.activeModal === "leaderboard") {
        worldStore.closeActiveModal();
      } else {
        worldStore.setActiveModal("leaderboard");
        gameStore.setActiveModal("leaderboard");
      }
      return;
    } else if (code === "KeyH") {
      if (worldStore.activeModal === "battleLog") {
        worldStore.closeActiveModal();
      } else {
        worldStore.setActiveModal("battleLog");
        gameStore.setActiveModal("battle_logs");
      }
      return;
    } else if (code === "KeyV") {
      worldStore.toggleCharacterRenderMode();
      return;
    }

    // If modal is open, ignore gameplay combat hotkeys
    if (hasModal) return;

    // Basic Attack / Combo: J (W, A, S, D are strictly reserved for movement!)
    if (code === "KeyJ") {
      wantsAttackEdge = true;
      return;
    }

    // Phím tương tác [F]: Vào Hang Động Phó Bản, Bia Tưởng Niệm, NPC hoặc nhặt đồ
    if (code === "KeyF") {
      const pPos = worldStore.playerPosition;
      // 1. Cổng Hang Động Phó Bản (z = -48)
      const dPortal = Math.hypot(pPos.x - 0, pPos.z - (-48));
      const dPortalLeft = Math.hypot(pPos.x - (-22), pPos.z - (-48));
      const dPortalRight = Math.hypot(pPos.x - 22, pPos.z - (-48));
      if (dPortal < 7.5 || dPortalLeft < 6.0 || dPortalRight < 6.0) {
        worldStore.openDungeonModal();
        return;
      }

      // 2. Bia Tưởng Niệm & Bảng Xếp Hạng Làng Tân Thủ ([6.5, 4.5])
      const dMemorial = Math.hypot(pPos.x - 6.5, pPos.z - 4.5);
      if (dMemorial < 5.0) {
        worldStore.setActiveModal("leaderboard");
        gameStore.setActiveModal("leaderboard");
        return;
      }

      // 3. NPC Làng Tân Thủ
      if (Math.hypot(pPos.x - 0, pPos.z - 8) < 4.0) {
        worldStore.setActiveModal("quests");
        return;
      }
      if (Math.hypot(pPos.x - (-8), pPos.z - (-6)) < 4.0) {
        worldStore.setActiveModal("blacksmith");
        return;
      }
      if (Math.hypot(pPos.x - 8, pPos.z - (-6)) < 4.0) {
        worldStore.setActiveModal("shop");
        return;
      }
      if (Math.hypot(pPos.x - 0, pPos.z - (-12)) < 4.0) {
        worldStore.openDungeonModal();
        return;
      }

      // 4. Nhặt đồ rơi vương vãi gần chân
      worldStore.pickUpNearbyLoot(4.5);
      return;
    }

    // Skill 1: Phím 1 hoặc Q
    if (code === "Digit1" || code === "KeyQ") {
      worldStore.triggerSkill(1);
      gameStore.triggerSkill(1);
      return;
    }

    // Skill 2: Phím 2 hoặc E
    if (code === "Digit2" || code === "KeyE") {
      worldStore.triggerSkill(2);
      gameStore.triggerSkill(2);
      return;
    }

    // Skill 3: Phím 3 hoặc R
    if (code === "Digit3" || code === "KeyR") {
      worldStore.triggerSkill(3);
      gameStore.triggerSkill(3);
      return;
    }

    // Cuồng Nộ Thức Tỉnh (Fever Awakening / Skill 4): Phím T
    if (code === "KeyT") {
      if (worldStore.feverGauge >= 100) {
        worldStore.activateFever();
      } else {
        worldStore.triggerSkill(3);
      }
      return;
    }

    // GM Admin Secret Panel: F12
    if (e.key === "F12" || code === "F12") {
      e.preventDefault();
      worldStore.toggleGMAdmin();
      return;
    }

    // 3. Quick Consumables / Potions
    // Bình Máu (HP Potion): Phím Z
    if (code === "KeyZ") {
      worldStore.useQuickPotionHp();
      return;
    }
    // Bình Năng Lượng (MP Potion): Phím X
    if (code === "KeyX") {
      worldStore.useQuickPotionMp();
      return;
    }
    // Cuộn Buff / Khiên Hộ Mệnh: Phím C
    if (code === "KeyC") {
      worldStore.useQuickShield();
      return;
    }
    // La Bàn Dịch Chuyển Về Làng (Town Teleport): Phím 7
    if (code === "Digit7") {
      worldStore.useQuickTeleport();
      return;
    }
    // Cuộn Khiên Thánh (Shield Scroll): Phím 8
    if (code === "Digit8") {
      worldStore.useQuickShield();
      return;
    }
    // Thịt Nướng Hồi Máu (Food Meat): Phím 9
    if (code === "Digit9") {
      worldStore.useQuickFood("meat");
      return;
    }
    // Súp Hầm Hồi MP (Food Soup): Phím 0
    if (code === "Digit0") {
      worldStore.useQuickFood("soup");
      return;
    }
  });

  window.addEventListener("keyup", (e: KeyboardEvent) => {
    activeKeyCodes.delete(e.code);
  }, { passive: true });

  // Handle Alt-Tab, Window Blur, and Tab Switching
  window.addEventListener("blur", clearAllInputs);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clearAllInputs();
  });
}

// ── Mouse & Canvas Event Binders ──────────────────────────────────────────────
export function bindCanvasMouseControls(canvas: HTMLElement) {
  // Prevent context menu on right click inside canvas so camera orbit is smooth
  const onContextMenu = (e: MouseEvent) => {
    e.preventDefault();
  };

  const onMouseDown = (e: MouseEvent) => {
    const worldStore = useGameWorldStore.getState();
    const gameStore = useGameStore.getState();
    if (worldStore.activeModal || gameStore.game.menuOpen) return;

    if (e.button === 0) {
      // Left Click = Attack / Combo
      wantsAttackEdge = true;
    } else if (e.button === 2) {
      // Right Click = Orbit Camera
      isRightMouseDown = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    }
  };

  const onMouseUp = (e: MouseEvent) => {
    if (e.button === 2) {
      isRightMouseDown = false;
    }
  };

  const onMouseMove = (e: MouseEvent) => {
    const worldStore = useGameWorldStore.getState();
    const gameStore = useGameStore.getState();
    if (worldStore.activeModal || gameStore.game.menuOpen) return;

    // If pointer lock is active, use movementX/Y
    if (document.pointerLockElement === canvas) {
      cameraControls.yaw -= e.movementX * 0.003 * cameraControls.sensitivityX;
      const invertY = cameraControls.invertY ? -1 : 1;
      cameraControls.pitch = Math.max(
        PITCH_MIN,
        Math.min(PITCH_MAX, cameraControls.pitch + e.movementY * 0.003 * cameraControls.sensitivityY * invertY)
      );
    } else if (isRightMouseDown) {
      // Right Mouse Drag Camera Orbit
      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;

      cameraControls.yaw -= dx * 0.004 * cameraControls.sensitivityX;
      const invertY = cameraControls.invertY ? -1 : 1;
      cameraControls.pitch = Math.max(
        PITCH_MIN,
        Math.min(PITCH_MAX, cameraControls.pitch + dy * 0.004 * cameraControls.sensitivityY * invertY)
      );
    }
  };

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY > 0 ? 1.5 : -1.5;
    cameraControls.targetZoom = Math.max(
      cameraControls.minZoom,
      Math.min(cameraControls.maxZoom, cameraControls.targetZoom + zoomDelta)
    );
  };

  canvas.addEventListener("contextmenu", onContextMenu);
  canvas.addEventListener("mousedown", onMouseDown, { passive: true });
  canvas.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("mouseup", onMouseUp, { passive: true });
  window.addEventListener("mousemove", onMouseMove, { passive: true });

  return () => {
    canvas.removeEventListener("contextmenu", onContextMenu);
    canvas.removeEventListener("mousedown", onMouseDown);
    canvas.removeEventListener("wheel", onWheel);
    window.removeEventListener("mouseup", onMouseUp);
    window.removeEventListener("mousemove", onMouseMove);
  };
}

// ── Query Current Input Snapshot ─────────────────────────────────────────────
export function getInputState(): InputState {
  const isForward =
    activeKeyCodes.has("KeyW") || activeKeyCodes.has("ArrowUp");
  const isBack =
    activeKeyCodes.has("KeyS") || activeKeyCodes.has("ArrowDown");
  const isLeft =
    activeKeyCodes.has("KeyA") || activeKeyCodes.has("ArrowLeft");
  const isRight =
    activeKeyCodes.has("KeyD") || activeKeyCodes.has("ArrowRight");
  const isMoving = isForward || isBack || isLeft || isRight;
  const isShift = activeKeyCodes.has("ShiftLeft") || activeKeyCodes.has("ShiftRight");
  const isSpace = activeKeyCodes.has("Space");

  // Dash when Shift is pressed, or Space is pressed while moving
  const isDash = isShift || (isSpace && isMoving);
  const isJump = (isSpace && !isMoving) || mobileState.jump;
  const isInteract = activeKeyCodes.has("KeyF");

  const attack = wantsAttackEdge || mobileState.attack || mobileState.shoot;
  // Consume attack edge
  wantsAttackEdge = false;

  return {
    forward: isForward,
    back: isBack,
    left: isLeft,
    right: isRight,
    jump: isJump,
    dash: isDash,
    attack,
    interact: isInteract,
    isRightMouseDown,
  };
}
