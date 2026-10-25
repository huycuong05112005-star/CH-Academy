package vn.chacademy.common.setting.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.chacademy.common.setting.dto.SystemSettingsDto;
import vn.chacademy.common.setting.entity.SystemSetting;
import vn.chacademy.common.setting.repository.SystemSettingRepository;

import java.time.Instant;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SystemSettingService {

    private final SystemSettingRepository systemSettingRepository;

    private String getSettingValue(String key, String defaultValue) {
        return systemSettingRepository.findByKey(key)
                .map(SystemSetting::getValue)
                .filter(v -> v != null && !v.isBlank())
                .orElse(defaultValue);
    }

    private void saveOrUpdateSetting(String key, String value, String description) {
        Optional<SystemSetting> existing = systemSettingRepository.findByKey(key);
        if (existing.isPresent()) {
            SystemSetting s = existing.get();
            s.setValue(value);
            s.setUpdatedAt(Instant.now());
            systemSettingRepository.save(s);
        } else {
            SystemSetting s = SystemSetting.builder()
                    .key(key)
                    .value(value)
                    .description(description)
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();
            systemSettingRepository.save(s);
        }
    }

    @Transactional(readOnly = true)
    public SystemSettingsDto getSettings() {
        return SystemSettingsDto.builder()
                .centerName(getSettingValue("center.name", "Học viện Anh ngữ & Năng khiếu CH Academy"))
                .shortName(getSettingValue("center.short_name", "CH Academy"))
                .hotline(getSettingValue("center.hotline", "0988 123 456"))
                .email(getSettingValue("center.email", "tuyensinh@chacademy.edu.vn"))
                .address(getSettingValue("center.address", "Tầng 3, Tòa nhà Tri Thức, Số 123 Phố Huế, Q. Hai Bà Trưng, Hà Nội"))
                .website(getSettingValue("center.website", "https://chacademy.edu.vn"))
                .notifyNewLead(Boolean.parseBoolean(getSettingValue("notify.new_lead", "true")))
                .notifyTuitionDue(Boolean.parseBoolean(getSettingValue("notify.tuition_due", "true")))
                .notifyAbsence(Boolean.parseBoolean(getSettingValue("notify.absence", "false")))
                .appVersion(getSettingValue("app.version", "1.0.0"))
                .dbVersion("PostgreSQL 16.0 (Alpine)")
                .activeProfile("dev")
                .timezone("Asia/Ho_Chi_Minh (UTC+7)")
                .build();
    }

    @Transactional(readOnly = true)
    public SystemSettingsDto getPublicSettings() {
        return SystemSettingsDto.builder()
                .centerName(getSettingValue("center.name", "Học viện Anh ngữ & Năng khiếu CH Academy"))
                .shortName(getSettingValue("center.short_name", "CH Academy"))
                .hotline(getSettingValue("center.hotline", "0988 123 456"))
                .email(getSettingValue("center.email", "tuyensinh@chacademy.edu.vn"))
                .address(getSettingValue("center.address", "Tầng 3, Tòa nhà Tri Thức, Số 123 Phố Huế, Q. Hai Bà Trưng, Hà Nội"))
                .website(getSettingValue("center.website", "https://chacademy.edu.vn"))
                .notifyNewLead(null)
                .notifyTuitionDue(null)
                .notifyAbsence(null)
                .appVersion(null)
                .dbVersion(null)
                .activeProfile(null)
                .timezone("Asia/Ho_Chi_Minh (UTC+7)")
                .build();
    }

    @Transactional
    public SystemSettingsDto updateSettings(SystemSettingsDto dto) {
        saveOrUpdateSetting("center.name", dto.getCenterName(), "Tên đầy đủ của trung tâm");
        saveOrUpdateSetting("center.short_name", dto.getShortName(), "Tên viết tắt thương hiệu");
        saveOrUpdateSetting("center.hotline", dto.getHotline(), "Hotline tuyển sinh");
        saveOrUpdateSetting("center.email", dto.getEmail(), "Email trung tâm");
        saveOrUpdateSetting("center.address", dto.getAddress(), "Địa chỉ trụ sở chính");
        saveOrUpdateSetting("center.website", dto.getWebsite(), "Website chính thức");
        saveOrUpdateSetting("notify.new_lead", String.valueOf(Boolean.TRUE.equals(dto.getNotifyNewLead())), "Thông báo khách hàng tiềm năng mới");
        saveOrUpdateSetting("notify.tuition_due", String.valueOf(Boolean.TRUE.equals(dto.getNotifyTuitionDue())), "Thông báo học phí đến hạn");
        saveOrUpdateSetting("notify.absence", String.valueOf(Boolean.TRUE.equals(dto.getNotifyAbsence())), "Thông báo học viên vắng mặt");

        return getSettings();
    }
}
