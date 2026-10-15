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

## 5. QUY CHUẨN THANH CUỘN ĐỒNG BỘ (CUSTOM SCROLLBAR SYSTEM)

Toàn bộ các vùng cuộn trang (`overflow-y-auto`, `overflow-auto`, modal lists, bảng chat, kho đồ, dropdown) đều được đồng bộ hóa với hệ màu Dark Fantasy Mauve & Neon Cyan:

### A. Thông Số Token & Màu Sắc
| Thành Phần | Giá Trị CSS | Hiệu Ứng Thẩm Mỹ |
| :--- | :--- | :--- |
| **Độ Rộng (Width / Height)** | `7px` (Global) / `6px` (`.custom-scrollbar`) | Siêu mỏng, thanh thoát, không lấn át bố cục nội dung. |
| **Rãnh Trượt (Scrollbar Track)** | `rgba(39, 31, 32, 0.45)` | Nền nâu than bán trong suốt, bo tròn tối đa `rounded-full`. |
| **Con Trượt (Scrollbar Thumb)** | `#5d4648` | Màu viền khung đặc trưng của UI, bo tròn mềm mại `border-radius: 9999px`. |
| **Trạng Thái Hover (Thumb Hover)** | `#8e7a7c` | Sáng lên màu xám ấm, có đổ bóng nhẹ `box-shadow: 0 0 10px rgba(142, 122, 124, 0.45)`. |
| **Trạng Thái Kéo Giữ (Thumb Active)** | `#28c3e1` | Phát sáng rực rỡ màu Cyan ngọc, hiệu ứng hào quang `box-shadow: 0 0 14px rgba(40, 195, 225, 0.75)`. |
| **Góc Giao (Corner)** | `transparent` | Hoàn toàn trong suốt để không bị vệt vuông thô ráp. |

### B. Cấu Hình CSS Toàn Cục (`index.css`)
```css
/* Universal Scrollbar for Firefox */
* {
  scrollbar-width: thin;
  scrollbar-color: #5d4648 rgba(39, 31, 32, 0.45);
}

/* WebKit Scrollbars (Chrome, Edge, Safari, Opera) */
::-webkit-scrollbar {
  width: 7px;
  height: 7px;
}
::-webkit-scrollbar-track {
  background: rgba(39, 31, 32, 0.45);
  border-radius: 9999px;
}
::-webkit-scrollbar-thumb {
  background: #5d4648;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.04);
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}
::-webkit-scrollbar-thumb:hover {
  background: #8e7a7c;
  box-shadow: 0 0 10px rgba(142, 122, 124, 0.45);
}
::-webkit-scrollbar-thumb:active {
  background: #28c3e1;
  box-shadow: 0 0 14px rgba(40, 195, 225, 0.75);
}
```

---

## 6. TÍCH HỢP TẠO HÌNH NHÂN VẬT ANIME PIXEL ART (CHARACTER ART SKILL)
- Xem chi tiết tại: `c:\Cassavas\Game2.5D\.agents\skills\clb-character-art-style\SKILL.md`.
- Toàn bộ ảnh nhân vật trong Modal / Sảnh chọn anh hùng tuân thủ chuẩn **Anime Action Pixel Art Sprite** (Nam đam mỹ 6 múi, Nữ quyến rũ sexy, tỷ lệ 3.5-4 đầu, outline 1px tối, 3-tone shading, `style={{ imageRendering: 'pixelated' }}`).

---

---

## 8. QUY CHUẨN GIAO DIỆN HÀNH TRANG & TRANG BỊ CHIẾN ĐẤU (INVENTORY & EQUIPMENT SYSTEM STANDARD)

Quy chuẩn này chuẩn hóa toàn bộ giao diện **Hành Trang** (trước đây là Túi đồ) áp dụng phong cách Dark Slate Cinema Slate & Indigo (`#11141c` / `#161922` / `#273044`) đồng bộ với màn hình chiến đấu thời gian thực:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  ❤️ 500 Sinh lực   ⚔️ 65.0 Sát thương   🛡️ 0.0% Phòng thủ   ⚡ 170.0 Tốc độ đánh   🪙 Vàng  ✕ │
├───────────────────────────────────┬────────────────────────────────────────────────────┤
│      Lực chiến trang bị: 60       │             TÚI HÀNH TRANG (24 Ô)                  │
│                                   │  ┌───┬───┬───┬───┬───┬───┐                         │
│  [Mũ]         ▲           [V.Cổ]  │  │ ⚔ │ 🗡 │ ✦ │ ✦ │ ✦ │ ✦ │                         │
│  [Giáp]      /█\          [HoaTai]│  ├───┼───┼───┼───┼───┼───┤                         │
│  [Găng]     /███\         [Nhẫn]  │  │ ✦ │ ✦ │ ✦ │ ✦ │ ✦ │ ✦ │                         │
│  [Quần]     (Hero)        [VũKhí] │  ├───┼───┼───┼───┼───┼───┤                         │
│  [Giày]    [======]       [Khiên] │  │ ✦ │ ✦ │ ✦ │ ✦ │ ✦ │ ✦ │                         │
│  [ThắtLưng](Rune Pedestal)[ÁoChog]│  └───┴───┴───┴───┴───┴───┘                         │
│                                   ├────────────────────────────────────────────────────┤
│                                   │ [Nhân vật]  [Phụ bản]   [Nhiệm vụ]  [Ưu đãi]       │
│                                   │ [Cường hóa] [Chế tạo]   [Cộng đồng] [Cài đặt]      │
└───────────────────────────────────┴────────────────────────────────────────────────────┘
```

### A. Thanh Chỉ Số Header (Top Stat Bar)
- Bốn chỉ số cốt lõi nằm ngang góc trên bên trái:
  - **Sinh lực (HP):** Biểu tượng Heart màu hồng đỏ `#fb7185`, nền `rgba(244,63,94,0.1)`.
  - **Sát thương (ATK):** Biểu tượng Song Kiếm màu hổ phách `#fbbf24`, nền `rgba(245,158,11,0.1)`.
  - **Phòng thủ (DEF):** Biểu tượng Khiên màu lam thiên thanh `#38bdf8`, nền `rgba(14,165,233,0.1)`.
  - **Tốc độ (SPD):** Biểu tượng Tia Sét màu ngọc lục bảo `#34d399`, nền `rgba(16,185,129,0.1)`.
- Góc phải: Huy hiệu vàng `🪙 Vàng` bo tròn `rounded-full` và nút đóng `X`.

### B. Cột Trái: Đài Phong Ấn Hero & 12 Ô Trang Bị Tiêu Chuẩn RPG
- **Điểm Lực Chiến Trang Bị (Equipment Rating):** Tiêu đề trung tâm, công thức tổng hợp từ chỉ số trang bị với hiệu ứng chữ Cyan ngọc phát sáng `drop-shadow-[0_0_8px_rgba(40,195,225,0.6)]`.
- **Đài Sen Ma Thuật (Rune Pedestal Floor):** Nền elip gradient hướng lên `bg-gradient-to-t from-cyan-950/60 to-transparent` viền ánh hào quang neon cyan.
- **Tạo hình Anh Hùng:** Đứng hiên ngang ở trung tâm, load sprite pixelated sắc nét theo class từ `ClassSprite`.
- **12 Ô Trang Bị Bố Trí Đối Xứng:**
  - **6 Ô Cột Trái:** Mũ/Nón (Helmet), Áo Giáp (Armor), Găng Tay (Gloves), Quần Giáp (Pants), Giày Chiến (Boots), Thắt Lưng/Ấn Ký (Belt).
  - **6 Ô Cột Phải:** Dây Chuyền (Necklace), Hoa Tai/Ngọc Bội (Earring), Nhẫn Giới Chỉ (Ring), Vũ Khí Chính (Weapon), Khiên/Pháp Bảo (Shield), Áo Choàng/Lệnh Kỳ (Banner).
  - Khi ô trống: Hiển thị Silhouette vector SVG tối giản màu `#586580` độ mờ 45%.
  - Khi đã trang bị: Hiển thị icon vật phẩm, viền phát sáng theo độ hiếm, chấm ngọc Cyan ở góc phải.

### C. Cột Phải: Lưới Hành Trang 6x4 & 8 Nút Điều Hướng Hệ Thống
- **Lưới Vật Phẩm 24 Ô (6 Cột x 4 Hàng):**
  - Ô trống: Hiển thị ký hiệu ngôi sao 4 cánh `✦` màu chìm `#404a62`.
  - Ô có đồ: Thẻ bo tròn `rounded-xl`, viền phát sáng tương ứng độ hiếm:
    - **Thần Thoại (Legendary):** Viền Vàng `#f59e0b`, phát sáng vàng hổ phách.
    - **Sử Thi (Epic):** Viền Tím `#a855f7`, phát sáng tím huyền ảo.
    - **Hiếm (Rare):** Viền Cyan `#28c3e1`, phát sáng xanh ngọc.
    - **Không Phổ Biến (Uncommon):** Viền Lục `#10b981`.
    - **Phổ Biến (Common):** Viền Xám Đen `#475569`.
  - Món đang mặc có huy hiệu checkmark nhỏ góc trên.
- **Thanh 8 Nút Chức Năng Nhanh (2 hàng x 4 cột):**
  1. `Nhân vật`: Xem bảng thuộc tính chi tiết nhân vật (HP, MP, Công, Thủ, Tốc, Lực chiến).
  2. `Phụ bản`: Mở Cấm Địa Săn Quái & Khiêu chiến Boss Cổ Long.
  3. `Nhiệm vụ`: Mở bảng chiến tích & nhiệm vụ nhận vàng hàng ngày.
  4. `Ưu đãi`: Mở Cửa Hàng trang bị thần binh.
  5. `Cường hóa`: Nâng cấp tăng chỉ số ATK/DEF cho trang bị.
  6. `Chế tạo`: Lò rèn thần binh từ nguyên liệu rơi của Boss.
  7. `Cộng đồng`: Bảng Vinh Danh Long Tộc (Leaderboard).
  8. `Cài đặt`: Cài đặt điều khiển và đồ họa game.

### D. Đồng Bộ Toàn Thể Trang Chiến Đấu
- Phím tắt bàn phím: Nhấn `B` hoặc `I` mở/đóng Hành Trang.
- HUD: Nút chức năng hiển thị nhãn **Hành Trang (B)** kèm icon `Backpack`.
- Dòng nhắc lệnh: Cập nhật đồng bộ sang "B Hành trang".



