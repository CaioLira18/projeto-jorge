<p align="center">
  <img src="https://res.cloudinary.com/dmf7ocduw/image/upload/v1781371590/logo_a06hef.png" alt="Nexora" width="220"/>
</p>

<h1 align="center">Nexora — Mini E-commerce Distribuído</h1>

<p align="center">
  Projeto desenvolvido para a disciplina de <strong>Sistemas Distribuídos</strong>, implementando uma arquitetura de microsserviços com replicação, heartbeat, autenticação JWT e frontend React.
</p>

<p align="center">
  <strong>Aluno:</strong> Caio Ferreira Lira de Oliveira &nbsp;|&nbsp; <strong>Professor:</strong> Jorge
</p>

---

## Arquitetura

```
                        ┌─────────────────┐
                        │   Frontend       │
                        │   React + Vite   │
                        │   :5173          │
                        └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │   API Gateway    │
                        │   Spring Boot    │
                        │   :5000          │
                        └──┬──────┬───┬───┘
                           │      │   │
              ┌────────────▼─┐  ┌─▼───▼──────┐  ┌──────────────┐
              │   Users       │  │  Products   │  │   Orders     │
              │   :5001       │  │  Primary    │  │   :5003      │
              └───────────────┘  │  :5002      │  └──────────────┘
                                 └─────┬───────┘
                                       │ replicação
                                 ┌─────▼───────┐
                                 │  Products   │
                                 │  Replica    │
                                 │  :5012      │
                                 └─────────────┘
```

**4 microsserviços** totalmente independentes, comunicação via HTTP/REST, ponto de entrada único pelo Gateway.

---

## Como rodar

### Pré-requisitos

- [Docker](https://www.docker.com/) e Docker Compose instalados

### Subir tudo com um comando

```bash
docker compose up --build
```

Aguarde todos os serviços iniciarem (o Gateway faz healthcheck automático). Acesse:

| Serviço | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Gateway | http://localhost:5000 |
| Users | http://localhost:5001 |
| Products (primary) | http://localhost:5002 |
| Products (replica) | http://localhost:5012 |
| Orders | http://localhost:5003 |

### Parar os serviços

```bash
docker compose down
```

### Parar e remover volumes (reset completo)

```bash
docker compose down -v
```

<img src="https://res.cloudinary.com/dmf7ocduw/image/upload/v1781374963/q_duvjup.png" alt="Nexora"/>

---
  
## Usuários para teste

Crie os usuários abaixo via curl após subir os serviços:

```bash
# Administrador
curl -X POST http://localhost:5000/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@admin.com","password":"admin12345","role":"admin"}'

# Usuário comum
curl -X POST http://localhost:5000/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Usuario","email":"usuario@usuario.com","password":"usuario123","role":"user"}'
```

| Perfil | E-mail | Senha | Acesso |
|---|---|---|---|
| Admin | admin@admin.com | admin12345 | Dashboard, CRUD de produtos, pedidos |
| Usuário | usuario@usuario.com | usuario123 | Loja, carrinho, pedidos próprios |

---

## Comunicação entre serviços

Toda comunicação é via **HTTP/REST síncrono** usando `RestTemplate` do Spring. O Gateway recebe as requisições do cliente e encaminha para o serviço correto via `ProxyService`, repassando o header `Authorization` (JWT).

O Serviço de Pedidos consulta o Serviço de Produtos internamente para validar estoque antes de confirmar um pedido. As URLs dos serviços são injetadas por variáveis de ambiente, sem recompilação necessária.

---

## Replicação de Produtos

Foi adotada **consistência forte (2-of-2 write)**: toda escrita precisa ser confirmada nas duas réplicas antes de retornar sucesso ao cliente.

Fluxo de escrita:
1. Verifica se a réplica está acessível via `GET /health`
2. Salva localmente na instância primária
3. Propaga via `POST /internal/products/replicate` para a réplica
4. Retorna `201 Created` somente após confirmação das duas

Leituras usam **round-robin** entre primária e réplica no Gateway, distribuindo carga sem sacrificar consistência.

---

## Detecção de Falhas (Heartbeat)

O `HeartbeatScheduler` do Gateway envia `GET /health` a cada **5 segundos** para todos os serviços. Após **2 falhas consecutivas**, o `ServiceRegistry` marca o serviço como `DOWN` e qualquer requisição para ele retorna `503 Service Unavailable` imediatamente.

A recuperação é automática: quando o serviço volta a responder, o próximo heartbeat restaura o status para `UP` sem intervenção manual.

Monitore o status em tempo real:
```
GET http://localhost:5000/status
```

---

## Autenticação e Autorização (JWT)

O JWT carrega o campo `role` no payload, assinado com **HMAC-SHA256**. Nenhuma alteração no payload é possível sem invalidar a assinatura.

Fluxo:
1. Login gera JWT com `userId`, `email`, `role` e `exp`
2. Gateway repassa o header `Authorization: Bearer <token>` para os serviços
3. Cada serviço valida o token e verifica o `role`
4. Usuários com `role="user"` recebem `403 Forbidden` em rotas admin

---

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Frontend | React 19, React Router, Vite 8 |
| Backend | Java 17, Spring Boot 3.2 |
| Autenticação | JWT (JJWT), BCrypt |
| Containerização | Docker, Docker Compose |
| Comunicação | HTTP/REST, RestTemplate |
| Persistência | JSON em volume Docker |

---

## Limitações conhecidas

| Limitação | Impacto | Solução em produção |
|---|---|---|
| Persistência em JSON | Sem transações ACID | PostgreSQL / MongoDB |
| JWT sem revogação | Token roubado válido até expirar | Blacklist em Redis |
| Sem circuit breaker | Falhas em cascata | Resilience4j / Hystrix |
| Replicação síncrona simples | Sem quorum, sem leader election | Raft / Paxos ou Kafka |
| Gateway sem autoscaling | Ponto único de falha | Kubernetes + múltiplas réplicas |
| Sem TLS interno | Comunicação em texto claro | mTLS com certificados internos |
| Heartbeat simplificado | Não detecta degradação parcial | Prometheus + métricas de latência |

---

## Estrutura do projeto

```
.
├── frontend/          # React + Vite
├── gateway/           # API Gateway (Spring Boot)
├── users/             # Serviço de usuários (Spring Boot)
├── products/          # Serviço de produtos com replicação (Spring Boot)
├── orders/            # Serviço de pedidos (Spring Boot)
└── docker-compose.yml
```
