package com.dailyudhari.server.repository;

import com.dailyudhari.server.domain.ExpenseSplit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExpenseSplitRepository extends JpaRepository<ExpenseSplit, Long> {
    List<ExpenseSplit> findByExpenseId(Long expenseId);
    List<ExpenseSplit> findByUserId(Long userId);
    
    @org.springframework.data.jpa.repository.Query("SELECT es FROM ExpenseSplit es JOIN FETCH es.expense e WHERE (es.user.id = :userId OR e.payer.id = :userId)")
    List<ExpenseSplit> findInvolvedSplits(@org.springframework.data.repository.query.Param("userId") Long userId);
    
    @org.springframework.transaction.annotation.Transactional
    void deleteByExpenseId(Long expenseId);
}
