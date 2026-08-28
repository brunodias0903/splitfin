# ADR-001: Next.js full-stack em runtime Node.js

- Estado: aceita
- Data: 2026-08-28
- Responsáveis: mantenedores do Splitfin

## Contexto

O Splitfin é hoje uma aplicação React/Vite executada inteiramente no navegador,
com persistência em `localStorage`. A evolução prevista inclui autenticação,
PostgreSQL, regras financeiras no servidor, webhooks, processamento assíncrono e
integração futura com um provedor regulado de Open Finance.

Cloudflare Pages atende bem conteúdo estático, mas não é o destino adequado para
essas capacidades de servidor. Cloudflare Workers continua sendo uma alternativa
possível, porém exige validar a compatibilidade de SDKs, drivers, criptografia,
filas e mTLS com seu runtime.

## Decisão

Adotaremos:

- Next.js com App Router;
- runtime Node.js para a aplicação principal;
- imagem Docker como artefato de produção;
- PostgreSQL como fonte de verdade;
- aplicação organizada como monólito modular;
- processo worker separado para sincronizações e tarefas assíncronas;
- GitHub Actions para CI e promoção de artefatos;
- Cloudflare como DNS, CDN, WAF e proteção de borda, não como requisito do
  runtime da aplicação.

A escolha do provedor de container e do PostgreSQL gerenciado será mantida fora
do domínio da aplicação. Nenhuma API de um provedor de hospedagem deve aparecer
nas regras financeiras.

## Fronteiras iniciais

```text
Web / BFF
├── auth
├── expenses
├── installments
├── cards
├── accounts
└── open-finance

Infraestrutura
├── PostgreSQL
├── fila
├── worker
└── provedores externos
```

Cada domínio poderá expor casos de uso e contratos, mas não acessará componentes
React. Rotas, Server Actions e jobs atuarão como adaptadores desses casos de uso.

## Estratégia de migração

1. Criar o shell Next.js preservando a interface e os testes existentes.
2. Organizar o código por domínio sem alterar comportamento.
3. Introduzir persistência PostgreSQL e migrations.
4. Implementar autenticação e autorização no servidor.
5. Migrar gradualmente cada fluxo do `localStorage` para casos de uso do servidor.
6. Extrair jobs e fila antes de integrar dados financeiros externos.
7. Validar um provedor Open Finance em sandbox antes de produção.

Durante a transição, o `localStorage` é considerado uma implementação temporária,
não uma fonte de verdade permanente.

## Consequências

### Benefícios

- compatibilidade ampla com o ecossistema Node.js;
- backend e frontend no mesmo repositório e pipeline;
- deploy portável e rollback por imagem;
- menor risco para SDKs de autenticação, banco e Open Finance;
- migração progressiva sem reescrever o design system.

### Custos e riscos

- a aplicação passa a exigir infraestrutura de servidor;
- migrations, observabilidade, backups e secrets tornam-se responsabilidades
  explícitas;
- será necessário separar jobs demorados do processo web;
- SSR exige atenção ao código que hoje acessa APIs do navegador diretamente.

## Alternativas consideradas

### Permanecer em Vite com backend separado

É tecnicamente válido, mas aumenta a quantidade de contratos e deploys antes de
o produto precisar dessa separação. Poderá ser reconsiderado se os serviços
evoluírem de forma independente.

### Next.js em Cloudflare Pages

Rejeitado para a aplicação autenticada por limitar o projeto ao export estático.
Pages pode ser usado futuramente para site institucional ou documentação.

### Next.js em Cloudflare Workers

Mantido como alternativa futura. Só será adotado após um spike comprovar
autenticação, driver PostgreSQL, transações, webhooks, fila, SDK do parceiro e
mTLS sem adaptações de risco.

### Next.js acoplado exclusivamente à Vercel

Não é necessário para o primeiro estágio. A Vercel pode hospedar previews ou a
aplicação, mas o artefato Docker e as regras de domínio devem continuar
portáveis.

## Critérios de revisão

Esta decisão deve ser revista se:

- um SDK obrigatório não funcionar de forma segura no runtime escolhido;
- requisitos regulatórios exigirem isolamento físico adicional;
- volume ou perfil de jobs justificar serviços independentes;
- o custo operacional superar de forma consistente uma alternativa comprovada.
