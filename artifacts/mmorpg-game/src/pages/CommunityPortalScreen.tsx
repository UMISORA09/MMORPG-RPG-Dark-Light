import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import {
  getBattleLog,
  getGetBattleLogQueryKey,
  getGetCharactersQueryKey,
  getGetInventoryQueryKey,
  getGetLeaderboardQueryKey,
  getGetMeQueryKey,
  useGetCharacters,
  useGetInventory,
  useGetLeaderboard,
  useGetMe,
  useLogout,
  type Character,
} from "@workspace/api-client-react";
import {
  BookOpen, CalendarDays, ChevronRight, CircleUserRound, Flame, Globe2, Heart,
  LogOut, MessageCircle, Newspaper, Plus, Send, Shield, Swords, Trophy, Users,
} from "lucide-react";
import { ClassSprite } from "@/components/ClassSprite";
import { useToast } from "@/hooks/use-toast";
import {
  REGIONS, SERVERS, useCommunityPortalStore,
  type ChatChannel, type ForumCategory, type ForumPost, type PortalServerId, type WorldMessage,
} from "@/stores/useCommunityPortalStore";

const CATEGORY_LABELS: Record<ForumCategory, string> = {
  general: "Thảo luận chung", build: "Hướng dẫn build đồ 4 phái", boss: "Tuyển đội săn Boss", notice: "Thông báo bảo trì",
};
const CLASS_NAMES: Record<string, string> = { tank: "Hộ Vệ", fighter: "Chiến Binh", assassin: "Sát Thủ", gunner: "Xạ Thủ" };
const CHAT_LABELS: Record<ChatChannel, string> = { world: "🌍 Thế Giới", server: "🏰 Máy Chủ", party: "🤝 Tổ Đội" };

function formatDate(value?: string) {
  if (!value) return "Chưa rõ";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Chưa rõ" : new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

function combatPower(character: Character) {
  return Math.round(character.atk * 3 + character.def * 2 + character.maxHp * 0.12 + character.spd * 2 + character.level * 25);
}

export default function CommunityPortalScreen() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeForumCategory, setActiveForumCategory] = useState<ForumCategory | "all">("all");
  const [activeChatChannel, setActiveChatChannel] = useState<ChatChannel>("world");
  const [postTitle, setPostTitle] = useState("");
  const [postBody, setPostBody] = useState("");
  const [postCategory, setPostCategory] = useState<ForumCategory>("general");
  const [chatInput, setChatInput] = useState("");
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { data: user, isLoading: userLoading } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: characters = [], isLoading: charactersLoading } = useGetCharacters({ query: { queryKey: getGetCharactersQueryKey() } });
  const { data: leaderboard = [] } = useGetLeaderboard({ query: { queryKey: getGetLeaderboardQueryKey() } });
  const logout = useLogout();

  const selectedRegion = useCommunityPortalStore((state) => state.selectedRegion);
  const selectedServer = useCommunityPortalStore((state) => state.selectedServer);
  const featuredCharacterId = useCommunityPortalStore((state) => state.featuredCharacterId);
  const characterRealms = useCommunityPortalStore((state) => state.characterRealms);
  const posts = useCommunityPortalStore((state) => state.posts);
  const messages = useCommunityPortalStore((state) => state.messages);
  const setRegion = useCommunityPortalStore((state) => state.setRegion);
  const setServer = useCommunityPortalStore((state) => state.setServer);
  const setLaunchRequested = useCommunityPortalStore((state) => state.setLaunchRequested);
  const setFeaturedCharacter = useCommunityPortalStore((state) => state.setFeaturedCharacter);
  const addPost = useCommunityPortalStore((state) => state.addPost);
  const toggleLike = useCommunityPortalStore((state) => state.toggleLike);
  const addComment = useCommunityPortalStore((state) => state.addComment);
  const addMessage = useCommunityPortalStore((state) => state.addMessage);

  const charList = Array.isArray(characters) ? characters : [];
  const featuredCharacter = charList.find((character) => character.id === featuredCharacterId)
    ?? [...charList].sort((a, b) => b.level - a.level)[0];
  const selectedServerInfo = SERVERS.find((server) => server.id === selectedServer) ?? SERVERS[0];
  const selectedRegionInfo = REGIONS.find((region) => region.id === selectedRegion) ?? REGIONS[0];
  const { data: featuredInventory = [] } = useGetInventory(featuredCharacter?.id ?? 0, {
    query: { queryKey: getGetInventoryQueryKey(featuredCharacter?.id ?? 0), enabled: !!featuredCharacter?.id },
  });
  const battleLogQueries = useQueries({ queries: charList.map((character) => ({
    queryKey: getGetBattleLogQueryKey(character.id),
    queryFn: () => getBattleLog(character.id),
  })) });

  useEffect(() => {
    if (!userLoading && !user) setLocation("/login");
    if (user) {
      useCommunityPortalStore.getState().syncWithUserProfile(user);
    }
  }, [user, userLoading, setLocation]);

  useEffect(() => {
    if (featuredCharacter && featuredCharacter.id !== featuredCharacterId) setFeaturedCharacter(featuredCharacter.id);
  }, [featuredCharacter, featuredCharacterId, setFeaturedCharacter]);

  const filteredPosts = useMemo(
    () => activeForumCategory === "all" ? posts : posts.filter((post) => post.category === activeForumCategory),
    [activeForumCategory, posts],
  );
  const s1Characters = charList.filter((character) => characterRealms[character.id]?.server === "s1");
  const visibleMessages = messages.filter((message) => {
    if (message.channel !== activeChatChannel) return false;
    return activeChatChannel !== "server" || message.serverName === `${selectedServerInfo.code} - ${selectedServerInfo.name}`;
  });
  const totalGold = charList.reduce((total, character) => total + character.gold, 0);
  const totalKills = charList.reduce((total, character) => total + character.kills, 0);
  const totalPower = charList.reduce((total, character) => total + combatPower(character), 0);
  const battleLogs = battleLogQueries.flatMap((query) => query.data ?? []);
  const victories = battleLogs.filter((log) => log.victory).length;
  const winRate = battleLogs.length ? Math.round((victories / battleLogs.length) * 100) : 0;
  const topRank = leaderboard.find((entry) => entry.username === user?.username)?.rank;
  const title = topRank === 1 ? "Chiến Thần Đại Lục" : charList.length ? "Tân Thủ Long Tộc" : "Lữ Khách Long Tộc";
  const userKey = `user-${user?.id ?? "guest"}`;
  const memberSince = formatDate(user?.createdAt);

  const handleLogout = () => logout.mutate(undefined, {
    onSuccess: async () => {
      try {
        localStorage.removeItem("clb_token");
      } catch {}
      queryClient.setQueryData(getGetMeQueryKey(), null);
      await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      setLocation("/login");
    },
  });

  const handlePublish = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!postTitle.trim() || !postBody.trim()) return;
    const post: ForumPost = {
      id: `post-${Date.now()}`, title: postTitle.trim(), body: postBody.trim(), category: postCategory,
      author: featuredCharacter?.name ?? user?.username ?? "Lữ Khách",
      className: featuredCharacter ? CLASS_NAMES[featuredCharacter.classId] ?? featuredCharacter.className : "Chưa chọn hệ phái",
      serverName: `${selectedServerInfo.code} - ${selectedServerInfo.name}`,
      createdAt: new Date().toISOString(), likes: [], comments: [],
    };
    addPost(post);
    setPostTitle("");
    setPostBody("");
    toast({ title: "Đã đăng bài", description: "Bài viết đã được lưu trên thiết bị này." });
  };

  const sendChatMessage = (body: string) => {
    const text = body.trim();
    if (!text) return;
    const message: WorldMessage = {
      id: `message-${Date.now()}`, channel: activeChatChannel,
      serverName: `${selectedServerInfo.code} - ${selectedServerInfo.name}`,
      characterName: featuredCharacter?.name ?? user?.username ?? "Lữ Khách",
      className: featuredCharacter ? CLASS_NAMES[featuredCharacter.classId] ?? featuredCharacter.className : "Lữ Khách",
      level: featuredCharacter?.level ?? 1, body: text,
    };
    addMessage(message);
    setChatInput("");
    window.setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
  };

  if (userLoading || charactersLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center bg-[#0b0e14] text-sm font-bold tracking-widest text-[#00f2ff]">ĐANG KẾT NỐI CỔNG LONG TỘC...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0b0e14] text-[#e7e9ed] [background-image:radial-gradient(ellipse_at_50%_-15%,rgba(255,180,0,0.12),transparent_45%),linear-gradient(135deg,rgba(0,242,255,0.025)_25%,transparent_25%,transparent_50%,rgba(0,242,255,0.025)_50%,rgba(0,242,255,0.025)_75%,transparent_75%,transparent)] [background-size:auto,44px_44px]">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b0e14]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-7">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center border border-[#ffb400]/50 bg-[#ffb400]/10 text-[#ffb400]"><Swords className="h-5 w-5" /></div>
            <div><p className="text-sm font-black tracking-[0.1em] text-white">CHIẾN LONG BÁ</p><p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#ffb400]">Realm of Legends</p></div>
          </div>
          <nav className="order-3 flex w-full items-center gap-1 overflow-x-auto border-t border-white/5 pt-2 lg:order-none lg:w-auto lg:border-0 lg:pt-0">
            <a href="#forum" className="whitespace-nowrap border-b-2 border-[#ffb400] px-3 py-2 text-xs font-bold text-white">⌂ Trang Chủ Diễn Đàn</a>
            <a href="#news" className="whitespace-nowrap px-3 py-2 text-xs font-semibold text-white/55 hover:text-white"><Newspaper className="mr-1 inline h-3.5 w-3.5" />Tin Tức & Sự Kiện</a>
            <a href="#rank" className="whitespace-nowrap px-3 py-2 text-xs font-semibold text-white/55 hover:text-white"><Trophy className="mr-1 inline h-3.5 w-3.5" />Bảng Xếp Hạng</a>
            <a href="#classes" className="whitespace-nowrap px-3 py-2 text-xs font-semibold text-white/55 hover:text-white"><BookOpen className="mr-1 inline h-3.5 w-3.5" />Cẩm Nang 4 Hệ Phái</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden text-right sm:block"><p className="max-w-32 truncate text-xs font-bold text-white">{user.username}</p><p className="text-[9px] font-bold uppercase tracking-wider text-[#ffb400]">✦ Thành viên</p></div>
            <button type="button" onClick={handleLogout} title="Đăng xuất" className="grid h-9 w-9 place-items-center border border-white/10 text-white/60 transition hover:border-rose-400/50 hover:text-rose-300"><LogOut className="h-4 w-4" /></button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1600px] grid-cols-1 items-start gap-4 px-3 py-5 sm:px-5 xl:grid-cols-[270px_minmax(420px,1fr)_310px] xl:gap-5 xl:px-7">
        <aside className="space-y-4">
          <section className="overflow-hidden border border-white/10 bg-[#111720]">
            <div className="flex items-center gap-3 border-b border-white/10 bg-[#151c25] p-4">
              {featuredCharacter ? <div className="h-14 w-14 shrink-0 border border-[#ffb400]/40 bg-[#0b0e14] p-1"><ClassSprite classId={featuredCharacter.classId} gender="male" className="h-full w-full" /></div> : <div className="grid h-14 w-14 place-items-center border border-white/10 bg-[#0b0e14] text-white/40"><CircleUserRound /></div>}
              <div className="min-w-0"><p className="truncate font-black text-white">{user.username}</p><p className="mt-1 text-[10px] font-bold text-[#ffb400]">{title}</p><p className="mt-1 text-[10px] text-white/40">ID {user.id} · Từ {memberSince}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-px bg-white/10">
              <StatTile label="Lực chiến" value={totalPower.toLocaleString("vi-VN")} icon={<Swords className="h-3.5 w-3.5" />} />
              <StatTile label="Tổng vàng" value={totalGold.toLocaleString("vi-VN")} icon={<span>🪙</span>} />
              <StatTile label="Quái hạ gục" value={totalKills.toLocaleString("vi-VN")} icon={<Flame className="h-3.5 w-3.5" />} />
              <StatTile label="Tỉ lệ thắng" value={`${winRate}%`} icon={<Trophy className="h-3.5 w-3.5" />} />
            </div>
            <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-[10px]"><span className="text-white/45">Thành viên từ</span><span className="font-semibold text-white/80">{memberSince}</span></div>
          </section>

          <section className="border border-white/10 bg-[#111720] p-4">
            <div className="mb-3 flex items-center justify-between"><h2 className="text-xs font-black uppercase tracking-widest text-white">Nhân vật của tôi</h2><span className="text-[10px] text-white/35">{charList.length} / 4</span></div>
            {charList.length ? <div className="space-y-2">{charList.map((character) => {
              const active = featuredCharacter?.id === character.id;
              return <button key={character.id} type="button" onClick={() => setFeaturedCharacter(character.id)} className={`flex w-full items-center gap-2 border p-2 text-left transition ${active ? "border-[#ffb400]/50 bg-[#ffb400]/10" : "border-white/5 bg-[#0b0e14] hover:border-white/20"}`}>
                <span className="h-9 w-9 shrink-0"><ClassSprite classId={character.classId} gender="male" className="h-full w-full" /></span><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-bold text-white">{character.name}</span><span className="block text-[9px] text-white/45">{CLASS_NAMES[character.classId] ?? character.className} · Lv.{character.level}</span></span>{active && <span className="text-[9px] font-black text-[#ffb400]">ĐẠI DIỆN</span>}
              </button>;
            })}</div> : <p className="text-xs leading-5 text-white/45">Chưa có nhân vật. Chọn server và vào game để tạo anh hùng đầu tiên.</p>}
            <div className="mt-3 flex items-center gap-2 border-t border-white/5 pt-3 text-[10px] text-white/40"><CalendarDays className="h-3.5 w-3.5" />Đại diện diễn đàn có thể đổi bất cứ lúc nào</div>
          </section>
          <section id="rank" className="border border-white/10 bg-[#111720] p-4">
            <div className="mb-3 flex items-center gap-2"><Trophy className="h-4 w-4 text-[#ffb400]" /><h2 className="text-xs font-black uppercase tracking-widest text-white">Bảng vinh danh</h2></div>
            {leaderboard.slice(0, 3).map((entry) => <div key={`${entry.rank}-${entry.characterName}`} className="flex items-center justify-between border-t border-white/5 py-2 text-[10px]"><span className="truncate text-white/75">#{entry.rank} {entry.characterName}</span><span className="shrink-0 text-[#ffb400]">Lv.{entry.level}</span></div>)}
            {!leaderboard.length && <p className="text-[10px] text-white/40">Bảng xếp hạng chưa có dữ liệu.</p>}
          </section>
        </aside>

        <div className="min-w-0 space-y-4">
          <section className="relative overflow-hidden border border-[#ffb400]/30 bg-[linear-gradient(115deg,#171a1b,#111720_58%,#172127)] p-4 sm:p-5">
            <div className="pointer-events-none absolute -right-8 -top-12 h-48 w-48 rounded-full border border-[#ffb400]/10" /><div className="pointer-events-none absolute -right-1 -top-5 h-32 w-32 rounded-full border border-[#00f2ff]/10" />
            <div className="relative mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#00f2ff]">CỔNG DỊCH CHUYỂN</p><h1 className="mt-1 text-xl font-black text-white sm:text-2xl">Chọn vùng & máy chủ</h1><p className="mt-1 text-[10px] text-white/40">Chọn nơi hành trình của bạn bắt đầu.</p></div><span className="border border-white/10 bg-black/20 px-2.5 py-1.5 text-[10px] text-white/55"><Globe2 className="mr-1 inline h-3 w-3 text-[#00f2ff]" />{selectedRegionInfo.shortName}</span></div>
            <div className="relative mb-3 grid grid-cols-1 gap-1.5 sm:grid-cols-3">{REGIONS.map((region) => <button key={region.id} type="button" onClick={() => setRegion(region.id)} className={`min-h-10 border px-2 py-2 text-left text-[10px] font-bold transition ${selectedRegion === region.id ? "border-[#00f2ff]/60 bg-[#00f2ff]/10 text-white" : "border-white/10 bg-black/20 text-white/50 hover:border-white/25"}`}><span className="block">{region.label}</span><span className="mt-0.5 block text-[9px] opacity-60">{region.shortName}</span></button>)}</div>
            <div className="relative grid grid-cols-1 gap-2 sm:grid-cols-2">{SERVERS.map((server) => {
              const active = selectedServer === server.id;
              const toneClass = server.tone === "danger" ? "text-orange-300" : server.tone === "new" ? "text-[#ffcf52]" : "text-emerald-300";
              return <button key={server.id} type="button" onClick={() => setServer(server.id as PortalServerId)} className={`min-h-[82px] border p-3 text-left transition ${active ? "border-[#ffb400]/70 bg-[#ffb400]/[0.08] shadow-[inset_0_0_20px_rgba(255,180,0,0.06)]" : "border-white/10 bg-[#0b0e14]/65 hover:border-white/25"}`}>
                <span className="flex items-center justify-between gap-2"><span className="text-[9px] font-black tracking-widest text-[#ffb400]">{server.code}</span>{active && <span className="text-[8px] font-black tracking-wider text-[#ffb400]">ĐANG CHỌN</span>}</span><span className="mt-1 block text-xs font-black text-white">{server.name}</span><span className={`mt-1 block text-[9px] font-bold ${toneClass}`}>{server.status}</span>{server.id === "s1" && s1Characters.map((character) => <span key={character.id} className="mt-1 block text-[9px] text-[#00f2ff]">Nhân vật của bạn: Lv.{character.level}</span>)}
              </button>;
            })}</div>
            <button type="button" onClick={() => { setLaunchRequested(true); setLocation("/characters"); }} className="relative mt-4 flex min-h-14 w-full items-center justify-center gap-3 border border-[#ffb400] bg-[linear-gradient(180deg,#ffd15a,#c47a08)] px-4 py-3 text-center text-xs font-black tracking-wider text-[#17120a] shadow-[0_0_28px_rgba(255,180,0,0.18)] transition hover:brightness-110 active:translate-y-px sm:text-sm"><Swords className="h-5 w-5 shrink-0" /><span>VÀO GAME NGAY — {selectedServerInfo.code} · {selectedServerInfo.name}</span><ChevronRight className="h-4 w-4 shrink-0" /></button>
          </section>

          <section id="forum" className="border border-white/10 bg-[#111720]">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 p-4"><div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#00f2ff]">Long Tộc tụ hội</p><h2 className="mt-1 text-base font-black text-white">Diễn đàn cộng đồng</h2></div><span className="inline-flex items-center gap-1 text-[10px] text-white/40"><Users className="h-3.5 w-3.5" />{posts.length} chủ đề</span></div>
            <div className="flex gap-1 overflow-x-auto border-b border-white/5 px-3 py-2">{(["all", "general", "build", "boss", "notice"] as const).map((category) => <button key={category} type="button" onClick={() => setActiveForumCategory(category)} className={`whitespace-nowrap px-2.5 py-1.5 text-[9px] font-bold transition ${activeForumCategory === category ? "bg-[#ffb400]/15 text-[#ffcf52]" : "text-white/40 hover:text-white"}`}>{category === "all" ? "📌 Tất Cả" : `${category === "general" ? "🔥" : category === "build" ? "⚔️" : category === "boss" ? "🐉" : "📢"} ${CATEGORY_LABELS[category]}`}</button>)}</div>
            <form onSubmit={handlePublish} className="space-y-2 border-b border-white/10 bg-[#0d1219] p-3 sm:p-4">
              <div className="flex flex-col gap-2 sm:flex-row"><input value={postTitle} onChange={(event) => setPostTitle(event.target.value)} maxLength={120} placeholder="Tiêu đề bài viết..." className="h-10 min-w-0 flex-1 border border-white/10 bg-[#111720] px-3 text-xs text-white outline-none placeholder:text-white/30 focus:border-[#00f2ff]/50" /><select value={postCategory} onChange={(event) => setPostCategory(event.target.value as ForumCategory)} className="h-10 border border-white/10 bg-[#111720] px-2 text-[10px] text-white"><option value="general">Thảo luận chung</option><option value="build">Build đồ 4 phái</option><option value="boss">Tuyển đội săn Boss</option><option value="notice">Thông báo</option></select></div>
              <div className="flex gap-2"><textarea value={postBody} onChange={(event) => setPostBody(event.target.value)} rows={2} maxLength={1000} placeholder="Chia sẻ chiến thuật, câu hỏi hoặc lời mời tổ đội..." className="min-h-10 min-w-0 flex-1 resize-y border border-white/10 bg-[#111720] px-3 py-2 text-xs text-white outline-none placeholder:text-white/30 focus:border-[#00f2ff]/50" /><button type="submit" disabled={!postTitle.trim() || !postBody.trim()} className="flex shrink-0 items-center gap-1.5 bg-[#00f2ff] px-3 text-[10px] font-black text-[#061115] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"><Plus className="h-4 w-4" />Đăng bài</button></div>
              <p className="text-[9px] text-white/35">Đăng với {featuredCharacter?.name ?? user.username} · {featuredCharacter ? CLASS_NAMES[featuredCharacter.classId] ?? featuredCharacter.className : "Chưa có hệ phái"} · {selectedServerInfo.code}</p>
            </form>
            <div className="divide-y divide-white/5">{filteredPosts.map((post) => <ForumPostView key={post.id} post={post} userKey={userKey} expanded={expandedPostId === post.id} commentDraft={commentDraft} onLike={() => toggleLike(post.id, userKey)} onToggle={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)} onDraft={setCommentDraft} onComment={() => { if (commentDraft.trim()) { addComment(post.id, { id: `comment-${Date.now()}`, author: featuredCharacter?.name ?? user.username, body: commentDraft.trim(), createdAt: new Date().toISOString() }); setCommentDraft(""); } }} />)}{!filteredPosts.length && <p className="p-5 text-center text-xs text-white/40">Chưa có bài viết trong chuyên mục này.</p>}</div>
          </section>
          <section id="classes" className="grid grid-cols-2 gap-2 sm:grid-cols-4">{Object.entries(CLASS_NAMES).map(([id, name]) => <div key={id} className="flex items-center gap-2 border border-white/10 bg-[#111720] p-2.5"><Shield className="h-4 w-4 shrink-0 text-[#00f2ff]" /><span className="text-[10px] font-bold text-white">{name}</span><BookOpen className="ml-auto h-3 w-3 text-white/30" /></div>)}</section>
        </div>

        <aside className="border border-white/10 bg-[#111720] xl:sticky xl:top-[88px]">
          <div className="flex items-center justify-between border-b border-white/10 p-4"><div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#00f2ff]">Liên thông trực tuyến</p><h2 className="mt-1 text-sm font-black text-white">Trò chuyện thế giới</h2></div><span className="flex items-center gap-1 text-[9px] text-emerald-300"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />Trực tuyến</span></div>
          <div className="grid grid-cols-3 border-b border-white/10">{(Object.keys(CHAT_LABELS) as ChatChannel[]).map((channel) => <button key={channel} type="button" onClick={() => setActiveChatChannel(channel)} className={`border-b-2 px-1 py-2.5 text-[9px] font-bold ${activeChatChannel === channel ? "border-[#00f2ff] bg-[#00f2ff]/5 text-[#00f2ff]" : "border-transparent text-white/40 hover:text-white"}`}>{CHAT_LABELS[channel]}</button>)}</div>
          <div className="flex h-[300px] flex-col gap-2 overflow-y-auto p-3 [scrollbar-color:#38434c_transparent] [scrollbar-width:thin] sm:h-[380px]">{visibleMessages.map((message) => <div key={message.id} className={message.system ? "border border-[#ffb400]/15 bg-[#ffb400]/[0.04] p-2" : "border-l border-white/10 pl-2"}>
            <p className={`text-[9px] ${message.system ? "font-bold leading-4 text-[#ffcf52]" : "text-white/35"}`}>{message.system ? message.body : <><span className="text-[#00f2ff]">[{message.serverName.split(" - ")[0]}]</span> <span className="text-[#ffcf52]">[{message.className} · Lv.{message.level}]</span></>}</p>{!message.system && <p className="mt-0.5 break-words text-[10px] leading-4 text-white/80"><span className="font-bold text-white">{message.characterName}:</span> {message.body}</p>}
          </div>)}<div ref={chatEndRef} /></div>
          <div className="border-t border-white/10 p-3"><div className="mb-2 flex flex-wrap items-center justify-between gap-2"><span className="text-[9px] text-white/35">Kênh {CHAT_LABELS[activeChatChannel]}</span><div className="flex gap-3"><button type="button" onClick={() => sendChatMessage(`⚔️ Thẻ nhân vật: ${featuredCharacter?.name ?? "Lữ Khách"} · Lv.${featuredCharacter?.level ?? 1} · ${featuredCharacter ? CLASS_NAMES[featuredCharacter.classId] ?? featuredCharacter.className : "Chưa chọn hệ phái"}`)} className="text-[9px] font-bold text-[#ffcf52] hover:text-[#ffb400]">+ Khoe nhân vật</button><button type="button" onClick={() => { const gear = featuredInventory.filter((item) => item.equipped).map((item) => item.name); sendChatMessage(`🛡️ Trang bị ${featuredCharacter?.name ?? "Lữ Khách"}: ${gear.length ? gear.join(", ") : "chưa có trang bị đang mặc"}`); }} className="text-[9px] font-bold text-[#00f2ff] hover:brightness-125">+ Khoe trang bị</button></div></div><form onSubmit={(event) => { event.preventDefault(); sendChatMessage(chatInput); }} className="flex gap-1.5"><input value={chatInput} onChange={(event) => setChatInput(event.target.value)} maxLength={240} placeholder="Nhắn tin..." className="h-9 min-w-0 flex-1 border border-white/10 bg-[#0b0e14] px-2.5 text-[10px] text-white outline-none placeholder:text-white/30 focus:border-[#00f2ff]/40" /><button type="submit" title="Gửi tin nhắn" className="grid h-9 w-9 shrink-0 place-items-center bg-[#00f2ff] text-[#061115] hover:brightness-110"><Send className="h-4 w-4" /></button></form><p className="mt-1.5 text-[8px] text-white/25">Enter để gửi · Tin nhắn được lưu trên thiết bị này</p></div>
        </aside>
      </main>
      <footer id="news" className="border-t border-white/5 px-4 py-4 text-center text-[9px] text-white/25">CHIẾN LONG BÁ · REALM OF LEGENDS · KÊNH CỘNG ĐỒNG MÔ PHỎNG</footer>
    </div>
  );
}

function StatTile({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return <div className="bg-[#111720] p-3"><p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-white/40">{icon}{label}</p><p className="mt-1 text-sm font-black text-white">{value}</p></div>;
}

function ForumPostView({ post, userKey, expanded, commentDraft, onLike, onToggle, onDraft, onComment }: {
  post: ForumPost; userKey: string; expanded: boolean; commentDraft: string;
  onLike: () => void; onToggle: () => void; onDraft: (value: string) => void; onComment: () => void;
}) {
  return <article className="p-4">
    <div className="mb-2 flex flex-wrap items-center gap-2"><span className="bg-[#00f2ff]/10 px-2 py-1 text-[8px] font-black uppercase tracking-wider text-[#00f2ff]">{CATEGORY_LABELS[post.category]}</span><span className="text-[9px] text-white/35">{post.serverName} · {formatDate(post.createdAt)}</span></div>
    <h3 className="text-sm font-black leading-5 text-white">{post.title}</h3><p className="mt-2 text-[11px] leading-5 text-white/55">{post.body}</p>
    <div className="mt-3 flex flex-wrap items-center gap-3 text-[9px]"><span className="text-white/40">{post.author} · {post.className}</span><button type="button" onClick={onLike} className={`flex items-center gap-1 font-bold ${post.likes.includes(userKey) ? "text-rose-300" : "text-white/45 hover:text-rose-300"}`}><Heart className={`h-3.5 w-3.5 ${post.likes.includes(userKey) ? "fill-current" : ""}`} />{post.likes.length}</button><button type="button" onClick={onToggle} className="flex items-center gap-1 text-white/45 hover:text-[#00f2ff]"><MessageCircle className="h-3.5 w-3.5" />{post.comments.length} bình luận</button><button type="button" onClick={onToggle} className="ml-auto flex items-center gap-1 font-bold text-[#00f2ff]">Chi tiết <ChevronRight className={`h-3 w-3 transition ${expanded ? "rotate-90" : ""}`} /></button></div>
    {expanded && <div className="mt-3 border-t border-white/5 pt-3">{post.comments.map((comment) => <p key={comment.id} className="mb-2 text-[10px] leading-4 text-white/55"><span className="font-bold text-white/80">{comment.author}:</span> {comment.body}</p>)}<form onSubmit={(event) => { event.preventDefault(); onComment(); }} className="flex gap-2"><input value={commentDraft} onChange={(event) => onDraft(event.target.value)} maxLength={300} placeholder="Viết bình luận..." className="h-8 min-w-0 flex-1 border border-white/10 bg-[#0b0e14] px-2 text-[10px] text-white outline-none placeholder:text-white/30" /><button type="submit" className="border border-white/10 px-2 text-[9px] font-bold text-[#00f2ff] hover:bg-[#00f2ff]/10">Gửi</button></form></div>}
  </article>;
}