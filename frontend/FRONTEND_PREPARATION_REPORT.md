# FRONTEND_PREPARATION_REPORT.md

Branch: `feature/kandi-frontend-preparation` (baseline = zip recebido). PekoraSource **não foi alterado nem acessado** (sem rede neste ambiente).
**Nada foi conectado ao PekoraSource e nenhuma comunicação real foi testada.** O frontend está preparado, não integrado.

## 1. Arquivos modificados
`js/config.js`, `js/api.js` (reescrito), `js/api/auth.js`, `site.js`, `catalog.js`, `groups.js` (+1 método cada, sem rota), `js/app.js`, `js/pages.js`, `js/creator.js`, `js/routes.js` (texto dos placeholders), `index.html`, `server.py`, `css/style.css`, `css/creator.css` (apenas indicadores), `README.md`, `AGENTS.md`, `PEKORA_BACKEND_INTEGRATION.md`.
Novos: `tests/smoke.py`, este relatório. Nada foi apagado. `assets/`, logos, favicon, imagens de Robux/Tix, layout e cores: intactos. Sem framework, sem build.

## 2. Problemas encontrados → correções
| Problema | Correção |
|---|---|
| **Senha guardada no `sessionStorage`** antes do redirect do Discord (`index.html`) | Só o usuário é guardado; a senha nunca. Testado. |
| Discord "✓ Verified" vinha de um cookie legível pelo navegador (forjável) | Só aparece após `auth.discordStatus` (servidor). Sem rota inventada; em demo aparece rotulado "Demo". |
| Resposta **HTML com status 200** (ex.: Razor Page / redirect ao login) virava sucesso com `null` — Promocodes mostraria "Code redeemed" | Agora é erro `kind:"format"`. `raw:true` permite ao `adapt` decidir. |
| `AUTH_MODE` padrão `"token"` (presumia Bearer) | Padrão `"unset"`; `cookie`/`token` só por escolha explícita. |
| API antiga (`login/me/home/catalog/...` via `ENDPOINTS`) duplicava a nova | Tudo passa por `call()`; legados são atalhos (+4 métodos sem rota). |
| Páginas originais engoliam erros (`.catch(function(){})`) | Erro visível no próprio bloco/toast. Feed em demo não finge mais sucesso. |
| Qualquer falha de `me()` (rede/5xx) mandava ao login | Só 401 vai ao login; o resto mostra "Connection problem" + Retry. 401 guarda a rota para voltar. |
| Logout engolia falha do servidor | Falha mostra toast; token só limpa após confirmação. |
| URLs do servidor em `href`/`redirect` sem filtro (`javascript:`) | `safeUrl` (http/https, `/`, `#`, `x.html`) em cards, linhas, blog, eventos, alertas e redirects. |
| Erros do servidor sem parse (ProblemDetails, `errors:{Campo:[..]}`, `errors:[{message}]`) | Parser tolerante; erro por campo case-insensitive. Timeout/rede/formato distintos. Uploads têm timeout próprio. |
| `adapt` que lança erro vazava `TypeError` | Vira `ApiError(kind:"format")`. Contratos validados (aviso no console; falha só se a resposta for inutilizável). |
| Modo demo sem indicação em `app.html`/`creator.html` | Faixa "DEMO MODE"; modo real mostra "Integration pending" até `CONFIRMED.*`. |
| `server.py` emitia token falso e simulava Discord | `--mock-api` opt-in, sem token, rotulado; sem a flag `/api` e `/discordverify` dão 404. Corrigido `exists()` relativo ao cwd. |
| Links `#` (Download, Bug, Discord, Open Studio) levavam à Home | Aparecem desativados enquanto não configurados. Termos/Privacidade da tela inicial apontam às rotas reais. |
| Textos "Add it in js/routes.js" visíveis ao usuário | Texto neutro. (Conteúdo legal **não** foi inventado.) |

## 3. Páginas preparadas
Todas as 89 rotas + páginas originais + Creator Hub (Creations, Experience, T-Shirts, Shirts, Pants, Models, Decals, Images, Audio, Meshes, Plugins, Create Place, uploads) carregam sem erro de JS em celular e desktop, com carregamento, erro, vazio e validação. Atenção especial: login/cadastro, perfis, games, catalog, library, inventory, avatar, friends, groups, trades, economy/transactions, badges, settings, promocodes, mensagens, notificações.

## 4. Depende do backend (tudo, 191 métodos)
Todos os métodos têm `p:""` (**Not connected yet**, erro 501 visível). Pendentes específicos: autenticação/sessão/CSRF reais; `auth.discordStatus` e fluxo OAuth feito pelo servidor; **Promocodes** (Razor Page — não confirmado como API; usar `raw:true` ou rota segura); `games.join`/game-arbiter (não incluído no Pekora); uploads `multipart`; permissões (`user.permissions` do servidor — a UI só esconde, nunca autoriza); páginas de texto (about/terms/privacy…); Billing/Notifications/permissões de cargos (`pending`); tempo real do chat.

## 5. Contratos que o backend/adapters devem respeitar
Lista `{items, hasMore, total}` · Game `{id,name,thumbnail,playing,likeRatio(0-1),url}` · Item `{id,name,creator,thumbnail,price,value,sales,isNew,worn,url}` · Detalhe `{title,subtitle,thumbnail,description,stats:[[rótulo,valor]],sections}` · Perfil `{id,username,thumbnail,…}` + inventário/amigos/grupos/criações/badges · Trade `partnerId, offerItems, requestItems, offerRobux, requestRobux` · `auth.me {id,username,currency,tickets,permissions?}`. Use `KandiAPI.adapters` (`shape`, `list`, `cursor`) dentro do `adapt`; campo ausente fica ausente (nunca valor falso). Detalhes e contratos legados: `PEKORA_BACKEND_INTEGRATION.md` §2–3.

## 6. Pontos de integração (ordem sugerida)
1. `config.js`: `API_BASE/SERVICES`, `AUTH_MODE`, `CSRF` (e CORS com credenciais) → marcar `CONFIRMED`. 2. `auth.*`, `auth.me`, `auth.discordStatus`. 3. Demais módulos em `js/api/*.js` (um `p` + `adapt` por método). 4. Promocodes. 5. Atualizar os checklists do documento só após teste real.

## 7. Testes (`python3 tests/smoke.py`) — 31/31
- DEMO, celular 390px e desktop 1280px: 98 rotas sem erro de JS e sem overflow horizontal; Creator Hub (14 rotas); faixa DEMO visível; tela inicial, navegação, cadastro demo, validação de campo; promocodes e feed em demo **recusam** (sem sucesso falso); assets originais presentes.
- Modo real contra **stub descartável (não é o Pekora)**: 500→erro com mensagem; HTML-200→erro; 204→sucesso; ProblemDetails→campos; timeout; rede; 404; método não conectado→501; 401→`kandi:unauthorized`; falha de `me()`→sem redirecionar; `javascript:` não executa; senha fora do storage; aviso "Integration pending".
- **Não testado:** qualquer comunicação com o PekoraSource, CSRF/CORS reais, login real, uploads, compras/trades, Promocodes reais.
