# Design system do Splitfin

A fundação visual está organizada por responsabilidade:

```text
styles/
├── tokens/
│   ├── colors.css
│   ├── spacing.css
│   ├── typography.css
│   ├── radius.css
│   ├── shadows.css
│   ├── layout.css
│   ├── motion.css
│   └── index.css
├── components.css
└── README.md
```

`tokens/index.css` é o ponto único de importação. `components.css` contém padrões
de composição compartilhados e `src/index.css` mantém apenas estilos globais.

## Regras de uso

1. Valores literais de cor pertencem exclusivamente a `tokens/colors.css`.
2. Componentes usam nomes semânticos como `bg-primary`, `text-muted-foreground`,
   `bg-surface` e `text-danger`; nunca nomes de paleta como `bg-indigo-600`.
3. Use `--space-*` para espaçamentos escritos em CSS.
4. Use `Button`, `Input`, `NativeSelect`, `Surface`, `Badge`, `Heading` e `Text`
   de `@/components/ui` antes de criar um equivalente local.
5. Ações apenas com ícone usam `IconButton`, que exige um nome acessível.
6. Mudanças cromáticas devem passar por `pnpm test:e2e`, incluindo contraste WCAG A/AA.

## Cores

As cores possuem três níveis. Apenas os dois últimos aparecem fora de
`colors.css`.

| Nível | Exemplo | Finalidade |
| --- | --- | --- |
| Primitivo | `--indigo-600`, `--neutral-100` | Construir os tokens semânticos |
| Semântico | `--primary`, `--surface`, `--text-muted` | API pública do design system |
| Utility | `bg-primary`, `text-muted-foreground` | Uso em componentes React |

Principais papéis semânticos:

| Grupo | Tokens |
| --- | --- |
| Superfícies | `canvas`, `surface`, `surface-subtle`, `surface-muted` |
| Texto | `text`, `text-strong`, `text-muted`, `text-subtle`, `text-on-brand` |
| Marca | `primary`, `primary-hover`, `primary-soft`, `primary-muted` |
| Feedback | `success`, `warning`, `danger` e suas variações `soft` |
| Dados | `data-1` até `data-6` |
| Categorias | `category-food-*`, `category-transport-*` e equivalentes |

Exemplo:

```tsx
<section className="bg-surface text-foreground">
  <button className="bg-primary text-primary-foreground hover:bg-primary-hover">
    Confirmar
  </button>
</section>
```

## Espaçamento

| Token | Valor | Uso comum |
| --- | ---: | --- |
| `--space-2` | 8px | Gaps compactos |
| `--space-3` | 12px | Formulários e controles |
| `--space-4` | 16px | Padding mobile |
| `--space-5` | 20px | Padding de cards |
| `--space-6` | 24px | Padding desktop |
| `--space-7` | 28px | Separação entre seções |
| `--space-8` | 32px | Separação ampla |

## Componentes

- `Button`: `default`, `secondary`, `success`, `destructive`, `outline`, `ghost`, `link`.
- `Heading`: nível HTML semântico e aparência `page`, `section` ou `card`.
- `Text`: `body`, `small`, `caption`, `eyebrow` e tons semânticos.
- `Input` e `NativeSelect`: estados de foco, inválido e desabilitado compartilhados.
- `Surface`: container padrão construído sobre o `Card` do shadcn.

A fonte Poppins é distribuída localmente via Fontsource nos pesos 400, 500, 600 e 700.
