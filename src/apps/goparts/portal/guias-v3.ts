/* =========================================================
   GOPARTS — 13 · Guias de remessa v3 (15 out. 2026)
   Do briefing dela («ROMAFE Logistics Document Center») e da nota que juntou («a timeline cronológica com o
   percurso documental»): as guias do mais recente para o mais antigo, por ano e por mês, numa linha vertical
   que se desenha com o scroll; cada guia abre-se no sítio com o percurso documental (Pedido → Guia → Fatura ou
   Nota de crédito, só com as ligações que os dados têm), o documento, a entrega, os valores, os artigos e as
   ações. O documento abre num painel à direita (pré-visualização e descarga).
   Mesmo molde dos Pedidos v5 (as classes ped4__* dos filtros, da cronologia e do painel), para os dois ecrãs
   serem da mesma família; o que é só das guias tem gui3__*. O histórico (cronologia) é a vista principal; a tabela
   com as colunas todas fica como alternativa, como no Histórico de pedidos (ela: «a guias faz tipo histórico também»).
   Os dados são os de guias-dados.ts (os mesmos oito documentos da v2). Os valores (base, IVA, total) vêm de lá
   — é o «servidor» do protótipo; o ecrã não faz contas próprias. Feito em TypeScript e CSS, sem React.
   Comportamento: comportamento/guias-v3.ts. CSS: css/guias-v3.css (+ css/pedidos-v4.css).
   ========================================================= */
import { menuFiltro } from './filtro-barra';
import { listaCompras } from './pecas-img';
import { GUIAS, base, iva, total, euros, type Guia } from './guias-dados';
import { PEDIDOS } from './pedidos-dados';
import { pilulasEstado } from './pedidos-v4';
import check from 'lucide-static/icons/check.svg?raw';
import truck from 'lucide-static/icons/truck.svg?raw';
import creditCard from 'lucide-static/icons/credit-card.svg?raw';
import calendar from 'lucide-static/icons/calendar.svg?raw';
import barcode from 'lucide-static/icons/barcode.svg?raw';
import search from 'lucide-static/icons/search.svg?raw';
import eraser from 'lucide-static/icons/eraser.svg?raw';
import chevronRight from 'lucide-static/icons/chevron-right.svg?raw';
import fileText from 'lucide-static/icons/file-text.svg?raw';
import receipt from 'lucide-static/icons/receipt.svg?raw';
import undo from 'lucide-static/icons/undo-2.svg?raw';
import layers from 'lucide-static/icons/layers.svg?raw';
import mapPin from 'lucide-static/icons/map-pin.svg?raw';
import warehouse from 'lucide-static/icons/warehouse.svg?raw';
import shoppingCart from 'lucide-static/icons/shopping-cart.svg?raw';
import eye from 'lucide-static/icons/eye.svg?raw';
import download from 'lucide-static/icons/download.svg?raw';
import slidersHorizontal from 'lucide-static/icons/sliders-horizontal.svg?raw';
import info from 'lucide-static/icons/info.svg?raw';
import arrowUpDown from 'lucide-static/icons/arrow-up-down.svg?raw';
import listaIcone from 'lucide-static/icons/list.svg?raw';
import table from 'lucide-static/icons/table.svg?raw';

export const L = (raw: string, cls = '') => raw.replace(/<!--[\s\S]*?-->/, '').replace(/\s+class="lucide lucide-([^"]*)"/, ' data-i="$1"').replace(/\s+class="[^"]*"/, '').replace('<svg', `<svg${cls ? ` class="${cls}"` : ''} aria-hidden="true"`).replace(/\n\s*/g, '');
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
export const ICONES3 = { fileText: L(fileText), download: L(download, 'btn__icone'), eye: L(eye, 'btn__icone'), info: L(info) };

export const guiaDe = (num: string) => GUIAS.find((g) => g.num === num)!;
/** O pedido só é «aberto» quando existe nos pedidos da conta; os outros dizem que não está disponível. */
export const temPedido = (num: string) => PEDIDOS.some((p) => p.num === num);
const aaaammdd = (d: string) => d.split('/').reverse().join('');
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const id = (num: string) => num.replace(/\D/g, '');
export const nomeTipo = (g: Guia) => g.tipo === 'fatura' ? 'Fatura' : 'Nota de crédito';

/* o tipo, em texto e ícone (nunca só a cor) */
export const TIPO = (g: Guia) => g.tipo === 'fatura'
  ? `<span class="ped4__selo gui3__tipo gui3__tipo--fatura">${L(receipt)}Fatura</span>`
  : `<span class="ped4__selo gui3__tipo gui3__tipo--credito">${L(undo)}Nota de crédito</span>`;

/* ---------- o percurso documental: Pedido → Guia → Fatura ou Nota de crédito ----------
   Só as ligações que os dados confirmam: o pedido da guia (aberto se existe na conta), a guia, o documento
   financeiro da guia; e, quando o mesmo pedido tem outras guias (a fatura e a devolução), essas por baixo. */
export function percursoDoc(g: Guia): string {
  const irmas = GUIAS.filter((x) => x.pedido === g.pedido && x.num !== g.num);
  const pedido = temPedido(g.pedido)
    ? `<button type="button" class="gui3__no gui3__no--pedido" data-abrir-pedido="${g.pedido}"><span class="gui3__no-i">${L(shoppingCart)}</span><span><small>Pedido</small><b>${g.pedido}</b></span></button>`
    : `<button type="button" class="gui3__no gui3__no--pedido gui3__no--indisponivel" data-pedido-indisponivel="${g.pedido}" aria-describedby="gui3-ind-${id(g.num)}"><span class="gui3__no-i">${L(shoppingCart)}</span><span><small>Pedido</small><b>${g.pedido}</b></span></button>`;
  const fin = `<button type="button" class="gui3__no gui3__no--${g.tipo}" data-abrir-doc="${g.doc}" data-ir="faturas"><span class="gui3__no-i">${g.tipo === 'fatura' ? L(receipt) : L(undo)}</span><span><small>${nomeTipo(g)}</small><b>${g.doc}</b></span></button>`;
  return `<div class="gui3__percurso" aria-label="Percurso documental">
      <ol class="gui3__nos">
        <li>${pedido}</li>
        <li class="gui3__seta" aria-hidden="true"><i class="gui3__fio"></i></li>
        <li><span class="gui3__no gui3__no--atual" aria-current="true"><span class="gui3__no-i">${L(fileText)}</span><span><small>Guia de remessa</small><b>${g.num}</b></span></span></li>
        <li class="gui3__seta" aria-hidden="true"><i class="gui3__fio"></i></li>
        <li>${fin}</li>
      </ol>
      <p class="gui3__ind" id="gui3-ind-${id(g.num)}" hidden>${L(info)}<span>O pedido ${g.pedido} já não está no histórico desta conta (os pedidos têm 12 meses). A guia e a ${nomeTipo(g).toLowerCase()} continuam disponíveis.</span></p>
      ${irmas.length ? `<p class="gui3__irmas"><span>Do mesmo pedido:</span>${irmas.map((x) => `<button type="button" class="gui3__irma" data-ir-guia="${x.num}">${x.tipo === 'fatura' ? L(receipt) : L(undo)}<b>${x.num}</b> · ${nomeTipo(x)} · ${x.data}</button>`).join('')}</p>` : ''}
    </div>`;
}

/* ---------- os valores, alinhados à direita; o total à parte ---------- */
export function valores(g: Guia): string {
  const l = (t: string, v: number, cls = '') => `<div class="gui3__v${cls}"><dt>${t}</dt><dd data-valor="${v}">${v ? euros(v) : '<span class="ped4__nada">—</span>'}</dd></div>`;
  return `<dl class="gui3__valores">
      ${l('Bruto', g.bruto)}${l('Desconto', -g.desconto)}${l('Embalagens', g.embalagens)}${l('Portes', g.portes)}
      ${l('Base tributável', base(g), ' gui3__v--sub')}${l('IVA (23 %)', iva(g))}
      <div class="gui3__v gui3__v--total"><dt>Total</dt><dd data-valor="${total(g)}">${euros(total(g))}</dd></div>
    </dl>`;
}

/* ---------- o resumo financeiro, como no talão das Faturas (ela: «nas guias quero mais assim») ----------
   Valor bruto, desconto, embalagens, portes, base tributável, IVA; um traço; o total em destaque. Os valores aparecem
   já certos (nada conta a partir do zero). */
export function reciboGuia(g: Guia): string {
  const l = (t: string, v: number, cls = '') => `<div class="fat2__r${cls}"><dt>${t}</dt><dd>${v ? euros(v) : '<span class="ped4__nada">—</span>'}</dd></div>`;
  return `<dl class="fat2__recibo">${l('Valor bruto', g.bruto)}${l('Desconto', -g.desconto)}${l('Embalagens', g.embalagens)}${l('Portes', g.portes)}${l('Base tributável', base(g), ' gui3__r-base')}${l('IVA (23 %)', iva(g))}<div class="fat2__traco" aria-hidden="true"></div><div class="fat2__r fat2__r--total"><dt>Total da guia <small>com IVA</small></dt><dd>${euros(total(g))}</dd></div></dl>`;
}

/* ---------- a guia aberta ---------- */
/** `onde`: nas Guias, as ações de sempre; no painel dos Pedidos (ela, 15 out.: «quando clico numa guia de remessa
    do pedido abre um diálogo lateral»), a descarga e o caminho para a página das Guias, sem «Abrir o pedido». */
export function detalheGuia(g: Guia, onde: 'guias' | 'pedidos' = 'guias'): string {
  return `<div class="gui3__det">
    <section class="gui3__det-percurso" aria-label="Percurso documental"><h3 class="ped4__h">Percurso documental</h3>${percursoDoc(g)}</section>
    <section class="gui3__det-doc" aria-label="Documento">
      <h3 class="ped4__h">Documento</h3>
      <dl class="ped4__dl">
        <div><dt>Número</dt><dd>${g.num}</dd></div><div><dt>Data</dt><dd>${g.data}</dd></div>
        <div><dt>Tipo</dt><dd>${nomeTipo(g)} ${g.doc}</dd></div><div><dt>Pedido</dt><dd>${g.pedido}</dd></div>
      </dl>
      <h3 class="ped4__h">Entrega</h3>
      <p class="ped4__ent">${L(mapPin)}<span><b>${esc(g.morada[0])}</b>${esc(g.morada[1])}</span></p>
      <p class="ped4__ent">${L(warehouse)}<span><b>Armazém ${esc(g.armazem)}</b>Saída da mercadoria</span></p>
      ${g.obs && g.obs !== '—' ? `<p class="gui3__obs"><b>Observações</b>${esc(g.obs)}</p>` : ''}
    </section>
    <section class="gui3__det-artigos" aria-label="Artigos da compra"><h3 class="ped4__h">Artigos da compra <span>${g.linhas.length}</span></h3>${listaCompras(g.linhas, euros)}</section>
    <section class="gui3__det-valores" aria-label="Resumo financeiro"><h3 class="ped4__h">Resumo financeiro</h3>${reciboGuia(g)}</section>
    <section class="gui3__det-accoes-sec" aria-label="Ações">
      <div class="ped4__det-accoes gui3__accoes">${onde === 'pedidos' ? `
        <button type="button" class="btn btn--ghost btn--sm" data-descarregar="${g.num}">${L(download, 'btn__icone')}<span class="btn__rotulo">Descarregar PDF</span></button>
        <button type="button" class="btn btn--ghost btn--sm" data-ir="guias" data-guia-pagina="${g.num}">${L(fileText, 'btn__icone')}<span class="btn__rotulo">Abrir nas Guias de remessa</span></button>` : `
        <button type="button" class="btn btn--acao btn--sm" data-ver-doc="${g.num}">${L(eye, 'btn__icone')}<span class="btn__rotulo">Ver documento</span></button>
        <button type="button" class="btn btn--ghost btn--sm" data-descarregar="${g.num}">${L(download, 'btn__icone')}<span class="btn__rotulo">Descarregar PDF</span></button>
        ${temPedido(g.pedido) ? `<button type="button" class="btn btn--ghost btn--sm" data-abrir-pedido="${g.pedido}">${L(shoppingCart, 'btn__icone')}<span class="btn__rotulo">Abrir o pedido</span></button>` : ''}`}
      </div>
      <p class="gui3__descarga" role="status" hidden></p>
    </section>
  </div>`;
}

/** O estado da entrega, como nos Pedidos (por baixo da data), só quando os dados o dizem: pelo percurso do pedido
    (o passo «Entregue» com data = entregue; sem data = em entrega); a nota de crédito é uma devolução. Sem pedido na
    conta, não se diz nada. */
export function estadoGuia(g: Guia): { k: string; nome: string } | null {
  if (g.tipo === 'credito') return { k: 'devolucao', nome: 'Devolução' };
  const p = PEDIDOS.find((x) => x.num === g.pedido && x.guia === g.num); if (!p) return null;
  const fim = p.percurso[p.percurso.length - 1];
  return /Entregue/i.test(fim[0]) && fim[1] ? { k: 'entregue', nome: 'Entregue' } : { k: 'em-entrega', nome: 'Em entrega' };
}

/** As pílulas «Estado» das guias (ela, 15 out.: «permite filtrar por» Entregue · Em entrega · Devolução). */
export function estadosGuias(): string {
  const ks: [string, string, string][] = [['entregue', 'Entregue', L(check)], ['em-entrega', 'Em entrega', L(truck)], ['devolucao', 'Devolução', L(undo)]];
  return pilulasEstado(ks.map(([k, nome, icone]) => ({ k, nome, icone, n: GUIAS.filter((g) => estadoGuia(g)?.k === k).length })), GUIAS.length);
}

/* ---------- uma guia na cronologia ---------- */
export function itemGuia(g: Guia, i: number): string {
  const [d, m] = g.data.split('/');
  const e = estadoGuia(g);
  return `<li class="ped4__c-item gui3__item" data-num="${g.num}" data-tipo="${g.tipo}" data-total="${total(g)}" style="--i:${i}">
      <span class="ped4__c-data" aria-hidden="true"><b>${d}</b>${MESES[+m - 1].slice(0, 3)}${e ? `<em class="ped4__c-etapa gui3__etapa--${e.k}">${e.nome}</em>` : ''}</span>
      <span class="ped4__c-marca gui3__marca gui3__marca--${g.tipo}" aria-hidden="true">${g.tipo === 'fatura' ? L(receipt) : L(undo)}</span>
      <article class="ped4__c-cartao">
        <button type="button" class="ped4__c-cabeca gui3__cabeca" aria-haspopup="dialog">
          <span class="ped4__c-id"><span class="ped4__ref">${g.num}</span>${e ? `<span class="sr-only">${e.nome}. </span>` : ''}<span class="ped4__c-meta">${g.data} · Pedido <span class="gui3__ref-pedido">${g.pedido}</span></span><span class="ped4__c-encontrado" hidden></span></span>
          <span class="gui3__destino">${L(mapPin)}<span>${esc(g.morada[1])}<small>${esc(g.morada[0])}</small></span></span>
          <span class="ped4__c-selos">${TIPO(g)}</span>
          <span class="ped4__c-valor">${euros(total(g))}</span>
          <span class="ped4__c-seta" aria-hidden="true">${L(chevronRight)}</span>
        </button>
        <div class="ped4__c-det" id="gui3-c-${id(g.num)}" hidden></div>
      </article>
    </li>`;
}

/** A cronologia: por ano e por mês, do mais recente para o mais antigo. */
export function cronologiaGuias(lista = GUIAS): string {
  const meses = new Map<string, Guia[]>();
  [...lista].sort((a, b) => aaaammdd(b.data).localeCompare(aaaammdd(a.data))).forEach((g) => { const [, m, a] = g.data.split('/'); const k = `${a}-${m}`; meses.set(k, [...(meses.get(k) || []), g]); });
  let i = 0, ano = '';
  return `<div class="ped4__crono gui3__crono">
      <span class="ped4__c-linha" aria-hidden="true"><span class="ped4__c-linha-cheia"></span></span>
      ${Array.from(meses).map(([k, gs]) => {
        const [a, m] = k.split('-'), nomeMes = MESES[+m - 1];
        const cabAno = a !== ano ? `<h2 class="gui3__ano">${a}</h2>` : ''; ano = a;
        return `${cabAno}<section class="ped4__mes" data-mes="${k}" aria-label="${nomeMes} de ${a}"><h3 class="ped4__mes-t"><span>${nomeMes[0].toUpperCase()}${nomeMes.slice(1)} de ${a}</span><small><b>${gs.length}</b> ${gs.length === 1 ? 'documento' : 'documentos'}</small></h3><ol class="ped4__c-lista">${gs.map((g) => itemGuia(g, i++)).join('')}</ol></section>`;
      }).join('')}
      <p class="ped4__c-fim"><span class="ped4__c-marca" aria-hidden="true"></span>Não há guias mais antigas neste período.</p>
    </div>`;
}

/* ---------- a tabela (a alternativa, como no Histórico de pedidos): as colunas todas do GO REPAIR ---------- */
const ord = (k: string, t: string, cls = '') => `<th${cls ? ` class="${cls}"` : ''} aria-sort="none"><button type="button" class="ped4__ordenar" data-ordenar="${k}">${t}${L(arrowUpDown)}</button></th>`;
const vn = (n: number) => (n ? euros(n) : '<span class="ped4__nada">—</span>');
export function linhaGuia(g: Guia, i: number): string {
  const lid = `gui3-d-${id(g.num)}`;
  return `<tr class="ped4__linha gui3__linha" data-num="${g.num}" data-tipo="${g.tipo}" data-data="${aaaammdd(g.data)}" data-total="${total(g)}" style="--i:${i}">
      <td class="ped4__c-abrir"><button type="button" class="ped4__abrir" aria-haspopup="dialog" aria-label="Abrir a guia ${g.num}">${L(chevronRight)}</button></td>
      <td data-r="Guia"><span class="ped4__ref">${g.num}</span></td><td data-r="Data" class="ped4__data">${g.data}</td><td data-r="Tipo">${TIPO(g)}<span class="ped4__m2">${g.doc}</span></td>
      <td data-r="Morada" class="ped4__c-ent"><span class="ped4__m1">${esc(g.morada[0])}</span><span class="ped4__m2">${esc(g.morada[1])}</span></td>
      <td data-r="Pedido"><span class="gui3__ref-pedido">${g.pedido}</span></td><td data-r="Observações" class="ped4__c-obs">${g.obs && g.obs !== '—' ? esc(g.obs) : '<span class="ped4__nada">—</span>'}</td>
      <td class="ped4__num">${euros(g.bruto)}</td><td class="ped4__num">${vn(-g.desconto)}</td><td class="ped4__num">${vn(g.embalagens)}</td><td class="ped4__num">${vn(g.portes)}</td>
      <td class="ped4__num">${euros(base(g))}</td><td class="ped4__num">${euros(iva(g))}</td><td data-r="Total" class="ped4__num ped4__valor">${euros(total(g))}</td>
    </tr>
    <tr class="ped4__linha-det" id="${lid}" data-de="${g.num}" hidden><td colspan="14"></td></tr>`;
}
export const tabelaGuias = () => `<div class="ped4__tabela gui3__tabela"><table>
        <thead><tr><th class="ped4__c-abrir"><span class="sr-only">Abrir</span></th>${ord('num', 'Guia')}${ord('data', 'Data')}<th>Tipo</th><th class="ped4__c-ent">Morada de entrega</th><th>Pedido</th><th class="ped4__c-obs">Observações</th><th class="ped4__num">Bruto</th><th class="ped4__num">Desconto</th><th class="ped4__num">Embalagens</th><th class="ped4__num">Portes</th><th class="ped4__num">Base trib.</th><th class="ped4__num">IVA</th>${ord('total', 'Total', 'ped4__num')}</tr></thead>
        <tbody>${GUIAS.map(linhaGuia).join('')}</tbody>
      </table></div>`;

const campo = (cid: string, rotulo: string, icone: string, extra: string) => `<div class="ped4__campo"><label for="${cid}">${rotulo}</label><span class="ped4__caixa">${L(icone)}<input class="ped4__input" id="${cid}" ${extra}></span><small class="ped4__erro" id="${cid}-erro" hidden></small></div>`;

export function guiasV3(vista: 'cronologia' | 'tabela' = 'cronologia'): string {
  const nF = GUIAS.filter((g) => g.tipo === 'fatura').length, nC = GUIAS.length - nF;
  const soma = GUIAS.reduce((s, g) => s + total(g), 0);
  return `<div class="portal portal--v3 portal--v22 portal--noite portal--gui3">
  <main class="ped4 gui3" data-guias3>
    <header class="ped4__cabeca">
      <div><h1 class="ped4__titulo">Guias de remessa</h1><p class="ped4__sub">Consulte, pesquise e acompanhe os documentos das suas entregas.</p></div>
      <dl class="ped4__kpi">
        <div><dt>${L(layers)}Documentos</dt><dd data-kpi="n" data-valor="${GUIAS.length}">${GUIAS.length}</dd></div>
        <div><dt>${L(receipt)}Faturas · Notas de crédito</dt><dd class="gui3__kpi-tipos"><span data-kpi="f" data-valor="${nF}">${nF}</span> · <span data-kpi="c" data-valor="${nC}">${nC}</span></dd></div>
        <div><dt>${L(creditCard)}Total no período</dt><dd data-kpi="total" data-valor="${soma}">${euros(soma)}</dd></div>
      </dl>
    </header>

    <section class="ped4__filtros ped4__filtros--botao fb" aria-label="Filtrar guias">
      <form class="ped4__campos ped4__campos--botao" data-enter="seguinte" data-enter-fim="submeter" id="gui3-campos" novalidate>
        <div class="ped4__barra-f fb__barra">
          ${campo('gui3-num', 'N.º da guia de remessa', search, 'type="text" placeholder="Pesquisar pelo n.º da guia (GR2024/…)" autocomplete="off" data-enter="proprio"')}
          ${menuFiltro('Tipo', `<div class="ped4__estados" role="group" aria-label="Tipo de documento">
            <button type="button" class="ped4__est" data-filtro="todos" aria-pressed="true">${L(layers)}Todos <span class="ped4__est-n">${GUIAS.length}</span></button>
            <button type="button" class="ped4__est" data-filtro="fatura" aria-pressed="false">${L(receipt)}Fatura <span class="ped4__est-n">${nF}</span></button>
            <button type="button" class="ped4__est" data-filtro="credito" aria-pressed="false">${L(undo)}Nota de crédito <span class="ped4__est-n">${nC}</span></button>
            <i class="ped4__est-risca" aria-hidden="true"></i>
            </div>`)}
          ${menuFiltro('Estado', `${estadosGuias()}`)}
          <button type="button" class="btn btn--ghost btn--sm ped4__filtros-abrir" aria-expanded="false" aria-controls="gui3-painel">${L(slidersHorizontal, 'btn__icone')}<span class="btn__rotulo">Filtros</span><span class="ped4__filtros-n" hidden></span></button>
          <button type="button" class="fb__limpar ped4__limpar" data-limpar-tudo>Limpar tudo</button>
        </div>
        <div class="ped4__painel-f fb__painel" id="gui3-painel" role="dialog" aria-label="Filtrar guias">
          <h3 class="fb__titulo">Filtrar guias</h3>
          <fieldset class="fb__grupo"><legend>Período</legend><div class="fb__datas">
            ${campo('gui3-de', 'Data a partir de', calendar, 'type="text" value="01/03/2024" inputmode="numeric" placeholder="dd/mm/aaaa" autocomplete="off"')}
            ${campo('gui3-ate', 'Data até', calendar, 'type="text" inputmode="numeric" placeholder="dd/mm/aaaa" autocomplete="off"')}
          </div><small class="fb__datas-erro" data-fb-datas-erro hidden></small></fieldset>
          <fieldset class="fb__grupo"><legend>Referência</legend>${campo('gui3-ref', 'Referência', barcode, 'type="text" placeholder="Referência da peça" autocomplete="off"')}</fieldset>
          <div class="ped4__botoes">
          <button type="button" class="btn btn--ghost ped4__limpar">${L(eraser, 'btn__icone')}<span class="btn__rotulo">Limpar filtros</span></button>
          <button type="submit" class="btn btn--acao ped4__pesquisar">${L(search, 'btn__icone')}<span class="btn__rotulo">Aplicar filtros</span></button>
          </div>
        </div>
      </form>
      <ul class="ped4__chips" aria-label="Filtros aplicados"></ul>
    </section>

    <section class="ped4__lista" aria-label="Guias de remessa" data-vista="${vista}">
      <div class="ped4__lista-cabeca"><p class="ped4__conta" aria-live="polite">A mostrar <b>${GUIAS.length}</b> de ${GUIAS.length} documentos</p><p class="ped4__a-atualizar" role="status" hidden></p><p class="gui3__mes-atual" aria-hidden="true"></p>
        <div class="ped4__vistas" role="group" aria-label="Ver como"><button type="button" class="ped4__vista" data-vista="cronologia" aria-pressed="${vista === 'cronologia'}">${L(listaIcone)}Lista</button><button type="button" class="ped4__vista" data-vista="tabela" aria-pressed="${vista === 'tabela'}">${L(table)}Tabela</button></div></div>
      ${cronologiaGuias()}
      ${tabelaGuias()}
      <div class="ped4__vazio" hidden></div>
      <p class="ped4__pe">Desde 01/03/2024 até hoje · os valores são os dos documentos emitidos</p>
    </section>

    <div class="ped4__veu" hidden></div>
    <aside class="ped4__gaveta gui3__gaveta" role="dialog" aria-modal="true" aria-labelledby="gui3-g-num" hidden></aside>
  </main>
</div>`;
}

/* ---------- o documento no painel (pré-visualização): o cabeçalho e as peças da página ---------- */
/** O cabeçalho do painel com a guia (clicar numa guia abre-a aqui). */
export function cabecaGuia(g: Guia, idNum = 'gui3-g-num'): string {
  const e = estadoGuia(g);
  return `<header class="ped4__g-cabeca"><div><p class="ped4__g-rotulo">Guia de remessa · ${nomeTipo(g)} ${g.doc}${e ? ` · <span class="gui3__etapa--${e.k}">${e.nome}</span>` : ''}</p><h2 class="ped4__g-num" id="${idNum}" tabindex="-1">${g.num}</h2><p class="ped4__g-meta">${g.data} · Pedido ${g.pedido} · ${euros(total(g))}</p></div><button type="button" class="ped4__g-fechar" aria-label="Fechar (Esc)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button></header>`;
}
export function cabecaDoc(g: Guia): string {
  return `<header class="ped4__g-cabeca"><div><p class="ped4__g-rotulo">Guia de remessa · ${nomeTipo(g)} ${g.doc}</p><h2 class="ped4__g-num" id="gui3-g-num" tabindex="-1">${g.num}</h2><p class="ped4__g-meta">${g.data} · Pedido ${g.pedido} · ${euros(total(g))}</p></div><button type="button" class="ped4__g-fechar" aria-label="Fechar (Esc)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button></header>`;
}
/** A página do documento, montada com os campos da própria guia (o protótipo não tem o PDF do servidor). */
export function paginaDoc(g: Guia): string {
  return `<div class="gui3__folha" aria-label="Pré-visualização da guia ${g.num}">
      <div class="gui3__folha-topo"><span class="romafe">ROMAFE</span><span><b>Guia de remessa</b>${g.num}<br>${g.data}</span></div>
      <div class="gui3__folha-dados"><p><small>Entregar em</small>${esc(g.morada[0])}<br>${esc(g.morada[1])}</p><p><small>Pedido</small>${g.pedido}<br><small>${nomeTipo(g)}</small>${g.doc}</p></div>
      <table class="gui3__folha-art"><thead><tr><th>Qtd.</th><th>Artigo</th><th>Valor</th></tr></thead><tbody>${g.linhas.map(([q, d, v]) => `<tr><td>${q}</td><td>${esc(d)}</td><td>${euros(v)}</td></tr>`).join('')}</tbody></table>
      ${valores(g)}
    </div>`;
}
export function rodapeDoc(g: Guia): string {
  return `<footer class="gui3__g-pe"><button type="button" class="btn btn--acao" data-descarregar="${g.num}">${L(download, 'btn__icone')}<span class="btn__rotulo">Descarregar PDF</span></button><p class="gui3__descarga" role="status" hidden></p></footer>`;
}
