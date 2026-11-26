// Definição das páginas do admin (dados de layout, não de backend). Cada página usa AdminUI + AdminData.
// Fonte "src" = chave em AdminData.list(). TODO(backend): confirmar o mapeamento de cada fonte com o KSbackend.
window.AdminPages = (function () {
  var U = window.AdminUI, D = window.AdminData, S = ["All", "Active", "Pending", "Banned"];
  var TYPES = ["Hat", "Hair Accessory", "Face Accessory", "Neck Accessory", "Shoulder Accessory", "Front Accessory", "Back Accessory", "Waist Accessory", "T-Shirt", "Shirt", "Pants", "Classic Face", "Gear", "Package", "Head", "Torso", "Left Arm", "Right Arm", "Left Leg", "Right Leg", "Animation", "Emote", "Decal", "Image", "Audio", "Video", "Mesh", "Model", "Plugin", "Badge", "Game Pass", "NGC"], SALEF_ALL = [["sale", "Sale status", "select", ["Offsale", "Onsale", "Limited", "Limited U"]], ["days", "Offsale time (days, 0 = forever)", "number"], ["price", "Price (Robux)", "number"], ["stock", "Stock (limiteds only)", "number"]];
  // Limited / Limited U só aparecem para cargos com permissão (config LIMITED_ROLES).
  function saleFields() { var ok = window.ADMIN_CONFIG.LIMITED_ROLES.indexOf(window.ADMIN_CONFIG.DEMO_ROLE) > -1; return SALEF_ALL.map(function (f) { return f[0] === "sale" && !ok ? [f[0], f[1] + " (limiteds need the Publish limiteds permission)", "select", ["Offsale", "Onsale"]] : f; }); }
  var T = function (id, t, i, d, cfg) { return { id: id, t: t, i: i, d: d, cfg: cfg }; };
  var F = function (id, t, i, d, fields, ok) { return { id: id, t: t, i: i, d: d, form: { fields: fields, ok: ok } }; };
  var LIST = [
    { id: "dashboard", t: "Dashboard", i: "dash", d: "Platform overview", kind: "dash" },
    T("players", "Players", "users", "Browse and search users", { src: "players", cols: [["id", "ID"], ["username", "Username", "link", "#user/{id}"], ["status", "Status", "badge"], ["robux", "Robux"], ["joined", "Joined"]], filters: [["status", S]], row: [["Manage", "#user/{id}"]] }),
    { id: "user/:id", t: "Manage User", i: "user", d: "Single account", kind: "user", hide: true },
    { id: "manage-user", t: "Manage User", i: "user", d: "Pick a player to manage", kind: "pick" },
    T("usernames", "Usernames", "tag", "Username history", { src: "usernames", cols: [["userId", "User ID"], ["current", "Current"], ["previous", "Previous"], ["changed", "Changed"]], row: [["Revert", 0, "Revert this username? (needs backend)", 1, "usernames.revert"]] }),
    T("inventory", "Inventory", "box", "User inventories", { src: "inventory", cols: [["owner", "Owner"], ["item", "Item"], ["type", "Type"], ["acquired", "Acquired"]], row: [["Remove", 0, "Remove this item from the inventory?", 1, "inventory.remove"]] }),
    T("transactions", "Transactions", "card", "Transaction history", { src: "transactions", cols: [["id", "ID"], ["user", "User"], ["kind", "Type"], ["amount", "Amount"], ["date", "Date"]], filters: [["kind", ["All", "Purchase", "Sale", "Trade", "Promo"]]] }),
    T("bans", "Bans", "ban", "View and manage bans", { src: "bans", cols: [["user", "User"], ["reason", "Reason"], ["by", "By"], ["date", "Date"], ["status", "Status", "badge"]], toolbar: [["New ban", "bans.create", [["user", "Username"], ["reason", "Reason", "textarea"]]]], row: [["Unban", 0, "Lift this ban?", 0, "bans.lift"]] }),
    T("asset-hub", "Asset Hub", "inbox", "Moderators review clothing, images, group/game icons, banners and user ads", { src: "hub", cols: [["id", "ID"], ["name", "Name"], ["category", "Category"], ["submitter", "Submitter"], ["status", "Status", "badge"]], filters: [["category", ["All", "Clothing", "Image", "Group icon", "Game icon", "Banner", "User ad"]], ["status", ["All", "Pending", "Approved", "Rejected"]]], row: [["Approve", 0, "Approve this submission?", 0, "hub.approve"], ["Reject", 0, "Reject this submission?", 1, "hub.reject"]] }),
    T("promocodes", "Promocodes", "tag", "Codes that give Robux, Tix or an item/face", { src: "promocodes", cols: [["code", "Code"], ["reward", "Reward"], ["uses", "Uses"], ["expires", "Expires"], ["status", "Status", "badge"]], toolbar: [["New promocode", "promocodes.create", [["code", "Code"], ["days", "Valid for (days)", "number"], ["uses", "Max uses", "number"], ["type", "Reward type", "select", ["Robux", "Tix", "Asset", "Face"]], ["value", "Amount or asset ID"]]]], row: [["Revoke", 0, "Revoke this code?", 1, "promocodes.revoke"]] }),
    { id: "roles", t: "Roles", i: "shield", d: "Role permissions (only high roles can edit)", kind: "roles" },
    { id: "economy", t: "Economy", i: "card", d: "Give currency or reset a user's economy", forms: [
      { h: "Give Robux / Tix", op: "economy.give", ok: "Give", fields: [["user", "Username"], ["robux", "Robux", "number"], ["tix", "Tix", "number"]] },
      { h: "Eco reset", op: "economy.reset", ok: "Eco reset", danger: 1, note: "Removes ONLY the user's limiteds, Robux and Tix. Nothing else.", fields: [["user", "Username"]] }] },
    T("assets", "Assets", "box", "Approval, versions, item info", { src: "assets", cols: [["id", "ID"], ["name", "Name"], ["type", "Type"], ["creator", "Creator"], ["version", "Version"], ["sale", "Sale", "sale"], ["status", "Status", "badge"]], filters: [["status", ["All", "Pending", "Approved", "Rejected"]]], row: [["Approve", 0, "Approve this asset?", 0, "assets.approve"], ["Reject", 0, "Reject this asset?", 1, "assets.reject"]] }),
    { id: "asset-creation", t: "Asset Creation", i: "plus", d: "Publish from a Roblox link or upload a model file", forms: [
      { h: "1. Publish a Roblox asset by link", op: "assets.publishLink", ok: "Publish", note: "The backend publishes it using rccservice2020. Not connected yet.", fields: [["link", "Roblox asset link"], ["type", "Type", "select", TYPES], ["name", "Name"]].concat(saleFields()) },
      { h: "2. Upload a Roblox model file", op: "assets.uploadFile", ok: "Upload", note: "Accepts .rbxm / .rbxmx. For classic faces you can also paste the face URL.", fields: [["file", "Model file", "file"], ["faceUrl", "Classic face URL (optional, not dynamic)"], ["type", "Type", "select", TYPES], ["name", "Name"]].concat(saleFields()) },
      { h: "3. Publish a face by PNG", op: "assets.publishFacePng", ok: "Publish face", note: "Classic face (not dynamic). PNG only, up to 1 MB. Not connected yet.", fields: [["png", "PNG file", "png"], ["name", "Name"]].concat(saleFields()) }] },
    T("reports", "Reports", "flag", "Reports and moderation", { src: "reports", cols: [["id", "ID"], ["target", "Target"], ["reporter", "Reporter"], ["reason", "Reason"], ["date", "Date"], ["status", "Status", "badge"]], filters: [["status", ["All", "Pending", "Resolved"]]], row: [["Resolve", 0, "Mark this report as resolved?", 0, "reports.resolve"], ["Dismiss", 0, "Dismiss this report?", 1, "reports.dismiss"]] }),
    T("groups", "Groups", "group", "Groups, members, roles", { src: "groups", cols: [["id", "ID"], ["name", "Name"], ["owner", "Owner"], ["members", "Members"], ["roles", "Roles"], ["status", "Status", "badge"]], row: [["Lock", 0, "Lock this group?", 1, "groups.lock"]] }),
    T("forums", "Forums", "chat", "Topics and replies", { src: "forums", cols: [["id", "ID"], ["title", "Topic"], ["category", "Category"], ["author", "Author"], ["replies", "Replies"], ["status", "Status", "badge"]], row: [["Lock", 0, "Lock this topic?", 1, "forums.lock"], ["Delete", 0, "Delete this topic?", 1, "forums.delete"]] }),
    T("applications", "Applications", "inbox", "Pending applications", { src: "applications", cols: [["id", "ID"], ["applicant", "Applicant"], ["kind", "Type"], ["submitted", "Submitted"], ["status", "Status", "badge"]], row: [["Accept", 0, "Accept this application?", 0, "applications.accept"], ["Deny", 0, "Deny this application?", 1, "applications.deny"]] }),
    { id: "permissions", t: "Permissions", i: "shield", d: "Staff permissions", kind: "perms" },
    T("logs", "Logs", "clock", "Admin activity history", { src: "logs", cols: [["id", "ID"], ["staff", "Staff"], ["action", "Action"], ["target", "Target"], ["date", "Date"]] }),
    { id: "feature-flags", t: "Feature Flags", i: "toggle", d: "Experimental features", kind: "flags" },
    F("messages", "Messages", "mail", "Send admin messages to users", [["to", "To (username)"], ["subject", "Subject"], ["body", "Message", "textarea"]], "Send message"),
    { id: "tech-issues", t: "Technical Issues Screen", i: "bell", d: "Lock the whole site behind a maintenance screen", kind: "tech" },
    { id: "site-alerts", t: "Site Alerts", i: "bell", d: "Notices shown on the site", kind: "alerts" }
  ];
  function head(p) { return '<div class="ph"><div><h1>' + p.t + "</h1><p>" + p.d + "</p></div></div>"; }
  var K = {
    dash: function (el, p) {
      U.states(el, "load");
      D.stats().then(function (r) { var s = r.stats;
        el.innerHTML = head(p) + '<p class="dm">Demo data: fictional numbers for layout only.</p><div class="gr">' + U.card("Total users", s.users, "users") + U.card("Online", s.online, "user") + U.card("Games", s.games, "dash") + U.card("Pending assets", s.assets, "box") + U.card("Pending reports", s.reports, "flag") + U.card("Pending applications", s.applications, "inbox") + "</div>" +
          '<div class="g2"><section class="pn"><h3>New users (7 days)</h3>' + U.chart(r.signups) + '</section><section class="pn"><h3>Admin actions (7 days)</h3>' + U.chart(r.activity, "bar") + '</section></div><section class="pn"><h3>Recent activity</h3><ul class="rc">' + r.recent.map(function (x) { return "<li>" + U.esc(x) + "</li>"; }).join("") + "</ul></section>";
      }).catch(function (e) { U.states(el, "err", e.message, function () { K.dash(el, p); }); });
    },
    pick: function (el, p) { el.innerHTML = head(p) + '<div class="pn">Open a player from <a href="#players">Players</a> and press Manage.</div>'; },
    user: function (el, p, id) {
      U.states(el, "load");
      D.get("players", id).then(function (r) {
        if (!r) { U.states(el, "empty", "Player not found."); return; } var u = r.row, ops = [["Ban", "user.ban", 1, [["reason", "Reason", "textarea"]]], ["Unban", "user.unban", 0, []], ["Edit info", "user.edit", 0, [["username", "Username"], ["email", "Email", "email"]]], ["Adjust balance", "user.balance", 0, [["robux", "Robux (+/-)", "number"], ["tickets", "Tix (+/-)", "number"]]], ["Eco reset", "economy.reset", 1, []]];
        el.innerHTML = '<a class="bk" href="#players">&lsaquo; Players</a><div class="uh"><div class="av">' + U.esc(u.username.slice(6, 8).toUpperCase()) + "</div><div><h1>" + U.esc(u.username) + "</h1><p>User ID " + u.id + " · " + U.badge(u.status) + '</p></div><div class="ua">' + ops.map(function (o, i) { return '<button class="b' + (o[2] ? " d" : "") + '" data-o="' + i + '">' + o[0] + "</button>"; }).join("") + "</div></div>" +
          '<p class="dm">Demo data. Actions open a confirmation but are not executed (no backend).</p><div class="gr">' + U.card("Robux", u.robux, "card") + U.card("Tickets", u.tickets, "tag") + U.card("Membership", u.membership, "shield") + U.card("Joined", u.joined, "clock") + "</div>" +
          '<div class="tabs" id="tb">' + ["Account", "Inventory", "Transactions", "History", "Permissions"].map(function (t, i) { return '<a data-t="' + t + '"' + (i ? "" : ' class="on"') + ">" + t + "</a>"; }).join("") + '</div><section class="pn" id="tc"></section>';
        el.onclick = function (e) { var b = e.target.closest("[data-o]"); if (b) { var o = ops[+b.dataset.o]; U.modal({ title: o[0] + " - " + u.username, op: o[1], fields: o[3], danger: o[2], ok: o[0] }); } };
        var tabs = { Account: function (c) { c.innerHTML = '<dl class="kv"><dt>Username</dt><dd>' + U.esc(u.username) + "</dd><dt>User ID</dt><dd>" + u.id + "</dd><dt>Email</dt><dd>" + U.esc(u.email) + "</dd><dt>Status</dt><dd>" + u.status + "</dd></dl>"; },
          Inventory: function (c) { U.table(c, { src: "inventory", cols: [["item", "Item"], ["type", "Type"], ["acquired", "Acquired"]] }); }, Transactions: function (c) { U.table(c, { src: "transactions", cols: [["kind", "Type"], ["amount", "Amount"], ["date", "Date"]] }); },
          History: function (c) { U.table(c, { src: "logs", cols: [["action", "Action"], ["staff", "Staff"], ["date", "Date"]] }); }, Permissions: function (c) { c.innerHTML = '<p>Roles and permissions come from the backend. <a href="#permissions">View staff permissions</a>.</p>'; } };
        function show(n) { U.$$("#tb a").forEach(function (a) { a.classList.toggle("on", a.dataset.t === n); }); tabs[n](U.$("#tc")); } show("Account");
        U.$("#tb").onclick = function (e) { var a = e.target.closest("a"); if (a) show(a.dataset.t); };
      }).catch(function (e) { U.states(el, "err", e.message, function () { K.user(el, p, id); }); });
    },
    perms: function (el, p) {
      U.states(el, "load");
      D.list("staff", { size: 50 }).then(function (r) { var cols = [["moderation", "Moderation"], ["economy", "Economy"], ["assets", "Assets"], ["permissions", "Permissions"]];
        el.innerHTML = head(p) + '<p class="dm">Demo data. Toggling opens a confirmation; nothing is saved.</p><div class="tw"><table><thead><tr><th>Member</th><th>Role</th>' + cols.map(function (c) { return "<th>" + c[1] + "</th>"; }).join("") + "</tr></thead><tbody>" + r.rows.map(function (x, ri) { return "<tr><td>" + U.esc(x.member) + "</td><td>" + U.esc(x.role) + "</td>" + cols.map(function (c) { return '<td data-l="' + c[1] + '"><button class="sw' + (x[c[0]] ? " on" : "") + '" data-m="' + x.member + "|" + c[1] + '" aria-label="' + c[1] + '" aria-pressed="' + !!x[c[0]] + '"></button></td>'; }).join("") + "</tr>"; }).join("") + "</tbody></table></div>";
        el.onclick = function (e) { var b = e.target.closest("[data-m]"); if (b) { var m = b.dataset.m.split("|"); U.modal({ title: "Change " + m[1] + " for " + m[0], text: "Change this permission?", op: "permissions.set", ok: "Change" }); } };
      }).catch(function (e) { U.states(el, "err", e.message, function () { K.perms(el, p); }); });
    },
    flags: function (el, p) { K.toggles(el, p, "flags", "feature-flags.set", function (x) { return "<b>" + U.esc(x.name) + "</b><small>" + U.esc(x.note) + "</small>"; }, "on"); },
    alerts: function (el, p) { K.toggles(el, p, "alerts", "alerts.set", function (x) { return "<b>" + U.esc(x.text) + "</b><small>" + x.level + "</small>"; }, "active", [["New alert", "alerts.create", [["text", "Alert text", "textarea"], ["level", "Level", "select", ["Info", "Promo"]]]]]); },
    toggles: function (el, p, src, op, label, key, tools, after) {
      U.states(el, "load");
      D.list(src, { size: 50 }).then(function (r) {
        el.innerHTML = head(p) + '<p class="dm">Demo data. Switching opens a confirmation; nothing is saved.</p>' + (tools || []).map(function (t, i) { return '<button class="b" data-n="' + i + '">' + t[0] + "</button>"; }).join("") + '<section class="pn">' + r.rows.map(function (x) { return '<div class="tr"><div>' + label(x) + '</div><button class="sw' + (x[key] ? " on" : "") + '" data-id="' + x.id + '" aria-pressed="' + !!x[key] + '" aria-label="Toggle"></button></div>'; }).join("") + "</section>";
        el.onclick = function (e) { var b = e.target.closest("[data-id]"), n = e.target.closest("[data-n]"); if (b) U.modal({ title: "Change setting #" + b.dataset.id, text: "Switch this on/off?", op: op, ok: "Switch" }); if (n) { var t = tools[+n.dataset.n]; U.modal({ title: t[0], op: t[1], fields: t[2], ok: "Create" }); } }; if (after) after(el);
      }).catch(function (e) { U.states(el, "err", e.message, function () { K.toggles(el, p, src, op, label, key, tools, after); }); });
    }
  };
  function field(f) { return f[2] === "png" ? "<label>" + f[1] + '<input type="file" accept="image/png,.png" data-png><span class="pv"></span></label>' : "<label>" + f[1] + (f[2] === "textarea" ? '<textarea rows="4"></textarea>' : f[2] === "select" ? "<select>" + f[3].map(function (o) { return "<option>" + o + "</option>"; }).join("") + "</select>" : '<input type="' + (f[2] || "text") + '">') + "</label>"; }
  function forms(el, p) {
    el.innerHTML = head(p) + '<p class="dm">Layout only. Nothing is sent: the backend is not connected.</p>' + (p.id === "asset-creation" ? '<p class="lg2">Limited symbols: ' + U.lim("Limited") + " " + U.lim("Limited U") + "</p>" : "") +
      p.forms.map(function (f, i) { return '<form class="pn fm" data-i="' + i + '"><h3>' + f.h + "</h3>" + (f.note ? '<p class="dm">' + f.note + "</p>" : "") + f.fields.map(field).join("") + '<button class="b' + (f.danger ? " d" : "") + '">' + f.ok + "</button></form>"; }).join("");
    U.$$("[data-png]", el).forEach(function (i) { i.onchange = function () {
      var pv = i.nextSibling, f = i.files[0]; pv.innerHTML = ""; i.dataset.ok = "";
      if (!f) return; if (f.type !== "image/png" || !/\.png$/i.test(f.name)) { pv.textContent = "Only PNG files are accepted."; i.value = ""; return; }
      if (f.size > 1048576) { pv.textContent = "File is larger than 1 MB."; i.value = ""; return; }
      var u = URL.createObjectURL(f), im = new Image(); im.alt = "Face preview"; im.onload = function () { pv.appendChild(im); pv.appendChild(document.createTextNode(" " + im.naturalWidth + "x" + im.naturalHeight)); i.dataset.ok = "1"; URL.revokeObjectURL(u); }; im.onerror = function () { pv.textContent = "Could not read this PNG."; i.value = ""; }; im.src = u; }; });
    el.onsubmit = function (e) { e.preventDefault(); var f = p.forms[+e.target.dataset.i], pi = U.$("[data-png]", e.target); if (pi && !pi.dataset.ok) { U.toast("Choose a valid PNG first.", "warn"); return; } U.modal({ title: f.ok, text: f.danger ? f.note + " Continue?" : "Confirm?", op: f.op, danger: f.danger, ok: f.ok }); };
  }
  K.tech = function (el, p) {
    var T = D.techIssues, on = T.get();
    el.innerHTML = head(p) + '<section class="pn"><p class="dm">DEMO: this switch only affects THIS browser until the backend stores it.</p><div class="tr"><div><b>Technical Issues Screen</b><small id="ts">' + (on ? "ON: all site pages show the maintenance screen." : "OFF: the site works normally.") + '</small></div><button class="sw' + (on ? " on" : "") + '" id="tsw" aria-pressed="' + on + '" aria-label="Toggle technical issues screen"></button></div><p>When ON, every page of the site (including /login) shows the maintenance screen and visitors cannot leave it. Only /Admin stays reachable (it asks for its own password).</p><a class="b g" href="../app.html" target="_blank" rel="noopener">Open site to preview</a></section>';
    U.$("#tsw", el).onclick = function () { var v = !T.get(); U.modal({ title: v ? "Turn ON the Technical Issues Screen?" : "Turn it OFF?", text: v ? "All site pages will be replaced by the maintenance screen in this browser (demo)." : "The site will work normally again.", ok: v ? "Turn on" : "Turn off", danger: v, op: "techIssues.set", onOk: function () { if (!T.set(v)) { U.toast("Could not save in this browser.", "warn"); return; } K.tech(el, p); U.toast(v ? "Technical Issues Screen is ON (demo, this browser)." : "Technical Issues Screen is OFF.", "ok"); } }); };
  };
  K.roles = function (el, p) {
    var PM = ["Manage Robux/Tix", "Eco reset", "Ban users", "Approve assets", "Asset Hub", "Create assets", "Publish limiteds", "Promocodes", "Edit roles", "Site banner & alerts", "Messages", "View logs"], cf = window.ADMIN_CONFIG, can = cf.HIGH_ROLES.indexOf(cf.DEMO_ROLE) > -1,
      ON = { Owner: PM, Admin: PM, "Asset Mod": ["Approve assets", "Asset Hub", "Create assets", "View logs"], Moderator: ["Ban users", "Messages", "View logs", "Asset Hub"], Member: [] };
    U.states(el, "load");
    D.list("roles", { size: 20 }).then(function (r) {
      el.innerHTML = head(p) + '<p class="dm">Demo data. Viewing as: ' + cf.DEMO_ROLE + (can ? "" : " (read only: only high roles can edit)") + "</p>" + r.rows.map(function (x) { return '<section class="pn"><h3>' + U.esc(x.role) + '</h3><div class="pm">' + PM.map(function (m) { return "<label><input type=\"checkbox\"" + (ON[x.role].indexOf(m) > -1 ? " checked" : "") + (can && x.role !== "Member" ? "" : " disabled") + "> " + m + "</label>"; }).join("") + "</div>" + (x.role === "Member" ? '<p class="dm">Members can never publish limiteds or use staff tools.</p>' : can ? '<button class="b s" data-s="' + x.role + '">Save permissions</button>' : "") + "</section>"; }).join("");
      el.onclick = function (e) { var b = e.target.closest("[data-s]"); if (b) U.modal({ title: "Save permissions for " + b.dataset.s, text: "Change what this role can do?", op: "roles.setPermissions", ok: "Save" }); };
    }).catch(function (e) { U.states(el, "err", e.message, function () { K.roles(el, p); }); });
  };
  K.alerts = function (el, p) {
    K.toggles(el, p, "alerts", "alerts.set", function (x) { return "<b>" + U.esc(x.text) + "</b><small>" + x.level + "</small>"; }, "active", [["New alert", "alerts.create", [["text", "Alert text", "textarea"], ["level", "Level", "select", ["Info", "Promo"]]]]], function () { mk(); });
    function mk() {
    var box = document.createElement("section"); box.className = "pn"; box.innerHTML = '<h3>Top banner</h3><div id="bp" class="bp"></div><div class="fm"><label>Banner text<input id="bt" value="Found a bug on Project Kandi? Then click on this message to report it and get rewards!"></label><label>Background color<input id="bb" type="color" value="#f5a623"></label><label>Text color<input id="bf" type="color" value="#ffffff"></label><button class="b" id="bs">Save banner</button></div>';
    var up = function () { var b = U.$("#bp", box); b.textContent = U.$("#bt", box).value; b.style.background = U.$("#bb", box).value; b.style.color = U.$("#bf", box).value; };
    box.oninput = up; U.$("#bs", box).onclick = function () { U.modal({ title: "Save banner", text: "Change the banner shown on the site?", op: "banner.set", ok: "Save" }); };
    up(); el.insertBefore(box, el.children[0].nextSibling);
    }
  };
  function render(el, p, id) {
    if (p.forms) { return forms(el, p); }
    if (p.cfg) { el.innerHTML = head(p) + '<div id="dt"></div>'; U.table(U.$("#dt", el), p.cfg); }
    else if (p.form) { el.innerHTML = head(p) + '<form class="pn fm"><p class="dm">Form layout only. Submitting is not connected to the backend.</p>' + p.form.fields.map(function (f) { return "<label>" + f[1] + (f[2] === "textarea" ? '<textarea rows="4"></textarea>' : f[2] === "select" ? "<select>" + f[3].map(function (o) { return "<option>" + o + "</option>"; }).join("") + "</select>" : '<input type="' + (f[2] || "text") + '">') + "</label>"; }).join("") + '<button class="b">' + p.form.ok + "</button></form>"; U.$("form", el).onsubmit = function (e) { e.preventDefault(); U.modal({ title: p.form.ok, text: "Send this?", op: p.id + ".submit", ok: p.form.ok }); }; }
    else K[p.kind](el, p, id);
  }
  return { list: LIST, render: render };
})();
