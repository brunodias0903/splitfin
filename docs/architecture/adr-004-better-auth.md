# ADR-004 — Identidade autocontida com Better Auth

- Estado: Aceita
- Data: 2026-08-31
- Decisores: mantenedor do Splitfin

## Contexto

O Splitfin precisa autenticar pessoas antes de mover dados financeiros do
`localStorage` para o PostgreSQL. A identidade será a raiz de autorização de
despesas, contas, cartões, parcelas e futuras conexões de Open Finance; por
isso, uma falha de sessão ou vinculação de contas pode expor dados sensíveis.

A solução precisa funcionar no Next.js 16 com runtime Node.js, reutilizar o
PostgreSQL e o Drizzle já adotados, permitir login por senha agora e OAuth no
futuro, revogar sessões no servidor e preservar a portabilidade entre
provedores de infraestrutura.

O [Next.js recomenda uma biblioteca de autenticação](https://nextjs.org/docs/app/guides/authentication)
em vez de uma implementação própria para reduzir complexidade e risco. O
[Auth.js recomenda Better Auth para projetos novos](https://github.com/nextauthjs/next-auth/blob/main/README.md),
salvo necessidades específicas não presentes no Splitfin.

## Decisão

Usar Better Auth autocontido, com adaptador Drizzle e sessões persistidas no
PostgreSQL. A biblioteca será parte da aplicação e não um serviço externo de
identidade. A implementação seguirá o contrato detalhado em
[`docs/authentication.md`](../authentication.md).

### Escopo inicial

- cadastro, login e logout com e-mail e senha;
- verificação de e-mail e recuperação de senha por adaptador de e-mail;
- sessão opaca validada no servidor e revogável no banco;
- proteção das páginas, Server Actions e Route Handlers do workspace;
- interface própria construída com o design system do Splitfin;
- OAuth mantido como extensão posterior, sem alterar o identificador interno do
  usuário.

Não serão usados componentes visuais hospedados ou APIs proprietárias de um
provedor de identidade. Open Finance terá credenciais e consentimentos em um
modelo separado; tokens bancários nunca serão armazenados como contas OAuth de
login.

### Modelo de dados

A tabela `users` existente continua sendo a identidade canônica e mantém UUID
como chave. Ela receberá apenas os campos de perfil exigidos pelo Better Auth,
como verificação de e-mail e imagem opcional.

As tabelas técnicas terão nomes explícitos para não colidir com a tabela
financeira `accounts`:

| Modelo lógico | Tabela planejada     | Responsabilidade                             |
| ------------- | -------------------- | -------------------------------------------- |
| usuário       | `users`              | identidade interna e perfil mínimo           |
| identidade    | `auth_identities`    | senha ou vínculo com provedor OAuth          |
| sessão        | `auth_sessions`      | token opaco, validade e metadados de sessão  |
| verificação   | `auth_verifications` | tokens de e-mail e recuperação com expiração |

O adaptador permite mapear tabelas e usar UUIDs, inclusive ao integrar schemas
existentes, conforme a
[documentação de banco do Better Auth](https://better-auth.com/docs/concepts/database).
O schema gerado pela versão fixada da biblioteca será revisado e convertido em
migration SQL do projeto; a aplicação não executará migrations no startup.

### Sessão e cookies

- sessão persistida no PostgreSQL, sem JWT autossuficiente como fonte de
  autorização;
- validade deslizante de sete dias e renovação no máximo uma vez a cada 24
  horas;
- cache de sessão em cookie inicialmente desabilitado para que revogações sejam
  observadas imediatamente;
- cookie com prefixo `splitfin`, `HttpOnly`, `Secure` em produção,
  `SameSite=Lax`, `Path=/` e sem atributo `Domain`;
- segredo diferente por ambiente, com rotação planejada e nunca versionado;
- logout remove a sessão atual; redefinição de senha revoga todas as sessões;
- operações sensíveis exigirão sessão validada novamente no servidor.

O Better Auth usa sessões tradicionais baseadas em cookie e permite configurar
expiração e renovação, conforme a
[documentação de sessões](https://better-auth.com/docs/concepts/session-management).
Seus cookies são `HttpOnly` e passam a ser `Secure` em produção por padrão,
conforme a [documentação de cookies](https://better-auth.com/docs/concepts/cookies).

### Senhas e recuperação

- e-mail normalizado e único sem diferenciar maiúsculas de minúsculas;
- verificação de e-mail obrigatória antes do primeiro acesso ao workspace;
- respostas equivalentes para conta existente e inexistente;
- senha nunca armazenada na tabela `users` nem registrada em logs;
- hash `scrypt` provido pela biblioteca, sem implementação criptográfica local;
- token de recuperação de uso único, com expiração de uma hora;
- redefinição de senha revoga as demais sessões;
- envio de e-mail ocorre por uma interface própria, para permitir troca do
  fornecedor transacional.

O Better Auth armazena credenciais na identidade associada e usa `scrypt`, como
descrito em [Email & Password](https://better-auth.com/docs/authentication/email-password).

### OAuth e vinculação futura

- o UUID de `users` não depende do identificador do provedor;
- vinculação implícita por e-mail fica desabilitada;
- um provedor só pode ser vinculado por usuário autenticado, após confirmação;
- e-mails diferentes não podem ser vinculados;
- não será permitido remover a última forma de acesso;
- tokens do provedor, quando necessários, serão tratados como secrets e
  criptografados em repouso;
- ambientes local, staging e produção usarão aplicações OAuth e callbacks
  separados.

Essa política evita tomada de conta por correspondência automática de e-mail e
segue os controles documentados em
[User & Accounts](https://better-auth.com/docs/concepts/users-accounts).

### Fronteira de autorização

Redirecionamento no `proxy.ts` melhora a experiência, mas não constitui a
barreira de segurança. Toda página protegida e toda operação de servidor deve:

1. validar a sessão no servidor;
2. derivar `userId` exclusivamente da sessão validada;
3. executar consultas sempre limitadas por esse `userId`;
4. rejeitar identificadores de proprietário enviados pelo cliente;
5. responder sem revelar dados ou a existência de recursos de outro usuário.

A integração oficial com Next.js alerta que conferir apenas a presença do
cookie não substitui a validação da sessão no servidor. Consulte a
[integração Next.js do Better Auth](https://better-auth.com/docs/integrations/next).

## Ameaças e controles mínimos

| Ameaça                            | Controle planejado                                                     |
| --------------------------------- | ---------------------------------------------------------------------- |
| enumeração de contas              | respostas e tempos equivalentes; logs internos sem PII desnecessária   |
| força bruta e credential stuffing | rate limit por IP e identidade, atraso progressivo e auditoria         |
| roubo de sessão                   | HTTPS, cookie `HttpOnly`/`Secure`, validade curta e revogação no banco |
| CSRF e origem hostil              | `SameSite`, origens confiáveis e proteção CSRF da biblioteca           |
| session fixation                  | emissão/rotação de sessão após autenticação e mudança sensível         |
| vínculo OAuth indevido            | vínculo explícito, e-mail verificado e reautenticação                  |
| acesso horizontal                 | `userId` derivado da sessão e testes com dois usuários                 |
| vazamento em logs                 | proibir senha, token, cookie e conteúdo financeiro em logs             |
| segredo comprometido              | secrets por ambiente, rotação e revogação das sessões afetadas         |

Rate limiting, auditoria, cabeçalhos de segurança e testes de abuso pertencem à
PR 4.4, mas são requisitos para produção e não itens opcionais.

## Alternativas consideradas

### Autenticação própria

Não possui custo de licença, porém transfere ao projeto a responsabilidade por
hash de senha, tokens, recuperação, OAuth, CSRF, rotação e correções de
segurança. Foi rejeitada porque o custo e o risco de manutenção superam qualquer
ganho de controle.

### Auth.js

É portável e conhecido no ecossistema Next.js, mas seu próprio projeto recomenda
Better Auth para novas aplicações. Foi rejeitado para evitar começar uma nova
fundação sobre a opção que já possui sucessora recomendada.

### Supabase Auth

Oferece integração rápida com Next.js, cookies e PostgreSQL, conforme o
[guia oficial](https://supabase.com/docs/guides/auth/quickstarts/nextjs). O plano
gratuito atualmente inclui limites generosos, mas projetos gratuitos podem ser
pausados por inatividade e a evolução vincularia identidade, SDK e operação ao
provedor; consulte os [preços atuais](https://supabase.com/pricing). Foi
rejeitado como dependência arquitetural, sem impedir que Supabase hospede um
PostgreSQL padrão no futuro.

### Clerk ou outro provedor gerenciado

Reduz trabalho operacional e oferece recursos prontos, mas acrescenta
dependência externa por usuário ativo, limites comerciais e fluxo de migração de
identidades. O [preço do Clerk](https://clerk.com/pricing) possui faixa gratuita,
mas pode mudar e deve ser revisto antes de qualquer reconsideração. Foi rejeitado
enquanto o escopo cabe em uma biblioteca autocontida.

## Custos e consequências

### Positivas

- sem cobrança de identidade por usuário ativo;
- banco, IDs e interface permanecem sob controle do Splitfin;
- integração direta com Next.js, PostgreSQL e Drizzle;
- sessões revogáveis e OAuth futuro sem mudar o domínio financeiro;
- possibilidade de trocar hospedagem sem migrar para APIs de autenticação de um
  provedor.

### Custos

- o projeto passa a operar migrations, secrets, envio de e-mail e resposta a
  incidentes de autenticação;
- atualizações de segurança da biblioteca tornam-se prioritárias;
- disponibilidade do login depende da aplicação e do PostgreSQL;
- e-mail transacional e provedores OAuth podem gerar custos próprios;
- a integração com a tabela `users` existente exige migration e testes de banco
  cuidadosos.

## Critérios para reconsiderar

A decisão deve ser revista se o produto exigir SAML corporativo, federação B2B,
MFA avançado com SLA, conformidade que demande um operador especializado ou se
o custo operacional medido superar o custo total de um provedor gerenciado.

Preços e capacidades externas foram consultados em 31 de agosto de 2026 e devem
ser revalidados antes de decisões comerciais.
