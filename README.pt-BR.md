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

| Camada | Tecnologia |
|---|---|
| Framework | React 19 |
| Build | Vite 8 |
| Linguagem | TypeScript 6 (strict mode) |
| Estilização | Tailwind CSS 4 |
| Testes | Vitest |
| Linter | Oxlint |
| Formatação | Prettier |
| Hooks | Husky + lint-staged + commitlint |

---

## Como rodar

```bash
pnpm install
pnpm dev        # desenvolvimento
pnpm build      # produção
pnpm test       # testes
pnpm quality    # typecheck + lint + test
```

---

## Quality pipeline

Antes de cada commit:
1. `lint-staged` — oxlint + prettier nos arquivos staged
2. `typecheck` — TypeScript strict mode
3. `test` — Vitest

Abertura de PR gera automaticamente título e descrição a partir dos conventional commits.

---

## Licença

MIT
