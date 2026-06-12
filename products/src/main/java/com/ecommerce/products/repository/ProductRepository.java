package com.ecommerce.products.repository;

import com.ecommerce.products.model.Product;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class ProductRepository {

    @Value("${data.file}")
    private String dataFile;

    private final ObjectMapper mapper = new ObjectMapper();

    private File getFile() {
        File f = new File(dataFile);
        f.getParentFile().mkdirs();
        return f;
    }

    public synchronized List<Product> findAll() {
        File f = getFile();
        if (!f.exists()) return new ArrayList<>();
        try {
            return mapper.readValue(f, new TypeReference<List<Product>>() {});
        } catch (IOException e) {
            return new ArrayList<>();
        }
    }

    public Optional<Product> findById(String id) {
        return findAll().stream().filter(p -> p.getId().equals(id)).findFirst();
    }

    public synchronized Product save(Product product) {
        List<Product> products = findAll();
        products.removeIf(p -> p.getId().equals(product.getId()));
        products.add(product);
        try {
            mapper.writerWithDefaultPrettyPrinter().writeValue(getFile(), products);
        } catch (IOException e) {
            throw new RuntimeException("Erro ao salvar produto", e);
        }
        return product;
    }

    public synchronized void deleteById(String id) {
        List<Product> products = findAll();
        boolean removed = products.removeIf(p -> p.getId().equals(id));
        if (!removed) {
            throw new RuntimeException("Produto não encontrado: " + id);
        }
        try {
            mapper.writerWithDefaultPrettyPrinter().writeValue(getFile(), products);
        } catch (IOException e) {
            throw new RuntimeException("Erro ao remover produto", e);
        }
    }
}
