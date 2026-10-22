import React, { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Shield, KeyRound, Lock, User, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminLoginScreen() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [securityKey, setSecurityKey] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() && !securityKey.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập tên đăng nhập và mật khẩu, hoặc mã khóa bảo mật.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
          securityKey: securityKey.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Đăng nhập quản trị thất bại");
      }

      // Store admin session and token
      sessionStorage.setItem("admin_authenticated", "true");
      if (data.token) {
        sessionStorage.setItem("admin_token", data.token);
      }
      if (data.user) {
        sessionStorage.setItem("admin_user", JSON.stringify(data.user));
      }

      toast({
        title: "Đăng nhập thành công!",
        description: `Chào mừng Quản Trị Viên [${data.user?.username || "Admin"}] gia nhập phòng điều hành!`,
      });

      setLocation("/admin");
    } catch (err: any) {
      toast({
        title: "Đăng nhập thất bại",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8 relative overflow-hidden"
      style={{
        backgroundColor: "#1c161a",
        backgroundImage: "radial-gradient(circle at 50% 50%, #2a2022 0%, #1c161a 75%, #120e10 100%)",
      }}
    >
      {/* Decorative Aura */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#28c3e1]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Return Button */}
      <button
        type="button"
        onClick={() => setLocation("/")}
        className="absolute top-5 left-5 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-[#342a2b]/80 hover:bg-[#342a2b] border border-[#5d4648] text-xs font-bold text-gray-300 hover:text-[#28c3e1] backdrop-blur-md shadow-lg transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Về Sảnh Game</span>
      </button>

      {/* Admin Login Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[480px] rounded-[32px] bg-[#342a2b] border border-[#5d4648]/80 shadow-[0_30px_90px_rgba(0,0,0,0.7),0_10px_30px_rgba(0,0,0,0.5)] p-6 sm:p-10 flex flex-col"
      >
        {/* Header Icon */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#28c3e1]/25 to-[#4a383a] border border-[#28c3e1]/50 flex items-center justify-center text-[#28c3e1] shadow-[0_0_30px_rgba(40,195,225,0.3)] mb-4">
            <Shield className="w-8 h-8" />
          </div>
          <span className="font-sans text-[11px] uppercase tracking-widest font-black text-[#28c3e1] mb-1">
            Hệ Thống Quản Trị Trung Tâm
          </span>
          <h1 className="font-sans text-2xl sm:text-3xl font-black text-white tracking-tight">
            CHIẾN LONG BÁ · GM
          </h1>
          <p className="font-sans text-xs text-[#8e7a7c] mt-2 max-w-xs leading-relaxed">
            Cổng xác thực kỹ thuật và quản lý dữ liệu Supabase - Vercel dành riêng cho Ban Điều Hành.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#28c3e1]" />
              <span>Tên Quản Trị Viên (Admin)</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tên tài khoản admin..."
              className="w-full px-4 py-3 rounded-2xl bg-[#271f20] border border-[#5d4648] text-white text-sm focus:border-[#28c3e1] focus:ring-1 focus:ring-[#28c3e1] focus:outline-none transition placeholder:text-[#5d4648]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#28c3e1]" />
              <span>Mật Khẩu Quản Trị</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu admin..."
              className="w-full px-4 py-3 rounded-2xl bg-[#271f20] border border-[#5d4648] text-white text-sm focus:border-[#28c3e1] focus:ring-1 focus:ring-[#28c3e1] focus:outline-none transition placeholder:text-[#5d4648]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[#e5c158]" />
              <span>Mã Khóa Bảo Mật GM (Master Passcode)</span>
            </label>
            <input
              type="password"
              value={securityKey}
              onChange={(e) => setSecurityKey(e.target.value)}
              placeholder="Nhập mã bảo mật (vd: chienlongba2026)..."
              className="w-full px-4 py-3 rounded-2xl bg-[#271f20] border border-[#5d4648] text-white text-sm focus:border-[#e5c158] focus:ring-1 focus:ring-[#e5c158] focus:outline-none transition placeholder:text-[#5d4648]"
            />
            <p className="text-[11px] text-[#8e7a7c] mt-1.5">
              * Có thể dùng mã bảo mật master để mở khóa trực tiếp nếu chưa thiết lập mật khẩu riêng.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full bg-[#28c3e1] hover:brightness-110 active:scale-95 disabled:opacity-50 text-[#1c161a] font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(40,195,225,0.4)] transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <span>Đang Xác Thực...</span>
            ) : (
              <>
                <KeyRound className="w-4 h-4 stroke-[2.5]" />
                <span>Mở Khóa Bảng Điều Khiển</span>
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-8 pt-6 border-t border-[#5d4648]/50 flex items-center justify-between text-[11px] text-[#8e7a7c]">
          <span>Phiên bản: v2.5.0-PROD</span>
          <span className="flex items-center gap-1 text-[#28c3e1]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Supabase Cloud Sync</span>
          </span>
        </div>
      </motion.div>
    </div>
  );
}
