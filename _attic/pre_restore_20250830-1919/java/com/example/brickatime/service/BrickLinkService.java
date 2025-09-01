package com.example.brickatime.service;

import com.example.brickatime.model.Minifig;
import com.example.brickatime.repository.MinifigRepository;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class BrickLinkService {

    private final MinifigRepository repo;

    public BrickLinkService(MinifigRepository repo) {
        this.repo = repo;
    }

    public Page<Minifig> listByThemeAndStock(String theme, Boolean inStock, int page, int limit, String sort) {
        Sort sortSpec = parseSort(sort);
        Pageable pageable = PageRequest.of(Math.max(page - 1, 0), Math.max(limit, 1), sortSpec);

        if (theme != null && !theme.isBlank() && inStock != null) {
            return repo.findByThemeAndInStock(theme, inStock, pageable);
        } else if (theme != null && !theme.isBlank()) {
            return repo.findByTheme(theme, pageable);
        } else if (inStock != null) {
            return repo.findByInStock(inStock, pageable);
        } else {
            return repo.findAll(pageable);
        }
    }

    public Optional<Minifig> getById(String id) {
        return repo.findById(id);
    }

    private Sort parseSort(String sort) {
        if (sort == null || sort.isBlank()) return Sort.by(Sort.Order.asc("name"));
        String[] parts = sort.split("_", 2);
        String field = parts[0];
        String dir = (parts.length > 1) ? parts[1] : "asc";
        return "desc".equalsIgnoreCase(dir)
                ? Sort.by(Sort.Order.desc(field))
                : Sort.by(Sort.Order.asc(field));
    }
}