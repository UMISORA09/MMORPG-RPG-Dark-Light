# Kế hoạch migration — Client-Authoritative → Server-Authoritative Realtime Combat

**Dự án:** Chiến Long Bí Sử / Game2.5D  
**Ngày:** 15/10/2026  
**Phạm vi:** Kế hoạch thực hiện dựa trên cấu trúc mã hiện tại và Technical Spec Server-Authoritative Encounter.  
**Ước lượng:** 3-5 tuần cho vertical slice, 1-2 lập trình viên; cần điều chỉnh theo kết quả build/test và hạ tầng thật.

## 1. Mục tiêu và trạng thái đích

Sau migration:
- Client gửi **input intent** (nút đang nhấn, hướng nhìn, sequence), không gửi position/damage/HP quái/death/victory/reward làm bằng chứng.
- Server giữ state combat encounter, mô phỏng ở fixed tick, quyết định hit, AI, thắng/thua và reward.
- DB ghi reward/log/level-up atomically, mỗi encounter chỉ phát thưởng một lần.
- Client render/predict để tạo cảm giác mượt, nhưng chỉ cập nhật progression theo kết quả server.
- Endpoint `/characters/:id/3d-reward` không còn cộng giá trị do client cung cấp.

**Không thuộc mục tiêu migration này:** multiplayer/PvP, đồng bộ toàn bộ open-world, chống mọi bot tự động hóa input hợp lệ.

## 2. Kiến trúc hiện tại cần chuyển

### Luồng đang tồn tại
- `artifacts/mmorpg-game/src/game/Game.tsx`: vòng lặp render R3F gọi `useGameStore.updateWorld()` mỗi frame và lấy input client.
- `artifacts/mmorpg-game/src/game/useGameStore.ts`: giữ state player/enemies, xử lý damage/cooldown/đánh bại; gọi callback khi hạ quái.
- `artifacts/mmorpg-game/src/pages/game.tsx`: callback `handleMonsterDefeat` hiện gọi `useStartBattle` với `monsterId`; server tự mô phỏng battle theo lượt rồi trả phần thưởng.
- `artifacts/api-server/src/routes/characters.ts`: `POST /characters/:id/3d-reward` nhận EXP/vàng/kills từ request và cộng vào DB. E2E hiện gọi trực tiếp route này.
- `artifacts/api-server/src/app.ts`: tạo session middleware bên trong file, nhưng chưa export instance để dùng chung khi WebSocket upgrade.
- `artifacts/api-server/src/index.ts`: gọi trực tiếp `app.listen()`, chưa có chỗ gắn HTTP upgrade handler.
- `artifacts/api-server/package.json`: chưa khai báo thư viện WebSocket.
- DB có `characters` và `battle_logs`; hiện `initDatabase()` tự tạo bảng PostgreSQL và có fallback in-memory. Bộ fallback không cung cấp transaction/lock phù hợp cho reward authority.
- Client và server có định nghĩa combat riêng: client game state/constants; server `data/classes.ts` có class/monster/skill và API battle logic.

### Hệ quả
Không thể chỉ thay callback API bằng tên endpoint mới. Cần tách luật combat dùng chung phía server, tạo runtime encounter, xác thực session cho upgrade, bổ sung lưu trạng thái/idempotency và thay UI/logic client để reconcile kết quả.

## 3. Guardrails khi migration

1. **Đóng đường cấp tài nguyên không an toàn trước khi rollout**, hoặc giới hạn chỉ test/dev. Không để `/3d-reward` có thể cộng EXP/vàng từ payload client trong production.
2. Cho phép chạy **shadow simulation** nhưng tuyệt đối không dual-write reward. Shadow kết quả chỉ log/metrics.
3. **Không có fallback an toàn nào là “mở lại endpoint cũ”.** Rollback chỉ được tắt encounter/reward tạm thời hoặc quay lại client presentation không cấp tài nguyên.
4. Production authoritative encounters chỉ bật khi PostgreSQL, schema/index/unique constraints và finalize transaction hoạt động. Không bật trên memory fallback.
5. Mỗi lần đổi luật có `rulesVersion`/`contentVersion` để trace battle và giữ tương thích terminal result.
6. Không giả định đạt typecheck/build trước khi khôi phục `pnpm`; điều kiện CI xanh là gate trước rollout.

## 4. Migration theo phase

### Phase 0 — Khóa lỗ hổng, bảo toàn dữ liệu (0.5-1 ngày)

**Thay đổi**
- Đặt feature flag `LEGACY_3D_REWARD_ENABLED=false` ở production; endpoint trả `410 Gone` hoặc lỗi rõ ràng, không cập nhật DB.
- Nếu cần gameplay chưa sẵn sàng authoritative, tạm chỉ cho đánh tập/không phát reward có giá trị; không tiếp tục kinh tế có thể sửa từ client.
- Thêm log/metric cho các lần gọi `/3d-reward`; không log session cookie/token.
- Rà soát endpoint battle theo lượt: chỉ giữ như chế độ riêng nếu có UI/flow rõ; không gọi làm “xác thực” cho trận realtime.
- Ghi baseline DB backup và kiểm tra khả năng restore trước khi thay schema.

**Kiểm tra**
- Gửi request `/3d-reward` với EXP/vàng/kills cực lớn: production không đổi nhân vật.
- E2E cũ cần được sửa để không còn coi endpoint dễ gian lận là test pass.

**Gate:** không còn đường cấp reward client-claimed.

### Phase 1 — Khôi phục build, feature matrix và luật combat server (2-4 ngày)

**Thay đổi**
- Cài/chuẩn hóa phiên bản Node + pnpm trong CI và dev; chạy install lockfile, `pnpm run typecheck`, build API/game. Xử lý lỗi trước khi thay gameplay.
- Lập bảng so sánh luật client/server: player stats, equipment, attack range, movement speed, damage, crit, cooldown, skill, enemy AI, drop.
- Tạo package/module combat domain thuần TypeScript phía API server: types, `CombatRules`, `EncounterState`, `applyInput`, `stepEncounter`, `computeReward`.
- Chọn một monster và một class làm slice đầu (đề xuất slime + fighter); chốt 20 ticks/s, bounds, HP/death policy, reward values.
- Bỏ hard-coded skill damage/cooldown ở client làm nguồn gameplay; giữ dữ liệu client chỉ phục vụ UI/animation. Server registry là nguồn authoritative.
- Seed RNG server-side và test deterministic theo seed/rules version.

**Kiểm tra**
- Unit tests cho movement cap, diagonal normalize, attack cooldown, range, one-hit-per-window, death, reward.
- Cùng input sequence + seed phải ra cùng kết quả; client frame rate khác nhau không làm đổi outcome server.

**Gate:** domain combat server chạy không cần React/Three.js và có unit tests.

### Phase 2 — Schema encounter, lock và transaction reward (3-5 ngày)

**Thay đổi DB**
- Bổ sung `encounters` (UUID, character/user, monster/spawn/zone, status, rules/content version, request id, started/ended/expires, final tick/state/result).
- Bổ sung `reward_grants` hoặc unique `encounter_id` trong bảng thích hợp để chống phát thưởng trùng.
- Bổ sung `encounter_id` nullable vào `battle_logs` để liên kết log cũ/mới.
- Tạo constraint/index: unique idempotency key; một encounter active/character (partial unique nếu migration tool hỗ trợ); FK và index theo character/status/expiry.
- Chốt migration production rõ ràng. DB hiện có cả schema Drizzle và SQL `CREATE TABLE IF NOT EXISTS` trong `lib/db/src/index.ts`; cập nhật cả hai trong cùng change hoặc chuyển dần sang migration versioned. Tránh để production chỉ phụ thuộc auto-create.
- Không bật authoritative reward trên in-memory fallback: memory adapter hiện không hỗ trợ transaction/row locks/partial unique semantics. Production encounter endpoint phải fail closed khi `isPostgres` false.

**Transaction hoàn tất**
- Lock encounter + character.
- Kiểm tra status active và owner.
- Tính reward chỉ từ terminal state server.
- Insert unique grant; update character; insert battle log; chuyển encounter sang terminal.
- Retry cùng encounter trả lại terminal result, không cộng lần nữa.

**Kiểm tra**
- Hai request finalize đồng thời chỉ phát một grant.
- Rollback DB giữa transaction không làm có reward dở dang.
- Restart/recovery hết hạn không biến encounter mất state thành victory.

**Gate:** idempotency/transaction test xanh trên PostgreSQL thật trong CI/test environment.

### Phase 3 — Session-aware WebSocket và fixed tick runtime (4-7 ngày)

**Thay đổi server**
- Thêm `ws` + types vào `artifacts/api-server` (hoặc chọn Socket.IO sau quyết định kiến trúc).
- Refactor `app.ts`: tạo và export một session middleware instance duy nhất để dùng cho HTTP và upgrade. Kiểm tra production không dùng fallback secret; cấu hình cookie `secure` đúng sau TLS/proxy.
- Refactor `index.ts`: tạo `http.createServer(app)`, gắn upgrade handler, chạy DB/init/recovery trước khi nhận kết nối.
- Tạo `/api/characters/:characterId/encounters` POST để mở encounter; server validate owner, zone/spawn, cấp UUID và snapshot.
- WebSocket handshake `/api/realtime`: chạy chung session store, allowlist Origin, xác thực user/character/encounter từ DB; không dùng id client gửi ở query để cấp quyền.
- Tạo fixed tick loop 50 ms (20 Hz), có monotonic clock, accumulator, cap catch-up và metrics. Simulation domain nhận đúng một bước 0.05s, không nhận `deltaTime` client.
- Validate input bằng schema whitelist, seq tăng, rate limit, message-size limit, coalesce button states; server tính movement/combat/AI.
- Snapshot/event phát ra client; giới hạn `bufferedAmount`, heartbeat và disconnect policy.
- Dùng code mẫu đính kèm làm skeleton, nhưng cần bổ sung adapter session, engine, persistence, reconnect và test. Không copy nguyên trạng sang production.

**Chính sách disconnect MVP**
- Encounter pause khi mất socket, grace window cấu hình (đề xuất 20 giây) để reconnect; không để player đứng yên và bị quái đánh khi mất mạng.
- Reconnect được khi process còn giữ state; nếu process/state mất thì encounter abort/no reward, mở khóa nhân vật bằng recovery.
- Nếu muốn tiếp tục trận sau process restart, cần snapshot persistence/Redis và fencing lease; đó là hạng mục nâng cấp riêng.

**Gate:** socket chỉ tạo state được với session hợp lệ, không nhận message gây thay đổi reward; process restart/timeout fail closed.

### Phase 4 — Client migration, prediction và reconcile (4-7 ngày)

**Thay đổi client**
- Tạo `EncounterClient`/hook quản lý trạng thái `idle → starting → connecting → active → terminal/reconnecting`.
- `pages/game.tsx`: gỡ `useStartBattle` khỏi callback quái chết. Không gọi battle theo lượt khi encounter realtime kết thúc.
- `Game.tsx`: lấy input từ một bộ input builder, gửi intent có sequence; giữ render `Canvas`/R3F tại client.
- `useGameStore.ts`: phân biệt `presentation state` (animation/VFX/prediction) và `authoritative combat state` (HP, kills, progression). Không để client state tự ghi về API.
- Khi client dự đoán enemy chết, chỉ phát animation pending; chờ `enemy.defeated`/`encounter.result` từ server trước khi mở reward UI.
- Reconcile snapshot: ack input seq, khôi phục state server rồi replay input chưa ack nếu dùng client prediction; nếu chưa làm rollback, có thể nội suy đơn giản và chấp nhận input latency thấp ở vertical slice.
- Modal/background refresh không được unmount Canvas. Khi mạng mất: hiển thị trạng thái reconnect/pause; khóa hành động không hợp lệ.
- Sau terminal response: cập nhật React Query cache/store từ `character` authoritative; invalidation chỉ cho battle log/leaderboard cần làm mới.

**Gate:** client không có code path nào cộng progression từ event do chính client tạo.

### Phase 5 — Shadow mode không phát thưởng (2-4 ngày)

**Cách chạy**
- Nhóm test nội bộ dùng encounter server authoritative để chơi thật ở staging.
- Nếu production cần so sánh, chỉ ghi metrics/traces từ server; không chạy hai hệ thống ghi thưởng song song. Không thể so sánh công bằng nếu một luồng là combat giả lập khác.
- Log mismatch chỉ từ dữ liệu server và input event, không log mọi packet vĩnh viễn.
- Kiểm tra latency, tick lag, disconnect, frame presentation và outcome cho từng class.

**Gate:** server tick ổn định; không có double grant; test abuse suite xanh; support rollback rõ.

### Phase 6 — Canary và rollout tăng dần (3-7 ngày)

1. Feature flag bật cho staff/test accounts + một monster/class.
2. Mở 5% tài khoản đủ điều kiện; theo dõi tick lag, errors, finalize failures, abandoned encounters, reward anomalies.
3. Mở 25%, 50%, 100% theo các mốc 12-24 giờ nếu không có điều kiện rollback.
4. Thêm class/monster theo từng batch; mỗi batch có balance regression.
5. Tắt hẳn legacy reward route và xóa codegen/client hook không còn dùng sau thời gian quan sát.

**Rollback:** tắt flag để không mở encounter mới, giữ result đã commit; active encounter được kết thúc an toàn hoặc abort/no reward theo policy. Nếu phải quay lại gameplay client-only, cho phép chơi thử không có progression có giá trị. **Không khôi phục `/3d-reward` cũ.**

## 5. Thay đổi cụ thể theo file/module

| Khu vực | Thay đổi cần làm |
|---|---|
| `artifacts/api-server/src/app.ts` | Tách và export session middleware; cấu hình Origin/CORS rõ ràng; bỏ secret mặc định trong production; dùng chung session cho upgrade. |
| `artifacts/api-server/src/index.ts` | Thay `app.listen()` bằng `createServer(app)`; attach WebSocket; shutdown graceful; init DB/recovery trước listen. |
| `artifacts/api-server/src/routes/characters.ts` | Vô hiệu hóa route `3d-reward`; thêm start/get encounter route hoặc module route riêng. |
| `artifacts/api-server/src/routes/battle.ts` | Gỡ route battle theo lượt khỏi luồng realtime; retire hoặc giữ riêng với mô tả/test riêng. |
| `artifacts/api-server/src/data/classes.ts` | Làm source catalog cho class/skill/monster/reward có version; không để client là nguồn luật. |
| `lib/db/src/schema/*` | Thêm encounter/reward grant, battle log ref, indexes/constraints; cập nhật exports. |
| `lib/db/src/index.ts` | Đồng bộ create schema/migration; thêm adapter giao dịch; disable authoritative path trên memory fallback. |
| `lib/api-spec/openapi.yaml` | Thêm start encounter/get result và schemas; regenerate API client/Zod theo workflow dự án. |
| `artifacts/mmorpg-game/src/pages/game.tsx` | Gỡ `useStartBattle` callback; nối encounter client; update cache từ terminal server result. |
| `artifacts/mmorpg-game/src/game/Game.tsx` | Gửi input intents qua transport; local loop chỉ render/predict, không quyết định reward. |
| `artifacts/mmorpg-game/src/game/useGameStore.ts` | Tách authoritative state và presentation state; bỏ callback “client defeated → API battle”. |
| `test-e2e.mjs` + tests mới | Thay test cấp reward trực tiếp bằng misuse tests xác minh payload reward bị từ chối; thêm WS/gameplay/integration. |

## 6. Giao thức chuyển tiếp và tương thích

- Thêm `protocolVersion: 1` vào start response và WebSocket messages.
- Thêm client build/version header để theo dõi adoption, nhưng không dùng header làm căn cứ bảo mật.
- Không cần migrate lịch sử battle cũ; giữ `battle_logs` cũ, `encounter_id` nullable với log mới.
- Nhân vật hiện có vẫn giữ EXP/vàng/kills đã ghi. Không tự reset dữ liệu khi bật tính năng.
- Khi người chơi đang chạy client cũ: endpoint reward bị chặn an toàn; UI cần thông báo update/maintenance thay vì silently fail.
- Nếu client mới và cũ cùng chạy, DB lock/active encounter độc lập phải ngăn hai trận cùng lúc.

## 7. Kế hoạch test theo từng lớp

### Unit (combat domain)
- Movement bounds/collision/diagonal speed.
- Tốc độ tick không phụ thuộc 30/60/144 FPS client.
- Attack chỉ trúng trong active window và đúng range/LOS.
- Cooldown/skill/resource/crit/armor tính server-side.
- Seed + rules version xác định outcome.

### DB/API
- Session/character ownership; encounterId đoán được hoặc của người khác không dùng được.
- Duplicate start idempotent theo request id; một character chỉ active một encounter.
- Reward endpoint cũ trả 410/403 và không đổi DB.
- Finalize retries/concurrency chỉ có một reward grant.
- Memory fallback không phục vụ authoritative endpoints.

### WebSocket abuse
- Invalid JSON/schema, binary payload, quá cỡ, rate flood, duplicate/lùi seq.
- Gửi `damage`, `position`, `reward`, `victory`: bị bỏ qua hoặc đóng connection; server state không đổi do các field đó.
- Origin không hợp lệ, thiếu session, session expired, account logout.
- Backpressure/slow client không làm bộ nhớ tăng không giới hạn.

### E2E
- Hạ monster bằng gameplay, nhận đúng một kết quả server.
- Client dự đoán kill nhưng server chưa xác nhận: không có reward.
- Disconnect/reconnect trong grace; restart server; reload khi terminal; không nhận thưởng kép.
- Player defeat/respawn theo policy; modal và refetch không unmount Canvas.

## 8. Quan sát, ngưỡng và điều kiện rollback

Dashboard tối thiểu:
- active encounters, start/result theo status, duration.
- p50/p95 server tick processing và tick lag.
- WebSocket disconnect/reconnect/rate limit/protocol error.
- finalize DB latency/failure, duplicate-grant attempt.
- reward distribution theo monster/class/level.

Rollback/tắt flag nếu:
- Có bất kỳ reward grant không có encounter victory hợp lệ.
- Có double grant hoặc state nhân vật/encounter lệch transaction.
- p95 tick lag vượt ngưỡng đã thống nhất liên tục, ví dụ >100 ms trong 5 phút trên tải canary.
- Tỷ lệ finalize lỗi/disconnect tăng mạnh so với baseline hoặc server crash.
- Phát hiện cách gửi input vượt luật combat hoặc bỏ qua ownership.

Ngưỡng chỉ là đề xuất để review; đo baseline staging trước khi dùng làm SLO.

## 9. Lựa chọn rollback và giới hạn vận hành

### Nếu WebSocket không ổn định
- Disable tạo encounter mới; không chuyển lại endpoint reward client-trusted.
- Giữ progression read-only hoặc tạm dừng reward trong thời gian sửa.

### Nếu server simulation quá tải
- Giảm số encounter đồng thời, giảm snapshot frequency, tối ưu simulation; không giảm xác thực bằng cách tin damage từ client.

### Nếu PostgreSQL không sẵn sàng
- Trả service unavailable cho start/finalize authoritative encounter. Không fallback sang memory mode rồi ghi progression không bền vững.

### Nếu client cần chế độ offline
- Có thể cho phép sandbox/local practice không có reward đồng bộ; không cho offline client tự tạo EXP/vàng có giá trị tài khoản.

## 10. Ước lượng và thứ tự triển khai

| Tuần | Mục tiêu | Deliverable |
|---|---|---|
| 1 | Khóa exploit, build xanh, chốt luật, domain module | Endpoint cũ an toàn; combat rules unit-tested; schema draft |
| 2 | Encounter persistence + WebSocket + server tick | Start/get API; auth upgrade; fixed tick; one monster/class |
| 3 | Client input/reconcile + atomic finalize | Client không cấp reward; idempotent terminal transaction |
| 4 | Abuse tests, shadow/staging, canary | Logs/metrics, test suite, release/rollback checklist |
| 5 (buffer) | Sửa phát sinh/rollout và mở thêm content | Canary tăng dần; legacy path retired |

Đây là lịch sơ bộ; migration DB, làm việc với session middleware và test trên Postgres có thể kéo dài hơn. Với chỉ một lập trình viên, dự kiến 4-6 tuần thực tế hơn.

## 11. Checklist bắt đầu Sprint 1

- [ ] Xác nhận PostgreSQL là môi trường bắt buộc cho progression authoritative.
- [ ] Chặn `/3d-reward` cấp tài nguyên ở production.
- [ ] Khôi phục pnpm/typecheck/build trong CI.
- [ ] Chọn slime + fighter, 20 Hz và HP/death policy.
- [ ] Tách combat rules server + deterministic tests.
- [ ] Thiết kế Drizzle schema và migration cho encounters/reward grants.
- [ ] Refactor session middleware để dùng chung HTTP/WebSocket.
- [ ] Dựng HTTP server bằng `createServer(app)` và gắn WebSocket gateway.
- [ ] Kết nối client input, nhận snapshot/event; không gửi position/damage/reward.
- [ ] Test duplicate/replay/rate limit/ownership/disconnect/finalize atomic.
- [ ] Canary và rollout chỉ sau khi toàn bộ acceptance gates đạt.
