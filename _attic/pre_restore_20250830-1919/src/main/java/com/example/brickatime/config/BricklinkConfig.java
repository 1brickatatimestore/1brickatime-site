package com.example.brickatime.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class BricklinkConfig {

    @Value("${bricklink.baseUrl}")
    private String baseUrl;

    @Value("${bricklink.inventoryEndpoint:/inventories}")
    private String inventoryEndpoint;

    @Value("${bricklink.consumerKey:}")
    private String consumerKey;

    @Value("${bricklink.consumerSecret:}")
    private String consumerSecret;

    @Value("${bricklink.token:}")
    private String token;

    @Value("${bricklink.tokenSecret:}")
    private String tokenSecret;

    public String getBaseUrl() { return baseUrl; }
    public String getInventoryEndpoint() { return inventoryEndpoint; }
    public String getConsumerKey() { return consumerKey; }
    public String getConsumerSecret() { return consumerSecret; }
    public String getToken() { return token; }
    public String getTokenSecret() { return tokenSecret; }

    public boolean hasAllCreds() {
        return !(consumerKey.isBlank() || consumerSecret.isBlank() || token.isBlank() || tokenSecret.isBlank());
    }
}