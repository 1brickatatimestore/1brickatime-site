package com.example.brickatime.scheduler;

import com.example.brickatime.service.InventorySyncService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@EnableScheduling
public class BrickLinkSyncScheduler {

    private static final Logger log = LoggerFactory.getLogger(BrickLinkSyncScheduler.class);

    private final InventorySyncService inventorySyncService;

    public BrickLinkSyncScheduler(InventorySyncService inventorySyncService) {
        this.inventorySyncService = inventorySyncService;
    }

    // Every 5 minutes
    @Scheduled(fixedDelayString = "300000") // 300_000 ms, must be long-compatible
    public void run() {
        try {
            int upserts = inventorySyncService.syncMinifigs();
            log.info("Scheduled BrickLink sync complete, upserts={}", upserts);
        } catch (Exception e) {
            log.error("Scheduled BrickLink sync failed", e);
        }
    }
}