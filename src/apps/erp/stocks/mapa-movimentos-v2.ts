/* =========================================================
   ERP — Stocks ▸ Mapas ▸ 77 · Movimentos de artigos, v2 (19 nov. 2026), do briefing dela «Redesign do módulo
   Movimentos de Artigos». A v1 (stocks/mapa-movimentos.ts) fica no código (é lá que estão os movimentos, que o 76
   e o 78 também usam) e sai da lista.
     - Os três separadores com a mesma ordem: filtros (compactos, os aplicados à vista), indicadores, resultados
       (tabela, ou cartões quando ajudam), e a mesma barra de ações e vista;
     - Movimentos: a Visualização de antes (por artigo F1 … documento F5; Iniciado por / Contendo / Igual a /
       Encomenda, Shift+F1/F2/F3/F6) fica nos mesmos grupos, que o IDE leva para a barra de cima; armazém, tipo, e em
       Mais filtros o artigo e o período; o detalhe de um movimento numa janela (a transferência com as duas pernas);
     - Extrato: artigo (referência ou descrição) e ano numa linha; o cabeçalho do artigo depois de gerar; os 4
       indicadores (início + entradas − saídas = fim); a evolução do stock em quantidade ou valor, só nos dias com
       movimentos (em degraus, sem inventar pontos); cartões por mês e por armazém;
     - Saldo: artigo inicial e final (referência ou descrição); agrupar por artigo, armazém, tipo ou mês, com
       subtotais e grupos que abrem e fecham; cartões por artigo, com Ver movimentos.
   Regras: as transferências internas não são entradas nem saídas da empresa (só contam com um armazém escolhido);
   os ajustes em valor não mexem nas unidades; o saldo é sempre o de cada artigo, nunca somado entre artigos.
   CSS: css/mapa-movimentos-v2.css, sobre o do 78 v2 (indicadores, cartões, vista, janela) e o dos outros mapas.
   ========================================================= */
import type { Ecra } from '../../../comum/tipos';
import type { IdErp } from '../ids';
import { topoErp } from '../inicio-v2';
import { L, esc } from '../espaco';
import { BTN } from '../compras/docs-v2';
import { ARTIGOS, artigo, dia, HOJE } from '../compras/dominio';
import { xlsx, descarregar, type Celula } from '../compras/xlsx';
import { ARMAZENS } from './dominio';
import { todosMovimentos, NOME_TIPO, designacao, type Mov } from './mapa-movimentos';
import arrowLeftRight from 'lucide-static/icons/arrow-left-right.svg?raw';
import list from 'lucide-static/icons/list.svg?raw';
import fileText from 'lucide-static/icons/file-text.svg?raw';
import scale from 'lucide-static/icons/scale.svg?raw';
import refresh from 'lucide-static/icons/refresh-cw.svg?raw';
import printer from 'lucide-static/icons/printer.svg?raw';
import sheet from 'lucide-static/icons/file-spreadsheet.svg?raw';
import search from 'lucide-static/icons/search.svg?raw';
import searchX from 'lucide-static/icons/search-x.svg?raw';
import hash from 'lucide-static/icons/hash.svg?raw';
import textIc from 'lucide-static/icons/text.svg?raw';
import warehouse from 'lucide-static/icons/warehouse.svg?raw';
import calendar from 'lucide-static/icons/calendar.svg?raw';
import truck from 'lucide-static/icons/truck.svg?raw';
import play from 'lucide-static/icons/play.svg?raw';
import xIc from 'lucide-static/icons/x.svg?raw';
import pencil from 'lucide-static/icons/pencil.svg?raw';
import funnelX from 'lucide-static/icons/funnel-x.svg?raw';
import sliders from 'lucide-static/icons/sliders-horizontal.svg?raw';
import arrowUp from 'lucide-static/icons/arrow-up.svg?raw';
import arrowDown from 'lucide-static/icons/arrow-down.svg?raw';
import inbox from 'lucide-static/icons/inbox.svg?raw';
import layers from 'lucide-static/icons/layers.svg?raw';
import grid from 'lucide-static/icons/layout-grid.svg?raw';
import table from 'lucide-static/icons/table-2.svg?raw';
import eye from 'lucide-static/icons/eye.svg?raw';
import chevL from 'lucide-static/icons/chevron-left.svg?raw';
import chevR from 'lucide-static/icons/chevron-right.svg?raw';
import chevD from 'lucide-static/icons/chevron-down.svg?raw';
import loader from 'lucide-static/icons/loader-circle.svg?raw';
import alerta from 'lucide-static/icons/circle-alert.svg?raw';
import entraIc from 'lucide-static/icons/arrow-down-left.svg?raw';
import saiIc from 'lucide-static/icons/arrow-up-right.svg?raw';
import repeat from 'lucide-static/icons/repeat.svg?raw';
import euroIc from 'lucide-static/icons/euro.svg?raw';
import boxes from 'lucide-static/icons/boxes.svg?raw';
import chart from 'lucide-static/icons/chart-line.svg?raw';

/* ---------- números e regras ---------- */
const NF = new Intl.NumberFormat('pt-PT', { useGrouping: 'always' } as unknown as Intl.NumberFormatOptions);
const EF = new Intl.NumberFormat('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always' } as unknown as Intl.NumberFormatOptions);
const nf = (n: number) => NF.format(n);
const eur = (c: number) => (c < 0 ? '−' : '') + EF.format(Math.abs(c) / 100) + ' €';
const zero = (t: string) => `<span class="is-nada">${t}</span>`;
const q0 = (n: number) => (n ? nf(n) : zero('0'));
const e0 = (c: number) => (c ? eur(c) : zero(eur(0)));
const curto = (nome: string) => (nome ? nome.replace('Armazém ', '') : 'Todos');
const codArm = (nome: string) => ARMAZENS.find((a) => a.nome === nome)?.cod ?? nome;
const sem = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '');
const ent = (m: Mov) => (m.qtd > 0 ? m.qtd : 0), sai = (m: Mov) => (m.qtd < 0 ? -m.qtd : 0);
const soma = (ms: Mov[], f: (m: Mov) => number) => ms.reduce((s, m) => s + f(m), 0);
/** A transferência entre armazéns não é entrada nem saída da empresa; com um armazém escolhido, é desse armazém. */
const daEmpresa = (ms: Mov[], comArmazem: boolean) => ms.filter((m) => comArmazem || m.cod !== 'TA');
const pl = (n: number, um: string, varios: string) => `${nf(n)} ${n === 1 ? um : varios}`;
type Cod = Mov['cod'];
const nat = (m: Mov): 'ent' | 'sai' | 'tra' | 'val' => (m.cod === 'AV' ? 'val' : m.cod === 'TA' ? 'tra' : m.qtd > 0 ? 'ent' : 'sai');
const IC_NAT = { ent: entraIc, sai: saiIc, tra: repeat, val: euroIc };
/** As duas pernas de uma transferência (a saída da origem e a entrada no destino). */
function pernas(m: Mov, todos: Mov[]): { de?: Mov; para?: Mov } {
  if (m.cod !== 'TA') return {};
  const xs = todos.filter((x) => x.cod === 'TA' && x.docCompleto === m.docCompleto && x.ref === m.ref && x.anulacao === m.anulacao);
  return { de: xs.find((x) => x.qtd < 0), para: xs.find((x) => x.qtd > 0) };
}
const tipoCel = (m: Mov, todos: Mov[]) => {
  const n = nat(m), p = pernas(m, todos);
  const rota = n === 'tra' && p.de && p.para ? `<small>${esc(curto(p.de.armazem))} → ${esc(curto(p.para.armazem))}</small>` : '';
  return `<span class="mva2-tipo is-${n}${m.anulacao ? ' is-anul' : ''}" title="${esc(designacao(m))}">${L(IC_NAT[n])}<span>${esc(designacao(m))}${rota}</span></span>`;
};

/* ---------- o estado ---------- */
type Tab = 'mov' | 'ext' | 'sal';
type Vista = 'tabela' | 'cartoes';
type Modo = 'artigo' | 'descricao' | 'armazem' | 'data' | 'documento';
type Comp = 'inicio' | 'contem' | 'igual' | 'encomenda';
type Grupo = '' | 'artigo' | 'armazem' | 'tipo' | 'mes';
interface Est {
  tab: Tab; vista: Record<Tab, Vista>; fase: 'ok' | 'a-gerar'; aviso: string; erro: string; editor: boolean;
  modo: Modo; comp: Comp; q: string; armazem: string; art: string; tipo: string; de: string; ate: string; mais: boolean;
  ordem: { k: string; dir: 1 | -1 } | null; pagina: number; pp: number; sel: string; jan: boolean;
  extArt: string; extAno: string; extFeito?: { art: string; ano: string }; extEditar: boolean; extGraf: 'qtd' | 'valor';
  salIni: string; salFim: string; salFeito?: { ini: string; fim: string }; salEditar: boolean; salGrupo: Grupo; salFechados: string[];
}
const CHAVE = 'erp:stocks:mapa-movimentos';
const guardado = (): { vista?: Record<Tab, Vista>; pp?: number } => { try { return JSON.parse(localStorage.getItem(CHAVE) ?? '{}'); } catch { return {}; } };
const novo = (): Est => {
  const editor = document.body.classList.contains('editando'), g = editor ? {} : guardado();
  return { tab: 'mov', vista: { mov: 'tabela', ext: 'tabela', sal: 'tabela', ...(g.vista ?? {}) }, fase: 'ok', aviso: '', erro: '', editor,
    modo: 'artigo', comp: 'inicio', q: '', armazem: '', art: '', tipo: '', de: '', ate: '', mais: false, ordem: null, pagina: 0, pp: [10, 25, 50, 0].includes(g.pp ?? -1) ? g.pp! : 25, sel: '', jan: false,
    extArt: '', extAno: HOJE.slice(0, 4), extEditar: true, extGraf: 'qtd', salIni: '0', salFim: 'ZZZZZZ', salEditar: true, salGrupo: '', salFechados: [] };
};
const guardar = (e: Est) => { if (!e.editor) try { localStorage.setItem(CHAVE, JSON.stringify({ vista: e.vista, pp: e.pp })); } catch { /* */ } };
const estados = new WeakMap<HTMLElement, Est>();
const de = (r: HTMLElement) => { let e = estados.get(r); if (!e) { e = novo(); estados.set(r, e); } return e; };
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const editando = () => (document.body.classList.contains('editando') && !document.body.classList.contains('ed-interagir')) || document.body.classList.contains('com-fluxo');
const raiz = (t: Element | null) => t?.closest<HTMLElement>('[data-mva2]') ?? null;
const visivel = () => document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) [data-mva2]');
const MODOS: { k: Modo; tecla: string; t: string; ic: string; ph: string }[] = [
  { k: 'artigo', tecla: 'F1', t: 'Artigo', ic: hash, ph: 'Referência, ex.: 6206' },
  { k: 'descricao', tecla: 'F2', t: 'Descrição', ic: textIc, ph: 'Descrição, ex.: pastilhas' },
  { k: 'armazem', tecla: 'F3', t: 'Armazém', ic: warehouse, ph: 'Armazém, ex.: 60 ou Porto' },
  { k: 'data', tecla: 'F4', t: 'Data', ic: calendar, ph: 'Data, ex.: 15/10/2026' },
  { k: 'documento', tecla: 'F5', t: 'Documento', ic: fileText, ph: 'Documento, ex.: TA 2026' },
];
const TABS: { k: Tab; t: string; ic: string }[] = [{ k: 'mov', t: 'Movimentos', ic: list }, { k: 'ext', t: 'Extrato por artigo', ic: fileText }, { k: 'sal', t: 'Saldo', ic: scale }];
const ANOS = ['2025', '2026'];
const op = (v: string, t: string, s = '') => `<option value="${esc(v)}"${v === s ? ' selected' : ''}>${esc(t)}</option>`;
/** «6205» ou «rolamento rígido» → a referência, quando só um artigo serve; senão fica o que se escreveu. */
function resolver(v: string): string {
  const t = v.trim(); if (!t) return '';
  const ex = ARTIGOS.find((a) => sem(a.ref) === sem(t) || sem(`${a.ref} · ${a.desc}`) === sem(t)); if (ex) return ex.ref;
  const xs = ARTIGOS.filter((a) => sem(a.ref).includes(sem(t)) || sem(a.desc).includes(sem(t)));
  return xs.length === 1 ? xs[0].ref : t;
}

/* ---------- a página ---------- */
function html(cen: string): string {
  const id = (x: string) => `mva2-${x}-${cen}`;
  const B = (k: string, ic: string, t: string, tecla: string, cls = '') => BTN(k, ic, t, tecla, '', cls).replace('data-dv2-acao', 'data-mva2-acao');
  const lista = `<datalist id="${id('arts')}">${ARTIGOS.map((a) => `<option value="${esc(`${a.ref} · ${a.desc}`)}"></option>`).join('')}</datalist>`;
  const listaRef = `<datalist id="${id('refs')}">${ARTIGOS.map((a) => `<option value="${esc(a.ref)}">${esc(a.desc)}</option>`).join('')}</datalist>`;
  const crit = (k: 'ext' | 'sal') => `<form class="mva2-crit" data-mva2-crit="${k}" novalidate>
      ${k === 'ext' ? `<label class="ak-campo mva2-crit-art"><span>Artigo</span><div class="minv2-pesq-c">${L(search)}<input type="text" data-mva2-c="extArt" list="${id('arts')}" placeholder="Referência ou descrição" autocomplete="off"></div></label>
        <label class="ak-campo mva2-crit-ano"><span>Ano de análise</span><select data-mva2-c="extAno">${ANOS.map((a) => op(a, a)).join('')}</select></label>`
      : `<label class="ak-campo"><span>Artigo inicial</span><input type="text" data-mva2-c="salIni" list="${id('refs')}" placeholder="0 = o primeiro" autocomplete="off"></label>
        <label class="ak-campo"><span>Artigo final</span><input type="text" data-mva2-c="salFim" list="${id('refs')}" placeholder="ZZZZZZ = o último" autocomplete="off"></label>`}
      <span class="mva2-crit-bts">${B('gerar', play, k === 'ext' ? 'Gerar extrato' : 'Gerar saldo', 'F10', 'ak-btn--acao')}<button type="button" class="ak-btn ak-btn--linha" data-mva2-acao="cancelar" title="Cancelar (Esc)">${L(xIc)}<span>Cancelar</span></button></span>
      <p class="ak-erro-campo minv2-erro" data-mva2-erro="${k}" role="alert" hidden></p>
    </form>
    <div class="mva2-ctx" data-mva2-ctx="${k}" hidden></div>`;
  const lst = (k: Tab, titulo: string, extra = '') => `<section class="lf2-lista dv2-lista minv2-lista mva2-lista"><div class="lf2-lista-cab minv2-lista-cab"><h2 data-mva2-t="${k}">${titulo}</h2><p class="lf2-resumo" data-mva2-resumo="${k}"></p>${extra}</div><div class="lf2-grelha lf2-grelha--ajusta minv2-g" data-mva2-g="${k}" tabindex="-1"></div>${k === 'mov' ? '<nav class="minv2-pag" data-mva2-pag aria-label="Páginas"></nav>' : ''}</section>`;
  return `<div class="hm ak lf2 dv2 mac mst mva minv2 mva2" data-hm data-mva2 data-mva2-cenario="${cen}" data-teclas="F1 F2 F3 F4 F5 F9 F10 F11 F12 Escape">
  ${topoErp([['ERP', 'inicio'], ['Stocks', ''], ['Mapas', ''], ['Movimentos de artigos', '']])}
  <header class="ak-cab lf2-cab"><span class="ak-cab-ic">${L(arrowLeftRight)}</span>
    <div><h1>Movimentos de artigos</h1><p>As entradas e saídas de cada artigo, o extrato com o stock a cada passo e o saldo por artigo.</p></div></header>
  <nav class="dv2c-vistas-zona" aria-label="Separadores"><div class="dv2-vistas dv2c-vistas" role="tablist" aria-label="Ver">${TABS.map((t, i) => `<button type="button" role="tab" id="${id(`tab-${t.k}`)}" aria-controls="${id(`p-${t.k}`)}" aria-selected="${i === 0}"${i ? ' tabindex="-1"' : ''} data-mva2-tab="${t.k}">${L(t.ic)}<span>${t.t}</span></button>`).join('')}<i class="dv2c-vistas-ind" data-mva2-ind aria-hidden="true"></i></div></nav>
  <div class="ak-barra lf2-barra mva2-barra" role="toolbar" aria-label="Ações">
    <span data-mva2-so="mov">${B('atualizar', refresh, 'Atualizar', 'F9')}${B('imprimir', printer, 'Imprimir', 'F11')}<i class="ak-sep" aria-hidden="true"></i>${B('extrato', fileText, 'Ver extrato', 'Enter')}</span>
    <span data-mva2-so="ext sal" hidden>${B('imprimir2', printer, 'Imprimir', 'F12')}</span>
    <i class="ak-sep" aria-hidden="true"></i>
    <span data-mva2-so="mov">${B('excel', sheet, 'Exportar para Excel', '')}</span><span data-mva2-so="ext sal" hidden>${B('excel2', sheet, 'Exportar para Excel', 'F4')}</span>
    <span class="ak2-esp"></span>
    <span class="minv2-vistas" role="group" aria-label="Vista"><button type="button" data-mva2-vista="tabela" aria-pressed="true" title="Vista tabela">${L(table)}<span>Tabela</span></button><button type="button" data-mva2-vista="cartoes" aria-pressed="false" title="Vista cartões">${L(grid)}<span>Cartões</span></button></span>
  </div>
  ${lista}${listaRef}
  <section role="tabpanel" id="${id('p-mov')}" aria-labelledby="${id('tab-mov')}" data-mva2-p="mov">
    <form class="minv2-filtros mva2-filtros" novalidate aria-label="Filtros">
      <div class="ak-campo mva2-pesq" role="group" aria-labelledby="${id('pq')}"><span id="${id('pq')}">Pesquisa</span>
        <div class="mva2-pq">
          <span class="dv2-modos" role="radiogroup" aria-label="Visualizar por">${MODOS.map((m, i) => `<button type="button" role="radio" aria-checked="${i === 0}" data-mva2-modo="${m.k}" title="Visualizar por ${m.t.toLowerCase()} (${m.tecla})">${L(m.ic)}<span>${m.t}</span><kbd>${m.tecla}</kbd></button>`).join('')}</span>
          <span class="lf2-comp" role="radiogroup" aria-label="Como compara">${([['inicio', 'Iniciado por', 'Shift+F1'], ['contem', 'Contendo', 'Shift+F2'], ['igual', 'Igual a', 'Shift+F3'], ['encomenda', 'Encomenda', 'Shift+F6']] as const).map(([k, t, tc], i) => `<button type="button" role="radio" aria-checked="${i === 0}" data-mva2-comp="${k}" title="${k === 'encomenda' ? 'As receções de uma encomenda a fornecedor' : `Pesquisa ${t.toLowerCase()}`} (${tc})">${k === 'encomenda' ? L(truck) : ''}${t}</button>`).join('')}</span>
          <div class="minv2-pesq-c">${L(search)}<input type="search" data-mva2-q autocomplete="off" placeholder="${MODOS[0].ph}" aria-labelledby="${id('pq')}"></div>
        </div></div>
      <label class="ak-campo"><span>Armazém</span><select data-mva2-f="armazem">${op('', 'Todos os armazéns')}${ARMAZENS.map((a) => op(a.cod, curto(a.nome))).join('')}</select></label>
      <label class="ak-campo"><span>Tipo de movimento</span><select data-mva2-f="tipo">${op('', 'Todos')}${(Object.keys(NOME_TIPO) as Cod[]).map((k) => op(k, `${k} · ${NOME_TIPO[k]}`)).join('')}</select></label>
      <span class="minv2-filtros-bts"><button type="button" class="ak-btn ak-btn--linha" data-mva2-acao="limpar">${L(funnelX)}<span>Limpar filtros</span></button><button type="button" class="ak-btn ak-btn--linha" data-mva2-acao="mais" aria-expanded="false">${L(sliders)}<span>Mais filtros</span></button></span>
      <div class="minv2-mais mva2-mais" data-mva2-mais hidden>
        <label class="ak-campo mva2-art"><span>Artigo</span><div class="minv2-pesq-c">${L(search)}<input type="text" data-mva2-f="art" list="${id('arts')}" placeholder="Referência ou descrição" autocomplete="off"></div></label>
        <div class="ak-campo dv2-periodo" role="group" aria-labelledby="${id('per')}"><span id="${id('per')}">Período</span><span class="ak2-per"><input type="date" data-mva2-f="de" aria-label="Período — de"><i>a</i><input type="date" data-mva2-f="ate" aria-label="Período — até"></span></div>
      </div>
    </form>
    <ul class="mva2-chips" data-mva2-chips="mov" aria-label="Filtros aplicados"></ul>
    <section class="minv2-kpis mva2-kpis" data-mva2-kpis="mov" aria-label="Resumo"></section>
    ${lst('mov', 'Movimentos', `<label class="minv2-ordem"><span>Ordenar</span><select data-mva2-ordem aria-label="Ordenar por"></select></label>`)}
  </section>
  <section role="tabpanel" id="${id('p-ext')}" aria-labelledby="${id('tab-ext')}" data-mva2-p="ext" hidden>
    ${crit('ext')}
    <section class="minv2-kpis mva2-kpis is-4" data-mva2-kpis="ext" aria-label="Resumo"></section>
    <section class="mva2-graf" data-mva2-graf hidden></section>
    ${lst('ext', 'Extrato')}
  </section>
  <section role="tabpanel" id="${id('p-sal')}" aria-labelledby="${id('tab-sal')}" data-mva2-p="sal" hidden>
    ${crit('sal')}
    <section class="minv2-kpis mva2-kpis is-4" data-mva2-kpis="sal" aria-label="Resumo"></section>
    ${lst('sal', 'Saldo por artigo', `<span class="mva2-grupo-c" data-mva2-grupo-c><label class="rc-agrupar"><span>${L(layers)}Agrupar</span><select data-mva2-grupo aria-label="Agrupar por">${op('', 'Sem grupos')}${op('artigo', 'Por artigo')}${op('armazem', 'Por armazém')}${op('tipo', 'Por tipo de movimento')}${op('mes', 'Por mês')}</select></label><button type="button" class="ak-btn ak-btn--linha" data-mva2-acao="grupos" hidden><span>Fechar todos</span></button></span>`)}
  </section>
  <div data-mva2-janela></div>
  <div class="mac-impressao" aria-hidden="true" data-mva2-impressao></div>
  <footer class="ak-estado lf2-estado" data-mva2-estado role="status" aria-live="polite"></footer>
  <p class="hm-aviso" data-hm-aviso role="status" aria-live="polite"></p>
</div>`;
}

/* ---------- comuns ---------- */
const avisos = new WeakMap<HTMLElement, number>();
function toast(r: HTMLElement, t: string): void { const p = r.querySelector<HTMLElement>('[data-hm-aviso]'); if (!p || !t) return; p.textContent = t; p.classList.add('is-visivel'); clearTimeout(avisos.get(r)); avisos.set(r, window.setTimeout(() => p.classList.remove('is-visivel'), 3200)); }
const vazio = (ic: string, t: string, d: string, botao = '') => `<div class="ak-vazio lf2-vazio">${L(ic)}<p><b>${t}</b>${d}</p>${botao}</div>`;
const kpi = (cls: string, ic: string, t: string, v: string, ctx: string) => `<div class="minv2-kpi ${cls}"><span class="minv2-kpi-ic">${L(ic)}</span><small>${t}</small><b>${v}</b><i>${ctx}</i></div>`;
interface Col { k: string; t: string; w: number; n?: boolean; titulo?: string; cel: (m: Mov) => string; v: (m: Mov) => string | number }
function cols(todos: Mov[]): Record<string, Col> {
  return {
    artigo: { k: 'artigo', t: 'Artigo', w: 17, cel: (m) => `<span class="mva2-art-c"><b class="is-mono">${esc(m.ref)}</b><small>${esc(artigo(m.ref)?.desc ?? '')}</small></span>`, v: (m) => m.ref },
    armazem: { k: 'armazem', t: 'Armazém', w: 9, cel: (m) => esc(m.cod === 'AV' ? 'Todos' : curto(m.armazem)), v: (m) => m.armazem },
    data: { k: 'data', t: 'Data', w: 7.5, cel: (m) => dia(m.data), v: (m) => m.data },
    serie: { k: 'serie', t: 'Série', w: 6.5, cel: (m) => `<span class="is-mono">${esc(m.serie)}</span>`, v: (m) => m.serie },
    doc: { k: 'doc', t: 'Documento', w: 7, cel: (m) => `<b class="is-mono">${esc(m.doc)}</b>`, v: (m) => m.doc },
    preco: { k: 'preco', t: 'Preço', w: 7, n: true, cel: (m) => eur(m.preco), v: (m) => m.preco },
    tipo: { k: 'tipo', t: 'Tipo de movimento', w: 15, cel: (m) => tipoCel(m, todos), v: (m) => designacao(m) },
    qEnt: { k: 'qEnt', t: 'Qt. entrada', w: 6.5, n: true, cel: (m) => q0(ent(m)), v: ent },
    qSai: { k: 'qSai', t: 'Qt. saída', w: 6.5, n: true, cel: (m) => q0(sai(m)), v: sai },
    vEnt: { k: 'vEnt', t: 'Valor entradas', w: 9, n: true, cel: (m) => e0(m.vEnt), v: (m) => m.vEnt },
    vSai: { k: 'vSai', t: 'Valor saídas', w: 9, n: true, cel: (m) => e0(m.vSai), v: (m) => m.vSai },
    pm: { k: 'pm', t: 'Pr. médio', w: 7, n: true, titulo: 'O preço médio ponderado do artigo depois do movimento (todos os armazéns)', cel: (m) => eur(m.pm), v: (m) => m.pm },
    qStk: { k: 'qStk', t: 'Qt. stock', w: 6.5, n: true, titulo: 'O stock do artigo (todos os armazéns) depois do movimento', cel: (m) => `<b>${q0(m.saldoArt)}</b>`, v: (m) => m.saldoArt },
    vStk: { k: 'vStk', t: 'Valor stock', w: 8.5, n: true, cel: (m) => e0(m.valorArt), v: (m) => m.valorArt },
    nrdoc: { k: 'nrdoc', t: 'Nr. doc.', w: 10, cel: (m) => `<b class="is-mono">${esc(m.docCompleto)}</b>`, v: (m) => m.docCompleto },
    cod: { k: 'cod', t: 'Tipo', w: 4.5, cel: (m) => `<span class="is-mono">${m.cod}</span>`, v: (m) => m.cod },
  };
}
const ordenar = (e: Est, ms: Mov[], cs: Col[]) => { if (!e.ordem) return ms; const c = cs.find((x) => x.k === e.ordem!.k); if (!c) return ms; const d = e.ordem.dir; return ms.slice().sort((a, b) => { const x = c.v(a), y = c.v(b); return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'pt', { numeric: true })) * d; }); };
function tab(e: Est, cs: Col[], corpo: string, rodape: string, rotulo: string, extra = ''): string {
  const sort = (k: string) => e.ordem?.k === k ? (e.ordem.dir === 1 ? 'ascending' : 'descending') : 'none';
  return `<table class="lf2-tab lf2-tab--ajusta mva-tab mva2-tab" aria-label="${esc(rotulo)}"${extra}><colgroup>${cs.map((c) => `<col style="width:${c.w}%">`).join('')}</colgroup>
    <thead><tr>${cs.map((c) => `<th scope="col" class="${c.n ? 'is-num' : ''}" aria-sort="${sort(c.k)}"${c.titulo ? ` title="${esc(c.titulo)}"` : ''}><button type="button" data-mva2-ordenar="${c.k}">${esc(c.t)}${e.ordem?.k === c.k ? `<span class="lf2-ord">${L(e.ordem.dir === 1 ? arrowUp : arrowDown)}</span>` : ''}</button></th>`).join('')}</tr></thead>
    <tbody>${corpo}</tbody><tfoot>${rodape}</tfoot></table>`;
}

/* ---------- Movimentos ---------- */
const compara = (c: Comp, v: string, q: string) => { const a = sem(v), b = sem(q); return c === 'igual' ? a === b : c === 'contem' || c === 'encomenda' ? a.includes(b) : a.startsWith(b); };
function filtrarMov(e: Est, todos = todosMovimentos()): Mov[] {
  const q = e.q.trim(), art = resolver(e.art);
  return todos.filter((m) => (!e.armazem || codArm(m.armazem) === e.armazem || m.cod === 'AV') && (!art || m.ref === art || (art.length > 0 && !ARTIGOS.some((a) => a.ref === art) && (sem(m.ref).includes(sem(art)) || sem(artigo(m.ref)?.desc ?? '').includes(sem(art))))) && (!e.tipo || m.cod === e.tipo) && (!e.de || m.data >= e.de) && (!e.ate || m.data <= e.ate)
    && (!q || (e.comp === 'encomenda' ? compara('contem', m.enc, q) : e.modo === 'artigo' ? compara(e.comp, m.ref, q) : e.modo === 'descricao' ? compara(e.comp, artigo(m.ref)?.desc ?? '', q)
      : e.modo === 'armazem' ? compara(e.comp, m.armazem, q) || compara(e.comp, codArm(m.armazem), q) : e.modo === 'data' ? compara(e.comp, dia(m.data), q) : compara(e.comp, `${m.serie} ${m.doc}`, q) || compara(e.comp, m.doc, q))))
    .sort((a, b) => e.modo === 'descricao' ? (artigo(a.ref)?.desc ?? '').localeCompare(artigo(b.ref)?.desc ?? '', 'pt') || a.n - b.n : e.modo === 'armazem' ? a.armazem.localeCompare(b.armazem) || a.n - b.n : e.modo === 'artigo' ? a.ref.localeCompare(b.ref, 'pt', { numeric: true }) || a.n - b.n : e.modo === 'documento' ? `${a.serie}${a.doc}`.localeCompare(`${b.serie}${b.doc}`, 'pt', { numeric: true }) : b.n - a.n);
}
const nFiltrosMov = (e: Est) => [e.q.trim(), e.armazem, e.art.trim(), e.tipo, e.de, e.ate].filter(Boolean).length;
const ORDENS: [string, string][] = [['', 'A da visualização'], ['data:-1', 'Data (mais recente primeiro)'], ['data:1', 'Data (mais antiga primeiro)'], ['artigo:1', 'Artigo (A–Z)'], ['vEnt:-1', 'Valor entradas (maior primeiro)'], ['vSai:-1', 'Valor saídas (maior primeiro)'], ['qEnt:-1', 'Qt. entrada (maior primeiro)'], ['qSai:-1', 'Qt. saída (maior primeiro)'], ['tipo:1', 'Tipo de movimento'], ['armazem:1', 'Armazém'], ['doc:1', 'Documento']];
function desenharMov(r: HTMLElement, e: Est, revelar = false): void {
  const todos = todosMovimentos(), C = cols(todos), cs = [C.artigo, C.armazem, C.data, C.serie, C.doc, C.preco, C.tipo, C.qEnt, C.qSai, C.vEnt, C.vSai];
  const ms = ordenar(e, filtrarMov(e, todos), cs), g = r.querySelector<HTMLElement>('[data-mva2-g="mov"]')!, pagEl = r.querySelector<HTMLElement>('[data-mva2-pag]')!;
  g.dataset.vista = e.vista.mov; pagEl.innerHTML = '';
  /* os filtros aplicados, cada um com o seu × */
  const chips: [string, string][] = [];
  if (e.q.trim()) chips.push(['q', `${e.comp === 'encomenda' ? 'Encomenda' : MODOS.find((x) => x.k === e.modo)!.t} ${({ inicio: 'começa por', contem: 'contém', igual: 'igual a', encomenda: 'contém' })[e.comp]} «${e.q.trim()}»`]);
  if (e.armazem) chips.push(['armazem', `Armazém ${curto(ARMAZENS.find((a) => a.cod === e.armazem)?.nome ?? e.armazem)}`]);
  if (e.art.trim()) chips.push(['art', `Artigo ${resolver(e.art)}`]);
  if (e.tipo) chips.push(['tipo', NOME_TIPO[e.tipo as Cod]]);
  if (e.de || e.ate) chips.push(['periodo', `${e.de ? dia(e.de) : '…'} a ${e.ate ? dia(e.ate) : '…'}`]);
  const ch = r.querySelector<HTMLElement>('[data-mva2-chips="mov"]')!; ch.hidden = !chips.length;
  ch.innerHTML = chips.map(([k, t]) => `<li><button type="button" data-mva2-tirar="${k}" title="Tirar este filtro">${esc(t)}${L(xIc)}</button></li>`).join('');
  /* os indicadores: entradas e saídas da empresa (sem as transferências internas, salvo com armazém) */
  const k = r.querySelector<HTMLElement>('[data-mva2-kpis="mov"]')!, emp = daEmpresa(ms, !!e.armazem), tra = ms.filter((m) => m.cod === 'TA' && !e.armazem), av = ms.filter((m) => m.cod === 'AV');
  const docs = new Set(ms.map((m) => m.docCompleto).filter((x) => x !== '—')).size;
  k.hidden = !ms.length;
  k.innerHTML = ms.length ? `${kpi('is-com', entraIc, 'Entradas', `${nf(soma(emp, ent))} un.`, `${eur(soma(emp.filter((m) => m.cod !== 'AV'), (m) => m.vEnt))} · ${pl(emp.filter((m) => ent(m) > 0).length, 'movimento', 'movimentos')}`)}
    ${kpi('', saiIc, 'Saídas', `${nf(soma(emp, sai))} un.`, `${eur(soma(emp.filter((m) => m.cod !== 'AV'), (m) => m.vSai))} · ${pl(emp.filter((m) => sai(m) > 0).length, 'movimento', 'movimentos')}`)}
    ${kpi('', boxes, 'Artigos movimentados', nf(new Set(ms.map((m) => m.ref)).size), `de ${nf(ARTIGOS.length)} artigos`)}
    ${kpi('', fileText, 'Movimentos', nf(ms.length), pl(docs, 'documento', 'documentos'))}
    ${e.armazem ? kpi('', repeat, 'Transferências', nf(ms.filter((m) => m.cod === 'TA').length), 'contam como entradas e saídas deste armazém') : kpi('', repeat, 'Não contam', `${pl(tra.length / 2, 'transferência', 'transferências')}`, `${nf(soma(tra, ent))} un. entre armazéns${av.length ? ` · ${pl(av.length, 'ajuste', 'ajustes')} em valor ${eur(soma(av, (m) => m.vEnt - m.vSai))}` : ''}`)}` : '';
  r.querySelector<HTMLElement>('[data-mva2-resumo="mov"]')!.innerHTML = `<span><b>${nf(ms.length)}</b> ${ms.length === 1 ? 'movimento' : 'movimentos'}</span>${e.art && ARTIGOS.some((a) => a.ref === resolver(e.art)) ? `<span>Pr. médio de ${esc(resolver(e.art))} <b>${eur(todos.filter((m) => m.ref === resolver(e.art)).pop()?.pm ?? artigo(resolver(e.art))?.preco ?? 0)}</b></span>` : ''}`;
  const os = r.querySelector<HTMLSelectElement>('[data-mva2-ordem]')!; if (!os.options.length) os.innerHTML = ORDENS.map(([v, t]) => op(v, t)).join(''); os.value = e.ordem ? `${e.ordem.k}:${e.ordem.dir}` : ''; os.closest('label')!.hidden = !ms.length;
  if (!ms.length) { g.innerHTML = e.comp === 'encomenda' && e.q ? vazio(searchX, `Nenhuma receção da encomenda «${esc(e.q)}» lançada no stock.`, 'As receções das Compras entram aqui quando se lançam.', `<button type="button" class="ak-btn" data-mva2-acao="limpar">${L(funnelX)}<span>Limpar a pesquisa</span></button>`)
    : vazio(searchX, 'Nenhum movimento com estes filtros.', e.q ? `Nada ${e.comp === 'inicio' ? 'começa por' : e.comp === 'igual' ? 'é exatamente' : 'contém'} «${esc(e.q)}».` : 'Alarga o período ou tira um filtro.', `<button type="button" class="ak-btn" data-mva2-acao="limpar">${L(funnelX)}<span>Limpar filtros</span></button>`); return; }
  const pp = e.pp || ms.length, nPags = Math.max(1, Math.ceil(ms.length / pp)); e.pagina = Math.max(0, Math.min(nPags - 1, e.pagina));
  const pag = ms.slice(e.pagina * pp, e.pagina * pp + pp);
  if (e.vista.mov === 'cartoes') g.innerHTML = `<div class="minv2-cartoes" role="list">${pag.map((m) => cartaoMov(e, m, todos)).join('')}</div><p class="minv2-c-total"><span>Total · ${pl(ms.length, 'movimento', 'movimentos')}</span><b>+${nf(soma(ms, ent))} / −${nf(soma(ms, sai))} un.</b><b>${eur(soma(ms, (m) => m.vEnt))} / ${eur(soma(ms, (m) => m.vSai))}</b></p>`;
  else {
    const corpo = pag.map((m) => `<tr class="mva-linha${m.anulacao ? ' is-anulado' : ''}${String(m.n) === e.sel ? ' is-ativo' : ''}" data-mva2-n="${m.n}" data-mva2-ref="${esc(m.ref)}" data-mva2-ano="${m.data.slice(0, 4)}" tabindex="${String(m.n) === e.sel ? 0 : -1}" aria-selected="${String(m.n) === e.sel}">${cs.map((c) => `<td class="${c.n ? 'is-num' : ''}">${c.cel(m)}</td>`).join('')}</tr>`).join('');
    const rod = `<tr class="rc-total mac-total"><td colspan="7"><b>Total · ${pl(ms.length, 'movimento', 'movimentos')}</b></td><td class="is-num"><b>${nf(soma(ms, ent))}</b></td><td class="is-num"><b>${nf(soma(ms, sai))}</b></td><td class="is-num"><b>${eur(soma(ms, (m) => m.vEnt))}</b></td><td class="is-num"><b>${eur(soma(ms, (m) => m.vSai))}</b></td></tr>`;
    g.innerHTML = tab(e, cs, corpo, rod, 'Movimentos', ' data-paginada');
    if (!g.querySelector('tr[tabindex="0"]')) g.querySelector<HTMLElement>('tr[data-mva2-n]')?.setAttribute('tabindex', '0');
  }
  pagEl.innerHTML = `<span class="minv2-pag-n">${nf(e.pagina * pp + 1)}–${nf(e.pagina * pp + pag.length)} de ${nf(ms.length)}</span>
    <button type="button" class="ak-btn ak-btn--linha" data-mva2-pag-ir="-1" ${e.pagina === 0 ? 'disabled' : ''} aria-label="Página anterior">${L(chevL)}</button><span class="minv2-pag-p">Página <b>${e.pagina + 1}</b> de ${nPags}</span>
    <button type="button" class="ak-btn ak-btn--linha" data-mva2-pag-ir="1" ${e.pagina >= nPags - 1 ? 'disabled' : ''} aria-label="Página seguinte">${L(chevR)}</button>
    <label class="minv2-pp"><span>Por página</span><select data-mva2-pp>${[10, 25, 50, 0].map((n) => op(String(n), n ? String(n) : 'Todos', String(e.pp))).join('')}</select></label>`;
  if (revelar && !quieto()) g.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: 'cubic-bezier(.22, 1, .36, 1)' });
}
function cartaoMov(e: Est, m: Mov, todos: Mov[]): string {
  const n = nat(m), a = artigo(m.ref), q = m.qtd, p = pernas(m, todos);
  const onde = n === 'tra' && p.de && p.para ? `${curto(p.de.armazem)} → ${curto(p.para.armazem)}` : m.cod === 'AV' ? 'Todos os armazéns' : curto(m.armazem);
  return `<article role="listitem" class="minv2-cartao mva2-cartao is-${n}${String(m.n) === e.sel ? ' is-ativo' : ''}" data-mva2-n="${m.n}" data-mva2-ref="${esc(m.ref)}" data-mva2-ano="${m.data.slice(0, 4)}" tabindex="${String(m.n) === e.sel ? 0 : -1}" aria-selected="${String(m.n) === e.sel}" aria-label="${esc(`${designacao(m)} · ${m.ref} · ${dia(m.data)}`)}">
    <header><b class="is-mono">${esc(m.ref)}</b>${tipoCel(m, todos).replace(/<small>.*<\/small>/, '')}</header>
    <h3 title="${esc(a?.desc ?? '')}">${esc(a?.desc ?? '')}</h3>
    <p class="minv2-fam">${dia(m.data)} · <span class="is-mono">${esc(m.docCompleto)}</span> · ${esc(onde)}</p>
    <dl class="minv2-nums"><div><dt>${q > 0 ? 'Entrada' : q < 0 ? 'Saída' : 'Quantidade'}</dt><dd class="mva2-q is-${n}">${q > 0 ? '+' : q < 0 ? '−' : ''}${q ? nf(Math.abs(q)) : '—'} ${q ? `<small>${esc(a?.un ?? '')}</small>` : ''}</dd></div><div><dt>Preço</dt><dd>${eur(m.preco)}</dd></div><div class="is-valor"><dt>Valor</dt><dd>${m.vEnt ? eur(m.vEnt) : m.vSai ? `−${eur(m.vSai)}` : zero(eur(0))}</dd></div></dl>
    <footer><button type="button" class="ak-btn ak-btn--linha" data-mva2-ver="${m.n}">${L(eye)}<span>Ver detalhes</span></button></footer>
  </article>`;
}
function janela(r: HTMLElement, e: Est): void {
  const c = r.querySelector<HTMLElement>('[data-mva2-janela]')!;
  const todos = todosMovimentos(), m = e.jan && e.tab === 'mov' ? todos.find((x) => String(x.n) === e.sel) : undefined;
  if (!m) { c.innerHTML = ''; return; }
  const a = artigo(m.ref), p = pernas(m, todos), n = nat(m);
  const w = Math.min(440, innerWidth - 24), y = Math.round(Math.max(0, r.querySelector('.mva2-barra')?.getBoundingClientRect().bottom ?? 88) + 8), x = Math.max(12, innerWidth - w - 24);
  const foco = c.contains(document.activeElement);
  const linha = (t: string, v: string) => `<div><dt>${t}</dt><dd>${v}</dd></div>`;
  c.innerHTML = `<section data-por-cima class="lf2-jan minv2-jan" data-mva2-jan role="dialog" aria-label="Movimento ${esc(m.docCompleto)}" tabindex="-1" style="left:${x}px;top:${y}px;width:${w}px;max-height:min(620px, calc(100vh - ${y + 12}px))">
    <header class="lf2-jan-cab">${L(IC_NAT[n])}<h3>Movimento · <b>${esc(m.docCompleto === '—' ? NOME_TIPO[m.cod] : m.docCompleto)}</b></h3><span class="lf2-jan-bts"><button type="button" data-mva2-acao="fechar-jan" data-lf2-jan-acao="fechar" aria-label="Fechar (Esc)" title="Fechar (Esc)">${L(xIc)}</button></span></header>
    <div class="lf2-jan-corpo">
      <div class="minv2-jan-id"><p class="minv2-jan-desc">${tipoCel(m, todos)}</p><p class="minv2-fam">${dia(m.data)}${m.anulacao ? ' · anulação de um movimento anterior' : ''}</p></div>
      <dl class="mva2-dl">${linha('Artigo', `<b class="is-mono">${esc(m.ref)}</b> ${esc(a?.desc ?? '')}`)}${linha('Armazém', esc(m.cod === 'AV' ? 'Todos (só valor)' : curto(m.armazem)))}${linha('Série e documento', `<span class="is-mono">${esc(m.docCompleto)}</span>`)}${m.enc ? linha('Encomenda', `<span class="is-mono">${esc(m.enc)}</span>`) : ''}</dl>
      ${n === 'tra' && p.de && p.para ? `<h4 class="minv2-jan-t">${L(repeat)}As duas pernas da transferência</h4><ul class="minv2-movs"><li><span class="minv2-mov-d">Sai de</span><span class="minv2-mov-t">${esc(curto(p.de.armazem))}</span><b>−${nf(-p.de.qtd)}</b></li><li><span class="minv2-mov-d">Entra em</span><span class="minv2-mov-t">${esc(curto(p.para.armazem))}</span><b class="is-ent">+${nf(p.para.qtd)}</b></li></ul><p class="minv2-jan-nota">Não é entrada nem saída da empresa: o stock total do artigo não muda.</p>` : ''}
      ${m.cod === 'AV' ? '<p class="minv2-jan-nota">Ajustamento só em valor: a quantidade não muda, muda o custo.</p>' : ''}
      <dl class="minv2-nums minv2-jan-nums"><div><dt>Quantidade</dt><dd>${m.qtd ? `${m.qtd > 0 ? '+' : '−'}${nf(Math.abs(m.qtd))}` : '—'} <small>${esc(a?.un ?? '')}</small></dd></div><div><dt>Preço</dt><dd>${eur(m.preco)}</dd></div><div class="is-valor"><dt>Valor</dt><dd>${m.vEnt ? eur(m.vEnt) : m.vSai ? `−${eur(m.vSai)}` : eur(0)}</dd></div></dl>
      <h4 class="minv2-jan-t">${L(scale)}Depois deste movimento</h4>
      <dl class="minv2-nums"><div><dt>Stock do artigo</dt><dd>${nf(m.saldoArt)} <small>${esc(a?.un ?? '')}</small></dd></div><div><dt>Preço médio</dt><dd>${eur(m.pm)}</dd></div><div class="is-valor"><dt>Valor stock</dt><dd>${eur(m.valorArt)}</dd></div></dl>
      <p class="mva2-jan-acoes"><button type="button" class="ak-btn" data-mva2-acao="extrato">${L(fileText)}<span>Ver extrato do artigo</span><kbd>Enter</kbd></button></p>
    </div></section>`;
  if (foco) c.querySelector<HTMLElement>('[data-mva2-jan]')?.focus({ preventScroll: true });
}

/* ---------- Extrato ---------- */
function extDados(f: { art: string; ano: string }) {
  const todos = todosMovimentos().filter((m) => m.ref === f.art), ano = Number(f.ano);
  const antes = todos.filter((m) => Number(m.data.slice(0, 4)) < ano), noAno = todos.filter((m) => Number(m.data.slice(0, 4)) === ano);
  const ab = antes[antes.length - 1], fim = noAno[noAno.length - 1] ?? ab, emp = daEmpresa(noAno, false);
  const ate = `${f.ano}-12-31` < HOJE ? `${f.ano}-12-31` : HOJE;
  return { todos, antes, noAno, ab, fim, emp, ate, ini: ab?.saldoArt ?? 0, vIni: ab?.valorArt ?? 0, entQ: soma(emp, ent), saiQ: soma(emp, sai), entV: soma(emp.filter((m) => m.cod !== 'AV'), (m) => m.vEnt), saiV: soma(emp.filter((m) => m.cod !== 'AV'), (m) => m.vSai), fimQ: fim?.saldoArt ?? 0, fimV: fim?.valorArt ?? 0 };
}
function grafico(e: Est, d: ReturnType<typeof extDados>, ano: string): string {
  const valor = e.extGraf === 'valor', W = 760, H = 170, P = { l: 56, r: 12, t: 12, b: 26 };
  const t0 = Date.parse(`${ano}-01-01`), t1 = Date.parse(d.ate) + 86400000;
  /* um ponto por dia com movimentos: o saldo no fim desse dia; entre eles o saldo não muda (degraus) */
  const porDia = new Map<string, Mov>(); d.noAno.forEach((m) => porDia.set(m.data, m));
  const pts: [number, number, string][] = [[t0, valor ? d.vIni : d.ini, 'Início do ano']];
  [...porDia].forEach(([dt, m]) => pts.push([Date.parse(dt), valor ? m.valorArt : m.saldoArt, dt]));
  const max = Math.max(1, ...pts.map((p) => p[1])), X = (t: number) => P.l + ((t - t0) / (t1 - t0)) * (W - P.l - P.r), Y = (v: number) => P.t + (1 - v / max) * (H - P.t - P.b);
  let dd = `M${X(pts[0][0]).toFixed(1)},${Y(pts[0][1]).toFixed(1)}`;
  pts.slice(1).forEach(([t, v], i) => { dd += ` H${X(t).toFixed(1)} V${Y(v).toFixed(1)}`; void i; });
  dd += ` H${X(t1).toFixed(1)}`;
  const meses = Array.from({ length: 12 }, (_, i) => Date.parse(`${ano}-${String(i + 1).padStart(2, '0')}-01`)).filter((t) => t < t1);
  const fmt = (v: number) => (valor ? eur(v) : nf(v));
  return `<div class="mva2-graf-cab"><h3>${L(chart)}Evolução do stock em ${ano}</h3><span class="minv2-vistas" role="group" aria-label="Medida"><button type="button" data-mva2-graf="qtd" aria-pressed="${!valor}">Quantidade</button><button type="button" data-mva2-graf="valor" aria-pressed="${valor}">Valor</button></span>
    <p>Um ponto por dia com movimentos (saldo no fim do dia); entre dois pontos o stock não mudou. Até ${dia(d.ate)}.</p></div>
    <svg class="mva2-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolução do stock ${valor ? 'em valor' : 'em quantidade'}: de ${fmt(pts[0][1])} a ${fmt(pts[pts.length - 1][1])}">
      ${[0, .5, 1].map((f) => `<line class="mva2-svg-g" x1="${P.l}" x2="${W - P.r}" y1="${Y(max * f)}" y2="${Y(max * f)}"></line><text class="mva2-svg-y" x="${P.l - 6}" y="${Y(max * f) + 4}">${valor ? EF.format(Math.round(max * f) / 100).replace(/,\d+$/, '') + ' €' : nf(Math.round(max * f))}</text>`).join('')}
      ${meses.map((t) => `<text class="mva2-svg-x" x="${X(t) + 2}" y="${H - 8}">${new Date(t).toLocaleDateString('pt-PT', { month: 'short' }).replace('.', '')}</text>`).join('')}
      <path class="mva2-svg-l" d="${dd}"></path>
      ${pts.map(([t, v, dt]) => `<circle class="mva2-svg-p" cx="${X(t).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="3.5"><title>${dt === 'Início do ano' ? 'Início do ano' : dia(dt)}: ${fmt(v)}</title></circle>`).join('')}
    </svg>`;
}
function desenharExt(r: HTMLElement, e: Est, revelar = false): void {
  const g = r.querySelector<HTMLElement>('[data-mva2-g="ext"]')!, k = r.querySelector<HTMLElement>('[data-mva2-kpis="ext"]')!, gr = r.querySelector<HTMLElement>('[data-mva2-graf]')!, t = r.querySelector<HTMLElement>('[data-mva2-t="ext"]')!;
  g.dataset.vista = e.vista.ext;
  const f = e.extFeito;
  if (e.fase === 'a-gerar') { k.hidden = true; gr.hidden = true; g.innerHTML = `<div class="minv2-a-gerar" role="status">${L(loader)}<p><b>A gerar o extrato…</b>Esc cancela.</p></div>`; return; }
  if (!f) { k.hidden = true; gr.hidden = true; t.textContent = 'Extrato'; g.innerHTML = vazio(play, 'Escolhe o artigo e o ano e gera o extrato.', 'Escreve a referência ou parte da descrição; F10 gera.'); return; }
  const a = artigo(f.art)!, d = extDados(f);
  t.textContent = `Extrato de ${a.ref} em ${f.ano}`;
  const traN = d.noAno.filter((m) => m.cod === 'TA').length / 2;
  k.hidden = false;
  k.innerHTML = `${kpi('', calendar, 'Stock no início do ano', `${nf(d.ini)} ${esc(a.un)}`, `${eur(d.vIni)} a 01/01/${f.ano}`)}${kpi('is-com', entraIc, 'Entradas do período', `${nf(d.entQ)} ${esc(a.un)}`, eur(d.entV))}${kpi('', saiIc, 'Saídas do período', `${nf(d.saiQ)} ${esc(a.un)}`, eur(d.saiV))}${kpi('is-total', boxes, 'Stock no fim do período', `${nf(d.fimQ)} ${esc(a.un)}`, `${eur(d.fimV)} a ${dia(d.ate)} · pr. médio ${eur(d.fim?.pm ?? a.preco ?? 0)}`)}
    <p class="mva2-conta">${nf(d.ini)} + ${nf(d.entQ)} − ${nf(d.saiQ)} = <b>${nf(d.fimQ)}</b>${d.ini + d.entQ - d.saiQ === d.fimQ ? '' : ' <span class="mva2-conta-erro">(não bate)</span>'}${traN ? ` · ${pl(traN, 'transferência', 'transferências')} entre armazéns não ${traN === 1 ? 'conta' : 'contam'}` : ''}${d.noAno.some((m) => m.cod === 'AV') ? ' · os ajustes em valor não mexem nas unidades' : ''}</p>`;
  r.querySelector<HTMLElement>('[data-mva2-resumo="ext"]')!.innerHTML = `<span>${pl(d.noAno.length, 'movimento', 'movimentos')}</span>`;
  gr.hidden = !d.noAno.length || e.vista.ext === 'cartoes'; if (!gr.hidden) gr.innerHTML = grafico(e, d, f.ano);
  if (!d.noAno.length) { g.innerHTML = vazio(inbox, `${esc(a.ref)} não teve movimentos em ${f.ano}.`, 'O stock ficou igual todo o ano. Escolhe outro ano ou outro artigo.', `<button type="button" class="ak-btn" data-mva2-acao="alterar">${L(pencil)}<span>Alterar critérios</span></button>`); return; }
  if (e.vista.ext === 'cartoes') { g.innerHTML = cartoesExt(d, f.ano, a.un); return; }
  const C = cols(d.todos), cs: Col[] = [C.armazem, C.nrdoc, C.data, { ...C.tipo, t: 'Documento', w: 15 }, { ...C.preco, t: 'Preço unitário', w: 8 }, C.qEnt, { ...C.vEnt, t: 'Valor entrada', w: 8 }, C.qSai, { ...C.vSai, t: 'Valor saída', w: 8 }, C.pm, C.qStk, C.vStk];
  const linhaAb = `<tr class="mva-abertura"><td colspan="${cs.length - 2}"><b>Saldo do ano anterior</b> <small>a 31/12/${Number(f.ano) - 1}</small></td><td class="is-num"><b>${nf(d.ini)}</b></td><td class="is-num"><b>${eur(d.vIni)}</b></td></tr>`;
  const corpo = `${linhaAb}${d.noAno.map((m) => `<tr class="${m.anulacao ? 'is-anulado' : ''}">${cs.map((c) => `<td class="${c.n ? 'is-num' : ''}">${c.cel(m)}</td>`).join('')}</tr>`).join('')}`;
  const rod = `<tr class="rc-total mac-total"><td colspan="5"><b>Total do ano</b> <small>(com as transferências)</small></td><td class="is-num"><b>${nf(soma(d.noAno, ent))}</b></td><td class="is-num"><b>${eur(soma(d.noAno, (m) => m.vEnt))}</b></td><td class="is-num"><b>${nf(soma(d.noAno, sai))}</b></td><td class="is-num"><b>${eur(soma(d.noAno, (m) => m.vSai))}</b></td><td></td><td></td><td></td></tr>
    <tr class="rc-total mva2-final"><td colspan="${cs.length - 2}"><b>Saldo final</b> <small>a ${dia(d.ate)}</small></td><td class="is-num"><b>${nf(d.fimQ)}</b></td><td class="is-num"><b>${eur(d.fimV)}</b></td></tr>`;
  g.innerHTML = tab(e, cs, corpo, rod, 'Extrato do artigo');
  if (revelar && !quieto()) g.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180 });
}
function cartoesExt(d: ReturnType<typeof extDados>, ano: string, un: string): string {
  const ultimoMes = Number(d.ate.slice(5, 7));
  let saldo = d.ini;
  const meses = Array.from({ length: ultimoMes }, (_, i) => {
    const mm = `${ano}-${String(i + 1).padStart(2, '0')}`, xs = d.noAno.filter((m) => m.data.startsWith(mm)), emp = daEmpresa(xs, false);
    if (xs.length) saldo = xs[xs.length - 1].saldoArt;
    const nome = new Date(`${mm}-01`).toLocaleDateString('pt-PT', { month: 'long' });
    return `<article class="minv2-cartao mva2-mes${xs.length ? '' : ' is-sem'}"><header><b>${nome[0].toUpperCase() + nome.slice(1)}</b><span class="minv2-sit${xs.length ? ' is-com' : ''}"><i aria-hidden="true"></i>${pl(xs.length, 'movimento', 'movimentos')}</span></header>
      <dl class="minv2-nums"><div><dt>Entradas</dt><dd>${q0(soma(emp, ent))}</dd></div><div><dt>Saídas</dt><dd>${q0(soma(emp, sai))}</dd></div><div class="is-valor"><dt>Stock no fim</dt><dd>${nf(saldo)} <small>${esc(un)}</small></dd></div></dl></article>`;
  }).join('');
  const porArm = ARMAZENS.map((a) => [a, soma(d.todos.filter((m) => m.armazem === a.nome && m.data <= d.ate), (m) => m.qtd)] as const);
  return `<h3 class="minv2-c-grupo"><b>Por mês</b><small>entradas e saídas da empresa (sem transferências)</small></h3><div class="minv2-cartoes">${meses}</div>
    <h3 class="minv2-c-grupo"><b>Por armazém</b><small>stock a ${dia(d.ate)}</small><span>${nf(porArm.reduce((s, [, q]) => s + q, 0))} ${esc(un)} no total</span></h3>
    <div class="minv2-cartoes">${porArm.map(([a, q]) => `<article class="minv2-cartao mva2-mes${q ? '' : ' is-sem'}"><header><b>${esc(curto(a.nome))}</b>${L(warehouse)}</header><dl class="minv2-nums"><div><dt>Stock</dt><dd>${q0(q)} <small>${esc(un)}</small></dd></div><div><dt>Movimentos</dt><dd>${nf(d.noAno.filter((m) => m.armazem === a.nome).length)}</dd></div><div class="is-valor"><dt>Valor</dt><dd>${q ? eur(Math.round(q * (d.fim?.pm ?? 0))) : zero(eur(0))}</dd></div></dl></article>`).join('')}</div>`;
}

/* ---------- Saldo ---------- */
const dentro = (ref: string, ini: string, fim: string) => ref.localeCompare(ini, 'pt', { numeric: true, sensitivity: 'base' }) >= 0 && ref.localeCompare(fim, 'pt', { numeric: true, sensitivity: 'base' }) <= 0;
const chaveGrupo = (g: Grupo, m: Mov) => g === 'artigo' ? m.ref : g === 'armazem' ? (m.cod === 'AV' ? 'Todos (ajustes em valor)' : curto(m.armazem)) : g === 'tipo' ? `${m.cod} · ${NOME_TIPO[m.cod]}` : m.data.slice(0, 7);
const nomeGrupo = (g: Grupo, k: string) => g === 'artigo' ? `${k} · ${artigo(k)?.desc ?? ''}` : g === 'mes' ? new Date(`${k}-01`).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' }) : k;
function desenharSal(r: HTMLElement, e: Est, revelar = false): void {
  const g = r.querySelector<HTMLElement>('[data-mva2-g="sal"]')!, k = r.querySelector<HTMLElement>('[data-mva2-kpis="sal"]')!, f = e.salFeito;
  g.dataset.vista = e.vista.sal;
  const gc = r.querySelector<HTMLElement>('[data-mva2-grupo-c]')!; gc.hidden = !f || e.vista.sal === 'cartoes';
  const gs = r.querySelector<HTMLSelectElement>('[data-mva2-grupo]')!; gs.value = e.salGrupo;
  const gb = r.querySelector<HTMLElement>('[data-mva2-acao="grupos"]')!; gb.hidden = !e.salGrupo;
  if (e.fase === 'a-gerar') { k.hidden = true; g.innerHTML = `<div class="minv2-a-gerar" role="status">${L(loader)}<p><b>A gerar o saldo…</b>Esc cancela.</p></div>`; return; }
  if (!f) { k.hidden = true; g.innerHTML = vazio(play, 'Diz o artigo inicial e o final e gera o saldo.', 'Do 0 ao ZZZZZZ são todos; aceita a referência ou parte da descrição. F10 gera.'); return; }
  const ms = todosMovimentos().filter((m) => dentro(m.ref, f.ini, f.fim)).sort((a, b) => a.ref.localeCompare(b.ref, 'pt', { numeric: true }) || a.n - b.n);
  const arts = [...new Set(ms.map((m) => m.ref))], ult = new Map<string, Mov>(); ms.forEach((m) => ult.set(m.ref, m));
  const emp = daEmpresa(ms, false), ultimaData = ms.reduce((x, m) => (m.data > x ? m.data : x), '');
  const saldoQ = arts.reduce((s, a) => s + (ult.get(a)?.saldoArt ?? 0), 0), saldoV = arts.reduce((s, a) => s + (ult.get(a)?.valorArt ?? 0), 0);
  k.hidden = !ms.length;
  k.innerHTML = ms.length ? `${kpi('', boxes, 'Artigos', nf(arts.length), `de ${esc(f.ini)} a ${esc(f.fim)}`)}${kpi('is-com', entraIc, 'Entradas', `${nf(soma(emp, ent))} un.`, eur(soma(emp.filter((m) => m.cod !== 'AV'), (m) => m.vEnt)))}${kpi('', saiIc, 'Saídas', `${nf(soma(emp, sai))} un.`, eur(soma(emp.filter((m) => m.cod !== 'AV'), (m) => m.vSai)))}${kpi('is-total', scale, `Saldo a ${dia(HOJE)}`, `${nf(saldoQ)} un.`, `${eur(saldoV)} · último movimento a ${dia(ultimaData)}`)}` : '';
  r.querySelector<HTMLElement>('[data-mva2-resumo="sal"]')!.innerHTML = `<span>${pl(ms.length, 'movimento', 'movimentos')}</span><span>${pl(arts.length, 'artigo', 'artigos')}</span>`;
  if (!ms.length) { g.innerHTML = vazio(inbox, 'Nenhum artigo neste intervalo.', `De «${esc(f.ini)}» a «${esc(f.fim)}» não há artigos com movimentos.`, `<button type="button" class="ak-btn" data-mva2-acao="alterar">${L(pencil)}<span>Alterar critérios</span></button>`); return; }
  if (e.vista.sal === 'cartoes') {
    g.innerHTML = `<div class="minv2-cartoes">${arts.map((ref) => { const a = artigo(ref), xs = ms.filter((m) => m.ref === ref), u = ult.get(ref)!, ep = daEmpresa(xs, false);
      return `<article class="minv2-cartao${u.saldoArt ? '' : ' is-sem'}" data-mva2-art="${esc(ref)}"><header><b class="is-mono">${esc(ref)}</b><span class="minv2-sit${u.saldoArt > 0 ? ' is-com' : ''}"><i aria-hidden="true"></i>a ${dia(HOJE)}</span></header><h3 title="${esc(a?.desc ?? '')}">${esc(a?.desc ?? '')}</h3>
        <p class="minv2-fam">+${nf(soma(ep, ent))} / −${nf(soma(ep, sai))} ${esc(a?.un ?? '')} · ${pl(xs.length, 'movimento', 'movimentos')}</p>
        <dl class="minv2-nums"><div><dt>Quantidade</dt><dd>${q0(u.saldoArt)} <small>${esc(a?.un ?? '')}</small></dd></div><div><dt>Pr. médio</dt><dd>${eur(u.pm)}</dd></div><div class="is-valor"><dt>Valor stock</dt><dd>${e0(u.valorArt)}</dd></div></dl>
        <footer><button type="button" class="ak-btn ak-btn--linha" data-mva2-ver-art="${esc(ref)}">${L(list)}<span>Ver movimentos</span></button></footer></article>`; }).join('')}</div>`;
    return;
  }
  const C = cols(ms), cs: Col[] = [{ ...C.artigo, w: 10, cel: (m: Mov) => `<b class="is-mono">${esc(m.ref)}</b>` }, { k: 'desc', t: 'Descrição', w: 14, cel: (m: Mov) => `<span class="minv2-desc" title="${esc(artigo(m.ref)?.desc ?? '')}">${esc(artigo(m.ref)?.desc ?? '')}</span>`, v: (m: Mov) => artigo(m.ref)?.desc ?? '' }, C.data, C.qEnt, C.qSai,
    { k: 'saldo', t: 'Saldo', w: 6.5, n: true, titulo: 'O stock do artigo (todos os armazéns) depois do movimento; cada artigo tem o seu', cel: (m: Mov) => `<b>${q0(m.saldoArt)}</b>`, v: (m: Mov) => m.saldoArt }, { ...C.vEnt, t: 'Valor entrada', w: 8.5 }, { ...C.vSai, t: 'Valor saída', w: 8.5 }, { ...C.pm, t: 'Preço médio' }, C.cod, { ...C.tipo, t: 'Designação tipo doc.', w: 16 }];
  /* sem grupos: uma linha fina entre artigos, para o saldo de cada um se ler sozinho */
  const tr = (m: Mov, i: number, xs: Mov[], oculta = false) => `<tr class="${m.anulacao ? 'is-anulado' : ''}${i > 0 && xs[i - 1].ref !== m.ref ? ' mva2-novo-art' : ''}"${oculta ? ' hidden' : ''}>${cs.map((c) => `<td class="${c.n ? 'is-num' : ''}">${c.cel(m)}</td>`).join('')}</tr>`;
  let corpo: string;
  if (e.salGrupo) {
    const gr = new Map<string, Mov[]>(); ms.forEach((m) => { const kk = chaveGrupo(e.salGrupo, m); gr.set(kk, [...(gr.get(kk) ?? []), m]); });
    corpo = [...gr].sort((a, b) => a[0].localeCompare(b[0], 'pt', { numeric: true })).map(([kk, xs]) => {
      const fechado = e.salFechados.includes(kk), ep = daEmpresa(xs, e.salGrupo === 'armazem');
      return `<tr class="mac-g"><td colspan="${cs.length}"><div class="mac-g-c"><button type="button" class="mac-g-abrir mva2-g-abrir" data-mva2-g-chave="${esc(kk)}" aria-expanded="${!fechado}">${L(chevD)}<b>${esc(nomeGrupo(e.salGrupo, kk))}</b><small>${pl(xs.length, 'movimento', 'movimentos')}</small></button><span class="mac-g-n">entradas <b>${nf(soma(ep, ent))}</b> · saídas <b>${nf(soma(ep, sai))}</b> · ${eur(soma(ep.filter((m) => m.cod !== 'AV'), (m) => m.vEnt))} / ${eur(soma(ep.filter((m) => m.cod !== 'AV'), (m) => m.vSai))}${e.salGrupo === 'artigo' ? ` · saldo <b>${nf(xs[xs.length - 1].saldoArt)}</b>` : ''}</span></div></td></tr>${xs.map((m, i) => tr(m, i, xs, fechado)).join('')}`;
    }).join('');
  } else { const xs = ordenar(e, ms, cs); corpo = xs.map((m, i) => tr(m, i, e.ordem ? [] : xs)).join(''); }
  const rod = `<tr class="rc-total mac-total"><td colspan="3"><b>Total · ${pl(arts.length, 'artigo', 'artigos')}</b> <small>(com as transferências)</small></td><td class="is-num"><b>${nf(soma(ms, ent))}</b></td><td class="is-num"><b>${nf(soma(ms, sai))}</b></td><td></td><td class="is-num"><b>${eur(soma(ms, (m) => m.vEnt))}</b></td><td class="is-num"><b>${eur(soma(ms, (m) => m.vSai))}</b></td><td colspan="3"></td></tr>`;
  g.innerHTML = tab(e, cs, corpo, rod, 'Saldo por artigo');
  gb.querySelector('span')!.textContent = e.salGrupo && e.salFechados.length >= new Set(ms.map((m) => chaveGrupo(e.salGrupo, m))).size ? 'Abrir todos' : 'Fechar todos';
  if (revelar && !quieto()) g.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180 });
}

/* ---------- o todo ---------- */
function indicador(r: HTMLElement): void { const ind = r.querySelector<HTMLElement>('[data-mva2-ind]'), b = r.querySelector<HTMLElement>('[data-mva2-tab][aria-selected="true"]'); if (!ind || !b) return; ind.style.width = `${b.offsetWidth}px`; ind.style.transform = `translateX(${b.offsetLeft}px)`; ind.classList.add('is-pronto'); }
function criterios(r: HTMLElement, e: Est): void {
  (['ext', 'sal'] as const).forEach((k) => {
    const feito = k === 'ext' ? e.extFeito : e.salFeito, editar = (k === 'ext' ? e.extEditar : e.salEditar) || !feito;
    const fm = r.querySelector<HTMLElement>(`[data-mva2-crit="${k}"]`)!, cx = r.querySelector<HTMLElement>(`[data-mva2-ctx="${k}"]`)!;
    fm.hidden = !editar; cx.hidden = editar;
    fm.querySelector<HTMLElement>('[data-mva2-acao="cancelar"]')!.hidden = !feito;
    const v = (c: string, x: string) => { const el = fm.querySelector<HTMLInputElement>(`[data-mva2-c="${c}"]`); if (el && el.value !== x && document.activeElement !== el) el.value = x; };
    if (k === 'ext') { const a = artigo(e.extArt); v('extArt', a ? `${a.ref} · ${a.desc}` : e.extArt); v('extAno', e.extAno); } else { v('salIni', e.salIni); v('salFim', e.salFim); }
    const er = fm.querySelector<HTMLElement>(`[data-mva2-erro="${k}"]`)!; er.hidden = !(e.erro && e.tab === k); er.innerHTML = e.erro ? `${L(alerta)}<span>${esc(e.erro)}</span>` : '';
    if (!feito) { cx.innerHTML = ''; return; }
    if (k === 'ext') {
      const f = e.extFeito!, a = artigo(f.art)!, arms = [...new Set(todosMovimentos().filter((m) => m.ref === f.art && m.data.startsWith(f.ano) && m.armazem).map((m) => curto(m.armazem)))];
      cx.innerHTML = `<span class="mva2-ctx-id"><b class="is-mono">${esc(a.ref)}</b><span>${esc(a.desc)}</span></span><span class="mva2-ctx-i">${L(calendar)}Ano <b>${f.ano}</b></span><span class="mva2-ctx-i">${L(warehouse)}${arms.length ? esc(arms.join(', ')) : 'sem movimentos'}</span><span class="mva2-ctx-i">Hoje: <b>${nf(todosMovimentos().filter((m) => m.ref === f.art).pop()?.saldoArt ?? 0)} ${esc(a.un)}</b> em stock</span><button type="button" class="ak-btn ak-btn--linha" data-mva2-acao="alterar">${L(pencil)}<span>Alterar critérios</span></button>`;
    } else {
      const f = e.salFeito!;
      cx.innerHTML = `<span class="mva2-ctx-id"><b>Artigos</b><span>de <b class="is-mono">${esc(f.ini)}</b> a <b class="is-mono">${esc(f.fim)}</b></span></span><span class="mva2-ctx-i">${L(calendar)}Saldo a <b>${dia(HOJE)}</b></span><button type="button" class="ak-btn ak-btn--linha" data-mva2-acao="alterar">${L(pencil)}<span>Alterar critérios</span></button>`;
    }
  });
}
function tudo(r: HTMLElement, e: Est, revelar = false): void {
  r.querySelectorAll<HTMLElement>('[data-mva2-tab]').forEach((b) => { const s = b.dataset.mva2Tab === e.tab; b.setAttribute('aria-selected', String(s)); b.tabIndex = s ? 0 : -1; });
  r.querySelectorAll<HTMLElement>('[data-mva2-p]').forEach((p) => { p.hidden = p.dataset.mva2P !== e.tab; });
  r.querySelectorAll<HTMLElement>('[data-mva2-so]').forEach((x) => { x.hidden = !x.dataset.mva2So!.split(' ').includes(e.tab); });
  r.querySelectorAll<HTMLElement>('[data-mva2-vista]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mva2Vista === e.vista[e.tab])));
  r.querySelectorAll<HTMLElement>('[data-mva2-modo]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.mva2Modo === e.modo && e.comp !== 'encomenda')));
  r.querySelectorAll<HTMLElement>('[data-mva2-comp]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.mva2Comp === e.comp)));
  const q = r.querySelector<HTMLInputElement>('[data-mva2-q]')!; if (q.value !== e.q && document.activeElement !== q) q.value = e.q;
  q.placeholder = e.comp === 'encomenda' ? 'Encomenda a fornecedor, ex.: EF 2026/04' : MODOS.find((m) => m.k === e.modo)!.ph;
  (['armazem', 'art', 'tipo', 'de', 'ate'] as const).forEach((k) => { const el = r.querySelector<HTMLInputElement>(`[data-mva2-f="${k}"]`)!; if (el.value !== e[k] && document.activeElement !== el) el.value = e[k]; el.closest('.ak-campo')?.classList.toggle('is-ativo', !!e[k]); });
  r.querySelector<HTMLElement>('[data-mva2-mais]')!.hidden = !e.mais;
  const nm = [e.art.trim(), e.de, e.ate].filter(Boolean).length, mb = r.querySelector<HTMLElement>('[data-mva2-acao="mais"]')!;
  mb.setAttribute('aria-expanded', String(e.mais)); mb.querySelector('span')!.textContent = nm ? `Mais filtros (${nm})` : 'Mais filtros';
  r.querySelector<HTMLElement>('[data-mva2-acao="limpar"]')!.setAttribute('aria-disabled', String(!nFiltrosMov(e)));
  criterios(r, e);
  if (e.tab === 'mov') desenharMov(r, e, revelar); else if (e.tab === 'ext') desenharExt(r, e, revelar); else desenharSal(r, e, revelar);
  janela(r, e);
  /* o Ver extrato da barra: com um movimento escolhido */
  const xb = r.querySelector<HTMLElement>('.mva2-barra [data-mva2-acao="extrato"]'); if (xb) { const ok = !!e.sel; xb.setAttribute('aria-disabled', String(!ok)); xb.title = ok ? 'O extrato do artigo deste movimento nesse ano (Enter)' : 'Escolhe primeiro um movimento.'; }
  const pend = (k: 'ext' | 'sal') => k === 'ext' ? !!e.extFeito && e.extEditar && (resolver(e.extArt) !== e.extFeito.art || e.extAno !== e.extFeito.ano) : !!e.salFeito && e.salEditar && (resolver(e.salIni) !== e.salFeito.ini || resolver(e.salFim) !== e.salFeito.fim);
  if (e.tab !== 'mov' && pend(e.tab)) r.querySelector<HTMLElement>(`[data-mva2-resumo="${e.tab}"]`)?.insertAdjacentHTML('beforeend', `<span class="minv2-pendente">${L(alerta)}Os resultados são dos critérios anteriores · F10 gera os novos</span>`);
  r.querySelector<HTMLElement>(`[data-mva2-p="${e.tab}"] .mva2-lista`)?.classList.toggle('is-pendente', e.tab !== 'mov' && pend(e.tab));
  r.querySelector<HTMLElement>('[data-mva2-estado]')!.innerHTML = `<span>Separador <b>${TABS.find((t) => t.k === e.tab)!.t}</b></span>${e.tab === 'mov' ? `<span>Visualização <b>por ${e.comp === 'encomenda' ? 'encomenda a fornecedor' : MODOS.find((m) => m.k === e.modo)!.t.toLowerCase()}</b></span>` : ''}<span>${e.vista[e.tab] === 'cartoes' ? 'Vista cartões' : 'Vista tabela'}</span>${e.fase === 'a-gerar' ? `<span class="ak-estado-f">${L(loader)}A gerar…</span>` : '<span class="ak-estado-f is-ok">Pronto</span>'}${e.aviso ? `<span class="ak-estado-aviso">${esc(e.aviso)}</span>` : ''}`;
  const ip = r.querySelector<HTMLElement>('[data-mva2-impressao]'); if (ip) ip.innerHTML = `<h1>Movimentos de artigos · ${TABS.find((t) => t.k === e.tab)!.t}</h1><p>Impresso a ${new Date().toLocaleString('pt-PT')}</p>`;
  requestAnimationFrame(() => indicador(r));
}
const temporizadores = new WeakMap<HTMLElement, number>();
function gerar(r: HTMLElement, e: Est): void {
  e.erro = '';
  const p = r.querySelector<HTMLElement>(`[data-mva2-p="${e.tab}"]`)!; p.querySelectorAll<HTMLInputElement>('[data-mva2-c]').forEach((x) => { (e as unknown as Record<string, string>)[x.dataset.mva2C!] = x.value; });
  let fazer: () => void;
  if (e.tab === 'ext') {
    const ref = resolver(e.extArt);
    if (!e.extArt.trim()) { e.erro = 'Escolhe o artigo: a referência ou parte da descrição.'; tudo(r, e); p.querySelector<HTMLElement>('[data-mva2-c="extArt"]')?.focus(); return; }
    if (!artigo(ref)) { const n = ARTIGOS.filter((a) => sem(a.ref).includes(sem(e.extArt)) || sem(a.desc).includes(sem(e.extArt))).length; e.erro = n ? `«${e.extArt.trim()}» serve a ${n} artigos; escolhe um da lista.` : `Não há nenhum artigo «${e.extArt.trim()}».`; tudo(r, e); p.querySelector<HTMLElement>('[data-mva2-c="extArt"]')?.focus(); return; }
    e.extArt = ref; fazer = () => { e.extFeito = { art: ref, ano: e.extAno }; e.extEditar = false; };
  } else if (e.tab === 'sal') {
    const ini = resolver(e.salIni) || e.salIni.trim(), fim = resolver(e.salFim) || e.salFim.trim();
    if (!ini || !fim) { e.erro = 'Diz o artigo inicial e o final (0 e ZZZZZZ são todos).'; tudo(r, e); return; }
    if (ini.localeCompare(fim, 'pt', { numeric: true, sensitivity: 'base' }) > 0) { e.erro = `O artigo inicial (${ini}) vem depois do final (${fim}).`; tudo(r, e); p.querySelector<HTMLElement>('[data-mva2-c="salIni"]')?.focus(); return; }
    e.salIni = ini; e.salFim = fim; fazer = () => { e.salFeito = { ini, fim }; e.salEditar = false; e.salFechados = []; };
  } else return;
  e.fase = 'a-gerar'; e.aviso = ''; tudo(r, e);
  temporizadores.set(r, window.setTimeout(() => { if (e.fase !== 'a-gerar') return; e.fase = 'ok'; fazer(); e.ordem = null; tudo(r, e, true); }, quieto() ? 120 : 550));
}
function cancelar(r: HTMLElement, e: Est): void {
  clearTimeout(temporizadores.get(r)); e.fase = 'ok';
  const f = e.tab === 'ext' ? e.extFeito : e.salFeito;
  e.aviso = f ? 'Cancelado · continuam os resultados anteriores.' : 'Cancelado · ainda sem resultados.';
  tudo(r, e); toast(r, e.aviso);
}
function abrirExtrato(r: HTMLElement, e: Est, ref: string, ano: string): void {
  Object.assign(e, { tab: 'ext', extArt: ref, extAno: ano, extFeito: { art: ref, ano }, extEditar: false, ordem: null, erro: '', jan: false }); tudo(r, e, true); toast(r, `Extrato de ${ref} em ${ano}.`);
}
function exportar(r: HTMLElement, e: Est): void {
  let ms: Mov[] = [];
  if (e.tab === 'mov') ms = filtrarMov(e);
  else if (e.tab === 'ext' && e.extFeito) ms = todosMovimentos().filter((m) => m.ref === e.extFeito!.art && m.data.startsWith(e.extFeito!.ano));
  else if (e.tab === 'sal' && e.salFeito) ms = todosMovimentos().filter((m) => dentro(m.ref, e.salFeito!.ini, e.salFeito!.fim));
  if (!ms.length) { toast(r, e.tab === 'mov' ? 'Não há movimentos para exportar.' : 'Gera os dados primeiro (F10).'); return; }
  const ts = ['Artigo', 'Descrição', 'Armazém', 'Data', 'Série', 'Documento', 'Tipo', 'Tipo de movimento', 'Preço', 'Qt. entrada', 'Qt. saída', 'Valor entradas', 'Valor saídas', 'Pr. médio', 'Qt. stock', 'Valor stock'];
  const rows: Celula[][] = ms.map((m) => [m.ref, artigo(m.ref)?.desc ?? '', curto(m.armazem), dia(m.data), m.serie, m.doc, m.cod, designacao(m), { euros: m.preco }, ent(m), sai(m), { euros: m.vEnt }, { euros: m.vSai }, { euros: m.pm }, m.saldoArt, { euros: m.valorArt }]);
  const nome = `Movimentos-de-artigos-${TABS.find((t) => t.k === e.tab)!.t.replace(/\s+/g, '-')}.xlsx`;
  try { descarregar(xlsx({ nome: 'Movimentos', colunas: ts, linhas: rows, larguras: ts.map((t) => Math.max(10, t.length + 4)) }), nome); e.aviso = `Exportado: ${nome} · ${pl(ms.length, 'movimento', 'movimentos')}.`; }
  catch { e.aviso = 'A exportação falhou; tenta outra vez.'; }
  tudo(r, e); toast(r, e.aviso);
}
function escolherMov(r: HTMLElement, e: Est, n: string, abrir: boolean): void {
  e.sel = n; if (abrir) e.jan = true;
  r.querySelectorAll<HTMLElement>('[data-mva2-g="mov"] [data-mva2-n]').forEach((x) => { const s = x.dataset.mva2N === n; x.classList.toggle('is-ativo', s); x.tabIndex = s ? 0 : -1; x.setAttribute('aria-selected', String(s)); });
  const el = r.querySelector<HTMLElement>(`[data-mva2-g="mov"] [data-mva2-n="${n}"]`); el?.focus({ preventScroll: true }); el?.scrollIntoView({ block: 'nearest' });
  janela(r, e); tudo(r, e); r.querySelector<HTMLElement>(`[data-mva2-g="mov"] [data-mva2-n="${n}"]`)?.focus({ preventScroll: true });
}

/* ---------- os cenários ---------- */
function armar(r: HTMLElement): void {
  if (estados.has(r)) return;
  const e = de(r), cen = r.dataset.mva2Cenario ?? 'inicial';
  if (e.editor) e.vista = { mov: 'tabela', ext: 'tabela', sal: 'tabela' };
  if (cen.startsWith('ext')) e.tab = 'ext';
  if (cen.startsWith('sal')) e.tab = 'sal';
  if (cen === 'descricao') e.modo = 'descricao';
  if (cen === 'armazem') { e.modo = 'armazem'; e.armazem = '1'; }
  if (cen === 'documento') { e.modo = 'documento'; e.q = 'TA'; }
  if (cen === 'encomenda') { e.comp = 'encomenda'; e.q = 'EF 2026'; }
  if (cen === 'artigo') { e.art = '6205-2Z'; e.mais = true; }
  if (cen === 'tipo') e.tipo = 'QB';
  if (cen === 'sem-resultados') e.q = 'XPTO';
  if (cen === 'cartoes') { e.vista.mov = 'cartoes'; e.art = '6205-2Z'; }
  if (cen === 'detalhe' || cen === 'transferencia') { const m = todosMovimentos().find((x) => (cen === 'transferencia' ? x.cod === 'TA' : x.cod === 'QB')); if (m) { e.sel = String(m.n); e.jan = true; const i = filtrarMov(e).findIndex((x) => x.n === m.n); if (i >= 0 && e.pp) e.pagina = Math.floor(i / e.pp); } }
  if (['ext-dados', 'ext-2025', 'ext-valor', 'ext-cartoes', 'ext-pendente'].includes(cen)) { e.extArt = '6205-2Z'; e.extAno = cen === 'ext-2025' ? '2025' : '2026'; e.extFeito = { art: e.extArt, ano: e.extAno }; e.extEditar = false; }
  if (cen === 'ext-valor') e.extGraf = 'valor';
  if (cen === 'ext-cartoes') e.vista.ext = 'cartoes';
  if (cen === 'ext-pendente') { e.extEditar = true; e.extArt = '6206-2RSH'; }
  if (cen === 'ext-sem') { e.extArt = '0 986 424 797'; e.extFeito = { art: e.extArt, ano: '2026' }; e.extEditar = false; }
  if (cen === 'ext-erro') e.erro = 'Escolhe o artigo: a referência ou parte da descrição.';
  if (cen === 'ext-a-gerar') { e.extArt = '6205-2Z'; e.fase = 'a-gerar'; }
  if (['sal-dados', 'sal-artigo', 'sal-tipo', 'sal-armazem', 'sal-cartoes', 'sal-fechado'].includes(cen)) { e.salIni = '6'; e.salFim = '9'; e.salFeito = { ini: '6', fim: '9' }; e.salEditar = false; }
  if (cen === 'sal-artigo' || cen === 'sal-fechado') e.salGrupo = 'artigo';
  if (cen === 'sal-fechado') e.salFechados = ['6206-2RSH'];
  if (cen === 'sal-tipo') e.salGrupo = 'tipo';
  if (cen === 'sal-armazem') e.salGrupo = 'armazem';
  if (cen === 'sal-cartoes') { e.salIni = '0'; e.salFim = 'ZZZZZZ'; e.salFeito = { ini: '0', fim: 'ZZZZZZ' }; e.vista.sal = 'cartoes'; }
  if (cen === 'sal-erro') { e.salIni = 'Z'; e.salFim = 'A'; e.erro = 'O artigo inicial (Z) vem depois do final (A).'; }
  if (cen === 'sal-vazio') { e.salIni = 'X1'; e.salFim = 'X9'; e.salFeito = { ini: 'X1', fim: 'X9' }; e.salEditar = false; }
  if (cen === 'exportado') e.aviso = 'Exportado: Movimentos-de-artigos-Movimentos.xlsx.';
  tudo(r, e);
  if (!e.editor && r.closest('.ecra:not([hidden]) > .versao:not([hidden])') && !quieto()) r.classList.add('lf2-entra');
}
const armarTodos = () => document.querySelectorAll<HTMLElement>('[data-mva2]').forEach(armar);
let espera = 0;
export function iniciar(): void {
  requestAnimationFrame(armarTodos);
  ['romafe:versao', 'romafe:ecra'].forEach((y) => document.addEventListener(y, () => requestAnimationFrame(armarTodos)));
  window.addEventListener('resize', () => document.querySelectorAll<HTMLElement>('[data-mva2]').forEach(indicador));
  document.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement, r = raiz(t); if (!r || editando()) return; const e = de(r); let b: HTMLElement | null;
    if ((b = t.closest('[data-mva2-acao][aria-disabled="true"]'))) { toast(r, b.title); return; }
    if ((b = t.closest('[data-mva2-tab]'))) { const nt = b.dataset.mva2Tab as Tab; if (nt === 'ext' && e.art && !e.extFeito && artigo(resolver(e.art))) e.extArt = resolver(e.art); e.tab = nt; e.ordem = null; e.erro = ''; e.jan = false; tudo(r, e); return; }
    if ((b = t.closest('[data-mva2-vista]'))) { e.vista[e.tab] = b.dataset.mva2Vista as Vista; guardar(e); tudo(r, e, true); return; }
    if ((b = t.closest('[data-mva2-modo]'))) { e.modo = b.dataset.mva2Modo as Modo; if (e.comp === 'encomenda') e.comp = 'inicio'; e.pagina = 0; tudo(r, e); r.querySelector<HTMLElement>('[data-mva2-q]')?.focus(); return; }
    if ((b = t.closest('[data-mva2-comp]'))) { e.comp = b.dataset.mva2Comp as Comp; e.pagina = 0; tudo(r, e); r.querySelector<HTMLElement>('[data-mva2-q]')?.focus(); return; }
    if ((b = t.closest('[data-mva2-tirar]'))) { const k = b.dataset.mva2Tirar!; if (k === 'periodo') { e.de = ''; e.ate = ''; } else (e as unknown as Record<string, string>)[k] = ''; e.pagina = 0; tudo(r, e); return; }
    if ((b = t.closest('[data-mva2-ordenar]'))) { const k = b.dataset.mva2Ordenar!; e.ordem = e.ordem?.k === k ? (e.ordem.dir === 1 ? { k, dir: -1 } : null) : { k, dir: 1 }; e.pagina = 0; tudo(r, e); r.querySelector<HTMLElement>(`[data-mva2-ordenar="${k}"]`)?.focus(); return; }
    if ((b = t.closest('[data-mva2-pag-ir]'))) { e.pagina += Number(b.dataset.mva2PagIr); tudo(r, e); return; }
    if ((b = t.closest('[data-mva2-graf]'))) { e.extGraf = b.dataset.mva2Graf as 'qtd' | 'valor'; tudo(r, e); return; }
    if ((b = t.closest('[data-mva2-g-chave]'))) { const k = b.dataset.mva2GChave!; e.salFechados = e.salFechados.includes(k) ? e.salFechados.filter((x) => x !== k) : [...e.salFechados, k]; tudo(r, e); r.querySelector<HTMLElement>(`[data-mva2-g-chave="${CSS.escape(k)}"]`)?.focus(); return; }
    if ((b = t.closest('[data-mva2-ver]'))) { escolherMov(r, e, b.dataset.mva2Ver!, true); r.querySelector<HTMLElement>('[data-mva2-jan]')?.focus(); return; }
    if ((b = t.closest('[data-mva2-ver-art]'))) { Object.assign(e, { tab: 'mov', art: b.dataset.mva2VerArt!, mais: true, q: '', pagina: 0, ordem: null }); tudo(r, e, true); toast(r, `Os movimentos de ${b.dataset.mva2VerArt}.`); return; }
    if ((b = t.closest('[data-mva2-acao]'))) {
      const k = b.dataset.mva2Acao!;
      if (k === 'extrato') { const m = todosMovimentos().find((x) => String(x.n) === e.sel); if (m) abrirExtrato(r, e, m.ref, m.data.slice(0, 4)); }
      else if (k === 'atualizar') { tudo(r, e); toast(r, 'Movimentos atualizados.'); }
      else if (k === 'imprimir' || k === 'imprimir2') window.print();
      else if (k === 'excel' || k === 'excel2') exportar(r, e);
      else if (k === 'limpar') { Object.assign(e, { q: '', armazem: '', art: '', tipo: '', de: '', ate: '', pagina: 0 }); tudo(r, e); toast(r, 'Filtros limpos.'); }
      else if (k === 'mais') { e.mais = !e.mais; tudo(r, e); }
      else if (k === 'gerar') gerar(r, e);
      else if (k === 'cancelar') { if (e.fase === 'a-gerar') cancelar(r, e); else { if (e.tab === 'ext' && e.extFeito) { e.extEditar = false; e.extArt = e.extFeito.art; e.extAno = e.extFeito.ano; } if (e.tab === 'sal' && e.salFeito) { e.salEditar = false; e.salIni = e.salFeito.ini; e.salFim = e.salFeito.fim; } e.erro = ''; tudo(r, e); } }
      else if (k === 'alterar') { if (e.tab === 'ext') e.extEditar = true; else e.salEditar = true; tudo(r, e); r.querySelector<HTMLElement>(`[data-mva2-p="${e.tab}"] [data-mva2-c]`)?.focus(); }
      else if (k === 'fechar-jan') { e.jan = false; tudo(r, e); r.querySelector<HTMLElement>(`[data-mva2-g="mov"] [data-mva2-n="${e.sel}"]`)?.focus(); }
      else if (k === 'grupos') { const ms = todosMovimentos().filter((m) => e.salFeito && dentro(m.ref, e.salFeito.ini, e.salFeito.fim)), ks = [...new Set(ms.map((m) => chaveGrupo(e.salGrupo, m)))]; e.salFechados = e.salFechados.length >= ks.length ? [] : ks; tudo(r, e); }
      return;
    }
    const it = t.closest<HTMLElement>('[data-mva2-g="mov"] [data-mva2-n]');
    if (it && !t.closest('button, a, input, select')) escolherMov(r, e, it.dataset.mva2N!, true);
    const ca = t.closest<HTMLElement>('[data-mva2-g="sal"] [data-mva2-art]');
    if (ca && !t.closest('button')) ca.querySelector<HTMLElement>('[data-mva2-ver-art]')?.focus();
  });
  document.addEventListener('dblclick', (ev) => { const t = ev.target as HTMLElement, r = raiz(t), b = t.closest<HTMLElement>('[data-mva2-g="mov"] tr[data-mva2-n]'); if (!r || !b || editando()) return; abrirExtrato(r, de(r), b.dataset.mva2Ref!, b.dataset.mva2Ano!); });
  document.addEventListener('input', (ev) => {
    const t = ev.target as HTMLInputElement, r = raiz(t); if (!r) return; const e = de(r);
    if (t.matches('[data-mva2-q]')) { clearTimeout(espera); espera = window.setTimeout(() => { e.q = t.value; e.pagina = 0; tudo(r, e); }, 140); }
    if (t.matches('[data-mva2-f="art"]')) { clearTimeout(espera); espera = window.setTimeout(() => { e.art = t.value; e.pagina = 0; tudo(r, e); }, 220); }
    if (t.matches('[data-mva2-c]')) { (e as unknown as Record<string, string>)[t.dataset.mva2C!] = t.value; tudo(r, e); }
  });
  document.addEventListener('change', (ev) => {
    const t = ev.target as HTMLInputElement, r = raiz(t); if (!r || editando()) return; const e = de(r);
    if (t.matches('[data-mva2-f]')) { (e as unknown as Record<string, string>)[t.dataset.mva2F!] = t.value; e.pagina = 0; tudo(r, e); }
    if (t.matches('[data-mva2-c]')) { (e as unknown as Record<string, string>)[t.dataset.mva2C!] = t.value; tudo(r, e); }
    if (t.matches('[data-mva2-grupo]')) { e.salGrupo = t.value as Grupo; e.salFechados = []; tudo(r, e, true); }
    if (t.matches('[data-mva2-pp]')) { e.pp = Number(t.value); e.pagina = 0; guardar(e); tudo(r, e); }
    if (t.matches('[data-mva2-ordem]')) { const [k, d] = t.value.split(':'); e.ordem = k ? { k, dir: Number(d) as 1 | -1 } : null; e.pagina = 0; tudo(r, e); }
  });
  document.addEventListener('submit', (ev) => { if (raiz(ev.target as HTMLElement)) ev.preventDefault(); });
  document.addEventListener('keydown', (ev) => {
    const t = ev.target as HTMLElement, r = raiz(t) ?? visivel(); if (!r || editando()) return; const e = de(r);
    const so = !ev.ctrlKey && !ev.altKey && !ev.metaKey;
    if (t.matches('[data-mva2-tab]') && (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft')) { ev.preventDefault(); const i = TABS.findIndex((x) => x.k === e.tab); e.tab = TABS[(i + (ev.key === 'ArrowRight' ? 1 : -1) + 3) % 3].k; e.jan = false; tudo(r, e); r.querySelector<HTMLElement>(`[data-mva2-tab="${e.tab}"]`)?.focus(); return; }
    if (ev.key === 'Escape') {
      if (e.fase === 'a-gerar') { cancelar(r, e); ev.preventDefault(); return; }
      if (e.jan) { e.jan = false; tudo(r, e); r.querySelector<HTMLElement>(`[data-mva2-n="${e.sel}"]`)?.focus(); ev.preventDefault(); return; }
      if (e.tab === 'mov' && e.q) { e.q = ''; tudo(r, e); ev.preventDefault(); return; }
      if (e.tab !== 'mov') { const ed = e.tab === 'ext' ? e.extEditar && e.extFeito : e.salEditar && e.salFeito; if (ed) { r.querySelector<HTMLElement>(`[data-mva2-p="${e.tab}"] [data-mva2-acao="cancelar"]`)?.click(); ev.preventDefault(); } }
      return;
    }
    if (e.tab === 'mov') {
      const it = t.closest<HTMLElement>('[data-mva2-g="mov"] [data-mva2-n]') ?? (t.matches('[data-mva2-jan]') ? r.querySelector<HTMLElement>(`[data-mva2-g="mov"] [data-mva2-n="${e.sel}"]`) : null);
      if (ev.key === 'Enter' && it && so) { ev.preventDefault(); abrirExtrato(r, e, it.dataset.mva2Ref!, it.dataset.mva2Ano!); return; }
      if (it && so && ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(ev.key) && (e.vista.mov === 'cartoes' || !ev.key.match(/Left|Right/))) {
        const els = [...r.querySelectorAll<HTMLElement>('[data-mva2-g="mov"] [data-mva2-n]')], i = els.indexOf(it);
        const cols = e.vista.mov === 'cartoes' ? Math.max(1, Math.round((els[0].parentElement?.clientWidth ?? 1) / (els[0].offsetWidth + 12))) : 1;
        const j = ev.key === 'ArrowDown' ? i + cols : ev.key === 'ArrowUp' ? i - cols : ev.key === 'ArrowRight' ? i + 1 : ev.key === 'ArrowLeft' ? i - 1 : ev.key === 'Home' ? 0 : els.length - 1;
        const n = els[Math.max(0, Math.min(els.length - 1, j))]; if (n) { ev.preventDefault(); ev.stopImmediatePropagation(); escolherMov(r, e, n.dataset.mva2N!, e.jan); }
        return;
      }
      if (so && ev.shiftKey && ['F1', 'F2', 'F3', 'F6'].includes(ev.key)) { ev.preventDefault(); r.querySelector<HTMLElement>(`[data-mva2-comp="${{ F1: 'inicio', F2: 'contem', F3: 'igual', F6: 'encomenda' }[ev.key]}"]`)?.click(); return; }
      if (so && !ev.shiftKey && ['F1', 'F2', 'F3', 'F4', 'F5'].includes(ev.key)) { ev.preventDefault(); r.querySelector<HTMLElement>(`[data-mva2-modo="${MODOS[Number(ev.key.slice(1)) - 1].k}"]`)?.click(); return; }
      if (so && !ev.shiftKey && (ev.key === 'F9' || ev.key === 'F11')) { ev.preventDefault(); r.querySelector<HTMLElement>(`[data-mva2-acao="${ev.key === 'F9' ? 'atualizar' : 'imprimir'}"]`)?.click(); return; }
      return;
    }
    if (so && !ev.shiftKey && ev.key === 'F10') { ev.preventDefault(); gerar(r, e); return; }
    if (so && !ev.shiftKey && ev.key === 'F12') { ev.preventDefault(); window.print(); return; }
    if (so && !ev.shiftKey && ev.key === 'F4') { ev.preventDefault(); exportar(r, e); return; }
    if (ev.key === 'Enter' && t.matches('[data-mva2-c]')) { ev.preventDefault(); gerar(r, e); }
  });
}

/* ---------- os ecrãs ---------- */
const NOTA = 'Movimentos de artigos v2 (19 nov., do briefing «Redesign do módulo Movimentos de Artigos»): os três separadores com filtros compactos (os aplicados à vista), indicadores e resultados em tabela ou cartões. Movimentos: a Visualização de antes (F1–F5, Shift+F1/F2/F3/F6, que o IDE leva para a barra de cima), armazém, tipo, artigo e período; entradas e saídas sem as transferências internas; o detalhe de cada movimento numa janela. Extrato: artigo (referência ou descrição) e ano, início + entradas − saídas = fim, a evolução em quantidade ou valor, cartões por mês e por armazém. Saldo: intervalo de artigos, agrupar por artigo, armazém, tipo ou mês com grupos que abrem e fecham, cartões por artigo. Paginação em todas as tabelas.';
const ESTADOS: [string, string, string][] = [
  ['artigo', 'Um artigo', 'Mais filtros ▸ Artigo: só os movimentos do 6205-2Z, e o preço médio dele.'],
  ['descricao', 'Por descrição (F2)', 'A lista pela descrição do artigo.'],
  ['armazem', 'Um armazém (F3)', 'Só o Armazém 1 · Porto: aqui as transferências já são entradas e saídas.'],
  ['documento', 'Por documento (F5)', 'Os documentos que começam por «TA»: as transferências.'],
  ['encomenda', 'Encomenda a fornecedor (Shift+F6)', 'As receções de uma encomenda; diz quando não há.'],
  ['tipo', 'Um tipo de movimento', 'Só as perdas (QB).'],
  ['sem-resultados', 'Sem movimentos', 'Diz o que se procurou; Limpar filtros.'],
  ['cartoes', 'Movimentos em cartões', 'Poucos movimentos (um artigo): cada um num cartão, com entrada ou saída à vista.'],
  ['detalhe', 'Detalhe de um movimento', 'A janela do movimento: documento, armazém, quantidade, valor e o stock depois.'],
  ['transferencia', 'Detalhe de uma transferência', 'As duas pernas: sai de um armazém, entra noutro; não conta para a empresa.'],
  ['ext', 'Extrato: critérios', 'Artigo (referência ou descrição) e ano numa linha.'],
  ['ext-erro', 'Extrato: falta o artigo', 'F10 sem artigo.'],
  ['ext-a-gerar', 'Extrato a gerar', 'Esc cancela.'],
  ['ext-dados', 'Extrato de um artigo', 'O 6205-2Z em 2026: os 4 indicadores, a evolução e a tabela com o saldo a cada passo.'],
  ['ext-valor', 'Evolução em valor', 'O mesmo extrato com a evolução do valor do stock.'],
  ['ext-cartoes', 'Extrato em cartões', 'Um cartão por mês e um por armazém.'],
  ['ext-pendente', 'Critérios por gerar', 'Mudou-se o artigo e ainda não se gerou: os resultados dizem que são os anteriores.'],
  ['ext-2025', 'Extrato de outro ano', 'O mesmo artigo em 2025.'],
  ['ext-sem', 'Extrato sem movimentos', 'Um artigo sem movimentos no ano.'],
  ['sal', 'Saldo: critérios', 'Artigo inicial e final (0 e ZZZZZZ são todos).'],
  ['sal-erro', 'Saldo: intervalo trocado', 'O artigo inicial depois do final.'],
  ['sal-dados', 'Saldo de um intervalo', 'Os artigos de 6 a 9: cada movimento com o saldo do seu artigo.'],
  ['sal-artigo', 'Saldo agrupado por artigo', 'Uma faixa por artigo, com o saldo final; abre e fecha.'],
  ['sal-fechado', 'Um grupo fechado', 'O 6206-2RSH fechado; Abrir todos / Fechar todos.'],
  ['sal-armazem', 'Saldo agrupado por armazém', 'Uma faixa por armazém, com as entradas e saídas desse armazém.'],
  ['sal-tipo', 'Saldo agrupado por tipo', 'Uma faixa por tipo de movimento.'],
  ['sal-cartoes', 'Saldo em cartões', 'Um cartão por artigo, com Ver movimentos.'],
  ['sal-vazio', 'Saldo sem artigos', 'Um intervalo sem artigos.'],
  ['exportado', 'Exportado para Excel', 'Os movimentos com o preço médio e o stock a cada passo.'],
];
export type IdMapaMov = 'stocks-mapa-movimentos' | `mva-${string}`;
export function ecrasMapaMovimentos(): Ecra<IdErp>[] {
  const v = (cen: string) => ({ id: 'v2', nota: NOTA, html: html(cen) });
  return [
    { id: 'stocks-mapa-movimentos', nome: '77 · Movimentos de artigos', fluxo: 'Stocks', objetivo: 'Os movimentos, o extrato por artigo e o saldo, com os mesmos filtros, indicadores e vistas.', versoes: [v('inicial')] as Ecra<IdErp>['versoes'] },
    ...ESTADOS.map(([cen, nome, objetivo], i) => ({ id: `mva-${cen}` as IdErp, nome: `77.${i + 1} · ${nome}`, fluxo: 'Stocks', estadoDe: 'stocks-mapa-movimentos' as IdErp, objetivo, versoes: [v(cen)] as Ecra<IdErp>['versoes'] })),
  ] as Ecra<IdErp>[];
}
