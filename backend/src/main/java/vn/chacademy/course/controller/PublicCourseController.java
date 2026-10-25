package vn.chacademy.course.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.chacademy.common.dto.ApiResponse;
import vn.chacademy.course.dto.CourseCategoryDto;
import vn.chacademy.course.dto.CourseDto;
import vn.chacademy.course.service.CourseCategoryService;
import vn.chacademy.course.service.CourseService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/public/courses")
@RequiredArgsConstructor
public class PublicCourseController {

    private final CourseService courseService;
    private final CourseCategoryService categoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<CourseDto>>> searchPublicCourses(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String targetAudience,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "9") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<CourseDto> result = courseService.searchPublicCourses(keyword, categoryId, targetAudience, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/featured")
    public ResponseEntity<ApiResponse<List<CourseDto>>> getFeaturedCourses() {
        List<CourseDto> list = courseService.getFeaturedCourses();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CourseDto>> getPublicCourseDetail(@PathVariable Long id) {
        CourseDto course = courseService.getCourseById(id);
        if (!Boolean.TRUE.equals(course.getIsPublic()) || !"ACTIVE".equals(course.getStatus())) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(ApiResponse.success(course));
    }

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<CourseCategoryDto>>> getPublicCategories() {
        List<CourseCategoryDto> list = categoryService.getActiveCategories();
        return ResponseEntity.ok(ApiResponse.success(list));
    }
}
