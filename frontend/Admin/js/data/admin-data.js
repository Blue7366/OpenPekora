// CAMADA DE DADOS DO ADMIN — único ponto de acesso a dados administrativos.
// Hoje devolve SOMENTE os dados fictícios de demo-data.js (marcados demo:true).
// TODO(backend): quando o KSbackend estiver pronto, troque o corpo de list/get/stats/perform por chamadas reais.
// NÃO invente rotas: confirme cada endpoint com quem fez o backend antes de ligar.
window.AdminData = (function () {
  var D = window.ADMIN_DEMO, wait = function (v) { return new Promise(function (r) { setTimeout(function () { r(v); }, 350); }); };
  return {
    isDemo: true,
    // TODO(backend): listar com busca/filtro/paginação no servidor.
    list: function (src, o) {
      o = o || {}; var rows = (D.data[src] || []).slice(), q = (o.q || "").toLowerCase();
      if (q) rows = rows.filter(function (r) { return JSON.stringify(r).toLowerCase().indexOf(q) > -1; });
      Object.keys(o.filters || {}).forEach(function (k) { var v = o.filters[k]; if (v && v !== "All") rows = rows.filter(function (r) { return String(r[k]) === v; }); });
      var size = o.size || 6, page = o.page || 1;
      return wait({ rows: rows.slice((page - 1) * size, page * size), total: rows.length, page: page, size: size, demo: true });
    },
    // TODO(backend): buscar um registro por ID.
    get: function (src, id) { var r = (D.data[src] || []).filter(function (x) { return String(x.id) === String(id); })[0]; return wait(r ? { row: r, demo: true } : null); },
    // TODO(backend): estatísticas reais do dashboard.
    stats: function () { return wait({ stats: D.stats, signups: D.signups, activity: D.activity, recent: D.recent, demo: true }); },
    // TODO(backend): executar a operação (ban, aprovar, saldo...). Hoje NADA é executado e isso é dito ao usuário.
    // Technical Issues Screen. DEMO: flag só neste navegador (localStorage), lida pelo site em js/extras.js.
    // TODO(backend): salvar/ler o estado no servidor e remover o localStorage.
    techIssues: {
      key: "kandi_tech_issues_demo",
      get: function () { try { return localStorage.getItem("kandi_tech_issues_demo") === "1"; } catch (e) { return false; } },
      set: function (v) { try { localStorage.setItem("kandi_tech_issues_demo", v ? "1" : "0"); return true; } catch (e) { return false; } }
    },
    perform: function (op, payload) { if (window.ADMIN_CONFIG.TEST_MODE) return wait({ ok: true, simulated: true, op: op, message: "Test mode: simulated. Nothing was saved." }); var e = new Error("Not connected to the backend yet. Nothing was executed."); e.notConnected = true; e.op = op; return Promise.reject(e); }
  };
})();
