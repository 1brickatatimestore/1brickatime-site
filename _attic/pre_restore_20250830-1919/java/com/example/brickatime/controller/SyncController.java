package com.example.brickatime.controller;

import com.example.brickatime.service.InventorySyncService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sync")
@CrossOrigin(origins = "*")
public class SyncController {

    private final InventorySyncService inventorySyncService;

    public SyncController(InventorySyncService inventorySyncService) {
        this.inventorySyncService = inventorySyncService;
    }

    @PostMapping
    public ResponseEntity<String> triggerSyncPost() {
        int upserts = inventorySyncService.syncMinifigs();
        return ResponseEntity.ok("✅ Sync complete. Upserted " + upserts + " records.");
    }

    // Optional GET for convenience while developing
    @GetMapping
    public ResponseEntity<String> triggerSyncGet() {
        int upserts = inventorySyncService.syncMinifigs();
        return ResponseEntity.ok("✅ Sync complete. Upserted " + upserts + " records.");
    }
}