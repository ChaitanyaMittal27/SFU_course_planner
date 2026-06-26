package com.example.courseplanner.dto;

public class ApiContactDTO {

    private String name;
    private String email;
    private String reason;
    private String message;

    public ApiContactDTO() {}

    public ApiContactDTO(String name, String email, String message) {
        this.name = name;
        this.email = email;
        this.message = message;
    }

    public ApiContactDTO(String name, String email, String reason, String message) {
        this.name = name;
        this.email = email;
        this.reason = reason;
        this.message = message;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}