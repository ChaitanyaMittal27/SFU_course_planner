// src/main/java/com/example/courseplanner/entity/Term.java
package com.example.courseplanner.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "terms")
public class Term {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "term_id")
    private Long termId;
    
    @Column(nullable = false)
    private Integer year;
    
    @Column(nullable = false, length = 10)
    private String term; // 'spring', 'summer', 'fall'
    
    @Column(name = "is_current")
    private Boolean isCurrent = false;
    
    @Column(name = "is_enrolling")
    private Boolean isEnrolling = false;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Constructors
    public Term() {}
    
    public Term(Integer year, String term) {
        this.year = year;
        this.term = term;
    }
    
    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getTermId() { return termId; }
    public void setTermId(Long termId) { this.termId = termId; }
    
    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }
    
    public String getTerm() { return term; }
    public void setTerm(String term) { this.term = term; }
    
    public Boolean getIsCurrent() { return isCurrent; }
    public void setIsCurrent(Boolean isCurrent) { this.isCurrent = isCurrent; }
    
    public Boolean getIsEnrolling() { return isEnrolling; }
    public void setIsEnrolling(Boolean isEnrolling) { this.isEnrolling = isEnrolling; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}