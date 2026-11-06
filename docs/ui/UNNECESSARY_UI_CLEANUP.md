# CH ACADEMY — THANH LỌC CÁC THÀNH PHẦN TRANG TRÍ THỪA (UI CLEANUP REPORT)

## 1. Tôn chỉ: Loại bỏ Cảm giác AI-Generated & Crypto Landing Page

Trong các phiên bản phát triển trước đây, giao diện bị lạm dụng nhiều hiệu ứng trang trí đồ họa không phục vụ trực tiếp cho thao tác nghiệp vụ sư phạm:
- Quả cầu xoay 3D (`CyberOrb3D`) dùng Canvas WebGL chạy liên tục ở đầu trang Quản trị, Giảng viên và Học viên.
- Các vầng sáng khổng lồ (`AmbientGlow`) với blur 64px - 96px lan tỏa khắp màn hình, gây phân tâm và làm giảm độ sắc nét của bảng biểu.
- Các hàng thẻ nghiêng 3D (`Tilt3DCard`) nằm ngay phía trên thanh tab điều hướng, lặp lại các chỉ số mà chính tab Tổng quan bên dưới đã có.
- Các từ ngữ marketing cường điệu ("Hệ thống sẵn sàng", "Không gian sư phạm chuyên nghiệp", "Cockpit", "AI Cyber Center").

---

## 2. Danh mục các Thành phần Đã Được Thanh lọc

### 2.1. Quả cầu 3D (`CyberOrb3D`) & Vầng sáng Mờ (`AmbientGlow`)
- **Tại `DashboardPage.tsx` (Admin Portal):**
  - *Trước:* Quả cầu 3D kích thước 68px xoay liên tục bên cạnh lời chào Quản trị viên, tiêu tốn tài nguyên GPU máy người dùng.
  - *Sau:* Thay thế bằng biểu tượng hộp công cụ điều hành (`LayoutDashboard`, 22px) đặt trong khung gradient thương hiệu CH Academy sắc nét (44x44px), chuyên nghiệp và tĩnh tại.
- **Tại `TeacherPortalPage.tsx` (Teacher Portal):**
  - *Trước:* Banner chào đón dạng khối hộp 3D tối màu kèm `CyberOrb3D` 72px và 2 quầng sáng `AmbientGlow` (cyan và primary) chiếm 160px chiều cao.
  - *Sau:* Loại bỏ hoàn toàn quả cầu và glow; chuyển sang Page Header phẳng tinh gọn (chiều cao chỉ 52px), làm nổi bật họ tên Thầy/Cô, mã giảng viên và chuyên môn đào tạo.
- **Tại `StudentPortalPage.tsx` (Student Portal):**
  - *Trước:* Banner tối màu kèm `CyberOrb3D` 88px và vầng sáng `AmbientGlow` 72px.
  - *Sau:* Loại bỏ hoàn toàn quả cầu 3D; thay bằng tiêu đề chuẩn hóa với mã học viên, tỷ lệ chuyên cần và nút vào lịch học nhanh.

### 2.2. Khối 4 Thẻ Trùng lặp Nằm Trên Thanh Tab (Redundant 4-Cards Grid)
- **Tại Teacher Portal:**
  - *Trước:* Trước thanh tab là 4 thẻ `Tilt3DCard` (Lớp phụ trách, Học sinh, Chưa điểm danh, Thông báo gửi) chiếm thêm 120px chiều cao.
  - *Sau:* Lược bỏ khối 4 thẻ này vì tab con "Tổng quan" (`activeTab === 'dashboard'`) đã có đầy đủ bảng điều khiển chi tiết. Người dùng khi chọn các tab khác (ví dụ Lớp dạy, Điểm danh, Soạn đề) không còn bị khối thẻ này che khuất tầm mắt.
- **Tại Student Portal:**
  - *Trước:* 4 thẻ `Tilt3DCard` (Chuyên cần, Khóa học, Bài kiểm tra, Học phí) nằm chèn giữa banner và tab bar.
  - *Sau:* Lược bỏ khối 4 thẻ trùng lặp. Các thông tin tóm tắt cốt lõi (Chuyên cần %, Sĩ số buổi tham gia) được tích hợp khéo léo vào một pill nhỏ gọn ngay trên Page Header.

---

## 3. Thống kê Chiều cao Tiết kiệm & Tăng Mật độ Thông tin

```
+-------------------------------------------------------------+
| TRƯỚC THANH LỌC (Trước: ~500px chiều dọc bị chiếm dụng)     |
| [Top Banner 3D + CyberOrb + AmbientGlow] (180px)            |
| [4 Thẻ Tilt3DCard trùng lặp số liệu]     (120px)            |
| [Tab Navigation cồng kềnh]               (64px)             |
| ====> Nội dung thực tế chỉ xuất hiện sau khi cuộn chuột!   |
+-------------------------------------------------------------+

+-------------------------------------------------------------+
| SAU THANH LỌC (Sau: Chỉ 110px cho Header + Tab Navigation)   |
| [SaaS Enterprise Header phẳng, tinh gọn]  (48px)            |
| [Tab Navigation chuẩn hóa, độ cao 36px]   (44px)            |
| ====> Bảng dữ liệu, lịch dạy và đồ thị hiển thị NGAY LẬP TỨC|
|       trên màn hình laptop 1366x768 mà KHÔNG CẦN CUỘN!      |
+-------------------------------------------------------------+
```

### Kết quả định lượng:
- **Tiết kiệm chiều cao màn hình:** Giảm hơn **320px** khoảng trống chết trên màn hình chính của Giảng viên và Học viên.
- **Hiệu năng dựng hình (Render Performance):** Giảm tải 3 WebGL render loops liên tục, giúp laptop tiết kiệm pin và quạt tản nhiệt không bị kích hoạt khi duyệt bảng điều khiển.
- **Thẩm mỹ:** Đạt được phong thái điềm tĩnh, chuẩn mực của một nền tảng SaaS giáo dục hàng đầu.
