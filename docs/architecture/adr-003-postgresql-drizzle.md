# ADR-003 — PostgreSQL com migrations SQL via Drizzle

- Estado: Aceita
- Data: 2026-08-28
- Decisores: mantenedor do Splitfin

## Contexto

O Splitfin precisa substituir a persistência temporária em `localStorage` por
uma fonte confiável para autenticação, dados financeiros e, futuramente,
sincronização com Open Finance. A solução deve preservar portabilidade entre
provedores, permitir testes locais e evitar que o deploy da aplicação altere o
banco implicitamente.

## Decisão

Usar PostgreSQL como banco relacional e Drizzle ORM como camada tipada. O schema
TypeScript vive em `src/shared/db`, enquanto cada alteração gera SQL versionado
em `drizzle/`.

As seguintes regras são obrigatórias:

- valores monetários são persistidos como centavos inteiros em `bigint`;
- chaves primárias usam UUID e relações têm índices explícitos;
- constraints do PostgreSQL protegem invariantes estruturais;
- a aplicação lê a conexão por `DATABASE_URL` apenas no servidor;
- migrations são executadas como etapa separada do build e do startup;
- mudanças destrutivas seguem o padrão expandir-migrar-contrair;
- cada migration é validada em um PostgreSQL efêmero no CI.

O schema inicial modela usuário, conta, cartão, categoria, plano de parcelas e
despesa. Autenticação e isolamento de consultas por usuário pertencem ao M4; a
migração da interface e dos dados locais pertence ao M5.

## Consequências

### Positivas

- SQL e dados permanecem portáveis entre serviços PostgreSQL;
- tipos, relações e migrations evoluem a partir de uma única definição;
- constraints impedem valores monetários e parcelas estruturalmente inválidos;
- testes de integração não dependem de contas ou serviços externos.

### Custos

- desenvolvimento local requer PostgreSQL ou Docker;
- migrations incompatíveis precisam de mais de uma entrega;
- o ORM não substitui autorização, auditoria nem revisão de SQL gerado.

## Alternativas consideradas

### Supabase como dependência arquitetural

Continua sendo uma opção de hospedagem futura, mas acoplar o domínio às APIs do
provedor reduziria portabilidade. Nenhuma integração Supabase é necessária nesta
fundação.

### Prisma

Oferece boa experiência de desenvolvimento, porém o cliente gerado e seu fluxo
de migrations adicionam mais uma camada operacional. Drizzle mantém o SQL
gerado próximo do schema e tem integração direta com PostgreSQL.

### Migrations no startup

Facilitaria ambientes pequenos, mas cria concorrência entre réplicas e mistura
alteração de infraestrutura com disponibilidade da aplicação. O pipeline deve
executá-las como uma etapa explícita antes do deploy.
