import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { 
  useGetMe, 
  getGetMeQueryKey, 
  useGetCharacters, 
  getGetCharactersQueryKey,
  useGetCharacter,
  getGetCharacterQueryKey,
  useGetMonsters,
  getGetMonstersQueryKey,
  useGetClasses,
  getGetClassesQueryKey,
  useStartBattle,
  useGetBattleLog,
  getGetBattleLogQueryKey,
  useGetLeaderboard,
  getGetLeaderboardQueryKey,
  useLogout,
  type Character,
  type BattleResult
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ClassSprite } from '@/components/ClassSprite';
import { MonsterSprite } from '@/components/MonsterSprite';
import { BattleModal } from '@/components/BattleModal';
import { GameMenuSheet } from '@/components/GameMenuSheet';
import { useToast } from '@/hooks/use-toast';
import Game from '@/game/Game';
import { Backpack, Swords, User, Trophy, Coins, Heart, Zap, Shield, Gauge, LogOut, Settings, Sparkles, Compass } from 'lucide-react';

export default function GamePage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('battle');
  const [view3D, setView3D] = useState(true);
  const [dungeonModalOpen, setDungeonModalOpen] = useState(false);
  const [leaderboardModalOpen, setLeaderboardModalOpen] = useState(false);
  const [battleModalOpen, setBattleModalOpen] = useState(false);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [selectedMonster, setSelectedMonster] = useState<{ id: string; name: string; hp: number } | null>(null);
  const [gameMenuOpen, setGameMenuOpen] = useState(false);
  const [gearMenuOpen, setGearMenuOpen] = useState(false);
  const [menuInitialTab, setMenuInitialTab] = useState<'inventory' | 'skills' | 'settings'>('inventory');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading: userLoading } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: characters, isLoading: charactersLoading } = useGetCharacters({ query: { queryKey: getGetCharactersQueryKey() } });
  const character = characters?.[0];
  
  const { data: characterDetail, isLoading: characterLoading } = useGetCharacter(
    character?.id || 0,
    { query: { queryKey: getGetCharacterQueryKey(character?.id || 0), enabled: !!character?.id } }
  );
  
  const { data: monsters, isLoading: monstersLoading } = useGetMonsters({ query: { queryKey: getGetMonstersQueryKey() } });
  const { data: classes } = useGetClasses({ query: { queryKey: getGetClassesQueryKey() } });
  const { data: battleLog } = useGetBattleLog(
    character?.id || 0,
    { query: { queryKey: getGetBattleLogQueryKey(character?.id || 0), enabled: !!character?.id } }
  );
  const { data: leaderboard } = useGetLeaderboard({ query: { queryKey: getGetLeaderboardQueryKey() } });
  
  const startBattle = useStartBattle();
  const logout = useLogout();

  useEffect(() => {
    if (!userLoading && !user) {
      setLocation('/');
    } else if (!charactersLoading && (!characters || characters.length === 0)) {
      setLocation('/select-class');
    }
  }, [user, userLoading, characters, charactersLoading, setLocation]);

  const handleBattle = (monsterId: string) => {
    if (!character) return;
    const monster = monsters?.find((entry) => entry.id === monsterId);
    if (monster) {
      setSelectedMonster({ id: monster.id, name: monster.name, hp: monster.hp });
    }

    startBattle.mutate(
      { characterId: character.id, data: { monsterId } },
      {
        onSuccess: async (result) => {
          setBattleResult(result);
          setDungeonModalOpen(false);
          setBattleModalOpen(true);
          await queryClient.invalidateQueries({ queryKey: getGetCharacterQueryKey(character.id) });
          await queryClient.invalidateQueries({ queryKey: getGetBattleLogQueryKey(character.id) });
          await queryClient.invalidateQueries({ queryKey: getGetLeaderboardQueryKey() });
        },
        onError: (error: any) => {
          toast({
            variant: 'destructive',
            title: 'Chiến đấu thất bại',
            description: error?.message || 'Đã có lỗi xảy ra',
          });
        },
      }
    );
  };

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setLocation('/');
      },
    });
  };

  const openCharacterMenu = (tab: 'inventory' | 'skills' | 'settings') => {
    setMenuInitialTab(tab);
    setGearMenuOpen(false);
    setGameMenuOpen(true);
  };

  if (userLoading || charactersLoading || characterLoading || !characterDetail) {
    return (
      <div className="min-h-[100dvh] w-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang tải thế giới 3D...</p>
        </div>
      </div>
    );
  }

  const xpPercent = characterDetail.experienceToNextLevel 
    ? (characterDetail.experience / characterDetail.experienceToNextLevel) * 100 
    : 100;
  const hpPercent = (characterDetail.hp / characterDetail.maxHp) * 100;

  if (view3D) {
    return (
      <div className="fixed inset-0 z-50 bg-black overflow-hidden select-none">
        {/* Floating Top In-Game RPG Bar */}
        <div className="absolute top-3 left-3 z-30 flex items-center gap-3 bg-slate-950/80 backdrop-blur-md border border-amber-500/40 rounded-xl px-4 py-2 shadow-2xl">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/30 to-purple-600/30 border border-amber-400/50 flex items-center justify-center">
            <ClassSprite classId={characterDetail.classId} className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm text-amber-200 tracking-wide">{characterDetail.name}</span>
              <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/40">
                Lv.{characterDetail.level} {characterDetail.className}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs mt-0.5">
              <span className="text-red-400 font-bold flex items-center gap-1">
                ❤️ {characterDetail.hp}/{characterDetail.maxHp}
              </span>
              <span className="text-yellow-400 font-bold flex items-center gap-1">
                💰 {characterDetail.gold}
              </span>
            </div>
          </div>
        </div>

        {/* Floating Top Right Action Hub */}
        <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setDungeonModalOpen(true)}
            className="bg-red-600/90 hover:bg-red-500 text-white font-bold text-xs h-9 px-3 rounded-lg shadow-lg border border-red-400/40 flex items-center gap-1.5"
          >
            <span>⚔️</span> Phó Bản Boss
          </Button>

          <Button
            size="sm"
            onClick={() => setLeaderboardModalOpen(true)}
            className="bg-purple-600/90 hover:bg-purple-500 text-white font-bold text-xs h-9 px-3 rounded-lg shadow-lg border border-purple-400/40 flex items-center gap-1.5"
          >
            <span>🏆</span> Xếp Hạng
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setView3D(false)}
            className="bg-slate-900/80 hover:bg-slate-800 text-slate-300 font-semibold text-xs h-9 px-2.5 rounded-lg border border-slate-700"
            title="Chuyển sang Bảng Điều Khiển Web 2D"
          >
            <span>📋</span> Bảng 2D
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleLogout}
            className="text-slate-400 hover:text-red-400 h-9 w-9 p-0"
            title="Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>

        {/* 3D Action Core */}
        <Game
          character={characterDetail}
          onBackToDashboard={() => setView3D(false)}
          onOpenCharacterSheet={() => {
            setView3D(false);
            setActiveTab('character');
          }}
          onSyncReward={async (reward) => {
            try {
              const res = await fetch(`/api/characters/${characterDetail.id}/3d-reward`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(reward),
              });
              if (res.ok) {
                const data = await res.json();
                if (data.leveledUp) {
                  toast({
                    title: '🎉 CHÚC MỪNG LÊN CẤP!',
                    description: `Nhân vật đã đạt Cấp ${data.character.level}!`,
                  });
                }
                await queryClient.invalidateQueries({ queryKey: getGetCharacterQueryKey(characterDetail.id) });
                await queryClient.invalidateQueries({ queryKey: getGetLeaderboardQueryKey() });
              }
            } catch (err) {
              console.error('Failed to sync 3D reward:', err);
            }
          }}
        />

        {/* In-Game Dungeon Boss Modal */}
        {dungeonModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-red-500/50 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-white">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🐉</span>
                  <h3 className="text-lg font-black text-amber-300">PHÓ BẢN SĂN BOSS HUYỀN THOẠI</h3>
                </div>
                <button
                  onClick={() => setDungeonModalOpen(false)}
                  className="text-slate-400 hover:text-white text-lg font-bold px-2 py-1"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {monsters?.map((monster) => (
                  <div
                    key={monster.id}
                    className="flex items-center justify-between p-3.5 bg-slate-950/70 border border-slate-800 hover:border-amber-500/50 rounded-xl transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-800/80 rounded-lg p-1 flex items-center justify-center border border-slate-700">
                        <MonsterSprite monsterId={monster.id} className="w-10 h-10" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-100">{monster.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <span className="text-red-400 font-semibold">HP: {monster.hp}</span>
                          <span>•</span>
                          <span className="text-amber-400 font-semibold">Công: {monster.atk}</span>
                          <span>•</span>
                          <span className="text-yellow-400">+{monster.expReward} EXP</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleBattle(monster.id)}
                      disabled={startBattle.isPending}
                      className="bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow"
                    >
                      {startBattle.isPending ? 'Đang vào...' : '⚔️ Khiêu Chiến'}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* In-Game Leaderboard Modal */}
        {leaderboardModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-purple-500/50 rounded-2xl max-w-md w-full p-6 shadow-2xl text-white">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏆</span>
                  <h3 className="text-lg font-black text-purple-300">BẢNG VINH DANH CAO THỦ</h3>
                </div>
                <button
                  onClick={() => setLeaderboardModalOpen(false)}
                  className="text-slate-400 hover:text-white text-lg font-bold px-2 py-1"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {leaderboard?.map((hero, index) => (
                  <div
                    key={`${hero.characterName}-${index}`}
                    className="flex items-center justify-between p-3 bg-slate-950/70 border border-slate-800 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-center font-black text-sm text-amber-400">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </span>
                      <div>
                        <p className="font-bold text-sm text-slate-100">{hero.characterName}</p>
                        <p className="text-[11px] text-slate-400">{hero.className}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">
                        Cấp {hero.level}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1">{hero.kills} quái diệt</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Battle Modal Over 3D */}
        <BattleModal
          open={battleModalOpen}
          onOpenChange={setBattleModalOpen}
          battleResult={battleResult}
          classId={characterDetail.classId}
          monsterId={selectedMonster?.id}
          monsterName={selectedMonster?.name}
          monsterMaxHp={selectedMonster?.hp}
        />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full bg-gradient-to-b from-background to-card pb-20">
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Character Header */}
        <div className="bg-card border border-card-border rounded-xl p-4 mb-6 shadow-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 flex-shrink-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg p-2 border border-primary/30">
              <ClassSprite classId={characterDetail.classId} className="w-full h-full" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-bold text-foreground">{characterDetail.name}</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  data-testid="button-logout"
                  className="h-8 px-2 text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{characterDetail.className}</p>
              <div className="flex gap-2">
                <span className="text-xs font-mono bg-primary/20 text-primary px-2 py-0.5 rounded border border-primary/30">
                  Cấp {characterDetail.level}
                </span>
                <span className="text-xs font-mono bg-accent/20 text-accent px-2 py-0.5 rounded border border-accent/30 flex items-center gap-1">
                  <Coins className="w-3 h-3" /> {characterDetail.gold}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-muted rounded-lg p-2 border border-border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Heart className="w-3 h-3" />
                <span>HP</span>
              </div>
              <p className="font-mono font-bold text-sm text-foreground">
                {characterDetail.hp}/{characterDetail.maxHp}
              </p>
            </div>
            <div className="bg-muted rounded-lg p-2 border border-border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Zap className="w-3 h-3" />
                <span>ATK</span>
              </div>
              <p className="font-mono font-bold text-sm text-foreground">{characterDetail.atk}</p>
            </div>
            <div className="bg-muted rounded-lg p-2 border border-border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Shield className="w-3 h-3" />
                <span>DEF</span>
              </div>
              <p className="font-mono font-bold text-sm text-foreground">{characterDetail.def}</p>
            </div>
            <div className="bg-muted rounded-lg p-2 border border-border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Gauge className="w-3 h-3" />
                <span>SPD</span>
              </div>
              <p className="font-mono font-bold text-sm text-foreground">{characterDetail.spd}</p>
            </div>
          </div>

          {/* HP Bar */}
          <div className="space-y-1 mb-3">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Máu</span>
              <span className="font-mono text-muted-foreground">{hpPercent.toFixed(0)}%</span>
            </div>
            <Progress 
              value={hpPercent} 
              className="h-2 bg-muted"
              indicatorClassName="bg-gradient-to-r from-destructive to-destructive/70"
            />
          </div>

          {/* XP Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Kinh nghiệm</span>
              <span className="font-mono text-muted-foreground">
                {characterDetail.experience}/{characterDetail.experienceToNextLevel || '∞'} XP
              </span>
            </div>
            <Progress 
              value={xpPercent} 
              className="h-2 bg-muted shimmer"
              indicatorClassName="bg-gradient-to-r from-secondary to-accent"
            />
          </div>
        </div>

        {/* 3D World Gateway Hero Banner */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-600/30 via-purple-600/30 to-indigo-600/30 border-2 border-amber-500/50 p-4 mb-6 shadow-2xl backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl animate-bounce">🐉</span>
                <h3 className="text-base font-black tracking-wide text-amber-300">
                  THẾ GIỚI 3D / ĐẤU TRƯỜNG 2.5D
                </h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Khám phá Làng Khởi Đầu, gặp gỡ NPC và chiến đấu quái vật thời gian thực!
              </p>
            </div>
            <Button
              onClick={() => setView3D(true)}
              className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white font-black px-4 py-3 text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-amber-500/30 whitespace-nowrap animate-pulse"
            >
              ⚔️ Vào 3D
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-4 bg-card border border-card-border h-12 mb-6">
            <TabsTrigger 
              value="3d" 
              onClick={() => setView3D(true)}
              className="font-semibold text-amber-400 hover:text-amber-300"
            >
              <Compass className="w-4 h-4 mr-1 text-amber-400" />
              Thế Giới 3D
            </TabsTrigger>
            <TabsTrigger 
              value="battle" 
              data-testid="tab-battle"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold"
            >
              <Swords className="w-4 h-4 mr-1" />
              Chiến đấu
            </TabsTrigger>
            <TabsTrigger 
              value="character" 
              data-testid="tab-character"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold"
            >
              <User className="w-4 h-4 mr-1" />
              Nhân vật
            </TabsTrigger>
            <TabsTrigger 
              value="leaderboard" 
              data-testid="tab-leaderboard"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold"
            >
              <Trophy className="w-4 h-4 mr-1" />
              BXH
            </TabsTrigger>
          </TabsList>

          {/* Battle Tab */}
          <TabsContent value="battle" className="space-y-3">
            <h3 className="text-lg font-bold text-foreground mb-3">Chọn quái vật để chiến đấu</h3>
            {monstersLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : (
              monsters?.map((monster) => (
                <div
                  key={monster.id}
                  className="bg-card border border-card-border rounded-xl p-4 hover:border-primary/50 transition-all"
                >
                  <div className="flex items-center gap-4">
                     <div className="w-16 h-16 flex items-center justify-center bg-muted rounded-lg border border-border">
                       <MonsterSprite monsterId={monster.id} className="w-14 h-14" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-foreground mb-1">{monster.name}</h4>
                      <p className="text-xs text-muted-foreground mb-2">{monster.description}</p>
                      <div className="flex gap-2 flex-wrap mb-2">
                        <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">Lv.{monster.level}</span>
                        <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">HP: {monster.hp}</span>
                        <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">ATK: {monster.atk}</span>
                        <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">DEF: {monster.def}</span>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <span className="text-secondary font-semibold">+{monster.expReward} XP</span>
                        <span className="text-accent font-semibold">+{monster.goldReward} vàng</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleBattle(monster.id)}
                    data-testid={`button-fight-${monster.id}`}
                    disabled={startBattle.isPending || characterDetail.hp <= 0}
                    className="w-full mt-3 bg-gradient-to-r from-destructive to-destructive/80 hover:from-destructive/90 hover:to-destructive/70 text-destructive-foreground font-semibold"
                  >
                    {characterDetail.hp <= 0 ? 'Không đủ máu' : startBattle.isPending ? 'Đang chiến đấu...' : 'CHIẾN ĐẤU'}
                  </Button>
                </div>
              ))
            )}
          </TabsContent>

          {/* Character Tab */}
          <TabsContent value="character" className="space-y-4">
            <div className="bg-card border border-card-border rounded-xl p-4">
              <h3 className="text-lg font-bold text-foreground mb-4">Thông tin nhân vật</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tên</span>
                  <span className="font-semibold text-foreground">{characterDetail.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Lớp</span>
                  <span className="font-semibold text-foreground">{characterDetail.className}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cấp độ</span>
                  <span className="font-semibold text-primary">{characterDetail.level}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Kinh nghiệm</span>
                  <span className="font-mono text-foreground">{characterDetail.experience} XP</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Vàng</span>
                  <span className="font-mono text-accent">{characterDetail.gold}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Chiến thắng</span>
                  <span className="font-mono text-secondary">{characterDetail.kills}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Thất bại</span>
                  <span className="font-mono text-destructive">{characterDetail.deaths}</span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-card-border rounded-xl p-4">
              <h3 className="text-lg font-bold text-foreground mb-4">Lịch sử chiến đấu</h3>
              {battleLog && battleLog.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {battleLog.map((log) => (
                    <div
                      key={log.id}
                      className={`p-3 rounded-lg border ${
                        log.victory
                          ? 'bg-secondary/10 border-secondary/30'
                          : 'bg-destructive/10 border-destructive/30'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={`font-semibold text-sm ${log.victory ? 'text-secondary' : 'text-destructive'}`}>
                          {log.victory ? 'THẮNG' : 'THUA'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <p className="text-sm text-foreground mb-1">vs {log.monsterName}</p>
                      <div className="flex gap-2 text-xs">
                        <span className="text-secondary">+{log.expGained} XP</span>
                        <span className="text-accent">+{log.goldGained} vàng</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Chưa có trận chiến nào</p>
              )}
            </div>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-3">
            <h3 className="text-lg font-bold text-foreground mb-3">Bảng xếp hạng</h3>
            {leaderboard && leaderboard.length > 0 ? (
              <div className="space-y-2">
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.rank}
                    data-testid={`leaderboard-entry-${entry.rank}`}
                    className={`p-4 rounded-xl border ${
                      index === 0
                        ? 'bg-gradient-to-r from-accent/20 to-accent/10 border-accent'
                        : index === 1
                        ? 'bg-gradient-to-r from-muted/50 to-muted/30 border-muted-foreground/30'
                        : index === 2
                        ? 'bg-gradient-to-r from-primary/20 to-primary/10 border-primary/30'
                        : 'bg-card border-card-border'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 flex items-center justify-center rounded-full font-bold ${
                          index === 0
                            ? 'bg-accent text-accent-foreground'
                            : index === 1
                            ? 'bg-muted-foreground text-background'
                            : index === 2
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        #{entry.rank}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-foreground">{entry.characterName}</p>
                        <p className="text-xs text-muted-foreground">{entry.className} • {entry.username}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-primary">Lv.{entry.level}</p>
                        <p className="text-xs text-muted-foreground">{entry.experience} XP</p>
                        <p className="text-xs text-secondary">{entry.kills} kills</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Chưa có dữ liệu xếp hạng</p>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <BattleModal
        open={battleModalOpen}
        onOpenChange={setBattleModalOpen}
        battleResult={battleResult}
        classId={characterDetail.classId}
        monsterId={selectedMonster?.id}
        monsterName={selectedMonster?.name}
        monsterMaxHp={selectedMonster?.hp}
      />
      {!gameMenuOpen && (
        <div
          className="fixed bottom-5 right-5 z-40 h-14 w-14 sm:right-[calc(50%_-_250px)]"
          onKeyDown={(event) => {
            if (event.key === 'Escape') setGearMenuOpen(false);
          }}
        >
          <div
            className={`absolute inset-0 transition-opacity duration-200 ${
              gearMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
            }`}
            aria-hidden={!gearMenuOpen}
          >
            <button
              type="button"
              tabIndex={gearMenuOpen ? 0 : -1}
              onClick={() => openCharacterMenu('inventory')}
              aria-label="Mở túi đồ"
              data-testid="gear-menu-inventory"
              className={`absolute bottom-0 right-0 flex h-11 w-11 items-center justify-center rounded-xl border border-secondary/40 bg-card text-secondary shadow-lg transition-all duration-300 ${
                gearMenuOpen ? '-translate-x-[68px] -translate-y-1 rotate-0 scale-100' : 'translate-x-0 translate-y-0 rotate-45 scale-50'
              }`}
            >
              <Backpack className="h-5 w-5" />
            </button>
            <button
              type="button"
              tabIndex={gearMenuOpen ? 0 : -1}
              onClick={() => openCharacterMenu('skills')}
              aria-label="Mở kỹ năng"
              data-testid="gear-menu-skills"
              className={`absolute bottom-0 right-0 flex h-11 w-11 items-center justify-center rounded-xl border border-primary/40 bg-card text-primary shadow-lg transition-all duration-300 delay-75 ${
                gearMenuOpen ? '-translate-x-[52px] -translate-y-[64px] rotate-0 scale-100' : 'translate-x-0 translate-y-0 rotate-45 scale-50'
              }`}
            >
              <Sparkles className="h-5 w-5" />
            </button>
            <button
              type="button"
              tabIndex={gearMenuOpen ? 0 : -1}
              onClick={() => openCharacterMenu('settings')}
              aria-label="Mở cài đặt"
              data-testid="gear-menu-settings"
              className={`absolute bottom-0 right-0 flex h-11 w-11 items-center justify-center rounded-xl border border-accent/40 bg-card text-accent shadow-lg transition-all duration-300 delay-150 ${
                gearMenuOpen ? '-translate-x-1 -translate-y-[80px] rotate-0 scale-100' : 'translate-x-0 translate-y-0 rotate-45 scale-50'
              }`}
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setGearMenuOpen((current) => !current)}
            data-testid="button-open-game-menu"
            aria-label={gearMenuOpen ? 'Đóng menu nhanh' : 'Mở menu nhanh'}
            aria-expanded={gearMenuOpen}
            className={`menu-gear-button absolute inset-0 flex h-14 w-14 items-center justify-center rounded-2xl border border-secondary/40 bg-card/95 text-secondary shadow-xl backdrop-blur transition-transform duration-500 hover:scale-105 active:scale-95 ${
              gearMenuOpen ? 'rotate-[180deg]' : 'rotate-0'
            }`}
          >
            <Settings className="h-6 w-6" />
            {!gearMenuOpen && (
              <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_10px_hsl(var(--accent))]" />
            )}
          </button>
        </div>
      )}
      <GameMenuSheet
        open={gameMenuOpen}
        onOpenChange={setGameMenuOpen}
        character={characterDetail}
        classInfo={classes?.find((item) => item.id === characterDetail.classId)}
        initialTab={menuInitialTab}
      />
    </div>
  );
}
