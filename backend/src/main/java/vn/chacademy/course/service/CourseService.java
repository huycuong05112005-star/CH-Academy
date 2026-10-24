package vn.chacademy.course.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.chacademy.common.exception.BadRequestException;
import vn.chacademy.common.exception.ResourceNotFoundException;
import vn.chacademy.course.dto.CourseDto;
import vn.chacademy.course.dto.CreateCourseRequest;
import vn.chacademy.course.dto.UpdateCourseRequest;
import vn.chacademy.course.entity.Course;
import vn.chacademy.course.entity.CourseCategory;
import vn.chacademy.course.repository.CourseCategoryRepository;
import vn.chacademy.course.repository.CourseRepository;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final CourseCategoryRepository categoryRepository;

    private static final Set<String> VALID_STATUSES = Set.of("DRAFT", "ACTIVE", "SUSPENDED", "ARCHIVED");
    private static final Set<String> VALID_AUDIENCES = Set.of("KIDS", "TEENS", "ADULTS", "ALL");
    private static final Set<String> VALID_LEVELS = Set.of("BEGINNER", "INTERMEDIATE", "ADVANCED", "ALL_LEVELS");

    @Transactional(readOnly = true)
    public Page<CourseDto> searchCourses(String keyword, Long categoryId, String targetAudience, String status, Pageable pageable) {
        String cleanKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        String cleanAudience = (targetAudience != null && !targetAudience.trim().isEmpty()) ? targetAudience.trim().toUpperCase() : null;
        String cleanStatus = (status != null && !status.trim().isEmpty()) ? status.trim().toUpperCase() : null;

        return courseRepository.searchCourses(cleanKeyword, categoryId, cleanAudience, cleanStatus, pageable)
                .map(CourseDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public CourseDto getCourseById(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khóa học với ID: " + id));
        return CourseDto.fromEntity(course);
    }

    @Transactional(readOnly = true)
    public CourseDto getCourseByCode(String code) {
        Course course = courseRepository.findByCode(code.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khóa học với mã: " + code));
        return CourseDto.fromEntity(course);
    }

    @Transactional
    public CourseDto createCourse(CreateCourseRequest request) {
        String cleanCode = request.getCode().trim().toUpperCase();
        if (courseRepository.existsByCode(cleanCode)) {
            throw new BadRequestException("Mã khóa học '" + cleanCode + "' đã tồn tại trên hệ thống");
        }

        CourseCategory category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new BadRequestException("Danh mục khóa học không tồn tại với ID: " + request.getCategoryId()));

        String audience = request.getTargetAudience().trim().toUpperCase();
        if (!VALID_AUDIENCES.contains(audience)) {
            throw new BadRequestException("Đối tượng học viên không hợp lệ. Cho phép: " + VALID_AUDIENCES);
        }

        String level = request.getLevel().trim().toUpperCase();
        if (!VALID_LEVELS.contains(level)) {
            throw new BadRequestException("Trình độ khóa học không hợp lệ. Cho phép: " + VALID_LEVELS);
        }

        String status = request.getStatus() != null ? request.getStatus().trim().toUpperCase() : "ACTIVE";
        if (!VALID_STATUSES.contains(status)) {
            throw new BadRequestException("Trạng thái khóa học không hợp lệ. Cho phép: " + VALID_STATUSES);
        }

        Course course = Course.builder()
                .category(category)
                .code(cleanCode)
                .name(request.getName().trim())
                .description(request.getDescription())
                .targetAudience(audience)
                .level(level)
                .durationHours(request.getDurationHours())
                .defaultTuitionFee(request.getDefaultTuitionFee())
                .learningOutcomes(request.getLearningOutcomes())
                .maxStudents(request.getMaxStudents())
                .status(status)
                .isPublic(request.getIsPublic() != null ? request.getIsPublic() : true)
                .build();

        Course saved = courseRepository.save(course);
        return CourseDto.fromEntity(saved);
    }

    @Transactional
    public CourseDto updateCourse(Long id, UpdateCourseRequest request) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khóa học với ID: " + id));

        String cleanCode = request.getCode().trim().toUpperCase();
        if (!course.getCode().equalsIgnoreCase(cleanCode) && courseRepository.existsByCode(cleanCode)) {
            throw new BadRequestException("Mã khóa học '" + cleanCode + "' đã tồn tại trên hệ thống");
        }

        CourseCategory category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new BadRequestException("Danh mục khóa học không tồn tại với ID: " + request.getCategoryId()));

        String audience = request.getTargetAudience().trim().toUpperCase();
        if (!VALID_AUDIENCES.contains(audience)) {
            throw new BadRequestException("Đối tượng học viên không hợp lệ. Cho phép: " + VALID_AUDIENCES);
        }

        String level = request.getLevel().trim().toUpperCase();
        if (!VALID_LEVELS.contains(level)) {
            throw new BadRequestException("Trình độ khóa học không hợp lệ. Cho phép: " + VALID_LEVELS);
        }

        String status = request.getStatus().trim().toUpperCase();
        if (!VALID_STATUSES.contains(status)) {
            throw new BadRequestException("Trạng thái khóa học không hợp lệ. Cho phép: " + VALID_STATUSES);
        }

        course.setCategory(category);
        course.setCode(cleanCode);
        course.setName(request.getName().trim());
        course.setDescription(request.getDescription());
        course.setTargetAudience(audience);
        course.setLevel(level);
        course.setDurationHours(request.getDurationHours());
        course.setDefaultTuitionFee(request.getDefaultTuitionFee());
        course.setLearningOutcomes(request.getLearningOutcomes());
        course.setMaxStudents(request.getMaxStudents());
        course.setStatus(status);
        course.setIsPublic(request.getIsPublic());

        Course updated = courseRepository.save(course);
        return CourseDto.fromEntity(updated);
    }

    @Transactional
    public CourseDto updateCourseStatus(Long id, String status) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khóa học với ID: " + id));

        String cleanStatus = status.trim().toUpperCase();
        if (!VALID_STATUSES.contains(cleanStatus)) {
            throw new BadRequestException("Trạng thái không hợp lệ: " + status + ". Cho phép: " + VALID_STATUSES);
        }

        course.setStatus(cleanStatus);
        Course updated = courseRepository.save(course);
        return CourseDto.fromEntity(updated);
    }

    @Transactional
    public void deleteCourse(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khóa học với ID: " + id));

        // Soft delete / archive if there is historical data or set status ARCHIVED
        course.setStatus("ARCHIVED");
        course.setIsPublic(false);
        courseRepository.save(course);
    }

    // Public website endpoints
    @Transactional(readOnly = true)
    public Page<CourseDto> searchPublicCourses(String keyword, Long categoryId, String targetAudience, Pageable pageable) {
        String cleanKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        String cleanAudience = (targetAudience != null && !targetAudience.trim().isEmpty()) ? targetAudience.trim().toUpperCase() : null;

        return courseRepository.searchPublicCourses(cleanKeyword, categoryId, cleanAudience, pageable)
                .map(CourseDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<CourseDto> getFeaturedCourses() {
        return courseRepository.findTop6ByIsPublicTrueAndStatusOrderByCreatedAtDesc("ACTIVE").stream()
                .map(CourseDto::fromEntity)
                .collect(Collectors.toList());
    }
}
