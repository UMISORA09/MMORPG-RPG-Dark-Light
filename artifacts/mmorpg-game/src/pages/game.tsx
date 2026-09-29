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
import { useToast } from '@/hooks/use-toast';
import { Swords, User, Trophy, Coins, Heart, Zap, Shield, Gauge, LogOut } from 'lucide-react';

export default function GamePage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('battle');
  const [battleModalOpen, setBattleModalOpen] = useState(false);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [selectedMonster, setSelectedMonster] = useState<{ id: string; name: string; hp: number } | null>(null);
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

  if (userLoading || charactersLoading || characterLoading || !characterDetail) {
    return (
      <div className="min-h-[100dvh] w-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  const xpPercent = characterDetail.experienceToNextLevel 
    ? (characterDetail.experience / characterDetail.experienceToNextLevel) * 100 
    : 100;
  const hpPercent = (characterDetail.hp / characterDetail.maxHp) * 100;

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

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 bg-card border border-card-border h-12 mb-6">
            <TabsTrigger 
              value="battle" 
              data-testid="tab-battle"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold"
            >
              <Swords className="w-4 h-4 mr-2" />
              Chiến đấu
            </TabsTrigger>
            <TabsTrigger 
              value="character" 
              data-testid="tab-character"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold"
            >
              <User className="w-4 h-4 mr-2" />
              Nhân vật
            </TabsTrigger>
            <TabsTrigger 
              value="leaderboard" 
              data-testid="tab-leaderboard"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold"
            >
              <Trophy className="w-4 h-4 mr-2" />
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
    </div>
  );
}
