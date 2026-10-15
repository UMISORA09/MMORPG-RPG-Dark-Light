// ==============================================================================
// AAA Dark Slate Cinema Hành Trang Modal
// Top Stat Bar, 12-Slot Character Pedestal, 24-Slot Item Grid & 8 Navigation Buttons
// ==============================================================================

import { memo } from "react";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { InventoryEquipmentPanel } from "@/components/InventoryEquipmentPanel";
import type { Character, InventoryItem, Item } from "@workspace/api-client-react";

export const InventoryModal = memo(function InventoryModal() {
  const activeModal = useGameWorldStore((s) => s.activeModal);
  const closeActiveModal = useGameWorldStore((s) => s.closeActiveModal);
  const inventoryItems = useGameWorldStore((s) => s.inventoryItems);
  const equipItem = useGameWorldStore((s) => s.equipItem);
  const playerGold = useGameWorldStore((s) => s.playerGold);
  const playerName = useGameWorldStore((s) => s.playerName);
  const playerClassName = useGameWorldStore((s) => s.playerClassName);
  const playerClassId = useGameWorldStore((s) => s.playerClassId);
  const playerLevel = useGameWorldStore((s) => s.playerLevel);
  const playerHealth = useGameWorldStore((s) => s.playerHealth);
  const playerMaxHealth = useGameWorldStore((s) => s.playerMaxHealth);

  if (activeModal !== "inventory") return null;

  // Construct Character Adapter
  const character: Character = {
    id: 0,
    userId: 0,
    name: playerName,
    classId: playerClassId,
    className: playerClassName,
    level: playerLevel,
    hp: playerHealth,
    maxHp: playerMaxHealth,
    atk: 65,
    def: 0,
    spd: 3.5,
    gold: playerGold,
    experience: 0,
    experienceToNextLevel: 100,
    kills: 0,
    deaths: 0,
    createdAt: new Date().toISOString(),
  };

  // Convert CharacterInventoryItem to InventoryItem
  const inventory: InventoryItem[] = inventoryItems.map((it, idx) => ({
    id: it.itemId || it.id,
    name: it.name,
    type: it.type as any,
    description: "",
    rarity: it.rarity,
    hpBoost: it.hpBoost,
    atkBoost: it.atkBoost,
    defBoost: it.defBoost,
    spdBoost: it.spdBoost,
    price: 0,
    classId: playerClassId,
    requiredLevel: 1,
    icon: it.icon,
    ownershipId: idx + 1,
    equipped: it.equipped,
    acquiredAt: new Date().toISOString(),
  }));

  const handleEquip = (item: InventoryItem) => {
    equipItem(item.id);
  };

  const handleBuy = (_item: Item) => {
    // Standalone fallback
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md select-none font-sans"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeActiveModal();
      }}
    >
      <InventoryEquipmentPanel
        character={character}
        inventory={inventory}
        shopItems={[]}
        inventoryLoading={false}
        shopLoading={false}
        busy={false}
        onEquip={handleEquip}
        onBuy={handleBuy}
        onClose={closeActiveModal}
      />
    </div>
  );
});
