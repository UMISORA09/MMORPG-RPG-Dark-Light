// ==============================================================================
// usePerfectGamePersistence.ts
// React Hook for Full-State Snapshot & Zero-Loss Reconciliation Engine
// ==============================================================================

import { useEffect, useCallback } from "react";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { PersistenceManager, usePersistenceStore } from "./PersistenceManager";
import * as THREE from "three";

export function usePerfectGamePersistence() {
  const activeCharacterId = useGameWorldStore((s) => s.activeCharacterId);
  const status = usePersistenceStore((s) => s.status);
  const revision = usePersistenceStore((s) => s.revision);
  const lastSavedTime = usePersistenceStore((s) => s.lastSavedTime);
  const lastReason = usePersistenceStore((s) => s.lastReason);

  // 1. Reconciliation & Hydration on Character Selected / Page Load
  useEffect(() => {
    if (!activeCharacterId) return;

    // Bắt sự kiện thoát trang / F5
    PersistenceManager.initWindowListeners(activeCharacterId);

    // Bắt đầu nhịp tim lưu ngầm
    PersistenceManager.startHeartbeat(activeCharacterId);

    // Kiểm tra xem Local WAL có dữ liệu mới hơn cần cứu hộ hay không
    const wal = PersistenceManager.getLocalWal(activeCharacterId);
    if (wal && Date.now() - wal.timestamp < 24 * 60 * 60 * 1000) {
      console.log(`[Persistence] Phát hiện bản nháp WAL còn mới (Rev #${wal.revision}), đối chiếu phục hồi...`);
      // Đẩy ngay bản lưu mới này lên Server để cứu hộ
      PersistenceManager.flushImmediate(activeCharacterId, "Khôi phục sau tắt máy đột ngột").catch(() => {});
    }

    return () => {
      PersistenceManager.stopHeartbeat();
    };
  }, [activeCharacterId]);

  // 2. Hàm trigger lưu thủ công hoặc khi có sự kiện quan trọng
  const saveNow = useCallback(
    async (reason: string = "Thủ công") => {
      if (!activeCharacterId) return false;
      return await PersistenceManager.flushImmediate(activeCharacterId, reason);
    },
    [activeCharacterId]
  );

  return {
    saveNow,
    status,
    revision,
    lastSavedTime,
    lastReason,
  };
}
