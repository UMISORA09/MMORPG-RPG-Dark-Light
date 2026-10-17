import { memo } from "react";
import { HardDriveDownload } from "lucide-react";

interface AutoSaveIndicatorProps {
  show: boolean;
  time?: string | null;
}

export const AutoSaveIndicator = memo(function AutoSaveIndicator({
  show,
  time,
}: AutoSaveIndicatorProps) {
  if (!show) return null;

  return (
    <div className="fixed bottom-3 right-3 z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-200 select-none">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0d1420]/90 border border-cyan-400/60 shadow-[0_0_18px_rgba(40,195,225,0.4)] backdrop-blur-md">
        <span className="text-sm animate-pulse">💾</span>
        <span className="text-[11px] font-black text-cyan-300 tracking-wide flex items-center gap-1 font-mono">
          Đã tự động lưu {time ? `(${time})` : ""}
        </span>
      </div>
    </div>
  );
});
