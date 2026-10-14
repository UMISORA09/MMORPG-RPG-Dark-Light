# Technical Spec — Server-Authoritative Realtime Encounter

**Dự án:** Chiến Long Bí Sử / Game2.5D  
**Phiên bản:** 1.0 — Đề xuất thiết kế  
**Ngày:** 15/10/2026  
**Trạng thái:** Spec để triển khai và review; chưa phải implementation.

## 1. Mục tiêu

Thiết kế encounter realtime trong đó **server là nguồn sự thật duy nhất** cho các kết quả có giá trị: trạng thái quái, HP chính thức, sát thương, thắng/thua, EXP, vàng, vật phẩm và thống kê. Client vẫn được phép dự đoán/trình bày chuyển động và hiệu ứng để giữ cảm giác mượt, nhưng mọi dữ liệu do client khai báo về vị trí, hit, sát thương, quái chết hoặc phần thưởng đều **không được dùng làm bằng chứng** để ghi tiến trình.

Mục tiêu cấp sản phẩm là single-player action RPG có tài khoản/persistence. Spec này không tự động biến game thành MMORPG nhiều người chơi đồng thời.

### Không phải mục tiêu
- Đồng bộ nhiều người chơi trong cùng một thế giới, PvP, matchmaking hoặc anti-cheat ở mức kernel.
- Đồng bộ vật lý 60 lần/giây qua DB.
- Chống hoàn toàn bot/auto-input có thể gửi chuỗi input hợp lệ.
- Tái tạo toàn bộ open world trên server ngay lập tức. Giai đoạn đầu chỉ authoritative cho **một encounter có giới hạn**.

## 2. Hiện trạng và lỗ hổng cần đóng

Các điểm đã xác nhận trong mã:

1. `artifacts/mmorpg-game/src/game/Game.tsx` chạy vòng lặp client qua R3F `useFrame` và đưa input vào game store.
2. `useGameStore.ts` có trạng thái player/enemy, skill/cooldown và gọi callback khi quái bị đánh bại.
3. `pages/game.tsx` gọi `useStartBattle` sau callback hạ quái. API `/characters/:characterId/battle` lại chạy `simulateBattle` ở server bằng luật theo lượt, không xử lý chuỗi input/trận realtime mà người chơi vừa thấy.
4. API `/characters/:characterId/3d-reward` cộng `expGained`, `goldGained`, `kills` do request gửi lên. Đây là lỗ hổng trực tiếp: client có thể thay payload để tự cấp tài nguyên.
5. DB nhân vật có HP, chỉ số, EXP/vàng/kills/deaths; battle log lưu kết quả trận, nhưng chưa thấy model encounter với trạng thái, idempotency hoặc ownership lock.

### Mục tiêu bảo mật

Sau khi triển khai:
- Không có endpoint nào nhận số EXP/vàng/kills do client tự khai để cộng vào nhân vật.
- Không thể nhận thưởng bằng cách chỉ gọi API `complete` hoặc gửi `enemyDead=true`.
- Mỗi encounter chỉ được kết thúc và phát thưởng tối đa một lần, kể cả khi retry/mất kết nối.
- Character không thể có hai encounter đồng thời trên nhiều tab/thiết bị.
- Kết quả ghi DB được tạo từ mô phỏng/input đã được server kiểm tra.

## 3. Quyết định kiến trúc

### 3.1. Mô hình đề xuất

Dùng **server-authoritative encounter simulation** với transport realtime:

- Server tạo encounter và mô phỏng trạng thái chiến đấu trên fixed timestep **20 ticks/giây (50 ms)** ở giai đoạn đầu.
- Client gửi **input intent** theo lô nhỏ: phím/nút đang giữ, hướng di chuyển mong muốn, sequence number. Client không gửi vị trí cuối cùng, sát thương, kết quả collision hay reward.
- Server xác thực input, cập nhật state, chạy di chuyển/AI/collision/combat/cooldown và phát snapshot/sự kiện authoritative.
- Client có thể dự đoán input local để render, sau đó reconcile theo state server; VFX/damage popup chỉ là trình bày cho đến khi sự kiện server xác nhận.
- Khi encounter kết thúc, server tự tính reward và cập nhật nhân vật/log trong **một DB transaction idempotent**.

> Đây là lựa chọn cần thiết nếu yêu cầu thật sự là “server-authoritative” và muốn loại bỏ việc client tự quyết định thắng. Một endpoint HTTP xác nhận payload do client gửi, kể cả payload ký bằng secret trong client, không giải quyết được gian lận.

### 3.2. Phạm vi authoritative giai đoạn đầu

Server không cần chạy toàn bộ cảnh làng, NPC trang trí, camera, particles hoặc animation. Chỉ chạy state logic tối thiểu của encounter:
- Player logical position/velocity, facing, HP, cooldown, trạng thái sống/chết.
- Monster encounter: vị trí, HP, AI state, attack telegraph/cooldown, trạng thái sống/chết.
- Geometry collision tối giản: sàn, ranh encounter, vùng cấm, khoảng cách/hitbox đã định nghĩa.
- Encounter timer, RNG server-side, điều kiện thắng/thua và reward.

Client render world/animation ở 60 FPS; server tick combat ở 20 Hz. Tốc độ tick có thể điều chỉnh sau profiling, nhưng luật gameplay phải chạy trên bước thời gian cố định để tránh kết quả phụ thuộc frame rate.

### 3.3. Không dùng các cách sau
- Không gửi `{ damage: 999999 }`, `{ monsterHp: 0 }`, `{ victory: true }`, `{ reward: ... }` rồi tin request.
- Không dùng HMAC/secret nhúng trong frontend; người chơi có thể trích xuất secret.
- Không chỉ kiểm tra tốc độ giết trung bình trên client rồi cộng reward.
- Không gọi battle mô phỏng theo lượt như một side-effect sau khi client nói quái realtime đã chết.
- Không ghi state mỗi tick vào PostgreSQL; đây không phải kho realtime.

## 4. Luồng giao thức

### Bước 1 — Tạo encounter qua HTTP

`POST /api/characters/{characterId}/encounters`

Request tối thiểu:
```json
{
  "monsterId": "slime",
  "spawnId": "wilderness-slime-01",
  "clientRequestId": "uuid"
}
```

Quy tắc:
- Auth qua session hiện tại; chỉ dùng HTTPS ngoài production dev.
- Server kiểm tra nhân vật thuộc session, không bị khóa bởi encounter active khác, đủ điều kiện khu vực/level, monster/spawn đang tồn tại và trong giới hạn cho phép.
- `monsterId` và `spawnId` là lựa chọn yêu cầu, không phải bằng chứng đã tiếp cận quái. Server kiểm tra spawn, khoảng cách hoặc quyền mở encounter theo luật server.
- Server tự đọc stats/class/equipment và xác định snapshot combat; client không truyền stat.
- Tạo UUID encounter, seed RNG server-side, server time, expiresAt, session/character ownership; lưu trạng thái `active` và liên kết character.
- Idempotency: `clientRequestId` được unique theo character/user; retry cùng key trả cùng encounter nếu request gốc thành công.

Response:
```json
{
  "encounterId": "uuid",
  "protocolVersion": 1,
  "tickRate": 20,
  "serverTime": "2026-10-15T...Z",
  "expiresAt": "2026-10-15T...Z",
  "snapshot": {
    "tick": 0,
    "player": { "position": [0,0,0], "hp": 750, "maxHp": 750 },
    "enemy": { "id": "slime", "position": [4,0,0], "hp": 80, "maxHp": 80 }
  },
  "socketPath": "/api/realtime"
}
```

Snapshot chỉ chứa dữ liệu cần thiết cho client. Không trả seed, RNG state, secret hay hidden AI parameters nếu không cần.

### Bước 2 — Mở realtime connection

Khuyến nghị WebSocket (`ws`) trên cùng origin, hoặc Socket.IO nếu sản phẩm cần reconnect/rooms tích hợp. Trước mắt dùng một transport duy nhất; không đưa cả polling lẫn WebSocket thành hai nguồn gameplay.

Auth:
- Dùng session cookie hiện có; kiểm tra session khi handshake và bind socket vào `userId`, `characterId`, `encounterId` đã xác thực.
- Kiểm tra `Origin` theo allowlist; từ chối cross-site websocket.
- Không chấp nhận encounterId chỉ vì client biết UUID. So khớp chủ sở hữu và trạng thái encounter trong server.
- Rate limit theo user/IP và giới hạn số socket/character.

Client gửi message `input`:
```json
{
  "type": "input",
  "encounterId": "uuid",
  "seq": 41,
  "clientTick": 980,
  "buttons": {
    "forward": true,
    "back": false,
    "left": false,
    "right": true,
    "jump": false,
    "attack": true,
    "skill1": false,
    "skill2": false,
    "skill3": false,
    "interact": false
  },
  "aim": { "yaw": 1.2 }
}
```

Các giới hạn:
- Client gửi input ở khoảng 20 Hz, có thể gửi ngay khi button state thay đổi; server coalesce input theo tick.
- `seq` phải tăng; duplicate/lùi seq bỏ qua hoặc trả lỗi protocol. Không dùng `clientTick` làm đồng hồ quyền lực.
- Server chỉ nhận input state/intent whitelist. Bỏ mọi field ngoài schema; từ chối gói quá lớn.
- Giới hạn aim/yaw trong miền chuẩn hóa; không cho client gửi tọa độ mục tiêu tùy ý.
- Server tự lấy elapsed time từ tick server; bỏ `deltaTime` từ client.
- Giữ trạng thái nút tối đa trong một số tick; yêu cầu heartbeat/input mới để tránh “kẹt nút” sau mất mạng.

Server gửi:
```json
{
  "type": "snapshot",
  "encounterId": "uuid",
  "serverTick": 42,
  "ackInputSeq": 41,
  "serverTime": "...",
  "state": {
    "player": { "position": [0.8,0,0.3], "velocity": [2,0,1], "hp": 720, "facing": 1.2, "cooldowns": { "skill1": 1.4 } },
    "enemies": [{ "id": "enemy-1", "hp": 52, "position": [3.2,0,0.1], "state": "windup" }]
  }
}
```

Sự kiện có thẩm quyền:
```json
{
  "type": "event",
  "eventId": "uuid",
  "serverTick": 47,
  "name": "attack.hit",
  "data": { "attackerId": "player", "targetId": "enemy-1", "damage": 28, "critical": false }
}
```

Các event name tối thiểu: `attack.started`, `attack.hit`, `skill.used`, `enemy.windup`, `enemy.hit`, `enemy.defeated`, `player.defeated`, `encounter.completed`, `encounter.aborted`. Client dùng event để đồng bộ hiệu ứng/âm thanh; event nhận từ client không có ý nghĩa server-side.

### Bước 3 — Kết thúc encounter

Không cung cấp endpoint công khai dạng `POST /complete { victory: true }`.

Server tự kết thúc khi:
- enemy HP <= 0 theo combat server; hoặc
- player HP <= 0; hoặc
- encounter timeout / disconnect grace window / invalid state / admin abort.

Server đóng input, chuyển trạng thái terminal, tính reward, ghi kết quả và phát terminal response. Client không gửi reward hoặc declare victory.

Terminal message:
```json
{
  "type": "encounter.result",
  "encounterId": "uuid",
  "status": "victory",
  "resultVersion": 1,
  "serverTick": 513,
  "reward": { "exp": 25, "gold": 10, "items": [] },
  "character": { "level": 2, "experience": 0, "gold": 110, "hp": 750 },
  "logId": 123
}
```

Client retry lấy kết quả qua `GET /api/characters/{characterId}/encounters/{encounterId}`. Retry phải trả cùng kết quả đã commit, không cộng reward lần hai.

## 5. Luật mô phỏng server

### 5.1. Tick và input
- Fixed tick: 50 ms (20 Hz) ban đầu; dùng accumulator hoặc scheduler có giới hạn drift.
- Không chạy catch-up vô hạn sau server stall; nếu tick lag vượt ngưỡng, giảm tốc/đóng encounter an toàn và ghi telemetry.
- Movement: server xác định speed từ stats/equipment và giới hạn acceleration/max speed; normalize diagonal vector; clamp trong encounter bounds; collision với world geometry đơn giản.
- Client prediction được phép nhưng phải reconcile khi nhận snapshot mới hơn. Không cập nhật database từ state dự đoán.

### 5.2. Combat
- Attack/skill là command/input edge (nhấn mới), không phải field `damage`.
- Server kiểm tra trạng thái nhân vật (alive, không stun, skill có tồn tại, cooldown/resource đủ), khoảng cách, góc, line-of-sight nếu có, hit window và mỗi hit chỉ trừ máu một lần.
- Damage formula, crit chance, armor, cooldown, i-frame, stagger và knockback là hàm server-side, có version.
- Nếu cần RNG, dùng RNG server-side gắn với encounter; kết quả chỉ tạo bởi server. Lưu `rulesVersion` và `contentVersion` trên encounter để tái dựng log.
- Telegraph/AI: server phát windup/start tick, vùng tấn công và thời điểm active; client chỉ hiển thị telegraph. Server tính hit từ player state tại tick impact. Không tin client báo “tôi đã né”.
- Skill class lấy từ catalog/config server. Hiện `data/classes.ts` có dữ liệu skill nhưng combat client `useGameStore.ts` có damage/cooldown cứng; spec yêu cầu hợp nhất thành một bộ luật versioned, không giữ hai nguồn số liệu độc lập.

### 5.3. Quy tắc chống “spam hợp lệ” và abnormal input
- Throttle input packet và action rate theo luật: tối đa một press edge/skill theo tick/cooldown.
- Reject sequence replay, timestamp bất thường không dùng làm thời gian tính combat, packet vượt giới hạn.
- Kẹp movement/aim và action theo server state.
- Có anomaly telemetry: input tốc độ phi thực tế, kill time dưới ngưỡng, vị trí teleport, request thất bại lặp. Không auto-ban chỉ từ một chỉ báo; ban/rollback cần quy trình riêng.
- Lưu ý: người dùng có thể bot input hợp lệ. Spec làm cho bot không thể tự cấp reward hoặc vượt physics/combat constraints; không cam kết phát hiện mọi automation.

## 6. Data model & persistence

### 6.1. Bảng đề xuất `encounters`

- `id` UUID primary key.
- `character_id` FK; `user_id` FK/snapshot audit.
- `monster_id`, `spawn_id`, `zone_id`.
- `status`: `active | victory | defeat | aborted | expired`.
- `rules_version`, `content_version`.
- `rng_seed` (secret nội bộ, access hạn chế) hoặc RNG state phù hợp.
- `started_at`, `ended_at`, `expires_at`, `last_seen_at`.
- `final_server_tick`, `final_state_json` (terminal summary only; tránh ghi từng tick).
- `result_json` versioned, reward đã tính, log id.
- `client_request_id` unique theo user/character để idempotency.
- Unique partial constraint: tối đa một encounter `active` trên mỗi character (Postgres partial unique index nếu phù hợp migration tooling).

### 6.2. Bảng `encounter_events` — cân nhắc

Append-only audit event cho `encounter.started`, `enemy.defeated`, terminal result, reward grant. Không ghi mọi input/tick mặc định vì chi phí và dữ liệu lớn. Nếu cần fraud investigation, ghi sample hoặc command sequence có retention ngắn và giới hạn privacy.

### 6.3. Reward idempotency

Bổ sung `reward_grants` hoặc unique relation keyed by `encounter_id`:
- `encounter_id` UNIQUE.
- `character_id`, reward JSON/version, `granted_at`.
- Không có grant cho status khác `victory`.

### 6.4. Transaction hoàn tất

Trong một transaction DB:
1. Lock encounter row (`SELECT ... FOR UPDATE`) và kiểm tra `status='active'`.
2. Lock/validate character row và ownership.
3. Tính terminal status + reward từ server state.
4. Nếu victory: insert reward grant với unique encounter key; nếu conflict, đọc grant cũ, không cộng lại.
5. Cộng EXP/vàng/kills, tính level-up/stats theo hàm server; cập nhật HP policy; ghi battle log (hoặc mở rộng log gắn encounter id); cập nhật encounter terminal và result.
6. Commit rồi mới gửi `encounter.result`.

Nếu DB transaction fail: không gửi terminal success; encounter có thể retry finalize idempotently từ terminal state server. Không dùng memory-only success làm kết quả bền vững.

### 6.5. HP và death policy

Chọn một policy trước khi triển khai:
- **Khuyến nghị cho demo hiện tại:** lưu HP server sau encounter; defeat ghi death và hồi sinh về village với HP phục hồi theo luật được chọn, thay vì client tùy gán HP.
- Nếu tránh duy trì HP giữa trận, vẫn phải quyết định server-side và phản ánh rõ UX; không reset full HP ngầm khác với trạng thái người chơi vừa thấy.

## 7. Runtime topology & reconnect

### MVP đơn server
- Active simulation state nằm trong memory của một process game server; PostgreSQL giữ encounter metadata và terminal result.
- Gắn encounter vào process/instance; không chạy nhiều instance sau load balancer trừ khi có sticky routing và bảo đảm reconnect đúng owner.
- Process restart: active encounter không trao thưởng; đánh dấu `aborted/expired` khi recovery job chạy, character được mở khóa. Đây là an toàn hơn việc tái cấp thưởng không chứng minh được.

### Reconnect
- Grace window đề xuất 20 giây (configurable). Character và encounter vẫn bị lock trong thời gian này.
- Client reconnect bằng session + encounterId; server xác thực lại quyền, gửi snapshot authoritative gần nhất.
- Nếu state chỉ ở process memory và owner mất, trả `encounter.aborted`/không thưởng, mở lại character sau cleanup; thông báo rõ người chơi.
- Trước khi scale ngang, chuyển state sang owner service/Redis với lease, fencing token và recovery policy; không giả định sticky session giải quyết failover.

## 8. Error model

| Mã | HTTP/WebSocket | Ý nghĩa |
|---|---|---|
| `401 AUTH_REQUIRED` | 401/close 4401 | Session không hợp lệ |
| `403 ORIGIN_DENIED` | 403/close 4403 | Origin/socket không được phép |
| `404 CHARACTER_NOT_FOUND` | 404 | Không thuộc user hoặc không tồn tại |
| `409 ENCOUNTER_ACTIVE` | 409 | Nhân vật đang có encounter khác |
| `409 ENCOUNTER_TERMINAL` | 409 | Encounter đã kết thúc; trả result nếu retry GET |
| `422 INVALID_ENCOUNTER_REQUEST` | 422 | Monster/spawn/zone không hợp lệ |
| `429 RATE_LIMITED` | 429/close 4429 | Vượt giới hạn request/input |
| `4400 PROTOCOL_ERROR` | close | Schema/message sequence sai |
| `4408 ENCOUNTER_EXPIRED` | close | Hết hạn hoặc timeout |
| `4500 SERVER_ERROR` | close | Lỗi nội bộ; client query result/status trước khi retry action |

Không trả stack trace, RNG seed hoặc detail nội bộ cho client.

## 9. Thay đổi theo module

### Backend
- Tạo `EncounterService` thuần logic: start/validate input/tick/attack/AI/reward/finalize.
- Tách `CombatRules` và content registry khỏi route Express.
- Thêm WebSocket gateway dùng chung session/auth; handshake/Origin/rate limit.
- Thêm repo DB và transaction hoàn tất encounter.
- Thêm bảng/schema/migration encounter, reward idempotency và battle log reference.
- Thêm recovery job cho encounter active hết hạn; không trả thưởng khi không có terminal server state.
- Định nghĩa source of truth cho monster position/spawn; hiện client seed quái trong `useGameStore.ts` và server catalog `MONSTERS` cần hợp nhất/version hóa.

### Frontend
- Thay việc đăng ký callback `handleMonsterDefeat -> useStartBattle` trong `pages/game.tsx` bằng `EncounterClient`.
- Bắt đầu encounter qua HTTP; kết nối socket; gửi input intent có seq; nhận snapshots/events.
- Tách server state khỏi presentation state (prediction/VFX/animation).
- Không tự gọi `/3d-reward`; không tự cập nhật EXP/vàng/kills theo kết quả client.
- Khi quái chết dự đoán ở client, phát animation chờ event authoritative; nếu server phản hồi khác thì reconcile.
- Reconnect/load: gọi GET encounter status và nhận kết quả terminal đã lưu.
- Giữ Canvas mounted như hiện tại; lỗi mạng không được unmount WebGL scene, nhưng overlay phải khóa/diễn giải state hợp lý.

### API contract/codegen
- Cập nhật `lib/api-spec/openapi.yaml` cho start/get encounter và response/error.
- WebSocket protocol có schema versioned riêng (JSON Schema/Zod), validate cả hai chiều.
- Sau thay đổi OpenAPI, chạy codegen theo chỉ dẫn trong `replit.md`.

### Bỏ/đóng lỗ hổng
- Ngừng dùng `POST /characters/:id/3d-reward` ngay khi server-authoritative flow thay thế. Có thể trả `410 Gone` sau giai đoạn chuyển đổi.
- Không để route cũ còn hoạt động chỉ vì client cũ; telemetry cho biết client version trước khi tắt.
- `/characters/:id/battle` theo lượt: đánh dấu legacy/retire hoặc giữ rõ là một chế độ riêng; không gọi nó từ callback realtime.

## 10. Kế hoạch rollout

### Phase 0 — Khóa lỗ hổng ngay (0.5-1 ngày)
- Chặn hoặc vô hiệu hóa `/3d-reward` cho production; nếu cần, tạm không trao reward từ endpoint này.
- Bổ sung rate limit và kiểm tra type/range payload; lưu log bất thường.
- Kiểm kê client versions đang dùng. Đây là biện pháp tạm, chưa đủ làm server-authoritative.

### Phase 1 — Combat domain thuần + bảng encounter (3-5 ngày)
- Chuyển công thức damage/skill/AI tối thiểu thành module server có unit test.
- Thêm schema, migration, idempotency constraints, API start/get.
- Chốt một monster `slime` và một class làm slice đầu.

### Phase 2 — Realtime gateway (4-7 ngày)
- WebSocket auth, protocol validation, sequence/rate limits.
- Fixed tick, movement/clamp, basic attack, enemy AI, snapshot/events.
- Unit/integration test deterministic simulation.

### Phase 3 — Client integration (4-7 ngày)
- Input send + prediction/reconciliation.
- Render server events, reconnect, death/victory states, không reward client-side.
- Kiểm thử latency giả lập và disconnect.

### Phase 4 — Atomic rewards + migration (2-4 ngày)
- Transaction finalize, unique reward grant, log, level-up, HP policy.
- Gỡ `useStartBattle` khỏi callback realtime; tắt `/3d-reward`.
- Kiểm thử duplicate message/concurrent tabs/retry.

### Phase 5 — Mở rộng nội dung & vận hành (1-2 tuần)
- Thêm class/monster/skill theo catalog server.
- Metrics, load testing, replay/debug tools, balance test.
- Chỉ sau khi ổn định mới cân nhắc state service/Redis hoặc multiplayer.

Ước lượng tổng cho vertical slice server-authoritative: khoảng **3-5 tuần cho 1-2 lập trình viên** (chưa tính polish animation/content và chưa có multiplayer). Ước lượng phụ thuộc vào chất lượng code hiện tại; chưa chạy được typecheck/build trong lần audit trước.

## 11. Test strategy & acceptance criteria

### Unit tests
- Damage, crit, cooldown, range, collision, i-frame và skill per class.
- Tick simulation độc lập frame rate và deterministic với seed/rules version.
- Input seq, invalid command, bounds, state transitions.

### Integration/API tests
- User A không thể tạo/get/reconnect encounter của User B.
- Character không thể mở hai encounter; hai tab tranh chấp chỉ một request thắng.
- Client gửi `damage`, `reward`, `enemyHp`, `victory`, `position` giả: bị ignore/reject, DB không đổi.
- Reward grant chỉ một lần với complete/retry đồng thời; unique constraint ngăn duplicate.
- Timeout/disconnect/process restart không tự sinh victory/reward.
- Non-owner, expired, terminal và invalid monster xử lý đúng.
- `/3d-reward` không còn cấp tài nguyên.

### E2E gameplay
- Dùng input thật để hạ slime; client chỉ hiển thị reward sau event/result server.
- Mất socket rồi reconnect trong grace window: nhận state authoritative, không tạo trận mới.
- Client dự đoán kill nhưng server không xác nhận: quái/trạng thái reconcile; không có reward.
- Bị boss đánh chết: server chốt defeat/death/respawn policy; reload không hồi trạng thái gian lận.
- Chơi liên tục, modal mở/đóng không remount Canvas.

### Acceptance gate để bật production
1. Không có route production cộng reward từ số liệu client.
2. Encounter victory chỉ xảy ra từ server simulation.
3. Reward, battle log, kills/EXP/gold/level được commit atomically.
4. Duplicate/retry/concurrent requests không duplicate reward.
5. Authorization, rate limit, schema validation và Origin check có test.
6. Có telemetry cho tick lag, disconnect, invalid input, finalize failure, duplicate attempt.
7. CI typecheck/build/API/E2E xanh từ môi trường sạch.
8. Có feature flag/rollback và hướng dẫn tắt encounter nếu service lỗi.

## 12. Observability & vận hành

Metrics tối thiểu:
- `encounter_started_total{monster,class}`, `encounter_result_total{status}`.
- `encounter_duration_seconds`, `encounter_disconnect_total`, `encounter_reconnect_total`.
- `simulation_tick_lag_ms`, `server_tick_processing_ms`, `active_encounters`.
- `invalid_input_total{reason}`, `rate_limited_total`, `duplicate_reward_attempt_total`.
- `reward_finalize_failure_total`, DB transaction latency/failure.

Log structured với `encounterId`, `characterId`, `userId` (ID nội bộ), `rulesVersion`, sequence range và terminal status. Không log cookie/session ID, mật khẩu, token hoặc dữ liệu nhạy cảm. Đặt retention và sampling cho input/audit log.

## 13. Threat model và giới hạn

| Đe dọa | Biện pháp | Còn lại |
|---|---|---|
| Sửa EXP/vàng/kills trong request | Không nhận reward client; server tính trong transaction | Người chơi vẫn có thể tự động hóa input hợp lệ |
| Gửi kill/victory giả | Không có command terminal từ client; server simulation quyết định | Bug mô phỏng server có thể bị khai thác |
| Gửi hit/damage lớn | Chỉ nhận attack intent; server kiểm tra range/cooldown/hitbox | Tấn công client-side visual có thể khác tạm thời trước reconcile |
| Replay request/socket message | Sequence number, encounter state, unique reward grant, idempotency key | Cần test race condition và recovery kỹ |
| Nhiều tab/thiết bị | Active encounter lock/unique constraint | Lock cần cleanup khi process fail |
| CSRF/cross-site WebSocket | SameSite cookie, Origin allowlist, CSRF cho HTTP mutation | Cần xác nhận cấu hình cookie/proxy thực tế |
| Memory tampering/client cheat | Server không tin state client | Bot/autoclicker hợp lệ không bị loại hoàn toàn |
| Server crash | Active state abort/no reward hoặc snapshot recovery được thiết kế rõ | MVP có thể làm người chơi mất một encounter đang chơi |

## 14. Câu hỏi cần chốt trước khi implementation

1. Có chấp nhận server mô phỏng movement/combat tối thiểu, hay chỉ muốn authoritative cho reward? **Đề xuất: mô phỏng encounter server-side**, nếu yêu cầu là loại bỏ gian lận combat chứ không chỉ chặn sửa số reward.
2. Khi disconnect/crash, encounter bị hủy không thưởng hay resume? Đề xuất MVP: reconnect 20 giây nếu process còn sống; nếu state mất, abort không thưởng.
3. HP có persist giữa encounter không? Chốt death/respawn và potion policy.
4. Có cần client chơi được khi mất mạng không? Nếu có, offline play không thể ghi reward có giá trị cho server cho đến khi xác thực lại.
5. Khu vực đầu tiên, spawn validation và class/skill nào nằm trong vertical slice?

## 15. Quyết định cuối đề xuất

Triển khai theo mẫu **server-authoritative instanced encounter**: REST tạo encounter, WebSocket truyền input/snapshot/event, server fixed-tick simulation, client prediction chỉ phục vụ hình ảnh, và DB transaction idempotent kết thúc trận/phát thưởng.

Làm trước một monster + một class, sau đó mới mở rộng. Tắt endpoint `/3d-reward` cấp tài nguyên; ngừng gọi battle simulation theo lượt từ callback realtime. Nếu không sẵn sàng đầu tư server tick/WebSocket, biện pháp tạm thời là khóa reward endpoint, nhưng không được gọi đó là server-authoritative combat.
