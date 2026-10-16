import { memo } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";

interface OverheadChatBubbleProps {
  message: string | null;
  position: THREE.Vector3;
}

export const OverheadChatBubble = memo(function OverheadChatBubble({
  message,
  position,
}: OverheadChatBubbleProps) {
  if (!message) return null;

  return (
    <group position={[position.x, position.y + 2.7, position.z]}>
      <Html center distanceFactor={14} style={{ pointerEvents: "none" }}>
        <div className="relative animate-in fade-in zoom-in-90 duration-200">
          <div className="px-3.5 py-1.5 rounded-2xl bg-slate-950/90 border-2 border-cyan-400 text-white font-bold text-xs whitespace-nowrap shadow-[0_0_15px_rgba(0,242,255,0.45)] backdrop-blur-md max-w-[220px] text-center">
            {message}
          </div>
          {/* Speech bubble pointer notch */}
          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-cyan-400 mx-auto -mt-[1px]" />
        </div>
      </Html>
    </group>
  );
});

