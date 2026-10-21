package com.dailyudhari.server.controller;

import com.dailyudhari.server.domain.Settlement;
import com.dailyudhari.server.service.SettlementService;
import com.dailyudhari.server.service.EmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.math.BigDecimal;
import java.security.Principal;
import com.dailyudhari.server.domain.User;
import com.dailyudhari.server.repository.UserRepository;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class SettlementController {

    private final SettlementService settlementService;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public SettlementController(SettlementService settlementService, UserRepository userRepository, EmailService emailService) {
        this.settlementService = settlementService;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    @GetMapping("/balances")
    public ResponseEntity<?> getBalances(@RequestParam(required = false) Long groupId, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        User currentUser = userRepository.findByEmail(principal.getName()).orElse(null);
        if (currentUser == null) return ResponseEntity.status(404).build();
        
        return ResponseEntity.ok(settlementService.calculateBalances(currentUser.getId(), groupId));
    }

    @PostMapping("/settlements/initiate")
    public ResponseEntity<?> initiate(@RequestBody Map<String, Object> payload, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        User payer = userRepository.findByEmail(principal.getName()).orElse(null);
        if (payer == null) return ResponseEntity.status(404).body(Map.of("message", "Payer not found"));

        try {
            Long payeeId = Long.valueOf(payload.get("payeeId").toString());
            BigDecimal amount = new BigDecimal(payload.get("amount").toString());

            User payee = userRepository.findById(payeeId)
                .orElseThrow(() -> new RuntimeException("Payee not found"));

            com.dailyudhari.server.domain.Group group = null;
            if (payload.get("groupId") != null) {
                Long groupId = Long.valueOf(payload.get("groupId").toString());
                group = new com.dailyudhari.server.domain.Group();
                group.setId(groupId);
            }

            Settlement settlement = Settlement.builder()
                .payer(payer)
                .payee(payee)
                .group(group)
                .amount(amount)
                .build();

            Settlement saved = settlementService.initiateSettlement(settlement);

            // 📧 Email payee: you have a pending payment
            if (payee.getEmail() != null) {
                emailService.sendSettlementInitiatedEmail(
                    payee.getEmail(), payee.getName(),
                    payer.getName(), amount, saved.getSettlementKey()
                );
            }

            return ResponseEntity.ok(Map.of(
                "id", saved.getId(),
                "amount", saved.getAmount(),
                "status", saved.getStatus(),
                "settlementKey", saved.getSettlementKey()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to initiate settlement: " + e.getMessage()));
        }
    }

    @PostMapping("/settlements/confirm")
    public ResponseEntity<?> confirm(@RequestBody Map<String, Object> payload) {
        try {
            Long settlementId = Long.valueOf(payload.get("settlementId").toString());
            String key = payload.get("key").toString();
            Settlement confirmed = settlementService.confirmSettlement(settlementId, key);

            // 📧 Email payer: payment was confirmed
            User payer = confirmed.getPayer();
            if (payer != null && payer.getEmail() != null) {
                emailService.sendSettlementConfirmedEmail(
                    payer.getEmail(), payer.getName(),
                    confirmed.getPayee().getName(), confirmed.getAmount()
                );
            }

            return ResponseEntity.ok(Map.of(
                "id", confirmed.getId(),
                "status", confirmed.getStatus(),
                "message", "Settlement confirmed successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/settlements/{id}/approve")
    public ResponseEntity<?> approve(@PathVariable Long id, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        User currentUser = userRepository.findByEmail(principal.getName()).orElse(null);
        if (currentUser == null) return ResponseEntity.status(404).build();

        try {
            Settlement confirmed = settlementService.approveSettlement(id, currentUser.getId());

            // 📧 Email payer: their payment was approved by payee
            User payer = confirmed.getPayer();
            if (payer != null && payer.getEmail() != null) {
                emailService.sendSettlementConfirmedEmail(
                    payer.getEmail(), payer.getName(),
                    confirmed.getPayee().getName(), confirmed.getAmount()
                );
            }

            return ResponseEntity.ok(Map.of(
                "id", confirmed.getId(),
                "status", confirmed.getStatus(),
                "message", "Settlement approved successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/settlements/pending")
    public ResponseEntity<?> getPendingSettlements(Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        User currentUser = userRepository.findByEmail(principal.getName()).orElse(null);
        if (currentUser == null) return ResponseEntity.status(404).build();

        List<Settlement> allUserSettlements = settlementService.getSettlementsForUser(currentUser.getId());
        List<Map<String, Object>> pending = allUserSettlements.stream()
            .filter(s -> "PENDING".equals(s.getStatus()))
            .map(s -> Map.of(
                "id", s.getId(),
                "amount", s.getAmount(),
                "payer", Map.of("id", s.getPayer().getId(), "name", s.getPayer().getName()),
                "payee", Map.of("id", s.getPayee().getId(), "name", s.getPayee().getName()),
                "settlementKey", s.getSettlementKey(),
                "createdAt", s.getCreatedAt() != null ? s.getCreatedAt().toString() : ""
            ))
            .collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(pending);
    }

    @GetMapping("/settlements")
    public ResponseEntity<?> getAllSettlements(Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        User currentUser = userRepository.findByEmail(principal.getName()).orElse(null);
        if (currentUser == null) return ResponseEntity.status(404).build();

        List<Settlement> allUserSettlements = settlementService.getSettlementsForUser(currentUser.getId());
        List<Map<String, Object>> mapped = allUserSettlements.stream()
            .map(s -> Map.of(
                "id", s.getId(),
                "amount", s.getAmount(),
                "payer", Map.of("id", s.getPayer().getId(), "name", s.getPayer().getName()),
                "payee", Map.of("id", s.getPayee().getId(), "name", s.getPayee().getName()),
                "status", s.getStatus(),
                "settlementKey", s.getSettlementKey() != null ? s.getSettlementKey() : "",
                "createdAt", s.getCreatedAt() != null ? s.getCreatedAt().toString() : ""
            ))
            .collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(mapped);
    }

    @GetMapping("/settlements/simplify")
    public ResponseEntity<?> getSimplifiedDebts(@RequestParam(required = false) Long groupId, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        User currentUser = userRepository.findByEmail(principal.getName()).orElse(null);
        if (currentUser == null) return ResponseEntity.status(404).build();

        try {
            return ResponseEntity.ok(settlementService.simplifyDebts(groupId));
        } catch (Exception e) {
            return ResponseEntity.ok(List.of());
        }
    }
}

