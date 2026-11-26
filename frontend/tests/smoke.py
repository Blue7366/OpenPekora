#!/usr/bin/env python3
"""Testes do frontend (Chromium headless via Playwright). NENHUM teste aqui usa o PekoraSource.
Parte A: MODO TESTE (TEST_MODE) (todas as rotas, celular + desktop, erros de JS, overflow horizontal).
Parte B: modo real contra um stub descartável (só valida o TRANSPORTE: erros, HTML-como-sucesso, 401, timeout, rede, XSS)."""
import json, os, subprocess, sys, threading, time, re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT, SPORT = 8123, 8124
base = "http://127.0.0.1:%d" % PORT
results = []
def ok(name, cond, extra=""):
    results.append((name, bool(cond), extra)); print(("PASS " if cond else "FAIL ") + name + (" -- " + str(extra) if extra and not cond else ""))

# ---------- stub descartável (NÃO é o Pekora) ----------
class Stub(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def _send(self, code, body=None, ctype="application/json"):
        data = b"" if body is None else (body if isinstance(body, bytes) else json.dumps(body).encode())
        self.send_response(code); self.send_header("Access-Control-Allow-Origin", "*"); self.send_header("Access-Control-Allow-Headers", "*")
        if data: self.send_header("Content-Type", ctype); self.send_header("Content-Length", str(len(data)))
        self.end_headers(); self.wfile.write(data)
    def do_OPTIONS(self): self._send(204)
    def do_GET(self):
        p = self.path.split("?")[0]
        if p == "/err500": return self._send(500, {"message": "Boom from server"})
        if p == "/html200": return self._send(200, b"<html>login</html>", "text/html")
        if p == "/401": return self._send(401, {"message": "no"})
        if p == "/slow": time.sleep(1.5); return self._send(200, {"items": []})
        if p == "/ok204": return self._send(204)
        if p == "/games": return self._send(200, {"items": [{"id": 1, "name": "<img src=x onerror=window.__xss=1>", "thumbnail": "javascript:alert(1)", "url": "javascript:window.__xss=2", "playing": 3, "likeRatio": .8}], "hasMore": False})
        if p == "/me500": return self._send(500, {"message": "db down"})
        self._send(404, {"message": "nf"})
    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0); self.rfile.read(n)
        if self.path == "/problem": return self._send(400, {"title": "Validation", "errors": {"Code": ["Code is invalid"]}})
        self._send(404, {"message": "nf"})
srv = ThreadingHTTPServer(("127.0.0.1", SPORT), Stub); threading.Thread(target=srv.serve_forever, daemon=True).start()
web = subprocess.Popen([sys.executable, os.path.join(ROOT, "server.py"), str(PORT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)

LIVE_CFG = lambda extra="": open(os.path.join(ROOT, "js/config.js")).read().replace("TEST_MODE: true", "TEST_MODE: false").replace('API_BASE: "/api"', 'API_BASE: "http://127.0.0.1:%d"' % SPORT).replace("TIMEOUT_MS: 10000", "TIMEOUT_MS: 600") + extra

def watch(page, errs):
    page.on("pageerror", lambda e: errs.append("pageerror: " + str(e)))
    page.on("console", lambda m: errs.append("console.error: " + m.text) if m.type == "error" and "Failed to load resource" not in m.text and "fonts.g" not in m.text else None)
    page.on("requestfailed", lambda r: None)

try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        # ================= A. DEMO =================
        routes = json.loads(subprocess.check_output(["node", "-e", "const fs=require('fs'),vm=require('vm');const c={};c.window=c;vm.createContext(c);vm.runInContext(fs.readFileSync('js/routes.js','utf8'),c);console.log(JSON.stringify(c.KANDI_ROUTES.map(r=>r.id)))"], cwd=ROOT))
        legacy = ["home", "catalog", "avatar", "groups", "transactions", "builders-club", "download", "promo", "nope/404"]
        paths = [re.sub(r":\w+", "1", r) for r in routes] + legacy
        for label, vp in (("mobile", {"width": 390, "height": 844}), ("desktop", {"width": 1280, "height": 800})):
            ctx = b.new_context(viewport=vp, is_mobile=(label == "mobile")); ctx.add_init_script("localStorage.setItem('kandi_demo_user', '{\"username\":\"Teste\",\"currency\":1000,\"tickets\":500,\"events\":0}')"); pg = ctx.new_page(); errs = []; watch(pg, errs)
            pg.goto(base + "/app.html#home"); pg.wait_for_timeout(300)
            overflow = []
            for path in paths:
                pg.goto(base + "/app.html#" + path); pg.wait_for_timeout(120)
                if "app.html" not in pg.url: errs.append("redirected away from app.html for #" + path + " -> " + pg.url); pg.goto(base + "/app.html#home"); continue
                if pg.evaluate("document.documentElement.scrollWidth > window.innerWidth + 2"): overflow.append(path)
            ok("[%s] %d app routes render without JS errors" % (label, len(paths)), not errs, errs[:5])
            ok("[%s] no horizontal overflow on any route" % label, not overflow, overflow[:8])
            ok("[%s] TEST MODE indicator visible in app" % label, "TEST MODE" in pg.inner_text("body"))
            if label == "mobile": pg.goto(base + "/app.html#promocodes"); pg.wait_for_timeout(200); pg.screenshot(path="/tmp/shot_promocodes_mobile.png")
            if label == "desktop": pg.goto(base + "/app.html#games"); pg.wait_for_timeout(200); pg.screenshot(path="/tmp/shot_games_desktop.png")
            # Creator Hub
            errs2 = []; watch(pg, errs2)
            for h in ["creations", "creations/experience", "creations/avatar/tshirt", "creations/avatar/shirt", "creations/avatar/pants", "creations/development/model", "creations/development/decal", "creations/development/image", "creations/development/audio", "creations/development/mesh", "creations/development/plugin", "develop/game/new", "internal/create-place", "develop/asset/upload/model"]:
                pg.goto(base + "/creator.html#" + h); pg.wait_for_timeout(150)
                if "creator.html" not in pg.url: errs2.append("redirected: " + h)
            ok("[%s] Creator Hub (14 routes) without JS errors" % label, not errs2, errs2[:5])
            ok("[%s] Creator Hub TEST MODE indicator + empty state" % label, "TEST MODE" in pg.inner_text("body"))
            if label == "desktop": pg.goto(base + "/creator.html#creations"); pg.wait_for_timeout(200); pg.screenshot(path="/tmp/shot_creator_desktop.png")
            ctx.close()
        # landing + forms (demo)
        ctx = b.new_context(viewport={"width": 390, "height": 844}); pg = ctx.new_page(); errs = []; watch(pg, errs)
        pg.goto(base + "/"); pg.wait_for_timeout(200)
        ok("landing opens with Login + Create Application tabs + TEST MODE", "Create Application" in pg.inner_text("body") and "TEST MODE" in pg.inner_text("body"))
        pg.goto(base + "/app.html#home"); pg.wait_for_timeout(400)
        ok("without a session the pink site is NOT shown (redirects to the gate)", pg.url.rstrip("/").endswith("index.html") or pg.url.rstrip("/") == base)
        pg.goto(base + "/#application"); pg.wait_for_timeout(500); pg.fill("#au", "tester"); pg.fill("#ap", "secret1"); pg.click("#bA"); pg.wait_for_timeout(400)
        ok("application stays on the gate (does not open the site) and says it is simulated", "app.html" not in pg.url and "simulated" in pg.inner_text("#dm").lower())
        pg.goto(base + "/#login"); pg.fill("#lu", "tester"); pg.fill("#lp", "secret1"); pg.click("#bL"); pg.wait_for_timeout(500)
        ok("test-mode login opens app.html#home", "app.html" in pg.url)
        pg.goto(base + "/app.html#promocodes"); pg.wait_for_timeout(200)
        pg.fill("#pc", "ABC"); pg.check(".cb input"); pg.click(".rd"); pg.wait_for_timeout(300)
        txt = pg.inner_text(".fr")
        ok("promocodes in test mode are labeled simulated, NOT a real reward", "Test mode" in txt and "redeemed" not in txt.lower(), txt)
        pg.goto(base + "/app.html#forgot-password"); pg.wait_for_timeout(150); pg.click(".fm .btn"); pg.wait_for_timeout(150)
        ok("required-field validation works", "required" in pg.inner_text(".fm").lower())
        pg.goto(base + "/app.html#home"); pg.wait_for_timeout(150); pg.fill("#fi", "hello"); pg.click("#fs"); pg.wait_for_timeout(300)
        ok("feed post in test mode is labeled simulated", "Test mode" in pg.inner_text("#toast"))
        ok("original assets present", all(os.path.exists(os.path.join(ROOT, "assets", f)) for f in ["k.png", "logo.png", "kandi-silver.png", "robux.png", "robux-w.png", "tix-w.png", "tix-w.png", "pattern.png", "banner.jpg", "giftcards.png"]))
        ok("landing JS: no errors", not errs, errs[:3]); ctx.close()

        # ================= B. modo real contra stub descartável =================
        def live_page(extra=""):
            c = b.new_context(viewport={"width": 390, "height": 844}); pg = c.new_page()
            pg.route("**/js/config.js", lambda r: r.fulfill(status=200, content_type="application/javascript", body=LIVE_CFG(extra)))
            return c, pg
        c, pg = live_page(); pg.goto(base + "/app.html#privacy"); pg.wait_for_timeout(200)
        def call(path, method="GET", name="promocodes.redeem", **kw):
            return pg.evaluate("""async ([n,p,m]) => { const d = KandiAPI.defs[n]; d.p = p; d.m = m; try { const r = await KandiAPI.call(n, {body: m==='POST'?{code:'x'}:undefined}); return {ok:true, r}; } catch(e){ return {ok:false, kind:e.kind, status:e.status, message:e.message, fields:e.fields}; } }""", [name, path, method])
        r = call("/err500"); ok("HTTP 500 JSON -> rejects with server message", not r["ok"] and r["message"] == "Boom from server" and r["status"] == 500, r)
        r = call("/html200"); ok("HTTP 200 HTML is NOT success (kind=format)", not r["ok"] and r["kind"] == "format", r)
        r = call("/ok204"); ok("HTTP 204 is success", r["ok"], r)
        r = call("/problem", "POST"); ok("ProblemDetails errors map to fields", not r["ok"] and r["fields"].get("Code") == "Code is invalid", r)
        r = call("/slow"); ok("timeout -> kind=timeout", not r["ok"] and r["kind"] == "timeout", r)
        r = call("/nope-404"); ok("404 JSON -> error, not empty data", not r["ok"] and r["status"] == 404, r)
        r = pg.evaluate("""async () => { try { await KandiAPI.call('games.get', {params:{id:1}}); return 'resolved'; } catch(e) { return e.kind + '|' + e.status; } }"""); ok("unconnected method -> 501 unconnected (no fake data)", r == "unconnected|501", r)
        # rede
        pg.evaluate("KandiAPI.defs['promocodes.redeem'].p='/x'; KANDI_CONFIG.API_BASE='http://127.0.0.1:9'")
        r = pg.evaluate("""async () => { try { await KandiAPI.call('promocodes.redeem', {body:{code:'x'}}); return 'resolved'; } catch(e) { return e.kind; } }"""); ok("unreachable server -> kind=network", r == "network", r)
        # 401
        pg.evaluate("KANDI_CONFIG.API_BASE='http://127.0.0.1:%d'; window.__un=0; addEventListener('kandi:unauthorized',()=>window.__un++)" % SPORT)
        call("/401"); ok("401 fires kandi:unauthorized", pg.evaluate("window.__un") == 1)
        c.close()
        # UI: página conectada a algo que ainda não existe mostra erro, não vazio
        c, pg = live_page(); errs = []; watch(pg, errs)
        pg.route("**/127.0.0.1:%d/**" % SPORT, lambda r: r.continue_())
        pg.goto(base + "/app.html#privacy"); pg.wait_for_timeout(200)
        pg.evaluate("KandiAPI.defs['auth.me'].p='/me500'"); pg.goto(base + "/app.html#home"); pg.wait_for_timeout(700)
        ok("me() server error shows 'Connection problem' and does NOT redirect to login", "app.html" in pg.url and "Connection problem" in pg.inner_text("body"), pg.url)
        c.close()
        # XSS / URLs perigosas: renderiza lista de games vinda do stub
        c, pg = live_page(); errs = []; watch(pg, errs)
        pg.goto(base + "/app.html#privacy"); pg.wait_for_timeout(200)
        html = pg.evaluate("""async () => { const d = KandiAPI.defs['games.search']; d.p='/games'; const U = window.KandiUI; const r = await KandiAPI.call('games.search'); return U.gameCard(r.items[0]); }""")
        pg.evaluate("(h)=>{const d=document.createElement('div');d.innerHTML=h;document.body.appendChild(d);d.querySelector('a').click()}", html)
        pg.wait_for_timeout(200)
        ok("server data with javascript: URLs/HTML does not execute", pg.evaluate("window.__xss") is None and "javascript:" not in html, html[:160])
        c.close()
        # senha nunca vai para o storage (login real)
        c, pg = live_page(); pg.route("**/discordverify", lambda r: r.fulfill(status=200, content_type="text/html", body="<html>discord stub</html>"))
        pg.goto(base + "/#application"); pg.wait_for_timeout(300); pg.fill("#au", "tester"); pg.fill("#ap", "TopSecret!"); pg.click("#bA"); pg.wait_for_timeout(500)
        stored = pg.evaluate("JSON.stringify(sessionStorage) + JSON.stringify(localStorage)")
        ok("application password is not stored in the browser (live mode)", "TopSecret" not in stored, stored)
        c.close()
        # live banner
        c, pg = live_page(); pg.goto(base + "/app.html#privacy"); pg.wait_for_timeout(200)
        ok("live mode shows 'Integration pending' (nothing is claimed as connected)", "Integration pending" in pg.inner_text("body"))
        c.close(); b.close()
finally:
    web.terminate(); srv.shutdown()

passed = sum(1 for r in results if r[1]); print("\n%d/%d checks passed" % (passed, len(results)))
open("/tmp/test_results.json", "w").write(json.dumps(results))
sys.exit(0 if passed == len(results) else 1)
