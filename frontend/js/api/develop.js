// API "develop" - STATUS: NÃO CONECTADA. Preencha p (caminho), svc (serviço), m (método) e adapt depois de ler o controller do backend.
// E(método) cria { m, p: "", svc: "default", auth: true, csrf: true, adapt: null }.
//  - p: caminho, com {id}/{rowId}/... vindos de params. Vazio = a UI mostra "Not connected yet" (nunca falha em silêncio).
//  - adapt(resposta, opções): converte a resposta do backend para o formato que a UI espera (ver PEKORA_BACKEND_INTEGRATION.md).
//  - o método (m) abaixo é um palpite inicial: confirme no backend.
(function () {
  var E = KandiAPI.E;
  KandiAPI.define("develop", {
  badges: E("GET"),
  createBadge: E("POST"),
  createGame: E("POST"),
  createPass: E("POST"),
  createPlace: E("POST"),
  createProduct: E("POST"),
  gameThumbnails: E("GET"),
  generateThumbnail: E("POST"),
  getAsset: E("GET"),
  getBadge: E("GET"),
  getGame: E("GET"),
  getPass: E("GET"),
  getProduct: E("GET"),
  mine: E("GET"),
  moderation: E("GET"),
  passes: E("GET"),
  products: E("GET"),
  updateAsset: E("PATCH"),
  updateBadge: E("PATCH"),
  updateGame: E("PATCH"),
  updatePass: E("PATCH"),
  updatePlace: E("POST"),
  updateProduct: E("PATCH"),
  uploadAsset: E("POST"),
  uploadGameIcon: E("POST"),
  uploadGameThumbnail: E("POST"),
  uploadVersion: E("POST"),
  versions: E("GET")
  });
})();
