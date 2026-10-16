// ==============================================================================
// 2.5D RPG Locked Camera Orbit & Zoom Controls
// Clamped polar angle (35° to 55°), smooth zoom interpolation & shake reduction
// ==============================================================================

export const PITCH_MIN = (42 * Math.PI) / 180; // 42°: prevents horizontal horizon exposure
export const PITCH_MAX = (55 * Math.PI) / 180; // 55°: classic top-down angle

export const cameraControls = {
  yaw: 0,                   // Horizontal orbit angle around Y axis
  pitch: (48 * Math.PI) / 180, // Default 48° top-down 3/4 RPG angle
  zoom: 18,                 // Current camera distance
  targetZoom: 18,           // Desired zoom distance (mouse wheel)
  minZoom: 12,              // Close-up combat zoom
  maxZoom: 22,              // Wide tactical view
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
