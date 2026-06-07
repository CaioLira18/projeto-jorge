package com.ecommerce.gateway.heartbeat;

import com.ecommerce.gateway.service.ServiceRegistry;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Envia GET /health a cada 5 segundos para cada microsserviço registrado.
 * Após 2 falhas consecutivas, marca o serviço como DOWN no ServiceRegistry.
 * Quando o serviço volta a responder, loga a recuperação.
 */
@Component
public class HeartbeatScheduler {

    private final ServiceRegistry registry;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${service.users.url}")
    private String usersUrl;

    @Value("${service.products.primary.url}")
    private String productsPrimaryUrl;

    @Value("${service.products.replica.url}")
    private String productsReplicaUrl;

    @Value("${service.orders.url}")
    private String ordersUrl;

    public HeartbeatScheduler(ServiceRegistry registry) {
        this.registry = registry;
    }

    @PostConstruct
    public void init() {
        registry.register("users",            "Users Service",            usersUrl);
        registry.register("products-primary", "Products Primary (:5002)", productsPrimaryUrl);
        registry.register("products-replica", "Products Replica (:5012)", productsReplicaUrl);
        registry.register("orders",           "Orders Service",           ordersUrl);
    }

    @Scheduled(fixedDelayString = "${heartbeat.interval}")
    public void checkAll() {
        registry.getAll().forEach((key, info) -> {
            try {
                var response = restTemplate.getForEntity(info.url + "/health", Map.class);
                if (response.getStatusCode().is2xxSuccessful()) {
                    registry.recordSuccess(key);
                } else {
                    registry.recordFailure(key);
                }
            } catch (Exception e) {
                registry.recordFailure(key);
            }
        });
    }
}
