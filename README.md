<div align="center">

  <img src="header-banner.png" alt="Chiến Long Bí Sử — Realm of Legends Banner" width="100%" />

  <br/><br/>

  <!-- Dynamic Shields / Badges -->
  <a href="#-kho-mã-nguồn-phát-triển-source-code">
    <img src="https://img.shields.io/badge/BRANCH%20STATE-MAIN%20%7C%20SHOWCASE%20ONLY-ff0055?style=for-the-badge&logo=git&logoColor=white" alt="Branch State" />
  </a>
  <a href="#-lệnh-lấy-toàn-bộ-mã-nguồn-để-phát-triển">
    <img src="https://img.shields.io/badge/FULL%20SOURCE%20CODE-Nh%C3%A1nh%20master-00f2ff?style=for-the-badge&logo=github&logoColor=black" alt="Code on Master" />
  </a>
  <img src="https://img.shields.io/badge/GRAPHICS-Three.js%20%2B%20Fiber%202.5D-7928ca?style=for-the-badge&logo=three.js&logoColor=white" alt="Three.js" />
  <img src="https://img.shields.io/badge/DEPLOY-Docker%20%2B%20Vercel%20Ready-00dfd8?style=for-the-badge&logo=docker&logoColor=black" alt="Docker & Vercel" />

  <br/><br/>

  <p align="center">
    <b>⚔️ Thế giới 2.5D Real-Time Action MMORPG đỉnh cao kết hợp chiều sâu Dark Fantasy, hệ thống 4 Class, săn Boss thời gian thực và chiến trường PvP hoang dã.</b>
  </p>

</div>

---

### 🚨 QUAN TRỌNG: KHO MÃ NGUỒN PHÁT TRIỂN (SOURCE CODE)

> [!IMPORTANT]
> **Nhánh `main` này được thiết lập làm TRANG BÌA GIỚI THIỆU (LANDING SHOWCASE)**, được giữ **HOÀN TOÀN RỖNG MÃ NGUỒN (No Code in Main)** để trang chủ repo luôn sinh động, sạch đẹp và chuyên nghiệp!
> 
> 📦 **Toàn bộ 100% mã nguồn game, Server, Three.js 2.5D Engine, Docker, AI Sprite Pipeline, Database Schema... đều nằm tại nhánh [`master`](#-lệnh-lấy-toàn-bộ-mã-nguồn-để-phát-triển).**

---

### 💻 Lệnh Lấy Toàn Bộ Mã Nguồn Để Phát Triển

Chạy lệnh sau trong Terminal để chuyển ngay sang nhánh chứa mã nguồn:

```bash
# Chuyển sang nhánh master để xem và code:
git checkout master

# Hoặc nếu vừa clone repo về máy:
git clone -b master <URL_REPO_CỦA_BẠN>
```

---

## 🌟 TÍNH NĂNG ĐỘC BẢN CỦA DỰ ÁN

<table align="center" width="100%">
  <tr>
    <td width="50%" valign="top">
      <h3>🎮 1. Không Gian 3D Thời Gian Thực</h3>
      <ul>
        <li><b>Làng Long Tộc & Đấu Trường Hoang Dã</b> dựng bằng Three.js / React Three Fiber.</li>
        <li>Di chuyển tự do 8 hướng, xoay Camera 360°, Nhảy né chiêu.</li>
        <li>Hỗ trợ cả <b>Bàn phím/Chuột PC</b> lẫn <b>Virtual Joystick Cảm ứng Mobile</b>.</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h3>⚡ 2. Cơ Chế Chiến Đấu Đa Dạng</h3>
      <ul>
        <li>Combo chém kiếm cận chiến + bắn đạn ma thuật/súng tầm xa.</li>
        <li>Hệ thống <b>Phó bản Săn Boss (Dungeon Raids)</b> kịch tính.</li>
        <li>Trang bị, nâng cấp chỉ số (ATK, DEF, SPD, HP) lưu realtime vào Database.</li>
      </ul>
    </td>
  </tr>
</table>

---

## 🛡️ 4 ĐẠI HỆ PHÁI HUYỀN THOẠI (CLASSES)

| Hệ Phái | Vũ Khí & Phong Cách | Đặc Điểm Chiến Đấu |
| :--- | :--- | :--- |
| 🎯 **Xạ Thủ (Tech Gunner)** | Súng Năng Lượng Kép & Đại Bác Cyber | Tấn công tầm xa, đạn chùm, thả lựu đạn gây choáng diện rộng |
| 🗡️ **Sát Thủ (Shadow Assassin)** | Song Đao Bóng Tối | Tốc độ chớp nhoáng, lướt xuyên mục tiêu, tỷ lệ bạo kích cực cao |
| 🥊 **Đấu Sĩ (Berserk Fighter)** | Quyền Cước Nộ Long | Sát thương cận chiến vũ bão, càng thấp máu sát thương càng tăng |
| 🛡️ **Đỡ Đòn (Holy Guardian)** | Khiên Thánh & Trọng Búa | Giáp thép bất tử, tạo khiên chắn đồng minh, dậm đất khống chế |

---

## 🚀 CÁCH KHỞI ĐỘNG NHANH DỰ ÁN (Sau khi sang nhánh `master`)

```bash
# 1. Chuyển sang nhánh master
git checkout master

# 2. Khởi chạy tức thì bằng Docker Compose (Khuyên dùng)
docker compose up --build
# 🌐 Truy cập ngay: http://localhost:8080

# 3. Hoặc chạy độc lập qua pnpm
pnpm install
pnpm run build:server
pnpm run build:game
pnpm run start
```

---

<div align="center">
  <sub>Chiến Long Bí Sử &copy; 2026 — Kiến tạo trải nghiệm 2.5D MMORPG thế hệ mới.</sub>
</div>
