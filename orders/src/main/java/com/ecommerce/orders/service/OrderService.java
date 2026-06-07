package com.ecommerce.orders.service;

import com.ecommerce.orders.model.Order;
import com.ecommerce.orders.repository.OrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

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

    public OrderService(OrderRepository repository) {
        this.repository = repository;
    }

    public Order createOrder(String userId, String productId, int quantity) {
        // Consulta o serviço de produtos via HTTP/REST
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
            throw new IllegalArgumentException("Estoque insuficiente. Disponível: " + stock);
        }

        Order order = new Order(
                UUID.randomUUID().toString(),
                userId,
                productId,
                productName,
                quantity,
                price * quantity,
                "CONFIRMED",
                System.currentTimeMillis()
        );

        log.info("Pedido criado: {} | usuário: {} | produto: {} x{}", order.getId(), userId, productName, quantity);
        return repository.save(order);
    }

    public List<Order> findByUserId(String userId) {
        return repository.findByUserId(userId);
    }
}
