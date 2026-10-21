package com.dailyudhari.server.service;

import com.dailyudhari.server.domain.Group;
import com.dailyudhari.server.domain.UserGroup;
import com.dailyudhari.server.repository.GroupRepository;
import com.dailyudhari.server.repository.UserGroupRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.math.BigDecimal;

@Service
public class GroupService {

    private final GroupRepository groupRepository;
    private final UserGroupRepository userGroupRepository;
    private final SettlementService settlementService;

    public GroupService(GroupRepository groupRepository, 
                        UserGroupRepository userGroupRepository,
                        SettlementService settlementService) {
        this.groupRepository = groupRepository;
        this.userGroupRepository = userGroupRepository;
        this.settlementService = settlementService;
    }

    public List<Group> getGroupsForUser(Long userId) {
        return userGroupRepository.findByUserId(userId).stream()
                .map(UserGroup::getGroup)
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public Group createGroup(Group group) {
        return groupRepository.save(group);
    }

    public List<UserGroup> getGroupMembers(Long groupId) {
        return userGroupRepository.findByGroupId(groupId);
    }

    @Transactional
    public void addMemberToGroup(Long groupId, com.dailyudhari.server.domain.User user) {
        Group group = groupRepository.findById(groupId).orElseThrow(() -> new RuntimeException("Group not found"));
        UserGroup userGroup = UserGroup.builder()
                .group(group)
                .user(user)
                .build();
        userGroupRepository.save(userGroup);
    }

    /**
     * Exit a group only if the user has settled everything (owes ₹0 and is owed ₹0).
     */
    @Transactional
    public void exitGroup(Long groupId, Long userId) {
        // 1. Calculate balances for this user in the specified group
        Map<String, Object> balances = settlementService.calculateBalances(userId, groupId);
        BigDecimal youOwe = (BigDecimal) balances.get("youOwe");
        BigDecimal youAreOwed = (BigDecimal) balances.get("youAreOwed");

        if (youOwe != null && youOwe.compareTo(BigDecimal.ZERO) > 0) {
            throw new IllegalStateException("You cannot exit this group because you owe ₹" 
                + youOwe.stripTrailingZeros().toPlainString() + ". Please settle your dues before leaving.");
        }

        if (youAreOwed != null && youAreOwed.compareTo(BigDecimal.ZERO) > 0) {
            throw new IllegalStateException("You cannot exit this group because you are owed ₹" 
                + youAreOwed.stripTrailingZeros().toPlainString() + ". Please collect or settle your balance with group members before leaving.");
        }

        // 2. Locate user group membership
        UserGroup userGroup = userGroupRepository.findByUserIdAndGroupId(userId, groupId)
                .orElseThrow(() -> new IllegalArgumentException("You are not a member of this group"));

        // 3. Remove user membership
        userGroupRepository.delete(userGroup);
    }
}
