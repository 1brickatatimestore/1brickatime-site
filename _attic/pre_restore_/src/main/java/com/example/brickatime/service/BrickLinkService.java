package com.example.brickatime.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class BrickLinkService {

    private static final Logger log = LoggerFactory.getLogger(BrickLinkService.class);

    public void sync() {
        log.info("=== BrickLink Sync Started ===");
        try {
            simulateBrickLinkSync();
            log.info("=== BrickLink Sync Completed Successfully ===");
        } catch (Exception ex) {
            log.error("BrickLink sync failed", ex);
            throw new RuntimeException("BrickLink sync failed", ex);
        }
    }

    private void simulateBrickLinkSync() throws InterruptedException {
        log.debug("Simulating BrickLink API calls...");
        Thread.sleep(1000);
        log.debug("Simulation complete.");
    }
}
