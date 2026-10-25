package vn.chacademy.common.file.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import vn.chacademy.common.exception.BadRequestException;
import vn.chacademy.common.exception.ResourceNotFoundException;
import vn.chacademy.common.file.dto.FileMetadataDto;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.text.DecimalFormat;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
public class FileStorageService {

    private final Path fileStorageLocation;

    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(
            "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
            "txt", "csv", "zip", "rar", "7z", "png", "jpg", "jpeg",
            "gif", "webp", "mp4", "mp3", "m4a", "wav"
    );

    public FileStorageService(@Value("${app.upload.dir:uploads/materials}") String uploadDir) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            log.error("Không thể tạo thư mục lưu trữ file: {}", uploadDir, ex);
            throw new RuntimeException("Không thể tạo thư mục lưu file tải lên.", ex);
        }
    }

    public FileMetadataDto storeFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BadRequestException("File tải lên không được rỗng");
        }

        String rawOriginalFilename = file.getOriginalFilename();
        if (rawOriginalFilename == null || rawOriginalFilename.isBlank()) {
            rawOriginalFilename = "unnamed_file";
        }
        String originalFilename = StringUtils.cleanPath(rawOriginalFilename);

        if (originalFilename.contains("..")) {
            throw new BadRequestException("Tên file chứa đường dẫn không hợp lệ: " + originalFilename);
        }

        // Validate extension
        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex > 0) {
            extension = originalFilename.substring(dotIndex + 1).toLowerCase();
        }

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BadRequestException("Định dạng file ." + extension + " không được hỗ trợ. Các định dạng cho phép: PDF, Word, Excel, PowerPoint, Zip, Ảnh, Video.");
        }

        // Generate unique stored file name
        String uniquePrefix = UUID.randomUUID().toString().substring(0, 8);
        String safeName = originalFilename.replaceAll("[^a-zA-Z0-9.\\-_]", "_");
        String storedFilename = uniquePrefix + "_" + safeName;

        try {
            Path targetLocation = this.fileStorageLocation.resolve(storedFilename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            String formattedSize = formatFileSize(file.getSize());
            String downloadUrl = "/api/v1/files/download/" + storedFilename;

            return FileMetadataDto.builder()
                    .originalName(originalFilename)
                    .storedName(storedFilename)
                    .fileUrl(downloadUrl)
                    .fileSize(formattedSize)
                    .contentType(file.getContentType())
                    .build();
        } catch (IOException ex) {
            log.error("Lỗi khi lưu file: {}", storedFilename, ex);
            throw new RuntimeException("Không thể lưu file tải lên: " + originalFilename, ex);
        }
    }

    public Resource loadFileAsResource(String filename) {
        try {
            if (filename.contains("..")) {
                throw new BadRequestException("Tên file không hợp lệ");
            }
            Path filePath = this.fileStorageLocation.resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new ResourceNotFoundException("Không tìm thấy file: " + filename);
            }
        } catch (MalformedURLException ex) {
            throw new ResourceNotFoundException("Không tìm thấy file: " + filename);
        }
    }

    private String formatFileSize(long size) {
        if (size <= 0) return "0 B";
        final String[] units = new String[]{"B", "KB", "MB", "GB", "TB"};
        int digitGroups = (int) (Math.log10(size) / Math.log10(1024));
        return new DecimalFormat("#,##0.#").format(size / Math.pow(1024, digitGroups)) + " " + units[digitGroups];
    }
}
