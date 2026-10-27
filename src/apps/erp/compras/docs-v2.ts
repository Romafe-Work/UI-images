/* =========================================================
   ERP — Compras: o motor comum das listas de documentos v2 (26 out. 2026): Orçamentos a Fornecedores (18, v2) e
   Encomendas a Fornecedores (10, v3), dos briefings dela «Gestão de Orçamentos a Fornecedores V2» e «Gestão de Encomendas
   a Fornecedores V2» e dos prints do ERP antigo (26 out.). As duas listas antigas têm a mesma forma — Série (F4),
   Visualização por Número (F1), Data (F2), Código (F10) e Descrição (F12), Pesquisa Iniciado por (Shift+F1) e Contendo
   (Shift+F2), a barra Novo F5 · Editar F6 · Anular F8 · Refrescar F9 · Imprimir F11 — e por isso o motor é um só:
     - a página (aqui): cabeçalho, barra, filtros, grelha, painel do documento por separadores, a ficha e a barra de estado;
     - o comportamento: compras/docs-v2-comportamento.ts;
     - cada documento é uma configuração (CfgDoc): compras/orcamentos-v2.ts e compras/encomendas-v2.ts, que ligam o motor
       às regras de compras/dominio.ts e dominio2.ts (nada se grava fora delas).
   CSS: css/faltas-v2.css (a grelha, os filtros, os diálogos) e css/docs-v2.css (a pesquisa por modos, a ficha, as linhas).
   ========================================================= */
import { topoErp } from '../inicio-v2';
import { L, esc } from '../espaco';
import plus from 'lucide-static/icons/plus.svg?raw';
import pencil from 'lucide-static/icons/pencil.svg?raw';
import ban from 'lucide-static/icons/ban.svg?raw';
import refresh from 'lucide-static/icons/refresh-cw.svg?raw';
import printer from 'lucide-static/icons/printer.svg?raw';
import ellipsis from 'lucide-static/icons/ellipsis.svg?raw';
import search from 'lucide-static/icons/search.svg?raw';
import chevronDown from 'lucide-static/icons/chevron-down.svg?raw';
import sliders from 'lucide-static/icons/sliders-horizontal.svg?raw';
import paperclip from 'lucide-static/icons/paperclip.svg?raw';
import gripH from 'lucide-static/icons/grip-horizontal.svg?raw';
import hash from 'lucide-static/icons/hash.svg?raw';
import calendar from 'lucide-static/icons/calendar.svg?raw';
import building from 'lucide-static/icons/building-2.svg?raw';
import textIc from 'lucide-static/icons/text.svg?raw';
import type { IdPerfil } from '../inicio-dados';

export { L, esc };
/** Uma linha da lista: o id e os campos que a configuração lê. */
export interface Doc { id: string; [k: string]: unknown }
export type TipoCol = 'txt' | 'mono' | 'n' | 'eur' | 'data' | 'sim' | 'estado';
export interface ColDoc { k: string; t: string; tipo: TipoCol; w: number; presa?: boolean; antiga?: boolean }
export type Modo = 'numero' | 'data' | 'codigo' | 'descricao';
export const MODOS: { k: Modo; tecla: string; t: string; ic: string }[] = [
  { k: 'numero', tecla: 'F1', t: 'Número', ic: hash }, { k: 'data', tecla: 'F2', t: 'Data', ic: calendar },
  { k: 'codigo', tecla: 'F10', t: 'Código', ic: building }, { k: 'descricao', tecla: 'F12', t: 'Descrição', ic: textIc },
];
export interface Filtros { serie: string; forn: string; estado: string; de: string; ate: string; moeda: string }
export const F0 = (): Filtros => ({ serie: '', forn: '', estado: '', de: '', ate: '', moeda: '' });
export interface Ord { k: string; dir: 1 | -1 }
export type Fase = 'ok' | 'carregar' | 'atualizar' | 'erro';
export interface Ficha { modo: 'criar' | 'editar'; ref: string; sujo: boolean; erro: string; campo: string; /** o documento em edição (com janelas, as ações ficam presas a ele) */ id?: string }
/** O estado de uma página (uma por ecrã e por estado no editor). */
export interface EstDoc {
  modo: Modo; comp: 'inicio' | 'contem'; q: string; f: Filtros;
  cols: string[]; ocultas: Set<string>; larg: Record<string, number>; ordem: Ord[]; filtrosCol: Record<string, string>; filtrosAbertos: boolean;
  dens: 'compacta' | 'normal'; sel: Set<string>; ativo: string; tab: string; alt: number;
  fase: Fase; erro?: 'servidor' | 'offline' | 'sessao'; perfil: IdPerfil; aviso: string; editor: boolean;
  ficha?: Ficha; ocupado: string; recusa: string; vazia: boolean; extra: Record<string, unknown>;
}
/** O que cada documento traz ao motor. */
export interface CfgDoc {
  k: string; titulo: string; sub: string; icone: string; um: string; o: 'o' | 'a'; caminho: [string, string][];
  cols: ColDoc[]; verIniciais: string[];
  campos: Record<Modo, string>;
  linhas(e: EstDoc): Doc[];
  series(): string[]; serieDe(d: Doc): string; fornDe(d: Doc): string; dataDe(d: Doc): string; moedaDe(d: Doc): string;
  estados: [string, string][]; estadoPassa(d: Doc, v: string): boolean;
  celula(d: Doc, k: string): string; valor(d: Doc, k: string): string | number;
  resumo(ls: Doc[]): string;
  barra: string; teclasExtra: string;
  tabs: { k: string; t: string; ic: string }[];
  painel(e: EstDoc, d: Doc | undefined, tab: string): string;
  ficha(e: EstDoc, f: Ficha, d: Doc | undefined): string;
  gravar(r: HTMLElement, e: EstDoc, f: Ficha): { ref: string; msg: string };
  porque: { novo(e: EstDoc): string; editar(e: EstDoc, d: Doc | undefined): string; anular(e: EstDoc, d: Doc | undefined): string };
  anular: { texto(d: Doc): [string, string]; fazer(e: EstDoc, d: Doc, motivo: string): string };
  docAnexo(d: Doc): string;
  teclas: { tecla: string; acao: string }[];
  acao(r: HTMLElement, e: EstDoc, k: string, b: HTMLElement): boolean;
  cenario(r: HTMLElement, e: EstDoc, cen: string): void;
  dica: string;
  /** em vez dos modos do antigo (F1 F2 F10 F12): uma pesquisa própria (o construtor Campo → Condição → Valor das faturas) */
  construtor?: (cen: string) => string; filtrar?: (e: EstDoc, d: Doc) => boolean; chips?: (e: EstDoc) => [string, string][];
  /** 26 out. (ela: «faz como na Lista de Faltas, a cena das windows»): os detalhes abrem numa janela flutuante por
   *  documento, em vez do painel por baixo da lista; `estados` são os cenários do editor que já a mostram aberta */
  janelas?: { titulo: string; icone: string; estados: string[] };
  /** 27 out. (ela: «coloca isto num só ecrã»): outras vistas no mesmo ecrã, ao lado da lista dos documentos (a primeira,
   *  `docs`, é a lista); cada uma desenha a sua tabela com os filtros e a pesquisa de cima, e abre a janela do documento */
  vistas?: Vista[];
  /** 27 out. (briefing V3 das Encomendas): a janela das ligações — um só «inspetor» que segue a linha escolhida nas
   *  outras vistas e mostra a cadeia real (pedido → encomenda → entrega → receção); `chave` é a da linha */
  relacao?: { icone: string; titulo(r: HTMLElement, e: EstDoc, chave: string): string; corpo(r: HTMLElement, e: EstDoc, chave: string): string };
  /** o que vai para o topo de Mais ações (ações menos usadas que saem da barra) */
  maisTopo?: string;
}
export interface Vista { k: string; t: string; ic: string; tecla: string; titulo: string; tabela?(r: HTMLElement, e: EstDoc): string; resumo?(e: EstDoc): string }
export const CFGS = new Map<string, CfgDoc>();
export const registar = (c: CfgDoc) => { CFGS.set(c.k, c); return c; };

export const BTN = (k: string, ic: string, t: string, tecla: string, extra = '', cls = '') => `<button type="button" class="ak-btn${cls ? ` ${cls}` : ''}" data-dv2-acao="${k}"${tecla ? ` aria-keyshortcuts="${tecla}"${extra.includes('title=') ? '' : ` title="${t} (${tecla})"`}` : ''}${extra}>${L(ic)}<span>${t}</span>${tecla ? `<kbd>${tecla}</kbd>` : ''}</button>`;
const op = (v: string, t: string) => `<option value="${esc(v)}">${esc(t)}</option>`;

/** A pesquisa do ERP antigo por modos (F1 Número, F2 Data, F10 Código, F12 Descrição) e como compara (Shift+F1/F2). */
function pesquisaModos(id: (x: string) => string): string {
  return `<div class="ak-campo dv2-pesquisa" role="group" aria-labelledby="${id('pq-t')}">
        <span id="${id('pq-t')}">Pesquisar por</span>
        <div class="dv2-pq">
          <span class="dv2-modos" role="radiogroup" aria-label="Pesquisar por">${MODOS.map((m, i) => `<button type="button" role="radio" aria-checked="${i === 0}" data-dv2-modo="${m.k}" title="Visualizar por ${m.t.toLowerCase()} (${m.tecla})">${L(m.ic)}<span>${m.t}</span><kbd>${m.tecla}</kbd></button>`).join('')}</span>
          <span class="lf2-comp" role="radiogroup" aria-label="Como compara">
            <button type="button" role="radio" aria-checked="true" data-dv2-comp="inicio" title="Pesquisa iniciada por (Shift+F1)">Iniciado por</button>
            <button type="button" role="radio" aria-checked="false" data-dv2-comp="contem" title="Pesquisa contendo (Shift+F2)">Contendo</button>
          </span>
          <label class="lf2-pq-in">${L(search)}<input type="search" id="${id('q')}" data-dv2-q data-dv2-campo data-ak-primeiro autocomplete="off" placeholder="Número, ex.: 2026/04" aria-label="Pesquisar por número, iniciado por"></label>
        </div>
      </div>`;
}

/** A página de um documento num cenário. */
export function paginaDoc(c: CfgDoc, cen: string, fornecedores: [string, string][]): string {
  const id = (x: string) => `dv2-${c.k}-${x}-${cen}`;
  const campo = (k: string, t: string, input: string) => `<label class="ak-campo" for="${id(k)}"><span>${t}</span>${input}</label>`;
  return `<div class="hm ak lf2 dv2 dv2--${c.k}" data-hm data-dv2="${c.k}" data-dv2-cenario="${cen}" data-teclas="F1 F2 F4 F5 F6 F8 F9 F10 F11 F12 Escape${c.teclasExtra ? ` ${c.teclasExtra}` : ''}">
  ${topoErp(c.caminho)}
  <header class="ak-cab lf2-cab">
    <span class="ak-cab-ic">${L(c.icone)}</span>
    <div><h1>${esc(c.titulo)}</h1><p>${esc(c.sub)}</p></div>
    <nav class="dv2-trilho" data-dv2-trilho aria-label="Onde estou" hidden></nav>
    <span class="lf2-restaurada" data-dv2-restaurada hidden></span>
  </header>

  <div class="ak-barra lf2-barra dv2-barra" role="toolbar" aria-label="Ações">
    ${BTN('novo', plus, 'Novo', 'F5')}
    ${BTN('editar', pencil, 'Editar', 'F6')}
    ${BTN('anular', ban, 'Anular', 'F8')}
    <i class="ak-sep" aria-hidden="true"></i>
    ${BTN('atualizar', refresh, 'Atualizar', 'F9')}
    ${BTN('imprimir', printer, 'Imprimir', 'F11')}
    <i class="ak-sep" aria-hidden="true"></i>
    ${c.barra}
    ${BTN('anexos', paperclip, 'Anexos', '')}
    <span class="ak2-esp"></span>
    <span class="ak-menu-c">${BTN('mais', ellipsis, 'Mais ações', '', ' aria-haspopup="menu" aria-expanded="false"')}
      <div class="ak-menu ak-menu--dir lf2-menu-mais" role="menu" data-dv2-menu="mais" data-por-cima hidden></div></span>
  </div>

  <div class="dv2-lista-vista" data-dv2-lista>
  <section class="lf-filtros lf2-filtros dv2-filtros" aria-label="Pesquisa e filtros">
    <div class="dv2-rapidos">
      ${campo('serie', 'Série <kbd>F4</kbd>', `<select id="${id('serie')}" data-dv2-f="serie" data-dv2-campo>${op('', 'Todas')}${c.series().map((s) => op(s, s)).join('')}</select>`)}
      ${c.construtor ? '' : pesquisaModos(id)}
      ${campo('forn', 'Fornecedor', `<select id="${id('forn')}" data-dv2-f="forn" data-dv2-campo>${op('', 'Todos')}${fornecedores.map(([v, t]) => op(v, t)).join('')}</select>`)}
      ${campo('estado', 'Estado', `<select id="${id('estado')}" data-dv2-f="estado" data-dv2-campo>${c.estados.map(([v, t]) => op(v, t)).join('')}</select>`)}
      <button type="button" class="lf2-mais-f" data-dv2-acao="mais-filtros" aria-expanded="false" aria-controls="${id('av')}">${L(sliders)}<span>Mais filtros</span><small data-dv2-n-av></small>${L(chevronDown, 'lf2-seta')}</button>
    </div>
    ${c.construtor ? c.construtor(cen) : ''}
    <div class="lf2-avancados dv2-avancados" id="${id('av')}" data-dv2-av hidden>
      <div class="ak-campo dv2-periodo" role="group" aria-labelledby="${id('per')}"><span id="${id('per')}">Período</span><span class="ak2-per"><input type="date" id="${id('de')}" data-dv2-f="de" data-dv2-campo aria-label="Período — de"><i>a</i><input type="date" id="${id('ate')}" data-dv2-f="ate" data-dv2-campo aria-label="Período — até"></span></div>
      ${campo('moeda', 'Moeda', `<select id="${id('moeda')}" data-dv2-f="moeda" data-dv2-campo>${op('', 'Todas')}${op('EUR', 'EUR · euro')}</select>`)}
      <p class="lf2-av-dica">${esc(c.dica)}</p>
    </div>
    <div class="lf2-ativos" data-dv2-ativos aria-live="polite"></div>
  </section>

  <section class="lf2-lista dv2-lista" aria-labelledby="${id('lista-t')}">
    ${c.vistas ? `<div class="dv2-vistas" role="tablist" aria-label="Ver">${c.vistas.map((v, i) => `<button type="button" role="tab" aria-selected="${i === 0}"${i ? ' tabindex="-1"' : ''} data-dv2-vista="${v.k}" aria-keyshortcuts="${v.tecla}" title="${esc(v.t)} (${v.tecla.replace('+', ' ')})">${L(v.ic)}<span>${esc(v.t)}</span><small data-dv2-vista-n="${v.k}"></small></button>`).join('')}</div>` : ''}
    <div class="lf2-lista-cab"><h2 id="${id('lista-t')}" data-dv2-lista-t>${esc(c.titulo)}</h2><p class="lf2-resumo" data-dv2-resumo></p></div>
    <div class="lf2-grelha" data-dv2-grelha></div>
    ${c.vistas ? '<div class="lf2-grelha dv2-vista-g" data-dv2-vista-g hidden></div>' : ''}
  </section>

  ${c.janelas ? '<div class="lf2-janelas" data-dv2-janelas data-por-cima></div>' : `  <div class="lf2-div" role="separator" aria-orientation="horizontal" aria-label="Altura da lista (↑ ↓)" aria-valuemin="200" aria-valuemax="900" aria-valuenow="340" tabindex="0" data-dv2-div>${L(gripH)}</div>

  <section class="lf2-insp dv2-insp" data-dv2-insp aria-labelledby="${id('insp-t')}">
    <header class="lf2-insp-cab">
      <h2 id="${id('insp-t')}" class="sr">Detalhes</h2>
      <span class="lf2-insp-art" data-dv2-alvo></span>
      <div class="lf2-tabs dv2-tabs" role="tablist" aria-label="Detalhes">${c.tabs.map((t, i) => `<button type="button" role="tab" id="${id(`t-${t.k}`)}" aria-controls="${id('p')}" aria-selected="${i === 0}"${i ? ' tabindex="-1"' : ''} data-dv2-tab="${t.k}">${L(t.ic)}${esc(t.t)}<small data-dv2-n-tab="${t.k}"></small></button>`).join('')}</div>
    </header>
    <div class="dv2-painel" role="tabpanel" id="${id('p')}" data-dv2-p tabindex="-1"></div>
  </section>
  `}
  </div>

  <section class="dv2-ficha" data-dv2-ficha aria-label="Ficha" hidden></section>

  <footer class="ak-estado lf2-estado" data-dv2-estado role="status" aria-live="polite"></footer>
  <div class="lf2-dlg-fundo" data-dv2-dlg data-por-cima hidden></div>
  <input type="file" data-dv2-ficheiro multiple hidden>
  <p class="hm-aviso" data-hm-aviso role="status" aria-live="polite"></p>
</div>`;
}
