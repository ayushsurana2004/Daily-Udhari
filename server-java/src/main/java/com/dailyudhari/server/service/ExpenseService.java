package com.dailyudhari.server.service;

import com.dailyudhari.server.domain.Expense;
import com.dailyudhari.server.repository.ExpenseRepository;
import com.dailyudhari.server.repository.ExpenseSplitRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final ExpenseSplitRepository expenseSplitRepository;

    public ExpenseService(ExpenseRepository expenseRepository, ExpenseSplitRepository expenseSplitRepository) {
        this.expenseRepository = expenseRepository;
        this.expenseSplitRepository = expenseSplitRepository;
    }

    public List<Expense> getExpensesByGroupId(Long groupId) {
        return expenseRepository.findByGroupId(groupId);
    }

    public List<java.util.Map<String, Object>> getRichExpensesForUser(Long userId, Long groupId) {
        List<com.dailyudhari.server.domain.ExpenseSplit> splits = expenseSplitRepository.findInvolvedSplits(userId);
        
        java.util.Map<Long, com.dailyudhari.server.domain.Expense> expenses = new java.util.HashMap<>();
        java.util.Map<Long, java.math.BigDecimal> userOwes = new java.util.HashMap<>();
        java.util.Map<Long, java.math.BigDecimal> userPaidForOthers = new java.util.HashMap<>();

        for (com.dailyudhari.server.domain.ExpenseSplit split : splits) {
            com.dailyudhari.server.domain.Expense expense = split.getExpense();
            if (groupId != null && (expense.getGroup() == null || !expense.getGroup().getId().equals(groupId))) {
                continue;
            }
            
            expenses.put(expense.getId(), expense);
            
            if (expense.getPayer().getId().equals(userId)) {
                if (!split.getUser().getId().equals(userId)) {
                    java.math.BigDecimal current = userPaidForOthers.getOrDefault(expense.getId(), java.math.BigDecimal.ZERO);
                    userPaidForOthers.put(expense.getId(), current.add(split.getAmount()));
                }
            } else if (split.getUser().getId().equals(userId)) {
                userOwes.put(expense.getId(), split.getAmount());
            }
        }
        
        List<java.util.Map<String, Object>> result = new java.util.ArrayList<>();
        for (com.dailyudhari.server.domain.Expense expense : expenses.values()) {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", expense.getId());
            map.put("description", expense.getDescription());
            map.put("amount", expense.getAmount());
            map.put("split_type", expense.getSplitType());
            
            if (expense.getCreatedAt() != null) {
                map.put("created_at", expense.getCreatedAt().toString());
            } else {
                map.put("created_at", java.time.LocalDateTime.now().toString());
            }
            
            map.put("payer_id", expense.getPayer().getId());
            map.put("payer_name", expense.getPayer().getName());
            boolean canEdit = expense.getPayer().getId().equals(userId);
            map.put("can_edit", canEdit);

            if (canEdit) {
                map.put("user_role", "PAID");
                map.put("user_share", userPaidForOthers.getOrDefault(expense.getId(), java.math.BigDecimal.ZERO));
            } else {
                map.put("user_role", "OWE");
                map.put("user_share", userOwes.getOrDefault(expense.getId(), java.math.BigDecimal.ZERO));
            }
            
            result.add(map);
        }
        
        result.sort((a, b) -> ((Long) b.get("id")).compareTo((Long) a.get("id")));
        
        return result;
    }

    @Transactional
    public Expense addExpense(java.util.Map<String, Object> payload, Long payerId, 
                              com.dailyudhari.server.repository.UserRepository userRepository, 
                              com.dailyudhari.server.repository.GroupRepository groupRepository) {
        
        String description = (String) payload.get("description");
        java.math.BigDecimal amount = new java.math.BigDecimal(payload.get("amount").toString());
        String splitType = (String) payload.get("splitType");
        
        com.dailyudhari.server.domain.User payer = userRepository.findById(payerId)
            .orElseThrow(() -> new RuntimeException("Payer not found"));
            
        com.dailyudhari.server.domain.Group group = null;
        if (payload.get("groupId") != null) {
            Long groupId = Long.valueOf(payload.get("groupId").toString());
            group = groupRepository.findById(groupId).orElse(null);
        }
        
        Expense expense = Expense.builder()
            .description(description)
            .amount(amount)
            .splitType(splitType)
            .payer(payer)
            .group(group)
            .build();
            
        Expense savedExpense = expenseRepository.save(expense);
        
        List<Number> userIdNumbers = (List<Number>) payload.get("userIds");
        List<Long> userIds = new java.util.ArrayList<>();
        for (Number n : userIdNumbers) userIds.add(n.longValue());
        
        java.util.Map<String, Object> options = (java.util.Map<String, Object>) payload.get("options");
        
        com.dailyudhari.server.domain.strategy.SplitStrategy strategy = 
            com.dailyudhari.server.domain.strategy.SplitStrategy.getStrategy(splitType);
        
        List<com.dailyudhari.server.domain.strategy.SplitStrategy.SplitResult> results = 
            strategy.calculateSplits(amount, userIds, options);
            
        for (com.dailyudhari.server.domain.strategy.SplitStrategy.SplitResult result : results) {
            com.dailyudhari.server.domain.User splitUser = userRepository.findById(result.userId())
                .orElseThrow(() -> new RuntimeException("User in split not found"));
                
            com.dailyudhari.server.domain.ExpenseSplit split = com.dailyudhari.server.domain.ExpenseSplit.builder()
                .expense(savedExpense)
                .user(splitUser)
                .amount(result.amount())
                .build();
            expenseSplitRepository.save(split);
        }
        
        return savedExpense;
    }

    @Transactional
    public void deleteExpense(Long expenseId, Long currentUserId) {
        Expense expense = expenseRepository.findById(expenseId)
            .orElseThrow(() -> new RuntimeException("Expense not found"));
            
        // Check authorization: ONLY the person who paid the bill can delete it!
        boolean isAuthorized = expense.getPayer().getId().equals(currentUserId);
        
        if (!isAuthorized) {
            String payerName = expense.getPayer() != null ? expense.getPayer().getName() : "the payer";
            throw new RuntimeException("Unauthorized: Only the person who paid this bill (" + payerName + ") can delete it");
        }
        
        expenseSplitRepository.deleteByExpenseId(expenseId);
        expenseRepository.delete(expense);
    }
    
    @Transactional
    public Expense updateExpense(Long expenseId, java.util.Map<String, Object> payload, Long currentUserId, 
                              com.dailyudhari.server.repository.UserRepository userRepository, 
                              com.dailyudhari.server.repository.GroupRepository groupRepository) {
                              
        Expense expense = expenseRepository.findById(expenseId)
            .orElseThrow(() -> new RuntimeException("Expense not found"));
            
        // Check authorization: ONLY the person who paid the bill can edit it!
        boolean isAuthorized = expense.getPayer().getId().equals(currentUserId);
        
        if (!isAuthorized) {
            String payerName = expense.getPayer() != null ? expense.getPayer().getName() : "the payer";
            throw new RuntimeException("Unauthorized: Only the person who paid this bill (" + payerName + ") can edit it");
        }
        
        String description = (String) payload.get("description");
        java.math.BigDecimal amount = new java.math.BigDecimal(payload.get("amount").toString());
        String splitType = (String) payload.get("splitType");
        
        expense.setDescription(description);
        expense.setAmount(amount);
        expense.setSplitType(splitType);
        
        Expense savedExpense = expenseRepository.save(expense);
        
        // Delete old splits
        expenseSplitRepository.deleteByExpenseId(expenseId);
        
        // Recalculate new splits
        List<Number> userIdNumbers = (List<Number>) payload.get("userIds");
        List<Long> userIds = new java.util.ArrayList<>();
        for (Number n : userIdNumbers) userIds.add(n.longValue());
        
        java.util.Map<String, Object> options = (java.util.Map<String, Object>) payload.get("options");
        
        com.dailyudhari.server.domain.strategy.SplitStrategy strategy = 
            com.dailyudhari.server.domain.strategy.SplitStrategy.getStrategy(splitType);
        
        List<com.dailyudhari.server.domain.strategy.SplitStrategy.SplitResult> results = 
            strategy.calculateSplits(amount, userIds, options);
            
        for (com.dailyudhari.server.domain.strategy.SplitStrategy.SplitResult result : results) {
            com.dailyudhari.server.domain.User splitUser = userRepository.findById(result.userId())
                .orElseThrow(() -> new RuntimeException("User in split not found"));
                
            com.dailyudhari.server.domain.ExpenseSplit split = com.dailyudhari.server.domain.ExpenseSplit.builder()
                .expense(savedExpense)
                .user(splitUser)
                .amount(result.amount())
                .build();
            expenseSplitRepository.save(split);
        }
        
        return savedExpense;
    }
}
