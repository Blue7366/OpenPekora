# Project Kandi - Frontend

Site estático (HTML, CSS e JavaScript puro, sem build) com modo demo e pronto para receber o backend.

## Rodar no Termux (localhost)
```
pkg update && pkg install python unzip
unzip project-kandi.zip && cd project-kandi
python server.py
```
Abra `http://localhost:8000` no navegador do celular. Para acessar de outro aparelho da mesma rede: `python server.py 8000 --host 0.0.0.0`.
Atalhos: `/` (login/cadastro), `/home`, `/catalog`, `/download`, `/avatar`, `/groups`, `/transactions`, `/builders-club`.

## Estrutura
- `index.html` - tela de login/cadastro (Verify with Discord, usuário e senha; `#login` abre o Log In)
- `app.html` - site logado: Home, Catalog, Download, Avatar, Groups, Transactions, Builders Club (rotas `#home`, `#catalog`...)
- `js/config.js` - **único arquivo para editar** (modo demo, URL da API, rotas, links de download, banner)
- `js/api.js` - todas as chamadas de rede. `js/app.js` - telas. `css/style.css` - estilos
- `assets/` - logos (`k.png` e `logo.png`)
- `server.py` - servidor local com uma API de teste vazia em `/api/*`

## Modo demo e backend
- `DEMO: true` (padrão): sem login e sem rede, tudo vazio, escritas desativadas, com a faixa "DEMO MODE". O Login/Cadastro da tela inicial entra direto na Home.
- `DEMO: false`: usa a API em `API_BASE`. Com o `server.py` use `"/api"`; com seu backend, a URL dele (libere o CORS do domínio).
  Na tela de login, `DEMO: false` ativa o fluxo real: o botão do Discord vai para `DISCORD_URL` (`/discordverify`); o backend faz o OAuth, grava o cookie `discord_profile` (`{id, username, discriminator, avatar}`) e redireciona de volta para `/`. O cadastro envia `discordId`.
- `AUTH_MODE`: `"unset"` (padrão, não enviado até confirmar a autenticação do PekoraSource), `"cookie"` ou `"token"`.
- `server.py --mock-api` liga uma API de teste local (não é o PekoraSource; use com `USE_STUB: true`). Sem a flag, `/api/*` responde 404.
- Testes: `python3 tests/smoke.py` (precisa de Playwright/Chromium).

## Contrato da API (JSON)
Erros: `{ "message": "...", "errors": { "campo": "..." } }`. Um 401 volta para a tela de login.

**Contrato da API de teste local (`--mock-api`, só para `USE_STUB`):**

| Método | Rota | Resposta |
|---|---|---|
| POST | `/auth/signup` `{ username, password, discordId }` | `{ token?, user }` |
| POST | `/auth/login` `{ username, password, code? }` | `{ token?, user }` (se precisar de 2FA: erro 401 com `{ twoFactor: true }`) |
| POST | `/auth/logout` | `204` |
| GET | `/me` | `{ username, currency, tickets, events }` |
| GET | `/home` | `{ continue: [], popular: [] (jogos), feed: [], blog: [], events: [] }` |
| GET | `/catalog/items?category&q&sort&page&limit` | `{ items: [{ id, name, thumbnail, price, sales, isNew, url }], total, page, hasMore }` |
| POST | `/feed` `{ text }` | `201` |
| GET | `/groups` | `{ groups: [{ name, owner, members, thumbnail }] }` |
| GET | `/transactions?type` | `{ rows: [{ date, member, description, amount }] }` |
| GET | `/avatar/items?tab` | `{ items: [{ id, name, thumbnail, worn }] }` |
| GET | `/builders-club` | `{ tiers: [{ name, perDay, price }], membership }` |

Jogos: `{ name, thumbnail, playing, likeRatio (0-1), url }`. Feed: `{ group, text, author, date, thumbnail }`. Blog: `{ title, author, views, thumbnail, url }`. Eventos: `{ title, thumbnail, url }`.
`thumbnail` precisa ser URL `http(s)` ou começar com `/`. Valide tudo de novo no backend e guarde senhas com hash (argon2/bcrypt).


## Integração com o backend (Pekora)
O frontend está **preparado** (rotas, páginas, módulos `js/api/*.js` ainda não conectados). Veja `PEKORA_BACKEND_INTEGRATION.md` e `AGENTS.md`.

Creator Hub: abra `creator.html` (ou `/creator` no servidor local). Páginas novas: `#promocodes`, `#inventory`, `#account`, `#trade/new/<id>`, `#games`.
