package vn.chacademy.course.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.chacademy.common.dto.ApiResponse;
import vn.chacademy.course.dto.CourseCategoryDto;
import vn.chacademy.course.dto.CreateCategoryRequest;
import vn.chacademy.course.service.CourseCategoryService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/course-categories")
@RequiredArgsConstructor
public class CourseCategoryController {

    private final CourseCategoryService categoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CourseCategoryDto>>> getAllCategories() {
        List<CourseCategoryDto> list = categoryService.getAllCategories();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<CourseCategoryDto>>> getActiveCategories() {
        List<CourseCategoryDto> list = categoryService.getActiveCategories();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CourseCategoryDto>> getCategoryById(@PathVariable Long id) {
        CourseCategoryDto category = categoryService.getCategoryById(id);
        return ResponseEntity.ok(ApiResponse.success(category));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<CourseCategoryDto>> createCategory(@Valid @RequestBody CreateCategoryRequest request) {
        CourseCategoryDto created = categoryService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo danh mục khóa học thành công", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<CourseCategoryDto>> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CreateCategoryRequest request) {
        CourseCategoryDto updated = categoryService.updateCategory(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật danh mục khóa học thành công", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa danh mục khóa học thành công", null));
    }
}
