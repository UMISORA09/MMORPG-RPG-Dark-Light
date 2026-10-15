import { useEffect, useState } from "react";
import type { Character, InventoryItem, Item } from "@workspace/api-client-react";
import { Backpack, Check, Coins, Heart, Shield, ShoppingBag, Sparkles, Sword, Wind, Zap } from "lucide-react";

interface InventoryEquipmentPanelProps {
  character: Character;
  inventory: InventoryItem[];
  shopItems: Item[];
  inventoryLoading: boolean;
  shopLoading: boolean;
  busy: boolean;
  initialSection?: "storage" | "shop";
  onEquip: (item: InventoryItem) => void;
  onBuy: (item: Item) => void;
}

const slotLabels: Record<string, string> = { weapon: "Vũ khí", armor: "Giáp trụ", accessory: "Phụ kiện" };

export function InventoryEquipmentPanel({ character, inventory, shopItems, inventoryLoading, shopLoading, busy, initialSection = "storage", onEquip, onBuy }: InventoryEquipmentPanelProps) {
  const [section, setSection] = useState<"storage" | "shop">(initialSection);
  useEffect(() => setSection(initialSection), [initialSection]);
  const equipped = inventory.filter((item) => item.equipped);
  const ownedIds = new Set(inventory.map((item) => item.id));
  const availableItems = shopItems.filter((item) => !ownedIds.has(item.id) && (item.classId === null || item.classId === character.classId));
  const statRows = [
    { label: "Sinh lực tối đa", value: character.maxHp, icon: Heart, color: "text-rose-300" },
    { label: "Công kích", value: character.atk, icon: Zap, color: "text-amber-300" },
    { label: "Phòng thủ", value: character.def, icon: Shield, color: "text-sky-300" },
    { label: "Tốc độ", value: character.spd, icon: Wind, color: "text-emerald-300" },
  ];

  return (
    <div className="grid min-h-[430px] grid-cols-1 gap-4 lg:grid-cols-[minmax(250px,0.78fr)_minmax(0,1.45fr)]">
      <aside className="space-y-3 rounded-2xl border border-[#5d4648] bg-[#2b2325] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#28c3e1]">Nhân vật</p>
            <h3 className="mt-1 text-lg font-black text-white">{character.name}</h3>
            <p className="text-xs text-[#b19a9c]">{character.className} · Cấp {character.level}</p>
          </div>
          <div className="rounded-xl border border-[#5d4648] bg-[#4a383a] px-3 py-2 text-right">
            <p className="text-[10px] uppercase tracking-wider text-[#b19a9c]">Vàng</p>
            <p className="flex items-center gap-1 text-sm font-black text-amber-300"><Coins className="h-4 w-4" />{character.gold}</p>
          </div>
        </div>

        <div className="rounded-xl border border-[#5d4648] bg-[#342a2b] p-3">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-bold text-rose-200"><Heart className="h-3.5 w-3.5" />HP</span>
            <span className="font-mono text-white">{character.hp} / {character.maxHp}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-black/40"><div className="h-full rounded-full bg-gradient-to-r from-rose-700 to-rose-400" style={{ width: `${Math.max(0, Math.min(100, character.maxHp ? character.hp / character.maxHp * 100 : 0))}%` }} /></div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {statRows.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl border border-[#5d4648] bg-[#342a2b] p-2.5">
              <div className={`flex items-center gap-1.5 text-[10px] font-semibold ${color}`}><Icon className="h-3.5 w-3.5" />{label}</div>
              <p className="mt-1 text-lg font-black tabular-nums text-white">{value}</p>
            </div>
          ))}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between"><h4 className="text-xs font-black uppercase tracking-wider text-white">Trang bị</h4><span className="text-[10px] text-[#b19a9c]">{equipped.length} món đang dùng</span></div>
          <div className="space-y-2">
            {(["weapon", "armor", "accessory"] as const).map((type) => {
              const item = equipped.find((entry) => entry.type === type);
              return <div key={type} className="flex min-h-12 items-center gap-2 rounded-xl border border-[#5d4648] bg-[#342a2b] px-3 py-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4a383a] text-lg">{item?.icon ?? (type === "weapon" ? "⚔" : type === "armor" ? "🛡" : "◇")}</span>
                <div className="min-w-0 flex-1"><p className="text-[10px] text-[#b19a9c]">{slotLabels[type]}</p><p className="truncate text-xs font-bold text-white">{item?.name ?? "Chưa trang bị"}</p></div>
                {item && <Check className="h-4 w-4 text-[#28c3e1]" />}
              </div>;
            })}
          </div>
        </div>
      </aside>

      <section className="flex min-h-[430px] min-w-0 flex-col overflow-hidden rounded-2xl border border-[#5d4648] bg-[#342a2b]">
        <div className="flex items-center justify-between gap-3 border-b border-[#5d4648] px-4 py-3">
          <div><h3 className="text-sm font-black text-white">Kho vật phẩm</h3><p className="text-[10px] text-[#b19a9c]">Trang bị trực tiếp hoặc mua thêm vật phẩm</p></div>
          <div className="flex rounded-full border border-[#5d4648] bg-[#271f20] p-1">
            <button onClick={() => setSection("storage")} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold transition ${section === "storage" ? "bg-[#28c3e1] text-[#1c161a]" : "text-[#b19a9c] hover:text-white"}`}><Backpack className="h-3.5 w-3.5" />Túi đồ</button>
            <button onClick={() => setSection("shop")} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold transition ${section === "shop" ? "bg-[#28c3e1] text-[#1c161a]" : "text-[#b19a9c] hover:text-white"}`}><ShoppingBag className="h-3.5 w-3.5" />Cửa hàng</button>
          </div>
        </div>
        <div className="custom-scrollbar flex-1 overflow-y-auto p-3 sm:p-4">
          {section === "storage" ? (
            inventoryLoading ? <div className="grid h-48 place-items-center text-sm text-[#b19a9c]">Đang tải kho đồ…</div> : inventory.length === 0 ? <div className="grid h-48 place-items-center text-center text-sm text-[#b19a9c]">Túi đồ đang trống.<br />Mở tab Cửa hàng để tìm trang bị.</div> :
              <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
                {inventory.map((item) => <div key={item.ownershipId} className={`flex min-w-0 flex-col justify-between gap-3 rounded-xl border p-3 ${item.equipped ? "border-[#28c3e1]/70 bg-cyan-950/20" : "border-[#5d4648] bg-[#2b2325]"}`}>
                  <div className="flex min-w-0 gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#4a383a] text-xl">{item.icon ?? "◇"}</span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="truncate text-xs font-bold text-white">{item.name}</p>{item.equipped && <span className="shrink-0 rounded-full bg-cyan-400/15 px-2 py-0.5 text-[9px] font-black text-cyan-200">ĐANG MẶC</span>}</div><p className="text-[9px] uppercase tracking-wider text-[#b19a9c]">{slotLabels[item.type] ?? item.type} · {item.rarity}</p><p className="mt-1 line-clamp-2 text-[10px] text-[#b19a9c]">{item.description}</p></div></div>
                  <div className="flex items-center justify-between gap-2"><div className="flex flex-wrap gap-2 text-[10px] font-mono">{item.hpBoost !== 0 && <span className="text-rose-300">+{item.hpBoost} HP</span>}{item.atkBoost !== 0 && <span className="text-amber-300">+{item.atkBoost} ATK</span>}{item.defBoost !== 0 && <span className="text-sky-300">+{item.defBoost} DEF</span>}{item.spdBoost !== 0 && <span className="text-emerald-300">{item.spdBoost > 0 ? "+" : ""}{item.spdBoost} SPD</span>}</div><button disabled={busy} onClick={() => onEquip(item)} className="shrink-0 rounded-full border border-[#5d4648] bg-[#4a383a] px-3 py-1.5 text-[10px] font-bold text-white hover:border-[#28c3e1] disabled:opacity-50">{item.equipped ? "Tháo" : "Trang bị"}</button></div>
                </div>)}
              </div>
          ) : shopLoading ? <div className="grid h-48 place-items-center text-sm text-[#b19a9c]">Đang tải cửa hàng…</div> : availableItems.length === 0 ? <div className="grid h-48 place-items-center text-center text-sm text-[#b19a9c]">Không còn vật phẩm phù hợp để mua.</div> :
            <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
              {availableItems.map((item) => {
                const locked = character.level < item.requiredLevel;
                const canAfford = character.gold >= item.price;
                return <div key={item.id} className="flex min-w-0 flex-col justify-between gap-3 rounded-xl border border-[#5d4648] bg-[#2b2325] p-3 hover:border-amber-400/60">
                  <div className="flex min-w-0 gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#4a383a] text-xl">{item.icon ?? "◇"}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-white">{item.name}</p><p className="text-[9px] uppercase tracking-wider text-[#b19a9c]">{slotLabels[item.type] ?? item.type} · {item.rarity}</p><p className="mt-1 line-clamp-2 text-[10px] text-[#b19a9c]">{item.description}</p></div></div>
                  <div className="flex items-center justify-between gap-2"><div className="flex flex-wrap gap-2 text-[10px] font-mono">{item.hpBoost !== 0 && <span className="text-rose-300">+{item.hpBoost} HP</span>}{item.atkBoost !== 0 && <span className="text-amber-300">+{item.atkBoost} ATK</span>}{item.defBoost !== 0 && <span className="text-sky-300">+{item.defBoost} DEF</span>}{item.spdBoost !== 0 && <span className="text-emerald-300">{item.spdBoost > 0 ? "+" : ""}{item.spdBoost} SPD</span>}</div><button disabled={busy || locked || !canAfford} onClick={() => onBuy(item)} className="flex shrink-0 items-center gap-1 rounded-full bg-[#28c3e1] px-3 py-1.5 text-[10px] font-black text-[#1c161a] hover:brightness-110 disabled:cursor-not-allowed disabled:bg-[#4a383a] disabled:text-[#b19a9c]"><Coins className="h-3 w-3" />{locked ? `Cấp ${item.requiredLevel}` : canAfford ? item.price : "Thiếu vàng"}</button></div>
                </div>;
              })}
            </div>
          }
        </div>
        <div className="border-t border-[#5d4648] px-4 py-2 text-[10px] text-[#b19a9c]">{section === "storage" ? `${inventory.length} vật phẩm · Trang bị được lưu trên máy chủ` : `Vàng hiện có: ${character.gold}`}</div>
      </section>
    </div>
  );
}
