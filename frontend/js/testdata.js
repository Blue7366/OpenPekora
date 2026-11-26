// DADOS DO MODO TESTE (TEST_MODE = true). Tudo aqui é fictício, chama "Teste" e some quando TEST_MODE = false.
// Cada chave é o nome de um método de KandiAPI; "w:nome" personaliza a resposta SIMULADA de uma escrita.
// NÃO VERIFICADO: os formatos abaixo seguem o que a UI de js/pages.js lê hoje; confira com o backend real (ver kandi_new_fetures.txt).
(function () {
  var G = { id: 1, name: "Teste Game", thumbnail: "", playing: 12, likeRatio: 90, url: "#games/1" };
  var I = { id: 1, name: "Teste Hat", creator: "Teste", thumbnail: "", price: 10, sales: 5, isNew: true, url: "#catalog/1" };
  var L = { id: 2, name: "Teste Limited", creator: "Teste", thumbnail: "", price: 275, value: 300, sales: 2, url: "#catalog/2" };
  var R = { id: 1, title: "Teste Group", subtitle: "3 members", meta: "", thumbnail: "", href: "#groups/1" };
  var U = { id: 1, title: "Teste", subtitle: "Test user", meta: "", thumbnail: "", href: "#users/1" };
  var lst = function (a) { return { items: a, total: a.length, page: 1, hasMore: false }; };
  var det = function (t, d, x) { return Object.assign({ title: t, subtitle: "By Teste", thumbnail: "", description: d, stats: [], sections: [] }, x || {}); };
  window.KandiTestData = {
    "auth.me": { username: "Teste", currency: 1000, tickets: 500, events: 0 },
    "site.home": { continue: [G], popular: [G], feed: [], blog: [], events: [] },
    "games.search": lst([G]), "games.favorites": lst([G]), "games.recommendations": lst([G]), "games.get": det("Teste Game", "Test mode game. Nothing here is real."),
    "catalog.search": lst([I, L]), "catalog.limiteds": lst([L]), "catalog.recommendations": lst([I]), "catalog.get": det("Teste Hat", "Test mode item.", { price: 10 }),
    "groups.search": lst([R]), "groups.mine": { groups: [R] }, "groups.get": det("Teste Group", "Test mode group."),
    "users.search": lst([U]), "users.get": { id: 1, username: "Teste", thumbnail: "", description: "Test mode user.", stats: [], sections: [] },
    "inventory.list": lst([I]), "inventory.collectibles": lst([L]), "users.inventory": lst([I]), "users.collectibles": lst([L]),
    "develop.mine": lst([G]), "friends.list": lst([U]), "trades.list": lst([]),
    "economy.transactions": { rows: [{ id: 1, title: "Teste purchase", subtitle: "-10 Robux", meta: "test" }] },
    "avatar.items": lst([I]), "membership.tiers": { tiers: [], membership: null },
    "auth.discordStatus": { connected: true, username: "teste", id: "0", simulated: true },
    "auth.applicationCode": { code: "kandi-teste-4821", simulated: true },
    "auth.applicationStatus": { status: "pending", message: "Test mode: your application is pending (simulated).", simulated: true },
    "referral.get": { code: "TESTE", uses: 0 }
  };
})();
