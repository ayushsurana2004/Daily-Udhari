package com.dailyudhari.server.repository;

import com.dailyudhari.server.domain.Settlement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SettlementRepository extends JpaRepository<Settlement, Long> {
    List<Settlement> findByPayerIdOrPayeeId(Long payerId, Long payeeId);
}
