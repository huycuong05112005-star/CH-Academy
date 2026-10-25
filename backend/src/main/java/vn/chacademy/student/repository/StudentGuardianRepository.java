package vn.chacademy.student.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.chacademy.student.entity.StudentGuardian;
import vn.chacademy.student.entity.StudentGuardianId;

import java.util.List;

@Repository
public interface StudentGuardianRepository extends JpaRepository<StudentGuardian, StudentGuardianId> {

    List<StudentGuardian> findByStudentId(Long studentId);

    List<StudentGuardian> findByGuardianId(Long guardianId);

    void deleteByStudentId(Long studentId);
}
