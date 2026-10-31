/**
 * Utility đồng bộ chọn lớp học giữa giao diện người dùng và Widget Chat nhóm lớp.
 * Khi người dùng bấm vào một khóa học / lớp học ở trang Quản trị, Giảng viên hoặc Học viên,
 * hàm này sẽ kích hoạt sự kiện để khung chat tự động chuyển sang nhóm lớp tương ứng.
 */
export const selectClassChat = (
  classId: number,
  options?: { courseId?: number; className?: string; courseName?: string }
) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('ch_academy_select_class_chat', {
        detail: {
          classId,
          ...options
        }
      })
    )
  }
}
