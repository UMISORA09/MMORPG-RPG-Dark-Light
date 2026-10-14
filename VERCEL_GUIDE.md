# 🌐 Hướng Dẫn Triển Khai Máy Chủ Thật Thử Nghiệm Beta Trên Vercel

Game đã được tối ưu hóa toàn diện với file cấu hình `vercel.json` và Vercel Serverless Function adapter tại `api/index.ts`. Bạn có thể triển khai lên Vercel để nhận ngay link public `https://ten-du-an.vercel.app` cho bạn bè hoặc người chơi thử nghiệm bản Beta.

---

## 🚀 Cách 1: Triển khai nhanh qua Vercel CLI

### Bước 1: Mở terminal tại thư mục gốc
```bash
cd c:\Cassavas\Game2.5D
```

### Bước 2: Cài Vercel CLI (nếu chưa có) và deploy
```bash
npx vercel
```
- Khi được hỏi:
  - `Set up and deploy?`: Nhấn `y` (Enter)
  - `Which scope?`: Chọn tài khoản Vercel của bạn
  - `Link to existing project?`: Nhấn `n` (Enter)
  - `What's your project's name?`: Đặt tên (vd: `game-mmorpg-25d-beta`)
  - `In which directory is your code located?`: Để trống `./` (Enter)
  - `Want to modify these settings?`: Nhấn `n` (Enter vì `vercel.json` đã cấu hình sẵn)

### Bước 3: Deploy lên Production
```bash
npx vercel --prod
```

---

## 🚀 Cách 2: Triển khai qua GitHub (Tự động cập nhật khi push code)

1. Tạo repository mới trên GitHub (ví dụ: `Game2.5D-MMORPG`).
2. Đẩy toàn bộ thư mục lên GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit MMORPG 2.5D Beta"
   git remote add origin https://github.com/<tai-khoan>/Game2.5D-MMORPG.git
   git push -u origin main
   ```
3. Truy cập [Vercel Dashboard](https://vercel.com/new).
4. Nhấn **Import** repository vừa tạo.
5. Vercel sẽ tự động nhận diện `vercel.json`. Nhấn **Deploy**!

---

## 💾 Cấu hình Cơ Sở Dữ Liệu PostgreSQL cho Bản Beta Trên Vercel

Để dữ liệu người chơi, nhân vật và bảng xếp hạng được lưu trữ vĩnh viễn trên server thật:
1. Bạn có thể tạo 1 Database PostgreSQL miễn phí trong 30 giây tại:
   - [Neon.tech](https://neon.tech) (Free Serverless Postgres, rất khuyên dùng cho Vercel)
   - [Supabase.com](https://supabase.com)
   - Hoặc trực tiếp tab **Storage -> Postgres** trong Vercel Dashboard.
2. Vào **Project Settings -> Environment Variables** trên Vercel:
   - `DATABASE_URL`: Điền connection string (vd: `postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require`)
   - `SESSION_SECRET`: Một chuỗi ngẫu nhiên bí mật (vd: `mmorpg_secure_key_2026_xyz`)
3. Nhấn **Redeploy**. Máy chủ sẽ tự động kết nối PostgreSQL và tự động tạo bảng CSDL khi khởi động!

*(Lưu ý: Ngay cả khi chưa cấu hình `DATABASE_URL`, máy chủ vẫn hoạt động trơn tru ở chế độ Standalone Beta cho phép đăng ký tài khoản và trải nghiệm ngay lập tức).*
