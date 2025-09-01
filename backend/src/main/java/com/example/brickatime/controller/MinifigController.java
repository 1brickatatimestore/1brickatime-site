package com.example.brickatime.controller;

import com.example.brickatime.model.Minifig;
import com.example.brickatime.repository.MinifigRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;

@RestController
public class MinifigController {

    private final MinifigRepository repo;

    public MinifigController(MinifigRepository repo) {
        this.repo = repo;
    }

    /**
     * ✅ NEW: Paginated list endpoint for the frontend
     * Example: GET /api/minifigs?limit=50&page=0
     * Returns either a simple list or a Page-like shape (content/totalElements) depending on your preference.
     */
    @GetMapping("/api/minifigs")
    public Page<Minifig> list(
            @RequestParam(name = "limit", defaultValue = "50") int limit,
            @RequestParam(name = "page", defaultValue = "0") int page
    ) {
        if (limit <= 0) limit = 50;
        if (page < 0) page = 0;
        Pageable pageable = PageRequest.of(page, limit);
        // MongoRepository supports findAll(Pageable)
        Page<Minifig> p = repo.findAll(pageable);
        // If your frontend expects {content, totalElements, ...}, Page<Minifig> is perfect.
        return p;
    }

    /**
     * ✅ NEW: Single minifig by ID
     * Example: GET /api/minifigs/64f1c2...
     */
    @GetMapping("/api/minifigs/{id}")
    public Minifig byId(@PathVariable String id) {
        return repo.findById(id).orElseThrow(() ->
                new NoSuchElementException("Minifig not found: " + id));
    }

    /**
     * Existing sync endpoint you already had.
     * Keeping your mapping as-is (you can change to POST later if you want).
     */
    @GetMapping("/api/minifigs/sync")
    public String syncMinifigs() {
        // If you already had logic here, keep it.
        // Placeholder to avoid compile errors if it was empty.
        return "Sync triggered";
    }
}