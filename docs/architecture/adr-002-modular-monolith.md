# ADR-002 — Monólito modular orientado a domínios

- Estado: Aceita
- Data: 2026-08-28
- Decisores: mantenedor do Splitfin

## Contexto

Após a adoção do Next.js, a aplicação ainda concentrava navegação, estado,
persistência e regras financeiras em um único componente React. Essa estrutura
funcionava para o protótipo, mas tornaria banco de dados, autenticação e Open
Finance dependentes da interface e difíceis de testar isoladamente.

## Decisão

Adotar um monólito modular dentro de `src`:

```text
src/
├── app/                 # rotas e composição do Next.js
├── modules/
│   └── <domínio>/
│       ├── domain/      # modelos, invariantes e cálculos puros
│       ├── application/ # casos de uso
│       ├── infrastructure/ # adaptadores de persistência
│       └── ui/          # componentes específicos do domínio
└── shared/              # design system, i18n, layout e utilitários comuns
```

As rotas do App Router são adaptadores finos. O provider em `app` compõe os
casos de uso enquanto a persistência ainda utiliza `localStorage`; ele será
substituído por operações de servidor sem alterar as regras de domínio.

### Regras de dependência

- `domain` não importa React, Next.js, UI ou persistência;
- `application` coordena regras e modelos, mas não conhece framework ou
  adaptadores;
- `infrastructure` implementa as fronteiras de persistência;
- `ui` pode consumir `application`, `domain` e recursos compartilhados;
- `app` é a raiz de composição e pode conectar todos os módulos;
- dependências circulares são proibidas e verificadas por teste automatizado.

## Consequências

### Positivas

- cálculos financeiros e datas podem ser testados sem navegador;
- a troca de `localStorage` por PostgreSQL fica localizada nos adaptadores e na
  composição;
- despesas, parcelas, cartões e contas possuem fronteiras explícitas;
- URLs reais permitem navegação, recarga e links diretos;
- código compartilhado deixa de ser um diretório genérico de componentes.

### Custos

- existem mais arquivos e imports explícitos;
- operações que cruzam módulos precisam ser coordenadas na raiz de composição;
- até o M5, o provider cliente ainda mantém estado transitório da aplicação.

## Alternativas consideradas

### Estrutura por tipo técnico

Manter `components`, `screens` e `types` na raiz simplifica projetos pequenos,
mas mistura mudanças de vários domínios e favorece dependências circulares.

### Microserviços desde o início

Introduz custo operacional, consistência distribuída e observabilidade antes de
existir escala ou equipes que justifiquem essas fronteiras de implantação.

### Framework de estado global como arquitetura

Uma biblioteca pode melhorar ergonomia do estado, mas não define limites entre
regras, UI e persistência. Ela pode ser adicionada futuramente sem mudar esta
decisão.
