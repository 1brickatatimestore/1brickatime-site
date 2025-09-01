package com.example.brickatime.controller;

import com.example.brickatime.service.InventorySyncService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sync")
@CrossOrigin(origins = "*")
public class SyncController {

    private static final Logger log = LoggerFactory.getLogger(SyncController.class);
    private final InventorySyncService syncService;

    public SyncController(InventorySyncService syncService) {
        this.syncService = syncService;
    }

    @GetMapping
    public ResponseEntity<String> runSync() {
        log.info("Manual sync triggered");
        int count = syncService.syncFromBricklink();
        return ResponseEntity.ok("✅ Sync complete. Upserted " + count + " records.");
    }
}