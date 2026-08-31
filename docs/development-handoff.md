# Guia de continuidade do desenvolvimento

Este documento é a fonte operacional para retomar o Splitfin em outra máquina
ou trabalhar em mais de uma frente. O [roadmap](roadmap.md) registra os marcos;
este guia detalha ordem, dependências, entregas e critérios de aceite.

> Última consolidação: 31 de agosto de 2026, após o merge da PR #17.

## Estado atual

### Concluído

- Next.js App Router em runtime Node.js e imagem Docker standalone;
- arquitetura de monólito modular por domínio;
- design system com Poppins, tokens semânticos e componentes reutilizáveis;
- telas responsivas de despesas, parcelas e cartões;
- Vitest e Playwright com testes de interface, responsividade e acessibilidade;
- CI com convenções, qualidade, build, E2E, CodeQL e GitGuardian;
- proteção da `main`, commits assinados e exclusão automática de branches;
- PostgreSQL 17, Drizzle ORM, migration inicial, seed e testes de integração;
- valores monetários persistidos como centavos inteiros;
- runbook de migrations, backup e restauração.
- decisão de identidade com Better Auth autocontido e sessões no PostgreSQL.
- cadastro, verificação de e-mail, login, logout e recuperação de senha;
- rotas do workspace protegidas por sessão validada no servidor.

### Estado transitório conhecido

- a interface ainda persiste os dados financeiros em `localStorage`;
- PostgreSQL está preparado, mas ainda não é consumido pela aplicação;
- os dados financeiros ainda não estão isolados por usuário no servidor;
- não há ambiente de staging ou produção ativo;
- Supabase e Vercel ainda aparecem como GitHub Apps da conta. O Splitfin não
  depende deles; qualquer remoção deve considerar os outros repositórios da
  conta, pois as instalações atuais não estão limitadas apenas ao Splitfin.

### Decisões que não devem ser revertidas sem ADR

- manter Next.js full-stack em vez de retornar a uma SPA separada;
- manter o artefato de produção portável em container;
- usar PostgreSQL padrão, sem APIs proprietárias no domínio;
- usar Drizzle e migrations SQL versionadas;
- não executar migrations durante build ou startup da aplicação;
- representar dinheiro em centavos inteiros, nunca `number` fracionário;
- manter regras financeiras fora de React, Next.js e persistência;
- usar tokens semânticos para cores, espaçamento e tipografia;
- nunca incluir secrets ou dados financeiros reais no Git.

As justificativas estão nos [ADRs](architecture/README.md).

## Ordem recomendada das entregas

Cada item abaixo deve virar uma PR curta e reversível. Os nomes são sugestões de
branch; ajuste a descrição, mas preserve os prefixos de `CONTRIBUTING.md`.

### M4 — Identidade e autorização

#### PR 4.1 — Decisão de identidade

Branch sugerida: `docs/authentication-architecture`

- comparar autenticação própria, biblioteca e provedor gerenciado;
- exigir suporte a sessão segura no servidor, OAuth futuro e portabilidade;
- definir modelo de usuário, vinculação de identidades e recuperação de conta;
- decidir cookies, duração, renovação e revogação de sessão;
- registrar ameaças principais e a decisão em um ADR;
- não adicionar fornecedor antes da decisão arquitetural.

Aceite: ADR aprovado, fluxo de autenticação desenhado e custos/riscos
documentados.

#### PR 4.2 — Login e sessão

Branch sugerida: `feat/authentication-session`

- implementar cadastro, login, logout e sessão validada no servidor;
- armazenar somente hashes de senha quando credenciais locais existirem;
- configurar cookies `HttpOnly`, `Secure` e `SameSite` adequadamente;
- proteger as rotas do workspace sem depender apenas da interface;
- adicionar páginas e estados de loading, erro e recuperação;
- testar expiração, logout, cookie ausente e sessão inválida.

Aceite: usuário anônimo não acessa o workspace e nenhum token sensível fica
disponível ao JavaScript do navegador.

#### PR 4.3 — Autorização por usuário

Branch sugerida: `feat/user-data-isolation`

- criar a camada de acesso PostgreSQL dos módulos;
- derivar `userId` exclusivamente da sessão no servidor;
- aplicar escopo por usuário em toda leitura, criação, alteração e exclusão;
- impedir que IDs enviados pelo cliente determinem o proprietário;
- testar acesso horizontal entre dois usuários para cada agregado;
- considerar constraints compostas adicionais se elas reduzirem relações
  cruzadas entre proprietários.

Aceite: testes provam que um usuário não lê nem altera dados de outro.

#### PR 4.4 — Proteções operacionais

Branch sugerida: `feat/security-controls`

- adicionar rate limiting nas operações sensíveis;
- criar auditoria para login, mudança de identidade e alterações financeiras;
- padronizar respostas sem revelar existência de conta ou detalhes internos;
- proteger contra CSRF onde o modelo de sessão exigir;
- adicionar cabeçalhos de segurança e política de conteúdo;
- documentar retenção e remoção dos registros de auditoria.

Aceite: cenários de abuso possuem testes e eventos sensíveis são rastreáveis sem
registrar secrets ou dados financeiros completos.

### M5 — Persistência e regras financeiras

#### PR 5.1 — Despesas no servidor

Branch sugerida: `feat/expense-persistence`

- implementar repositório PostgreSQL e casos de uso de despesas;
- criar Server Actions ou Route Handlers finos, conforme a fronteira escolhida;
- validar payloads no servidor e manter cálculos no domínio;
- substituir gravações de despesas em `localStorage`;
- tratar loading, falha, retry e atualização otimista com rollback;
- cobrir paginação, filtros e ordenação no banco.

Aceite: despesas sobrevivem a outro navegador e permanecem isoladas por usuário.

#### PR 5.2 — Cartões e parcelas no servidor

Branch sugerida: `feat/card-installment-persistence`

- migrar cartões, contas e planos de parcelas para PostgreSQL;
- manter despesas geradas por parcela idempotentes;
- impedir duplicidade de número de parcela;
- definir política para arquivamento em vez de exclusão destrutiva;
- testar alteração de cartão, vencimento e progresso de parcelas.

Aceite: cartões e parcelas usam apenas a persistência do servidor.

#### PR 5.3 — Importação assistida do navegador

Branch sugerida: `feat/local-data-import`

- detectar dados legados no `localStorage`;
- exibir prévia, validações e contagem antes de importar;
- gerar uma chave de idempotência para permitir nova tentativa segura;
- informar conflitos sem apagar o conteúdo original;
- oferecer exportação de segurança e remoção local somente após confirmação;
- testar importação parcial, duplicada, inválida e interrompida.

Aceite: um usuário atual migra os dados sem duplicidade nem perda silenciosa.

#### PR 5.4 — Recorrência e calendário financeiro

Branch sugerida: `feat/recurring-expenses`

- modelar recorrência sem materializar infinitamente lançamentos futuros;
- implementar despesas fixas, assinaturas e lançamentos agendados;
- definir fuso horário, competência e comportamento para dias inexistentes;
- garantir geração idempotente e histórico após edição da regra;
- cobrir cancelamento, pausa e próxima ocorrência.

Aceite: recorrências produzem lançamentos previsíveis e reproduzíveis.

#### PR 5.5 — Fechamento e conciliação

Branch sugerida: `feat/financial-reconciliation`

- calcular competência e fechamento da fatura por cartão;
- implementar fatura prevista e limite comprometido/disponível;
- importar OFX e CSV por adaptadores separados;
- criar normalização e detecção de possíveis duplicidades;
- oferecer conciliação manual antes de automatizar ambiguidades;
- preservar o arquivo original ou seu hash para auditoria e idempotência.

Aceite: a mesma importação pode ser repetida sem duplicar transações.

#### PR 5.6 — Dashboard e acabamento visual

Branch sugerida: `feat/financial-dashboard`

- concluir gráfico por categoria e evolução mensal;
- adicionar comparativo entre períodos;
- exibir fatura prevista e limite por cartão;
- padronizar estados vazio, erro, skeleton e grandes volumes;
- revisar despesas, parcelas e cartões com dados reais do servidor;
- validar teclado, leitor de tela, contraste, zoom de 200% e mobile;
- adicionar snapshots visuais apenas para componentes estáveis.

Aceite: métricas batem com consultas de referência e os testes de acessibilidade
não possuem violações críticas ou sérias.

### M6 — Entrega e observabilidade

#### PR 6.1 — Artefato versionado

Branch sugerida: `ci/container-publishing`

- publicar a imagem no GitHub Container Registry;
- usar tag imutável por SHA e tag de versão quando houver release;
- gerar SBOM e executar análise de vulnerabilidades da imagem;
- assinar ou atestar proveniência do artefato;
- restringir permissões do workflow ao mínimo necessário.

Aceite: uma imagem identificável pelo commit pode ser baixada e iniciada.

#### PR 6.2 — Ambientes e provedor

Branch sugerida: `docs/deployment-architecture`

- escolher hospedagem compatível com Next.js Node e container;
- definir PostgreSQL gerenciado, região, backups e custo máximo;
- criar `staging` separado de produção;
- registrar DNS, TLS, secrets e matriz de ambientes;
- manter a aplicação independente do provedor escolhido;
- registrar a decisão em ADR antes de configurar produção.

Aceite: arquitetura, custo, limites gratuitos e plano de saída estão
documentados com informações verificadas na data da decisão.

#### PR 6.3 — Deploy seguro

Branch sugerida: `ci/staging-deployment`

- executar migrations em job único antes do rollout;
- impedir deploy quando backup ou migration falhar;
- usar GitHub Environments e aprovação para produção;
- adicionar smoke test de health, login e consulta autenticada;
- implementar rollback da aplicação sem rollback destrutivo de schema;
- bloquear concorrência entre deploys do mesmo ambiente.

Aceite: staging é reproduzível e uma falha no smoke test interrompe ou reverte a
entrega.

#### PR 6.4 — Observabilidade

Branch sugerida: `feat/observability`

- adicionar logs estruturados com correlation ID;
- remover ou mascarar dados pessoais, tokens e valores sensíveis;
- medir latência, erros, pool do banco e filas;
- instrumentar tracing nas operações de servidor e integrações;
- criar alertas acionáveis e dashboards mínimos;
- documentar diagnóstico e resposta a incidentes.

Aceite: uma falha de requisição pode ser localizada entre aplicação e banco sem
expor dados privados.

#### PR 6.5 — Releases e manutenção

Branch sugerida: `ci/release-automation`

- automatizar versão, changelog e release a partir de commits convencionais;
- definir política de atualização de dependências e majors manuais;
- agendar testes de backup/restauração e análise de segurança;
- revisar permissões de GitHub Apps e remover acessos obsoletos;
- documentar SLO, RPO, RTO e rotina de manutenção.

Aceite: cada release liga código, imagem, migration e notas de mudança.

### M7 — Open Finance

Este marco depende de M4, M5 e de controles mínimos do M6.

#### PR 7.1 — Descoberta e contrato

Branch sugerida: `docs/open-finance-provider`

- selecionar parceiro regulado com sandbox adequado ao Brasil;
- validar cobertura, consentimento, webhooks, limites, SLA e custos;
- consultar requisitos jurídicos, de privacidade e retenção;
- desenhar uma interface interna independente do provedor;
- registrar decisão, ameaças e plano de substituição em ADR.

Aceite: sandbox validado sem dados reais e contrato interno revisado.

#### PR 7.2 — Consentimento e credenciais

Branch sugerida: `feat/open-finance-consent`

- implementar início, callback, renovação e revogação de consentimento;
- criptografar tokens em repouso com chave fora do banco;
- nunca enviar tokens do provedor ao navegador;
- registrar estado, escopos e expiração do consentimento;
- testar replay, callback inválido e revogação.

Aceite: revogar consentimento interrompe novas sincronizações e invalida
credenciais conforme o contrato do provedor.

#### PR 7.3 — Sincronização resiliente

Branch sugerida: `feat/open-finance-sync`

- receber webhooks com validação de assinatura e idempotência;
- criar fila, retentativas com backoff e dead-letter queue;
- controlar cursor e janela de sincronização por conexão;
- suportar reprocessamento seguro e limites do parceiro;
- observar atraso, falhas e volume por etapa.

Aceite: eventos repetidos ou fora de ordem não duplicam transações.

#### PR 7.4 — Normalização e conciliação

Branch sugerida: `feat/open-finance-reconciliation`

- mapear contas, cartões e transações externas ao modelo interno;
- guardar identificadores externos sem contaminar o domínio;
- definir regras determinísticas de duplicidade e correspondência;
- encaminhar ambiguidades para confirmação do usuário;
- manter trilha da origem e de cada decisão de conciliação.

Aceite: sincronização manual e automática produzem o mesmo resultado final.

#### PR 7.5 — Privacidade e operação

Branch sugerida: `feat/open-finance-privacy-controls`

- permitir desconectar instituição e solicitar remoção dos dados aplicáveis;
- definir retenção, minimização e exportação dos dados do usuário;
- criar runbooks para indisponibilidade e comprometimento de credenciais;
- executar revisão de segurança antes de habilitar produção;
- liberar gradualmente com feature flag.

Aceite: consentimento, sincronização e exclusão são auditáveis de ponta a ponta.

## Melhorias contínuas de qualidade

Estas tarefas acompanham as PRs acima e não devem virar um projeto paralelo sem
consumidor real:

- aumentar cobertura unitária nas regras financeiras novas;
- criar testes de contrato para adaptadores de banco e Open Finance;
- executar E2E autenticado com banco efêmero;
- cobrir autorização negativa e concorrência de escrita;
- manter axe, contraste, foco, teclado, zoom e tamanhos de viewport no E2E;
- adicionar Firefox/WebKit quando os fluxos estabilizarem e o custo do CI for
  aceitável;
- medir bundle, Core Web Vitals e consultas lentas antes de definir budgets;
- adicionar testes de carga focados em importação, sincronização e dashboard;
- revisar dependências major em PR dedicada, nunca no grupo automático;
- manter o check `Database integration` obrigatório no ruleset da `main`.

## Trabalho paralelo sem conflito

### Frentes que podem avançar juntas

- identidade/autorização e publicação da imagem, desde que em PRs distintas;
- UI do dashboard usando contratos de aplicação e fixtures, sem criar um segundo
  acesso ao banco;
- documentação de deploy enquanto a persistência é implementada;
- descoberta do parceiro Open Finance, sem integrar SDK antes do ADR.

### Frentes que precisam ser sequenciais

1. decisão de identidade → sessão → isolamento por usuário;
2. isolamento por usuário → persistência das telas;
3. persistência → importação de dados locais;
4. regras de cartão/recorrência → dashboard definitivo;
5. autenticação + persistência + observabilidade → Open Finance.

Não altere a mesma branch em duas máquinas ao mesmo tempo. Use uma branch por
PR e, quando duas frentes tocarem o mesmo módulo, integre primeiro a dependência
na `main`.

## Preparação de uma nova máquina

### Requisitos

- Git com assinatura GPG configurada para o GitHub;
- Node.js conforme `.nvmrc`;
- Corepack e a versão de pnpm indicada em `package.json`;
- Docker com Compose;
- navegador do Playwright instalado quando E2E local for necessário.

No WSL, mantenha o repositório dentro do filesystem Linux, por exemplo
`~/dev/splitfin`, para evitar lentidão e diferenças de permissão em `/mnt/c`.
Ative a integração WSL do Docker Desktop ou use um Docker Engine dentro da
distribuição.

### Primeira configuração

```bash
git clone git@github.com:brunodias0903/splitfin.git
cd splitfin
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm db:up
pnpm db:migrate
pnpm db:seed
pnpm exec playwright install chromium
pnpm validate
pnpm test:db
```

Use credenciais e bancos diferentes por máquina. `.env.local` nunca deve ser
copiado pelo Git nem conter valores de produção.

### Identidade Git

O padrão global deve ser a identidade pessoal:

```bash
git config --global user.name "Bruno Dias"
git config --global user.email "bdd.vasconcelos@gmail.com"
```

Os projetos de trabalho em `/Users/brunodias/Dev/Getter` usam configuração
condicional própria no macOS. No WSL, crie uma regra equivalente apenas se os
repositórios de trabalho também existirem ali; caminhos e configurações Git não
são compartilhados automaticamente entre os sistemas.

Antes do primeiro push em cada máquina:

```bash
git config user.email
git log -1 --show-signature
```

## Início de uma sessão

```bash
git switch main
git pull --ff-only origin main
git fetch --prune
git status --short --branch
git switch -c <tipo>/<descricao-curta>
```

Leia, nesta ordem:

1. este guia;
2. `docs/roadmap.md`;
3. ADRs relacionados ao trabalho;
4. `CONTRIBUTING.md`;
5. instruções relevantes do Next.js em `node_modules/next/dist/docs/`.

## Encerramento e troca de máquina

Não use stash como mecanismo principal de sincronização entre computadores.
Antes de trocar de máquina:

1. execute os testes proporcionais à mudança;
2. faça commits pequenos e assinados;
3. envie a branch para `origin`;
4. abra ou atualize uma Draft PR com estado, riscos e próximo passo exato;
5. confirme que o worktree está limpo;
6. desligue serviços locais que não serão usados com `pnpm db:down`.

Comandos de conferência:

```bash
pnpm quality
git status --short --branch
git log -3 --oneline --show-signature
git push -u origin HEAD
```

Ao retomar em outra máquina:

```bash
git fetch --prune
git switch <branch-existente>
git pull --ff-only
```

Se outra frente tiver sido integrada à `main`, atualize a branch antes de
continuar e resolva conflitos localmente. Nunca force push na `main`.

## Definition of Done final

O escopo original estará finalizado quando:

- todos os itens M4 a M7 aplicáveis estiverem concluídos;
- dados financeiros não dependerem de `localStorage`;
- autenticação e autorização negativa estiverem cobertas por testes;
- recorrência, faturas, importação e conciliação estiverem operacionais;
- dashboard utilizar dados persistidos e métricas validadas;
- staging e produção tiverem deploy, migrations, smoke test e rollback;
- backups forem automáticos e restaurações forem testadas;
- logs, métricas, tracing e alertas estiverem ativos sem dados sensíveis;
- Open Finance estiver protegido por consentimento, criptografia, idempotência e
  controles de privacidade, caso o marco seja habilitado;
- documentação, ADRs, runbooks e pipeline refletirem o sistema implantado;
- todas as PRs estiverem integradas, branches removidas e `main` verde.
