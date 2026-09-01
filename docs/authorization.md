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

As telas de despesas, cartões e parcelas usam essa camada e não gravam mais no
`localStorage`. Os adaptadores locais antigos permanecem temporariamente apenas
para a importação assistida do M5.3, sem participar do fluxo normal da
aplicação.
