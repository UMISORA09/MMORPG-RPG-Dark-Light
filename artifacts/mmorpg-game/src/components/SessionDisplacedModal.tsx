import React, { useEffect, useState } from "react";
import { useSessionDisplacementStore } from "@/lib/sessionGuard";
import { LogOut, AlertTriangle, ShieldAlert } from "lucide-react";

export const SessionDisplacedModal: React.FC = () => {
  const isDisplaced = useSessionDisplacementStore((s) => s.isDisplaced);
  const displacementReason = useSessionDisplacementStore((s) => s.displacementReason);
  const [secondsLeft, setSecondsLeft] = useState(5);

  useEffect(() => {
    if (!isDisplaced) return;

    // Countdown timer for automatic redirect
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleRedirect();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isDisplaced]);

  const handleRedirect = () => {
    try {
      localStorage.removeItem("clb_token");
      localStorage.removeItem("token");
    } catch {}
    window.location.href = "/login";
  };

  if (!isDisplaced) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#1c161a] border-2 border-red-500/40 rounded-[28px] p-6 md:p-8 shadow-[0_0_50px_rgba(239,68,68,0.25)] text-center text-white overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-red-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Pulsing Icon */}
        <div className="relative mx-auto w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-red-950/60 border border-red-500/40 flex items-center justify-center mb-5 shadow-[0_0_25px_rgba(239,68,68,0.3)]">
          <ShieldAlert className="w-9 h-9 md:w-11 md:h-11 text-red-400 animate-pulse" />
        </div>

        {/* Title */}
        <h2 className="font-sans font-black text-xl md:text-2xl text-red-300 tracking-wide uppercase mb-2">
          Phiên Chơi Đã Bị Ngắt
        </h2>

        {/* Reason */}
        <div className="bg-[#2a1b20] border border-red-900/50 rounded-xl p-3 mb-4 text-xs font-mono text-red-200/90 leading-relaxed">
          <div className="flex items-center justify-center gap-1.5 mb-1 font-bold text-red-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Phát hiện truy cập trùng lặp</span>
          </div>
          {displacementReason || "Tài khoản hoặc nhân vật của bạn vừa được đăng nhập từ một cửa sổ hoặc thiết bị khác."}
        </div>

        <p className="text-xs text-slate-400 leading-relaxed mb-6 font-sans">
          Để bảo vệ tính toàn vẹn của dữ liệu trang bị, cấp độ và vàng, hệ thống chỉ cho phép duy nhất một phiên chơi hoạt động. Trang trước đó đã được tự động đăng xuất an toàn.
        </p>

        {/* Countdown & Action */}
        <div className="space-y-3">
          <button
            onClick={handleRedirect}
            className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#28c3e1] to-[#1ba1bc] hover:brightness-110 active:scale-95 text-[#12181d] font-black text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(40,195,225,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng Nhập Lại Ngay</span>
          </button>

          <p className="text-[11px] font-mono text-slate-500">
            Tự động chuyển về trang đăng nhập sau <span className="text-amber-400 font-bold">{secondsLeft}s</span>
          </p>
        </div>
      </div>
    </div>
  );
};
