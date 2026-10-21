package com.dailyudhari.server.controller;

import com.dailyudhari.server.domain.Group;
import com.dailyudhari.server.service.GroupService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.dailyudhari.server.domain.UserGroup;
import com.dailyudhari.server.domain.User;
import com.dailyudhari.server.repository.UserRepository;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.security.Principal;

import com.dailyudhari.server.domain.Invitation;
import com.dailyudhari.server.repository.GroupRepository;
import com.dailyudhari.server.repository.InvitationRepository;
import com.dailyudhari.server.repository.UserGroupRepository;
import com.dailyudhari.server.service.EmailService;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/groups")
@CrossOrigin(origins = "*")
public class GroupController {

    private final GroupService groupService;
    private final UserRepository userRepository;
    private final GroupRepository groupRepository;
    private final UserGroupRepository userGroupRepository;
    private final InvitationRepository invitationRepository;
    private final EmailService emailService;

    public GroupController(GroupService groupService,
                           UserRepository userRepository,
                           GroupRepository groupRepository,
                           UserGroupRepository userGroupRepository,
                           InvitationRepository invitationRepository,
                           EmailService emailService) {
        this.groupService = groupService;
        this.userRepository = userRepository;
        this.groupRepository = groupRepository;
        this.userGroupRepository = userGroupRepository;
        this.invitationRepository = invitationRepository;
        this.emailService = emailService;
    }

    @GetMapping
    public ResponseEntity<List<Group>> getUserGroups(Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        User currentUser = userRepository.findByEmail(principal.getName()).orElse(null);
        if (currentUser == null) return ResponseEntity.status(404).build();
        
        return ResponseEntity.ok(groupService.getGroupsForUser(currentUser.getId()));
    }

    @PostMapping
    public ResponseEntity<?> createGroup(@RequestBody Group group, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        User currentUser = userRepository.findByEmail(principal.getName()).orElse(null);
        if (currentUser == null) return ResponseEntity.status(404).build();
        
        group.setCreatedBy(currentUser);
        Group savedGroup = groupService.createGroup(group);
        
        // Automatically add the creator as a member
        groupService.addMemberToGroup(savedGroup.getId(), currentUser);
        
        return ResponseEntity.ok(savedGroup);
    }

    @GetMapping("/{groupId}/members")
    public ResponseEntity<?> getGroupMembers(@PathVariable Long groupId) {
        List<UserGroup> userGroups = groupService.getGroupMembers(groupId);
        List<User> members = userGroups.stream().map(UserGroup::getUser).collect(Collectors.toList());
        return ResponseEntity.ok(members);
    }

    @PostMapping("/add-member")
    public ResponseEntity<?> addMember(@RequestBody Map<String, Object> payload, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        User currentUser = userRepository.findByEmail(principal.getName()).orElse(null);
        if (currentUser == null) return ResponseEntity.status(404).build();

        Long groupId = Long.valueOf(payload.get("groupId").toString());
        Long userId = Long.valueOf(payload.get("userId").toString());

        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if already a member
        if (userGroupRepository.findByUserIdAndGroupId(userId, groupId).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", user.getName() + " is already in this squad"));
        }

        // Check if invitation is already pending
        if (invitationRepository.findBySenderIdAndReceiverIdAndGroupIdAndStatus(currentUser.getId(), userId, groupId, "PENDING").isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "An invitation has already been sent to " + user.getName()));
        }

        // Create Invitation
        Invitation invitation = Invitation.builder()
                .sender(currentUser)
                .receiver(user)
                .type("GROUP")
                .group(group)
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .build();
        invitationRepository.save(invitation);

        // Send Email asynchronously
        if (user.getEmail() != null) {
            emailService.sendGroupInviteEmail(user.getEmail(), user.getName(), currentUser.getName(), group.getName());
        }

        return ResponseEntity.ok(Map.of("message", "Squad invitation sent to " + user.getName() + "! They can approve it from their dashboard."));
    }

    @PostMapping("/{groupId}/exit")
    public ResponseEntity<?> exitGroup(@PathVariable Long groupId, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        User currentUser = userRepository.findByEmail(principal.getName()).orElse(null);
        if (currentUser == null) return ResponseEntity.status(404).build();

        try {
            groupService.exitGroup(groupId, currentUser.getId());
            return ResponseEntity.ok(Map.of("message", "Successfully exited group"));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to exit group: " + e.getMessage()));
        }
    }
}
