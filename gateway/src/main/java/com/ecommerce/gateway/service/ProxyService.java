package com.ecommerce.gateway.service;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.concurrent.atomic.AtomicInteger;

@Service
public class ProxyService {

    private static final Logger log = LoggerFactory.getLogger(ProxyService.class);

    private final ServiceRegistry registry;
    private final RestTemplate restTemplate = new RestTemplate();
    private final AtomicInteger roundRobinCounter = new AtomicInteger(0);

    @Value("${service.users.url}")
    private String usersUrl;

    @Value("${service.products.primary.url}")
    private String productsPrimaryUrl;

    @Value("${service.products.replica.url}")
    private String productsReplicaUrl;

    @Value("${service.orders.url}")
    private String ordersUrl;

    public ProxyService(ServiceRegistry registry) {
        this.registry = registry;
    }

    public ResponseEntity<String> proxyUsers(String path, HttpMethod method,
                                              String body, HttpServletRequest request) {
        return proxy("users", usersUrl, path, method, body, request);
    }

    public ResponseEntity<String> proxyOrders(String path, HttpMethod method,
                                               String body, HttpServletRequest request) {
        return proxy("orders", ordersUrl, path, method, body, request);
    }

    /**
     * Round-robin entre réplicas primária e secundária do serviço de produtos.
     * Se a réplica selecionada estiver DOWN, tenta a outra.
     */
    public ResponseEntity<String> proxyProducts(String path, HttpMethod method,
                                                 String body, HttpServletRequest request) {
        int counter = roundRobinCounter.getAndIncrement();
        boolean primaryFirst = (counter % 2 == 0);

        String firstKey  = primaryFirst ? "products-primary" : "products-replica";
        String secondKey = primaryFirst ? "products-replica" : "products-primary";
        String firstUrl  = primaryFirst ? productsPrimaryUrl : productsReplicaUrl;
        String secondUrl = primaryFirst ? productsReplicaUrl : productsPrimaryUrl;

        if (registry.isUp(firstKey)) {
            log.debug("[PROXY] Products → {} (round-robin)", firstKey);
            return proxy(firstKey, firstUrl, path, method, body, request);
        } else if (registry.isUp(secondKey)) {
            log.warn("[PROXY] Products → {} (failover, {} está DOWN)", secondKey, firstKey);
            return proxy(secondKey, secondUrl, path, method, body, request);
        } else {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body("{\"error\":\"Serviço de produtos indisponível (ambas as réplicas DOWN)\"}");
        }
    }

    private ResponseEntity<String> proxy(String serviceKey, String serviceUrl, String path,
                                          HttpMethod method, String body, HttpServletRequest request) {
        if (!registry.isUp(serviceKey)) {
            log.warn("[PROXY] Serviço {} está DOWN — retornando 503", serviceKey);
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body("{\"error\":\"Serviço temporariamente indisponível\"}");
        }

        String queryString = request.getQueryString();
        String targetUrl = serviceUrl + path + (queryString != null ? "?" + queryString : "");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Repassa o token JWT para os serviços internos
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null) {
            headers.set("Authorization", authHeader);
        }

        HttpEntity<String> entity = new HttpEntity<>(body, headers);

        try {
            return restTemplate.exchange(targetUrl, method, entity, String.class);
        } catch (HttpStatusCodeException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error("[PROXY] Erro ao chamar {}: {}", targetUrl, e.getMessage());
            registry.recordFailure(serviceKey);
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body("{\"error\":\"Falha ao contatar o serviço\"}");
        }
    }
}
