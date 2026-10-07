/* =========================================================
   ROMAFE — a base de onde nascem os ecrãs

   O que se repete em todos os ecrãs de uma app (a barra de topo, a
   fotografia, o rodapé) está escrito uma vez só, num <template data-base>.
   Cada ecrã diz de que base nasce e traz apenas o que muda:

     <template data-base="entrada">
       … <slot name="cartao"></slot> …
     </template>

     <div class="ecra" data-ecra="…" data-base="entrada">
       <section data-slot="cartao">…</section>
     </div>

   Corre antes dos outros scripts: quando o editor e o mapa chegam, os
   ecrãs já estão montados e não sabem que vieram de uma base. Mudar a
   base muda todos os ecrãs que nasceram dela.
   ========================================================= */
(function () {
  'use strict';

  function montar(ecra, molde) {
    var copia = molde.content.cloneNode(true);
    var partes = {};
    [].slice.call(ecra.children).forEach(function (filho) {
      if (filho.dataset.slot) partes[filho.dataset.slot] = filho;
    });
    [].slice.call(copia.querySelectorAll('slot')).forEach(function (slot) {
      var parte = partes[slot.getAttribute('name')];
      if (parte) {
        parte.removeAttribute('data-slot');
        slot.replaceWith(parte);
      } else {
        slot.remove();          // o ecrã não traz esta parte: fica sem ela
      }
    });
    ecra.textContent = '';
    ecra.appendChild(copia);
  }

  var moldes = {};
  [].forEach.call(document.querySelectorAll('template[data-base]'), function (t) {
    moldes[t.dataset.base] = t;
  });
  [].forEach.call(document.querySelectorAll('.ecra[data-base]'), function (ecra) {
    var molde = moldes[ecra.dataset.base];
    if (molde) montar(ecra, molde);
    else console.warn('Ecrã ' + ecra.dataset.ecra + ': não há base «' + ecra.dataset.base + '»');
  });
})();
