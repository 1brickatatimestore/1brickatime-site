package com.example.brickatime.service.oauth;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.*;

public class BricklinkOAuth1Signer {
    private final String consumerKey;
    private final String consumerSecret;
    private final String token;
    private final String tokenSecret;
    private final SecureRandom rnd = new SecureRandom();

    public BricklinkOAuth1Signer(String consumerKey, String consumerSecret, String token, String tokenSecret) {
        this.consumerKey = consumerKey;
        this.consumerSecret = consumerSecret;
        this.token = token;
        this.tokenSecret = tokenSecret;
    }

    public String buildAuthHeader(String method, String url, Map<String, String> queryParams) {
        String nonce = base64Nonce();
        String timestamp = String.valueOf(Instant.now().getEpochSecond());

        Map<String, String> all = new TreeMap<>();
        if (queryParams != null) all.putAll(queryParams);

        all.put("oauth_consumer_key", consumerKey);
        all.put("oauth_nonce", nonce);
        all.put("oauth_signature_method", "HMAC-SHA1");
        all.put("oauth_timestamp", timestamp);
        all.put("oauth_token", token);
        all.put("oauth_version", "1.0");

        String baseString = method.toUpperCase() + "&" + pct(urlWithoutQuery(url)) + "&" + pct(normalized(all));
        String signingKey = pct(consumerSecret) + "&" + pct(tokenSecret);
        String signature = hmacSha1(baseString, signingKey);

        StringBuilder header = new StringBuilder("OAuth ");
        header.append(kv("oauth_consumer_key", consumerKey)).append(", ")
              .append(kv("oauth_nonce", nonce)).append(", ")
              .append(kv("oauth_signature_method", "HMAC-SHA1")).append(", ")
              .append(kv("oauth_timestamp", timestamp)).append(", ")
              .append(kv("oauth_token", token)).append(", ")
              .append(kv("oauth_version", "1.0")).append(", ")
              .append(kv("oauth_signature", signature));
        return header.toString();
    }

    private String kv(String k, String v) {
        return k + "=\"" + pct(v) + "\"";
    }

    private String urlWithoutQuery(String url) {
        int i = url.indexOf('?');
        return (i >= 0) ? url.substring(0, i) : url;
    }

    private String normalized(Map<String, String> params) {
        StringBuilder sb = new StringBuilder();
        boolean first = true;
        for (Map.Entry<String,String> e : params.entrySet()) {
            if (!first) sb.append("&");
            first = false;
            sb.append(pct(e.getKey())).append("=").append(pct(e.getValue()));
        }
        return sb.toString();
    }

    private String hmacSha1(String data, String key) {
        try {
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA1"));
            byte[] raw = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(raw);
        } catch (Exception e) {
            throw new RuntimeException("OAuth HMAC-SHA1 failure", e);
        }
    }

    private String pct(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8)
                .replace("+", "%20").replace("*", "%2A").replace("%7E", "~");
    }

    private String base64Nonce() {
        byte[] b = new byte[16];
        rnd.nextBytes(b);
        return Base64.getEncoder().encodeToString(b);
    }
}