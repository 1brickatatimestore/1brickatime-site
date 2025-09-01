package com.example.brickatime.util;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;
import java.util.Base64;

public final class OAuth1Signer {
    private static final SecureRandom RNG = new SecureRandom();

    private OAuth1Signer() {}

    public static String authorizationHeader(
            String method,
            String baseUrl,
            Map<String, String> queryParams,
            String consumerKey,
            String consumerSecret,
            String token,
            String tokenSecret
    ) {
        String nonce = Long.toHexString(RNG.nextLong()) + Long.toHexString(System.nanoTime());
        String timestamp = String.valueOf(Instant.now().getEpochSecond());

        Map<String, String> oauth = new LinkedHashMap<>();
        oauth.put("oauth_consumer_key", consumerKey);
        oauth.put("oauth_nonce", nonce);
        oauth.put("oauth_signature_method", "HMAC-SHA1");
        oauth.put("oauth_timestamp", timestamp);
        oauth.put("oauth_token", token);
        oauth.put("oauth_version", "1.0");

        Map<String, String> all = new TreeMap<>();
        if (queryParams != null) {
            queryParams.forEach((k, v) -> all.put(percent(k), percent(v)));
        }
        oauth.forEach((k, v) -> all.put(percent(k), percent(v)));

        String paramString = all.entrySet().stream()
                .map(e -> e.getKey() + "=" + e.getValue())
                .collect(Collectors.joining("&"));

        String baseString = percent(method.toUpperCase()) + "&" +
                percent(normalizeBaseUrl(baseUrl)) + "&" +
                percent(paramString);

        String signingKey = percent(consumerSecret) + "&" + percent(tokenSecret);
        String signature = hmacSha1Base64(baseString, signingKey);

        oauth.put("oauth_signature", signature);

        String header = "OAuth " + oauth.entrySet().stream()
                .map(e -> percent(e.getKey()) + "=\"" + percent(e.getValue()) + "\"")
                .collect(Collectors.joining(", "));

        return header;
    }

    private static String percent(String s) {
        return URLEncoder.encode(s == null ? "" : s, StandardCharsets.UTF_8)
                .replace("+", "%20").replace("*", "%2A").replace("%7E", "~");
    }

    private static String normalizeBaseUrl(String url) {
        // Remove query and fragment for base string
        int q = url.indexOf('?');
        if (q >= 0) url = url.substring(0, q);
        int h = url.indexOf('#');
        if (h >= 0) url = url.substring(0, h);
        return url;
    }

    private static String hmacSha1Base64(String data, String key) {
        try {
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA1"));
            byte[] raw = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(raw);
        } catch (Exception e) {
            throw new RuntimeException("Failed to sign OAuth1 request", e);
        }
    }
}