# Controles operacionais de segurança

Esta camada complementa a autenticação e a autorização por usuário. Ela não
substitui validação de payload nem a verificação de sessão dentro de cada
operação do servidor.

## Rate limiting

O Better Auth usa um armazenamento PostgreSQL compartilhado e atômico. As
chaves recebidas da biblioteca são transformadas com HMAC-SHA-256 antes da
persistência, evitando armazenar endereços de rede em texto aberto.

| Operação                  | Janela | Limite |
| ------------------------- | ------ | ------ |
| Login por e-mail          | 1 min  | 10     |
| Cadastro                  | 1 h    | 5      |
| Solicitação de nova senha | 1 h    | 5      |
| Redefinição de senha      | 15 min | 5      |
| Demais endpoints de auth  | 1 min  | 100    |

O limite só pode ser desativado pelo ambiente automatizado do Playwright. Não
configure `BETTER_AUTH_RATE_LIMIT_DISABLED=true` em ambientes publicados.

## Auditoria

São registrados eventos de criação e alteração de identidade, criação e
revogação de sessão e mutações financeiras. Tentativas de alterar ou excluir
um recurso fora do escopo do usuário são registradas como `denied`.

Os eventos contêm somente ação, resultado, usuário técnico, tipo/ID do recurso,
request ID opcional e metadados explicitamente permitidos. E-mail, token,
senha, descrição e valor financeiro não devem ser registrados.

Falhas na auditoria são reportadas por uma mensagem genérica e não desfazem uma
operação já concluída. Antes de produção, a observabilidade do M6 deve alertar
sobre essas falhas.

## Retenção

- eventos de auditoria: 90 dias por padrão;
- contadores de rate limiting inativos: 24 horas por padrão;
- limpeza: `pnpm db:prune-security`;
- configuração: `SECURITY_AUDIT_RETENTION_DAYS` e
  `RATE_LIMIT_RETENTION_HOURS`.

O job de produção deverá executar a limpeza diariamente. Uma investigação ou
obrigação legal pode exigir retenção temporária maior, registrada fora do
código antes de alterar o valor.

## HTTP, CSP e CSRF

Todas as rotas recebem CSP, `nosniff`, proteção contra frames, política de
referrer, restrição de recursos do navegador e isolamento de janela. HSTS e
upgrade de requisições são habilitados apenas no build de produção.

A CSP atual preserva renderização estática e ainda permite scripts/estilos
inline exigidos pelo runtime. Uma CSP com nonce exigiria renderização dinâmica
de todas as páginas; essa troca deve ser medida antes de ser adotada.

O Better Auth valida `Origin` contra `BETTER_AUTH_URL`, e Server Actions também
devem manter a comparação nativa entre Origin e Host do Next.js. Nenhuma rota
ou ação pode desativar essas verificações.
