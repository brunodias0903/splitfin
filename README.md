# SplitFin

> Complete financial control portal: bank statements, credit cards, installment purchases, recurring bills, and analytics with charts.

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6)
![React](https://img.shields.io/badge/React_19-222222?logo=react)
![License](https://img.shields.io/badge/license-MIT-blue)

[🇧🇷 Leia em Português](README.pt-BR.md)

---

## Features

### General Tracking

- [x] One-off expenses (bank account/extract)
- [x] Credit card installment purchases (2/12, 5/24, etc.)
- [x] Link installments to specific cards (name + last 4 digits)
- [x] Category tagging (Food, Transport, Entertainment, etc.)
- [x] Category and date filters
- [x] i18n support (English / Portuguese)
- [ ] Recurring bills and subscriptions
- [ ] Scheduled future expenses

### Dashboard & Charts

- [ ] Donut chart by spending category
- [ ] Monthly expense evolution
- [ ] Month-over-month comparison
- [ ] Estimated credit card bill
- [ ] Available credit limit per card

### Bank Statements

- [ ] Statement upload/import (OFX, CSV)
- [ ] Automatic reconciliation with registered expenses
- [ ] Available balance vs committed balance

---

## Stack

| Layer      | Technology                       |
| ---------- | -------------------------------- |
| Framework  | Next.js 16 + React 19            |
| Runtime    | Node.js 22                        |
| Language   | TypeScript 6 (strict mode)       |
| Styling    | Tailwind CSS 4                   |
| Testing    | Vitest + Playwright              |
| Delivery   | Docker (standalone output)       |
| Linter     | Oxlint                           |
| Formatting | Prettier                         |
| Hooks      | Husky + lint-staged + commitlint |

---

## Getting started

```bash
pnpm install
pnpm dev        # development
pnpm build      # production
pnpm test       # tests
pnpm test:e2e   # browser and accessibility tests
pnpm quality    # typecheck + lint + test
```

---

## Quality pipeline

Before each commit:

1. `lint-staged` — oxlint + prettier on staged files
2. `typecheck` — TypeScript strict mode
3. `test` — Vitest

Branches, commits, and pull requests follow the rules in
[CONTRIBUTING.md](CONTRIBUTING.md). Pull requests use a template covering
validation, risk, rollback, and visual evidence.

## Architecture and roadmap

- [Architecture decisions](docs/architecture/README.md)
- [Technical roadmap](docs/roadmap.md)

---

## License

MIT
