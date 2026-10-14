// Shared camera orbit state — modified by Pointer Lock mouse (PC) and touch drag (mobile)
export const cameraControls = {
  yaw: 0,         // horizontal angle (around Y axis) - 0 points camera forward towards Wilderness & Boss Altar
  pitch: 0.45,    // vertical angle: positive = camera above looking down
  locked: false,  // whether pointer lock is active (PC)
  sensitivityX: 1,
  sensitivityY: 1,
  invertY: false,
  reduceShake: false,
};

export function setCameraPreferences(sensitivityX: number, sensitivityY: number, invertY: boolean, reduceShake = false) {
  cameraControls.sensitivityX = Math.max(0.3, Math.min(2.5, sensitivityX));
  cameraControls.sensitivityY = Math.max(0.3, Math.min(2.5, sensitivityY));
  cameraControls.invertY = invertY;
  cameraControls.reduceShake = reduceShake;
}

if (typeof window !== "undefined") {
  try {
    const saved = JSON.parse(window.localStorage.getItem("clb-game-settings") ?? "{}");
    setCameraPreferences(saved.sensitivityX ?? 1, saved.sensitivityY ?? 1, saved.invertY === true, saved.reduceShake === true);
  } catch {
    // Invalid or unavailable local preferences safely fall back to defaults.
  }
}

export const PITCH_MIN = -0.1;  // look slightly upward
export const PITCH_MAX = 1.3;   // look steeply down
