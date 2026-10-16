import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type RegionId = "vn" | "sea" | "test";
export type ForumCategory = "general" | "build" | "boss" | "notice";
export type ChatChannel = "world" | "server" | "party";

export const REGIONS: { id: RegionId; label: string; shortName: string }[] = [
  { id: "vn", label: "🇻🇳 Cụm Việt Nam", shortName: "VN - Cụm 1" },
  { id: "sea", label: "🌏 Cụm Đông Nam Á", shortName: "SEA - Cụm 2" },
  { id: "test", label: "⚡ Cụm Thử Nghiệm", shortName: "Test Realm / PvP" },
];

export const SERVERS = [
  { id: "s1", code: "S1", name: "Long Vương Điện", status: "🔥 Đầy / Náo nhiệt", tone: "danger", featured: true },
  { id: "s2", code: "S2", name: "Hắc Ám Thâm Uyên", status: "🟢 Tốt", tone: "good", featured: false },
  { id: "s3", code: "S3", name: "Thiên Phạt Chi Địa", status: "🆕 Máy Chủ Mới - x2 EXP & Vàng", tone: "new", featured: false },
  { id: "s4", code: "S4", name: "Huyết Nguyệt Đấu Trường", status: "🟢 Tốt", tone: "good", featured: false },
] as const;

export type PortalServerId = (typeof SERVERS)[number]["id"];

export interface ForumComment {
  id: string;
  author: string;
  body: string;
  createdAt: string;
}

export interface ForumPost {
  id: string;
  title: string;
  body: string;
  category: ForumCategory;
  author: string;
  className: string;
  serverName: string;
  createdAt: string;
  likes: string[];
  comments: ForumComment[];
}

export interface WorldMessage {
  id: string;
  channel: ChatChannel;
  serverName: string;
  characterName: string;
  className: string;
  level: number;
  body: string;
  system?: boolean;
}

const starterPosts: ForumPost[] = [
  {
    id: "starter-build",
    title: "[Hướng dẫn] Cách nâng cấp Khiên Pháo Đài và né chiêu Boss Cấm Địa cho hệ Đỡ Đòn",
    body: "Canh nhịp khi Boss giơ vũ khí, giữ kỹ năng khống chế cho lần tụ lực thứ hai. Khiên lên cấp an toàn trước, sau đó mới dồn vàng vào chỉ số phòng thủ phụ.",
    category: "build",
    author: "LongThuVe",
    className: "Hộ Vệ",
    serverName: "S1 - Long Vương Điện",
    createdAt: new Date().toISOString(),
    likes: ["system-seed"],
    comments: [{ id: "seed-comment-1", author: "MocNhan", body: "Mẹo né đòn cuối rất hữu ích!", createdAt: new Date().toISOString() }],
  },
  {
    id: "starter-event",
    title: "[Sự kiện] Đua Top Lực Chiến Máy Chủ S3 - Thiên Phạt nhận vũ khí Legendary",
    body: "Thiên Phạt Chi Địa mở cửa! Tích lũy lực chiến trong tuần khai mở để tranh hạng và nhận phần thưởng mùa giải.",
    category: "notice",
    author: "QuanTriVien",
    className: "Chiến Binh",
    serverName: "S3 - Thiên Phạt Chi Địa",
    createdAt: new Date().toISOString(),
    likes: [],
    comments: [],
  },
  {
    id: "starter-boss",
    title: "Tuyển đội Cấm Địa tối nay: thiếu một Xạ Thủ và một Hộ Vệ",
    body: "Ưu tiên người chơi cấp 10 trở lên, biết gọi nhịp né. Tập trung tại cổng Long Môn lúc 20:30.",
    category: "boss",
    author: "DaXoa_70",
    className: "Sát Thủ",
    serverName: "S1 - Long Vương Điện",
    createdAt: new Date().toISOString(),
    likes: [],
    comments: [],
  },
];

const starterMessages: WorldMessage[] = [
  { id: "chat-1", channel: "world", serverName: "S1 - Long Vương Điện", characterName: "DaXoa_70", className: "Sát Thủ", level: 70, body: "📢 Hệ thống: Chúc mừng [DạXoa_70] tại S1 - Long Vương Điện vừa cường hóa thành công Khiên Pháo Đài!", system: true },
  { id: "chat-2", channel: "world", serverName: "S2 - Hắc Ám Thâm Uyên", characterName: "MocNhan", className: "Hộ Vệ", level: 24, body: "Ai lập đội săn Cấm Địa không? Mình tank được." },
  { id: "chat-3", channel: "server", serverName: "S1 - Long Vương Điện", characterName: "PhongHan", className: "Xạ Thủ", level: 18, body: "Chợ đang có cung tím giá tốt ở quảng trường." },
  { id: "chat-4", channel: "party", serverName: "S1 - Long Vương Điện", characterName: "CoLong", className: "Chiến Binh", level: 31, body: "Đợi đủ đội rồi mình xuất phát nhé." },
];

interface CommunityPortalState {
  selectedRegion: RegionId;
  selectedServer: PortalServerId;
  featuredCharacterId: number | null;
  characterRealms: Record<number, { region: RegionId; server: PortalServerId }>;
  launchRequested: boolean;
  posts: ForumPost[];
  messages: WorldMessage[];
  setRegion: (region: RegionId) => void;
  setServer: (server: PortalServerId) => void;
  setFeaturedCharacter: (characterId: number) => void;
  assignCharacterToRealm: (characterId: number) => void;
  setLaunchRequested: (requested: boolean) => void;
  addPost: (post: ForumPost) => void;
  toggleLike: (postId: string, userKey: string) => void;
  addComment: (postId: string, comment: ForumComment) => void;
  addMessage: (message: WorldMessage) => void;
}

export const useCommunityPortalStore = create<CommunityPortalState>()(
  persist(
    (set) => ({
      selectedRegion: "vn",
      selectedServer: "s1",
      featuredCharacterId: null,
      characterRealms: {},
      launchRequested: false,
      posts: starterPosts,
      messages: starterMessages,
      setRegion: (selectedRegion) => set({ selectedRegion }),
      setServer: (selectedServer) => set({ selectedServer }),
      setFeaturedCharacter: (featuredCharacterId) => set({ featuredCharacterId }),
      assignCharacterToRealm: (characterId) => set((state) => ({
        characterRealms: { ...state.characterRealms, [characterId]: { region: state.selectedRegion, server: state.selectedServer } },
      })),
      setLaunchRequested: (launchRequested) => set({ launchRequested }),
      addPost: (post) => set((state) => ({ posts: [post, ...state.posts] })),
      toggleLike: (postId, userKey) => set((state) => ({
        posts: state.posts.map((post) => post.id !== postId ? post : {
          ...post,
          likes: post.likes.includes(userKey) ? post.likes.filter((key) => key !== userKey) : [...post.likes, userKey],
        }),
      })),
      addComment: (postId, comment) => set((state) => ({
        posts: state.posts.map((post) => post.id === postId ? { ...post, comments: [...post.comments, comment] } : post),
      })),
      addMessage: (message) => set((state) => ({ messages: [...state.messages.slice(-99), message] })),
    }),
    { name: "chien-long-ba-community", storage: createJSONStorage(() => localStorage), partialize: (state) => ({
      selectedRegion: state.selectedRegion,
      selectedServer: state.selectedServer,
      featuredCharacterId: state.featuredCharacterId,
      characterRealms: state.characterRealms,
      posts: state.posts,
      messages: state.messages,
    }) as CommunityPortalState },
  ),
);