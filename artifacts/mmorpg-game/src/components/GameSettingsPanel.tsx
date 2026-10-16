import { useEffect, useState } from "react";
import { Camera, Globe2, RotateCcw, Vibrate } from "lucide-react";
import { CloudDownload, Database, Loader2 } from "lucide-react";
import { getCharacter, getGetCharacterQueryKey, getGetCharactersQueryKey, getGetInventoryQueryKey, getGetItemsQueryKey, getInventory, getItems, type Character } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { setCameraPreferences } from "@/game/cameraControls";
import { useGameStore } from "../stores";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const DEFAULTS = { sensitivityX: 1, sensitivityY: 1, invertY: false, reduceShake: false };

export function GameSettingsPanel({ characterId }: { characterId: number }) {
  const [, setLocation] = useLocation();
  const [sensitivityX, setSensitivityX] = useState(DEFAULTS.sensitivityX);
  const [sensitivityY, setSensitivityY] = useState(DEFAULTS.sensitivityY);
  const [invertY, setInvertY] = useState(DEFAULTS.invertY);
  const [reduceShake, setReduceShake] = useState(DEFAULTS.reduceShake);
  const [isLoadingSavedData, setIsLoadingSavedData] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const loadSavedData = async () => {
    setIsLoadingSavedData(true);
    try {
      const [character, inventory, shopItems] = await Promise.all([
        getCharacter(characterId),
        getInventory(characterId),
        getItems(),
      ]);
      queryClient.setQueryData(getGetCharacterQueryKey(characterId), character);
      queryClient.setQueryData(getGetInventoryQueryKey(characterId), inventory);
      queryClient.setQueryData(getGetItemsQueryKey(), shopItems);
      queryClient.setQueryData<Character[]>(getGetCharactersQueryKey(), (existing) =>
        existing?.map((entry) => entry.id === character.id ? character : entry),
      );
      useGameStore.getState().syncFromCharacter(character);
      useGameWorldStore.getState().syncFromBackendCharacter(character);
      toast({ title: "Đã tải dữ liệu lưu", description: "Nhân vật, vật phẩm và danh mục cửa hàng đã được đồng bộ từ máy chủ." });
    } catch (error) {
      toast({ variant: "destructive", title: "Không thể tải dữ liệu", description: (error as { message?: string })?.message ?? "Hãy kiểm tra kết nối rồi thử lại." });
    } finally {
      setIsLoadingSavedData(false);
    }
  };

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem("clb-game-settings") ?? "{}") as Partial<typeof DEFAULTS>;
      const next = { ...DEFAULTS, ...saved };
      setSensitivityX(next.sensitivityX);
      setSensitivityY(next.sensitivityY);
      setInvertY(next.invertY);
      setReduceShake(next.reduceShake);
      setCameraPreferences(next.sensitivityX, next.sensitivityY, next.invertY, next.reduceShake);
    } catch {
      setCameraPreferences(DEFAULTS.sensitivityX, DEFAULTS.sensitivityY, DEFAULTS.invertY, DEFAULTS.reduceShake);
    }
  }, []);

  const save = (next: { sensitivityX: number; sensitivityY: number; invertY: boolean; reduceShake: boolean }) => {
    window.localStorage.setItem("clb-game-settings", JSON.stringify(next));
    setCameraPreferences(next.sensitivityX, next.sensitivityY, next.invertY, next.reduceShake);
  };

  const reset = () => {
    setSensitivityX(DEFAULTS.sensitivityX);
    setSensitivityY(DEFAULTS.sensitivityY);
    setInvertY(DEFAULTS.invertY);
    setReduceShake(DEFAULTS.reduceShake);
    save(DEFAULTS);
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
      <section className="space-y-4 rounded-2xl border border-[#5d4648] bg-[#342a2b] p-5">
        <div className="flex items-center gap-3"><span className="rounded-xl bg-[#28c3e1]/15 p-2 text-[#28c3e1]"><Camera className="h-5 w-5" /></span><div><h3 className="font-black text-white">Điều khiển camera</h3><p className="text-xs text-[#b19a9c]">Độ nhạy áp dụng ngay khi xoay camera bằng chuột hoặc cảm ứng.</p></div></div>
        <label className="block space-y-2"><span className="flex justify-between text-xs font-bold text-white"><span>Độ nhạy ngang</span><span className="font-mono text-[#28c3e1]">{sensitivityX.toFixed(1)}×</span></span><input aria-label="Độ nhạy camera ngang" type="range" min="0.3" max="2.5" step="0.1" value={sensitivityX} onChange={(e) => { const value = Number(e.target.value); setSensitivityX(value); save({ sensitivityX: value, sensitivityY, invertY, reduceShake }); }} className="w-full accent-[#28c3e1]" /></label>
        <label className="block space-y-2"><span className="flex justify-between text-xs font-bold text-white"><span>Độ nhạy dọc</span><span className="font-mono text-[#28c3e1]">{sensitivityY.toFixed(1)}×</span></span><input aria-label="Độ nhạy camera dọc" type="range" min="0.3" max="2.5" step="0.1" value={sensitivityY} onChange={(e) => { const value = Number(e.target.value); setSensitivityY(value); save({ sensitivityX, sensitivityY: value, invertY, reduceShake }); }} className="w-full accent-[#28c3e1]" /></label>
        <button type="button" role="switch" aria-checked={invertY} onClick={() => { const value = !invertY; setInvertY(value); save({ sensitivityX, sensitivityY, invertY: value, reduceShake }); }} className="flex w-full items-center justify-between rounded-xl border border-[#5d4648] bg-[#4a383a] px-4 py-3 text-left"><span><span className="block text-xs font-bold text-white">Đảo trục dọc</span><span className="block text-[10px] text-[#b19a9c]">Đảo hướng rê lên/xuống khi điều khiển camera</span></span><span className={`rounded-full px-3 py-1 text-[10px] font-black ${invertY ? "bg-[#28c3e1] text-[#1c161a]" : "bg-[#342a2b] text-[#b19a9c]"}`}>{invertY ? "BẬT" : "TẮT"}</span></button>
      </section>
      <section className="space-y-4 rounded-2xl border border-[#5d4648] bg-[#342a2b] p-5">
        <div className="flex items-center gap-3"><span className="rounded-xl bg-amber-400/15 p-2 text-amber-300"><Vibrate className="h-5 w-5" /></span><div><h3 className="font-black text-white">Hiệu ứng</h3><p className="text-xs text-[#b19a9c]">Giảm tác động hình ảnh khi chiến đấu.</p></div></div>
        <button type="button" role="switch" aria-checked={reduceShake} onClick={() => { const value = !reduceShake; setReduceShake(value); save({ sensitivityX, sensitivityY, invertY, reduceShake: value }); }} className="flex w-full items-center justify-between rounded-xl border border-[#5d4648] bg-[#4a383a] px-4 py-3 text-left"><span><span className="block text-xs font-bold text-white">Giảm rung camera</span><span className="block text-[10px] text-[#b19a9c]">Giảm độ rung khi đánh hoặc nhận sát thương</span></span><span className={`rounded-full px-3 py-1 text-[10px] font-black ${reduceShake ? "bg-[#28c3e1] text-[#1c161a]" : "bg-[#342a2b] text-[#b19a9c]"}`}>{reduceShake ? "BẬT" : "TẮT"}</span></button>
        <div className="rounded-xl border border-[#5d4648] bg-[#2b2325] p-3 text-[11px] leading-5 text-[#b19a9c]">Thiết lập được lưu riêng trên trình duyệt này. Cài đặt không thay đổi luật chiến đấu hoặc chỉ số nhân vật.</div>
        <button type="button" onClick={reset} className="flex items-center gap-2 rounded-full border border-[#5d4648] bg-[#4a383a] px-4 py-2 text-xs font-bold text-white hover:border-[#28c3e1]"><RotateCcw className="h-3.5 w-3.5" />Khôi phục mặc định</button>
      </section>
      </div>
      <section className="flex flex-col gap-4 rounded-2xl border border-[#5d4648] bg-[#342a2b] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-emerald-400/15 p-2 text-emerald-300"><Database className="h-5 w-5" /></span>
          <div><h3 className="text-sm font-black text-white">Lưu & tải dữ liệu</h3><p className="mt-1 max-w-xl text-[11px] leading-5 text-[#b19a9c]">Tự lưu vào cơ sở dữ liệu máy chủ sau chiến đấu, mua vật phẩm và thay đổi trang bị. Khi vào game, trạng thái nhân vật và vật sở hữu được nạp lại từ tài khoản.</p></div>
        </div>
        <button type="button" onClick={loadSavedData} disabled={isLoadingSavedData} className="flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#28c3e1] px-4 py-2.5 text-xs font-black text-[#1c161a] hover:brightness-110 disabled:opacity-60">
          {isLoadingSavedData ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudDownload className="h-4 w-4" />}
          {isLoadingSavedData ? "Đang tải…" : "Tải dữ liệu từ máy chủ"}
        </button>
      </section>
      <button type="button" onClick={() => setLocation("/portal")} className="flex w-full items-center justify-center gap-2 rounded-full border border-[#ffb400]/50 bg-[#ffb400]/10 px-4 py-3 text-xs font-black text-[#ffcf52] transition hover:bg-[#ffb400]/20">
        <Globe2 className="h-4 w-4" />🌐 Về Trang Chủ / Đổi Server
      </button>
    </div>
  );
}
