# Arquitetura do Splitfin

As decisões arquiteturais relevantes são registradas como ADRs (_Architecture
Decision Records_). Uma decisão aceita continua no histórico mesmo quando for
substituída por outra.

## Decisões

| ADR                                       | Estado | Decisão                                                 |
| ----------------------------------------- | ------ | ------------------------------------------------------- |
| [ADR-001](adr-001-nextjs-node-runtime.md) | Aceita | Next.js full-stack em runtime Node.js e artefato Docker |
| [ADR-002](adr-002-modular-monolith.md)    | Aceita | Monólito modular orientado a domínios                   |
| [ADR-003](adr-003-postgresql-drizzle.md)  | Aceita | PostgreSQL e migrations SQL via Drizzle                 |

## Princípios

- Regras financeiras não dependem da interface ou do framework web.
- Dinheiro é representado sem ponto flutuante nas fronteiras persistentes.
- Toda leitura e escrita de dados é autorizada no servidor.
- Integrações externas são idempotentes e executadas de forma assíncrona.
- O artefato de produção deve ser portável entre provedores compatíveis com
  containers.
- Mudanças são incrementais e mantêm a aplicação verificável a cada commit.
