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
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> createOrder(
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        Claims claims = extractClaims(authHeader);
        if (claims == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Token JWT obrigatório"));
        }

        try {
            String userId = claims.getSubject();
            List<Map<String, Object>> items = (List<Map<String, Object>>) body.get("items");
            String paymentMethod = (String) body.get("paymentMethod");

            if (items == null || items.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "items é obrigatório e não pode ser vazio"));
            }
            if (paymentMethod == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "paymentMethod é obrigatório"));
            }

            Order order = orderService.createOrder(userId, items, paymentMethod);
            return ResponseEntity.status(HttpStatus.CREATED).body(order);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Corpo da requisição inválido"));
        }
    }

    @GetMapping("/orders/detail/{orderId}")
    public ResponseEntity<?> getOrderById(
            @PathVariable String orderId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        Claims claims = extractClaims(authHeader);
        if (claims == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Token JWT obrigatório"));
        }

        String requesterId = claims.getSubject();
        String role = (String) claims.get("role");

        return orderService.findById(orderId)
                .map(order -> {
                    if (!order.getUserId().equals(requesterId) && !"admin".equals(role)) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body((Object) Map.of("error", "Acesso negado"));
                    }
                    return ResponseEntity.ok((Object) order);
                })
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Pedido não encontrado")));
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

        if (!requesterId.equals(userId) && !"admin".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Acesso negado"));
        }

        List<Order> orders = orderService.findByUserId(userId);
        return ResponseEntity.ok(orders);
    }

    private Claims extractClaims(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer "))
            return null;
        try {
            return jwtService.validateToken(authHeader.substring(7));
        } catch (Exception e) {
            return null;
        }
    }
}
