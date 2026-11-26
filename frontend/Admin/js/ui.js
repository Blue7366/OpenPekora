// Componentes de UI do painel (HTML/JS puro). Sem lógica de dados: só recebem o que a camada AdminData entrega.
window.AdminUI = (function () {
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var IC = {
    dash: "M3 3h8v8H3zM13 3h8v5h-8zM13 11h8v10h-8zM3 14h8v7H3z", users: "M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2.5 20c0-4 3-6 6.500-6s6.500 2 6.500 6zM16 4.500a3.200 3.200 0 010 6M18 14c2.500.5 3.500 2.500 3.500 6",
    user: "M12 11a4 4 0 100-8 4 4 0 000 8zM4 21c0-5 3.500-8 8-8s8 3 8 8z", tag: "M3 12V3h9l9 9-9 9zM8 8h.01", box: "M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10", plus: "M12 4v16M4 12h16",
    flag: "M5 21V4M5 4h13l-2 4 2 4H5", ban: "M12 21a9 9 0 100-18 9 9 0 000 18zM5.600 5.600l12.800 12.800", group: "M12 10a3 3 0 100-6 3 3 0 000 6zM6 20c0-4 2.500-6 6-6s6 2 6 6M4 11a2.200 2.200 0 100-4.400M20 11a2.200 2.200 0 100-4.400",
    chat: "M3 4h18v12H9l-5 4v-4H3z", mail: "M3 5h18v14H3zM3 6l9 7 9-7", shield: "M12 3l8 3v6c0 5-3.500 8-8 9-4.500-1-8-4-8-9V6z", list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
    toggle: "M7 7h10a5 5 0 010 10H7A5 5 0 017 7zM17 12h.01", bell: "M6 17V11a6 6 0 0112 0v6l2 2H4zM10 21h4", card: "M3 6h18v12H3zM3 10h18", clock: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2",
    inbox: "M3 13l3-8h12l3 8v6H3zM3 13h5l1 3h6l1-3h5", out: "M9 4H4v16h5M16 8l4 4-4 4M20 12H9", menu: "M3 6h18M3 12h18M3 18h18", search: "M10.500 17a6.500 6.500 0 100-13 6.500 6.500 0 000 13zM15.500 15.500L21 21", x: "M5 5l14 14M19 5L5 19", check: "M5 12l5 5 9-10", lock: "M6 11h12v10H6zM8 11V8a4 4 0 018 0v3"
  };
  function ic(n, s) { return '<svg class="ic" viewBox="0 0 24 24" width="' + (s || 20) + '" height="' + (s || 20) + '" aria-hidden="true"><path d="' + (IC[n] || IC.list) + '"/></svg>'; }
  function toast(m, kind) { var t = $("#toast"); if (!t) { t = document.createElement("div"); t.id = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); } t.textContent = m; t.className = "on " + (kind || ""); clearTimeout(toast.t); toast.t = setTimeout(function () { t.className = ""; }, 4200); }
  function badge(v) { var k = { Active: "ok", Approved: "ok", Resolved: "ok", Open: "ok", Visible: "ok", Banned: "bad", Rejected: "bad", Locked: "bad", Pending: "wait", Expired: "mut", Info: "mut", Promo: "wait" }[v] || "mut"; return '<span class="bg ' + k + '">' + esc(v) + "</span>"; }
  function lim(v) { return v === "Limited" ? '<span class="lim"><b>LIMITED</b></span>' : v === "Limited U" ? '<span class="lim"><b>LIMITED</b><i>U</i></span>' : badge(v === "Onsale" ? "Active" : "Expired").replace(/>[^<]+</, ">" + v + "<"); }
  function card(label, val, icon) { return '<div class="cd"><span class="ci">' + ic(icon, 22) + '</span><div><small>' + esc(label) + "</small><b>" + esc(val) + "</b></div></div>"; }
  function states(el, kind, msg, retry) {
    var m = { load: '<div class="sk"><i></i><i></i><i></i></div>', empty: '<div class="st">' + ic("inbox", 34) + "<p>" + esc(msg || "Nothing here.") + "</p></div>", err: '<div class="st er">' + ic("x", 34) + "<p>" + esc(msg || "Something went wrong.") + '</p><button class="b s" data-retry>Retry</button></div>' }[kind];
    el.innerHTML = m; var r = $("[data-retry]", el); if (r && retry) r.onclick = retry;
  }
  // Modal: sempre diz que a operação não é executada de verdade enquanto o backend não existe.
  function modal(o) {
    var ov = document.createElement("div"); ov.className = "ov"; ov.innerHTML = '<div class="md" role="dialog" aria-modal="true"><h3>' + esc(o.title) + "</h3>" + (o.text ? "<p>" + esc(o.text) + "</p>" : "") +
      '<form>' + (o.fields || []).map(function (f) { return '<label>' + esc(f[1]) + (f[2] === "textarea" ? '<textarea name="' + f[0] + '" rows="3"></textarea>' : f[2] === "select" ? '<select name="' + f[0] + '">' + f[3].map(function (x) { return "<option>" + esc(x) + "</option>"; }).join("") + "</select>" : '<input name="' + f[0] + '" type="' + (f[2] || "text") + '">') + "</label>"; }).join("") +
      '<p class="nb">' + ic("lock", 16) + (o.onOk ? ' Demo: this only applies in this browser (backend not connected).</p>' : (window.ADMIN_CONFIG.TEST_MODE ? ' TEST MODE: this is only a simulation, nothing is saved.</p>' : ' Backend not connected: confirming will NOT execute this action.</p>')) + '<div class="ma"><button type="button" class="b g" data-c>Cancel</button><button class="b' + (o.danger ? ' d' : '') + '">' + esc(o.ok || "Confirm") + "</button></div></form></div>";
    function close() { ov.remove(); document.removeEventListener("keydown", key); } function key(e) { if (e.key === "Escape") close(); }
    document.addEventListener("keydown", key); document.body.appendChild(ov);
    $("[data-c]", ov).onclick = close; ov.onclick = function (e) { if (e.target === ov) close(); };
    $("form", ov).onsubmit = function (e) { e.preventDefault(); var b = $(".ma .b:last-child", ov), body = {}; $$("[name]", ov).forEach(function (i) { body[i.name] = i.value; }); if (o.onOk) { close(); o.onOk(); return; } b.disabled = true; b.textContent = "Working...";
      window.AdminData.perform(o.op, body).then(function (r) { toast(r && r.simulated ? r.message : "Done.", r && r.simulated ? "warn" : "ok"); close(); }).catch(function (x) { toast(x.notConnected ? "Not executed: " + x.message : x.message, "warn"); close(); }); };
    var f = $("input,select,textarea,button.b:last-child", ov); if (f) f.focus();
  }
  // Tabela com busca, filtros, paginação e estados (loading/vazio/erro). cfg.src é uma fonte da camada AdminData.
  function table(el, cfg) {
    var st = { q: "", f: {}, page: 1 };
    el.innerHTML = '<div class="tb"><div class="sr">' + ic("search", 18) + '<input type="search" placeholder="Search..." aria-label="Search"></div>' + (cfg.filters || []).map(function (f) { return '<select data-f="' + f[0] + '" aria-label="' + f[0] + '">' + f[1].map(function (o) { return "<option>" + o + "</option>"; }).join("") + "</select>"; }).join("") +
      (cfg.toolbar || []).map(function (a, i) { return '<button class="b" data-t="' + i + '">' + esc(a[0]) + "</button>"; }).join("") + '</div><div class="tw" id="tw"></div><div class="pg" id="pg"></div>';
    var tw = $("#tw", el), pg = $("#pg", el), last = [];
    function load() {
      states(tw, "load");
      window.AdminData.list(cfg.src, { q: st.q, filters: st.f, page: st.page, size: window.ADMIN_CONFIG.PAGE_SIZE }).then(function (r) {
        last = r.rows; if (!r.rows.length) { states(tw, "empty", "No results for this search."); pg.innerHTML = ""; return; }
        tw.innerHTML = '<table><thead><tr>' + cfg.cols.map(function (c) { return "<th>" + c[1] + "</th>"; }).join("") + (cfg.row ? "<th></th>" : "") + "</tr></thead><tbody>" + r.rows.map(function (x, ri) {
          return "<tr>" + cfg.cols.map(function (c) { var v = x[c[0]]; return '<td data-l="' + c[1] + '">' + (c[2] === "sale" ? lim(v) : c[2] === "badge" ? badge(v) : c[2] === "link" ? '<a href="' + c[3].replace("{id}", x.id) + '">' + esc(v) + "</a>" : esc(v)) + "</td>"; }).join("") +
            (cfg.row ? '<td class="ra">' + cfg.row.map(function (a, ai) { return a[1] ? '<a class="b s g" href="' + a[1].replace("{id}", x.id) + '">' + a[0] + "</a>" : '<button class="b s' + (a[3] ? " d" : "") + '" data-r="' + ri + "," + ai + '">' + a[0] + "</button>"; }).join("") + "</td>" : "") + "</tr>"; }).join("") + "</tbody></table>";
        var n = Math.ceil(r.total / r.size); pg.innerHTML = '<span>' + r.total + ' result(s)' + (r.demo ? " · demo data" : "") + '</span><div><button class="b s g" data-p="-1"' + (st.page < 2 ? " disabled" : "") + '>&lsaquo; Prev</button><b>' + st.page + " / " + n + '</b><button class="b s g" data-p="1"' + (st.page >= n ? " disabled" : "") + ">Next &rsaquo;</button></div>";
      }).catch(function (e) { states(tw, "err", e.message, load); });
    }
    $("input", el).oninput = function () { st.q = this.value; st.page = 1; clearTimeout(load.t); load.t = setTimeout(load, 250); };
    $$("select[data-f]", el).forEach(function (s) { s.onchange = function () { st.f[s.dataset.f] = s.value; st.page = 1; load(); }; });
    el.onclick = function (e) {
      var p = e.target.closest("[data-p]"), r = e.target.closest("[data-r]"), t = e.target.closest("[data-t]");
      if (p) { st.page += +p.dataset.p; load(); }
      if (r) { var s = r.dataset.r.split(","), a = cfg.row[+s[1]], row = last[+s[0]]; modal({ title: a[0] + " - #" + row.id, text: a[2] || "Confirm this action?", op: a[4] || a[0], danger: a[3], ok: a[0] }); }
      if (t) { var b = cfg.toolbar[+t.dataset.t]; modal({ title: b[0], op: b[1], fields: b[2] || [], ok: b[0] }); }
    };
    load();
  }
  // Gráficos SVG simples (linha ou barras). values: números; dados vindos da camada AdminData.
  function chart(values, kind) {
    var W = 320, H = 120, m = Math.max.apply(null, values) * 1.1, n = values.length, bw = W / n;
    var pts = values.map(function (v, i) { return [(i + .5) * bw, H - (v / m) * H]; });
    var body = kind === "bar" ? pts.map(function (p) { return '<rect x="' + (p[0] - bw * .3) + '" y="' + p[1] + '" width="' + bw * .6 + '" height="' + (H - p[1]) + '" rx="4"/>'; }).join("") : '<path class="ar" d="M' + pts.map(function (p) { return p.join(","); }).join("L") + "L" + pts[n - 1][0] + "," + H + "L" + pts[0][0] + "," + H + 'z"/><path class="ln" d="M' + pts.map(function (p) { return p.join(","); }).join("L") + '"/>' + pts.map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3"/>'; }).join("");
    return '<svg class="ch" viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none" role="img">' + body + "</svg>";
  }
  return { $: $, $$: $$, esc: esc, ic: ic, toast: toast, badge: badge, lim: lim, card: card, states: states, modal: modal, table: table, chart: chart };
})();
