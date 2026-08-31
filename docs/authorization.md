# Autorização de dados financeiros

Toda operação PostgreSQL dos módulos financeiros é executada por um repositório
com escopo de usuário. O identificador do proprietário é resolvido a partir da
sessão Better Auth no servidor e não faz parte do contrato aceito do cliente.

## Regras obrigatórias

- leituras combinam o identificador do recurso com o `userId` autenticado;
- criações sobrescrevem qualquer propriedade inesperada de proprietário;
- alterações e exclusões retornam ausência quando o recurso pertence a outro
  usuário;
- referências a conta, cartão, categoria ou plano de parcelas são validadas
  antes da escrita;
- categorias globais podem ser lidas por qualquer usuário, mas somente
  categorias próprias podem ser alteradas ou excluídas;
- Route Handlers e Server Actions devem usar o resolvedor padrão dos
  repositórios. A injeção de outro resolvedor existe apenas para testes.

Os testes de integração em
`src/shared/db/user-data-isolation.integration.test.ts` criam dois usuários e
comprovam que nenhum deles lê, altera, exclui ou referencia agregados do outro.

Esta camada ainda não substitui o `localStorage` da interface. A migração de
cada fluxo para os repositórios ocorre nas PRs do M5, preservando a separação
entre autorização e mudança de persistência.
