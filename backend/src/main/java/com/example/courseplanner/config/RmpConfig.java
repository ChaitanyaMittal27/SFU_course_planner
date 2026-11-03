package com.example.courseplanner.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

/** Rate My Professors wiring: search threads and the clock used for lookup timestamps. */
@Configuration
public class RmpConfig {

    /** One thread per school is enough; extra searches queue briefly. */
    private static final int SEARCH_THREADS = 5;

    @Bean(name = "rmpSearchExecutor", destroyMethod = "shutdownNow")
    public ExecutorService rmpSearchExecutor() {
        AtomicInteger count = new AtomicInteger();
        return Executors.newFixedThreadPool(SEARCH_THREADS, runnable -> {
            Thread thread = new Thread(runnable, "rmp-search-" + count.incrementAndGet());
            thread.setDaemon(true);
            return thread;
        });
    }

    /** Separate bean so tests can fix "now" (no-match retry after 7 days). */
    @Bean(name = "rmpClock")
    public Clock rmpClock() {
        return Clock.systemUTC();
    }
}
