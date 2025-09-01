package com.example.brickatime.client;

import com.example.brickatime.util.OAuth1Signer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

/**
 * OAuth 1.0 signed client for BrickLink Store API.
 * We use a single method that returns raw JSON; the service maps it.
 */
@Component
public class BricklinkApiClient {

    private final WebClient webClient;
    private final OAuth1Signer signer;

    public BricklinkApiClient(
            WebClient.Builder builder,
            @Value("${bricklink.consumerKey}") String consumerKey,
            @Value("${bricklink.consumerSecret}") String consumerSecret,
            @Value("${bricklink.tokenValue}") String tokenValue,
            @Value("${bricklink.tokenSecret}") String tokenSecret
    ) {
        this.webClient = builder
                .baseUrl("https://api.bricklink.com/api/store/v1")
                .defaultHeader(HttpHeaders.ACCEPT, "application/json")
                .build();
        this.signer = new OAuth1Signer(consumerKey, consumerSecret, tokenValue, tokenSecret);
    }

    /**
     * Minimal inventory call. You can expand with paging/filters later.
     */
    public Mono<String> fetchMinifigsJson() {
        String path = "/inventories?itemType=MINIFIG";
        String auth = signer.buildAuthHeader("GET", "https://api.bricklink.com/api/store/v1" + path, null);

        return webClient.get()
                .uri(path)
                .header(HttpHeaders.AUTHORIZATION, auth)
                .retrieve()
                .bodyToMono(String.class);
    }
}