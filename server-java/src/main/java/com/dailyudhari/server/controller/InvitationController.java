package com.dailyudhari.server.controller;

import com.dailyudhari.server.domain.Friendship;
import com.dailyudhari.server.domain.Group;
import com.dailyudhari.server.domain.Invitation;
import com.dailyudhari.server.domain.User;
import com.dailyudhari.server.repository.FriendshipRepository;
import com.dailyudhari.server.repository.InvitationRepository;
import com.dailyudhari.server.repository.UserRepository;
import com.dailyudhari.server.service.EmailService;
import com.dailyudhari.server.service.GroupService;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/invitations")
@CrossOrigin(origins = "*")
public class InvitationController {

    private final InvitationRepository invitationRepository;
    private final UserRepository userRepository;
    private final FriendshipRepository friendshipRepository;
    private final GroupService groupService;
    private final EmailService emailService;

    public InvitationController(InvitationRepository invitationRepository,
                                UserRepository userRepository,
                                FriendshipRepository friendshipRepository,
                                GroupService groupService,
                                EmailService emailService) {
        this.invitationRepository = invitationRepository;
        this.userRepository = userRepository;
        this.friendshipRepository = friendshipRepository;
        this.groupService = groupService;
        this.emailService = emailService;
    }

    /**
     * Get pending invitations received by the current user.
     */
    @GetMapping("/pending")
    public ResponseEntity<?> getPendingInvitations(Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        User currentUser = userRepository.findByEmail(principal.getName()).orElse(null);
        if (currentUser == null) return ResponseEntity.status(404).build();

        List<Invitation> pending = invitationRepository.findByReceiverIdAndStatusOrderByCreatedAtDesc(currentUser.getId(), "PENDING");
        List<Map<String, Object>> response = new ArrayList<>();

        for (Invitation inv : pending) {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", inv.getId());
            map.put("type", inv.getType());
            map.put("status", inv.getStatus());
            map.put("createdAt", inv.getCreatedAt() != null ? inv.getCreatedAt().toString() : "");

            // Sender info
            User sender = inv.getSender();
            map.put("sender", Map.of(
                "id", sender.getId(),
                "name", sender.getName(),
                "email", sender.getEmail() != null ? sender.getEmail() : "",
                "userCode", String.format("DU-%05d", sender.getId())
            ));

            // Group info if GROUP invite
            if ("GROUP".equalsIgnoreCase(inv.getType()) && inv.getGroup() != null) {
                Group group = inv.getGroup();
                map.put("group", Map.of(
                    "id", group.getId(),
                    "name", group.getName()
                ));
            }

            response.add(map);
        }

        return ResponseEntity.ok(response);
    }

    /**
     * Accept an invitation (Friend or Group).
     */
    @PostMapping("/{id}/accept")
    @Transactional
    public ResponseEntity<?> acceptInvitation(@PathVariable Long id, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        User currentUser = userRepository.findByEmail(principal.getName()).orElse(null);
        if (currentUser == null) return ResponseEntity.status(404).build();

        Invitation invitation = invitationRepository.findById(id).orElse(null);
        if (invitation == null) {
            return ResponseEntity.status(404).body(Map.of("message", "Invitation not found"));
        }

        if (!invitation.getReceiver().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "Unauthorized to accept this invitation"));
        }

        if (!"PENDING".equalsIgnoreCase(invitation.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invitation is already " + invitation.getStatus().toLowerCase()));
        }

        invitation.setStatus("ACCEPTED");
        invitationRepository.save(invitation);

        User sender = invitation.getSender();

        if ("FRIEND".equalsIgnoreCase(invitation.getType())) {
            // Establish bidirectional friendship if not already present
            if (friendshipRepository.findByUserAndFriend(currentUser, sender).isEmpty()) {
                friendshipRepository.save(Friendship.builder().user(currentUser).friend(sender).build());
                friendshipRepository.save(Friendship.builder().user(sender).friend(currentUser).build());
            }

            // Send confirmation emails
            if (sender.getEmail() != null) {
                emailService.sendFriendAddedEmail(sender.getEmail(), sender.getName(), currentUser.getName());
            }
            if (currentUser.getEmail() != null) {
                emailService.sendFriendAddedEmail(currentUser.getEmail(), currentUser.getName(), sender.getName());
            }

            return ResponseEntity.ok(Map.of(
                "message", "Friend request accepted! " + sender.getName() + " is now in your network.",
                "type", "FRIEND"
            ));
        } else if ("GROUP".equalsIgnoreCase(invitation.getType())) {
            Group group = invitation.getGroup();
            if (group != null) {
                groupService.addMemberToGroup(group.getId(), currentUser);

                // Notify sender
                if (sender.getEmail() != null) {
                    emailService.sendGroupJoinedEmail(sender.getEmail(), sender.getName(), currentUser.getName(), group.getName());
                }
            }

            return ResponseEntity.ok(Map.of(
                "message", "Squad invite accepted! You joined " + (group != null ? group.getName() : "the squad") + ".",
                "type", "GROUP",
                "groupId", group != null ? group.getId() : 0
            ));
        }

        return ResponseEntity.ok(Map.of("message", "Invitation accepted"));
    }

    /**
     * Reject an invitation.
     */
    @PostMapping("/{id}/reject")
    @Transactional
    public ResponseEntity<?> rejectInvitation(@PathVariable Long id, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        User currentUser = userRepository.findByEmail(principal.getName()).orElse(null);
        if (currentUser == null) return ResponseEntity.status(404).build();

        Invitation invitation = invitationRepository.findById(id).orElse(null);
        if (invitation == null) {
            return ResponseEntity.status(404).body(Map.of("message", "Invitation not found"));
        }

        if (!invitation.getReceiver().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "Unauthorized to decline this invitation"));
        }

        invitation.setStatus("REJECTED");
        invitationRepository.save(invitation);

        return ResponseEntity.ok(Map.of("message", "Invitation declined"));
    }
}
