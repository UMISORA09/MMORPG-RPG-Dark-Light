import { memo } from "react";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { CharacterInventoryModal } from "./CharacterInventoryModal";

export const InventoryModal = memo(function InventoryModal() {
  const activeModal = useGameWorldStore((s) => s.activeModal);
  const closeActiveModal = useGameWorldStore((s) => s.closeActiveModal);

  if (activeModal !== "inventory") return null;

  return <CharacterInventoryModal onClose={closeActiveModal} />;
});

