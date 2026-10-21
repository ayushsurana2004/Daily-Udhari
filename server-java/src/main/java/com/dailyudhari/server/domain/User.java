package com.dailyudhari.server.domain;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.List;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(unique = true)
    private String email;
    
    @Column(name = "mobile_number", unique = true)
    private String mobileNumber;
    
    @JsonIgnore
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;
}

