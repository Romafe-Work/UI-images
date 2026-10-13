/* =========================================================
   GOPARTS — 12 · Histórico de pedidos v3 (13 out. 2026)
   Ela, com a imagem do GO REPAIR: «quando clico num pedido queria mostrar de
   outra forma». Na v2 o pedido abria os artigos por baixo da linha; aqui abre
   um painel à direita e a lista fica à vista: o número e o estado, o percurso
   (recebido → separado → expedido → entregue), os artigos com pedida, servida
   e pendente, os totais, a morada e as ações (repetir, guia, fatura).
   Parte do HTML da v2; o painel enche-se em comportamento/pedidos-v3.ts.
   ========================================================= */
import pedidosV2 from './pedidos-v2.html?raw';

function construir(): string {
  let h = pedidosV2.replace(/\bped2-/g, 'ped3-');
  h = h.replace('portal--ped2"', 'portal--ped2 portal--ped3"');
  h = h.replace('<main class="ped2" data-pedidos>', '<main class="ped2 ped3" data-pedidos>');
  /* os artigos já não abrem por baixo da linha: saem as linhas de detalhe */
  h = h.replace(/\s*<tr class="ped2__detalhe"[\s\S]*?<\/tr>/g, '');
  /* cada pedido abre o painel */
  h = h.replace(/aria-expanded="false" aria-controls="ped3-linha-\d+"/g, 'aria-expanded="false" aria-controls="ped3-painel" aria-haspopup="dialog"');
  /* o painel, no fim do portal */
  h = h.replace(/<\/main>\s*<\/div>\s*$/, `</main>
  <aside class="ped3__painel" id="ped3-painel" role="dialog" aria-modal="false" aria-labelledby="ped3-p-num" hidden></aside>
</div>`);
  return h;
}

export const pedidosV3 = construir();
