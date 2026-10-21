package com.dailyudhari.server.controller;

import com.dailyudhari.server.domain.User;
import com.dailyudhari.server.repository.UserRepository;
import com.dailyudhari.server.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;
import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;
import java.security.Principal;
import com.dailyudhari.server.domain.Friendship;
import com.dailyudhari.server.domain.Invitation;
import com.dailyudhari.server.repository.FriendshipRepository;
import com.dailyudhari.server.repository.InvitationRepository;
import com.dailyudhari.server.service.SettlementService;
import com.dailyudhari.server.service.GroupService;
import com.dailyudhari.server.service.EmailService;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserRepository userRepository;
    private final AuthService authService;
    private final FriendshipRepository friendshipRepository;
    private final SettlementService settlementService;
    private final GroupService groupService;
    private final EmailService emailService;
    private final InvitationRepository invitationRepository;

    public UserController(UserRepository userRepository, 
                          AuthService authService, 
                          FriendshipRepository friendshipRepository, 
                          SettlementService settlementService, 
                          GroupService groupService, 
                          EmailService emailService,
                          InvitationRepository invitationRepository) {
        this.userRepository = userRepository;
        this.authService = authService;
        this.friendshipRepository = friendshipRepository;
        this.settlementService = settlementService;
        this.groupService = groupService;
        this.emailService = emailService;
        this.invitationRepository = invitationRepository;
    }

    private Map<String, Object> buildUserResponse(User user) {
        Map<String, Object> map = new java.util.HashMap<>();
        map.put("id", user.getId());
        map.put("name", user.getName());
        map.put("email", user.getEmail());
        map.put("mobileNumber", user.getMobileNumber() != null ? user.getMobileNumber() : "");
        map.put("userCode", String.format("DU-%05d", user.getId()));
        return map;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> payload) {
        try {
            User user = new User();
            user.setName(payload.get("name"));
            user.setEmail(payload.get("email"));
            user.setMobileNumber(payload.get("mobileNumber"));
            
            // In a real app, use PasswordEncoder! For now, store it directly or hash it simple to match login
            user.setPasswordHash(payload.get("password"));
            
            User savedUser = userRepository.save(user);
            String token = authService.generateToken(savedUser);

            // 📧 Send welcome email (async — non-blocking)
            if (savedUser.getEmail() != null) {
                emailService.sendWelcomeEmail(savedUser.getEmail(), savedUser.getName());
            }

            return ResponseEntity.ok(Map.of("user", buildUserResponse(savedUser), "token", token));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Registration failed: " + e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String mobileNumber = credentials.get("mobileNumber");
        String password = credentials.get("password");

        Optional<User> userOpt = Optional.empty();
        
        if (email != null && !email.isEmpty()) {
            userOpt = userRepository.findByEmail(email);
        } else if (mobileNumber != null && !mobileNumber.isEmpty()) {
            userOpt = userRepository.findByMobileNumber(mobileNumber);
        }

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            // Verify password (in a real app, use passwordEncoder.matches())
            if (password != null && password.equals(user.getPasswordHash())) {
                String token = authService.generateToken(user);
                return ResponseEntity.ok(Map.of("user", buildUserResponse(user), "token", token));
            }
        }
        
        return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
    }

    @GetMapping("/users/me")
    public ResponseEntity<?> getCurrentUser(Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        User currentUser = userRepository.findByEmail(principal.getName()).orElse(null);
        if (currentUser == null) return ResponseEntity.status(404).build();

        String userCode = String.format("DU-%05d", currentUser.getId());
        int friendsCount = friendshipRepository.findByUser(currentUser).size();
        int groupsCount = groupService.getGroupsForUser(currentUser.getId()).size();

        Map<String, Object> response = new java.util.HashMap<>(buildUserResponse(currentUser));
        response.put("friendsCount", friendsCount);
        response.put("groupsCount", groupsCount);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/friends")
    public ResponseEntity<?> getFriends(Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        User currentUser = userRepository.findByEmail(principal.getName()).orElse(null);
        if (currentUser == null) return ResponseEntity.status(404).build();

        List<Friendship> friendships = friendshipRepository.findByUser(currentUser);
        
        // Calculate real per-friend balances
        java.util.Map<Long, java.math.BigDecimal> perFriendBalances = settlementService.calculatePerFriendBalances(currentUser.getId());
        
        List<Map<String, Object>> friendList = new ArrayList<>();
        for (Friendship f : friendships) {
            User friend = f.getFriend();
            double balance = perFriendBalances.getOrDefault(friend.getId(), java.math.BigDecimal.ZERO).doubleValue();
            friendList.add(Map.of(
                "id", friend.getId(),
                "name", friend.getName(),
                "email", friend.getEmail(),
                "mobileNumber", friend.getMobileNumber(),
                "balance", balance
            ));
        }
        return ResponseEntity.ok(friendList);
    }

    @GetMapping("/users/search")
    public ResponseEntity<?> searchUsers(@RequestParam(name = "query", defaultValue = "") String query, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        User currentUser = userRepository.findByEmail(principal.getName()).orElse(null);
        if (currentUser == null) return ResponseEntity.status(404).build();

        String trimmed = query != null ? query.trim() : "";
        if (trimmed.length() < 2) {
            return ResponseEntity.ok(List.of());
        }

        String cleanDigits = trimmed.replaceAll("[^0-9]", "");
        boolean hasDigits = cleanDigits.length() >= 3;
        boolean hasName = trimmed.length() >= 2;
        boolean hasEmail = trimmed.contains("@") || trimmed.length() >= 3;

        Long userId = null;
        if (trimmed.toUpperCase().startsWith("DU-")) {
            try {
                userId = Long.parseLong(trimmed.substring(3).trim());
            } catch (Exception ignored) {}
        } else if (trimmed.matches("^\\d+$") && trimmed.length() <= 6) {
            try {
                userId = Long.parseLong(trimmed);
            } catch (Exception ignored) {}
        }

        List<User> matches = userRepository.searchUsers(hasName, hasEmail, trimmed, hasDigits, cleanDigits, userId);

        List<Map<String, Object>> results = matches.stream()
            .filter(u -> !u.getId().equals(currentUser.getId()))
            .limit(10)
            .map(u -> {
                Map<String, Object> map = new java.util.HashMap<>();
                map.put("id", u.getId());
                map.put("name", u.getName());
                map.put("email", u.getEmail() != null ? u.getEmail() : "");
                map.put("mobileNumber", u.getMobileNumber() != null ? u.getMobileNumber() : "");
                map.put("userCode", String.format("DU-%05d", u.getId()));
                boolean isFriend = friendshipRepository.findByUserAndFriend(currentUser, u).isPresent();
                map.put("isFriend", isFriend);
                return map;
            })
            .collect(Collectors.toList());

        return ResponseEntity.ok(results);
    }

    @PostMapping("/friends/invite")
    public ResponseEntity<?> inviteFriend(@RequestBody Map<String, Object> payload, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        User currentUser = userRepository.findByEmail(principal.getName()).orElse(null);
        if (currentUser == null) return ResponseEntity.status(404).build();

        Optional<User> friendOpt = Optional.empty();

        // 1. Direct userId if selected from search suggestions
        if (payload.containsKey("userId") && payload.get("userId") != null) {
            try {
                Long targetId = Long.valueOf(payload.get("userId").toString());
                friendOpt = userRepository.findById(targetId);
            } catch (Exception ignored) {}
        }

        // 2. Query search (supports 10-digit mobile, +91 mobile, email, DU-code, or name)
        if (friendOpt.isEmpty()) {
            Object queryObj = payload.get("query");
            if (queryObj == null || queryObj.toString().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Search query or user ID is required"));
            }
            String query = queryObj.toString().trim();

            if (query.toUpperCase().startsWith("DU-")) {
                try {
                    Long id = Long.parseLong(query.substring(3).trim());
                    friendOpt = userRepository.findById(id);
                } catch (Exception ignored) {}
            } else if (query.contains("@")) {
                friendOpt = userRepository.findByEmail(query.toLowerCase());
            } else {
                // Flexible phone number lookup (matches with or without +91, spaces, 10-digit number)
                String cleanDigits = query.replaceAll("[^0-9]", "");
                String last10 = cleanDigits.length() >= 10 ? cleanDigits.substring(cleanDigits.length() - 10) : cleanDigits;
                List<User> phoneMatches = userRepository.findByMobileFlexible(query, "+91" + last10, last10);
                if (!phoneMatches.isEmpty()) {
                    friendOpt = Optional.of(phoneMatches.get(0));
                }

                // If still not found by phone, try searching by name
                if (friendOpt.isEmpty()) {
                    List<User> nameMatches = userRepository.searchUsers(true, false, query, false, "", null);
                    if (!nameMatches.isEmpty()) {
                        friendOpt = Optional.of(nameMatches.get(0));
                    }
                }
            }
        }

        if (friendOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "User not found with provided Phone Number, Email, Name, or DU Code"));
        }

        User friend = friendOpt.get();
        if (friend.getId().equals(currentUser.getId())) {
            return ResponseEntity.badRequest().body(Map.of("message", "You cannot invite yourself"));
        }

        // Check if already friends
        if (friendshipRepository.findByUserAndFriend(currentUser, friend).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Already friends with this user"));
        }

        // Check if an invitation is already pending
        if (invitationRepository.findBySenderIdAndReceiverIdAndTypeAndStatus(currentUser.getId(), friend.getId(), "FRIEND", "PENDING").isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "A friend request to " + friend.getName() + " is already pending approval"));
        }

        // Create pending invitation
        Invitation invitation = Invitation.builder()
                .sender(currentUser)
                .receiver(friend)
                .type("FRIEND")
                .status("PENDING")
                .build();
        invitationRepository.save(invitation);

        // 📧 Notify the receiver via email
        final String friendName = friend.getName();
        final String currentUserName = currentUser.getName();
        if (friend.getEmail() != null) {
            emailService.sendFriendInviteEmail(friend.getEmail(), friendName, currentUserName);
        }

        return ResponseEntity.ok(Map.of(
            "message", "Friend invitation sent to " + friendName + "! They can approve it from their dashboard.",
            "friend", Map.of(
                "id", friend.getId(),
                "name", friend.getName(),
                "email", friend.getEmail() != null ? friend.getEmail() : "",
                "userCode", String.format("DU-%05d", friend.getId())
            )
        ));
    }

    @GetMapping("/test-email")
    public ResponseEntity<?> testEmail(@RequestParam(defaultValue = "diksha20042025@gmail.com") String to) {
        try {
            emailService.sendWelcomeEmail(to, "Test User");
            return ResponseEntity.ok(Map.of("message", "Test email dispatched to " + to));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
