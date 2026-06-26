package com.example.courseplanner.dto;

public class UpdateTermsRequestDTO {

    private Integer currentYear;
    private String currentTerm;
    private Integer enrollingYear;
    private String enrollingTerm;

    public Integer getCurrentYear() { return currentYear; }
    public void setCurrentYear(Integer currentYear) { this.currentYear = currentYear; }

    public String getCurrentTerm() { return currentTerm; }
    public void setCurrentTerm(String currentTerm) { this.currentTerm = currentTerm; }

    public Integer getEnrollingYear() { return enrollingYear; }
    public void setEnrollingYear(Integer enrollingYear) { this.enrollingYear = enrollingYear; }

    public String getEnrollingTerm() { return enrollingTerm; }
    public void setEnrollingTerm(String enrollingTerm) { this.enrollingTerm = enrollingTerm; }
}
