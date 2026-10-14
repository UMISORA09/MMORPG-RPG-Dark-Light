# Roadmap cải tiến và phát triển — Chiến Long Bí Sử (Game 2.5D)

**Ngày rà soát:** 15/10/2026  
**Phạm vi:** Đánh giá sơ bộ từ tài liệu dự án, cấu trúc mã nguồn và các quy chuẩn nội bộ hiện có. Đây là kế hoạch đề xuất, chưa phải xác nhận rằng mọi tính năng đang hoạt động ổn định.

## 1. Tóm tắt điều hành

Đồ án đã có nền tảng đáng kể: frontend React/Three.js + React Three Fiber, scene thế giới, player/enemy, hiệu ứng chiến đấu, kho đồ/shop/leaderboard, API server, schema PostgreSQL và pipeline sprite. Hướng phát triển hợp lý nhất là **đóng phạm vi thành một vertical slice chơi được và kiểm chứng được**, thay vì mở rộng thêm hàng loạt tính năng MMORPG ngay.

**Ưu tiên ngay:**
1. Chốt sản phẩm là game hành động 2.5D thời gian thực có dữ liệu/tài khoản máy chủ, hay game MMORPG nhiều người chơi đồng thời. Không dùng hai khái niệm này thay thế cho nhau.
2. Chuẩn hóa nguồn sự thật: README đang quảng bá chiến đấu realtime, nhưng `replit.md` mô tả battle API theo lượt; bộ test E2E lại gọi riêng luồng realtime `/3d-reward`. Đây là lệch mô tả cần giải quyết bằng kiến trúc và tài liệu thống nhất.
3. Khôi phục khả năng build/test đáng tin cậy trên máy phát triển; kiểm thử gameplay, bảo mật và trải nghiệm mobile trước khi thêm nội dung lớn.
4. Chọn một vòng chơi mẫu hoàn chỉnh: tạo nhân vật → vào khu vực → chiến đấu → nhận thưởng → trang bị/nâng cấp → đánh miniboss/boss → lưu kết quả.

## 2. Hiện trạng đã quan sát và giới hạn đánh giá

### Đã quan sát được
- Mã frontend có các khu vực `canvas`, `game`, `skills`, `stores`, HUD, modal, trang đăng nhập/chọn nhân vật; có các hệ thống scene, player/enemy, VFX và điều khiển mobile.
- Backend có API Express, schema DB Drizzle, và các tuyến liên quan auth, nhân vật, chiến đấu, vật phẩm/leaderboard (cấu trúc hiện có cho thấy phạm vi backend tương đối rộng).
- Có script E2E dạng Node và các tài liệu hướng dẫn Docker/Vercel.
- Quy chuẩn nội bộ yêu cầu nhất quán về nghệ thuật nhân vật, spritesheet 9 hàng, điều khiển camera-relative, bảo toàn Canvas sau khi khởi tạo, và UI dark-fantasy.
- Tài liệu nghiệp vụ chưa đồng nhất: `README.md` mô tả chiến đấu realtime; `replit.md` gọi battle system là mô phỏng theo lượt. Tài liệu/batch script có dấu hiệu lỗi mã hóa tiếng Việt.

### Chưa xác minh được
- Không chạy được typecheck vì lệnh `pnpm` không có trong PATH của môi trường tại thời điểm rà soát.
- Không chạy được `git status`/liệt kê file tracked do Git từ chối repository vì khác chủ sở hữu thư mục. Không thay đổi cấu hình Git toàn cục.
- Chưa chạy game, API, E2E, build production, kiểm tra trình duyệt, hiệu năng hoặc bảo mật; vì vậy không kết luận tính năng trong README đã hoạt động/đạt chất lượng.
- Chưa xác nhận server hiện là multiplayer realtime. Có tài khoản, dữ liệu đồng bộ và leaderboard không đồng nghĩa với nhiều người chơi cùng hiện diện trong một thế giới.

## 3. Những điểm cần cải tiến / phát triển / tái lập

| Mức | Hạng mục | Nhận định và hành động |
|---|---|---|
| P0 | Định hướng & nguồn sự thật | Viết product brief một trang, xác định single-player online/persistent hay multiplayer realtime; chốt combat realtime là nguồn gameplay chính hay battle theo lượt chỉ là chế độ phụ. Đồng bộ README, `replit.md`, API contract, UI và test. |
| P0 | Build, test và khả năng tái lập | Cài/chuẩn hóa Node + pnpm theo phiên bản được hỗ trợ; thêm CI chạy install lockfile, typecheck, build server/client và test. Ghi rõ biến môi trường và seed dữ liệu. Không cho phép phát hành khi pipeline chưa xanh. |
| P0 | Kiểm thử gameplay/API | Chuyển E2E hiện có thành test cô lập, dùng DB test hoặc dữ liệu dọn dẹp an toàn; thêm test session/auth, quyền sở hữu nhân vật, reward, giới hạn đầu vào, HP/death/respawn, camera-relative input, keybind và giữ Canvas mounted. |
| P0 | An toàn kinh tế và dữ liệu | Tính EXP/vàng/drop/damage quan trọng phía server; validate và rate-limit request; chống reward giả, replay, nhân bản vật phẩm, race condition và sửa chỉ số từ client. Thêm audit log và giới hạn phiên. |
| P1 | Vòng chơi chiến đấu | Tạo encounter mẫu có nhịp đánh rõ: windup → hit/active frame → recovery/cancel; hitbox/hurtbox, telegraph, cooldown, feedback sát thương, stagger/death/respawn. Tách logic combat thuần khỏi render để unit-test được. |
| P1 | Vertical slice nội dung | Hoàn tất một khu vực nhỏ có tutorial, 2-3 loại quái, một miniboss/boss, loot, nhiệm vụ ngắn, nâng cấp và kết thúc vòng chơi. Chỉ mở rộng sau khi người chơi mới hiểu mục tiêu và hoàn thành được. |
| P1 | Asset pipeline & animation | Kiểm kê asset thật và asset fallback/procedural; chốt atlas/metadata/frame timing, kích thước, pivot, hướng, naming và giấy phép. Kiểm tra tự động số hàng/cột, alpha, bounding box và UV. Nâng chất lượng theo chuẩn 9 hàng nhưng không giả định mọi ảnh hiện tại đạt chuẩn. |
| P1 | Điều khiển & camera | Chuẩn hóa một sơ đồ phím duy nhất; xác nhận không xung đột, camera-relative movement, diagonal normalization, pointer lock/thoát camera và mobile touch. Có cấu hình lại phím, hỗ trợ gamepad nếu nằm trong mục tiêu. |
| P1 | HUD/UI và khả năng dùng | Chốt một luồng HUD/modal, tránh component trùng/alias gây khó sửa; audit responsive, độ tương phản, focus/keyboard, trạng thái loading/error/empty, localization và thao tác tay trái/phải trên mobile. Theo design system Dark Fantasy đã có. |
| P1 | Hiệu năng & độ ổn định | Đo FPS/frame time, draw calls, texture/VRAM, số entity/particle, heap và thời gian tải trên máy cấu hình mục tiêu. Thêm pooling, culling/LOD, giảm rerender, cleanup tài nguyên Three.js và fallback cho thiết bị yếu. |
| P2 | Vận hành / triển khai | Xác minh Docker và Vercel từ môi trường sạch; bổ sung migration/seed/versioning, health/readiness, log có cấu trúc, backup/restore, kiểm soát secrets và hướng dẫn rollback. Không quảng bá in-memory fallback như lưu trữ bền vững. |
| P2 | Multiplayer thật (nếu được chọn) | Chỉ sau vertical slice: thiết kế authoritative server, transport realtime, room/instance, đồng bộ vị trí/animation/combat, reconnect, latency compensation, chống gian lận, matchmaking và load test. Đây là một nhánh dự án lớn riêng, không phải chỉ bật leaderboard. |

## 4. Kế hoạch theo giai đoạn

Ước lượng cho nhóm nhỏ 2-4 người làm bán thời gian; điều chỉnh theo nhân lực thực tế. Giai đoạn có thể chồng lấn nhẹ, nhưng cổng nghiệm thu phải hoàn tất theo thứ tự.

### Giai đoạn 0 — Chốt mục tiêu và baseline (3-5 ngày)
- Viết product brief: đối tượng chơi, nền tảng, core loop, phạm vi demo và điều gì không làm trong bản đầu.
- Quyết định realtime single-player có server persistence hay multiplayer đồng thời; nếu multiplayer, xác định số người/phòng mục tiêu.
- Chốt chiến đấu realtime trong client là gameplay chính; xác định vai trò endpoint battle theo lượt: bỏ, chuyển thành mô phỏng hậu trường, hay giữ như chế độ riêng.
- Vẽ sơ đồ module, luồng dữ liệu client/server/DB; tạo danh sách feature có trạng thái: dùng được / prototype / chưa xác minh.

**Nghiệm thu:** brief được duyệt; các tài liệu và API không còn mô tả trái nhau; có baseline commit/build/test ghi nhận được.

### Giai đoạn 1 — Làm xanh nền tảng (1-2 tuần)
- Chuẩn hóa toolchain và cách cài dependencies; khôi phục typecheck/build trên máy sạch.
- CI: typecheck, build frontend/backend, unit tests, API integration tests, kiểm tra định dạng và audit dependency.
- Làm test data độc lập; tránh E2E tạo dữ liệu rác hoặc phụ thuộc DB cá nhân.
- Kiểm tra auth/session/cookie/CSRF/CORS/secret handling; rà soát quyền sở hữu nhân vật và validate payload.
- Sửa encoding tài liệu và script Windows; cập nhật hướng dẫn dev/test/deploy.

**Nghiệm thu:** pipeline chạy từ checkout mới; lỗi có báo cáo dễ hiểu; test API chính không phụ thuộc trạng thái người dùng thật; secret không nằm trong source.

### Giai đoạn 2 — Combat & điều khiển cốt lõi (2-3 tuần)
- Chuẩn hóa input map cho PC/mobile; viết test camera-relative, đường chéo, focus modal, respawn.
- Xây combat state machine thống nhất cho bốn class; cài hit window và cancel window bằng dữ liệu/animation event.
- Chốt chỉ số, damage, cooldown, resource, hit reaction, enemy AI tối thiểu và quy tắc death/respawn.
- Giữ Canvas ổn định khi cache/query cập nhật; không unmount scene sau khi đã khởi tạo.
- Cân bằng mỗi class có vai trò và 2-3 kỹ năng có khác biệt chơi được.

**Nghiệm thu:** người chơi có thể di chuyển, né, đánh thường + kỹ năng, hạ quái và hồi sinh; không khóa input, không black screen, thao tác hợp lý trên desktop và mobile.

### Giai đoạn 3 — Vertical slice nội dung + progression (2-3 tuần)
- Dựng một khu vực nhỏ có điểm xuất phát, đường đi, NPC/quest, encounter, miniboss/boss và điểm kết thúc.
- Hoàn tất vòng loot → inventory → equip/upgrade → chỉ số có tác động thật đến combat.
- Đồng bộ kết quả ở server theo mô hình đã chốt; server kiểm chứng mọi phần thưởng quan trọng.
- Thêm tutorial/onboarding, trạng thái thất bại/chiến thắng, lưu tiến trình và thông báo rõ.

**Nghiệm thu:** người chơi mới có thể tự hoàn thành vòng chơi mẫu, hiểu phần thưởng/nâng cấp; tiến trình tồn tại sau reload/đăng nhập lại (nếu yêu cầu persistence).

### Giai đoạn 4 — Art, UX và hiệu năng (1-2 tuần, song song có kiểm soát)
- Kiểm kê 4 class, quái, boss, VFX, UI, âm thanh; xác định asset production so với placeholder.
- Chuẩn hóa spritesheet/metadata theo 9 hàng và công cụ import/validation; chỉ tái tạo asset thiếu hoặc lệch chuẩn.
- Làm thống nhất HUD/modal theo palette và layout hiện hành; giảm trùng luồng UI.
- Profile thiết bị mục tiêu, đặt ngân sách hiệu năng, xử lý leak và giảm tải scene/particle.

**Nghiệm thu:** assets được kiểm tra bằng script; UI có trạng thái đủ; đạt ngân sách FPS và tải trên cấu hình thiết bị đã chọn.

### Giai đoạn 5 — Beta, vận hành và quyết định mở rộng (1-2 tuần)
- Test người dùng nhỏ, ghi lại funnel, điểm bỏ chơi, lỗi và cân bằng.
- Kiểm thử khôi phục DB, migration, load/concurrency, logging/monitoring, deploy preview và rollback.
- Chốt backlog sau beta.
- Nếu mục tiêu multiplayer đã được duyệt, lập riêng discovery/prototype authoritative networking sau khi vertical slice ổn định.

**Nghiệm thu:** release checklist đầy đủ; không còn lỗi P0/P1; có kế hoạch rollback, backup và hỗ trợ sự cố.

## 5. Backlog khởi động đề xuất (10 việc đầu tiên)

1. Tạo product brief và quyết định loại hình online/multiplayer.
2. Thống nhất combat realtime vs endpoint battle theo lượt, cập nhật tài liệu/API.
3. Chuẩn hóa Node/pnpm; chạy lại typecheck/build trên môi trường sạch.
4. Thêm CI và tách test E2E khỏi dữ liệu thật.
5. Lập feature matrix: hoạt động / prototype / placeholder / chưa kiểm chứng.
6. Viết test hồi quy cho movement, combo, death/respawn, Canvas mount và reward.
7. Rà soát server-authoritative rewards, inventory/economy và quyền truy cập.
8. Chốt một encounter vertical slice và tiêu chí cân bằng.
9. Kiểm kê asset/animation thật so với fallback; tự động validate spritesheet.
10. Profile một cấu hình máy mục tiêu và đặt ngưỡng hiệu năng.

## 6. Chỉ số theo dõi

- **Build:** tỷ lệ CI xanh; thời gian build; số lỗi typecheck.
- **Ổn định:** crash/session, lỗi API, lỗi Canvas/WebGL, lỗi lưu tiến trình.
- **Gameplay:** tỷ lệ hoàn thành tutorial/vertical slice; thời gian đến encounter đầu; tỷ lệ chết/thắng boss.
- **Hiệu năng:** FPS trung vị và p95 frame time trên thiết bị mục tiêu; thời gian tải; memory/VRAM.
- **Sản phẩm:** người chơi quay lại, hoàn thành vòng chơi, phản hồi điều khiển/UI.
- **An toàn kinh tế:** reward bị từ chối bất thường, duplicate item, request bị giới hạn.

Không đặt con số KPI tuyệt đối trước khi chọn thiết bị và chạy baseline thật.

## 7. Quyết định cần chốt trước khi phát triển sâu

1. Bản mục tiêu là **game hành động 2.5D có tài khoản/lưu dữ liệu** hay **MMORPG nhiều người chơi đồng thời**?
2. Combat theo lượt trong API là tính năng riêng cần giữ hay di sản cần loại bỏ/thay thế?
3. Mục tiêu demo/beta là desktop, mobile hay cả hai; cấu hình thiết bị tối thiểu?
4. Đồ họa mục tiêu: sprite pixel-art 2.5D nhất quán, model 3D, hay chuyển đổi giữa hai chế độ? Việc duy trì hai nhánh sẽ tăng gấp đôi kiểm thử và asset.
5. Nhân lực và mốc phát hành mong muốn là gì?

## 8. Kết luận

Không nên bắt đầu bằng việc thêm thêm class, bản đồ hoặc hệ thống MMO. Thứ tự tối ưu là **chốt sản phẩm → xanh build/test → bảo vệ tính đúng đắn dữ liệu → hoàn thiện một vòng chơi → tối ưu/đánh bóng → mở beta**. Nếu quyết định làm multiplayer realtime, hãy coi đó là giai đoạn kiến trúc riêng với scope, ngân sách và kiểm thử tải độc lập.
