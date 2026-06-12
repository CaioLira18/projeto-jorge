package com.ecommerce.products.controller;

import com.ecommerce.products.model.Product;
import com.ecommerce.products.security.JwtService;
import com.ecommerce.products.service.ProductService;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
public class ProductController {

    private final ProductService productService;
    private final JwtService jwtService;

    @Value("${server.port}")
    private String serverPort;

    public ProductController(ProductService productService, JwtService jwtService) {
        this.productService = productService;
        this.jwtService = jwtService;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "ok", "service", "products", "port", serverPort));
    }

    @GetMapping("/products")
    public ResponseEntity<List<Product>> listProducts() {
        return ResponseEntity.ok(productService.findAll());
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<?> getProduct(@PathVariable String id) {
        Optional<Product> product = productService.findById(id);
        if (product.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Produto não encontrado"));
        }
        return ResponseEntity.ok(product.get());
    }

    @PostMapping("/products")
    public ResponseEntity<?> createProduct(
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Token JWT obrigatório"));
        }

        try {
            String token = authHeader.substring(7);
            Claims claims = jwtService.validateToken(token);
            String role = (String) claims.get("role");

            if (!"admin".equals(role)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Apenas administradores podem criar produtos"));
            }

            String name = (String) body.get("name");
            String description = (String) body.getOrDefault("description", "");
            double price = ((Number) body.get("price")).doubleValue();
            int stock = ((Number) body.getOrDefault("stock", 0)).intValue();
            String imageUrl = (String) body.getOrDefault("imageUrl", "");

            if (name == null || body.get("price") == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "name e price são obrigatórios"));
            }

            Product product = productService.create(name, description, price, stock, imageUrl);
            return ResponseEntity.status(HttpStatus.CREATED).body(product);

        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Token inválido ou expirado"));
        }
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<?> updateProduct(
            @PathVariable String id,
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Token JWT obrigatório"));
        }

        try {
            String token = authHeader.substring(7);
            Claims claims = jwtService.validateToken(token);
            String role = (String) claims.get("role");

            if (!"admin".equals(role)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Apenas administradores podem editar produtos"));
            }

            if (productService.findById(id).isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Produto não encontrado"));
            }

            String name = (String) body.get("name");
            String description = (String) body.getOrDefault("description", "");
            double price = ((Number) body.get("price")).doubleValue();
            int stock = ((Number) body.getOrDefault("stock", 0)).intValue();
            String imageUrl = (String) body.getOrDefault("imageUrl", "");

            if (name == null || body.get("price") == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "name e price são obrigatórios"));
            }

            Product updated = productService.update(id, name, description, price, stock, imageUrl);
            return ResponseEntity.ok(updated);

        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Token inválido ou expirado"));
        }
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<?> deleteProduct(
            @PathVariable String id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Token JWT obrigatório"));
        }

        try {
            String token = authHeader.substring(7);
            Claims claims = jwtService.validateToken(token);
            String role = (String) claims.get("role");

            if (!"admin".equals(role)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Apenas administradores podem remover produtos"));
            }

            if (productService.findById(id).isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Produto não encontrado"));
            }

            productService.delete(id);
            return ResponseEntity.noContent().build(); // 204

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Token inválido ou expirado"));
        }
    }

    /**
     * Endpoint interno usado pelo serviço de Orders para decrementar estoque após pedido confirmado.
     */
    @PostMapping("/internal/products/{id}/decrement-stock")
    public ResponseEntity<?> decrementStock(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        try {
            int quantity = ((Number) body.getOrDefault("quantity", 1)).intValue();
            Optional<Product> opt = productService.findById(id);
            if (opt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Produto não encontrado"));
            }
            Product product = opt.get();
            int newStock = product.getStock() - quantity;
            if (newStock < 0) newStock = 0;
            product.setStock(newStock);
            productService.saveReplicated(product); // salva localmente e replica
            return ResponseEntity.ok(Map.of("status", "ok", "newStock", newStock));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Falha ao decrementar estoque: " + e.getMessage()));
        }
    }

    /**
     * Endpoint interno usado apenas pela replicação entre réplicas.
     * Não requer JWT — comunicação interna entre instâncias do mesmo serviço.
     */
    @PostMapping("/internal/products/replicate")
    public ResponseEntity<?> replicateProduct(@RequestBody Product product) {
        try {
            Product saved = productService.saveReplicated(product);
            return ResponseEntity.ok(Map.of("status", "replicated", "id", saved.getId()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Falha na replicação: " + e.getMessage()));
        }
    }
}
