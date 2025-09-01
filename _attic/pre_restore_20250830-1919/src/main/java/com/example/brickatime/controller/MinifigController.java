package com.example.brickatime.controller;

import com.example.brickatime.model.Minifig;
import com.example.brickatime.repository.MinifigRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/minifigs")
@CrossOrigin(origins = "*")
public class MinifigController {

    private static final Logger log = LoggerFactory.getLogger(MinifigController.class);
    private final MinifigRepository minifigRepository;

    public MinifigController(MinifigRepository minifigRepository) {
        this.minifigRepository = minifigRepository;
    }

    @GetMapping
    public ResponseEntity<List<Minifig>> getAllMinifigs(
            @RequestParam(value = "theme", required = false) String theme,
            @RequestParam(value = "inStock", required = false) Boolean inStock
    ) {
        log.info("Fetching minifigs theme={} inStock={}", theme, inStock);

        List<Minifig> list = (theme != null && !theme.isBlank())
                ? minifigRepository.findByTheme(theme)
                : minifigRepository.findAll();

        if (inStock != null) {
            if (inStock) list = list.stream().filter(m -> m.getQty() > 0).collect(Collectors.toList());
            else list = list.stream().filter(m -> m.getQty() <= 0).collect(Collectors.toList());
        }
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Minifig> getMinifigById(@PathVariable String id) {
        log.info("Fetching details for minifig {}", id);
        Optional<Minifig> minifig = minifigRepository.findById(id);
        return minifig.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }
}