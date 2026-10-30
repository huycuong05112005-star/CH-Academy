package vn.chacademy.chat.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.chacademy.chat.entity.AiChannelConfig;

import java.util.Optional;

@Repository
public interface AiChannelConfigRepository extends JpaRepository<AiChannelConfig, Long> {

    Optional<AiChannelConfig> findByChannelType(String channelType);
}
