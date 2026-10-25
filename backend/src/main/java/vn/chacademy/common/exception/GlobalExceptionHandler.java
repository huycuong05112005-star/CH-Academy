package vn.chacademy.common.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import vn.chacademy.common.dto.ApiResponse;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<Void>> handleAppException(AppException ex) {
        log.warn("Ngoại lệ nghiệp vụ: {} [code: {}]", ex.getMessage(), ex.getErrorCode());
        ApiResponse<Void> response = ApiResponse.error(ex.getMessage(), ex.getErrorCode());
        return ResponseEntity.status(ex.getStatus()).body(response);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationException(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            errors.put(error.getField(), error.getDefaultMessage());
        }
        log.warn("Lỗi xác thực dữ liệu đầu vào: {}", errors);
        ApiResponse<Void> response = ApiResponse.error("Dữ liệu đầu vào không hợp lệ", "VALIDATION_FAILED", errors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadCredentials(BadCredentialsException ex) {
        log.warn("Đăng nhập thất bại: thông tin xác thực không chính xác");
        ApiResponse<Void> response = ApiResponse.error("Tên đăng nhập hoặc mật khẩu không chính xác", "BAD_CREDENTIALS");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(AccessDeniedException ex) {
        log.warn("Từ chối truy cập: {}", ex.getMessage());
        ApiResponse<Void> response = ApiResponse.error("Bạn không có quyền thực hiện thao tác này", "FORBIDDEN");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNoResourceFound(org.springframework.web.servlet.resource.NoResourceFoundException ex) {
        log.warn("Tài nguyên không tìm thấy: {}", ex.getResourcePath());
        ApiResponse<Void> response = ApiResponse.error("Đường dẫn hoặc tài nguyên không tồn tại", "NOT_FOUND");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGenericException(Exception ex) {
        log.error("Lỗi hệ thống chưa được phân loại: ", ex);
        ApiResponse<Void> response = ApiResponse.error("Đã xảy ra lỗi trên máy chủ. Vui lòng thử lại sau.", "INTERNAL_SERVER_ERROR");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
