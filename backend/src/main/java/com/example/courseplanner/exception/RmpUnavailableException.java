package com.example.courseplanner.exception;

/**
 * Rate My Professors could not be reached or returned an unusable response.
 *
 * Thrown only by the strict client methods used for matching, so that an
 * outage is never mistaken for "no professor found". Callers turn it into an
 * UNAVAILABLE response and store nothing.
 */
public class RmpUnavailableException extends RuntimeException {

    public RmpUnavailableException(String message) {
        super(message);
    }

    public RmpUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
