package vn.chacademy.identity.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.chacademy.identity.entity.Permission;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, String> {
}
