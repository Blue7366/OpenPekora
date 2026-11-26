// Project Kandi - extras compartilhados (site, creator e landing): barra verde de notificação, janelas (modais),
// tela de aplicação e "Technical Issues Screen". Só frontend: nada aqui finge que o backend executou algo.
(function () {
  "use strict";
  var C = window.KANDI_CONFIG || {}, $ = function (s, r) { return (r || document).querySelector(s); };
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  // Entrada: sem sessão, o site rosa NUNCA aparece; vai para a tela de Login / Create Application (index.html).
  // Em modo teste a "sessão" é a chave kandi_demo_user criada pelo login simulado. TODO(backend): com TEST_MODE=false o 401 do servidor já redireciona.
  (function () {
    var land = /(^|\/)(index\.html)?$/.test(location.pathname);
    try { if (C.TEST_MODE && !land && !/^#\/?(terms|privacy)/.test(location.hash) && !localStorage.getItem("kandi_demo_user")) { location.replace(C.LANDING_URL || "index.html"); } } catch (e) {}
  })();
  var css = document.createElement("style");
  css.textContent = '#nbar{position:fixed;left:0;right:0;top:0;z-index:120;padding:calc(14px + env(safe-area-inset-top,0px)) 14px 14px;text-align:center;background:#02b757;color:#fff;font:600 16px Montserrat,Arial;transform:translateY(-110%);transition:transform .25s}#nbar.on{transform:none}#nbar.bad{background:#c4314b}' +
    '.km{position:fixed;inset:0;z-index:110;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:12px;animation:kmi .15s}@keyframes kmi{from{opacity:0}}.kb{background:#fff;color:#222;width:min(560px,100%);max-height:92vh;overflow:auto;border-radius:3px}' +
    '.kh{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border-bottom:1px solid #e3e3e3;font-size:20px}.kh button{background:none;border:0;font-size:30px;line-height:1;cursor:pointer;color:#333}.kc{padding:16px;text-align:center}.kc p{margin:8px 0}.kc>img,.kc .kt{max-width:260px;width:60%;aspect-ratio:1;object-fit:contain;background:#f0f0f0;margin:10px auto;display:block}' +
    '.kmr{color:#02b757;font-weight:700}.kmr img{display:inline;width:16px;height:16px;aspect-ratio:auto;background:none;margin:0 3px 0 0;vertical-align:-3px}.ka{display:flex;gap:10px;justify-content:center;margin:16px 0 8px}.kbn{border:1px solid #bbb;background:#fff;color:#222;padding:10px 18px;border-radius:3px;font:500 17px Montserrat,Arial;cursor:pointer;text-decoration:none}.kbn.g{background:#00b259;border-color:#00b259;color:#fff}.kbn:disabled{opacity:.5}' +
    '.kn{color:#999;font-size:14px}.ksp{width:56px;height:56px;border:5px solid #ddd;border-top-color:#00b259;border-radius:50%;margin:16px auto;animation:ksp 1s linear infinite}@keyframes ksp{to{transform:rotate(360deg)}}' +
    '#tis{position:fixed;inset:0;z-index:2147483647;background:#262266 url(assets/tech-issues.jpg) center/cover no-repeat}@media (max-aspect-ratio:1/1){#tis{background-image:url(assets/tech-issues-mobile.jpg);background-position:center top}}html.tis-on,html.tis-on body{overflow:hidden}html.tis-on body>*:not(#tis){display:none!important}#tis span{position:absolute;left:-9999px}' +
    '.apn{background:#202124;color:#e8eaed;margin:0 -10px;padding:28px 16px 60px;font-family:Roboto,Arial,sans-serif}.apn>div{max-width:520px;margin:0 auto;font-size:14px;line-height:1.5}.apn h2{font-weight:500;font-size:22px;margin:0 0 12px}.apn h3{font-weight:500;font-size:18px;margin:34px 0 10px;padding-left:12px}.apn a{color:#6ea8fe}.apn ul{padding-left:20px}' +
    '.apn .bx{background:#cfe3ff;color:#16345c;padding:12px;border-radius:3px;margin-top:10px;word-break:break-word}.apn input,.apn textarea{width:100%;background:#fff;color:#222;border:1px solid #ccc;border-radius:3px;padding:9px;font:inherit}.apn textarea{min-height:110px}.apn .sm{color:#9aa0a6;font-size:12px}' +
    '.apn .btn2{display:inline-block;background:#0d6efd;color:#fff!important;border:0;border-radius:4px;padding:9px 16px;font:inherit;cursor:pointer;text-decoration:none}.apn .btn2:disabled{opacity:.5}.apn .btn2.s{padding:4px 10px;font-size:12px;margin-top:8px}.apn .pad{padding-left:12px}';
  document.head.appendChild(css);

  // ---- barra verde (como "Purchase completed successfully!")
  function bar(msg, bad) { var b = document.getElementById("nbar"); if (!b) { b = document.createElement("div"); b.id = "nbar"; b.setAttribute("role", "status"); document.body.appendChild(b); } b.textContent = msg; b.className = bad ? "bad" : ""; void b.offsetWidth; b.classList.add("on"); clearTimeout(bar.t); bar.t = setTimeout(function () { b.classList.remove("on"); }, 4500); }
  window.KandiNotify = { bar: bar };

  // ---- janelas
  var cur = null;
  function open(title, body, closable) {
    close(); var o = document.createElement("div"); o.className = "km"; o.innerHTML = '<div class="kb" role="dialog" aria-modal="true"><div class="kh"><span>' + esc(title) + "</span>" + (closable === false ? "" : '<button aria-label="Close">&times;</button>') + '</div><div class="kc">' + body + "</div></div>";
    function key(e) { if (e.key === "Escape" && closable !== false) close(); } document.addEventListener("keydown", key); o._k = key; document.body.appendChild(o); cur = o;
    var x = $(".kh button", o); if (x) x.onclick = close; if (closable !== false) o.onclick = function (e) { if (e.target === o) close(); };
    return o;
  }
  function close() { if (cur) { document.removeEventListener("keydown", cur._k); cur.remove(); cur = null; } }
  function pic(d) { var u = d && d.thumbnail; return /^(https?:)?\/\/|^\/(?!\/)|^assets\//.test(u || "") ? '<img src="' + esc(u) + '" alt="">' : '<div class="kt"></div>'; }
  function rs(n) { return '<span class="kmr"><img src="' + esc((C.ASSETS && C.ASSETS.robux) || "assets/robux.png") + '" alt="R$">' + esc(n) + "</span>"; }
  function btns(list) { return '<div class="ka">' + list.map(function (b, i) { return '<button class="kbn ' + (b[1] || "") + '" data-i="' + i + '">' + esc(b[0]) + "</button>"; }).join("") + "</div>"; }
  function wire(o, list) { [].forEach.call(o.querySelectorAll(".ka button"), function (b) { b.onclick = list[+b.dataset.i][2]; }); }
  function processing(t, img, msg) { return open(t, pic(img) + '<div class="ksp"></div><p>' + esc(msg) + '</p><p class="kn">Please keep this window open.</p>', false); }
  function insufficient(need) {
    var l = [["Buy Robux", "g", function () { close(); location.hash = "#my-money"; }], ["Cancel", "", close]];
    var o = open("Insufficient Funds", "<p>" + (need != null ? "You need " + rs(need) + " more to purchase this item." : "You do not have enough Robux to purchase this item.") + '</p><img src="' + esc((C.ASSETS && C.ASSETS.robux) || "assets/robux.png") + '" alt="">' + btns(l)); wire(o, l);
  }
  var KM = {
    close: close, open: open, insufficient: insufficient,
    // buy(item, run): run() faz a chamada real (KandiAPI) e devolve uma Promise. Sem backend, o erro real aparece.
    buy: function (d, run) {
      var name = d.title || d.name || "this item", price = d.price != null ? +d.price : null, ui = window.KandiUI, bal = ui && ui.balance ? ui.balance() : null; bal = bal != null ? +bal : null;
      if (price != null && bal != null && bal < price) return insufficient(price - bal);
      var l = [["Buy Now", "g", function () {
        processing("Processing Purchase", d, "Processing your purchase...");
        run().then(function (r) { close(); bar("Purchase completed successfully!" + (r && r.simulated ? " (test mode, simulated)" : "")); }).catch(function (e) { close(); if ((e && e.status === 402) || /insufficient|enough/i.test((e && e.message) || "")) insufficient(null); else (ui && ui.toast ? ui.toast : bar)((e && e.message) || "Purchase failed.", true); });
      }], ["Cancel", "", close]];
      var o = open("Buy Item", "<p>Would you like to buy <b>" + esc(name) + "</b>" + (price != null ? " for " + rs(price) : "") + "?</p>" + pic(d) + btns(l) + (price != null && bal != null ? '<p class="kn">Your balance after this transaction will be<br>' + rs(bal - price) + "</p>" : "")); wire(o, l);
    },
    game: function (d, run) {
      var ui = window.KandiUI, l = [["Play", "g", function () { processing("Starting " + (d.title || d.name || "game"), d, "Starting game..."); run().then(function (r) { close(); bar((r && r.message) || "Game is starting."); }).catch(function (e) { close(); (ui && ui.toast ? ui.toast : bar)((e && e.message) || "Could not start the game.", true); }); }], ["Cancel", "", close]];
      var o = open("Play Game", "<p><b>" + esc(d.title || d.name || "Game") + "</b>" + (d.subtitle ? "<br>" + esc(d.subtitle) : "") + "</p>" + pic(d) + btns(l)); wire(o, l);
    }
  };
  window.KandiModal = KM;

  // ---- tela de aplicação (design escuro: Discord, About Me, Roblox, verificação, referral, captcha)
  window.KandiApplication = { render: function (b, ctx, host) {
    var A = window.KandiAPI, ui = window.KandiUI, w = document.createElement("div"); w.className = "apn";
    w.innerHTML = '<div><h2>Application</h2><p>To join this website, you must fill out an application. This is done to prevent bots and malicious users from joining.</p><p><b>Already filled out the application?</b> Click <a href="#" id="ast">here</a> to view its status.</p><h3 style="padding:0">Requirements</h3><ul><li>You must be 13 years of age or older</li><li>You must have an active account on a public website such as Roblox or Twitter.</li></ul>' +
      '<h3>Step 1 - Discord</h3><div class="pad"><p>For further authentication, we need you to authorize our bot to know you aren\'t a bot. You will also be added to the Discord server.</p><div class="bx" id="dc">Checking Discord...</div></div>' +
      '<h3>Step 2 - About Me</h3><div class="pad"><p>List some interests, favorite video games, why you want to join, things you can create. A sentence or two is fine. <b>Do NOT</b> put personal information such as your age or email address.</p><textarea id="ab" maxlength="4000" placeholder="About me (up to 4,000 characters)"></textarea></div>' +
      '<h3>Step 3 - Roblox Username</h3><div class="pad"><p>Please put your Roblox username here.</p><p><b>Your account must have some activity on it</b>, such as friends/followers, games, or whatever constitutes activity on Roblox.</p><input id="ru" placeholder="Your Roblox username" maxlength="40"></div>' +
      '<h3>Step 4 - Verification</h3><div class="pad"><p>Copy the entire phrase in the blue box below and paste it into the about section of your social media profile. This is done so that we can verify you aren\'t impersonating someone.</p><div class="bx" id="ph">Loading phrase...</div><button class="btn2 s" id="np" type="button">New Code</button></div>' +
      '<h3>Step 5 - Referral</h3><div class="pad"><p>Enter the referral code here, if you don\'t have one you can leave it blank.</p><p><b>The code owner gets 50 Robux and you get 30 Robux.</b></p><input id="rf" placeholder="Your Referral code" maxlength="40"></div>' +
      '<h3>Step 6 - Captcha</h3><div class="pad"><p>We just have to make sure you aren\'t a robot.</p><div class="bx" id="cp">Captcha not connected yet (provided by the backend).</div></div>' +
      '<div class="pad" style="margin-top:26px"><button class="btn2" id="sb" type="button">Submit Application</button></div></div>';
    host.appendChild(w); var g = function (id) { return w.querySelector("#" + id); }, toast = function (m, bad) { (ui && ui.toast ? ui.toast : bar)(m, bad); };
    g("ast").onclick = function (e) { e.preventDefault(); toast("Status check is not connected yet.", true); };
    // TODO(backend): confirmar o formato de auth.discordStatus (hoje esperamos { connected, username, id }).
    A.call("auth.discordStatus").then(function (r) { r = r || {}; g("dc").innerHTML = r.connected || r.username ? esc("@" + (r.username || "") + (r.id ? " (" + r.id + ")" : "")) : '<a class="btn2" href="' + esc(C.DISCORD_URL || "#") + '">Authorize with Discord</a>'; }).catch(function (e) { g("dc").textContent = "Discord: " + ((e && e.message) || "not connected yet"); });
    // TODO(backend): a frase de verificação TEM que vir do servidor (para ele conseguir conferir depois).
    function phrase() { g("ph").textContent = "Loading phrase..."; A.call("auth.applicationCode").then(function (r) { r = r || {}; g("ph").textContent = r.phrase || r.code || "Not connected yet: the server will generate your phrase."; }).catch(function (e) { g("ph").textContent = "Not connected yet: the server will generate your phrase."; }); }
    g("np").onclick = phrase; phrase();
    g("sb").onclick = function () {
      var body = { about: g("ab").value.trim(), robloxUsername: g("ru").value.trim(), referral: g("rf").value.trim(), phrase: g("ph").textContent };
      if (!body.about || !body.robloxUsername) { toast("Fill in About Me and your Roblox username.", true); return; }
      g("sb").disabled = true; A.call(b.submit, { body: body }).then(function (r) { toast((r && r.message) || "Application submitted."); }).catch(function (e) { toast((e && e.message) || "Could not submit.", true); }).then(function () { g("sb").disabled = false; });
    };
  } };

  // ---- Technical Issues Screen. Quando ativa, cobre TODO o site (inclusive /login) e some com o resto da página.
  // DEMO: a flag fica só neste navegador (localStorage). TODO(backend): ler o estado do servidor (ex.: status do site) e ignorar localStorage.
  // O painel /Admin é outra página e nunca é bloqueado (ele tem a sua própria senha).
  var KEY = "kandi_tech_issues_demo";
  function on() { try { return localStorage.getItem(KEY) === "1"; } catch (e) { return false; } }
  function tis() { var el = document.getElementById("tis"), a = on(); if (a && !el) { el = document.createElement("div"); el.id = "tis"; el.setAttribute("role", "alert"); el.innerHTML = "<span>We're making things more awesome. Be back soon.</span>"; document.body.appendChild(el); } if (!a && el) el.remove(); document.documentElement.classList.toggle("tis-on", a); }
  window.KandiTechIssues = { KEY: KEY, active: on, apply: tis };
  window.addEventListener("storage", function (e) { if (e.key === KEY) tis(); }); document.addEventListener("visibilitychange", tis); tis();
})();
