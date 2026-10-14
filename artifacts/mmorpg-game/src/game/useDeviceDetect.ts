import { useEffect, useState } from "react";

export type DeviceType = "mobile" | "tablet" | "desktop";

function detectDevice(): DeviceType {
  const ua = navigator.userAgent;
  const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const w = window.innerWidth;

  // Phone: touch + narrow screen OR phone UA
  const isPhoneUA = /Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTabletUA = /iPad|Tablet/i.test(ua) || (ua.includes("Android") && !/Mobile/i.test(ua));

  if (isPhoneUA || (hasTouch && w < 768)) return "mobile";
  if (isTabletUA || (hasTouch && w < 1280)) return "tablet";
  return "desktop";
}

export function useDeviceType(): DeviceType {
  const [device, setDevice] = useState<DeviceType>(detectDevice);

  useEffect(() => {
    const update = () => setDevice(detectDevice());
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return device;
}

export function isTouchDevice(): boolean {
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}
