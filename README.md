# VBM Transfer Executivo — Painel Administrativo

- Aplicação web interna para gestão de serviços de transfer executivo.
- Módulos: serviços, clientes, motoristas, veículos, agenda, relatórios e painel.
- Stack: Express + Vite (React), Drizzle ORM (PostgreSQL), Tailwind, React Query.

## Tecnologias

- Backend: Express, Drizzle ORM, Zod
- Frontend: React, Wouter, Tailwind, shadcn/ui
- Auth: sessão via cookie, opção Replit Auth
- Banco: PostgreSQL (DATABASE_URL)

## Pré‑requisitos

- Node.js 18+
- PostgreSQL acessível via `DATABASE_URL`
- Variáveis de ambiente:
  - `DATABASE_URL` (obrigatória) — conexão Postgres (server/db.ts)
  - `SESSION_SECRET` e `REPL_ID` (opcionais) — habilitam Replit Auth (server/routes.ts)
  - `PORT` e `HOST` (opcionais) — servidor HTTP (server/index.ts)

## Instalação

```bash
npm install
```

## Comandos

- Desenvolvimento: `npm run dev` — inicia API + Vite em modo dev ([package.json](file:///c:/Users/willi/OneDrive/%C3%81rea%20de%20Trabalho/Initiate-Start/package.json#L7))
- Build: `npm run build` — builda client e server (script/build.ts)
- Produção: `npm start` — executa `dist/index.cjs` (package.json)
- Typecheck: `npm run check` (TS)
- Migrações (Drizzle): `npm run db:push`

## Estrutura de Pastas

- Frontend: client/src
  - Páginas: client/src/pages
  - UI: client/src/components/ui
  - Estilos: client/src/index.css
- Backend: server
  - Entrada: server/index.ts
  - Rotas API: server/routes.ts
  - DB/Drizzle: server/db.ts
- Schema/Tipos: shared/schema.ts, shared/routes.ts

## Fluxos de Autenticação e Usuários

- Login padrão via `/api/auth/login` com e‑mail e senha; cria cookie `session_user_id` (server/routes.ts).
- Obter usuário logado: `/api/auth/user` (server/routes.ts).
- Logout: `/api/logout`.
- Primeiro acesso (sem convite):
-  - Admin cria usuário pendente: `POST /api/admin/users` com `{ email, name, role }` (server/routes.ts, shared/schema.ts).
-  - Usuário cadastra senha: `POST /api/auth/register-setup` com `{ email, password }` (server/routes.ts, client/src/pages/register-setup.tsx).
- Convites (legado, opcional):
  - Criar convite: `POST /api/invitations`
-  - Registrar via convite: `POST /api/register-invite` (server/routes.ts, client/src/pages/register-invite.tsx)

## Módulos Principais

- Serviços: CRUD, filtros, agenda (client/src/pages/services.tsx, shared/routes.ts).
- Clientes: CRUD (client/src/pages/clients.tsx, shared/routes.ts).
- Motoristas: CRUD (client/src/pages/drivers.tsx, shared/routes.ts).
- Veículos: CRUD (client/src/pages/vehicles.tsx, shared/routes.ts).
- Painel/Estatísticas: client/src/pages/dashboard.tsx, shared/routes.ts

## Funcionalidades (Detalhado)

- Painel
  - KPIs rápidos de serviços, motoristas, veículos e valores.
  - Gráficos e atalhos para páginas principais (client/src/pages/dashboard.tsx).

- Serviços
  - Cadastro/edição de viagens com cliente, origem/destino, data/hora e valor cobrado.
  - Controle de custos do serviço (combustível, pedágio, estacionamento, alimentação, outros).
  - Cálculo de lucro/prejuízo e detalhe financeiro por serviço (client/src/pages/finance-service-detail.tsx).
  - Edição com preenchimento inteligente de cliente: ao escolher um cliente cadastrado no seletor, os campos “Nome do Cliente” e “Telefone” são atualizados automaticamente (client/src/pages/service-edit.tsx).
  - Campos operacionais: PAX (ADT/CHD/INF/SEN/FREE), km previsto/real, número do voo e guia.
  - Pagamento: método, status (inclui parcial com “restante ao motorista” ou “PIX”) e valor pago parcial.
  - Voucher integrado em PT/ES, com ícones de tipo (Executivo/Privativo), QR code e exportação para PDF.

- Clientes
  - Cadastro, edição, listagem e busca de clientes.

- Motoristas
  - Cadastro, edição e listagem de motoristas.
  - Registro de pagamentos de motoristas (PIX, dinheiro, faturado), com status pago/pendente/… e observação (ver “Financeiro”).

- Veículos
  - Cadastro, edição e listagem de veículos.
  - Controle de despesas por veículo e logs de quilometragem (ver “Financeiro”).

- Agenda Geral
  - Visualização de serviços em calendário/lista, com filtros por período (client/src/pages/agenda.tsx).

- Financeiro — Central de Despesas
  - Página “Central de Despesas” para cadastrar e listar todas as despesas em um só lugar (client/src/pages/finance-expenses-list.tsx).
  - Tipos de despesa suportados:
    - Veículo: seleciona o veículo por seletor, informa categoria, valor, descrição e data.
    - Empresa: informa categoria, valor, descrição, “pago para” e data.
    - Pagamento de Motorista: seleciona motorista, informa valor, método (PIX/dinheiro/faturado), status, data de pagamento e observação.
  - Ações na listagem:
    - Marcar pago/pendente para despesas de Empresa/Veículo (atualiza status e “pago em”).
    - Excluir despesa (todos os tipos, exceto custos de Serviço que são editados no próprio serviço).
    - Desativar despesas específicas em edições de linha detalhadas (Empresa/Veículo).
  - Filtros avançados: período, tipo, categoria, veículo, motorista, serviço, status, paginação e ordem.

- Financeiro — Agenda Financeira
  - Agenda que contém todas as despesas (futuras e passadas, pagas ou não), em ordem temporal (client/src/pages/finance-agenda.tsx).
  - Exibição unificada de:
    - Despesas de Veículo
    - Despesas da Empresa
    - Pagamentos de Motoristas
  - Ações:
    - Agendar próximo mês para criar lançamentos futuros rapidamente.
    - Excluir itens com atualização imediata da lista.

- Financeiro — Relatórios
  - Geração de relatório por período com:
    - Total cobrado, total de custos e lucro bruto.
    - Custo médio por km e km total.
    - Listagem de serviços e despesas do período com detalhes e status.
  - Filtros de veículo e motorista para focar o relatório (client/src/pages/finance-reports.tsx).

- Financeiro — Logs de KM
  - Registro de odômetro inicial/final por veículo, opcionalmente vinculando motorista/serviço.
  - Listagem com filtros por período, veículo, motorista e serviço, com paginação e ordenação (client/src/pages/finance-km-logs.tsx).

- Navegação
  - Rotas principais: ver mapeamento em client/src/App.tsx (Dashboard, Services, Clients, Drivers, Vehicles, Agenda, Reports e páginas Finance).

### Voucher de Viagem
- Página: [service-voucher.tsx](file:///c:/Users/willi/OneDrive/%C3%81rea%20de%20Trabalho/Initiate-Start/client/src/pages/service-voucher.tsx).
- Recursos:
  - Idiomas PT/ES.
  - Cabeçalho com dados da empresa e QR code do itinerário.
  - Grid com Hora, Nro OS, Cliente, Origem, Destino, T (Executivo/Privativo), PAX, Cobrar.
  - Legenda com ícones; total a recolher quando aplicável.
  - Exportação PDF e impressão.
  - Aceita overrides de PAX via querystring (?adt=, chd=, inf=, sen=, free=).

## Permissões (RBAC)
- Funções: admin, operational, driver ([profiles](file:///c:/Users/willi/OneDrive/%C3%81rea%20de%20Trabalho/Initiate-Start/shared/schema.ts#L23-L31)).
- Regras de navegação:
  - “Financeiro” visível e acessível somente para administradores — checado no menu ([layout.tsx](file:///c:/Users/willi/OneDrive/%C3%81rea%20de%20Trabalho/Initiate-Start/client/src/components/layout.tsx#L135-L166)) e nas rotas protegidas ([App.tsx](file:///c:/Users/willi/OneDrive/%C3%81rea%20de%20Trabalho/Initiate-Start/client/src/App.tsx#L80-L124)).
  - Motoristas têm acesso ao modo motorista (Agenda e Histórico).
  - Rota protegida central: `ProtectedRoute` faz o gate com base no `user.role`.

## Desenvolvimento

- Executar em dev:
```bash
npm run dev
```
  - API e client servidos no mesmo processo. Seed inicial do banco é executado automaticamente (server/seed.ts, chamado em server/routes.ts).

- Atualizar schema no banco:
```bash
npm run db:push
```

## Build e Produção

```bash
npm run build
npm start
```
  - Client produzido em `dist/public` e server em `dist/index.cjs`.

### Variáveis de Ambiente
- `DATABASE_URL` obrigatório ([server/db.ts](file:///c:/Users/willi/OneDrive/%C3%81rea%20de%20Trabalho/Initiate-Start/server/db.ts)).
- `HOST` e `PORT` opcionais, padrão 127.0.0.1:5000 ([server/index.ts](file:///c:/Users/willi/OneDrive/%C3%81rea%20de%20Trabalho/Initiate-Start/server/index.ts#L93-L103)).
- `TZ` recomendado (ex.: `America/Sao_Paulo`) para alinhamento de horários em produção.
- Em produção, o cookie de sessão é `secure`; é necessário HTTPS.

### Deploy em VPS (exemplo Nginx + systemd)
1) Criar `.env` de produção (ex.: `/etc/vbm/vbm.env`):
```
NODE_ENV=production
HOST=127.0.0.1
PORT=5000
TZ=America/Sao_Paulo
DATABASE_URL=postgres://USUARIO:SENHA@127.0.0.1:5432/vbm
```
2) Migrar e buildar:
```
export $(grep -v '^#' /etc/vbm/vbm.env | xargs)
npm run db:push
npm run build
```
3) systemd `/etc/systemd/system/vbm.service`:
```
[Unit]
Description=VBM Transfer Executivo
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/vbm
EnvironmentFile=/etc/vbm/vbm.env
ExecStart=/usr/bin/env node dist/index.cjs
Restart=always
RestartSec=3
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```
4) Nginx como proxy com TLS (Let’s Encrypt):
```
server {
  listen 80;
  server_name painel.seu-dominio.com.br;
  return 301 https://$host$request_uri;
}
server {
  listen 443 ssl http2;
  server_name painel.seu-dominio.com.br;
  ssl_certificate     /etc/letsencrypt/live/painel.seu-dominio.com.br/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/painel.seu-dominio.com.br/privkey.pem;
  location / {
    proxy_pass http://127.0.0.1:5000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

### Primeira execução e usuários
- O seed cria/garante o usuário admin `admin@vbm.com.br` com senha `admin123` ([server/seed.ts](file:///c:/Users/willi/OneDrive/%C3%81rea%20de%20Trabalho/Initiate-Start/server/seed.ts)).
- Recomenda-se redefinir a senha via fluxo “Esqueci minha senha” na tela de login ([login.tsx](file:///c:/Users/willi/OneDrive/%C3%81rea%20de%20Trabalho/Initiate-Start/client/src/pages/login.tsx)).
- Cadastre usuários em “Configurações” e atribua papéis; “Operacional” não acessa “Financeiro”.

## Estilo e UI

- Tailwind com paleta ouro/escuro em client/src/index.css.
- Componentes base shadcn em client/src/components/ui.
- Layout e sidebar: client/src/components/layout.tsx.

## Observações

- Não committe segredos. Use `.env` local e variáveis em produção.
- Testes automatizados ainda não disponíveis; recomenda‑se adicionar cobertura para rotas críticas (auth, serviços).
