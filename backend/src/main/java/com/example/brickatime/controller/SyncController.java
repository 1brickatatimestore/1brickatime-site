package com.example.brickatime.controller;

import com.example.brickatime.service.BrickLinkService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SyncController {

    private final BrickLinkService brickLinkService;

    public SyncController(BrickLinkService brickLinkService) {
        this.brickLinkService = brickLinkService;
    }

    @GetMapping("/api/sync")
    public String syncMinifigs() {
        brickLinkService.sync();
        return "Minifigs sync started!";
    }
}
