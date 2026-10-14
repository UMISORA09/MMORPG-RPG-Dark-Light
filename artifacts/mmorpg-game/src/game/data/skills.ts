export interface SkillDef {
  id: string;
  name: string;
  icon: string;
  type: "active" | "passive";
  cost: number;
  cooldown: number;
  description: string;
  effect: string;
  color: string;
  requires?: string;
}

export const SKILLS: SkillDef[] = [
  {
    id: "triple_strike",
    name: "Ba Nhát Kiếm",
    icon: "⚔️",
    type: "active",
    cost: 1,
    cooldown: 3,
    color: "#e67e22",
    description: "Chém 3 lần liên tiếp với sát thương x1.5",
    effect: "3× melee hits, 1.5× damage each",
  },
  {
    id: "inferno",
    name: "Đại Hỏa",
    icon: "🔥",
    type: "active",
    cost: 1,
    cooldown: 5,
    color: "#e74c3c",
    description: "Bắn quả cầu lửa khổng lồ gây 3× sát thương",
    effect: "Giant fireball, 3× magic damage",
  },
  {
    id: "iron_body",
    name: "Thân Thép",
    icon: "🛡️",
    type: "passive",
    cost: 1,
    cooldown: 0,
    color: "#95a5a6",
    description: "Tăng vĩnh viễn +20 DEF",
    effect: "+20 DEF permanent",
  },
  {
    id: "swift_foot",
    name: "Chân Phong",
    icon: "💨",
    type: "passive",
    cost: 1,
    cooldown: 0,
    color: "#1abc9c",
    description: "Tăng vĩnh viễn +1.5 SPD",
    effect: "+1.5 SPD permanent",
  },
  {
    id: "dragon_fury",
    name: "Long Cuồng Phong",
    icon: "🐉",
    type: "active",
    cost: 2,
    cooldown: 8,
    color: "#9b59b6",
    description: "Đánh xoay 360° gây sát thương tất cả kẻ địch xung quanh",
    effect: "AoE spin attack, hits all enemies in 3u radius",
    requires: "triple_strike",
  },
  {
    id: "magic_barrier",
    name: "Bức Tường Phép",
    icon: "✨",
    type: "passive",
    cost: 2,
    cooldown: 0,
    color: "#3498db",
    description: "Giảm 25% sát thương nhận vào vĩnh viễn",
    effect: "-25% damage taken",
    requires: "iron_body",
  },
];

export const SKILL_MAP = Object.fromEntries(SKILLS.map((s) => [s.id, s]));
