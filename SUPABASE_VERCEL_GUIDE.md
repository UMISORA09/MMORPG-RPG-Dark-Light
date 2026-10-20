# 🚀 Hướng Dẫn Kết Nối Cơ Sở Dữ Liệu Supabase Với Vercel (MMORPG 2.5D)

Tài liệu này hướng dẫn chi tiết từng bước kết nối cơ sở dữ liệu **Supabase PostgreSQL** với máy chủ **Vercel Serverless** cho dự án MMORPG 2.5D (Chiến Long Bá).

---

## 📌 Tổng Quan Kiến Trúc
- **Frontend & API**: Chạy trên hạ tầng Serverless / Edge của Vercel thông qua adapter `api/index.mjs`.
- **Database**: PostgreSQL lưu trữ vĩnh viễn trên Supabase Cloud.
- **Connection Mode**: Khuyên dùng **Transaction Pooler (Port 6543)** của Supabase để tương thích hoàn hảo với Serverless, tránh lỗi nghẽn connection khi nhiều người chơi truy cập cùng lúc.
- **Cơ chế tự động tạo bảng**: Khi khởi động lần đầu, hệ thống game sẽ tự động kết nối và tạo các bảng: `users`, `characters`, `user_sessions` nếu chưa tồn tại.

---

## 🛠️ CÁCH 1: Kết Nối Thủ Công Qua Environment Variables (Khuyên Dùng)

### Bước 1: Lấy Connection String từ Supabase
1. Đăng nhập vào [Supabase Dashboard](https://supabase.com/dashboard).
2. Chọn dự án của bạn (hoặc nhấn **New Project** nếu chưa có).
3. Tại menu bên trái, nhấn vào biểu tượng bánh răng **Project Settings** (ở dưới cùng) -> Chọn mục **Database**.
4. Kéo xuống phần **Connection string**:
   - Chọn tab **URI**.
   - Tại mục **Mode**, chọn **Transaction** (Port `6543`) — *Rất quan trọng đối với Vercel Serverless*.
   - Copy chuỗi kết nối URI, có dạng như sau:
     ```text
     postgresql://postgres.[PROJECT_REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
     ```
   - ⚠️ **Lưu ý**:
     - Thay `[YOUR-PASSWORD]` bằng mật khẩu Database bạn đã đặt khi tạo dự án Supabase.
     - Nếu mật khẩu có chứa ký tự đặc biệt (như `@`, `#`, `%`, `&`), hãy mã hóa URL encode (ví dụ `@` đổi thành `%40`).
     - Nếu quên mật khẩu, kéo lên mục **Database password** trong trang đó và nhấn **Reset database password**.

---

### Bước 2: Cấu Hình Biến Môi Trường Trên Vercel
1. Đăng nhập vào [Vercel Dashboard](https://vercel.com/dashboard).
2. Chọn dự án Game 2.5D của bạn.
3. Chuyển sang tab **Settings** -> chọn **Environment Variables** ở menu bên trái.
4. Thêm 2 biến môi trường sau:

| Tên biến (Key) | Giá trị (Value) mẫu | Ghi chú |
| :--- | :--- | :--- |
| **`DATABASE_URL`** | `postgresql://postgres.xyz:[PASS]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres` | Chuỗi URI lấy từ Bước 1 |
| **`SESSION_SECRET`** | `chienlongba_secret_key_2026_xyz999` | Chuỗi bảo mật ngẫu nhiên để mã hóa cookie phiên đăng nhập |

> 💡 *Mẹo: Bạn có thể chọn áp dụng cho cả 3 môi trường: **Production**, **Preview**, và **Development**.*

5. Nhấn nút **Save**.

---

### Bước 3: Redeploy Dự Án Để Kích Hoạt
1. Trên Vercel Dashboard, chuyển sang tab **Deployments**.
2. Tìm bản deploy mới nhất, nhấn vào nút 3 chấm `...` ở góc phải -> Chọn **Redeploy**.
3. Chờ quá trình build hoàn tất (khoảng 30 giây - 1 phút).
4. Kiểm tra **Runtime Logs** của function `/api/index`:
   - Bạn sẽ thấy log thông báo:
     ```text
     [DB] Connecting to PostgreSQL: postgresql://postgres.xyz:***@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
     [DB] PostgreSQL connected successfully. Initializing tables...
     ```

---

## ⚡ CÁCH 2: Kết Nối Nhanh Qua Vercel Supabase Native Integration

Nếu bạn muốn cấu hình tự động 1-click:
1. Truy cập [Vercel Integrations - Supabase](https://vercel.com/integrations/supabase).
2. Nhấn **Add Integration** -> Chọn tài khoản và chọn Project game của bạn trên Vercel.
3. Chọn tổ chức (Organization) và dự án Supabase muốn kết nối.
4. Nhấn **Connect**. Vercel sẽ tự động điền các biến môi trường:
   - `POSTGRES_URL` (hoặc `DATABASE_URL`)
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
5. Game đã được lập trình sẵn để tự động nhận diện cả `DATABASE_URL` lẫn `POSTGRES_URL`. Bạn chỉ cần nhấn **Redeploy** là xong!

---

## 🔍 Kiểm Tra Dữ Liệu Sau Khi Kết Nối Thành Công

1. Mở trang web game chạy trên Vercel (ví dụ: `https://ten-du-an.vercel.app`).
2. Tiến hành **Đăng ký tài khoản mới** (Register) và đăng nhập tạo nhân vật.
3. Quay trở lại **Supabase Dashboard** -> Menu bên trái chọn **Table Editor**:
   - Bảng **`users`**: Xuất hiện tài khoản vừa đăng ký cùng mật khẩu đã được mã hóa Bcrypt an toàn.
   - Bảng **`characters`**: Xuất hiện nhân vật bạn vừa tạo với chỉ số cấp độ, môn phái, HP, MP, tọa độ.
   - Bảng **`user_sessions`**: Lưu trữ session đăng nhập của người chơi.

---

## 🛠️ Xử Lý Sự Cố Thường Gặp (Troubleshooting)

### 1. Lỗi `password authentication failed for user "postgres..."`
- **Nguyên nhân**: Điền sai mật khẩu hoặc quên chưa thay thế `[YOUR-PASSWORD]` trong URI.
- **Cách sửa**: Vào Supabase -> *Project Settings -> Database -> Reset database password* -> Đổi mật khẩu mới và cập nhật lại biến `DATABASE_URL` trên Vercel.

### 2. Lỗi `connect ENOTFOUND` hoặc `Connection timed out`
- **Nguyên nhân**: Gói Free của Supabase qua Direct Connection (port 5432) chỉ hỗ trợ IPv6, trong khi Vercel functions có thể kết nối qua IPv4.
- **Cách sửa**: Đảm bảo bạn sử dụng địa chỉ **Pooler** có đuôi `.pooler.supabase.com` và cổng **`6543`** (Transaction Pooler).

### 3. Lỗi SSL `self-signed certificate in certificate chain`
- **Đã được giải quyết tự động**: Mã nguồn tại `lib/db/src/index.ts` và `api/index.mjs` đã cấu hình cờ `ssl: { rejectUnauthorized: false }` khi phát hiện domain `supabase.co` hoặc `pooler.supabase.com`.

### 4. Game vẫn hiển thị chế độ In-Memory / Standalone
- **Nguyên nhân**: Biến `DATABASE_URL` chưa được lưu hoặc chưa Redeploy lại Vercel sau khi thêm biến môi trường.
- **Cách sửa**: Kiểm tra lại tab *Settings -> Environment Variables* trên Vercel xem biến đã được add vào môi trường *Production* chưa, sau đó nhấn **Redeploy**.
