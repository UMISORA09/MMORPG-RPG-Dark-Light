import { DestinySlotItem, DestinyTier } from "@/components/DestinyRandomizer";

export function rollTier(): DestinyTier {
  const roll = Math.floor(Math.random() * 1000);
  if (roll < 650) return "F"; // 65%
  if (roll < 880) return "C"; // 23%
  if (roll < 970) return "A"; // 9%
  if (roll < 999) return "S"; // 2.9%
  return "Miracle"; // 0.1% (1/1000)
}

const TALENT_POOLS: Record<DestinyTier, DestinySlotItem[]> = {
  Miracle: [
    {
      id: "talent_miracle_god",
      name: "Thần Ma Bất Diệt Thể",
      type: "talent",
      tier: "Miracle",
      tierName: "Kì Tích (1/1000)",
      buff: "+100% Sát Thương, Miễn Khống Chế",
      desc: "Thần thể thượng cổ, chí mạng hồi 100% HP và miễn nhiễm khống chế.",
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
      desc: "Mở hố đen nuốt chửng quái vật và tăng 50% tốc độ di chuyển vĩnh viễn.",
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
      desc: "25% xác suất gọi sấm sét trừng phạt đánh tan tác quái vật xung quanh.",
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
      desc: "Kim thân vững như bàn thạch, hấp thụ và phản trả 30% sát thương.",
      color: "#f97316",
      glowHex: "#d97706",
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
      desc: "Giáp cốt kim cang giảm nhẹ sát thương đòn đánh.",
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
      desc: "Thân pháp lướt gió tạo ảo ảnh tránh đòn.",
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
      desc: "Chuyển hóa sinh lực đối phương trị thương.",
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
  ],
};

const AURA_POOLS: Record<DestinyTier, DestinySlotItem[]> = {
  Miracle: [
    {
      id: "aura_miracle_celestial",
      name: "Thần Long Cổ Ấn",
      type: "aura",
      tier: "Miracle",
      tierName: "Kì Tích (1/1000)",
      buff: "+500 HP, +200 MP, Hào Quang Rồng Đỏ",
      desc: "Hào quang Thần Long Hồng Hoang rực lửa xoay quanh nhân vật.",
      color: "#ec4899",
      glowHex: "#f43f5e",
      auraColor: "rgba(244, 63, 94, 0.85)",
    },
    {
      id: "aura_miracle_phoenix",
      name: "Phượng Hoàng Niết Bàn",
      type: "aura",
      tier: "Miracle",
      tierName: "Kì Tích (1/1000)",
      buff: "Tự Động Hồi Sinh Khi Tử Trận",
      desc: "Lửa Phượng Hoàng bao bọc, tự động hồi sinh khi tử trận.",
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
      desc: "Quả cầu rồng vàng bay lượn hộ mệnh quanh nhân vật.",
      color: "#f97316",
      glowHex: "#f59e0b",
      auraColor: "rgba(245, 158, 11, 0.75)",
    },
    {
      id: "aura_legend_thunderbird",
      name: "Tử Lôi Điểu Phù",
      type: "aura",
      tier: "S",
      tierName: "Huyền Thoại (2.9%)",
      buff: "+12% Bạo Kích & Sấm Sét Tím",
      desc: "Linh điểu sấm sét tím bảo hộ quanh nhân vật.",
      color: "#f97316",
      glowHex: "#a855f7",
      auraColor: "rgba(168, 85, 247, 0.75)",
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
      auraColor: "rgba(56, 189, 248, 0.55)",
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
      auraColor: "rgba(139, 92, 246, 0.55)",
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
      auraColor: "rgba(244, 63, 94, 0.55)",
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
      auraColor: "rgba(16, 185, 129, 0.55)",
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
  ],
};

export function rollFullDestiny() {
  const talents: DestinySlotItem[] = [];
  const auras: DestinySlotItem[] = [];

  for (let i = 0; i < 4; i++) {
    const tTier = rollTier();
    const tPool = TALENT_POOLS[tTier];
    talents.push(tPool[Math.floor(Math.random() * tPool.length)]);

    const aTier = rollTier();
    const aPool = AURA_POOLS[aTier];
    auras.push(aPool[Math.floor(Math.random() * aPool.length)]);
  }

  const hasMiracle = [...talents, ...auras].some((x) => x.tier === "Miracle");
  const hasLegendary = [...talents, ...auras].some((x) => x.tier === "S");

  return {
    talents,
    auras,
    talentIds: talents.map((t) => t.id),
    auraIds: auras.map((a) => a.id),
    hasMiracle,
    hasLegendary,
  };
}
