package com.example.brickatime.repository;

import com.example.brickatime.model.Minifig;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface MinifigRepository extends MongoRepository<Minifig, String> {
    List<Minifig> findByTheme(String theme);
}