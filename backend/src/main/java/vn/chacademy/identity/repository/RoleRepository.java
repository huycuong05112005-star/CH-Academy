package vn.chacademy.identity.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.chacademy.identity.entity.Role;

@Repository
public interface RoleRepository extends JpaRepository<Role, String> {
}
