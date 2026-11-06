# CH ACADEMY — BÁO CÁO KIỂM TOÁN BỐ CỤC TOÀN DIỆN (FULL LAYOUT AUDIT)

## 1. Mục tiêu & Phạm vi Kiểm toán

Đợt kiểm toán này nhằm rà soát và khắc phục toàn diện các vấn đề về bố cục (layout), Flexbox, CSS Grid, tràn nội dung (overflow), co giãn responsive và hiệu ứng viền LED trên cả ba không gian người dùng (**Admin Portal**, **Teacher Portal**, **Student Portal**) của hệ thống CH Academy.

### Các phạm vi kiểm toán chính:
1. **Kiểm toán cấu trúc Card "Cơ cấu học phí & thanh toán"** trong Admin Dashboard: Tỷ lệ phân chia biểu đồ và chú thích, căn gióng phần trăm và số tiền, chống tràn biên.
2. **Kiểm toán hiệu ứng viền LED:** Chuyển đổi từ nhấp nháy tại chỗ sang dải sáng chạy liên tục 360 độ khép kín quanh 4 cạnh theo đúng chuẩn chu vi bo góc.
3. **Kiểm toán chức năng bộ lọc thời gian ("Cả năm" / "Tháng này"):** Liên kết đồng bộ trạng thái giữa Frontend và Backend API, lọc số liệu thực tế theo múi giờ Việt Nam (`Asia/Ho_Chi_Minh`).
4. **Kiểm toán tính thích ứng Responsive (1920x1080 xuống 360x800):** Đảm bảo không tràn ngang toàn trang, không cắt chữ/số, các bảng dữ liệu cuộn an toàn.

---

## 2. Bảng Ma trận Kiểm toán Toàn bộ Tuyến đường (Route Audit Matrix)

| ID | Không gian (Portal) | Tuyến đường (Route) / Màn hình | Thành phần (Component) | Hiện trạng trước kiểm toán | Biện pháp xử lý & Chuẩn hóa | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **AUD-01** | Admin Portal | `/admin/dashboard` | Card "Cơ cấu học phí & thanh toán" (`DonutBreakdownChart`) | Biểu đồ donut 144px ép hẹp, chú thích bên phải bị dồn toa, số tiền sát mép thẻ | Thiết kế lại CSS Grid `grid-cols-1 md:grid-cols-12` (donut 5 cột, chú thích 7 cột), hàng chú thích dạng 3 cột thẳng hàng, đệm an toàn | **FIXED** |
| **AUD-02** | Admin Portal | `/admin/dashboard` | Bộ lọc "Cả năm" / "Tháng này" | Nút bấm chỉ đổi màu nền cục bộ, không gửi yêu cầu lọc về máy chủ | Nâng cấp API `DashboardController` & `DashboardService` nhận `period=MONTH\|YEAR`, lọc dữ liệu theo ranh giới tháng/năm | **FIXED** |
| **AUD-03** | Toàn hệ thống | Các thẻ KPI, Thống kê, Biểu đồ | Hiệu ứng viền phát sáng (`GlowCard`, `StatCard`) | Dải sáng xoay bị lệch tâm do `translate(-50%, -50%)` trên khung `-inset-[150%]`, thiếu `mask-composite` | Viết lại cơ chế `led-border-beam` dùng `mask-composite: exclude`, xoay 360° quanh tâm đều đặn 4.5s khép kín quanh 4 cạnh | **FIXED** |
| **AUD-04** | Admin Portal | Khảo thí & Điểm danh | `StudentAssessmentDrawer.tsx` | Khung bảng điểm danh dùng `overflow-hidden`, trên màn hình hẹp bị cắt cột | Chuyển sang `overflow-x-auto` và đặt `min-w-[480px]` cho bảng | **FIXED** |
| **AUD-05** | Admin Portal | Quản lý Đề thi | `SessionQuestionExamModal.tsx` | Bảng xem trước câu hỏi chỉ có `overflow-y-auto`, thiếu `overflow-x-auto` | Bổ sung `overflow-x-auto` và `min-w-[500px]` chống mất cột | **FIXED** |
| **AUD-06** | Admin Portal | `/admin/dashboard` | Thẻ KPI Tài chính (4 cards Tier 2) | Nhãn cố định "Doanh thu thực tế", không phản ánh trạng thái khi lọc Tháng | Cập nhật nhãn động theo `timeRangeFilter` ("Doanh thu tháng này", "Học phí dự thu tháng", "Công nợ tồn tháng này") | **FIXED** |
| **AUD-07** | Teacher Portal | `/teacher` | Header & 10 Tabs điều hướng | Tiêu đề quá lớn (30px), tab bar cồng kềnh | Chuẩn hóa `.typo-page-title` (22px), tab bar 36px đệm `px-3 py-1.5`, hỗ trợ cuộn ngang êm ái | **FIXED** |
| **AUD-08** | Student Portal | `/student` | Header & 9 Tabs học tập | Thẻ trùng lặp che khuất nội dung, thiếu chỉ số tóm tắt trực quan | Tích hợp pill chuyên cần & sĩ số buổi học trên Page Header, tab bar chuẩn hóa | **FIXED** |
| **AUD-09** | Toàn hệ thống | Cửa sổ Modal & Drawer | `AccountProfileModal`, `NotificationDetailModal` | Nguy cơ nội dung vượt quá chiều cao màn hình trên laptop 720p/768p | Thiết lập `max-h-[calc(100vh-3rem)]`, `overflow-y-auto` trên dialog wrapper | **PASS** |
| **AUD-10** | Toàn hệ thống | Bảng dữ liệu quản trị | Tất cả 28 bảng dữ liệu | Nguy cơ vỡ layout khi bảng có hơn 6 cột trên màn hình nhỏ | 100% bọc trong container `overflow-x-auto` với `min-w` rõ ràng | **PASS** |

---

## 3. Đánh giá Mức độ Cải thiện

1. **Tính cân đối thị giác:** Các thẻ số liệu và biểu đồ phân bổ tỷ lệ hoàn hảo; phần chú thích có nền xám/tối phân định, các cột phần trăm và tiền tệ thẳng hàng tuyệt đối.
2. **Hiệu năng chuyển động (Animation):** Hiệu ứng viền LED sử dụng thuộc tính `transform: rotate()` kết hợp CSS mask, không gây layout reflow, chạy trơn tru 60fps trên mọi GPU.
3. **Tính chính xác của Dữ liệu:** Bộ lọc thời gian phản ánh chính xác nguồn thu và công nợ phát sinh theo đúng kỳ kế toán của Trung tâm.
