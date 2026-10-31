package vn.chacademy.academic.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.chacademy.academic.dto.AcademicYearDto;
import vn.chacademy.academic.dto.CreateAcademicYearRequest;
import vn.chacademy.academic.entity.AcademicYear;
import vn.chacademy.academic.repository.AcademicYearRepository;
import vn.chacademy.common.exception.BadRequestException;
import vn.chacademy.common.exception.ResourceNotFoundException;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AcademicYearService {

    private final AcademicYearRepository academicYearRepository;

    @Transactional(readOnly = true)
    public List<AcademicYearDto> getAllAcademicYears() {
        return academicYearRepository.findAllByOrderByStartDateDesc().stream()
                .map(AcademicYearDto::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public AcademicYearDto getCurrentAcademicYear() {
        return academicYearRepository.findByIsCurrentTrue()
                .map(AcademicYearDto::fromEntity)
                .orElseGet(() -> {
                    List<AcademicYear> all = academicYearRepository.findAllByOrderByStartDateDesc();
                    return all.isEmpty() ? null : AcademicYearDto.fromEntity(all.get(0));
                });
    }

    @Transactional
    public AcademicYearDto createAcademicYear(CreateAcademicYearRequest request) {
        if (academicYearRepository.existsByCode(request.getCode().trim())) {
            throw new BadRequestException("Năm học với mã " + request.getCode() + " đã tồn tại trên hệ thống");
        }
        if (request.getStartDate().isAfter(request.getEndDate())) {
            throw new BadRequestException("Ngày bắt đầu không được sau ngày kết thúc");
        }

        if (Boolean.TRUE.equals(request.getIsCurrent())) {
            academicYearRepository.findAll().forEach(y -> {
                if (Boolean.TRUE.equals(y.getIsCurrent())) {
                    y.setIsCurrent(false);
                    academicYearRepository.save(y);
                }
            });
        }

        AcademicYear year = AcademicYear.builder()
                .code(request.getCode().trim())
                .name(request.getName().trim())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .isCurrent(Boolean.TRUE.equals(request.getIsCurrent()))
                .status(request.getStatus() != null ? request.getStatus().trim().toUpperCase() : "ACTIVE")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        return AcademicYearDto.fromEntity(academicYearRepository.save(year));
    }

    @Transactional
    public AcademicYearDto setCurrentYear(Long id) {
        AcademicYear target = academicYearRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy năm học #" + id));

        academicYearRepository.findAll().forEach(y -> {
            y.setIsCurrent(y.getId().equals(id));
            academicYearRepository.save(y);
        });

        target.setIsCurrent(true);
        return AcademicYearDto.fromEntity(target);
    }
}

