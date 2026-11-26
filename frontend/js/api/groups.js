// API "groups" - STATUS: NÃO CONECTADA. Preencha p (caminho), svc (serviço), m (método) e adapt depois de ler o controller do backend.
// E(método) cria { m, p: "", svc: "default", auth: true, csrf: true, adapt: null }.
//  - p: caminho, com {id}/{rowId}/... vindos de params. Vazio = a UI mostra "Not connected yet" (nunca falha em silêncio).
//  - adapt(resposta, opções): converte a resposta do backend para o formato que a UI espera (ver PEKORA_BACKEND_INTEGRATION.md).
//  - o método (m) abaixo é um palpite inicial: confirme no backend.
(function () {
  var E = KandiAPI.E;
  KandiAPI.define("groups", {
  mine: E("GET"),
  auditLog: E("GET"),
  changeOwner: E("POST"),
  create: E("POST"),
  createRole: E("POST"),
  deleteRole: E("DELETE"),
  editRole: E("PATCH"),
  games: E("GET"),
  get: E("GET"),
  join: E("POST"),
  leave: E("POST"),
  members: E("GET"),
  payout: E("POST"),
  postWall: E("POST"),
  removeMember: E("DELETE"),
  roles: E("GET"),
  search: E("GET"),
  setMemberRole: E("PATCH"),
  setPrimary: E("POST"),
  updateIcon: E("POST"),
  updateSettings: E("POST"),
  wall: E("GET")
  });
})();
