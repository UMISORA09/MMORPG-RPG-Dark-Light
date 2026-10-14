import { useEffect, useState } from "react";
import { Camera, RotateCcw, Vibrate } from "lucide-react";
import { setCameraPreferences } from "@/game/cameraControls";

const DEFAULTS = { sensitivityX: 1, sensitivityY: 1, invertY: false, reduceShake: false };

export function GameSettingsPanel() {
  const [sensitivityX, setSensitivityX] = useState(DEFAULTS.sensitivityX);
  const [sensitivityY, setSensitivityY] = useState(DEFAULTS.sensitivityY);
  const [invertY, setInvertY] = useState(DEFAULTS.invertY);
  const [reduceShake, setReduceShake] = useState(DEFAULTS.reduceShake);

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
    <div className="mx-auto grid w-full max-w-3xl gap-4 md:grid-cols-[1.2fr_0.8fr]">
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
  );
}
