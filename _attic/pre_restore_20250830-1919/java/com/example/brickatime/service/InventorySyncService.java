package com.example.brickatime.service;

import com.example.brickatime.client.BricklinkApiClient;
import com.example.brickatime.model.Minifig;
import com.example.brickatime.repository.MinifigRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;

/**
 * Pulls inventory from BrickLink and upserts into Mongo.
 * Uses BricklinkApiClient.fetchMinifigsJson() → parse/map (stubbed).
 */
@Service
public class InventorySyncService {

    private static final Logger log = LoggerFactory.getLogger(InventorySyncService.class);

    private final BricklinkApiClient bricklinkApiClient;
    private final MinifigRepository minifigRepository;

    public InventorySyncService(BricklinkApiClient bricklinkApiClient, MinifigRepository minifigRepository) {
        this.bricklinkApiClient = bricklinkApiClient;
        this.minifigRepository = minifigRepository;
    }

    public int syncMinifigs() {
        // 1) Fetch raw JSON (don’t fail build if BrickLink is unreachable during dev)
        String json = safeBlock(bricklinkApiClient.fetchMinifigsJson()).orElse("[]");

        // 2) TODO parse json → dtos. For now stub a couple to keep end-to-end working.
        List<Minifig> incoming = List.of(
                stub("sw001", "Luke Skywalker (Hoth)", "Star Wars", new BigDecimal("14.99"), "https://via.placeholder.co/240x200?text=Luke"),
                stub("hp001", "Harry Potter (Robes)", "Harry Potter", new BigDecimal("12.50"), "https://via.placeholder.co/240x200?text=Harry")
        );

        int upserts = 0;
        for (Minifig in : incoming) {
            if (in.getFigNumber() == null || in.getFigNumber().isBlank()) continue;

            Minifig existing = minifigRepository.findByFigNumber(in.getFigNumber());
            if (existing == null) {
                minifigRepository.save(in);
                upserts++;
            } else {
                // merge only fields we know your model exposes getters/setters for
                if (in.getName() != null) existing.setName(in.getName());
                if (in.getTheme() != null) existing.setTheme(in.getTheme());
                if (in.getPriceAUD() != null) existing.setPriceAUD(in.getPriceAUD());
                if (in.getImage() != null) existing.setImage(in.getImage());
                minifigRepository.save(existing);
                upserts++;
            }
        }
        log.info("Sync complete. Upserted {} records.", upserts);
        return upserts;
    }

    private Minifig stub(String figNo, String name, String theme, BigDecimal price, String imageUrl) {
        Minifig m = new Minifig();
        m.setFigNumber(figNo);
        m.setName(name);
        m.setTheme(theme);
        m.setPriceAUD(price);
        m.setImage(imageUrl);
        return m;
    }

    private static java.util.Optional<String> safeBlock(Mono<String> mono) {
        try {
            return java.util.Optional.ofNullable(mono.block());
        } catch (Exception e) {
            return java.util.Optional.empty();
        }
    }
}