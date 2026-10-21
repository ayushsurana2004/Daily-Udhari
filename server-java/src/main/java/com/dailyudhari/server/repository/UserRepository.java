package com.dailyudhari.server.repository;

import com.dailyudhari.server.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByMobileNumber(String mobileNumber);

    @Query("SELECT u FROM User u WHERE " +
           "(:hasName = true AND LOWER(u.name) LIKE LOWER(CONCAT('%', :query, '%'))) OR " +
           "(:hasEmail = true AND LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%'))) OR " +
           "(:hasDigits = true AND u.mobileNumber LIKE CONCAT('%', :cleanDigits, '%')) OR " +
           "(:userId IS NOT NULL AND u.id = :userId)")
    List<User> searchUsers(
            @Param("hasName") boolean hasName,
            @Param("hasEmail") boolean hasEmail,
            @Param("query") String query,
            @Param("hasDigits") boolean hasDigits,
            @Param("cleanDigits") String cleanDigits,
            @Param("userId") Long userId
    );

    @Query("SELECT u FROM User u WHERE u.mobileNumber = :raw OR u.mobileNumber = :withPlus91 OR u.mobileNumber LIKE CONCAT('%', :last10, '%')")
    List<User> findByMobileFlexible(
            @Param("raw") String raw,
            @Param("withPlus91") String withPlus91,
            @Param("last10") String last10
    );
}
