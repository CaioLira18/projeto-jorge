package com.ecommerce.products.controller;

import com.ecommerce.products.model.Product;
import com.ecommerce.products.model.enums.Category;
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
            String categoryStr = (String) body.getOrDefault("category", "");
            Category category = Category.valueOf(categoryStr.toUpperCase());

            if (name == null || body.get("price") == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "name e price são obrigatórios"));
            }

            Product product = productService.create(name, description, price, stock, imageUrl, category);
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
            Category category = Category.valueOf((String) body.getOrDefault("category", "OTHER"));
            if (name == null || body.get("price") == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "name e price são obrigatórios"));
            }

            Product updated = productService.update(id, name, description, price, stock, imageUrl, category);
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
            return ResponseEntity.noContent().build();

        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Token inválido ou expirado"));
        }
    }

    /**
     * Endpoint interno usado pelo serviço de Orders para decrementar estoque.
     * Usa update() para garantir replicação.
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
            int newStock = Math.max(0, product.getStock() - quantity);

            Category category = product.getCategory(); // Preserve the existing category

            Product updated = productService.update(
                    id, product.getName(), product.getDescription(),
                    product.getPrice(), newStock, product.getImageUrl(), category
            );

            return ResponseEntity.ok(Map.of("status", "ok", "newStock", updated.getStock()));

        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Falha ao decrementar estoque: " + e.getMessage()));
        }
    }

    /**
     * Endpoint interno de replicação — recebe produto criado/atualizado pela primária.
     * Não requer JWT.
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

    /**
     * Endpoint interno de replicação — recebe exclusão propagada pela primária.
     * Não requer JWT.
     */
    @DeleteMapping("/internal/products/{id}")
    public ResponseEntity<?> replicateDelete(@PathVariable String id) {
        try {
            if (productService.findById(id).isEmpty()) {
                // Já não existe — idempotente, considera sucesso
                return ResponseEntity.ok(Map.of("status", "not_found_but_ok", "id", id));
            }
            productService.deleteLocal(id);
            return ResponseEntity.ok(Map.of("status", "deleted", "id", id));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Falha na replicação do delete: " + e.getMessage()));
        }
    }
}
