const fs = require("node:fs");
const path = "artifacts/mmorpg-game/src/components/UnifiedOverlayModals.tsx";
let source = fs.readFileSync(path, "utf8");
const shopMarker = source.indexOf("SHOP MODAL");
const leaderboardMarker = source.indexOf("LEADERBOARD MODAL");
if (shopMarker < 0 || leaderboardMarker <= shopMarker) {
  throw new Error(`Could not locate modal boundaries (${shopMarker}, ${leaderboardMarker})`);
}
const start = source.lastIndexOf("\n", shopMarker) + 1;
const end = source.lastIndexOf("\n", leaderboardMarker) + 1;
source = source.slice(0, start) + source.slice(end);
source = source.replace(
  '{activeModal === "shop" && "CỬA HÀNG THƯƠNG GIA LONG TỘC"}',
  '{activeModal === "shop" && "NHÂN VẬT · CỬA HÀNG"}',
);
source = source.replace(
  '{activeModal === "shop" && "Mua sắm thần binh, giáp trụ và phụ kiện gia tăng chỉ số"}',
  '{activeModal === "shop" && "Chọn vật phẩm phù hợp; chỉ số và trang bị luôn hiển thị bên trái"}',
);
source = source.replace("  Coins, \r\n", "").replace("  Coins, \n", "");
fs.writeFileSync(path, source, "utf8");
console.log("Merged shop modal into the two-column inventory panel.");
