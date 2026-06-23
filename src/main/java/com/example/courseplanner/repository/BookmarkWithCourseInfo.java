package com.example.courseplanner.repository;

public interface BookmarkWithCourseInfo {
    Long getBookmarkId();
    String getUserId();
    Long getDeptId();
    Long getCourseId();
    Long getSemesterCode();
    String getSection();
    String getDeptCode();
    String getCourseNumber();
    String getTitle();
}
