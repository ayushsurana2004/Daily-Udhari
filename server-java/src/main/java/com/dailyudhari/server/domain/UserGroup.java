package com.dailyudhari.server.domain;

import jakarta.persistence.*;
import lombok.*;
import java.io.Serializable;

@Entity
@Table(name = "user_groups")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@IdClass(UserGroup.UserGroupId.class)
public class UserGroup {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    private Group group;

    @Column(name = "settlement_key", length = 12)
    private String settlementKey;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserGroupId implements Serializable {
        private Long user;
        private Long group;
    }
}
