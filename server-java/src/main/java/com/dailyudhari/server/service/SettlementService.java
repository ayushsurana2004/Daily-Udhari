package com.dailyudhari.server.service;

import com.dailyudhari.server.domain.Settlement;
import com.dailyudhari.server.repository.SettlementRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.math.BigDecimal;
import com.dailyudhari.server.repository.ExpenseSplitRepository;
import com.dailyudhari.server.repository.UserRepository;
import com.dailyudhari.server.domain.ExpenseSplit;
import com.dailyudhari.server.domain.User;

@Service
public class SettlementService {

    private final SettlementRepository settlementRepository;
    private final ExpenseSplitRepository expenseSplitRepository;
    private final UserRepository userRepository;

    public SettlementService(SettlementRepository settlementRepository, ExpenseSplitRepository expenseSplitRepository, UserRepository userRepository) {
        this.settlementRepository = settlementRepository;
        this.expenseSplitRepository = expenseSplitRepository;
        this.userRepository = userRepository;
    }

    public List<Settlement> getSettlementsForUser(Long userId) {
        return settlementRepository.findByPayerIdOrPayeeId(userId, userId);
    }

    @Transactional
    public Settlement initiateSettlement(Settlement settlement) {
        settlement.setStatus("PENDING");
        // Generate a random 6-digit numeric settlement key
        int pin = 100000 + new Random().nextInt(900000);
        String key = String.valueOf(pin);
        settlement.setSettlementKey(key);
        return settlementRepository.save(settlement);
    }

    @Transactional
    public Settlement confirmSettlement(Long settlementId, String key) {
        Settlement settlement = settlementRepository.findById(settlementId)
                .orElseThrow(() -> new RuntimeException("Settlement not found"));
        
        if (key.equals(settlement.getSettlementKey())) {
            settlement.setStatus("CONFIRMED");
            return settlementRepository.save(settlement);
        } else {
            throw new RuntimeException("Invalid settlement key");
        }
    }

    @Transactional
    public Settlement approveSettlement(Long settlementId, Long payeeId) {
        Settlement settlement = settlementRepository.findById(settlementId)
                .orElseThrow(() -> new RuntimeException("Settlement not found"));
        
        if (!settlement.getPayee().getId().equals(payeeId)) {
            throw new RuntimeException("Only the payee can approve this settlement");
        }
        
        settlement.setStatus("CONFIRMED");
        return settlementRepository.save(settlement);
    }

    public Map<String, Object> calculateBalances(Long userId, Long groupId) {
        List<ExpenseSplit> splits = expenseSplitRepository.findInvolvedSplits(userId);
        
        BigDecimal youAreOwed = BigDecimal.ZERO;
        BigDecimal youOwe = BigDecimal.ZERO;

        for (ExpenseSplit split : splits) {
            com.dailyudhari.server.domain.Expense expense = split.getExpense();
            
            // Filter by groupId if provided
            if (groupId != null && (expense.getGroup() == null || !expense.getGroup().getId().equals(groupId))) {
                continue;
            }

            if (expense.getPayer().getId().equals(userId)) {
                // User paid, so they are owed by others (except their own share)
                if (!split.getUser().getId().equals(userId)) {
                    youAreOwed = youAreOwed.add(split.getAmount());
                }
            } else if (split.getUser().getId().equals(userId)) {
                // Someone else paid, user owes this share
                youOwe = youOwe.add(split.getAmount());
            }
        }

        // Adjust for settled payments
        List<Settlement> settlements = settlementRepository.findByPayerIdOrPayeeId(userId, userId);
        for (Settlement s : settlements) {
            // If we are filtering by groupId, skip settlements that don't belong to this group
            if (groupId != null && (s.getGroup() == null || !s.getGroup().getId().equals(groupId))) {
                continue;
            }

            if ("CONFIRMED".equals(s.getStatus())) {
                if (s.getPayer().getId().equals(userId)) {
                    // User paid a settlement, so they owe less
                    youOwe = youOwe.subtract(s.getAmount());
                } else if (s.getPayee().getId().equals(userId)) {
                    // User received a settlement, so they are owed less
                    youAreOwed = youAreOwed.subtract(s.getAmount());
                }
            }
        }

        // Prevent negative balances if someone overpaid
        if (youOwe.compareTo(BigDecimal.ZERO) < 0) youOwe = BigDecimal.ZERO;
        if (youAreOwed.compareTo(BigDecimal.ZERO) < 0) youAreOwed = BigDecimal.ZERO;

        BigDecimal totalBalance = youAreOwed.subtract(youOwe);

        return Map.of(
            "youAreOwed", youAreOwed,
            "youOwe", youOwe,
            "totalBalance", totalBalance
        );
    }

    /**
     * Calculate per-friend net balance for a given user.
     * Positive = friend owes you. Negative = you owe friend.
     */
    public Map<Long, BigDecimal> calculatePerFriendBalances(Long userId) {
        List<ExpenseSplit> splits = expenseSplitRepository.findInvolvedSplits(userId);
        Map<Long, BigDecimal> balances = new HashMap<>();

        for (ExpenseSplit split : splits) {
            com.dailyudhari.server.domain.Expense expense = split.getExpense();
            Long payerId = expense.getPayer().getId();
            Long splitUserId = split.getUser().getId();

            if (payerId.equals(userId)) {
                // I paid; this split user owes me (unless it's my own split)
                if (!splitUserId.equals(userId)) {
                    balances.merge(splitUserId, split.getAmount(), BigDecimal::add);
                }
            } else if (splitUserId.equals(userId)) {
                // Someone else paid; I owe them
                balances.merge(payerId, split.getAmount().negate(), BigDecimal::add);
            }
        }

        // Adjust for confirmed settlements
        List<Settlement> settlements = settlementRepository.findByPayerIdOrPayeeId(userId, userId);
        for (Settlement s : settlements) {
            if ("CONFIRMED".equals(s.getStatus())) {
                Long otherUserId;
                BigDecimal adjustment;
                if (s.getPayer().getId().equals(userId)) {
                    // I paid a settlement to payee -> I owe them less (positive adjustment)
                    otherUserId = s.getPayee().getId();
                    adjustment = s.getAmount();
                } else {
                    // Someone paid me -> they owe me less (negative adjustment)
                    otherUserId = s.getPayer().getId();
                    adjustment = s.getAmount().negate();
                }
                balances.merge(otherUserId, adjustment, BigDecimal::add);
            }
        }

        return balances;
    }

    /**
     * Simplify debts within a group using a greedy min-cash-flow algorithm.
     * Returns a list of {from: {id, name}, to: {id, name}, amount} objects.
     */
    public List<Map<String, Object>> simplifyDebts(Long groupId) {
        if (groupId == null) return List.of();

        // Get all expense splits for this group
        List<ExpenseSplit> allSplits = expenseSplitRepository.findAll();
        
        // Calculate net balance for each user in this group
        // Positive = net creditor, Negative = net debtor
        Map<Long, BigDecimal> netBalances = new HashMap<>();

        for (ExpenseSplit split : allSplits) {
            com.dailyudhari.server.domain.Expense expense = split.getExpense();
            if (expense.getGroup() == null || !expense.getGroup().getId().equals(groupId)) {
                continue;
            }

            Long payerId = expense.getPayer().getId();
            Long splitUserId = split.getUser().getId();

            // Payer is owed the split amount (credit)
            netBalances.merge(payerId, split.getAmount(), BigDecimal::add);
            // Split user owes the split amount (debit)
            netBalances.merge(splitUserId, split.getAmount().negate(), BigDecimal::add);
        }

        // Adjust for confirmed settlements for this group
        List<Settlement> allSettlements = settlementRepository.findAll();
        for (Settlement s : allSettlements) {
            if ("CONFIRMED".equals(s.getStatus()) && s.getGroup() != null && s.getGroup().getId().equals(groupId)) {
                Long payerId = s.getPayer().getId();
                Long payeeId = s.getPayee().getId();
                // Payer gave money, so their net balance increases (they are owed more/owe less)
                netBalances.merge(payerId, s.getAmount(), BigDecimal::add);
                // Payee received money, so their net balance decreases
                netBalances.merge(payeeId, s.getAmount().negate(), BigDecimal::add);
            }
        }

        // Build lists of debtors and creditors
        List<long[]> debtors = new ArrayList<>();  // [userId, amount_in_cents]
        List<long[]> creditors = new ArrayList<>();

        for (Map.Entry<Long, BigDecimal> entry : netBalances.entrySet()) {
            long cents = entry.getValue().multiply(BigDecimal.valueOf(100)).longValue();
            if (cents < 0) {
                debtors.add(new long[]{entry.getKey(), -cents}); // store as positive
            } else if (cents > 0) {
                creditors.add(new long[]{entry.getKey(), cents});
            }
        }

        // Greedy algorithm: match largest debtor with largest creditor
        List<Map<String, Object>> result = new ArrayList<>();
        int i = 0, j = 0;
        while (i < debtors.size() && j < creditors.size()) {
            long[] debtor = debtors.get(i);
            long[] creditor = creditors.get(j);
            long transfer = Math.min(debtor[1], creditor[1]);

            if (transfer > 0) {
                User fromUser = userRepository.findById(debtor[0]).orElse(null);
                User toUser = userRepository.findById(creditor[0]).orElse(null);

                if (fromUser != null && toUser != null) {
                    Map<String, Object> debt = new HashMap<>();
                    debt.put("from", Map.of("id", fromUser.getId(), "name", fromUser.getName()));
                    debt.put("to", Map.of("id", toUser.getId(), "name", toUser.getName()));
                    debt.put("amount", BigDecimal.valueOf(transfer).divide(BigDecimal.valueOf(100)));
                    result.add(debt);
                }
            }

            debtor[1] -= transfer;
            creditor[1] -= transfer;
            if (debtor[1] == 0) i++;
            if (creditor[1] == 0) j++;
        }

        return result;
    }
}

