package com.example.courseplanner.dto;

import java.util.List;

public class AdminUserDetailResponseDTO {

    private AdminUserDTO user;
    private List<AdminUserBookmarkDTO> bookmarks;

    public AdminUserDetailResponseDTO(AdminUserDTO user, List<AdminUserBookmarkDTO> bookmarks) {
        this.user = user;
        this.bookmarks = bookmarks;
    }

    public AdminUserDTO getUser() { return user; }
    public void setUser(AdminUserDTO user) { this.user = user; }

    public List<AdminUserBookmarkDTO> getBookmarks() { return bookmarks; }
    public void setBookmarks(List<AdminUserBookmarkDTO> bookmarks) { this.bookmarks = bookmarks; }
}
