# 🐳 Hướng Dẫn Chạy Docker Độc Lập (Standalone) & Docker Compose

Dự án game kết hợp giữa **Three.js / 2.5D 3D Action RPG** (Dragon-Game-Studio) và **Hệ thống MMORPG Dark Fantasy** (Heroic-Battleground) hỗ trợ chạy hoàn toàn độc lập mà không cần cài đặt thêm phần mềm phụ thuộc nào bên ngoài.

---

## 🚀 Cách 1: Chạy Tự Động Với Docker Compose (Khuyên dùng)
Cách này sẽ tự động khởi tạo 2 container:
1. **Container PostgreSQL 16**: Lưu trữ tài khoản, nhân vật, bảng xếp hạng, nhật ký trận đấu.
2. **Container Game Server**: Chạy game và API kết hợp trên cổng `8080`. Tự động tạo bảng dữ liệu và nạp danh mục vật phẩm/quái vật.

### Lệnh chạy:
```bash
docker compose up --build
```
Hoặc chạy nền (daemon):
```bash
docker compose up -d --build
```

### Truy cập Game:
👉 Mở trình duyệt vào: **`http://localhost:8080`**

### Lệnh dừng:
```bash
docker compose down
```
*(Dữ liệu PostgreSQL được lưu trữ an toàn trong Docker Volume `postgres_data`)*

---

## ⚡ Cách 2: Chạy 1 Container Docker Hoàn Toàn Độc Lập (Không cần Database ngoài)
Hệ thống có bộ nạp CSDL **Adaptive Standalone Engine**: Nếu không có CSDL PostgreSQL bên ngoài, máy chủ sẽ tự động chuyển sang chế độ Standalone In-Memory để bạn có thể test ngay tức thì chỉ với một lệnh `docker run`.

### Bước 1: Build image
```bash
docker build -t mmorpg-25d-game .
```

### Bước 2: Chạy container
```bash
docker run -p 8080:8080 mmorpg-25d-game
```

👉 Mở trình duyệt vào: **`http://localhost:8080`**

---

## 🛠️ Kiểm tra trạng thái Container:
- Kiểm tra danh sách container đang chạy:
  ```bash
  docker ps
  ```
- Xem log thời gian thực:
  ```bash
  docker logs -f mmorpg-game
  ```
- Kiểm tra Healthcheck endpoint:
  ```bash
  curl http://localhost:8080/api/healthz
  ```
