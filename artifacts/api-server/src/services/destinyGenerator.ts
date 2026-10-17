/**
 * THUẬT TOÁN GACHA THIÊN MỆNH & KHÍ LINH HỘ THỂ
 * 5 Cấp Phẩm Chất:
 * - F - Thường (Gray): 65% (0 - 649)
 * - C - Trung Cấp (Green): 23% (650 - 879)
 * - A - Cao Cấp (Blue): 9% (880 - 969)
 * - S - Huyền Thoại (Orange): 2.9% (970 - 998)
 * - Miracle - Kì Tích (Red/Pink): 0.1% (999) - Tỉ lệ 1/1000 cực hiếm
 */

export type DestinyTier = "F" | "C" | "A" | "S" | "Miracle";

export interface DestinyItem {
  id: string;
  name: string;
  type: "talent" | "aura";
  tier: DestinyTier;
  tierName: string;
  buff: string;
  desc: string;
  color: string;
  glowHex: string;
  auraColor?: string;
}

export const TIER_CONFIG: Record<DestinyTier, { name: string; color: string; border: string; glow: string; chance: number }> = {
  F: { name: "Thường", color: "#94a3b8", border: "border-slate-500/50", glow: "rgba(148, 163, 184, 0.3)", chance: 0.65 },
  C: { name: "Trung Cấp", color: "#22c55e", border: "border-emerald-500/60", glow: "rgba(34, 197, 94, 0.4)", chance: 0.23 },
  A: { name: "Cao Cấp", color: "#38bdf8", border: "border-cyan-500/60", glow: "rgba(56, 189, 248, 0.45)", chance: 0.09 },
  S: { name: "Huyền Thoại", color: "#f97316", border: "border-amber-500/80", glow: "rgba(249, 115, 22, 0.6)", chance: 0.029 },
  Miracle: { name: "Kì Tích", color: "#ec4899", border: "border-rose-500", glow: "rgba(236, 72, 153, 0.8)", chance: 0.001 },
};

// --- KHO THIÊN PHÚ THEO PHẨM CHẤT ---
export const TALENT_POOL: Record<DestinyTier, DestinyItem[]> = {
  Miracle: [
    {
      id: "talent_miracle_god",
      name: "Thần Ma Bất Diệt Thể",
      type: "talent",
      tier: "Miracle",
      tierName: "Kì Tích (1/1000)",
      buff: "+100% Sát Thương, Miễn Khống Chế",
      desc: "Thần thể thượng cổ tối thượng, đòn đánh chí mạng hồi 100% HP và miễn nhiễm mọi hiệu ứng xấu.",
      color: "#ec4899",
      glowHex: "#f43f5e",
    },
    {
      id: "talent_miracle_void",
      name: "Hư Không Thôn Phệ Quyết",
      type: "talent",
      tier: "Miracle",
      tierName: "Kì Tích (1/1000)",
      buff: "Hố Đen Hút Quái & +50% Tốc Chạy",
      desc: "Mọi đòn đánh thứ 3 mở ra hố đen nuốt chửng quái vật và gia tăng 50% tốc độ di chuyển vĩnh viễn.",
      color: "#ec4899",
      glowHex: "#e11d48",
    },
  ],
  S: [
    {
      id: "talent_legend_thunder",
      name: "Cửu Thiên Cuồng Lôi Quyết",
      type: "talent",
      tier: "S",
      tierName: "Huyền Thoại (2.9%)",
      buff: "+40% Sát Thương Lôi & Gọi Sấm",
      desc: "25% xác suất kích hoạt tia sét Cửu Thiên trừng phạt đánh tan tác quái vật xung quanh.",
      color: "#f97316",
      glowHex: "#f59e0b",
    },
    {
      id: "talent_legend_titan",
      name: "Thái Cổ Kim Cang Thân",
      type: "talent",
      tier: "S",
      tierName: "Huyền Thoại (2.9%)",
      buff: "+40% HP & Giảm 30% Sát Thương",
      desc: "Kim thân vững như bàn thạch, hấp thụ và phản trả 30% sát thương từ mọi kẻ địch.",
      color: "#f97316",
      glowHex: "#d97706",
    },
    {
      id: "talent_legend_shadow",
      name: "Vô Ảnh Huyễn Linh Bộ",
      type: "talent",
      tier: "S",
      tierName: "Huyền Thoại (2.9%)",
      buff: "+35% Tốc Chạy & 30% Phân Thân",
      desc: "Lướt gió để lại phân thân ảo ảnh tự động tấn công kẻ thù với 50% sức mạnh.",
      color: "#f97316",
      glowHex: "#ea580c",
    },
  ],
  A: [
    {
      id: "talent_epic_fury",
      name: "Cuồng Nộ Chiến Ý",
      type: "talent",
      tier: "A",
      tierName: "Cao Cấp (9%)",
      buff: "+20% Sát Thương Kỹ Năng",
      desc: "Đòn đánh thứ 3 phát nổ diện rộng gây chấn động.",
      color: "#38bdf8",
      glowHex: "#0284c7",
    },
    {
      id: "talent_epic_iron",
      name: "Kim Cang Hộ Thể",
      type: "talent",
      tier: "A",
      tierName: "Cao Cấp (9%)",
      buff: "+20% HP & -15% Sát Thương",
      desc: "Tăng cường giáp cốt vững vàng trước đòn đánh lén.",
      color: "#38bdf8",
      glowHex: "#0ea5e9",
    },
    {
      id: "talent_epic_wind",
      name: "Tật Phong Lưu Ảnh",
      type: "talent",
      tier: "A",
      tierName: "Cao Cấp (9%)",
      buff: "+18% Tốc Chạy & +10% Né",
      desc: "Thân pháp biến hóa né tránh các đòn chí tử.",
      color: "#38bdf8",
      glowHex: "#06b6d4",
    },
    {
      id: "talent_epic_vamp",
      name: "Huyết Ma Nghịch Chuyển",
      type: "talent",
      tier: "A",
      tierName: "Cao Cấp (9%)",
      buff: "Hồi 8% HP Khi Diệt Quái",
      desc: "Hấp thụ linh hồn đối thủ để hồi phục sinh lực.",
      color: "#38bdf8",
      glowHex: "#6366f1",
    },
  ],
  C: [
    {
      id: "talent_rare_blade",
      name: "Cương Đao Quyết",
      type: "talent",
      tier: "C",
      tierName: "Trung Cấp (23%)",
      buff: "+10% Sát Thương Cơ Bản",
      desc: "Luyện hóa đường kiếm uy lực và sắc bén hơn.",
      color: "#22c55e",
      glowHex: "#16a34a",
    },
    {
      id: "talent_rare_vitality",
      name: "Sinh Khí Dồi Dào",
      type: "talent",
      tier: "C",
      tierName: "Trung Cấp (23%)",
      buff: "+12% Sinh Lực Tối Đa",
      desc: "Thể chất cường kiện, tăng khả năng sống sót.",
      color: "#22c55e",
      glowHex: "#15803d",
    },
    {
      id: "talent_rare_swift",
      name: "Khinh Thân Quyết",
      type: "talent",
      tier: "C",
      tierName: "Trung Cấp (23%)",
      buff: "+10% Tốc Độ Di Chuyển",
      desc: "Bước chân nhẹ nhàng lướt trên mặt đất.",
      color: "#22c55e",
      glowHex: "#10b981",
    },
    {
      id: "talent_rare_focus",
      name: "Tập Trung Chi Nhãn",
      type: "talent",
      tier: "C",
      tierName: "Trung Cấp (23%)",
      buff: "+5% Tỉ Lệ Bạo Kích",
      desc: "Ngắm chuẩn điểm yếu của mục tiêu.",
      color: "#22c55e",
      glowHex: "#059669",
    },
  ],
  F: [
    {
      id: "talent_common_strike",
      name: "Thao Thiết Quyền",
      type: "talent",
      tier: "F",
      tierName: "Thường (65%)",
      buff: "+5 Sát Thương",
      desc: "Kỹ năng quyền pháp cơ bản của tân thủ.",
      color: "#94a3b8",
      glowHex: "#64748b",
    },
    {
      id: "talent_common_tough",
      name: "Cường Bì Thuật",
      type: "talent",
      tier: "F",
      tierName: "Thường (65%)",
      buff: "+5 Giáp Cơ Bản",
      desc: "Rèn luyện da thịt chống đỡ va chạm.",
      color: "#94a3b8",
      glowHex: "#64748b",
    },
    {
      id: "talent_common_walk",
      name: "Bộ Pháp Sơ Cấp",
      type: "talent",
      tier: "F",
      tierName: "Thường (65%)",
      buff: "+3% Tốc Chạy",
      desc: "Cách bước chân nhanh nhẹn căn bản.",
      color: "#94a3b8",
      glowHex: "#64748b",
    },
    {
      id: "talent_common_heal",
      name: "Dưỡng Khí Thuật",
      type: "talent",
      tier: "F",
      tierName: "Thường (65%)",
      buff: "Hồi 1 HP / 3s",
      desc: "Điều hòa hơi thở phục hồi sinh mệnh.",
      color: "#94a3b8",
      glowHex: "#64748b",
    },
  ],
};

// --- KHO KHÍ LINH HỘ THỂ & HÀO QUANG (AURAS) ---
export const AURA_POOL: Record<DestinyTier, DestinyItem[]> = {
  Miracle: [
    {
      id: "aura_miracle_celestial",
      name: "Thần Long Cổ Ấn",
      type: "aura",
      tier: "Miracle",
      tierName: "Kì Tích (1/1000)",
      buff: "+500 HP, +200 MP, Bốc Cháy Quái",
      desc: "Hào quang Thần Long Hồng Hoang rực lửa xoay quanh nhân vật, thiêu đốt kẻ địch lại gần.",
      color: "#ec4899",
      glowHex: "#f43f5e",
      auraColor: "rgba(244, 63, 94, 0.8)",
    },
    {
      id: "aura_miracle_phoenix",
      name: "Phượng Hoàng Niết Bàn",
      type: "aura",
      tier: "Miracle",
      tierName: "Kì Tích (1/1000)",
      buff: "Tự Động Hồi Sinh Khi Tử Trận",
      desc: "Lửa Phượng Hoàng bao bọc, khi HP về 0 lập tức hồi sinh với 50% HP (cooldown 120s).",
      color: "#ec4899",
      glowHex: "#fb7185",
      auraColor: "rgba(251, 113, 133, 0.85)",
    },
  ],
  S: [
    {
      id: "aura_legend_dragon",
      name: "Hoàng Long Thần Châu",
      type: "aura",
      tier: "S",
      tierName: "Huyền Thoại (2.9%)",
      buff: "+250 HP, +100 MP, Hào Quang Rồng",
      desc: "Quả cầu rồng vàng bay lượn hộ mệnh quanh nhân vật, phát tán ánh hoàng kim.",
      color: "#f97316",
      glowHex: "#f59e0b",
      auraColor: "rgba(245, 158, 11, 0.7)",
    },
    {
      id: "aura_legend_thunderbird",
      name: "Tử Lôi Điểu Phù",
      type: "aura",
      tier: "S",
      tierName: "Huyền Thoại (2.9%)",
      buff: "+12% Bạo Kích & Sấm Sét Tím",
      desc: "Linh điểu sấm sét tím bảo hộ, thi thoảng phóng điện giật đối thủ gần nhất.",
      color: "#f97316",
      glowHex: "#a855f7",
      auraColor: "rgba(168, 85, 247, 0.7)",
    },
    {
      id: "aura_legend_whitetiger",
      name: "Bạch Hổ Thần Phù",
      type: "aura",
      tier: "S",
      tierName: "Huyền Thoại (2.9%)",
      buff: "+30 Sát Thương Cơ Bản",
      desc: "Hào quang dũng mãnh của thần thú Bạch Hổ gia tăng uy lực tuyệt đỉnh.",
      color: "#f97316",
      glowHex: "#ef4444",
      auraColor: "rgba(239, 68, 68, 0.7)",
    },
  ],
  A: [
    {
      id: "aura_epic_dragon",
      name: "Long Hồn Châu",
      type: "aura",
      tier: "A",
      tierName: "Cao Cấp (9%)",
      buff: "+120 HP & +60 MP",
      desc: "Hào quang rồng xanh lam bao bọc sinh mệnh.",
      color: "#38bdf8",
      glowHex: "#0284c7",
      auraColor: "rgba(56, 189, 248, 0.5)",
    },
    {
      id: "aura_epic_thunder",
      name: "Lôi Điểu Phù",
      type: "aura",
      tier: "A",
      tierName: "Cao Cấp (9%)",
      buff: "+6% Tỉ Lệ Bạo Kích",
      desc: "Tia sét tím quấn quanh vũ khí nhân vật.",
      color: "#38bdf8",
      glowHex: "#8b5cf6",
      auraColor: "rgba(139, 92, 246, 0.5)",
    },
    {
      id: "aura_epic_tiger",
      name: "Bạch Hổ Ấn",
      type: "aura",
      tier: "A",
      tierName: "Cao Cấp (9%)",
      buff: "+15 Sát Thương Cơ Bản",
      desc: "Hào quang mãnh hổ gia tăng lực chém.",
      color: "#38bdf8",
      glowHex: "#f43f5e",
      auraColor: "rgba(244, 63, 94, 0.5)",
    },
    {
      id: "aura_epic_tortoise",
      name: "Huyền Vũ Thuẫn",
      type: "aura",
      tier: "A",
      tierName: "Cao Cấp (9%)",
      buff: "+18 Phòng Thủ Cơ Bản",
      desc: "Mai rùa bích lục chắn đòn đánh lén.",
      color: "#38bdf8",
      glowHex: "#10b981",
      auraColor: "rgba(16, 185, 129, 0.5)",
    },
  ],
  C: [
    {
      id: "aura_rare_orb",
      name: "Bích Ngọc Linh Châu",
      type: "aura",
      tier: "C",
      tierName: "Trung Cấp (23%)",
      buff: "+60 HP Khởi Điểm",
      desc: "Hào quang ngọc bích tỏa sáng dịu mát quanh thân.",
      color: "#22c55e",
      glowHex: "#16a34a",
      auraColor: "rgba(34, 197, 94, 0.35)",
    },
    {
      id: "aura_rare_spark",
      name: "Tia Sét Lạc Hà",
      type: "aura",
      tier: "C",
      tierName: "Trung Cấp (23%)",
      buff: "+3% Tỉ Lệ Bạo Kích",
      desc: "Tia điện quang nhỏ nhấp nháy tạo sự uy hiếp.",
      color: "#22c55e",
      glowHex: "#0ea5e9",
      auraColor: "rgba(14, 165, 233, 0.35)",
    },
    {
      id: "aura_rare_stone",
      name: "Hộ Mệnh Thạch",
      type: "aura",
      tier: "C",
      tierName: "Trung Cấp (23%)",
      buff: "+8 Phòng Thủ Cơ Bản",
      desc: "Hào quang đá hộ thể giảm chấn động.",
      color: "#22c55e",
      glowHex: "#ca8a04",
      auraColor: "rgba(202, 138, 4, 0.35)",
    },
  ],
  F: [
    {
      id: "aura_common_firefly",
      name: "Đom Đóm Phát Quang",
      type: "aura",
      tier: "F",
      tierName: "Thường (65%)",
      buff: "+20 HP",
      desc: "Vài đốm sáng nhỏ lập lòe bay theo sau.",
      color: "#94a3b8",
      glowHex: "#64748b",
      auraColor: "rgba(148, 163, 184, 0.25)",
    },
    {
      id: "aura_common_wind",
      name: "Làn Gió Thoảng",
      type: "aura",
      tier: "F",
      tierName: "Thường (65%)",
      buff: "+2 Thân Pháp",
      desc: "Vệt khí trắng mờ nhạt thổi nhẹ dưới chân.",
      color: "#94a3b8",
      glowHex: "#64748b",
      auraColor: "rgba(148, 163, 184, 0.25)",
    },
    {
      id: "aura_common_dust",
      name: "Tàn Tro Cổ Điển",
      type: "aura",
      tier: "F",
      tierName: "Thường (65%)",
      buff: "+2 Sát Thương",
      desc: "Hạt bụi xám mờ nhạt bao bọc vũ khí.",
      color: "#94a3b8",
      glowHex: "#64748b",
      auraColor: "rgba(148, 163, 184, 0.25)",
    },
  ],
};

/**
 * Thuật toán roll phẩm chất theo phân phối xác suất
 * - 0 - 649 (65%): F
 * - 650 - 879 (23%): C
 * - 880 - 969 (9%): A
 * - 970 - 998 (2.9%): S
 * - 999 (0.1%): Miracle
 */
export function rollTier(): DestinyTier {
  const roll = Math.floor(Math.random() * 1000);
  if (roll < 650) return "F";
  if (roll < 880) return "C";
  if (roll < 970) return "A";
  if (roll < 999) return "S";
  return "Miracle";
}

/**
 * Roll ngẫu nhiên 1 vật phẩm từ kho theo phẩm chất
 */
export function rollItemFromPool(type: "talent" | "aura"): DestinyItem {
  const tier = rollTier();
  const pool = type === "talent" ? TALENT_POOL[tier] : AURA_POOL[tier];
  const item = pool[Math.floor(Math.random() * pool.length)];
  return { ...item };
}

/**
 * Roll trọn bộ Thiên Mệnh (4 Thiên Phú + 4 Khí Linh)
 */
export function rollFullDestiny() {
  const talents: DestinyItem[] = [];
  const auras: DestinyItem[] = [];

  for (let i = 0; i < 4; i++) {
    talents.push(rollItemFromPool("talent"));
    auras.push(rollItemFromPool("aura"));
  }

  const hasMiracle = [...talents, ...auras].some((i) => i.tier === "Miracle");
  const hasLegendary = [...talents, ...auras].some((i) => i.tier === "S");

  return {
    talents,
    auras,
    talentIds: talents.map((t) => t.id),
    auraIds: auras.map((a) => a.id),
    hasMiracle,
    hasLegendary,
  };
}
