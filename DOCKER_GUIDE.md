# 🐳 Hướng Dẫn Vận Hành Hệ Thống Docker & Docker Compose "Chiến Long Bá"

Dự án **Chiến Long Bá (Realm of Legends) — 2.5D Action MMORPG Monorepo** (`@workspace/db`, `@workspace/api-server`, `@workspace/mmorpg-game`) được đóng gói hoàn chỉnh bằng kiến trúc microservices 3 tầng (3-Tier Architecture) tối ưu hiệu năng cao.

---

## 🏗️ 1. Kiến Trúc Hệ Thống Trong Docker Compose

| Dịch vụ | Tên Container | Vai trò | Cổng nội bộ | Cổng Host | Healthcheck |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`postgres`** | `clb-postgres` | CSDL PostgreSQL 16 Alpine | `5432` | `5432` | `pg_isready` |
| **`api-server`** | `clb-api-server` | Node 22 API & WebSocket Gateway 20Hz | `3001` | `3001` | `/api/healthz` |
| **`mmorpg-game`** | `clb-game-client` | Web Client Nginx 1.27 Alpine (SPA + Gzip + Proxy) | `80` | `8080` | `/` |

---

## 🚀 2. Khởi Chạy Tự Động Toàn Bộ Bằng Một Lệnh Duy Nhất

### Chạy trực tiếp hiển thị log thời gian thực:
```bash
docker compose up --build
```

### Hoặc chạy nền (Background Daemon):
```bash
docker compose up -d --build
```

*(Trên Windows, bạn có thể click đúp chuột vào file `start-docker.bat` để tự động kiểm tra Docker Engine và mở game).*

### 🎮 Truy cập Game:
👉 Mở trình duyệt tại: **`http://localhost:8080`**

### 📡 API Server & Swagger/Healthz:
👉 Kiểm tra API trực tiếp tại: **`http://localhost:3001/api/healthz`**

---

## 🔄 3. Cơ Chế Khởi Tạo & Nạp Dữ Liệu Tự Động (Auto-Migration & Seed)

Khi khởi động, `docker-compose` áp dụng quy trình kiểm soát phụ thuộc chặt chẽ:
1. `clb-postgres` khởi động và kiểm tra sức khỏe qua lệnh `pg_isready`.
2. Khi `postgres` đạt trạng thái `service_healthy`:
   - `clb-api-server` tự động chạy script `entrypoint.sh`.
   - Thực thi `pnpm run db:setup` để tự động tạo toàn bộ bảng, index tối ưu hóa, và nạp danh mục vật phẩm, quái vật, Boss Long Vương, nhiệm vụ tân thủ.
   - Bắt đầu lắng nghe các kết nối HTTP và WebSocket Gateway.
3. Khi `api-server` đạt trạng thái `service_healthy`:
   - `clb-game-client` (Nginx) khởi chạy, phục vụ giao diện Three.js 2.5D và tự động reverse proxy các route `/api/` và `/assets/exported/` về thẳng `api-server`.

---

## ⚙️ 4. Tùy Chỉnh Biến Môi Trường (Environment Variables)

Bạn có thể tạo file `.env` tại thư mục gốc để tùy biến các cổng hoặc thông tin CSDL mà không cần chỉnh sửa code:

```env
# Cổng phục vụ Web Client Nginx
CLIENT_PORT=8080

# Cổng Backend API & WebSocket
API_PORT=3001

# Cổng PostgreSQL
POSTGRES_PORT=5432

# Thông tin CSDL PostgreSQL
POSTGRES_USER=game_user
POSTGRES_PASSWORD=game_password_2026
POSTGRES_DB=game_mmorpg

# Khóa bí mật Session
SESSION_SECRET=clb_mmorpg_session_secret_jwt_2026
```

> **Mẹo**: Nếu máy bạn đang có dịch vụ khác chiếm cổng `8080`, chỉ cần đổi `CLIENT_PORT=8088` trong `.env`, sau đó truy cập `http://localhost:8088`.

---

## 🛠️ 5. Quản Trị & Lệnh Hữu Ích

- **Xem danh sách container**:
  ```bash
  docker compose ps
  ```
- **Xem log của từng dịch vụ**:
  ```bash
  # Xem log máy chủ API
  docker compose logs -f api-server

  # Xem log máy chủ Web Client
  docker compose logs -f mmorpg-game

  # Xem log CSDL
  docker compose logs -f postgres
  ```
- **Dừng toàn bộ hệ thống**:
  ```bash
  docker compose down
  ```
- **Dừng và xóa sạch volume dữ liệu (Reset CSDL về trắng)**:
  ```bash
  docker compose down -v
  ```
