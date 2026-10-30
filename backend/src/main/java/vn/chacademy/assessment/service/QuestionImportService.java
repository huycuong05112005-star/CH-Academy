package vn.chacademy.assessment.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import vn.chacademy.assessment.dto.*;
import vn.chacademy.assessment.entity.*;
import vn.chacademy.assessment.repository.*;
import vn.chacademy.common.audit.service.AuditService;
import vn.chacademy.course.entity.Course;
import vn.chacademy.course.repository.CourseRepository;
import vn.chacademy.identity.entity.User;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuestionImportService {

    private final QuestionRepository questionRepository;
    private final QuestionBankRepository questionBankRepository;
    private final CourseRepository courseRepository;
    private final vn.chacademy.academic.repository.ClassSessionRepository classSessionRepository;
    private final AuditService auditService;

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private static final int MAX_ROWS = 1000;

    /**
     * Sinh file Excel mẫu với đầy đủ các loại câu hỏi và định dạng chuẩn
     */
    public byte[] generateTemplateExcel() {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Mẫu Câu Hỏi");

            // Header Style: Dark Navy, White Bold Text, Centered
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerFont.setFontHeightInPoints((short) 11);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);

            // Data Style
            CellStyle dataStyle = workbook.createCellStyle();
            dataStyle.setBorderBottom(BorderStyle.THIN);
            dataStyle.setBorderTop(BorderStyle.THIN);
            dataStyle.setBorderLeft(BorderStyle.THIN);
            dataStyle.setBorderRight(BorderStyle.THIN);
            dataStyle.setVerticalAlignment(VerticalAlignment.CENTER);

            String[] headers = {
                    "question_text", "question_type",
                    "option_a", "option_b", "option_c", "option_d", "option_e", "option_f",
                    "correct_answer", "points", "difficulty", "topic", "explanation"
            };

            Row headerRow = sheet.createRow(0);
            headerRow.setHeightInPoints(28);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Mẫu dữ liệu thực tế cho 5 dạng câu hỏi
            Object[][] sampleData = {
                    {
                            "Giao thức nào sau đây hoạt động ở tầng ứng dụng (Application Layer) trong mô hình OSI?",
                            "SINGLE_CHOICE",
                            "HTTP", "TCP", "IP", "Ethernet", "", "",
                            "A", 1.0, "EASY", "Mạng máy tính",
                            "HTTP là giao thức ứng dụng phổ biến nhất trên World Wide Web."
                    },
                    {
                            "Những ngôn ngữ lập trình nào sau đây biên dịch trực tiếp sang Java Bytecode chạy trên JVM?",
                            "MULTIPLE_CHOICE",
                            "Java", "Kotlin", "Python", "Scala", "", "",
                            "A,B,D", 2.0, "MEDIUM", "Lập trình Java",
                            "Java, Kotlin và Scala đều sinh mã bytecode thực thi trên JVM. Python chạy trên CPython."
                    },
                    {
                            "Hệ điều hành Linux sử dụng nhân nguồn mở (Open Source Kernel) và được quản lý bởi Linux Foundation.",
                            "TRUE_FALSE",
                            "Đúng", "Sai", "", "", "", "",
                            "TRUE", 1.0, "EASY", "Hệ điều hành",
                            "Linux là dự án nguồn mở khởi xướng bởi Linus Torvalds năm 1991."
                    },
                    {
                            "Thuật toán sắp xếp nào có độ phức tạp thời gian trung bình tốt nhất O(n log n) trong trường hợp tối ưu?",
                            "SHORT_ANSWER",
                            "", "", "", "", "", "",
                            "Quicksort", 1.5, "MEDIUM", "Cấu trúc dữ liệu & Giải thuật",
                            "Chấp nhận các từ khóa: Quicksort, Merge sort, Heap sort."
                    },
                    {
                            "Trình bày ưu và nhược điểm của kiến trúc Microservices so với Monolith trong các hệ thống quy mô lớn.",
                            "ESSAY",
                            "", "", "", "", "", "",
                            "", 5.0, "HARD", "Kiến trúc phần mềm",
                            "Rubric: 1. Nêu rõ tính độc lập (2đ); 2. Khả năng mở rộng (1.5đ); 3. Thách thức phân tán và đồng bộ dữ liệu (1.5đ)."
                    }
            };

            for (int r = 0; r < sampleData.length; r++) {
                Row row = sheet.createRow(r + 1);
                row.setHeightInPoints(22);
                Object[] data = sampleData[r];
                for (int c = 0; c < data.length; c++) {
                    Cell cell = row.createCell(c);
                    cell.setCellStyle(dataStyle);
                    if (data[c] instanceof Number) {
                        cell.setCellValue(((Number) data[c]).doubleValue());
                    } else {
                        cell.setCellValue(data[c] != null ? data[c].toString() : "");
                    }
                }
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
                if (sheet.getColumnWidth(i) < 4000) {
                    sheet.setColumnWidth(i, 4000);
                }
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate Excel template: {}", e.getMessage(), e);
            throw new RuntimeException("Không thể tạo file Excel mẫu: " + e.getMessage());
        }
    }

    /**
     * Đọc và xác thực sơ bộ file Excel / CSV (Preview trước khi ghi vào Database)
     */
    public QuestionImportPreviewDto parseAndValidate(MultipartFile file, Long bankId) {
        return parseAndValidate(file, bankId, null);
    }

    public QuestionImportPreviewDto parseAndValidate(MultipartFile file, Long bankId, Long sessionId) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn file tải lên.");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("Kích thước file vượt quá giới hạn 10MB.");
        }

        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "questions.xlsx";
        String lowerName = originalFilename.toLowerCase();

        List<QuestionImportRowDto> rows;
        if (lowerName.endsWith(".csv")) {
            rows = parseCsv(file);
        } else if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) {
            rows = parseExcel(file);
        } else {
            throw new IllegalArgumentException("Định dạng file không hợp lệ. Vui lòng chọn file .xlsx, .xls hoặc .csv");
        }

        if (rows.isEmpty()) {
            throw new IllegalArgumentException("File tải lên không có dữ liệu câu hỏi hoặc tiêu đề không đúng.");
        }
        if (rows.size() > MAX_ROWS) {
            throw new IllegalArgumentException("Số lượng câu hỏi vượt quá giới hạn " + MAX_ROWS + " dòng mỗi lần nhập.");
        }

        // Validate logic từng dòng và kiểm tra trùng lặp
        Set<String> seenContentsInFile = new HashSet<>();
        int validCount = 0;
        int invalidCount = 0;
        int duplicateCount = 0;

        for (QuestionImportRowDto row : rows) {
            validateRow(row, bankId, seenContentsInFile);
            if (!row.isValid()) {
                invalidCount++;
            } else if (row.isDuplicate()) {
                duplicateCount++;
                validCount++; // Vẫn có thể import nếu người dùng muốn hoặc bỏ chọn
            } else {
                validCount++;
            }
        }

        return QuestionImportPreviewDto.builder()
                .fileName(originalFilename)
                .totalRows(rows.size())
                .validRowsCount(validCount)
                .invalidRowsCount(invalidCount)
                .duplicateRowsCount(duplicateCount)
                .rows(rows)
                .build();
    }

    private List<QuestionImportRowDto> parseExcel(MultipartFile file) {
        List<QuestionImportRowDto> list = new ArrayList<>();
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            if (sheet == null) return list;

            Iterator<Row> rowIterator = sheet.iterator();
            if (!rowIterator.hasNext()) return list;

            Row headerRow = rowIterator.next();
            Map<String, Integer> colMap = buildColumnMapping(headerRow);

            int rowNum = 1;
            while (rowIterator.hasNext()) {
                Row row = rowIterator.next();
                rowNum++;
                if (isRowEmpty(row)) continue;

                QuestionImportRowDto dto = QuestionImportRowDto.builder()
                        .rowNumber(rowNum)
                        .questionText(getCellValue(row, colMap.get("question_text")))
                        .questionType(normalizeType(getCellValue(row, colMap.get("question_type"))))
                        .optionA(getCellValue(row, colMap.get("option_a")))
                        .optionB(getCellValue(row, colMap.get("option_b")))
                        .optionC(getCellValue(row, colMap.get("option_c")))
                        .optionD(getCellValue(row, colMap.get("option_d")))
                        .optionE(getCellValue(row, colMap.get("option_e")))
                        .optionF(getCellValue(row, colMap.get("option_f")))
                        .correctAnswer(getCellValue(row, colMap.get("correct_answer")))
                        .points(parsePoints(getCellValue(row, colMap.get("points"))))
                        .difficulty(normalizeDifficulty(getCellValue(row, colMap.get("difficulty"))))
                        .topic(normalizeTopic(getCellValue(row, colMap.get("topic"))))
                        .explanation(getCellValue(row, colMap.get("explanation")))
                        .build();

                list.add(dto);
            }
        } catch (Exception e) {
            log.error("Error reading Excel: {}", e.getMessage(), e);
            throw new RuntimeException("Lỗi đọc file Excel: " + e.getMessage());
        }
        return list;
    }

    private List<QuestionImportRowDto> parseCsv(MultipartFile file) {
        List<QuestionImportRowDto> list = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String headerLine = reader.readLine();
            if (headerLine == null) return list;
            // Xóa UTF-8 BOM nếu có
            if (headerLine.startsWith("\uFEFF")) {
                headerLine = headerLine.substring(1);
            }

            String[] headerCols = parseCsvLine(headerLine);
            Map<String, Integer> colMap = new HashMap<>();
            for (int i = 0; i < headerCols.length; i++) {
                colMap.put(normalizeHeader(headerCols[i]), i);
            }

            String line;
            int rowNum = 1;
            while ((line = reader.readLine()) != null) {
                rowNum++;
                if (line.trim().isEmpty()) continue;
                String[] cols = parseCsvLine(line);

                QuestionImportRowDto dto = QuestionImportRowDto.builder()
                        .rowNumber(rowNum)
                        .questionText(getCsvValue(cols, colMap.get("question_text")))
                        .questionType(normalizeType(getCsvValue(cols, colMap.get("question_type"))))
                        .optionA(getCsvValue(cols, colMap.get("option_a")))
                        .optionB(getCsvValue(cols, colMap.get("option_b")))
                        .optionC(getCsvValue(cols, colMap.get("option_c")))
                        .optionD(getCsvValue(cols, colMap.get("option_d")))
                        .optionE(getCsvValue(cols, colMap.get("option_e")))
                        .optionF(getCsvValue(cols, colMap.get("option_f")))
                        .correctAnswer(getCsvValue(cols, colMap.get("correct_answer")))
                        .points(parsePoints(getCsvValue(cols, colMap.get("points"))))
                        .difficulty(normalizeDifficulty(getCsvValue(cols, colMap.get("difficulty"))))
                        .topic(normalizeTopic(getCsvValue(cols, colMap.get("topic"))))
                        .explanation(getCsvValue(cols, colMap.get("explanation")))
                        .build();

                list.add(dto);
            }
        } catch (Exception e) {
            log.error("Error reading CSV: {}", e.getMessage(), e);
            throw new RuntimeException("Lỗi đọc file CSV: " + e.getMessage());
        }
        return list;
    }

    private void validateRow(QuestionImportRowDto row, Long bankId, Set<String> seenInFile) {
        List<String> errors = new ArrayList<>();

        if (row.getQuestionText() == null || row.getQuestionText().trim().isEmpty()) {
            errors.add("Nội dung câu hỏi không được để trống");
        }

        String type = row.getQuestionType();
        if (type == null || type.isEmpty()) {
            errors.add("Loại câu hỏi không hợp lệ");
        } else if (!List.of("SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER", "ESSAY").contains(type)) {
            errors.add("Loại câu hỏi '" + type + "' không được hỗ trợ");
        }

        if (row.getPoints() == null || row.getPoints().compareTo(BigDecimal.ZERO) <= 0) {
            row.setPoints(BigDecimal.valueOf(1.00));
        }

        // Tạo danh sách options
        List<QuestionOptionDto> options = new ArrayList<>();
        Map<String, String> optionMap = new LinkedHashMap<>();
        if (hasValue(row.getOptionA())) optionMap.put("A", row.getOptionA().trim());
        if (hasValue(row.getOptionB())) optionMap.put("B", row.getOptionB().trim());
        if (hasValue(row.getOptionC())) optionMap.put("C", row.getOptionC().trim());
        if (hasValue(row.getOptionD())) optionMap.put("D", row.getOptionD().trim());
        if (hasValue(row.getOptionE())) optionMap.put("E", row.getOptionE().trim());
        if (hasValue(row.getOptionF())) optionMap.put("F", row.getOptionF().trim());

        String ans = row.getCorrectAnswer() != null ? row.getCorrectAnswer().trim() : "";

        if ("SINGLE_CHOICE".equals(type) || "MULTIPLE_CHOICE".equals(type)) {
            if (optionMap.size() < 2) {
                errors.add("Câu hỏi trắc nghiệm cần tối thiểu 2 phương án (option_a, option_b)");
            }

            if (ans.isEmpty()) {
                errors.add("Đáp án đúng không được để trống");
            } else {
                Set<String> validAnsKeys = new HashSet<>();
                String[] parts = ans.toUpperCase().split("[,;\\s]+");
                for (String p : parts) {
                    if (!p.isEmpty()) {
                        if (!optionMap.containsKey(p)) {
                            errors.add("Đáp án '" + p + "' không khớp với các phương án hiện có (" + String.join(",", optionMap.keySet()) + ")");
                        } else {
                            validAnsKeys.add(p);
                        }
                    }
                }
                if ("SINGLE_CHOICE".equals(type) && validAnsKeys.size() > 1) {
                    errors.add("Câu hỏi một đáp án chỉ được chọn 1 phương án đúng");
                }

                int idx = 0;
                for (Map.Entry<String, String> entry : optionMap.entrySet()) {
                    options.add(QuestionOptionDto.builder()
                            .optionCode(entry.getKey())
                            .content(entry.getValue())
                            .isCorrect(validAnsKeys.contains(entry.getKey()))
                            .sortOrder(idx++)
                            .build());
                }
            }
        } else if ("TRUE_FALSE".equals(type)) {
            String normAns = ans.toUpperCase();
            boolean isTrue = normAns.equals("TRUE") || normAns.equals("ĐÚNG") || normAns.equals("T") || normAns.equals("1") || normAns.equals("A");
            boolean isFalse = normAns.equals("FALSE") || normAns.equals("SAI") || normAns.equals("F") || normAns.equals("0") || normAns.equals("B");

            if (!isTrue && !isFalse) {
                errors.add("Đáp án câu đúng/sai phải là TRUE, FALSE, ĐÚNG hoặc SAI");
            } else {
                String trueText = hasValue(row.getOptionA()) ? row.getOptionA().trim() : "Đúng";
                String falseText = hasValue(row.getOptionB()) ? row.getOptionB().trim() : "Sai";
                options.add(QuestionOptionDto.builder().optionCode("A").content(trueText).isCorrect(isTrue).sortOrder(0).build());
                options.add(QuestionOptionDto.builder().optionCode("B").content(falseText).isCorrect(isFalse).sortOrder(1).build());
            }
        } else if ("SHORT_ANSWER".equals(type)) {
            if (ans.isEmpty()) {
                errors.add("Câu trả lời ngắn cần có đáp án chuẩn/từ khóa");
            }
        }

        row.setParsedOptions(options);

        // Kiểm tra trùng lặp
        if (row.getQuestionText() != null && !row.getQuestionText().trim().isEmpty()) {
            String normContent = row.getQuestionText().trim().toLowerCase();
            if (seenInFile.contains(normContent)) {
                row.setDuplicate(true);
                errors.add("Câu hỏi bị trùng lặp nội dung với một dòng khác trong file");
            } else {
                seenInFile.add(normContent);
                // Kiểm tra trong database
                boolean existsInDb = bankId != null
                        ? questionRepository.existsByBankIdAndContentIgnoreCase(bankId, row.getQuestionText().trim())
                        : questionRepository.existsByContentIgnoreCase(row.getQuestionText().trim());
                if (existsInDb) {
                    row.setDuplicate(true);
                }
            }
        }

        if (!errors.isEmpty()) {
            row.setValid(false);
            row.setErrorMessage(String.join("; ", errors));
        } else {
            row.setValid(true);
        }
    }

    /**
     * Xác nhận và lưu toàn bộ danh sách câu hỏi hợp lệ đã chọn vào Database
     */
    @Transactional
    public int confirmImport(QuestionImportConfirmRequest request, User currentUser, String ipAddress) {
        if (request == null || request.getSelectedRows() == null || request.getSelectedRows().isEmpty()) {
            throw new IllegalArgumentException("Không có câu hỏi nào được chọn để nhập.");
        }

        QuestionBank bank = null;
        if (request.getBankId() != null) {
            bank = questionBankRepository.findById(request.getBankId())
                    .orElseThrow(() -> new IllegalArgumentException("Ngân hàng câu hỏi không tồn tại: " + request.getBankId()));
        }

        Course course = null;
        if (request.getCourseId() != null) {
            course = courseRepository.findById(request.getCourseId()).orElse(null);
        } else if (bank != null && bank.getCourse() != null) {
            course = bank.getCourse();
        }

        vn.chacademy.academic.entity.ClassSession session = null;
        if (request.getSessionId() != null) {
            session = classSessionRepository.findById(request.getSessionId()).orElse(null);
            if (course == null && session != null && session.getClassEntity() != null) {
                course = session.getClassEntity().getCourse();
            }
        }

        int successCount = 0;
        List<Question> savedQuestions = new ArrayList<>();

        for (QuestionImportRowDto row : request.getSelectedRows()) {
            if (!row.isValid()) continue; // Bỏ qua dòng không hợp lệ

            Question q = Question.builder()
                    .bank(bank)
                    .course(course)
                    .session(session)
                    .type(row.getQuestionType())
                    .difficulty(row.getDifficulty() != null ? row.getDifficulty() : "MEDIUM")
                    .topic(row.getTopic() != null ? row.getTopic() : "Chung")
                    .content(row.getQuestionText().trim())
                    .defaultPoints(row.getPoints() != null ? row.getPoints() : BigDecimal.valueOf(1.00))
                    .explanation(row.getExplanation())
                    .answerKey(row.getCorrectAnswer())
                    .createdBy(currentUser)
                    .status("ACTIVE")
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();

            if (row.getParsedOptions() != null && !row.getParsedOptions().isEmpty()) {
                for (QuestionOptionDto optDto : row.getParsedOptions()) {
                    QuestionOption opt = QuestionOption.builder()
                            .question(q)
                            .optionCode(optDto.getOptionCode() != null ? optDto.getOptionCode() : "A")
                            .content(optDto.getContent())
                            .isCorrect(Boolean.TRUE.equals(optDto.getIsCorrect()))
                            .sortOrder(optDto.getSortOrder() != null ? optDto.getSortOrder() : 0)
                            .build();
                    q.getOptions().add(opt);
                }
            }

            savedQuestions.add(q);
        }

        if (!savedQuestions.isEmpty()) {
            questionRepository.saveAll(savedQuestions);
            successCount = savedQuestions.size();

            // Ghi nhật ký hệ thống (Audit Log)
            String bankName = bank != null ? bank.getName() : "Mặc định";
            auditService.recordAction(
                    currentUser,
                    "IMPORT_QUESTIONS_EXCEL",
                    "QuestionBank",
                    bank != null ? bank.getId().toString() : "GLOBAL",
                    String.format("Đã nhập thành công %d câu hỏi từ Excel vào ngân hàng '%s'", successCount, bankName),
                    ipAddress
            );
        }

        return successCount;
    }

    private boolean hasValue(String s) {
        return s != null && !s.trim().isEmpty();
    }

    private String normalizeType(String raw) {
        if (raw == null) return "SINGLE_CHOICE";
        String s = raw.trim().toUpperCase().replace("-", "_").replace(" ", "_");
        if (s.contains("SINGLE") || s.contains("MOT_DAP_AN") || s.contains("DON")) return "SINGLE_CHOICE";
        if (s.contains("MULTI") || s.contains("NHIEU_DAP_AN")) return "MULTIPLE_CHOICE";
        if (s.contains("TRUE") || s.contains("DUNG_SAI") || s.contains("TF")) return "TRUE_FALSE";
        if (s.contains("SHORT") || s.contains("NGAN") || s.contains("TRA_LOI_NGAN")) return "SHORT_ANSWER";
        if (s.contains("ESSAY") || s.contains("TU_LUAN")) return "ESSAY";
        return s;
    }

    private String normalizeDifficulty(String raw) {
        if (raw == null) return "MEDIUM";
        String s = raw.trim().toUpperCase();
        if (s.contains("DE") || s.contains("EASY")) return "EASY";
        if (s.contains("KHO") || s.contains("HARD")) return "HARD";
        return "MEDIUM";
    }

    private String normalizeTopic(String raw) {
        if (raw == null || raw.trim().isEmpty()) return "Chung";
        return raw.trim();
    }

    private BigDecimal parsePoints(String raw) {
        if (raw == null || raw.trim().isEmpty()) return BigDecimal.valueOf(1.00);
        try {
            return new BigDecimal(raw.trim().replace(",", "."));
        } catch (Exception e) {
            return BigDecimal.valueOf(1.00);
        }
    }

    private Map<String, Integer> buildColumnMapping(Row headerRow) {
        Map<String, Integer> map = new HashMap<>();
        for (Cell cell : headerRow) {
            String val = cell.getStringCellValue();
            if (val != null) {
                map.put(normalizeHeader(val), cell.getColumnIndex());
            }
        }
        return map;
    }

    private String normalizeHeader(String header) {
        if (header == null) return "";
        String s = header.trim().toLowerCase().replace("-", "_").replace(" ", "_");
        if (s.contains("noi_dung") || s.contains("cau_hoi") || s.contains("content")) return "question_text";
        if (s.contains("loai") || s.contains("type")) return "question_type";
        if (s.contains("phuong_an_a") || s.contains("dap_an_a") || s.equals("a")) return "option_a";
        if (s.contains("phuong_an_b") || s.contains("dap_an_b") || s.equals("b")) return "option_b";
        if (s.contains("phuong_an_c") || s.contains("dap_an_c") || s.equals("c")) return "option_c";
        if (s.contains("phuong_an_d") || s.contains("dap_an_d") || s.equals("d")) return "option_d";
        if (s.contains("phuong_an_e") || s.contains("dap_an_e") || s.equals("e")) return "option_e";
        if (s.contains("phuong_an_f") || s.contains("dap_an_f") || s.equals("f")) return "option_f";
        if (s.contains("dap_an_dung") || s.contains("dap_an") || s.contains("correct")) return "correct_answer";
        if (s.contains("diem") || s.contains("point") || s.contains("score")) return "points";
        if (s.contains("do_kho") || s.contains("difficulty") || s.contains("muc_do")) return "difficulty";
        if (s.contains("chu_de") || s.contains("topic") || s.contains("chuyen_de")) return "topic";
        if (s.contains("giai_thich") || s.contains("huong_dan") || s.contains("explanation")) return "explanation";
        return s;
    }

    private String getCellValue(Row row, Integer colIdx) {
        if (colIdx == null) return null;
        Cell cell = row.getCell(colIdx);
        if (cell == null) return null;

        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                double d = cell.getNumericCellValue();
                if (d == (long) d) {
                    return String.format("%d", (long) d);
                }
                return String.valueOf(d);
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                try {
                    return cell.getStringCellValue();
                } catch (Exception e) {
                    return String.valueOf(cell.getNumericCellValue());
                }
            default:
                return null;
        }
    }

    private String getCsvValue(String[] cols, Integer idx) {
        if (idx == null || idx < 0 || idx >= cols.length) return null;
        return cols[idx].trim();
    }

    private boolean isRowEmpty(Row row) {
        if (row == null) return true;
        for (Cell cell : row) {
            if (cell != null && cell.getCellType() != CellType.BLANK) {
                String val = cell.toString().trim();
                if (!val.isEmpty()) return false;
            }
        }
        return true;
    }

    private String[] parseCsvLine(String line) {
        List<String> tokens = new ArrayList<>();
        StringBuilder sb = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '\"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                tokens.add(sb.toString());
                sb.setLength(0);
            } else {
                sb.append(c);
            }
        }
        tokens.add(sb.toString());
        return tokens.toArray(new String[0]);
    }
}
