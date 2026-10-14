# Đánh giá nhân vật: đồng bộ tạo hình, animation và chất lượng hình ảnh

**Dự án:** Chiến Long Bí Sử / Game2.5D  
**Ngày rà soát:** 15/10/2026  
**Phạm vi:** Kiểm tra mã render và một số PNG/spritesheet thực tế trong thư mục public. Đây là đánh giá dựa trên asset/code đã đọc; chưa chạy trực tiếp game để chụp toàn bộ màn hình runtime.

## Kết luận

Nhận xét “nhân vật hiện tại quá tệ/không đồng bộ” có cơ sở kỹ thuật rõ. Vấn đề không chỉ nằm ở chất lượng vẽ mà là **một nhân vật đang có nhiều nguồn tạo hình khác nhau, các nguồn đó không dùng chung dữ liệu, và một spritesheet đang sai hợp đồng kích thước với renderer**.

Ưu tiên đúng là **dừng mở rộng art mới trong thời gian ngắn, thống nhất pipeline và chọn một phong cách production**, sau đó làm một nhân vật chuẩn hoàn chỉnh trước khi nhân rộng cho 4 class. Nếu chỉ thay thêm PNG mà không sửa luồng dữ liệu/renderer thì nhân vật vẫn lệch nhau.

## Những vấn đề đã xác minh

### 1. Bốn combat spritesheet thực chất là cùng một hình

Các file `fighter_combat_sheet.png`, `tank_combat_sheet.png`, `assassin_combat_sheet.png`, `gunner_combat_sheet.png` và `hero_combat_sheet.png` đều có cùng SHA-256, cùng kích thước 512×576 và cùng nội dung hình ảnh. Vì vậy, đổi tên class không làm đổi nhân vật/animation; bốn nghề đang dùng một sheet chung.

### 2. Player sprite procedural có atlas 8×5 nhưng renderer giả định 8×9

- `MultiLayerSpriteGenerator.ts` tạo canvas **8 cột × 5 hàng** (1024×640 nếu frame 128).
- `PlayerEntity25D.tsx` dùng texture này làm `customTexture` cho `SpriteBillboard25D`.
- `SpriteBillboard25D.tsx` luôn đặt `TOTAL_ROWS = 9` và ánh xạ các state vào 9 hàng.

Hệ quả: UV của player texture bị tính theo 9 hàng trong khi texture chỉ có 5; hàng animation bị crop lệch/thu nhỏ sai. Các state như jump, attack4, death trỏ tới hàng không tồn tại hoặc không đúng nội dung. Đây là lỗi hiển thị có thể sửa độc lập với việc vẽ lại nhân vật.

### 3. Texture procedural không phải pixel-art character hoàn chỉnh

Generator hiện vẽ hình thể đơn giản bằng các hình khối/đường vẽ: thân giáp, đầu, vũ khí, bóng. Nó có cel-shading và palette theo blueprint, nhưng thiếu chi tiết nhân diện (mặt/tóc/đường nét), giải phẫu, silhouette, phụ kiện và độ hoàn thiện tương tự các portrait pixel-art được trưng trong UI. Vì vậy nhìn trong gameplay dễ giống placeholder/game prototype, dù tên hàm có nhắc “AAA”.

### 4. Portrait trong UI khác hẳn nhân vật trong gameplay

`ClassSprite.tsx` hiển thị PNG 360×360 cho bốn class và hai giới tính. Gameplay 2.5D lại tạo texture từ `CharacterVisualAnatomy`; chế độ 3D lại tải file GLB và có fallback `ProceduralGreyboxCharacter`. Không có một asset ID/blueprint thống nhất bảo đảm portrait, sprite chiến đấu và 3D model là cùng một nhân vật.

Một số ví dụ trực tiếp:
- `fighter_male.png` là kiếm sĩ tóc vàng với đại kiếm xanh/đỏ.
- `tank_male.png` là kỵ sĩ giáp đen/đỏ, sừng lửa và khiên.
- `assassin_male.png` là sát thủ tóc cam cầm song đao.
- `gunner_male.png` là nhân vật pixel giản lược tóc bạc/kính cyan, khác rõ độ chi tiết so với fighter/tank.
- `fighter_female.png` đang hiển thị cùng art kỵ sĩ tank; `gunner_female.png` là hình pixel sơ lược. Các file PNG female assassin/tank cũng rất nhỏ (khoảng 2-3 KB) so với các portrait hoàn thiện hơn, cần kiểm tra trực quan từng ảnh.

### 5. Giới tính nhân vật không phải dữ liệu bền vững của nhân vật

`CharacterCreationModal.tsx` chọn gender nhưng chỉ lưu `character_gender_<id>` trong `localStorage` sau khi tạo. Schema `characters` và API creation chỉ có `name`, `classId` cùng chỉ số, không có gender/visual identity. `PlayerEntity25D` chỉ lấy `playerClassId` và gọi `getCharacterBlueprint(playerClassId)`; không thấy lấy gender để chọn anatomy/asset. Vì vậy:
- Chơi trên trình duyệt khác hoặc xóa localStorage có thể mất giới tính đã chọn.
- Cùng class không thể khôi phục chắc chắn đúng tạo hình theo character record.
- Portrait chọn trong UI không bảo đảm tạo hình trong gameplay giống lựa chọn đó.

### 6. Chế độ 3D chưa phải bộ nhân vật production đồng nhất

`RPGCharacterModel3D.tsx` tải `/assets/models/characters/${classId}.glb`, còn fallback là `ProceduralGreyboxCharacter`. File GLB quan sát được chỉ khoảng 3.3 KB, đáng nghi là model tối giản/placeholder và cần xác minh runtime. Animation mapping gộp phần lớn attack state về một clip `attack_slash`; các trạng thái jump/fall/hurt/attack2-4 chưa có mapping clip riêng ở component này. Không nên quảng bá chuyển 2.5D/3D là hai bộ nhân vật hoàn thiện ngang nhau trước khi review model thực tế.

### 7. Chuyển state animation có thể bắt đầu sai frame

`SpriteBillboard25D` cập nhật UV khi bộ đếm frame vượt ngưỡng, nhưng không reset `currentFrame` khi animation state đổi. State mới có thể bắt đầu từ giữa hàng thay vì frame 0. Bộ đếm cũng gán lại 0 và bỏ phần delta dư. Điều này làm chuyển đổi idle/run/attack có cảm giác giật hoặc sai nhịp, nhất là khi state đổi nhanh.

## Vì sao trải nghiệm hiện tại bị “tệ”

1. **Silhouette không nhận diện class:** nhiều sheet lặp hệt nhau, trong khi UI lại cho thấy artwork khác.
2. **Độ chi tiết không đồng đều:** fighter/tank art có pixel shading dày, gunner/assassin/generator giản lược.
3. **Scale/pivot/frame không cùng chuẩn:** ảnh tĩnh 360×360, atlas combat 64×64/frame, texture procedural 128×128/frame và model GLB là các pipeline khác nhau.
4. **Tạo hình không phản ánh lựa chọn người chơi:** gender chỉ ở localStorage và không đi xuyên suốt đến gameplay.
5. **Animation state không khớp atlas:** 5 hàng được render như 9; 3D lại gộp nhiều attack vào một clip.
6. **Tài sản có vẻ “production” nhưng thiếu kiểm soát:** tên file theo class/gender không bảo đảm nội dung đúng class/gender.

## Hướng tạo hình nên chốt

Đề xuất bản đầu chọn **2.5D pixel-art sprite làm phong cách gameplay duy nhất**. Đây là hướng khớp với billboard, chuẩn pixel-art nội bộ và các portrait tốt hiện có. Trong một thời gian, nên **ẩn/tắt phím V đổi sang 3D model** hoặc ghi rõ là experimental, thay vì cho người chơi thấy một nhánh greybox chưa hoàn thiện.

### Chuẩn production thống nhất
- Mỗi class có silhouette/vũ khí đặc trưng nhìn nhận ra ở kích thước nhỏ.
- Có art direction chung: cùng tỷ lệ nhân vật, góc 3/4, hướng sáng, outline, palette range, mật độ pixel, pivot/foot anchor, kích thước ô và shadow.
- Giới tính/appearance là dữ liệu thuộc character record (nếu sản phẩm thực sự cho chọn), không phải chỉ nằm trong localStorage.
- Portrait UI, sprite idle, combat sheet và thumbnail inventory đều tham chiếu chung `visualId`/manifest.
- Nếu không đủ thời gian làm 8 bộ (4 class × 2 gender), thu hẹp lựa chọn ở bản đầu hoặc làm một bộ neutral/skin chung có chất lượng, thay vì cho UI chọn các ảnh chưa đồng nhất.

## Kế hoạch cải thiện theo thứ tự

### P0 — Sửa đồng bộ kỹ thuật trước khi vẽ lại (1-3 ngày)
1. Chọn duy nhất contract atlas cho gameplay. Nếu theo chuẩn skill hiện tại: 8×9, 64×64/frame, 512×576; mọi sheet phải đúng dimensions.
2. Sửa `MultiLayerSpriteGenerator`: hoặc tạo đủ 9 hàng đúng thứ tự/state; hoặc không truyền nó vào `SpriteBillboard25D` 9 hàng. Không scale ngầm 5 hàng thành 9.
3. Thêm script validation asset: dimensions, cols/rows, alpha, frame bounds, pivot/foot baseline, file hash trùng nhau, manifest class/gender.
4. Sửa animator: reset frame/timer khi đổi state; attack/death có loop/one-shot policy; giữ delta dư; xác định FPS/animation events.
5. Thêm test UV cho mỗi row/col và render contact sheet preview.

### P1 — Tạo một “hero reference” production (1 tuần)
1. Chọn Fighter hoặc Tank làm vertical slice art, không bắt đầu cùng lúc cả tám biến thể.
2. Làm turnaround/style frame (front/3/4/side), palette, outline, silhouette, weapon, body proportions và pixel scale.
3. Tạo 9 hàng: Idle, Walk/Run, Jump/Fall, Attack1-4, Air attack, Death/Hurt theo luật gameplay thực tế.
4. Gắn hit event/hitbox timing riêng trong data; animation chỉ trình bày, không tự quyết định sát thương.
5. Review ở ba cỡ: portrait UI, gameplay camera thường, gameplay khi zoom xa.
6. Được duyệt xong mới dùng làm template cho 3 class còn lại.

### P2 — Đồng bộ identity qua app và backend (3-5 ngày)
1. Thêm `gender` hoặc `appearanceId/visualId` vào schema/API nếu lựa chọn đó là một phần sản phẩm.
2. Migration có default hợp lệ cho nhân vật cũ; không suy đoán giới tính từ tên/asset.
3. Tạo manifest tập trung: `classId`, `visualId`, portrait, combat sheet, frame metadata, palette, weaponType, animation map.
4. Màn hình chọn nhân vật và gameplay dùng cùng manifest, không khai báo file path riêng trong nhiều component.
5. Equip/skin thay đổi appearance qua visual layers hoặc skin variants đã định nghĩa; không cập nhật bằng màu tint thay cho trang bị nhìn thấy.

### P3 — Thay placeholder và tạo đủ roster (1-3 tuần tùy pipeline)
- Ưu tiên mỗi class có một nam/nữ (nếu giữ lựa chọn gender) với silhouette, tóc/helmet, vũ khí và màu chủ đạo khác nhau.
- Không chỉ hue-shift cùng sprite để tạo class khác.
- Không dùng cùng một combat sheet copy/rename; validation CI phải bắt hash trùng khi asset manifest khai báo khác nhau.
- Với boss/monster, cùng quy chuẩn về outline/pivot/animation contract nhưng có scale và palette riêng.

### P4 — Chất lượng/animation QA (2-4 ngày)
- Review loop idle/run, anticipations, active pose, follow-through, recovery.
- Kiểm tra foot sliding, jitter, weapon clipping, sprite flip làm đảo vũ khí/tay thuận, alpha fringe và aliasing.
- Chạy thử trên nền sáng/tối, desktop/mobile, DPR khác nhau.
- Nếu 3D mode chưa đạt parity, khóa khỏi build người chơi hoặc giữ như debug-only.

## Asset acceptance checklist

- [ ] PNG combat sheet đúng 512×576, 8×9 cell 64×64; mọi row mapping có tên trong manifest.
- [ ] Từng class có nội dung/hình ảnh riêng, không trùng hash ngoài chủ ý được ghi rõ.
- [ ] Mọi frame giữ cùng scale, foot anchor, bounding box hợp lý và không cắt vũ khí.
- [ ] Idle, run, jump/fall, attack1-4, air attack, hurt/death đúng thứ tự và loop policy.
- [ ] Sprite/player render dùng đúng cùng asset ID với portrait và character selection.
- [ ] Gender/appearance phục hồi từ server character record trên trình duyệt mới.
- [ ] Vũ khí/giáp của class nhận diện được; trang bị làm thay đổi hình tương ứng.
- [ ] Có fallback có chủ đích, không âm thầm rơi về hình debug/greybox.
- [ ] Chụp preview ở đúng camera scale và được duyệt mỹ thuật.

## Khuyến nghị hành động đầu tiên

**Sửa atlas 5-row/9-row mismatch và kiểm tra class/gender mapping trước**, vì đây là lỗi gây thấy sai animation ngay cả khi có asset tốt. Sau đó chốt một hero reference và tích hợp xuyên suốt character select → backend record → gameplay billboard. Chưa nên sinh lại hàng loạt nhân vật bằng generator hiện tại, vì chúng sẽ lặp cấu trúc đơn giản và không sửa được vấn đề identity.

## Mức độ chắc chắn

- **Đã xác minh bằng mã/hash/ảnh:** 5 hàng procedural so với 9 hàng renderer; combat sheets trùng SHA-256; localStorage lưu gender; player entity không đọc gender; một số portrait mismatch; nhiều nguồn render song song.
- **Cần xác minh runtime:** GLB có load/clip/appearance thực tế ra sao; chính xác tất cả ảnh female tank/assassin; mức độ giật animation theo thiết bị; camera scale đang dùng trong gameplay.
