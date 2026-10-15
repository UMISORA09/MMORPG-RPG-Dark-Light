// ==============================================================================
// Unified Input Router for Chiến Long Bá (Game2.5D)
// Ergonomic, conflict-free Keyboard, Mouse & Touch Input Management
// ==============================================================================

import { cameraControls, PITCH_MIN, PITCH_MAX } from "../cameraControls";
import { mobileState } from "../mobileControls";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { useGameStore } from "@/stores";

export interface InputState {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
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
    // 1. Ignore if typing in text fields
    if (isInputElement(e.target)) return;

    const code = e.code;
    const key = e.key.toLowerCase();
    activeKeyCodes.add(code);

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

    // If modal is open, ignore gameplay hotkeys
    if (hasModal) return;

    // 2. Action Hotkeys (Single Unified Dispatch)
    // Combat Skills: 1 / Q (Skill 1), 2 / E (Skill 2), 3 / R (Skill 3)
    if (code === "Digit1" || code === "KeyQ") {
      worldStore.triggerSkill(1);
      gameStore.triggerSkill(1);
    } else if (code === "Digit2" || code === "KeyE") {
      // E is strictly Skill 2
      worldStore.triggerSkill(2);
      gameStore.triggerSkill(2);
    } else if (code === "Digit3" || code === "KeyR") {
      worldStore.triggerSkill(3);
      gameStore.triggerSkill(3);
    }

    // Attack Trigger via Keyboard (J)
    if (code === "KeyJ") {
      wantsAttackEdge = true;
    }

    // Interface Modals: B/I (Inventory), P (Shop), L/O (Leaderboard), H (Battle Log), V (2.5D/3D Mode)
    if (code === "KeyB" || code === "KeyI") {
      worldStore.setActiveModal("inventory");
      gameStore.setActiveModal("inventory");
    } else if (code === "KeyP") {
      worldStore.setActiveModal("shop");
      gameStore.setActiveModal("shop");
    } else if (code === "KeyL" || code === "KeyO") {
      worldStore.setActiveModal("leaderboard");
      gameStore.setActiveModal("leaderboard");
    } else if (code === "KeyH") {
      worldStore.setActiveModal("battleLog");
      gameStore.setActiveModal("battle_logs");
    } else if (code === "KeyV") {
      worldStore.toggleCharacterRenderMode();
    }
  });

  window.addEventListener("keyup", (e: KeyboardEvent) => {
    activeKeyCodes.delete(e.code);
  });

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
  canvas.addEventListener("mousedown", onMouseDown);
  canvas.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("mouseup", onMouseUp);
  window.addEventListener("mousemove", onMouseMove);

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
  const isJump = activeKeyCodes.has("Space") || mobileState.jump;
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
    attack,
    interact: isInteract,
    isRightMouseDown,
  };
}
