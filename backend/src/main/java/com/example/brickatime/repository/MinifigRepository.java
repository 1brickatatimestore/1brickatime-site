package com.example.brickatime.repository;

import com.example.brickatime.model.Minifig;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for Minifig documents stored in MongoDB.
 * Extends Spring Data's MongoRepository to inherit CRUD methods.
 */
public interface MinifigRepository extends MongoRepository<Minifig, String> {

    /**
     * Find a single Minifig by any one of its known identifier fields.
     * This query checks multiple possible field names to cover schema differences
     * between backups (blItemNo, itemNo, figNumber).
     */
    @Query("{ $or: [ { 'blItemNo': ?0 }, { 'itemNo': ?0 }, { 'figNumber': ?0 } ] }")
    Optional<Minifig> findByBlItemNo(String identifier);

    /**
     * Find all Minifigs that match the given identifier
     * (useful if you want a list instead of just one).
     */
    @Query("{ $or: [ { 'blItemNo': ?0 }, { 'itemNo': ?0 }, { 'figNumber': ?0 } ] }")
    List<Minifig> findAllByBlItemNo(String identifier);

    // You can add more query methods here, for example:
    // Optional<Minifig> findByFigNumber(String figNumber);
    // List<Minifig> findByTheme(String theme);
}