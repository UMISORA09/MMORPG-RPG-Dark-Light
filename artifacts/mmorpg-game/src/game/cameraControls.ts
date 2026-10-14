// Shared camera orbit state — modified by Pointer Lock mouse (PC) and touch drag (mobile)
export const cameraControls = {
  yaw: Math.PI,   // horizontal angle (around Y axis)
  pitch: 0.45,    // vertical angle: positive = camera above looking down
  locked: false,  // whether pointer lock is active (PC)
};

export const PITCH_MIN = -0.1;  // look slightly upward
export const PITCH_MAX = 1.3;   // look steeply down
