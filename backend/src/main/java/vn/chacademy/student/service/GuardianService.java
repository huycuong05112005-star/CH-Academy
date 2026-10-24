package vn.chacademy.student.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.chacademy.common.exception.BadRequestException;
import vn.chacademy.common.exception.ResourceNotFoundException;
import vn.chacademy.student.dto.CreateGuardianRequest;
import vn.chacademy.student.dto.GuardianDto;
import vn.chacademy.student.entity.Guardian;
import vn.chacademy.student.repository.GuardianRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GuardianService {

    private final GuardianRepository guardianRepository;

    @Transactional(readOnly = true)
    public Page<GuardianDto> searchGuardians(String keyword, Pageable pageable) {
        String cleanKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        return guardianRepository.searchGuardians(cleanKeyword, pageable)
                .map(GuardianDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<GuardianDto> getAllGuardiansList() {
        return guardianRepository.findAll().stream()
                .map(GuardianDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public GuardianDto getGuardianById(Long id) {
        Guardian g = guardianRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người giám hộ với ID: " + id));
        return GuardianDto.fromEntity(g);
    }

    @Transactional
    public GuardianDto createGuardian(CreateGuardianRequest request) {
        String cleanCode = request.getGuardianCode().trim().toUpperCase();
        if (guardianRepository.existsByGuardianCode(cleanCode)) {
            throw new BadRequestException("Mã người giám hộ '" + cleanCode + "' đã tồn tại trên hệ thống");
        }

        Guardian guardian = Guardian.builder()
                .guardianCode(cleanCode)
                .fullName(request.getFullName().trim())
                .phone(request.getPhone().trim())
                .email(request.getEmail() != null ? request.getEmail().trim() : null)
                .address(request.getAddress())
                .occupation(request.getOccupation())
                .build();

        Guardian saved = guardianRepository.save(guardian);
        return GuardianDto.fromEntity(saved);
    }

    @Transactional
    public GuardianDto updateGuardian(Long id, CreateGuardianRequest request) {
        Guardian guardian = guardianRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người giám hộ với ID: " + id));

        String cleanCode = request.getGuardianCode().trim().toUpperCase();
        if (!guardian.getGuardianCode().equalsIgnoreCase(cleanCode) && guardianRepository.existsByGuardianCode(cleanCode)) {
            throw new BadRequestException("Mã người giám hộ '" + cleanCode + "' đã tồn tại trên hệ thống");
        }

        guardian.setGuardianCode(cleanCode);
        guardian.setFullName(request.getFullName().trim());
        guardian.setPhone(request.getPhone().trim());
        guardian.setEmail(request.getEmail() != null ? request.getEmail().trim() : null);
        guardian.setAddress(request.getAddress());
        guardian.setOccupation(request.getOccupation());

        Guardian updated = guardianRepository.save(guardian);
        return GuardianDto.fromEntity(updated);
    }
}
