package com.dailyudhari.server.domain.strategy;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public interface SplitStrategy {
    List<SplitResult> calculateSplits(BigDecimal amount, List<Long> userIds, Map<String, Object> options);
    String getType();

    record SplitResult(Long userId, BigDecimal amount) {}
    
    static SplitStrategy getStrategy(String type) {
        if (type == null) return new EqualSplitStrategy();
        switch (type.toUpperCase()) {
            case "EXACT": return new ExactSplitStrategy();
            case "PERCENT": return new PercentSplitStrategy();
            case "EQUAL":
            default: return new EqualSplitStrategy();
        }
    }
}

class EqualSplitStrategy implements SplitStrategy {
    @Override
    public List<SplitResult> calculateSplits(BigDecimal amount, List<Long> userIds, Map<String, Object> options) {
        if (userIds.isEmpty()) return new ArrayList<>();
        
        BigDecimal count = new BigDecimal(userIds.size());
        BigDecimal splitAmount = amount.divide(count, 2, RoundingMode.DOWN);
        
        List<SplitResult> splits = new ArrayList<>();
        for (Long userId : userIds) {
            splits.add(new SplitResult(userId, splitAmount));
        }

        BigDecimal totalSplit = splitAmount.multiply(count);
        if (totalSplit.compareTo(amount) != 0 && !splits.isEmpty()) {
            BigDecimal diff = amount.subtract(totalSplit);
            SplitResult first = splits.get(0);
            splits.set(0, new SplitResult(first.userId(), first.amount().add(diff)));
        }

        return splits;
    }

    @Override
    public String getType() {
        return "EQUAL";
    }
}

class ExactSplitStrategy implements SplitStrategy {
    @Override
    public List<SplitResult> calculateSplits(BigDecimal amount, List<Long> userIds, Map<String, Object> options) {
        List<SplitResult> splits = new ArrayList<>();
        if (options == null || !options.containsKey("amounts")) return splits;
        
        List<Number> amountsList = (List<Number>) options.get("amounts");
        for (int i = 0; i < userIds.size(); i++) {
            BigDecimal splitAmount = new BigDecimal(amountsList.get(i).toString());
            splits.add(new SplitResult(userIds.get(i), splitAmount));
        }
        return splits;
    }

    @Override
    public String getType() {
        return "EXACT";
    }
}

class PercentSplitStrategy implements SplitStrategy {
    @Override
    public List<SplitResult> calculateSplits(BigDecimal amount, List<Long> userIds, Map<String, Object> options) {
        List<SplitResult> splits = new ArrayList<>();
        if (options == null || !options.containsKey("percentages")) return splits;
        
        List<Number> percentages = (List<Number>) options.get("percentages");
        BigDecimal totalSplit = BigDecimal.ZERO;
        
        for (int i = 0; i < userIds.size(); i++) {
            BigDecimal pct = new BigDecimal(percentages.get(i).toString());
            BigDecimal splitAmount = amount.multiply(pct).divide(new BigDecimal("100"), 2, RoundingMode.DOWN);
            splits.add(new SplitResult(userIds.get(i), splitAmount));
            totalSplit = totalSplit.add(splitAmount);
        }

        // Adjust rounding differences on the first user
        if (totalSplit.compareTo(amount) != 0 && !splits.isEmpty()) {
            BigDecimal diff = amount.subtract(totalSplit);
            SplitResult first = splits.get(0);
            splits.set(0, new SplitResult(first.userId(), first.amount().add(diff)));
        }

        return splits;
    }

    @Override
    public String getType() {
        return "PERCENT";
    }
}
