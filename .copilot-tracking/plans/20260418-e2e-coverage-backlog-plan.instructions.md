---
applyTo: ".copilot-tracking/changes/20260418-e2e-coverage-backlog-changes.md"
---

<!-- markdownlint-disable-file -->

# Task Checklist: Backlog E2E 360 para Hermes Dashboard

## Overview

Definir e sequenciar um backlog executável de issues para expandir a cobertura E2E do Hermes Dashboard com foco explícito em Overview/Home, RBAC por role, Agent Comms/Chat e valor P0 antes de hardening pesado.

## Objectives

- Converter a análise do projeto em issues GitHub-ready com prioridade, escopo, critérios observáveis, abordagem de teste, dependências e labels.
- Cobrir explicitamente a home operacional, a matriz de roles `viewer/editor/admin` e os fluxos de Agent Comms/Chat.
- Ordenar a execução para entregar proteção P0 cedo e deixar o hardening pesado para depois dos primeiros fluxos críticos.

## Research Summary

### Project Files

- `playwright.config.ts` - configuração atual da suíte, ambiente webServer e gargalos de paralelismo.
- `tests/e2e/auth-and-api.spec.ts` - cobertura atual limitada a smoke/auth/API.
- `package.json` - custo atual de execução (`pnpm build && playwright test`).
- `src/app/page.tsx` - home `Overview` com polling, action items e papel do usuário.
- `src/app/login/page.tsx` - fluxo UI de autenticação e redirect.
- `src/lib/rbac.ts` - matriz de roles e capabilities do produto.
- `src/lib/api-auth.ts` - enforcement de `admin`, `editor` e capabilities em API.
- `src/app/agents/comms/page.tsx` - Agent Comms com Mission Control admin-only.
- `src/components/chat/agent-chat.tsx` - lista de conversas, envio de mensagem e bloqueio por role.
- `src/app/crm/page.tsx` - filtros por URL e criação de lead.
- `src/app/outreach/page.tsx` - mutações de lead/sequência e tabs operacionais.
- `src/app/api/content/route.ts` - mutação de conteúdo com writeback e audit.
- `src/lib/instances.ts` - base de multi-instance OpenClaw.
- `src/app/api/webhook/telegram/route.ts` - evento inbound autenticado com side effects locais.
- `src/app/api/model-health/route.ts` - health do Ollama local e modelos requeridos.

### External References

- #file:../research/20260418-e2e-coverage-backlog-research.md - pesquisa validada com estado atual, mapa funcional, lacunas e guidance do Playwright.
- https://playwright.dev/docs/auth - padrão recomendado de `storageState` reutilizável e auth por API/worker.
- https://playwright.dev/docs/best-practices - isolamento, web-first assertions e stubs para dependências externas.
- https://playwright.dev/docs/test-parallel - workers, sharding, `maxFailures` e isolamento por worker.

### Standards References

- `README.md` - escopo funcional do produto e domínios suportados.
- `package.json` - comandos oficiais do projeto para build e teste.
- `playwright.config.ts` - baseline técnico a preservar/modernizar ao implementar as issues.

## Implementation Checklist

### [ ] Phase 1: Fundação mínima e fluxos P0

- [ ] Task 1.1: Estruturar auth reutilizável, helpers comuns e isolamento básico de estado
  - Details: `.copilot-tracking/details/20260418-e2e-coverage-backlog-details.md` (Lines 11-43)

- [ ] Task 1.2: Cobrir login UI, redirect e shell protegida
  - Details: `.copilot-tracking/details/20260418-e2e-coverage-backlog-details.md` (Lines 45-74)

- [ ] Task 1.3: Cobrir Overview/Home como superfície operacional de primeira linha
  - Details: `.copilot-tracking/details/20260418-e2e-coverage-backlog-details.md` (Lines 76-105)

- [ ] Task 1.4: Cobrir CRM end-to-end com criação, filtros e transições de lead
  - Details: `.copilot-tracking/details/20260418-e2e-coverage-backlog-details.md` (Lines 107-136)

- [ ] Task 1.5: Cobrir outreach, approvals e suppression com mutações críticas
  - Details: `.copilot-tracking/details/20260418-e2e-coverage-backlog-details.md` (Lines 138-167)

- [ ] Task 1.6: Cobrir RBAC E2E com viewer, editor e admin
  - Details: `.copilot-tracking/details/20260418-e2e-coverage-backlog-details.md` (Lines 169-203)

### [ ] Phase 2: Expansão de domínio P1

- [ ] Task 2.1: Cobrir content ops com mudança de status e fila editorial
  - Details: `.copilot-tracking/details/20260418-e2e-coverage-backlog-details.md` (Lines 207-235)

- [ ] Task 2.2: Cobrir Agent Comms/Chat com lista, envio, bloqueio por role e Mission Control admin-only
  - Details: `.copilot-tracking/details/20260418-e2e-coverage-backlog-details.md` (Lines 237-269)

- [ ] Task 2.3: Cobrir cron board, automations e model health local
  - Details: `.copilot-tracking/details/20260418-e2e-coverage-backlog-details.md` (Lines 271-300)

- [ ] Task 2.4: Cobrir agents, workspace roots e troca de instância
  - Details: `.copilot-tracking/details/20260418-e2e-coverage-backlog-details.md` (Lines 302-331)

- [ ] Task 2.5: Cobrir settings, memory e deploy health por instância
  - Details: `.copilot-tracking/details/20260418-e2e-coverage-backlog-details.md` (Lines 333-361)

- [ ] Task 2.6: Cobrir analytics, benchmarks e integrações em estados degradados
  - Details: `.copilot-tracking/details/20260418-e2e-coverage-backlog-details.md` (Lines 363-391)

### [ ] Phase 3: Cobertura operacional complementar e estabilidade

- [ ] Task 3.1: Cobrir webhooks inbound e reflexos na UI operacional
  - Details: `.copilot-tracking/details/20260418-e2e-coverage-backlog-details.md` (Lines 395-420)

- [ ] Task 3.2: Cobrir superfícies secundárias de observabilidade
  - Details: `.copilot-tracking/details/20260418-e2e-coverage-backlog-details.md` (Lines 422-447)

- [ ] Task 3.3: Endurecer performance e infraestrutura da suíte após cobertura P0/P1 principal
  - Details: `.copilot-tracking/details/20260418-e2e-coverage-backlog-details.md` (Lines 449-479)

### [ ] Phase 4: Sequenciamento e governança do backlog

- [ ] Task 4.1: Executar o backlog na ordem recomendada
  - Details: `.copilot-tracking/details/20260418-e2e-coverage-backlog-details.md` (Lines 481-497)

- [ ] Task 4.2: Aplicar iniciativas transversais de performance/infra em toda a evolução da suíte
  - Details: `.copilot-tracking/details/20260418-e2e-coverage-backlog-details.md` (Lines 499-522)

## Dependencies

- `@playwright/test`
- Build standalone atual do Next.js
- SQLite local controlado por `HERMES_STATE_DIR`
- Fixtures sintéticas para usuários por role, OpenClaw multi-instance, cron, memory health e model health

## Success Criteria

- O backlog resultante cobre explicitamente auth, Overview/Home, RBAC, Agent Comms/Chat, CRM, outreach, content, cron, agents, analytics, settings, webhooks, multi-instance OpenClaw e health local.
- Cada issue tem critérios de aceite observáveis o suficiente para abertura direta no GitHub e validação objetiva.
- A ordem de execução protege primeiro os fluxos P0 e deixa o hardening pesado para depois.