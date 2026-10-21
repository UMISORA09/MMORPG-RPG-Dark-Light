import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  useLogin,
  useRegister,
  useGetMe,
  getGetMeQueryKey,
  getGetCharactersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Database } from "lucide-react";

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

  // Kiểm tra nếu đã có token và phiên hợp lệ thì tự động vào thẳng game
  const { data: user, isLoading: userLoading } = useGetMe({
    query: { queryKey: getGetMeQueryKey() },
  });

  useEffect(() => {
    if (!userLoading && user) {
      setLocation("/characters");
    }
  }, [user, userLoading, setLocation]);

  // Form Validation
  const validateForm = () => {
    const errors: { username?: string; password?: string; confirm?: string } = {};

    if (!username.trim()) {
      errors.username = "Vui lòng nhập tên tài khoản";
    } else if (username.trim().length < 3 || username.trim().length > 20) {
      errors.username = "Tên tài khoản phải từ 3 đến 20 ký tự";
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

  // Auth Success Navigation -> Real Character Selection
  const handleAuthSuccess = async (data?: any) => {
    if (data?.token) {
      try {
        localStorage.setItem("clb_token", data.token);
      } catch {}
    }
    if (data?.user) {
      queryClient.setQueryData(getGetMeQueryKey(), data.user);
      try {
        if (data.user.username) {
          localStorage.setItem("clb_username", data.user.username);
          const savedChars = localStorage.getItem(`clb_characters_${data.user.username}`);
          if (savedChars) {
            localStorage.setItem("clb_client_characters", savedChars);
          }
        }
      } catch {}
    }
    await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
    await queryClient.invalidateQueries({ queryKey: getGetCharactersQueryKey() });
    setLocation("/characters");
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (mode === "login") {
      loginMutation.mutate(
        { data: { username: username.trim(), password } },
        {
          onSuccess: (data: any) => {
            toast({
              title: "⚡ Đăng nhập thành công!",
              description: `Chào mừng ${username.trim()} trở lại Chiến Long Bá!`,
            });
            handleAuthSuccess(data);
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
        { data: { username: username.trim(), password } },
        {
          onSuccess: (data: any) => {
            toast({
              title: "✨ Tạo tài khoản thành công!",
              description: `Chào mừng hiệp khách ${username.trim()}! Hãy chọn máy chủ và khởi tạo nhân vật.`,
            });
            handleAuthSuccess(data);
          },
          onError: (err: any) => {
            toast({
              variant: "destructive",
              title: "Đăng ký thất bại",
              description: err?.message || "Tên tài khoản này đã được sử dụng. Vui lòng chọn tên khác.",
            });
          },
        }
      );
    }
  };

  return (
    <div
      className="min-h-[100dvh] w-full flex items-center justify-center p-4 sm:p-8 relative overflow-y-auto custom-scrollbar"
      style={{
        backgroundColor: "#4c6e6f",
        backgroundImage: "radial-gradient(circle at 50% 50%, #567c7d 0%, #446364 75%, #385253 100%)",
      }}
    >
      {/* ── NÚT TRUY CẬP QUẢN TRỊ ADMIN / DATABASE ── */}
      <button
        type="button"
        onClick={() => setLocation("/admin")}
        className="absolute top-4 right-4 z-50 flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#342a2b]/90 hover:bg-[#342a2b] border border-[#5d4648] text-xs font-bold text-gray-200 hover:text-[#28c3e1] backdrop-blur-md shadow-xl transition-all hover:scale-105 active:scale-95"
      >
        <Database className="w-3.5 h-3.5 text-[#28c3e1]" />
        <span>Quản Trị Database</span>
      </button>

      {/* ── SPLIT-SCREEN MODAL CARD ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative w-full max-w-[860px] min-h-[510px] md:h-[515px] my-auto rounded-[34px] bg-[#342a2b] shadow-[0_30px_90px_rgba(0,0,0,0.55),0_10px_30px_rgba(0,0,0,0.4)] flex flex-col md:flex-row items-stretch"
      >
        {/* ── CỘT TRÁI: ARTWORK PANEL (Chiến Long Bá Key Art Illustration) ── */}
        <div className="relative md:w-[57.4%] flex items-end justify-center rounded-t-[34px] md:rounded-t-none md:rounded-l-[34px] overflow-hidden min-h-[280px] md:min-h-full bg-[#1e1718]">
          {/* Background Illustration Artwork */}
          <img
            src="/auth-character-art.jpg"
            alt="Chiến Long Bá - Hành Trình Huyền Thoại"
            className="w-full h-full object-cover object-top select-none pointer-events-none drop-shadow-[0_15px_30px_rgba(0,0,0,0.4)]"
          />

          {/* Subtle gradient blend on right/bottom edge */}
          <div className="absolute inset-y-0 right-0 w-14 bg-gradient-to-r from-transparent to-[#342a2b] pointer-events-none hidden md:block" />
          <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#342a2b] to-transparent pointer-events-none md:hidden" />
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
                  {mode === "login" ? "Đăng Nhập" : "Đăng Ký Tài Khoản"}
                </h2>
                <p className="text-[#8e7a7c] text-xs font-normal mt-1">
                  {mode === "login"
                    ? "Nhập tài khoản để kết nối máy chủ Chiến Long Bá"
                    : "Khởi tạo tài khoản mới để bắt đầu cuộc phiêu lưu"}
                </p>
              </div>

              {/* Form Inputs */}
              <form onSubmit={handleSubmit} className="space-y-3.5 mb-5">
                {/* Username Field */}
                <div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (formErrors.username) setFormErrors({ ...formErrors, username: undefined });
                    }}
                    placeholder={mode === "login" ? "Tên tài khoản" : "Tên tài khoản mới (3-20 ký tự)"}
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
                    placeholder="Mật khẩu"
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
                      placeholder="Xác nhận lại mật khẩu"
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
                    <span>Ghi nhớ đăng nhập</span>
                  </label>

                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() =>
                        toast({
                          title: "Quên mật khẩu",
                          description: "Vui lòng liên hệ Game Master hoặc quản trị viên để hỗ trợ lấy lại mật khẩu.",
                        })
                      }
                      className="text-[#28c3e1] text-xs font-medium hover:underline transition-colors"
                    >
                      Quên mật khẩu?
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
                    <span>{mode === "login" ? "Đăng Nhập" : "Tạo Tài Khoản"}</span>
                  )}
                </button>
              </form>

              {/* Footer Switch (Don't have account? Sign up / Log in) */}
              <div className="text-center text-xs text-[#8e7a7c] pt-4 border-t border-[#463537] mt-6">
                {mode === "login" ? (
                  <span>
                    Chưa có tài khoản?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("register");
                        setFormErrors({});
                      }}
                      className="text-[#28c3e1] font-semibold hover:underline cursor-pointer"
                    >
                      Đăng ký ngay
                    </button>
                  </span>
                ) : (
                  <span>
                    Đã có tài khoản?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("login");
                        setFormErrors({});
                      }}
                      className="text-[#28c3e1] font-semibold hover:underline cursor-pointer"
                    >
                      Đăng nhập
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
