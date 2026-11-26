// Project Kandi Creator Hub. Mostra "Creations" (jogos e itens do usuário) e hospeda as páginas develop/* de js/routes.js.
// Dados: develop.mine { type, page, limit, publicOnly, archived, sort, dir } -> { items:[{id,name,thumbnail,...}], hasMore }
(function () {
  "use strict";
  var C = window.KANDI_CONFIG, A = window.KandiAPI, root = document.getElementById("cr"), user = null;
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function safeUrl(u) { u = String(u == null ? "" : u).trim(); return /^(https?:\/\/|\/(?!\/)|#|[\w.-]+\.html(#|$))/i.test(u) ? u : ""; }
  function img(u, c) { return /^(https?:)?\/\/|^\/(?!\/)/.test(u || "") ? '<img class="' + c + '" src="' + esc(u) + '" alt="">' : '<div class="' + c + ' tb"></div>'; }
  function toast(msg, bad) { var t = document.getElementById("toast"); if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); } t.textContent = msg; t.className = bad ? "bad on" : "on"; clearTimeout(toast.t); toast.t = setTimeout(function () { t.className = ""; }, 3500); }
  function gameCard(g) { return '<a class="gc" href="' + esc(safeUrl(g.url) || (g.id != null ? "#develop/game/" + encodeURIComponent(g.id) : "#")) + '">' + img(g.thumbnail, "") + "<b>" + esc(g.name) + "</b><small>" + esc(g.playing || 0) + " Playing</small></a>"; }
  function itemCard(i) { return '<a class="it" href="' + esc(i.url != null ? safeUrl(i.url) : (i.id != null ? "#develop/asset/" + encodeURIComponent(i.id) : "#")) + '">' + img(i.thumbnail, "th") + '<div class="tx"><span class="nm">' + esc(i.name) + "</span>" + (i.price != null ? "<small>" + esc(i.price) + "</small>" : "") + "</div></a>"; }
  window.KandiUI = { esc: esc, img: img, safeUrl: safeUrl, ic: function () { return ""; }, gameCard: gameCard, itemCard: itemCard, toast: toast, S: { q: "" } };

  var TABS = [
    ["experience", "Experience", null, null],
    ["avatar", "Avatar Items", [["T-Shirts", "tshirt", "T-Shirt"], ["Shirts", "shirt", "Shirt"], ["Pants", "pants", "Pants"]], "Upload a shirt or pants and it will show up here."],
    ["development", "Development Items", [["Models", "model", "Model"], ["Decals", "decal", "Decal"], ["Images", "image", "Image"], ["Audio", "audio", "Audio"], ["Meshes", "mesh", "Mesh"], ["Plugins", "plugin", "Plugin"]], "Upload a model, plugin or mesh and it will show up here."]
  ];
  var F = { pub: false, arch: false, sort: "created", dir: "desc", page: 1 }, my = 0;
  var ARROW = '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V5M5 12l7-7 7 7"/></svg>';

  function shell(inner) {
    var chip = user && user.username && user.username !== "Guest" ? '<a class="cu" href="app.html#profile">' + img(user.thumbnail, "av") + "<span>" + esc(user.username) + "</span></a>" : "";
    root.innerHTML = '<header class="ch"><a class="cl" href="#creations"><img src="assets/kandi-silver.png" alt="Project Kandi"><span>Creator</span></a>' + chip + '</header><main class="cw2" id="cmain">' + inner + '</main><footer class="cf"><div class="in"><img src="assets/kandi-silver.png" alt="Project Kandi"><div><nav>' + (C.DISCORD_INVITE && C.DISCORD_INVITE !== "#" ? '<a href="' + esc(safeUrl(C.DISCORD_INVITE)) + '">Discord</a>|' : "") + '<a href="app.html#contact">Contact</a>|<a href="app.html#privacy">Privacy</a>|<a href="app.html#download">Downloads</a>|<a href="app.html#home">Project Kandi</a></nav><p>&copy; 2026 Project Kandi. Not affiliated with the Roblox Corporation.</p></div></div></footer>';
    var A_ = window.KandiAPI, md = A_.mode(), iss = A_.configIssues(), note = md === "demo" ? "<b>TEST MODE</b> No server connection. Data is empty and actions are disabled." : md === "stub" ? "<b>LOCAL TEST API</b> Not PekoraSource." : (iss.length ? "<b>Integration pending:</b> " + esc(iss.join("; ")) + "." : "");
    if (note) root.insertAdjacentHTML("afterbegin", '<div class="mb ' + (md === "live" ? "warn" : "demo") + '">' + note + "</div>");
    return document.getElementById("cmain");
  }

  function creations(tab, sub) {
    var t = TABS.filter(function (x) { return x[0] === tab; })[0] || TABS[0], s = t[2] ? (t[2].filter(function (x) { return x[1] === sub; })[0] || t[2][0]) : null;
    var m = shell('<h1 class="ct">Creations</h1><div class="ctabs">' + TABS.map(function (x) { return '<a href="#creations/' + x[0] + '"' + (x === t ? ' class="on"' : "") + ">" + esc(x[1]) + "</a>"; }).join("") + '<a href="#ads">User Ads</a>' + "</div>" +
      (s ? '<div class="sbar">' + t[2].map(function (x) { return '<a href="#creations/' + t[0] + "/" + x[1] + '"' + (x === s ? ' class="on"' : "") + ">" + esc(x[0]) + "</a>"; }).join("") + "</div>" : "") +
      (!s ? '<div class="flt"><span>Filters:</span><label class="sw"><input type="checkbox" id="fp"' + (F.pub ? " checked" : "") + '><i></i>Show public only</label><label class="sw"><input type="checkbox" id="fa"' + (F.arch ? " checked" : "") + '><i></i>Show Archived</label></div><div class="flt"><span>Sort by:</span><select id="fs" aria-label="Sort by">' + [["Date of Creation", "created"], ["Name", "name"], ["Last Updated", "updated"]].map(function (o) { return '<option value="' + o[1] + '"' + (F.sort === o[1] ? " selected" : "") + ">" + o[0] + "</option>"; }).join("") + '</select><button class="dir' + (F.dir === "asc" ? " up" : "") + '" id="fd" aria-label="Direction">' + ARROW + '</button></div><div class="acts2"><a class="cb2" href="#develop/game/new">Create Experience</a><a class="cb2 o' + (C.DOWNLOADS.studio && C.DOWNLOADS.studio !== "#" ? "" : " dis") + '"' + (C.DOWNLOADS.studio && C.DOWNLOADS.studio !== "#" ? ' href="' + esc(safeUrl(C.DOWNLOADS.studio)) + '"' : ' aria-disabled="true"') + '>Open Studio</a></div>' : "") +
      '<div id="lst"></div><div class="cpg"><button id="pp" aria-label="Previous">&lsaquo;</button><b id="pn">1</b><button id="pnx" aria-label="Next">&rsaquo;</button></div>');
    var lst = m.querySelector("#lst"), pp = m.querySelector("#pp"), nx = m.querySelector("#pnx"), pn = m.querySelector("#pn");
    if (!s) {
      m.querySelector("#fp").onchange = function () { F.pub = this.checked; F.page = 1; load(); }; m.querySelector("#fa").onchange = function () { F.arch = this.checked; F.page = 1; load(); };
      m.querySelector("#fs").onchange = function () { F.sort = this.value; F.page = 1; load(); }; m.querySelector("#fd").onclick = function () { F.dir = F.dir === "asc" ? "desc" : "asc"; this.classList.toggle("up", F.dir === "asc"); F.page = 1; load(); };
    } else F.page = 1;
    pp.onclick = function () { F.page--; load(); }; nx.onclick = function () { F.page++; load(); };
    function empty(h, p, label, href) { lst.innerHTML = '<div class="emp"><h3>' + esc(h) + "</h3><p>" + esc(p) + '</p><a class="cb2" href="' + esc(href) + '">' + esc(label) + "</a></div>"; }
    function load() {
      var id = ++my; lst.innerHTML = '<p class="emp">Loading...</p>'; pn.textContent = F.page; pp.disabled = F.page <= 1; nx.disabled = true;
      var q = { type: s ? s[1] : "game", page: F.page, limit: C.PAGE_SIZE }; if (!s) { q.publicOnly = F.pub; q.archived = F.arch; q.sort = F.sort; q.dir = F.dir; }
      A.call("develop.mine", { query: q }).then(function (r) {
        if (id !== my) return; var l = Array.isArray(r) ? r : (r && r.items) || []; nx.disabled = !(r && r.hasMore);
        if (!l.length) return s ? empty("No " + s[0] + " found", t[3], "Upload " + s[2], "#develop/asset/upload/" + s[1]) : empty("No experiences yet", "Create your first experience to see it here.", "Create an experience", "#develop/game/new");
        lst.innerHTML = '<div class="cgl">' + l.map(function (x) { return s ? itemCard(x) : gameCard(x); }).join("") + "</div>";
      }).catch(function (e) { if (id !== my) return; lst.innerHTML = '<div class="al">' + esc(e && e.message || "Something went wrong.") + "</div>"; });
    }
    load();
  }


  // ---- User Ads: anúncios no estilo antigo do Roblox (faixa "ADVERTISEMENT / Report"). Rodar um anúncio exige lance mínimo de 15 Robux.
  // TODO(backend): ads.mine / ads.create (multipart: name, adType, targetType, targetId, image, bid) ainda não têm caminho definido; a validação real do lance é do servidor.
  var MIN_BID = 15;
  function adsPage() {
    var m = shell('<a class="back" href="#creations">&larr; Creations</a><h1 class="ct">User Ads</h1><div id="al"></div><form id="af" class="ctabs" style="display:block"><h2>Create an ad</h2>' +
      '<label>Name<br><input name="name" required maxlength="60"></label><br><label>Format<br><select name="adType"><option value="banner">Banner (728x90)</option><option value="skyscraper">Skyscraper (160x600)</option><option value="rectangle">Rectangle (300x250)</option></select></label><br>' +
      '<label>Advertise a<br><select name="targetType"><option value="game">Game</option><option value="group">Group</option><option value="asset">Item</option></select></label><br><label>Target ID<br><input name="targetId" required></label><br>' +
      '<label>Image<br><input type="file" name="image" accept="image/*" required></label><div id="pv" style="margin:12px 0"></div><label>Bid in Robux (minimum ' + MIN_BID + ' to run)<br><input type="number" name="bid" min="' + MIN_BID + '" value="' + MIN_BID + '" required></label><p><small>Running an ad costs at least ' + MIN_BID + ' Robux. The server decides if it is charged.</small></p><button class="btn" id="ab">Run ad</button></form>');
    A.call("ads.mine").then(function (r) { var l = Array.isArray(r) ? r : (r && (r.items || r.rows)) || []; m.querySelector("#al").innerHTML = l.length ? l.map(function (a) { return '<p><b>' + esc(a.name) + "</b> " + esc(a.status || "") + (a.bid != null ? " - bid " + esc(a.bid) : "") + "</p>"; }).join("") : '<p class="em">No ads yet.</p>'; }).catch(function (e) { m.querySelector("#al").innerHTML = '<div class="al" role="alert">' + esc(e.message || "Could not load ads.") + "</div>"; });
    var f = m.querySelector("#af"), pv = m.querySelector("#pv");
    f.image.onchange = function () { var x = this.files[0]; pv.innerHTML = ""; if (!x) return; if (!/^image\//.test(x.type)) { toast("Choose an image file.", true); this.value = ""; return; } var u = URL.createObjectURL(x); pv.innerHTML = '<div style="background:#e3e3e3;padding:6px"><img src="' + u + '" alt="Ad preview" style="max-width:100%;display:block;margin:auto"><div style="display:flex;justify-content:space-between;font-size:12px;color:#555;padding:6px 0 0"><span>ADVERTISEMENT</span><span style="color:#0b6dbb">Report</span></div></div>'; };
    f.onsubmit = function (e) { e.preventDefault(); if (+f.bid.value < MIN_BID) { toast("The minimum bid to run an ad is " + MIN_BID + " Robux.", true); return; }
      var fd = new FormData(f), b = f.querySelector("#ab"); b.disabled = true; A.call("ads.create", { body: fd }).then(function (r) { toast((r && r.message) || "Ad submitted."); }).catch(function (x) { toast(x.message || "Could not create the ad.", true); }).then(function () { b.disabled = false; }); };
  }

  function route() {
    var path = (location.hash.slice(1) || "creations").split("?")[0], seg = path.split("/");
    if (seg[0] === "creations") return creations(seg[1], seg[2]);
    if (seg[0] === "ads") return adsPage();
    var m = window.KandiPages.match(path);
    if (!m || !/^(develop\/|internal\/create-place)/.test(path)) { location.replace("app.html#" + path); return; }
    var host = shell('<a class="back" href="#creations">&larr; Creations</a><div id="pg"></div>');
    window.KandiPages.mount(host.querySelector("#pg"), m, user); document.title = m.route.title + " - Project Kandi Creator";
  }
  window.addEventListener("hashchange", function () { route(); window.scrollTo(0, 0); });
  window.addEventListener("kandi:unauthorized", function () { location.href = C.LANDING_URL; });
  A.me().then(function (u) { user = u; }).catch(function (e) { user = null; if (e && e.status !== 401) { var m = shell('<h1 class="ct">Creator Hub</h1><div class="al" role="alert">' + esc(e.message || "Could not load your account.") + '</div><p><a class="cb2" href="">Retry</a></p>'); return "err"; } }).then(function (r) {
    if (r === "err") return;
    if (!user) { try { sessionStorage.setItem("kandi_return", "creator.html"); } catch (x) {} location.href = C.LANDING_URL; return; }
    route();
  });
})();
