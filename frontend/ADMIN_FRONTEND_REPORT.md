# ADMIN_FRONTEND_REPORT

Painel administrativo (só frontend) em `/Admin` (`Admin/index.html`). Backend **NÃO conectado**. HTML/CSS/JS puro, sem framework.

## Acesso
`/Admin` (ou `/admin`) mostra a tela de acesso de demonstração. Senha temporária `KANDYNESSSSSS3` (em `Admin/js/config.js`). Senha errada mostra erro; certa abre o painel; "Log out" volta ao portão. Nenhuma página do painel é montada antes do portão. **Não é segurança**: a senha está no navegador. Remover/trocar quando o KSbackend existir. A autenticação normal do site não foi alterada.

## Páginas (rotas por hash em `/Admin/`)
Dashboard `#dashboard`, Players `#players`, Manage User `#user/<id>` (+ `#manage-user`), Usernames, Inventory, Transactions, Bans, Assets, Asset Creation `#asset-creation`, Reports, Groups, Forums, Applications, Permissions, Logs, Feature Flags `#feature-flags`, Messages, Site Alerts `#site-alerts`.

## Arquivos (todos novos em `Admin/`)
- `index.html`, `css/admin.css` (visual próprio, rosa/branco/neutros, claro e escuro)
- `js/config.js` (senha demo, tamanho de página)
- `js/data/demo-data.js` (**todos os dados fictícios, isolados**)
- `js/data/admin-data.js` (**única camada de acesso a dados**: `list`, `get`, `stats`, `perform`)
- `js/ui.js` (componentes: tabela com busca/filtros/paginação, cards, gráficos SVG, modal, toast, estados carregando/vazio/erro)
- `js/pages.js` (definição das 17 páginas), `js/app.js` (portão, sidebar adaptável, rotas)

## Modificados fora do painel
`js/app.js` (ícones do menu lateral no estilo Hexium, em rosa; removido "Library" da barra superior), `css/style.css` (cor/traço dos ícones do menu), `server.py` (`/Admin` e `/admin` → `/Admin/`), novo `_redirects` (hosts estáticos). Páginas públicas e módulos `js/api/*` não foram tocados.

## Pontos de integração (procure `TODO(backend)`)
`Admin/js/data/admin-data.js`: `list`, `get`, `stats`, `perform`. Nenhuma rota foi inventada e nenhum endpoint do Pekora é chamado.

## Depende do backend
Todas as operações: banir/desbanir, editar usuário, saldo, aprovar/rejeitar assets, criar asset, resolver denúncias, travar grupos/fóruns, aceitar aplicações, permissões, feature flags, mensagens, alertas, reverter usernames, remover itens. Hoje cada botão abre confirmação e, ao confirmar, diz explicitamente "Not executed" (nada é simulado como feito). Dados exibidos são fictícios e marcados "demo data" na interface.

## Testado (Playwright, local)
Portão (erro/sucesso), as 18 rotas, busca/filtro/paginação/estado vazio, confirmação, celular (390px) e desktop, site público (menu e barra superior).

## Segunda rodada (novas páginas e ajustes)
- **Asset Creation** em 2 partes: (1) publicar por link do Roblox (o backend usa rccservice2020), (2) enviar arquivo de modelo (.rbxm/.rbxmx); faces clássicas aceitam também URL. Tipos: acessórios (hat, hair, face, neck, shoulder, front, back, waist), T-Shirt, Shirt, Pants, Classic Face, Gear, Package, partes do corpo, Animation, Emote, Decal, Image, Audio, Video, Mesh, Model, Plugin, Badge, Game Pass e "NGC" (nome mantido como você escreveu; confirme o que significa). Sem roupa 3D.
- **Venda**: Offsale / Onsale / Limited / Limited U, tempo de offsale (dias), preço e estoque. Símbolo Limited (verde + "U" amarelo) em `Admin/css/admin.css` (`.lim`), usado na tabela de Assets.
- **Asset Hub**: fila de aprovação de roupas, imagens, ícones de grupo/jogo, banners e user ads.
- **Promocodes**: tempo, usos máximos, recompensa (Robux, Tix, Asset ou Face).
- **Roles**: matriz de permissões por cargo (ex.: Asset Mod sem Robux/Tix); só `HIGH_ROLES` (config.js) editam, os outros veem só leitura. O cargo atual é de demonstração (`DEMO_ROLE`).
- **Economy**: dar Robux/Tix e **Eco reset** (remove só limiteds, Robux e Tix). Também disponíveis em Manage User.
- **Site Alerts**: editor do banner de cima (texto, cor de fundo e cor da letra, com prévia).
- **Download**: ícones de Windows, Studio, iOS/Mac, Android e Linux refeitos (preenchidos, como no Hexium).
- Ainda **não** feito: importar arquivo de jogo do Roblox no Creator Hub, aba de User Ads no Creator Hub e exibição dos ads no site; o banner público ainda lê `js/config.js` (ligar ao valor salvo no backend); menus suspensos de Studio/Android/Mac/Linux na página de download.
- Operações novas (publicar, upload, promocodes, roles, economy, banner) também dependem do backend: todas passam por `AdminData.perform` e dizem "Not executed".

## Terceira rodada
- **Limiteds só para cargos autorizados**: nova permissão "Publish limiteds" em Roles (Owner e Admin; Asset Mod e Moderator não). Cargo "Member" aparece em Roles sem nenhuma permissão e travado. Em Asset Creation, Limited/Limited U só aparecem para quem tem a permissão (`LIMITED_ROLES` em `Admin/js/config.js`). O site público não tem nenhuma tela para membros publicarem itens. A regra real **precisa ser validada no servidor** (`TODO(backend)`).
- **Face por PNG** (Asset Creation, parte 3): aceita só `.png` até 1 MB, mostra prévia e dimensões, bloqueia o envio sem um PNG válido. Operação `assets.publishFacePng` depende do backend.

## Quarta rodada (site público + admin)
- **Barra verde de notificação** (`KandiNotify.bar`, `js/extras.js`): "Purchase completed successfully!" só aparece quando a compra REALMENTE retorna sucesso.
- **Janelas** (`KandiModal`): Buy Item (com saldo depois da compra), Processing Purchase, Insufficient Funds (Buy Robux), Play Game. Ligadas aos botões Buy e Play via `"modal"` em `js/routes.js` e `act()` em `js/pages.js`. Sem backend aparece o erro real ("Not connected yet"); nada finge sucesso.
- **User Ads no Creator Hub** (`creator.html#ads`): lista (`ads.mine`), formulário com prévia no estilo da imagem 6 (ADVERTISEMENT / Report) e **lance mínimo de 15 Robux** (também no formulário `advertisements/new`). A cobrança e a validação reais são do servidor (`TODO(backend)`). A exibição dos ads nas páginas do site ainda não foi feita (`ads.serve` foi só declarado em `js/api/ads.js`).
- **Application** (`#account-application`): design escuro das imagens 12/13 (Discord, About Me, Roblox, frase de verificação, Referral, Captcha). Discord, frase e captcha dependem do backend (`auth.discordStatus`, `auth.applicationCode`, `auth.applyAccount`).
- **Referral Code** em Settings (aba Referral): criar código; quem cria ganha 50 Robux e quem usa ganha 30 (texto na tela; quem paga é o servidor). `referral.create` declarado em `js/api/referral.js`.
- **Technical Issues Screen**: nova página no admin. Quando ligada cobre todo o site (app, login, landing e creator) com a imagem de manutenção e esconde o resto; `/Admin` continua acessível com a senha. **DEMO**: o estado fica só no `localStorage` deste navegador (`kandi_tech_issues_demo`). `TODO(backend)`: ler/gravar o estado no servidor, senão visitantes de verdade nunca veriam a tela.
- **Favicon K** (`assets/favicon-32.png`, `-192.png`) e **thumb do site** (`assets/og-image.jpg`, imagem 10) em todas as páginas. Para a prévia funcionar em redes sociais, troque o caminho do `og:image` pela URL absoluta do domínio.
- **Ícones de download** refeitos conforme a imagem de referência. Eles aparecem meio apagados porque os links de download ainda não estão configurados em `js/config.js` (comportamento já existente).
- Arquivos novos: `js/extras.js`, `assets/tech-issues.jpg`, `assets/og-image.jpg`, `assets/favicon-*.png`.

## Quinta rodada
- `TEST_MODE` (js/config.js e Admin/js/config.js) substitui o modo demo: ações simuladas, dados "Teste" (`js/testdata.js`). Detalhes e pendências em `kandi_new_fetures.txt`.
- `index.html` virou a tela de entrada (Login | Create Application, código verificado pelo bot do Discord via apelido no servidor). Sem sessão, o site rosa não aparece.
- Tela "be back soon" no celular usa `assets/tech-issues-mobile.jpg` (retrato).
- `tests/smoke.py` atualizado (32 checks).
