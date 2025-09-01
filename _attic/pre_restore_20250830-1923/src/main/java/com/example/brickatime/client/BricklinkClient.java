package com.example.brickatime.client;

import com.example.brickatime.config.BricklinkConfig;
import com.example.brickatime.util.OAuth1Signer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import com.fasterxml.jackson.databind.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Minimal BrickLink Store API client:
 * - GET {baseUrl}{inventoryEndpoint}?limit=500&offset=0
 * - Filters to items that look like minifigs (item.no prefixes commonly used).
 * You can adapt query parameters to your store needs.
 */
@Component
public class BricklinkClient {
    private static final Logger log = LoggerFactory.getLogger(BricklinkClient.class);

    private final WebClient webClient;
    private final BricklinkConfig cfg;
    private final ObjectMapper mapper = new ObjectMapper();

    public BricklinkClient(WebClient webClient, BricklinkConfig cfg) {
        this.webClient = webClient;
        this.cfg = cfg;
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    public List<Map<String, Object>> fetchInventoryPage(int limit, int offset) {
        if (!cfg.hasAllCreds()) {
            log.warn("BrickLink credentials missing — returning empty result.");
            return Collections.emptyList();
        }

        String path = cfg.getInventoryEndpoint();
        String url = cfg.getBaseUrl() + path;

        Map<String, String> q = new LinkedHashMap<>();
        q.put("limit", String.valueOf(limit));
        q.put("offset", String.valueOf(offset));

        String auth = OAuth1Signer.authorizationHeader(
                "GET",
                url,
                q,
                cfg.getConsumerKey(),
                cfg.getConsumerSecret(),
                cfg.getToken(),
                cfg.getTokenSecret()
        );

        String fullPath = path + "?limit=" + limit + "&offset=" + offset;

        String body = webClient.get()
                .uri(fullPath)
                .accept(MediaType.APPLICATION_JSON)
                .header("Authorization", auth)
                .retrieve()
                .bodyToMono(String.class)
                .onErrorResume(err -> {
                    log.error("BrickLink fetch error: {}", err.toString());
                    return Mono.just("{}");
                })
                .block();

        return extractDataArray(body);
    }

    public List<Map<String, Object>> fetchAllInventory(int pageSize, int maxPages) {
        List<Map<String, Object>> all = new ArrayList<>();
        for (int p = 0; p < maxPages; p++) {
            int offset = p * pageSize;
            List<Map<String, Object>> page = fetchInventoryPage(pageSize, offset);
            if (page.isEmpty()) break;
            all.addAll(page);
            if (page.size() < pageSize) break;
        }
        return all;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> extractDataArray(String json) {
        try {
            JsonNode root = mapper.readTree(Optional.ofNullable(json).orElse("{}"));
            // Many BrickLink responses look like: { "meta": {...}, "data": [ ... ] }
            JsonNode data = root.get("data");
            if (data == null || !data.isArray()) return Collections.emptyList();
            List<Map<String, Object>> list = new ArrayList<>();
            for (JsonNode n : data) {
                Map<String, Object> m = mapper.convertValue(n, Map.class);
                list.add(m);
            }
            return list;
        } catch (Exception e) {
            log.error("Failed parsing BrickLink JSON", e);
            return Collections.emptyList();
        }
    }

    /** Basic quick-and-dirty minifig filter (tweak as your store requires). */
    public List<Map<String, Object>> filterToMinifigs(List<Map<String, Object>> inventory) {
        return inventory.stream().filter(m -> {
            // Typical shape: { "item": { "no": "sw123", "name": "..." }, "image_url": "...", "qty": 1, "remarks": "...", ... }
            Object itemObj = m.get("item");
            if (!(itemObj instanceof Map)) return false;
            Object noObj = ((Map<?, ?>) itemObj).get("no");
            if (noObj == null) return false;
            String no = String.valueOf(noObj).toLowerCase(Locale.ROOT);
            // Heuristic: many minifig numbers use letters+digits; adapt if needed
            // Accept if it includes a dash or letters like sw/hp/njo/adp...
            return no.matches("^[a-z]{2,}.*");
        }).collect(Collectors.toList());
    }
}