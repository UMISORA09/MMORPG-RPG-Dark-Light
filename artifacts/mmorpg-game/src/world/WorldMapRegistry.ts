// ==============================================================================
// 100-Map & Dungeon Procedural Registry (Chiến Long Bá MMORPG)
// Deterministic biome architectures, atmospheric lighting, fog, and monsters
// ==============================================================================

export type BiomeType =
  | "continent"   // Quần xã 1: Lục Địa Khởi Nguyên & Rừng Cổ Thụ (Map 1 - 15)
  | "desert"      // Quần xã 2: Đại Sa Mạc Cát Cháy & Ốc Đảo (Map 16 - 35)
  | "egypt"       // Quần xã 3: Vương Quốc Ai Cập Cổ Đại & Kim Tự Tháp (Map 36 - 55)
  | "ocean"       // Quần xã 4: Đại Dương Sâu Thẳm & Atlantis (Map 56 - 75)
  | "snow"        // Quần xã 5: Đỉnh Tuyết Sơn Vĩnh Cửu & Pháo Đài Băng (Map 76 - 90)
  | "void";       // Quần xã 6: Hư Không Thần Vực & Hoả Ngục (Map 91 - 100)

export interface MapPortalDestination {
  targetMapId: string;
  name: string;
  position: [number, number, number];
  color: string; // e.g. '#00f2ff', '#fbbf24', '#a855f7'
}

export interface MapAreaDefinition {
  id: string;
  num: number;
  name: string;
  biome: BiomeType;
  biomeName: string;
  recommendedLevel: [number, number];
  isDungeon: boolean;
  isSafeZone: boolean;
  desc: string;
  skyColor: string;
  fogColor: string;
  fogDensity: number;
  groundColor: string;
  ambientColor: string;
  ambientIntensity: number;
  sunColor: string;
  sunIntensity: number;
  monsterPool: string[];
  bossName: string | null;
  features: string[];
  portals: MapPortalDestination[];
}

// ── 6 Biome Defaults for Atmosphere & Ground ──
export const BIOME_CONFIGS: Record<
  BiomeType,
  {
    name: string;
    icon: string;
    levelRange: [number, number];
    skyColor: string;
    fogColor: string;
    fogDensity: number;
    groundColor: string;
    ambientColor: string;
    ambientIntensity: number;
    sunColor: string;
    sunIntensity: number;
  }
> = {
  continent: {
    name: "Lục Địa Khởi Nguyên & Rừng Cổ Thụ",
    icon: "🌿",
    levelRange: [1, 80],
    skyColor: "#0f172a",
    fogColor: "#020617",
    fogDensity: 0.012,
    groundColor: "#1e293b",
    ambientColor: "#60a5fa",
    ambientIntensity: 0.65,
    sunColor: "#fde047",
    sunIntensity: 1.2,
  },
  desert: {
    name: "Đại Sa Mạc Cát Cháy & Ốc Đảo",
    icon: "🏜️",
    levelRange: [80, 220],
    skyColor: "#451a03",
    fogColor: "#78350f",
    fogDensity: 0.015,
    groundColor: "#b45309",
    ambientColor: "#fef08a",
    ambientIntensity: 0.8,
    sunColor: "#fbbf24",
    sunIntensity: 1.5,
  },
  egypt: {
    name: "Vương Quốc Ai Cập & Kim Tự Tháp",
    icon: "🏛️",
    levelRange: [220, 450],
    skyColor: "#2e1065",
    fogColor: "#581c87",
    fogDensity: 0.014,
    groundColor: "#d97706",
    ambientColor: "#f59e0b",
    ambientIntensity: 0.85,
    sunColor: "#fef3c7",
    sunIntensity: 1.6,
  },
  ocean: {
    name: "Đại Dương Sâu Thẳm & Thủy Cung Atlantis",
    icon: "🌊",
    levelRange: [450, 680],
    skyColor: "#022c22",
    fogColor: "#042f2e",
    fogDensity: 0.02,
    groundColor: "#0f766e",
    ambientColor: "#2dd4bf",
    ambientIntensity: 0.75,
    sunColor: "#38bdf8",
    sunIntensity: 1.1,
  },
  snow: {
    name: "Đỉnh Tuyết Sơn Vĩnh Cửu & Pháo Đài Băng",
    icon: "❄️",
    levelRange: [680, 850],
    skyColor: "#082f49",
    fogColor: "#0c4a6e",
    fogDensity: 0.018,
    groundColor: "#e0f2fe",
    ambientColor: "#bae6fd",
    ambientIntensity: 0.9,
    sunColor: "#f0f9ff",
    sunIntensity: 1.4,
  },
  void: {
    name: "Hư Không Thần Vực & Cấm Địa Hoả Ngục",
    icon: "🌌",
    levelRange: [850, 999],
    skyColor: "#030014",
    fogColor: "#1e1b4b",
    fogDensity: 0.016,
    groundColor: "#31102f",
    ambientColor: "#c084fc",
    ambientIntensity: 0.7,
    sunColor: "#f43f5e",
    sunIntensity: 1.3,
  },
};

// ── Raw 100 Map Generation Registry ──
function buildWorldMapRegistry(): MapAreaDefinition[] {
  const list: MapAreaDefinition[] = [];

  // Helper to construct deterministic entries
  const addMap = (
    num: number,
    name: string,
    biome: BiomeType,
    minLv: number,
    maxLv: number,
    isDungeon: boolean,
    desc: string,
    monsterPool: string[],
    bossName: string | null,
    features: string[],
    extraPortals?: MapPortalDestination[]
  ) => {
    const id = num === 1 ? "SAFE_VILLAGE" : `MAP_${String(num).padStart(3, "0")}`;
    const cfg = BIOME_CONFIGS[biome];

    // Standard next map portal
    const portals: MapPortalDestination[] = [];
    if (num > 1) {
      const prevId = num === 2 ? "SAFE_VILLAGE" : `MAP_${String(num - 1).padStart(3, "0")}`;
      portals.push({
        targetMapId: prevId,
        name: `Cổng Quay Lại (#${num - 1})`,
        position: [-16, 0.05, 0],
        color: "#64748b",
      });
    }
    if (num < 100) {
      const nextId = `MAP_${String(num + 1).padStart(3, "0")}`;
      portals.push({
        targetMapId: nextId,
        name: `Cổng Tiến Tới (#${num + 1})`,
        position: [16, 0.05, 0],
        color: isDungeon ? "#ef4444" : "#00f2ff",
      });
    }
    if (extraPortals) {
      portals.push(...extraPortals);
    }

    list.push({
      id,
      num,
      name,
      biome,
      biomeName: cfg.name,
      recommendedLevel: [minLv, maxLv],
      isDungeon,
      isSafeZone: num === 1,
      desc,
      skyColor: cfg.skyColor,
      fogColor: cfg.fogColor,
      fogDensity: cfg.fogDensity,
      groundColor: cfg.groundColor,
      ambientColor: cfg.ambientColor,
      ambientIntensity: cfg.ambientIntensity,
      sunColor: cfg.sunColor,
      sunIntensity: cfg.sunIntensity,
      monsterPool,
      bossName,
      features,
      portals,
    });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. QUẦN XÃ 1: LỤC ĐỊA KHỞI NGUYÊN (Map 001 -> 015 | Lv.1 - 80)
  // ─────────────────────────────────────────────────────────────────────────────
  addMap(
    1,
    "Làng Long Tộc Khởi Nguyên",
    "continent",
    1,
    10,
    false,
    "Khu vực an toàn khởi đầu được mở rộng 2.5x với Đại Điện Long Tộc, Đài Phun Nước Thần Thánh, Tháp Chuông Cổ, Khu Lò Rèn Lửa Đỏ và Quảng Trường 4 Cổng Dịch Chuyển.",
    [],
    null,
    ["Đại Điện Long Tộc", "Đài Phun Nước Thần Thánh", "Tháp Chuông Cổ", "Khu Lò Rèn Lửa Đỏ", "Quảng Trường Cổng Không Gian"],
    [
      { targetMapId: "MAP_002", name: "Cổng Nam: Rừng Thảo Nguyên (Lv.1 - Lv.10)", position: [0, 0.05, 26], color: "#00f2ff" },
      { targetMapId: "MAP_016", name: "Cổng Bắc: Cửa Ngõ Đại Sa Mạc (Lv.80+)", position: [0, 0.05, -26], color: "#fbbf24" },
      { targetMapId: "MAP_036", name: "Cổng Đông: Quần Thể Kim Tự Tháp Ai Cập (Lv.220+)", position: [26, 0.05, 0], color: "#f59e0b" },
      { targetMapId: "MAP_056", name: "Cổng Tây: Thủy Cung Đại Dương Sâu Thẳm (Lv.450+)", position: [-26, 0.05, 0], color: "#2dd4bf" },
    ]
  );
  addMap(2, "Thảo Nguyên Gió Xanh", "continent", 1, 10, false, "Đồng cỏ xanh tươi nơi đàn Slime và Goblin thám thính đi tuần tra.", ["slime", "goblin"], null, ["Cây Cổ Thụ", "Đài Runic Xanh"]);
  addMap(3, "Rừng Nguyên Sinh Rậm Rạp", "continent", 10, 18, false, "Cánh rừng đại ngàn với các bộ tộc Orc Rừng hùng hậu.", ["goblin", "orc"], null, ["Tháp Gác Gỗ", "Hòn Đá Phong Linh"]);
  addMap(4, "Bờ Sông Tinh Linh", "continent", 18, 25, false, "Dòng sông ma thuật phát sáng dịu nhẹ dưới ánh trăng.", ["orc", "wolf"], null, ["Cầu Đá Cổ", "Hoa Tinh Linh Dạ Quang"]);
  addMap(5, "Đồi Đá Hoàng Hôn", "continent", 25, 32, false, "Vách đá nhấp nhô nơi bầy Sói Xám săn mồi về chiều.", ["wolf", "skeleton"], null, ["Cột Đá Đứng", "Lửa Trại Dã Ngoại"]);
  addMap(6, "Đầm Lầy Sương Mù U Ám", "continent", 32, 40, false, "Làn sương độc đặc quánh bao phủ các bộ xương binh lính cổ.", ["skeleton", "orc"], null, ["Cây Khô Héo", "Vũng Lầy Độc"]);
  addMap(7, "Rừng Nấm Khổng Lồ", "continent", 40, 48, false, "Những cây nấm cao bằng tòa nhà tỏa bào tử sáng lấp lánh.", ["slime", "wolf"], null, ["Cây Nấm Khổng Lồ", "Rương Tự Nhiên"]);
  addMap(8, "Phế Tích Cổ Đại Vỡ Nát", "continent", 48, 55, false, "Dấu tích của một nền văn minh rồng cổ bị lãng quên.", ["skeleton", "goblin"], null, ["Trụ Cột Đổ Nát", "Bàn Thờ Cổ"]);
  addMap(9, "Hang Động Pha Lê Lục Bảo", "continent", 55, 62, false, "Hang đá ngầm lấp lánh ngọc bích phát sáng huyền ảo.", ["orc", "skeleton"], null, ["Khối Pha Lê Xanh", "Mỏ Quặng Linh Thạch"]);
  addMap(10, "Hẻm Núi Sấm Sét", "continent", 62, 70, false, "Các cột sét đánh liên tục xuống những mỏm đá nhọn.", ["wolf", "dragon"], null, ["Mỏm Đá Sét", "Trận Đồ Lôi Điện"]);
  addMap(11, "[Hầm Ngục] Hang Nhện Độc Tầng 1", "continent", 70, 72, true, "Màng nhện giăng kín lối đi ẩm thấp tối tăm.", ["skeleton", "slime"], null, ["Kén Nhện", "Bẫy Gai Độc"]);
  addMap(12, "[Hầm Ngục] Hang Nhện Độc Tầng 2", "continent", 72, 74, true, "Độ sâu ngột ngạt với chất nhầy ăn mòn trang bị.", ["slime", "goblin"], null, ["Vách Đá Nhầy", "Trứng Nhện"]);
  addMap(13, "[Hầm Ngục] Quỷ Cốc Tối Tăm", "continent", 74, 76, true, "Thung lũng không một tia sáng lọt tới.", ["skeleton", "orc"], null, ["Đuốc Ma Trơi", "Bia Mộ Nứt"]);
  addMap(14, "[Hầm Ngục] Mộ Cổ Hiệp Sĩ Vô Danh", "continent", 76, 78, true, "Hầm mộ đá hoa cương của các hiệp sĩ thời viễn cổ.", ["skeleton", "wolf"], null, ["Quan Tài Đá", "Thanh Kiếm Cổ"]);
  addMap(15, "[Hầm Ngục] Sào Huyệt Rồng Lửa Khởi Nguyên", "continent", 78, 80, true, "Tổ rồng dung nham rực cháy đe dọa toàn cõi lục địa.", ["dragon", "orc"], "Hỏa Long Vương Ignis (Lv.80)", ["Dòng Dung Nham", "Trứng Rồng Vàng"]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. QUẦN XÃ 2: ĐẠI SA MẠC CÁT CHÁY (Map 016 -> 035 | Lv.80 - 220)
  // ─────────────────────────────────────────────────────────────────────────────
  addMap(16, "Cửa Ngõ Cát Vàng", "desert", 80, 90, false, "Vùng rìa sa mạc gió nóng rát mặt, báo hiệu đại lục khắc nghiệt.", ["scorpion", "mummy"], null, ["Cột Mốc Cát", "Bụi Cỏ Khô"]);
  addMap(17, "Đụn Cát Gió Xoáy", "desert", 90, 100, false, "Những cơn lốc cát bất ngờ cuốn phăng người đi đường.", ["scorpion", "sand_golem"], null, ["Cơn Lốc Cát", "Xương Thú Vùi Cát"]);
  addMap(18, "Thung Lũng Xương Rồng Gai", "desert", 100, 110, false, "Khu rừng xương rồng khổng lồ sắc nhọn chứa nọc độc sa mạc.", ["cobra", "scorpion"], null, ["Xương Rồng Gai Khổng Lồ", "Hốc Đá Mát"]);
  addMap(19, "Xương Khổng Lồ Rồng Cát", "desert", 110, 120, false, "Bộ xương rồng vĩ đại hàng trăm mét nằm phơi sương trắng xóa.", ["sand_golem", "cobra"], null, ["Xương Sọ Rồng Khổng Lồ", "Khung Xương Sườn"]);
  addMap(20, "Ốc Đảo Nước Ngọc Bích", "desert", 120, 130, false, "Vùng nước ngọt trong vắt được bao bọc bởi hàng cọ xanh tươi.", ["mummy", "scorpion"], null, ["Hồ Nước Ngọc Bích", "Hàng Cây Cọ Sa Mạc"]);
  addMap(21, "Phế Tích Cổ Sa Mạc", "desert", 130, 140, false, "Những bức tường đất nung ngàn năm sụp đổ dưới nắng gắt.", ["mummy", "cobra"], null, ["Tường Đất Nung", "Vạc Dầu Cổ"]);
  addMap(22, "Hẻm Đá Mặt Trời Thiêu Đốt", "desert", 140, 150, false, "Vách đá đỏ rực hấp thụ nhiệt lượng như chảo lửa thiêng.", ["sand_golem", "scorpion"], null, ["Mỏm Đá Đỏ", "Bụi Đỏ Bốc Lên"]);
  addMap(23, "Bãi Cát Lún Tử Thần", "desert", 150, 160, false, "Cát lún nuốt chửng mọi sinh vật sơ sẩy bước vào.", ["scorpion", "sand_golem"], null, ["Vòng Xoáy Cát Lún", "Xương Cổ"]);
  addMap(24, "Thành Cổ Cát Vùi Lấp", "desert", 160, 170, false, "Tòa thành từng tráng lệ nay chỉ còn lộ ra phần mái vòm tráng lệ.", ["mummy", "sand_golem"], null, ["Mái Vòm Cát", "Cổng Thành Nửa Kín"]);
  addMap(25, "Giếng Cổ Thần Bí Sa Mạc", "desert", 170, 180, false, "Chiếc giếng sâu không đáy tỏa hơi nước mát lạnh huyền thoại.", ["cobra", "mummy"], null, ["Thành Giếng Đá Cổ", "Ròng Rọc Gỗ"]);
  addMap(26, "Trại Đạo Tặc Sa Mạc", "desert", 180, 190, false, "Căn cứ của những kẻ cướp đường liều mạng nhất hoang mạc.", ["sand_golem", "scorpion"], null, ["Lều Bạt Da Lạc Đà", "Thùng Gỗ Kho Báu"]);
  addMap(27, "Đồi Cát Huyết Nguyệt", "desert", 190, 200, false, "Cát chuyển màu đỏ thẫm mỗi khi ánh trăng máu xuất hiện.", ["mummy", "cobra"], null, ["Đụn Cát Đỏ", "Cờ Hiệu Cổ"]);
  addMap(28, "Bàn Thờ Thần Bão Cát", "desert", 200, 205, false, "Nơi thờ phụng vị thần điều khiển bão tố sa mạc.", ["sand_golem", "scorpion"], null, ["Bàn Thờ Cát Vàng", "Khối Đá Khắc"]);
  addMap(29, "Ảo Ảnh Ốc Đảo Ma Bí", "desert", 205, 210, false, "Ảo ảnh quyến rũ lữ khách vào cạm bẫy của bầy quái vật đói khát.", ["mummy", "cobra"], null, ["Ảo Ảnh Nước Long Lanh", "Tảng Đá Gạt Người"]);
  addMap(30, "Cổng Vào Lăng Mộ Cát Vàng", "desert", 210, 215, false, "Cánh cửa dẫn xuống mê cung cát lún của các vị vua sa mạc xưa.", ["sand_golem", "cobra"], null, ["Cổng Đá Cổ Khổng Lồ", "Ngọn Đuốc Dầu"]);
  addMap(31, "[Hầm Ngục] Mê Cung Cát Lún Tầng 1", "desert", 215, 216, true, "Hành lang đá dưới lòng đất dày đặc bẫy cát.", ["scorpion", "mummy"], null, ["Hành Lang Đá", "Bẫy Đất Sụt"]);
  addMap(32, "[Hầm Ngục] Mê Cung Cát Lún Tầng 2", "desert", 216, 217, true, "Không khí đặc quánh mùi nọc độc bọ cạp chúa.", ["scorpion", "cobra"], null, ["Hốc Đá Nọc Độc", "Đèn Đá Dầu"]);
  addMap(33, "[Hầm Ngục] Mê Cung Cát Lún Tầng 3", "desert", 217, 218, true, "Các bức bích họa cổ ghi lại cuộc thảm sát vĩ đại thời cổ.", ["sand_golem", "mummy"], null, ["Bích Họa Tường", "Cột Trụ Đỡ Vòm"]);
  addMap(34, "[Hầm Ngục] Hầm Ngầm Bọ Cạp Hoàng Kim", "desert", 218, 219, true, "Căn phòng dát vàng lộng lẫy bị quái vật giáp vàng chiếm giữ.", ["scorpion", "sand_golem"], "Bọ Cạp Hoàng Kim Vạn Tuế (Lv.219)", ["Ổ Trứng Vàng", "Thạch Nhũ Vàng"]);
  addMap(35, "[Hầm Ngục] Cấm Điện Rắn Hổ Mang Chúa", "desert", 219, 220, true, "Nơi ngự trị của đại xà ngàn năm canh giữ ấn kiếm sa mạc.", ["cobra", "mummy"], "Nữ Vương Rắn Hổ Mang Chúa (Lv.220)", ["Ngai Vàng Rắn Khổng Lồ", "Hồ Độc Chết Người"]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. QUẦN XÃ 3: VƯƠNG QUỐC AI CẬP CỔ ĐẠI & KIM TỰ THÁP (Map 036 -> 055 | Lv.220 - 450)
  // ─────────────────────────────────────────────────────────────────────────────
  addMap(36, "Đại Kim Tự Tháp Khufu Ngoại Vi", "egypt", 220, 235, false, "Chân Kim Tự Tháp vĩ đại bằng đá vàng nguyên khối xếp tầng cao vút chọc trời.", ["anubis_warrior", "scarab"], null, ["Khối Đá Kim Tự Tháp Khổng Lồ", "Hàng Cờ Pharaoh"]);
  addMap(37, "Tượng Nhân Sư Vĩ Đại (Great Sphinx)", "egypt", 235, 250, false, "Bức tượng đá Nhân Sư khổng lồ mắt nhìn xa xăm mang thần bí ngàn năm.", ["scarab", "royal_mummy"], null, ["Tượng Nhân Sư Great Sphinx 3D", "Bệ Đá Thần Lực"]);
  addMap(38, "Đại Lộ Trụ Đá Cổ Obelisk Phù Hiệu", "egypt", 250, 265, false, "Những cột Obelisk tứ giác cao vút khắc chữ tượng hình cổ phát sáng ánh vàng.", ["anubis_warrior", "egypt_sorcerer"], null, ["Cột Đá Obelisk Khắc Chữ Tượng Hình", "Bệ Dâng Lễ"]);
  addMap(39, "Đền Thờ Thần Mặt Trời Ra", "egypt", 265, 280, false, "Ngôi đền vàng chói lọi hướng thẳng về phía vầng thái dương rực lửa.", ["egypt_sorcerer", "scarab"], null, ["Đĩa Vàng Mặt Trời Ra", "Bàn Thờ Hiến Tế Lửa"]);
  addMap(40, "Điện Thờ Thần Anubis Dẫn Độ", "egypt", 280, 295, false, "Ngôi đền huyền bí với các tượng thần chó rừng uy nghiêm canh giữ cửa ngục.", ["anubis_warrior", "royal_mummy"], null, ["Tượng Thần Đầu Chó Anubis", "Cán Cân Linh Hồn"]);
  addMap(41, "Bờ Sông Nile Thần Thánh", "egypt", 295, 310, false, "Dòng phù sa trù phú nơi thủy quái sấu sông Nile rình rập du khách.", ["scarab", "anubis_warrior"], null, ["Hàng Cây Cói Papyrus", "Thuyền Gỗ Cổ"]);
  addMap(42, "Lăng Tẩm Hoàng Gia Saqqara", "egypt", 310, 325, false, "Quần thể kim tự tháp bậc thang cổ kính chứa ngàn bảo vật thất lạc.", ["royal_mummy", "egypt_sorcerer"], null, ["Kim Tự Tháp Bậc Thang", "Lối Xuống Hầm Đá"]);
  addMap(43, "Quảng Trường Bọ Hung Vàng (Scarab Plaza)", "egypt", 325, 340, false, "Bức tượng bọ hung cánh ngọc khổng lồ biểu tượng tái sinh và bất tử.", ["scarab", "royal_mummy"], null, ["Tượng Bọ Hung Cánh Vàng", "Bể Nước Thần"]);
  addMap(44, "Thung Lũng Các Vị Vua (Valley of the Kings)", "egypt", 340, 355, false, "Hẻm núi cằn cỗi nơi an nghỉ của các triều đại Pharaoh huyền thoại.", ["anubis_warrior", "egypt_sorcerer"], null, ["Cổng Lăng Mộ Cắt Vào Vách Đá", "Bia Đá Lời Nguyền"]);
  addMap(45, "Tiền Điện Kim Tự Tháp Đen", "egypt", 355, 370, false, "Kim tự tháp xây từ đá hắc diện thạch chứa ma lực bóng tối dày đặc.", ["egypt_sorcerer", "royal_mummy"], null, ["Đỉnh Kim Tự Tháp Đen", "Vòng Tròn Ma Thuật Đen"]);
  // 10 Tầng Hầm ngục Kim Tự Tháp
  for (let d = 1; d <= 10; d++) {
    const num = 45 + d;
    const minL = 370 + (d - 1) * 8;
    const maxL = minL + 8;
    const isBossFloor = d === 10;
    addMap(
      num,
      isBossFloor ? "[Hầm Ngục] Lăng Tẩm Pharaoh Bất Tử Osiris" : `[Hầm Ngục] Kim Tự Tháp Catacombs Tầng ${d}`,
      "egypt",
      minL,
      maxL,
      true,
      isBossFloor
        ? "Căn phòng trung tâm dát vàng nơi quan tài vàng Pharaoh Osiris thức tỉnh trừng phạt kẻ xâm nhập!"
        : `Tầng ${d} sâu trong lòng Kim Tự Tháp với bẫy gai, quan tài mạ vàng và đuốc cháy ngàn năm.`,
      isBossFloor ? ["anubis_warrior", "egypt_sorcerer", "royal_mummy"] : ["scarab", "anubis_warrior", "royal_mummy"],
      isBossFloor ? "Đại Pharaoh Bất Tử Osiris (Lv.450)" : null,
      ["Quách Vàng Pharaoh", "Đuốc Cháy Vĩnh Cửu", "Bẫy Gai Cổ"],
      isBossFloor ? [{ targetMapId: "MAP_056", name: "Cổng Tiến Về Đại Dương (Lv.450+)", position: [0, 0.05, -20], color: "#2dd4bf" }] : undefined
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. QUẦN XÃ 4: ĐẠI DƯƠNG SÂU THẲM & ATLANTIS (Map 056 -> 075 | Lv.450 - 680)
  // ─────────────────────────────────────────────────────────────────────────────
  addMap(56, "Bờ Biển Lam Ngọc Khởi Đầu", "ocean", 450, 465, false, "Bãi cát trắng mịn giáp đại dương sâu thẳm lấp lánh ánh lam ngọc.", ["shark_warrior", "iron_crab"], null, ["Vỏ Sò Khổng Lồ", "Sóng Biển Cuộn"]);
  addMap(57, "Rạn San Hô Phát Quang Dạ Quang", "ocean", 465, 480, false, "Rạn san hô ngầm tỏa ánh sáng tím lục lung linh rực rỡ dưới đáy biển.", ["dark_mermaid", "iron_crab"], null, ["San Hô Đỏ Dạ Quang", "Cụm San Hô Não"]);
  addMap(58, "Rãnh Vực Biển Sâu Ánh Tím", "ocean", 480, 495, false, "Vết nứt đáy đại dương sâu không đáy tỏa ánh sáng ma mị màu tím.", ["shark_warrior", "dark_mermaid"], null, ["Vách Đá Thủy Cung", "Bong Bóng Khí Bay"]);
  addMap(59, "Vườn Hải Quỳ Khổng Lồ", "ocean", 495, 510, false, "Những xúc tu hải quỳ rực rỡ uốn lượn theo dòng hải lưu ngầm.", ["iron_crab", "shark_warrior"], null, ["Hải Quỳ Khổng Lồ", "Đá San Hô"]);
  addMap(60, "Rừng Tảo Biển Phát Sáng Huyền Ảo", "ocean", 510, 525, false, "Những sợi tảo biển cao vút như rừng rậm cổ thụ dưới nước biển xanh biếc.", ["dark_mermaid", "shark_warrior"], null, ["Dây Tảo Biển Xanh", "Khóm Rêu Phát Sáng"]);
  addMap(61, "Nghĩa Địa Tàu Đắm Cổ Thế Kỷ", "ocean", 525, 540, false, "Xác những con thuyền buôn cổ đại bị chìm sâu vùi dưới đáy đại dương.", ["kraken_spawn", "shark_warrior"], null, ["Xác Thuyền Buồm Đắm", "Mỏ Neo Rỉ Sét"]);
  addMap(62, "Hang Động Thủy Tinh Ngầm", "ocean", 540, 555, false, "Hang động lấp lánh như cung điện bằng đá thủy tinh trong suốt.", ["iron_crab", "dark_mermaid"], null, ["Cột Thủy Tinh Ngầm", "Thạch Nhũ Biển"]);
  addMap(63, "Phế Tích Thành Cổ Chìm Đáy Biển", "ocean", 555, 570, false, "Những tàn tích đô thị cổ xưa bị nhấn chìm từ hàng triệu năm trước.", ["shark_warrior", "dark_mermaid"], null, ["Cổng Vòm Cẩm Thạch", "Bức Tường Đá Xanh"]);
  addMap(64, "Cung Điện Cẩm Thạch Hải Vương Poseidon", "ocean", 570, 585, false, "Cung điện vĩ đại tráng lệ làm từ cẩm thạch trắng tinh khiết dưới đáy biển.", ["shark_warrior", "kraken_spawn"], null, ["Tượng Thần Poseidon", "Cột Trụ Cẩm Thạch Trắng"]);
  addMap(65, "Đài Tế Thủy Thần Triều Dâng", "ocean", 585, 600, false, "Nơi các pháp sư biển cổ dâng lễ vật để cầu sóng yên biển lặng.", ["dark_mermaid", "kraken_spawn"], null, ["Đài Tế Đá Trắng", "Vòng Tròn Hải Lưu"]);
  addMap(66, "Hố Đen Đại Dương Mariana", "ocean", 600, 615, false, "Vùng xoáy hút chân không nuốt chửng mọi ánh sáng và sinh linh.", ["shark_warrior", "iron_crab"], null, ["Vòng Xoáy Hút Ngầm", "Vực Đen Thăm Thẳm"]);
  addMap(67, "Cổng San Hô Huyết Tộc Thủy Quái", "ocean", 615, 630, false, "Khung cổng tự nhiên đan từ san hô đỏ như máu báo hiệu vùng tử địa.", ["dark_mermaid", "kraken_spawn"], null, ["Cổng San Hô Huyết Tộc", "Khí Độc Nước"]);
  addMap(68, "Vực Sâu Xương Kình Ngư Thần Bí", "ocean", 630, 645, false, "Nghĩa trang khổng lồ của loài cá voi cổ đại từ thuở sơ khai.", ["shark_warrior", "kraken_spawn"], null, ["Xương Đầu Cá Voi Khổng Lồ", "Hốc Xương"]);
  // Hầm ngục Atlantis Tầng 1 - 7
  for (let d = 1; d <= 7; d++) {
    const num = 68 + d;
    const minL = 645 + (d - 1) * 5;
    const maxL = minL + 5;
    const isBossFloor = d === 7;
    addMap(
      num,
      isBossFloor ? "[Hầm Ngục] Ngai Vàng Hải Vương Long Thần" : `[Hầm Ngục] Vực Thẳm Thủy Cung Atlantis Tầng ${d}`,
      "ocean",
      minL,
      maxL,
      true,
      isBossFloor
        ? "Căn phòng đáy đại dương sâu nhất nơi Hải Vương Long Thần canh giữ đinh ba thần lực!"
        : `Tầng ${d} thủy cung Atlantis với áp lực nước nghìn tấn và quái vật biển khát máu.`,
      isBossFloor ? ["shark_warrior", "dark_mermaid", "kraken_spawn"] : ["iron_crab", "dark_mermaid", "kraken_spawn"],
      isBossFloor ? "Hải Vương Long Thần Leviathan (Lv.680)" : null,
      ["Cột San Hô Cẩm Thạch", "Vỏ Ngọc Bích Khổng Lồ"],
      isBossFloor ? [{ targetMapId: "MAP_076", name: "Cổng Tiến Về Tuyết Sơn (Lv.680+)", position: [0, 0.05, -20], color: "#bae6fd" }] : undefined
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. QUẦN XÃ 5: ĐỈNH TUYẾT SƠN VĨNH CỬU (Map 076 -> 090 | Lv.680 - 850)
  // ─────────────────────────────────────────────────────────────────────────────
  addMap(76, "Chân Núi Tuyết Trắng Xóa", "snow", 680, 695, false, "Khu vực sườn núi lạnh giá tuyết phủ quanh năm không tan.", ["yeti", "frost_wolf"], null, ["Cây Thông Đóng Băng", "Gốc Cây Tuyết Phủ"]);
  addMap(77, "Rừng Thông Băng Giá Ngủ Vùi", "snow", 695, 710, false, "Những rặng thông trắng xóa chịu đựng gió bão tuyết khắc nghiệt.", ["frost_wolf", "yeti"], null, ["Rừng Thông Trắng", "Dấu Chân Người Tuyết"]);
  addMap(78, "Đèo Gió Lạnh Cắt Da", "snow", 710, 725, false, "Con đèo hiểm trở gió bão tuyết gào thét như tiếng sói đói.", ["yeti", "frost_knight"], null, ["Vách Núi Dựng Đứng", "Cột Cờ Rách Nát"]);
  addMap(79, "Hồ Băng Gương Vỡ Phản Chiếu", "snow", 725, 740, false, "Mặt hồ đóng lớp băng trong vắt nhìn sâu xuống làn nước lạnh thấu xương.", ["frost_knight", "frost_wolf"], null, ["Mặt Băng Gương", "Vết Nứt Băng Xanh"]);
  addMap(80, "Thác Nước Đóng Băng Khổng Lồ", "snow", 740, 755, false, "Cột thác nước hùng vĩ bị đóng băng đột ngột thành tác phẩm điêu khắc tự nhiên.", ["yeti", "frost_knight"], null, ["Thác Băng Khổng Lồ", "Nhũ Băng Sắc Nhọn"]);
  addMap(81, "Sườn Núi Tuyết Lở Nguy Hiểm", "snow", 755, 770, false, "Những khối tuyết nghìn tấn sẵn sàng ập xuống bất cứ lúc nào.", ["frost_wolf", "yeti"], null, ["Khối Băng Lở", "Đá Nhô Khỏi Tuyết"]);
  addMap(82, "Pháo Đài Băng Pha Lê Khổng Lồ", "snow", 770, 785, false, "Tòa lâu đài pha lê tráng lệ được xây dựng từ đá băng nghìn năm.", ["frost_knight", "yeti"], null, ["Tường Thành Băng", "Cổng Vòm Pha Lê"]);
  addMap(83, "Vết Nứt Băng Cực Bắc", "snow", 785, 800, false, "Hẻm vực sâu thăm thẳm tách đôi dải đất đóng băng.", ["frost_knight", "frost_wolf"], null, ["Vết Nứt Băng Vĩ Đại", "Cầu Băng Mỏng"]);
  addMap(84, "Đỉnh Cực Quang Băng Tuyết", "snow", 800, 815, false, "Bầu trời rực sáng dải cực quang xanh ngọc lấp lánh kỳ diệu.", ["frost_knight", "ice_dragon"], null, ["Dải Cực Quang Trên Trời", "Trận Đồ Băng"]);
  addMap(85, "Đền Băng Kỷ Băng Hà", "snow", 815, 825, false, "Nơi an vị các vị thần mùa đông nguyên thủy từ thời đại Băng Hà.", ["frost_knight", "ice_dragon"], null, ["Tượng Nữ Thần Băng Giá", "Bàn Băng Cổ"]);
  // Hầm ngục Động Băng Ngàn Năm Tầng 1 - 5
  for (let d = 1; d <= 5; d++) {
    const num = 85 + d;
    const minL = 825 + (d - 1) * 5;
    const maxL = minL + 5;
    const isBossFloor = d === 5;
    addMap(
      num,
      isBossFloor ? "[Hầm Ngục] Tổ Rồng Băng Cổ Frostwyrm" : `[Hầm Ngục] Động Băng Ngàn Năm Tầng ${d}`,
      "snow",
      minL,
      maxL,
      true,
      isBossFloor
        ? "Căn phòng băng vĩnh cửu nơi Rồng Băng Cổ Đại Frostwyrm ngủ say ngàn năm nay tỉnh giấc!"
        : `Tầng ${d} hang động băng với giá lạnh đóng băng cả linh lực của người tu tiên.`,
      isBossFloor ? ["frost_knight", "ice_dragon", "yeti"] : ["yeti", "frost_knight"],
      isBossFloor ? "Thái Cổ Băng Long Frostwyrm (Lv.850)" : null,
      ["Tường Băng Pha Lê", "Quan Tài Băng Khối"],
      isBossFloor ? [{ targetMapId: "MAP_091", name: "Cổng Tiến Vào Hư Không (Lv.850+)", position: [0, 0.05, -20], color: "#c084fc" }] : undefined
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. QUẦN XÃ 6: HƯ KHÔNG THẦN VỰC & HOẢ NGỤC (Map 091 -> 100 | Lv.850 - 999)
  // ─────────────────────────────────────────────────────────────────────────────
  addMap(91, "Quần Đảo Đá Lơ Lửng Vũ Trụ", "void", 850, 875, false, "Các hòn đảo đá thiên thạch trôi nổi giữa không gian vũ trụ tĩnh mịch tím biếc.", ["void_entity", "molten_fiend"], null, ["Đá Thiên Thạch Trôi Dạt", "Vòng Xoáy Tinh Vân"]);
  addMap(92, "Dòng Sông Dung Nham Hỗn Mang", "void", 875, 900, false, "Dòng nham thạch vũ trụ nóng hàng triệu độ chảy giữa hư vô lạnh giá.", ["molten_fiend", "void_entity"], null, ["Sông Dung Nham Sôi", "Cột Lửa Bùng Cháy"]);
  addMap(93, "Cổng Không Gian Vỡ Nát Hắc Động", "void", 900, 920, false, "Những mảnh vỡ thời gian bị lỗ đen vũ trụ xé toạc từng phần.", ["void_entity", "fallen_angel"], null, ["Lỗ Đen Không Gian", "Vệt Sáng Thời Gian"]);
  addMap(94, "Đấu Trường Chư Thần Tàn Phá", "void", 920, 940, false, "Nơi từng diễn ra đại chiến giữa các vị thần thượng cổ rực rỡ.", ["fallen_angel", "molten_fiend"], null, ["Cột Trụ Đấu Trường Gãy", "Ngai Thần Đổ Nát"]);
  addMap(95, "Bệ Thờ Tinh Tú Thiên Hà Tối Cao", "void", 940, 960, false, "Bàn thờ hội tụ ánh sáng từ ngàn vạn ngôi sao trong vũ trụ huyền ảo.", ["void_entity", "fallen_angel"], null, ["Bàn Thờ Tinh Tú Phát Sáng", "Quả Cầu Vũ Trụ"]);
  addMap(96, "[Hầm Ngục] Hư Không Tầng 1: Cổng Vĩnh Hằng", "void", 960, 970, true, "Cánh cửa dẫn vào chiều không gian vượt ngoài tầm hiểu biết phàm nhân.", ["void_entity", "molten_fiend"], null, ["Cổng Pha Lê Tím", "Vết Rạn Hư Không"]);
  addMap(97, "[Hầm Ngục] Hư Không Tầng 2: Vực Ma Thần Sa Ngã", "void", 970, 980, true, "Nơi giam giữ những thiên thần phản bội bị đọa đày muôn kiếp.", ["fallen_angel", "void_entity"], null, ["Lồng Sắt Thiên Giới", "Lông Vũ Đen Rơi"]);
  addMap(98, "[Hầm Ngục] Hư Không Tầng 3: Biển Lửa Thiên Kiếp", "void", 980, 990, true, "Sấm sét thiên kiếp màu tím đỏ dội liên tục xuống mặt hồ nham thạch.", ["molten_fiend", "fallen_angel"], null, ["Sét Thiên Kiếp Tím", "Đá Nóng Chảy"]);
  addMap(99, "[Hầm Ngục] Hư Không Tầng 4: Điện Thờ Vô Cực", "void", 990, 998, true, "Ngôi đền nằm ngoài dòng chảy thời gian và không gian đa chiều.", ["void_entity", "fallen_angel", "molten_fiend"], null, ["Đồng Hồ Cát Vô Cực", "Trụ Ánh Sáng"]);
  addMap(
    100,
    "[Hầm Ngục Tối Thượng] Tận Cùng Thời Gian — Đỉnh Hỗn Độn Long Hoàng",
    "void",
    999,
    999,
    true,
    "Điểm tận cùng của vạn vật vũ trụ! Nơi Hỗn Độn Long Hoàng cai quản sinh diệt của 100 thế giới đại lục huyền huyễn!",
    ["void_entity", "molten_fiend", "fallen_angel"],
    "👑 Tối Thượng Hỗn Độn Long Hoàng (Lv.999)",
    ["Ngai Vàng Hỗn Độn Tối Thượng", "Vòng Xoáy Khởi Nguyên Vũ Trụ", "Cột Càn Khôn Phát Sáng"]
  );

  return list;
}

export const WORLD_100_MAPS: MapAreaDefinition[] = buildWorldMapRegistry();

export const MAP_LOOKUP_BY_ID: Record<string, MapAreaDefinition> = Object.fromEntries(
  WORLD_100_MAPS.map((m) => [m.id, m])
);

export function getMapById(id: string): MapAreaDefinition {
  return MAP_LOOKUP_BY_ID[id] || WORLD_100_MAPS[0];
}

export function getMapsByBiome(biome: BiomeType): MapAreaDefinition[] {
  return WORLD_100_MAPS.filter((m) => m.biome === biome);
}
