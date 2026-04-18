<!-- markdownlint-disable-file -->

# Research: Backlog de cobertura E2E 360 para Hermes Dashboard

## Objetivo da pesquisa

Refinar o backlog E2E existente para que ele fique validável, acionável e alinhado ao risco real do produto, com cobertura explícita de Overview/Home, RBAC por role, Agent Comms/Chat e ordem de execução orientada a valor P0 antes de hardening pesado.

## Evidências verificadas no repositório

### Estado atual da suíte E2E

- A configuração atual do Playwright usa `testDir: './tests/e2e'`, `fullyParallel: false`, `trace: 'on-first-retry'` e sobe a aplicação standalone em `127.0.0.1:3010` com `HERMES_STATE_DIR=.tmp/e2e-state`. Evidência: `playwright.config.ts`.
- O comando oficial de E2E é `pnpm test:e2e`, que executa `pnpm build && playwright test`. Isso eleva o custo marginal de qualquer expansão de suíte e reforça a necessidade de separar smoke de cobertura ampla. Evidência: `package.json`.
- A cobertura atual está concentrada em `tests/e2e/auth-and-api.spec.ts`, com smoke de autenticação e leitura de APIs protegidas como `overview`, `crm`, `outreach`, `content`, `analytics`, `cron`, `settings` e `benchmarks`. Não há jornadas UI completas nem mutações críticas via browser. Evidência: `tests/e2e/auth-and-api.spec.ts`.

### Setup, autenticação e seed relevantes para E2E

- O banco SQLite é criado a partir de `HERMES_DB_PATH` ou `HERMES_STATE_DIR/hermes.db`, com diretório de estado criado sob demanda. Evidência: `src/lib/db.ts` e `src/lib/hermes-state.ts`.
- O primeiro usuário admin é seeded automaticamente por `seedAdmin()` com `AUTH_USER` e `AUTH_PASS` quando a tabela `users` está vazia. Isso facilita autenticação determinística para a suíte. Evidência: `src/lib/auth.ts`.
- O projeto já suporta criação de usuários com papel `admin`, `editor` e `viewer`, inclusive com normalização de papéis legados. Evidência: `src/lib/auth.ts`.
- Mensagens demo de chat são seeded na inicialização, o que ajuda a garantir lista inicial de conversas e mensagens para superfícies de chat. Evidência: `src/lib/seed-chat.ts`.
- Há um script de seed (`scripts/seed.ts`) para massa de dados mais rica, mas a suíte atual não opera sobre fixtures E2E explicitamente versionadas por domínio. Evidência: `scripts/seed.ts`.

### Overview/Home como superfície operacional de primeira linha

- A home em `src/app/page.tsx` renderiza a página `Overview`, faz polling de `/api/overview` a cada 30 segundos e de `/api/x-budget` a cada 60 segundos, além de consultar benchmark de cycle time. Isso a coloca como superfície operacional primária e também como fonte de flakes se a suíte não usar assertions web-first. Evidência: `src/app/page.tsx`.
- A página mostra cards de métricas, faixa de status de agentes, action items com links para `Content Queue` e `Outreach Approvals`, além de activity recente e demais widgets operacionais. Evidência: `src/app/page.tsx`.
- O papel do usuário é carregado via `/api/auth/me`, e a página deriva `canEdit` de `admin` ou `editor`, o que torna a home também sensível a permissões em ações operacionais. Evidência: `src/app/page.tsx`.
- `/api/overview` agrega stats, alertas, activity log, métricas diárias e agent briefs, misturando dados SQL com configuração dinâmica de agentes. Evidência: `src/app/api/overview/route.ts`.

### RBAC e áreas administrativas

- O modelo de RBAC define três roles explícitas: `admin`, `editor` e `viewer`. Evidência: `src/lib/rbac.ts`.
- As capabilities verificadas são `read_dashboard`, `write_ops`, `approve_automations`, `chat_send`, `manage_users`, `view_audit` e `manage_system`. Evidência: `src/lib/rbac.ts`.
- A matriz de capabilities confirma: `viewer` tem apenas `read_dashboard`; `editor` tem `read_dashboard`, `write_ops`, `approve_automations` e `chat_send`; `admin` possui todas as capabilities. Evidência: `src/lib/rbac.ts`.
- A camada de API reforça isso com `requireApiAdmin`, `requireApiEditor` e `requireApiCapability`, retornando `401`, `403` e mensagens específicas como `Admin access required`, `Editor access required` e `Access denied`. Evidência: `src/lib/api-auth.ts`.
- Há superfícies administrativas explícitas em settings, com texto `Admin access required to manage users and roles`, além de controles de role `admin`, `editor` e `viewer`. Evidência: `src/app/settings/page.tsx`.
- Em approvals, ações de aprovação em lote ficam com tooltip `Admin only`, reforçando a necessidade de E2E específico de bloqueio por role em áreas administrativas. Evidência: `src/app/approvals/page.tsx`.

### Agent Comms, Chat e Mission Control

- A página `src/app/agents/comms/page.tsx` expõe `Agent Comms` com dois blocos: `AgentChat` para todos os usuários autenticados e `MissionControlChat` somente quando `role === 'admin'`. Para não-admins, a UI renderiza o painel `Mission Control (Admin)` com a mensagem `Available for admin accounts only.`.
- `AgentChat` carrega o usuário via `/api/auth/me`, deriva `canEdit` apenas para `admin` e `editor`, lista conversas via `/api/chat/conversations`, carrega mensagens via `/api/chat/messages` e bloqueia envio quando `!canEdit`. Evidência: `src/components/chat/agent-chat.tsx`.
- O envio de mensagem ocorre por `POST /api/chat/messages`, com atualização otimista e tratamento visível de falha. Isso é um fluxo E2E natural para `editor` e `admin`, e um fluxo de bloqueio para `viewer`. Evidência: `src/components/chat/agent-chat.tsx`.
- `MissionControlChat` lista conversas e mensagens via `/api/mission-control/chat`, com modos `orchestrator` e `agent_bridge`, seleção de conversa e envio por POST. Evidência: `src/components/chat/mission-control-chat.tsx`.
- Como o banco já recebe mensagens demo, existe base mínima para cobertura de lista de conversas e leitura sem depender de integração externa. Evidência: `src/lib/seed-chat.ts`.

### Domínios de operação principais já confirmados

#### Auth e navegação protegida

- O login UI faz POST para `/api/auth/login`, trata erro de credenciais, redireciona para `from` ou `/` e executa `router.refresh()`. Evidência: `src/app/login/page.tsx`.
- A suite atual não valida redirect de rota protegida para `/login` nem persistência de sessão no browser. Evidência: `tests/e2e/auth-and-api.spec.ts`.

#### CRM

- A UI de CRM mantém filtros sincronizados com URL e expõe fluxo de criação/edição de lead, com papel derivado do usuário autenticado e `canEdit` restrito a `admin` e `editor`. Evidência: `src/app/crm/page.tsx`.

#### Outreach e approvals

- Outreach executa mutações de lead e sequência, com tabs de pipeline, leads, sequences, approvals e suppression. Evidência: `src/app/outreach/page.tsx`.
- Approvals possui áreas claramente sensíveis a papel, inclusive ações admin-only. Evidência: `src/app/approvals/page.tsx`.

#### Content

- `/api/content` possui PATCH com writeback e audit log, tornando-o candidato forte para E2E de mutação. Evidência: `src/app/api/content/route.ts`.

#### Cron, automations e model health

- `/api/cron` mistura leitura operacional com operações dependentes de arquivos OpenClaw locais. Evidência: `src/app/api/cron/route.ts`.
- O cron board expõe edição de JSON e ações operacionais que exigem ambiente de teste controlado. Evidência: `src/components/cron/cron-board.tsx`.
- `/api/model-health` valida conectividade com Ollama e modelos requeridos, retornando estados `ok`, `missing` e `running`. Evidência: `src/app/api/model-health/route.ts`.

#### Agents, workspace e multi-instance

- O produto suporta múltiplas instâncias via `HERMES_OPENCLAW_INSTANCES`, com resolução de agentes, cron, health e logs por instância. Evidência: `src/lib/instances.ts`.
- `agents/workspace` e `settings` também derivam role do usuário e liberam ações de edição apenas para `admin` ou `editor`. Evidência: `src/app/agents/workspace/page.tsx` e `src/app/settings/page.tsx`.

#### Analytics e integrações degradadas

- `/api/analytics` agrega dados internos e externos; conectores podem operar em estado degradado e isso deve ser testado com stubs. Evidência: `src/app/api/analytics/route.ts`.

#### Settings, memory e deploy health

- `settings`, `memory` e `deploy` são superfícies centrais para troubleshooting operacional, com dependências por instância e health checks locais. Evidência: `src/app/settings/page.tsx`, `src/app/memory/page.tsx` e `src/app/api/deploy-status/route.ts`.

#### Webhooks e eventos inbound

- O endpoint `/api/webhook/telegram` exige `x-api-key`, escreve notificações e activity log e é altamente testável via efeito observável na UI. Evidência: `src/app/api/webhook/telegram/route.ts`.

## Lacunas objetivas da cobertura atual

1. Não há cobertura UI de login, redirect e navegação protegida real.
2. Overview/Home ainda não está tratada como superfície operacional de primeira linha, apesar de concentrar observabilidade, action items e polling.
3. Não existe issue dedicada para validar RBAC fim a fim em `viewer`, `editor` e `admin`, cobrindo leitura, escrita e áreas administrativas.
4. Não existe issue dedicada para Agent Comms/Chat cobrindo lista de conversas, envio de mensagem, bloqueio por role e Mission Control admin-only.
5. Fluxos de mutação centrais como CRM, outreach, content e cron continuam sem cobertura UI completa.
6. Não há cobertura específica de superfícies role-sensitive como approvals em lote, settings de usuários e ações de chat.
7. Não há cobertura robusta de multi-instance, degradados operacionais e webhooks inbound com reflexo em UI.
8. Os critérios de aceite do backlog anterior ainda aceitam interpretação excessiva; a validação precisa de critérios observáveis no browser e na API da própria app.
9. O backlog anterior antecipava hardening pesado cedo demais; a ordem correta precisa proteger primeiro auth, overview e fluxos P0 de negócio.

## Restrições e riscos que afetam a ordem do backlog

- Como `pnpm test:e2e` faz build completo antes da execução, o backlog precisa produzir valor já nos primeiros fluxos P0, não só em infraestrutura pesada.
- Polling em Overview, chat e outras superfícies exige assertions web-first e espera por estado estável, não timeouts fixos.
- Fluxos de escrita precisam de isolamento de SQLite e/ou `HERMES_STATE_DIR` para evitar colisão entre workers.
- Domínios dependentes de OpenClaw, CLI e Ollama devem usar fixtures de filesystem e stubs de rede onde o objetivo é validar reação da UI e não a ferramenta externa.
- O hardening de performance é necessário, mas deve ser dividido entre uma fundação mínima habilitadora e uma etapa posterior de tuning, observabilidade e paralelismo amplo.

## Pesquisa externa: padrões Playwright aplicáveis

### Autenticação reutilizável

- A documentação do Playwright recomenda gerar `storageState` reutilizável via setup project ou autenticação por API quando isso existir. Esse padrão se encaixa no projeto, que já possui `/api/auth/login`.
- Para testes com mutação de estado, a orientação é usar isolamento por worker ou por projeto, com contas ou dados independentes.

### Confiabilidade e papel das assertions

- Playwright recomenda validar comportamento observável ao usuário com locators estáveis, web-first assertions e redução de dependência de sleeps.
- Para RBAC e áreas administrativas, critérios observáveis típicos são `403` em chamadas da própria app, botão desabilitado, ausência de CTA, painel de bloqueio ou mensagem explícita na UI.

### Dependências externas e ambientes locais

- Para integrações externas ou dependências locais fora do controle da suíte, a prática recomendada é stubar rede e/ou filesystem quando o objetivo é a reação da UI.
- Isso vale especialmente para analytics externos, Ollama e superfícies que leem arquivos OpenClaw ou invocam CLI.

## Implicações práticas para o backlog refinado

### Estrutura recomendada

- Camada 1: fundação mínima para autenticação reutilizável, helpers e isolamento básico.
- Camada 2: fluxos P0 que entregam valor imediato e cobrem o coração operacional do produto: auth, Overview/Home, CRM, outreach e RBAC.
- Camada 3: fluxos P1 de operação ampliada: content, Agent Comms/Chat, cron, agents, settings, analytics e degradados.
- Camada 4: superfícies complementares e hardening posterior, depois que os principais caminhos de negócio já estiverem protegidos.

### Critério de issue GitHub-ready para este backlog

Cada issue deve conter:

- título acionável por domínio;
- prioridade clara (`P0`, `P1` ou `P2`);
- problema/risco específico;
- escopo delimitado por fluxo e superfície;
- critérios de aceite observáveis, por exemplo:
  - renderiza heading, tabela, badge ou card específico;
  - cria, altera ou remove item visível na UI;
  - exibe toast, mensagem de erro ou estado vazio esperado;
  - persiste após reload;
  - bloqueia ação por role com texto, estado disabled ou resposta `403`/`401` esperada;
- abordagem de teste com fixture, stub ou massa de dados explícita;
- dependências e pré-requisitos;
- labels sugeridas.

### Ordenação macro recomendada

1. Fundação mínima da suíte: auth reutilizável, helpers e isolamento básico.
2. Auth UI, redirect e shell protegida.
3. Overview/Home como superfície operacional principal.
4. CRM com criação, filtros e transições.
5. Outreach e approvals com mutações críticas.
6. RBAC E2E dedicado cobrindo `viewer`, `editor` e `admin` em leitura, escrita e áreas administrativas.
7. Content ops e fila editorial.
8. Agent Comms/Chat com lista, envio, bloqueio por role e Mission Control admin-only.
9. Cron, automations e model health.
10. Agents, workspace e multi-instance.
11. Settings, memory e deploy health.
12. Analytics, benchmarks e integrações degradadas.
13. Webhook inbound e reflexos operacionais.
14. Activity, experiments e superfícies secundárias.
15. Hardening pesado de performance, paralelismo amplo e governança de tempo da suíte.

## Conclusão

O backlog refinado precisa deixar de ser genérico e passar a representar contratos verificáveis do produto: a home como centro operacional, RBAC real por role/capability e Agent Comms com caminhos permitidos e bloqueados. A fundação da suíte continua necessária, mas o primeiro bloco de execução deve proteger fluxos P0 imediatamente; o hardening amplo vem depois, quando já existir cobertura suficiente para justificar tuning mais pesado.<!-- markdownlint-disable-file -->

# Research: Backlog de cobertura E2E 360 para Hermes Dashboard

## Objetivo da pesquisa

Transformar o estado atual da suíte E2E do Hermes Dashboard em um backlog priorizado de issues GitHub-ready que maximize cobertura funcional, velocidade de execução e previsibilidade operacional.

## Evidências verificadas no repositório

### Estado atual da suíte E2E

- A configuração Playwright atual usa `testDir: './tests/e2e'`, `fullyParallel: false`, `trace: 'on-first-retry'` e sobe o app standalone localmente em `127.0.0.1:3010` com `HERMES_STATE_DIR=.tmp/e2e-state` e credenciais fixas para E2E. Evidência: `playwright.config.ts`.
- O comando de suíte atual é `pnpm test:e2e`, que executa `pnpm build && playwright test`. Isso significa que qualquer expansão de cobertura aumenta custo de build e de execução end-to-end completa. Evidência: `package.json`.
- A cobertura atual está concentrada em um único arquivo, `tests/e2e/auth-and-api.spec.ts`, com smoke tests de autenticação e leitura de APIs protegidas (`overview`, `crm`, `outreach`, `content`, `analytics`, `cron`, `settings`, `benchmarks`). Não há jornadas UI completas nem fluxos de mutação. Evidência: `tests/e2e/auth-and-api.spec.ts`.

### Setup, autenticação e isolamento de estado

- O banco SQLite é inicializado em `getDb()` com caminho derivado de `HERMES_DB_PATH` ou `HERMES_STATE_DIR/hermes.db`; a pasta de estado é criada sob demanda. Evidência: `src/lib/db.ts` e `src/lib/hermes-state.ts`.
- O primeiro usuário admin é seeded automaticamente por `seedAdmin()` usando `AUTH_USER` e `AUTH_PASS`, desde que a tabela `users` esteja vazia. Evidência: `src/lib/auth.ts`.
- Mensagens de chat demo são seeded na inicialização do banco, o que ajuda a garantir conteúdo inicial para superfícies de chat e feed. Evidência: `src/lib/seed-chat.ts`.
- Existe script de seed independente (`scripts/seed.ts`) para popular a base com leads, conteúdo, sequências e outros dados realistas, mas o fluxo E2E atual depende mais do boot automático da app do que de uma fixture explícita e versionada de testes. Evidência: `scripts/seed.ts`.

### Inventário funcional do produto relevante para E2E

#### Superfícies protegidas e operacionais

- `README.md` descreve o produto como um dashboard local-first de operações de marketing com CRM, outreach, content ops, analytics, experiments, automations, OpenClaw dinâmico, cron, deploy status, session auth e API key.
- As rotas top-level em `src/app/` incluem `activity`, `agents`, `analytics`, `approvals`, `automations`, `content`, `crm`, `cron`, `deploy`, `engagement`, `experiments`, `integrations`, `kpis`, `login`, `memory`, `outreach`, `research` e `settings`.

#### Auth e navegação protegida

- O login UI faz POST para `/api/auth/login`, trata erro de credenciais, redireciona para `from` ou `/` e dá `router.refresh()`. Evidência: `src/app/login/page.tsx`.
- As APIs protegidas exigem sessão ou API key via `requireApiUser` e, em vários fluxos de escrita, papel de editor via `requireApiEditor`.

#### Overview / mission control

- A home (`src/app/page.tsx`) faz polling periódico de `/api/overview` a cada 30s e de orçamento X a cada 60s, com toggle `realOnly`. Isso é uma superfície crítica de observabilidade e também um ponto de risco de flakes por polling e latência. Evidência: `src/app/page.tsx`.
- `/api/overview` agrega stats, alertas, activity log, métricas diárias e agent briefs, misturando dados SQL e configuração dinâmica de agentes. Evidência: `src/app/api/overview/route.ts`.

#### CRM

- A UI de CRM mantém filtros sincronizados com URL (`status`, `tier`, `search`, `view`, `sort`) e possui fluxo de criação de lead. Evidência: `src/app/crm/page.tsx`.
- `/api/crm` suporta leitura de lista e detalhe de lead; também há dependência de writeback e trilha de auditoria em fluxos de mutação relacionados. Evidência: `src/app/api/crm/route.ts`.

#### Outreach e aprovações

- A UI de Outreach executa `PATCH /api/leads` para mudar status do lead e `PATCH /api/sequences` para aprovar/rejeitar sequências, com tabs para pipeline, leads, sequences, approvals e suppression. Evidência: `src/app/outreach/page.tsx`.
- `/api/outreach` consolida leads, funnel e pending approvals; `/api/approvals` expõe conteúdo e sequências pendentes de aprovação. Evidência: `src/app/api/outreach/route.ts` e `src/app/api/approvals/route.ts`.

#### Content

- `/api/content` possui leitura filtrada e `PATCH` para atualização de status, com `writebackContentStatus()` e `logAudit()`. Isso é fluxo de negócio crítico e atualmente sem cobertura E2E UI. Evidência: `src/app/api/content/route.ts`.

#### Cron e automações

- `/api/cron` mistura leitura de jobs, notificação de execuções concluídas e operações que dependem de arquivos OpenClaw (`cron/jobs.json`). Evidência: `src/app/api/cron/route.ts`.
- O componente `cron-board` expõe edição do JSON completo dos jobs e status live do OpenClaw cron, além de integração com modelo preferido do Ollama. Evidência: `src/components/cron/cron-board.tsx`.
- `/api/automations` combina sinais de agente, decisões e histórico recente. Evidência: `src/app/api/automations/route.ts`.

#### Agents, OpenClaw multi-instance e workspace

- O sistema suporta múltiplas instâncias por `HERMES_OPENCLAW_INSTANCES`, com resolução de `openclaw.json`, `agents/`, `cron/`, `health/` e `logs/` por instância. Evidência: `src/lib/instances.ts`.
- `settings/page.tsx` descobre instâncias em `/api/instances` e salva políticas por instância. `memory/page.tsx` também troca instância e faz polling por instância. Evidência: `src/app/settings/page.tsx`, `src/app/memory/page.tsx`, `src/app/api/instances/route.ts`.
- `/api/agents` e `/api/agents/workspace-roots` dependem de configuração dinâmica do OpenClaw e mapeamento de workspaces. Evidência: `src/app/api/agents/route.ts` e `src/app/api/agents/workspace-roots/route.ts`.

#### Analytics e integrações externas

- `/api/analytics` agrega métricas internas e conectores externos (Plausible, GA4, X, LinkedIn), com retry e estados de health/configuração. Evidência: `src/app/api/analytics/route.ts`.
- Há endpoints de integrações como Mailchimp que explicitamente retornam estados degradados se configuração estiver ausente/inválida. Evidência: `src/app/api/integrations/mailchimp/route.ts`.

#### Settings, memória operacional e deploy health

- `/api/settings` expõe tamanho do banco, contagem por tabela e seed count. Evidência: `src/app/api/settings/route.ts`.
- `/api/memory-health` lê `memory-health.json` por instância; a página de memória depende de `/api/instances`, `/api/memory-health`, `/api/memory-effect`, `/api/memory-alerts` e similares. Evidência: `src/app/api/memory-health/route.ts` e `src/app/memory/page.tsx`.
- `/api/deploy-status` valida OpenClaw config via CLI e filesystem. Evidência: `src/app/api/deploy-status/route.ts`.

#### Webhooks e eventos inbound

- Existe endpoint webhook autenticado por `x-api-key` em `/api/webhook/telegram`, que cria notificação e registra activity log. É altamente testável por API + UI/feed/notification side effects. Evidência: `src/app/api/webhook/telegram/route.ts`.

#### Ollama local

- `/api/model-health` verifica conectividade com `OLLAMA_BASE_URL`, lista modelos requeridos pelo `openclaw.json` ou env vars e retorna estado `ok`/`missing`/`running`. Evidência: `src/app/api/model-health/route.ts`.

## Lacunas objetivas da cobertura atual

1. Não há coverage de navegação protegida por UI, redirect pós-login ou persistência de sessão no browser.
2. Não há coverage E2E de mutações principais: criação/edição de lead, mudança de stage/status, aprovação/rejeição de sequência, atualização de status de conteúdo, alteração de jobs/policies.
3. Não há coverage de flows multi-instance, apesar de o produto depender fortemente de resolução dinâmica por instância.
4. Não há coverage de observabilidade operacional: deploy health, model health, memory health, estados degradados de integrações e fallback quando arquivos OpenClaw/Ollama não existem.
5. Não há coverage de eventos inbound por webhook, apesar de haver side effects locais persistidos.
6. A suíte atual é serial (`fullyParallel: false`) e sem reutilização de storage state; isso sacrifica throughput sem necessariamente melhorar isolamento.

## Restrições e riscos de implementação do backlog

- Como `pnpm test:e2e` faz build completo antes de rodar testes, o backlog precisa separar smoke crítico de fluxos amplos para evitar regressão forte no feedback loop local.
- Muitos domínios usam polling; testes devem privilegiar assertions web-first e esperas por estado estável em vez de timeouts fixos.
- Alguns fluxos dependem de arquivos OpenClaw/Ollama locais. Para manter determinismo, a suíte deve introduzir fixtures/overrides de filesystem e/ou stubs de rede onde o comportamento externo não é controlado.
- Fluxos que escrevem em banco/arquivos não escalam com conta única compartilhada se a suíte migrar para paralelismo; haverá necessidade de isolamento por worker, por state dir ou por namespace de dados.

## Pesquisa externa: padrões Playwright aplicáveis

### Autenticação reutilizável

- A documentação do Playwright recomenda reaproveitar `storageState` salvo em arquivo para evitar repetir login em todos os testes, usando setup project ou autenticação por API quando existir endpoint mais simples/rápido.
- Para testes que modificam estado do servidor, a recomendação é autenticar uma vez por worker e usar conta ou estado isolado por worker.
- O projeto atual já tem login por API (`/api/auth/login`), então o padrão de auth por API é aderente e de baixo custo aqui.

### Isolamento e paralelismo

- O Playwright recomenda testes isolados, independentes e paralelizáveis; serial deve ser exceção.
- Workers podem ser limitados no CI e dados podem ser particionados por `workerIndex`/`parallelIndex`.
- `maxFailures`, sharding e instalação somente do browser necessário ajudam a reduzir custo de CI.

### Confiabilidade de asserts e integrações

- As melhores práticas enfatizam testar comportamento visível ao usuário, usar locators sem depender de CSS/XPath frágil, usar web-first assertions e evitar testar terceiros diretamente quando não estão sob controle.
- Para integrações externas, a recomendação é stubar/responder com dados controlados via network interception quando o objetivo for validar a UI da aplicação e não o provedor externo.

## Implicações práticas para o backlog

### Estrutura de backlog recomendada

- Separar o backlog em três camadas: fundação da suíte, fluxos transacionais críticos do produto, e superfícies operacionais/degradação.
- Priorizar primeiro aquilo que reduz custo marginal dos próximos testes: auth reutilizável, fixtures de estado, convenções de locators e segmentação smoke/full.
- Depois atacar fluxos com maior valor de negócio e maior risco de regressão silenciosa: CRM, Outreach/Approvals, Content, Cron.
- Fechar com domínios operacionais mais amplos: agents/workspace, analytics degraded states, settings/memory/deploy/model health, webhook inbound.

### Critério de “GitHub-ready issue” para esta tarefa

Cada issue do backlog deve conter:

- título acionável com escopo de domínio;
- prioridade `P0`, `P1` ou `P2`;
- problema/risco claro;
- escopo delimitado por fluxos e superfícies;
- critérios de aceite mensuráveis;
- abordagem de teste com setup/fake/stub/fixture explícitos;
- dependências e pré-requisitos;
- labels sugeridas.

### Ordenação macro recomendada

1. Fundamentos da suíte e autenticação reaproveitável.
2. Auth UI + navegação protegida + smoke de rotas críticas.
3. Fluxos de mutação de CRM.
4. Fluxos de outreach, approvals e suppression.
5. Fluxos de content e aprovações editoriais.
6. Cron, automations e health de modelo.
7. Agents, workspace roots e multi-instance.
8. Analytics, integrations e estados degradados.
9. Settings, memory e deploy health.
10. Webhook inbound e reflexos em notificações/activity feed.
11. Hardening de performance/infra da suíte.

## Conclusão

O repositório já oferece superfície funcional suficientemente rica para justificar um backlog E2E orientado a risco. O principal gargalo não é falta de features testáveis, mas ausência de fundação para escalar a suíte com velocidade e isolamento. Portanto, o backlog deve começar por infraestrutura de teste e imediatamente convertê-la em cobertura dos fluxos que escrevem estado local, alternam instâncias e refletem saúde operacional do sistema.