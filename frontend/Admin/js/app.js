// Boot do admin: portão de demonstração -> shell (sidebar) -> rotas por hash.
(function () {
  var U = window.AdminUI, C = window.ADMIN_CONFIG, P = window.AdminPages, root = document.getElementById("root");
  var unlocked = function () { try { return sessionStorage.getItem(C.GATE_KEY) === "1"; } catch (e) { return false; } };
  // Portão VISUAL de demonstração: não é segurança (a senha está neste frontend). Nenhuma página é montada antes dele.
  function gate() {
    root.innerHTML = '<div class="gt"><form class="gb" autocomplete="off"><img src="' + C.LOGO + '" alt="Project Kandi"><h1>Admin access</h1><p>Visual demo gate. Not real security: the real protection will be added in the backend.</p><label>Password<input type="password" id="gp" autofocus></label><p class="ge" id="ge" role="alert" hidden>Wrong password.</p><button class="b">Enter</button><a href="../">&lsaquo; Back to site</a></form></div>';
    root.querySelector("form").onsubmit = function (e) { e.preventDefault(); if (document.getElementById("gp").value === C.DEMO_GATE_PASSWORD) { try { sessionStorage.setItem(C.GATE_KEY, "1"); } catch (x) {} boot(); } else { var g = document.getElementById("ge"); g.hidden = false; document.getElementById("gp").value = ""; } };
  }
  function find(h) { var m = h.match(/^user\/(.+)$/); if (m) return { p: P.list.filter(function (x) { return x.id === "user/:id"; })[0], id: decodeURIComponent(m[1]) }; return { p: P.list.filter(function (x) { return x.id === h; })[0] }; }
  function boot() {
    if (!unlocked()) return gate();
    root.innerHTML = '<div class="sh"><aside id="sd"><div class="lo"><img src="' + C.LOGO + '" alt=""><b>Kandi Admin</b></div><nav>' + P.list.filter(function (p) { return !p.hide; }).map(function (p) { return '<a href="#' + p.id + '" data-id="' + p.id + '">' + U.ic(p.i, 20) + p.t + "</a>"; }).join("") + '</nav><button class="b g lg" id="lo">' + U.ic("out", 18) + ' Log out</button></aside><div id="ovl"></div><div class="mn"><header><button class="ib" id="mb" aria-label="Menu">' + U.ic("menu", 24) + '</button><span class="dmb">TEST MODE · everything is simulated</span><a href="../app.html">Back to site</a></header><main id="pgm"></main></div></div>';
    var sd = U.$("#sd");
    U.$("#mb").onclick = function () { sd.classList.add("open"); }; U.$("#ovl").onclick = function () { sd.classList.remove("open"); };
    U.$("#lo").onclick = function () { try { sessionStorage.removeItem(C.GATE_KEY); } catch (e) {} location.hash = ""; gate(); };
    function route() {
      var h = location.hash.slice(1) || "dashboard", f = find(h), m = U.$("#pgm"); sd.classList.remove("open"); U.$$(".ov").forEach(function (o) { o.remove(); });
      U.$$("#sd nav a").forEach(function (a) { a.classList.toggle("on", a.dataset.id === (f.p && f.p.id === "user/:id" ? "players" : h)); });
      if (!f.p) { m.innerHTML = '<div class="st"><h1>404</h1><p>Admin page not found.</p><a class="b" href="#dashboard">Dashboard</a></div>'; return; }
      document.title = f.p.t + " - Kandi Admin"; window.scrollTo(0, 0); P.render(m, f.p, f.id);
    }
    window.addEventListener("hashchange", function () { if (unlocked()) route(); }); route();
  }
  boot();
})();
