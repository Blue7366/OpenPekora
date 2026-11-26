#!/usr/bin/env python3
"""Servidor local do Project Kandi (funciona no Termux, só biblioteca padrão).

Uso:  python server.py [porta] [--host 0.0.0.0]
Abra: http://localhost:8000
Servidor ESTÁTICO + URLs limpas (/promocodes -> app.html#promocodes, /creator -> creator.html).
Opcional: --mock-api liga uma API de teste local em /api/* (respostas vazias, sem login real, sem Discord).
Ela NÃO é o PekoraSource: use com DEMO:false e USE_STUB:true em js/config.js. Sem --mock-api, /api/* e /discordverify respondem 404.
"""
import json, os, sys
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse

ROOT = os.path.dirname(os.path.abspath(__file__))
APP_PAGES = {"home", "catalog", "download", "avatar", "groups", "transactions", "builders-club", "games", "create"}
MOCK = False
ME = {"username": "Guest", "currency": 0, "tickets": 0, "events": 0}
API_GET = {
    "/me": ME,
    "/home": {"continue": [], "popular": [], "feed": [], "blog": [], "events": []},
    "/catalog/items": {"items": [], "total": 0, "page": 1, "hasMore": False},
    "/groups": {"groups": []},
    "/transactions": {"rows": []},
    "/avatar/items": {"items": []},
    "/builders-club": {"tiers": [], "membership": None},
}


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-CSRF-Token")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def send_json(self, code, obj=None):
        data = b"" if obj is None else json.dumps(obj).encode()
        self.send_response(code)
        if data:
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        if data:
            self.wfile.write(data)

    def api(self, method):
        path = urlparse(self.path).path[4:]
        size = int(self.headers.get("Content-Length") or 0)
        try:
            body = json.loads(self.rfile.read(size) or b"{}") if size else {}
        except ValueError:
            return self.send_json(400, {"message": "Invalid JSON"})
        if not MOCK:
            return self.send_json(404, {"message": "No API here. Run with --mock-api for the local test API, or point API_BASE to your backend."})
        if method == "GET" and path in API_GET:
            return self.send_json(200, API_GET[path])
        if method == "POST" and path in ("/auth/login", "/auth/signup"):
            # API de teste: NÃO valida nada e NÃO emite token. Só devolve um usuário vazio para exercitar a interface.
            return self.send_json(200, {"user": dict(ME, username=body.get("username") or "Guest")})
        if method == "POST" and path == "/auth/logout":
            return self.send_json(204)
        if method == "POST" and path == "/feed":
            return self.send_json(201, {"ok": True})
        self.send_json(404, {"message": "Not found"})

    def do_GET(self):
        p = urlparse(self.path).path
        if p.startswith("/api/"):
            return self.api("GET")
        if p == "/discordverify" and MOCK:  # só com --mock-api: simula o retorno do Discord (NÃO é verificação real)
            self.send_response(302)
            self.send_header("Set-Cookie", "discord_profile=%7B%22id%22%3A%22123456%22%2C%22username%22%3A%22Discord%20User%22%7D; Path=/")
            self.send_header("Location", "/")
            self.end_headers()
            return
        name = p.strip("/")
        if name == "":
            self.path = "/index.html"
        elif name.lower() == "admin" and p != "/Admin/":  # painel admin: /Admin e /admin vão para /Admin/
            self.send_response(302)
            self.send_header("Location", "/Admin/")
            self.end_headers()
            return
        elif name == "creator":
            self.send_response(302)
            self.send_header("Location", "/creator.html")
            self.end_headers()
            return
        elif name in APP_PAGES or (name and "." not in name and not os.path.exists(os.path.join(ROOT, name))):
            self.send_response(302)
            self.send_header("Location", "/app.html#" + name)
            self.end_headers()
            return
        return super().do_GET()

    def do_POST(self):
        if urlparse(self.path).path.startswith("/api/"):
            return self.api("POST")
        self.send_json(404, {"message": "Not found"})

    def do_OPTIONS(self):
        self.send_json(204)


if __name__ == "__main__":
    args = sys.argv[1:]
    if "--mock-api" in args:
        args.remove("--mock-api")
        MOCK = True
    host = "127.0.0.1"
    if "--host" in args:
        i = args.index("--host")
        host = args[i + 1]
        del args[i:i + 2]
    port = int(args[0]) if args else 8000
    if MOCK:
        print("AVISO: --mock-api ligada (API de teste local, não é o PekoraSource).")
    print("Project Kandi rodando em http://%s:%d  (Ctrl+C para parar)" % ("localhost" if host == "127.0.0.1" else host, port))
    try:
        ThreadingHTTPServer((host, port), Handler).serve_forever()
    except KeyboardInterrupt:
        print("\nServidor parado.")
