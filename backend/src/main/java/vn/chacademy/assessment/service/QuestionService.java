package vn.chacademy.assessment.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.chacademy.assessment.dto.QuestionBankDto;
import vn.chacademy.assessment.dto.QuestionDto;
import vn.chacademy.assessment.dto.QuestionOptionDto;
import vn.chacademy.assessment.entity.Question;
import vn.chacademy.assessment.entity.QuestionBank;
import vn.chacademy.assessment.entity.QuestionOption;
import vn.chacademy.assessment.repository.QuestionBankRepository;
import vn.chacademy.assessment.repository.QuestionOptionRepository;
import vn.chacademy.assessment.repository.QuestionRepository;
import vn.chacademy.course.repository.CourseRepository;
import vn.chacademy.identity.entity.User;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final QuestionOptionRepository questionOptionRepository;
    private final QuestionBankRepository questionBankRepository;
    private final CourseRepository courseRepository;
    private final vn.chacademy.academic.repository.ClassSessionRepository classSessionRepository;

    @Transactional(readOnly = true)
    public Page<QuestionDto> searchQuestions(Long courseId, Long bankId, Long sessionId, Long classId, String type, String difficulty, String topic, String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return questionRepository.searchQuestions(courseId, bankId, sessionId, classId, type, difficulty, topic, search, pageable)
                .map(q -> QuestionDto.fromEntity(q, false));
    }

    @Transactional(readOnly = true)
    public QuestionDto getQuestionById(Long id) {
        Question q = questionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy câu hỏi với ID: " + id));
        return QuestionDto.fromEntity(q, false);
    }

    @Transactional
    public QuestionDto createQuestion(QuestionDto dto, User creator) {
        Question q = Question.builder()
                .code(dto.getCode() != null && !dto.getCode().isBlank() ? dto.getCode() : "Q-" + System.currentTimeMillis())
                .type(dto.getType())
                .difficulty(dto.getDifficulty() != null ? dto.getDifficulty() : "MEDIUM")
                .topic(dto.getTopic() != null ? dto.getTopic() : "Chung")
                .learningOutcome(dto.getLearningOutcome() != null ? dto.getLearningOutcome() : "APPLY")
                .content(dto.getContent())
                .defaultPoints(dto.getDefaultPoints() != null ? dto.getDefaultPoints() : java.math.BigDecimal.valueOf(1.00))
                .explanation(dto.getExplanation())
                .rubricJson(dto.getRubricJson())
                .answerKey(dto.getAnswerKey())
                .status("ACTIVE")
                .createdBy(creator)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        if (dto.getBankId() != null) {
            questionBankRepository.findById(dto.getBankId()).ifPresent(q::setBank);
        }
        if (dto.getSessionId() != null) {
            classSessionRepository.findById(dto.getSessionId()).ifPresent(session -> {
                q.setSession(session);
                if (dto.getCourseId() == null && session.getClassEntity() != null) {
                    q.setCourse(session.getClassEntity().getCourse());
                }
            });
        }
        if (q.getCourse() == null && dto.getCourseId() != null) {
            courseRepository.findById(dto.getCourseId()).ifPresent(q::setCourse);
        }

        Question saved = questionRepository.save(q);

        if (dto.getOptions() != null && !dto.getOptions().isEmpty()) {
            List<QuestionOption> options = new ArrayList<>();
            for (QuestionOptionDto optDto : dto.getOptions()) {
                QuestionOption opt = QuestionOption.builder()
                        .question(saved)
                        .optionCode(optDto.getOptionCode() != null ? optDto.getOptionCode() : "A")
                        .content(optDto.getContent() != null ? optDto.getContent() : "")
                        .isCorrect(Boolean.TRUE.equals(optDto.getIsCorrect()))
                        .sortOrder(optDto.getSortOrder() != null ? optDto.getSortOrder() : 0)
                        .explanation(optDto.getExplanation())
                        .build();
                options.add(opt);
            }
            questionOptionRepository.saveAll(options);
            saved.setOptions(options);
        }

        return QuestionDto.fromEntity(saved, false);
    }

    @Transactional
    public QuestionDto updateQuestion(Long id, QuestionDto dto) {
        Question q = questionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy câu hỏi với ID: " + id));

        if (dto.getCode() != null) q.setCode(dto.getCode());
        if (dto.getType() != null) q.setType(dto.getType());
        if (dto.getDifficulty() != null) q.setDifficulty(dto.getDifficulty());
        if (dto.getTopic() != null) q.setTopic(dto.getTopic());
        if (dto.getLearningOutcome() != null) q.setLearningOutcome(dto.getLearningOutcome());
        if (dto.getContent() != null) q.setContent(dto.getContent());
        if (dto.getDefaultPoints() != null) q.setDefaultPoints(dto.getDefaultPoints());
        if (dto.getExplanation() != null) q.setExplanation(dto.getExplanation());
        if (dto.getRubricJson() != null) q.setRubricJson(dto.getRubricJson());
        if (dto.getAnswerKey() != null) q.setAnswerKey(dto.getAnswerKey());
        q.setUpdatedAt(Instant.now());

        if (dto.getBankId() != null) {
            questionBankRepository.findById(dto.getBankId()).ifPresent(q::setBank);
        }
        if (dto.getSessionId() != null) {
            classSessionRepository.findById(dto.getSessionId()).ifPresent(session -> {
                q.setSession(session);
                if (dto.getCourseId() == null && session.getClassEntity() != null) {
                    q.setCourse(session.getClassEntity().getCourse());
                }
            });
        }
        if (dto.getCourseId() != null) {
            courseRepository.findById(dto.getCourseId()).ifPresent(q::setCourse);
        }

        if (dto.getOptions() != null) {
            questionOptionRepository.deleteByQuestionId(q.getId());
            List<QuestionOption> options = new ArrayList<>();
            for (QuestionOptionDto optDto : dto.getOptions()) {
                QuestionOption opt = QuestionOption.builder()
                        .question(q)
                        .optionCode(optDto.getOptionCode() != null ? optDto.getOptionCode() : "A")
                        .content(optDto.getContent() != null ? optDto.getContent() : "")
                        .isCorrect(Boolean.TRUE.equals(optDto.getIsCorrect()))
                        .sortOrder(optDto.getSortOrder() != null ? optDto.getSortOrder() : 0)
                        .explanation(optDto.getExplanation())
                        .build();
                options.add(opt);
            }
            questionOptionRepository.saveAll(options);
            q.setOptions(options);
        }

        return QuestionDto.fromEntity(questionRepository.save(q), false);
    }

    @Transactional
    public void deleteQuestion(Long id) {
        Question q = questionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy câu hỏi với ID: " + id));
        q.setStatus("ARCHIVED");
        q.setUpdatedAt(Instant.now());
        questionRepository.save(q);
    }

    @Transactional(readOnly = true)
    public List<QuestionBankDto> getAllQuestionBanks() {
        return questionBankRepository.findByStatusOrderByCreatedAtDesc("ACTIVE").stream()
                .map(b -> {
                    List<Question> qs = questionRepository.findByBankId(b.getId());
                    return QuestionBankDto.fromEntity(b, qs.size());
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public QuestionBankDto createQuestionBank(QuestionBankDto dto, User creator) {
        QuestionBank b = QuestionBank.builder()
                .name(dto.getName())
                .code(dto.getCode() != null ? dto.getCode() : "QB-" + System.currentTimeMillis())
                .description(dto.getDescription())
                .status("ACTIVE")
                .createdBy(creator)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        if (dto.getCourseId() != null) {
            courseRepository.findById(dto.getCourseId()).ifPresent(b::setCourse);
        }
        QuestionBank saved = questionBankRepository.save(b);
        return QuestionBankDto.fromEntity(saved, 0);
    }
}
