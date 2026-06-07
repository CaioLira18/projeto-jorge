package com.ecommerce.orders.controller;

import com.ecommerce.orders.model.Order;
import com.ecommerce.orders.security.JwtService;
import com.ecommerce.orders.service.OrderService;
import io.jsonwebtoken.Claims;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class OrderController {

    private final OrderService orderService;
    private final JwtService jwtService;

    public OrderController(OrderService orderService, JwtService jwtService) {
        this.orderService = orderService;
        this.jwtService = jwtService;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "ok", "service", "orders"));
    }

    @PostMapping("/orders")
    public ResponseEntity<?> createOrder(
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        Claims claims = extractClaims(authHeader);
        if (claims == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Token JWT obrigatório"));
        }

        try {
            String userId = claims.getSubject();
            String productId = (String) body.get("productId");
            int quantity = ((Number) body.getOrDefault("quantity", 1)).intValue();

            if (productId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "productId é obrigatório"));
            }

            Order order = orderService.createOrder(userId, productId, quantity);
            return ResponseEntity.status(HttpStatus.CREATED).body(order);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/orders/{userId}")
    public ResponseEntity<?> getUserOrders(
            @PathVariable String userId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        Claims claims = extractClaims(authHeader);
        if (claims == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Token JWT obrigatório"));
        }

        String requesterId = claims.getSubject();
        String role = (String) claims.get("role");

        // Usuário só vê os próprios pedidos, admin vê de qualquer um
        if (!requesterId.equals(userId) && !"admin".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Acesso negado"));
        }

        List<Order> orders = orderService.findByUserId(userId);
        return ResponseEntity.ok(orders);
    }

    private Claims extractClaims(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        try {
            return jwtService.validateToken(authHeader.substring(7));
        } catch (Exception e) {
            return null;
        }
    }
}
