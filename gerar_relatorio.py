from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY

import os
# Salva o arquivo na pasta atual do script
OUTPUT = os.path.join(os.path.dirname(__file__), "relatorio.pdf")

doc = SimpleDocTemplate(
    OUTPUT,
    pagesize=A4,
    rightMargin=2.5*cm, leftMargin=2.5*cm,
    topMargin=2.5*cm, bottomMargin=2.5*cm
)

styles = getSampleStyleSheet()

title_style = ParagraphStyle('Title2', parent=styles['Title'],
    fontSize=18, spaceAfter=6, textColor=colors.HexColor('#1e293b'))

heading_style = ParagraphStyle('H1', parent=styles['Heading1'],
    fontSize=13, spaceAfter=4, spaceBefore=14,
    textColor=colors.HexColor('#1d4ed8'))

body_style = ParagraphStyle('Body', parent=styles['Normal'],
    fontSize=11, leading=17, spaceAfter=6, alignment=TA_JUSTIFY)

code_style = ParagraphStyle('Code', parent=styles['Normal'],
    fontSize=9, leading=13, fontName='Courier',
    backColor=colors.HexColor('#f1f5f9'),
    leftIndent=12, rightIndent=12, spaceAfter=8, spaceBefore=4)

sub_style = ParagraphStyle('Sub', parent=styles['Heading2'],
    fontSize=11, spaceAfter=4, spaceBefore=10,
    textColor=colors.HexColor('#374151'))

story = []

# Cabeçalho
story.append(Paragraph("Atividade 1 — Mini E-commerce Distribuído", title_style))
story.append(Paragraph("Relatório Técnico", ParagraphStyle('sub', parent=styles['Normal'],
    fontSize=12, textColor=colors.HexColor('#64748b'), spaceAfter=2)))
story.append(Spacer(1, 0.3*cm))
story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#1d4ed8')))
story.append(Spacer(1, 0.4*cm))

data = [
    ['Disciplina', 'Sistemas Distribuídos'],
    ['Tecnologias', 'Java 17 · Spring Boot 3.2 · React 18 · Docker'],
    ['Arquitetura', '4 microsserviços · HTTP/REST · JWT · BCrypt'],
]
t = Table(data, colWidths=[4*cm, 12*cm])
t.setStyle(TableStyle([
    ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
    ('FONTSIZE', (0,0), (-1,-1), 10),
    ('TEXTCOLOR', (0,0), (0,-1), colors.HexColor('#1d4ed8')),
    ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
    ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ('TOPPADDING', (0,0), (-1,-1), 5),
    ('ROWBACKGROUNDS', (0,0), (-1,-1), [colors.HexColor('#f8fafc'), colors.white]),
]))
story.append(t)
story.append(Spacer(1, 0.5*cm))

# Pergunta 1
story.append(Paragraph("1. Como a comunicação entre os microsserviços foi implementada?", heading_style))
story.append(Paragraph(
    "A comunicação entre todos os microsserviços foi implementada via <b>HTTP/REST</b> síncrono, "
    "utilizando o <b>RestTemplate</b> do Spring Framework para realizar chamadas entre serviços.",
    body_style))
story.append(Paragraph("Fluxo de comunicação:", sub_style))
story.append(Paragraph(
    "O <b>API Gateway</b> (porta 5000) atua como ponto de entrada único. Ele recebe todas as "
    "requisições do cliente e as encaminha para o microsserviço correto usando o ProxyService, "
    "que repassa o header <i>Authorization</i> (JWT) para os serviços internos.",
    body_style))
story.append(Paragraph(
    "O <b>Serviço de Pedidos</b> consulta o <b>Serviço de Produtos</b> via HTTP para validar "
    "existência e estoque antes de confirmar um pedido. A URL do serviço de produtos é injetada "
    "por variável de ambiente (<i>PRODUCTS_URL</i>), permitindo configuração sem recompilação.",
    body_style))
story.append(Paragraph("Exemplo de chamada interna (OrderService.java):", sub_style))
story.append(Paragraph(
    "Map product = restTemplate.getForObject(productsUrl + \"/products/\" + productId, Map.class);",
    code_style))
story.append(Paragraph(
    "Cada microsserviço roda em porta separada (5001, 5002, 5012, 5003) e é iniciado "
    "de forma completamente independente. A comunicação nunca ocorre por chamadas de função "
    "direta — sempre por rede HTTP, garantindo o isolamento real entre serviços.",
    body_style))

# Pergunta 2
story.append(Paragraph("2. Qual estratégia de consistência foi adotada na replicação? Por quê?", heading_style))
story.append(Paragraph(
    "Foi adotada <b>consistência forte (strong consistency)</b> com política <b>2-of-2 write</b>: "
    "toda operação de escrita precisa ser confirmada em ambas as réplicas antes de retornar "
    "sucesso ao cliente.",
    body_style))
story.append(Paragraph("Justificativa:", sub_style))
story.append(Paragraph(
    "Em um sistema de e-commerce, inconsistências no catálogo de produtos são críticas: "
    "um produto criado mas visível apenas em uma réplica poderia levar a situações em que "
    "pedidos são feitos para produtos inexistentes em parte do cluster. A consistência forte "
    "garante que qualquer leitura, em qualquer réplica, sempre reflita a escrita mais recente.",
    body_style))
story.append(Paragraph("Funcionamento do ReplicationService:", sub_style))
story.append(Paragraph(
    "1. Verifica se a réplica está acessível (GET /health). Se não estiver, rejeita a escrita.<br/>"
    "2. Salva o produto localmente no arquivo JSON da instância primária.<br/>"
    "3. Propaga via POST /internal/products/replicate para a réplica secundária.<br/>"
    "4. Somente retorna 201 Created ao cliente após confirmação das duas réplicas.",
    body_style))
story.append(Paragraph(
    "<b>Trade-off:</b> maior latência em escritas (duas operações de rede) em troca de "
    "consistência absoluta. Para leituras, utilizamos round-robin entre as réplicas no Gateway, "
    "distribuindo a carga sem sacrificar consistência.",
    body_style))

# Pergunta 3
story.append(Paragraph("3. O que acontece com o sistema se o Serviço de Pedidos cair?", heading_style))
story.append(Paragraph(
    "O sistema continua operando com <b>funcionalidade degradada</b>: os serviços de "
    "Usuários e Produtos permanecem totalmente funcionais. Apenas as operações de pedidos "
    "ficam indisponíveis.",
    body_style))
story.append(Paragraph("Comportamento detalhado:", sub_style))
story.append(Paragraph(
    "O <b>HeartbeatScheduler</b> do Gateway envia GET /health a cada 5 segundos para todos "
    "os serviços. Após 2 falhas consecutivas sem resposta do Serviço de Pedidos, o "
    "ServiceRegistry marca o serviço como <i>DOWN</i> e registra o evento no log com timestamp.",
    body_style))
story.append(Paragraph(
    "Qualquer requisição para /orders/* recebe resposta <b>503 Service Unavailable</b> com "
    "mensagem clara, sem que o cliente fique aguardando timeout. Os logs registram:<br/>"
    "- Data e hora da falha detectada<br/>"
    "- Número de tentativas falhadas<br/>"
    "- Recuperação automática quando o serviço volta a responder",
    body_style))
story.append(Paragraph(
    "Quando o Serviço de Pedidos retorna, o próximo heartbeat bem-sucedido restaura o "
    "status para <i>UP</i> e registra a recuperação em log. Nenhuma intervenção manual é necessária.",
    body_style))

# Pergunta 4
story.append(Paragraph("4. Como o JWT garante que um usuário comum não consiga criar produtos?", heading_style))
story.append(Paragraph(
    "O JWT carrega o campo <b>role</b> no payload, assinado com HMAC-SHA256 usando uma "
    "chave secreta compartilhada entre os serviços. Ninguém pode alterar o role sem "
    "invalidar a assinatura.",
    body_style))
story.append(Paragraph("Fluxo de autorização:", sub_style))
story.append(Paragraph(
    "1. No login, o UsersService gera um JWT com <i>userId</i>, <i>email</i>, <i>role</i> e <i>exp</i>.<br/>"
    "2. O Gateway repassa o header <i>Authorization: Bearer &lt;token&gt;</i> para o ProductsService.<br/>"
    "3. O ProductsService extrai e valida o JWT com JwtService.validateToken().<br/>"
    "4. Se o campo <i>role</i> não for \"admin\", retorna <b>403 Forbidden</b> antes de processar.",
    body_style))
story.append(Paragraph("Trecho do ProductController.java:", sub_style))
story.append(Paragraph(
    'Claims claims = jwtService.validateToken(token);<br/>'
    'String role = (String) claims.get("role");<br/>'
    'if (!"admin".equals(role)) {<br/>'
    '&nbsp;&nbsp;return ResponseEntity.status(403).body("Apenas administradores...");<br/>'
    '}',
    code_style))
story.append(Paragraph(
    "Um usuário comum com role=\"user\" recebe 403 mesmo que tente forjar o token, pois "
    "qualquer alteração no payload invalida a assinatura HMAC. A chave secreta nunca é "
    "exposta ao cliente.",
    body_style))

# Pergunta 5
story.append(Paragraph("5. Quais limitações a implementação possui em relação a um sistema real de produção?", heading_style))

limitacoes = [
    [Paragraph("Limitação", body_style), Paragraph("Impacto", body_style), Paragraph("Solução em Produção", body_style)],
    [Paragraph("Persistência em JSON", body_style),
     Paragraph("Sem transações ACID, risco de corrupção em escrita concorrente", body_style),
     Paragraph("PostgreSQL / MongoDB com transações", body_style)],
    [Paragraph("JWT sem revogação", body_style),
     Paragraph("Token roubado válido até expirar (24h)", body_style),
     Paragraph("Blacklist em Redis ou token rotation", body_style)],
    [Paragraph("Sem circuit breaker", body_style),
     Paragraph("Falhas em cascata se um serviço lento bloqueia threads", body_style),
     Paragraph("Resilience4j / Hystrix", body_style)],
    [Paragraph("Replicação síncrona simples", body_style),
     Paragraph("Sem quorum, sem leader election", body_style),
     Paragraph("Raft / Paxos ou Kafka", body_style)],
    [Paragraph("Gateway sem autoscaling", body_style),
     Paragraph("Ponto único de falha", body_style),
     Paragraph("Kubernetes + múltiplas réplicas do gateway", body_style)],
    [Paragraph("Sem TLS interno", body_style),
     Paragraph("Comunicação em texto claro entre serviços", body_style),
     Paragraph("mTLS com certificados internos", body_style)],
    [Paragraph("Heartbeat simplificado", body_style),
     Paragraph("Não detecta degradação parcial (lentidão)", body_style),
     Paragraph("Prometheus + métricas de latência", body_style)],
]

lt = Table(limitacoes, colWidths=[3.5*cm, 6*cm, 6*cm])
lt.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1d4ed8')),
    ('TEXTCOLOR', (0,0), (-1,0), colors.white),
    ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
    ('FONTSIZE', (0,0), (-1,-1), 8.5),
    ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#f8fafc'), colors.white]),
    ('GRID', (0,0), (-1,-1), 0.3, colors.HexColor('#e2e8f0')),
    ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ('TOPPADDING', (0,0), (-1,-1), 5),
    ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ('LEFTPADDING', (0,0), (-1,-1), 6),
]))
story.append(lt)

story.append(Spacer(1, 0.5*cm))
story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#e2e8f0')))
story.append(Spacer(1, 0.2*cm))
story.append(Paragraph(
    "Apesar dessas limitações, a implementação cobre todos os conceitos fundamentais "
    "exigidos: decomposição em microsserviços independentes, replicação com estratégia "
    "de consistência definida, detecção de falha com heartbeat e autenticação/autorização "
    "via JWT com controle de roles.",
    ParagraphStyle('footer', parent=styles['Normal'], fontSize=10,
        textColor=colors.HexColor('#64748b'), alignment=TA_CENTER)
))

doc.build(story)
print("PDF gerado com sucesso!")
