package com.example.courseplanner.model;

import java.util.regex.Pattern;
import java.util.regex.Matcher;

public class CourseSysOffering {
    private String section;
    private String instructor;
    private String enrolled;
    private String capacity;
    private String campus;
    private String infoUrl;

    // getters / setters
    public String getSection() {
        return section;
    }

    public void setSection(String section) {
        this.section = section;
    }

    public String getInstructor() {
        return instructor;
    }

    public void setInstructor(String instructor) {
        this.instructor = instructor;
    }

    public String getEnrolled() {
        return enrolled;
    }

    public void setEnrolled(String enrolled) {
        this.enrolled = enrolled;
    }

    public String getCapacity() {
        return capacity;
    }

    public void setCapacity(String capacity) {
        this.capacity = capacity;
    }

    public String getCampus() {
        return campus;
    }

    public void setCampus(String campus) {
        this.campus = campus;
    }

    public String getInfoUrl() {
        return infoUrl;
    }

    public void setInfoUrl(String infoUrl) {
        this.infoUrl = infoUrl;
    }

    public int getEnrolledCount() {
        return parseWithWaitlist(enrolled);
    }

    public int getCapacityCount() {
        return parsePlainNumber(capacity);
    }

    private int parseWithWaitlist(String raw) {
        if (raw == null) return 0;

        // Match numbers like "115", "115 (+31)"
        // Groups: base, waitlist (optional)
        Pattern p = Pattern.compile("(\\d+)(?:\\s*\\(\\+(\\d+)\\))?");
        Matcher m = p.matcher(raw.trim());

        if (!m.matches()) return 0;

        int base = Integer.parseInt(m.group(1));
        int waitlist = (m.group(2) != null) ? Integer.parseInt(m.group(2)) : 0;

        return base + waitlist;
    }

   public Long getLoadPercent() {
        int enrolled = getEnrolledCount();   // includes waitlist
        int capacity = getCapacityCount();

        if (capacity <= 0) return 0L;

        return Math.round((enrolled * 100.0) / capacity);
    }

    private int parsePlainNumber(String raw) {
        if (raw == null) return 0;

        Pattern p = Pattern.compile("(\\d+)");
        Matcher m = p.matcher(raw.trim());

        if (!m.find()) return 0;

        return Integer.parseInt(m.group(1));
    }
}
