/* =========================================================
   ERP — Stocks ▸ Mapas ▸ 76 · Stocks (18 nov. 2026). Ela mostrou o «MAPAS» de stocks do ERP antigo: Visualizar p/
   Artigo (F1), p/ Descrição (F2), p/ Família/Subfamília (F3), Exportar para Excel (F5); Pesquisa Iniciado por /
   Contendo / Exactamente igual a (Shift+F1/F2/F3); Valorização Preço Médio (F5), Último Preço (F6), Preço Tabela (F7);
   os campos #Artigo, #Classe Reposição Auto, #Classe Reposição Industrial, #Família, #Subfamília; a faixa Somatórios e
   as colunas #Artigo, Existências, Qt. Enc. Cli., Qt. Enc. For., Stock Nominal, Pr. Médio, Valor, Stk. Consignado,
   Valor, Stk. Devolvido, Valor; F9 Refrescar, F11 Imprimir, Esc. No novo, com o desenho do 75 · Artigos/clientes:
     - lista todos os artigos logo ao abrir; a pesquisa filtra a lista no modo escolhido (referência, descrição, família);
     - por Família/Subfamília: uma faixa por família com os totais dela;
     - a valorização muda o preço e os três Valor (existências, consignado, devolvido); o Excel ficou sem tecla, porque
       no antigo o F5 servia as duas coisas;
     - o armazém (Todos ou um) decide as Existências; tocar num artigo abre o stock por armazém na própria linha;
     - Stock nominal = Existências − Qt. enc. cli. + Qt. enc. for. (o que fica livre quando tudo chegar e sair).
   Por confirmar no antigo (e por isso de exemplo, sem inventar regras): as classes de reposição (os quatro campos ao
   lado de cada uma no antigo não se mostram), o stock consignado e o devolvido, e as encomendas de clientes.
   As encomendas a fornecedores são as das Compras (em aberto); as existências são as dos Stocks (todos os armazéns).
   CSS: css/mapa-artigos-clientes.css (as mesmas faixas e somatórios) e css/mapa-stocks.css.
   ========================================================= */
import type { Ecra } from '../../../comum/tipos';
import type { IdErp } from '../ids';
import { topoErp } from '../inicio-v2';
import { L, esc } from '../espaco';
import { BTN } from '../compras/docs-v2';
import { ARTIGOS, euros, aCaminho, type Artigo } from '../compras/dominio';
import { xlsx, descarregar, type Celula } from '../compras/xlsx';
import { familiaDe } from '../ficheiros/ecras';
import { ARMAZENS, stockEm, custoDe } from './dominio';
import { precoVenda } from './vendas';
import { todosMovimentos } from './mapa-movimentos';
import boxes from 'lucide-static/icons/boxes.svg?raw';
import refresh from 'lucide-static/icons/refresh-cw.svg?raw';
import printer from 'lucide-static/icons/printer.svg?raw';
import sheet from 'lucide-static/icons/file-spreadsheet.svg?raw';
import search from 'lucide-static/icons/search.svg?raw';
import searchX from 'lucide-static/icons/search-x.svg?raw';
import hash from 'lucide-static/icons/hash.svg?raw';
import textIc from 'lucide-static/icons/text.svg?raw';
import folderTree from 'lucide-static/icons/folder-tree.svg?raw';
import arrowUp from 'lucide-static/icons/arrow-up.svg?raw';
import arrowDown from 'lucide-static/icons/arrow-down.svg?raw';
import funnelX from 'lucide-static/icons/funnel-x.svg?raw';
import loader from 'lucide-static/icons/loader.svg?raw';
import circleAlert from 'lucide-static/icons/circle-alert.svg?raw';
import wifiOff from 'lucide-static/icons/wifi-off.svg?raw';
import logIn from 'lucide-static/icons/log-in.svg?raw';
import undo from 'lucide-static/icons/undo-2.svg?raw';
import warehouse from 'lucide-static/icons/warehouse.svg?raw';

/* ---------- os dados de exemplo que o protótipo ainda não tinha ---------- */
export function subfamiliaDe(desc: string): string {
  const d = desc.toLowerCase();
  if (d.includes('esferas')) return 'Rígidos de esferas';
  if (d.includes('cónicos')) return 'Rolos cónicos';
  if (d.includes('roda')) return 'Kits de roda';
  if (d.includes('pastilhas')) return 'Pastilhas';
  if (d.includes('disco')) return 'Discos';
  if (d.includes('óleo')) return 'Filtros de óleo';
  if (d.includes('filtro de ar')) return 'Filtros de ar';
  if (d.includes('correia')) return 'Correias';
  if (d.includes('kit de distribuição')) return 'Kits de distribuição';
  return 'Geral';
}
interface Classe { cod: string; nome: string }
export const CLASSES_AUTO: Classe[] = [{ cod: 'A1', nome: 'Auto · alta rotação' }, { cod: 'A2', nome: 'Auto · rotação média' }, { cod: 'A3', nome: 'Auto · baixa rotação' }];
export const CLASSES_IND: Classe[] = [{ cod: 'I1', nome: 'Indústria · rotação contínua' }, { cod: 'I2', nome: 'Indústria · sob encomenda' }];
const n0 = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
/* os rolamentos e a massa são da Indústria; o resto é Auto (a zona 30) */
const ehInd = (a: Artigo) => a.marca === 'SKF';
export const classeAuto = (a: Artigo) => ehInd(a) ? '' : CLASSES_AUTO[n0(a.ref) % 3].cod;
export const classeInd = (a: Artigo) => ehInd(a) ? CLASSES_IND[n0(a.ref) % 2].cod : '';
export const encCli = (a: Artigo) => n0(a.ref + 'c') % 4 === 0 ? 0 : n0(a.ref + 'c') % 9;
export const consignado = (a: Artigo) => n0(a.ref + 's') % 3 === 0 ? (n0(a.ref + 's') % 6) + 1 : 0;
export const devolvido = (a: Artigo) => n0(a.ref + 'd') % 5 === 0 ? (n0(a.ref + 'd') % 3) + 1 : 0;

/* ---------- o estado ---------- */
type Modo = 'artigo' | 'descricao' | 'familia';
type Comp = 'inicio' | 'contem' | 'igual';
export type Valz = 'medio' | 'ultimo' | 'tabela';
type ColK = 'ref' | 'exist' | 'encCli' | 'encFor' | 'nominal' | 'preco' | 'valor' | 'cons' | 'vCons' | 'dev' | 'vDev';
interface Est {
  modo: Modo; comp: Comp; q: string; valz: Valz; armazem: string; cAuto: string; cInd: string; fam: string; sub: string; soCom: boolean;
  ordem: { k: ColK; dir: 1 | -1 } | null; aberto: string; fase: 'ok' | 'carregar' | 'erro'; erro?: 'servidor' | 'offline' | 'sessao'; aviso: string; hora: number; editor: boolean; fechadas: Set<string>;
}
const novo = (): Est => ({ modo: 'artigo', comp: 'inicio', q: '', valz: 'medio', armazem: '', cAuto: '', cInd: '', fam: '', sub: '', soCom: false, ordem: null, aberto: '', fase: 'ok', aviso: '', hora: 0, editor: document.body.classList.contains('editando'), fechadas: new Set() });
const estados = new WeakMap<HTMLElement, Est>();
const de = (r: HTMLElement) => { let e = estados.get(r); if (!e) { e = novo(); estados.set(r, e); } return e; };
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const editando = () => (document.body.classList.contains('editando') && !document.body.classList.contains('ed-interagir')) || document.body.classList.contains('com-fluxo');
const raiz = (t: Element | null) => t?.closest<HTMLElement>('[data-mst]') ?? null;
const visivel = () => document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) [data-mst]');
const nf = (n: number) => n.toLocaleString('pt-PT');
const CHAVE = 'erp:stocks:mapa-stocks';
const MODOS: { k: Modo; tecla: string; t: string; ic: string; ph: string }[] = [
  { k: 'artigo', tecla: 'F1', t: 'Artigo', ic: hash, ph: 'Referência, ex.: 6206' },
  { k: 'descricao', tecla: 'F2', t: 'Descrição', ic: textIc, ph: 'Descrição, ex.: pastilhas' },
  { k: 'familia', tecla: 'F3', t: 'Família/Subfamília', ic: folderTree, ph: 'Família ou subfamília, ex.: travagem' },
];
const VALZ: { k: Valz; tecla: string; t: string; col: string }[] = [
  { k: 'medio', tecla: 'F5', t: 'Preço médio', col: 'Pr. médio' }, { k: 'ultimo', tecla: 'F6', t: 'Último preço', col: 'Últ. preço' }, { k: 'tabela', tecla: 'F7', t: 'Preço de tabela', col: 'Pr. tabela' },
];

/* ---------- as linhas ---------- */
interface Linha { a: Artigo; fam: string; sub: string; exist: number; encCli: number; encFor: number; nominal: number; preco: number; valor: number; cons: number; vCons: number; dev: number; vDev: number }
/* 18 nov.: o preço médio é o ponderado dos movimentos (o mesmo do 77 e do 78), para os mapas darem o mesmo valor */
export const pmDe = (ref: string) => { const ms = todosMovimentos().filter((m) => m.ref === ref); return ms.length ? ms[ms.length - 1].pm : custoDe(ref); };
export const precoDe = (a: Artigo, v: Valz) => v === 'medio' ? pmDe(a.ref) : v === 'ultimo' ? a.preco ?? 0 : precoVenda(a.ref);
export const existDe = (a: Artigo, arm: string) => arm ? stockEm(a.ref, ARMAZENS.find((x) => x.cod === arm)!.nome) : ARMAZENS.reduce((t, x) => t + stockEm(a.ref, x.nome), 0);
function sem(s: string) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ''); }
function compara(c: Comp, v: string, q: string) { const a = sem(v), b = sem(q); return c === 'igual' ? a === b : c === 'contem' ? a.includes(b) : a.startsWith(b); }
function linhas(e: Est): Linha[] {
  let ls = ARTIGOS.map((a): Linha => {
    const exist = existDe(a, e.armazem), ec = encCli(a), ef = aCaminho(a.ref), p = precoDe(a, e.valz), cs = consignado(a), dv = devolvido(a);
    return { a, fam: familiaDe(a.desc), sub: subfamiliaDe(a.desc), exist, encCli: ec, encFor: ef, nominal: exist - ec + ef, preco: p, valor: exist * p, cons: cs, vCons: cs * p, dev: dv, vDev: dv * p };
  }).filter((l) => (!e.cAuto || classeAuto(l.a) === e.cAuto) && (!e.cInd || classeInd(l.a) === e.cInd) && (!e.fam || l.fam === e.fam) && (!e.sub || l.sub === e.sub) && (!e.soCom || l.exist > 0)
    && (!e.q.trim() || (e.modo === 'artigo' ? compara(e.comp, l.a.ref, e.q) : e.modo === 'descricao' ? compara(e.comp, l.a.desc, e.q) : compara(e.comp, l.fam, e.q) || compara(e.comp, l.sub, e.q))));
  const base = (x: Linha, y: Linha) => e.modo === 'descricao' ? x.a.desc.localeCompare(y.a.desc, 'pt') || x.a.ref.localeCompare(y.a.ref) : x.a.ref.localeCompare(y.a.ref, 'pt', { numeric: true });
  ls.sort(base);
  if (e.ordem) { const { k, dir } = e.ordem; ls = ls.slice().sort((x, y) => (k === 'ref' ? base(x, y) : (x[k] as number) - (y[k] as number)) * dir); }
  return ls;
}
interface Col { k: ColK; t: string; w: number; eur?: boolean; titulo?: string }
const cols = (e: Est): Col[] => [
  { k: 'ref', t: 'Artigo', w: 22 },
  { k: 'exist', t: 'Existências', w: 8.5, titulo: 'No armazém escolhido (ou em todos)' },
  { k: 'encCli', t: 'Qt. enc. cli.', w: 8, titulo: 'Encomendado por clientes, por entregar (de exemplo)' },
  { k: 'encFor', t: 'Qt. enc. for.', w: 8, titulo: 'Encomendado a fornecedores, por receber (as encomendas em aberto das Compras)' },
  { k: 'nominal', t: 'Stock nominal', w: 8.5, titulo: 'Existências − encomendado por clientes + encomendado a fornecedores' },
  { k: 'preco', t: VALZ.find((v) => v.k === e.valz)!.col, w: 7.5, eur: true },
  { k: 'valor', t: 'Valor', w: 9, eur: true, titulo: 'Existências × preço' },
  { k: 'cons', t: 'Stk. consignado', w: 7.5, titulo: 'De exemplo: por confirmar no ERP antigo' },
  { k: 'vCons', t: 'Valor', w: 7.5, eur: true },
  { k: 'dev', t: 'Stk. devolvido', w: 7, titulo: 'De exemplo: por confirmar no ERP antigo' },
  { k: 'vDev', t: 'Valor', w: 6.5, eur: true },
];
type NumK = Exclude<ColK, 'ref'>;
const soma = (ls: Linha[], k: ColK) => ls.reduce((t, l) => t + (l[k as NumK] as number), 0);
const num = (n: number) => n === 0 ? '<span class="is-nada">0</span>' : `<span class="${n < 0 ? 'mac-neg' : ''}">${n < 0 ? '−' : ''}${nf(Math.abs(n))}</span>`;
const eur = (c: number) => c === 0 ? '<span class="is-nada">0,00 €</span>' : euros(c);

/* ---------- a página ---------- */
function html(cen: string): string {
  const id = (x: string) => `mst-${x}-${cen}`;
  const op = (v: string, t: string) => `<option value="${esc(v)}">${esc(t)}</option>`;
  const fams = [...new Set(ARTIGOS.map((a) => familiaDe(a.desc)))].sort((a, b) => a.localeCompare(b, 'pt'));
  const B = (k: string, ic: string, t: string, tecla: string) => BTN(k, ic, t, tecla).replace('data-dv2-acao', 'data-mst-acao');
  return `<div class="hm ak lf2 dv2 mac mst" data-hm data-mst data-mst-cenario="${cen}" data-teclas="F1 F2 F3 F5 F6 F7 F9 F11 Escape">
  ${topoErp([['ERP', 'inicio'], ['Stocks', ''], ['Mapas', ''], ['Stocks', '']])}
  <header class="ak-cab lf2-cab">
    <span class="ak-cab-ic">${L(boxes)}</span>
    <div><h1>Mapa de stocks</h1><p>As existências de cada artigo, o que está encomendado e quanto vale.</p></div>
    <span class="lf2-restaurada" data-mst-restaurada hidden></span>
  </header>
  <div class="ak-barra lf2-barra mst-barra" role="toolbar" aria-label="Ações do mapa">
    ${B('atualizar', refresh, 'Atualizar', 'F9')}
    ${B('imprimir', printer, 'Imprimir', 'F11')}
    <i class="ak-sep" aria-hidden="true"></i>
    ${B('excel', sheet, 'Exportar para Excel', '')}
    <i class="ak-sep" aria-hidden="true"></i>
    <span class="mst-valz" role="radiogroup" aria-label="Valorização"><small>Valorização</small>${VALZ.map((v, i) => `<button type="button" role="radio" aria-checked="${i === 0}" data-mst-valz="${v.k}" title="Valorização a ${v.t.toLowerCase()} (${v.tecla})">${v.t}<kbd>${v.tecla}</kbd></button>`).join('')}</span>
    <span class="ak2-esp"></span>
    <span class="rc-hora" data-mst-hora></span>
  </div>

  <section class="lf-filtros lf2-filtros dv2-filtros mac-filtros" aria-label="Pesquisa e filtros">
    <div class="ak-campo dv2-pesquisa mac-pesquisa" role="group" aria-labelledby="${id('pq-t')}">
      <span id="${id('pq-t')}">Visualização</span>
      <div class="dv2-pq mac-pq">
        <span class="dv2-modos" role="radiogroup" aria-label="Visualizar por">${MODOS.map((m, i) => `<button type="button" role="radio" aria-checked="${i === 0}" data-mst-modo="${m.k}" title="Visualizar por ${m.t.toLowerCase()} (${m.tecla})">${L(m.ic)}<span>${m.t}</span><kbd>${m.tecla}</kbd></button>`).join('')}</span>
        <span class="lf2-comp" role="radiogroup" aria-label="Como compara">
          <button type="button" role="radio" aria-checked="true" data-mst-comp="inicio" title="Pesquisa iniciada por (Shift+F1)">Iniciado por</button>
          <button type="button" role="radio" aria-checked="false" data-mst-comp="contem" title="Pesquisa contendo (Shift+F2)">Contendo</button>
          <button type="button" role="radio" aria-checked="false" data-mst-comp="igual" title="Pesquisa exatamente igual a (Shift+F3)">Igual a</button>
        </span>
        <label class="lf2-pq-in">${L(search)}<input type="search" id="${id('q')}" data-mst-q autocomplete="off" placeholder="${MODOS[0].ph}" aria-label="Pesquisar"></label>
      </div>
    </div>
    <div class="mst-campos">
      <label class="ak-campo" for="${id('arm')}"><span>Armazém</span><select id="${id('arm')}" data-mst-f="armazem">${op('', 'Todos')}${ARMAZENS.map((a) => op(a.cod, a.nome.replace('Armazém ', ''))).join('')}</select></label>
      <label class="ak-campo" for="${id('ca')}"><span>Classe de reposição Auto</span><select id="${id('ca')}" data-mst-f="cAuto">${op('', 'Todas')}${CLASSES_AUTO.map((c) => op(c.cod, `${c.cod} · ${c.nome}`)).join('')}</select></label>
      <label class="ak-campo" for="${id('ci')}"><span>Classe de reposição Indústria</span><select id="${id('ci')}" data-mst-f="cInd">${op('', 'Todas')}${CLASSES_IND.map((c) => op(c.cod, `${c.cod} · ${c.nome}`)).join('')}</select></label>
      <label class="ak-campo" for="${id('fam')}"><span>Família</span><select id="${id('fam')}" data-mst-f="fam">${op('', 'Todas')}${fams.map((f) => op(f, f)).join('')}</select></label>
      <label class="ak-campo" for="${id('sub')}"><span>Subfamília</span><select id="${id('sub')}" data-mst-f="sub">${op('', 'Todas')}</select></label>
      <label class="mst-so"><input type="checkbox" data-mst-f="soCom"><span>Só com existências</span></label>
    </div>
  </section>

  <div class="rc-somatorios mac-soma" data-mst-soma role="status" aria-live="polite"></div>
  <section class="lf2-lista dv2-lista" aria-labelledby="${id('lista-t')}">
    <div class="lf2-lista-cab"><h2 id="${id('lista-t')}">Artigos</h2><p class="lf2-resumo" data-mst-resumo></p></div>
    <div class="lf2-grelha lf2-grelha--ajusta" data-mst-grelha tabindex="-1"></div>
  </section>
  <div class="mac-impressao" aria-hidden="true" data-mst-impressao></div>
  <footer class="ak-estado lf2-estado" data-mst-estado role="status" aria-live="polite"></footer>
  <p class="hm-aviso" data-hm-aviso role="status" aria-live="polite"></p>
</div>`;
}

/* ---------- desenhar ---------- */
const avisos = new WeakMap<HTMLElement, number>();
function toast(r: HTMLElement, t: string): void { const p = r.querySelector<HTMLElement>('[data-hm-aviso]'); if (!p) return; p.textContent = t; p.classList.add('is-visivel'); clearTimeout(avisos.get(r)); avisos.set(r, window.setTimeout(() => p.classList.remove('is-visivel'), 3200)); }
function filtros(r: HTMLElement, e: Est): void {
  r.querySelectorAll<HTMLElement>('[data-mst-modo]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.mstModo === e.modo)));
  r.querySelectorAll<HTMLElement>('[data-mst-comp]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.mstComp === e.comp)));
  r.querySelectorAll<HTMLElement>('[data-mst-valz]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.mstValz === e.valz)));
  const q = r.querySelector<HTMLInputElement>('[data-mst-q]')!; if (q.value !== e.q) q.value = e.q; q.placeholder = MODOS.find((m) => m.k === e.modo)!.ph;
  const sub = r.querySelector<HTMLSelectElement>('[data-mst-f="sub"]')!;
  const subs = [...new Set(ARTIGOS.filter((a) => !e.fam || familiaDe(a.desc) === e.fam).map((a) => subfamiliaDe(a.desc)))].sort((a, b) => a.localeCompare(b, 'pt'));
  const ops = `<option value="">Todas</option>${subs.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join('')}`;
  if (sub.dataset.ops !== ops) { sub.innerHTML = ops; sub.dataset.ops = ops; }
  if (e.sub && !subs.includes(e.sub)) e.sub = '';
  (['armazem', 'cAuto', 'cInd', 'fam', 'sub'] as const).forEach((k) => { r.querySelector<HTMLSelectElement>(`[data-mst-f="${k}"]`)!.value = e[k]; });
  r.querySelector<HTMLInputElement>('[data-mst-f="soCom"]')!.checked = e.soCom;
}
function grelha(r: HTMLElement, e: Est, revelar = false): void {
  const g = r.querySelector<HTMLElement>('[data-mst-grelha]')!;
  r.classList.toggle('is-ocupada', e.fase === 'carregar' && !!g.querySelector('table'));
  const vazio = (ic: string, t: string, d: string, botao = '') => { g.innerHTML = `<div class="ak-vazio lf2-vazio">${L(ic)}<p><b>${t}</b>${d}</p>${botao}</div>`; };
  const tentar = `<button type="button" class="ak-btn ak-btn--acao" data-mst-acao="atualizar">${L(refresh)}<span>Tentar outra vez</span></button>`;
  if (e.fase === 'erro') {
    if (e.erro === 'offline') return vazio(wifiOff, 'Sem ligação à rede.', 'Os filtros ficam. Quando a ligação voltar, atualiza (F9).', tentar);
    if (e.erro === 'sessao') return vazio(logIn, 'A sessão terminou.', 'Volta a entrar para continuar; os filtros ficam neste ecrã.', `<button type="button" class="ak-btn ak-btn--acao" data-login>${L(logIn)}<span>Voltar a entrar</span></button>`);
    return vazio(circleAlert, 'Não foi possível ler os stocks.', 'O servidor dos stocks não respondeu (ERP-STK-503). Os filtros ficam.', tentar);
  }
  if (e.fase === 'carregar' && !g.querySelector('table')) { g.innerHTML = `<div class="lf2-esq" aria-label="A ler os stocks">${Array.from({ length: 8 }, (_, i) => `<i style="--i:${i}"></i>`).join('')}</div>`; return; }
  const ls = linhas(e), cs = cols(e);
  if (!ls.length) return vazio(searchX, 'Nenhum artigo com estes filtros.', e.q ? `Nenhum ${e.modo === 'artigo' ? 'artigo' : e.modo === 'descricao' ? 'artigo na descrição' : 'artigo na família'} ${e.comp === 'inicio' ? 'começa por' : e.comp === 'contem' ? 'contém' : 'é exatamente'} «${esc(e.q)}».` : 'Tira um dos filtros.', `<button type="button" class="ak-btn" data-mst-acao="limpar">${L(funnelX)}<span>Limpar filtros</span></button>`);
  const sort = (k: ColK) => e.ordem?.k === k ? (e.ordem.dir === 1 ? 'ascending' : 'descending') : 'none';
  const cab = `<tr>${cs.map((c) => `<th scope="col" class="${c.k === 'ref' ? '' : 'is-num'}" aria-sort="${sort(c.k)}"${c.titulo ? ` title="${esc(c.titulo)}"` : ''}><button type="button" data-mst-ordenar="${c.k}">${esc(c.t)}${e.ordem?.k === c.k ? `<span class="lf2-ord">${L(e.ordem.dir === 1 ? arrowUp : arrowDown)}</span>` : ''}</button></th>`).join('')}</tr>`;
  const cel = (l: Linha, c: Col) => c.k === 'ref' ? `<span class="mac-ent-c"><b class="is-mono">${esc(l.a.ref)}</b> ${esc(l.a.desc)}</span>` : c.eur ? eur(l[c.k as NumK]) : num(l[c.k as NumK]);
  const tr = (l: Linha) => {
    const ab = e.aberto === l.a.ref;
    const linha = `<tr data-mst-art="${esc(l.a.ref)}" tabindex="0" aria-expanded="${ab}" class="${ab ? 'is-ativo' : ''}${l.nominal < 0 ? ' mst-falta' : ''}">${cs.map((c) => `<td class="${c.k === 'ref' ? '' : 'is-num'}">${cel(l, c)}</td>`).join('')}</tr>`;
    if (!ab) return linha;
    const por = ARMAZENS.map((a) => [a, stockEm(l.a.ref, a.nome)] as const);
    return `${linha}<tr class="mst-det"><td colspan="${cs.length}"><div class="mst-det-c">${L(warehouse)}<span class="mst-det-t">Por armazém</span>${por.map(([a, q]) => `<span class="mst-arm${q ? '' : ' is-zero'}${e.armazem === a.cod ? ' is-escolhido' : ''}"><small>${esc(a.nome.replace('Armazém ', ''))}</small><b>${nf(q)} ${esc(l.a.un)}</b></span>`).join('')}<span class="mst-det-n">${l.a.marca} · ${esc(l.fam)} › ${esc(l.sub)}${classeAuto(l.a) ? ` · classe ${classeAuto(l.a)}` : ''}${classeInd(l.a) ? ` · classe ${classeInd(l.a)}` : ''}</span></div></td></tr>`;
  };
  const tds = (xs: Linha[], rotulo: string) => cs.map((c) => c.k === 'ref' ? `<td>${rotulo}</td>` : c.k === 'preco' ? '<td></td>' : `<td class="is-num"><b>${c.eur ? euros(soma(xs, c.k)) : nf(soma(xs, c.k))}</b></td>`).join('');
  let corpo = '';
  if (e.modo === 'familia') {
    const gs = new Map<string, Linha[]>(); ls.forEach((l) => gs.set(l.fam, [...(gs.get(l.fam) ?? []), l]));
    corpo = [...gs].sort((a, b) => a[0].localeCompare(b[0], 'pt')).map(([f, xs]) => {
      const fechada = e.fechadas.has(f);
      return `<tr class="mac-g mst-g">${cs.map((c) => c.k === 'ref' ? `<td><button type="button" class="mac-g-abrir" data-mst-abrir="${esc(f)}" aria-expanded="${!fechada}">${L(arrowDown, 'mac-g-seta')}<b>${esc(f)}</b><small>${nf(xs.length)} ${xs.length === 1 ? 'artigo' : 'artigos'} · ${esc([...new Set(xs.map((x) => x.sub))].join(', '))}</small></button></td>` : c.k === 'preco' ? '<td></td>' : `<td class="is-num"><b>${c.eur ? euros(soma(xs, c.k)) : nf(soma(xs, c.k))}</b></td>`).join('')}</tr>${fechada ? '' : xs.map(tr).join('')}`;
    }).join('');
  } else corpo = ls.map(tr).join('');
  g.innerHTML = `<table class="lf2-tab lf2-tab--ajusta mst-tab" aria-label="Mapa de stocks"><colgroup>${cs.map((c) => `<col style="width:${c.w}%">`).join('')}</colgroup><thead>${cab}</thead><tbody>${corpo}</tbody><tfoot><tr class="rc-total mac-total">${tds(ls, `<b>Total · ${nf(ls.length)} ${ls.length === 1 ? 'artigo' : 'artigos'}</b>`)}</tr></tfoot></table>`;
  if (revelar && !quieto()) g.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'cubic-bezier(.22, 1, .36, 1)' });
}
function somatorios(r: HTMLElement, e: Est): void {
  const s = r.querySelector<HTMLElement>('[data-mst-soma]')!, ls = e.fase === 'erro' ? [] : linhas(e);
  s.hidden = !ls.length; if (!ls.length) { s.innerHTML = ''; return; }
  const v = VALZ.find((x) => x.k === e.valz)!, falta = ls.filter((l) => l.nominal < 0).length;
  s.innerHTML = `<span class="rc-s rc-s--total"><small>Valor das existências</small><b>${euros(soma(ls, 'valor'))}</b><i>a ${v.t.toLowerCase()} (${v.tecla})</i></span>
    <span class="rc-s"><small>Existências</small><b>${nf(soma(ls, 'exist'))}</b><i>${e.armazem ? esc(ARMAZENS.find((a) => a.cod === e.armazem)!.nome.replace('Armazém ', '')) : 'todos os armazéns'}</i></span>
    <span class="rc-s"><small>Enc. por clientes</small><b>${nf(soma(ls, 'encCli'))}</b><i>por entregar</i></span>
    <span class="rc-s"><small>Enc. a fornecedores</small><b>${nf(soma(ls, 'encFor'))}</b><i>por receber</i></span>
    <span class="rc-s${soma(ls, 'nominal') < 0 ? ' mst-s-neg' : ''}"><small>Stock nominal</small><b>${nf(soma(ls, 'nominal'))}</b><i>${falta ? `${falta} ${falta === 1 ? 'artigo fica' : 'artigos ficam'} abaixo de zero` : 'nenhum abaixo de zero'}</i></span>
    <span class="rc-s"><small>Consignado</small><b>${euros(soma(ls, 'vCons'))}</b><i>${nf(soma(ls, 'cons'))} unidades</i></span>
    <span class="rc-s"><small>Devolvido</small><b>${euros(soma(ls, 'vDev'))}</b><i>${nf(soma(ls, 'dev'))} unidades</i></span>`;
}
function resto(r: HTMLElement, e: Est): void {
  const ls = e.fase === 'erro' ? [] : linhas(e);
  const fs = [e.armazem && `Armazém ${e.armazem}`, e.cAuto && `Classe ${e.cAuto}`, e.cInd && `Classe ${e.cInd}`, e.fam, e.sub, e.soCom && 'Só com existências', e.q && `«${e.q}»`].filter(Boolean) as string[];
  r.querySelector<HTMLElement>('[data-mst-resumo]')!.innerHTML = fs.length ? fs.map((f) => `<span>${esc(f)}</span>`).join('') + `<button type="button" class="lf2-limpar" data-mst-acao="limpar">${L(funnelX)}<span>Limpar</span></button>` : '<span>Todos os artigos</span>';
  const fase = e.fase === 'carregar' ? 'A ler…' : e.fase === 'erro' ? 'Erro' : 'Pronto';
  r.querySelector<HTMLElement>('[data-mst-estado]')!.innerHTML = `<span>Visualização <b>por ${MODOS.find((m) => m.k === e.modo)!.t.toLowerCase()}</b></span><span>Valorização <b>${VALZ.find((v) => v.k === e.valz)!.t.toLowerCase()}</b></span><span>Artigos <b>${nf(ls.length)}</b> de ${nf(ARTIGOS.length)}</span><span class="ak-estado-f is-${e.fase === 'ok' ? 'ok' : 'a-gerar'}">${e.fase === 'carregar' ? L(loader) : ''}${fase}</span>${e.aviso ? `<span class="ak-estado-aviso">${esc(e.aviso)}</span>` : ''}`;
  r.querySelector<HTMLElement>('[data-mst-hora]')!.innerHTML = e.hora ? `Atualizado às <b>${new Date(e.hora).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</b>` : '';
  r.querySelectorAll<HTMLElement>('.mst-barra [data-mst-acao]').forEach((b) => { const p = b.dataset.mstAcao !== 'atualizar' && !ls.length ? 'Não há artigos para isso.' : ''; b.setAttribute('aria-disabled', String(!!p)); if (p) b.title = p; });
  const ip = r.querySelector<HTMLElement>('[data-mst-impressao]'); if (ip) ip.innerHTML = `<h1>Mapa de stocks</h1><p>Valorização a ${VALZ.find((v) => v.k === e.valz)!.t.toLowerCase()} · ${fs.length ? esc(fs.join(' · ')) : 'todos os artigos'} · impresso a ${new Date().toLocaleString('pt-PT')}</p>`;
}
function tudo(r: HTMLElement, e: Est, revelar = false): void { filtros(r, e); grelha(r, e, revelar); somatorios(r, e); resto(r, e); }

/* ---------- ações ---------- */
function guardar(e: Est): void { if (e.editor) return; try { localStorage.setItem(CHAVE, JSON.stringify({ modo: e.modo, comp: e.comp, valz: e.valz, armazem: e.armazem, cAuto: e.cAuto, cInd: e.cInd, fam: e.fam, sub: e.sub, soCom: e.soCom })); } catch { /* */ } }
async function ler(r: HTMLElement, e: Est, revelar = true): Promise<void> {
  e.fase = 'carregar'; e.erro = undefined; tudo(r, e);
  await new Promise((ok) => window.setTimeout(ok, quieto() ? 0 : 160));
  e.fase = 'ok'; e.hora = Date.now(); guardar(e); tudo(r, e, revelar);
}
function exportar(r: HTMLElement, e: Est): void {
  const ls = linhas(e); if (!ls.length) return;
  try {
    const v = VALZ.find((x) => x.k === e.valz)!;
    const ts = ['Artigo', 'Descrição', 'Família', 'Subfamília', 'Existências', 'Qt. enc. cli.', 'Qt. enc. for.', 'Stock nominal', v.col, 'Valor', 'Stk. consignado', 'Valor consignado', 'Stk. devolvido', 'Valor devolvido'];
    const rows: Celula[][] = ls.map((l) => [l.a.ref, l.a.desc, l.fam, l.sub, l.exist, l.encCli, l.encFor, l.nominal, { euros: l.preco }, { euros: l.valor }, l.cons, { euros: l.vCons }, l.dev, { euros: l.vDev }]);
    rows.push([`Total · ${ls.length}`, null, null, null, soma(ls, 'exist'), soma(ls, 'encCli'), soma(ls, 'encFor'), soma(ls, 'nominal'), null, { euros: soma(ls, 'valor') }, soma(ls, 'cons'), { euros: soma(ls, 'vCons') }, soma(ls, 'dev'), { euros: soma(ls, 'vDev') }]);
    const nome = `Mapa-de-stocks-${e.valz}${e.armazem ? `-armazem-${e.armazem}` : ''}.xlsx`;
    descarregar(xlsx({ nome: 'Stocks', colunas: ts, linhas: rows, larguras: ts.map((t) => Math.max(10, t.length + 4)) }), nome);
    e.aviso = `Exportado: ${nome} · ${nf(ls.length)} artigos.`; resto(r, e); toast(r, e.aviso);
  } catch { e.aviso = 'A exportação falhou; tenta outra vez.'; resto(r, e); toast(r, e.aviso); }
}
const limpar = (e: Est) => Object.assign(e, { q: '', armazem: '', cAuto: '', cInd: '', fam: '', sub: '', soCom: false });

/* ---------- os cenários ---------- */
function armar(r: HTMLElement): void {
  if (estados.has(r)) return;
  const e = de(r), cen = r.dataset.mstCenario ?? 'inicial';
  if (cen === 'inicial' && !e.editor) { try { const v = JSON.parse(localStorage.getItem(CHAVE) ?? 'null'); if (v) Object.assign(e, v); } catch { /* */ } }
  e.hora = e.editor ? Date.parse('2026-11-18T10:14:00') : Date.now();
  if (cen === 'descricao') e.modo = 'descricao';
  if (cen === 'familia' || cen === 'familia-fechada') e.modo = 'familia';
  if (cen === 'familia-fechada') ['Rolamentos', 'Travagem', 'Ignição'].forEach((f) => e.fechadas.add(f));
  if (cen === 'pesquisa') { e.q = '62'; }
  if (cen === 'contendo') { e.modo = 'descricao'; e.comp = 'contem'; e.q = 'travão'; }
  if (cen === 'igual') { e.comp = 'igual'; e.q = 'bkr6e'; }
  if (cen === 'sem-resultados') { e.q = 'XPTO'; }
  if (cen === 'ultimo') e.valz = 'ultimo';
  if (cen === 'tabela') e.valz = 'tabela';
  if (cen === 'armazem') e.armazem = '1';
  if (cen === 'classe-ind') e.cInd = 'I1';
  if (cen === 'subfamilia') { e.fam = 'Rolamentos'; e.sub = 'Rígidos de esferas'; }
  if (cen === 'so-com') { e.soCom = true; e.armazem = '60'; }
  if (cen === 'ordenado') e.ordem = { k: 'valor', dir: -1 };
  if (cen === 'por-armazem') e.aberto = '6206-2RSH';
  if (cen === 'a-carregar') e.fase = 'carregar';
  if (cen === 'a-atualizar') { tudo(r, e); e.fase = 'carregar'; }
  if (['servidor', 'offline', 'sessao'].includes(cen)) { e.fase = 'erro'; e.erro = cen as Est['erro']; }
  if (cen === 'exportado') e.aviso = `Exportado: Mapa-de-stocks-medio.xlsx · ${ARTIGOS.length} artigos.`;
  if (cen === 'imprimir') e.aviso = 'A preparar a impressão: o título, a valorização, os filtros, os artigos e o total.';
  tudo(r, e);
  if (cen === 'restaurado') { const x = r.querySelector<HTMLElement>('[data-mst-restaurada]')!; x.hidden = false; x.innerHTML = `${L(undo)}Reposto como o deixaste às 09:12`; }
  const aVista = !!r.closest('.ecra:not([hidden]) > .versao:not([hidden])');
  if (!e.editor && aVista && !quieto()) r.classList.add('lf2-entra');
}
const armarTodos = () => document.querySelectorAll<HTMLElement>('[data-mst]').forEach(armar);
function abrirLinha(r: HTMLElement, e: Est, ref: string): void { e.aberto = e.aberto === ref ? '' : ref; grelha(r, e); r.querySelector<HTMLElement>(`tr[data-mst-art="${CSS.escape(ref)}"]`)?.focus({ preventScroll: true }); }

let espera = 0;
export function iniciar(): void {
  requestAnimationFrame(armarTodos);
  ['romafe:versao', 'romafe:ecra'].forEach((y) => document.addEventListener(y, () => requestAnimationFrame(armarTodos)));
  document.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement, r = raiz(t); if (!r || editando()) return; const e = de(r); let b: HTMLElement | null;
    /* o que está escrito conta já, mesmo antes da pausa da escrita */
    const qi = r.querySelector<HTMLInputElement>('[data-mst-q]'); if (qi) { clearTimeout(espera); e.q = qi.value; }
    if ((b = t.closest('[data-mst-acao][aria-disabled="true"]'))) { toast(r, b.title); return; }
    if ((b = t.closest('[data-mst-modo]'))) { e.modo = b.dataset.mstModo as Modo; e.fechadas.clear(); tudo(r, e, true); guardar(e); r.querySelector<HTMLInputElement>('[data-mst-q]')?.focus(); return; }
    if ((b = t.closest('[data-mst-comp]'))) { e.comp = b.dataset.mstComp as Comp; tudo(r, e); guardar(e); r.querySelector<HTMLInputElement>('[data-mst-q]')?.focus(); return; }
    if ((b = t.closest('[data-mst-valz]'))) { e.valz = b.dataset.mstValz as Valz; guardar(e); tudo(r, e); toast(r, `Valorização a ${VALZ.find((v) => v.k === e.valz)!.t.toLowerCase()}.`); return; }
    if ((b = t.closest('[data-mst-ordenar]'))) { const k = b.dataset.mstOrdenar as ColK; e.ordem = e.ordem?.k === k ? (e.ordem.dir === 1 ? { k, dir: -1 } : null) : { k, dir: k === 'ref' ? 1 : -1 }; grelha(r, e); return; }
    if ((b = t.closest('[data-mst-abrir]'))) { const k = b.dataset.mstAbrir!; if (e.fechadas.has(k)) e.fechadas.delete(k); else e.fechadas.add(k); grelha(r, e); r.querySelector<HTMLElement>(`[data-mst-abrir="${CSS.escape(k)}"]`)?.focus(); return; }
    if ((b = t.closest('[data-mst-acao]'))) {
      const k = b.dataset.mstAcao!;
      if (k === 'atualizar') void ler(r, e, false);
      else if (k === 'imprimir') window.print();
      else if (k === 'excel') exportar(r, e);
      else if (k === 'limpar') { limpar(e); void ler(r, e); }
      return;
    }
    if ((b = t.closest('tr[data-mst-art]'))) abrirLinha(r, e, b.dataset.mstArt!);
  });
  document.addEventListener('input', (ev) => {
    const t = ev.target as HTMLInputElement, r = raiz(t); if (!r || !t.matches('[data-mst-q]')) return; const e = de(r);
    clearTimeout(espera); espera = window.setTimeout(() => { e.q = t.value; grelha(r, e); somatorios(r, e); resto(r, e); }, 120);
  });
  document.addEventListener('change', (ev) => {
    const t = ev.target as HTMLInputElement, r = raiz(t); if (!r || editando() || !t.matches('[data-mst-f]')) return; const e = de(r);
    const k = t.dataset.mstF as 'armazem' | 'cAuto' | 'cInd' | 'fam' | 'sub' | 'soCom';
    if (k === 'soCom') e.soCom = t.checked; else e[k] = t.value;
    if (k === 'fam') e.sub = '';
    void ler(r, e);
  });
  document.addEventListener('keydown', (ev) => {
    const t = ev.target as HTMLElement, r = raiz(t) ?? visivel(); if (!r || editando()) return; const e = de(r);
    const so = !ev.ctrlKey && !ev.altKey && !ev.metaKey;
    if (so && ev.shiftKey && ['F1', 'F2', 'F3'].includes(ev.key)) { ev.preventDefault(); r.querySelector<HTMLElement>(`[data-mst-comp="${{ F1: 'inicio', F2: 'contem', F3: 'igual' }[ev.key]}"]`)?.click(); return; }
    if (so && !ev.shiftKey && ['F1', 'F2', 'F3'].includes(ev.key)) { ev.preventDefault(); r.querySelector<HTMLElement>(`[data-mst-modo="${{ F1: 'artigo', F2: 'descricao', F3: 'familia' }[ev.key]}"]`)?.click(); return; }
    if (so && !ev.shiftKey && ['F5', 'F6', 'F7'].includes(ev.key)) { ev.preventDefault(); r.querySelector<HTMLElement>(`[data-mst-valz="${{ F5: 'medio', F6: 'ultimo', F7: 'tabela' }[ev.key]}"]`)?.click(); return; }
    if (so && !ev.shiftKey && (ev.key === 'F9' || ev.key === 'F11')) { ev.preventDefault(); r.querySelector<HTMLElement>(`.mst-barra [data-mst-acao="${ev.key === 'F9' ? 'atualizar' : 'imprimir'}"]`)?.click(); return; }
    if (ev.key === 'Escape' && t.matches('[data-mst-q]') && e.q) { ev.preventDefault(); e.q = ''; tudo(r, e); return; }
    if (ev.key === 'Escape' && e.aberto) { ev.preventDefault(); const ref = e.aberto; e.aberto = ''; grelha(r, e); r.querySelector<HTMLElement>(`tr[data-mst-art="${CSS.escape(ref)}"]`)?.focus(); return; }
    const tr = t.closest<HTMLElement>('tr[data-mst-art]');
    if (tr && t === tr) {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); abrirLinha(r, e, tr.dataset.mstArt!); return; }
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); const trs = [...r.querySelectorAll<HTMLElement>('tr[data-mst-art]')], i = trs.indexOf(tr); trs[Math.max(0, Math.min(trs.length - 1, i + (ev.key === 'ArrowDown' ? 1 : -1)))]?.focus(); }
    }
  });
}

/* ---------- os ecrãs ---------- */
const NOTA = 'Mapa de stocks (18 nov., do «MAPAS» de stocks do ERP antigo): Visualizar por artigo (F1), descrição (F2) ou família/subfamília (F3, em faixas com os totais); pesquisa Iniciado por / Contendo / Igual a (Shift+F1/F2/F3); valorização a preço médio (F5), último preço (F6) ou preço de tabela (F7); armazém, classes de reposição Auto e Indústria, família e subfamília; os Somatórios por cima e as colunas do antigo (Existências, encomendas de clientes e a fornecedores, Stock nominal, preço, Valor, consignado e devolvido com o seu valor); tocar num artigo mostra o stock por armazém; F9, F11 e Excel. A tabela cabe na largura.';
const ESTADOS: [string, string, string][] = [
  ['descricao', 'Por descrição (F2)', 'A lista pela descrição; a pesquisa procura na descrição.'],
  ['familia', 'Por família/subfamília (F3)', 'Uma faixa por família com os totais dela e as subfamílias.'],
  ['familia-fechada', 'Famílias fechadas', 'Cada faixa fecha-se e fica só o total da família.'],
  ['pesquisa', 'Pesquisa iniciado por', '«62»: só as referências que começam assim.'],
  ['contendo', 'Pesquisa contendo (Shift+F2)', '«travão» na descrição, sem acentos a contar.'],
  ['igual', 'Exatamente igual a (Shift+F3)', 'Só a referência certa (BKR6E).'],
  ['sem-resultados', 'Sem artigos', 'Diz o que se procurou e como; Limpar filtros.'],
  ['ultimo', 'Valorização ao último preço (F6)', 'O preço e os três Valor mudam; os Somatórios dizem qual.'],
  ['tabela', 'Valorização ao preço de tabela (F7)', 'O preço de venda de tabela.'],
  ['armazem', 'Um armazém', 'As Existências só do Armazém 1 · Porto.'],
  ['classe-ind', 'Classe de reposição', 'Só os artigos da classe I1 (Indústria).'],
  ['subfamilia', 'Família e subfamília', 'Rolamentos › Rígidos de esferas: a subfamília segue a família.'],
  ['so-com', 'Só com existências', 'No armazém 60, só os artigos que lá estão.'],
  ['ordenado', 'Ordenado pelo valor', 'Tocar no título de uma coluna ordena; outra vez inverte, a terceira tira.'],
  ['por-armazem', 'Stock por armazém', 'Tocar num artigo (ou Enter) abre os cinco armazéns na própria linha.'],
  ['a-carregar', 'A ler os stocks', 'A grelha em esqueleto; os filtros já servem.'],
  ['a-atualizar', 'A atualizar (F9)', 'Os artigos ficam à vista, esbatidos, até chegar a resposta.'],
  ['exportado', 'Exportado para Excel', 'Os artigos com a família, a subfamília, todas as colunas e o total.'],
  ['imprimir', 'Imprimir (F11)', 'O título, a valorização, os filtros, os artigos e o total.'],
  ['servidor', 'Servidor indisponível', 'O servidor dos stocks não respondeu: Tentar outra vez.'],
  ['offline', 'Sem ligação', 'Sem rede: os filtros ficam.'],
  ['sessao', 'Sessão terminada', 'Voltar a entrar pelo login comum.'],
  ['restaurado', 'Área de trabalho reposta', 'Ao voltar: a visualização, a valorização e os filtros como estavam.'],
];
export type IdMapaStocks = 'stocks-mapa-stocks' | `mst-${string}`;
export function ecrasMapaStocks(): Ecra<IdErp>[] {
  const v = (cen: string) => ({ id: 'v1', nota: NOTA, html: html(cen) });
  return [
    { id: 'stocks-mapa-stocks', nome: '76 · Mapa de stocks', fluxo: 'Stocks', objetivo: 'As existências de cada artigo, o encomendado e o valor, com a valorização à escolha.', versoes: [v('inicial')] as Ecra<IdErp>['versoes'] },
    ...ESTADOS.map(([cen, nome, objetivo], i) => ({ id: `mst-${cen}` as IdErp, nome: `76.${i + 1} · ${nome}`, fluxo: 'Stocks', estadoDe: 'stocks-mapa-stocks' as IdErp, objetivo, versoes: [v(cen)] as Ecra<IdErp>['versoes'] })),
  ] as Ecra<IdErp>[];
}
