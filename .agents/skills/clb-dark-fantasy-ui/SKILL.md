---
name: clb-dark-fantasy-ui
description: "Quy chuẩn thiết kế UI/UX hệ thống giao diện Chiến Long Bá (Dark Fantasy Split-Screen Card & Cinema Slate Teal). Sử dụng skill này để áp dụng nhất quán màu sắc, bo góc, bố cục card đôi, pop-out artwork, nút cyan viên thuốc và các modal/popup/HUD cho toàn bộ các trang và chức năng tiếp theo của game."
---

# CHIẾN LONG BÁ — HỆ THỐNG THIẾT KẾ UI/UX CHUẨN MỰC (DESIGN SYSTEM SKILL)

Skill này lưu giữ bộ quy chuẩn thiết kế giao diện (Design System & UI Guidelines) đã được kiểm chứng và áp dụng thành công trên các màn hình Đăng Nhập (`AuthScreen.tsx`), Sảnh Anh Hùng (`CharacterSelectScreen.tsx`) và Modal Khởi Tạo Nhân Vật (`CharacterCreationModal.tsx`).

Bất kỳ khi nào thiết kế giao diện mới (như Shop, Túi Đồ - Inventory, Bảng Xếp Hạng - Leaderboard, Cài Đặt - Settings, Bảng Kỹ Năng - Skill Tree, hoặc các Popup nhiệm vụ), **BẮT BUỘC** phải tuân theo các nguyên tắc dưới đây.

---

## 1. BẢNG MÀU QUY CHUẨN (COLOR PALETTE & DESIGN TOKENS)

| Thành phần | Mã Màu Hex / CSS | Mô tả & Cách Dùng |
| :--- | :--- | :--- |
| **Nền Tổng Thể (Canvas Background)** | `#4c6e6f` | Muted Slate Teal trầm tĩnh, tạo cảm giác điện ảnh sâu thẳm. Luôn kết hợp với radial gradient tâm: `radial-gradient(circle at 50% 50%, #567c7d 0%, #446364 75%, #385253 100%)`. |
| **Khung Card Chính (Main Modal / Panel)** | `#342a2b` | Dark Charcoal Mauve (nâu đen than quý phái). Dùng làm nền cho mọi Modal, Card chính và Header bar. |
| **Khung Phụ / Input Field (Sub-Panel)** | `#4a383a` | Nền cho các ô input text, khối chỉ số, thẻ slot hoặc danh mục phụ. |
| **Viền Khung (Border / Stroke)** | `#5d4648` | Viền đồng điệu nhẹ nhàng, độ dày 1px (`border border-[#5d4648]`). |
| **Màu Nhấn Hành Động (Primary Cyan)** | `#28c3e1` | Xanh ngọc phát sáng. Dùng cho Nút Bấm Chính, Viền Focus, Checkbox kích hoạt, Icon làm nổi bật. |
| **Văn Bản Chính (Heading / Text Primary)** | `#ffffff` | Màu trắng tinh khiết, font sans-serif hoặc font-display in hoa đậm. |
| **Văn Bản Phụ (Muted / Subtitle Text)** | `#8e7a7c` | Xám ấm nhẹ nhàng cho phụ đề, nhãn mô tả, placeholder và ngày tháng. |
| **Chữ Trên Nút Cyan (Button Text)** | `#1c161a` | Nâu đen đậm tạo độ tương phản tối đa khi nằm trên nền xanh cyan `#28c3e1`. |

---

## 2. QUY CHUẨN BỐ CỤC KHUNG GIAO DIỆN (CONTAINERS & CARDS)

### A. Khung Card Đôi Căn Giữa (Split-Screen Modal Card)
- **Kích thước & Bo góc:** `max-w-[860px]` hoặc `max-w-4xl`, bo tròn góc lớn `rounded-[34px]`.
- **Đổ bóng (Shadow):** `shadow-[0_30px_90px_rgba(0,0,0,0.55),0_10px_30px_rgba(0,0,0,0.4)]`.
- **Cấu trúc 2 cột:**
  - **Cột Trái (Artwork Panel ~48% - 57%):** Chứa hình minh họa nhân vật hoặc khung cảnh game, tràn viền bo góc trái, kết hợp hiệu ứng gradient mờ sang phải để hòa quyện vào cột phải.
  - **Cột Phải (Content / Form Panel ~43% - 52%):** Nền `#342a2b`, lề rộng rãi `p-7 sm:p-10 flex flex-col justify-between`.

### B. Kỹ Thuật Pop-Out 2.5D (Artwork Vươn Ra Ngoài Khung)
- Để tạo chiều sâu sống động, cho phép vũ khí (mũi đao, kiếm) hoặc tóc nhân vật vượt ra ngoài mép trái của card:
  - Khung card giữ `relative`.
  - Cột artwork sử dụng:
    ```tsx
    <div className="relative md:w-[57.4%] flex items-end justify-center rounded-l-[34px]">
      <img
        src="/auth-character-art-2x.png"
        className="absolute top-0 bottom-0 left-[-34.3%] w-[134.3%] h-full object-cover md:object-fill max-w-none pointer-events-none select-none drop-shadow-[0_15px_30px_rgba(0,0,0,0.4)]"
      />
    </div>
    ```

---

## 3. QUY CHUẨN THÀNH PHẦN TƯƠNG TÁC (INTERACTIVE COMPONENTS)

### A. Nút Hành Động Chính (Primary Action Button)
- **Hình dáng:** Bo tròn hoàn toàn dạng viên thuốc (`rounded-full`).
- **Màu sắc & Hiệu ứng:**
  ```tsx
  className="w-full py-3.5 rounded-full bg-[#28c3e1] hover:brightness-110 text-[#1c161a] font-bold text-sm tracking-wider uppercase shadow-[0_0_25px_rgba(40,195,225,0.45)] transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
  ```

### B. Nút Phụ / Nút Đóng / Thẻ Lọc (Secondary Buttons)
- Nền `#4a383a`, viền `#5d4648`, bo góc `rounded-xl` hoặc `rounded-full`, text `#8e7a7c`, hover sáng trắng:
  ```tsx
  className="px-5 py-2.5 rounded-full bg-[#4a383a] hover:bg-[#5d4648] border border-[#5d4648] text-[#8e7a7c] hover:text-white font-bold text-xs transition-colors"
  ```

### C. Ô Nhập Liệu (Input Fields)
- Chiều cao `h-11` hoặc `h-12`, bo góc mềm mại `rounded-xl`:
  ```tsx
  className="w-full h-11 px-4 rounded-xl bg-[#4a383a] border border-[#5d4648] text-white placeholder-[#8e7a7c] text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#28c3e1] focus:border-transparent outline-none transition-all"
  ```

### D. Thẻ Danh Mục / Thẻ Chọn (Selectable Cards)
- Trạng thái bình thường: `bg-[#4a383a] border-[#5d4648] hover:border-[#8e7a7c]`.
- Trạng thái được chọn (Active): `bg-[#584245] border-2 border-[#28c3e1] shadow-[0_0_25px_rgba(40,195,225,0.35)] scale-[1.02]`.

---

## 4. QUY CHUẨN MODAL / POPUP (POPOVERS & OVERLAYS)
- **Backdrop:** Lớp phủ tối mờ tinh tế: `fixed inset-0 bg-black/60 backdrop-blur-md z-50`.
- **Khung Modal:** `rounded-[34px] bg-[#342a2b] border border-[#5d4648] shadow-[0_30px_90px_rgba(0,0,0,0.7)] p-6 sm:p-9 text-white`.
- **Hiệu ứng xuất hiện (Framer Motion):**
  ```tsx
  <motion.div
    initial={{ opacity: 0, scale: 0.94, y: 15 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.94, y: 15 }}
    transition={{ type: "spring", damping: 25, stiffness: 300 }}
  >
  ```

---

## 5. TÍCH HỢP TẠO HÌNH NHÂN VẬT ANIME PIXEL ART (CHARACTER ART SKILL)
- Xem chi tiết tại: `c:\Cassavas\Game2.5D\.agents\skills\clb-character-art-style\SKILL.md`.
- Toàn bộ ảnh nhân vật trong Modal / Sảnh chọn anh hùng tuân thủ chuẩn **Anime Action Pixel Art Sprite** (Nam đam mỹ 6 múi, Nữ quyến rũ sexy, tỷ lệ 3.5-4 đầu, outline 1px tối, 3-tone shading, `style={{ imageRendering: 'pixelated' }}`).

---

## 6. CHECKLIST KIỂM DUYỆT TRƯỚC KHI BÀN GIAO GIAO DIỆN
1. [ ] Nền trang có đúng mã màu Slate Teal `#4c6e6f` với radial gradient không?
2. [ ] Card hoặc Modal có sử dụng nền nâu đen than `#342a2b` với góc bo lớn `34px` không?
3. [ ] Các ô nhập và khối phụ có sử dụng `#4a383a` với viền `#5d4648` không?
4. [ ] Nút hành động chính có đúng chuẩn viên thuốc `rounded-full` màu cyan `#28c3e1` với chữ đậm `#1c161a` không?
5. [ ] Tạo hình nhân vật sử dụng chuẩn Anime Pixel Art sắc nét từ `clb-character-art-style`?
6. [ ] Font chữ tiêu đề rõ ràng, phụ đề dùng màu `#8e7a7c`?
7. [ ] Chạy `pnpm run typecheck` đạt 0 lỗi?

