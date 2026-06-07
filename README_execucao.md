# README — Execução do Mini E-commerce Distribuído

## Tecnologias

| Componente | Tecnologia |
|---|---|
| Microsserviços | Java 17 + Spring Boot 3.2 |
| Autenticação | Spring Security + JJWT 0.12.3 |
| Hash de senha | BCrypt (Spring Security) |
| Banco de dados | Arquivos JSON (Jackson) |
| Comunicação | HTTP/REST (RestTemplate) |
| Dashboard | React 18 (CDN, HTML standalone) |
| Orquestração | Docker Compose 3.8 |

---

## Opção 1 — Executar com Docker Compose (recomendado)

### Requisitos
- Docker >= 20
- Docker Compose >= 2

```bash
# Na raiz do projeto
docker compose up --build
```

Todos os serviços sobem automaticamente. Aguarde ~60s para o build Maven.

---

## Opção 2 — Executar manualmente (sem Docker)

### Requisitos
- Java 17+
- Maven 3.8+

### Passo 1 — Serviço de Usuários (porta 5001)
```bash
cd users
mvn clean package -DskipTests
java -jar target/users-service-1.0.0.jar
```

### Passo 2 — Réplica Secundária de Produtos (porta 5012)
> Inicie ANTES da primária para que a replicação funcione.
```bash
cd products
mvn clean package -DskipTests
SERVER_PORT=5012 REPLICA_URL=http://localhost:5002 REPLICA_ENABLED=false \
  java -jar target/products-service-1.0.0.jar
```

### Passo 3 — Réplica Primária de Produtos (porta 5002)
```bash
cd products
SERVER_PORT=5002 REPLICA_URL=http://localhost:5012 REPLICA_ENABLED=true \
  java -jar target/products-service-1.0.0.jar
```

### Passo 4 — Serviço de Pedidos (porta 5003)
```bash
cd orders
mvn clean package -DskipTests
java -jar target/orders-service-1.0.0.jar
```

### Passo 5 — API Gateway (porta 5000)
```bash
cd gateway
mvn clean package -DskipTests
java -jar target/gateway-service-1.0.0.jar
```

### Passo 6 — Dashboard
Abra `dashboard/index.html` no navegador (duplo clique ou Live Server).

---

## Testando o sistema

### 1. Registrar usuário admin
```bash
curl -X POST http://localhost:5000/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@loja.com","password":"senha123","role":"admin"}'
```

### 2. Login (obtém JWT)
```bash
curl -X POST http://localhost:5000/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@loja.com","password":"senha123"}'
```
> Salve o `token` retornado como variável: `TOKEN=<token>`

### 3. Criar produto (requer JWT de admin)
```bash
curl -X POST http://localhost:5000/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Notebook","description":"16GB RAM","price":3500.00,"stock":10}'
```

### 4. Listar produtos (público)
```bash
curl http://localhost:5000/products
```

### 5. Criar pedido (requer JWT)
```bash
curl -X POST http://localhost:5000/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"productId":"<id-do-produto>","quantity":2}'
```

### 6. Ver status dos serviços
```bash
curl http://localhost:5000/status
```

### 7. Simular falha (heartbeat)
```bash
# Derrube o serviço de pedidos e aguarde ~10s
# O gateway registrará a falha e retornará 503 para chamadas de pedidos
# Quando reiniciar, o log registrará a recuperação
```

---

## Portas

| Serviço | Porta |
|---|---|
| API Gateway | 5000 |
| Usuários | 5001 |
| Produtos (primária) | 5002 |
| Produtos (réplica) | 5012 |
| Pedidos | 5003 |
