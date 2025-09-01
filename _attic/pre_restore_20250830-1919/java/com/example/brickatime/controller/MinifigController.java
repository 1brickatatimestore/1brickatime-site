package com.example.brickatime.controller;

import com.example.brickatime.model.Minifig;
import com.example.brickatime.service.BrickLinkService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/minifigs")
@CrossOrigin(origins = "*")
public class MinifigController {

    private final BrickLinkService brickLinkService;

    public MinifigController(BrickLinkService brickLinkService) {
        this.brickLinkService = brickLinkService;
    }

    @GetMapping
    public ResponseEntity<Page<Minifig>> list(
            @RequestParam(required = false) String theme,
            @RequestParam(required = false) Boolean inStock,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "36") int limit,
            @RequestParam(defaultValue = "name_asc") String sort
    ) {
        return ResponseEntity.ok(brickLinkService.listByThemeAndStock(theme, inStock, page, limit, sort));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Minifig> getOne(@PathVariable String id) {
        Optional<Minifig> found = brickLinkService.getById(id);
        return found.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }
}