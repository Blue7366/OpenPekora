# PEKORA_BACKEND_INTEGRATION.md

> Documento de passagem para o **Codex**. O frontend do Project Kandi foi **preparado** (arquivos, rotas, páginas, camada de API, navegação, Creator Hub). **Nada está conectado ao PekoraSource ainda e nada foi testado contra um backend real.** Seu trabalho é a integração.

## 1. Regras (valem para toda a tarefa)

1. Antes de cada recurso: ler o controller → o service → DTOs/models do PekoraSource. Conferir método HTTP, rota, parâmetros, corpo, resposta, autenticação e permissões.
2. **Nunca inventar rotas.** Se o endpoint não existir (ex.: `Promocodes` é uma *Razor page*, não JSON), documentar como "Bloqueado pelo backend" ou criar uma rota segura no backend e documentar.
3. Nada de respostas falsas, saldos fixos, usuários de exemplo ou transações simuladas. Erros de API **nunca** são engolidos (a UI mostra a mensagem).
4. Nunca colocar segredos, tokens de bot ou chaves no JavaScript do navegador.
5. Não expor funções administrativas a usuários comuns (`perm` nas rotas/menus).
6. **Branding**: manter logo, favicon, ícones, moedas e `assets/` do Kandi. Não importar nada visual do Pekora nem do Hexium. Não migrar para Next.js/React.
7. Trabalhar em branch própria (ex.: `feature/pekora-integration`), commits descritivos.
8. Só marcar "Testado" o que foi realmente testado contra o backend rodando.

## 2. Arquitetura

| Arquivo | Função |
|---|---|
| `js/config.js` | Configuração central: `DEMO`, `API_BASE`, `SERVICES` (URL por serviço), `CSRF`, `AUTH_MODE`, `ENDPOINTS` (contrato antigo/demo), `DISCORD_INVITE`. |
| `js/api.js` | Cliente HTTP **único** (as funções antigas `login/signup/me/home/catalog/...` agora são atalhos para `call()`). `KandiAPI.call("modulo.metodo", {params, query, body})`, `define`, `E`, `adapters` (shape/list/cursor), `contracts`, `mode()`, `configIssues()`. Auth (`AUTH_MODE` = `unset`/`cookie`/`token`), CSRF com 1 retry, timeout, evento `kandi:unauthorized` no 401. Resposta HTML com status 200 **não** é sucesso (`kind: "format"`); `raw: true` permite ao `adapt` decidir (ex.: Razor Page). |
| `js/api/*.js` | **Um arquivo por domínio** (26 módulos, 191 métodos). Todos começam **não conectados** (`p: ""`). |
| `js/routes.js` | Registro de rotas (`KANDI_ROUTES`, 89 rotas) e menu lateral (`KANDI_NAV`). Rotas são *dados*, não código. |
| `js/pages.js` | Renderizador: blocos `list`, `form`, `detail`, `tabs`, `static`, `actions`, `chat`, `trade`, `sections` (games), `catgrid` (inventário), `promo`, `settings`, `rows`, `theme`, `heading`. |
| `js/app.js` | Shell (topo, menu lateral estilo Hexium, menu da engrenagem), páginas originais (home, catalog, avatar, groups, transactions, builders-club, download), roteamento por hash. |
| `creator.html`, `css/creator.css`, `js/creator.js` | **Creator Hub** (tema escuro, logo `assets/kandi-silver.png`). Mostra *Creations* e hospeda as rotas `develop/*` e `internal/create-place`. Outras rotas redirecionam para `app.html#rota`. |
| `server.py` | Servidor local; URLs limpas (`/promocodes`, `/internal/promocodes` → `app.html#...`; `/creator` → `creator.html`). |

Rotas usam hash: `app.html#game/12`. `:param` vira `params.param`. Páginas públicas têm `public: true`; as demais exigem login (volta para `index.html`). `#promo` redireciona para `#promocodes`.

### Como conectar um endpoint
1. Abra `js/api/<modulo>.js`, ache o método (ex.: `games.search`).
2. Preencha depois de ler o controller:
```js
search: E("GET", { svc: "default", p: "/v1/games/list", adapt: function (r) {
  return { items: r.data.map(function (g) { return { id: g.id, name: g.name, thumbnail: g.thumb, playing: g.playerCount, likeRatio: g.ratio }; }), hasMore: !!r.nextCursor };
} })
```
(o caminho acima é só **ilustração do formato**, não um endpoint real.)
3. `p` aceita `{id}`, `{rowId}`, etc. (vêm de `params`). Query e body vão em `o.query` / `o.body`; `adapt(resposta, o)` converte para o contrato da UI (seção 3).
4. Se o serviço tem outra URL base, defina em `KANDI_CONFIG.SERVICES` e use `svc`.
5. Rode com `DEMO: false`, teste e atualize os checklists abaixo.

**Paginação**: a UI manda `page` e `limit` (`C.PAGE_SIZE`). Se o backend usa cursor, guarde-o no `adapt` e devolva `hasMore`/`totalPages`/`total`.
**CSRF**: `config.CSRF` e o retry em `api.js` são um *palpite não verificado*. Confirmar no backend como o token é emitido e enviado (e se o header precisa ser exposto via CORS).
**Autenticação/sessão**: `AUTH_MODE` agora começa em `"unset"` (nenhuma credencial é enviada) — **não** se presume Bearer. Defina `cookie` ou `token` só depois de ler a autenticação do PekoraSource e marque `CONFIRMED.auth/csrf/api` em `config.js` (apaga o aviso "Integration pending"). As funções antigas foram unificadas: `login→auth.login`, `signup→auth.signup`, `logout→auth.logout`, `me→auth.me`, `home→site.home`, `catalog→catalog.search`, `feedPost→feed.post`, `groups→groups.mine`, `transactions→economy.transactions`, `avatar→avatar.items`, `buildersClub→membership.tiers` (4 métodos novos, todos não conectados). `auth.me` deve devolver `{ id, username, thumbnail?, currency, tickets, events?, permissions? }`; só o servidor define "autenticado" (falha de rede/5xx mostra erro com Retry, não vai ao login). Contratos legados que as páginas originais ainda leem: `site.home → {continue,popular,feed,blog,events}`, `groups.mine → {groups|items}`, `economy.transactions → {rows|items:[{date,member,description,amount}]}`, `membership.tiers → {tiers|items:[{name,perDay,price}], membership}`.
**Discord**: o "Verified" só aparece quando `auth.discordStatus` (novo, não conectado; esperado `{ verified:true, id, username, avatar? }`) confirma no servidor. O cookie `discord_profile` sozinho não prova nada. O backend deve validar a verificação no cadastro.

## 3. Contratos de dados esperados pela UI (o `adapt` converte o backend para isto)

- **Lista**: `{ items: [...], hasMore, total?, totalPages? }` (ou array simples).
- **Row**: `{ id, title|name, subtitle?, meta?, thumbnail?, href? }`. Sem `href`, usa `hrefTpl` da rota.
- **Game**: `{ id, name, thumbnail, playing, likeRatio(0-1), url? }` — **Item/Asset**: `{ id, name, creator?, thumbnail, price?, value?, sales?, isNew?, worn?, url? }` — **Thumb**: `{ url }`.
- **Detail**: `{ title|name, subtitle?, thumbnail?, description?, stats: [[rótulo, valor]], sections?: [{title, items:[row]}], extras usados em links ({id}, {senderId}, {creatorId}, {partnerId} p/ trade/:id) }`.
- **Form prefill** (`load`): objeto com chaves = `name` dos campos. Erros por campo: `new KandiAPI.ApiError(status, msg, {campo: msg})`.
- **`account.get`** (Settings → Account Info): `{ username, email, emailVerified, discord, about, birthday("YYYY-MM-DD"), gender("male"|"female"), country("US") }`. **`account.getSocial`**: chaves `facebook, twitter, youtube, twitch, discord, telegram, tiktok, github, roblox, guilded, googleplus`.
- **Games (`games.search`)** recebe `sort` (`popular`/`favorites`/`updated`/vazio), `q`, `limit`. **Inventário (`inventory.list`)** recebe `category`, `page`, `limit` e devolve `total`/`totalPages` (a UI mostra "Showing a - b of N").
- **Trade**: `inventory.collectibles` (meu) e `users.collectibles` (do outro, `params.id`) recebem `category`, `page`; envio `{ offerItems:[ids], requestItems:[ids], offerRobux, requestRobux }`; máximo de 4 itens por lado na UI (`maxItems`, ajustar ao backend). `trades.get` deve devolver `partnerId`.
- **Promocodes**: `promocodes.redeem` body `{ code }`; resposta com `message` e opcional `reward`. Erros (código vazio/inválido/já resgatado) vêm como `ApiError`.
- **Creator Hub** (`develop.mine`): query `{ type, page, limit, publicOnly, archived, sort, dir }` com `type` = `game`, `tshirt`, `shirt`, `pants`, `model`, `decal`, `image`, `audio`, `mesh`, `plugin`.
- **Chat**: `{ author, text, date }`; envio `{ text }`. Ações podem devolver `message` (toast) e `redirect`. `rowActions` recebem `params = {...paramsDaRota, rowId}`.
- Valores de selects (privacidade, categorias, tipos de asset, gêneros, formatos de anúncio) são **provisórios**: confirmar com o backend.

## 4. Placeholders conscientes (não implementados de propósito)
- Settings → **Billing** e **Notifications**, e a matriz de **permissões de cargos** do grupo: blocos `pending` (campos dependem do backend).
- **Tempo real** (SignalR) para chat/presença: hoje o chat tem botão *Refresh*.
- **Donations** e páginas de texto (`about`, `docs`, `privacy`, `terms`, `contact`, `bug-bounty`, `ios-tutorial`): sem conteúdo; editar em `js/routes.js`.
- **Jogar (`games.join`)** e **Open Studio**: ver seção 6 (`DOWNLOADS.studio` em `config.js`).
- Páginas originais (`catalog`, `avatar`, `transactions`, `builders-club`, `home`, `groups`) agora passam por `call()` mas ainda leem o contrato antigo (acima); o editor de avatar usa `avatar.wear/remove/redraw/setType` (novos). A página `transactions` antiga convive com `my-money`.
- **Website Settings → Theme** funciona só no navegador (localStorage); não precisa de backend.

## 5. Status por página

Legenda: UI = implementada; Backend = conectada; Teste = testada com backend real.

| Rota | Página | Pública | Métodos de API | UI | Backend | Teste | Estado |
|---|---|---|---|---|---|---|---|
| `#forgot-password` | Password Recovery | sim | `auth.forgotPassword` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#reset-password/:token` | Reset Password | sim | `auth.resetPassword` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#verify-account` | Verify Account | sim | `auth.verifyAccount` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#two-factor` | Two-Step Verification | sim | `auth.twoFactorVerify` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#two-factor/setup` | Two-Step Setup | não | `auth.twoFactorDisable`, `auth.twoFactorEnable`, `auth.twoFactorStatus` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#account-application` | Account Application | sim | `auth.applyAccount` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#error/:code` | Error | sim | — | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#help` | Help Center | sim | — | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#games` | Games | não | `games.search` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#games/favorites` | My Favorites | não | `games.favorites` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#game/:id` | Game | não | `games.badges`, `games.favorite`, `games.get`, `games.join`, `games.recommendations`, `games.servers`, `games.thumbnails`, `games.vote` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#catalog/item/:id` | Catalog Item | não | `catalog.buyReseller`, `catalog.comments`, `catalog.favorite`, `catalog.get`, `catalog.postComment`, `catalog.purchase`, `catalog.recommendations`, `catalog.resellers`, `catalog.salesHistory` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#library` | Library | não | `library.search` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#library/asset/:id` | Asset | não | `library.acquire`, `library.comments`, `library.favorite`, `library.get`, `library.postComment` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#users` | People | não | `users.search` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#groups/search` | Group Search | não | `groups.search` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#profile` | Profile | não | `friends.follow`, `friends.remove`, `friends.request`, `users.badges`, `users.creations`, `users.favorites`, `users.friends`, `users.get`, `users.groups`, `users.inventory`, `users.usernameHistory` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#user/:id` | Profile | não | `friends.follow`, `friends.remove`, `friends.request`, `users.badges`, `users.creations`, `users.favorites`, `users.friends`, `users.get`, `users.groups`, `users.inventory`, `users.usernameHistory` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#account` | My Settings | não | `account.changeEmail`, `account.changePassword`, `account.changeUsername`, `account.delete`, `account.get`, `account.getPrivacy`, `account.getSocial`, `account.logoutOthers`, `account.logoutSession`, `account.sessions`, `account.updateDiscord`, `account.updatePersonal`, `account.updatePrivacy`, `account.updateSocial` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#inventory` | Inventory | não | `inventory.list` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#avatar/outfits` | Outfits | não | `avatar.createOutfit`, `avatar.deleteOutfit`, `avatar.outfits`, `avatar.renameOutfit`, `avatar.updateOutfit`, `avatar.wearOutfit` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#avatar/body` | Body | não | `avatar.getBody`, `avatar.setBodyColors`, `avatar.setScales`, `avatar.setType` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#my-money` | My Money | não | `economy.balance`, `economy.cancelListing`, `economy.groupFunds`, `economy.resellerListings`, `economy.transactions` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#trade` | Trades | não | `trades.list` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#trade/:id` | Trade | não | `trades.accept`, `trades.decline`, `trades.get` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#trade/new/:userId` | New Trade | não | `inventory.collectibles`, `trades.create`, `users.collectibles`, `users.get` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#trade/counter/:id` | Counter Trade | não | `inventory.collectibles`, `trades.counter`, `trades.get`, `users.collectibles`, `users.get` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#promocodes` | Redeem Codes | não | `promocodes.redeem` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#internal/promocodes` | Redeem Codes | não | `promocodes.redeem` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#internal/robux-exchange` | Robux Exchange | não | `economy.exchangeRobux` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#internal/tix-exchange` | Tix Exchange | não | `economy.exchangeTix` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#internal/referral` | Referral | não | `referral.get`, `referral.list`, `referral.redeem` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#internal/membership` | Membership | não | `membership.get`, `membership.purchase`, `membership.tiers` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#internal/year` | Account Year | não | `account.year` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#internal/collectible-inventory` | Collectibles | não | `inventory.collectibles` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#internal/report-abuse` | Report Abuse | não | `reports.submit` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#internal/create-place` | Create Place | não | `develop.createPlace` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#internal/chat` | Chat | não | `chat.conversations` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#chat/:id` | Chat | não | `chat.messages`, `chat.send` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#group/create` | Create Group | não | `groups.create` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#group/:id` | Group | não | `groups.games`, `groups.get`, `groups.join`, `groups.leave`, `groups.members`, `groups.postWall`, `groups.roles`, `groups.setPrimary`, `groups.wall` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#group/:id/admin` | Group Admin | não | `groups.auditLog`, `groups.changeOwner`, `groups.createRole`, `groups.deleteRole`, `groups.editRole`, `groups.get`, `groups.members`, `groups.payout`, `groups.removeMember`, `groups.roles`, `groups.setMemberRole`, `groups.updateIcon`, `groups.updateSettings` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#messages` | Messages | não | `messages.list` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#messages/compose` | Compose | não | `messages.send` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#messages/compose/:to` | Compose | não | `messages.send` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#message/:id` | Message | não | `messages.archive`, `messages.get`, `messages.markUnread`, `messages.unarchive` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#announcements` | Announcements | não | `site.announcements` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#friends` | Friends | não | `friends.accept`, `friends.decline`, `friends.list`, `friends.remove` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#notifications` | Notifications | não | `notifications.list` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#feed` | Feed | não | `feed.list`, `feed.post` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#events` | Events | não | `site.events` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#forums` | Forums | não | `forums.categories` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#forums/mine` | My Forums | não | `forums.mine` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#forums/category/:id` | Forum Category | não | `forums.category`, `forums.threads` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#forums/thread/:id` | Thread | não | `forums.replies`, `forums.reply`, `forums.thread` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#forums/new/:id` | New Thread | não | `forums.createThread` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#advertisements` | Advertisements | não | `ads.mine` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#sponsorships` | Sponsorships | não | `ads.sponsorships` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#badges` | Badges | não | `badges.mine` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#develop` | Develop | não | — | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#develop/games` | My Games | não | `develop.mine` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#develop/models` | My Models | não | `develop.mine` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#develop/decals` | My Decals | não | `develop.mine` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#develop/clothing` | My Clothing | não | `develop.mine` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#develop/badges` | My Badges | não | `develop.badges` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#develop/passes` | My Game Passes | não | `develop.passes` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#develop/moderation` | Moderation Status | não | `develop.moderation` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#develop/game/new` | Create Game | não | `develop.createGame` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#develop/game/:id` | Configure Game | não | `develop.createProduct`, `develop.gameThumbnails`, `develop.generateThumbnail`, `develop.getGame`, `develop.passes`, `develop.products`, `develop.updateGame`, `develop.updatePlace`, `develop.updateProduct`, `develop.uploadGameIcon`, `develop.uploadGameThumbnail` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#develop/place/:id` | Update Place | não | `develop.updatePlace` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#develop/asset/upload` | Upload Asset | não | `develop.uploadAsset` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#develop/asset/upload/:type` | Upload Asset | não | `develop.uploadAsset` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#develop/asset/:id` | Configure Asset | não | `develop.getAsset`, `develop.updateAsset`, `develop.uploadVersion`, `develop.versions` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#develop/pass/new/:gameId` | Create Game Pass | não | `develop.createPass` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#develop/pass/:id` | Configure Game Pass | não | `develop.getPass`, `develop.updatePass` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#develop/badge/new/:gameId` | Create Badge | não | `develop.createBadge` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#develop/badge/:id` | Configure Badge | não | `develop.getBadge`, `develop.updateBadge` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#develop/product/new/:gameId` | Create Developer Product | não | `develop.createProduct` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#develop/product/:id` | Configure Developer Product | não | `develop.getProduct`, `develop.updateProduct` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#catalog/limiteds` | Limited Items | não | `catalog.limiteds` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#advertisements/new` | Create Advertisement | não | `ads.create` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#about` | About Us | sim | — | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#ios-tutorial` | iOS Tutorial | sim | — | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#docs` | Docs | sim | — | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#bug-bounty` | Bug Bounty | sim | — | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#privacy` | Privacy | sim | — | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#terms` | Terms and Conditions | sim | — | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#contact` | Contact | sim | — | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#donations` | Donations | não | — | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `creator.html#creations[/aba[/sub]]` | Creator Hub: Creations (Experience / Avatar Items / Development Items) | não | `develop.mine` | ✅ | ❌ | ❌ | UI pronta, sem backend |
| `#home`, `#catalog`, `#avatar`, `#groups`, `#transactions`, `#builders-club`, `#download` | páginas originais do Kandi | não (download: sim) | contrato antigo (`config.ENDPOINTS`) | ✅ | ❌ | ❌ | já existiam; migrar para `call()` |
| `index.html` | Login/Signup (+Discord) | sim | `KandiAPI.login/signup` | ✅ | ❌ | ❌ | já existia; falta ligar à autenticação real, 2FA, erros reais |

Testes automatizados (`python3 tests/smoke.py`, Chromium headless): 31/31 verificações passam em modo DEMO e contra um **stub descartável** que só exercita o transporte (erro 500, HTML-200, 204, 401, timeout, rede, XSS, senha fora do storage). **Nenhum teste usou o PekoraSource.** Testes anteriores **sem backend** (modo DEMO, Chromium headless, viewport de celular): as rotas amostradas renderizam sem erro de JavaScript (home, games, inventory, account, trade/new, promocodes, `#promo`, about, develop/*, catalog/limiteds, advertisements/new, friends, creator hub e suas sub-rotas); validação de campo obrigatório funciona; ações de escrita mostram "Demo mode…" em vez de sucesso falso; rota inexistente mostra 404; menu lateral e menu da engrenagem abrem. **Nenhum teste contra o PekoraSource foi feito.**

## 6. Infraestrutura que falta (aviso)
- O README/Notes do PekoraSource dizem que o **game-arbiter não está incluído**. Sem ele (e sem RCC/servidores de jogo) não há alocação de servidor, join script nem conexão de jogadores. Inspecionar e documentar o que falta; `games.join` só deve ser conectado se a infraestrutura existir. **Não fingir que o jogo abre.**
- **Promocodes**: o PekoraSource tem `Pages/Internal/Promocodes.cshtml(.cs)` + `Services/Promocodes.cs` (resgata Robux/asset, impede resgate duplicado). É página Razor, **não é API JSON**: inspecionar e usar uma rota existente ou criar uma rota segura no backend; a UI (`#promocodes`) já valida código vazio, exige o aceite e mostra erro/sucesso vindos da API.
- Upload de arquivos (assets, ícones, places) usa `multipart/form-data` (`FormData`): confirmar o formato esperado.
- Creator Hub em outro domínio (como `create.<site>`): ajustar o link "Create" (`app.js`) e `server.py`/hospedagem; os dois HTML compartilham `js/` e `css/`.

## 7. Métodos de API (todos pendentes)
### `js/api/account.js`
- [ ] `account.changeEmail` (POST, palpite) — não conectado
- [ ] `account.changePassword` (POST, palpite) — não conectado
- [ ] `account.changeUsername` (POST, palpite) — não conectado
- [ ] `account.delete` (POST, palpite) — não conectado
- [ ] `account.get` (GET, palpite) — não conectado
- [ ] `account.getPrivacy` (GET, palpite) — não conectado
- [ ] `account.getSocial` (GET, palpite) — não conectado
- [ ] `account.logoutOthers` (POST, palpite) — não conectado
- [ ] `account.logoutSession` (POST, palpite) — não conectado
- [ ] `account.sessions` (GET, palpite) — não conectado
- [ ] `account.updateDiscord` (POST, palpite) — não conectado
- [ ] `account.updatePersonal` (POST, palpite) — não conectado
- [ ] `account.updatePrivacy` (POST, palpite) — não conectado
- [ ] `account.updateSocial` (POST, palpite) — não conectado
- [ ] `account.year` (GET, palpite) — não conectado

### `js/api/ads.js`
- [ ] `ads.create` (POST, palpite) — não conectado
- [ ] `ads.mine` (GET, palpite) — não conectado
- [ ] `ads.sponsorships` (GET, palpite) — não conectado

### `js/api/auth.js`
- [ ] `auth.applyAccount` (POST, palpite) — não conectado
- [ ] `auth.discordStatus` (GET, novo, sem rota) — não conectado
- [ ] `auth.forgotPassword` (POST, palpite) — não conectado
- [ ] `auth.login` (POST, palpite) — não conectado
- [ ] `auth.logout` (POST, palpite) — não conectado
- [ ] `auth.me` (GET, palpite) — não conectado
- [ ] `auth.resetPassword` (POST, palpite) — não conectado
- [ ] `auth.signup` (POST, palpite) — não conectado
- [ ] `auth.twoFactorDisable` (POST, palpite) — não conectado
- [ ] `auth.twoFactorEnable` (POST, palpite) — não conectado
- [ ] `auth.twoFactorStatus` (GET, palpite) — não conectado
- [ ] `auth.twoFactorVerify` (POST, palpite) — não conectado
- [ ] `auth.verifyAccount` (POST, palpite) — não conectado

### `js/api/avatar.js`
- [ ] `avatar.createOutfit` (POST, palpite) — não conectado
- [ ] `avatar.deleteOutfit` (DELETE, palpite) — não conectado
- [ ] `avatar.get` (GET, palpite) — não conectado
- [ ] `avatar.getBody` (GET, palpite) — não conectado
- [ ] `avatar.items` (GET, palpite) — não conectado
- [ ] `avatar.outfits` (GET, palpite) — não conectado
- [ ] `avatar.redraw` (POST, palpite) — não conectado
- [ ] `avatar.remove` (POST, palpite) — não conectado
- [ ] `avatar.renameOutfit` (PATCH, palpite) — não conectado
- [ ] `avatar.setBodyColors` (POST, palpite) — não conectado
- [ ] `avatar.setScales` (POST, palpite) — não conectado
- [ ] `avatar.setType` (POST, palpite) — não conectado
- [ ] `avatar.updateOutfit` (POST, palpite) — não conectado
- [ ] `avatar.wear` (POST, palpite) — não conectado
- [ ] `avatar.wearOutfit` (POST, palpite) — não conectado

### `js/api/badges.js`
- [ ] `badges.mine` (GET, palpite) — não conectado

### `js/api/catalog.js`
- [ ] `catalog.buyReseller` (POST, palpite) — não conectado
- [ ] `catalog.comments` (GET, palpite) — não conectado
- [ ] `catalog.favorite` (POST, palpite) — não conectado
- [ ] `catalog.get` (GET, palpite) — não conectado
- [ ] `catalog.limiteds` (GET, palpite) — não conectado
- [ ] `catalog.postComment` (POST, palpite) — não conectado
- [ ] `catalog.purchase` (POST, palpite) — não conectado
- [ ] `catalog.recommendations` (GET, palpite) — não conectado
- [ ] `catalog.resellers` (GET, palpite) — não conectado
- [ ] `catalog.salesHistory` (GET, palpite) — não conectado
- [ ] `catalog.search` (GET, novo; usado pela página #catalog original) — não conectado

### `js/api/chat.js`
- [ ] `chat.conversations` (GET, palpite) — não conectado
- [ ] `chat.messages` (GET, palpite) — não conectado
- [ ] `chat.send` (POST, palpite) — não conectado

### `js/api/develop.js`
- [ ] `develop.badges` (GET, palpite) — não conectado
- [ ] `develop.createBadge` (POST, palpite) — não conectado
- [ ] `develop.createGame` (POST, palpite) — não conectado
- [ ] `develop.createPass` (POST, palpite) — não conectado
- [ ] `develop.createPlace` (POST, palpite) — não conectado
- [ ] `develop.createProduct` (POST, palpite) — não conectado
- [ ] `develop.gameThumbnails` (GET, palpite) — não conectado
- [ ] `develop.generateThumbnail` (POST, palpite) — não conectado
- [ ] `develop.getAsset` (GET, palpite) — não conectado
- [ ] `develop.getBadge` (GET, palpite) — não conectado
- [ ] `develop.getGame` (GET, palpite) — não conectado
- [ ] `develop.getPass` (GET, palpite) — não conectado
- [ ] `develop.getProduct` (GET, palpite) — não conectado
- [ ] `develop.mine` (GET, palpite) — não conectado
- [ ] `develop.moderation` (GET, palpite) — não conectado
- [ ] `develop.passes` (GET, palpite) — não conectado
- [ ] `develop.products` (GET, palpite) — não conectado
- [ ] `develop.updateAsset` (PATCH, palpite) — não conectado
- [ ] `develop.updateBadge` (PATCH, palpite) — não conectado
- [ ] `develop.updateGame` (PATCH, palpite) — não conectado
- [ ] `develop.updatePass` (PATCH, palpite) — não conectado
- [ ] `develop.updatePlace` (POST, palpite) — não conectado
- [ ] `develop.updateProduct` (PATCH, palpite) — não conectado
- [ ] `develop.uploadAsset` (POST, palpite) — não conectado
- [ ] `develop.uploadGameIcon` (POST, palpite) — não conectado
- [ ] `develop.uploadGameThumbnail` (POST, palpite) — não conectado
- [ ] `develop.uploadVersion` (POST, palpite) — não conectado
- [ ] `develop.versions` (GET, palpite) — não conectado

### `js/api/economy.js`
- [ ] `economy.balance` (GET, palpite) — não conectado
- [ ] `economy.cancelListing` (DELETE, palpite) — não conectado
- [ ] `economy.exchangeRobux` (POST, palpite) — não conectado
- [ ] `economy.exchangeTix` (POST, palpite) — não conectado
- [ ] `economy.groupFunds` (GET, palpite) — não conectado
- [ ] `economy.resellerListings` (GET, palpite) — não conectado
- [ ] `economy.transactions` (GET, palpite) — não conectado

### `js/api/feed.js`
- [ ] `feed.list` (GET, palpite) — não conectado
- [ ] `feed.post` (POST, palpite) — não conectado

### `js/api/forums.js`
- [ ] `forums.categories` (GET, palpite) — não conectado
- [ ] `forums.category` (GET, palpite) — não conectado
- [ ] `forums.createThread` (POST, palpite) — não conectado
- [ ] `forums.mine` (GET, palpite) — não conectado
- [ ] `forums.replies` (GET, palpite) — não conectado
- [ ] `forums.reply` (POST, palpite) — não conectado
- [ ] `forums.thread` (GET, palpite) — não conectado
- [ ] `forums.threads` (GET, palpite) — não conectado

### `js/api/friends.js`
- [ ] `friends.accept` (POST, palpite) — não conectado
- [ ] `friends.decline` (POST, palpite) — não conectado
- [ ] `friends.follow` (POST, palpite) — não conectado
- [ ] `friends.list` (GET, palpite) — não conectado
- [ ] `friends.remove` (POST, palpite) — não conectado
- [ ] `friends.request` (POST, palpite) — não conectado

### `js/api/games.js`
- [ ] `games.badges` (GET, palpite) — não conectado
- [ ] `games.favorite` (POST, palpite) — não conectado
- [ ] `games.favorites` (GET, palpite) — não conectado
- [ ] `games.get` (GET, palpite) — não conectado
- [ ] `games.join` (POST, palpite) — não conectado
- [ ] `games.recommendations` (GET, palpite) — não conectado
- [ ] `games.search` (GET, palpite) — não conectado
- [ ] `games.servers` (GET, palpite) — não conectado
- [ ] `games.thumbnails` (GET, palpite) — não conectado
- [ ] `games.vote` (POST, palpite) — não conectado

### `js/api/groups.js`
- [ ] `groups.auditLog` (GET, palpite) — não conectado
- [ ] `groups.changeOwner` (POST, palpite) — não conectado
- [ ] `groups.create` (POST, palpite) — não conectado
- [ ] `groups.createRole` (POST, palpite) — não conectado
- [ ] `groups.deleteRole` (DELETE, palpite) — não conectado
- [ ] `groups.editRole` (PATCH, palpite) — não conectado
- [ ] `groups.games` (GET, palpite) — não conectado
- [ ] `groups.get` (GET, palpite) — não conectado
- [ ] `groups.join` (POST, palpite) — não conectado
- [ ] `groups.leave` (POST, palpite) — não conectado
- [ ] `groups.members` (GET, palpite) — não conectado
- [ ] `groups.mine` (GET, novo; usado pela página #groups original) — não conectado
- [ ] `groups.payout` (POST, palpite) — não conectado
- [ ] `groups.postWall` (POST, palpite) — não conectado
- [ ] `groups.removeMember` (DELETE, palpite) — não conectado
- [ ] `groups.roles` (GET, palpite) — não conectado
- [ ] `groups.search` (GET, palpite) — não conectado
- [ ] `groups.setMemberRole` (PATCH, palpite) — não conectado
- [ ] `groups.setPrimary` (POST, palpite) — não conectado
- [ ] `groups.updateIcon` (POST, palpite) — não conectado
- [ ] `groups.updateSettings` (POST, palpite) — não conectado
- [ ] `groups.wall` (GET, palpite) — não conectado

### `js/api/inventory.js`
- [ ] `inventory.collectibles` (GET, palpite) — não conectado
- [ ] `inventory.list` (GET, palpite) — não conectado

### `js/api/library.js`
- [ ] `library.acquire` (POST, palpite) — não conectado
- [ ] `library.comments` (GET, palpite) — não conectado
- [ ] `library.favorite` (POST, palpite) — não conectado
- [ ] `library.get` (GET, palpite) — não conectado
- [ ] `library.postComment` (POST, palpite) — não conectado
- [ ] `library.search` (GET, palpite) — não conectado

### `js/api/membership.js`
- [ ] `membership.get` (GET, palpite) — não conectado
- [ ] `membership.purchase` (POST, palpite) — não conectado
- [ ] `membership.tiers` (GET, palpite) — não conectado

### `js/api/messages.js`
- [ ] `messages.archive` (POST, palpite) — não conectado
- [ ] `messages.get` (GET, palpite) — não conectado
- [ ] `messages.list` (GET, palpite) — não conectado
- [ ] `messages.markUnread` (POST, palpite) — não conectado
- [ ] `messages.send` (POST, palpite) — não conectado
- [ ] `messages.unarchive` (POST, palpite) — não conectado
- [ ] `messages.unreadCount` (GET, palpite) — não conectado

### `js/api/notifications.js`
- [ ] `notifications.list` (GET, palpite) — não conectado

### `js/api/promocodes.js`
- [ ] `promocodes.redeem` (POST, palpite) — não conectado

### `js/api/referral.js`
- [ ] `referral.get` (GET, palpite) — não conectado
- [ ] `referral.list` (GET, palpite) — não conectado
- [ ] `referral.redeem` (POST, palpite) — não conectado

### `js/api/reports.js`
- [ ] `reports.submit` (POST, palpite) — não conectado

### `js/api/site.js`
- [ ] `site.alerts` (GET, palpite) — não conectado
- [ ] `site.announcements` (GET, palpite) — não conectado
- [ ] `site.events` (GET, palpite) — não conectado
- [ ] `site.home` (GET, novo; usado pela página #home original) — não conectado

### `js/api/thumbnails.js`
- [ ] `thumbnails.assets` (GET, palpite) — não conectado
- [ ] `thumbnails.games` (GET, palpite) — não conectado
- [ ] `thumbnails.users` (GET, palpite) — não conectado

### `js/api/trades.js`
- [ ] `trades.accept` (POST, palpite) — não conectado
- [ ] `trades.counter` (POST, palpite) — não conectado
- [ ] `trades.create` (POST, palpite) — não conectado
- [ ] `trades.decline` (POST, palpite) — não conectado
- [ ] `trades.get` (GET, palpite) — não conectado
- [ ] `trades.list` (GET, palpite) — não conectado

### `js/api/users.js`
- [ ] `users.badges` (GET, palpite) — não conectado
- [ ] `users.collectibles` (GET, palpite) — não conectado
- [ ] `users.creations` (GET, palpite) — não conectado
- [ ] `users.favorites` (GET, palpite) — não conectado
- [ ] `users.friends` (GET, palpite) — não conectado
- [ ] `users.get` (GET, palpite) — não conectado
- [ ] `users.groups` (GET, palpite) — não conectado
- [ ] `users.inventory` (GET, palpite) — não conectado
- [ ] `users.search` (GET, palpite) — não conectado
- [ ] `users.usernameHistory` (GET, palpite) — não conectado

## 8. Ordem sugerida
1. Fundação: `SERVICES`, `CSRF`, autenticação (`auth.*`, `me`), sessão/401. 2. Home, perfil, conta (Settings). 3. Catálogo/library/inventário/avatar/economia/trades/promocodes/grupos/mensagens/amigos. 4. Develop e Creator Hub (uploads, jogos, passes, produtos, badges). 5. Fóruns, referral, membership, exchange, notificações, reports. 6. Testes (auth, rotas protegidas, compras, promocodes, mobile, erros, estados vazios) e atualização deste arquivo.
