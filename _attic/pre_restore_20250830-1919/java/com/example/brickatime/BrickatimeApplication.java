package com.example.brickatime;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.example.brickatime")
public class BrickatimeApplication {
    public static void main(String[] args) {
        SpringApplication.run(BrickatimeApplication.class, args);
    }
}