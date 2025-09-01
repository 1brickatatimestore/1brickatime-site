package com.example.brickatime.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class EnvWatcher {
    private static final Logger log = LoggerFactory.getLogger(EnvWatcher.class);

    @PostConstruct
    public void init() {
        if (System.getenv("MONGODB_URI") == null) {
            log.warn("⚠️ MONGODB_URI not found — defaulting to localhost.");
        }
        if (System.getenv("STRIPE_SECRET_KEY") == null) {
            log.warn("⚠️ Stripe key missing — Stripe disabled.");
        }
        if (System.getenv("PAYPAL_CLIENT_ID") == null) {
            log.warn("⚠️ PayPal creds missing — PayPal disabled.");
        }
    }
}
