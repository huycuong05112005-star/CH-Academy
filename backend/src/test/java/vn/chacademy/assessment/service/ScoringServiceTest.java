package vn.chacademy.assessment.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.chacademy.assessment.entity.*;
import vn.chacademy.assessment.repository.*;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ScoringServiceTest {

    @Mock
    private QuestionOptionRepository questionOptionRepository;

    @Mock
    private AttemptAnswerRepository attemptAnswerRepository;

    @Mock
    private ExamAttemptRepository examAttemptRepository;

    @InjectMocks
    private ScoringService scoringService;

    private Question singleChoiceQ;
    private Question multipleChoiceQ;
    private Question fillBlankQ;
    private Question trueFalseQ;

    @BeforeEach
    void setUp() {
        singleChoiceQ = Question.builder()
                .id(1L)
                .type("SINGLE_CHOICE")
                .defaultPoints(BigDecimal.valueOf(2.00))
                .build();

        multipleChoiceQ = Question.builder()
                .id(2L)
                .type("MULTIPLE_CHOICE")
                .defaultPoints(BigDecimal.valueOf(2.00))
                .build();

        fillBlankQ = Question.builder()
                .id(3L)
                .type("FILL_IN_BLANK")
                .defaultPoints(BigDecimal.valueOf(1.50))
                .answerKey("to look forward to|to")
                .build();

        trueFalseQ = Question.builder()
                .id(4L)
                .type("TRUE_FALSE")
                .defaultPoints(BigDecimal.valueOf(1.00))
                .answerKey("TRUE")
                .build();
    }

    @Test
    @DisplayName("Single Choice - Đúng nhận đủ điểm")
    void testGradeSingleChoiceCorrect() {
        QuestionOption opt1 = QuestionOption.builder().id(101L).isCorrect(true).build();
        QuestionOption opt2 = QuestionOption.builder().id(102L).isCorrect(false).build();
        when(questionOptionRepository.findByQuestionIdOrderBySortOrderAsc(1L)).thenReturn(List.of(opt1, opt2));

        AttemptAnswer answer = AttemptAnswer.builder()
                .selectedOptionIds("101")
                .build();

        scoringService.gradeAnswer(answer, singleChoiceQ, BigDecimal.valueOf(2.00));

        assertTrue(answer.getIsCorrect());
        assertEquals(BigDecimal.valueOf(2.00), answer.getScore());
    }

    @Test
    @DisplayName("Single Choice - Sai nhận 0 điểm")
    void testGradeSingleChoiceIncorrect() {
        QuestionOption opt1 = QuestionOption.builder().id(101L).isCorrect(true).build();
        QuestionOption opt2 = QuestionOption.builder().id(102L).isCorrect(false).build();
        when(questionOptionRepository.findByQuestionIdOrderBySortOrderAsc(1L)).thenReturn(List.of(opt1, opt2));

        AttemptAnswer answer = AttemptAnswer.builder()
                .selectedOptionIds("102")
                .build();

        scoringService.gradeAnswer(answer, singleChoiceQ, BigDecimal.valueOf(2.00));

        assertFalse(answer.getIsCorrect());
        assertEquals(BigDecimal.ZERO, answer.getScore());
    }

    @Test
    @DisplayName("Multiple Choice - Chọn đủ các câu đúng nhận trọn điểm")
    void testGradeMultipleChoiceAllCorrect() {
        QuestionOption opt1 = QuestionOption.builder().id(201L).isCorrect(true).build();
        QuestionOption opt2 = QuestionOption.builder().id(202L).isCorrect(true).build();
        QuestionOption opt3 = QuestionOption.builder().id(203L).isCorrect(false).build();
        when(questionOptionRepository.findByQuestionIdOrderBySortOrderAsc(2L)).thenReturn(List.of(opt1, opt2, opt3));

        AttemptAnswer answer = AttemptAnswer.builder()
                .selectedOptionIds("201,202")
                .build();

        scoringService.gradeAnswer(answer, multipleChoiceQ, BigDecimal.valueOf(2.00));

        assertTrue(answer.getIsCorrect());
        assertEquals(BigDecimal.valueOf(2.00), answer.getScore());
    }

    @Test
    @DisplayName("Multiple Choice - Chọn thiếu phương án đúng được điểm thành phần")
    void testGradeMultipleChoicePartialCredit() {
        QuestionOption opt1 = QuestionOption.builder().id(201L).isCorrect(true).build();
        QuestionOption opt2 = QuestionOption.builder().id(202L).isCorrect(true).build();
        QuestionOption opt3 = QuestionOption.builder().id(203L).isCorrect(false).build();
        when(questionOptionRepository.findByQuestionIdOrderBySortOrderAsc(2L)).thenReturn(List.of(opt1, opt2, opt3));

        // Chỉ chọn 1 trong 2 câu đúng (201)
        AttemptAnswer answer = AttemptAnswer.builder()
                .selectedOptionIds("201")
                .build();

        scoringService.gradeAnswer(answer, multipleChoiceQ, BigDecimal.valueOf(2.00));

        assertFalse(answer.getIsCorrect());
        assertEquals(new BigDecimal("1.00"), answer.getScore());
    }

    @Test
    @DisplayName("Multiple Choice - Chọn dính phương án sai bị 0 điểm")
    void testGradeMultipleChoiceWrongSelection() {
        QuestionOption opt1 = QuestionOption.builder().id(201L).isCorrect(true).build();
        QuestionOption opt2 = QuestionOption.builder().id(202L).isCorrect(true).build();
        QuestionOption opt3 = QuestionOption.builder().id(203L).isCorrect(false).build();
        when(questionOptionRepository.findByQuestionIdOrderBySortOrderAsc(2L)).thenReturn(List.of(opt1, opt2, opt3));

        // Chọn 201 (đúng) và 203 (sai)
        AttemptAnswer answer = AttemptAnswer.builder()
                .selectedOptionIds("201,203")
                .build();

        scoringService.gradeAnswer(answer, multipleChoiceQ, BigDecimal.valueOf(2.00));

        assertFalse(answer.getIsCorrect());
        assertEquals(BigDecimal.ZERO, answer.getScore());
    }

    @Test
    @DisplayName("Fill In Blank - Chuẩn hóa viết hoa và khoảng trắng thừa")
    void testGradeFillInBlankNormalization() {
        AttemptAnswer answer = AttemptAnswer.builder()
                .textAnswer("  TO   ")
                .build();

        scoringService.gradeAnswer(answer, fillBlankQ, BigDecimal.valueOf(1.50));

        assertTrue(answer.getIsCorrect());
        assertEquals(BigDecimal.valueOf(1.50), answer.getScore());
    }

    @Test
    @DisplayName("True / False - Nhận diện Đúng / True chuẩn hóa")
    void testGradeTrueFalse() {
        AttemptAnswer answer = AttemptAnswer.builder()
                .textAnswer("Đúng")
                .build();

        scoringService.gradeAnswer(answer, trueFalseQ, BigDecimal.valueOf(1.00));

        assertTrue(answer.getIsCorrect());
        assertEquals(BigDecimal.valueOf(1.00), answer.getScore());
    }
}
