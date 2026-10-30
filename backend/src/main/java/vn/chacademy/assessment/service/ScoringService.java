package vn.chacademy.assessment.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.chacademy.assessment.entity.*;
import vn.chacademy.assessment.repository.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScoringService {

    private final QuestionOptionRepository questionOptionRepository;
    private final AttemptAnswerRepository attemptAnswerRepository;
    private final ExamAttemptRepository examAttemptRepository;

    /**
     * Chuẩn hóa chuỗi văn bản cho điền khuyết và trả lời ngắn:
     * - Chuyển chữ thường
     * - Bỏ khoảng trắng đầu cuối và gộp nhiều dấu cách thành một
     * - Bỏ dấu câu cuối câu (. , ! ?)
     */
    public String normalizeText(String input) {
        if (input == null) return "";
        String trimmed = input.trim().toLowerCase();
        trimmed = trimmed.replaceAll("\\s+", " ");
        trimmed = trimmed.replaceAll("[.,!?]+$", "");
        return trimmed;
    }

    /**
     * Chấm điểm một câu trả lời cụ thể
     */
    public void gradeAnswer(AttemptAnswer answer, Question question, BigDecimal maxPoints) {
        if (answer == null || question == null) return;
        answer.setMaxScore(maxPoints != null ? maxPoints : question.getDefaultPoints());

        String type = question.getType();
        if ("SINGLE_CHOICE".equalsIgnoreCase(type)) {
            gradeSingleChoice(answer, question);
        } else if ("MULTIPLE_CHOICE".equalsIgnoreCase(type)) {
            gradeMultipleChoice(answer, question);
        } else if ("TRUE_FALSE".equalsIgnoreCase(type)) {
            gradeTrueFalse(answer, question);
        } else if ("FILL_IN_BLANK".equalsIgnoreCase(type) || "SHORT_ANSWER".equalsIgnoreCase(type)) {
            gradeTextAnswer(answer, question);
        } else if ("ESSAY".equalsIgnoreCase(type)) {
            // Tự luận không chấm tự động điểm tuyệt đối, đánh dấu autoGraded = false
            answer.setAutoGraded(false);
            if (answer.getScore() == null) {
                answer.setScore(BigDecimal.ZERO);
                answer.setIsCorrect(null);
            }
        }
        answer.setUpdatedAt(Instant.now());
    }

    private void gradeSingleChoice(AttemptAnswer answer, Question question) {
        answer.setAutoGraded(true);
        if (answer.getSelectedOptionIds() == null || answer.getSelectedOptionIds().isBlank()) {
            answer.setScore(BigDecimal.ZERO);
            answer.setIsCorrect(false);
            return;
        }

        List<QuestionOption> options = questionOptionRepository.findByQuestionIdOrderBySortOrderAsc(question.getId());
        Set<String> correctOptionIds = options.stream()
                .filter(o -> Boolean.TRUE.equals(o.getIsCorrect()))
                .map(o -> String.valueOf(o.getId()))
                .collect(Collectors.toSet());

        String selected = answer.getSelectedOptionIds().trim();
        if (correctOptionIds.contains(selected)) {
            answer.setScore(answer.getMaxScore());
            answer.setIsCorrect(true);
        } else {
            answer.setScore(BigDecimal.ZERO);
            answer.setIsCorrect(false);
        }
    }

    private void gradeMultipleChoice(AttemptAnswer answer, Question question) {
        answer.setAutoGraded(true);
        if (answer.getSelectedOptionIds() == null || answer.getSelectedOptionIds().isBlank()) {
            answer.setScore(BigDecimal.ZERO);
            answer.setIsCorrect(false);
            return;
        }

        List<QuestionOption> options = questionOptionRepository.findByQuestionIdOrderBySortOrderAsc(question.getId());
        Set<String> correctOptionIds = options.stream()
                .filter(o -> Boolean.TRUE.equals(o.getIsCorrect()))
                .map(o -> String.valueOf(o.getId()))
                .collect(Collectors.toSet());

        Set<String> selectedIds = Arrays.stream(answer.getSelectedOptionIds().split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());

        if (correctOptionIds.isEmpty()) {
            answer.setScore(BigDecimal.ZERO);
            answer.setIsCorrect(false);
            return;
        }

        // Chính sách chấm: Nếu chọn bất kỳ phương án sai nào -> 0 điểm
        // Nếu chỉ chọn trong số các phương án đúng -> Tính điểm tỷ lệ theo số câu đúng chọn được
        boolean hasWrongSelection = selectedIds.stream().anyMatch(id -> !correctOptionIds.contains(id));
        if (hasWrongSelection) {
            answer.setScore(BigDecimal.ZERO);
            answer.setIsCorrect(false);
            return;
        }

        long correctSelectedCount = selectedIds.stream().filter(correctOptionIds::contains).count();
        if (correctSelectedCount == correctOptionIds.size()) {
            answer.setScore(answer.getMaxScore());
            answer.setIsCorrect(true);
        } else if (correctSelectedCount > 0) {
            BigDecimal fraction = BigDecimal.valueOf(correctSelectedCount)
                    .divide(BigDecimal.valueOf(correctOptionIds.size()), 4, RoundingMode.HALF_UP);
            BigDecimal partialScore = answer.getMaxScore().multiply(fraction).setScale(2, RoundingMode.HALF_UP);
            answer.setScore(partialScore);
            answer.setIsCorrect(false); // Chưa đạt điểm tối đa
        } else {
            answer.setScore(BigDecimal.ZERO);
            answer.setIsCorrect(false);
        }
    }

    private void gradeTrueFalse(AttemptAnswer answer, Question question) {
        answer.setAutoGraded(true);
        List<QuestionOption> options = questionOptionRepository.findByQuestionIdOrderBySortOrderAsc(question.getId());

        // Nếu câu hỏi có options T/F
        if (!options.isEmpty()) {
            Optional<QuestionOption> correctOpt = options.stream()
                    .filter(o -> Boolean.TRUE.equals(o.getIsCorrect()))
                    .findFirst();
            if (correctOpt.isPresent() && answer.getSelectedOptionIds() != null) {
                if (correctOpt.get().getId().toString().equals(answer.getSelectedOptionIds().trim())) {
                    answer.setScore(answer.getMaxScore());
                    answer.setIsCorrect(true);
                    return;
                }
            }
        }

        // Hoặc kiểm tra qua answerKey (TRUE / FALSE)
        if (question.getAnswerKey() != null && answer.getTextAnswer() != null) {
            String expected = normalizeText(question.getAnswerKey());
            String studentAns = normalizeText(answer.getTextAnswer());
            if (expected.equals(studentAns) ||
                ("true".equals(expected) && ("đúng".equals(studentAns) || "t".equals(studentAns))) ||
                ("false".equals(expected) && ("sai".equals(studentAns) || "f".equals(studentAns)))) {
                answer.setScore(answer.getMaxScore());
                answer.setIsCorrect(true);
                return;
            }
        }

        answer.setScore(BigDecimal.ZERO);
        answer.setIsCorrect(false);
    }

    private void gradeTextAnswer(AttemptAnswer answer, Question question) {
        answer.setAutoGraded(true);
        if (answer.getTextAnswer() == null || answer.getTextAnswer().isBlank() || question.getAnswerKey() == null) {
            answer.setScore(BigDecimal.ZERO);
            answer.setIsCorrect(false);
            return;
        }

        String studentAns = normalizeText(answer.getTextAnswer());
        // Cho phép nhiều đáp án tương đương phân tách bằng dấu '|' hoặc ','
        String[] acceptableAnswers = question.getAnswerKey().split("[|,]");
        boolean matched = false;
        for (String acc : acceptableAnswers) {
            if (normalizeText(acc).equalsIgnoreCase(studentAns)) {
                matched = true;
                break;
            }
        }

        if (matched) {
            answer.setScore(answer.getMaxScore());
            answer.setIsCorrect(true);
        } else {
            answer.setScore(BigDecimal.ZERO);
            answer.setIsCorrect(false);
        }
    }

    /**
     * Chấm toàn bộ bài thi khi nộp
     */
    @Transactional
    public ExamAttempt gradeEntireAttempt(ExamAttempt attempt, Map<Long, BigDecimal> questionPointsMap) {
        List<AttemptAnswer> answers = attemptAnswerRepository.findByAttemptId(attempt.getId());
        BigDecimal totalScore = BigDecimal.ZERO;
        BigDecimal maxScore = BigDecimal.ZERO;
        boolean hasPendingEssay = false;

        for (AttemptAnswer ans : answers) {
            Question q = ans.getQuestion();
            BigDecimal pts = questionPointsMap != null ? questionPointsMap.get(q.getId()) : null;
            if (pts == null) {
                pts = ans.getMaxScore() != null ? ans.getMaxScore() : q.getDefaultPoints();
            }

            if ("ESSAY".equalsIgnoreCase(q.getType()) && !Boolean.TRUE.equals(ans.getAutoGraded()) && ans.getScore().compareTo(BigDecimal.ZERO) == 0) {
                hasPendingEssay = true;
            } else {
                gradeAnswer(ans, q, pts);
            }

            attemptAnswerRepository.save(ans);
            if (ans.getScore() != null) {
                totalScore = totalScore.add(ans.getScore());
            }
            if (ans.getMaxScore() != null) {
                maxScore = maxScore.add(ans.getMaxScore());
            }
        }

        attempt.setTotalScore(totalScore.setScale(2, RoundingMode.HALF_UP));
        attempt.setMaxScore(maxScore.setScale(2, RoundingMode.HALF_UP));

        BigDecimal percentage = BigDecimal.ZERO;
        if (maxScore.compareTo(BigDecimal.ZERO) > 0) {
            percentage = totalScore.divide(maxScore, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(2, RoundingMode.HALF_UP);
        }
        attempt.setPercentage(percentage);

        BigDecimal passPercent = attempt.getExam().getPassPercentage() != null ?
                attempt.getExam().getPassPercentage() : BigDecimal.valueOf(50.00);
        attempt.setIsPassed(percentage.compareTo(passPercent) >= 0);

        if (hasPendingEssay) {
            attempt.setStatus("GRADING");
        } else {
            attempt.setStatus("GRADED");
            attempt.setGradedAt(Instant.now());
        }

        return examAttemptRepository.save(attempt);
    }

    /**
     * Re-grade toàn bộ các lượt thi của một đề thi khi đáp án chuẩn hoặc điểm số được điều chỉnh
     */
    @Transactional
    public int reGradeExam(Exam exam) {
        Map<Long, BigDecimal> questionPoints = exam.getExamQuestions().stream()
                .collect(Collectors.toMap(eq -> eq.getQuestion().getId(), ExamQuestion::getPoints, (a, b) -> a));

        List<ExamAttempt> attempts = examAttemptRepository.findByExamIdOrderBySubmittedAtDesc(exam.getId());
        int count = 0;
        for (ExamAttempt attempt : attempts) {
            if ("SUBMITTED".equalsIgnoreCase(attempt.getStatus()) || 
                "GRADED".equalsIgnoreCase(attempt.getStatus()) ||
                "GRADING".equalsIgnoreCase(attempt.getStatus())) {
                gradeEntireAttempt(attempt, questionPoints);
                count++;
            }
        }
        log.info("Re-graded {} attempts for exam id {}", count, exam.getId());
        return count;
    }
}
