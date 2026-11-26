// ===== DADOS DEMONSTRATIVOS (FICTÍCIOS) =====
// Tudo aqui é inventado só para visualizar o layout. NÃO são dados reais. Será removido na integração com o KSbackend.
(function () {
  var N = ["luna", "kai", "mika", "nova", "zed", "pixel", "rio", "sky", "echo", "bolt", "mint", "dusk", "fox", "ivy", "jazz", "koi"];
  var ST = ["Active", "Active", "Active", "Pending", "Banned"];
  var players = N.map(function (n, i) {
    return { id: 1001 + i, username: "teste_" + n, status: ST[i % 5], robux: (i * 370) % 5000, tickets: (i * 91) % 900, membership: i % 4 === 0 ? "Builders Club" : "None", joined: "2026-0" + (1 + i % 9) + "-" + (10 + i % 18), email: "teste_" + n + "@example.invalid" };
  });
  var D = {
    players: players,
    usernames: players.slice(0, 10).map(function (p, i) { return { id: i + 1, userId: p.id, current: p.username, previous: "old_" + p.username.slice(5), changed: "2026-10-" + (10 + i) }; }),
    inventory: players.slice(0, 10).map(function (p, i) { return { id: 500 + i, owner: p.username, item: ["Pink Cap", "Candy Wings", "Star Shades", "Mint Hair", "Sweet Gear"][i % 5], type: ["Hat", "Back", "Face", "Hair", "Gear"][i % 5], acquired: "2026-10-" + (10 + i) }; }),
    transactions: players.slice(0, 12).map(function (p, i) { return { id: 9000 + i, user: p.username, kind: ["Purchase", "Sale", "Trade", "Promo"][i % 4], amount: (i % 2 ? "+" : "-") + (10 + i * 15), date: "2026-11-" + (1 + i) }; }),
    bans: players.filter(function (p) { return p.status === "Banned"; }).map(function (p, i) { return { id: 70 + i, user: p.username, reason: ["Exploiting", "Harassment", "Scam attempt"][i % 3], by: "teste_staff", date: "2026-11-0" + (1 + i), status: i % 2 ? "Expired" : "Active" }; }),
    assets: [0, 1, 2, 3, 4, 5, 6, 7].map(function (i) { return { id: 3000 + i, name: ["Candy Cap", "Mint Shirt", "Pink Pants", "Star Decal", "Cloud Model", "Heart Mesh", "Pop Audio", "Bow Hat"][i], type: ["Hat", "Shirt", "Pants", "Decal", "Model", "Mesh", "Audio", "Hat"][i], creator: "teste_" + N[i], status: ["Pending", "Approved", "Pending", "Rejected"][i % 4], version: "v" + (1 + i % 3) }; }),
    reports: [0, 1, 2, 3, 4, 5, 6].map(function (i) { return { id: 400 + i, target: ["User", "Game", "Item", "Group", "Message"][i % 5], reporter: "teste_" + N[i], reason: ["Spam", "Inappropriate", "Scam", "Harassment"][i % 4], status: ["Pending", "Pending", "Resolved"][i % 3], date: "2026-11-" + (10 + i) }; }),
    groups: [0, 1, 2, 3, 4].map(function (i) { return { id: 200 + i, name: ["Sweet Builders", "Pink Club", "Mint Team", "Retro Fans", "Candy Devs"][i], owner: "teste_" + N[i], members: 12 + i * 37, roles: 3 + i % 3, status: i === 3 ? "Locked" : "Open" }; }),
    forums: [0, 1, 2, 3, 4, 5].map(function (i) { return { id: 600 + i, title: ["Welcome!", "Bug reports", "Suggestions", "Trading tips", "Showcase", "Off-topic"][i], category: ["General", "Support", "Ideas", "Trade", "Creations", "General"][i], replies: i * 14, author: "teste_" + N[i], status: i === 5 ? "Locked" : "Visible" }; }),
    applications: [0, 1, 2, 3].map(function (i) { return { id: 800 + i, applicant: "teste_" + N[i + 3], kind: ["Account", "Creator", "Staff", "Account"][i], submitted: "2026-11-" + (14 + i), status: "Pending" }; }),
    staff: [["teste_owner", "Owner", true, true, true, true], ["teste_mod", "Moderator", true, true, false, false], ["teste_support", "Support", true, false, false, false]].map(function (r, i) { return { id: i + 1, member: r[0], role: r[1], moderation: r[2], economy: r[3], assets: r[4], permissions: r[5] }; }),
    logs: players.slice(0, 12).map(function (p, i) { return { id: i + 1, staff: "teste_mod", action: ["Approved asset", "Banned user", "Edited alert", "Resolved report"][i % 4], target: p.username, date: "2026-11-" + (12 + i % 10) }; }),
    flags: [{ id: 1, name: "new-catalog-layout", note: "Catalog redesign", on: true }, { id: 2, name: "trade-v2", note: "Trade rework", on: false }, { id: 3, name: "group-wall-reactions", note: "Reactions on group walls", on: false }, { id: 4, name: "dark-mode-default", note: "Default to dark theme", on: true }],
    alerts: [{ id: 1, text: "Demo alert: scheduled maintenance tonight.", level: "Info", active: true }, { id: 2, text: "Demo alert: new event coming soon.", level: "Promo", active: false }]
  };
  // Novos dados fictícios (também demo): assets com tipo de venda, promocodes, cargos e fila do Asset Hub.
  D.assets.forEach(function (a, i) { a.sale = ["Offsale", "Limited", "Limited U", "Onsale"][i % 4]; });
  D.promocodes = [0, 1, 2, 3].map(function (i) { return { id: 90 + i, code: "DEMO" + (i + 1) + "CODE", reward: ["500 Robux", "100 Tix", "Asset #3001", "Face #3005"][i], uses: [3, 40, 0, 12][i] + "/" + [100, 50, 20, 30][i], expires: "2026-12-" + (10 + i), status: i === 1 ? "Expired" : "Active" }; });
  D.roles = [["Owner", 11], ["Admin", 10], ["Asset Mod", 5], ["Moderator", 6], ["Member", 0]].map(function (r, i) { return { id: i + 1, role: r[0], perms: r[1] }; });
  D.hub = [0, 1, 2, 3, 4, 5, 6, 7].map(function (i) { return { id: 1200 + i, name: ["Cool Shirt", "Group logo", "Game thumb", "Event banner", "Sale ad", "Pink Pants", "Club icon", "Mega banner"][i], category: ["Clothing", "Group icon", "Game icon", "Banner", "User ad", "Clothing", "Group icon", "Banner"][i], submitter: "teste_" + N[i], status: ["Pending", "Pending", "Approved", "Pending"][i % 4] }; });
  window.ADMIN_DEMO = {
    data: D,
    stats: { users: 1284, online: 87, games: 214, assets: 12, reports: 9, applications: 4 },
    signups: [12, 18, 15, 25, 31, 22, 40],
    activity: [30, 52, 41, 66, 58, 80, 72],
    recent: ["teste_mod approved asset #3001", "teste_mod resolved report #402", "teste_owner edited a site alert", "teste_support banned teste_zed"]
  };
})();
