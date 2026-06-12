package com.ecommerce.products.service;

import com.ecommerce.products.model.Product;
import com.ecommerce.products.replication.ReplicationService;
import com.ecommerce.products.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ProductService {

    private final ProductRepository repository;
    private final ReplicationService replication;

    public ProductService(ProductRepository repository, ReplicationService replication) {
        this.repository = repository;
        this.replication = replication;
    }

    public List<Product> findAll() {
        return repository.findAll();
    }

    public Optional<Product> findById(String id) {
        return repository.findById(id);
    }

    /**
     * Cria produto com consistência forte:
     * salva localmente E propaga à réplica antes de confirmar.
     */
    public Product create(String name, String description, double price, int stock, String imageUrl) {
        if (!replication.isReplicaAvailable()) {
            throw new IllegalStateException("Réplica indisponível — escrita rejeitada para manter consistência");
        }

        Product product = new Product(
                UUID.randomUUID().toString(),
                name,
                description,
                price,
                stock,
                System.currentTimeMillis(),
                imageUrl
        );

        repository.save(product);

        boolean replicated = replication.replicateWrite(product);
        if (!replicated) {
            throw new IllegalStateException("Falha na replicação — operação cancelada");
        }

        return product;
    }

    /**
     * Atualiza produto existente e propaga à réplica.
     */
    public Product update(String id, String name, String description, double price, int stock, String imageUrl) {
        Product product = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produto não encontrado"));

        if (!replication.isReplicaAvailable()) {
            throw new IllegalStateException("Réplica indisponível — escrita rejeitada para manter consistência");
        }

        product.setName(name);
        product.setDescription(description);
        product.setPrice(price);
        product.setStock(stock);
        product.setImageUrl(imageUrl);

        repository.save(product);

        boolean replicated = replication.replicateWrite(product);
        if (!replicated) {
            throw new IllegalStateException("Falha na replicação — operação cancelada");
        }

        return product;
    }

    /**
     * Remove produto e propaga exclusão à réplica.
     */
    public void delete(String id) {
        if (!replication.isReplicaAvailable()) {
            throw new IllegalStateException("Réplica indisponível — escrita rejeitada para manter consistência");
        }

        repository.deleteById(id);

        boolean replicated = replication.replicateDelete(id);
        if (!replicated) {
            throw new IllegalStateException("Falha na replicação da exclusão — verifique consistência manualmente");
        }
    }

    /**
     * Salva produto recebido via replicação (sem propagar novamente).
     */
    public Product saveReplicated(Product product) {
        return repository.save(product);
    }
}
