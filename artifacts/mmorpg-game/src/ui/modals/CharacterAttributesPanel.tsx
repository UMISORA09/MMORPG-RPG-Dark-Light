import { memo, useState } from "react";
import * as THREE from "three";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { useGameStore } from "@/game/useGameStore";
import { playCombatSFX } from "@/audio/CombatSoundSynth";
import { useQueryClient } from "@tanstack/react-query";
import { getGetCharacterQueryKey, getGetCharactersQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { X, Shield, Swords, Zap, Sparkles, Heart, Plus, RotateCcw, Save } from "lucide-react";

export const CharacterAttributesPanel = memo(function CharacterAttributesPanel() {
  const activeModal = useGameWorldStore((s) => s.activeModal);
  const closeActiveModal = useGameWorldStore((s) => s.closeActiveModal);
  const activeCharacterId = useGameWorldStore((s) => s.activeCharacterId);
  const unallocatedStatPoints = useGameWorldStore((s) => s.unallocatedStatPoints);
  const playerStr = useGameWorldStore((s) => s.playerStr);
  const playerDex = useGameWorldStore((s) => s.playerDex);
  const playerIntel = useGameWorldStore((s) => s.playerIntel);
  const playerLuk = useGameWorldStore((s) => s.playerLuk);
  const playerVit = useGameWorldStore((s) => s.playerVit);
  const playerName = useGameWorldStore((s) => s.playerName);
  const playerClassName = useGameWorldStore((s) => s.playerClassName);
  const playerLevel = useGameWorldStore((s) => s.playerLevel);
  const addFloatingText = useGameWorldStore((s) => s.addFloatingText);
  const playerPosition = useGameWorldStore((s) => s.playerPosition);
  const updateBaseStats = useGameWorldStore((s) => s.updateBaseStats);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Temporary staging points before confirming
  const [spentStr, setSpentStr] = useState(0);
  const [spentDex, setSpentDex] = useState(0);
  const [spentInt, setSpentInt] = useState(0);
  const [spentLuk, setSpentLuk] = useState(0);
  const [spentVit, setSpentVit] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const totalSpent = spentStr + spentDex + spentInt + spentLuk + spentVit;
  const remainingPoints = Math.max(0, unallocatedStatPoints - totalSpent);

  if (activeModal !== "attributes") return null;

  const handleAddPoint = (stat: "str" | "dex" | "intel" | "luk" | "vit") => {
    if (remainingPoints <= 0) return;
    playCombatSFX("holy_bell", 0.3);

    if (stat === "str") setSpentStr((v) => v + 1);
    else if (stat === "dex") setSpentDex((v) => v + 1);
    else if (stat === "intel") setSpentInt((v) => v + 1);
    else if (stat === "luk") setSpentLuk((v) => v + 1);
    else if (stat === "vit") setSpentVit((v) => v + 1);
  };

  const handleReset = () => {
    setSpentStr(0);
    setSpentDex(0);
    setSpentInt(0);
    setSpentLuk(0);
    setSpentVit(0);
  };

  const handleConfirm = async () => {
    if (totalSpent === 0) return;
    setIsSaving(true);
    playCombatSFX("level_up_fanfare", 0.5);

    if (!activeCharacterId) {
      toast({ title: "Chưa chọn nhân vật!", variant: "destructive" });
      setIsSaving(false);
      return;
    }
    const charId = activeCharacterId;

    try {
      const res = await fetch(`/api/characters/${charId}/stats`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          str: spentStr,
          dex: spentDex,
          intel: spentInt,
          luk: spentLuk,
          vit: spentVit,
          statPoints: remainingPoints,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const char = data.character;

        updateBaseStats({
          str: char?.str ?? (playerStr + spentStr),
          dex: char?.dex ?? (playerDex + spentDex),
          intel: char?.intel ?? (playerIntel + spentInt),
          luk: char?.luk ?? (playerLuk + spentLuk),
          vit: char?.vit ?? (playerVit + spentVit),
          unallocatedStatPoints: char?.unallocatedStatPoints ?? remainingPoints,
          playerAtk: char?.atk,
          playerMatk: char?.matk,
          playerDef: char?.def,
          playerSpd: char?.spd,
          playerCritRate: char?.critRate,
          playerEvasion: char?.evasion,
          combatPower: char?.combatPower,
        });

        // Invalidate react query cache
        queryClient.invalidateQueries({ queryKey: getGetCharactersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetCharacterQueryKey(charId) });

        const newCP = char?.combatPower || data.combatPower || "mới";
        toast({
          title: "✨ Đã lưu chỉ số thành công!",
          description: `Lực chiến tăng lên: ${newCP}`,
        });

        addFloatingText(`✨ Lực chiến tăng: ${newCP}!`, playerPosition.clone().add(new THREE.Vector3(0, 2.5, 0)), "#00ff88");
        handleReset();
      } else {
        throw new Error("Server trả về lỗi");
      }
    } catch {
      // offline fallback
      updateBaseStats({
        str: playerStr + spentStr,
        dex: playerDex + spentDex,
        intel: playerIntel + spentInt,
        luk: playerLuk + spentLuk,
        vit: playerVit + spentVit,
        unallocatedStatPoints: remainingPoints,
      });
      addFloatingText(`✨ Đã phân bổ ${totalSpent} điểm tiềm năng!`, playerPosition.clone().add(new THREE.Vector3(0, 2.5, 0)), "#00f2ff");
      handleReset();
    } finally {
      setIsSaving(false);
    }
  };

  const statsConfig = [
    {
      id: "str" as const,
      name: "STR (Sức Mạnh)",
      baseVal: playerStr,
      spentVal: spentStr,
      icon: Swords,
      color: "text-rose-400",
      borderColor: "border-rose-500/40",
      desc: "+2.5 Vật công (ATK) & +5 Giáp vật lý mỗi điểm",
    },
    {
      id: "dex" as const,
      name: "DEX (Nhanh Nhẹn)",
      baseVal: playerDex,
      spentVal: spentDex,
      icon: Zap,
      color: "text-emerald-400",
      borderColor: "border-emerald-500/40",
      desc: "+1.5 Tốc độ đánh & +0.4% Né tránh (EVA) mỗi điểm",
    },
    {
      id: "intel" as const,
      name: "INT (Trí Tuệ)",
      baseVal: playerIntel,
      spentVal: spentInt,
      icon: Sparkles,
      color: "text-cyan-400",
      borderColor: "border-cyan-500/40",
      desc: "+3.0 Ma công (MATK) & +15 MP tối đa mỗi điểm",
    },
    {
      id: "luk" as const,
      name: "LUK (May Mắn)",
      baseVal: playerLuk,
      spentVal: spentLuk,
      icon: Shield,
      color: "text-yellow-400",
      borderColor: "border-yellow-500/40",
      desc: "+0.3% Tỉ lệ bạo kích (Crit) & tăng tỉ lệ rơi đồ hiếm",
    },
    {
      id: "vit" as const,
      name: "VIT (Thể Lực)",
      baseVal: playerVit,
      spentVal: spentVit,
      icon: Heart,
      color: "text-red-400",
      borderColor: "border-red-500/40",
      desc: "+25 HP tối đa & +1 Hồi phục HP/giây mỗi điểm",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl max-h-[92vh] bg-[#0f1420] border border-cyan-500/40 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,242,255,0.25)] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              📊 Phân Bổ Điểm Tiềm Năng (Attributes)
            </h2>
            <p className="text-xs text-slate-400">
              {playerName} • {playerClassName} Lv.{playerLevel}
            </p>
          </div>
          <button
            onClick={closeActiveModal}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Unallocated Points Badge */}
        <div className="px-6 py-3 bg-cyan-950/40 border-b border-cyan-500/30 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300">
            Điểm Tiềm Năng Chưa Dùng:
          </span>
          <span className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-mono font-black text-sm shadow-[0_0_12px_rgba(0,242,255,0.3)]">
            {remainingPoints} Điểm
          </span>
        </div>

        {/* 5 Stats Allocation Rows */}
        <div className="p-6 space-y-3 overflow-y-auto custom-scrollbar max-h-[50vh]">
          {statsConfig.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.id}
                className={`p-3.5 rounded-2xl bg-slate-900/60 border ${stat.borderColor} flex items-center justify-between gap-4`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center ${stat.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-white">
                        {stat.name}
                      </span>
                      <span className="font-mono text-sm font-black text-slate-200">
                        {stat.baseVal}
                        {stat.spentVal > 0 && (
                          <span className="text-emerald-400 ml-1">+{stat.spentVal}</span>
                        )}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">{stat.desc}</p>
                  </div>
                </div>

                {/* Plus Button */}
                <button
                  onClick={() => handleAddPoint(stat.id)}
                  disabled={remainingPoints <= 0}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition font-black text-sm cursor-pointer shrink-0 ${
                    remainingPoints > 0
                      ? "bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(0,242,255,0.4)] active:scale-95"
                      : "bg-slate-800 text-slate-600 cursor-not-allowed opacity-50"
                  }`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-900/40 flex items-center justify-between">
          <button
            onClick={handleReset}
            disabled={totalSpent === 0}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-40 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Hoàn Tác</span>
          </button>

          <button
            onClick={handleConfirm}
            disabled={totalSpent === 0 || isSaving}
            className="px-6 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition disabled:opacity-40 shadow-[0_0_15px_rgba(0,242,255,0.4)] cursor-pointer flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? "Đang Lưu..." : `[💾 LƯU CHỈ SỐ] (+${totalSpent} Điểm)`}</span>
          </button>
        </div>
      </div>
    </div>
  );
});

