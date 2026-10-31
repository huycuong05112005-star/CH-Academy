package vn.chacademy.chat.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateKbRequest {

    private String code;

    @NotBlank(message = "Tên Kho tri thức không được để trống")
    private String name;

    private String description;
    private String accessLevel; // PUBLIC, INTERNAL, TEACHER_ONLY, ADMIN_ONLY
}

