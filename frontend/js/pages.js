// Project Kandi - renderizador genérico. Lê os esquemas de js/routes.js e chama KandiAPI.call(nome).
// Blocos: list, form, detail, tabs, static, actions, chat, trade. Nada aqui inventa dados: sem resposta = estado vazio ou erro visível.
(function () {
  "use strict";
  var C = window.KANDI_CONFIG, A = window.KandiAPI, U, esc; // U (KandiUI) é definido pelo app.js e ligado em mount()
  var ROUTES = window.KANDI_ROUTES.map(function (r) { r.segs = r.id.split("/"); return r; });

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function tpl(s, a, b) { return String(s == null ? "" : s).replace(/\{(\w+)\}/g, function (m, k) { var v = a && a[k] != null ? a[k] : b && b[k]; return v == null ? "" : encodeURIComponent(v); }); }
  function list(r) { return Array.isArray(r) ? r : (r && (r.items || r.rows || r.data)) || []; }
  function err(e) { return e && e.message ? e.message : "Something went wrong."; }
  // redirecionamento pedido pelo servidor: só http(s) ou caminho relativo (nunca javascript:)
  function go(u) { var x = U && U.safeUrl ? U.safeUrl(u) : ""; if (x) location.href = x; else U.toast("The server sent an invalid redirect.", true); }
  // erro de campo: aceita o nome exato ou com outra capitalização (ex.: Username -> username)
  function fieldErr(f, k) { var all = f.querySelectorAll(".fe[data-e]"); for (var i = 0; i < all.length; i++) if (all[i].getAttribute("data-e").toLowerCase() === String(k).toLowerCase()) return all[i]; return null; }
  function alertBox(msg, ok) { return el("div", "al" + (ok ? " ok" : ""), esc(msg)); }

  // ---------- roteamento ----------
  function match(path) {
    var p = path.split("/");
    for (var i = 0; i < ROUTES.length; i++) {
      var r = ROUTES[i]; if (r.segs.length !== p.length) continue;
      var params = {}, ok = true;
      for (var j = 0; j < p.length; j++) { if (r.segs[j][0] === ":") params[r.segs[j].slice(1)] = decodeURIComponent(p[j]); else if (r.segs[j] !== p[j]) { ok = false; break; } }
      if (ok) return { route: r, params: params };
    }
    return null;
  }
  // ATENÇÃO: isto só esconde a UI. Permissões reais são sempre decididas pelo backend (user.permissions vem do servidor).
  function canSee(r, user) { return !r.perm || !!(user && user.permissions && user.permissions.indexOf(r.perm) >= 0); }

  // ---------- ações (botões) ----------
  function act(a, params, host, done) {
    if (a.to) { location.hash = tpl(a.to, host.data, params).replace(/%23/g, "#"); return; }
    if (a.modal && window.KandiModal && window.KandiModal[a.modal]) {   // janelas (Buy Item / Play Game); a chamada real continua sendo A.call
      return window.KandiModal[a.modal]((host && host.data) || {}, function () { return A.call(a.call, { params: params }).then(function (res) { if (res && res.redirect) go(res.redirect); if (done) done(res); return res; }); });
    }
    if (a.confirm && !window.confirm(a.confirm)) return;
    var body = a.body ? JSON.parse(JSON.stringify(a.body)) : undefined;
    if (a.prompt) { var v = window.prompt(a.prompt); if (v == null || !String(v).trim()) return; body = body || {}; body[a.promptKey || "name"] = String(v).trim(); }
    A.call(a.call, { params: params, body: body }).then(function (res) {
      U.toast((res && res.message) || "Done.");
      if (res && res.redirect) { go(res.redirect); return; }
      if (done) done(res);
    }).catch(function (e) { U.toast(err(e), true); });
  }
  function actions(b, ctx, host, data) {
    var box = el("div", "acts");
    (b.actions || []).forEach(function (a) {
      var btn = el("a", "btn s", esc(a.label)); btn.setAttribute("role", "button"); btn.tabIndex = 0;
      btn.onclick = function () { act(a, ctx.params, { data: data }, function () { if (ctx.reload) ctx.reload(); }); };
      box.appendChild(btn);
    });
    return box;
  }

  // ---------- list ----------
  function row(it, b, ctx, tab, reload) {
    if (b.item === "game") return U.gameCard(it);
    if (b.item === "item") { var h = U.safeUrl(it.href) || (b.hrefTpl ? tpl(b.hrefTpl, it, ctx.params) : null); return U.itemCard(h ? Object.assign({}, it, { url: h }) : it); }
    if (b.item === "thumb") return '<div class="th2">' + U.img(it.url || it.thumbnail, "") + "</div>";
    var href = U.safeUrl(it.href) || (b.hrefTpl ? tpl(b.hrefTpl, it, ctx.params) : ""), tag = href ? "a" : "div";
    return '<div class="rw" data-id="' + esc(it.id == null ? "" : it.id) + '"><' + tag + ' class="rl"' + (href ? ' href="' + esc(href) + '"' : "") + ">" + U.img(it.thumbnail, "rt") + "<div><b>" + esc(it.title || it.name || "") + "</b>" + (it.subtitle ? "<small>" + esc(it.subtitle) + "</small>" : "") + "</div>" + (it.meta ? '<span class="mt">' + esc(it.meta) + "</span>" : "") + "</" + tag + ">" +
      (b.rowActions || []).filter(function (a) { return !a.onTabs || a.onTabs.indexOf(tab) >= 0; }).map(function (a) { return '<button class="btn s" data-a="' + b.rowActions.indexOf(a) + '">' + esc(a.label) + "</button>"; }).join("") + "</div>";
  }
  function listBlock(b, ctx, host) {
    var st = { q: b.search ? (U.S.q || "") : "", page: 1, tab: b.tabs ? b.tabs[0][1] : null, f: {} }, my = 0;
    if (b.search) U.S.q = "";
    var box = el("div", "blk"), bar = el("div", "bar"), out = el("div", b.item === "game" || b.item === "item" || b.item === "thumb" ? "cg" : "rows"), msg = el("p", "em"), more = el("button", "btn", "Load more");
    more.hidden = true;
    if (b.actions) bar.appendChild(actions(b, ctx, {}, null));
    if (b.search) {
      var f = el("form", "sf", '<input type="text" placeholder="Search" value="' + esc(st.q) + '" aria-label="Search"><button class="btn">Search</button>');
      f.onsubmit = function (e) { e.preventDefault(); st.q = f.firstChild.value.trim(); load(true); }; bar.appendChild(f);
    }
    (b.filters || []).forEach(function (fl) {
      var s = el("select", "sel", fl.options.map(function (o) { return '<option value="' + esc(o[1]) + '">' + esc(o[0]) + "</option>"; }).join(""));
      s.setAttribute("aria-label", fl.label); s.onchange = function () { st.f[fl.name] = s.value; load(true); }; bar.appendChild(s);
    });
    if (b.tabs) {
      var tb = el("div", "tabs", b.tabs.map(function (t, i) { return "<a" + (i ? "" : ' class="on"') + ' data-t="' + esc(t[1]) + '">' + esc(t[0]) + "</a>"; }).join(""));
      tb.onclick = function (e) { var a = e.target.closest("a[data-t]"); if (!a) return; st.tab = a.dataset.t; [].forEach.call(tb.children, function (x) { x.classList.toggle("on", x === a); }); load(true); };
      box.appendChild(tb);
    }
    box.appendChild(bar); box.appendChild(msg); box.appendChild(out); box.appendChild(more);
    function load(reset) {
      var id = ++my; if (reset) { st.page = 1; out.innerHTML = ""; } more.hidden = true; msg.className = "em"; msg.textContent = "Loading...";
      var q = Object.assign({}, b.query, { q: st.q, page: st.page, limit: C.PAGE_SIZE }, st.f); if (b.tabParam) q[b.tabParam] = st.tab;
      A.call(b.load, { params: ctx.params, query: q }).then(function (r) {
        if (id !== my) return; var items = list(r); out.insertAdjacentHTML("beforeend", items.map(function (it) { return row(it, b, ctx, st.tab); }).join(""));
        out._items = (out._items || []).slice(0, reset ? 0 : undefined).concat(items);
        msg.textContent = out.children.length ? "" : (b.empty || "Nothing here yet."); more.hidden = !(r && r.hasMore);
      }).catch(function (e) { if (id !== my) return; msg.className = "al"; msg.textContent = err(e); });
    }
    more.onclick = function () { st.page++; load(false); };
    out.onclick = function (e) {
      var btn = e.target.closest("button[data-a]"); if (!btn) return;
      var a = b.rowActions[+btn.dataset.a], rid = btn.closest(".rw").dataset.id;
      act(a, Object.assign({}, ctx.params, { rowId: rid }), {}, function () { load(true); });
    };
    host.appendChild(box); load(true);
    var prev = ctx.reload; ctx.reload = function () { load(true); if (prev) prev(); };
  }

  // ---------- form ----------
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function opts(a, sel) { return a.map(function (o) { return '<option value="' + esc(o[1]) + '"' + (String(o[1]) === String(sel) ? " selected" : "") + ">" + esc(o[0]) + "</option>"; }).join(""); }
  function countries() {
    try { var dn = new Intl.DisplayNames(["en"], { type: "region" }), out = [], A_ = 65; for (var i = 0; i < 26; i++) for (var j = 0; j < 26; j++) { var c = String.fromCharCode(A_ + i, A_ + j), n = dn.of(c); if (n && n !== c && !/Unknown|Region/.test(n)) out.push([n, c]); } return out.sort(function (a, b) { return a[0] < b[0] ? -1 : 1; }); } catch (e) { return []; }
  }
  var MALE = '<svg viewBox="0 0 24 24" width="30" height="30"><circle cx="12" cy="5" r="3.2"/><path d="M6 10h12v6h-2v6h-3v-5h-2v5H8v-6H6z"/></svg>', FEMALE = '<svg viewBox="0 0 24 24" width="30" height="30"><circle cx="12" cy="5" r="3.2"/><path d="M12 10c3 0 4 2 5 6h-3v6h-4v-6H7c1-4 2-6 5-6z"/></svg>';
  function field(f, ctx) {
    var id = "f_" + f.name + Math.random().toString(36).slice(2, 6), v = f.fromParam ? ctx.params[f.fromParam] || "" : "", inp, ph = f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : "";
    if (f.type === "textarea") inp = '<textarea id="' + id + '" name="' + f.name + '" rows="4"' + ph + (f.maxlength ? ' maxlength="' + f.maxlength + '"' : "") + ">" + esc(v) + "</textarea>";
    else if (f.type === "select") inp = '<select id="' + id + '" name="' + f.name + '">' + opts(f.options, v) + "</select>";
    else if (f.type === "country") inp = '<select id="' + id + '" name="' + f.name + '"><option value="">Choose a Country</option>' + opts(countries(), "") + "</select>";
    else if (f.type === "birthday") {
      var d = [], y = [], yr = new Date().getFullYear(); for (var i = 1; i <= 31; i++) d.push([i, i]); for (var k = yr; k >= yr - 100; k--) y.push([k, k]);
      return '<div class="fd seg"><span class="sl2">Birthday</span><select name="' + f.name + '_m" aria-label="Month">' + opts(MONTHS.map(function (m, i) { return [m, i + 1]; }), "") + '</select><select name="' + f.name + '_d" aria-label="Day">' + opts(d, "") + '</select><select name="' + f.name + '_y" aria-label="Year"><option value=""></option>' + opts(y, "") + '</select><small class="fe" data-e="' + f.name + '"></small></div>';
    } else if (f.type === "gender") return '<div class="fd seg g2"><span class="sl2">Gender</span><label title="Male"><input type="radio" name="' + f.name + '" value="male">' + MALE + '</label><label title="Female"><input type="radio" name="' + f.name + '" value="female">' + FEMALE + '</label><small class="fe" data-e="' + f.name + '"></small></div>';
    else if (f.type === "checkbox") inp = '<input id="' + id + '" type="checkbox" name="' + f.name + '">';
    else inp = '<input id="' + id + '" type="' + f.type + '" name="' + f.name + '" value="' + esc(v) + '"' + ph + (f.step ? ' step="' + f.step + '"' : "") + (f.min != null ? ' min="' + f.min + '"' : "") + (f.max != null ? ' max="' + f.max + '"' : "") + (f.accept ? ' accept="' + esc(f.accept) + '"' : "") + (f.type === "password" ? ' autocomplete="off"' : "") + ">";
    return '<div class="fd' + (f.type === "checkbox" ? " ck" : "") + '">' + (f.bare ? "" : '<label for="' + id + '">' + esc(f.label) + (f.required ? " *" : "") + "</label>") + inp + '<small class="fe" data-e="' + f.name + '"></small></div>';
  }
  function readField(x, f) {
    var i = f.elements[x.name];
    if (x.type === "checkbox") return i.checked;
    if (x.type === "file") return i.files[0];
    if (x.type === "gender") { var c = f.querySelector('input[name="' + x.name + '"]:checked'); return c ? c.value : ""; }
    if (x.type === "birthday") { var m = f.elements[x.name + "_m"].value, d = f.elements[x.name + "_d"].value, y = f.elements[x.name + "_y"].value; return y ? y + "-" + ("0" + m).slice(-2) + "-" + ("0" + d).slice(-2) : ""; }
    return i.value.trim();
  }
  function putField(x, f, val) {
    if (val == null || x.type === "file") return;
    if (x.type === "gender") { var c = f.querySelector('input[name="' + x.name + '"][value="' + val + '"]'); if (c) c.checked = true; return; }
    if (x.type === "birthday") { var p = String(val).slice(0, 10).split("-"); if (p.length === 3) { f.elements[x.name + "_y"].value = +p[0]; f.elements[x.name + "_m"].value = +p[1]; f.elements[x.name + "_d"].value = +p[2]; } return; }
    var i = f.elements[x.name]; if (!i) return; if (x.type === "checkbox") i.checked = !!val; else i.value = val;
  }
  function formBlock(b, ctx, host) {
    var f = el("form", "blk fm" + (b.wide ? " wide" : ""), b.fields.map(function (x) { return field(x, ctx); }).join("") + (b.note ? '<p class="nt">' + esc(b.note) + "</p>" : "") + '<div class="fr"></div><div class="fa"><button class="btn ' + (b.btn || "g") + '">' + esc(b.label || "Save") + "</button></div>");
    f.noValidate = true; var res = f.querySelector(".fr");
    if (b.load) A.call(b.load, { params: ctx.params }).then(function (d) { if (d) b.fields.forEach(function (x) { putField(x, f, d[x.name]); }); }).catch(function (e) { res.innerHTML = ""; res.appendChild(alertBox(err(e))); });
    f.onsubmit = function (e) {
      e.preventDefault(); res.innerHTML = ""; [].forEach.call(f.querySelectorAll(".fe"), function (s) { s.textContent = ""; });
      var body = {}, fd = new FormData(), hasFile = false, bad = false;
      b.fields.forEach(function (x) {
        var v = readField(x, f);
        function fail(m) { f.querySelector('[data-e="' + x.name + '"]').textContent = m; bad = true; }
        if (x.required && (v === "" || v == null)) return fail(x.label + " is required.");
        if (x.matches && v !== f.elements[x.matches].value) return fail("Values do not match.");
        if (x.type === "file") { if (v) { hasFile = true; fd.append(x.name, v); } return; }
        if (x.type === "number" && v !== "") v = Number(v);
        body[x.name] = v; fd.append(x.name, v);
      });
      if (bad) return; if (b.confirm && !window.confirm(b.confirm)) return;
      var btn = f.querySelector("button.btn"); btn.disabled = true;
      A.call(b.submit, { params: ctx.params, body: hasFile ? fd : body }).then(function (r) {
        res.appendChild(alertBox((r && r.message) || b.ok || "Saved.", true));
        if (r && r.redirect) { go(r.redirect); return; }
        if (b.redirect) { setTimeout(function () { location.hash = tpl(b.redirect, r, ctx.params).replace(/%23/g, "#"); }, 400); return; }
        if (b.reload && ctx.reload) { f.reset(); ctx.reload(); }
      }).catch(function (e) {
        res.appendChild(alertBox(err(e)));
        Object.keys(e.fields || {}).forEach(function (k) { var s = fieldErr(f, k); if (s) s.textContent = e.fields[k]; });
      }).then(function () { btn.disabled = false; });
    };
    host.appendChild(f);
  }

  // ---------- tabs / detail ----------
  function tabsBlock(tabs, ctx, host, cls) {
    var bar = el("div", cls || "tabs"), panes = tabs.map(function (t, i) { var p = el("div", "pane"); p.hidden = !!i; p._t = t; return p; });
    tabs.forEach(function (t, i) { var a = el("a", i ? "" : "on", esc(t.label)); a.onclick = function () { [].forEach.call(bar.children, function (x) { x.classList.toggle("on", x === a); }); panes.forEach(function (p, j) { p.hidden = j !== i; if (j === i) fill(p); }); }; bar.appendChild(a); });
    function fill(p) { if (p._done) return; p._done = 1; p._t.blocks.forEach(function (bl) { render(bl, ctx, p); }); }
    host.appendChild(bar); panes.forEach(function (p) { host.appendChild(p); }); fill(panes[0]);
  }
  function detailBlock(b, ctx, host) {
    var head = el("div", "dh", '<p class="em">Loading...</p>'); host.appendChild(head);
    ctx.reload = ctx.reload || null;
    A.call(b.load, { params: ctx.params }).then(function (d) {
      d = d || {}; ctx.data = d; var st = (d.stats || []).map(function (s) { return "<span><b>" + esc(s[1]) + "</b> " + esc(s[0]) + "</span>"; }).join("");
      head.innerHTML = (d.title || d.name ? U.img(d.thumbnail, "dt") + "<div><h1>" + esc(d.title || d.name) + "</h1>" + (d.subtitle ? "<p>" + esc(d.subtitle) + "</p>" : "") + (st ? '<div class="stt">' + st + "</div>" : "") + (d.description ? '<p class="ds">' + esc(d.description) + "</p>" : "") + "</div>" : '<p class="em">Nothing to show.</p>');
      if (b.actions && b.actions.length) host.appendChild(actions(b, ctx, host, d));
      (d.sections || []).forEach(function (s) { var sx = el("div", "blk", "<h3>" + esc(s.title || "") + "</h3>"); var r = el("div", "rows", list(s).map(function (it) { return row(it, { item: "row" }, ctx); }).join("")); sx.appendChild(r); host.appendChild(sx); });
      if (b.tabs.length) tabsBlock(b.tabs, ctx, host);
    }).catch(function (e) { head.innerHTML = ""; head.appendChild(alertBox(err(e))); });
  }

  // ---------- estático / ações / chat / trade ----------
  var ERR = { 401: "Please log in to continue.", 403: "You do not have access to this page.", 404: "Page not found.", 500: "Something went wrong on our side." };
  function staticBlock(b, ctx, host) {
    if (b.error) { var c = ctx.params.code; host.appendChild(el("div", "blk", '<h1 class="pt">' + esc(c) + "</h1><p class=\"em\">" + esc(ERR[c] || "Unexpected error.") + '</p><p class="em"><a href="#home">Back to Home</a></p>')); return; }
    if (b.pending) { host.appendChild(el("div", "al", "Not connected yet. " + esc(b.pending))); return; }
    host.appendChild(el("div", "blk", (b.title ? "<h2>" + esc(b.title) + "</h2>" : "") + (b.html || "") + (b.links ? '<div class="tl">' + b.links.map(function (l) { return '<a class="tile" href="' + esc(l[1]) + '"><b>' + esc(l[0]) + "</b>" + (l[2] ? "<small>" + esc(l[2]) + "</small>" : "") + "</a>"; }).join("") + "</div>" : "")));
  }
  function chatBlock(b, ctx, host) {
    var box = el("div", "blk chat", '<div class="cm"></div><form class="sf"><input type="text" placeholder="Message" aria-label="Message"><button class="btn g">Send</button></form><p class="em"><a class="rf">Refresh</a></p>'), cm = box.firstChild;
    function load() { A.call(b.load, { params: ctx.params }).then(function (r) { var l = list(r); cm.innerHTML = l.length ? l.map(function (m) { return "<p><b>" + esc(m.author) + "</b> " + esc(m.text) + "<small>" + esc(m.date || "") + "</small></p>"; }).join("") : '<p class="em">No messages yet.</p>'; cm.scrollTop = cm.scrollHeight; }).catch(function (e) { cm.innerHTML = ""; cm.appendChild(alertBox(err(e))); }); }
    box.querySelector("form").onsubmit = function (e) { e.preventDefault(); var i = this.firstChild, t = i.value.trim(); if (!t) return; A.call(b.submit, { params: ctx.params, body: { text: t } }).then(function () { i.value = ""; load(); }).catch(function (x) { U.toast(err(x), true); }); };
    box.querySelector(".rf").onclick = load; host.appendChild(box); load();
  }
  // paginação "< Page 1 of N >"
  function pager(onPage) {
    var box = el("div", "pgr", '<button class="pb" aria-label="Previous">&lt;</button><span></span><button class="pb" aria-label="Next">&gt;</button>'), st = { page: 1, pages: 0, more: false }, bs = box.querySelectorAll("button"), sp = box.querySelector("span");
    function draw() { sp.textContent = "Page " + st.page + (st.pages ? " of " + st.pages : ""); bs[0].disabled = st.page <= 1; bs[1].disabled = st.pages ? st.page >= st.pages : !st.more; }
    bs[0].onclick = function () { st.page--; draw(); onPage(st.page); }; bs[1].onclick = function () { st.page++; draw(); onPage(st.page); };
    draw(); return { box: box, st: st, set: function (r) { st.pages = (r && r.totalPages) || 0; st.more = !!(r && r.hasMore); draw(); }, reset: function () { st.page = 1; st.pages = 0; st.more = false; draw(); } };
  }
  function money(n) { return '<img class="pi" src="' + esc(C.ASSETS.robux) + '" alt="R$"> ' + esc(n); }

  function trade(b, ctx, host) {
    var max = b.maxItems || 4, sel = { mine: [], theirs: [] }, box = el("div", "trd"), names = [];
    box.innerHTML = '<a class="back" href="#trade">&larr; Back to Trades List</a><h1 class="ht">Trade with <span class="pn">...</span></h1>' +
      ["mine", "theirs"].map(function (s) { return '<div class="inv" data-s="' + s + '"><div class="ih"><h2>' + (s === "mine" ? "Your Inventory" : '<span class="pn"></span>\'s Inventory') + '</h2><select class="sel">' + opts(b.categories, "") + '</select></div><div class="cg"></div><p class="em"></p><div class="pg"></div></div>'; }).join("") +
      ["mine", "theirs"].map(function (s) { return '<div class="off" data-o="' + s + '"><h2>' + (s === "mine" ? "Your Offer" : "Your Request") + '</h2><div class="slots"></div><label class="rb">' + money("") + '<input type="number" min="0" value="" placeholder="Plus Robux amount"></label><p class="tv">Total Value: <b></b></p></div>'; }).join("") +
      '<div class="fr"></div><button class="btn k mk">Make Offer</button>';
    var res = box.querySelector(".fr");
    function total(s) { var n = sel[s].reduce(function (a, it) { return a + (+(it.value != null ? it.value : it.price) || 0); }, 0); return n + (+box.querySelector('[data-o="' + s + '"] input').value || 0); }
    function slots(s) {
      var o = box.querySelector('[data-o="' + s + '"]'), h = ""; for (var i = 0; i < max; i++) { var it = sel[s][i]; h += '<div class="slot' + (it ? " f" : i === sel[s].length ? " d" : "") + '">' + (it ? U.img(it.thumbnail, "") + "<small>" + esc(it.name) + "</small>" : "") + "</div>"; }
      o.querySelector(".slots").innerHTML = h; o.querySelector(".tv b").innerHTML = money(total(s));
    }
    function inv(s, call, params) {
      var p = box.querySelector('[data-s="' + s + '"]'), g = p.querySelector(".cg"), em = p.querySelector(".em"), cat = p.querySelector("select"), my = 0, pg = pager(function () { load(); });
      p.querySelector(".pg").appendChild(pg.box);
      function load() {
        var id = ++my; g.innerHTML = ""; em.className = "em"; em.textContent = "Loading...";
        A.call(call, { params: params(), query: { category: cat.value, page: pg.st.page, limit: C.PAGE_SIZE } }).then(function (r) {
          if (id !== my) return; var l = list(r); em.textContent = l.length ? "" : (s === "mine" ? "No collectible items found in your inventory." : "No collectible items found."); pg.set(r);
          l.forEach(function (it) {
            var d = el("div", "sl", U.itemCard(Object.assign({}, it, { url: "" })) + '<i class="ck"></i>'), on = function () { return sel[s].some(function (x) { return x.id === it.id; }); };
            d.classList.toggle("on", on());
            d.onclick = function () { if (on()) sel[s] = sel[s].filter(function (x) { return x.id !== it.id; }); else if (sel[s].length >= max) { U.toast("You can offer up to " + max + " items.", true); return; } else sel[s].push(it); d.classList.toggle("on", on()); slots(s); };
            g.appendChild(d);
          });
        }).catch(function (e) { if (id !== my) return; em.className = "al"; em.textContent = err(e); });
      }
      cat.onchange = function () { pg.reset(); load(); }; return { load: load };
    }
    var mine = inv("mine", b.mine, function () { return {}; }), theirs;
    function startTheirs(uid) {
      theirs = inv("theirs", b.theirs, function () { return { id: uid }; }); theirs.load();
      if (b.partner) A.call(b.partner, { params: { id: uid } }).then(function (u) { [].forEach.call(box.querySelectorAll(".pn"), function (n) { n.textContent = (u && (u.name || u.title || u.username)) || "user"; }); }).catch(function () { [].forEach.call(box.querySelectorAll(".pn"), function (n) { n.textContent = "user"; }); });
    }
    mine.load(); slots("mine"); slots("theirs");
    if (b.partnerFrom) A.call(b.partnerFrom, { params: ctx.params }).then(function (t) { if (!t || t.partnerId == null) throw { message: "Trade partner not found." }; startTheirs(t.partnerId); }).catch(function (e) { res.appendChild(alertBox(err(e))); });
    else startTheirs(ctx.params.userId);
    ["mine", "theirs"].forEach(function (s) { box.querySelector('[data-o="' + s + '"] input').oninput = function () { slots(s); }; });
    box.querySelector(".mk").onclick = function () {
      res.innerHTML = ""; var body = { offerItems: sel.mine.map(function (x) { return x.id; }), requestItems: sel.theirs.map(function (x) { return x.id; }), offerRobux: +box.querySelector('[data-o="mine"] input').value || 0, requestRobux: +box.querySelector('[data-o="theirs"] input').value || 0 };
      if (!body.offerItems.length && !body.requestItems.length && !body.offerRobux && !body.requestRobux) { res.appendChild(alertBox("Select at least one item or Robux amount.")); return; }
      A.call(b.submit, { params: ctx.params, body: body }).then(function () { location.hash = b.redirect; }).catch(function (e) { res.appendChild(alertBox(err(e))); });
    };
    host.appendChild(box);
  }

  // ---------- games: seletor + carrosséis ----------
  function sectionsBlock(b, ctx, host) {
    var q = U.S.q || ""; U.S.q = "";
    var bar = el("div", "bar", '<select class="sel bsel" aria-label="Sort">' + opts(b.select, "") + "</select>"), wrap = el("div"); host.appendChild(bar); host.appendChild(wrap);
    function draw(cur) {
      wrap.innerHTML = ""; (cur ? b.sections.filter(function (s) { return s[1] === cur; }) : b.sections).forEach(function (s) {
        var sc = el("section", "", '<div class="sh"><h2>' + esc(s[0]) + '</h2></div><div class="cw"><button class="ar" aria-label="Previous">&lsaquo;</button><div class="strip"><p class="em">Loading...</p></div><button class="ar" aria-label="Next">&rsaquo;</button></div>'), st = sc.querySelector(".strip");
        [].forEach.call(sc.querySelectorAll(".ar"), function (a, i) { a.onclick = function () { st.scrollBy({ left: i ? 240 : -240 }); }; });
        A.call(b.load, { params: ctx.params, query: { sort: s[1], q: q, limit: C.PAGE_SIZE } }).then(function (r) { var l = list(r); st.innerHTML = l.length ? l.map(function (it) { return row(it, b, ctx); }).join("") : '<p class="em">Nothing here yet.</p>'; }).catch(function (e) { st.innerHTML = ""; st.appendChild(alertBox(err(e))); });
        wrap.appendChild(sc);
      });
    }
    bar.firstChild.onchange = function () { draw(this.value); }; draw("");
  }

  // ---------- inventário por categoria ----------
  function catgridBlock(b, ctx, host) {
    var u = ctx.user, name = u && u.username ? u.username + "'s " : "My ", cat = b.categories[0], my = 0, shown = 0;
    var box = el("div", "cgb", '<h1 class="ht">' + esc(name) + esc(ctx.title) + '</h1><div class="cat"><label>CATEGORY</label><select class="sel">' + opts(b.categories.map(function (c) { return [c[0], c[1]]; }), "") + '</select></div><div class="chd"><div><h2 class="cn"></h2><small class="cr"></small></div><div class="ex"><span class="et"></span><a class="btn g" href="' + esc(b.getMore) + '">Get More</a></div></div><div class="cg"></div><p class="em"></p><div class="pg"></div>'),
      g = box.querySelector(".cg"), em = box.querySelector(".em"), pg = pager(function () { load(); });
    box.querySelector(".pg").appendChild(pg.box);
    function load() {
      var id = ++my; g.innerHTML = ""; em.className = "em"; em.textContent = "Loading...";
      box.querySelector(".cn").textContent = cat[0]; box.querySelector(".et").textContent = "Explore the catalog to find more " + cat[0].toLowerCase() + "!"; box.querySelector(".cr").textContent = "";
      A.call(b.load, { params: ctx.params, query: { category: cat[1], page: pg.st.page, limit: C.PAGE_SIZE } }).then(function (r) {
        if (id !== my) return; var l = list(r); em.textContent = l.length ? "" : "Nothing here yet."; pg.set(r);
        g.innerHTML = l.map(function (it) { return row(it, b, ctx); }).join(""); var from = (pg.st.page - 1) * C.PAGE_SIZE;
        box.querySelector(".cr").textContent = l.length ? "Showing " + (from + 1) + " - " + (from + l.length) + " of " + ((r && r.total) || from + l.length) + " results" : "";
      }).catch(function (e) { if (id !== my) return; em.className = "al"; em.textContent = err(e); });
    }
    box.querySelector("select").onchange = function () { cat = b.categories.filter(function (c) { return c[1] === this.value; }.bind(this))[0]; pg.reset(); load(); };
    host.appendChild(box); load();
  }

  // ---------- resgatar códigos ----------
  function promoBlock(b, ctx, host) {
    var box = el("div", "promo", '<h1 class="ht">Redeem Project Kandi Codes</h1><p class="lead">Enter your gift card, virtual item, or promo code below.</p><form novalidate><label for="pc">Code</label><input id="pc" type="text" autocomplete="off" autocapitalize="characters" placeholder="ENTER CODE"><small class="fe"></small><label class="cb"><input type="checkbox"><span>By checking this box and clicking Redeem, I acknowledge that I am at least 18 years of age (or the age of majority where I live), or that I am a parent or legal guardian of a minor who is authorized to redeem this product and will be the account holder of the associated Project Kandi account. I agree to the <a href="#terms">Terms of Use</a>, including arbitration, the <a href="#terms">Gift Card Terms &amp; Conditions</a>, and the <a href="#privacy">Privacy Policy</a>.</span></label><div class="fr"></div><button class="btn rd" disabled>Redeem</button></form><h3>Additional Information</h3><p><a href="#help">How to Redeem Gift Cards (Video)</a></p><p><a href="#help">More Help on Gift Cards</a></p><p><a href="#help">How to Redeem Virtual Item Codes</a></p><p><a href="#help">How to Redeem Promo Codes</a></p><img class="gc2" src="assets/giftcards.png" alt="">'),
      f = box.querySelector("form"), code = f.querySelector("#pc"), ck = f.querySelector(".cb input"), btn = f.querySelector(".rd"), fe = f.querySelector(".fe"), res = f.querySelector(".fr");
    function sync() { btn.disabled = !(ck.checked && code.value.trim()); }
    code.oninput = ck.onchange = function () { fe.textContent = ""; sync(); };
    f.onsubmit = function (e) {
      e.preventDefault(); res.innerHTML = ""; var v = code.value.trim(); if (!v) { fe.textContent = "Please enter a code."; return; } if (!ck.checked) return;
      btn.disabled = true;
      A.call(b.submit, { params: ctx.params, body: { code: v } }).then(function (r) {
        var m = (r && r.message) || "Code redeemed.", rw = r && r.reward ? " " + (typeof r.reward === "string" ? r.reward : JSON.stringify(r.reward)) : ""; res.appendChild(alertBox(m + rw, true)); code.value = ""; ck.checked = false;
      }).catch(function (e) { res.appendChild(alertBox(err(e))); }).then(sync);
    };
    host.appendChild(box);
  }

  // ---------- configurações: abas laterais, linhas editáveis, tema ----------
  var PEN = '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4H5a2 2 0 00-2 2v13a2 2 0 002 2h13a2 2 0 002-2v-7"/><path d="M17.5 3.5l3 3L11 16l-4 1 1-4z"/></svg>', OK = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l5 5L20 6"/></svg>';
  function settingsBlock(b, ctx, host) {
    host.appendChild(el("h1", "ht", esc(ctx.title))); var wrap = el("div", "stw"); host.appendChild(wrap);
    tabsBlock(b.tabs.map(function (t) { return { label: t.label, blocks: t.blocks }; }), ctx, wrap, "stabs");
  }
  function rowsBlock(b, ctx, host) {
    var box = el("div", "blk kv"), data = {}; host.appendChild(box);
    function draw() {
      box.innerHTML = "";
      b.rows.forEach(function (r) {
        var val = r.mask ? "********" : (data[r.key] != null ? data[r.key] : ""), line = el("div", "kr", '<span class="kl">' + esc(r.label) + ':</span><span class="kvv">' + esc(val) + (r.verified && data[r.verified] ? '<em class="vf">' + OK + " Verified</em>" : "") + '</span><button type="button" class="ed" aria-label="Edit ' + esc(r.label) + '">' + PEN + "</button>"), panel = null;
        line.querySelector(".ed").onclick = function () {
          if (panel) { panel.remove(); panel = null; return; }
          panel = el("div", "ep"); var c2 = Object.assign({}, ctx, { reload: function () { load(); } });
          formBlock({ fields: r.fields, submit: r.edit, label: "Save", reload: true, btn: "o", wide: true }, c2, panel); line.after(panel);
        };
        box.appendChild(line);
      });
    }
    function load() { A.call(b.load, { params: ctx.params }).then(function (d) { data = d || {}; draw(); }).catch(function (e) { box.innerHTML = ""; box.appendChild(alertBox(err(e))); }); }
    draw(); load();
  }
  function themeBlock(b, ctx, host) {
    var cur = "system"; try { cur = localStorage.getItem("kandi_theme") || "system"; } catch (e) {}
    var box = el("div", "blk fm wide", '<div class="fd"><label>Theme</label><select>' + opts([["Match my device", "system"], ["Light", "light"], ["Dark", "dark"]], cur) + "</select></div>");
    box.querySelector("select").onchange = function () { try { localStorage.setItem("kandi_theme", this.value); } catch (e) {} if (this.value === "system") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", this.value); };
    host.appendChild(box);
  }

  var KINDS = { application: function (b, c, h) { window.KandiApplication.render(b, c, h); }, heading: function (b, c, h) { h.appendChild(el("h2", "sh2", esc(b.text))); }, sections: sectionsBlock, catgrid: catgridBlock, promo: promoBlock, settings: settingsBlock, rows: rowsBlock, theme: themeBlock, list: listBlock, form: formBlock, detail: detailBlock, static: staticBlock, chat: chatBlock, trade: trade,
    tabs: function (b, c, h) { tabsBlock(b.tabs, c, h); }, actions: function (b, c, h) { h.appendChild(actions(b, c, h, c.data)); } };
  function render(b, ctx, host) { var f = KINDS[b.kind]; if (f) f(b, ctx, host); else host.appendChild(alertBox("Unknown block: " + b.kind)); }

  window.KandiPages = {
    match: match, canSee: canSee,
    isPublic: function (path) { var m = match(path); return !!(m && m.route.public); },
    mount: function (host, m, user) {
      U = window.KandiUI; esc = U.esc;
      var p = Object.assign({}, m.params); if (m.route.selfId && user && user.id != null) p.id = user.id;
      var own = { sections: 1, catgrid: 1, promo: 1, settings: 1, trade: 1 };
      host.innerHTML = own[m.route.page.kind] ? "" : '<h1 class="pt">' + esc(m.route.title) + "</h1>";
      if (!canSee(m.route, user)) { host.appendChild(alertBox("You do not have access to this page.")); return; }
      render(m.route.page, { params: p, reload: null, user: user, title: m.route.title }, host);
    }
  };
})();
