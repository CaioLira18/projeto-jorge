package com.ecommerce.products.replication;

import com.ecommerce.products.model.Product;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Estratégia de replicação: CONSISTÊNCIA FORTE (2-of-2 write).
 *
 * Toda escrita é propagada para a réplica antes de confirmar sucesso ao cliente.
 * Se a réplica estiver indisponível, a escrita é rejeitada para evitar divergência.
 *
 * Leitura: distribuída em round-robin — o Gateway alterna entre :5002 e :5012.
 */
@Service
public class ReplicationService {

    private static final Logger log = LoggerFactory.getLogger(ReplicationService.class);

    @Value("${replica.url}")
    private String replicaUrl;

    @Value("${replica.enabled}")
    private boolean replicaEnabled;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Propaga a criação/atualização de um produto para a réplica par.
     * Retorna true se propagou com sucesso, false caso contrário.
     */
    public boolean replicateWrite(Product product) {
        if (!replicaEnabled) return true;

        try {
            String url = replicaUrl + "/internal/products/replicate";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Product> request = new HttpEntity<>(product, headers);
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, request, Map.class);

            boolean success = response.getStatusCode().is2xxSuccessful();
            if (success) {
                log.info("[REPLICAÇÃO] Produto {} propagado com sucesso para {}", product.getId(), replicaUrl);
            } else {
                log.error("[REPLICAÇÃO] Falha ao propagar produto {} para {}", product.getId(), replicaUrl);
            }
            return success;
        } catch (Exception e) {
            log.error("[REPLICAÇÃO] Réplica indisponível em {}: {}", replicaUrl, e.getMessage());
            return false;
        }
    }

    public boolean isReplicaAvailable() {
        if (!replicaEnabled) return true;
        try {
            ResponseEntity<Map> resp = restTemplate.getForEntity(replicaUrl + "/health", Map.class);
            return resp.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            return false;
        }
    }
}
