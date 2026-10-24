package vn.chacademy.course.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.chacademy.common.exception.BadRequestException;
import vn.chacademy.common.exception.ResourceNotFoundException;
import vn.chacademy.course.dto.CourseCategoryDto;
import vn.chacademy.course.dto.CreateCategoryRequest;
import vn.chacademy.course.entity.CourseCategory;
import vn.chacademy.course.repository.CourseCategoryRepository;
import vn.chacademy.course.repository.CourseRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseCategoryService {

    private final CourseCategoryRepository categoryRepository;
    private final CourseRepository courseRepository;

    @Transactional(readOnly = true)
    public List<CourseCategoryDto> getAllCategories() {
        return categoryRepository.findAllByOrderByDisplayOrderAsc().stream()
                .map(cat -> CourseCategoryDto.fromEntity(cat, courseRepository.countByCategoryId(cat.getId())))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CourseCategoryDto> getActiveCategories() {
        return categoryRepository.findByIsActiveTrueOrderByDisplayOrderAsc().stream()
                .map(cat -> CourseCategoryDto.fromEntity(cat, courseRepository.countByCategoryId(cat.getId())))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CourseCategoryDto getCategoryById(Long id) {
        CourseCategory cat = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục khóa học với ID: " + id));
        return CourseCategoryDto.fromEntity(cat, courseRepository.countByCategoryId(cat.getId()));
    }

    @Transactional
    public CourseCategoryDto createCategory(CreateCategoryRequest request) {
        if (categoryRepository.existsByCode(request.getCode().trim().toUpperCase())) {
            throw new BadRequestException("Mã danh mục '" + request.getCode() + "' đã tồn tại trên hệ thống");
        }

        CourseCategory category = CourseCategory.builder()
                .code(request.getCode().trim().toUpperCase())
                .name(request.getName().trim())
                .description(request.getDescription())
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        CourseCategory saved = categoryRepository.save(category);
        return CourseCategoryDto.fromEntity(saved, 0L);
    }

    @Transactional
    public CourseCategoryDto updateCategory(Long id, CreateCategoryRequest request) {
        CourseCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với ID: " + id));

        String newCode = request.getCode().trim().toUpperCase();
        if (!category.getCode().equalsIgnoreCase(newCode) && categoryRepository.existsByCode(newCode)) {
            throw new BadRequestException("Mã danh mục '" + newCode + "' đã tồn tại trên hệ thống");
        }

        category.setCode(newCode);
        category.setName(request.getName().trim());
        category.setDescription(request.getDescription());
        if (request.getDisplayOrder() != null) {
            category.setDisplayOrder(request.getDisplayOrder());
        }
        if (request.getIsActive() != null) {
            category.setIsActive(request.getIsActive());
        }

        CourseCategory updated = categoryRepository.save(category);
        return CourseCategoryDto.fromEntity(updated, courseRepository.countByCategoryId(updated.getId()));
    }

    @Transactional
    public void deleteCategory(Long id) {
        CourseCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với ID: " + id));

        long attachedCourses = courseRepository.countByCategoryId(id);
        if (attachedCourses > 0) {
            throw new BadRequestException("Không thể xóa danh mục đang có " + attachedCourses + " khóa học liên kết. Vui lòng chuyển hoặc vô hiệu hóa các khóa học trước.");
        }

        categoryRepository.delete(category);
    }
}
