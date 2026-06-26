package com.example.courseplanner.dto;

public class AdminContactSubmissionDTO {

    private String id;
    private String name;
    private String email;
    private String reason;
    private String message;
    private Boolean isRead;
    private Boolean isArchived;
    private Boolean isReplied;
    private String replyMessage;
    private String replySentTo;
    private String repliedAt;
    private String submittedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Boolean getIsRead() { return isRead; }
    public void setIsRead(Boolean isRead) { this.isRead = isRead; }

    public Boolean getIsArchived() { return isArchived; }
    public void setIsArchived(Boolean isArchived) { this.isArchived = isArchived; }

    public Boolean getIsReplied() { return isReplied; }
    public void setIsReplied(Boolean isReplied) { this.isReplied = isReplied; }

    public String getReplyMessage() { return replyMessage; }
    public void setReplyMessage(String replyMessage) { this.replyMessage = replyMessage; }

    public String getReplySentTo() { return replySentTo; }
    public void setReplySentTo(String replySentTo) { this.replySentTo = replySentTo; }

    public String getRepliedAt() { return repliedAt; }
    public void setRepliedAt(String repliedAt) { this.repliedAt = repliedAt; }

    public String getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(String submittedAt) { this.submittedAt = submittedAt; }
}
