package com.dailyudhari.server.repository;

import com.dailyudhari.server.domain.UserGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserGroupRepository extends JpaRepository<UserGroup, UserGroup.UserGroupId> {
    List<UserGroup> findByUserId(Long userId);
    List<UserGroup> findByGroupId(Long groupId);
    Optional<UserGroup> findByUserIdAndGroupId(Long userId, Long groupId);
    void deleteByUserIdAndGroupId(Long userId, Long groupId);
}
