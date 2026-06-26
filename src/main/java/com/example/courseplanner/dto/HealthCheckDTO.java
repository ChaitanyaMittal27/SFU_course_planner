package com.example.courseplanner.dto;

public class HealthCheckDTO {

    private String service;
    private String status;
    private long latencyMs;
    private String url;

    public HealthCheckDTO(String service, String status, long latencyMs, String url) {
        this.service = service;
        this.status = status;
        this.latencyMs = latencyMs;
        this.url = url;
    }

    public String getService() {
        return service;
    }

    public void setService(String service) {
        this.service = service;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public long getLatencyMs() {
        return latencyMs;
    }

    public void setLatencyMs(long latencyMs) {
        this.latencyMs = latencyMs;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }
}
