package com.dailyudhari.server.repository;

import com.dailyudhari.server.domain.Friendship;
import com.dailyudhari.server.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendshipRepository extends JpaRepository<Friendship, Long> {
    List<Friendship> findByUser(User user);
    Optional<Friendship> findByUserAndFriend(User user, User friend);
}
