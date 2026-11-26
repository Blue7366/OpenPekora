// API "messages" - STATUS: NÃO CONECTADA. Preencha p (caminho), svc (serviço), m (método) e adapt depois de ler o controller do backend.
// E(método) cria { m, p: "", svc: "default", auth: true, csrf: true, adapt: null }.
//  - p: caminho, com {id}/{rowId}/... vindos de params. Vazio = a UI mostra "Not connected yet" (nunca falha em silêncio).
//  - adapt(resposta, opções): converte a resposta do backend para o formato que a UI espera (ver PEKORA_BACKEND_INTEGRATION.md).
//  - o método (m) abaixo é um palpite inicial: confirme no backend.
(function () {
  var E = KandiAPI.E;
  KandiAPI.define("messages", {
  archive: E("POST"),
  get: E("GET"),
  list: E("GET"),
  markUnread: E("POST"),
  send: E("POST"),
  unarchive: E("POST"),
  unreadCount: E("GET")
  });
})();
