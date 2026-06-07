package com.ecommerce.orders.repository;

import com.ecommerce.orders.model.Order;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Repository
public class OrderRepository {

    @Value("${data.file}")
    private String dataFile;

    private final ObjectMapper mapper = new ObjectMapper();

    private File getFile() {
        File f = new File(dataFile);
        f.getParentFile().mkdirs();
        return f;
    }

    public synchronized List<Order> findAll() {
        File f = getFile();
        if (!f.exists()) return new ArrayList<>();
        try {
            return mapper.readValue(f, new TypeReference<List<Order>>() {});
        } catch (IOException e) {
            return new ArrayList<>();
        }
    }

    public List<Order> findByUserId(String userId) {
        return findAll().stream()
                .filter(o -> o.getUserId().equals(userId))
                .collect(Collectors.toList());
    }

    public synchronized Order save(Order order) {
        List<Order> orders = findAll();
        orders.add(order);
        try {
            mapper.writerWithDefaultPrettyPrinter().writeValue(getFile(), orders);
        } catch (IOException e) {
            throw new RuntimeException("Erro ao salvar pedido", e);
        }
        return order;
    }
}
