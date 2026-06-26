package com.example.courseplanner.dto;

public class AdminTermDTO {

    private Long termId;
    private Integer year;
    private String term;
    private Boolean isCurrent;
    private Boolean isEnrolling;
    private String updatedAt;

    public AdminTermDTO(Long termId, Integer year, String term, Boolean isCurrent, Boolean isEnrolling, String updatedAt) {
        this.termId = termId;
        this.year = year;
        this.term = term;
        this.isCurrent = isCurrent;
        this.isEnrolling = isEnrolling;
        this.updatedAt = updatedAt;
    }

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

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
