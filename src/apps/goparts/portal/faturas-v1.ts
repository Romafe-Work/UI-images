/* =========================================================
   GOPARTS — 14 · Faturas (13 out. 2026)
   Ela, com a imagem das faturas do GO REPAIR (vazia, «Sem resultados»): «para as
   faturas» — como nas guias, com exemplos, animações e todos os estados. Igual às
   Guias v2: o título com o resumo (e o que está em aberto), os filtros no cartão
   azul (datas, n.º da fatura) e o tipo em separadores, e a tabela com as colunas do
   GO REPAIR — fatura, data, tipo, morada, bruto, desconto, embalagens, portes, base
   tributável e IVA (três pares, para taxas diferentes), total — mais o pagamento.
   Clicar numa fatura abre o painel (comportamento/faturas.ts); estados 14.1 a 14.9.
   ========================================================= */
import { FATURAS, base, iva, total, type Fatura } from './faturas-dados';
import { euros } from './guias-dados';
import { L, tipoPilula } from './guias-v2';
import calendar from 'lucide-static/icons/calendar.svg?raw';
import hash from 'lucide-static/icons/hash.svg?raw';
import eraser from 'lucide-static/icons/eraser.svg?raw';
import search from 'lucide-static/icons/search.svg?raw';
import receipt from 'lucide-static/icons/receipt.svg?raw';
import undo from 'lucide-static/icons/undo-2.svg?raw';
import layers from 'lucide-static/icons/layers.svg?raw';
import check from 'lucide-static/icons/check.svg?raw';
import clock from 'lucide-static/icons/clock.svg?raw';
import alert from 'lucide-static/icons/triangle-alert.svg?raw';
import fileText from 'lucide-static/icons/file-text.svg?raw';

const vazio = '<span class="ped2__discreto">—</span>';
const num = (n: number) => (n ? euros(n) : vazio);
export const pagamentoPilula = (f: Fatura) => ({
  paga: `<span class="ped2__estado fat__pag fat__pag--paga">${L(check)}Paga</span>`,
  aberto: `<span class="ped2__estado fat__pag fat__pag--aberto">${L(clock)}Em aberto</span>`,
  vencida: `<span class="ped2__estado fat__pag fat__pag--vencida">${L(alert)}Vencida</span>`,
  creditada: `<span class="ped2__estado fat__pag fat__pag--creditada">${L(check)}Descontada</span>`,
})[f.pagamento];

export const linhaFatura = (f: Fatura, i: number) => {
  const g = f.guia;
  return `<tr class="ped2__linha fat__linha" data-tipo="${g.tipo}" data-fatura="${f.num}" data-pagamento="${f.pagamento}" style="--i:${i}">
  <td><button type="button" class="ped2__abrir fat__abrir" aria-expanded="false" aria-controls="fat-painel" aria-haspopup="dialog"><span class="ped2__num">${f.num}</span></button><span class="ped2__discreto">${g.num}</span></td>
  <td>${g.data}</td><td>${tipoPilula(g)}</td>
  <td><span class="ped2__morada">${g.morada[0]}</span><span class="ped2__discreto">${g.morada[1]}</span></td>
  <td class="erp-num">${euros(g.bruto)}</td><td class="erp-num">${num(-g.desconto)}</td><td class="erp-num">${num(g.embalagens)}</td><td class="erp-num">${num(g.portes)}</td>
  <td class="erp-num">${euros(base(g))}</td><td class="erp-num">${euros(iva(g))}</td>
  <td class="erp-num fat__vazia">${vazio}</td><td class="erp-num fat__vazia">${vazio}</td><td class="erp-num fat__vazia">${vazio}</td><td class="erp-num fat__vazia">${vazio}</td>
  <td class="erp-num ped2__valor">${euros(total(g))}</td>
  <td>${pagamentoPilula(f)}<span class="ped2__discreto">${f.pagamento === 'paga' ? `a ${f.pagaEm}` : f.pagamento === 'creditada' ? 'na próxima fatura' : `vence a ${f.vencimento}`}</span></td>
</tr>`;
};

const campo = (id: string, rotulo: string, icone: string, input: string) =>
  `<div class="campo"><label class="campo__label" for="fat-${id}">${rotulo}</label><div class="campo__caixa"><span class="campo__chip" aria-hidden="true">${L(icone)}</span>${input}</div></div>`;
const nFat = FATURAS.filter((f) => f.guia.tipo === 'fatura').length;
const soma = FATURAS.reduce((s, f) => s + total(f.guia), 0);
const emAberto = FATURAS.filter((f) => f.pagamento === 'aberto' || f.pagamento === 'vencida').reduce((s, f) => s + total(f.guia), 0);

export const faturasV1 = `<div class="portal portal--v3 portal--v22 portal--noite portal--ped2 portal--fat">
  <main class="ped2 fat" data-faturas>
    <header class="ped2__cabeca">
      <div><h1 class="ped2__titulo">Faturas</h1><p class="ped2__sub">As faturas das suas encomendas, as notas de crédito e o que está por pagar.</p></div>
      <div class="ped2__resumo" aria-live="polite"><span><strong class="ped2__conta">${FATURAS.length}</strong> documentos</span><span><strong class="ped2__total" data-valor="${soma}">${euros(soma)}</strong> com IVA</span><span class="fat__aberto"><strong class="fat__aberto-valor" data-valor="${emAberto}">${euros(emAberto)}</strong> em aberto</span></div>
    </header>

    <section class="ped2__filtros c22__cartao c22__cartao--azul">
      <div class="ped2__campos fat__campos">
        ${campo('de', 'Data a partir de', calendar, '<input class="input" id="fat-de" type="text" value="01/03/2024" inputmode="numeric">')}
        ${campo('ate', 'Data até', calendar, '<input class="input" id="fat-ate" type="text" placeholder="dd/mm/aaaa" inputmode="numeric">')}
        ${campo('num', 'N.º da fatura', hash, '<input class="input" id="fat-num" placeholder="FT2024/… ou NC2024/…">')}
      </div>
      <div class="ped2__baixo">
        <nav class="ped2__estados" aria-label="Tipo de documento">
          <button type="button" class="ped2__estado-aba" data-filtro="todos" aria-current="true">${L(layers)}Todas <span class="ped2__n">${FATURAS.length}</span></button>
          <button type="button" class="ped2__estado-aba" data-filtro="fatura">${L(receipt)}Faturas <span class="ped2__n">${nFat}</span></button>
          <button type="button" class="ped2__estado-aba" data-filtro="credito">${L(undo)}Notas de crédito <span class="ped2__n">${FATURAS.length - nFat}</span></button>
        </nav>
        <div class="ped2__botoes">
          <button type="button" class="btn btn--claro ped2__limpar">${L(eraser, 'btn__icone')}<span class="btn__rotulo">Limpar</span></button>
          <button type="button" class="btn btn--acao ped2__pesquisar">${L(search, 'btn__icone')}<span class="btn__rotulo">Pesquisar</span></button>
        </div>
      </div>
    </section>

    <section class="cg-tabela erp-tabela ped2__tabela fat__tabela">
      <div class="erp-tabela__rolo"><table>
        <thead><tr><th>Fatura</th><th>Data</th><th>Tipo</th><th>Morada de entrega</th><th class="erp-num">Bruto</th><th class="erp-num">Desconto</th><th class="erp-num">Embalagens</th><th class="erp-num">Portes</th><th class="erp-num">Base tributável</th><th class="erp-num">IVA</th><th class="erp-num">Base trib. 2</th><th class="erp-num">IVA 2</th><th class="erp-num">Base trib. 3</th><th class="erp-num">IVA 3</th><th class="erp-num">Total</th><th>Pagamento</th></tr></thead>
        <tbody>${FATURAS.map(linhaFatura).join('')}</tbody>
      </table></div>
      <p class="ped2__vazio" hidden>Nenhuma fatura com estes filtros. <button type="button" class="cat3__ligacao fat__limpar-ligacao">Limpar os filtros</button></p>
      <div class="ped2__pe"><span>A mostrar ${FATURAS.length} de ${FATURAS.length} · de 01/03/2024 até hoje</span>${L(fileText)}<span class="gui2__pe-dica">Clique numa fatura para ver os valores, o pagamento e a guia</span></div>
    </section>
  </main>
  <aside class="ped3__painel fat__painel" id="fat-painel" role="dialog" aria-modal="false" aria-labelledby="fat-p-num" hidden></aside>
</div>`;
