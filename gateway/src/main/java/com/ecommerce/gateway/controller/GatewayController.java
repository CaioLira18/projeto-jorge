package com.ecommerce.gateway.controller;

import com.ecommerce.gateway.service.ProxyService;
import com.ecommerce.gateway.service.ServiceRegistry;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
public class GatewayController {

    private final ProxyService proxyService;
    private final ServiceRegistry registry;

    public GatewayController(ProxyService proxyService, ServiceRegistry registry) {
        this.proxyService = proxyService;
        this.registry = registry;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "ok", "service", "gateway"));
    }

    /** Dashboard de status dos serviços (JSON) */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status() {
        Map<String, Object> result = new HashMap<>();
        registry.getAll().forEach((key, info) -> {
            Map<String, Object> svc = new HashMap<>();
            svc.put("name", info.name);
            svc.put("url", info.url);
            svc.put("status", info.status.name());
            svc.put("failures", info.failureCount.get());
            svc.put("lastCheck", info.lastCheck);
            svc.put("lastEvent", info.lastEvent);
            result.put(key, svc);
        });
        return ResponseEntity.ok(result);
    }

    // ─── Rotas de Usuários ────────────────────────────────────────────────
    @PostMapping("/users/register")
    public ResponseEntity<String> registerUser(@RequestBody(required = false) String body, HttpServletRequest req) {
        return proxyService.proxyUsers("/users/register", HttpMethod.POST, body, req);
    }

    @PostMapping("/users/login")
    public ResponseEntity<String> loginUser(@RequestBody(required = false) String body, HttpServletRequest req) {
        return proxyService.proxyUsers("/users/login", HttpMethod.POST, body, req);
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<String> getUser(@PathVariable String id, HttpServletRequest req) {
        return proxyService.proxyUsers("/users/" + id, HttpMethod.GET, null, req);
    }

    // ─── Rotas de Produtos ────────────────────────────────────────────────
    @GetMapping("/products")
    public ResponseEntity<String> listProducts(HttpServletRequest req) {
        return proxyService.proxyProductsRead("/products", HttpMethod.GET, null, req);
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<String> getProduct(@PathVariable String id, HttpServletRequest req) {
        return proxyService.proxyProductsRead("/products/" + id, HttpMethod.GET, null, req);
    }

    @PostMapping("/products")
    public ResponseEntity<String> createProduct(@RequestBody(required = false) String body, HttpServletRequest req) {
        // Escrita sempre vai para a primária (que replica para a secundária)
        return proxyService.proxyProductsWrite("/products", HttpMethod.POST, body, req);
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<String> updateProduct(@PathVariable String id,
                                                @RequestBody(required = false) String body,
                                                HttpServletRequest req) {
        // Escrita sempre vai para a primária (que replica para a secundária)
        return proxyService.proxyProductsWrite("/products/" + id, HttpMethod.PUT, body, req);
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<String> deleteProduct(@PathVariable String id, HttpServletRequest req) {
        // Escrita sempre vai para a primária (que replica para a secundária)
        return proxyService.proxyProductsWrite("/products/" + id, HttpMethod.DELETE, null, req);
    }

    // ─── Rotas de Pedidos ─────────────────────────────────────────────────
    @PostMapping("/orders")
    public ResponseEntity<String> createOrder(@RequestBody(required = false) String body, HttpServletRequest req) {
        return proxyService.proxyOrders("/orders", HttpMethod.POST, body, req);
    }

    @GetMapping("/orders/{userId}")
    public ResponseEntity<String> getUserOrders(@PathVariable String userId, HttpServletRequest req) {
        return proxyService.proxyOrders("/orders/" + userId, HttpMethod.GET, null, req);
    }
}
