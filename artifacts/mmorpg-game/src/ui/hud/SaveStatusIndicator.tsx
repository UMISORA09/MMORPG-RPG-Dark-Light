// ==============================================================================
// SaveStatusIndicator.tsx
// Visual Save Status Indicator & Manual "Lưu Ngay" Button
// ==============================================================================

import { memo } from "react";
import { usePerfectGamePersistence } from "@/persistence/usePerfectGamePersistence";
import { playCombatSFX } from "@/audio/CombatSoundSynth";
import { Save, CheckCircle, RefreshCw, AlertCircle } from "lucide-react";

export const SaveStatusIndicator = memo(function SaveStatusIndicator() {
  const { status, revision, lastSavedTime, lastReason, saveNow } = usePerfectGamePersistence();

  const handleManualSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    playCombatSFX("coin_chime", 0.4);
    await saveNow("Thủ công");
  };

  return (
    <div className="flex items-center gap-1.5 bg-[#0a0514]/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-700/80 shadow-md text-[11px] font-mono select-none">
      {/* Icon & Label theo trạng thái */}
      {status === "synced" && (
        <div className="flex items-center gap-1 text-emerald-400 font-semibold" title={`Lần lưu cuối: ${lastReason || "Bình thường"}`}>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Đã lưu (Rev #{revision} • {lastSavedTime})</span>
        </div>
      )}

      {status === "saving" && (
        <div className="flex items-center gap-1 text-amber-400 font-semibold">
          <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
          <span>Đang đồng bộ...</span>
        </div>
      )}

      {status === "wal_cached" && (
        <div className="flex items-center gap-1 text-sky-400 font-semibold" title="Dữ liệu an toàn tuyệt đối trong Local WAL">
          <CheckCircle className="w-3 h-3 text-sky-400" />
          <span>Lưu nháp WAL (Rev #{revision})</span>
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center gap-1 text-rose-400 font-semibold">
          <AlertCircle className="w-3 h-3 text-rose-400" />
          <span>Lỗi mạng (Đã lưu WAL)</span>
        </div>
      )}

      <span className="text-slate-600">|</span>

      {/* Nút bấm Lưu Ngay */}
      <button
        onClick={handleManualSave}
        disabled={status === "saving"}
        className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-teal-500/20 to-cyan-500/20 hover:from-teal-500/40 hover:to-cyan-500/40 border border-cyan-500/40 text-cyan-300 hover:text-white transition cursor-pointer active:scale-95 disabled:opacity-50"
        title="Bấm để lưu toàn bộ trạng thái nhân vật ngay lập tức lên Server"
      >
        <Save className="w-3 h-3 text-cyan-400" />
        <span className="font-bold">Lưu Ngay</span>
      </button>
    </div>
  );
});
