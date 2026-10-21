package com.dailyudhari.server.controller;

import com.dailyudhari.server.domain.Expense;
import com.dailyudhari.server.service.ExpenseService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.security.Principal;
import com.dailyudhari.server.domain.User;
import com.dailyudhari.server.repository.UserRepository;
import com.dailyudhari.server.repository.GroupRepository;

@RestController
@RequestMapping("/api/expenses")
@CrossOrigin(origins = "*")
public class ExpenseController {

    private final ExpenseService expenseService;
    private final UserRepository userRepository;
    private final GroupRepository groupRepository;

    public ExpenseController(ExpenseService expenseService, UserRepository userRepository, GroupRepository groupRepository) {
        this.expenseService = expenseService;
        this.userRepository = userRepository;
        this.groupRepository = groupRepository;
    }

    @GetMapping
    public ResponseEntity<?> getExpenses(@RequestParam(required = false) Long groupId, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        User currentUser = userRepository.findByEmail(principal.getName()).orElse(null);
        if (currentUser == null) return ResponseEntity.status(404).build();

        return ResponseEntity.ok(expenseService.getRichExpensesForUser(currentUser.getId(), groupId));
    }

    @PostMapping
    public ResponseEntity<?> addExpense(@RequestBody Map<String, Object> payload, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        User currentUser = userRepository.findByEmail(principal.getName()).orElse(null);
        if (currentUser == null) return ResponseEntity.status(404).body(Map.of("message", "Payer not found"));
        
        try {
            Long payerId = currentUser.getId();
            if (payload.containsKey("payerId") && payload.get("payerId") != null) {
                payerId = Long.valueOf(payload.get("payerId").toString());
            }
            Expense savedExpense = expenseService.addExpense(payload, payerId, userRepository, groupRepository);
            return ResponseEntity.ok(savedExpense);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to add expense: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateExpense(@PathVariable Long id, @RequestBody Map<String, Object> payload, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        User currentUser = userRepository.findByEmail(principal.getName()).orElse(null);
        if (currentUser == null) return ResponseEntity.status(404).body(Map.of("message", "User not found"));
        
        try {
            Expense updatedExpense = expenseService.updateExpense(id, payload, currentUser.getId(), userRepository, groupRepository);
            return ResponseEntity.ok(updatedExpense);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to update expense: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteExpense(@PathVariable Long id, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        User currentUser = userRepository.findByEmail(principal.getName()).orElse(null);
        if (currentUser == null) return ResponseEntity.status(404).body(Map.of("message", "User not found"));
        
        try {
            expenseService.deleteExpense(id, currentUser.getId());
            return ResponseEntity.ok(Map.of("message", "Expense deleted successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to delete expense: " + e.getMessage()));
        }
    }
}
