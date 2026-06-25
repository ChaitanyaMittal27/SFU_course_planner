package com.example.courseplanner.dto;

public class AdminBookmarkMonthDTO {

    private String month;
    private int count;

    public AdminBookmarkMonthDTO(String month, int count) {
        this.month = month;
        this.count = count;
    }

    public String getMonth() { return month; }
    public void setMonth(String month) { this.month = month; }

    public int getCount() { return count; }
    public void setCount(int count) { this.count = count; }
}
