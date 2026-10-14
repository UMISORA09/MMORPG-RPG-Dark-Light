import { useState } from "react";
import { useLocation } from "wouter";
import {
  useLogin,
  useRegister,
  getGetMeQueryKey,
  getGetCharactersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function AuthScreen() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [formErrors, setFormErrors] = useState<{ username?: string; password?: string; confirm?: string }>({});

  const loginMutation = useLogin();
  const registerMutation = useRegister();

  // Form Validation
  const validateForm = () => {
    const errors: { username?: string; password?: string; confirm?: string } = {};

    if (!username.trim()) {
      errors.username = "Vui lòng nhập email hoặc tài khoản";
    } else if (username.length < 3 || username.length > 30) {
      errors.username = "Tài khoản phải từ 3 đến 30 ký tự";
    }

    if (!password) {
      errors.password = "Vui lòng nhập mật khẩu";
    } else if (password.length < 6) {
      errors.password = "Mật khẩu tối thiểu 6 ký tự";
    }

    if (mode === "register" && password !== confirmPassword) {
      errors.confirm = "Mật khẩu xác nhận không khớp";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Auth Success Navigation
  const handleAuthSuccess = async () => {
    await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });

    try {
      const chars = await queryClient.fetchQuery({
        queryKey: getGetCharactersQueryKey(),
        queryFn: async () => {
          const { getCharacters } = await import("@workspace/api-client-react");
          return getCharacters();
        },
      });

      if (chars && Array.isArray(chars) && chars.length > 0) {
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

    if (mode === "login") {
      loginMutation.mutate(
        { data: { username, password } },
        {
          onSuccess: () => {
            toast({
              title: "⚡ Đăng nhập thành công!",
              description: `Chào mừng ${username} bước vào Chiến Long Bá!`,
            });
            handleAuthSuccess();
          },
          onError: (err: any) => {
            toast({
              variant: "destructive",
              title: "Đăng nhập thất bại",
              description: err?.message || "Tài khoản hoặc mật khẩu không đúng",
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
              description: `Tài khoản ${username} đã sẵn sàng khởi tạo nhân vật!`,
            });
            handleAuthSuccess();
          },
          onError: (err: any) => {
            toast({
              variant: "destructive",
              title: "Đăng ký thất bại",
              description: err?.message || "Tên tài khoản này đã được sử dụng",
            });
          },
        }
      );
    }
  };

  // Quick Play / Sign in later handler
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
          title: "⚡ Vào chơi ngay!",
          description: `Khởi tạo khách: ${guestUser}`,
        });
        setLocation("/characters");
      } else {
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
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8 relative overflow-hidden"
      style={{
        backgroundColor: "#4c6e6f",
        backgroundImage: "radial-gradient(circle at 50% 50%, #567c7d 0%, #446364 75%, #385253 100%)",
      }}
    >
      {/* ── SPLIT-SCREEN MODAL CARD ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative w-full max-w-[860px] min-h-[510px] md:h-[515px] rounded-[34px] bg-[#342a2b] shadow-[0_30px_90px_rgba(0,0,0,0.55),0_10px_30px_rgba(0,0,0,0.4)] flex flex-col md:flex-row items-stretch"
      >
        {/* ── CỘT TRÁI: ARTWORK PANEL (Pop-out character illustration) ── */}
        <div className="relative md:w-[57.4%] flex items-end justify-center rounded-t-[34px] md:rounded-t-none md:rounded-l-[34px] min-h-[280px] md:min-h-full">
          {/* Background Illustration Artwork with 2.5D Pop-Out Effect */}
          <div className="absolute inset-0 pointer-events-none">
            <img
              src="/auth-character-art-2x.png"
              alt="Chiến Long Bá Assassin"
              className="absolute top-0 bottom-0 left-[-34.3%] w-[134.3%] h-full object-cover md:object-fill max-w-none pointer-events-none select-none drop-shadow-[0_15px_30px_rgba(0,0,0,0.4)]"
            />
          </div>

          {/* Watermark Logo subtly placed on bottom-left of artwork */}
          <div className="relative z-10 p-6 w-full flex items-center justify-between pointer-events-none">
            <div className="flex flex-col">
              <span className="font-display text-white/95 text-sm font-black tracking-wider uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                CHIẾN LONG BÁ
              </span>
              <span className="font-sans text-[9px] text-[#28c3e1] font-bold tracking-widest uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                Realm of Legends
              </span>
            </div>
          </div>
        </div>

        {/* ── CỘT PHẢI: FORM PANEL (Dark charcoal/mauve tone #342a2b) ── */}
        <div className="relative z-10 md:w-[42.6%] bg-[#342a2b] rounded-b-[34px] md:rounded-b-none md:rounded-r-[34px] p-7 sm:p-10 flex flex-col justify-between">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: mode === "login" ? -15 : 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === "login" ? 15 : -15 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col justify-between"
            >
              {/* Header Title & Subtitle */}
              <div className="text-center mb-6">
                <h2 className="text-white text-2xl font-bold tracking-tight">
                  {mode === "login" ? "Welcome back" : "Create account"}
                </h2>
                <p className="text-[#8e7a7c] text-xs font-normal mt-1">
                  {mode === "login"
                    ? "Sign in to access your launcher"
                    : "Sign up to begin your legend"}
                </p>
              </div>

              {/* Form Inputs */}
              <form onSubmit={handleSubmit} className="space-y-3.5 mb-5">
                {/* Email / Username Field */}
                <div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (formErrors.username) setFormErrors({ ...formErrors, username: undefined });
                    }}
                    placeholder={mode === "login" ? "E-mail address / Username" : "Username (3-20 characters)"}
                    className="w-full h-11 px-4 rounded-xl bg-[#4a383a] border border-[#5d4648] text-white placeholder-[#8e7a7c] text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#28c3e1] focus:border-transparent outline-none transition-all"
                  />
                  {formErrors.username && (
                    <p className="mt-1 text-[11px] text-rose-400 font-medium pl-1">{formErrors.username}</p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (formErrors.password) setFormErrors({ ...formErrors, password: undefined });
                    }}
                    placeholder="Password"
                    className="w-full h-11 px-4 rounded-xl bg-[#4a383a] border border-[#5d4648] text-white placeholder-[#8e7a7c] text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#28c3e1] focus:border-transparent outline-none transition-all"
                  />
                  {formErrors.password && (
                    <p className="mt-1 text-[11px] text-rose-400 font-medium pl-1">{formErrors.password}</p>
                  )}
                </div>

                {/* Confirm Password (Register Mode only) */}
                {mode === "register" && (
                  <div>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (formErrors.confirm) setFormErrors({ ...formErrors, confirm: undefined });
                      }}
                      placeholder="Confirm password"
                      className="w-full h-11 px-4 rounded-xl bg-[#4a383a] border border-[#5d4648] text-white placeholder-[#8e7a7c] text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#28c3e1] focus:border-transparent outline-none transition-all"
                    />
                    {formErrors.confirm && (
                      <p className="mt-1 text-[11px] text-rose-400 font-medium pl-1">{formErrors.confirm}</p>
                    )}
                  </div>
                )}

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-[#8e7a7c]">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-[#6b5153] bg-[#4a383a] text-[#28c3e1] focus:ring-0 cursor-pointer accent-[#28c3e1]"
                    />
                    <span>Remember Me</span>
                  </label>

                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() =>
                        toast({
                          title: "Quên mật khẩu",
                          description: "Vui lòng liên hệ Game Master hoặc đăng nhập qua chế độ Khách.",
                        })
                      }
                      className="text-[#28c3e1] text-xs font-medium hover:underline transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>

                {/* Primary Action Button (Cyan Full Pill) */}
                <button
                  type="submit"
                  disabled={loginMutation.isPending || registerMutation.isPending}
                  className="w-full h-11 rounded-full bg-[#28c3e1] hover:bg-[#3cd3f1] text-[#1c161a] font-extrabold text-xs sm:text-sm tracking-wide shadow-[0_4px_16px_rgba(40,195,225,0.35)] transition-all active:scale-[0.99] disabled:opacity-60 flex items-center justify-center cursor-pointer mt-4"
                >
                  {loginMutation.isPending || registerMutation.isPending ? (
                    <div className="w-5 h-5 border-2 border-[#1c161a] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>{mode === "login" ? "Log in" : "Register"}</span>
                  )}
                </button>
              </form>

              {/* Social / Quick Login Icon Buttons */}
              <div className="flex items-center justify-center gap-3 mb-6">
                {/* Google */}
                <button
                  type="button"
                  onClick={handleQuickPlay}
                  title="Đăng nhập bằng Google"
                  className="w-12 h-10 rounded-xl bg-[#4a383a] hover:bg-[#584346] border border-[#5d4648] flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.4C3.7 20.1 7.5 23 12 23z"
                    />
                  </svg>
                </button>

                {/* Facebook */}
                <button
                  type="button"
                  onClick={handleQuickPlay}
                  title="Đăng nhập bằng Facebook"
                  className="w-12 h-10 rounded-xl bg-[#4a383a] hover:bg-[#584346] border border-[#5d4648] flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
                >
                  <svg className="w-4 h-4 fill-[#1877F2]" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </button>

                {/* Steam */}
                <button
                  type="button"
                  onClick={handleQuickPlay}
                  title="Đăng nhập qua Steam Launcher"
                  className="w-12 h-10 rounded-xl bg-[#4a383a] hover:bg-[#584346] border border-[#5d4648] flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
                >
                  <svg className="w-4 h-4 fill-[#d2d2d2]" viewBox="0 0 24 24">
                    <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.005.105.005.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 12-5.373 12-12S18.606 0 11.979 0zM7.545 14.802l-.527-.217c.414-.426 1-.689 1.649-.689.444 0 .854.125 1.205.342l-.528.377c-.201-.06-.414-.094-.635-.094-.658 0-1.208.432-1.388 1.026l-.224-.093c.125-.401.448-.718.868-.847l-.42-.175v.37z" />
                  </svg>
                </button>

                {/* Apple */}
                <button
                  type="button"
                  onClick={handleQuickPlay}
                  title="Đăng nhập bằng Apple ID"
                  className="w-12 h-10 rounded-xl bg-[#4a383a] hover:bg-[#584346] border border-[#5d4648] flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
                >
                  <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.64 1.35-.57.65-1.07 1.72-.94 2.74 1.01.08 2.04-.49 2.66-1.24z" />
                  </svg>
                </button>
              </div>

              {/* Footer Switch (Don't have account? Sign up or Sign in later) */}
              <div className="text-center text-xs text-[#8e7a7c] pt-2 border-t border-[#463537]">
                {mode === "login" ? (
                  <span>
                    Don&apos;t have account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("register");
                        setFormErrors({});
                      }}
                      className="text-[#28c3e1] font-semibold hover:underline cursor-pointer"
                    >
                      Sign up
                    </button>
                    {" or "}
                    <button
                      type="button"
                      onClick={handleQuickPlay}
                      className="text-[#28c3e1] font-semibold hover:underline cursor-pointer"
                    >
                      Sign in later
                    </button>
                  </span>
                ) : (
                  <span>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("login");
                        setFormErrors({});
                      }}
                      className="text-[#28c3e1] font-semibold hover:underline cursor-pointer"
                    >
                      Log in
                    </button>
                    {" or "}
                    <button
                      type="button"
                      onClick={handleQuickPlay}
                      className="text-[#28c3e1] font-semibold hover:underline cursor-pointer"
                    >
                      Sign in later
                    </button>
                  </span>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
