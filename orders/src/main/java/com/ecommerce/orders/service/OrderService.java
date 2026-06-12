package com.ecommerce.orders.service;

import com.ecommerce.orders.model.Order;
import com.ecommerce.orders.model.OrderItem;
import com.ecommerce.orders.repository.OrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository repository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${products.service.url}")
    private String productsUrl;

    @Value("${products.service.internal.token:internal-service-token}")
    private String internalToken;

    public OrderService(OrderRepository repository) {
        this.repository = repository;
    }

    /**
     * Cria um pedido com múltiplos itens.
     * Cada item é validado contra o serviço de produtos (existência e estoque).
     */
    public Order createOrder(String userId, List<Map<String, Object>> rawItems, String paymentMethod) {
        if (rawItems == null || rawItems.isEmpty()) {
            throw new IllegalArgumentException("O pedido precisa conter ao menos um item");
        }

        List<OrderItem> orderItems = new ArrayList<>();
        double total = 0;

        for (Map<String, Object> rawItem : rawItems) {
            String productId = (String) rawItem.get("productId");
            if (productId == null) {
                throw new IllegalArgumentException("productId é obrigatório em todos os itens");
            }
            int quantity = ((Number) rawItem.getOrDefault("quantity", 1)).intValue();
            if (quantity <= 0) {
                throw new IllegalArgumentException("quantity deve ser maior que zero");
            }

            Map product;
            try {
                product = restTemplate.getForObject(productsUrl + "/products/" + productId, Map.class);
            } catch (Exception e) {
                log.error("Erro ao consultar serviço de produtos: {}", e.getMessage());
                throw new IllegalStateException("Serviço de produtos indisponível");
            }

            if (product == null) {
                throw new IllegalArgumentException("Produto não encontrado: " + productId);
            }

            String productName = (String) product.get("name");
            double price = ((Number) product.get("price")).doubleValue();
            int stock = ((Number) product.get("stock")).intValue();

            if (stock < quantity) {
                throw new IllegalArgumentException("Estoque insuficiente para " + productName + ". Disponível: " + stock);
            }

            orderItems.add(new OrderItem(productId, productName, quantity, price));
            total += price * quantity;
        }

        Order order = new Order(
                UUID.randomUUID().toString(),
                userId,
                orderItems,
                total,
                paymentMethod,
                "CONFIRMED",
                System.currentTimeMillis()
        );

        log.info("Pedido criado: {} | usuário: {} | {} item(ns) | total: {}", order.getId(), userId, orderItems.size(), total);
        Order saved = repository.save(order);

        // Decrementa o estoque de cada produto no serviço de Products
        for (OrderItem item : orderItems) {
            try {
                String url = productsUrl + "/internal/products/" + item.getProductId() + "/decrement-stock";
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.set("Authorization", "Bearer " + internalToken);
                Map<String, Object> body = new HashMap<>();
                body.put("quantity", item.getQuantity());
                HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
                restTemplate.exchange(url, HttpMethod.POST, request, Map.class);
                log.info("Estoque decrementado: produto {} | quantidade {}", item.getProductId(), item.getQuantity());
            } catch (Exception e) {
                log.error("Falha ao decrementar estoque do produto {}: {}", item.getProductId(), e.getMessage());
                // Não cancela o pedido — loga para tratamento manual
            }
        }

        return saved;
    }

    public List<Order> findByUserId(String userId) {
        return repository.findByUserId(userId);
    }

    public java.util.Optional<Order> findById(String orderId) {
        return repository.findById(orderId);
    }    
}
