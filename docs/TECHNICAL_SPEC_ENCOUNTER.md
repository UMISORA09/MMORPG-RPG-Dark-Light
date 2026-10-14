# Technical Spec — Server-Authoritative Realtime Encounter

**Dự án:** Chiến Long Bí Sử / Game2.5D  
**Phiên bản:** 1.0 — Chuẩn Thiết Kế Phê Duyệt  
**Ngày phê duyệt:** 15/10/2026  
**Trạng thái:** Tài liệu Đặc tả Kỹ thuật Chuẩn (Baseline Architecture Spec)

---

## 1. Mục tiêu

Thiết kế encounter realtime trong đó server là nguồn sự thật duy nhất cho các kết quả có giá trị: trạng thái quái, HP chính thức, sát thương, thắng/thua, EXP, vàng, vật phẩm và thống kê. Client vẫn được phép dự đoán/trình bày chuyển động và hiệu ứng để giữ cảm giác mượt, nhưng mọi dữ liệu do client khai báo về vị trí, hit, sát thương, quái chết hoặc phần thưởng đều không được dùng làm bằng chứng để ghi tiến trình.

Mục tiêu cấp sản phẩm là single-player action RPG có tài khoản/persistence. Spec này không tự động biến game thành MMORPG nhiều người chơi đồng thời.

### Không phải mục tiêu
* Đồng bộ nhiều người chơi trong cùng một thế giới, PvP, matchmaking hoặc anti-cheat ở mức kernel.
* Đồng bộ vật lý 60 lần/giây qua DB.
* Chống hoàn toàn bot/auto-input có thể gửi chuỗi input hợp lệ.
* Tái tạo toàn bộ open world trên server ngay lập tức. Giai đoạn đầu chỉ authoritative cho một encounter có giới hạn.

---

## 2. Hiện trạng và lỗ hổng cần đóng

### Các điểm đã xác nhận trong mã:
1. `artifacts/mmorpg-game/src/game/Game.tsx` chạy vòng lặp client qua R3F `useFrame` và đưa input vào game store.
2. `useGameStore.ts` có trạng thái player/enemy, skill/cooldown và gọi callback khi quái bị đánh bại.
3. `pages/game.tsx` gọi `useStartBattle` sau callback hạ quái. API `/characters/:characterId/battle` trước đây chạy `simulateBattle` ở server bằng luật xúc xắc theo lượt, gây mâu thuẫn với trận realtime người chơi vừa trải nghiệm.
4. API `/characters/:characterId/3d-reward` trước đây cộng `expGained`, `goldGained`, `kills` do request gửi lên (Lỗ hổng gian lận đã được khóa bằng HTTP 403 ở Phase 0).
5. DB nhân vật có HP, chỉ số, EXP/vàng/kills/deaths; battle log lưu kết quả trận, cần model encounter với trạng thái, idempotency và ownership lock.

### Mục tiêu bảo mật:
* Không có endpoint nào nhận số EXP/vàng/kills do client tự khai để cộng vào nhân vật.
* Không thể nhận thưởng bằng cách chỉ gọi API complete hoặc gửi `enemyDead=true`.
* Mỗi encounter chỉ được kết thúc và phát thưởng tối đa một lần, kể cả khi retry/mất kết nối.
* Character không thể có hai encounter đồng thời trên nhiều tab/thiết bị.
* Kết quả ghi DB được tạo từ mô phỏng/input đã được server kiểm tra.

---

## 3. Quyết định kiến trúc

### 3.1. Mô hình đề xuất
Dùng server-authoritative encounter simulation với transport realtime:
* Server tạo encounter và mô phỏng trạng thái chiến đấu trên fixed timestep 20 ticks/giây (50 ms) ở giai đoạn đầu.
* Client gửi input intent theo lô nhỏ: phím/nút đang giữ, hướng di chuyển mong muốn, sequence number. Client không gửi vị trí cuối cùng, sát thương, kết quả collision hay reward.
* Server xác thực input, cập nhật state, chạy di chuyển/AI/collision/combat/cooldown và phát snapshot/sự kiện authoritative.
* Client có thể dự đoán input local để render, sau đó reconcile theo state server; VFX/damage popup chỉ là trình bày cho đến khi sự kiện server xác nhận.
* Khi encounter kết thúc, server tự tính reward và cập nhật nhân vật/log trong một DB transaction idempotent.

### 3.2. Phạm vi authoritative giai đoạn đầu
Server không cần chạy toàn bộ cảnh làng, NPC trang trí, camera, particles hoặc animation. Chỉ chạy state logic tối thiểu của encounter:
* Player logical position/velocity, facing, HP, cooldown, trạng thái sống/chết.
* Monster encounter: vị trí, HP, AI state, attack telegraph/cooldown, trạng thái sống/chết.
* Geometry collision tối giản: sàn, ranh encounter, vùng cấm, khoảng cách/hitbox đã định nghĩa.
* Encounter timer, RNG server-side, điều kiện thắng/thua và reward.

Client render world/animation ở 60 FPS; server tick combat ở 20 Hz. Tốc độ tick có thể điều chỉnh sau profiling, nhưng luật gameplay phải chạy trên bước thời gian cố định để tránh kết quả phụ thuộc frame rate.

### 3.3. Nguyên tắc cấm (Anti-Patterns)
* Không gửi `{ damage: 999999 }`, `{ monsterHp: 0 }`, `{ victory: true }`, `{ reward: ... }` rồi tin request.
* Không dùng HMAC/secret nhúng trong frontend; người chơi có thể trích xuất secret.
* Không chỉ kiểm tra tốc độ giết trung bình trên client rồi cộng reward.
* Không gọi battle mô phỏng theo lượt như một side-effect sau khi client nói quái realtime đã chết.
* Không ghi state mỗi tick vào PostgreSQL; đây không phải kho realtime.

---

## 4. Luồng giao thức

### Bước 1 — Tạo encounter qua HTTP
`POST /api/characters/{characterId}/encounters`

**Request:**
```json
{
  "monsterId": "slime",
  "spawnId": "wilderness-slime-01",
  "clientRequestId": "uuid"
}
```

**Quy tắc:**
* Auth qua session hiện tại.
* Server kiểm tra nhân vật thuộc session, không bị khóa bởi encounter active khác, đủ điều kiện khu vực/level, monster/spawn đang tồn tại.
* `monsterId` và `spawnId` là yêu cầu mở trận, không phải bằng chứng đã tiếp cận quái.
* Server tự đọc stats/class/equipment và xác định snapshot combat; client không truyền stat.
* Tạo UUID encounter, seed RNG server-side, server time, `expiresAt`, session/character ownership; lưu trạng thái active và liên kết character.
* Idempotency: `clientRequestId` được unique theo character/user; retry cùng key trả cùng encounter nếu request gốc thành công.

**Response:**
```json
{
  "encounterId": "uuid",
  "protocolVersion": 1,
  "tickRate": 20,
  "serverTime": "2026-10-15T00:00:00.000Z",
  "expiresAt": "2026-10-15T00:05:00.000Z",
  "snapshot": {
    "tick": 0,
    "player": { "position": [0,0,0], "hp": 750, "maxHp": 750 },
    "enemy": { "id": "slime", "position": [4,0,0], "hp": 80, "maxHp": 80 }
  },
  "socketPath": "/api/realtime"
}
```

### Bước 2 — Mở realtime connection (WebSocket)
Transport duy nhất: WebSocket (`ws`).

**Auth & Handshake:**
* Dùng session cookie hiện có; kiểm tra session khi handshake và bind socket vào `userId`, `characterId`, `encounterId` đã xác thực.
* Kiểm tra Origin theo allowlist; từ chối cross-site websocket.
* So khớp chủ sở hữu và trạng thái encounter trong server.
* Rate limit theo user/IP và giới hạn số socket/character.

**Client gửi message input (20 Hz):**
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

**Server phát snapshot (20 Hz):**
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

**Sự kiện có thẩm quyền (Events):**
```json
{
  "type": "event",
  "eventId": "uuid",
  "serverTick": 47,
  "name": "attack.hit",
  "data": { "attackerId": "player", "targetId": "enemy-1", "damage": 28, "critical": false }
}
```

### Bước 3 — Kết thúc encounter
Không cung cấp endpoint công khai dạng `POST /complete { victory: true }`.

Server tự kết thúc khi:
* `enemy HP <= 0` theo combat server; hoặc
* `player HP <= 0`; hoặc
* encounter timeout / disconnect grace window / invalid state / abort.

**Terminal message:**
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

Client retry lấy kết quả qua `GET /api/characters/{characterId}/encounters/{encounterId}` (idempotent, không cộng thưởng lần 2).

---

## 5. Luật mô phỏng server

* **Fixed tick:** 50 ms (20 Hz) ban đầu; dùng accumulator giới hạn drift.
* **Movement:** Tốc độ xác định từ stats/equipment; normalize diagonal vector; clamp bounds; simple geometry collision.
* **Combat:**
  * Attack/skill là input edge (nhấn mới), không phải field damage.
  * Server kiểm tra alive, cooldown, tài nguyên, cự ly, góc, i-frame, và mỗi hit chỉ trừ máu một lần.
  * Damage formula, crit, armor, stagger là hàm thuần server-side (Shared Combat Rules).
  * Telegraph/AI: Server phát windup tick, vùng tấn công và thời điểm active; tính hit từ player position tại impact tick.
* **Chống spam & abnormal input:**
  * Throttle input packet và action rate; reject sequence replay/out-of-order.
  * Anomaly telemetry: ghi nhận kill time dưới ngưỡng hoặc tốc độ phi lý.

---

## 6. Data Model & Persistence

### 6.1. Bảng `encounters`
* `id`: UUID primary key.
* `character_id`: FK characters.
* `user_id`: FK users.
* `monster_id`, `spawn_id`, `zone_id`.
* `status`: active | victory | defeat | aborted | expired.
* `rules_version`, `content_version`.
* `rng_seed`.
* `started_at`, `ended_at`, `expires_at`, `last_seen_at`.
* `final_server_tick`, `final_state_json`.
* `result_json`, `log_id`.
* `client_request_id`: unique idempotency key.
* Partial unique index: tối đa 1 encounter `active` trên mỗi `character_id`.

### 6.2. Reward Idempotency
* Khóa encounter bằng `SELECT ... FOR UPDATE` khi finalize.
* Insert unique grant relation theo `encounter_id`.
* Cập nhật character (EXP, Gold, Level, Stats, Kills, Deaths) và ghi `battle_logs` trong cùng 1 database transaction.

### 6.3. HP và Death Policy
* **Victory:** Lưu HP server sau trận; hồi dần khi về Làng Long Tộc (`SAFE_VILLAGE`).
* **Defeat:** Ghi `deaths + 1`, hồi sinh về Làng Long Tộc với HP an toàn (tránh sập màn hình đen hoặc kẹt 0 HP).

---

## 7. Quyết định kỹ thuật chốt cho 5 câu hỏi trọng yếu

| Câu hỏi | Quyết định chốt | Cơ sở thực thi |
| :--- | :--- | :--- |
| **1. Phạm vi mô phỏng server** | **Mô phỏng Encounter Server-Side 20Hz** | Ngăn chặn triệt để hack di chuyển, teleport, hack sát thương và hack bất tử. |
| **2. Chính sách Disconnect/Crash** | **Grace Window 20 giây; Quá 20s hủy không thưởng** | Cho phép rớt mạng nhẹ kết nối lại; nếu server mất memory state thì abort an toàn, mở khóa character. |
| **3. Chính sách HP sau trận** | **Persist HP; hồi máu tại Làng Long Tộc** | Tử trận hồi sinh tại Làng với đầy bình máu; chiến thắng giữ HP còn lại. |
| **4. Chơi Offline** | **Không hỗ trợ offline phát thưởng** | Game là Online Persistent Action RPG; mọi phần thưởng phải qua server authoritative. |
| **5. Slice đầu tiên (Vertical Slice #1)** | **1 Quái (Slime) + 1 Phái (Fighter / Đấu sĩ)** | Bản đồ Đấu trường Hoang dã; Slime (HP 80, ATK 15, DEF 5, EXP 25, Vàng 10); Fighter (ATK 85, DEF 70, Base HP 950). |
