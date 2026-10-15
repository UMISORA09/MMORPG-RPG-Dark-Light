// ==============================================================================
// 2.5D RPG Locked Camera Orbit & Zoom Controls
// Clamped polar angle (35° to 55°), smooth zoom interpolation & shake reduction
// ==============================================================================

export const PITCH_MIN = (35 * Math.PI) / 180; // 35°: prevents looking horizontally/under ground
export const PITCH_MAX = (55 * Math.PI) / 180; // 55°: prevents going completely overhead

export const cameraControls = {
  yaw: 0,                   // Horizontal orbit angle around Y axis
  pitch: (45 * Math.PI) / 180, // Default 45° classic isometric Action RPG angle
  zoom: 14,                 // Current camera distance
  targetZoom: 14,           // Desired zoom distance (mouse wheel)
  minZoom: 8,               // Close-up combat zoom
  maxZoom: 24,              // Wide tactical view
  dampingFactor: 0.08,      // Smooth lerp damping
  locked: false,            // Pointer lock status
  sensitivityX: 1,
  sensitivityY: 1,
  invertY: false,
  reduceShake: false,
};

export function setCameraPreferences(
  sensitivityX: number,
  sensitivityY: number,
  invertY: boolean,
  reduceShake = false
) {
  cameraControls.sensitivityX = Math.max(0.3, Math.min(2.5, sensitivityX));
  cameraControls.sensitivityY = Math.max(0.3, Math.min(2.5, sensitivityY));
  cameraControls.invertY = invertY;
  cameraControls.reduceShake = reduceShake;
}

if (typeof window !== "undefined") {
  try {
    const saved = JSON.parse(window.localStorage.getItem("clb-game-settings") ?? "{}");
    setCameraPreferences(
      saved.sensitivityX ?? 1,
      saved.sensitivityY ?? 1,
      saved.invertY === true,
      saved.reduceShake === true
    );
  } catch {
    // Fall back to defaults
  }
}
