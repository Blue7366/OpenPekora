// Project Kandi - telas (rotas por hash: #home, #catalog, #download ...)
(function () {
  "use strict";
  try { var th = localStorage.getItem("kandi_theme"); if (th === "light" || th === "dark") document.documentElement.setAttribute("data-theme", th); } catch (e) {}
  var C = window.KANDI_CONFIG, A = window.KandiAPI, app = document.getElementById("app");
  var user = null, S = { cat: "featured", q: "", sort: "relevance", page: 1, tab: "recent", type: "purchases" }, rid = 0;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  // URLs vindas do servidor: só http(s), caminhos relativos e #rotas. Bloqueia javascript:, data: etc. (XSS). Vazio/"#" = não configurado.
  function safeUrl(u) { u = String(u == null ? "" : u).trim(); return /^(https?:\/\/|\/(?!\/)|#|[\w.-]+\.html(#|$))/i.test(u) ? u : ""; }
  function isSet(u) { return !!u && u !== "#"; }
  function lnk(u, cls, inner) { return isSet(u) && safeUrl(u) ? '<a class="' + (cls || "") + '" href="' + esc(safeUrl(u)) + '">' + inner + "</a>" : '<a class="' + (cls || "") + ' dis" aria-disabled="true">' + inner + "</a>"; }
  function img(u, c) { return /^(https?:)?\/\/|^\/(?!\/)/.test(u || "") ? '<img class="' + c + '" src="' + esc(u) + '" alt="">' : '<div class="' + c + ' tb"></div>'; }
  function failBox(e) { return '<p class="al" role="alert">' + esc(e && e.message ? e.message : "Something went wrong.") + "</p>"; }
  function showErr(id, e) { var el = $("#" + id); if (el) el.innerHTML = failBox(e); }

  // ---------- ícones (SVG) ----------
  var P = {
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>', search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/>',
    list: '<rect x="3" y="3" width="18" height="18" rx="4.5"/><path d="M7 8h10M7 11h10M7 14h10M7 17h10"/>',
    coin: '<circle cx="12" cy="12" r="10"/><text x="12" y="15.5" text-anchor="middle" font-size="9" font-weight="800" fill="currentColor" stroke="none" font-family="Montserrat,Arial">K$</text>',
    ticket: '<path d="M4 9l5-5 11 11-5 5z"/><path d="M12 8l4 4"/>',
    gear: '<path d="M10.16 4.83L10.50 2.11L13.50 2.11L13.84 4.83L15.77 5.63L17.93 3.95L20.05 6.07L18.37 8.23L19.17 10.16L21.89 10.50L21.89 13.50L19.17 13.84L18.37 15.77L20.05 17.93L17.93 20.05L15.77 18.37L13.84 19.17L13.50 21.89L10.50 21.89L10.16 19.17L8.23 18.37L6.07 20.05L3.95 17.93L5.63 15.77L4.83 13.84L2.11 13.50L2.11 10.50L4.83 10.16L5.63 8.23L3.95 6.07L6.07 3.95L8.23 5.63ZM12 8.6a3.4 3.4 0 100 6.8 3.4 3.4 0 000-6.8z"/>',
    home: '<path d="M3 11l9-8 9 8M5 10v11h5v-6h4v6h5V10"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-5 4-8 8-8s8 3 8 8z"/>',
    msg: '<path d="M3 4h18v13H10l-5 4v-4H3z"/><path d="M7 9h10M7 12h7"/>',
    friends: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-4 3-6 7-6s7 2 7 6"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14c3 0 5 2 5 5"/>',
    avatar: '<circle cx="9" cy="5" r="2.5"/><path d="M9 8l-3 6 4 1 2 6M9 8l5 3M5 18l-2 2M18 3l1 2 2 1-2 1-1 2-1-2-2-1 2-1z"/>',
    pack: '<path d="M7 8a5 5 0 0110 0v13H7z"/><path d="M7 14h10M10 11h4"/>', trade: '<path d="M4 8h14l-3-3M20 16H6l3 3"/>',
    groups: '<circle cx="12" cy="7" r="3"/><circle cx="5" cy="10" r="2.5"/><circle cx="19" cy="10" r="2.5"/><path d="M6 20c0-4 3-6 6-6s6 2 6 6M1 19c0-3 2-4 4-4M23 19c0-3-2-4-4-4"/>',
    forum: '<path d="M3 3h13v9H8l-3 3v-3H3z"/><path d="M12 15h4l3 3v-3h2V8h-3"/>', mega: '<path d="M3 10v4h4l9 5V5L7 10z"/><path d="M19 9a4 4 0 010 6"/>',
    bag: '<path d="M5 8h14l1 13H4z"/><path d="M9 8V6a3 3 0 016 0v2"/>',
    thumb: '<path d="M2 10h4v11H2zM6 10l4-8c2 0 3 1 3 3v3h7l-2 11H6"/>',
    win: '<path style="fill:currentColor;stroke:none" d="M2 4.6l8.5-1.2v8H2zM11.7 3.2L22 1.7v9.7H11.7zM2 12.7h8.5v8L2 19.5zM11.7 12.7H22v9.7l-10.3-1.500z"/>',
    studio: '<path style="fill:currentColor;stroke:none" d="M2.800 8.600l5.600-5.600 3.200 3.200-5.600 5.600z"/><path style="fill:none;stroke:currentColor;stroke-width:3;stroke-linecap:round;stroke-linejoin:round" d="M9.500 9.500L19.800 19.800"/><path style="fill:currentColor;stroke:none" d="M16.600 2.600a4.600 4.600 0 00-4.600 5.800L3.800 16.600l3.600 3.600 8.200-8.200a4.600 4.600 0 005.800-4.600l-3.200 3.200-2.800-.8-.8-2.800z"/>',
    apple: '<path style="fill:currentColor;stroke:none" d="M16.500 12.600c0-2.400 2-3.500 2.100-3.600-1.200-1.700-3-1.900-3.600-2-1.500-.2-3 .9-3.800.9s-2-.9-3.300-.9c-1.700 0-3.300 1-4.200 2.500-1.800 3.100-.5 7.700 1.300 10.200.9 1.200 1.900 2.600 3.200 2.600 1.300-.1 1.800-.8 3.300-.8s2 .8 3.300.8 2.200-1.200 3-2.500c1-1.400 1.400-2.800 1.400-2.900-.1 0-2.700-1-2.700-3.900zM14.200 5.200c.7-.9 1.200-2.100 1-3.200-1 0-2.300.7-3 1.600-.7.700-1.200 1.900-1.100 3 1.200.1 2.400-.6 3.100-1.400z"/>',
    droid: '<path style="fill:currentColor;stroke:none" fill-rule="evenodd" d="M2.800 18a9.200 9.200 0 0118.400 0zM8.300 14.300a1.200 1.200 0 102.400 0 1.200 1.200 0 10-2.400 0zM13.300 14.300a1.200 1.200 0 102.400 0 1.200 1.200 0 10-2.400 0z"/><path style="fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round" d="M7.200 4.800l1.800 2.800M16.800 4.800L15 7.600"/>',
    term: '<path d="M3.400 4h17.200v9.600h-5v6.400H3.400z" style="fill:none;stroke:currentColor;stroke-width:2.8;stroke-linejoin:round"/><path d="M7.200 8.400l3.400 2.600-3.400 2.600M11.800 14.600h4" style="fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round"/>',
    hat: '<path d="M5 14a7 7 0 0114 0z"/><path d="M3 14h18v3H3zM12 5v4"/>', sil: '<circle cx="12" cy="7" r="4"/><path d="M4 22c0-6 3-9 8-9s8 3 8 9z"/>'
  };
  // Ícones do menu lateral no traço do Hexium (contorno grosso, pontas arredondadas); a cor rosa vem do CSS.
  Object.assign(P, {
    home: '<path d="M2.8 11.4L12 2.9l9.2 8.5M5.2 10.2v10.6h4.4v-6.4h4.8v6.4h4.4V10.2"/>',
    user: '<circle cx="12" cy="6.6" r="3.9"/><path d="M6.4 14.3q5.6-1.3 11.2 0l1.7 5.4q-7.3 2.4-14.6 0z"/>',
    msg: '<path d="M3.5 3.5h17v12.6h-5.6L12 19.6l-2.9-3.5H3.5z"/><path d="M7.6 8h8.8M7.6 11.6h8.8"/>',
    friends: '<circle cx="9" cy="6.8" r="3.7"/><path d="M3.2 14.6q5.4-1.2 10.8 0l1.5 5.2q-6.9 2.2-13.8 0zM15.6 3.4c2.7.9 3.1 3.8 1.2 5.6 2.3.8 3.4 3.6 3.6 8.4"/>',
    avatar: '<circle cx="8.6" cy="4.4" r="2.3"/><path d="M3.2 9.2h6.6M3.2 9.2l1.3 5h3.2l-1.3 6.2M9.6 15.4l-1.4 5.2M14.4 11.4l-1.8-1.2L16.6 3.4h3.2zM11.8 20.6c.4-3 2.4-4.4 4.6-4.4-.2 2.6-2 4.4-4.6 4.4z"/>',
    pack: '<path d="M9.7 7.2a2.3 2.3 0 014.6 0M5.4 20.8V10.7a3.5 3.5 0 013.5-3.5h6.2a3.5 3.5 0 013.5 3.5v10.1zM5.4 14.2q6.6 1.8 13.2 0M9.2 15.4v1.8M14.8 15.4v1.8"/>',
    trade: '<path d="M4.2 10.2V7.4l2.4-1.8H11V3l9 5.4H6.2zM19.8 13.8v2.8l-2.4 1.8H13V21L4 15.6h13.8z"/>',
    groups: '<circle cx="12" cy="6" r="3.2"/><path d="M7.6 14.6q4.4-1.2 8.8 0l.8 5.4q-5.2 1.6-10.4 0zM7.4 5.2c-2.3.7-2.9 3.7-1.2 5.3M5.4 14.4c-2 .9-2.6 3.1-2 5.1M16.6 5.2c2.3.7 2.9 3.7 1.2 5.3M18.6 14.4c2 .9 2.6 3.1 2 5.1"/>',
    forum: '<path d="M3.4 3h12.8v9.2H9.6l-3.3 3.4v-3.4H3.4zM16.2 8.3h4.4v7.3h-1.7v2.7l-2.8-2.7h-3.8"/>',
    mega: '<path d="M3.4 9.8v4l3 .8L19.4 19.6V4.6L6.4 9.4zM7.2 15l1 3.8 3.2-1.2-.9-2.8"/>',
    bag: '<path d="M5.2 9h13.6l.9 11.8H4.3zM8.8 11.4V7a3.2 3.2 0 016.4 0v4.4"/>'
  });
  function ic(n, s, c) { return '<svg class="ic ' + (c || "") + '" viewBox="0 0 24 24" width="' + (s || 24) + '" height="' + (s || 24) + '" aria-hidden="true">' + P[n] + "</svg>"; }

  // Indica o modo atual para que demo/stub nunca sejam confundidos com uma conexão real.
  function modeBar() {
    var m = A.mode(), i = A.configIssues();
    if (m === "demo") return '<div class="mb demo"><b>TEST MODE</b> Nothing here is real: everything is a simulation and nothing is saved.</div>';
    if (m === "stub") return '<div class="mb demo"><b>LOCAL TEST API</b> Not PekoraSource.</div>';
    return i.length ? '<div class="mb warn"><b>Integration pending:</b> ' + esc(i.join("; ")) + ".</div>" : "";
  }

  // ---------- estrutura comum ----------
  var NAV = [["Games", "games"], ["Catalog", "catalog"], ["Create", "creator.html"], ["Download", "download"]];
  var SIDE = [["home", "Home", "home"], ["user", "Profile", "profile"], ["msg", "Messages", "messages"], ["friends", "Friends", "friends"], ["avatar", "Avatar", "avatar"], ["pack", "Inventory", "inventory"], ["trade", "Trade", "trade"], ["groups", "Groups", "groups"], ["forum", "Forums", "forums"], ["mega", "Events", "events"], ["bag", "Promo", "promo"], ["bag", "Donations", "donations"]];
  var NAVG = window.KANDI_NAV || [];
  function sideHtml(h) {
    return NAVG.map(function (i) {
      if (i === "-") return '<hr class="sd">';
      var ext = i[2].indexOf(".") > 0, on = !ext && (h === i[2] || h.indexOf(i[2] + "/") === 0);
      return '<a class="si' + (on ? " on" : "") + '" href="' + (ext ? "" : "#") + i[2] + '">' + ic(i[0], 30) + i[1] + '<span class="bd" data-bd="' + i[2] + '" hidden></span></a>';
    }).join("");
  }
  var FOOT = [["About Us", "about"], ["iOS Tutorial", "ios-tutorial"], ["Docs", "docs"], ["Bug Bounty", "bug-bounty"], ["Privacy", "privacy"], ["Help", "help"]];

  function shell(body, h) {
    var u = user;
    return '<header id="top"><div class="r1"><button id="mb" class="ib" aria-label="Menu">' + ic("menu", 26) + '</button><a class="lg" href="#home"><img src="' + C.ASSETS.k + '" alt="Project Kandi"></a><nav>' +
      NAV.map(function (n) { return '<a href="' + (n[1].indexOf(".") > 0 ? "" : "#") + n[1] + '">' + n[0] + "</a>"; }).join("") + '</nav></div>' +
      '<div class="r2"><form id="gsf" autocomplete="off"><input id="gq" type="text" aria-label="Search"><button aria-label="Search">' + ic("search", 22) + '</button></form><div id="sd" hidden></div></div>' +
      (u ? '<div class="r3"><a href="#feed" aria-label="Feed">' + ic("list", 30) + '</a><a href="#my-money">' + '<img class="hi" src="' + C.ASSETS.robuxw + '" alt="">' + "<b>" + esc(u.currency || 0) + '</b></a><a href="#trade">' + '<img class="hi" src="' + C.ASSETS.tixw + '" alt="">' + "<b>" + esc(u.tickets || 0) + '</b></a><a id="gear" role="button" tabindex="0" aria-label="Settings menu">' + ic("gear", 30) + '</a></div><div id="gm" hidden><a href="#account">Settings</a><a id="lo" role="button" tabindex="0">Logout</a></div>' : "") + "</header>" +
      '<span class="modebar">' + modeBar() + "</span>" + lnk(C.BUG_URL, "bug", esc(C.BANNER)) +
      '<div class="wrap"><aside id="side"><h3>' + esc(u ? u.username : "") + "</h3>" +
      sideHtml(h)+
      '<a class="btn w" style="margin-top:14px" href="#builders-club">Upgrade Now</a></aside><div id="ov"></div><main>' + body + "</main></div>" +
      "<footer><nav>" + FOOT.map(function (f) { return '<a href="#' + f[1] + '">' + f[0] + "</a>"; }).join("") + "</nav><p>Project Kandi is an independent game preservation project. Project Kandi is not affiliated with, sponsored by, or endorsed by Roblox Corporation. Use of this site signifies your acceptance of the <a href=\"#terms\">Terms and Conditions</a>.</p></footer>";
  }

  // ---------- páginas ----------
  var AD = '<div class="ad"><div class="adb"></div><div class="adl"><span>ADVERTISEMENT</span><a href="#">Report</a></div></div>';
  function sec(t, mid, id) { return '<section><div class="sh"><h2>' + t + "</h2>" + mid + '<a class="sa" href="#games">See All &rarr;</a></div><div class="cw"><button class="ar" aria-label="Previous">&lsaquo;</button><div class="strip" id="' + id + '"></div><button class="ar" aria-label="Next">&rsaquo;</button></div></section>'; }
  function tabs(list, cur, attr) { return '<div class="tabs">' + list.map(function (t) { return '<a data-' + attr + '="' + t[1] + '"' + (t[1] === cur ? ' class="on"' : "") + ">" + t[0] + "</a>"; }).join("") + "</div>"; }
  var CATS = [["Featured", "featured"], ["Collectibles", "collectibles"], ["Clothing", "clothing"], ["Accessories", "accessories"], ["Body Parts", "body"], ["Gear", "gear"]];
  var SORTS = [["Relevance", "relevance"], ["Price (Low to High)", "price_asc"], ["Price (High to Low)", "price_desc"], ["Recently Updated", "updated"], ["Best Selling", "sales"]];
  function opts(l, cur) { return l.map(function (o) { return '<option value="' + o[1] + '"' + (o[1] === cur ? " selected" : "") + ">" + o[0] + "</option>"; }).join(""); }
  function osItem(i, l, k, dd) { return lnk(C.DOWNLOADS[k], "", ic(i, 54, "f") + l + (dd ? "<small>&#9660;</small>" : "")); }

  var PG = {
    home: function () {
      return '<div class="hello"><div class="av">' + ic("sil", 70, "f") + "</div><h1>Hello, " + esc(user.username) + "!</h1></div>" +
        sec("Continue", '<select class="sel"><option>Recently Played</option><option>Favorites</option></select>', "c1") + sec("Popular", "", "c2") +
        '<section class="box"><h2>MY FEED</h2><div class="post"><input id="fi" type="text" placeholder="What are you up to?"><button id="fs" class="btn g">Share</button></div><div class="list" id="feed"></div></section>' +
        '<section class="box"><h3 class="bh">Project Kandi Blog</h3><div class="list" id="blog"></div></section>' +
        '<section class="box"><h3 class="bh">Events</h3><div class="evs" id="ev"></div></section>';
    },
    catalog: function () {
      return AD + '<h1 class="pt">Catalog</h1><form class="cs" id="cf"><button type="button" aria-label="Categories">' + ic("menu", 24) + '</button><input id="cq" type="text" placeholder="Search" value="' + esc(S.q) + '"></form>' +
        '<div class="cf"><select id="cc">' + opts(CATS, S.cat) + '</select><button id="cb" aria-label="Search">' + ic("search", 24) + '</button></div>' +
        '<p class="bc" id="bc"></p><p class="rs" id="rs"></p><div class="cf"><select id="cs">' + opts(SORTS, S.sort) + '</select></div><div class="cg" id="cg"></div><button class="btn" id="more" hidden>Load more</button>';
    },
    download: function () {
      return '<div class="dl"><img src="' + C.ASSETS.logo + '" alt="Project Kandi"><h2>Create Games, Play Games</h2><p>Create games and worlds spanning a variety of genres,</p><p>From first-person shooters, survival games, and role-playing adventures.</p>' +
        '' + lnk(C.DOWNLOADS.main, "btn g big", "Download Now!") + '<h4>DOWNLOAD FOR</h4><div class="os">' +
        osItem("win", "Windows", "windows") + osItem("studio", "Studio", "studio", 1) + osItem("apple", "iOS", "ios") + osItem("droid", "Android", "android", 1) + osItem("apple", "Mac", "mac", 1) + osItem("term", "Linux", "linux") + "</div></div>";
    },
    avatar: function () {
      return AD + '<h1 class="pt" style="margin-bottom:8px">Avatar Editor</h1><p class="em" style="padding:0 0 12px;font-size:17px">Explore the catalog to find more clothes!</p><div style="text-align:center"><a class="btn g big" style="font-size:20px;padding:12px 30px" href="#catalog">Get More</a></div><div class="acts" style="justify-content:center;margin-top:10px"><a class="btn s" id="redraw" role="button" tabindex="0">Redraw</a><a class="btn s" href="#avatar/outfits">Outfits</a><a class="btn s" href="#avatar/body">Body</a><a class="btn s" href="#inventory">Inventory</a></div>' +
        '<div class="ed">' + ic("sil", 150, "f") + '<div class="rt"><span>R6</span><span class="on">R15</span></div><div class="d3">3D</div></div>' +
        tabs([["Recent", "recent"], ["Clothing", "clothing"], ["Body", "body"], ["Animations", "animations"], ["Outfits", "outfits"]], S.tab, "tab") + '<p id="ab">Recent &gt; All</p><div class="cg" id="ag"></div>';
    },
    groups: function () {
      return AD + '<div class="sh"><h1 style="margin:0;font-size:42px;font-weight:700">Groups</h1><a class="sa" href="#groups/search">More Groups</a></div><div class="box" style="margin-top:0"><div class="list" id="gl"></div></div><a class="btn w" style="font-size:20px;padding:16px" href="#group/create">Create Group</a>';
    },
    transactions: function () {
      return AD + tabs([["My Transactions", "tx"], ["Summary", "sum"], ["Convert/Trade Currency", "conv"], ["Trade Items", "ti"], ["Promotion", "promo"]], "tx", "x") +
        '<p><b>Transaction Type:</b> <select class="sel" id="tt"><option value="purchases">Purchases</option><option value="sales">Sales</option><option value="trades">Trades</option></select></p>' +
        '<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Date</th><th>Member</th><th>Description</th><th>Amount</th></tr></thead><tbody id="tr"></tbody></table></div>';
    },
    "builders-club": function () {
      return '<div class="bch"><div class="ci">' + ic("hat", 80, "f") + '</div><h2>Project Kandi<br>Builders Club</h2><a class="btn" href="#builders-club">Get Builders Club</a></div>' +
        '<div class="bs"><h2>Currency every day</h2><p>Receive currency daily while your membership is active</p><div id="tiers"></div></div>' +
        '<div class="bs"><h2>Sell your creations</h2><p>Get access to selling items and Builders Club gear in the <a href="#catalog">Avatar Shop</a></p></div>' +
        '<div class="bs"><h2>Build more, join more</h2><p>Unlock more active places, groups, and beta features</p></div>' +
        '<div class="bs"><h2>...and much more</h2><p>Daily currency and the ability to trade items.</p></div>' +
        '<div class="bs" style="text-align:center"><h2>Your Builders Club Membership</h2><p id="mem"></p></div>';
    }
  };
  function notFound() { return AD + '<h1 class="pt">404</h1><p class="em">Page not found.</p><p class="em"><a href="#home">Back to Home</a></p>'; }
  function generic_old(h) { var t = h.replace(/-/g, " ").replace(/\b\w/g, function (c) { return c.toUpperCase(); }); return AD + '<h1 class="pt">' + esc(t) + '</h1><p class="em">Nothing here yet.</p>'; }

  // ---------- carregamento de dados ----------
  function fill(id, arr, fn, msg) { var el = $("#" + id); if (!el) return; el.innerHTML = (arr && arr.length) ? arr.map(fn).join("") : '<p class="em">' + (msg || "Nothing here yet.") + "</p>"; }
  function gameCard(g) { var n = Math.round((g.likeRatio || 0) * 5); return '<a class="gc" href="' + esc(safeUrl(g.url) || (g.id != null ? "#game/" + encodeURIComponent(g.id) : "#games")) + '">' + img(g.thumbnail, "") + "<b>" + esc(g.name) + "</b><small>" + esc(g.playing || 0) + ' Playing</small><div class="lk">' + ic("thumb", 20, "f") + [0, 1, 2, 3, 4].map(function (i) { return '<i class="' + (i < n ? "on" : "") + '"></i>'; }).join("") + "</div></a>"; }
  function itemCard(it, worn) { return '<a class="it' + (worn && it.worn ? " w" : "") + '"' + (it.id != null ? ' data-id="' + esc(it.id) + '"' : "") + ' href="' + esc(it.url != null ? safeUrl(it.url) : (it.id != null ? "#catalog/item/" + encodeURIComponent(it.id) : "#")) + '">' + img(it.thumbnail, "th") + (it.isNew ? '<span class="nw">New</span>' : "") + '<div class="tx"><span class="nm">' + esc(it.name) + "</span>" + (it.creator ? '<span class="by">By <b>' + esc(it.creator) + "</b></span>" : "") + (it.price != null ? '<span class="pr">' + '<img class="pi" src="' + C.ASSETS.robux + '" alt=""> ' + esc(it.price) + "</span>" : "") + (it.sales != null ? "<small>Sales " + esc(it.sales) + "</small>" : "") + "</div></a>"; }
  var LD = {
    home: function () {
      A.home().then(function (d) {
        d = d || {}; fill("c1", d.continue, gameCard); fill("c2", d.popular, gameCard);
        fill("feed", d.feed, function (f) { return '<div class="fi">' + img(f.thumbnail, "") + "<div><a>" + esc(f.group) + "</a><p>" + esc(f.text) + "</p><small>(posted by " + esc(f.author) + ") " + esc(f.date) + "</small></div></div>"; }, "No posts yet.");
        fill("blog", d.blog, function (b) { return '<div class="bi">' + img(b.thumbnail, "") + '<div><a href="' + esc(safeUrl(b.url) || "#") + '"><b>' + esc(b.title) + "</b></a><small>Posted by " + esc(b.author) + " &bull; " + esc(b.views || 0) + " views</small></div></div>"; });
        var ev = $("#ev"); if (ev) ev.innerHTML = (d.events && d.events.length) ? d.events.map(function (e) { return '<a class="ev" href="' + esc(safeUrl(e.url) || "#") + '">' + img(e.thumbnail, "") + "<span>" + esc(e.title) + "</span></a>"; }).join("") : '<p class="em" style="width:100%">No events right now.</p>';
      }).catch(function (e) { ["c1", "c2", "feed", "blog", "ev"].forEach(function (id) { showErr(id, e); }); });
    },
    catalog: function () { loadCatalog(true); },
    avatar: function () { loadAvatar(); },
    groups: function () { A.groups().then(function (d) { fill("gl", d && (d.groups || d.items), function (g) { return '<div class="fi">' + img(g.thumbnail, "") + "<div><a><b>" + esc(g.name) + "</b></a><small>By " + esc(g.owner) + " &bull; " + esc(g.members || 0) + " Members</small></div></div>"; }, "You are not in any groups."); }).catch(function (e) { showErr("gl", e); }); },
    transactions: function () { loadTx(); },
    "builders-club": function () {
      A.buildersClub().then(function (d) {
        d = d || {}; fill("tiers", d.tiers || d.items, function (t) { return '<div class="tier"><h3>' + esc(t.name) + "</h3><b>" + esc(t.perDay) + "/day</b><br><small>" + esc(t.price || "") + "</small></div>"; }, "No plans available.");
        var m = $("#mem"); if (m) m.textContent = d.membership ? "Membership: " + d.membership : "You do not have an active membership.";
      }).catch(function (e) { showErr("tiers", e); });
    }
  };
  function loadCatalog(reset) {
    var my = ++rid, g = $("#cg"); if (!g) return;
    if (reset) { S.page = 1; g.innerHTML = ""; $("#more").hidden = true; }
    var cat = CATS.filter(function (c) { return c[1] === S.cat; })[0];
    $("#bc").textContent = cat[0] + " > All";
    A.catalog({ category: S.cat, q: S.q, sort: S.sort, page: S.page, limit: C.PAGE_SIZE }).then(function (r) {
      if (my !== rid) return; r = r || {};
      (r.items || []).forEach(function (x) { g.insertAdjacentHTML("beforeend", itemCard(x)); });
      var n = g.children.length; $("#rs").textContent = n ? "1 - " + n + " of " + (r.total || n) + " Results" : "0 Results";
      if (!n) g.innerHTML = '<p class="em" style="grid-column:1/-1">No items found.</p>';
      $("#more").hidden = !r.hasMore;
    }).catch(function (e) { if (my === rid) $("#rs").textContent = e.message || "Could not load the catalog."; });
  }
  function avatarActs() {
    var g = $("#ag"); if (!g) return;
    g.onclick = function (e) { var a = e.target.closest("a.it"); if (!a) return; e.preventDefault(); var id = a.getAttribute("data-id"); if (!id) return; var w = a.classList.contains("w"); A.call(w ? "avatar.remove" : "avatar.wear", { params: { id: id } }).then(function () { loadAvatar(); }).catch(function (x) { toast(x.message, true); }); };
    var rd = $("#redraw"); if (rd) rd.onclick = function () { A.call("avatar.redraw").then(function () { toast("Avatar redrawn."); }).catch(function (x) { toast(x.message, true); }); };
    $$(".rt span").forEach(function (sp) { sp.onclick = function () { A.call("avatar.setType", { body: { playerAvatarType: sp.textContent } }).then(function () { $$(".rt span").forEach(function (x) { x.classList.toggle("on", x === sp); }); }).catch(function (x) { toast(x.message, true); }); }; });
  }
  function loadAvatar() { A.avatar({ tab: S.tab }).then(function (d) { fill("ag", d && d.items, function (i) { return itemCard(i, 1); }, "No items in this tab."); }).catch(function (e) { showErr("ag", e); }); }
  function loadTx() {
    A.transactions({ type: S.type }).then(function (d) {
      var el = $("#tr"), rows = (d && (d.rows || d.items)) || []; if (!el) return;
      el.innerHTML = rows.length ? rows.map(function (r) { return "<tr><td>" + esc(r.date) + "</td><td>" + esc(r.member) + "</td><td>" + esc(r.description) + "</td><td>" + esc(r.amount) + "</td></tr>"; }).join("") : '<tr><td colspan="4" class="em">No transactions.</td></tr>';
    }).catch(function (e) { var el = $("#tr"); if (el) el.innerHTML = '<tr><td colspan="4" class="al">' + esc(e.message) + "</td></tr>"; });
  }

  // ---------- eventos ----------
  function wire(h) {
    var side = $("#side");
    $("#mb").onclick = function () { side.classList.add("open"); };
    $("#ov").onclick = function () { side.classList.remove("open"); };
    $$("#side a.si").forEach(function (a) { a.addEventListener("click", function () { side.classList.remove("open"); }); });
    var gr = $("#gear"), gm = $("#gm");
    if (gr) { gr.onclick = function (e) { e.stopPropagation(); gm.hidden = !gm.hidden; }; document.addEventListener("click", function () { if (gm) gm.hidden = true; }); gm.onclick = function (e) { if (e.target.tagName === "A") gm.hidden = true; }; }
    if ($("#lo")) $("#lo").onclick = function () { A.logout().then(function () { user = null; location.href = C.LANDING_URL; }).catch(function (e) { toast("Could not log out: " + e.message, true); }); };
    var gq = $("#gq"), sd = $("#sd");
    gq.oninput = function () {
      var v = gq.value.trim(); if (!v) { sd.hidden = true; return; }
      sd.innerHTML = [["Catalog", "catalog"], ["People", "users"], ["Games", "games"], ["Groups", "groups/search"]].map(function (t) { return '<a data-t="' + t[1] + '">Search "' + esc(v) + '" in ' + t[0] + "</a>"; }).join(""); sd.hidden = false;
    };
    sd.onclick = function (e) { var a = e.target.closest("a[data-t]"); if (!a) return; S.q = gq.value.trim(); sd.hidden = true; location.hash = a.dataset.t; if (a.dataset.t === "catalog" && h === "catalog") rerender(); };
    $("#gsf").onsubmit = function (e) { e.preventDefault(); S.q = gq.value.trim(); sd.hidden = true; if (h === "catalog") rerender(); else location.hash = "catalog"; };
    $$(".cw").forEach(function (w) { var s = $(".strip", w); $$(".ar", w).forEach(function (b, i) { b.onclick = function () { s.scrollBy({ left: i ? 240 : -240 }); }; }); });
    if (h === "home") {
      $("#fs").onclick = function () { var t = $("#fi").value.trim(); if (!t) return; A.feedPost({ text: t }).then(function (r) { if (r && r.simulated) toast(r.message); $("#fi").value = ""; LD.home(); }).catch(function (e) { toast(e.message, true); }); };
    }
    if (h === "catalog") {
      var run = function () { S.q = $("#cq").value.trim(); S.cat = $("#cc").value; S.sort = $("#cs").value; loadCatalog(true); };
      $("#cf").onsubmit = function (e) { e.preventDefault(); run(); };
      $("#cb").onclick = run; $("#cc").onchange = run; $("#cs").onchange = run;
      $("#more").onclick = function () { S.page++; loadCatalog(false); };
    }
    if (h === "avatar") avatarActs();
    if (h === "avatar") $$("[data-tab]").forEach(function (t) { t.onclick = function () { S.tab = t.dataset.tab; $$("[data-tab]").forEach(function (x) { x.classList.toggle("on", x === t); }); $("#ab").innerHTML = t.textContent + " &gt; All"; loadAvatar(); }; });
    if (h === "transactions") $("#tt").onchange = function () { S.type = this.value; loadTx(); };
  }

  // ---------- rotas ----------
  var cur = "home";
  function rerender() { render(cur); }
  function render(h) {
    cur = h; var pg = PG[h], m = pg ? null : window.KandiPages.match(h);
    document.body.classList.toggle("guest", !user);
    app.innerHTML = shell(pg ? pg() : m ? '<div id="pg"></div>' : notFound(), h); wire(h);
    document.title = (m ? m.route.title : h.replace(/-/g, " ").replace(/\b\w/g, function (c) { return c.toUpperCase(); })) + " - Project Kandi";
    if (LD[h]) LD[h](); else if (m) window.KandiPages.mount($("#pg"), m, user);
    if (user && !C.DEMO) extras();
  }
  // contador de mensagens não lidas e alertas globais (só no modo real; falhas não bloqueiam a página)
  function extras() {
    A.call("messages.unreadCount").then(function (d) { var n = d && d.count; var b = $('[data-bd="messages"]'); if (b && n) { b.textContent = n; b.hidden = false; } }).catch(function () {});
    A.call("site.alerts").then(function (d) { var l = (d && d.items) || []; if (l.length) $("#top").insertAdjacentHTML("afterend", '<a class="bug alr" href="' + esc(safeUrl(l[0].url) || "#") + '">' + esc(l[0].text) + "</a>"); }).catch(function () {});
  }
  function toast(msg, bad) { var t = $("#toast"); if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); } t.textContent = msg; t.className = bad ? "bad on" : "on"; clearTimeout(toast.t); toast.t = setTimeout(function () { t.className = ""; }, 3500); }
  window.KandiUI = { balance: function () { return user ? user.currency : null; }, esc: esc, img: img, safeUrl: safeUrl, lnk: lnk, ic: ic, gameCard: gameCard, itemCard: itemCard, toast: toast, S: S };
  function route() {
    var h = (location.hash.slice(1) || "home").split("?")[0]; if (h === "promo") { location.replace("#promocodes"); return; }
    var go = function () { render(h); window.scrollTo(0, 0); };
    if (user) return go();
    var fail = null;
    A.me().then(function (u) { user = u; }).catch(function (e) { user = null; if (!e || e.status !== 401) fail = e || new A.ApiError(0, "Could not load your account.", null, "network"); }).then(function () {
      var pub = h === "download" || (window.KandiPages && window.KandiPages.isPublic(h));
      // Falha de rede/servidor NÃO é "deslogado": mostra o erro com Retry em vez de mandar para o login.
      if (!user && fail && !pub) { app.innerHTML = '<div class="wrap"><main><h1 class="pt">Connection problem</h1>' + failBox(fail) + '<p class="em"><a class="btn" id="retry" role="button" tabindex="0">Retry</a></p></main></div>'; $("#retry").onclick = route; return; }
      if (!user && !pub) { try { sessionStorage.setItem("kandi_return", h); } catch (x) {} location.href = C.LANDING_URL; return; }
      go();
    });
  }
  // Sessão expirada (401 do backend): volta ao login guardando a rota para retornar depois.
  window.addEventListener("kandi:unauthorized", function () { user = null; var h = location.hash.slice(1).split("?")[0]; if (!window.KandiPages.isPublic(h)) { try { sessionStorage.setItem("kandi_return", h); } catch (x) {} location.href = C.LANDING_URL; } });
  window.addEventListener("hashchange", route);
  route();
})();
