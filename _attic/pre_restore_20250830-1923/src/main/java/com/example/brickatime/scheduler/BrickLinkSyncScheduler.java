package com.example.brickatime.scheduler;

import com.example.brickatime.service.BrickLinkService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class BrickLinkSyncScheduler {

    private static final Logger log = LoggerFactory.getLogger(BrickLinkSyncScheduler.class);

    private final BrickLinkService brickLinkService;

    public BrickLinkSyncScheduler(BrickLinkService brickLinkService) {
        this.brickLinkService = brickLinkService;
    }

    @Scheduled(fixedDelay = 3600000) // Every hour
    public void runSync() {
        log.info("Scheduled BrickLink sync started...");
        brickLinkService.sync();
        log.info("Scheduled BrickLink sync completed.");
    }
}