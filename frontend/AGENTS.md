# AGENTS.md - Project Kandi

Leia `PEKORA_BACKEND_INTEGRATION.md` primeiro. Resumo:
- Frontend HTML/CSS/JS puro (sem framework). Não migrar para Next.js/React.
- Backend de referência: PekoraSource (ASP.NET Core). Ler controller + service antes de preencher qualquer `js/api/*.js`. Nunca inventar rotas; nunca usar dados falsos; nunca engolir erros.
- Preservar branding do Kandi e a pasta `assets/`. Não importar assets do Pekora.
- Sem segredos no navegador. Branch própria + commits descritivos.
- Só marcar "Testado" o que foi testado com backend real. Atualizar os checklists do documento.
- Teste rápido local: `python3 server.py 8000` (DEMO: true) e abra `/app.html#games`.

- Uma única camada: páginas só usam `KandiAPI.call(...)`. Conversões do Pekora ficam no `adapt` (use `KandiAPI.adapters`). Veja `FRONTEND_PREPARATION_REPORT.md`.
- Teste: `python3 tests/smoke.py`.
