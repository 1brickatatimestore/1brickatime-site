package com.example.brickatime.service;

import com.example.brickatime.model.Minifig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class InventorySyncService {

    private static final Logger log = LoggerFactory.getLogger(InventorySyncService.class);

    public InventorySyncService() {
        // Constructor
    }

    public void syncInventory(List<Minifig> figs) {
        for (Minifig fig : figs) {
            log.info("Syncing Minifig: {} | Qty: {} | Price: {}", fig.getName(), fig.getQty(), fig.getPrice());
        }
        log.info("Inventory sync completed successfully.");
    }
}