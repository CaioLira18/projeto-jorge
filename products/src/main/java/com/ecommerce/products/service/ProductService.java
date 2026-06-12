package com.ecommerce.products.service;

import com.ecommerce.products.model.Product;
import com.ecommerce.products.model.enums.Category;
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
     * Cria produto com consistência forte.
     * Se a replicação falhar, faz rollback local.
     */
    public Product create(String name, String description, double price, int stock, String imageUrl, Category category) {
        Product product = new Product(
                UUID.randomUUID().toString(),
                name, description, price, stock,
                System.currentTimeMillis(), imageUrl, category
        );
        repository.save(product);

        boolean replicated = replication.replicateWrite(product);
        if (!replicated) {
            repository.deleteById(product.getId()); // rollback
            throw new IllegalStateException("Falha na replicação — operação cancelada");
        }

        return product;
    }

    /**
     * Atualiza produto e propaga à réplica.
     * Se a replicação falhar, faz rollback restaurando o snapshot anterior.
     */
    public Product update(String id, String name, String description, double price, int stock, String imageUrl, Category category) {
        Product product = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produto não encontrado"));

        // Snapshot para rollback
        Product snapshot = new Product(
                product.getId(), product.getName(), product.getDescription(),
                product.getPrice(), product.getStock(), product.getCreatedAt(), product.getImageUrl(), product.getCategory()
        );

        product.setName(name);
        product.setDescription(description);
        product.setPrice(price);
        product.setStock(stock);
        product.setImageUrl(imageUrl);
        product.setCategory(category);

        repository.save(product);

        boolean replicated = replication.replicateWrite(product);
        if (!replicated) {
            repository.save(snapshot); // rollback
            throw new IllegalStateException("Falha na replicação — operação cancelada");
        }

        return product;
    }

    /**
     * Remove produto propagando exclusão à réplica ANTES de apagar localmente.
     * Garante que, se a réplica falhar, o dado ainda existe na primária.
     */
    public void delete(String id) {
        boolean replicated = replication.replicateDelete(id);
        if (!replicated) {
            throw new IllegalStateException("Réplica indisponível — delete cancelado para manter consistência");
        }
        repository.deleteById(id);
    }

    /**
     * Apaga produto apenas localmente, sem propagar.
     * Usado pelo endpoint interno de replicação de delete.
     */
    public void deleteLocal(String id) {
        repository.deleteById(id);
    }

    /**
     * Salva produto recebido via replicação (sem propagar novamente).
     */
    public Product saveReplicated(Product product) {
        return repository.save(product);
    }
}
