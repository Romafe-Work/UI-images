/* =========================================================
   ERP — Stocks ▸ Mapas ▸ 78 · Mapa de inventário, v2 (19 nov. 2026), do briefing dela «Redesign profissional do
   Mapa de Inventário». A v1 (stocks/mapa-inventario.ts) fica no código e sai da lista (só a última versão se mostra).
     - O que a v1 fazia fica todo: Data de cálculo e Gerar dados (F10), o stock, o preço médio e o valor de cada
       artigo no fim desse dia (os mesmos movimentos do 77), Agrupar com subtotais, filtros por coluna (F2/F3),
       ordenar pelo título da coluna, Excel (F4), Imprimir (F12), Esc;
     - novo, com dados que já existem: filtro de Armazém (o stock de cada armazém sai dos movimentos e soma ao total),
       Família, Subfamília, Situação e Pesquisa na barra de filtros; indicadores que reagem aos filtros (os de
       Com stock e Sem stock são também o filtro de situação); vista Tabela ou Cartões, com a mesma ordenação,
       filtros, paginação e escolha; o detalhe do artigo numa janela (como no resto do ERP): o stock por armazém
       nesse dia e os últimos movimentos;
     - estados: por gerar, a gerar (Esc cancela), cancelado, data inválida, sem resultados, a exportar, exportado.
   O valor é sempre quantidade × preço médio ponderado de todos os armazéns (o mesmo do 76 e do 77).
   CSS: css/mapa-inventario-v2.css, sobre o dos outros mapas (lf2, ak) e a janela das Faltas (.lf2-jan).
   ========================================================= */
import type { Ecra } from '../../../comum/tipos';
import type { IdErp } from '../ids';
import { topoErp } from '../inicio-v2';
import { L, esc } from '../espaco';
import { BTN } from '../compras/docs-v2';
import { ARTIGOS, dia, HOJE } from '../compras/dominio';
import { ARMAZENS } from './dominio';
import { xlsx, descarregar, type Celula } from '../compras/xlsx';
import { familiaDe } from '../ficheiros/ecras';
import { subfamiliaDe } from './mapa-stocks';
import { todosMovimentos, designacao, type Mov } from './mapa-movimentos';
import clipboardList from 'lucide-static/icons/clipboard-list.svg?raw';
import funnel from 'lucide-static/icons/funnel.svg?raw';
import funnelX from 'lucide-static/icons/funnel-x.svg?raw';
import printer from 'lucide-static/icons/printer.svg?raw';
import sheet from 'lucide-static/icons/file-spreadsheet.svg?raw';
import play from 'lucide-static/icons/play.svg?raw';
import xIc from 'lucide-static/icons/x.svg?raw';
import searchX from 'lucide-static/icons/search-x.svg?raw';
import search from 'lucide-static/icons/search.svg?raw';
import arrowUp from 'lucide-static/icons/arrow-up.svg?raw';
import arrowDown from 'lucide-static/icons/arrow-down.svg?raw';
import layers from 'lucide-static/icons/layers.svg?raw';
import euroIc from 'lucide-static/icons/euro.svg?raw';
import boxes from 'lucide-static/icons/boxes.svg?raw';
import pkCheck from 'lucide-static/icons/package-check.svg?raw';
import pkX from 'lucide-static/icons/package-x.svg?raw';
import warehouse from 'lucide-static/icons/warehouse.svg?raw';
import grid from 'lucide-static/icons/layout-grid.svg?raw';
import table from 'lucide-static/icons/table-2.svg?raw';
import eye from 'lucide-static/icons/eye.svg?raw';
import chevL from 'lucide-static/icons/chevron-left.svg?raw';
import chevR from 'lucide-static/icons/chevron-right.svg?raw';
import sliders from 'lucide-static/icons/sliders-horizontal.svg?raw';
import history from 'lucide-static/icons/history.svg?raw';
import loader from 'lucide-static/icons/loader-circle.svg?raw';
import alerta from 'lucide-static/icons/circle-alert.svg?raw';

/* ---------- os números (pt-PT, com o espaço dos milhares também nos números de 4 algarismos) ---------- */
const NF = new Intl.NumberFormat('pt-PT', { useGrouping: 'always' } as unknown as Intl.NumberFormatOptions);
const EF = new Intl.NumberFormat('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always' } as unknown as Intl.NumberFormatOptions);
const nf = (n: number) => NF.format(n);
const eur = (c: number) => (c < 0 ? '−' : '') + EF.format(Math.abs(c) / 100) + ' €';
const pct = (a: number, b: number) => b ? `${Math.round((a / b) * 100)} %` : '—';
const curto = (nome: string) => nome.replace('Armazém ', '');

/* ---------- os dados de um dia ---------- */
interface Base { ult: Map<string, Mov>; por: Map<string, number>; movs: Mov[] }
const bases = new Map<string, Base>();
function baseEm(data: string): Base {
  let b = bases.get(data); if (b) return b;
  const movs = todosMovimentos().filter((m) => m.data <= data), ult = new Map<string, Mov>(), por = new Map<string, number>();
  movs.forEach((m) => { ult.set(m.ref, m); if (m.armazem) por.set(`${m.ref}|${m.armazem}`, (por.get(`${m.ref}|${m.armazem}`) ?? 0) + m.qtd); });
  b = { ult, por, movs }; bases.set(data, b); return b;
}
interface Linha { ref: string; desc: string; marca: string; fam: string; sub: string; un: string; qtd: number; pm: number; valor: number; situacao: string; com: boolean }
/** Os artigos no fim do dia: o stock (de um armazém ou de todos), o preço médio ponderado e o valor = qtd × p. médio. */
function linhasEm(data: string, arm: string): Linha[] {
  const b = baseEm(data), nome = arm ? ARMAZENS.find((a) => a.cod === arm)?.nome ?? '' : '';
  return ARTIGOS.map((a): Linha => {
    const m = b.ult.get(a.ref), pm = m?.pm ?? a.preco ?? 0, qtd = arm ? b.por.get(`${a.ref}|${nome}`) ?? 0 : m?.saldoArt ?? 0;
    const valor = arm ? Math.round(qtd * pm) : m?.valorArt ?? 0;
    return { ref: a.ref, desc: a.desc, marca: a.marca, fam: familiaDe(a.desc), sub: subfamiliaDe(a.desc), un: a.un, qtd, pm, valor, com: qtd > 0, situacao: qtd > 0 ? 'Com stock' : 'Sem stock' };
  }).sort((x, y) => x.ref.localeCompare(y.ref, 'pt', { numeric: true }));
}
const FAMILIAS = [...new Set(ARTIGOS.map((a) => familiaDe(a.desc)))].sort((a, b) => a.localeCompare(b, 'pt'));
const subsDe = (fam: string) => [...new Set(ARTIGOS.filter((a) => !fam || familiaDe(a.desc) === fam).map((a) => subfamiliaDe(a.desc)))].sort((a, b) => a.localeCompare(b, 'pt'));

type K = 'ref' | 'desc' | 'situacao' | 'qtd' | 'pm' | 'valor' | 'fam' | 'sub';
interface Col { k: K; t: string; w: number; n?: boolean; eur?: boolean }
const COLS: Col[] = [
  { k: 'ref', t: 'Referência', w: 13 }, { k: 'desc', t: 'Descrição', w: 23 }, { k: 'situacao', t: 'Situação', w: 10 },
  { k: 'qtd', t: 'Qt. stock', w: 9, n: true }, { k: 'pm', t: 'Pr. médio', w: 9, n: true, eur: true }, { k: 'valor', t: 'Valor stock', w: 11, n: true, eur: true },
  { k: 'fam', t: 'Família', w: 12 }, { k: 'sub', t: 'Subfamília', w: 13 },
];
const PAGINAS = [10, 25, 50, 0];

/* ---------- o estado ---------- */
type Vista = 'tabela' | 'cartoes';
interface Est {
  data: string; feito?: string; fase: 'ok' | 'a-gerar' | 'a-exportar'; erro: string; aviso: string;
  armazem: string; fam: string; sub: string; sit: '' | 'com' | 'sem'; q: string; mais: boolean;
  grupo: '' | 'fam' | 'sub' | 'situacao'; filtros: Partial<Record<K, string>>; filtrosAbertos: boolean; ordem: { k: K; dir: 1 | -1 } | null;
  vista: Vista; porPagina: number; pagina: number; sel: string; jan: boolean; janXY: [number, number] | null; editor: boolean;
}
const CHAVE = 'erp:stocks:mapa-inventario';
function guardado(): Partial<Est> { try { return JSON.parse(localStorage.getItem(CHAVE) ?? '{}'); } catch { return {}; } }
const novo = (): Est => {
  const editor = document.body.classList.contains('editando');
  const g = editor ? {} : guardado();
  return { data: HOJE, fase: 'ok', erro: '', aviso: '', armazem: '', fam: '', sub: '', sit: '', q: '', mais: false, grupo: g.grupo ?? '', filtros: {}, filtrosAbertos: false, ordem: null,
    vista: g.vista === 'cartoes' ? 'cartoes' : 'tabela', porPagina: PAGINAS.includes(g.porPagina ?? -1) ? g.porPagina! : 25, pagina: 0, sel: '', jan: false, janXY: null, editor };
};
function guardar(e: Est): void { if (e.editor) return; try { localStorage.setItem(CHAVE, JSON.stringify({ vista: e.vista, porPagina: e.porPagina, grupo: e.grupo })); } catch { /* sem armazenamento */ } }
const estados = new WeakMap<HTMLElement, Est>();
const de = (r: HTMLElement) => { let e = estados.get(r); if (!e) { e = novo(); estados.set(r, e); } return e; };
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const editando = () => (document.body.classList.contains('editando') && !document.body.classList.contains('ed-interagir')) || document.body.classList.contains('com-fluxo');
const raiz = (t: Element | null) => t?.closest<HTMLElement>('[data-minv2]') ?? null;
const visivel = () => document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) [data-minv2]');
const sem = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '');

/** Tudo o que se filtra, menos a situação: é o universo dos indicadores Com stock e Sem stock. */
function semSituacao(e: Est): Linha[] {
  if (!e.feito) return [];
  return linhasEm(e.feito, e.armazem).filter((l) => (!e.fam || l.fam === e.fam) && (!e.sub || l.sub === e.sub)
    && (!e.q.trim() || sem(l.ref).includes(sem(e.q)) || sem(l.desc).includes(sem(e.q)))
    && Object.entries(e.filtros).every(([k, v]) => {
      if (!v?.trim()) return true; const c = COLS.find((x) => x.k === k)!, x = l[c.k];
      if (c.n) { const m = v.trim().match(/^([<>]=?|=)?\s*(-?[\d.,\s]+)$/); if (!m) return true; const n = Number(m[2].replace(/[\s.]/g, '').replace(',', '.')) * (c.eur ? 100 : 1), y = x as number; return m[1] === '>' ? y > n : m[1] === '<' ? y < n : m[1] === '>=' ? y >= n : m[1] === '<=' ? y <= n : y === n; }
      return sem(String(x)).includes(sem(v));
    }));
}
function filtradas(e: Est): Linha[] {
  let ls = semSituacao(e).filter((l) => !e.sit || (e.sit === 'com') === l.com);
  if (e.ordem) { const { k, dir } = e.ordem; ls = ls.slice().sort((a, b) => { const x = a[k], y = b[k]; return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'pt', { numeric: true })) * dir; }); }
  return ls;
}
const nFiltrosBarra = (e: Est) => [e.armazem, e.fam, e.sub, e.sit, e.q.trim()].filter(Boolean).length;
const nFiltrosCol = (e: Est) => Object.values(e.filtros).filter((v) => v?.trim()).length;
/** A página que se vê (as duas vistas mostram a mesma). */
function pagina(e: Est, ls: Linha[]): { de: number; ate: number; total: number; nPags: number; linhas: Linha[] } {
  const pp = e.porPagina || ls.length || 1, nPags = Math.max(1, Math.ceil(ls.length / pp));
  e.pagina = Math.max(0, Math.min(nPags - 1, e.pagina));
  const de = e.pagina * pp, linhas = e.porPagina ? ls.slice(de, de + pp) : ls;
  return { de: ls.length ? de + 1 : 0, ate: de + linhas.length, total: ls.length, nPags, linhas };
}

/* ---------- a página ---------- */
const op = (v: string, t: string, sel = '') => `<option value="${esc(v)}"${v === sel ? ' selected' : ''}>${esc(t)}</option>`;
function html(cen: string): string {
  const id = (x: string) => `minv2-${x}-${cen}`;
  const B = (k: string, ic: string, t: string, tecla: string, cls = '') => BTN(k, ic, t, tecla, '', cls).replace('data-dv2-acao', 'data-minv2-acao');
  return `<div class="hm ak lf2 dv2 minv2" data-hm data-minv2 data-minv2-cenario="${cen}" data-teclas="F2 F3 F4 F10 F12 Escape">
  ${topoErp([['ERP', 'inicio'], ['Stocks', ''], ['Mapas', ''], ['Mapa de inventário', '']])}
  <header class="ak-cab lf2-cab minv2-cab">
    <span class="ak-cab-ic">${L(clipboardList)}</span>
    <div><h1>Mapa de inventário</h1><p>Consulte e analise as existências e a valorização dos artigos por data e armazém.</p></div>
  </header>
  <div class="ak-barra lf2-barra minv2-barra" role="toolbar" aria-label="Ações do mapa">
    <label class="minv2-data" for="${id('data')}"><span>Data de cálculo</span><input type="date" id="${id('data')}" data-minv2-data max="${HOJE}" aria-describedby="${id('erro')}"></label>
    ${B('gerar', play, 'Gerar dados', 'F10', 'ak-btn--acao')}
    <i class="ak-sep" aria-hidden="true"></i>
    ${B('excel', sheet, 'Exportar para Excel', 'F4')}${B('imprimir', printer, 'Imprimir', 'F12')}
    <span class="minv2-vistas" role="group" aria-label="Vista">
      <button type="button" data-minv2-vista="tabela" aria-pressed="true" title="Vista tabela">${L(table)}<span>Tabela</span></button>
      <button type="button" data-minv2-vista="cartoes" aria-pressed="false" title="Vista cartões">${L(grid)}<span>Cartões</span></button>
    </span>
  </div>
  <p class="ak-erro-campo minv2-erro" id="${id('erro')}" data-minv2-erro role="alert" hidden></p>
  <form class="minv2-filtros" data-minv2-filtros novalidate aria-label="Filtros">
    <label class="ak-campo"><span>Armazém</span><select data-minv2-f="armazem">${op('', 'Todos os armazéns')}${ARMAZENS.map((a) => op(a.cod, curto(a.nome))).join('')}</select></label>
    <label class="ak-campo"><span>Família</span><select data-minv2-f="fam">${op('', 'Todas')}${FAMILIAS.map((f) => op(f, f)).join('')}</select></label>
    <label class="ak-campo"><span>Subfamília</span><select data-minv2-f="sub">${op('', 'Todas')}</select></label>
    <label class="ak-campo"><span>Situação</span><select data-minv2-f="sit">${op('', 'Todas')}${op('com', 'Com stock')}${op('sem', 'Sem stock')}</select></label>
    <label class="ak-campo minv2-pesq"><span>Pesquisa</span><div class="minv2-pesq-c">${L(search)}<input type="search" data-minv2-f="q" placeholder="Referência ou descrição" autocomplete="off"></div></label>
    <span class="minv2-filtros-bts">
      <button type="button" class="ak-btn ak-btn--linha" data-minv2-acao="limpar">${L(funnelX)}<span>Limpar filtros</span></button>
      <button type="button" class="ak-btn ak-btn--linha" data-minv2-acao="mais" aria-expanded="false" aria-controls="${id('mais')}">${L(sliders)}<span>Mais opções</span></button>
    </span>
    <div class="minv2-mais" id="${id('mais')}" data-minv2-mais hidden>
      <label class="rc-agrupar"><span>${L(layers)}Agrupar</span><select data-minv2-grupo aria-label="Agrupar por"><option value="">Sem grupos</option><option value="fam">Por família</option><option value="sub">Por subfamília</option><option value="situacao">Por situação</option></select></label>
      ${B('filtrar', funnel, 'Filtros por coluna', 'F2')}${B('remover', funnelX, 'Remover filtros', 'F3')}
    </div>
  </form>
  <section class="minv2-kpis" data-minv2-kpis aria-label="Resumo"></section>
  <section class="lf2-lista dv2-lista minv2-lista">
    <div class="lf2-lista-cab minv2-lista-cab"><h2 data-minv2-t>Inventário</h2><p class="lf2-resumo" data-minv2-resumo></p>
      <label class="minv2-ordem" data-minv2-ordem-c><span>Ordenar</span><select data-minv2-ordem aria-label="Ordenar por"></select></label></div>
    <div class="lf2-grelha lf2-grelha--ajusta minv2-g" data-minv2-g tabindex="-1"></div>
    <nav class="minv2-pag" data-minv2-pag aria-label="Páginas"></nav>
  </section>
  <div data-minv2-janela></div>
  <div class="mac-impressao" aria-hidden="true" data-minv2-impressao></div>
  <footer class="ak-estado lf2-estado" data-minv2-estado role="status" aria-live="polite"></footer>
  <p class="hm-aviso" data-hm-aviso role="status" aria-live="polite"></p>
</div>`;
}

/* ---------- desenhar ---------- */
const avisos = new WeakMap<HTMLElement, number>();
function toast(r: HTMLElement, t: string): void { const p = r.querySelector<HTMLElement>('[data-hm-aviso]'); if (!p || !t) return; p.textContent = t; p.classList.add('is-visivel'); clearTimeout(avisos.get(r)); avisos.set(r, window.setTimeout(() => p.classList.remove('is-visivel'), 3200)); }
const sit = (l: Linha) => `<span class="minv2-sit${l.com ? ' is-com' : ''}"><i aria-hidden="true"></i>${l.situacao}</span>`;
const zero = (t: string) => `<span class="is-nada">${t}</span>`;
const cel = (l: Linha, c: Col) => c.k === 'ref' ? `<b class="is-mono">${esc(l.ref)}</b>` : c.k === 'desc' ? `<span class="minv2-desc" title="${esc(l.desc)}">${esc(l.desc)}</span>` : c.k === 'situacao' ? sit(l)
  : c.k === 'qtd' ? (l.qtd ? nf(l.qtd) : zero('0')) : c.k === 'valor' ? (l.valor ? eur(l.valor) : zero(eur(0))) : c.k === 'pm' ? eur(l.pm) : `<span class="minv2-desc" title="${esc(String(l[c.k]))}">${esc(String(l[c.k]))}</span>`;

function grupos(e: Est, linhas: Linha[], todas: Linha[]): [string, Linha[], Linha[]][] {
  const k = e.grupo as K, gs = new Map<string, Linha[]>();
  linhas.forEach((l) => { const g = String(l[k]); gs.set(g, [...(gs.get(g) ?? []), l]); });
  return [...gs].sort((a, b) => a[0].localeCompare(b[0], 'pt')).map(([g, xs]) => [g, xs, todas.filter((l) => String(l[k]) === g)]);
}
function tabela(e: Est, pg: ReturnType<typeof pagina>, todas: Linha[]): string {
  const sort = (k: K) => e.ordem?.k === k ? (e.ordem.dir === 1 ? 'ascending' : 'descending') : 'none';
  const cab = `<tr>${COLS.map((c) => `<th scope="col" class="${c.n ? 'is-num' : ''}" aria-sort="${sort(c.k)}"><button type="button" data-minv2-ordenar="${c.k}">${esc(c.t)}${e.ordem?.k === c.k ? `<span class="lf2-ord">${L(e.ordem.dir === 1 ? arrowUp : arrowDown)}</span>` : ''}</button></th>`).join('')}</tr>`
    + (e.filtrosAbertos ? `<tr class="lf2-filtros-col">${COLS.map((c) => `<th><input type="search" data-minv2-fcol="${c.k}" value="${esc(e.filtros[c.k] ?? '')}" aria-label="Filtrar ${esc(c.t)}" placeholder="${c.n ? '> 0' : 'Filtrar…'}"></th>`).join('')}</tr>` : '');
  const tr = (l: Linha) => `<tr data-minv2-ref="${esc(l.ref)}" class="${l.ref === e.sel ? 'is-ativo' : ''}" tabindex="${l.ref === e.sel ? 0 : -1}" aria-selected="${l.ref === e.sel}">${COLS.map((c) => `<td class="${c.n ? 'is-num' : ''}">${cel(l, c)}</td>`).join('')}</tr>`;
  const somas = (xs: Linha[], rot: string, cls: string) => `<tr class="${cls}"><td colspan="3"><b>${rot}</b></td><td class="is-num"><b>${nf(xs.reduce((s, l) => s + l.qtd, 0))}</b></td><td></td><td class="is-num"><b>${eur(xs.reduce((s, l) => s + l.valor, 0))}</b></td><td colspan="2"></td></tr>`;
  const corpo = e.grupo ? grupos(e, pg.linhas, todas).map(([g, xs, tudo]) => `<tr class="mac-g"><td colspan="${COLS.length}"><div class="mac-g-c"><span class="mac-g-abrir"><b>${esc(g)}</b><small>${nf(tudo.length)} ${tudo.length === 1 ? 'artigo' : 'artigos'}</small></span></div></td></tr>${xs.map(tr).join('')}${somas(tudo, `Subtotal · ${esc(g)}`, 'rc-g-soma')}`).join('') : pg.linhas.map(tr).join('');
  return `<table data-paginada class="lf2-tab lf2-tab--ajusta minv2-tab" aria-label="Mapa de inventário" aria-rowcount="${pg.total}"><colgroup>${COLS.map((c) => `<col style="width:${c.w}%">`).join('')}</colgroup><thead>${cab}</thead><tbody>${corpo}</tbody><tfoot>${somas(todas, `Total · ${nf(todas.length)} ${todas.length === 1 ? 'artigo' : 'artigos'}`, 'rc-total mac-total')}</tfoot></table>`;
}
function cartao(e: Est, l: Linha): string {
  return `<article class="minv2-cartao${l.ref === e.sel ? ' is-ativo' : ''}${l.com ? '' : ' is-sem'}" data-minv2-ref="${esc(l.ref)}" tabindex="${l.ref === e.sel ? 0 : -1}" aria-selected="${l.ref === e.sel}" aria-label="${esc(`${l.ref} · ${l.desc}`)}">
    <header><b class="is-mono">${esc(l.ref)}</b>${sit(l)}</header>
    <h3 title="${esc(l.desc)}">${esc(l.desc)}</h3>
    <p class="minv2-fam">${esc(l.fam)} › ${esc(l.sub)}</p>
    <dl class="minv2-nums"><div><dt>Quantidade</dt><dd>${l.qtd ? `${nf(l.qtd)} <small>${esc(l.un)}</small>` : zero(`0 ${esc(l.un)}`)}</dd></div><div><dt>Preço médio</dt><dd>${eur(l.pm)}</dd></div><div class="is-valor"><dt>Valor em stock</dt><dd>${l.valor ? eur(l.valor) : zero(eur(0))}</dd></div></dl>
    <footer><button type="button" class="ak-btn ak-btn--linha" data-minv2-ver="${esc(l.ref)}">${L(eye)}<span>Ver detalhes</span></button></footer>
  </article>`;
}
function cartoes(e: Est, pg: ReturnType<typeof pagina>, todas: Linha[]): string {
  const lista = (xs: Linha[]) => `<div class="minv2-cartoes" role="list">${xs.map((l) => cartao(e, l).replace('<article ', '<article role="listitem" ')).join('')}</div>`;
  const total = `<p class="minv2-c-total"><span>Total · ${nf(todas.length)} ${todas.length === 1 ? 'artigo' : 'artigos'}</span><b>${nf(todas.reduce((s, l) => s + l.qtd, 0))}</b><b>${eur(todas.reduce((s, l) => s + l.valor, 0))}</b></p>`;
  if (!e.grupo) return lista(pg.linhas) + total;
  return grupos(e, pg.linhas, todas).map(([g, xs, tudo]) => `<h3 class="minv2-c-grupo"><b>${esc(g)}</b><small>${nf(tudo.length)} ${tudo.length === 1 ? 'artigo' : 'artigos'}</small><span>${nf(tudo.reduce((s, l) => s + l.qtd, 0))} · ${eur(tudo.reduce((s, l) => s + l.valor, 0))}</span></h3>${lista(xs)}`).join('') + total;
}
function esqueleto(e: Est): string {
  const n = 6;
  return e.vista === 'cartoes' ? `<div class="minv2-cartoes" aria-hidden="true">${'<div class="minv2-cartao is-esq"><i></i><i></i><i></i><i></i></div>'.repeat(n)}</div>`
    : `<div class="minv2-esq" aria-hidden="true">${'<i></i>'.repeat(n)}</div>`;
}
function grelha(r: HTMLElement, e: Est, revelar = false): void {
  const g = r.querySelector<HTMLElement>('[data-minv2-g]')!, pagEl = r.querySelector<HTMLElement>('[data-minv2-pag]')!;
  g.dataset.vista = e.vista; pagEl.innerHTML = '';
  if (e.fase === 'a-gerar') { g.innerHTML = `<div class="minv2-a-gerar" role="status">${L(loader)}<p><b>A gerar os dados de ${dia(e.data)}…</b>Esc cancela.</p></div>${esqueleto(e)}`; return; }
  if (!e.feito) { g.innerHTML = `<div class="ak-vazio lf2-vazio">${L(play)}<p><b>Escolhe a data de cálculo e gera os dados.</b>Hoje por omissão · F10 em qualquer sítio deste ecrã.</p><button type="button" class="ak-btn ak-btn--acao" data-minv2-acao="gerar">${L(play)}<span>Gerar dados</span></button></div>`; return; }
  const ls = filtradas(e);
  if (!ls.length) { g.innerHTML = `<div class="ak-vazio lf2-vazio">${L(searchX)}<p><b>Nenhum artigo com estes filtros.</b>A data de cálculo fica; os filtros saem.</p><button type="button" class="ak-btn" data-minv2-acao="limpar">${L(funnelX)}<span>Limpar filtros</span></button></div>`; return; }
  const pg = pagina(e, ls);
  g.innerHTML = e.vista === 'cartoes' ? cartoes(e, pg, ls) : tabela(e, pg, ls);
  if (pg.nPags > 1 || e.porPagina !== 25) {
    pagEl.innerHTML = `<span class="minv2-pag-n">${nf(pg.de)}–${nf(pg.ate)} de ${nf(pg.total)}</span>
      <button type="button" class="ak-btn ak-btn--linha" data-minv2-pag-ir="-1" ${e.pagina === 0 ? 'disabled' : ''} aria-label="Página anterior">${L(chevL)}</button>
      <span class="minv2-pag-p">Página <b>${e.pagina + 1}</b> de ${pg.nPags}</span>
      <button type="button" class="ak-btn ak-btn--linha" data-minv2-pag-ir="1" ${e.pagina >= pg.nPags - 1 ? 'disabled' : ''} aria-label="Página seguinte">${L(chevR)}</button>
      <label class="minv2-pp"><span>Por página</span><select data-minv2-pp>${PAGINAS.map((n) => op(String(n), n ? String(n) : 'Todos', String(e.porPagina))).join('')}</select></label>`;
  } else pagEl.innerHTML = `<label class="minv2-pp"><span>Por página</span><select data-minv2-pp>${PAGINAS.map((n) => op(String(n), n ? String(n) : 'Todos', String(e.porPagina))).join('')}</select></label>`;
  if (revelar && !quieto()) g.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: 'cubic-bezier(.22, 1, .36, 1)' });
}
function kpis(r: HTMLElement, e: Est): void {
  const k = r.querySelector<HTMLElement>('[data-minv2-kpis]')!;
  if (!e.feito || e.fase === 'a-gerar') { k.hidden = true; return; }
  k.hidden = false;
  const ls = filtradas(e), base = semSituacao(e), com = base.filter((l) => l.com).length, semN = base.length - com;
  const todos = linhasEm(e.feito, '').length, nf2 = nFiltrosBarra(e) + nFiltrosCol(e);
  const b = baseEm(e.feito), arms = ARMAZENS.filter((a) => (!e.armazem || a.cod === e.armazem) && ls.some((l) => (b.por.get(`${l.ref}|${a.nome}`) ?? 0) > 0)).length;
  const onde = e.armazem ? curto(ARMAZENS.find((a) => a.cod === e.armazem)!.nome) : 'todos os armazéns';
  const card = (cls: string, ic: string, t: string, v: string, ctx: string, filtro?: 'com' | 'sem') => filtro
    ? `<button type="button" class="minv2-kpi ${cls}" data-minv2-sit="${filtro}" aria-pressed="${e.sit === filtro}" title="${e.sit === filtro ? 'Tirar o filtro de situação' : `Mostrar só os artigos ${filtro === 'com' ? 'com' : 'sem'} stock`}"><span class="minv2-kpi-ic">${L(ic)}</span><small>${t}</small><b>${v}</b><i>${ctx}</i></button>`
    : `<div class="minv2-kpi ${cls}"><span class="minv2-kpi-ic">${L(ic)}</span><small>${t}</small><b>${v}</b><i>${ctx}</i></div>`;
  k.innerHTML = `${nf2 ? `<p class="minv2-kpis-f">${L(funnel)}<span>Com filtros · <b>${nf(ls.length)}</b> de ${nf(todos)} artigos</span></p>` : ''}
    ${card('is-total', euroIc, 'Valor do stock', eur(ls.reduce((s, l) => s + l.valor, 0)), `ao preço médio de ${dia(e.feito)}`)}
    ${card('', boxes, 'Quantidade', nf(ls.reduce((s, l) => s + l.qtd, 0)), onde)}
    ${card('is-com', pkCheck, 'Com stock', nf(com), `${pct(com, base.length)} de ${nf(base.length)} artigos`, 'com')}
    ${card('is-sem', pkX, 'Sem stock', nf(semN), `${pct(semN, base.length)} de ${nf(base.length)} artigos`, 'sem')}
    ${card('is-arm', warehouse, 'Armazéns com stock', nf(arms), e.armazem ? 'o armazém escolhido' : `de ${ARMAZENS.length} armazéns`)}`;
}
const ORDENS: [string, string][] = [['', 'Ordem do mapa (referência)'], ['valor:-1', 'Valor (maior primeiro)'], ['valor:1', 'Valor (menor primeiro)'], ['qtd:-1', 'Quantidade (maior primeiro)'], ['qtd:1', 'Quantidade (menor primeiro)'], ['pm:-1', 'Preço médio (maior primeiro)'], ['pm:1', 'Preço médio (menor primeiro)'], ['ref:1', 'Referência (A–Z)'], ['ref:-1', 'Referência (Z–A)'], ['desc:1', 'Descrição (A–Z)'], ['desc:-1', 'Descrição (Z–A)'], ['situacao:1', 'Situação (A–Z)'], ['situacao:-1', 'Situação (Z–A)'], ['fam:1', 'Família (A–Z)'], ['fam:-1', 'Família (Z–A)'], ['sub:1', 'Subfamília (A–Z)'], ['sub:-1', 'Subfamília (Z–A)']];
function tudo(r: HTMLElement, e: Est, revelar = false): void {
  const ls = filtradas(e), nfb = nFiltrosBarra(e), nfc = nFiltrosCol(e), tem = !!e.feito && e.fase !== 'a-gerar';
  const d = r.querySelector<HTMLInputElement>('[data-minv2-data]')!; if (d.value !== e.data) d.value = e.data;
  d.setAttribute('aria-invalid', String(!!e.erro));
  const er = r.querySelector<HTMLElement>('[data-minv2-erro]')!; er.hidden = !e.erro; er.innerHTML = e.erro ? `${L(alerta)}<span>${esc(e.erro)}</span>` : '';
  const pendente = !!e.feito && e.data !== e.feito && !e.erro && e.fase !== 'a-gerar';
  const gb = r.querySelector<HTMLElement>('.minv2-barra [data-minv2-acao="gerar"]')!; gb.classList.toggle('is-pendente', pendente);
  /* os filtros */
  const f = (k: string) => r.querySelector<HTMLInputElement & HTMLSelectElement>(`[data-minv2-f="${k}"]`)!;
  const subSel = f('sub'), subs = subsDe(e.fam); if (subSel.dataset.fam !== e.fam || !subSel.options.length) { subSel.innerHTML = op('', 'Todas') + subs.map((s) => op(s, s)).join(''); subSel.dataset.fam = e.fam; }
  (['armazem', 'fam', 'sub', 'sit'] as const).forEach((k) => { const s = f(k); s.value = e[k]; s.disabled = !tem; s.closest('.ak-campo')?.classList.toggle('is-ativo', !!e[k]); });
  const q = f('q'); if (document.activeElement !== q) q.value = e.q; q.disabled = !tem; q.closest('.ak-campo')?.classList.toggle('is-ativo', !!e.q.trim());
  r.querySelector<HTMLElement>('[data-minv2-acao="limpar"]')!.setAttribute('aria-disabled', String(!(nfb + nfc)));
  r.querySelector<HTMLElement>('[data-minv2-acao="limpar"]')!.title = nfb + nfc ? `Limpar ${nfb + nfc} ${nfb + nfc === 1 ? 'filtro' : 'filtros'} (a data fica)` : 'Não há filtros.';
  const mais = r.querySelector<HTMLElement>('[data-minv2-mais]')!; mais.hidden = !e.mais;
  const mb = r.querySelector<HTMLElement>('[data-minv2-acao="mais"]')!; mb.setAttribute('aria-expanded', String(e.mais));
  mb.querySelector('span')!.textContent = e.grupo || nfc ? `Mais opções (${[e.grupo, nfc].filter(Boolean).length})` : 'Mais opções';
  const gs = r.querySelector<HTMLSelectElement>('[data-minv2-grupo]')!; gs.value = e.grupo; gs.disabled = !tem;
  /* a vista */
  r.querySelectorAll<HTMLElement>('[data-minv2-vista]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.minv2Vista === e.vista)));
  /* a lista */
  r.querySelector<HTMLElement>('[data-minv2-t]')!.textContent = e.feito ? `Inventário a ${dia(e.feito)}` : 'Inventário';
  r.querySelector<HTMLElement>('[data-minv2-resumo]')!.innerHTML = tem ? `<span><b>${nf(ls.length)}</b> ${ls.length === 1 ? 'artigo' : 'artigos'}</span><span>${e.armazem ? esc(curto(ARMAZENS.find((a) => a.cod === e.armazem)!.nome)) : 'Todos os armazéns'}</span>${pendente ? `<span class="minv2-pendente">${L(alerta)}Mostra ${dia(e.feito!)} · F10 gera ${dia(e.data)}</span>` : ''}` : '';
  const oc = r.querySelector<HTMLElement>('[data-minv2-ordem-c]')!, os = r.querySelector<HTMLSelectElement>('[data-minv2-ordem]')!;
  oc.hidden = !tem || !ls.length; const ov = e.ordem ? `${e.ordem.k}:${e.ordem.dir}` : '';
  if (!os.options.length) os.innerHTML = ORDENS.map(([v, t]) => op(v, t)).join(''); os.value = ov;
  kpis(r, e); grelha(r, e, revelar); janela(r, e);
  /* os botões que ainda não fazem sentido */
  r.querySelectorAll<HTMLElement>('.minv2-barra [data-minv2-acao], .minv2-mais [data-minv2-acao]').forEach((b) => {
    const k = b.dataset.minv2Acao!;
    const p = k === 'gerar' ? (e.fase === 'a-gerar' ? 'Já está a gerar; Esc cancela.' : '') : !tem ? 'Gera os dados primeiro (F10).' : (k === 'excel' || k === 'imprimir') && !ls.length ? 'Não há artigos para exportar.' : k === 'remover' && !nfb && !nfc && !e.filtrosAbertos ? 'Não há filtros.' : e.fase === 'a-exportar' && k === 'excel' ? 'A exportar…' : '';
    b.setAttribute('aria-disabled', String(!!p)); if (p) b.title = p; else b.removeAttribute('title');
  });
  r.querySelector('[data-minv2-acao="filtrar"]')?.setAttribute('aria-pressed', String(e.filtrosAbertos));
  r.querySelector<HTMLElement>('[data-minv2-acao="excel"]')!.classList.toggle('is-a-correr', e.fase === 'a-exportar');
  const fase = e.fase === 'a-gerar' ? `<span class="ak-estado-f">${L(loader)}A gerar…</span>` : e.fase === 'a-exportar' ? `<span class="ak-estado-f">${L(loader)}A exportar…</span>` : `<span class="ak-estado-f${e.feito ? ' is-ok' : ''}">${e.feito ? 'Pronto' : 'Sem dados'}</span>`;
  r.querySelector<HTMLElement>('[data-minv2-estado]')!.innerHTML = `<span>Dados de <b>${e.feito ? dia(e.feito) : '—'}</b></span><span>${e.vista === 'cartoes' ? 'Vista cartões' : 'Vista tabela'}</span>${e.grupo ? `<span>Agrupado por <b>${{ fam: 'família', sub: 'subfamília', situacao: 'situação' }[e.grupo]}</b></span>` : ''}${fase}${e.aviso ? `<span class="ak-estado-aviso">${esc(e.aviso)}</span>` : ''}`;
  const ip = r.querySelector<HTMLElement>('[data-minv2-impressao]'); if (ip) ip.innerHTML = e.feito ? `<h1>Mapa de inventário a ${dia(e.feito)}</h1><p>${e.armazem ? esc(ARMAZENS.find((a) => a.cod === e.armazem)!.nome) : 'Todos os armazéns'}, ao preço médio · impresso a ${new Date().toLocaleString('pt-PT')}</p>` : '';
}

/* ---------- o detalhe do artigo (numa janela, como no resto do ERP) ---------- */
function janela(r: HTMLElement, e: Est): void {
  const c = r.querySelector<HTMLElement>('[data-minv2-janela]')!;
  const l = e.jan && e.feito && e.fase !== 'a-gerar' ? linhasEm(e.feito, '').find((x) => x.ref === e.sel) : undefined;
  if (!l) { c.innerHTML = ''; return; }
  const b = baseEm(e.feito!), arms = ARMAZENS.map((a) => [a, b.por.get(`${l.ref}|${a.nome}`) ?? 0] as const), max = Math.max(1, ...arms.map(([, q]) => q));
  const movs = b.movs.filter((m) => m.ref === l.ref && m.cod !== 'SI').slice(-5).reverse();
  const w = Math.min(440, innerWidth - 24), abaixo = Math.round(Math.max(0, r.querySelector('.minv2-barra')?.getBoundingClientRect().bottom ?? 88) + 8), [x, y] = e.janXY ?? [Math.max(12, innerWidth - w - 24), abaixo];
  const ja = c.querySelector<HTMLElement>('[data-minv2-jan]'), foco = ja?.contains(document.activeElement);
  c.innerHTML = `<section data-por-cima class="lf2-jan minv2-jan" data-minv2-jan role="dialog" aria-labelledby="minv2-jan-t-${esc(r.dataset.minv2Cenario ?? '')}" tabindex="-1" style="left:${x}px;top:${y}px;width:${w}px;max-height:min(640px, calc(100vh - ${y + 12}px))">
    <header class="lf2-jan-cab" data-minv2-jan-arrastar title="Arrasta para mudar de sítio">${L(boxes)}<h3 id="minv2-jan-t-${esc(r.dataset.minv2Cenario ?? '')}">Artigo · <b>${esc(l.ref)}</b></h3>
      <span class="lf2-jan-bts"><button type="button" data-minv2-acao="fechar-jan" data-lf2-jan-acao="fechar" aria-label="Fechar (Esc)" title="Fechar (Esc)">${L(xIc)}</button></span></header>
    <div class="lf2-jan-corpo">
      <div class="minv2-jan-id"><p class="minv2-jan-desc">${esc(l.desc)}</p><p class="minv2-fam">${esc(l.marca)} · ${esc(l.fam)} › ${esc(l.sub)}</p>${sit(l)}</div>
      <dl class="minv2-nums minv2-jan-nums"><div><dt>Quantidade</dt><dd>${nf(l.qtd)} <small>${esc(l.un)}</small></dd></div><div><dt>Preço médio</dt><dd>${eur(l.pm)}</dd></div><div class="is-valor"><dt>Valor em stock</dt><dd>${eur(l.valor)}</dd></div></dl>
      <h4 class="minv2-jan-t">${L(warehouse)}Por armazém a ${dia(e.feito!)}</h4>
      <ul class="minv2-arms">${arms.map(([a, q]) => `<li class="${q ? '' : 'is-zero'}${e.armazem === a.cod ? ' is-escolhido' : ''}"><span>${esc(curto(a.nome))}</span><i style="--p:${(q / max) * 100}%" aria-hidden="true"></i><b>${nf(q)}</b><small>${q ? eur(Math.round(q * l.pm)) : '—'}</small></li>`).join('')}</ul>
      <h4 class="minv2-jan-t">${L(history)}Últimos movimentos até ${dia(e.feito!)}</h4>
      ${movs.length ? `<ul class="minv2-movs">${movs.map((m) => `<li><span class="minv2-mov-d">${dia(m.data)}</span><span class="minv2-mov-t">${esc(designacao(m))}<small>${esc(m.docCompleto === '—' ? '' : m.docCompleto)}${m.armazem ? ` · ${esc(curto(m.armazem))}` : ''}</small></span><b class="${m.qtd > 0 ? 'is-ent' : m.qtd < 0 ? 'is-sai' : ''}">${m.qtd > 0 ? '+' : m.qtd < 0 ? '−' : ''}${m.qtd ? nf(Math.abs(m.qtd)) : 'valor'}</b></li>`).join('')}</ul>` : `<p class="minv2-jan-nada">Sem movimentos além do stock de partida.</p>`}
      <p class="minv2-jan-nota">Os movimentos todos estão no 77 · Movimentos de artigos.</p>
    </div>
  </section>`;
  if (foco) c.querySelector<HTMLElement>('[data-minv2-jan]')?.focus({ preventScroll: true });
}
function abrirJanela(r: HTMLElement, e: Est, ref: string, focarJanela = false): void {
  const novaJ = !e.jan; e.sel = ref; e.jan = true; tudo(r, e);
  const j = r.querySelector<HTMLElement>('[data-minv2-jan]');
  if (novaJ && j && !quieto()) j.animate([{ opacity: 0, transform: 'translateY(8px) scale(.98)' }, { opacity: 1, transform: 'none' }], { duration: 180, easing: 'cubic-bezier(.22, 1, .36, 1)' });
  if (focarJanela) j?.focus({ preventScroll: true }); else focarSel(r, e);
}
function focarSel(r: HTMLElement, e: Est): void {
  const el = r.querySelector<HTMLElement>(`[data-minv2-g] [data-minv2-ref="${CSS.escape(e.sel)}"]`);
  if (el) { el.focus({ preventScroll: true }); el.scrollIntoView({ block: 'nearest' }); }
}
/** Escolher sem redesenhar a lista toda: só muda a marca e a janela acompanha. */
function escolher(r: HTMLElement, e: Est, ref: string): void {
  e.sel = ref;
  r.querySelectorAll<HTMLElement>('[data-minv2-g] [data-minv2-ref]').forEach((x) => { const s = x.dataset.minv2Ref === ref; x.classList.toggle('is-ativo', s); x.tabIndex = s ? 0 : -1; x.setAttribute('aria-selected', String(s)); });
  focarSel(r, e); if (e.jan) janela(r, e);
}
function andar(r: HTMLElement, e: Est, tecla: string): boolean {
  const els = [...r.querySelectorAll<HTMLElement>('[data-minv2-g] [data-minv2-ref]')]; if (!els.length) return false;
  let i = els.findIndex((x) => x.dataset.minv2Ref === e.sel); if (i < 0) i = 0;
  const cols = e.vista === 'cartoes' ? Math.max(1, Math.round((els[0].closest('.minv2-cartoes')?.clientWidth ?? 1) / (els[0].offsetWidth + 12))) : 1;
  const j = tecla === 'ArrowDown' ? i + cols : tecla === 'ArrowUp' ? i - cols : tecla === 'ArrowRight' ? i + 1 : tecla === 'ArrowLeft' ? i - 1 : tecla === 'Home' ? 0 : tecla === 'End' ? els.length - 1 : tecla === 'PageDown' ? i + 8 : i - 8;
  const n = els[Math.max(0, Math.min(els.length - 1, j))]; if (!n) return false;
  escolher(r, e, n.dataset.minv2Ref!); return true;
}

/* ---------- as ações ---------- */
const temporizadores = new WeakMap<HTMLElement, number>();
function gerar(r: HTMLElement, e: Est): void {
  e.data = r.querySelector<HTMLInputElement>('[data-minv2-data]')!.value;
  if (!e.data) { e.erro = 'Diz a data de cálculo.'; tudo(r, e); r.querySelector<HTMLElement>('[data-minv2-data]')?.focus(); return; }
  if (e.data > HOJE) { e.erro = `A data de cálculo não pode ser depois de hoje (${dia(HOJE)}).`; tudo(r, e); r.querySelector<HTMLElement>('[data-minv2-data]')?.focus(); return; }
  e.erro = ''; e.aviso = ''; e.fase = 'a-gerar'; tudo(r, e);
  temporizadores.set(r, window.setTimeout(() => { if (e.fase !== 'a-gerar') return; e.fase = 'ok'; e.feito = e.data; e.pagina = 0; tudo(r, e, true); }, quieto() ? 150 : 650));
}
function cancelar(r: HTMLElement, e: Est): void {
  clearTimeout(temporizadores.get(r)); e.fase = 'ok';
  e.aviso = e.feito ? `Cancelado · continuam os dados de ${dia(e.feito)}.` : 'Cancelado · ainda sem dados.';
  if (e.feito) e.data = e.feito; tudo(r, e); toast(r, e.aviso);
}
function exportar(r: HTMLElement, e: Est): void {
  const ls = filtradas(e); if (!ls.length || !e.feito) return;
  e.fase = 'a-exportar'; tudo(r, e);
  window.setTimeout(() => {
    const rows: Celula[][] = ls.map((l) => [l.ref, l.desc, l.situacao, l.qtd, { euros: l.pm }, { euros: l.valor }, l.fam, l.sub]);
    rows.push([`Total · ${ls.length}`, null, null, ls.reduce((t, l) => t + l.qtd, 0), null, { euros: ls.reduce((t, l) => t + l.valor, 0) }, null, null]);
    const nome = `Mapa-de-inventario-${e.feito}${e.armazem ? `-armazem-${e.armazem}` : ''}.xlsx`;
    try { descarregar(xlsx({ nome: 'Inventário', colunas: COLS.map((c) => c.t), linhas: rows, larguras: COLS.map((c) => Math.max(10, c.t.length + 6)) }), nome); e.aviso = `Exportado: ${nome} · ${nf(ls.length)} ${ls.length === 1 ? 'artigo' : 'artigos'}${nFiltrosBarra(e) + nFiltrosCol(e) ? ' (com os filtros)' : ''}.`; }
    catch { e.aviso = 'A exportação falhou; tenta outra vez (F4).'; }
    e.fase = 'ok'; tudo(r, e); toast(r, e.aviso);
  }, quieto() ? 50 : 400);
}
function limpar(r: HTMLElement, e: Est): void {
  Object.assign(e, { armazem: '', fam: '', sub: '', sit: '', q: '', filtros: {}, filtrosAbertos: false, pagina: 0 }); tudo(r, e); toast(r, 'Filtros limpos; a data fica.');
}

/* ---------- os cenários ---------- */
function armar(r: HTMLElement): void {
  if (estados.has(r)) return;
  const e = de(r), cen = r.dataset.minv2Cenario ?? 'inicial';
  if (e.editor) Object.assign(e, { vista: 'tabela', porPagina: 25, grupo: '' });
  if (!['inicial', 'erro-data', 'a-gerar', 'cancelado-vazio'].includes(cen)) { e.feito = cen === 'outra-data' ? '2026-06-30' : HOJE; e.data = e.feito; }
  if (cen === 'erro-data') { e.data = '2026-12-31'; e.erro = `A data de cálculo não pode ser depois de hoje (${dia(HOJE)}).`; }
  if (cen === 'a-gerar') { e.fase = 'a-gerar'; }
  if (cen === 'por-gerar') e.data = '2026-06-30';
  if (cen === 'cancelado') e.aviso = `Cancelado · continuam os dados de ${dia(HOJE)}.`;
  if (cen.startsWith('cartoes')) e.vista = 'cartoes';
  if (cen === 'cartoes-familia' || cen === 'familia') e.grupo = 'fam';
  if (cen === 'armazem') e.armazem = '1';
  if (cen === 'sem-stock') e.sit = 'sem';
  if (cen === 'pesquisa') e.q = 'rolamento';
  if (cen === 'sem-resultados') { e.q = 'correia'; e.armazem = '88'; }
  if (cen === 'filtros') { e.mais = true; e.filtrosAbertos = true; e.filtros = { qtd: '> 100' }; }
  if (cen === 'ordenado') e.ordem = { k: 'valor', dir: -1 };
  if (cen === 'paginas') { e.porPagina = 10; e.pagina = 1; }
  if (cen === 'detalhe' || cen === 'cartoes-detalhe') { e.sel = '6205-2Z'; e.jan = true; }
  if (cen === 'a-exportar') e.fase = 'a-exportar';
  if (cen === 'exportado') e.aviso = `Exportado: Mapa-de-inventario-${HOJE}.xlsx · ${nf(ARTIGOS.length)} artigos.`;
  tudo(r, e);
  if (!e.editor && r.closest('.ecra:not([hidden]) > .versao:not([hidden])') && !quieto()) r.classList.add('lf2-entra');
}
const armarTodos = () => document.querySelectorAll<HTMLElement>('[data-minv2]').forEach(armar);
let espera = 0;
let arrasto: { r: HTMLElement; e: Est; dx: number; dy: number; el: HTMLElement } | null = null;
export function iniciar(): void {
  requestAnimationFrame(armarTodos);
  ['romafe:versao', 'romafe:ecra'].forEach((y) => document.addEventListener(y, () => requestAnimationFrame(armarTodos)));
  document.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement, r = raiz(t); if (!r || editando()) return; const e = de(r); let b: HTMLElement | null;
    if ((b = t.closest('[data-minv2-acao][aria-disabled="true"]'))) { toast(r, b.title); return; }
    if ((b = t.closest('[data-minv2-ordenar]'))) { const k = b.dataset.minv2Ordenar as K; e.ordem = e.ordem?.k === k ? (e.ordem.dir === 1 ? { k, dir: -1 } : null) : { k, dir: 1 }; e.pagina = 0; tudo(r, e); r.querySelector<HTMLElement>(`[data-minv2-ordenar="${k}"]`)?.focus(); return; }
    if ((b = t.closest('[data-minv2-vista]'))) { const v = b.dataset.minv2Vista as Vista; if (v !== e.vista) { e.vista = v; guardar(e); tudo(r, e, true); if (e.sel) focarSel(r, e); } return; }
    if ((b = t.closest('[data-minv2-sit]'))) { const s = b.dataset.minv2Sit as 'com' | 'sem'; e.sit = e.sit === s ? '' : s; e.pagina = 0; tudo(r, e); r.querySelector<HTMLElement>(`[data-minv2-sit="${s}"]`)?.focus(); return; }
    if ((b = t.closest('[data-minv2-pag-ir]'))) { e.pagina += Number(b.dataset.minv2PagIr); tudo(r, e); r.querySelector<HTMLElement>(`[data-minv2-pag-ir="${b.dataset.minv2PagIr}"]:not(:disabled)`)?.focus(); return; }
    if ((b = t.closest('[data-minv2-ver]'))) { abrirJanela(r, e, b.dataset.minv2Ver!, true); return; }
    if ((b = t.closest('[data-minv2-acao]'))) {
      const k = b.dataset.minv2Acao!;
      if (k === 'gerar') gerar(r, e);
      else if (k === 'limpar') limpar(r, e);
      else if (k === 'mais') { e.mais = !e.mais; tudo(r, e); }
      else if (k === 'filtrar') { e.filtrosAbertos = !e.filtrosAbertos; if (e.filtrosAbertos) e.vista = 'tabela'; tudo(r, e); if (e.filtrosAbertos) r.querySelector<HTMLElement>('[data-minv2-fcol]')?.focus(); }
      else if (k === 'remover') limpar(r, e);
      else if (k === 'excel') exportar(r, e);
      else if (k === 'imprimir') window.print();
      else if (k === 'fechar-jan') { e.jan = false; tudo(r, e); focarSel(r, e); }
      return;
    }
    const item = t.closest<HTMLElement>('[data-minv2-g] [data-minv2-ref]');
    if (item && !t.closest('button, a, input, select')) { if (e.jan) escolher(r, e, item.dataset.minv2Ref!); else abrirJanela(r, e, item.dataset.minv2Ref!); }
  });
  document.addEventListener('dblclick', (ev) => { const t = ev.target as HTMLElement, r = raiz(t); if (!r || editando()) return; const it = t.closest<HTMLElement>('[data-minv2-g] [data-minv2-ref]'); if (it) abrirJanela(r, de(r), it.dataset.minv2Ref!, true); });
  document.addEventListener('change', (ev) => {
    const t = ev.target as HTMLSelectElement, r = raiz(t); if (!r || editando()) return; const e = de(r);
    if (t.matches('[data-minv2-grupo]')) { e.grupo = t.value as Est['grupo']; guardar(e); tudo(r, e, true); return; }
    if (t.matches('[data-minv2-pp]')) { e.porPagina = Number(t.value); e.pagina = 0; guardar(e); tudo(r, e); r.querySelector<HTMLElement>('[data-minv2-pp]')?.focus(); return; }
    if (t.matches('[data-minv2-ordem]')) { const [k, d] = t.value.split(':'); e.ordem = k ? { k: k as K, dir: Number(d) as 1 | -1 } : null; e.pagina = 0; tudo(r, e); r.querySelector<HTMLElement>('[data-minv2-ordem]')?.focus(); return; }
    if (t.matches('[data-minv2-data]')) { e.data = t.value; e.erro = ''; tudo(r, e); return; }
    const k = t.dataset.minv2F as 'armazem' | 'fam' | 'sub' | 'sit' | undefined;
    if (k && k !== ('q' as string)) { (e as unknown as Record<string, string>)[k] = t.value; if (k === 'fam' && e.sub && !subsDe(e.fam).includes(e.sub)) e.sub = ''; e.pagina = 0; tudo(r, e); r.querySelector<HTMLElement>(`[data-minv2-f="${k}"]`)?.focus(); }
  });
  document.addEventListener('input', (ev) => {
    const t = ev.target as HTMLInputElement, r = raiz(t); if (!r) return; const e = de(r);
    if (t.matches('[data-minv2-data]')) { e.data = t.value; e.erro = ''; return; }
    const col = t.dataset.minv2Fcol as K | undefined, pq = t.matches('[data-minv2-f="q"]');
    if (!col && !pq) return;
    clearTimeout(espera); espera = window.setTimeout(() => {
      if (col) e.filtros[col] = t.value; else e.q = t.value; e.pagina = 0; tudo(r, e);
      const n = r.querySelector<HTMLInputElement>(col ? `[data-minv2-fcol="${col}"]` : '[data-minv2-f="q"]'); n?.focus(); n?.setSelectionRange(n.value.length, n.value.length);
    }, 160);
  });
  document.addEventListener('submit', (ev) => { if (raiz(ev.target as HTMLElement)) ev.preventDefault(); });
  document.addEventListener('keydown', (ev) => {
    const t = ev.target as HTMLElement, r = raiz(t) ?? visivel(); if (!r || editando()) return; const e = de(r);
    if (['F2', 'F3', 'F4', 'F10', 'F12'].includes(ev.key) && !ev.ctrlKey && !ev.altKey && !ev.metaKey && !ev.shiftKey) {
      ev.preventDefault(); const k = { F2: 'filtrar', F3: 'remover', F4: 'excel', F10: 'gerar', F12: 'imprimir' }[ev.key]!;
      if ((k === 'filtrar' || k === 'remover') && !e.mais) { e.mais = true; tudo(r, e); }
      r.querySelector<HTMLElement>(`:is(.minv2-barra, .minv2-mais) [data-minv2-acao="${k}"]`)?.click(); return;
    }
    if (ev.key === 'Escape') {
      if (e.fase === 'a-gerar') { cancelar(r, e); ev.preventDefault(); return; }
      if (e.jan) { e.jan = false; tudo(r, e); focarSel(r, e); ev.preventDefault(); return; }
      if (e.filtrosAbertos) { e.filtrosAbertos = false; tudo(r, e); ev.preventDefault(); return; }
      if (e.feito && e.data !== e.feito) { e.data = e.feito; e.erro = ''; tudo(r, e); ev.preventDefault(); return; }
      if (e.mais) { e.mais = false; tudo(r, e); ev.preventDefault(); }
      return;
    }
    if (ev.key === 'Enter' && t.matches('[data-minv2-data]')) { ev.preventDefault(); gerar(r, e); return; }
    if (ev.key === 'Enter' && t.matches('[data-minv2-g] [data-minv2-ref]')) { ev.preventDefault(); abrirJanela(r, e, t.dataset.minv2Ref!, true); return; }
    const setas = ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ...(e.vista === 'cartoes' ? ['ArrowLeft', 'ArrowRight'] : [])];
    if (setas.includes(ev.key) && !ev.ctrlKey && !ev.altKey && !ev.metaKey && (t.matches('[data-minv2-g] [data-minv2-ref]') || (t.matches('[data-minv2-jan]') && ev.key.startsWith('Arrow')))) {
      if (andar(r, e, ev.key)) { ev.preventDefault(); ev.stopImmediatePropagation(); }
    }
  });
  /* arrastar a janela pela barra */
  document.addEventListener('pointerdown', (ev) => {
    const h = (ev.target as HTMLElement).closest<HTMLElement>('[data-minv2-jan-arrastar]'); if (!h || (ev.target as HTMLElement).closest('button')) return;
    const r = raiz(h), el = h.closest<HTMLElement>('[data-minv2-jan]'); if (!r || !el) return;
    const b = el.getBoundingClientRect(); arrasto = { r, e: de(r), dx: ev.clientX - b.left, dy: ev.clientY - b.top, el }; el.classList.add('is-a-mover'); h.setPointerCapture(ev.pointerId);
  });
  document.addEventListener('pointermove', (ev) => {
    if (!arrasto) return; const { el, dx, dy } = arrasto;
    const x = Math.max(0, Math.min(innerWidth - el.offsetWidth, ev.clientX - dx)), y = Math.max(0, Math.min(innerHeight - 42, ev.clientY - dy));
    el.style.left = `${x}px`; el.style.top = `${y}px`; arrasto.e.janXY = [x, y];
  });
  const largar = () => { if (arrasto) { arrasto.el.classList.remove('is-a-mover'); arrasto = null; } };
  document.addEventListener('pointerup', largar); document.addEventListener('pointercancel', largar);
}

/* ---------- os ecrãs ---------- */
const NOTA = 'Mapa de inventário v2 (19 nov., do briefing «Redesign profissional do Mapa de Inventário»): data de cálculo e Gerar dados (F10) na barra; filtros de Armazém, Família, Subfamília, Situação e Pesquisa (o stock de cada armazém sai dos movimentos e soma ao total); indicadores que reagem aos filtros (Com stock e Sem stock filtram); vistas Tabela e Cartões com os mesmos filtros, ordenação e paginação; o detalhe do artigo numa janela, com o stock por armazém e os últimos movimentos; Mais opções: Agrupar e filtros por coluna (F2/F3); F4 Excel, F12 Imprimir. Tudo o que a v1 fazia fica. A Situação está por confirmar no antigo.';
const ESTADOS: [string, string, string][] = [
  ['dados', 'Inventário de hoje', 'Os indicadores, a tabela com os totais e a paginação.'],
  ['cartoes', 'Vista cartões', 'Os mesmos artigos em cartões: quantidade, preço médio, valor e Ver detalhes.'],
  ['detalhe', 'Detalhe do artigo', 'A janela do artigo: o stock por armazém nesse dia e os últimos movimentos; ↑ ↓ mudam de artigo.'],
  ['cartoes-detalhe', 'Detalhe a partir dos cartões', 'Ver detalhes num cartão abre a mesma janela.'],
  ['armazem', 'Um armazém', 'Só o Armazém 1 · Porto: a quantidade e o valor desse armazém.'],
  ['sem-stock', 'Só os sem stock', 'Tocar no indicador Sem stock filtra; outra vez tira.'],
  ['pesquisa', 'Pesquisa', 'Referência ou descrição: «rolamento».'],
  ['sem-resultados', 'Sem resultados', 'Os filtros não deixam nenhum artigo; Limpar filtros.'],
  ['familia', 'Agrupado por família', 'Mais opções ▸ Agrupar: uma faixa por família, com o subtotal.'],
  ['cartoes-familia', 'Cartões por família', 'O agrupar também nos cartões.'],
  ['filtros', 'Filtros por coluna (F2)', 'Qt. stock > 100; F3 tira todos os filtros.'],
  ['ordenado', 'Ordenado pelo valor', 'O título da coluna ou o Ordenar (também nos cartões).'],
  ['paginas', 'Paginação', '10 por página, a segunda página.'],
  ['outra-data', 'Noutra data', 'A 30/06/2026: o stock e o valor desse dia.'],
  ['por-gerar', 'Data por gerar', 'A data mudou e ainda não se gerou: os dados mostrados continuam os de antes, ditos na lista.'],
  ['a-gerar', 'A gerar', 'Gerar dados: a lista em espera; Esc cancela.'],
  ['cancelado', 'Cancelado', 'Esc a meio: ficam os dados anteriores.'],
  ['erro-data', 'Data depois de hoje', 'A data de cálculo não pode ser futura.'],
  ['a-exportar', 'A exportar', 'F4: o Excel com os filtros que estão.'],
  ['exportado', 'Exportado para Excel', 'Os artigos com todas as colunas e o total.'],
];
export type IdMapaInv = 'stocks-mapa-inventario' | `minv-${string}`;
export function ecrasMapaInventario(): Ecra<IdErp>[] {
  const v = (cen: string) => ({ id: 'v2', nota: NOTA, html: html(cen) });
  return [
    { id: 'stocks-mapa-inventario', nome: '78 · Mapa de inventário', fluxo: 'Stocks', objetivo: 'As existências e a valorização dos artigos por data e armazém, em tabela ou cartões.', versoes: [v('inicial')] as Ecra<IdErp>['versoes'] },
    ...ESTADOS.map(([cen, nome, objetivo], i) => ({ id: `minv-${cen}` as IdErp, nome: `78.${i + 1} · ${nome}`, fluxo: 'Stocks', estadoDe: 'stocks-mapa-inventario' as IdErp, objetivo, versoes: [v(cen)] as Ecra<IdErp>['versoes'] })),
  ] as Ecra<IdErp>[];
}
