package vn.chacademy.student.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.chacademy.common.exception.BadRequestException;
import vn.chacademy.common.exception.ResourceNotFoundException;
import vn.chacademy.student.dto.CreateStudentRequest;
import vn.chacademy.student.dto.StudentDto;
import vn.chacademy.student.dto.UpdateStudentRequest;
import vn.chacademy.student.entity.Guardian;
import vn.chacademy.student.entity.Student;
import vn.chacademy.student.entity.StudentGuardian;
import vn.chacademy.student.entity.StudentGuardianId;
import vn.chacademy.student.repository.GuardianRepository;
import vn.chacademy.student.repository.StudentGuardianRepository;
import vn.chacademy.student.repository.StudentRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;
    private final GuardianRepository guardianRepository;
    private final StudentGuardianRepository studentGuardianRepository;

    private static final Set<String> VALID_STATUSES = Set.of("ACTIVE", "INACTIVE", "GRADUATED", "DROPPED");
    private static final Set<String> VALID_TARGET_TYPES = Set.of("KID", "ADULT");
    private static final Set<String> VALID_GENDERS = Set.of("MALE", "FEMALE", "OTHER");

    @Transactional(readOnly = true)
    public Page<StudentDto> searchStudents(String keyword, String status, String targetType, Pageable pageable) {
        String cleanKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        String cleanStatus = (status != null && !status.trim().isEmpty()) ? status.trim().toUpperCase() : null;
        String cleanTargetType = (targetType != null && !targetType.trim().isEmpty()) ? targetType.trim().toUpperCase() : null;

        return studentRepository.searchStudents(cleanKeyword, cleanStatus, cleanTargetType, pageable)
                .map(StudentDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public StudentDto getStudentById(Long id) {
        Student s = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học viên với ID: " + id));
        return StudentDto.fromEntity(s);
    }

    @Transactional(readOnly = true)
    public StudentDto getStudentByCode(String code) {
        Student s = studentRepository.findByStudentCode(code.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học viên với mã: " + code));
        return StudentDto.fromEntity(s);
    }

    @Transactional
    public StudentDto createStudent(CreateStudentRequest request) {
        String cleanCode = request.getStudentCode().trim().toUpperCase();
        if (studentRepository.existsByStudentCode(cleanCode)) {
            throw new BadRequestException("Mã học viên '" + cleanCode + "' đã tồn tại trên hệ thống");
        }

        String targetType = request.getTargetType() != null ? request.getTargetType().trim().toUpperCase() : "ADULT";
        if (!VALID_TARGET_TYPES.contains(targetType)) {
            throw new BadRequestException("Phân loại học viên không hợp lệ. Cho phép: " + VALID_TARGET_TYPES);
        }

        String gender = request.getGender() != null ? request.getGender().trim().toUpperCase() : "OTHER";
        if (!VALID_GENDERS.contains(gender)) {
            throw new BadRequestException("Giới tính không hợp lệ. Cho phép: " + VALID_GENDERS);
        }

        String status = request.getStatus() != null ? request.getStatus().trim().toUpperCase() : "ACTIVE";
        if (!VALID_STATUSES.contains(status)) {
            throw new BadRequestException("Trạng thái không hợp lệ. Cho phép: " + VALID_STATUSES);
        }

        // Ràng buộc bảo vệ dữ liệu trẻ em: nếu là KID, khuyến nghị có người giám hộ
        if ("KID".equals(targetType) && (request.getGuardians() == null || request.getGuardians().isEmpty())) {
            // Nghiệp vụ CH Academy: cho phép tạo nhưng ghi chú cần bổ sung phụ huynh
        }

        Student student = Student.builder()
                .studentCode(cleanCode)
                .fullName(request.getFullName().trim())
                .dateOfBirth(request.getDateOfBirth())
                .gender(gender)
                .phone(request.getPhone() != null && !request.getPhone().isBlank() ? request.getPhone().trim() : null)
                .email(request.getEmail() != null && !request.getEmail().isBlank() ? request.getEmail().trim() : null)
                .address(request.getAddress())
                .targetType(targetType)
                .status(status)
                .internalNotes(request.getInternalNotes())
                .build();

        Student savedStudent = studentRepository.save(student);

        // Link guardians if present
        if (request.getGuardians() != null && !request.getGuardians().isEmpty()) {
            List<StudentGuardian> links = new ArrayList<>();
            for (CreateStudentRequest.GuardianLinkRequest gReq : request.getGuardians()) {
                Guardian guardian = guardianRepository.findById(gReq.getGuardianId())
                        .orElseThrow(() -> new BadRequestException("Không tìm thấy người giám hộ với ID: " + gReq.getGuardianId()));

                StudentGuardian link = StudentGuardian.builder()
                        .id(new StudentGuardianId(savedStudent.getId(), guardian.getId()))
                        .student(savedStudent)
                        .guardian(guardian)
                        .relationshipType(gReq.getRelationshipType() != null ? gReq.getRelationshipType().trim().toUpperCase() : "OTHER")
                        .isPrimaryContact(Boolean.TRUE.equals(gReq.getIsPrimaryContact()))
                        .build();
                links.add(link);
            }
            studentGuardianRepository.saveAll(links);
            savedStudent.setStudentGuardians(links);
        }

        return StudentDto.fromEntity(savedStudent);
    }

    @Transactional
    public StudentDto updateStudent(Long id, UpdateStudentRequest request) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học viên với ID: " + id));

        String cleanCode = request.getStudentCode().trim().toUpperCase();
        if (!student.getStudentCode().equalsIgnoreCase(cleanCode) && studentRepository.existsByStudentCode(cleanCode)) {
            throw new BadRequestException("Mã học viên '" + cleanCode + "' đã tồn tại trên hệ thống");
        }

        String targetType = request.getTargetType().trim().toUpperCase();
        if (!VALID_TARGET_TYPES.contains(targetType)) {
            throw new BadRequestException("Phân loại học viên không hợp lệ. Cho phép: " + VALID_TARGET_TYPES);
        }

        String gender = request.getGender().trim().toUpperCase();
        if (!VALID_GENDERS.contains(gender)) {
            throw new BadRequestException("Giới tính không hợp lệ. Cho phép: " + VALID_GENDERS);
        }

        String status = request.getStatus().trim().toUpperCase();
        if (!VALID_STATUSES.contains(status)) {
            throw new BadRequestException("Trạng thái không hợp lệ. Cho phép: " + VALID_STATUSES);
        }

        student.setStudentCode(cleanCode);
        student.setFullName(request.getFullName().trim());
        student.setDateOfBirth(request.getDateOfBirth());
        student.setGender(gender);
        student.setPhone(request.getPhone() != null && !request.getPhone().isBlank() ? request.getPhone().trim() : null);
        student.setEmail(request.getEmail() != null && !request.getEmail().isBlank() ? request.getEmail().trim() : null);
        student.setAddress(request.getAddress());
        student.setTargetType(targetType);
        student.setStatus(status);
        student.setInternalNotes(request.getInternalNotes());

        // Update guardian links if provided
        if (request.getGuardians() != null) {
            studentGuardianRepository.deleteByStudentId(id);
            List<StudentGuardian> newLinks = new ArrayList<>();
            for (CreateStudentRequest.GuardianLinkRequest gReq : request.getGuardians()) {
                Guardian guardian = guardianRepository.findById(gReq.getGuardianId())
                        .orElseThrow(() -> new BadRequestException("Không tìm thấy người giám hộ với ID: " + gReq.getGuardianId()));

                StudentGuardian link = StudentGuardian.builder()
                        .id(new StudentGuardianId(student.getId(), guardian.getId()))
                        .student(student)
                        .guardian(guardian)
                        .relationshipType(gReq.getRelationshipType() != null ? gReq.getRelationshipType().trim().toUpperCase() : "OTHER")
                        .isPrimaryContact(Boolean.TRUE.equals(gReq.getIsPrimaryContact()))
                        .build();
                newLinks.add(link);
            }
            studentGuardianRepository.saveAll(newLinks);
            student.setStudentGuardians(newLinks);
        }

        Student updated = studentRepository.save(student);
        return StudentDto.fromEntity(updated);
    }

    @Transactional
    public StudentDto updateStudentStatus(Long id, String status) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học viên với ID: " + id));

        String cleanStatus = status.trim().toUpperCase();
        if (!VALID_STATUSES.contains(cleanStatus)) {
            throw new BadRequestException("Trạng thái không hợp lệ: " + status + ". Cho phép: " + VALID_STATUSES);
        }

        student.setStatus(cleanStatus);
        Student updated = studentRepository.save(student);
        return StudentDto.fromEntity(updated);
    }

    @Transactional
    public void deleteStudent(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học viên với ID: " + id));

        student.setStatus("DROPPED");
        studentRepository.save(student);
    }
}
