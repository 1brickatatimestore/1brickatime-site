package com.example.brickatime.repository;

import com.example.brickatime.model.Minifig;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface MinifigRepository extends MongoRepository<Minifig, String> {
    Page<Minifig> findByThemeAndInStock(String theme, Boolean inStock, Pageable pageable);
    Page<Minifig> findByTheme(String theme, Pageable pageable);
    Page<Minifig> findByInStock(Boolean inStock, Pageable pageable);

    Minifig findByFigNumber(String figNumber);
}