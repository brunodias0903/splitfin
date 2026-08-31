# Contrato de autenticação e sessão

Este documento transforma o [ADR-004](architecture/adr-004-better-auth.md) em
regras verificáveis para as próximas entregas. Ele não substitui o modelo de
ameaças nem autoriza relaxar validações no servidor.

## Fronteiras

```text
Navegador
  └─ cookie opaco HttpOnly
       └─ Next.js (Route Handler, Server Component ou Server Action)
            ├─ Better Auth valida a sessão no PostgreSQL
            └─ caso de uso recebe apenas o userId validado
                 └─ repositório filtra toda consulta pelo userId
```

- componentes de interface podem ocultar ações, mas nunca autorizam acesso;
- o cliente não envia nem escolhe o proprietário de um registro;
- código de domínio não conhece cookies, Better Auth ou provedores OAuth;
- o módulo de autenticação pode depender do banco compartilhado, mas módulos
  financeiros recebem somente uma identidade validada;
- tokens de Open Finance pertencem a uma integração separada.

## Fluxos obrigatórios

### Cadastro

1. Receber nome, e-mail e senha por conexão segura.
2. Normalizar o e-mail e validar o payload no servidor.
3. Retornar resposta genérica mesmo quando o e-mail já existir.
4. Criar `users` e `auth_identities` em operação consistente.
5. Enviar verificação por adaptador de e-mail sem registrar token ou senha.
6. Permitir acesso ao workspace somente após confirmação do e-mail.

### Login

1. Aplicar rate limit antes de verificar a credencial.
2. Responder de forma equivalente para usuário ausente, senha incorreta ou
   e-mail ainda não confirmado.
3. Criar uma nova sessão opaca após autenticação válida.
4. Enviar somente cookie `HttpOnly`; nenhum token de sessão fica disponível ao
   JavaScript do navegador.
5. Redirecionar apenas para destinos internos previamente permitidos.

### Uso da sessão

1. O `proxy.ts` pode rejeitar rapidamente a ausência de cookie.
2. A página ou operação protegida sempre valida a sessão no servidor.
3. Sessões expiradas, revogadas ou inexistentes são tratadas como anônimas.
4. `userId` é extraído da sessão e incluído explicitamente na chamada do caso de
   uso e do repositório.
5. Consultas sem escopo de usuário são proibidas fora de rotinas administrativas
   explícitas e testadas.

### Logout e revogação

- logout padrão revoga a sessão atual e expira o cookie;
- a interface oferecerá encerramento das demais sessões;
- redefinição de senha revoga todas as sessões existentes;
- alteração futura de e-mail ou vínculo OAuth exige reautenticação;
- revogação deve surtir efeito na próxima validação, sem depender da expiração
  de um JWT local.

### Recuperação de senha

1. Sempre retornar uma resposta genérica.
2. Gerar token aleatório, de uso único e válido por uma hora.
3. Enviar o link por adaptador assíncrono de e-mail.
4. Invalidar o token após uso e registrar apenas o evento de segurança.
5. Revogar as sessões do usuário após a troca.

### OAuth futuro

1. Usar credenciais e callbacks separados por ambiente.
2. Exigir e-mail confirmado pelo provedor.
3. Criar novo usuário quando a identidade não existir.
4. Nunca vincular implicitamente uma identidade a usuário existente por e-mail.
5. Exigir sessão e confirmação explícita para vincular outro método de login.
6. Impedir vínculo com e-mail diferente e remoção do último método de acesso.

## Política inicial

| Controle                       | Valor inicial                                      |
| ------------------------------ | -------------------------------------------------- |
| estratégia                     | sessão opaca persistida no PostgreSQL              |
| duração                        | 7 dias, com renovação deslizante                   |
| frequência máxima de renovação | 24 horas                                           |
| cache de sessão em cookie      | desabilitado                                       |
| cookie                         | `HttpOnly`, `SameSite=Lax`, `Path=/`, sem `Domain` |
| produção                       | cookie `Secure` e HTTPS obrigatório                |
| recuperação                    | token único com validade de 1 hora                 |
| redefinição de senha           | revoga todas as sessões                            |
| vinculação OAuth               | somente explícita e autenticada                    |

Os valores podem mudar após testes de usabilidade e risco, mas qualquer redução
de segurança precisa ser registrada em ADR.

## Modelo e migrations

- adaptar `users` de forma retrocompatível;
- criar `auth_identities`, `auth_sessions` e `auth_verifications` com UUIDs;
- não reutilizar `accounts`, que representa contas financeiras;
- manter unicidade case-insensitive do e-mail;
- garantir unicidade da identidade externa por provedor e identificador;
- indexar token de sessão, expiração e chaves estrangeiras;
- apagar sessões e identidades quando um usuário for removido conforme a
  política de retenção;
- gerar SQL pelo Drizzle, revisar e versionar em `drizzle/`;
- validar a migration em PostgreSQL efêmero no CI;
- nunca executar migration durante build ou startup.

## Matriz mínima de testes

| Área             | Cenários                                                |
| ---------------- | ------------------------------------------------------- |
| cadastro         | válido, duplicado, inválido e e-mail não confirmado     |
| login            | válido, senha incorreta, usuário ausente e rate limit   |
| sessão           | válida, ausente, expirada, revogada e cookie adulterado |
| logout           | sessão atual e todas as sessões                         |
| recuperação      | token válido, expirado, reutilizado e adulterado        |
| autorização      | usuário A não lê nem altera dados do usuário B          |
| redirecionamento | destino interno válido e tentativa de open redirect     |
| cookies          | atributos de desenvolvimento e produção                 |
| logs             | ausência de senha, token, cookie e dados financeiros    |

## Segredos e ambientes

Cada ambiente terá banco, segredo de autenticação, remetente de e-mail e
credenciais OAuth próprios. `.env.example` documentará somente nomes e valores
seguros de desenvolvimento. Secrets reais ficam no gerenciador do ambiente e
nunca em Git, logs, artefatos do CI ou variáveis públicas do Next.js.

## Sequência de implementação

1. Adaptar o schema e criar a migration de autenticação.
2. Configurar Better Auth no servidor e o Route Handler dedicado.
3. Implementar adaptador de e-mail e fluxos de verificação/recuperação.
4. Criar telas de cadastro, login, logout e recuperação com o design system.
5. Proteger o workspace e validar sessão em cada fronteira de servidor.
6. Adicionar testes unitários, de integração, E2E e de atributos dos cookies.
7. Implementar isolamento por usuário na PR seguinte.
8. Adicionar rate limiting e auditoria antes de produção.
