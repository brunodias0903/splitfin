# Contribuindo com o Splitfin

Este documento define o fluxo de trabalho do repositório. O objetivo é manter
alterações pequenas, rastreáveis e fáceis de reverter.

## Antes de começar

1. Atualize a `main` local.
2. Crie uma branch curta a partir da `main`.
3. Evite misturar refatoração, funcionalidade e correção no mesmo pull request.
4. Nunca inclua credenciais, tokens, dados financeiros reais ou arquivos `.env`.

## Branches

Use letras minúsculas, palavras separadas por hífen e o formato
`tipo/descricao-curta`.

| Prefixo | Quando usar | Exemplo |
| --- | --- | --- |
| `feat/` | Nova capacidade | `feat/expense-import` |
| `fix/` | Correção de comportamento | `fix/card-closing-date` |
| `refactor/` | Mudança interna sem alterar comportamento | `refactor/expense-domain` |
| `perf/` | Melhoria mensurável de desempenho | `perf/lazy-load-charts` |
| `test/` | Inclusão ou correção de testes | `test/installment-flow` |
| `docs/` | Apenas documentação | `docs/open-finance-adr` |
| `ci/` | Pipeline, automação ou entrega | `ci/pr-quality-gates` |
| `chore/` | Manutenção sem impacto funcional | `chore/update-tooling` |
| `hotfix/` | Correção urgente de produção | `hotfix/session-validation` |

Não use nome de pessoa, número isolado ou descrições genéricas como `changes`,
`update` ou `new-feature`. Quando houver uma issue, o identificador pode ser
adicionado ao final: `feat/expense-import-123`.

## Commits

O projeto segue [Conventional Commits](https://www.conventionalcommits.org/):

```text
tipo(escopo): resumo no imperativo
```

Exemplos:

```text
feat(expenses): add category filtering
fix(cards): prevent duplicate installment charge
test(a11y): cover keyboard navigation
ci(github): add pull request quality gates
```

Tipos aceitos: `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`,
`refactor`, `revert`, `style` e `test`.

- Use um escopo curto quando ele ajudar a localizar a mudança.
- Escreva o resumo em inglês, sem ponto final e com até 72 caracteres.
- Um commit deve representar uma unidade lógica e manter o projeto verificável.
- Use `!` e um rodapé `BREAKING CHANGE:` para mudanças incompatíveis.

## Validação local

Execute antes de abrir um pull request:

```bash
pnpm quality
pnpm build
pnpm test:e2e
```

O hook de `pre-commit` executa verificações rápidas. O CI continua sendo a fonte
de verdade para a validação completa.

## Pull requests

- Mantenha o PR focado e explique o motivo da mudança.
- Preencha riscos, evidências de teste e impacto visual.
- Inclua screenshots para alterações de interface.
- Solicite revisão somente depois que os checks passarem.
- Resolva conversas antes do merge.
- Prefira **Squash and merge** para produzir um commit convencional na `main`.
- O título do PR deve seguir o mesmo padrão dos commits.

Para mudanças sensíveis — autenticação, dinheiro, migrations e Open Finance —
inclua testes de falha, rollback e uma nota explícita sobre segurança.
