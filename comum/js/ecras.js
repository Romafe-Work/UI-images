/* =========================================================
   ROMAFE — qual ecrã se vê, e o protótipo

   index.html#ecra=menu          abre nesse ecrã (o editor também o lê)
   index.html#so=ecra&ecra=menu  esse ecrã sem a moldura do editor
   index.html#so=fluxo           só o mapa de navegação
   index.html#doc=fluxo          o editor, já no mapa

   Fora do editor, os ecrãs funcionam como protótipo: clicar numa peça com
   data-ir leva ao ecrã que ela diz. No editor o clique escolhe a peça, e o
   ecrã a que ela leva está no painel de propriedades.
   ========================================================= */
(function () {
  'use strict';

  function ler(chave) {
    var m = new RegExp('(?:^|[#&])' + chave + '=([^&]+)').exec(location.hash);
    return m ? decodeURIComponent(m[1]) : '';
  }

  function existe(nome) {
    return !!(nome && document.querySelector('.ecra[data-ecra="' + nome + '"]'));
  }

  function mostrar(nome) {
    if (!existe(nome)) return false;
    [].forEach.call(document.querySelectorAll('.ecra'), function (e) {
      e.hidden = e.dataset.ecra !== nome;
    });
    /* o hash diz onde se está, para recarregar e voltar ao mesmo ecrã */
    var h = location.hash.replace(/^#/, '').split('&').filter(function (p) {
      return p && p.indexOf('ecra=') !== 0;
    });
    h.push('ecra=' + nome);
    try { history.replaceState(null, '', '#' + h.join('&')); } catch (e) {}
    window.scrollTo(0, 0);
    return true;
  }

  var pedido = ler('ecra');
  if (existe(pedido)) mostrar(pedido);

  var soFluxo = ler('so') === 'fluxo';
  if (ler('so')) document.body.classList.add('so-' + ler('so'));

  /* O protótipo. Corre antes do formulário da entrada, para «Entrar»
     levar à escolha da empresa em vez de mostrar a recusa de exemplo. */
  document.addEventListener('click', function (ev) {
    if (document.body.classList.contains('editando')) return;
    if (document.body.classList.contains('com-fluxo')) return;
    var peca = ev.target.closest && ev.target.closest('[data-ir]');
    if (!peca || !existe(peca.dataset.ir)) return;
    ev.preventDefault();
    ev.stopPropagation();
    mostrar(peca.dataset.ir);
  }, true);

  document.addEventListener('DOMContentLoaded', function () {
    if (soFluxo && window.RomafeFluxo) window.RomafeFluxo.ligar({});
  });

  window.RomafeEcras = { mostrar: mostrar, ler: ler };
})();
