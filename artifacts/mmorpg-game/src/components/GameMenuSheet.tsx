import { useEffect, useState } from 'react';
import {
  getGetCharacterQueryKey,
  getGetCharactersQueryKey,
  getGetInventoryQueryKey,
  getGetItemsQueryKey,
  useBuyItem,
  useEquipItem,
  useGetInventory,
  useGetItems,
  useUnequipItem,
  type Character,
  type CharacterClass,
  type InventoryItem,
} from '@workspace/api-client-react';
import {
  Backpack,
  Coins,
  Loader2,
  ShoppingBag,
  Settings,
  Sparkles,
  Swords,
  Vibrate,
  Volume2,
  X,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

type MenuTab = 'inventory' | 'skills' | 'settings';

interface GameMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  character: Character;
  classInfo?: CharacterClass;
  initialTab?: MenuTab;
}

function SettingRow({
  icon,
  title,
  description,
  enabled,
  onToggle,
  testId,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  testId: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/60 p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background text-secondary">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-[11px] leading-4 text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={title}
        data-testid={testId}
        onClick={onToggle}
        className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors ${
          enabled ? 'border-secondary bg-secondary/80' : 'border-border bg-background'
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

export function GameMenuSheet({
  open,
  onOpenChange,
  character,
  classInfo,
  initialTab = 'inventory',
}: GameMenuSheetProps) {
  const [activeTab, setActiveTab] = useState<MenuTab>(initialTab);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: inventory, isLoading: inventoryLoading } = useGetInventory(character.id, {
    query: {
      queryKey: getGetInventoryQueryKey(character.id),
      enabled: open,
    },
  });
  const { data: shopItems, isLoading: shopLoading } = useGetItems({
    query: {
      queryKey: getGetItemsQueryKey(),
      enabled: open,
    },
  });
  const buyItem = useBuyItem();
  const equipItem = useEquipItem();
  const unequipItem = useUnequipItem();

  useEffect(() => {
    if (open) setActiveTab(initialTab);
  }, [open, initialTab]);

  useEffect(() => {
    const savedSound = window.localStorage.getItem('mmorpg-sound');
    const savedVibration = window.localStorage.getItem('mmorpg-vibration');
    const savedMotion = window.localStorage.getItem('mmorpg-reduced-motion');

    if (savedSound !== null) setSoundEnabled(savedSound === 'on');
    if (savedVibration !== null) setVibrationEnabled(savedVibration === 'on');
    if (savedMotion !== null) setReducedMotion(savedMotion === 'on');
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('reduced-motion', reducedMotion);
    window.localStorage.setItem('mmorpg-reduced-motion', reducedMotion ? 'on' : 'off');
  }, [reducedMotion]);

  const ownedItems = inventory ?? [];
  const availableShopItems = (shopItems ?? []).filter(
    (item) =>
      !ownedItems.some((ownedItem) => ownedItem.id === item.id) &&
      (item.classId === null || item.classId === character.classId),
  );

  const refreshInventory = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getGetInventoryQueryKey(character.id) }),
      queryClient.invalidateQueries({ queryKey: getGetCharacterQueryKey(character.id) }),
      queryClient.invalidateQueries({ queryKey: getGetCharactersQueryKey() }),
    ]);
  };

  const getErrorMessage = (error: unknown) =>
    (error as { message?: string })?.message ?? 'Không thể thực hiện thao tác này';

  const handleBuy = (itemId: string) => {
    buyItem.mutate(
      { characterId: character.id, itemId },
      {
        onSuccess: async () => {
          await refreshInventory();
          toast({ title: 'Đã mua vật phẩm', description: 'Vật phẩm đã được lưu vào túi đồ.' });
        },
        onError: (error) => toast({ variant: 'destructive', title: 'Mua vật phẩm thất bại', description: getErrorMessage(error) }),
      },
    );
  };

  const handleEquip = (item: InventoryItem) => {
    const mutation = item.equipped ? unequipItem : equipItem;
    mutation.mutate(
      { characterId: character.id, itemId: item.id },
      {
        onSuccess: async () => {
          await refreshInventory();
          toast({
            title: item.equipped ? 'Đã tháo trang bị' : 'Đã trang bị',
            description: `${item.name} đã cập nhật chỉ số nhân vật.`,
          });
        },
        onError: (error) => toast({ variant: 'destructive', title: 'Cập nhật trang bị thất bại', description: getErrorMessage(error) }),
      },
    );
  };

  const toggleSound = () => {
    setSoundEnabled((current) => {
      const next = !current;
      window.localStorage.setItem('mmorpg-sound', next ? 'on' : 'off');
      return next;
    });
  };

  const toggleVibration = () => {
    setVibrationEnabled((current) => {
      const next = !current;
      window.localStorage.setItem('mmorpg-vibration', next ? 'on' : 'off');
      return next;
    });
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/75 px-0 backdrop-blur-sm sm:px-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false);
      }}
    >
      <section
        className="game-menu-sheet w-full max-w-md rounded-t-3xl border border-card-border bg-card p-4 pb-6 shadow-2xl sm:mb-4 sm:rounded-3xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-menu-title"
        data-testid="game-menu-sheet"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted-foreground/40 sm:hidden" />
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-secondary">COMMAND DECK</p>
            <h2 id="game-menu-title" className="text-xl font-bold text-foreground">Menu nhân vật</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            data-testid="button-close-game-menu"
            aria-label="Đóng menu"
            className="rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2 rounded-xl border border-border bg-muted/50 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            data-testid="menu-tab-inventory"
            className={`flex min-h-11 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'inventory' ? 'bg-secondary text-secondary-foreground shadow' : 'text-muted-foreground'
            }`}
          >
            <Backpack className="h-4 w-4" />
            Túi đồ
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('skills')}
            data-testid="menu-tab-skills"
            className={`flex min-h-11 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'skills' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Kỹ năng
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            data-testid="menu-tab-settings"
            className={`flex min-h-11 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'settings' ? 'bg-accent text-accent-foreground shadow' : 'text-muted-foreground'
            }`}
          >
            <Settings className="h-4 w-4" />
            Cài đặt
          </button>
        </div>

        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-foreground">Túi đồ & trang bị</p>
                <p className="text-xs text-muted-foreground">{classInfo?.name ?? character.className} • chỉ số cập nhật ngay</p>
              </div>
              <span className="rounded-full border border-secondary/30 bg-secondary/10 px-2 py-1 text-[10px] font-mono text-secondary">
                {ownedItems.length} / 20 ô
              </span>
            </div>

            {inventoryLoading ? (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-border p-6 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Đang tải túi đồ...
              </div>
            ) : ownedItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-5 text-center text-xs text-muted-foreground">
                Túi đồ đang trống.
              </div>
            ) : (
              <div className="max-h-[36vh] space-y-2 overflow-y-auto pr-1">
                {ownedItems.map((item) => (
                  <div
                    key={item.ownershipId}
                    className={`rounded-xl border p-3 ${item.equipped ? 'border-secondary/40 bg-secondary/5' : 'border-border bg-muted/40'}`}
                    data-testid={`inventory-item-${item.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary/15 text-xl text-secondary">
                        {item.icon ?? '◇'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-bold text-foreground">{item.name}</p>
                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{item.type} • {item.rarity}</p>
                          </div>
                          {item.equipped && (
                            <span className="rounded-full bg-secondary/15 px-2 py-1 text-[9px] font-bold text-secondary">ĐANG DÙNG</span>
                          )}
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">{item.description}</p>
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-mono">
                          {item.hpBoost !== 0 && <span className="text-destructive">+{item.hpBoost} HP</span>}
                          {item.atkBoost !== 0 && <span className="text-secondary">+{item.atkBoost} ATK</span>}
                          {item.defBoost !== 0 && <span className="text-accent">+{item.defBoost} DEF</span>}
                          {item.spdBoost !== 0 && <span className="text-primary">{item.spdBoost > 0 ? '+' : ''}{item.spdBoost} SPD</span>}
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant={item.equipped ? 'outline' : 'default'}
                        className="shrink-0 text-[10px]"
                        disabled={equipItem.isPending || unequipItem.isPending}
                        onClick={() => handleEquip(item)}
                      >
                        {item.equipped ? 'Tháo' : 'Trang bị'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-border pt-3">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-foreground">Cửa hàng</p>
                  <p className="text-xs text-muted-foreground">Mua đồ phù hợp với chức nghiệp của bạn</p>
                </div>
                <ShoppingBag className="h-4 w-4 text-accent" />
              </div>
              {shopLoading ? (
                <div className="flex items-center gap-2 rounded-xl border border-border p-4 text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Đang tải cửa hàng...
                </div>
              ) : availableShopItems.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  Chưa có vật phẩm mới phù hợp.
                </p>
              ) : (
                <div className="max-h-[30vh] space-y-2 overflow-y-auto pr-1">
                  {availableShopItems.map((item) => {
                    const locked = character.level < item.requiredLevel;
                    const cannotAfford = character.gold < item.price;
                    return (
                      <div key={item.id} className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-lg text-accent">{item.icon ?? '◇'}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-foreground">{item.name}</p>
                          <p className="text-[10px] text-muted-foreground">Cấp {item.requiredLevel} • +{item.atkBoost} ATK • +{item.defBoost} DEF</p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="shrink-0 text-[10px]"
                          disabled={locked || cannotAfford || buyItem.isPending}
                          onClick={() => handleBuy(item.id)}
                        >
                          <Coins className="mr-1 h-3 w-3" /> {item.price}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-foreground">Bộ kỹ năng</p>
                <p className="text-xs text-muted-foreground">{classInfo?.role ?? character.className}</p>
              </div>
              <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-[10px] font-mono text-primary">
                {classInfo?.skills.length ?? 0} kỹ năng
              </span>
            </div>
            <div className="max-h-[42vh] space-y-2 overflow-y-auto pr-1">
              {classInfo?.skills.map((skill, index) => (
                <div
                  key={skill.name}
                  className="flex gap-3 rounded-xl border border-border bg-muted/60 p-3"
                  data-testid={`skill-card-${index}`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    {index === 0 ? <Swords className="h-5 w-5" /> : index === 1 ? <Zap className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold text-foreground">{skill.name}</p>
                      <span className="shrink-0 text-[10px] font-mono text-accent">DMG {skill.damage}</span>
                    </div>
                    <p className="mt-1 text-xs leading-4 text-muted-foreground">{skill.description}</p>
                    <p className="mt-2 text-[10px] font-mono text-secondary">HỒI CHIÊU {skill.cooldown} LƯỢT</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-3">
            <div className="mb-1">
              <p className="text-sm font-bold text-foreground">Tùy chỉnh trải nghiệm</p>
              <p className="text-xs text-muted-foreground">Thiết lập được lưu trên thiết bị này.</p>
            </div>
            <SettingRow
              icon={<Volume2 className="h-4 w-4" />}
              title="Âm thanh"
              description="Âm thanh chiến đấu và phần thưởng"
              enabled={soundEnabled}
              onToggle={toggleSound}
              testId="setting-sound"
            />
            <SettingRow
              icon={<Vibrate className="h-4 w-4" />}
              title="Rung khi chiến đấu"
              description="Phản hồi xúc giác trên thiết bị hỗ trợ"
              enabled={vibrationEnabled}
              onToggle={toggleVibration}
              testId="setting-vibration"
            />
            <SettingRow
              icon={<Settings className="h-4 w-4" />}
              title="Giảm chuyển động"
              description="Tắt bớt animation để chơi nhẹ hơn"
              enabled={reducedMotion}
              onToggle={() => setReducedMotion((current) => !current)}
              testId="setting-reduced-motion"
            />
          </div>
        )}
      </section>
    </div>
  );
}