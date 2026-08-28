# SplitFin

> Portal completo de controle financeiro: extrato bancário, cartão de crédito, despesas parceladas, contas fixas/recorrentes e análises com gráficos.

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6)
![React](https://img.shields.io/badge/React_19-222222?logo=react)
![License](https://img.shields.io/badge/license-MIT-blue)

[🇺🇸 Read in English](README.md)

---

## Funcionalidades

### Controle Geral

- [x] Registro de despesas avulsas (extrato/conta corrente)
- [x] Despesas parceladas no cartão de crédito (visão 2/12, 5/24, etc.)
- [x] Vínculo de parcelas a cartões específicos (nome + últimos 4 dígitos)
- [x] Categorização por tipo (Alimentação, Transporte, Lazer, etc.)
- [x] Filtros por categoria e período
- [x] Suporte a i18n (Português / English)
- [ ] Contas fixas e recorrentes (mensalidades, assinaturas)
- [ ] Lançamento futuro (despesas agendadas)

### Dashboard e Gráficos

- [ ] Gráfico de rosca (donut) por categoria de gasto
- [ ] Evolução mensal de despesas
- [ ] Comparativo mês atual × mês anterior
- [ ] Fatura prevista do cartão de crédito
- [ ] Limite disponível por cartão

### Extrato Bancário

- [ ] Upload/importação de extrato (OFX, CSV)
- [ ] Conciliação automática com despesas registradas
- [ ] Saldo disponível × saldo comprometido

---

## Stack

| Camada      | Tecnologia                       |
| ----------- | -------------------------------- |
| Framework   | Next.js 16 + React 19            |
| Runtime     | Node.js 22                        |
| Linguagem   | TypeScript 6 (strict mode)       |
| Banco       | PostgreSQL 17 + Drizzle ORM      |
| Estilização | Tailwind CSS 4                   |
| Testes      | Vitest + Playwright              |
| Entrega     | Docker (standalone output)       |
| Linter      | Oxlint                           |
| Formatação  | Prettier                         |
| Hooks       | Husky + lint-staged + commitlint |

---

## Como rodar

```bash
pnpm install
pnpm dev        # desenvolvimento
pnpm build      # produção
pnpm test       # testes
pnpm test:e2e   # testes de navegador e acessibilidade
pnpm quality    # typecheck + lint + test
```

O fluxo local do banco e a política de migrations estão documentados em
[docs/database.md](docs/database.md).

---

## Quality pipeline

Antes de cada commit:

1. `lint-staged` — oxlint + prettier nos arquivos staged
2. `typecheck` — TypeScript strict mode
3. `test` — Vitest

Branches, commits e pull requests seguem as regras descritas em
[CONTRIBUTING.md](CONTRIBUTING.md). Pull requests utilizam um template com
validação, risco, rollback e evidências visuais.

## Arquitetura e roadmap

- [Decisões arquiteturais](docs/architecture/README.md)
- [Roadmap técnico](docs/roadmap.md)
- [Guia de continuidade entre máquinas](docs/development-handoff.md)

---

## Licença

MIT
