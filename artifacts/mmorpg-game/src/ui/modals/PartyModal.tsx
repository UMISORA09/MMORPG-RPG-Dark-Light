// ==============================================================================
// PartyModal.tsx — Giao Diện Quản Lý Tổ Đội & Đồng Hành (Milestone 4)
// Standard Dark Fantasy Split-Screen Card & Cinema Slate Teal UI
// Quy chuẩn thiết kế: clb-dark-fantasy-ui (#342a2b, #4a383a, #5d4648, #28c3e1)
// ==============================================================================

import { memo, useState, useEffect, useCallback } from "react";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { playCombatSFX, playButtonClick } from "@/audio/CombatSoundSynth";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  UserPlus,
  LogOut,
  Crown,
  Shield,
  HeartPulse,
  Sparkles,
  X,
  Swords,
  Target,
  Bot,
  Zap,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

export interface PartyMember {
  characterId: number;
  name: string;
  classId: string;
  level: number;
  gender: "male" | "female";
  hp: number;
  maxHp: number;
  isLeader: boolean;
  isBot?: boolean;
}

export interface PartyGroup {
  id: string;
  leaderId: number;
  leaderName: string;
  members: PartyMember[];
  dungeonDifficulty?: "normal" | "hard" | "nightmare";
}

export interface PartyModalProps {
  characterId?: number;
  onClose?: () => void;
}

export const PartyModal = memo(function PartyModal({
  characterId: propCharacterId,
  onClose,
}: PartyModalProps) {
  const activeModal = useGameWorldStore((s) => s.activeModal);
  const closeActiveModal = useGameWorldStore((s) => s.closeActiveModal);

  const storeCharId = useGameWorldStore((s) => s.activeCharacterId);
  const playerName = useGameWorldStore((s) => s.playerName);
  const playerClassId = useGameWorldStore((s) => s.playerClassId);
  const playerLevel = useGameWorldStore((s) => s.playerLevel);
  const playerGender = useGameWorldStore((s) => s.playerGender);
  const playerHealth = useGameWorldStore((s) => s.playerHealth);
  const playerMaxHealth = useGameWorldStore((s) => s.playerMaxHealth);

  const characterId = propCharacterId ?? storeCharId ?? 1;

  const { toast } = useToast();

  const [party, setParty] = useState<PartyGroup | null>(null);
  const [hasParty, setHasParty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const isOpen = activeModal === "party" || !!propCharacterId;

  const handleClose = useCallback(() => {
    playButtonClick();
    if (onClose) {
      onClose();
    } else {
      closeActiveModal();
    }
  }, [onClose, closeActiveModal]);

  // Fetch current party status from backend
  const fetchParty = useCallback(async () => {
    if (!characterId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/party/${characterId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(typeof window !== "undefined" && (localStorage.getItem("clb_token") || localStorage.getItem("token"))
            ? { Authorization: `Bearer ${(localStorage.getItem("clb_token") || localStorage.getItem("token"))}` }
            : {}),
        },
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`Mã lỗi HTTP: ${res.status}`);
      }

      const data = await res.json();
      if (data.hasParty && data.party) {
        setHasParty(true);
        setParty(data.party);
      } else {
        setHasParty(false);
        setParty(null);
      }
    } catch {
      // Keep previous state on error
    } finally {
      setLoading(false);
    }
  }, [characterId]);

  useEffect(() => {
    if (isOpen) {
      fetchParty();
    }
  }, [isOpen, fetchParty]);

  // Listen to external party updates
  useEffect(() => {
    const handler = () => {
      fetchParty();
    };
    window.addEventListener("clb-party-updated", handler);
    return () => window.removeEventListener("clb-party-updated", handler);
  }, [fetchParty]);

  // Broadcast party update to HUD & other components
  const notifyPartyUpdated = () => {
    window.dispatchEvent(new CustomEvent("clb-party-updated"));
  };

  // 1. Tạo tổ đội mới
  const handleCreateParty = async () => {
    try {
      setActionLoading(true);
      playCombatSFX("holy_bell", 0.5);

      const res = await fetch("/api/party/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(typeof window !== "undefined" && (localStorage.getItem("clb_token") || localStorage.getItem("token"))
            ? { Authorization: `Bearer ${(localStorage.getItem("clb_token") || localStorage.getItem("token"))}` }
            : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          characterId,
          name: playerName || "Dũng Sĩ Long Tộc",
          classId: playerClassId || "fighter",
          level: playerLevel || 1,
          gender: playerGender || "male",
          hp: playerHealth || 500,
          maxHp: playerMaxHealth || 500,
        }),
      });

      const data = await res.json();
      if (data.success && data.party) {
        setHasParty(true);
        setParty(data.party);
        toast({
          title: "Thành Lập Tổ Đội Thành Công!",
          description: "Kích hoạt Buff: +15% EXP quái vật & +10% Lực Chiến.",
        });
        playCombatSFX("dragon_roar", 0.5);
        notifyPartyUpdated();
      } else {
        toast({
          variant: "destructive",
          title: "Không thể tạo tổ đội",
          description: data.error || "Vui lòng thử lại sau.",
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Lỗi kết nối",
        description: err?.message || "Không thể kết nối máy chủ.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Chiêu mộ Bot đồng hành (Tank hoặc Healer)
  const handleInviteBot = async (botType: "tank" | "healer") => {
    try {
      setActionLoading(true);
      playCombatSFX("blade_slash", 0.4);

      const res = await fetch("/api/party/invite-bot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(typeof window !== "undefined" && (localStorage.getItem("clb_token") || localStorage.getItem("token"))
            ? { Authorization: `Bearer ${(localStorage.getItem("clb_token") || localStorage.getItem("token"))}` }
            : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          characterId,
          botType,
        }),
      });

      const data = await res.json();
      if (data.success && data.party) {
        setParty(data.party);
        toast({
          title: "Chiêu Mộ Thành Công!",
          description: data.message,
        });
        playCombatSFX("holy_bell", 0.4);
        notifyPartyUpdated();
      } else {
        toast({
          variant: "destructive",
          title: "Chiêu mộ thất bại",
          description: data.error || "Tổ đội đã đầy hoặc chưa tạo đội.",
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Lỗi kết nối",
        description: err?.message || "Không thể kết nối máy chủ.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Rời tổ đội
  const handleLeaveParty = async () => {
    try {
      setActionLoading(true);
      playCombatSFX("coin_chime", 0.3);

      const res = await fetch("/api/party/leave", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(typeof window !== "undefined" && (localStorage.getItem("clb_token") || localStorage.getItem("token"))
            ? { Authorization: `Bearer ${(localStorage.getItem("clb_token") || localStorage.getItem("token"))}` }
            : {}),
        },
        credentials: "include",
        body: JSON.stringify({ characterId }),
      });

      const data = await res.json();
      if (data.success) {
        setHasParty(false);
        setParty(null);
        toast({
          title: "Đã Rời Tổ Đội",
          description: "Đã thoát khỏi đội và hủy buff tổ đội.",
        });
        notifyPartyUpdated();
      } else {
        toast({
          variant: "destructive",
          title: "Thao tác thất bại",
          description: data.error || "Không thể rời đội.",
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Lỗi kết nối",
        description: err?.message || "Không thể kết nối máy chủ.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  // Helper icons & titles by class
  const getClassBadge = (classId: string) => {
    switch (classId?.toLowerCase()) {
      case "tank":
        return { label: "Hộ Vệ", icon: <Shield className="w-3.5 h-3.5 text-amber-400" />, color: "text-amber-400 border-amber-500/40 bg-amber-950/40" };
      case "gunner":
        return { label: "Thánh Nữ / Xạ Thủ", icon: <HeartPulse className="w-3.5 h-3.5 text-emerald-400" />, color: "text-emerald-400 border-emerald-500/40 bg-emerald-950/40" };
      case "fighter":
        return { label: "Chiến Binh", icon: <Swords className="w-3.5 h-3.5 text-cyan-400" />, color: "text-cyan-400 border-cyan-500/40 bg-cyan-950/40" };
      case "assassin":
        return { label: "Sát Thủ", icon: <Target className="w-3.5 h-3.5 text-rose-400" />, color: "text-rose-400 border-rose-500/40 bg-rose-950/40" };
      default:
        return { label: "Dũng Sĩ", icon: <Zap className="w-3.5 h-3.5 text-purple-400" />, color: "text-purple-400 border-purple-500/40 bg-purple-950/40" };
    }
  };

  const members = party?.members || [];
  const emptySlotsCount = Math.max(0, 4 - members.length);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="relative w-full max-w-2xl bg-[#342a2b] border border-[#5d4648] rounded-[32px] shadow-[0_30px_90px_rgba(0,0,0,0.85)] p-5 sm:p-7 text-white flex flex-col gap-5 overflow-hidden">
        
        {/* Background decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between pb-3 border-b border-[#5d4648] relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#4a383a] border border-[#5d4648] text-[#28c3e1] shadow-[0_0_15px_rgba(40,195,225,0.3)]">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-wide uppercase text-white flex items-center gap-2">
                <span>Tổ Đội & Đồng Hành</span>
                {hasParty && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-400 text-cyan-300 font-mono font-bold animate-pulse">
                    {members.length}/4 Thành Viên
                  </span>
                )}
              </h2>
              <p className="text-xs text-[#8e7a7c]">
                Hợp lực săn quái đại lục, chiêu mộ Bot hỗ trợ và kích hoạt Buff EXP toàn đội.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                playButtonClick();
                fetchParty();
              }}
              disabled={loading}
              className="p-2 rounded-full bg-[#4a383a] hover:bg-[#5d4648] border border-[#5d4648] text-[#8e7a7c] hover:text-white transition cursor-pointer"
              title="Làm mới trạng thái đội"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#28c3e1]" : ""}`} />
            </button>
            <button
              onClick={handleClose}
              className="p-2 rounded-full bg-[#4a383a] hover:bg-[#5d4648] border border-[#5d4648] text-[#8e7a7c] hover:text-white transition cursor-pointer"
              title="Đóng bảng tổ đội"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── PROMINENT ACTIVE BUFF STATUS BADGE ── */}
        <div
          className={`relative p-3.5 sm:p-4 rounded-2xl border transition-all duration-300 z-10 ${
            hasParty
              ? "bg-gradient-to-r from-cyan-950/70 via-[#4a383a] to-emerald-950/70 border-cyan-400/80 shadow-[0_0_25px_rgba(40,195,225,0.35)]"
              : "bg-[#4a383a]/60 border-[#5d4648]"
          }`}
        >
          <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl border ${
                  hasParty
                    ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(40,195,225,0.5)] animate-pulse"
                    : "bg-[#342a2b] border-[#5d4648] text-[#8e7a7c]"
                }`}
              >
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-black tracking-wider uppercase ${
                      hasParty ? "text-[#28c3e1]" : "text-white"
                    }`}
                  >
                    {hasParty ? "BUFF TỔ ĐỘI ĐANG KÍCH HOẠT" : "QUYỀN LỢI BUFF TỔ ĐỘI"}
                  </span>
                  {hasParty ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      HIỆU LỰC
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-600 text-slate-400 text-[10px] font-mono font-bold">
                      CHƯA KÍCH HOẠT
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-200 mt-0.5">
                  {hasParty ? (
                    <span className="font-medium">
                      Nhận thêm <strong className="text-amber-300 font-black">+15% EXP</strong> từ toàn bộ quái vật dã ngoại, phó bản hầm ngục và tăng <strong className="text-cyan-300 font-black">+10% Lực Chiến</strong>.
                    </span>
                  ) : (
                    <span className="text-[#8e7a7c]">
                      Tạo tổ đội hoặc tham gia cùng đồng đội để kích hoạt ngay thưởng <strong className="text-amber-300">+15% EXP</strong> kinh nghiệm.
                    </span>
                  )}
                </p>
              </div>
            </div>

            {hasParty && (
              <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#28c3e1]/20 border border-[#28c3e1] text-[#28c3e1] font-mono font-black text-xs shadow-[0_0_15px_rgba(40,195,225,0.3)]">
                <Zap className="w-3.5 h-3.5 fill-[#28c3e1]" />
                <span>+15% EXP</span>
              </div>
            )}
          </div>
        </div>

        {/* ── MEMBERS GRID (4 SLOTS) ── */}
        <div className="space-y-2.5 z-10">
          <div className="flex items-center justify-between text-xs text-[#8e7a7c] px-1 font-bold">
            <span>DANH SÁCH THÀNH VIÊN (TỐI ĐA 4 NGƯỜI)</span>
            <span>{members.length} / 4 Ô</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Render Existing Members */}
            {members.map((member, idx) => {
              const badge = getClassBadge(member.classId);
              const hpPct = Math.max(0, Math.min(100, (member.hp / Math.max(1, member.maxHp)) * 100));

              return (
                <div
                  key={member.characterId || idx}
                  className={`relative p-3.5 rounded-2xl bg-[#4a383a] border transition-all ${
                    member.isLeader
                      ? "border-2 border-[#28c3e1] shadow-[0_0_20px_rgba(40,195,225,0.25)]"
                      : "border-[#5d4648] hover:border-[#8e7a7c]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="relative w-10 h-10 rounded-xl bg-[#342a2b] border border-[#5d4648] flex items-center justify-center font-bold text-lg shadow-inner">
                        {member.isBot ? (
                          <Bot className="w-5 h-5 text-[#28c3e1]" />
                        ) : (
                          <span>{member.gender === "female" ? "🧝‍♀️" : "⚔️"}</span>
                        )}
                        {member.isLeader && (
                          <div
                            className="absolute -top-1.5 -left-1.5 p-0.5 rounded-full bg-amber-500 text-black shadow"
                            title="Đội Trưởng"
                          >
                            <Crown className="w-3 h-3 fill-black" />
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-white truncate max-w-[120px]">
                            {member.name}
                          </span>
                          {member.isBot && (
                            <span className="px-1.5 py-0.2 rounded bg-purple-950/80 border border-purple-400 text-purple-300 font-mono text-[9px] font-bold">
                              BOT
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-xs font-bold text-amber-300">
                            Lv.{member.level}
                          </span>
                          <span className="text-[#8e7a7c] text-[10px]">•</span>
                          <span className={`text-[10px] font-bold flex items-center gap-1 px-1.5 py-0.2 rounded border ${badge.color}`}>
                            {badge.icon}
                            <span>{badge.label}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      {member.isLeader && (
                        <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider block">
                          Đội Trưởng
                        </span>
                      )}
                    </div>
                  </div>

                  {/* HP Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
                      <span className="flex items-center gap-1 text-rose-300">
                        <HeartPulse className="w-3 h-3 text-rose-400" />
                        <span>Sinh Lực</span>
                      </span>
                      <span className="font-bold text-rose-200">
                        {member.hp} / {member.maxHp}
                      </span>
                    </div>
                    <div className="w-full bg-[#342a2b] rounded-full h-2 border border-slate-700 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-full transition-all duration-300"
                        style={{ width: `${hpPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Render Empty Slots */}
            {Array.from({ length: emptySlotsCount }).map((_, emptyIdx) => {
              const slotNum = members.length + emptyIdx + 1;
              return (
                <div
                  key={`empty_${emptyIdx}`}
                  className="p-3.5 rounded-2xl bg-[#4a383a]/30 border-2 border-dashed border-[#5d4648] flex flex-col items-center justify-center gap-2 min-h-[110px] text-center"
                >
                  <div className="w-8 h-8 rounded-full bg-[#342a2b] border border-[#5d4648] flex items-center justify-center text-[#8e7a7c]">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#8e7a7c] block">
                      Vị Trí Trống ({slotNum}/4)
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {hasParty ? "Sẵn sàng đón tiếp thành viên" : "Chưa thành lập đội"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── ACTION CONTROLS ── */}
        <div className="pt-2 border-t border-[#5d4648] flex flex-col sm:flex-row items-center justify-between gap-3 z-10">
          {!hasParty ? (
            /* CREATE PARTY BUTTON */
            <div className="w-full flex items-center gap-3">
              <button
                onClick={handleCreateParty}
                disabled={actionLoading}
                className="w-full py-3.5 rounded-full bg-[#28c3e1] hover:brightness-110 text-[#1c161a] font-black text-sm tracking-wider uppercase shadow-[0_0_25px_rgba(40,195,225,0.45)] transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50"
              >
                <Crown className="w-4 h-4 fill-[#1c161a]" />
                <span>Thành Lập Tổ Đội (+15% EXP)</span>
              </button>
            </div>
          ) : (
            /* IN PARTY ACTIONS */
            <>
              {/* Bot Companion Recruitment */}
              {members.length < 4 ? (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleInviteBot("tank")}
                    disabled={actionLoading || members.length >= 4}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-full bg-[#4a383a] hover:bg-[#5d4648] border border-amber-500/50 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
                    title="Chiêu mộ Bot Hộ Vệ Thanh Long (Tank, 850 HP)"
                  >
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    <span>Mời Bot Tank</span>
                  </button>
                  <button
                    onClick={() => handleInviteBot("healer")}
                    disabled={actionLoading || members.length >= 4}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-full bg-[#4a383a] hover:bg-[#5d4648] border border-emerald-500/50 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
                    title="Chiêu mộ Bot Thánh Nữ Trị Liệu (Healer, 850 HP)"
                  >
                    <HeartPulse className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Mời Bot Healer</span>
                  </button>
                </div>
              ) : (
                <div className="text-xs text-amber-300 font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-950/40 border border-amber-600/40">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Đội hình đã đủ 4/4 thành viên</span>
                </div>
              )}

              {/* Leave Party Button */}
              <button
                onClick={handleLeaveParty}
                disabled={actionLoading}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-rose-950/60 hover:bg-rose-900 border border-rose-500/50 text-rose-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50 shadow-[0_0_15px_rgba(239,68,68,0.25)]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Rời Tổ Đội</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

export default PartyModal;
