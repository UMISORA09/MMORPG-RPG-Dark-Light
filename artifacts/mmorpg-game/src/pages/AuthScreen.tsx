import { useState } from "react";
import { useLocation } from "wouter";
import {
  useLogin,
  useRegister,
  useGetMe,
  getGetMeQueryKey,
  useGetCharacters,
  getGetCharactersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Swords, Lock, User, Sparkles, Flame, Shield, ArrowRight, CheckCircle2 } from "lucide-react";

export default function AuthScreen() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formErrors, setFormErrors] = useState<{ username?: string; password?: string; confirm?: string }>({});

  const loginMutation = useLogin();
  const registerMutation = useRegister();

  // Validate form
  const validateForm = () => {
    const errors: { username?: string; password?: string; confirm?: string } = {};

    if (!username.trim()) {
      errors.username = "Vui lòng nhập tên tài khoản";
    } else if (username.length < 3 || username.length > 20) {
      errors.username = "Tên tài khoản phải từ 3 đến 20 ký tự";
    }

    if (!password) {
      errors.password = "Vui lòng nhập mật khẩu";
    } else if (password.length < 6) {
      errors.password = "Mật khẩu phải có tối thiểu 6 ký tự";
    }

    if (activeTab === "register" && password !== confirmPassword) {
      errors.confirm = "Mật khẩu xác nhận không trùng khớp";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle successful authentication
  const handleAuthSuccess = async () => {
    await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
    
    // Fetch characters list to decide next destination
    try {
      const chars = await queryClient.fetchQuery({
        queryKey: getGetCharactersQueryKey(),
        queryFn: async () => {
          const { getCharacters } = await import("@workspace/api-client-react");
          return getCharacters();
        },
      });

      if (chars && chars.length > 0) {
        setLocation("/characters");
      } else {
        setLocation("/characters");
      }
    } catch {
      setLocation("/characters");
    }
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (activeTab === "login") {
      loginMutation.mutate(
        { data: { username, password } },
        {
          onSuccess: () => {
            toast({
              title: "⚡ Đăng nhập thành công!",
              description: `Chào mừng đại hiệp ${username} trở lại giang hồ!`,
            });
            handleAuthSuccess();
          },
          onError: (err: any) => {
            toast({
              variant: "destructive",
              title: "Đăng nhập thất bại",
              description: err?.message || "Tên tài khoản hoặc mật khẩu không chính xác",
            });
          },
        }
      );
    } else {
      registerMutation.mutate(
        { data: { username, password } },
        {
          onSuccess: () => {
            toast({
              title: "✨ Khởi tạo tài khoản thành công!",
              description: `Tài khoản ${username} đã sẵn sàng thức tỉnh thiên mệnh!`,
            });
            handleAuthSuccess();
          },
          onError: (err: any) => {
            toast({
              variant: "destructive",
              title: "Đăng ký thất bại",
              description: err?.message || "Tên tài khoản đã tồn tại trên máy chủ",
            });
          },
        }
      );
    }
  };

  // Quick Play handler for instant jump-in
  const handleQuickPlay = async () => {
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const guestUser = `HiepSi_${randNum}`;
    const guestPass = `pass_${randNum}`;

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: guestUser, password: guestPass }),
      });

      if (res.ok) {
        await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({
          title: "⚡ Trải nghiệm Ngay Lập Tức!",
          description: `Khởi tạo nhân vật khách: ${guestUser}`,
        });
        setLocation("/characters");
      } else {
        // Fallback to login if already exists
        loginMutation.mutate(
          { data: { username: guestUser, password: guestPass } },
          {
            onSuccess: () => setLocation("/characters"),
          }
        );
      }
    } catch {
      toast({ variant: "destructive", title: "Lỗi kết nối máy chủ" });
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#030108] text-white relative overflow-hidden flex flex-col items-center justify-center px-4 py-8 selection:bg-[#ff3366] selection:text-white">
      {/* ── Cyberpunk / Dark Fantasy Grid & Aura ── */}
      <div
        className="fixed inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 242, 255, 0.12) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 51, 102, 0.12) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />
      <div className="fixed top-1/4 -left-48 w-96 h-96 rounded-full bg-[#ff3366]/20 blur-[130px] pointer-events-none animate-pulse" />
      <div className="fixed bottom-1/4 -right-48 w-96 h-96 rounded-full bg-[#00f2ff]/20 blur-[130px] pointer-events-none animate-pulse" />

      {/* Floating Magic Sparks / Particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 4 + 2,
              height: Math.random() * 4 + 2,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: i % 2 === 0 ? "#ff3366" : "#00f2ff",
              boxShadow: i % 2 === 0 ? "0 0 10px #ff3366" : "0 0 10px #00f2ff",
            }}
            animate={{
              y: [0, -40, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.4, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* ── Main Container ── */}
      <div className="relative z-10 w-full max-w-md">
        {/* ── LOGO CHIẾN LONG BÁ ── */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 15 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#ff3366] via-[#9d4edd] to-[#00f2ff] p-0.5 shadow-[0_0_40px_rgba(255,51,102,0.45)] mb-4"
          >
            <div className="w-full h-full bg-[#0d071a] rounded-[14px] flex items-center justify-center">
              <Swords className="w-10 h-10 text-amber-300 drop-shadow-[0_0_15px_rgba(255,215,0,0.6)]" />
            </div>
          </motion.div>

          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-wider bg-gradient-to-r from-amber-200 via-rose-300 to-cyan-300 bg-clip-text text-transparent drop-shadow-sm">
            CHIẾN LONG BÁ
          </h1>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-gradient-to-r from-[#ff3366]/20 to-[#00f2ff]/20 border border-[#00f2ff]/30 text-[10px] font-extrabold uppercase tracking-widest text-cyan-300 mt-2">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            REALM OF LEGENDS &bull; 2.5D REAL-TIME MMORPG
          </div>
        </div>

        {/* ── GLASSMORPHISM AUTH CARD ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-3xl bg-gradient-to-b from-[#140b24]/90 via-[#0d071a]/95 to-[#06030c] border border-[#ff3366]/30 shadow-[0_0_50px_rgba(255,51,102,0.2)] backdrop-blur-2xl p-6 sm:p-8"
        >
          {/* Framer Motion Tabs Switcher */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-black/50 border border-white/10 mb-6 relative">
            <button
              type="button"
              onClick={() => {
                setActiveTab("login");
                setFormErrors({});
              }}
              className={`relative z-10 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors duration-200 text-center ${
                activeTab === "login" ? "text-white" : "text-white/50 hover:text-white/80"
              }`}
            >
              Đăng Nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("register");
                setFormErrors({});
              }}
              className={`relative z-10 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors duration-200 text-center ${
                activeTab === "register" ? "text-white" : "text-white/50 hover:text-white/80"
              }`}
            >
              Đăng Ký Mới
            </button>

            {/* Animated Tab Indicator */}
            <motion.div
              className="absolute top-1 bottom-1 rounded-xl bg-gradient-to-r from-[#ff3366] to-[#ff0055] shadow-[0_0_15px_rgba(255,51,102,0.5)]"
              layout
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              style={{
                left: activeTab === "login" ? "4px" : "calc(50% + 2px)",
                width: "calc(50% - 6px)",
              }}
            />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
                Tài Khoản Đại Hiệp
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (formErrors.username) setFormErrors({ ...formErrors, username: undefined });
                  }}
                  placeholder="Nhập tên tài khoản (3-20 ký tự)"
                  className={`w-full h-12 pl-10 pr-4 rounded-xl bg-black/60 border text-white placeholder-white/30 text-sm font-semibold focus:outline-none transition-all ${
                    formErrors.username
                      ? "border-rose-500 focus:border-rose-400"
                      : "border-white/15 focus:border-[#00f2ff] focus:ring-1 focus:ring-[#00f2ff]"
                  }`}
                />
              </div>
              {formErrors.username && (
                <p className="mt-1 text-xs text-rose-400 font-medium">{formErrors.username}</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
                Mật Khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (formErrors.password) setFormErrors({ ...formErrors, password: undefined });
                  }}
                  placeholder="Tối thiểu 6 ký tự"
                  className={`w-full h-12 pl-10 pr-4 rounded-xl bg-black/60 border text-white placeholder-white/30 text-sm font-semibold focus:outline-none transition-all ${
                    formErrors.password
                      ? "border-rose-500 focus:border-rose-400"
                      : "border-white/15 focus:border-[#00f2ff] focus:ring-1 focus:ring-[#00f2ff]"
                  }`}
                />
              </div>
              {formErrors.password && (
                <p className="mt-1 text-xs text-rose-400 font-medium">{formErrors.password}</p>
              )}
            </div>

            {/* Confirm Password (Register tab only) */}
            <AnimatePresence>
              {activeTab === "register" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
                    Xác Nhận Mật Khẩu
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (formErrors.confirm) setFormErrors({ ...formErrors, confirm: undefined });
                      }}
                      placeholder="Nhập lại mật khẩu"
                      className={`w-full h-12 pl-10 pr-4 rounded-xl bg-black/60 border text-white placeholder-white/30 text-sm font-semibold focus:outline-none transition-all ${
                        formErrors.confirm
                          ? "border-rose-500 focus:border-rose-400"
                          : "border-white/15 focus:border-[#00f2ff] focus:ring-1 focus:ring-[#00f2ff]"
                      }`}
                    />
                  </div>
                  {formErrors.confirm && (
                    <p className="mt-1 text-xs text-rose-400 font-medium">{formErrors.confirm}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button with Fire / Cyber Glow Effect */}
            <button
              type="submit"
              disabled={loginMutation.isPending || registerMutation.isPending}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-[#ff3366] via-[#ff0055] to-orange-500 hover:from-[#ff5588] hover:to-orange-600 text-white font-extrabold text-sm sm:text-base tracking-wider uppercase shadow-[0_0_25px_rgba(255,51,102,0.5)] flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 mt-2"
            >
              {loginMutation.isPending || registerMutation.isPending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Flame className="w-4 h-4 text-amber-300 animate-pulse" />
                  <span>{activeTab === "login" ? "BƯỚC VÀO THẾ GIỚI" : "TẠO TÀI KHOẢN MỚI"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <span className="relative z-10 px-3 bg-[#0d071a] text-[11px] font-bold uppercase tracking-wider text-white/40">
              Hoặc trải nghiệm tức thì
            </span>
          </div>

          {/* Quick Play Button */}
          <button
            type="button"
            onClick={handleQuickPlay}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-black text-sm tracking-wide uppercase shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] animate-pulse"
          >
            <span>⚡ VÀO CHƠI NGAY (QUICK PLAY)</span>
          </button>
        </motion.div>

        {/* Feature Highlights */}
        <div className="mt-8 grid grid-cols-3 gap-3 text-center text-xs text-white/50">
          <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
            <Shield className="w-4 h-4 mx-auto text-amber-400 mb-1" />
            <span>4 Hệ Phái</span>
          </div>
          <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
            <Swords className="w-4 h-4 mx-auto text-rose-400 mb-1" />
            <span>Map Liên Thông</span>
          </div>
          <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
            <Sparkles className="w-4 h-4 mx-auto text-cyan-400 mb-1" />
            <span>Đồ Rơi 3D</span>
          </div>
        </div>
      </div>
    </div>
  );
}
