/* =========================================================
   ERP — Stocks ▸ Mapas ▸ 76 · Mapa de stocks, v2 (19 nov. 2026), dos briefings dela «Redesign profissional do Mapa
   de Stocks» e «Vista Hierárquica e Relações de Stocks». A v1 (stocks/mapa-stocks.ts) fica no código (os cálculos
   são de lá) e sai da lista.
     - Fica tudo o que a v1 fazia: Visualizar por artigo / descrição / família (F1–F3) e Iniciado por / Contendo /
       Igual a (Shift+F1–F3), que o IDE leva para a barra de cima; valorização Preço médio / Último preço / Preço de
       tabela (F5/F6/F7); armazém, classes de reposição Auto e Indústria, família, subfamília, só com existências;
       as colunas todas; F9 Atualizar, F11 Imprimir, Excel; os estados a carregar, a atualizar, erros e sessão;
     - novo: filtros aplicados à vista (cada um com ×) e dois filtros novos com dados que existem (stock nominal
       negativo, com encomendas pendentes); indicadores com hierarquia (5 principais, consignado e devolvido à parte);
       colunas por grupos (Stock, Encomendas, Valorização, Stock especial), guardadas; quatro vistas — Tabela, Cartões,
       Análise (barras feitas dos mesmos artigos filtrados) e Hierarquia (Família → Subfamília → Artigo, com os
       totais de cada nível e o caminho); o detalhe do artigo numa janela, com o stock por armazém, as encomendas,
       o cálculo do nominal e Ver relações (só as que existem no modelo: família, subfamília, fornecedor, armazéns,
       encomendas a fornecedores, clientes que compraram, movimentos — não há substitutos nem compostos).
   Regras: Stock nominal = Existências − Qt. enc. cli. + Qt. enc. for. (a da v1, não muda); o preço de tabela é o de
   venda, não o custo; o consignado e o devolvido ficam fora do valor das existências; não há stock mínimo definido,
   por isso não há filtro de stock baixo. O consignado, o devolvido, as encomendas de clientes e as classes são de
   exemplo (por confirmar no antigo), como na v1.
   CSS: css/mapa-stocks-v2.css, sobre o do 78 v2 e do 77 v2 (indicadores, cartões, vista, janela, filtros aplicados).
   ========================================================= */
import type { Ecra } from '../../../comum/tipos';
import type { IdErp } from '../ids';
import { topoErp } from '../inicio-v2';
import { L, esc } from '../espaco';
import { BTN } from '../compras/docs-v2';
import { ARTIGOS, aCaminho, db, pendente, fornecedor, dia, HOJE, type Artigo } from '../compras/dominio';
import { xlsx, descarregar, type Celula } from '../compras/xlsx';
import { familiaDe } from '../ficheiros/ecras';
import { ARMAZENS, stockEm } from './dominio';
import { vendas, cliente } from './vendas';
import { todosMovimentos, designacao } from './mapa-movimentos';
import { subfamiliaDe, CLASSES_AUTO, CLASSES_IND, classeAuto, classeInd, encCli, consignado, devolvido, precoDe, existDe, type Valz } from './mapa-stocks';
import boxes from 'lucide-static/icons/boxes.svg?raw';
import refresh from 'lucide-static/icons/refresh-cw.svg?raw';
import printer from 'lucide-static/icons/printer.svg?raw';
import sheet from 'lucide-static/icons/file-spreadsheet.svg?raw';
import search from 'lucide-static/icons/search.svg?raw';
import searchX from 'lucide-static/icons/search-x.svg?raw';
import hash from 'lucide-static/icons/hash.svg?raw';
import textIc from 'lucide-static/icons/text.svg?raw';
import folderTree from 'lucide-static/icons/folder-tree.svg?raw';
import folder from 'lucide-static/icons/folder.svg?raw';
import funnelX from 'lucide-static/icons/funnel-x.svg?raw';
import sliders from 'lucide-static/icons/sliders-horizontal.svg?raw';
import columns from 'lucide-static/icons/columns-3.svg?raw';
import arrowUp from 'lucide-static/icons/arrow-up.svg?raw';
import arrowDown from 'lucide-static/icons/arrow-down.svg?raw';
import xIc from 'lucide-static/icons/x.svg?raw';
import grid from 'lucide-static/icons/layout-grid.svg?raw';
import table from 'lucide-static/icons/table-2.svg?raw';
import chartBar from 'lucide-static/icons/chart-bar.svg?raw';
import network from 'lucide-static/icons/network.svg?raw';
import eye from 'lucide-static/icons/eye.svg?raw';
import euroIc from 'lucide-static/icons/euro.svg?raw';
import warehouse from 'lucide-static/icons/warehouse.svg?raw';
import users from 'lucide-static/icons/users.svg?raw';
import truck from 'lucide-static/icons/truck.svg?raw';
import scale from 'lucide-static/icons/scale.svg?raw';
import history from 'lucide-static/icons/history.svg?raw';
import alerta from 'lucide-static/icons/triangle-alert.svg?raw';
import chevR from 'lucide-static/icons/chevron-right.svg?raw';
import loader from 'lucide-static/icons/loader-circle.svg?raw';
import wifiOff from 'lucide-static/icons/wifi-off.svg?raw';
import logIn from 'lucide-static/icons/log-in.svg?raw';
import circleAlert from 'lucide-static/icons/circle-alert.svg?raw';
import pkg from 'lucide-static/icons/package.svg?raw';
import undo from 'lucide-static/icons/undo-2.svg?raw';

/* ---------- números ---------- */
const NF = new Intl.NumberFormat('pt-PT', { useGrouping: 'always' } as unknown as Intl.NumberFormatOptions);
const EF = new Intl.NumberFormat('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always' } as unknown as Intl.NumberFormatOptions);
const nf = (n: number) => (n < 0 ? '−' : '') + NF.format(Math.abs(n));
const eur = (c: number) => (c < 0 ? '−' : '') + EF.format(Math.abs(c) / 100) + ' €';
const zero = (t: string) => `<span class="is-nada">${t}</span>`;
const q0 = (n: number) => (n ? nf(n) : zero('0'));
const e0 = (c: number) => (c ? eur(c) : zero(eur(0)));
const pl = (n: number, um: string, varios: string) => `${nf(n)} ${n === 1 ? um : varios}`;
const curto = (nome: string) => nome.replace('Armazém ', '');
const sem = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '');

/* ---------- as linhas ---------- */
interface Linha { a: Artigo; fam: string; sub: string; exist: number; encCli: number; encFor: number; nominal: number; preco: number; valor: number; cons: number; vCons: number; dev: number; vDev: number }
const VALZ: { k: Valz; tecla: string; t: string; col: string; nota: string }[] = [
  { k: 'medio', tecla: 'F5', t: 'Preço médio', col: 'Pr. médio', nota: 'o preço médio ponderado dos movimentos (o mesmo do 77 e do 78)' },
  { k: 'ultimo', tecla: 'F6', t: 'Último preço', col: 'Últ. preço', nota: 'o último preço de compra do artigo' },
  { k: 'tabela', tecla: 'F7', t: 'Preço de tabela', col: 'Pr. tabela', nota: 'o preço de venda de tabela — não é o custo do stock' },
];
type Modo = 'artigo' | 'descricao' | 'familia';
type Comp = 'inicio' | 'contem' | 'igual';
type Vista = 'tabela' | 'cartoes' | 'analise' | 'hierarquia';
type Grupo = 'stock' | 'enc' | 'valz' | 'esp';
interface Est {
  modo: Modo; comp: Comp; q: string; valz: Valz; armazem: string; cAuto: string; cInd: string; fam: string; sub: string; soCom: boolean; soNeg: boolean; soEnc: boolean; mais: boolean;
  ordem: { k: string; dir: 1 | -1 } | null; vista: Vista; grupos: Grupo[]; colsAberto: boolean; sel: string; jan: boolean; rel: boolean; abertos: string[];
  fase: 'ok' | 'carregar' | 'atualizar' | 'erro'; erro?: 'servidor' | 'offline' | 'sessao'; aviso: string; hora: Date; editor: boolean;
}
const CHAVE = 'erp:stocks:mapa-stocks-v2';
const guardado = (): Partial<Est> => { try { return JSON.parse(localStorage.getItem(CHAVE) ?? '{}'); } catch { return {}; } };
const TODOS_GRUPOS: Grupo[] = ['stock', 'enc', 'valz', 'esp'];
const novo = (): Est => {
  const editor = document.body.classList.contains('editando'), g = editor ? {} : guardado();
  return { modo: g.modo ?? 'artigo', comp: 'inicio', q: '', valz: g.valz ?? 'medio', armazem: '', cAuto: '', cInd: '', fam: '', sub: '', soCom: false, soNeg: false, soEnc: false, mais: false, ordem: null,
    vista: g.vista ?? 'tabela', grupos: g.grupos?.length ? g.grupos : TODOS_GRUPOS.slice(), colsAberto: false, sel: '', jan: false, rel: false, abertos: [], fase: 'ok', aviso: '', hora: new Date(), editor };
};
const guardar = (e: Est) => { if (!e.editor) try { localStorage.setItem(CHAVE, JSON.stringify({ modo: e.modo, valz: e.valz, vista: e.vista, grupos: e.grupos })); } catch { /* */ } };
const estados = new WeakMap<HTMLElement, Est>();
const de = (r: HTMLElement) => { let e = estados.get(r); if (!e) { e = novo(); estados.set(r, e); } return e; };
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const editando = () => (document.body.classList.contains('editando') && !document.body.classList.contains('ed-interagir')) || document.body.classList.contains('com-fluxo');
const raiz = (t: Element | null) => t?.closest<HTMLElement>('[data-mst2]') ?? null;
const visivel = () => document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) [data-mst2]');
const MODOS: { k: Modo; tecla: string; t: string; ic: string; ph: string }[] = [
  { k: 'artigo', tecla: 'F1', t: 'Artigo', ic: hash, ph: 'Referência, ex.: 6206' },
  { k: 'descricao', tecla: 'F2', t: 'Descrição', ic: textIc, ph: 'Descrição, ex.: pastilhas' },
  { k: 'familia', tecla: 'F3', t: 'Família/Subfamília', ic: folderTree, ph: 'Família ou subfamília, ex.: travagem' },
];
const compara = (c: Comp, v: string, q: string) => { const a = sem(v), b = sem(q); return c === 'igual' ? a === b : c === 'contem' ? a.includes(b) : a.startsWith(b); };
const FAMILIAS = [...new Set(ARTIGOS.map((a) => familiaDe(a.desc)))].sort((a, b) => a.localeCompare(b, 'pt'));
const subsDe = (fam: string) => [...new Set(ARTIGOS.filter((a) => !fam || familiaDe(a.desc) === fam).map((a) => subfamiliaDe(a.desc)))].sort((a, b) => a.localeCompare(b, 'pt'));
function todas(e: Est): Linha[] {
  return ARTIGOS.map((a): Linha => {
    const exist = existDe(a, e.armazem), ec = encCli(a), ef = aCaminho(a.ref), p = precoDe(a, e.valz), cs = consignado(a), dv = devolvido(a);
    return { a, fam: familiaDe(a.desc), sub: subfamiliaDe(a.desc), exist, encCli: ec, encFor: ef, nominal: exist - ec + ef, preco: p, valor: exist * p, cons: cs, vCons: cs * p, dev: dv, vDev: dv * p };
  });
}
function linhas(e: Est): Linha[] {
  let ls = todas(e).filter((l) => (!e.cAuto || classeAuto(l.a) === e.cAuto) && (!e.cInd || classeInd(l.a) === e.cInd) && (!e.fam || l.fam === e.fam) && (!e.sub || l.sub === e.sub) && (!e.soCom || l.exist > 0) && (!e.soNeg || l.nominal < 0) && (!e.soEnc || l.encCli > 0 || l.encFor > 0)
    && (!e.q.trim() || (e.modo === 'artigo' ? compara(e.comp, l.a.ref, e.q) : e.modo === 'descricao' ? compara(e.comp, l.a.desc, e.q) : compara(e.comp, l.fam, e.q) || compara(e.comp, l.sub, e.q))));
  const base = (x: Linha, y: Linha) => e.modo === 'descricao' ? x.a.desc.localeCompare(y.a.desc, 'pt') || x.a.ref.localeCompare(y.a.ref) : e.modo === 'familia' ? x.fam.localeCompare(y.fam, 'pt') || x.sub.localeCompare(y.sub, 'pt') || x.a.ref.localeCompare(y.a.ref, 'pt', { numeric: true }) : x.a.ref.localeCompare(y.a.ref, 'pt', { numeric: true });
  ls.sort(base);
  if (e.ordem) { const { k, dir } = e.ordem; ls = ls.slice().sort((x, y) => (k === 'ref' ? base(x, y) : ((x as unknown as Record<string, number>)[k] - (y as unknown as Record<string, number>)[k])) * dir); }
  return ls;
}
interface Col { k: string; t: string; w: number; g?: Grupo; eur?: boolean; titulo?: string }
const COLS = (e: Est): Col[] => [
  { k: 'ref', t: 'Artigo', w: 22 },
  { k: 'exist', t: 'Existências', w: 8.5, g: 'stock', titulo: 'Existências físicas no armazém escolhido (ou em todos)' },
  { k: 'encCli', t: 'Enc. cli.', w: 7.5, g: 'enc', titulo: 'Encomendado por clientes, por entregar (de exemplo, por confirmar)' },
  { k: 'encFor', t: 'Enc. for.', w: 7.5, g: 'enc', titulo: 'Encomendado a fornecedores, por receber (as encomendas em aberto das Compras)' },
  { k: 'nominal', t: 'Stock nominal', w: 8.5, g: 'stock', titulo: 'Existências − encomendado por clientes + encomendado a fornecedores' },
  { k: 'preco', t: VALZ.find((v) => v.k === e.valz)!.col, w: 7.5, g: 'valz', eur: true, titulo: VALZ.find((v) => v.k === e.valz)!.nota },
  { k: 'valor', t: 'Valor', w: 9, g: 'valz', eur: true, titulo: 'Existências × preço' },
  { k: 'cons', t: 'Consignado', w: 7.5, g: 'esp', titulo: 'Stock consignado (de exemplo, por confirmar); fora do valor das existências' },
  { k: 'vCons', t: 'Valor cons.', w: 7.5, g: 'esp', eur: true },
  { k: 'dev', t: 'Devolvido', w: 7, g: 'esp', titulo: 'Stock devolvido (de exemplo, por confirmar); fora do valor das existências' },
  { k: 'vDev', t: 'Valor dev.', w: 7, g: 'esp', eur: true },
].filter((c) => !c.g || e.grupos.includes(c.g as Grupo)) as Col[];
const GRUPOS: [Grupo, string][] = [['stock', 'Stock (existências, nominal)'], ['enc', 'Encomendas (clientes, fornecedores)'], ['valz', 'Valorização (preço, valor)'], ['esp', 'Stock especial (consignado, devolvido)']];
const nomQ = (l: Linha) => l.nominal < 0 ? `<span class="mst2-neg" title="Stock nominal negativo: as encomendas de clientes (${nf(l.encCli)}) passam as existências (${nf(l.exist)}) e o que vem dos fornecedores (${nf(l.encFor)}).">${L(alerta)}${nf(l.nominal)}</span>` : q0(l.nominal);
const encFornDe = (ref: string) => db().enc.filter((x) => ['Emitida', 'Parcialmente recebida'].includes(x.estado)).flatMap((x) => x.linhas.filter((l) => l.ref === ref && pendente(l) > 0).map((l) => ({ enc: x.ref, qtd: pendente(l), entrega: x.entrega })));

/* ---------- a página ---------- */
const op = (v: string, t: string) => `<option value="${esc(v)}">${esc(t)}</option>`;
function html(cen: string): string {
  const id = (x: string) => `mst2-${x}-${cen}`;
  const B = (k: string, ic: string, t: string, tecla: string, cls = '') => BTN(k, ic, t, tecla, '', cls).replace('data-dv2-acao', 'data-mst2-acao');
  const VIS: [Vista, string, string][] = [['tabela', 'Tabela', table], ['cartoes', 'Cartões', grid], ['analise', 'Análise', chartBar], ['hierarquia', 'Hierarquia', folderTree]];
  return `<div class="hm ak lf2 dv2 mac mst minv2 mva2 mst2" data-hm data-mst2 data-mst2-cenario="${cen}" data-teclas="F1 F2 F3 F5 F6 F7 F9 F11 Escape">
  ${topoErp([['ERP', 'inicio'], ['Stocks', ''], ['Mapas', ''], ['Stocks', '']])}
  <header class="ak-cab lf2-cab mst2-cab"><span class="ak-cab-ic">${L(boxes)}</span>
    <div><h1>Mapa de stocks</h1><p>Consulte as existências, encomendas, disponibilidade e valorização dos artigos.</p></div>
    <span class="mst2-hora" data-mst2-hora></span></header>
  <div class="ak-barra lf2-barra mst2-barra" role="toolbar" aria-label="Ações">
    ${B('atualizar', refresh, 'Atualizar', 'F9')}${B('imprimir', printer, 'Imprimir', 'F11')}<i class="ak-sep" aria-hidden="true"></i>${B('excel', sheet, 'Exportar para Excel', '')}<i class="ak-sep" aria-hidden="true"></i>
    <span class="mst-valz" role="radiogroup" aria-label="Valorização"><small>Valorização</small>${VALZ.map((v) => `<button type="button" role="radio" aria-checked="${v.k === 'medio'}" data-mst2-valz="${v.k}" title="${esc(`${v.t}: ${v.nota}`)} (${v.tecla})">${v.t}<kbd>${v.tecla}</kbd></button>`).join('')}</span>
    <span class="ak2-esp"></span>
    <span class="minv2-vistas" role="group" aria-label="Vista">${VIS.map(([k, t, ic], i) => `<button type="button" data-mst2-vista="${k}" aria-pressed="${i === 0}" title="Vista ${t.toLowerCase()}">${L(ic)}<span>${t}</span></button>`).join('')}</span>
  </div>
  <form class="minv2-filtros mva2-filtros mst2-filtros" novalidate aria-label="Filtros">
    <div class="ak-campo mva2-pesq" role="group" aria-labelledby="${id('pq')}"><span id="${id('pq')}">Pesquisa</span>
      <div class="mva2-pq">
        <span class="dv2-modos" role="radiogroup" aria-label="Visualizar por">${MODOS.map((m, i) => `<button type="button" role="radio" aria-checked="${i === 0}" data-mst2-modo="${m.k}" title="Visualizar por ${m.t.toLowerCase()} (${m.tecla})">${L(m.ic)}<span>${m.t}</span><kbd>${m.tecla}</kbd></button>`).join('')}</span>
        <span class="lf2-comp" role="radiogroup" aria-label="Como compara">${([['inicio', 'Iniciado por', 'Shift+F1'], ['contem', 'Contendo', 'Shift+F2'], ['igual', 'Igual a', 'Shift+F3']] as const).map(([k, t, tc], i) => `<button type="button" role="radio" aria-checked="${i === 0}" data-mst2-comp="${k}" title="Pesquisa ${t.toLowerCase()} (${tc})">${t}</button>`).join('')}</span>
        <div class="minv2-pesq-c">${L(search)}<input type="search" data-mst2-q autocomplete="off" placeholder="${MODOS[0].ph}" aria-labelledby="${id('pq')}"></div>
      </div></div>
    <label class="ak-campo"><span>Armazém</span><select data-mst2-f="armazem">${op('', 'Todos os armazéns')}${ARMAZENS.map((a) => op(a.cod, curto(a.nome))).join('')}</select></label>
    <label class="ak-campo"><span>Família</span><select data-mst2-f="fam">${op('', 'Todas')}${FAMILIAS.map((f) => op(f, f)).join('')}</select></label>
    <span class="minv2-filtros-bts"><button type="button" class="ak-btn ak-btn--linha" data-mst2-acao="limpar">${L(funnelX)}<span>Limpar filtros</span></button><button type="button" class="ak-btn ak-btn--linha" data-mst2-acao="mais" aria-expanded="false">${L(sliders)}<span>Mais filtros</span></button></span>
    <div class="minv2-mais mst2-mais" data-mst2-mais hidden>
      <label class="ak-campo"><span>Subfamília</span><select data-mst2-f="sub">${op('', 'Todas')}</select></label>
      <label class="ak-campo"><span>Classe reposição Auto</span><select data-mst2-f="cAuto">${op('', 'Todas')}${CLASSES_AUTO.map((c) => op(c.cod, `${c.cod} · ${c.nome}`)).join('')}</select></label>
      <label class="ak-campo"><span>Classe reposição Indústria</span><select data-mst2-f="cInd">${op('', 'Todas')}${CLASSES_IND.map((c) => op(c.cod, `${c.cod} · ${c.nome}`)).join('')}</select></label>
      <fieldset class="mst2-sos"><legend>Só os artigos</legend>
        <label><input type="checkbox" data-mst2-so="soCom"><span>com existências</span></label>
        <label><input type="checkbox" data-mst2-so="soNeg"><span>com stock nominal negativo</span></label>
        <label><input type="checkbox" data-mst2-so="soEnc"><span>com encomendas pendentes</span></label>
      </fieldset>
      <p class="mst2-nota">Stock baixo: o sistema ainda não tem um mínimo por artigo; quando tiver, entra aqui.</p>
    </div>
  </form>
  <ul class="mva2-chips" data-mst2-chips aria-label="Filtros aplicados"></ul>
  <section class="minv2-kpis mst2-kpis" data-mst2-kpis aria-label="Resumo"></section>
  <section class="lf2-lista dv2-lista minv2-lista mst2-lista">
    <div class="lf2-lista-cab minv2-lista-cab"><h2 data-mst2-t>Artigos</h2><p class="lf2-resumo" data-mst2-resumo></p>
      <span class="mst2-cols-c" data-mst2-cols-c><button type="button" class="ak-btn ak-btn--linha" data-mst2-acao="colunas" aria-expanded="false">${L(columns)}<span>Colunas</span></button>
        <div data-por-cima class="mst2-cols" data-mst2-cols role="group" aria-label="Grupos de colunas" hidden>${GRUPOS.map(([g, t]) => `<label><input type="checkbox" data-mst2-grupo="${g}" checked><span>${t}</span></label>`).join('')}</div></span></div>
    <nav class="mst2-migalhas" data-mst2-migalhas aria-label="Caminho" hidden></nav>
    <div class="lf2-grelha lf2-grelha--ajusta minv2-g mst2-g" data-mst2-g tabindex="-1"></div>
  </section>
  <div data-mst2-janela></div>
  <div class="mac-impressao" aria-hidden="true" data-mst2-impressao></div>
  <footer class="ak-estado lf2-estado" data-mst2-estado role="status" aria-live="polite"></footer>
  <p class="hm-aviso" data-hm-aviso role="status" aria-live="polite"></p>
</div>`;
}

/* ---------- desenhar ---------- */
const avisos = new WeakMap<HTMLElement, number>();
function toast(r: HTMLElement, t: string): void { const p = r.querySelector<HTMLElement>('[data-hm-aviso]'); if (!p || !t) return; p.textContent = t; p.classList.add('is-visivel'); clearTimeout(avisos.get(r)); avisos.set(r, window.setTimeout(() => p.classList.remove('is-visivel'), 3200)); }
const vazio = (ic: string, t: string, d: string, botao = '') => `<div class="ak-vazio lf2-vazio">${L(ic)}<p><b>${t}</b>${d}</p>${botao}</div>`;
const kpi = (cls: string, ic: string, t: string, v: string, ctx: string, extra = '') => `<div class="minv2-kpi ${cls}"${extra}><span class="minv2-kpi-ic">${L(ic)}</span><small>${t}</small><b>${v}</b><i>${ctx}</i></div>`;
const soma = (ls: Linha[], k: keyof Linha) => ls.reduce((s, l) => s + (l[k] as number), 0);
function kpis(r: HTMLElement, e: Est, ls: Linha[]): void {
  const k = r.querySelector<HTMLElement>('[data-mst2-kpis]')!; k.hidden = e.fase === 'carregar' || e.fase === 'erro' || !ls.length; if (k.hidden) return;
  const v = VALZ.find((x) => x.k === e.valz)!, neg = ls.filter((l) => l.nominal < 0).length;
  const arms = ARMAZENS.filter((a) => (!e.armazem || a.cod === e.armazem) && ls.some((l) => stockEm(l.a.ref, a.nome) > 0)).length;
  k.innerHTML = `${kpi('is-total', euroIc, 'Valor das existências', eur(soma(ls, 'valor')), `ao ${v.t.toLowerCase()} (${v.tecla})`)}
    ${kpi('', boxes, 'Existências físicas', `${nf(soma(ls, 'exist'))} un.`, e.armazem ? curto(ARMAZENS.find((a) => a.cod === e.armazem)!.nome) : `em ${pl(arms, 'armazém', 'armazéns')}`)}
    ${kpi('', users, 'Encomendas de clientes', `${nf(soma(ls, 'encCli'))} un.`, `por entregar · ${pl(ls.filter((l) => l.encCli > 0).length, 'artigo', 'artigos')}`)}
    ${kpi('', truck, 'Encomendas a fornecedores', `${nf(soma(ls, 'encFor'))} un.`, `por receber · ${pl(ls.filter((l) => l.encFor > 0).length, 'artigo', 'artigos')}`)}
    <button type="button" class="minv2-kpi${neg ? ' is-alerta' : ''}" data-mst2-neg aria-pressed="${e.soNeg}" title="${e.soNeg ? 'Tirar o filtro' : 'Mostrar só os artigos com stock nominal negativo'}"><span class="minv2-kpi-ic">${L(scale)}</span><small>Stock nominal</small><b>${nf(soma(ls, 'nominal'))} un.</b><i>${neg ? `${pl(neg, 'artigo', 'artigos')} abaixo de zero` : 'nenhum artigo abaixo de zero'}</i></button>
    <p class="mst2-sec"><span>${L(pkg)}Consignado <b>${nf(soma(ls, 'cons'))} un.</b> · ${eur(soma(ls, 'vCons'))}</span><span>${L(undo)}Devolvido <b>${nf(soma(ls, 'dev'))} un.</b> · ${eur(soma(ls, 'vDev'))}</span><small>fora do valor das existências · de exemplo, por confirmar</small></p>`;
}
const linhaArt = (l: Linha) => `<span class="mva2-art-c"><b class="is-mono">${esc(l.a.ref)}</b><small title="${esc(l.a.desc)}">${esc(l.a.desc)}</small></span>`;
function celula(l: Linha, c: Col): string {
  if (c.k === 'ref') return linhaArt(l);
  if (c.k === 'nominal') return nomQ(l);
  const v = (l as unknown as Record<string, number>)[c.k];
  return c.eur ? e0(v) : q0(v);
}
function tabela(e: Est, ls: Linha[]): string {
  const cs = COLS(e), sort = (k: string) => e.ordem?.k === k ? (e.ordem.dir === 1 ? 'ascending' : 'descending') : 'none';
  const tr = (l: Linha) => `<tr data-mst2-art="${esc(l.a.ref)}" class="${l.a.ref === e.sel ? 'is-ativo' : ''}${l.nominal < 0 ? ' is-neg' : ''}" tabindex="${l.a.ref === e.sel ? 0 : -1}" aria-selected="${l.a.ref === e.sel}">${cs.map((c) => `<td class="${c.k === 'ref' ? '' : 'is-num'}${c.k === 'nominal' ? ' mst2-col-nom' : ''}">${celula(l, c)}</td>`).join('')}</tr>`;
  const tot = (xs: Linha[], rot: string, cls: string) => `<tr class="${cls}">${cs.map((c, i) => i === 0 ? `<td><b>${rot}</b></td>` : c.k === 'preco' ? '<td></td>' : `<td class="is-num${c.k === 'nominal' ? ' mst2-col-nom' : ''}"><b>${c.eur ? eur(soma(xs, c.k as keyof Linha)) : nf(soma(xs, c.k as keyof Linha))}</b></td>`).join('')}</tr>`;
  let corpo: string;
  if (e.modo === 'familia' && !e.ordem) {
    const gs = new Map<string, Linha[]>(); ls.forEach((l) => gs.set(l.fam, [...(gs.get(l.fam) ?? []), l]));
    corpo = [...gs].map(([f, xs]) => `<tr class="mac-g"><td colspan="${cs.length}"><div class="mac-g-c"><span class="mac-g-abrir"><b>${esc(f)}</b><small>${pl(xs.length, 'artigo', 'artigos')} · ${esc([...new Set(xs.map((x) => x.sub))].join(', '))}</small></span></div></td></tr>${xs.map(tr).join('')}${tot(xs, `Subtotal · ${esc(f)}`, 'rc-g-soma')}`).join('');
  } else corpo = ls.map(tr).join('');
  return `<table class="lf2-tab lf2-tab--ajusta mst-tab mst2-tab" aria-label="Mapa de stocks"><colgroup>${cs.map((c) => `<col style="width:${c.w}%">`).join('')}</colgroup>
    <thead><tr>${cs.map((c) => `<th scope="col" class="${c.k === 'ref' ? '' : 'is-num'}${c.k === 'nominal' ? ' mst2-col-nom' : ''}" aria-sort="${sort(c.k)}"${c.titulo ? ` title="${esc(c.titulo)}"` : ''}><button type="button" data-mst2-ordenar="${c.k}">${esc(c.t)}${e.ordem?.k === c.k ? `<span class="lf2-ord">${L(e.ordem.dir === 1 ? arrowUp : arrowDown)}</span>` : ''}</button></th>`).join('')}</tr></thead>
    <tbody>${corpo}</tbody><tfoot>${tot(ls, `Total · ${pl(ls.length, 'artigo', 'artigos')}`, 'rc-total mac-total')}</tfoot></table>`;
}
const estadoArt = (l: Linha) => l.nominal < 0 ? ['is-neg', 'Nominal negativo'] : l.exist <= 0 ? ['is-sem', 'Sem existências'] : l.encFor > 0 ? ['is-enc', 'A chegar'] : ['is-com', 'Com stock'];
function cartoes(e: Est, ls: Linha[]): string {
  const v = VALZ.find((x) => x.k === e.valz)!;
  return `<div class="minv2-cartoes">${ls.map((l) => { const [cls, t] = estadoArt(l); return `<article class="minv2-cartao mst2-cartao${l.a.ref === e.sel ? ' is-ativo' : ''}" data-mst2-art="${esc(l.a.ref)}" tabindex="${l.a.ref === e.sel ? 0 : -1}" aria-selected="${l.a.ref === e.sel}" aria-label="${esc(`${l.a.ref} · ${l.a.desc}`)}">
    <header><b class="is-mono">${esc(l.a.ref)}</b><span class="mst2-est ${cls}"><i aria-hidden="true"></i>${t}</span></header>
    <h3 title="${esc(l.a.desc)}">${esc(l.a.desc)}</h3><p class="minv2-fam">${esc(l.fam)} › ${esc(l.sub)}</p>
    <dl class="mst2-q"><div><dt>Existências</dt><dd>${q0(l.exist)} <small>${esc(l.a.un)}</small></dd></div><div><dt>Enc. clientes</dt><dd>${q0(l.encCli)}</dd></div><div><dt>Enc. fornecedores</dt><dd>${q0(l.encFor)}</dd></div><div class="is-nom"><dt>Stock nominal</dt><dd>${nomQ(l)}</dd></div></dl>
    <dl class="minv2-nums"><div><dt>${v.t}</dt><dd>${eur(l.preco)}</dd></div><div class="is-valor"><dt>Valor</dt><dd>${e0(l.valor)}</dd></div></dl>
    <footer><button type="button" class="ak-btn ak-btn--linha" data-mst2-ver="${esc(l.a.ref)}">${L(eye)}<span>Ver artigo</span></button></footer></article>`; }).join('')}</div>`;
}
/** Barras horizontais simples (HTML), com o valor escrito: legíveis e acessíveis sem biblioteca. */
const barras = (titulo: string, ic: string, xs: [string, number, string][], nota = '', ref?: (i: number) => string) => {
  const max = Math.max(1, ...xs.map((x) => Math.abs(x[1])));
  return `<section class="mst2-an"><h3>${L(ic)}${titulo}</h3>${nota ? `<p class="mst2-an-nota">${nota}</p>` : ''}${xs.length ? `<ul class="mst2-barras">${xs.map(([t, v, txt], i) => `<li${ref ? ` data-mst2-art="${esc(ref(i))}" tabindex="0" role="button"` : ''}><span class="mst2-b-t" title="${esc(t)}">${esc(t)}</span><span class="mst2-b-b"><i class="${v < 0 ? 'is-neg' : ''}" style="width:${(Math.abs(v) / max) * 100}%"></i></span><b>${txt}</b></li>`).join('')}</ul>` : '<p class="mst2-an-nota">Nada com estes filtros.</p>'}</section>`;
};
function analise(e: Est, ls: Linha[]): string {
  const v = VALZ.find((x) => x.k === e.valz)!;
  const porFam = [...ls.reduce((m, l) => m.set(l.fam, (m.get(l.fam) ?? 0) + l.valor), new Map<string, number>())].sort((a, b) => b[1] - a[1]);
  const top = ls.filter((l) => l.valor > 0).sort((a, b) => b.valor - a.valor).slice(0, 8);
  const neg = ls.filter((l) => l.nominal < 0).sort((a, b) => a.nominal - b.nominal);
  const enc = ls.filter((l) => l.encCli || l.encFor).sort((a, b) => (b.encCli + b.encFor) - (a.encCli + a.encFor)).slice(0, 8);
  const porArm = ARMAZENS.filter((a) => !e.armazem || a.cod === e.armazem).map((a) => [curto(a.nome), ls.reduce((s, l) => s + stockEm(l.a.ref, a.nome), 0)] as [string, number]);
  const esp = ls.filter((l) => l.cons || l.dev);
  return `<div class="mst2-analise">
    ${barras('Valor por família', folder, porFam.map(([f, x]) => [f, x, eur(x)]), `Ao ${v.t.toLowerCase()} · ${eur(soma(ls, 'valor'))} no total`)}
    ${barras('Artigos com maior valor', euroIc, top.map((l) => [`${l.a.ref} · ${l.a.desc}`, l.valor, eur(l.valor)]), '', (i) => top[i].a.ref)}
    ${barras('Stock nominal negativo', alerta, neg.map((l) => [`${l.a.ref} · ${l.a.desc}`, l.nominal, `${nf(l.nominal)} un.`]), neg.length ? 'Encomendas de clientes acima das existências e do que vem dos fornecedores.' : 'Nenhum artigo abaixo de zero.', (i) => neg[i].a.ref)}
    <section class="mst2-an"><h3>${L(truck)}Encomendas por artigo</h3><p class="mst2-an-nota"><i class="mst2-leg is-cli"></i>clientes (por entregar) <i class="mst2-leg is-for"></i>fornecedores (por receber)</p>
      ${enc.length ? `<ul class="mst2-barras is-duplas">${(() => { const mx = Math.max(1, ...enc.flatMap((l) => [l.encCli, l.encFor])); return enc.map((l) => `<li data-mst2-art="${esc(l.a.ref)}" tabindex="0" role="button"><span class="mst2-b-t" title="${esc(l.a.desc)}">${esc(l.a.ref)}</span><span class="mst2-b-b"><i class="is-cli" style="width:${(l.encCli / mx) * 100}%"></i><i class="is-for" style="width:${(l.encFor / mx) * 100}%"></i></span><b>${nf(l.encCli)} / ${nf(l.encFor)}</b></li>`).join(''); })()}</ul>` : '<p class="mst2-an-nota">Sem encomendas pendentes.</p>'}</section>
    ${barras('Existências por armazém', warehouse, porArm.map(([a, q]) => [a, q, `${nf(q)} un.`]))}
    <section class="mst2-an"><h3>${L(pkg)}Consignado e devolvido</h3><p class="mst2-an-nota">De exemplo (por confirmar no antigo); fora do valor das existências.</p>
      ${esp.length ? `<table class="mst2-mini"><thead><tr><th>Artigo</th><th class="is-num">Consignado</th><th class="is-num">Devolvido</th><th class="is-num">Valor</th></tr></thead><tbody>${esp.map((l) => `<tr><td><b class="is-mono">${esc(l.a.ref)}</b></td><td class="is-num">${q0(l.cons)}</td><td class="is-num">${q0(l.dev)}</td><td class="is-num">${eur(l.vCons + l.vDev)}</td></tr>`).join('')}</tbody></table>` : '<p class="mst2-an-nota">Nenhum.</p>'}</section>
  </div>`;
}
/* a hierarquia: Família → Subfamília → Artigo, com os totais dos descendentes (cada artigo conta uma vez) */
function hierarquia(e: Est, ls: Linha[]): string {
  const fams = new Map<string, Map<string, Linha[]>>();
  ls.forEach((l) => { const f = fams.get(l.fam) ?? new Map<string, Linha[]>(); f.set(l.sub, [...(f.get(l.sub) ?? []), l]); fams.set(l.fam, f); });
  const qtd = (xs: Linha[]) => new Set(xs.map((x) => x.a.un)).size === 1 ? `${nf(soma(xs, 'exist'))} ${esc(xs[0].a.un)}` : '<span class="is-nada" title="Unidades diferentes: não se somam">unid. mistas</span>';
  const crit = (xs: Linha[]) => { const n = xs.filter((x) => x.nominal < 0).length; return n ? `<span class="mst2-crit" title="Artigos com stock nominal negativo">${L(alerta)}${n}</span>` : ''; };
  const no = (k: string, nivel: number, nome: string, xs: Linha[], filhos: string, ic: string) => {
    const aberto = e.abertos.includes(k) || !!e.q.trim();
    return `<li role="treeitem" aria-level="${nivel}" aria-expanded="${aberto}" data-mst2-no="${esc(k)}" tabindex="-1"><div class="mst2-no" style="--n:${nivel}"><button type="button" class="mst2-no-ab" data-mst2-abrir="${esc(k)}" aria-label="${aberto ? 'Recolher' : 'Expandir'} ${esc(nome)}">${L(chevR)}</button>${L(ic)}<b>${esc(nome)}</b><small>${pl(xs.length, 'artigo', 'artigos')}</small>${crit(xs)}<span class="mst2-no-q">${qtd(xs)}</span><span class="mst2-no-v">${eur(soma(xs, 'valor'))}</span></div>${aberto ? `<ul role="group">${filhos}</ul>` : ''}</li>`;
  };
  const arv = [...fams].sort((a, b) => a[0].localeCompare(b[0], 'pt')).map(([f, subs]) => {
    const xsF = [...subs.values()].flat();
    const filhosF = [...subs].sort((a, b) => a[0].localeCompare(b[0], 'pt')).map(([s, xs]) => no(`${f}|${s}`, 2, s || 'Sem subfamília', xs, xs.map((l) => `<li role="treeitem" aria-level="3" data-mst2-no="${esc(`${f}|${s}|${l.a.ref}`)}" data-mst2-art="${esc(l.a.ref)}" tabindex="-1" aria-selected="${l.a.ref === e.sel}" class="${l.a.ref === e.sel ? 'is-ativo' : ''}"><div class="mst2-no is-art" style="--n:3"><span class="mst2-no-ab" aria-hidden="true"></span>${L(pkg)}<b class="is-mono">${esc(l.a.ref)}</b><small>${esc(l.a.desc)}</small>${l.nominal < 0 ? `<span class="mst2-crit">${L(alerta)}${nf(l.nominal)}</span>` : ''}<span class="mst2-no-q">${q0(l.exist)} ${esc(l.a.un)}</span><span class="mst2-no-v">${e0(l.valor)}</span></div></li>`).join(''), folder)).join('');
    return no(f, 1, f || 'Sem família', xsF, filhosF, folderTree);
  }).join('');
  return `<div class="mst2-arv-cab"><span>Família › Subfamília › Artigo</span><span>Existências</span><span>Valor (${esc(VALZ.find((x) => x.k === e.valz)!.col)})</span></div><ul class="mst2-arv" role="tree" aria-label="Hierarquia dos artigos">${arv}</ul>
    <p class="mst2-arv-pe"><button type="button" class="ak-btn ak-btn--linha" data-mst2-acao="abrir-tudo">Expandir tudo</button><button type="button" class="ak-btn ak-btn--linha" data-mst2-acao="fechar-tudo">Recolher tudo</button></p>`;
}
function migalhas(r: HTMLElement, e: Est): void {
  const m = r.querySelector<HTMLElement>('[data-mst2-migalhas]')!; m.hidden = e.vista !== 'hierarquia';
  if (m.hidden) return;
  const a = ARTIGOS.find((x) => x.ref === e.sel), f = e.fam || (a ? familiaDe(a.desc) : ''), s = e.sub || (a ? subfamiliaDe(a.desc) : '');
  const it: [string, string][] = [['Stocks', 'raiz']]; if (f) it.push([f, `fam|${f}`]); if (s && f) it.push([s, `sub|${f}|${s}`]); if (a) it.push([a.ref, `art|${a.ref}`]);
  m.innerHTML = it.map(([t, k], i) => i === it.length - 1 ? `<span aria-current="location">${esc(t)}</span>` : `<button type="button" data-mst2-migalha="${esc(k)}">${esc(t)}</button>${L(chevR)}`).join('');
}
function tudo(r: HTMLElement, e: Est, revelar = false): void {
  const ls = linhas(e), g = r.querySelector<HTMLElement>('[data-mst2-g]')!;
  r.querySelectorAll<HTMLElement>('[data-mst2-modo]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.mst2Modo === e.modo)));
  r.querySelectorAll<HTMLElement>('[data-mst2-comp]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.mst2Comp === e.comp)));
  r.querySelectorAll<HTMLElement>('[data-mst2-valz]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.mst2Valz === e.valz)));
  r.querySelectorAll<HTMLElement>('[data-mst2-vista]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mst2Vista === e.vista)));
  const q = r.querySelector<HTMLInputElement>('[data-mst2-q]')!; if (q.value !== e.q && document.activeElement !== q) q.value = e.q; q.placeholder = MODOS.find((m) => m.k === e.modo)!.ph;
  const sub = r.querySelector<HTMLSelectElement>('[data-mst2-f="sub"]')!; if (sub.dataset.fam !== e.fam || !sub.options.length) { sub.innerHTML = op('', 'Todas') + subsDe(e.fam).map((s) => op(s, s)).join(''); sub.dataset.fam = e.fam; }
  (['armazem', 'fam', 'sub', 'cAuto', 'cInd'] as const).forEach((k) => { const s = r.querySelector<HTMLSelectElement>(`[data-mst2-f="${k}"]`)!; s.value = e[k]; s.closest('.ak-campo')?.classList.toggle('is-ativo', !!e[k]); });
  (['soCom', 'soNeg', 'soEnc'] as const).forEach((k) => { r.querySelector<HTMLInputElement>(`[data-mst2-so="${k}"]`)!.checked = e[k]; });
  r.querySelector<HTMLElement>('[data-mst2-mais]')!.hidden = !e.mais;
  const nMais = [e.sub, e.cAuto, e.cInd, e.soCom, e.soNeg, e.soEnc].filter(Boolean).length, mb = r.querySelector<HTMLElement>('[data-mst2-acao="mais"]')!;
  mb.setAttribute('aria-expanded', String(e.mais)); mb.querySelector('span')!.textContent = nMais ? `Mais filtros (${nMais})` : 'Mais filtros';
  /* os filtros aplicados */
  const chips: [string, string][] = [];
  if (e.q.trim()) chips.push(['q', `${MODOS.find((m) => m.k === e.modo)!.t} ${({ inicio: 'começa por', contem: 'contém', igual: 'igual a' })[e.comp]} «${e.q.trim()}»`]);
  if (e.armazem) chips.push(['armazem', `Armazém ${curto(ARMAZENS.find((a) => a.cod === e.armazem)!.nome)}`]);
  if (e.fam) chips.push(['fam', e.fam]); if (e.sub) chips.push(['sub', e.sub]);
  if (e.cAuto) chips.push(['cAuto', `Classe ${e.cAuto}`]); if (e.cInd) chips.push(['cInd', `Classe ${e.cInd}`]);
  if (e.soCom) chips.push(['soCom', 'Com existências']); if (e.soNeg) chips.push(['soNeg', 'Nominal negativo']); if (e.soEnc) chips.push(['soEnc', 'Com encomendas pendentes']);
  const ch = r.querySelector<HTMLElement>('[data-mst2-chips]')!; ch.hidden = !chips.length;
  ch.innerHTML = chips.map(([k, t]) => `<li><button type="button" data-mst2-tirar="${k}" title="Tirar este filtro">${esc(t)}${L(xIc)}</button></li>`).join('');
  r.querySelector<HTMLElement>('[data-mst2-acao="limpar"]')!.setAttribute('aria-disabled', String(!chips.length));
  const cc = r.querySelector<HTMLElement>('[data-mst2-cols-c]')!; cc.hidden = e.vista !== 'tabela';
  r.querySelector<HTMLElement>('[data-mst2-cols]')!.hidden = !e.colsAberto; r.querySelector('[data-mst2-acao="colunas"]')!.setAttribute('aria-expanded', String(e.colsAberto));
  r.querySelectorAll<HTMLInputElement>('[data-mst2-grupo]').forEach((x) => { x.checked = e.grupos.includes(x.dataset.mst2Grupo as Grupo); });
  r.querySelector<HTMLElement>('[data-mst2-hora]')!.innerHTML = `${L(history)}Atualizado às <b>${e.hora.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</b> de ${dia(HOJE)}`;
  kpis(r, e, ls);
  const v = VALZ.find((x) => x.k === e.valz)!;
  r.querySelector<HTMLElement>('[data-mst2-t]')!.textContent = { tabela: 'Artigos', cartoes: 'Artigos', analise: 'Análise', hierarquia: 'Hierarquia' }[e.vista];
  r.querySelector<HTMLElement>('[data-mst2-resumo]')!.innerHTML = `<span><b>${nf(ls.length)}</b> ${ls.length === 1 ? 'artigo' : 'artigos'}</span><span>${e.armazem ? esc(curto(ARMAZENS.find((a) => a.cod === e.armazem)!.nome)) : 'Todos os armazéns'}</span><span>Valorização: <b>${v.t}</b></span>`;
  migalhas(r, e);
  g.dataset.vista = e.vista; g.classList.toggle('is-a-atualizar', e.fase === 'atualizar');
  if (e.fase === 'carregar') g.innerHTML = `<div class="minv2-a-gerar" role="status">${L(loader)}<p><b>A ler os stocks…</b>Os filtros já servem.</p></div><div class="minv2-esq" aria-hidden="true">${'<i></i>'.repeat(6)}</div>`;
  else if (e.fase === 'erro') { const tentar = `<button type="button" class="ak-btn ak-btn--acao" data-mst2-acao="atualizar">${L(refresh)}<span>Tentar outra vez</span></button>`; g.innerHTML = e.erro === 'offline' ? vazio(wifiOff, 'Sem ligação à rede.', 'Os filtros ficam. Quando a ligação voltar, atualiza (F9).', tentar) : e.erro === 'sessao' ? vazio(logIn, 'A sessão terminou.', 'Volta a entrar para continuar; os filtros ficam neste ecrã.', `<button type="button" class="ak-btn ak-btn--acao" data-login>${L(logIn)}<span>Voltar a entrar</span></button>`) : vazio(circleAlert, 'O servidor dos stocks não respondeu.', 'Os filtros ficam; tenta outra vez.', tentar); }
  else if (!ls.length) g.innerHTML = vazio(searchX, 'Nenhum artigo com estes filtros.', e.q ? `Nada ${e.comp === 'inicio' ? 'começa por' : e.comp === 'igual' ? 'é exatamente' : 'contém'} «${esc(e.q)}» na ${MODOS.find((m) => m.k === e.modo)!.t.toLowerCase()}.` : 'Tira um filtro.', `<button type="button" class="ak-btn" data-mst2-acao="limpar">${L(funnelX)}<span>Limpar filtros</span></button>`);
  else g.innerHTML = e.vista === 'cartoes' ? cartoes(e, ls) : e.vista === 'analise' ? analise(e, ls) : e.vista === 'hierarquia' ? hierarquia(e, ls) : tabela(e, ls);
  janela(r, e);
  r.querySelector<HTMLElement>('[data-mst2-estado]')!.innerHTML = `<span>Visualização <b>por ${MODOS.find((m) => m.k === e.modo)!.t.toLowerCase()}</b></span><span>Valorização <b>${v.t}</b></span><span>Vista ${({ tabela: 'tabela', cartoes: 'cartões', analise: 'análise', hierarquia: 'hierarquia' })[e.vista]}</span>${e.fase === 'atualizar' || e.fase === 'carregar' ? `<span class="ak-estado-f">${L(loader)}A atualizar…</span>` : e.fase === 'erro' ? '<span class="ak-estado-f is-erro">Sem dados</span>' : '<span class="ak-estado-f is-ok">Pronto</span>'}${e.aviso ? `<span class="ak-estado-aviso">${esc(e.aviso)}</span>` : ''}`;
  const ip = r.querySelector<HTMLElement>('[data-mst2-impressao]'); if (ip) ip.innerHTML = `<h1>Mapa de stocks</h1><p>Valorização: ${v.t} · ${chips.map((c) => c[1]).join(' · ') || 'sem filtros'} · impresso a ${new Date().toLocaleString('pt-PT')}</p>`;
  if (revelar && !quieto()) g.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: 'cubic-bezier(.22, 1, .36, 1)' });
}

/* ---------- o detalhe do artigo e as relações (numa janela, como no resto do ERP) ---------- */
function janela(r: HTMLElement, e: Est): void {
  const c = r.querySelector<HTMLElement>('[data-mst2-janela]')!;
  const l = e.jan ? todas(e).find((x) => x.a.ref === e.sel) : undefined; if (!l) { c.innerHTML = ''; return; }
  const a = l.a, v = VALZ.find((x) => x.k === e.valz)!, fo = fornecedor(a.forn), encs = encFornDe(a.ref);
  const arms = ARMAZENS.map((x) => [x, stockEm(a.ref, x.nome)] as const), max = Math.max(1, ...arms.map(([, q]) => q));
  const w = Math.min(460, innerWidth - 24), y = Math.round(Math.max(0, r.querySelector('.mst2-barra')?.getBoundingClientRect().bottom ?? 88) + 8), x = Math.max(12, innerWidth - w - 24);
  const foco = c.contains(document.activeElement);
  let corpo: string;
  if (e.rel) {
    const vs = vendas().filter((x) => x.ref === a.ref), clis = [...vs.reduce((m, x) => m.set(x.cli, (m.get(x.cli) ?? 0) + x.valor), new Map<string, number>())].sort((p, q) => q[1] - p[1]);
    const movs = todosMovimentos().filter((m) => m.ref === a.ref);
    const nos: [string, string, string, string][] = [['fam', 'Família', l.fam, folderTree], ['sub', 'Subfamília', l.sub, folder], ['forn', 'Fornecedor', fo ? `${fo.nome} · ${a.refForn}` : '—', truck], ...arms.filter(([, q]) => q).map(([x, q]) => ['arm', 'Armazém', `${curto(x.nome)} · ${nf(q)} ${a.un}`, warehouse] as [string, string, string, string]), ...encs.map((x) => ['enc', 'Encomenda a fornecedor', `${x.enc} · ${nf(x.qtd)} por receber`, truck] as [string, string, string, string]), ...clis.slice(0, 4).map(([k, val]) => ['cli', 'Cliente', `${cliente(k)?.nome ?? k} · ${eur(val)}`, users] as [string, string, string, string]), ['mov', 'Movimentos', `${pl(movs.length, 'movimento', 'movimentos')}`, history]];
    const W = 420, H = 300, cx = W / 2, cy = H / 2, R = 118;
    const pos = nos.map((_, i) => { const t = (i / nos.length) * Math.PI * 2 - Math.PI / 2; return [cx + Math.cos(t) * R, cy + Math.sin(t) * R]; });
    corpo = `<p class="minv2-jan-nota">As relações diretas que existem no modelo de dados. Não há artigos substitutos nem compostos registados.</p>
      <svg class="mst2-rede" viewBox="0 0 ${W} ${H}" role="img" aria-label="Relações de ${esc(a.ref)}">${pos.map(([px, py], i) => `<line class="mst2-rede-l is-${nos[i][0]}" x1="${cx}" y1="${cy}" x2="${px.toFixed(1)}" y2="${py.toFixed(1)}"></line>`).join('')}
        <circle class="mst2-rede-c" cx="${cx}" cy="${cy}" r="30"></circle><text class="mst2-rede-ct" x="${cx}" y="${cy + 4}">${esc(a.ref.length > 9 ? a.ref.slice(0, 8) + '…' : a.ref)}</text>
        ${pos.map(([px, py], i) => `<circle class="mst2-rede-n is-${nos[i][0]}" cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="7"><title>${esc(`${nos[i][1]}: ${nos[i][2]}`)}</title></circle><text class="mst2-rede-t" x="${(px + (px < cx ? -11 : 11)).toFixed(1)}" y="${(py + 4).toFixed(1)}" text-anchor="${px < cx - 4 ? 'end' : px > cx + 4 ? 'start' : 'middle'}">${esc(nos[i][1])}</text>`).join('')}</svg>
      <ul class="mst2-rel">${nos.map(([k, t, d, ic]) => `<li class="is-${k}">${L(ic)}<span>${esc(t)}</span><b>${esc(d)}</b></li>`).join('')}${clis.length > 4 ? `<li class="is-cli">${L(users)}<span>Clientes</span><b>e mais ${nf(clis.length - 4)}</b></li>` : ''}</ul>
      <p class="mva2-jan-acoes"><button type="button" class="ak-btn" data-mst2-acao="voltar-det">${L(eye)}<span>Voltar ao detalhe</span></button></p>`;
  } else {
    const movs = todosMovimentos().filter((m) => m.ref === a.ref && m.cod !== 'SI').slice(-4).reverse();
    corpo = `<div class="minv2-jan-id"><p class="minv2-jan-desc">${esc(a.desc)}</p><p class="minv2-fam">${esc(a.marca)} · ${esc(l.fam)} › ${esc(l.sub)}${fo && fo.nome !== a.marca ? ` · fornecedor ${esc(fo.nome)}` : ''}</p></div>
      <dl class="minv2-nums minv2-jan-nums"><div><dt>Existências</dt><dd>${nf(l.exist)} <small>${esc(a.un)}</small></dd></div><div><dt>${v.t}</dt><dd>${eur(l.preco)}</dd></div><div class="is-valor"><dt>Valor</dt><dd>${eur(l.valor)}</dd></div></dl>
      <h4 class="minv2-jan-t">${L(scale)}Stock nominal</h4>
      <p class="mst2-conta">${nf(l.exist)} existências − ${nf(l.encCli)} enc. clientes + ${nf(l.encFor)} enc. fornecedores = <b class="${l.nominal < 0 ? 'mst2-neg' : ''}">${nf(l.nominal)} ${esc(a.un)}</b></p>
      ${encs.length ? `<ul class="minv2-movs">${encs.map((x) => `<li><span class="minv2-mov-d">${esc(x.enc)}</span><span class="minv2-mov-t">Encomenda a fornecedor<small>entrega prevista ${dia(x.entrega)}</small></span><b class="is-ent">+${nf(x.qtd)}</b></li>`).join('')}</ul>` : ''}
      <h4 class="minv2-jan-t">${L(warehouse)}Por armazém</h4>
      <ul class="minv2-arms">${arms.map(([z, q]) => `<li class="${q ? '' : 'is-zero'}${e.armazem === z.cod ? ' is-escolhido' : ''}"><span>${esc(curto(z.nome))}</span><i style="--p:${(q / max) * 100}%" aria-hidden="true"></i><b>${nf(q)}</b><small>${q ? eur(q * l.preco) : '—'}</small></li>`).join('')}</ul>
      <h4 class="minv2-jan-t">${L(pkg)}Stock especial <small>(de exemplo)</small></h4>
      <dl class="minv2-nums"><div><dt>Consignado</dt><dd>${q0(l.cons)}</dd></div><div><dt>Devolvido</dt><dd>${q0(l.dev)}</dd></div><div class="is-valor"><dt>Valor</dt><dd>${e0(l.vCons + l.vDev)}</dd></div></dl>
      <h4 class="minv2-jan-t">${L(history)}Últimos movimentos</h4>
      ${movs.length ? `<ul class="minv2-movs">${movs.map((m) => `<li><span class="minv2-mov-d">${dia(m.data)}</span><span class="minv2-mov-t">${esc(designacao(m))}<small>${esc(m.docCompleto === '—' ? '' : m.docCompleto)}</small></span><b class="${m.qtd > 0 ? 'is-ent' : ''}">${m.qtd > 0 ? '+' : m.qtd < 0 ? '−' : ''}${m.qtd ? nf(Math.abs(m.qtd)) : 'valor'}</b></li>`).join('')}</ul>` : '<p class="minv2-jan-nada">Só o stock de partida.</p>'}
      <p class="minv2-jan-nota">Os movimentos todos e o extrato estão no 77 · Movimentos de artigos.</p>
      <p class="mva2-jan-acoes"><button type="button" class="ak-btn" data-mst2-acao="relacoes">${L(network)}<span>Ver relações</span></button></p>`;
  }
  c.innerHTML = `<section data-por-cima class="lf2-jan minv2-jan" data-mst2-jan role="dialog" aria-label="Artigo ${esc(a.ref)}" tabindex="-1" style="left:${x}px;top:${y}px;width:${w}px;max-height:min(660px, calc(100vh - ${y + 12}px))">
    <header class="lf2-jan-cab">${L(e.rel ? network : boxes)}<h3>${e.rel ? 'Relações' : 'Artigo'} · <b>${esc(a.ref)}</b></h3><span class="lf2-jan-bts"><button type="button" data-mst2-acao="fechar-jan" data-lf2-jan-acao="fechar" aria-label="Fechar (Esc)" title="Fechar (Esc)">${L(xIc)}</button></span></header>
    <div class="lf2-jan-corpo">${corpo}</div></section>`;
  if (foco) c.querySelector<HTMLElement>('[data-mst2-jan]')?.focus({ preventScroll: true });
}
function escolher(r: HTMLElement, e: Est, ref: string, abrir: boolean): void {
  e.sel = ref; if (abrir) { e.jan = true; e.rel = false; }
  r.querySelectorAll<HTMLElement>('[data-mst2-g] [data-mst2-art]').forEach((x) => { const s = x.dataset.mst2Art === ref; x.classList.toggle('is-ativo', s); if (x.matches('tr, article, li[role="treeitem"]')) { x.tabIndex = s ? 0 : -1; x.setAttribute('aria-selected', String(s)); } });
  janela(r, e); migalhas(r, e);
  const el = r.querySelector<HTMLElement>(`[data-mst2-g] [data-mst2-art="${CSS.escape(ref)}"]`); el?.focus({ preventScroll: true }); el?.scrollIntoView({ block: 'nearest' });
}
function atualizar(r: HTMLElement, e: Est): void {
  e.fase = 'atualizar'; tudo(r, e);
  window.setTimeout(() => { e.fase = 'ok'; e.erro = undefined; e.hora = new Date(); e.aviso = `Atualizado às ${e.hora.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}.`; tudo(r, e); toast(r, e.aviso); }, quieto() ? 100 : 500);
}
function exportar(r: HTMLElement, e: Est): void {
  const ls = linhas(e); if (!ls.length) { toast(r, 'Não há artigos para exportar.'); return; }
  const v = VALZ.find((x) => x.k === e.valz)!;
  const ts = ['Artigo', 'Descrição', 'Família', 'Subfamília', 'Existências', 'Qt. enc. cli.', 'Qt. enc. for.', 'Stock nominal', v.col, 'Valor', 'Stk. consignado', 'Valor consignado', 'Stk. devolvido', 'Valor devolvido'];
  const rows: Celula[][] = ls.map((l) => [l.a.ref, l.a.desc, l.fam, l.sub, l.exist, l.encCli, l.encFor, l.nominal, { euros: l.preco }, { euros: l.valor }, l.cons, { euros: l.vCons }, l.dev, { euros: l.vDev }]);
  rows.push([`Total · ${ls.length}`, null, null, null, soma(ls, 'exist'), soma(ls, 'encCli'), soma(ls, 'encFor'), soma(ls, 'nominal'), null, { euros: soma(ls, 'valor') }, soma(ls, 'cons'), { euros: soma(ls, 'vCons') }, soma(ls, 'dev'), { euros: soma(ls, 'vDev') }]);
  const nome = `Mapa-de-stocks-${e.valz}${e.armazem ? `-armazem-${e.armazem}` : ''}.xlsx`;
  try { descarregar(xlsx({ nome: 'Stocks', colunas: ts, linhas: rows, larguras: ts.map((t) => Math.max(10, t.length + 4)) }), nome); e.aviso = `Exportado: ${nome} · ${pl(ls.length, 'artigo', 'artigos')}.`; }
  catch { e.aviso = 'A exportação falhou; tenta outra vez.'; }
  tudo(r, e); toast(r, e.aviso);
}
const limpar = (e: Est) => Object.assign(e, { q: '', armazem: '', cAuto: '', cInd: '', fam: '', sub: '', soCom: false, soNeg: false, soEnc: false });
const chaves = (ls: Linha[]) => [...new Set(ls.flatMap((l) => [l.fam, `${l.fam}|${l.sub}`]))];

/* ---------- os cenários ---------- */
function armar(r: HTMLElement): void {
  if (estados.has(r)) return;
  const e = de(r), cen = r.dataset.mst2Cenario ?? 'inicial';
  if (e.editor) Object.assign(e, { vista: 'tabela', valz: 'medio', modo: 'artigo', grupos: TODOS_GRUPOS.slice() });
  if (cen === 'descricao') e.modo = 'descricao';
  if (cen === 'familia') e.modo = 'familia';
  if (cen === 'pesquisa') e.q = '62';
  if (cen === 'contendo') { e.modo = 'descricao'; e.comp = 'contem'; e.q = 'travão'; }
  if (cen === 'igual') { e.comp = 'igual'; e.q = 'BKR6E'; }
  if (cen === 'sem-resultados') e.q = 'XPTO';
  if (cen === 'ultimo') e.valz = 'ultimo';
  if (cen === 'tabela') e.valz = 'tabela';
  if (cen === 'armazem') e.armazem = '1';
  if (cen === 'classe-ind') { e.cInd = 'I1'; e.mais = true; }
  if (cen === 'subfamilia') { e.fam = 'Rolamentos'; e.sub = 'Rígidos de esferas'; e.mais = true; }
  if (cen === 'so-com') { e.soCom = true; e.armazem = '60'; }
  if (cen === 'negativo') e.soNeg = true;
  if (cen === 'encomendas') { e.soEnc = true; e.mais = true; }
  if (cen === 'ordenado') e.ordem = { k: 'valor', dir: -1 };
  if (cen === 'colunas') { e.colsAberto = true; e.grupos = ['stock', 'valz']; }
  if (cen === 'cartoes') e.vista = 'cartoes';
  if (cen === 'analise') e.vista = 'analise';
  if (cen.startsWith('hierarquia')) { e.vista = 'hierarquia'; e.abertos = ['Travagem', 'Travagem|Pastilhas']; }
  if (cen === 'hierarquia-artigo') { e.sel = 'GDB2042'; e.jan = true; }
  if (cen === 'detalhe') { e.sel = 'GDB2042'; e.jan = true; }
  if (cen === 'relacoes') { e.sel = '6206-2RSH'; e.jan = true; e.rel = true; }
  if (cen === 'a-carregar') e.fase = 'carregar';
  if (cen === 'a-atualizar') e.fase = 'atualizar';
  if (['servidor', 'offline', 'sessao'].includes(cen)) { e.fase = 'erro'; e.erro = cen as Est['erro']; }
  if (cen === 'exportado') e.aviso = 'Exportado: Mapa-de-stocks-medio.xlsx · 20 artigos.';
  tudo(r, e);
  if (!e.editor && r.closest('.ecra:not([hidden]) > .versao:not([hidden])') && !quieto()) r.classList.add('lf2-entra');
}
const armarTodos = () => document.querySelectorAll<HTMLElement>('[data-mst2]').forEach(armar);
let espera = 0;
export function iniciar(): void {
  requestAnimationFrame(armarTodos);
  ['romafe:versao', 'romafe:ecra'].forEach((y) => document.addEventListener(y, () => requestAnimationFrame(armarTodos)));
  document.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement, r = raiz(t); if (!r || editando()) return; const e = de(r); let b: HTMLElement | null;
    if ((b = t.closest('[data-mst2-acao][aria-disabled="true"]'))) { toast(r, b.title || 'Não há filtros.'); return; }
    if ((b = t.closest('[data-mst2-modo]'))) { e.modo = b.dataset.mst2Modo as Modo; guardar(e); tudo(r, e); r.querySelector<HTMLElement>('[data-mst2-q]')?.focus(); return; }
    if ((b = t.closest('[data-mst2-comp]'))) { e.comp = b.dataset.mst2Comp as Comp; tudo(r, e); r.querySelector<HTMLElement>('[data-mst2-q]')?.focus(); return; }
    if ((b = t.closest('[data-mst2-valz]'))) { e.valz = b.dataset.mst2Valz as Valz; guardar(e); tudo(r, e); toast(r, `Valorização: ${VALZ.find((v) => v.k === e.valz)!.t}.`); return; }
    if ((b = t.closest('[data-mst2-vista]'))) { e.vista = b.dataset.mst2Vista as Vista; guardar(e); tudo(r, e, true); if (e.sel) r.querySelector<HTMLElement>(`[data-mst2-g] [data-mst2-art="${CSS.escape(e.sel)}"]`)?.focus({ preventScroll: true }); return; }
    if ((b = t.closest('[data-mst2-tirar]'))) { const k = b.dataset.mst2Tirar!; (e as unknown as Record<string, unknown>)[k] = typeof (e as unknown as Record<string, unknown>)[k] === 'boolean' ? false : ''; if (k === 'fam') e.sub = ''; tudo(r, e); return; }
    if ((b = t.closest('[data-mst2-neg]'))) { e.soNeg = !e.soNeg; tudo(r, e); r.querySelector<HTMLElement>('[data-mst2-neg]')?.focus(); return; }
    if ((b = t.closest('[data-mst2-ordenar]'))) { const k = b.dataset.mst2Ordenar!; e.ordem = e.ordem?.k === k ? (e.ordem.dir === 1 ? { k, dir: -1 } : null) : { k, dir: 1 }; tudo(r, e); r.querySelector<HTMLElement>(`[data-mst2-ordenar="${k}"]`)?.focus(); return; }
    if ((b = t.closest('[data-mst2-abrir]'))) { const k = b.dataset.mst2Abrir!; e.abertos = e.abertos.includes(k) ? e.abertos.filter((x) => x !== k) : [...e.abertos, k]; tudo(r, e); r.querySelector<HTMLElement>(`[data-mst2-abrir="${CSS.escape(k)}"]`)?.focus(); return; }
    if ((b = t.closest('[data-mst2-migalha]'))) { const [tp, ...xs] = b.dataset.mst2Migalha!.split('|'); e.sel = ''; e.jan = false; if (tp === 'raiz') e.abertos = []; else if (tp === 'fam') e.abertos = [xs[0]]; else if (tp === 'sub') e.abertos = [xs[0], `${xs[0]}|${xs[1]}`]; tudo(r, e); return; }
    if ((b = t.closest('[data-mst2-ver]'))) { escolher(r, e, b.dataset.mst2Ver!, true); r.querySelector<HTMLElement>('[data-mst2-jan]')?.focus(); return; }
    if ((b = t.closest('[data-mst2-acao]'))) {
      const k = b.dataset.mst2Acao!;
      if (k === 'atualizar') atualizar(r, e);
      else if (k === 'imprimir') window.print();
      else if (k === 'excel') exportar(r, e);
      else if (k === 'limpar') { limpar(e); tudo(r, e); toast(r, 'Filtros limpos.'); }
      else if (k === 'mais') { e.mais = !e.mais; tudo(r, e); }
      else if (k === 'colunas') { e.colsAberto = !e.colsAberto; tudo(r, e); }
      else if (k === 'fechar-jan') { e.jan = false; e.rel = false; tudo(r, e); r.querySelector<HTMLElement>(`[data-mst2-g] [data-mst2-art="${CSS.escape(e.sel)}"]`)?.focus(); }
      else if (k === 'relacoes') { e.rel = true; janela(r, e); r.querySelector<HTMLElement>('[data-mst2-jan]')?.focus(); }
      else if (k === 'voltar-det') { e.rel = false; janela(r, e); r.querySelector<HTMLElement>('[data-mst2-jan]')?.focus(); }
      else if (k === 'abrir-tudo') { e.abertos = chaves(linhas(e)); tudo(r, e); }
      else if (k === 'fechar-tudo') { e.abertos = []; tudo(r, e); }
      return;
    }
    const it = t.closest<HTMLElement>('[data-mst2-g] [data-mst2-art]');
    if (it && !t.closest('button, a, input, select')) { if (it.matches('li[role="button"]')) { e.vista = 'tabela'; tudo(r, e); } escolher(r, e, it.dataset.mst2Art!, true); }
  });
  document.addEventListener('change', (ev) => {
    const t = ev.target as HTMLInputElement, r = raiz(t); if (!r || editando()) return; const e = de(r);
    if (t.matches('[data-mst2-f]')) { (e as unknown as Record<string, string>)[t.dataset.mst2F!] = t.value; if (t.dataset.mst2F === 'fam' && e.sub && !subsDe(e.fam).includes(e.sub)) e.sub = ''; tudo(r, e); r.querySelector<HTMLElement>(`[data-mst2-f="${t.dataset.mst2F}"]`)?.focus(); }
    if (t.matches('[data-mst2-so]')) { (e as unknown as Record<string, boolean>)[t.dataset.mst2So!] = t.checked; tudo(r, e); r.querySelector<HTMLElement>(`[data-mst2-so="${t.dataset.mst2So}"]`)?.focus(); }
    if (t.matches('[data-mst2-grupo]')) { const g = t.dataset.mst2Grupo as Grupo; e.grupos = t.checked ? [...e.grupos, g] : e.grupos.filter((x) => x !== g); guardar(e); tudo(r, e); r.querySelector<HTMLElement>(`[data-mst2-grupo="${g}"]`)?.focus(); }
  });
  document.addEventListener('input', (ev) => { const t = ev.target as HTMLInputElement, r = raiz(t); if (!r || !t.matches('[data-mst2-q]')) return; const e = de(r); clearTimeout(espera); espera = window.setTimeout(() => { e.q = t.value; tudo(r, e); }, 140); });
  document.addEventListener('submit', (ev) => { if (raiz(ev.target as HTMLElement)) ev.preventDefault(); });
  document.addEventListener('keydown', (ev) => {
    const t = ev.target as HTMLElement, r = raiz(t) ?? visivel(); if (!r || editando()) return; const e = de(r);
    const so = !ev.ctrlKey && !ev.altKey && !ev.metaKey;
    if (so && ev.shiftKey && ['F1', 'F2', 'F3'].includes(ev.key)) { ev.preventDefault(); r.querySelector<HTMLElement>(`[data-mst2-comp="${{ F1: 'inicio', F2: 'contem', F3: 'igual' }[ev.key]}"]`)?.click(); return; }
    if (so && !ev.shiftKey && ['F1', 'F2', 'F3'].includes(ev.key)) { ev.preventDefault(); r.querySelector<HTMLElement>(`[data-mst2-modo="${MODOS[Number(ev.key.slice(1)) - 1].k}"]`)?.click(); return; }
    if (so && !ev.shiftKey && ['F5', 'F6', 'F7'].includes(ev.key)) { ev.preventDefault(); r.querySelector<HTMLElement>(`[data-mst2-valz="${{ F5: 'medio', F6: 'ultimo', F7: 'tabela' }[ev.key]}"]`)?.click(); return; }
    if (so && !ev.shiftKey && (ev.key === 'F9' || ev.key === 'F11')) { ev.preventDefault(); if (ev.key === 'F9') atualizar(r, e); else window.print(); return; }
    if (ev.key === 'Escape') { if (e.jan) { e.jan = false; e.rel = false; tudo(r, e); r.querySelector<HTMLElement>(`[data-mst2-g] [data-mst2-art="${CSS.escape(e.sel)}"]`)?.focus(); ev.preventDefault(); return; } if (e.q) { e.q = ''; tudo(r, e); ev.preventDefault(); } return; }
    /* a árvore: ↑ ↓ andam; → abre (ou desce), ← fecha (ou sobe); Enter abre o artigo */
    const no = t.closest<HTMLElement>('[data-mst2-g] li[role="treeitem"]');
    if (no && so) {
      const vis = [...r.querySelectorAll<HTMLElement>('[data-mst2-g] li[role="treeitem"]')], i = vis.indexOf(no), k = no.dataset.mst2No!, art = no.dataset.mst2Art;
      const ir = (x?: HTMLElement) => { if (!x) return; vis.forEach((y) => { y.tabIndex = -1; }); x.tabIndex = 0; x.focus(); };
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); ev.stopImmediatePropagation(); ir(vis[i + (ev.key === 'ArrowDown' ? 1 : -1)]); return; }
      if (ev.key === 'ArrowRight' && !art) { ev.preventDefault(); if (!e.abertos.includes(k)) { e.abertos.push(k); tudo(r, e); r.querySelector<HTMLElement>(`[data-mst2-no="${CSS.escape(k)}"]`)?.focus(); } else ir(vis[i + 1]); return; }
      if (ev.key === 'ArrowLeft') { ev.preventDefault(); if (!art && e.abertos.includes(k)) { e.abertos = e.abertos.filter((x) => x !== k); tudo(r, e); r.querySelector<HTMLElement>(`[data-mst2-no="${CSS.escape(k)}"]`)?.focus(); } else { const pai = no.parentElement?.closest<HTMLElement>('li[role="treeitem"]'); ir(pai ?? undefined); } return; }
      if (ev.key === 'Enter') { ev.preventDefault(); if (art) escolher(r, e, art, true); else r.querySelector<HTMLElement>(`[data-mst2-abrir="${CSS.escape(k)}"]`)?.click(); return; }
    }
    const it = t.closest<HTMLElement>('[data-mst2-g] :is(tr, article)[data-mst2-art]') ?? (t.matches('[data-mst2-jan]') ? r.querySelector<HTMLElement>(`[data-mst2-g] :is(tr, article)[data-mst2-art="${CSS.escape(e.sel)}"]`) : null);
    if (it && so && ev.key === 'Enter') { ev.preventDefault(); escolher(r, e, it.dataset.mst2Art!, true); r.querySelector<HTMLElement>('[data-mst2-jan]')?.focus(); return; }
    if (it && so && ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(ev.key) && (e.vista === 'cartoes' || !/Left|Right/.test(ev.key))) {
      const els = [...r.querySelectorAll<HTMLElement>('[data-mst2-g] :is(tr, article)[data-mst2-art]')], i = els.indexOf(it);
      const cols = e.vista === 'cartoes' ? Math.max(1, Math.round((els[0].parentElement?.clientWidth ?? 1) / (els[0].offsetWidth + 12))) : 1;
      const j = ev.key === 'ArrowDown' ? i + cols : ev.key === 'ArrowUp' ? i - cols : ev.key === 'ArrowRight' ? i + 1 : ev.key === 'ArrowLeft' ? i - 1 : ev.key === 'Home' ? 0 : els.length - 1;
      const n = els[Math.max(0, Math.min(els.length - 1, j))]; if (n) { ev.preventDefault(); ev.stopImmediatePropagation(); escolher(r, e, n.dataset.mst2Art!, e.jan); }
    }
  });
}

/* ---------- os ecrãs ---------- */
const NOTA = 'Mapa de stocks v2 (19 nov., dos briefings «Redesign profissional do Mapa de Stocks» e «Vista Hierárquica e Relações»): Visualizar F1–F3 e Iniciado por / Contendo / Igual a (Shift+F1–F3), que o IDE leva para a barra de cima; valorização F5/F6/F7; filtros (armazém, família, e em Mais filtros subfamília, classes Auto e Indústria, só com existências, só nominal negativo, só com encomendas) aplicados à vista; 5 indicadores principais e o consignado e devolvido à parte; colunas por grupos; vistas Tabela, Cartões, Análise e Hierarquia (Família › Subfamília › Artigo, com o caminho); o detalhe do artigo numa janela com o cálculo do nominal, o stock por armazém, as encomendas a fornecedores e Ver relações; F9, F11, Excel.';
const ESTADOS: [string, string, string][] = [
  ['descricao', 'Por descrição (F2)', 'A lista pela descrição; a pesquisa procura na descrição.'],
  ['familia', 'Por família/subfamília (F3)', 'Uma faixa por família com o subtotal.'],
  ['pesquisa', 'Pesquisa iniciado por', '«62»: só as referências que começam assim.'],
  ['contendo', 'Pesquisa contendo (Shift+F2)', '«travão» na descrição, sem acentos a contar.'],
  ['igual', 'Exatamente igual a (Shift+F3)', 'Só a referência certa (BKR6E).'],
  ['sem-resultados', 'Sem artigos', 'Diz o que se procurou e como; Limpar filtros.'],
  ['ultimo', 'Valorização ao último preço (F6)', 'O preço, os valores, os indicadores e as outras vistas mudam juntos.'],
  ['tabela', 'Valorização ao preço de tabela (F7)', 'O preço de venda de tabela (não é o custo).'],
  ['armazem', 'Um armazém', 'As existências só do Armazém 1 · Porto.'],
  ['classe-ind', 'Classe de reposição', 'Mais filtros: só a classe I1 (Indústria).'],
  ['subfamilia', 'Família e subfamília', 'Rolamentos › Rígidos de esferas.'],
  ['so-com', 'Só com existências', 'No armazém 60, só os artigos que lá estão.'],
  ['negativo', 'Stock nominal negativo', 'Tocar no indicador do nominal: só os artigos abaixo de zero, com o porquê no título.'],
  ['encomendas', 'Com encomendas pendentes', 'Só os artigos com encomendas de clientes ou a fornecedores.'],
  ['ordenado', 'Ordenado pelo valor', 'Tocar no título de uma coluna ordena; outra vez inverte, a terceira tira.'],
  ['colunas', 'Colunas por grupos', 'Só Stock e Valorização; fica guardado.'],
  ['cartoes', 'Vista cartões', 'Um cartão por artigo: existências, encomendas, nominal, preço e valor, e o estado.'],
  ['analise', 'Vista análise', 'Valor por família, os de maior valor, o nominal negativo, as encomendas, os armazéns, o consignado e devolvido.'],
  ['hierarquia', 'Vista hierarquia', 'Família › Subfamília › Artigo, com os artigos, a quantidade, o valor e os críticos de cada nível.'],
  ['hierarquia-artigo', 'Hierarquia até ao artigo', 'Stocks › Travagem › Pastilhas › GDB2042: o caminho e o detalhe.'],
  ['detalhe', 'Detalhe do artigo', 'A janela: o cálculo do nominal (GDB2042: −8), por armazém, encomendas, stock especial, movimentos.'],
  ['relacoes', 'Ver relações', 'As relações que existem no modelo: família, subfamília, fornecedor, armazéns, encomendas, clientes, movimentos.'],
  ['a-carregar', 'A ler os stocks', 'A espera em esqueleto; os filtros já servem.'],
  ['a-atualizar', 'A atualizar (F9)', 'Os artigos ficam à vista, esbatidos, até chegar a resposta.'],
  ['exportado', 'Exportado para Excel', 'Os artigos com todas as colunas, os filtros e a valorização.'],
  ['servidor', 'Servidor indisponível', 'O servidor dos stocks não respondeu: Tentar outra vez.'],
  ['offline', 'Sem ligação', 'Sem rede: os filtros ficam.'],
  ['sessao', 'Sessão terminada', 'Voltar a entrar pelo login comum.'],
];
export type IdMapaStocks = 'stocks-mapa-stocks' | `mst-${string}`;
export function ecrasMapaStocks(): Ecra<IdErp>[] {
  const v = (cen: string) => ({ id: 'v2', nota: NOTA, html: html(cen) });
  return [
    { id: 'stocks-mapa-stocks', nome: '76 · Mapa de stocks', fluxo: 'Stocks', objetivo: 'As existências, encomendas, disponibilidade e valorização dos artigos, em tabela, cartões, análise ou hierarquia.', versoes: [v('inicial')] as Ecra<IdErp>['versoes'] },
    ...ESTADOS.map(([cen, nome, objetivo], i) => ({ id: `mst-${cen}` as IdErp, nome: `76.${i + 1} · ${nome}`, fluxo: 'Stocks', estadoDe: 'stocks-mapa-stocks' as IdErp, objetivo, versoes: [v(cen)] as Ecra<IdErp>['versoes'] })),
  ] as Ecra<IdErp>[];
}
