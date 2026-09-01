# Operação do banco de dados

## Desenvolvimento local

Copie `.env.example` para `.env.local` e execute:

```bash
pnpm db:up
pnpm db:migrate
pnpm db:seed
```

O container cria `splitfin` para desenvolvimento e `splitfin_test` para testes
de integração. Para desligá-lo sem apagar os dados:

```bash
pnpm db:down
```

## Alterações de schema

1. Altere `src/shared/db/schema.ts`.
2. Gere uma migration com `pnpm db:generate --name=<descricao>`.
3. Revise o SQL em `drizzle/`.
4. Execute `pnpm db:check`, `pnpm db:migrate` e `pnpm test:db`.

Migrations já compartilhadas nunca são reescritas. Remoções, renomeações e
alterações de tipo seguem três entregas:

1. **Expandir:** adicionar a nova estrutura de forma retrocompatível.
2. **Migrar:** preencher e validar os dados existentes.
3. **Contrair:** remover a estrutura antiga apenas quando nenhum código a usar.

A migration `0003` adiciona `boleto` ao enum de pagamento e as categorias
canônicas do sistema usadas pela interface de despesas. Ela é aditiva; o
rollback de aplicação pode manter esses valores no banco, pois o PostgreSQL não
oferece remoção segura de um valor de enum sem reconstrução do tipo.

A migration `0004` adiciona `archived_at` aos planos de parcelas. A alteração é
aditiva e permite retirar um plano das consultas ativas sem apagar o plano nem
as despesas já geradas. O rollback da aplicação pode manter a coluna sem
impactar versões anteriores.

## Backup

Defina `DATABASE_URL` no ambiente e crie um dump em formato customizado:

```bash
pg_dump "$DATABASE_URL" --format=custom --no-owner --no-acl --file=splitfin.dump
```

O arquivo contém dados financeiros e deve ser criptografado, ter acesso
restrito e nunca ser commitado. Antes de uma migration com risco de perda, gere
o backup e teste sua restauração em outro banco.

## Restauração

Restaure preferencialmente em um banco vazio e valide contagens e consultas
críticas antes de trocar tráfego:

```bash
pg_restore --dbname="$RESTORE_DATABASE_URL" --no-owner --no-acl --exit-on-error splitfin.dump
```

`--clean` só deve ser usado quando a remoção dos objetos existentes tiver sido
explicitamente autorizada. Em produção, restauração, rollback de aplicação e
retomada de tráfego são operações separadas.
