package com.ecommerce.gateway.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Mantém o estado de saúde de cada microsserviço.
 * Thread-safe para acesso concorrente do heartbeat e das requisições.
 */
@Component
public class ServiceRegistry {

    private static final Logger log = LoggerFactory.getLogger(ServiceRegistry.class);
    private static final DateTimeFormatter FMT = DateTimeFormatter
            .ofPattern("yyyy-MM-dd HH:mm:ss")
            .withZone(ZoneId.systemDefault());

    @Value("${heartbeat.max-failures}")
    private int maxFailures;

    public enum Status { UP, DOWN }

    public static class ServiceInfo {
        public final String name;
        public final String url;
        public volatile Status status = Status.UP;
        public final AtomicInteger failureCount = new AtomicInteger(0);
        public volatile String lastCheck = "-";
        public volatile String lastEvent = "Iniciado";

        public ServiceInfo(String name, String url) {
            this.name = name;
            this.url = url;
        }
    }

    private final Map<String, ServiceInfo> services = new ConcurrentHashMap<>();

    public void register(String key, String name, String url) {
        services.put(key, new ServiceInfo(name, url));
    }

    public ServiceInfo get(String key) {
        return services.get(key);
    }

    public Map<String, ServiceInfo> getAll() {
        return services;
    }

    public void recordSuccess(String key) {
        ServiceInfo info = services.get(key);
        if (info == null) return;
        info.lastCheck = FMT.format(Instant.now());
        boolean wasDown = info.status == Status.DOWN;
        info.failureCount.set(0);
        info.status = Status.UP;
        if (wasDown) {
            info.lastEvent = "RECOVERY em " + info.lastCheck;
            log.info("[HEARTBEAT] ✅ Serviço {} RECUPERADO em {}", info.name, info.lastCheck);
        }
    }

    public void recordFailure(String key) {
        ServiceInfo info = services.get(key);
        if (info == null) return;
        info.lastCheck = FMT.format(Instant.now());
        int failures = info.failureCount.incrementAndGet();
        if (failures >= maxFailures && info.status == Status.UP) {
            info.status = Status.DOWN;
            info.lastEvent = "FALHA em " + info.lastCheck + " (tentativas: " + failures + ")";
            log.error("[HEARTBEAT] ❌ Serviço {} CAIU em {} após {} falhas consecutivas",
                    info.name, info.lastCheck, failures);
        } else if (info.status == Status.DOWN) {
            log.warn("[HEARTBEAT] ⚠️  Serviço {} continua DOWN (falha #{}) em {}",
                    info.name, failures, info.lastCheck);
        } else {
            log.warn("[HEARTBEAT] ⚠️  Serviço {} falhou ({}/{}) em {}",
                    info.name, failures, maxFailures, info.lastCheck);
        }
    }

    public boolean isUp(String key) {
        ServiceInfo info = services.get(key);
        return info != null && info.status == Status.UP;
    }
}
