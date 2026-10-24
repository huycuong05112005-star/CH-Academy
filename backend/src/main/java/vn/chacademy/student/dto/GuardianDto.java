package vn.chacademy.student.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.chacademy.student.entity.Guardian;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuardianDto {
    private Long id;
    private String guardianCode;
    private String fullName;
    private String phone;
    private String email;
    private String address;
    private String occupation;

    public static GuardianDto fromEntity(Guardian g) {
        if (g == null) return null;
        return GuardianDto.builder()
                .id(g.getId())
                .guardianCode(g.getGuardianCode())
                .fullName(g.getFullName())
                .phone(g.getPhone())
                .email(g.getEmail())
                .address(g.getAddress())
                .occupation(g.getOccupation())
                .build();
    }
}
