# Roadmap técnico

O roadmap é organizado em marcos que devem gerar pull requests independentes e
reversíveis.

Os próximos passos detalhados, dependências, critérios de aceite e instruções
para alternar entre macOS e WSL estão no
[guia de continuidade](development-handoff.md).

## M1 — Fundação Next.js

- [x] Substituir o shell Vite por Next.js App Router.
- [x] Preservar design system, Poppins e responsividade.
- [x] Adaptar Vitest e Playwright ao novo servidor.
- [x] Garantir que os 28 testes unitários e os 24 E2E continuem passando.
- [x] Adicionar health check básico.
- [x] Criar Dockerfile multi-stage executando Next.js standalone.

## M2 — Organização por domínio

- [x] Criar módulos de despesas, parcelas, cartões e contas.
- [x] Separar casos de uso de componentes React e persistência.
- [x] Cobrir cálculos monetários e datas com testes unitários.
- [x] Eliminar dependências circulares entre domínios.

## M3 — PostgreSQL

- [x] Definir schema e ferramenta de migrations.
- [x] Modelar usuário, conta, cartão, despesa, parcela e categoria.
- [x] Usar decimal ou centavos inteiros para valores persistidos.
- [x] Adicionar seed e banco isolado para testes.
- [x] Implementar backup, restauração e migrations retrocompatíveis.

## M4 — Identidade e autorização

- [ ] Implementar login e sessão no servidor.
- [ ] Isolar todas as consultas por usuário.
- [ ] Adicionar rate limiting e auditoria de operações sensíveis.
- [ ] Testar acesso indevido entre usuários.

## M5 — Migração de dados e regras

- [ ] Migrar despesas do `localStorage` para o servidor.
- [ ] Migrar cartões e parcelas.
- [ ] Implementar recorrência, fechamento e conciliação.
- [ ] Oferecer importação assistida dos dados locais existentes.

## M6 — Entrega e observabilidade

- [ ] Publicar imagem versionada no GitHub Container Registry.
- [ ] Criar ambientes de staging e produção.
- [ ] Separar migrations do deploy da aplicação.
- [ ] Adicionar logs estruturados, métricas, tracing e alertas.
- [ ] Automatizar smoke test e rollback pós-deploy.

## M7 — Open Finance

- [ ] Selecionar parceiro regulado e validar sandbox.
- [ ] Criar contrato independente de provedor.
- [ ] Implementar consentimento, revogação e criptografia de tokens.
- [ ] Processar webhooks e sincronizações com idempotência.
- [ ] Adicionar fila, retentativas e dead-letter queue.
- [ ] Normalizar transações e oferecer conciliação de ambiguidades.

## Definition of Done

Um marco só pode ser integrado quando:

- CI, build e testes relevantes estiverem aprovados;
- riscos, rollback e migrations estiverem documentados;
- não houver secrets ou dados financeiros reais no repositório;
- acessibilidade e responsividade forem verificadas quando aplicável;
- observabilidade acompanhar qualquer nova operação de servidor.
