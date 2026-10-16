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
    id: "notice-launch",
    title: "[Thông Báo] Khai Mở Chính Thức Thế Giới MMORPG Chiến Long Bá",
    body: "Chào mừng toàn thể anh hùng dũng sĩ bước vào thế giới Chiến Long Bá! Hệ thống máy chủ đã sẵn sàng tiếp đón người chơi với chuỗi sự kiện Đua Top Tân Thủ, Quà Đăng Nhập 7 Ngày và Săn Boss Thế Giới.",
    category: "notice",
    author: "Ban Quản Trị",
    className: "Hệ Thống",
    serverName: "Toàn Máy Chủ",
    createdAt: new Date().toISOString(),
    likes: [],
    comments: [],
  },
  {
    id: "guide-combat",
    title: "[Cẩm Nang] Hệ Thống Chiến Đấu Combo, Đỡ Đòn Phản Kích và Cưỡi Ngựa",
    body: "Hiệp khách có thể sử dụng chuỗi combo Phím J (Đánh Thường) hoặc Chuột Trái để kích hoạt combo 4 đòn liên hoàn. Nhấn Phím K để Nhảy, L để Lướt Né (Dodge Roll), Phím I/B mở Túi Đồ, Phím Z/M để Cưỡi Thú tăng 70% tốc độ di chuyển.",
    category: "build",
    author: "Ban Quản Trị",
    className: "Hệ Thống",
    serverName: "Toàn Máy Chủ",
    createdAt: new Date().toISOString(),
    likes: [],
    comments: [],
  },
];

const starterMessages: WorldMessage[] = [
  {
    id: "sys-welcome",
    channel: "world",
    serverName: "Toàn Máy Chủ",
    characterName: "Hệ Thống",
    className: "BQT",
    level: 99,
    body: "📢 [Chiến Long Bá]: Chúc quý hiệp khách có những giây phút phiêu lưu thám hiểm tuyệt vời!",
    system: true,
  },
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