package com.example.brickatime;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@SpringBootApplication(scanBasePackages = "com.example.brickatime")
@EnableMongoRepositories(basePackages = "com.example.brickatime.repository")
public class BrickatimeApplication {
    public static void main(String[] args) {
        SpringApplication.run(BrickatimeApplication.class, args);
    }
}