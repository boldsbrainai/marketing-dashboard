<!-- markdownlint-disable-file -->

# Task Details: Backlog de cobertura E2E 360

## Research Reference

**Source Research**: #file:../research/20260418-e2e-coverage-backlog-research.md

## Phase 1: Fundação mínima e fluxos P0

### Task 1.1: Issue 01 - Estruturar a fundação mínima Playwright para auth reutilizável e isolamento básico

- **Título**: E2E Foundation: auth reutilizável, helpers comuns e isolamento básico de estado
- **Prioridade**: P0
- **Problema/Risco**: Sem uma base mínima compartilhada, cada novo spec tende a repetir login, depender de estado implícito e aumentar flakes. A suíte precisa de fundação suficiente para habilitar os primeiros fluxos P0, mas sem antecipar tuning pesado demais.
- **Escopo**:
  - Introduzir setup de autenticação por API com `storageState` reutilizável.
  - Definir helpers comuns para navegação autenticada e criação de dados de teste com identificador único.
  - Isolar `HERMES_STATE_DIR` ou namespace de dados para cenários com mutação.
  - Preparar segmentação inicial entre smoke e full, sem exigir paralelismo amplo já nesta issue.
- **Critérios de aceite**:
  - Existe um arquivo de setup/autenticação reutilizável usado por pelo menos um spec novo de UI.
  - Um cenário autenticado consegue abrir a app sem passar pelo formulário de login em cada teste.
  - Um cenário com mutação usa estado isolado ou dados exclusivos por execução, sem depender de resíduo de outro teste.
  - Existe uma forma explícita de rodar ao menos um subconjunto smoke sem executar toda a suíte full.
- **Abordagem de teste**:
  - Gerar `storageState` via `/api/auth/login`.
  - Definir fixture de estado por worker, projeto ou namespace de dados, conforme a menor mudança viável.
  - Manter `trace` em retry e adiar tuning amplo de workers/shards para a issue de hardening posterior.
- **Dependências/Pré-requisitos**:
  - Nenhuma.
- **Labels sugeridas**: `area:test-e2e`, `type:infra`, `priority:P0`, `domain:auth`, `domain:platform`
- **Files**:
  - `playwright.config.ts` - setup mínimo de auth e segmentação smoke/full.
  - `tests/e2e/auth.setup.ts` - geração de `storageState` reutilizável.
  - `tests/e2e/fixtures.ts` - helpers de auth, dados únicos e isolamento básico.
  - `tests/e2e/utils/*` - utilitários de navegação e massa de dados.
- **Research References**:
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 7-16) - estado atual da suíte e custo de execução.
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 17-23) - setup, auth e seed úteis para E2E.
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 104-110) - restrições de ordem e necessidade de fundação mínima.
- **Dependencies**:
  - Base para todas as demais issues.

### Task 1.2: Issue 02 - Cobrir login UI, redirect e shell protegida

- **Título**: Auth E2E: login UI, redirect para `from` e shell protegida
- **Prioridade**: P0
- **Problema/Risco**: Hoje a suíte só valida autenticação por request/API. Regressões em formulário, cookie de sessão, redirect e proteção de rotas podem passar despercebidas.
- **Escopo**:
  - Cobrir login feliz e login inválido pela UI.
  - Validar redirect para `from` ao acessar rota protegida sem sessão.
  - Validar acesso pós-login à home autenticada.
  - Cobrir smoke de uma ou mais rotas protegidas para garantir shell carregando com sessão válida.
- **Critérios de aceite**:
  - Acessar uma rota protegida sem sessão redireciona para `/login` e preserva o parâmetro `from` esperado.
  - Submeter credenciais válidas leva o usuário para a rota solicitada ou `/` e exibe o heading `Overview`.
  - Submeter credenciais inválidas exibe mensagem de erro visível no formulário e mantém o usuário em `/login`.
  - Após login bem-sucedido, recarregar a página mantém a sessão e continua exibindo a shell autenticada.
- **Abordagem de teste**:
  - Um spec dedicado para fluxo de login UI.
  - Um spec smoke de shell protegida reusando `storageState` para não repetir o formulário em todos os cenários.
  - Asserts web-first em heading, URL e elementos principais da shell.
- **Dependências/Pré-requisitos**:
  - Issue 01.
- **Labels sugeridas**: `area:test-e2e`, `type:test`, `priority:P0`, `domain:auth`
- **Files**:
  - `tests/e2e/auth-ui.spec.ts`
  - `tests/e2e/protected-shell.smoke.spec.ts`
- **Research References**:
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 51-54) - login e navegação protegida.
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 92-102) - lacuna atual de cobertura UI e necessidade de critérios observáveis.
- **Dependencies**:
  - Task 1.1 completion.

### Task 1.3: Issue 03 - Cobrir Overview/Home como superfície operacional de primeira linha

- **Título**: Overview E2E: home operacional, action items e sinais principais da operação
- **Prioridade**: P0
- **Problema/Risco**: A home concentra visibilidade operacional, polling, action items e atalhos para fluxos críticos. Sem cobertura explícita, regressões nessa superfície central passam sem alarme precoce.
- **Escopo**:
  - Validar renderização do heading `Overview` e dos cards principais.
  - Validar carregamento da faixa de agentes, `X API Budget` e `Action Items` quando houver dados seeded.
  - Validar que os links `Content Queue` e `Outreach Approvals` navegam para as superfícies corretas.
  - Validar que a home continua estável após um ciclo de polling ou refresh controlado.
- **Critérios de aceite**:
  - A home autenticada renderiza o heading `Overview` e ao menos um card de métrica visível.
  - Quando houver `action_items`, o painel correspondente aparece com contador e links navegáveis.
  - Clicar em `Content Queue` leva a `/content` e clicar em `Outreach Approvals` leva a `/outreach` sem erro fatal.
  - Após `page.reload()` ou nova leitura estável, os widgets principais continuam presentes sem estado quebrado.
- **Abordagem de teste**:
  - Preferir massa seeded/default e asserts em heading, cards, links e painéis visíveis.
  - Não esperar intervalos fixos de polling; usar recarga controlada ou espera por estado estável.
- **Dependências/Pré-requisitos**:
  - Issue 01 e 02.
- **Labels sugeridas**: `area:test-e2e`, `type:test`, `priority:P0`, `domain:overview`, `domain:home`
- **Files**:
  - `tests/e2e/overview-home.spec.ts`
  - `tests/e2e/page-objects/overview-page.ts`
- **Research References**:
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 24-31) - home como superfície operacional principal.
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 92-102) - gap explícito de Overview/Home.
- **Dependencies**:
  - Task 1.1 completion.
  - Task 1.2 completion.

### Task 1.4: Issue 04 - Cobrir CRM end-to-end com criação, filtros e transições de lead

- **Título**: CRM E2E: criação de lead, filtros sincronizados por URL e transições de status
- **Prioridade**: P0
- **Problema/Risco**: CRM é fluxo de negócio central. Se criação, busca, filtros e mudança de status quebrarem, o impacto operacional é direto e hoje não há proteção E2E via UI.
- **Escopo**:
  - Criar lead com dados mínimos válidos.
  - Validar filtros `status`, `tier`, `search`, `view` e `sort` refletidos na URL quando disponíveis na UI.
  - Validar abertura do detalhe do lead.
  - Validar ao menos uma transição de status ou stage via UI.
- **Critérios de aceite**:
  - Um lead criado pelo teste aparece na listagem e pode ser encontrado pela busca pelo identificador único criado no cenário.
  - Alterar filtros atualiza a URL e o estado filtrado permanece após reload ou navegação back-forward.
  - Abrir o lead mostra o mesmo nome/identificador usado na criação.
  - Alterar status ou stage muda o valor exibido na UI e o novo estado permanece após reload.
- **Abordagem de teste**:
  - Usar massa de dados exclusiva por execução.
  - Validar estado apenas pela UI e pela navegação do usuário.
- **Dependências/Pré-requisitos**:
  - Issue 01 e 02.
- **Labels sugeridas**: `area:test-e2e`, `type:test`, `priority:P0`, `domain:crm`
- **Files**:
  - `tests/e2e/crm-lead-lifecycle.spec.ts`
  - `tests/e2e/page-objects/crm-page.ts`
- **Research References**:
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 56-58) - CRM com filtros por URL e edição por role.
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 98-101) - lacuna de mutações críticas.
- **Dependencies**:
  - Task 1.1 completion.
  - Task 1.2 completion.

### Task 1.5: Issue 05 - Cobrir outreach, approvals e suppression com mutações críticas

- **Título**: Outreach E2E: aprovação de sequência, mudança de status de lead e suppression
- **Prioridade**: P0
- **Problema/Risco**: Outreach combina operação comercial e aprovação. Regressões em leads, sequences e approvals podem bloquear execução real de campanhas sem cobertura atual de browser.
- **Escopo**:
  - Validar tabs principais de outreach.
  - Aprovar ou rejeitar uma sequência pendente.
  - Alterar o status de um lead dentro do fluxo de outreach.
  - Validar presença e carregamento da visualização de suppression.
- **Critérios de aceite**:
  - As tabs principais renderizam e a troca entre elas não produz erro fatal.
  - Aprovar ou rejeitar uma sequência altera o item visível na lista de pendências, removendo-o ou mudando seu estado exibido.
  - Alterar o status de um lead atualiza o badge/coluna correspondente e o novo estado persiste após reload.
  - A área de suppression carrega ao menos um estado observável: lista, estado vazio ou contador coerente.
- **Abordagem de teste**:
  - Preparar fixture com lead e sequência em estado mutável.
  - Esperar por toast, badge, remoção de item ou alteração de contador, evitando sleeps.
- **Dependências/Pré-requisitos**:
  - Issue 01 e 02.
- **Labels sugeridas**: `area:test-e2e`, `type:test`, `priority:P0`, `domain:outreach`, `domain:approvals`
- **Files**:
  - `tests/e2e/outreach-approvals.spec.ts`
  - `tests/e2e/page-objects/outreach-page.ts`
- **Research References**:
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 60-63) - outreach e approvals role-sensitive.
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 98-101) - lacuna de mutações críticas.
- **Dependencies**:
  - Task 1.1 completion.
  - Task 1.2 completion.

### Task 1.6: Issue 06 - Cobrir RBAC E2E com viewer, editor e admin

- **Título**: RBAC E2E: viewer, editor e admin em leitura, escrita e áreas administrativas
- **Prioridade**: P0
- **Problema/Risco**: O produto já codifica roles e capabilities, mas a suíte não garante que a UI e as APIs da própria app respeitam `viewer`, `editor` e `admin` de ponta a ponta. Isso é risco funcional e de segurança.
- **Escopo**:
  - Validar `viewer` com leitura permitida e bloqueio em escrita.
  - Validar `editor` com leitura e escrita operacional permitidas, mas sem acesso administrativo.
  - Validar `admin` com acesso completo, incluindo áreas administrativas.
  - Cobrir pelo menos uma superfície de leitura, uma de escrita e uma área administrativa real.
- **Critérios de aceite**:
  - Com usuário `viewer`, a home e ao menos uma superfície de leitura carregam, mas um CTA de escrita relevante fica ausente, desabilitado ou falha com resposta `403`/mensagem esperada.
  - Com usuário `editor`, uma ação de escrita operacional real funciona com efeito observável na UI, mas uma área administrativa exibe bloqueio, placeholder ou mensagem `Admin access required`.
  - Com usuário `admin`, a mesma área administrativa carrega controles reais de gestão de usuários/roles ou equivalente.
  - O spec documenta claramente quais fluxos representam `read_dashboard`, `write_ops` e área administrativa no produto.
- **Abordagem de teste**:
  - Criar ou seedar três usuários dedicados para a suíte.
  - Reaproveitar os fluxos já implementados de Overview, CRM, Outreach e Settings para evitar duplicação desnecessária.
  - Observar bloqueios por UI e, quando necessário, verificar a resposta de rede da própria app ao disparar a ação.
- **Dependências/Pré-requisitos**:
  - Issue 01, 02, 03, 04 e 05.
  - Estratégia estável de criação/seed de usuários por role.
- **Labels sugeridas**: `area:test-e2e`, `type:test`, `priority:P0`, `domain:rbac`, `domain:security`, `domain:settings`
- **Files**:
  - `tests/e2e/rbac-role-matrix.spec.ts`
  - `tests/e2e/fixtures/users.ts`
- **Research References**:
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 32-38) - matriz de roles, capabilities e enforcement em API.
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 94-101) - lacuna explícita de RBAC no backlog anterior.
- **Dependencies**:
  - Task 1.1 completion.
  - Task 1.2 completion.
  - Task 1.3 completion.
  - Task 1.4 completion.
  - Task 1.5 completion.

## Phase 2: Expansão de domínio P1

### Task 2.1: Issue 07 - Cobrir content ops com mudança de status e fila editorial

- **Título**: Content E2E: filtros, fila editorial e transição de status de conteúdo
- **Prioridade**: P1
- **Problema/Risco**: Content possui writeback e audit log; regressões podem quebrar a fila editorial sem sinal rápido.
- **Escopo**:
  - Navegar pela página de content.
  - Aplicar filtros visíveis na UI.
  - Alterar o status de um item pela UI.
  - Validar reflexo na fila editorial ou approvals quando aplicável.
- **Critérios de aceite**:
  - A listagem reage a pelo menos um filtro visível de forma observável.
  - Alterar o status de um item muda o badge/estado exibido na lista.
  - O novo estado permanece após reload.
  - Quando houver integração com fila editorial, o item deixa a fila antiga ou entra na fila nova de forma visível.
- **Abordagem de teste**:
  - Usar dataset com itens em estados distintos.
  - Verificar badges, filtros, contadores e listas visíveis.
- **Dependências/Pré-requisitos**:
  - Phase 1 concluída.
- **Labels sugeridas**: `area:test-e2e`, `type:test`, `priority:P1`, `domain:content`
- **Files**:
  - `tests/e2e/content-status.spec.ts`
  - `tests/e2e/page-objects/content-page.ts`
- **Research References**:
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 65-67) - content com writeback e audit.
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 156-165) - ordem macro recomendada.
- **Dependencies**:
  - Phase 1 completion.

### Task 2.2: Issue 08 - Cobrir Agent Comms/Chat com lista, envio, bloqueio por role e Mission Control admin-only

- **Título**: Agent Comms E2E: lista de conversas, envio de mensagem, bloqueio por role e Mission Control admin-only
- **Prioridade**: P1
- **Problema/Risco**: O produto já separa chat operacional e Mission Control por role, mas o backlog anterior não tratava isso como fluxo dedicado. Regressões de lista, envio ou bloqueio por role podem passar sem alarme.
- **Escopo**:
  - Validar carregamento da página `Agent Comms`.
  - Validar lista de conversas do `AgentChat` e abertura de uma conversa seeded.
  - Validar envio de mensagem com `editor` ou `admin`.
  - Validar bloqueio de envio para `viewer` e visibilidade admin-only do Mission Control.
- **Critérios de aceite**:
  - A página renderiza o heading `Agent Comms` e a área `Comms`.
  - Uma conversa seeded aparece na lista e, ao ser aberta, exibe ao menos uma mensagem existente.
  - Com `editor` ou `admin`, enviar uma mensagem nova adiciona um item visível na conversa ou substitui o placeholder otimista pelo registro persistido.
  - Com `viewer`, o envio fica bloqueado de forma observável e nenhuma nova mensagem é persistida na conversa.
  - Com `admin`, o painel `Mission Control (Admin)` mostra a interface real; com `viewer` ou `editor`, a UI mostra o placeholder `Available for admin accounts only.`.
- **Abordagem de teste**:
  - Reaproveitar mensagens seeded para leitura.
  - Criar mensagem única por execução para validar envio.
  - Usar usuários `viewer`, `editor` e `admin` já preparados para o spec de RBAC.
- **Dependências/Pré-requisitos**:
  - Issue 01 e Issue 06.
  - Massa de chat seeded ou fixture equivalente.
- **Labels sugeridas**: `area:test-e2e`, `type:test`, `priority:P1`, `domain:chat`, `domain:agents`, `domain:rbac`
- **Files**:
  - `tests/e2e/agent-comms-chat.spec.ts`
  - `tests/e2e/page-objects/agent-comms-page.ts`
- **Research References**:
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 41-47) - Agent Comms, AgentChat e Mission Control.
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 96-101) - lacuna explícita de Agent Comms/Chat.
- **Dependencies**:
  - Task 1.1 completion.
  - Task 1.6 completion.

### Task 2.3: Issue 09 - Cobrir cron board, automations e model health local

- **Título**: Ops E2E: cron board, automations e health do Ollama/OpenClaw
- **Prioridade**: P1
- **Problema/Risco**: Cron e automations são operação autônoma do sistema; model health é sinal de prontidão local. Regressões nessas superfícies tendem a aparecer tarde demais sem E2E controlado.
- **Escopo**:
  - Validar renderização do cron board com jobs.
  - Exercitar uma ação segura de cron ou edição controlada em ambiente de teste.
  - Validar carregamento da superfície de automations.
  - Cobrir cenário saudável e degradado de model health.
- **Critérios de aceite**:
  - O cron board exibe ao menos um job, estado vazio explícito ou mensagem controlada, sem crash da tela.
  - Executar uma ação segura de cron gera mudança observável como badge, toast, timestamp ou status atualizado.
  - A página de automations renderiza a lista principal ou estado vazio coerente.
  - Model health exibe um estado saudável e um estado degradado controlado, ambos reconhecíveis na UI.
- **Abordagem de teste**:
  - Usar fixtures de filesystem para `cron/jobs.json` e `openclaw.json`.
  - Stubar chamadas do Ollama quando o objetivo for a UI.
- **Dependências/Pré-requisitos**:
  - Phase 1 concluída.
- **Labels sugeridas**: `area:test-e2e`, `type:test`, `priority:P1`, `domain:cron`, `domain:automations`, `domain:ollama`
- **Files**:
  - `tests/e2e/cron-operations.spec.ts`
  - `tests/e2e/model-health.spec.ts`
  - `tests/e2e/page-objects/cron-page.ts`
- **Research References**:
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 69-73) - cron, cron board e model health.
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 104-110) - dependência de filesystem e stubs.
- **Dependencies**:
  - Phase 1 completion.

### Task 2.4: Issue 10 - Cobrir agents, workspace roots e troca de instância

- **Título**: Agents E2E: descoberta dinâmica, workspace roots e troca multi-instance
- **Prioridade**: P1
- **Problema/Risco**: A operação multi-instance é um diferencial do produto. Se a troca de instância ou a descoberta dinâmica quebrar, o impacto é alto e hoje não há cobertura E2E específica.
- **Escopo**:
  - Validar carregamento da página de agents.
  - Validar descoberta dinâmica de agentes em instância controlada.
  - Validar troca de instância em ao menos uma superfície suportada.
  - Validar workspace roots mínimos por instância.
- **Critérios de aceite**:
  - A UI exibe agentes da instância atual com nomes ou identificadores esperados.
  - Trocar a instância altera o conjunto visível de dados na tela.
  - Após reload, a instância selecionada e seu conteúdo permanecem consistentes.
  - Workspace roots exibe pelo menos um caminho esperado ou estado vazio explícito por instância.
- **Abordagem de teste**:
  - Montar duas instâncias sintéticas com configurações distintas.
  - Verificar diferenças observáveis na UI.
- **Dependências/Pré-requisitos**:
  - Phase 1 concluída.
- **Labels sugeridas**: `area:test-e2e`, `type:test`, `priority:P1`, `domain:agents`, `domain:multi-instance`, `domain:openclaw`
- **Files**:
  - `tests/e2e/agents-multi-instance.spec.ts`
  - `tests/e2e/page-objects/agents-page.ts`
  - `tests/e2e/fixtures/openclaw-instances.ts`
- **Research References**:
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 75-78) - multi-instance e workspace.
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 99-100) - gap de multi-instance e operação ampliada.
- **Dependencies**:
  - Phase 1 completion.

### Task 2.5: Issue 11 - Cobrir settings, memory e deploy health por instância

- **Título**: Settings E2E: políticas por instância, memory health e deploy health
- **Prioridade**: P1
- **Problema/Risco**: Settings, memory e deploy health sustentam troubleshooting e governança operacional. Regressões aqui podem bloquear incident response e tuning do sistema.
- **Escopo**:
  - Validar descoberta de instâncias em settings.
  - Validar edição/salvamento de ao menos uma policy quando disponível.
  - Validar carregamento da página memory e troca de instância.
  - Validar deploy health saudável e degradado controlado.
- **Critérios de aceite**:
  - Settings lista as instâncias configuradas e permite selecionar uma delas.
  - Uma alteração de policy exibida na UI persiste após salvar e recarregar a página, quando o ambiente de teste suportar escrita.
  - Memory mostra health/effects/alerts ou estados vazios explícitos da instância selecionada.
  - Deploy health exibe estado saudável e estado degradado legível sem quebrar a tela.
- **Abordagem de teste**:
  - Usar fixtures de instância e arquivos health por instância.
  - Stubar CLI quando só a interpretação do estado for relevante.
- **Dependências/Pré-requisitos**:
  - Task 2.4 preferencialmente concluída.
- **Labels sugeridas**: `area:test-e2e`, `type:test`, `priority:P1`, `domain:settings`, `domain:memory`, `domain:deploy`
- **Files**:
  - `tests/e2e/settings-memory-health.spec.ts`
  - `tests/e2e/deploy-health.spec.ts`
- **Research References**:
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 84-86) - settings, memory e deploy.
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 75-78) - dependência de instâncias.
- **Dependencies**:
  - Task 2.4 completion preferred.

### Task 2.6: Issue 12 - Cobrir analytics, benchmarks e integrações em estados degradados

- **Título**: Analytics E2E: dashboard analítico, benchmark e estados degradados de integrações
- **Prioridade**: P1
- **Problema/Risco**: Analytics agrega múltiplos conectores e erros parciais são prováveis. Sem E2E com stubs controlados, a UI pode quebrar justamente quando o ambiente está degradado.
- **Escopo**:
  - Validar renderização da página analytics.
  - Validar benchmark ou bloco analítico principal exposto na UI.
  - Validar estados degradados de integrações opcionais.
  - Garantir que a página continua utilizável com dados parciais.
- **Critérios de aceite**:
  - A página analytics carrega o heading principal e ao menos um bloco de gráfico, tabela ou resumo.
  - Um cenário degradado controlado de integração exibe mensagem, badge ou estado de erro legível.
  - O restante da página continua renderizando mesmo com um provedor falhando.
  - O spec não depende de Plausible, GA4, X, LinkedIn ou Mailchimp reais.
- **Abordagem de teste**:
  - Stubar respostas das integrações externas.
  - Validar apenas a reação da UI e a resiliência da página.
- **Dependências/Pré-requisitos**:
  - Phase 1 concluída.
- **Labels sugeridas**: `area:test-e2e`, `type:test`, `priority:P1`, `domain:analytics`, `domain:integrations`
- **Files**:
  - `tests/e2e/analytics-degraded-states.spec.ts`
  - `tests/e2e/page-objects/analytics-page.ts`
- **Research References**:
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 80-82) - analytics e degradados.
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 119-127) - guidance de stubs e critérios observáveis.
- **Dependencies**:
  - Phase 1 completion.

## Phase 3: Cobertura operacional complementar e estabilidade

### Task 3.1: Issue 13 - Cobrir webhooks inbound e reflexos na UI operacional

- **Título**: Webhook E2E: evento inbound autenticado refletindo em notificações e activity feed
- **Prioridade**: P1
- **Problema/Risco**: O webhook gera side effects locais reais, mas a suíte ainda não garante que o evento chega à UI operacional da forma esperada.
- **Escopo**:
  - Enviar payload válido para `/api/webhook/telegram`.
  - Validar reflexo em feed, notificação ou outra superfície operacional observável.
  - Cobrir erro de autenticação por API key inválida.
- **Critérios de aceite**:
  - Um evento válido gera ao menos um item visível identificável por conteúdo único na UI.
  - Um evento com API key inválida retorna erro controlado e não cria reflexo visível na UI.
  - O cenário é determinístico e não depende de serviço externo.
- **Abordagem de teste**:
  - Combinar chamada API no setup do cenário com validação UI subsequente.
  - Usar identificador único no payload.
- **Dependências/Pré-requisitos**:
  - Phase 1 concluída.
- **Labels sugeridas**: `area:test-e2e`, `type:test`, `priority:P1`, `domain:webhook`, `domain:activity`
- **Files**:
  - `tests/e2e/webhook-notification-flow.spec.ts`
- **Research References**:
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 88-90) - webhook e side effects.
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 99-100) - gap de eventos inbound.
- **Dependencies**:
  - Phase 1 completion.

### Task 3.2: Issue 14 - Cobrir superfícies secundárias de observabilidade

- **Título**: Observability E2E: activity feed, experiments e superfícies secundárias
- **Prioridade**: P2
- **Problema/Risco**: Activity, experiments e superfícies similares tendem a quebrar em refactors porque ficam fora do caminho feliz principal.
- **Escopo**:
  - Validar carregamento da página activity.
  - Validar experiments com estado seeded/default.
  - Incluir ao menos mais uma superfície secundária navegável na matriz smoke ou read-only.
- **Critérios de aceite**:
  - Activity renderiza a lista principal, estado vazio ou filtro básico sem erro fatal.
  - Experiments renderiza dados seeded/default ou um estado vazio coerente.
  - A superfície adicional escolhida entra no smoke/read-only com heading ou âncora principal verificável.
- **Abordagem de teste**:
  - Cobertura leve e predominantemente read-only.
  - Reusar helpers e auth já prontos.
- **Dependências/Pré-requisitos**:
  - Phase 1 concluída.
- **Labels sugeridas**: `area:test-e2e`, `type:test`, `priority:P2`, `domain:activity`, `domain:experiments`
- **Files**:
  - `tests/e2e/observability-secondary.smoke.spec.ts`
- **Research References**:
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 49-90) - mapa de superfícies operacionais.
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 156-172) - ordenação macro com superfícies secundárias depois dos domínios principais.
- **Dependencies**:
  - Phase 1 completion.

### Task 3.3: Issue 15 - Hardening de performance e infraestrutura da suíte após cobertura P0/P1 principal

- **Título**: E2E Suite Hardening: paralelismo amplo, orçamento de tempo e observabilidade de falhas
- **Prioridade**: P1
- **Problema/Risco**: A suíte precisa escalar com previsibilidade, mas o tuning pesado só faz sentido depois que os primeiros fluxos P0 e P1 críticos já estiverem protegidos. Antecipar isso cedo demais atrasa valor de negócio.
- **Escopo**:
  - Definir política estável de workers por ambiente.
  - Expandir paralelismo seguro para specs mutáveis com isolamento comprovado.
  - Configurar sharding, `maxFailures`, reporting e artefatos de troubleshooting.
  - Estabelecer orçamento de tempo por camada de suíte.
- **Critérios de aceite**:
  - Existe execução smoke para PR e full para cobertura ampliada, ambas documentadas e reproduzíveis.
  - Specs mutáveis que rodam em paralelo demonstram isolamento explícito de estado.
  - A suíte gera artefatos úteis de diagnóstico em falha, como trace, screenshot ou report HTML.
  - Há baseline registrada de tempo por camada ou domínio, com critério objetivo para entrada em smoke versus full.
- **Abordagem de teste**:
  - Medir incrementalmente a suíte já existente em vez de refazer tudo em big-bang.
  - Ajustar workers, shards e retries depois que a cobertura principal estiver estabelecida.
- **Dependências/Pré-requisitos**:
  - Issues P0 concluídas.
  - Preferencialmente bloco P1 principal concluído ou bem encaminhado.
- **Labels sugeridas**: `area:test-e2e`, `type:infra`, `priority:P1`, `domain:platform`, `theme:performance`
- **Files**:
  - `playwright.config.ts`
  - `.github/workflows/*` ou pipeline equivalente, se existir.
  - `tests/e2e/fixtures.ts`
- **Research References**:
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 104-127) - restrições de execução, polling, isolamento e stubs.
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 156-172) - hardening pesado como etapa posterior.
- **Dependencies**:
  - Phase 1 completion.

## Ordenação de execução recomendada

1. Issue 01 - E2E Foundation: auth reutilizável, helpers comuns e isolamento básico de estado.
2. Issue 02 - Auth E2E: login UI, redirect para `from` e shell protegida.
3. Issue 03 - Overview E2E: home operacional, action items e sinais principais da operação.
4. Issue 04 - CRM E2E: criação de lead, filtros sincronizados por URL e transições de status.
5. Issue 05 - Outreach E2E: aprovação de sequência, mudança de status de lead e suppression.
6. Issue 06 - RBAC E2E: viewer, editor e admin em leitura, escrita e áreas administrativas.
7. Issue 07 - Content E2E: filtros, fila editorial e transição de status de conteúdo.
8. Issue 08 - Agent Comms E2E: lista de conversas, envio de mensagem, bloqueio por role e Mission Control admin-only.
9. Issue 09 - Ops E2E: cron board, automations e health do Ollama/OpenClaw.
10. Issue 10 - Agents E2E: descoberta dinâmica, workspace roots e troca multi-instance.
11. Issue 11 - Settings E2E: políticas por instância, memory health e deploy health.
12. Issue 12 - Analytics E2E: dashboard analítico, benchmark e estados degradados de integrações.
13. Issue 13 - Webhook E2E: evento inbound autenticado refletindo em notificações e activity feed.
14. Issue 14 - Observability E2E: activity feed, experiments e superfícies secundárias.
15. Issue 15 - E2E Suite Hardening: paralelismo amplo, orçamento de tempo e observabilidade de falhas.

## Iniciativas transversais

### Initiative A: Smoke enxuto e full progressivo

- `smoke` deve conter auth, Overview/Home e pelo menos um fluxo P0 de negócio.
- `full` concentra mutações amplas, degradação operacional e cenários com maior custo de setup.

### Initiative B: Usuários e dados dedicados por role

- A suíte precisa de usuários explícitos para `viewer`, `editor` e `admin`.
- Os cenários devem usar identificadores únicos por execução para reduzir colisões em banco e listas.

### Initiative C: Bloqueios por role observáveis

- Sempre que o objetivo for permissão, o aceite deve observar um resultado verificável: CTA ausente, botão disabled, placeholder, mensagem admin-only, `403` da própria app ou ausência de persistência.

### Initiative D: Dependências externas controladas

- Stubar integrações externas e dependências locais não determinísticas sempre que o alvo do teste for a reação da UI.

### Initiative E: Hardening só depois de valor entregue

- A fundação mínima entra cedo para destravar os testes.
- O tuning pesado de paralelismo, orçamento e pipeline entra depois que os fluxos P0 já estiverem protegidos.

## Dependencies

- `@playwright/test`
- Next.js standalone build atual (`pnpm build` + `node .next/standalone/server.js`)
- SQLite local via `HERMES_STATE_DIR`
- Fixtures sintéticas para usuários por role, OpenClaw multi-instance, cron e health local

## Success Criteria

- O backlog cobre explicitamente auth, Overview/Home, CRM, outreach, RBAC, content, Agent Comms/Chat, cron, agents, analytics, settings, webhooks, multi-instance OpenClaw e health local.
- Cada issue tem critérios de aceite observáveis no browser e, quando necessário, na resposta da própria app.
- A ordem de execução entrega valor P0 antes de hardening pesado.<!-- markdownlint-disable-file -->

# Task Details: Backlog de cobertura E2E 360

## Research Reference

**Source Research**: #file:../research/20260418-e2e-coverage-backlog-research.md

## Phase 1: Fundação da suíte e fluxos P0

### Task 1.1: Issue 01 - Estruturar a fundação Playwright para auth reutilizável, isolamento e segmentação da suíte

- **Título**: E2E Foundation: auth reutilizável, fixtures de estado e segmentação smoke/full
- **Prioridade**: P0
- **Problema/Risco**: A suíte atual é estreita, serial e faz login ad hoc por teste/API, o que reduz throughput e cria base frágil para escalar cobertura. Sem foundation, cada novo spec tende a duplicar setup, aumentar tempo e gerar flakes por estado compartilhado.
- **Escopo**:
  - Introduzir setup de autenticação por API com `storageState` reutilizável.
  - Definir fixtures comuns para usuário autenticado, state dir isolado e helpers de navegação.
  - Separar testes em ao menos dois grupos executáveis: `smoke` e `full`.
  - Preparar convenção de arquivos e naming por domínio (`auth`, `crm`, `outreach`, `content`, `ops`).
- **Critérios de aceite**:
  - Existe fluxo padrão para iniciar testes autenticados sem repetir login UI em cada cenário.
  - Existe mecanismo explícito de isolamento de estado para testes com mutação.
  - A suíte pode rodar smoke sem obrigar execução de todos os fluxos completos.
  - Documentação mínima do harness está versionada junto da suíte.
- **Abordagem de teste**:
  - Usar auth por API para gerar `storageState`.
  - Definir fixture por worker ou por projeto para state dir/banco isolado.
  - Manter `trace` somente em retry e adicionar tagging/projetos para smoke/full.
- **Dependências/Pré-requisitos**:
  - Nenhuma; issue fundacional.
  - Confirmar convenção de diretórios sob `tests/e2e` e possível pasta auxiliar `playwright/`.
- **Labels sugeridas**: `area:test-e2e`, `type:infra`, `priority:P0`, `domain:auth`, `domain:platform`
- **Files**:
  - `playwright.config.ts` - segmentação da suíte, projetos/tags e política de workers.
  - `tests/e2e/auth.setup.ts` - setup de autenticação reutilizável.
  - `tests/e2e/fixtures.ts` - fixtures comuns de auth/estado.
  - `tests/e2e/utils/*` - helpers de navegação, API login e dados.
- **Research References**:
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 13-22) - estado atual, build cost e setup existente.
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 93-119) - restrições, auth reutilizável, paralelismo e boas práticas Playwright.
- **Dependencies**:
  - Base para todas as demais issues.

### Task 1.2: Issue 02 - Cobrir login UI, redirect e smoke das rotas protegidas críticas

- **Título**: Auth + shell protegida: login UI, persistência de sessão e smoke de rotas críticas
- **Prioridade**: P0
- **Problema/Risco**: Hoje só há verificação via request/API. Regressões de formulário, redirect, cookie de sessão e bloqueio de rotas podem passar despercebidas.
- **Escopo**:
  - Cobrir login feliz e login inválido.
  - Validar redirect para `from` e acesso pós-login à home.
  - Validar smoke de carregamento das rotas críticas: overview, CRM, outreach, content, cron, agents, analytics, settings, memory.
  - Validar redirecionamento para `/login` ao acessar rota protegida sem sessão.
- **Critérios de aceite**:
  - O fluxo de login UI aprova credenciais válidas e exibe shell autenticada.
  - Credenciais inválidas exibem erro visível.
  - As rotas críticas renderizam título/âncora principal sem erro fatal na sessão autenticada.
  - Acesso não autenticado a pelo menos uma rota protegida redireciona corretamente.
- **Abordagem de teste**:
  - Um spec de auth UI.
  - Um spec smoke de shell autenticada, com asserts web-first e baixo acoplamento ao layout.
  - Reusar `storageState` gerado na foundation.
- **Dependências/Pré-requisitos**:
  - Issue 01 concluída.
- **Labels sugeridas**: `area:test-e2e`, `type:test`, `priority:P0`, `domain:auth`, `domain:overview`
- **Files**:
  - `tests/e2e/auth-ui.spec.ts`
  - `tests/e2e/protected-shell.smoke.spec.ts`
- **Research References**:
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 31-39) - login UI, overview e navegação protegida.
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 88-93) - lacunas de sessão/navegação.
- **Dependencies**:
  - Task 1.1 completion.

### Task 1.3: Issue 03 - Cobrir CRM end-to-end com criação, filtros e transições de lead

- **Título**: CRM E2E: criação de lead, filtros sincronizados por URL e transições de status
- **Prioridade**: P0
- **Problema/Risco**: CRM é um núcleo operacional do produto. Regressões em criação de lead, filtros, visualização list/kanban e transições de stage afetam o pipeline comercial e não têm cobertura E2E hoje.
- **Escopo**:
  - Criar lead pela UI com dados mínimos e validar persistência.
  - Validar filtros `status`, `tier`, `search`, `view` e `sort` sincronizados na URL.
  - Validar abertura de detalhe do lead.
  - Validar ao menos uma transição de status/stage refletida na UI após refresh.
- **Critérios de aceite**:
  - Um lead criado no teste aparece na listagem e pode ser encontrado por busca.
  - Os filtros alteram a URL e sobrevivem a reload/back-forward.
  - O detalhe do lead renderiza dados consistentes.
  - Mudança de status é refletida visualmente e permanece após recarga.
- **Abordagem de teste**:
  - Criar massa de dados por API/UI com identificador único por execução.
  - Usar fixture de limpeza ou namespace por worker para não colidir entre testes.
  - Verificar estado por UI, não por introspecção de implementação.
- **Dependências/Pré-requisitos**:
  - Issue 01 e 02.
  - Estratégia de isolamento para mutação em SQLite/state dir.
- **Labels sugeridas**: `area:test-e2e`, `type:test`, `priority:P0`, `domain:crm`
- **Files**:
  - `tests/e2e/crm-lead-lifecycle.spec.ts`
  - `tests/e2e/page-objects/crm-page.ts`
- **Research References**:
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 41-44) - fluxo e riscos de CRM.
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 88-100) - lacunas e necessidade de isolamento.
- **Dependencies**:
  - Task 1.1 completion.
  - Task 1.2 completion.

### Task 1.4: Issue 04 - Cobrir outreach, approvals e suppression com mutações críticas

- **Título**: Outreach E2E: aprovação de sequência, mudança de status de lead e suppression
- **Prioridade**: P0
- **Problema/Risco**: Outreach combina aprovação operacional e mudança de estado comercial. Regressões aqui afetam execução real de campanhas e podem passar porque só há GET smoke hoje.
- **Escopo**:
  - Validar tabs principais de outreach.
  - Aprovar ou rejeitar uma sequência pendente.
  - Mudar status de um lead dentro do fluxo de outreach.
  - Validar visualização/listagem de suppression.
- **Critérios de aceite**:
  - Os contadores de approvals/suppression carregam corretamente.
  - A aprovação ou rejeição remove/atualiza o item pendente na UI.
  - A mudança de status do lead é persistida e visível.
  - O fluxo roda sem depender de ordem entre testes.
- **Abordagem de teste**:
  - Preparar fixture com lead e sequência em `pending_approval`.
  - Cobrir um caminho feliz de aprovação e um caminho mínimo de rejeição/erro controlado, se a UI suportar.
  - Evitar sleeps; aguardar transição de UI/toast/lista.
- **Dependências/Pré-requisitos**:
  - Issue 01 e 02.
  - Massa de dados determinística para approvals.
- **Labels sugeridas**: `area:test-e2e`, `type:test`, `priority:P0`, `domain:outreach`, `domain:approvals`
- **Files**:
  - `tests/e2e/outreach-approvals.spec.ts`
  - `tests/e2e/page-objects/outreach-page.ts`
- **Research References**:
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 46-49) - mutações e tabs de outreach/approvals.
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 88-93) - lacuna de mutações críticas.
- **Dependencies**:
  - Task 1.1 completion.
  - Task 1.2 completion.

## Phase 2: Expansão de domínio P1

### Task 2.1: Issue 05 - Cobrir content ops com mudança de status e fila editorial

- **Título**: Content E2E: filtros, fila editorial e transição de status de conteúdo
- **Prioridade**: P1
- **Problema/Risco**: O domínio de conteúdo tem mutação com writeback e audit log. Sem E2E, regressões podem quebrar aprovação/editorial sem sinal precoce.
- **Escopo**:
  - Navegar pela página de conteúdo.
  - Filtrar por status/plataforma/pillar, se exposto na UI.
  - Alterar status de um item de conteúdo pela UI.
  - Validar reflexo em fila de approvals quando aplicável.
- **Critérios de aceite**:
  - A listagem responde aos filtros visíveis.
  - Uma mudança de status é refletida na UI e sobrevive a recarga.
  - O caminho de aprovação editorial relevante fica coberto por UI e não só por API.
- **Abordagem de teste**:
  - Usar dataset com posts em estados distintos.
  - Validar somente comportamento visível e dados exibidos.
- **Dependências/Pré-requisitos**:
  - Issue 01.
  - Preferencialmente após Issue 04 para reutilizar padrões de approvals.
- **Labels sugeridas**: `area:test-e2e`, `type:test`, `priority:P1`, `domain:content`
- **Files**:
  - `tests/e2e/content-status.spec.ts`
  - `tests/e2e/page-objects/content-page.ts`
- **Research References**:
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 51-53) - mutação de conteúdo com writeback/audit.
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 125-128) - priorização de fluxos críticos.
- **Dependencies**:
  - Phase 1 completion.

### Task 2.2: Issue 06 - Cobrir cron board, automations e model health local

- **Título**: Ops E2E: cron board, automations e health do Ollama/OpenClaw
- **Prioridade**: P1
- **Problema/Risco**: Cron e automations são centrais para operação autônoma. Regressões em edição de jobs, leitura de status live ou health de modelo local tendem a ser descobertas tarde demais.
- **Escopo**:
  - Validar renderização do cron board com jobs carregados.
  - Validar pelo menos uma ação segura no cron board, como toggle/run-now ou edição controlada de JSON em ambiente de teste.
  - Validar tela/superfície de automations.
  - Validar estados `ok` e degradado de model health/Ollama.
- **Critérios de aceite**:
  - O cron board renderiza jobs e status sem erro.
  - Uma operação controlada em job reflete mudança observável.
  - Model health cobre cenário com modelo requerido disponível e cenário degradado/missing via stub/fixture.
  - Não há dependência de um Ollama real para todos os caminhos da suíte.
- **Abordagem de teste**:
  - Usar fixtures de filesystem para `cron/jobs.json` e `openclaw.json` em state dir de teste.
  - Stubar chamadas para `/api/tags` e `/api/ps` do Ollama quando o objetivo for estado da UI.
- **Dependências/Pré-requisitos**:
  - Issue 01.
  - Harness de arquivos temporários por worker/projeto.
- **Labels sugeridas**: `area:test-e2e`, `type:test`, `priority:P1`, `domain:cron`, `domain:automations`, `domain:ollama`
- **Files**:
  - `tests/e2e/cron-operations.spec.ts`
  - `tests/e2e/model-health.spec.ts`
  - `tests/e2e/page-objects/cron-page.ts`
- **Research References**:
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 55-59) - cron board e automations.
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 82-84) - model health/Ollama.
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 97-100) - risco de depender de arquivos externos.
- **Dependencies**:
  - Phase 1 completion.

### Task 2.3: Issue 07 - Cobrir agents, workspace roots e troca de instância

- **Título**: Agents E2E: descoberta dinâmica, workspace roots e troca multi-instance
- **Prioridade**: P1
- **Problema/Risco**: O diferencial do produto é operar sobre OpenClaw dinâmico e multi-instance. Sem E2E aqui, é fácil quebrar resolução de instância, workspaces e labels de agentes sem perceber.
- **Escopo**:
  - Validar carregamento da página de agents.
  - Validar descoberta dinâmica de agentes a partir de `openclaw.json`/filesystem de teste.
  - Validar troca de instância em pelo menos uma superfície UI que suporte `instance`.
  - Validar resposta de workspace roots e mapeamento mínimo por instância.
- **Critérios de aceite**:
  - A UI exibe agentes da instância correta.
  - Ao trocar instância, o conteúdo relevante muda e permanece consistente após refresh.
  - Workspace roots exibem a estrutura esperada sem duplicidade óbvia.
- **Abordagem de teste**:
  - Preparar duas instâncias sintéticas via `HERMES_OPENCLAW_INSTANCES` com configurações e agentes distintos.
  - Validar por UI e, quando necessário, por interceptação de chamadas da própria app.
- **Dependências/Pré-requisitos**:
  - Issue 01.
  - Fixtures de filesystem multi-instance.
- **Labels sugeridas**: `area:test-e2e`, `type:test`, `priority:P1`, `domain:agents`, `domain:multi-instance`, `domain:openclaw`
- **Files**:
  - `tests/e2e/agents-multi-instance.spec.ts`
  - `tests/e2e/page-objects/agents-page.ts`
  - `tests/e2e/fixtures/openclaw-instances.ts`
- **Research References**:
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 61-65) - multi-instance, settings/memory e workspace roots.
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 90-91) - gap de multi-instance.
- **Dependencies**:
  - Phase 1 completion.

### Task 2.4: Issue 08 - Cobrir analytics, benchmarks e integrações em estados degradados

- **Título**: Analytics E2E: dashboard analítico, benchmark e estados degradados de integrações
- **Prioridade**: P1
- **Problema/Risco**: Analytics agrega múltiplos conectores externos. Sem cobertura E2E controlada, a UI pode quebrar em estados parciais, desconectados ou com erro sem ser percebida.
- **Escopo**:
  - Validar renderização da página analytics com provider interno/default.
  - Validar benchmark/cycle-time exposto na UI, se presente.
  - Validar estados `configured=false`, `error` e dados parciais para conectores externos.
  - Validar que a UI continua funcional quando integrações opcionais não estão configuradas.
- **Critérios de aceite**:
  - A página analytics carrega os blocos principais com dados controlados.
  - A UI comunica claramente estado degradado de conectores sem quebrar a página.
  - Pelo menos um cenário de retry/error fica coberto via stub controlado.
- **Abordagem de teste**:
  - Stubar respostas das integrações externas e validar só a reação da UI.
  - Não depender de Plausible, GA4, X, LinkedIn ou Mailchimp reais.
- **Dependências/Pré-requisitos**:
  - Issue 01.
  - Convenção de network stubs para integrações externas.
- **Labels sugeridas**: `area:test-e2e`, `type:test`, `priority:P1`, `domain:analytics`, `domain:integrations`
- **Files**:
  - `tests/e2e/analytics-degraded-states.spec.ts`
  - `tests/e2e/page-objects/analytics-page.ts`
- **Research References**:
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 67-70) - analytics e integrações degradadas.
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 118-119) - recomendação de stubar terceiros.
- **Dependencies**:
  - Phase 1 completion.

### Task 2.5: Issue 09 - Cobrir settings, memory e deploy health por instância

- **Título**: Settings E2E: políticas por instância, memory health e deploy health
- **Prioridade**: P1
- **Problema/Risco**: Settings e memory concentram superfícies de operação por instância e health checks. Regressões aqui podem bloquear troubleshooting e tuning operacional.
- **Escopo**:
  - Validar descoberta de instâncias em settings.
  - Validar edição/salvamento de pelo menos uma policy por instância, se habilitada no ambiente de teste.
  - Validar carregamento da página memory e troca de instância.
  - Validar deploy health com cenário saudável e cenário degradado controlado.
- **Critérios de aceite**:
  - Settings mostra instâncias configuradas e separa estado por instância.
  - Memory exibe health/effects/alerts para a instância selecionada.
  - Deploy health não quebra a tela em caso de CLI/config ausentes; o estado degradado é legível.
- **Abordagem de teste**:
  - Usar fixtures de instâncias e arquivos health por instância.
  - Stubar ou encapsular chamadas a CLI quando a UI só precisa validar a interpretação do estado.
- **Dependências/Pré-requisitos**:
  - Issue 07 preferencialmente pronta.
  - Fixtures de filesystem multi-instance.
- **Labels sugeridas**: `area:test-e2e`, `type:test`, `priority:P1`, `domain:settings`, `domain:memory`, `domain:deploy`
- **Files**:
  - `tests/e2e/settings-memory-health.spec.ts`
  - `tests/e2e/deploy-health.spec.ts`
- **Research References**:
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 72-76) - settings, memory e deploy health.
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 63-64) - dependência de instância.
- **Dependencies**:
  - Task 2.3 completion preferred.

## Phase 3: Cobertura operacional ampla e hardening

### Task 3.1: Issue 10 - Cobrir webhooks inbound e reflexos na UI operacional

- **Título**: Webhook E2E: evento inbound autenticado refletindo em notificações e activity feed
- **Prioridade**: P1
- **Problema/Risco**: O webhook escreve em banco e activity log, mas não há teste E2E que garanta que o evento inbound realmente aparece nas superfícies operacionais.
- **Escopo**:
  - Enviar payload válido para `/api/webhook/telegram` com `x-api-key`.
  - Validar criação de notificação visível ou reflexo em live feed/activity.
  - Cobrir erro de autenticação com API key inválida.
- **Critérios de aceite**:
  - Um evento válido gera efeito observável na UI operacional.
  - Um evento inválido retorna erro esperado e não polui a UI.
  - O teste é determinístico e não depende de serviços externos.
- **Abordagem de teste**:
  - Combinar chamada API no setup do cenário com validação UI subsequente.
  - Usar payload com identificador único para localizar o evento.
- **Dependências/Pré-requisitos**:
  - Issue 01.
  - Acesso previsível a notificações/feed na UI.
- **Labels sugeridas**: `area:test-e2e`, `type:test`, `priority:P1`, `domain:webhook`, `domain:activity`
- **Files**:
  - `tests/e2e/webhook-notification-flow.spec.ts`
- **Research References**:
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 78-80) - comportamento do webhook.
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 91-92) - gap atual em eventos inbound.
- **Dependencies**:
  - Phase 1 completion.

### Task 3.2: Issue 11 - Cobrir superfícies secundárias de observabilidade: activity, experiments e research/memory edges

- **Título**: Observability E2E: activity feed, experiments/learnings e bordas de superfícies secundárias
- **Prioridade**: P2
- **Problema/Risco**: Mesmo após cobrir domínios principais, ainda restam superfícies usadas para análise operacional. Elas tendem a quebrar em refactors porque não ficam no caminho feliz diário.
- **Escopo**:
  - Validar carregamento de activity feed com filtro mínimo.
  - Validar experiments/learnings em estado seeded/default.
  - Cobrir smoke de research e/ou outras superfícies secundárias, conforme presença real de UI navegável.
- **Critérios de aceite**:
  - Activity feed e experiments renderizam dados seeded sem erro fatal.
  - Ao menos uma superfície secundária adicional entra na matriz de smoke.
- **Abordagem de teste**:
  - Cobertura leve, preferencialmente smoke/read-only.
  - Reusar fixtures e helpers já estabelecidos.
- **Dependências/Pré-requisitos**:
  - Phase 1 pronta.
  - Phase 2 preferencialmente avançada para reaproveitar padrões.
- **Labels sugeridas**: `area:test-e2e`, `type:test`, `priority:P2`, `domain:activity`, `domain:experiments`
- **Files**:
  - `tests/e2e/observability-secondary.smoke.spec.ts`
- **Research References**:
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 24-29) - mapa de superfícies.
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 145-155) - ordenação macro recomendada.
- **Dependencies**:
  - Phase 1 completion.

### Task 3.3: Issue 12 - Hardening de performance e infraestrutura da suíte

- **Título**: E2E Suite Hardening: performance, paralelismo controlado, dados por worker e observabilidade de falhas
- **Prioridade**: P0
- **Problema/Risco**: Mesmo com boa cobertura, a suíte falhará como ferramenta se ficar lenta, instável ou cara demais. Hoje a configuração atual não foi desenhada para escala.
- **Escopo**:
  - Definir política de workers por ambiente e migração gradual para paralelismo seguro.
  - Particionar dados/estado por worker.
  - Separar pipeline smoke de pipeline full.
  - Configurar `maxFailures`, relatórios e troubleshooting com traces.
  - Medir baseline de duração por spec/domínio.
- **Critérios de aceite**:
  - Existe execução smoke otimizada para PR e full para rotina mais ampla.
  - Os testes mutáveis não compartilham banco/estado sem isolamento explícito.
  - A suíte em CI falha rápido e produz artefatos úteis de diagnóstico.
  - Existe baseline mensurável de duração e meta de crescimento controlado.
- **Abordagem de teste**:
  - Rodadas controladas com `--workers`, shards e tags.
  - Medição por reporter/artefato e ajuste incremental, não big-bang.
- **Dependências/Pré-requisitos**:
  - Issue 01 obrigatória.
  - Demais issues podem evoluir em paralelo depois da base mínima.
- **Labels sugeridas**: `area:test-e2e`, `type:infra`, `priority:P0`, `domain:platform`, `theme:performance`
- **Files**:
  - `playwright.config.ts`
  - `.github/workflows/*` ou pipeline equivalente, se existir posteriormente.
  - `tests/e2e/fixtures.ts`
- **Research References**:
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 95-119) - restrições, paralelismo, terceiros e confiabilidade.
  - #file:../research/20260418-e2e-coverage-backlog-research.md (Lines 145-155) - hardening como último bloco de execução lógica, mas com prioridade estrutural alta.
- **Dependencies**:
  - Task 1.1 completion.

## Ordenação de execução recomendada

1. Issue 01 - E2E Foundation: auth reutilizável, fixtures de estado e segmentação smoke/full.
2. Issue 12 - E2E Suite Hardening: performance, paralelismo controlado, dados por worker e observabilidade de falhas.
3. Issue 02 - Auth + shell protegida: login UI, persistência de sessão e smoke de rotas críticas.
4. Issue 03 - CRM E2E: criação de lead, filtros sincronizados por URL e transições de status.
5. Issue 04 - Outreach E2E: aprovação de sequência, mudança de status de lead e suppression.
6. Issue 05 - Content E2E: filtros, fila editorial e transição de status de conteúdo.
7. Issue 06 - Ops E2E: cron board, automations e health do Ollama/OpenClaw.
8. Issue 07 - Agents E2E: descoberta dinâmica, workspace roots e troca multi-instance.
9. Issue 09 - Settings E2E: políticas por instância, memory health e deploy health.
10. Issue 08 - Analytics E2E: dashboard analítico, benchmark e estados degradados de integrações.
11. Issue 10 - Webhook E2E: evento inbound autenticado refletindo em notificações e activity feed.
12. Issue 11 - Observability E2E: activity feed, experiments/learnings e bordas de superfícies secundárias.

## Iniciativas transversais de performance/infra da suíte

### Initiative A: Separar smoke, domain-full e ops-full

- Criar três grupos claros de execução para evitar que todo PR pague o custo da suíte completa.
- `smoke`: auth + shell + 1 fluxo crítico por domínio principal.
- `domain-full`: mutações de CRM/outreach/content.
- `ops-full`: cron/agents/settings/memory/webhook/integrações degradadas.

### Initiative B: Isolar estado por worker ou por projeto

- Não compartilhar `HERMES_STATE_DIR` entre specs mutáveis quando houver paralelismo.
- Gerar path temporário por worker e usar dados identificáveis por execução.

### Initiative C: Reduzir dependência de integrações externas

- Stubar provedores externos quando o objetivo for validar comportamento da UI.
- Reservar poucos testes contratuais de integração real, fora do caminho crítico do PR.

### Initiative D: Observabilidade de falha focada em trace e HTML report

- Manter `trace` em retry, preservar HTML report em CI e adicionar naming consistente de screenshots/traces.
- Padronizar mensagens de erro dos helpers para acelerar triagem.

### Initiative E: Orçamento de tempo da suíte

- Definir orçamento inicial por camada.
- Revisar cada nova issue com meta de duração incremental e critério para entrar em smoke ou full.

## Dependencies

- `@playwright/test`
- Next.js standalone build atual (`pnpm build` + `node .next/standalone/server.js`)
- SQLite local via `HERMES_STATE_DIR`
- Fixtures/arquivos sintéticos para OpenClaw multi-instance e cron health

## Success Criteria

- O backlog cobre auth, overview, CRM, outreach, content, cron, agents, analytics, settings, webhooks, multi-instance OpenClaw e Ollama local.
- Cada issue está pronta para virar GitHub issue sem refinamento adicional de escopo.
- A ordem de execução reduz risco cedo e controla crescimento de tempo da suíte.