# CH ACADEMY — HỆ THỐNG AN NINH THÔNG TIN TOÀN DIỆN
## Tài liệu 05: Kiểm soát Cấp Đối tượng và Phòng chống IDOR/BOLA (Anti-IDOR Security)

---

## 1. NGUY CƠ IDOR / BOLA (BROKEN OBJECT LEVEL AUTHORIZATION)

Trong các hệ thống giáo dục trực tuyến, lỗ hổng IDOR xảy ra khi:
- Người dùng thay đổi tham số `studentId` hoặc `requestId` trên URL/Body (VD: `GET /api/v1/student/enrollment-requests/999` hoặc `DELETE /api/v1/student/enrollment-requests/1000`).
- Nếu Backend chỉ kiểm tra người dùng "có đăng nhập" mà không kiểm tra "đối tượng này có thuộc quyền sở hữu của người dùng đang đăng nhập hay không", kẻ xấu có thể đọc trộm thông tin cá nhân hoặc hủy đơn của người khác.

---

## 2. NGUYÊN TẮC THIẾT KẾ PHÒNG CHỐNG TRIỆT ĐỂ TẠI CH ACADEMY

### 2.1. Không tin tưởng định danh từ Client (Never Trust Client Identity)
- Trên toàn bộ các endpoint của Cổng Học viên (`/api/v1/student/**`) và Cổng Giảng viên (`/api/v1/teacher/**`), tham số `studentId` hoặc `teacherId` bị loại bỏ hoàn toàn khỏi Request.
- Định danh luôn được trích xuất an toàn từ Security Context:
```java
String username = SecurityContextHolder.getContext().getAuthentication().getName();
User user = userRepository.findByUsername(username)
    .orElseThrow(() -> new UnauthorizedException("Người dùng chưa được xác thực"));
```

### 2.2. Kiểm tra quyền sở hữu đối tượng trước khi xử lý (Pre-execution Ownership Check)
Ví dụ trong quy trình hủy đơn đăng ký khóa học (`StudentEnrollmentController.java`):
```java
@DeleteMapping("/enrollment-requests/{id}")
public ResponseEntity<ApiResponse<Void>> cancelRequest(@PathVariable Long id) {
    Long userId = SecurityUtils.getCurrentUserId();
    enrollmentRequestService.cancelRequest(id, userId);
    return ResponseEntity.ok(ApiResponse.success("Hủy yêu cầu thành công", null));
}
```
Và trong tầng dịch vụ (`EnrollmentRequestService.java`):
```java
EnrollmentRequest request = enrollmentRequestRepository.findById(id)
    .orElseThrow(() -> new ResourceNotFoundException("Đơn đăng ký không tồn tại"));

if (!request.getStudent().getUser().getId().equals(userId)) {
    // Ghi nhận cảnh báo an ninh IDOR vào Security Center
    securityCenterService.recordSecurityAlert(
        "SUSPICIOUS_ACTIVITY", 
        "Cảnh báo IDOR: Người dùng ID " + userId + " cố tình can thiệp vào đơn đăng ký ID " + id,
        "HIGH"
    );
    throw new AccessDeniedException("Bạn không có quyền thao tác trên đơn đăng ký này");
}
```
Khi hành vi can thiệp trái phép bị phát hiện:
1. Yêu cầu bị chặn đứng với mã lỗi `403 Forbidden`.
2. Hệ thống tự động kích hoạt tạo `SecurityAlert` mức độ `HIGH` gửi về Trung tâm An ninh Quản trị để theo dõi.
