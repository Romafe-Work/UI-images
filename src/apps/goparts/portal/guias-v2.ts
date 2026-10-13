/* =========================================================
   GOPARTS — 13 · Guias de remessa v2 (13 out. 2026)
   Ela, com a imagem das guias do GO REPAIR (vazia): «faz este screen com exemplos
   e animações» e «coloca animações e todos os estados possíveis». No estilo dos
   Pedidos v3: o título com o resumo, os filtros no cartão azul (datas, n.º da guia,
   referência) e o tipo em separadores (Todas · Faturas · Notas de crédito), e a
   tabela com as colunas do GO REPAIR — guia, data, tipo, morada, pedido,
   observações, bruto, desconto, embalagens, portes, base tributável, IVA, total.
   Clicar numa guia abre o painel à direita (comportamento/guias-v2.ts).
   Os estados (13.1 a 13.9) estão em estados.ts.
   ========================================================= */
import { GUIAS, base, iva, total, euros, type Guia } from './guias-dados';
import calendar from 'lucide-static/icons/calendar.svg?raw';
import hash from 'lucide-static/icons/hash.svg?raw';
import barcode from 'lucide-static/icons/barcode.svg?raw';
import eraser from 'lucide-static/icons/eraser.svg?raw';
import search from 'lucide-static/icons/search.svg?raw';
import fileText from 'lucide-static/icons/file-text.svg?raw';
import receipt from 'lucide-static/icons/receipt.svg?raw';
import undo from 'lucide-static/icons/undo-2.svg?raw';
import layers from 'lucide-static/icons/layers.svg?raw';

export const L = (raw: string, cls = '') => raw.replace(/<!--[\s\S]*?-->/, '').replace(/\s+class="[^"]*"/, '').replace('<svg', `<svg${cls ? ` class="${cls}"` : ''} aria-hidden="true"`).replace(/\n\s*/g, '');
const num = (n: number) => (n ? euros(n) : '<span class="ped2__discreto">—</span>');
export const tipoPilula = (g: Guia) => g.tipo === 'fatura'
  ? `<span class="ped2__estado gui2__tipo gui2__tipo--fatura">${L(receipt)}Fatura</span>`
  : `<span class="ped2__estado gui2__tipo gui2__tipo--credito">${L(undo)}Nota de crédito</span>`;

export const linhaGuia = (g: Guia, i: number) => `<tr class="ped2__linha gui2__linha" data-tipo="${g.tipo}" data-guia="${g.num}" style="--i:${i}">
  <td><button type="button" class="ped2__abrir gui2__abrir" aria-expanded="false" aria-controls="gui2-painel" aria-haspopup="dialog"><span class="ped2__num">${g.num}</span></button><span class="ped2__discreto">${g.doc}</span></td>
  <td>${g.data}</td><td>${tipoPilula(g)}</td>
  <td><span class="ped2__morada">${g.morada[0]}</span><span class="ped2__discreto">${g.morada[1]}</span></td>
  <td><span class="gui2__pedido">${g.pedido}</span></td><td class="ped2__obs">${g.obs}</td>
  <td class="erp-num">${euros(g.bruto)}</td><td class="erp-num">${num(-g.desconto)}</td><td class="erp-num">${num(g.embalagens)}</td><td class="erp-num">${num(g.portes)}</td>
  <td class="erp-num">${euros(base(g))}</td><td class="erp-num">${euros(iva(g))}</td><td class="erp-num ped2__valor">${euros(total(g))}</td>
</tr>`;

const campo = (id: string, rotulo: string, icone: string, input: string) =>
  `<div class="campo"><label class="campo__label" for="gui2-${id}">${rotulo}</label><div class="campo__caixa"><span class="campo__chip" aria-hidden="true">${L(icone)}</span>${input}</div></div>`;
const nFaturas = GUIAS.filter((g) => g.tipo === 'fatura').length;
const somaTotal = GUIAS.reduce((s, g) => s + total(g), 0);

export const guiasV2 = `<div class="portal portal--v3 portal--v22 portal--noite portal--ped2 portal--gui2">
  <main class="ped2 gui2" data-guias>
    <header class="ped2__cabeca">
      <div><h1 class="ped2__titulo">Guias de remessa</h1><p class="ped2__sub">As guias das suas encomendas e as notas de crédito das devoluções.</p></div>
      <div class="ped2__resumo" aria-live="polite"><span><strong class="ped2__conta">${GUIAS.length}</strong> guias</span><span><strong class="ped2__total" data-valor="${somaTotal}">${euros(somaTotal)}</strong> com IVA</span></div>
    </header>

    <section class="ped2__filtros c22__cartao c22__cartao--azul">
      <div class="ped2__campos">
        ${campo('de', 'Data a partir de', calendar, '<input class="input" id="gui2-de" type="text" value="01/03/2024" inputmode="numeric">')}
        ${campo('ate', 'Data até', calendar, '<input class="input" id="gui2-ate" type="text" placeholder="dd/mm/aaaa" inputmode="numeric">')}
        ${campo('num', 'N.º da guia', hash, '<input class="input" id="gui2-num" placeholder="GR2024/…">')}
        ${campo('ref', 'Referência', barcode, '<input class="input" id="gui2-ref" placeholder="Referência da peça">')}
      </div>
      <div class="ped2__baixo">
        <nav class="ped2__estados" aria-label="Tipo de documento">
          <button type="button" class="ped2__estado-aba" data-filtro="todos" aria-current="true">${L(layers)}Todas <span class="ped2__n">${GUIAS.length}</span></button>
          <button type="button" class="ped2__estado-aba" data-filtro="fatura">${L(receipt)}Faturas <span class="ped2__n">${nFaturas}</span></button>
          <button type="button" class="ped2__estado-aba" data-filtro="credito">${L(undo)}Notas de crédito <span class="ped2__n">${GUIAS.length - nFaturas}</span></button>
        </nav>
        <div class="ped2__botoes">
          <button type="button" class="btn btn--claro ped2__limpar">${L(eraser, 'btn__icone')}<span class="btn__rotulo">Limpar</span></button>
          <button type="button" class="btn btn--acao ped2__pesquisar">${L(search, 'btn__icone')}<span class="btn__rotulo">Pesquisar</span></button>
        </div>
      </div>
    </section>

    <section class="cg-tabela erp-tabela ped2__tabela gui2__tabela">
      <div class="erp-tabela__rolo"><table>
        <thead><tr><th>Guia de remessa</th><th>Data</th><th>Tipo</th><th>Morada de entrega</th><th>Pedido</th><th>Observações</th><th class="erp-num">Bruto</th><th class="erp-num">Desconto</th><th class="erp-num">Embalagens</th><th class="erp-num">Portes</th><th class="erp-num">Base tributável</th><th class="erp-num">IVA</th><th class="erp-num">Total</th></tr></thead>
        <tbody>${GUIAS.map(linhaGuia).join('')}</tbody>
      </table></div>
      <p class="ped2__vazio" hidden>Nenhuma guia com estes filtros. <button type="button" class="cat3__ligacao gui2__limpar-ligacao">Limpar os filtros</button></p>
      <div class="ped2__pe"><span>A mostrar ${GUIAS.length} de ${GUIAS.length} · de 01/03/2024 até hoje</span>${L(fileText)}<span class="gui2__pe-dica">Clique numa guia para ver os artigos e os valores</span></div>
    </section>
  </main>
  <aside class="ped3__painel gui2__painel" id="gui2-painel" role="dialog" aria-modal="false" aria-labelledby="gui2-p-num" hidden></aside>
</div>`;
