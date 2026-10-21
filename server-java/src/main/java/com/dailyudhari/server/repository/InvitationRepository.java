package com.dailyudhari.server.repository;

import com.dailyudhari.server.domain.Invitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvitationRepository extends JpaRepository<Invitation, Long> {
    List<Invitation> findByReceiverIdAndStatusOrderByCreatedAtDesc(Long receiverId, String status);
    
    Optional<Invitation> findBySenderIdAndReceiverIdAndTypeAndStatus(Long senderId, Long receiverId, String type, String status);

    Optional<Invitation> findBySenderIdAndReceiverIdAndGroupIdAndStatus(Long senderId, Long receiverId, Long groupId, String status);
}
