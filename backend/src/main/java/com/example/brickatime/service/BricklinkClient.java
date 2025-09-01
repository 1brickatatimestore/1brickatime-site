package com.example.brickatime.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class BricklinkClient {

    private static final Logger log = LoggerFactory.getLogger(BricklinkClient.class);

    public BricklinkClient() {
        // Constructor
    }

    public void fetchInventory() {
        log.info("Fetching inventory from BrickLink API...");
        // TODO: Implement BrickLink API calls
        log.info("Inventory fetch completed.");
    }
}