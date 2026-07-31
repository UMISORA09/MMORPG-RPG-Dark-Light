import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import type { BattleResult } from '@workspace/api-client-react';
import { Sparkles, Skull, Coins, TrendingUp } from 'lucide-react';

interface BattleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  battleResult: BattleResult | null;
}

export function BattleModal({ open, onOpenChange, battleResult }: BattleModalProps) {
  const [currentRound, setCurrentRound] = useState(0);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (open && battleResult) {
      setCurrentRound(0);
      setShowResult(false);
      
      // Animate through rounds
      const interval = setInterval(() => {
        setCurrentRound((prev) => {
          if (prev < battleResult.rounds.length - 1) {
            return prev + 1;
          } else {
            clearInterval(interval);
            setTimeout(() => setShowResult(true), 500);
            return prev;
          }
        });
      }, 800);

      return () => clearInterval(interval);
    }
  }, [open, battleResult]);

  if (!battleResult) return null;

  const round = battleResult.rounds[currentRound];
  const playerHpPercent = round ? (round.playerHp / battleResult.character.maxHp) * 100 : 0;
  const monsterMaxHp = battleResult.rounds[0]?.monsterHp || 1;
  const monsterHpPercent = round ? (round.monsterHp / monsterMaxHp) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-card-border" data-testid="dialog-battle-result">
        {!showResult ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-center text-xl font-bold">
                CHIẾN ĐẤU - Hiệp {round?.round}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Player HP */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-foreground">{battleResult.character.name}</span>
                  <span className="font-mono text-muted-foreground">
                    {round?.playerHp}/{battleResult.character.maxHp} HP
                  </span>
                </div>
                <Progress 
                  value={playerHpPercent} 
                  className="h-3 bg-muted"
                  indicatorClassName="bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                />
              </div>

              {/* Combat Log */}
              {round && (
                <div className="bg-muted rounded-lg p-4 space-y-2 border border-border">
                  <p className="text-sm text-foreground">
                    <span className="font-semibold text-secondary">{battleResult.character.name}</span> tấn công{' '}
                    <span className={round.isCritical ? 'text-accent font-bold' : ''}>
                      {round.playerDmg} sát thương{round.isCritical ? ' (CHÍ MẠNG!)' : ''}
                    </span>
                  </p>
                  {round.monsterDmg > 0 && (
                    <p className="text-sm text-foreground">
                      Quái vật phản công {round.monsterDmg} sát thương
                    </p>
                  )}
                </div>
              )}

              {/* Monster HP */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-foreground">Quái vật</span>
                  <span className="font-mono text-muted-foreground">
                    {round?.monsterHp}/{monsterMaxHp} HP
                  </span>
                </div>
                <Progress 
                  value={monsterHpPercent} 
                  className="h-3 bg-muted"
                  indicatorClassName="bg-gradient-to-r from-destructive to-destructive/70 transition-all duration-500"
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className={`text-center text-3xl font-bold ${
                battleResult.victory ? 'text-accent' : 'text-destructive'
              }`}>
                {battleResult.victory ? (
                  <div className="flex items-center justify-center gap-2">
                    <Sparkles className="w-8 h-8" />
                    CHIẾN THẮNG!
                    <Sparkles className="w-8 h-8" />
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Skull className="w-8 h-8" />
                    THẤT BẠI
                    <Skull className="w-8 h-8" />
                  </div>
                )}
              </DialogTitle>
            </DialogHeader>

            <div className="py-6 space-y-4">
              {/* Rewards */}
              <div className="bg-muted rounded-xl p-4 space-y-3 border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-foreground">
                    <TrendingUp className="w-5 h-5 text-secondary" />
                    <span className="font-medium">Kinh nghiệm</span>
                  </div>
                  <span className="font-mono font-bold text-secondary">+{battleResult.expGained} XP</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-foreground">
                    <Coins className="w-5 h-5 text-accent" />
                    <span className="font-medium">Vàng</span>
                  </div>
                  <span className="font-mono font-bold text-accent">+{battleResult.goldGained}</span>
                </div>
              </div>

              {/* Level Up */}
              {battleResult.leveledUp && battleResult.newLevel && (
                <div className="bg-gradient-to-r from-accent/20 via-accent/10 to-accent/20 rounded-xl p-4 border-2 border-accent level-up-flash">
                  <div className="text-center">
                    <p className="text-accent font-bold text-2xl mb-1">
                      LEVEL UP!
                    </p>
                    <p className="text-foreground text-lg">
                      Cấp độ mới: <span className="font-bold text-accent">{battleResult.newLevel}</span>
                    </p>
                  </div>
                </div>
              )}

              <Button
                onClick={() => onOpenChange(false)}
                data-testid="button-close-battle"
                className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold"
              >
                TIẾP TỤC
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
