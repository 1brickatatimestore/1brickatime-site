package com.example.brickatime.client;

import com.example.brickatime.service.oauth.BricklinkOAuth1Signer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class BricklinkClient {

    private final WebClient webClient;
    private final String baseUrl;
    private final BricklinkOAuth1Signer signer;

    public BricklinkClient(
            WebClient.Builder builder,
            @Value("${bricklink.baseUrl}") String baseUrl,
            @Value("${bricklink.consumerKey}") String consumerKey,
            @Value("${bricklink.consumerSecret}") String consumerSecret,
            @Value("${bricklink.tokenValue}") String tokenValue,
            @Value("${bricklink.tokenSecret}") String tokenSecret
    ) {
        this.webClient = builder.build();
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.signer = new BricklinkOAuth1Signer(consumerKey, consumerSecret, tokenValue, tokenSecret);
    }

    /**
     * Fetch BrickLink store inventory for MINIFIG items.
     * Endpoint: GET /inventories?item_type=MINIFIG&limit=...&offset=...
     * Returns raw JSON string from BrickLink.
     */
    public String fetchMinifigsRaw(int limit, int offset) {
        Map<String, String> qp = new LinkedHashMap<>();
        qp.put("item_type", "MINIFIG");
        qp.put("limit", String.valueOf(limit));
        qp.put("offset", String.valueOf(offset));

        String url = UriComponentsBuilder.fromHttpUrl(baseUrl)
                .path("/inventories")
                .queryParam("item_type", "{item_type}")
                .queryParam("limit", "{limit}")
                .queryParam("offset", "{offset}")
                .buildAndExpand(qp)
                .toUriString();

        String auth = signer.buildAuthHeader("GET", url, qp);

        Mono<String> mono = webClient.get()
                .uri(url)
                .header(HttpHeaders.AUTHORIZATION, auth)
                .header(HttpHeaders.ACCEPT, "application/json")
                .retrieve()
                .bodyToMono(String.class);

        return mono.block();
    }
}