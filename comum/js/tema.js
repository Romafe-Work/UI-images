/* =========================================================
   ROMAFE — tema
   A mesma chave e o mesmo contrato do site do manual: claro, escuro, auto.
   Corre antes de o corpo pintar, para não haver salto de cor no arranque.
   ========================================================= */
(function () {
  'use strict';

  var CHAVE = 'uiux:tema';

  function guardado() {
    try { return localStorage.getItem(CHAVE) || 'auto'; } catch (e) { return 'auto'; }
  }

  function aplicar(modo) {
    var raiz = document.documentElement;
    // "auto" não escreve nada: quem decide é o sistema, pela regra
    // prefers-color-scheme em tokens.css.
    if (modo === 'auto') raiz.removeAttribute('data-theme');
    else raiz.setAttribute('data-theme', modo);
    try { localStorage.setItem(CHAVE, modo); } catch (e) {}
    marcar(modo);
  }

  function marcar(modo) {
    var botoes = document.querySelectorAll('.segmented__btn[data-tema]');
    for (var i = 0; i < botoes.length; i++) {
      botoes[i].setAttribute('aria-pressed', String(botoes[i].dataset.tema === modo));
    }
  }

  aplicar(guardado());

  document.addEventListener('DOMContentLoaded', function () {
    marcar(guardado());
    document.addEventListener('click', function (ev) {
      var btn = ev.target.closest('.segmented__btn[data-tema]');
      if (btn) aplicar(btn.dataset.tema);
    });
  });

  window.RomafeTema = { aplicar: aplicar, actual: guardado };
})();
