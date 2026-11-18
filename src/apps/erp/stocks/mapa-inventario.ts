/* =========================================================
   ERP — Stocks ▸ Mapas ▸ 78 · Mapa de inventário (18 nov. 2026), do print dela do «Mapa de Inventário» do ERP antigo:
   critério Data de cálculo (hoje por omissão), Gerar dados (F10), Cancelar (Esc); a faixa Somatório (agrupar); as
   colunas Referência, Descrição, Situação, Qt. Stock, Pr. Médio, Valor Stock, #Família, #SubFamília, com os totais da
   quantidade e do valor; Filtrar tabela (F2), Remover filtro (F3), Exportar para Excel (F4), Imprimir (F12).
     - O stock, o preço médio e o valor de cada artigo são os do fim do dia escolhido, tirados dos mesmos movimentos do
       77 · Movimentos de artigos (todos os armazéns); com a data de hoje, batem com o 76 · Mapa de stocks;
     - a Situação do antigo está por confirmar: aqui diz se o artigo tinha stock nesse dia (Com stock, Sem stock);
     - o «arraste para agrupar» passa a um Agrupar (família, subfamília, situação), com o subtotal em cada faixa.
   CSS: o dos outros mapas (css/mapa-artigos-clientes.css, css/mapa-stocks.css, css/mapa-movimentos.css).
   ========================================================= */
import type { Ecra } from '../../../comum/tipos';
import type { IdErp } from '../ids';
import { topoErp } from '../inicio-v2';
import { L, esc } from '../espaco';
import { BTN } from '../compras/docs-v2';
import { ARTIGOS, euros, dia, HOJE } from '../compras/dominio';
import { xlsx, descarregar, type Celula } from '../compras/xlsx';
import { familiaDe } from '../ficheiros/ecras';
import { subfamiliaDe } from './mapa-stocks';
import { todosMovimentos } from './mapa-movimentos';
import clipboardList from 'lucide-static/icons/clipboard-list.svg?raw';
import funnel from 'lucide-static/icons/funnel.svg?raw';
import funnelX from 'lucide-static/icons/funnel-x.svg?raw';
import printer from 'lucide-static/icons/printer.svg?raw';
import sheet from 'lucide-static/icons/file-spreadsheet.svg?raw';
import play from 'lucide-static/icons/play.svg?raw';
import xIc from 'lucide-static/icons/x.svg?raw';
import pencil from 'lucide-static/icons/pencil.svg?raw';
import searchX from 'lucide-static/icons/search-x.svg?raw';
import arrowUp from 'lucide-static/icons/arrow-up.svg?raw';
import arrowDown from 'lucide-static/icons/arrow-down.svg?raw';
import layers from 'lucide-static/icons/layers.svg?raw';

/* ---------- as linhas ---------- */
interface Linha { ref: string; desc: string; situacao: string; qtd: number; pm: number; valor: number; fam: string; sub: string; un: string }
/** O inventário no fim do dia: um artigo por linha, com o stock, o preço médio e o valor desse dia. */
export function inventarioEm(data: string): Linha[] {
  const ms = todosMovimentos().filter((m) => m.data <= data), ult = new Map<string, (typeof ms)[number]>();
  ms.forEach((m) => ult.set(m.ref, m));
  return ARTIGOS.map((a): Linha => { const m = ult.get(a.ref), qtd = m?.saldoArt ?? 0;
    return { ref: a.ref, desc: a.desc, situacao: qtd > 0 ? 'Com stock' : 'Sem stock', qtd, pm: m?.pm ?? a.preco ?? 0, valor: m?.valorArt ?? 0, fam: familiaDe(a.desc), sub: subfamiliaDe(a.desc), un: a.un }; })
    .sort((x, y) => x.ref.localeCompare(y.ref, 'pt', { numeric: true }));
}
type K = keyof Linha;
interface Col { k: K; t: string; w: number; n?: boolean; eur?: boolean }
const COLS: Col[] = [
  { k: 'ref', t: 'Referência', w: 13 }, { k: 'desc', t: 'Descrição', w: 22 }, { k: 'situacao', t: 'Situação', w: 10 },
  { k: 'qtd', t: 'Qt. stock', w: 9, n: true }, { k: 'pm', t: 'Pr. médio', w: 9, n: true, eur: true }, { k: 'valor', t: 'Valor stock', w: 11, n: true, eur: true },
  { k: 'fam', t: 'Família', w: 13 }, { k: 'sub', t: 'Subfamília', w: 13 },
];

/* ---------- o estado ---------- */
interface Est { data: string; feito?: string; editar: boolean; erro: string; grupo: '' | 'fam' | 'sub' | 'situacao'; filtros: Record<string, string>; filtrosAbertos: boolean; ordem: { k: K; dir: 1 | -1 } | null; aviso: string; editor: boolean }
const novo = (): Est => ({ data: HOJE, editar: true, erro: '', grupo: '', filtros: {}, filtrosAbertos: false, ordem: null, aviso: '', editor: document.body.classList.contains('editando') });
const estados = new WeakMap<HTMLElement, Est>();
const de = (r: HTMLElement) => { let e = estados.get(r); if (!e) { e = novo(); estados.set(r, e); } return e; };
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const editando = () => (document.body.classList.contains('editando') && !document.body.classList.contains('ed-interagir')) || document.body.classList.contains('com-fluxo');
const raiz = (t: Element | null) => t?.closest<HTMLElement>('[data-minv]') ?? null;
const visivel = () => document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) [data-minv]');
const nf = (n: number) => n.toLocaleString('pt-PT');
const sem = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '');
function filtradas(e: Est): Linha[] {
  if (!e.feito) return [];
  let ls = inventarioEm(e.feito).filter((l) => Object.entries(e.filtros).every(([k, v]) => {
    if (!v.trim()) return true; const c = COLS.find((x) => x.k === k)!, x = l[c.k];
    if (c.n) { const m = v.trim().match(/^([<>]=?|=)?\s*(-?[\d.,]+)$/); if (!m) return true; const n = Number(m[2].replace(/\./g, '').replace(',', '.')) * (c.eur ? 100 : 1), y = x as number; return m[1] === '>' ? y > n : m[1] === '<' ? y < n : m[1] === '>=' ? y >= n : m[1] === '<=' ? y <= n : y === n; }
    return sem(String(x)).includes(sem(v));
  }));
  if (e.ordem) { const { k, dir } = e.ordem; ls = ls.slice().sort((a, b) => { const x = a[k], y = b[k]; return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'pt', { numeric: true })) * dir; }); }
  return ls;
}

/* ---------- a página ---------- */
function html(cen: string): string {
  const id = (x: string) => `minv-${x}-${cen}`;
  const B = (k: string, ic: string, t: string, tecla: string, cls = '') => BTN(k, ic, t, tecla, '', cls).replace('data-dv2-acao', 'data-minv-acao');
  return `<div class="hm ak lf2 dv2 mac mst mva minv" data-hm data-minv data-minv-cenario="${cen}" data-teclas="F2 F3 F4 F10 F12 Escape">
  ${topoErp([['ERP', 'inicio'], ['Stocks', ''], ['Mapas', ''], ['Mapa de inventário', '']])}
  <header class="ak-cab lf2-cab">
    <span class="ak-cab-ic">${L(clipboardList)}</span>
    <div><h1>Mapa de inventário</h1><p>O stock de cada artigo no fim de um dia, com o preço médio e o valor.</p></div>
  </header>
  <div class="ak-barra lf2-barra minv-barra" role="toolbar" aria-label="Ações do mapa">
    ${B('filtrar', funnel, 'Filtrar tabela', 'F2')}${B('remover', funnelX, 'Remover filtros', 'F3')}
    <i class="ak-sep" aria-hidden="true"></i>
    ${B('excel', sheet, 'Exportar para Excel', 'F4')}${B('imprimir', printer, 'Imprimir', 'F12')}
    <i class="ak-sep" aria-hidden="true"></i>
    <label class="rc-agrupar"><span>${L(layers)}Agrupar</span><select data-minv-grupo aria-label="Agrupar por"><option value="">Sem grupos</option><option value="fam">Por família</option><option value="sub">Por subfamília</option><option value="situacao">Por situação</option></select></label>
  </div>
  <form class="ak-crit mva-crit" data-minv-crit novalidate>
    <div class="rc-resumo-crit" data-minv-resumo-crit hidden></div>
    <div data-minv-aberto><div class="ak-crit-cab"><h2>Critérios</h2></div>
      <div class="ak-crit-c mva-crit-c"><div class="mva-crit-campos">
        <label class="ak-campo" for="${id('data')}"><span>Data de cálculo</span><input type="date" id="${id('data')}" data-minv-data max="${HOJE}" data-ak-primeiro></label>
        <p class="ak-erro-campo" data-minv-erro role="alert" hidden></p>
      </div><div class="ak-crit-acoes">${B('gerar', play, 'Gerar dados', 'F10', 'ak-btn--acao')}${B('cancelar', xIc, 'Cancelar', 'Esc', 'ak-btn--linha')}</div></div>
    </div>
  </form>
  <div class="rc-somatorios mac-soma" data-minv-soma></div>
  <section class="lf2-lista dv2-lista"><div class="lf2-lista-cab"><h2 data-minv-t>Inventário</h2><p class="lf2-resumo" data-minv-resumo></p></div><div class="lf2-grelha lf2-grelha--ajusta" data-minv-g tabindex="-1"></div></section>
  <div class="mac-impressao" aria-hidden="true" data-minv-impressao></div>
  <footer class="ak-estado lf2-estado" data-minv-estado role="status" aria-live="polite"></footer>
  <p class="hm-aviso" data-hm-aviso role="status" aria-live="polite"></p>
</div>`;
}

/* ---------- desenhar ---------- */
const avisos = new WeakMap<HTMLElement, number>();
function toast(r: HTMLElement, t: string): void { const p = r.querySelector<HTMLElement>('[data-hm-aviso]'); if (!p) return; p.textContent = t; p.classList.add('is-visivel'); clearTimeout(avisos.get(r)); avisos.set(r, window.setTimeout(() => p.classList.remove('is-visivel'), 3200)); }
const cel = (l: Linha, c: Col) => c.k === 'ref' ? `<b class="is-mono">${esc(l.ref)}</b>` : c.k === 'situacao' ? `<span class="minv-sit${l.qtd > 0 ? ' is-com' : ''}">${esc(l.situacao)}</span>` : c.eur ? ((l[c.k] as number) ? euros(l[c.k] as number) : '<span class="is-nada">0,00 €</span>') : c.n ? ((l[c.k] as number) ? nf(l[c.k] as number) : '<span class="is-nada">0</span>') : esc(String(l[c.k]));
function grelha(r: HTMLElement, e: Est, revelar = false): void {
  const g = r.querySelector<HTMLElement>('[data-minv-g]')!;
  if (!e.feito) { g.innerHTML = `<div class="ak-vazio lf2-vazio">${L(play)}<p><b>Escolhe a data de cálculo e gera os dados.</b>Hoje por omissão. F10 em qualquer sítio deste ecrã.</p></div>`; return; }
  const ls = filtradas(e);
  if (!ls.length) { g.innerHTML = `<div class="ak-vazio lf2-vazio">${L(searchX)}<p><b>Os filtros da tabela não deixam nenhum artigo.</b>F3 tira-os; a data fica.</p><button type="button" class="ak-btn" data-minv-acao="remover">${L(funnelX)}<span>Remover filtros</span></button></div>`; return; }
  const sort = (k: K) => e.ordem?.k === k ? (e.ordem.dir === 1 ? 'ascending' : 'descending') : 'none';
  const cab = `<tr>${COLS.map((c) => `<th scope="col" class="${c.n ? 'is-num' : ''}" aria-sort="${sort(c.k)}"><button type="button" data-minv-ordenar="${c.k}">${esc(c.t)}${e.ordem?.k === c.k ? `<span class="lf2-ord">${L(e.ordem.dir === 1 ? arrowUp : arrowDown)}</span>` : ''}</button></th>`).join('')}</tr>`
    + (e.filtrosAbertos ? `<tr class="lf2-filtros-col">${COLS.map((c) => `<th><input type="search" data-minv-fcol="${c.k}" value="${esc(e.filtros[c.k] ?? '')}" aria-label="Filtrar ${esc(c.t)}" placeholder="${c.n ? '> 0' : 'Filtrar…'}"></th>`).join('')}</tr>` : '');
  const tr = (l: Linha) => `<tr>${COLS.map((c) => `<td class="${c.n ? 'is-num' : ''}">${cel(l, c)}</td>`).join('')}</tr>`;
  const somas = (xs: Linha[], rot: string, cls: string) => `<tr class="${cls}"><td colspan="3"><b>${rot}</b></td><td class="is-num"><b>${nf(xs.reduce((s, l) => s + l.qtd, 0))}</b></td><td></td><td class="is-num"><b>${euros(xs.reduce((s, l) => s + l.valor, 0))}</b></td><td colspan="2"></td></tr>`;
  let corpo: string;
  if (e.grupo) {
    const gs = new Map<string, Linha[]>(); ls.forEach((l) => { const k = String(l[e.grupo as K]); gs.set(k, [...(gs.get(k) ?? []), l]); });
    corpo = [...gs].sort((a, b) => a[0].localeCompare(b[0], 'pt')).map(([k, xs]) => `<tr class="mac-g"><td colspan="${COLS.length}"><div class="mac-g-c"><span class="mac-g-abrir"><b>${esc(k)}</b><small>${nf(xs.length)} ${xs.length === 1 ? 'artigo' : 'artigos'}</small></span></div></td></tr>${xs.map(tr).join('')}${somas(xs, `Subtotal · ${esc(k)}`, 'rc-g-soma')}`).join('');
  } else corpo = ls.map(tr).join('');
  g.innerHTML = `<table class="lf2-tab lf2-tab--ajusta minv-tab" aria-label="Mapa de inventário"><colgroup>${COLS.map((c) => `<col style="width:${c.w}%">`).join('')}</colgroup><thead>${cab}</thead><tbody>${corpo}</tbody><tfoot>${somas(ls, `Total · ${nf(ls.length)} artigos`, 'rc-total mac-total')}</tfoot></table>`;
  if (revelar && !quieto()) g.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'cubic-bezier(.22, 1, .36, 1)' });
}
function tudo(r: HTMLElement, e: Est, revelar = false): void {
  const ls = filtradas(e), nfil = Object.values(e.filtros).filter((v) => v.trim()).length;
  r.querySelector<HTMLElement>('[data-minv-aberto]')!.hidden = !e.editar;
  const rc = r.querySelector<HTMLElement>('[data-minv-resumo-crit]')!; rc.hidden = e.editar;
  rc.innerHTML = `<h2>Critérios</h2><ul class="ak2-etiquetas"><li><button type="button" data-minv-acao="alterar">Data de cálculo ${e.feito ? dia(e.feito) : ''}</button></li></ul><button type="button" class="ak-btn ak-btn--linha" data-minv-acao="alterar">${L(pencil)}<span>Alterar critérios</span></button>`;
  const d = r.querySelector<HTMLInputElement>('[data-minv-data]')!; if (d.value !== e.data) d.value = e.data;
  const er = r.querySelector<HTMLElement>('[data-minv-erro]')!; er.hidden = !e.erro; er.textContent = e.erro;
  const gs = r.querySelector<HTMLSelectElement>('[data-minv-grupo]')!; gs.value = e.grupo; gs.disabled = !e.feito;
  r.querySelector<HTMLElement>('[data-minv-t]')!.textContent = e.feito ? `Inventário a ${dia(e.feito)}` : 'Inventário';
  r.querySelector<HTMLElement>('[data-minv-resumo]')!.innerHTML = e.feito ? `<span><b>${nf(ls.length)}</b> artigos</span>${nfil ? `<span>${nfil} ${nfil === 1 ? 'filtro' : 'filtros'} da tabela</span>` : ''}` : '';
  const s = r.querySelector<HTMLElement>('[data-minv-soma]')!; s.hidden = !e.feito || !ls.length;
  const com = ls.filter((l) => l.qtd > 0);
  s.innerHTML = e.feito ? `<span class="rc-s rc-s--total"><small>Valor do stock</small><b>${euros(ls.reduce((t, l) => t + l.valor, 0))}</b><i>ao preço médio de ${dia(e.feito)}</i></span><span class="rc-s"><small>Quantidade</small><b>${nf(ls.reduce((t, l) => t + l.qtd, 0))}</b><i>todos os armazéns</i></span><span class="rc-s"><small>Com stock</small><b>${nf(com.length)}</b><i>de ${nf(ls.length)} artigos</i></span>` : '';
  grelha(r, e, revelar);
  r.querySelectorAll<HTMLElement>('.minv-barra [data-minv-acao]').forEach((b) => { const k = b.dataset.minvAcao!, p = !e.feito ? 'Gera os dados primeiro (F10).' : k === 'remover' && !nfil && !e.filtrosAbertos ? 'Não há filtros da tabela.' : ''; b.setAttribute('aria-disabled', String(!!p)); if (p) b.title = p; });
  r.querySelector('[data-minv-acao="filtrar"]')?.setAttribute('aria-pressed', String(e.filtrosAbertos));
  r.querySelector<HTMLElement>('[data-minv-estado]')!.innerHTML = `<span>Data de cálculo <b>${e.feito ? dia(e.feito) : '—'}</b></span>${e.grupo ? `<span>Agrupado por <b>${{ fam: 'família', sub: 'subfamília', situacao: 'situação' }[e.grupo]}</b></span>` : ''}<span class="ak-estado-f is-ok">${e.feito ? 'Pronto' : 'Sem dados'}</span>${e.aviso ? `<span class="ak-estado-aviso">${esc(e.aviso)}</span>` : ''}`;
  const ip = r.querySelector<HTMLElement>('[data-minv-impressao]'); if (ip) ip.innerHTML = e.feito ? `<h1>Mapa de inventário a ${dia(e.feito)}</h1><p>Todos os armazéns, ao preço médio · impresso a ${new Date().toLocaleString('pt-PT')}</p>` : '';
}
function gerar(r: HTMLElement, e: Est): void {
  e.data = r.querySelector<HTMLInputElement>('[data-minv-data]')!.value;
  if (!e.data) { e.erro = 'Diz a data de cálculo.'; tudo(r, e); r.querySelector<HTMLElement>('[data-minv-data]')?.focus(); return; }
  if (e.data > HOJE) { e.erro = `A data de cálculo não pode ser depois de hoje (${dia(HOJE)}).`; tudo(r, e); r.querySelector<HTMLElement>('[data-minv-data]')?.focus(); return; }
  e.erro = ''; e.feito = e.data; e.editar = false; tudo(r, e, true);
}
function exportar(r: HTMLElement, e: Est): void {
  const ls = filtradas(e); if (!ls.length || !e.feito) return;
  const rows: Celula[][] = ls.map((l) => [l.ref, l.desc, l.situacao, l.qtd, { euros: l.pm }, { euros: l.valor }, l.fam, l.sub]);
  rows.push([`Total · ${ls.length}`, null, null, ls.reduce((t, l) => t + l.qtd, 0), null, { euros: ls.reduce((t, l) => t + l.valor, 0) }, null, null]);
  const nome = `Mapa-de-inventario-${e.feito}.xlsx`;
  try { descarregar(xlsx({ nome: 'Inventário', colunas: COLS.map((c) => c.t), linhas: rows, larguras: COLS.map((c) => Math.max(10, c.t.length + 6)) }), nome); e.aviso = `Exportado: ${nome} · ${nf(ls.length)} artigos.`; }
  catch { e.aviso = 'A exportação falhou; tenta outra vez (F4).'; }
  tudo(r, e); toast(r, e.aviso);
}

/* ---------- os cenários ---------- */
function armar(r: HTMLElement): void {
  if (estados.has(r)) return;
  const e = de(r), cen = r.dataset.minvCenario ?? 'inicial';
  if (cen !== 'inicial' && cen !== 'erro-data') { e.feito = cen === 'outra-data' ? '2026-06-30' : HOJE; e.data = e.feito; e.editar = false; }
  if (cen === 'erro-data') { e.data = '2026-12-31'; e.erro = `A data de cálculo não pode ser depois de hoje (${dia(HOJE)}).`; }
  if (cen === 'familia') e.grupo = 'fam';
  if (cen === 'situacao') e.grupo = 'situacao';
  if (cen === 'filtros') { e.filtrosAbertos = true; e.filtros = { qtd: '> 100' }; }
  if (cen === 'ordenado') e.ordem = { k: 'valor', dir: -1 };
  if (cen === 'editar') e.editar = true;
  if (cen === 'exportado') e.aviso = `Exportado: Mapa-de-inventario-${HOJE}.xlsx · ${ARTIGOS.length} artigos.`;
  tudo(r, e);
  if (!e.editor && r.closest('.ecra:not([hidden]) > .versao:not([hidden])') && !quieto()) r.classList.add('lf2-entra');
}
const armarTodos = () => document.querySelectorAll<HTMLElement>('[data-minv]').forEach(armar);
let espera = 0;
export function iniciar(): void {
  requestAnimationFrame(armarTodos);
  ['romafe:versao', 'romafe:ecra'].forEach((y) => document.addEventListener(y, () => requestAnimationFrame(armarTodos)));
  document.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement, r = raiz(t); if (!r || editando()) return; const e = de(r); let b: HTMLElement | null;
    if ((b = t.closest('[data-minv-acao][aria-disabled="true"]'))) { toast(r, b.title); return; }
    if ((b = t.closest('[data-minv-ordenar]'))) { const k = b.dataset.minvOrdenar as K; e.ordem = e.ordem?.k === k ? (e.ordem.dir === 1 ? { k, dir: -1 } : null) : { k, dir: 1 }; grelha(r, e); return; }
    if ((b = t.closest('[data-minv-acao]'))) {
      const k = b.dataset.minvAcao!;
      if (k === 'gerar') gerar(r, e);
      else if (k === 'cancelar') { if (e.feito) { e.data = e.feito; e.editar = false; } else e.data = HOJE; e.erro = ''; tudo(r, e); }
      else if (k === 'alterar') { e.editar = true; tudo(r, e); r.querySelector<HTMLElement>('[data-minv-data]')?.focus(); }
      else if (k === 'filtrar') { e.filtrosAbertos = !e.filtrosAbertos; tudo(r, e); if (e.filtrosAbertos) r.querySelector<HTMLElement>('[data-minv-fcol]')?.focus(); }
      else if (k === 'remover') { e.filtros = {}; e.filtrosAbertos = false; tudo(r, e); toast(r, 'Filtros da tabela removidos; a data fica.'); }
      else if (k === 'excel') exportar(r, e);
      else if (k === 'imprimir') window.print();
    }
  });
  document.addEventListener('change', (ev) => { const t = ev.target as HTMLSelectElement, r = raiz(t); if (!r || editando() || !t.matches('[data-minv-grupo]')) return; const e = de(r); e.grupo = t.value as Est['grupo']; tudo(r, e, true); });
  document.addEventListener('input', (ev) => {
    const t = ev.target as HTMLInputElement, r = raiz(t); if (!r || !t.matches('[data-minv-fcol]')) return; const e = de(r);
    clearTimeout(espera); espera = window.setTimeout(() => { e.filtros[t.dataset.minvFcol!] = t.value; tudo(r, e); const n = r.querySelector<HTMLInputElement>(`[data-minv-fcol="${t.dataset.minvFcol}"]`); n?.focus(); n?.setSelectionRange(n.value.length, n.value.length); }, 160);
  });
  document.addEventListener('keydown', (ev) => {
    const t = ev.target as HTMLElement, r = raiz(t) ?? visivel(); if (!r || editando()) return; const e = de(r);
    if (['F2', 'F3', 'F4', 'F10', 'F12'].includes(ev.key) && !ev.ctrlKey && !ev.altKey && !ev.metaKey && !ev.shiftKey) {
      ev.preventDefault(); const k = { F2: 'filtrar', F3: 'remover', F4: 'excel', F10: 'gerar', F12: 'imprimir' }[ev.key]!;
      r.querySelector<HTMLElement>(k === 'gerar' ? '[data-minv-acao="gerar"]' : `.minv-barra [data-minv-acao="${k}"]`)?.click(); return;
    }
    if (ev.key === 'Escape') { if (e.filtrosAbertos) { e.filtrosAbertos = false; tudo(r, e); ev.preventDefault(); return; } if (e.editar && e.feito) { r.querySelector<HTMLElement>('[data-minv-acao="cancelar"]')?.click(); ev.preventDefault(); } }
    if (ev.key === 'Enter' && t.matches('[data-minv-data]')) { ev.preventDefault(); gerar(r, e); }
  });
}

/* ---------- os ecrãs ---------- */
const NOTA = 'Mapa de inventário (18 nov., do «Mapa de Inventário» do ERP antigo): Data de cálculo e Gerar dados (F10); o stock, o preço médio e o valor de cada artigo no fim desse dia, dos mesmos movimentos do 77; Agrupar (família, subfamília, situação) com subtotais; F2/F3 filtros da tabela, F4 Excel, F12 Imprimir. A Situação está por confirmar no antigo.';
const ESTADOS: [string, string, string][] = [
  ['dados', 'Inventário de hoje', 'Todos os artigos com o stock, o preço médio e o valor; os totais em baixo e por cima.'],
  ['outra-data', 'Noutra data', 'A 30/06/2026: o stock e o valor desse dia.'],
  ['erro-data', 'Data depois de hoje', 'A data de cálculo não pode ser futura.'],
  ['editar', 'A alterar a data', 'Os critérios abertos depois de gerar; Cancelar repõe a data anterior.'],
  ['familia', 'Agrupado por família', 'Uma faixa por família, com o subtotal.'],
  ['situacao', 'Agrupado por situação', 'Com stock e sem stock, cada uma com o subtotal.'],
  ['filtros', 'Filtros da tabela (F2)', 'Qt. stock > 100; F3 tira os filtros.'],
  ['ordenado', 'Ordenado pelo valor', 'Tocar no título de uma coluna ordena; outra vez inverte, a terceira tira.'],
  ['exportado', 'Exportado para Excel', 'Os artigos com todas as colunas e o total.'],
];
export type IdMapaInv = 'stocks-mapa-inventario' | `minv-${string}`;
export function ecrasMapaInventario(): Ecra<IdErp>[] {
  const v = (cen: string) => ({ id: 'v1', nota: NOTA, html: html(cen) });
  return [
    { id: 'stocks-mapa-inventario', nome: '78 · Mapa de inventário', fluxo: 'Stocks', objetivo: 'O stock de cada artigo no fim de um dia, com o preço médio e o valor.', versoes: [v('inicial')] as Ecra<IdErp>['versoes'] },
    ...ESTADOS.map(([cen, nome, objetivo], i) => ({ id: `minv-${cen}` as IdErp, nome: `78.${i + 1} · ${nome}`, fluxo: 'Stocks', estadoDe: 'stocks-mapa-inventario' as IdErp, objetivo, versoes: [v(cen)] as Ecra<IdErp>['versoes'] })),
  ] as Ecra<IdErp>[];
}
