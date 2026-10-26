/* =========================================================
   ERP — 20 · Lista de Faltas v2: o que mexe (26 out. 2026). Ver compras/faltas-v2.ts.
   Cada página (e cada estado no editor) tem o seu estado (WeakMap); tudo se desenha a partir dele.
     - Filtros: aplicam-se logo; as etiquetas dizem o que está ativo e tiram-se uma a uma; «Limpar filtros» repõe.
       Enter passa ao campo seguinte; na pesquisa, vai para a grelha.
     - Pesquisa como no ERP antigo: «Visualizar por» (F1 F2 F3 F4 F7 F10 F12) ordena a lista por esse campo e procura
       nele; Shift+F1 «Iniciado por», Shift+F2 «Contendo». Compara sem maiúsculas nem espaços, nada de aproximações.
     - Grelha: ordenar (Shift junta), filtrar por coluna, alargar, reordenar a arrastar, mostrar e esconder, linhas
       compactas ou normais, predefinições (Geral, Reposição, Fornecedor, Stock). Teclado: ↑ ↓ PgUp PgDn Home End mudam
       o artigo, Espaço e Shift+↑ ↓ escolhem vários, Enter abre a ficha do artigo. Acima de 150 linhas só se desenham as
       que se veem (o protótipo tem poucas).
     - Escolher um artigo: a referência voa da linha para o painel de baixo, que muda sem recarregar a página.
     - Barra: Novo (F5, desligado como no antigo), Editar (F6), Apagar (F8), Atualizar (F9), Imprimir (F11).
     - Ações de compra (Ctrl+F1…F9). «Para encomenda» e «Criar encomenda» gravam no protótipo (dominio.guardar/criar),
       com as regras de lá: só no rascunho, só com o perfil de Compras, só artigos do fornecedor da encomenda.
     - Guarda-se neste computador o que se estava a ver (filtros, visualização, colunas, artigo) e as vistas — nunca dados.
   Movimento só em transform/opacity, 80–280 ms; com «reduzir movimento», muda logo.
   ========================================================= */
import { linhas2, rotatividade, COLS2, PREDEF, MODOS, ACOES_COMPRA, SEMANAS_MAX, type Linha2, type Col2, type Cen2 } from './faltas-v2';
import { encomendaAtiva } from './faltas';
import { artigo, fornecedor, totais, euros, dia, HOJE, guardar, criar, pode, Recusa, type LinhaEnc } from './dominio';
import { perfilDaSessao } from '../sessao';
import type { IdPerfil } from '../inicio-dados';
import { xlsx, descarregar, type Celula } from './xlsx';
import { mostrar } from '../../../comum/ecras';
import { L, esc } from '../espaco';
import xIc from 'lucide-static/icons/x.svg?raw';
import check from 'lucide-static/icons/check.svg?raw';
import arrowUp from 'lucide-static/icons/arrow-up.svg?raw';
import arrowDown from 'lucide-static/icons/arrow-down.svg?raw';
import packageX from 'lucide-static/icons/package-x.svg?raw';
import triangle from 'lucide-static/icons/triangle-alert.svg?raw';
import linkIc from 'lucide-static/icons/link.svg?raw';
import packageCheck from 'lucide-static/icons/package-check.svg?raw';
import zap from 'lucide-static/icons/zap.svg?raw';
import searchX from 'lucide-static/icons/search-x.svg?raw';
import circleCheck from 'lucide-static/icons/circle-check.svg?raw';
import circleAlert from 'lucide-static/icons/circle-alert.svg?raw';
import wifiOff from 'lucide-static/icons/wifi-off.svg?raw';
import serverOff from 'lucide-static/icons/server-off.svg?raw';
import logIn from 'lucide-static/icons/log-in.svg?raw';
import loader from 'lucide-static/icons/loader.svg?raw';
import refresh from 'lucide-static/icons/refresh-cw.svg?raw';
import calculator from 'lucide-static/icons/calculator.svg?raw';
import external from 'lucide-static/icons/external-link.svg?raw';
import shoppingCart from 'lucide-static/icons/shopping-cart.svg?raw';
import plus from 'lucide-static/icons/plus.svg?raw';
import trash from 'lucide-static/icons/trash-2.svg?raw';
import funnel from 'lucide-static/icons/funnel.svg?raw';
import bookmark from 'lucide-static/icons/bookmark.svg?raw';
import sheet from 'lucide-static/icons/file-spreadsheet.svg?raw';
import building from 'lucide-static/icons/building-2.svg?raw';
import box from 'lucide-static/icons/box.svg?raw';
import undo from 'lucide-static/icons/undo-2.svg?raw';
import pencil from 'lucide-static/icons/pencil.svg?raw';

/* ---------- o estado ---------- */
interface Filtros { armazem: string; classe: string; stock: string; ind: boolean; auto: boolean; encForn: string; encCli: string; clRep: string; diarias: boolean }
const F0 = (): Filtros => ({ armazem: '', classe: '', stock: '', ind: false, auto: false, encForn: '', encCli: '', clRep: '', diarias: false });
type Fase = 'ok' | 'carregar' | 'atualizar' | 'gerar' | 'erro';
type Erro = 'servidor' | 'offline' | 'sessao';
interface Vista { id: string; nome: string; f: Filtros; modo: string; comp: string; cols: string[]; ocultas: string[]; ordem: Ord[]; dens: string }
interface Ord { k: string; dir: 1 | -1 }
interface Est {
  f: Filtros; modo: string; comp: 'inicio' | 'contem'; q: string;
  cols: string[]; ocultas: Set<string>; larg: Record<string, number>; ordem: Ord[]; filtrosCol: Record<string, string>; filtrosAbertos: boolean;
  dens: 'compacta' | 'normal'; predef: string; sel: Set<string>; ativo: string; ancora: string;
  fase: Fase; erro?: Erro; perfil: IdPerfil; sugestao: boolean; alt: number; tab: string; dias: number;
  vazia: boolean; semAtiva: boolean; detCarregar: boolean; gravar: boolean; aviso: string; recusa: string; hora: number;
  vistas: Vista[]; editor: boolean;
}
const estados = new WeakMap<HTMLElement, Est>();
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
/* no editor, com «Interagir» ligado (26 out.), o ecrã responde como no protótipo */
const editando = () => (document.body.classList.contains('editando') && !document.body.classList.contains('ed-interagir')) || document.body.classList.contains('com-fluxo');
const raiz = (t: Element | null) => t?.closest<HTMLElement>('[data-lf2]') ?? null;
const visivel = () => document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) [data-lf2]');
const nf = (v: number) => v.toLocaleString('pt-PT');
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, '');
const col = (k: string) => COLS2.find((c) => c.k === k)!;
const modoDe = (k: string) => MODOS.find((m) => m.k === k) ?? MODOS[0];
const CHAVE = (e: Est) => `erp:faltas2:${e.perfil}`;
const DADOS = 'erp:faltas2:dados';

/* as faltas apagadas e as editadas (neste protótipo, guardadas neste computador) */
interface Dados { apagadas: string[]; editadas: Record<string, { pedida: number; tipo: Linha2['tipo'] }> }
function dados(): Dados { try { const d = JSON.parse(localStorage.getItem(DADOS) ?? 'null') as Dados | null; if (d?.apagadas && d.editadas) return d; } catch { /* sem armazenamento */ } return { apagadas: [], editadas: {} }; }
function gravarDados(d: Dados): boolean { try { localStorage.setItem(DADOS, JSON.stringify(d)); return true; } catch { return false; } }

/** As faltas que existem (sem as apagadas e com as alterações), com o que já está na encomenda ativa. */
function base(e: Est): (Linha2 & { naEnc: number })[] {
  if (e.vazia) return [];
  const d = dados(), enc = e.semAtiva ? undefined : encomendaAtiva();
  return linhas2().filter((l) => !d.apagadas.includes(l.ref)).map((l) => {
    const m = d.editadas[l.ref], naEnc = enc?.linhas.filter((x) => x.ref === l.ref).reduce((s, x) => s + x.qtd, 0) ?? 0;
    return { ...l, ...(m ?? {}), naEnc };
  });
}
type L2 = ReturnType<typeof base>[number];
function valor(l: L2, k: string): string | number {
  if (k === 'estado') return l.stock <= 0 ? 0 : 1;
  if (k === 'opcoes') return l.opcoes.join(' ');
  const v = (l as unknown as Record<string, unknown>)[k];
  return typeof v === 'number' ? v : String(v ?? '');
}
function texto(l: L2, k: string): string {
  if (k === 'estado') return [l.stock <= 0 ? 'Rutura' : 'Stock insuficiente', l.encomendada ? 'Encomenda associada' : '', l.naEnc ? 'Reposição pendente' : ''].filter(Boolean).join(', ');
  if (k === 'rutura') return dia(l.rutura);
  if (k === 'clRep') return `${l.clRep} ${l.clRepDesc}`;
  return String(valor(l, k));
}
function filtradas(e: Est): L2[] {
  const f = e.f, m = modoDe(e.modo), q = norm(e.q);
  const ls = base(e).filter((l) => (!f.classe || l.classe === f.classe)
    && (!f.stock || (f.stock === 'rutura' ? l.stock <= 0 : l.estado === 'baixo'))
    && (!(f.ind || f.auto) || (f.ind && l.ind === 'Indústria') || (f.auto && l.ind === 'Auto'))
    && (!f.encForn || (f.encForn === 'com' ? l.encomendada > 0 : l.encomendada === 0))
    && (!f.encCli || (f.encCli === 'com' ? l.encCli : !l.encCli))
    && (!f.clRep || l.clRep === f.clRep) && (!f.diarias || l.rutura === HOJE)
    && (!q || (e.comp === 'inicio' ? norm(String(valor(l, m.campo))).startsWith(q) : norm(String(valor(l, m.campo))).includes(q)))
    && Object.entries(e.filtrosCol).every(([k, v]) => !v.trim() || norm(texto(l, k)).includes(norm(v))));
  const ordem = e.ordem.length ? e.ordem : [{ k: m.campo, dir: 1 as const }, { k: 'ref', dir: 1 as const }];
  return ls.sort((a, b) => { for (const o of ordem) { const x = valor(a, o.k), y = valor(b, o.k); const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'pt', { numeric: true }); if (c) return c * o.dir; } return 0; });
}
function novo(): Est {
  return { f: F0(), modo: 'codigo', comp: 'inicio', q: '', cols: [...COLS2.map((c) => c.k)], ocultas: new Set(COLS2.filter((c) => !PREDEF.geral[1].includes(c.k)).map((c) => c.k)), larg: {}, ordem: [], filtrosCol: {}, filtrosAbertos: false,
    dens: 'compacta', predef: 'geral', sel: new Set(), ativo: '', ancora: '', fase: 'ok', perfil: perfilDaSessao(), sugestao: false, alt: 380, tab: 'stock', dias: 30,
    vazia: false, semAtiva: false, detCarregar: false, gravar: false, aviso: '', recusa: '', hora: Date.now(), vistas: lerVistas(perfilDaSessao()), editor: editando() };
}
const de = (r: HTMLElement) => { let e = estados.get(r); if (!e) { e = novo(); estados.set(r, e); } return e; };

/* ---------- guardar o que se estava a ver ---------- */
function guardarVista(e: Est): void {
  if (e.editor) return;
  try { localStorage.setItem(CHAVE(e), JSON.stringify({ f: e.f, modo: e.modo, comp: e.comp, q: e.q, cols: e.cols, ocultas: [...e.ocultas], larg: e.larg, ordem: e.ordem, dens: e.dens, predef: e.predef, ativo: e.ativo, alt: e.alt, tab: e.tab, dias: e.dias, quando: Date.now() })); } catch { /* sem armazenamento: fica só nesta página */ }
}
function repor(e: Est): number | null {
  try {
    const v = JSON.parse(localStorage.getItem(CHAVE(e)) ?? 'null'); if (!v) return null;
    Object.assign(e, { f: { ...F0(), ...v.f }, modo: v.modo, comp: v.comp, q: v.q ?? '', larg: v.larg ?? {}, ordem: v.ordem ?? [], dens: v.dens, predef: v.predef, ativo: v.ativo ?? '', alt: v.alt ?? 380, tab: v.tab ?? 'stock', dias: v.dias ?? 30 });
    if (Array.isArray(v.cols) && v.cols.length === COLS2.length) e.cols = v.cols; e.ocultas = new Set(v.ocultas ?? []);
    return v.quando ?? null;
  } catch { return null; }
}
function lerVistas(p: IdPerfil): Vista[] { try { return JSON.parse(localStorage.getItem(`erp:faltas2:vistas:${p}`) ?? '[]') as Vista[]; } catch { return []; } }
function gravarVistas(e: Est, vs: Vista[]): boolean { try { localStorage.setItem(`erp:faltas2:vistas:${e.perfil}`, JSON.stringify(vs)); e.vistas = vs; return true; } catch { return false; } }

/* ---------- avisos ---------- */
const avisos = new WeakMap<HTMLElement, number>();
function toast(r: HTMLElement, t: string): void {
  const p = r.querySelector<HTMLElement>('[data-hm-aviso]'); if (!p) return;
  p.textContent = t; p.classList.add('is-visivel'); clearTimeout(avisos.get(r));
  avisos.set(r, window.setTimeout(() => p.classList.remove('is-visivel'), 3200));
}

/* ---------- desenhar: os filtros e as etiquetas ---------- */
function filtrosNaPagina(r: HTMLElement, e: Est): void {
  const s = (k: string, v: string) => { const el = r.querySelector<HTMLSelectElement>(`select[data-lf2-f="${k}"]`); if (el) el.value = v; };
  s('armazem', e.f.armazem); s('classe', e.f.classe); s('stock', e.f.stock); s('encForn', e.f.encForn); s('encCli', e.f.encCli);
  r.querySelectorAll<HTMLInputElement>('input[type="checkbox"][data-lf2-f]').forEach((c) => { c.checked = !!e.f[c.dataset.lf2F as 'ind' | 'auto']; });
  const m = modoDe(e.modo), q = r.querySelector<HTMLInputElement>('[data-lf2-q]')!;
  if (q.value !== e.q) q.value = e.q;
  q.placeholder = m.dica; q.setAttribute('aria-label', `Pesquisa: ${m.t.toLowerCase()}, ${e.comp === 'inicio' ? 'iniciado por' : 'contendo'}`);
  r.querySelector<HTMLElement>('[data-lf2-vis-t]')!.textContent = m.t;
  r.querySelectorAll<HTMLElement>('[data-lf2-modo]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.lf2Modo === e.modo)));
  r.querySelectorAll<HTMLElement>('[data-lf2-comp]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.lf2Comp === e.comp)));
  const nAv = [e.f.ind, e.f.auto, e.f.encForn, e.f.encCli].filter(Boolean).length;
  r.querySelector<HTMLElement>('[data-lf2-n-av]')!.textContent = nAv ? String(nAv) : '';
  etiquetas(r, e);
}
function etiquetas(r: HTMLElement, e: Est): void {
  const caixa = r.querySelector<HTMLElement>('[data-lf2-ativos]')!, f = e.f;
  const sel = (k: string) => r.querySelector<HTMLSelectElement>(`select[data-lf2-f="${k}"]`);
  const nome = (k: string) => sel(k)?.selectedOptions[0]?.textContent ?? '';
  const ch: [string, string][] = [];
  if (f.armazem) ch.push(['armazem', `Armazém ${nome('armazem')}`]);
  if (f.classe) ch.push(['classe', `Classe ${f.classe}`]);
  if (f.stock) ch.push(['stock', nome('stock')]);
  if (f.ind) ch.push(['ind', 'Indústria']); if (f.auto) ch.push(['auto', 'Auto']);
  if (f.encForn) ch.push(['encForn', nome('encForn')]); if (f.encCli) ch.push(['encCli', nome('encCli')]);
  if (f.clRep) ch.push(['clRep', `Classe de reposição ${f.clRep}`]);
  if (f.diarias) ch.push(['diarias', `Ruturas de ${dia(HOJE)}`]);
  if (e.q) ch.push(['q', `${modoDe(e.modo).t} ${e.comp === 'inicio' ? 'iniciado por' : 'contendo'} «${e.q}»`]);
  const ncol = Object.values(e.filtrosCol).filter((v) => v.trim()).length;
  if (ncol) ch.push(['colunas', `${ncol} ${ncol === 1 ? 'filtro de coluna' : 'filtros de coluna'}`]);
  const antes = new Set([...caixa.querySelectorAll<HTMLElement>('[data-lf2-chip]')].map((c) => c.dataset.lf2Chip));
  caixa.innerHTML = ch.length ? `${ch.map(([k, t]) => `<span class="lf2-chip${antes.has(k) ? '' : ' is-nova'}" data-lf2-chip="${k}">${esc(t)}<button type="button" aria-label="Tirar o filtro ${esc(t)}" data-lf2-tirar="${k}">${L(xIc)}</button></span>`).join('')}<button type="button" class="lf2-limpar" data-lf2-acao="limpar">${L(undo)}<span>Limpar filtros</span></button>` : '';
  caixa.hidden = !ch.length;
}

/* ---------- desenhar: a grelha ---------- */
/* 26 out. (ela: «não quero dois scrolls!»): a grelha já não rola sozinha, por isso desenha todas as linhas */
const VLIM = Number.POSITIVE_INFINITY;
const vis = (e: Est) => e.cols.filter((k) => !e.ocultas.has(k) && (k !== 'sugestao' || e.sugestao)).map(col);
function celula(l: L2, c: Col2): string {
  const n = (v: number) => v ? `${nf(v)}<small>${esc(l.un)}</small>` : '<span class="is-nada">—</span>';
  switch (c.k) {
    case 'ref': return `<span class="lf2-art"><b data-lf2-ref-t>${esc(l.ref)}</b><small>${esc(l.marca)} · ${esc(l.desc)}</small></span>`;
    case 'estado': return `<span class="lf2-badges">${l.stock <= 0 ? `<span class="lf2-b lf2-b--rutura">${L(packageX)}Rutura</span>` : `<span class="lf2-b lf2-b--baixo">${L(triangle)}Stock insuficiente</span>`}${l.encomendada ? `<span class="lf2-b lf2-b--enc" title="${nf(l.encomendada)} ${esc(l.un)} em encomendas a fornecedor em curso">${L(linkIc)}Encomenda</span>` : ''}${l.naEnc ? `<span class="lf2-b lf2-b--pend" title="${nf(l.naEnc)} ${esc(l.un)} no rascunho da encomenda ativa">${L(packageCheck)}Reposição pendente</span>` : ''}</span>`;
    case 'classe': return `<span class="lf2-classe">${l.classe}</span>`;
    case 'rutura': return `<span class="${l.rutura === HOJE ? 'lf2-hoje' : ''}">${dia(l.rutura)}</span>`;
    case 'tipo': return l.tipo === 'Urgente' ? `<span class="lf2-tag lf2-tag--urg">${L(zap)}Urgente</span>` : `<span class="lf2-tag">${l.tipo}</span>`;
    case 'opcoes': return l.opcoes.length ? l.opcoes.map((o) => `<span class="lf2-tag">${esc(o)}</span>`).join(' ') : '<span class="is-nada">—</span>';
    case 'clRep': return `<span class="lf2-clrep"><b>${esc(l.clRep)}</b><small>${esc(l.clRepDesc)}</small></span>`;
    case 'encomendada': case 'pedida': case 'sugestao': return n(valor(l, c.k) as number);
    case 'stock': return `<b class="${l.stock <= 0 ? 'is-rutura' : ''}">${nf(l.stock)}</b><small>${esc(l.un)}</small>`;
    case 'min': return `${nf(l.min)}<small>${esc(l.un)}</small>`;
    default: { const v = String(valor(l, c.k)); return v && v !== '—' ? esc(v) : '<span class="is-nada">—</span>'; }
  }
}
function vazio(ic: string, t: string, d: string, botao = ''): string { return `<div class="ak-vazio lf2-vazio">${L(ic)}<p><b>${t}</b>${d}</p>${botao}</div>`; }
const BT = (acao: string, ic: string, t: string, cls = '') => `<button type="button" class="ak-btn${cls}" data-lf2-acao="${acao}">${L(ic)}<span>${t}</span></button>`;
function grelha(r: HTMLElement, e: Est, animar = false): void {
  const g = r.querySelector<HTMLElement>('[data-lf2-grelha]')!;
  r.classList.toggle('is-compacta', e.dens === 'compacta');
  r.classList.toggle('is-ocupada', e.fase === 'atualizar' || e.fase === 'gerar');
  if (e.fase === 'carregar') { g.innerHTML = `<div class="lf2-esq" aria-label="A carregar as faltas">${Array.from({ length: 9 }, (_, i) => `<i style="--i:${i}"></i>`).join('')}</div>`; return; }
  if (e.fase === 'erro') {
    const [ic, t, d] = e.erro === 'offline' ? [wifiOff, 'Sem ligação à rede.', 'A lista precisa do servidor. Os filtros ficam; tenta outra vez quando a ligação voltar.']
      : e.erro === 'sessao' ? [logIn, 'A sessão terminou.', 'Volta a entrar para continuar. Os filtros e o artigo escolhido ficam neste ecrã.']
      : [serverOff, 'O servidor das compras não respondeu.', 'Não foi possível ler as faltas (ERP-COMP-503). Os filtros ficam.'];
    g.innerHTML = vazio(ic, t, d, e.erro === 'sessao' ? `<button type="button" class="ak-btn ak-btn--acao" data-login>${L(logIn)}<span>Voltar a entrar</span></button>` : BT('repetir', refresh, 'Tentar outra vez', ' ak-btn--acao')); return;
  }
  const todas = base(e), ls = filtradas(e), cs = vis(e);
  if (!todas.length) { g.innerHTML = vazio(circleCheck, 'Sem faltas.', 'Nenhum artigo está em rutura nem abaixo do stock mínimo.', BT('gerar', refresh, 'Gerar ruturas')); return; }
  if (!cs.length) { g.innerHTML = vazio(funnel, 'Não há colunas à vista.', 'Escolhe pelo menos uma em Mais ações.', BT('todas-colunas', check, 'Mostrar as colunas do Geral')); return; }
  if (!ls.length) {
    g.innerHTML = e.q ? vazio(searchX, `Nada encontrado para «${esc(e.q)}».`, `Procura-se em «${modoDe(e.modo).t}», ${e.comp === 'inicio' ? 'no início' : 'em qualquer parte'}. Experimenta Contendo (Shift+F2) ou outra visualização.`, BT('limpar-q', xIc, 'Limpar a pesquisa'))
      : vazio(searchX, 'Nenhuma falta com estes filtros.', `Há ${nf(todas.length)} ${todas.length === 1 ? 'falta' : 'faltas'} sem eles. Tira um filtro, ou limpa-os.`, BT('limpar', undo, 'Limpar filtros'));
    return;
  }
  if (!ls.some((l) => l.ref === e.ativo) && e.ativo !== '-') e.ativo = ls[0].ref;
  const antes = new Map<string, number>(); if (animar && !quieto()) g.querySelectorAll<HTMLElement>('tr[data-lf2-ref]').forEach((t) => antes.set(t.dataset.lf2Ref!, t.getBoundingClientRect().top));
  const sc = g.scrollTop, sl = g.scrollLeft, w = (c: Col2) => e.larg[c.k] ?? c.w;
  const ord = (k: string) => { const i = e.ordem.findIndex((o) => o.k === k); return i < 0 ? '' : `<span class="lf2-ord">${L(e.ordem[i].dir === 1 ? arrowUp : arrowDown)}${e.ordem.length > 1 ? `<i>${i + 1}</i>` : ''}</span>`; };
  const sort = (k: string) => { const o = e.ordem.find((x) => x.k === k); return o ? (o.dir === 1 ? 'ascending' : 'descending') : 'none'; };
  const campoModo = modoDe(e.modo).campo;
  const cab = `<tr><th class="lf2-th-sel is-presa"><input type="checkbox" aria-label="Escolher todas" data-lf2-todas${ls.every((l) => e.sel.has(l.ref)) ? ' checked' : ''}></th>${cs.map((c) => `<th scope="col" class="${c.presa ? 'is-presa is-presa2 ' : ''}${c.tipo === 'n' ? 'is-num ' : ''}${c.k === campoModo ? 'is-modo' : ''}" aria-sort="${sort(c.k)}" draggable="true" data-lf2-col="${c.k}"><button type="button" data-lf2-ordenar="${c.k}" title="Ordenar (Shift junta outra ordem)">${esc(c.t)}${ord(c.k)}</button><i class="lf2-redim" data-lf2-redim="${c.k}" aria-hidden="true"></i></th>`).join('')}</tr>`
    + (e.filtrosAbertos ? `<tr class="lf2-filtros-col"><th class="is-presa"></th>${cs.map((c) => `<th class="${c.presa ? 'is-presa is-presa2' : ''}"><input type="search" data-lf2-fcol="${c.k}" value="${esc(e.filtrosCol[c.k] ?? '')}" aria-label="Filtrar ${esc(c.t)}" placeholder="Filtrar…"></th>`).join('')}</tr>` : '');
  /* acima de VLIM linhas, só as que se veem (mais uma margem) */
  const hl = e.dens === 'compacta' ? 34 : 42, virtual = ls.length > VLIM;
  const ini = virtual ? Math.max(0, Math.floor(sc / hl) - 15) : 0, fim = virtual ? Math.min(ls.length, ini + Math.ceil((g.clientHeight || 600) / hl) + 30) : ls.length;
  const linha = (l: L2) => { const s = e.sel.has(l.ref), a = l.ref === e.ativo;
    return `<tr data-lf2-ref="${esc(l.ref)}" tabindex="${a ? 0 : -1}" aria-selected="${s}" class="${a ? 'is-ativo' : ''}${l.stock <= 0 ? ' is-rutura' : ''}"><td class="lf2-td-sel is-presa"><input type="checkbox" tabindex="-1" aria-label="Escolher ${esc(l.ref)}" data-lf2-escolher="${esc(l.ref)}"${s ? ' checked' : ''}></td>${cs.map((c) => `<td class="${c.presa ? 'is-presa is-presa2 ' : ''}${c.tipo === 'n' ? 'is-num ' : ''}${c.tipo === 'mono' ? 'is-mono ' : ''}${c.k === campoModo ? 'is-modo' : ''}" data-col="${c.k}">${celula(l, c)}</td>`).join('')}</tr>`; };
  const corpo = (virtual && ini ? `<tr class="lf2-esp" aria-hidden="true"><td colspan="${cs.length + 1}" style="height:${ini * hl}px"></td></tr>` : '')
    + ls.slice(ini, fim).map(linha).join('')
    + (virtual && fim < ls.length ? `<tr class="lf2-esp" aria-hidden="true"><td colspan="${cs.length + 1}" style="height:${(ls.length - fim) * hl}px"></td></tr>` : '');
  g.innerHTML = `<table class="lf2-tab" aria-label="Artigos em rutura" aria-rowcount="${ls.length}" aria-multiselectable="true"><colgroup><col style="width:36px">${cs.map((c) => `<col data-lf2-w="${c.k}" style="width:${w(c)}px">`).join('')}</colgroup><thead>${cab}</thead><tbody>${corpo}</tbody></table>`;
  g.scrollTop = sc; g.scrollLeft = sl;
  g.dataset.lf2Virtual = virtual ? '1' : '';
  if (animar && !quieto()) g.querySelectorAll<HTMLElement>('tbody tr[data-lf2-ref]').forEach((t, i) => {
    const a = antes.get(t.dataset.lf2Ref!), b = t.getBoundingClientRect().top;
    if (a !== undefined && Math.abs(a - b) > 1) t.animate([{ transform: `translateY(${a - b}px)` }, { transform: 'none' }], { duration: 220, easing: 'cubic-bezier(.22, 1, .36, 1)' });
    else if (a === undefined && i < 30) t.animate([{ opacity: 0, transform: 'translateY(3px)' }, { opacity: 1, transform: 'none' }], { duration: 180, delay: Math.min(i, 12) * 12, easing: 'ease-out', fill: 'backwards' });
  });
}
function resumo(r: HTMLElement, e: Est): void {
  const p = r.querySelector<HTMLElement>('[data-lf2-resumo]')!;
  if (e.fase === 'carregar' || e.fase === 'erro') { p.innerHTML = ''; return; }
  const ls = filtradas(e), ru = ls.filter((l) => l.stock <= 0).length, en = ls.filter((l) => l.encomendada > 0).length;
  p.innerHTML = ls.length ? `<span><b>${nf(ru)}</b> em rutura</span><span><b>${nf(ls.length - ru)}</b> com stock insuficiente</span><span><b>${nf(en)}</b> com encomenda associada</span>${e.sugestao ? `<span class="lf2-resumo-ajuda">${L(calculator)}Qtd. sugerida = 2 × mínimo + em rutura − stock − encomendada, arredondada à qtd. económica</span>` : ''}` : '';
}
function estado(r: HTMLElement, e: Est): void {
  const ls = e.fase === 'ok' || e.fase === 'atualizar' || e.fase === 'gerar' ? filtradas(e) : [], todas = e.fase === 'ok' ? base(e).length : 0, m = modoDe(e.modo);
  const fase = e.fase === 'carregar' ? 'A carregar…' : e.fase === 'atualizar' ? 'A atualizar…' : e.fase === 'gerar' ? 'A gerar ruturas…' : e.fase === 'erro' ? 'Sem dados' : e.gravar ? 'A gravar na encomenda…' : 'Pronto';
  r.querySelector<HTMLElement>('[data-lf2-estado]')!.innerHTML = `<span>Artigos <b>${nf(ls.length)}</b>${todas && todas !== ls.length ? ` de ${nf(todas)}` : ''}</span><span>Escolhidos <b>${nf(e.sel.size)}</b></span><span>Visualização por <b>${esc(m.t)}</b> · ${e.comp === 'inicio' ? 'iniciado por' : 'contendo'}</span><span>Atualizado às <b>${new Date(e.hora).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</b></span><span class="ak-estado-f is-${e.fase === 'ok' && !e.gravar ? 'ok' : 'a-gerar'}">${e.fase === 'ok' && !e.gravar ? '' : L(loader)}${fase}</span>${e.aviso ? `<span class="ak-estado-aviso">${esc(e.aviso)}</span>` : ''}`;
  /* a barra: o que não se pode fazer diz porquê */
  const a = ativo(e), escreve = pode(e.perfil, 'editar');
  const porque: Record<string, string> = {
    editar: !escreve ? 'O teu perfil só consulta a Lista de Faltas.' : !a ? 'Escolhe uma falta na lista.' : '',
    apagar: !escreve ? 'O teu perfil só consulta a Lista de Faltas.' : !a && !e.sel.size ? 'Escolhe uma falta na lista.' : '',
    atualizar: e.fase === 'atualizar' || e.fase === 'gerar' ? 'A lista já está a ser lida.' : '',
    imprimir: !ls.length ? 'Não há linhas para imprimir.' : '',
  };
  Object.entries(porque).forEach(([k, t]) => { const b = r.querySelector<HTMLElement>(`.lf2-barra [data-lf2-acao="${k}"]`); if (!b) return; b.setAttribute('aria-disabled', String(!!t)); if (t) b.title = t; else b.removeAttribute('title'); });
  r.querySelector<HTMLElement>('[data-lf2-acao="atualizar"]')?.classList.toggle('is-carregar', e.fase === 'atualizar');
}
const ativo = (e: Est): L2 | undefined => e.fase === 'ok' || e.fase === 'atualizar' || e.fase === 'gerar' ? filtradas(e).find((l) => l.ref === e.ativo) : undefined;

/* ---------- desenhar: a encomenda ativa ---------- */
function encomendaAside(r: HTMLElement, e: Est, realcar = false): void {
  const a = r.querySelector<HTMLElement>('[data-lf2-ativa]')!, enc = e.semAtiva ? undefined : encomendaAtiva(), l = ativo(e);
  if (e.fase === 'carregar') { a.innerHTML = '<div class="lf2-esq lf2-esq--peq"><i></i><i></i><i></i></div>'; return; }
  if (!enc) {
    a.innerHTML = `<h2 class="lf2-ativa-t">${L(shoppingCart)}Encomenda ativa</h2><div class="lf2-ativa-vazia"><p><b>Não há encomenda ativa.</b>Os artigos escolhidos precisam de um rascunho para onde ir.${l ? ` Cria-se para ${esc(l.fornNome)}, o fornecedor do artigo escolhido.` : ''}</p>${l ? `<button type="button" class="ak-btn ak-btn--acao" data-lf2-acao="criar-enc">${L(plus)}<span>Criar encomenda</span></button>` : ''}</div>`;
    return;
  }
  const t = totais(enc), f = fornecedor(enc.forn), noEnc = l ? enc.linhas.filter((x) => x.ref === l.ref).reduce((s, x) => s + x.qtd, 0) : 0, outro = l && l.forn !== enc.forn;
  a.innerHTML = `<h2 class="lf2-ativa-t">${L(shoppingCart)}Encomenda ativa</h2>
    <div class="lf2-ativa-doc${realcar ? ' is-realce' : ''}"><b class="lf2-ativa-ref">${esc(enc.ref)}</b><span class="lf2-b lf2-b--rasc">${esc(enc.estado)}</span></div>
    <dl class="lf2-ativa-dl"><div><dt>Data</dt><dd>${dia(enc.data)}</dd></div><div><dt>Fornecedor</dt><dd>${esc(f?.nome ?? enc.forn)}<small>Conta ${esc(enc.forn)}</small></dd></div>
      <div><dt>Valor líquido</dt><dd class="lf2-ativa-valor">${euros(t.liquido)}</dd></div><div><dt>Linhas</dt><dd>${nf(enc.linhas.length)}</dd></div>
      ${l ? `<div class="lf2-ativa-art"><dt>${esc(l.ref)}</dt><dd>${outro ? `<span class="lf2-b lf2-b--baixo">${L(triangle)}De outro fornecedor</span>` : noEnc ? `<span class="lf2-b lf2-b--pend">${L(packageCheck)}${nf(noEnc)} ${esc(l.un)} nesta encomenda</span>` : 'Ainda não está nesta encomenda'}</dd></div>` : ''}</dl>
    ${e.recusa ? `<p class="lf2-recusa" role="alert">${L(circleAlert)}${esc(e.recusa)}</p>` : ''}
    <div class="lf2-ativa-acoes">
      <button type="button" class="ak-btn ak-btn--acao${e.gravar ? ' is-carregar' : ''}" data-lf2-acao="para-encomenda"${e.gravar ? ' aria-disabled="true"' : ''}>${L(e.gravar ? loader : plus)}<span>${e.gravar ? 'A gravar…' : 'Para encomenda'}</span><kbd>Ctrl F7</kbd></button>
      <button type="button" class="ak-btn ak-btn--linha" data-lf2-acao="encomenda" data-lf2-doc="${esc(enc.ref)}">${L(external)}<span>Abrir</span><kbd>Ctrl F6</kbd></button>
    </div>`;
}

/* ---------- desenhar: o artigo escolhido ---------- */
/* ---------- os detalhes de cada artigo numa janela flutuante (26 out., ela: «era engraçado as coisas funcionarem
   como este quadrado» — a janela de contexto da área de trabalho). Arrasta-se pelo cabeçalho, redimensiona-se pelo
   canto, minimiza-se, maximiza-se e fecha-se; várias ao mesmo tempo, em cascata; a da frente é a última tocada. */
interface Jan { ref: string; x: number; y: number; w: number; h: number; min: boolean; max: boolean; z: number; dias: number; ed?: Edicao }
/** Editar na janela do artigo (26 out., ela: «o editar também numa janela; atenção a editar um artigo aberto»): a janela
 *  que já mostrava o artigo passa a ficha (não se abre outra); `base` são os valores ao começar, para ver, ao gravar,
 *  se outra pessoa (ou outro separador) mudou a falta entretanto. */
interface Edicao { q: string; tipo: string; erro: string; sujo: boolean; base: { pedida: number; tipo: string }; pergunta?: 'fechar' | 'cancelar' | 'mudou' }
const janelas = new WeakMap<Est, Jan[]>();
const jans = (e: Est) => { let j = janelas.get(e); if (!j) { j = []; janelas.set(e, j); } return j; };
let zTopo = 10;
const doArtigo = (e: Est, ref: string) => base(e).find((l) => l.ref === ref);
/** O corpo de uma janela: o artigo, as ligações, o stock, as classes de reposição e a rotatividade. */
function corpoJanela(e: Est, l: L2 | undefined, dias: number): string {
  if (e.detCarregar) return `<div class="lf2-esq lf2-esq--peq" aria-label="A carregar"><i></i><i></i><i></i><i></i><i></i></div>`;
  if (!l) return `<p class="lf2-sem">${L(box)}O artigo já não está na Lista de Faltas (foi apagado ou gerado outra vez).</p>`;
  /* 26 out. (ela: «parece confuso»): cada coisa uma vez, em blocos curtos — os números do artigo em cima, depois o
     stock, a reposição, a rotatividade e os preços */
  const a = artigo(l.ref), un = esc(l.un);
  const rt = rotatividade(l, dias), saldo = rt.entradas - rt.saidas, desde = new Date(Date.parse(HOJE) - rt.semanas * 7 * 86_400_000).toISOString().slice(0, 10);
  const nada = '<span class="is-nada" title="Ainda não está no protótipo">—</span>';
  const d = (t: string, v: string) => `<div><dt>${t}</dt><dd>${v}</dd></div>`;
  const num = (t: string, v: number, cls = '') => `<div class="${cls}"><small>${t}</small><b>${nf(v)}</b><i>${un}</i></div>`;
  return `<p class="lf2-jan-desc">${esc(l.desc)} · ${esc(l.marca)}</p>
    <div class="lf2-jan-ir"><button type="button" class="ak-btn" data-dk-janela="artigo:${esc(l.ref)}" data-lf2-acao="ficha">${L(box)}<span>Ficha do artigo</span></button><button type="button" class="ak-btn" data-dk-janela="fornecedor:${esc(l.forn)}" data-lf2-acao="ficha-forn">${L(building)}<span>${esc(l.fornNome)}</span></button></div>
    <div class="lf2-jan-nums">${num('Stock', l.stock, l.stock <= 0 ? 'is-rutura' : 'is-baixo')}${num('Mínimo', l.min)}${num('Em rutura', l.pedida)}${num('Encomendada', l.encomendada)}</div>
    <section class="lf2-jan-s"><h3>Stock · armazém 60 Coimbra</h3><dl class="lf2-jan-dl">${d('Consignado', `${nf(l.consig)} ${un}`)}${d('Devolvido', nada)}</dl></section>
    <section class="lf2-jan-s"><h3>Reposição</h3><dl class="lf2-jan-dl">
      ${d('Classe de reposição', `<b>${esc(l.clRep)}</b> ${esc(l.clRepDesc)}`)}${d('Família', `${esc(l.fam)} › ${esc(l.sub)}`)}${d('Qtd. económica', `${nf(l.econ)} ${un}`)}${d('Qtd. embalagem', nada)}</dl>
      <button type="button" class="lf2-limpar lf2-jan-classe" data-lf2-clrep="${esc(l.clRep)}" aria-pressed="${e.f.clRep === l.clRep}">${L(check)}<span>${e.f.clRep === l.clRep ? 'A lista já mostra só esta classe' : `Ver só a ${esc(l.clRep)} na lista`}</span></button></section>
    <section class="lf2-jan-s"><div class="lf2-rot-cab"><h3>Rotatividade nos últimos</h3><label class="lf2-dias"><input type="number" min="1" max="999" step="1" value="${dias}" data-lf2-dias aria-label="Dias da rotatividade (calcula-se ao escrever)"><span>dias</span></label></div>
      <p class="lf2-jan-periodo">${dia(desde)} a ${dia(HOJE)}</p>
      ${rt.parcial ? `<p class="lf2-parcial" role="status">${L(triangle)}Só há ${SEMANAS_MAX} semanas de movimentos no protótipo: os valores são dos últimos ${SEMANAS_MAX * 7} dias.</p>` : ''}
      <dl class="lf2-jan-dl lf2-jan-dl--3 lf2-dl--rot">${d('Entradas', nf(rt.entradas))}${d('Saídas', nf(rt.saidas))}${d('Saldo', `<b class="${saldo < 0 ? 'is-neg' : ''}">${saldo > 0 ? '+' : ''}${nf(saldo)}</b>`)}</dl></section>
    <section class="lf2-jan-s"><h3>Preços</h3><dl class="lf2-jan-dl">${d('Preço médio', a?.preco == null ? nada : euros(Math.round(a.preco * .97)))}${d('Último custo', l.custo == null ? nada : `${euros(l.custo)} <small>a ${dia(l.custoData)}</small>`)}</dl></section>`;
}
const IC_MIN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" data-lucide="minus"><path d="M5 12h14"/></svg>';
const IC_MAX = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" data-lucide="maximize-2"><path d="M15 3h6v6"/><path d="m21 3-7 7"/><path d="m3 21 7-7"/><path d="M9 21H3v-6"/></svg>';
const IC_RES = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" data-lucide="minimize-2"><path d="m14 10 7-7"/><path d="M20 10h-6V4"/><path d="m3 21 7-7"/><path d="M4 14h6v6"/></svg>';
const IC_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" data-lucide="x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
function corpoEdicao(e: Est, j: Jan, l: L2 | undefined): string {
  if (!l || !j.ed) return corpoJanela(e, l, j.dias);
  const x = j.ed, id = (k: string) => `lf2-jan-ed-${k}-${j.ref.replace(/\W+/g, '-')}`;
  const pergunta = x.pergunta === 'mudou'
    ? `<div class="lf2-jan-aviso is-aviso" role="alert">${L(circleAlert)}<p><b>A falta mudou enquanto editavas.</b> Agora está com ${nf(l.pedida)} ${esc(l.un)} em rutura, ${esc(l.tipo.toLowerCase())}. Gravar põe por cima o que escreveste.</p><span><button type="button" class="ak-btn ak-btn--linha" data-lf2-ed-acao="recarregar">${L(refresh)}<span>Ver os valores de agora</span></button><button type="button" class="ak-btn ak-btn--perigo" data-lf2-ed-acao="gravar-mesmo">${L(check)}<span>Gravar por cima</span></button></span></div>`
    : x.pergunta ? `<div class="lf2-jan-aviso" role="alert">${L(circleAlert)}<p><b>Há alterações por gravar.</b> Se ${x.pergunta === 'fechar' ? 'fechares a janela' : 'cancelares'}, o que escreveste perde-se.</p><span><button type="button" class="ak-btn ak-btn--linha" data-lf2-ed-acao="continuar" data-lf2-primeiro>${L(pencil)}<span>Continuar a editar</span></button><button type="button" class="ak-btn ak-btn--perigo" data-lf2-ed-acao="descartar">${L(trash)}<span>Descartar</span></button></span></div>` : '';
  return `<div class="lf2-jan-ed">
    <p class="lf2-jan-desc">${esc(l.desc)} · ${esc(l.marca)} · ${esc(l.fornNome)}</p>
    ${pergunta}
    <div class="lf2-jan-ed-campos">
      <label class="ak-campo" for="${id('q')}"><span>Qtd. em rutura (${esc(l.un)})</span><input id="${id('q')}" type="text" inputmode="numeric" value="${esc(x.q)}" data-lf2-ed="pedida" data-lf2-primeiro${x.erro ? ` aria-invalid="true" aria-describedby="${id('erro')}"` : ''}></label>
      <label class="ak-campo" for="${id('t')}"><span>Tipo de encomenda</span><select id="${id('t')}" data-lf2-ed="tipo">${['Normal', 'Urgente', 'Consignação'].map((t) => `<option${t === x.tipo ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
    </div>
    ${x.erro ? `<p class="ak-erro-campo" id="${id('erro')}" role="alert">${esc(x.erro)}</p>` : ''}
    <p class="lf2-dlg-dica">Antes: ${nf(x.base.pedida)} ${esc(l.un)} em rutura, ${esc(x.base.tipo.toLowerCase())}. Enter passa ao campo seguinte; no último, grava. Esc cancela.</p>
    <div class="lf2-dlg-acoes"><button type="button" class="ak-btn ak-btn--linha" data-lf2-ed-acao="cancelar">${L(xIc)}<span>Cancelar</span><kbd>Esc</kbd></button><button type="button" class="ak-btn ak-btn--acao" data-lf2-ed-acao="gravar">${L(check)}<span>Gravar</span><kbd>Ctrl Enter</kbd></button></div>
  </div>`;
}
function janelaHtml(r: HTMLElement, e: Est, j: Jan): string {
  const id = `lf2-jan-${r.dataset.lf2Cenario}-${j.ref.replace(/\W+/g, '-')}`;
  return `<section class="lf2-jan${j.min ? ' is-min' : ''}${j.max ? ' is-max' : ''}" data-lf2-jan="${esc(j.ref)}" role="dialog" aria-labelledby="${id}" tabindex="-1" style="left:${j.x}px;top:${j.y}px;width:${j.w}px;height:${j.ed ? 'auto' : `${j.h}px`};z-index:${j.z}">
    <header class="lf2-jan-cab" data-lf2-jan-arrastar title="Arrasta para mudar de sítio; duplo clique maximiza">${L(j.ed ? pencil : box)}<h3 id="${id}">${j.ed ? 'A editar a falta' : 'Artigo'} · <b data-lf2-jan-ref>${esc(j.ref)}</b>${j.ed?.sujo ? ' <span class="dv2-sujo" title="Alterações por gravar">●</span>' : ''}</h3>
      <span class="lf2-jan-bts"><button type="button" data-lf2-jan-acao="min" aria-label="${j.min ? 'Restaurar' : 'Minimizar'}" title="${j.min ? 'Restaurar' : 'Minimizar'}">${IC_MIN}</button><button type="button" data-lf2-jan-acao="max" aria-label="${j.max ? 'Restaurar o tamanho' : 'Maximizar'}" title="${j.max ? 'Restaurar o tamanho' : 'Maximizar'}">${j.max ? IC_RES : IC_MAX}</button><button type="button" data-lf2-jan-acao="fechar" aria-label="Fechar (Esc)" title="Fechar (Esc)">${IC_X}</button></span></header>
    <div class="lf2-jan-corpo" data-lf2-jan-corpo>${corpoEdicao(e, j, doArtigo(e, j.ref))}</div>
  </section>`;
}
/** Volta a desenhar as janelas abertas (os dados mudaram: filtros, para encomenda, editar…). */
function inspetor(r: HTMLElement, e: Est, _mudou = false): void {
  const caixa = r.querySelector<HTMLElement>('[data-lf2-janelas]'); if (!caixa) return;
  /* as janelas em edição não se redesenham (perdia-se o que se está a escrever) */
  jans(e).forEach((j) => { if (j.ed) return; const c = caixa.querySelector<HTMLElement>(`[data-lf2-jan="${CSS.escape(j.ref)}"] [data-lf2-jan-corpo]`); if (c) c.innerHTML = corpoJanela(e, doArtigo(e, j.ref), j.dias); });
}
function desenharJanelas(r: HTMLElement, e: Est): void {
  const caixa = r.querySelector<HTMLElement>('[data-lf2-janelas]'); if (caixa) caixa.innerHTML = jans(e).map((j) => janelaHtml(r, e, j)).join('');
}
/** Abre (ou traz para a frente) a janela do artigo; a janela nasce da linha (só transform e opacity). */
function abrirJanela(r: HTMLElement, e: Est, ref: string): void {
  const caixa = r.querySelector<HTMLElement>('[data-lf2-janelas]')!, js = jans(e); let j = js.find((x) => x.ref === ref);
  if (j) { j.z = ++zTopo; j.min = false; desenharJanelas(r, e); }
  else {
    const n = js.length % 6, w = Math.min(460, innerWidth - 32), h = Math.min(600, innerHeight - 40);
    j = { ref, x: Math.max(16, Math.min(innerWidth - w - 16, innerWidth - w - 40 - n * 28)), y: Math.max(16, Math.min(innerHeight - h - 16, 80 + n * 28)), w, h, min: false, max: false, z: ++zTopo, dias: e.dias };
    js.push(j); caixa.insertAdjacentHTML('beforeend', janelaHtml(r, e, j));
    const jan = caixa.querySelector<HTMLElement>(`[data-lf2-jan="${CSS.escape(ref)}"]`), tr = r.querySelector<HTMLElement>(`tr[data-lf2-ref="${CSS.escape(ref)}"]`);
    if (jan && tr && !quieto()) { const a = tr.getBoundingClientRect(), b = jan.getBoundingClientRect(); jan.animate([{ transform: `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(${Math.max(.2, a.width / b.width)}, ${Math.max(.06, a.height / b.height)})`, opacity: .2, transformOrigin: '0 0' }, { transform: 'none', opacity: 1, transformOrigin: '0 0' }], { duration: 280, easing: 'cubic-bezier(.22, 1, .36, 1)' }); }
  }
  const jan = caixa.querySelector<HTMLElement>(`[data-lf2-jan="${CSS.escape(ref)}"]`); jan?.focus({ preventScroll: true });
  const b = jan?.querySelector<HTMLElement>('[data-lf2-jan-ref]'); if (b && !quieto()) b.animate([{ backgroundColor: 'color-mix(in srgb, var(--h-laranja) 30%, transparent)' }, { backgroundColor: 'transparent' }], { duration: 700, easing: 'ease-out' });
}
function acaoJanela(r: HTMLElement, e: Est, ref: string, k: string): void {
  const js = jans(e), j = js.find((x) => x.ref === ref); if (!j) return;
  if (k === 'fechar' && j.ed?.sujo && j.ed.pergunta !== 'fechar') { j.ed.pergunta = 'fechar'; j.min = false; j.z = ++zTopo; desenharJanelas(r, e); r.querySelector<HTMLElement>(`[data-lf2-jan="${CSS.escape(ref)}"] [data-lf2-ed-acao="continuar"]`)?.focus(); return; }
  if (k === 'fechar') {
    const el = r.querySelector<HTMLElement>(`[data-lf2-jan="${CSS.escape(ref)}"]`);
    const tirar = () => { js.splice(js.indexOf(j), 1); el?.remove(); r.querySelector<HTMLElement>(`tr[data-lf2-ref="${CSS.escape(ref)}"]`)?.focus({ preventScroll: true }); };
    if (el && !quieto()) el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.96)' }], { duration: 140, easing: 'ease-in' }).finished.then(tirar, tirar); else tirar();
    return;
  }
  if (k === 'min') { j.min = !j.min; if (j.min) j.max = false; }
  if (k === 'max') { j.max = !j.max; if (j.max) j.min = false; }
  j.z = ++zTopo; desenharJanelas(r, e);
  r.querySelector<HTMLElement>(`[data-lf2-jan="${CSS.escape(ref)}"] [data-lf2-jan-acao="${k}"]`)?.focus({ preventScroll: true });
}
/** A janela de cima (a última tocada), para o Esc. */
const janelaDeCima = (e: Est) => jans(e).slice().sort((a, b) => b.z - a.z)[0];
function tudo(r: HTMLElement, e: Est, animar = false): void {
  filtrosNaPagina(r, e); grelha(r, e, animar); resumo(r, e); encomendaAside(r, e); inspetor(r, e); estado(r, e); menuMais(r, e);
  r.style.setProperty('--lf2-alt', `${e.alt}px`); r.querySelector('[data-lf2-div]')?.setAttribute('aria-valuenow', String(e.alt));
}
function escolher(r: HTMLElement, e: Est, ref: string, focar = true): void {
  if (e.ativo === ref) return;
  e.ativo = ref; e.recusa = '';
  r.querySelectorAll('tr.is-ativo').forEach((t) => { t.classList.remove('is-ativo'); (t as HTMLElement).tabIndex = -1; });
  const tr = r.querySelector<HTMLElement>(`tr[data-lf2-ref="${CSS.escape(ref)}"]`);
  if (tr) { tr.classList.add('is-ativo'); tr.tabIndex = 0; if (focar) tr.focus({ preventScroll: true }); tr.scrollIntoView({ block: 'nearest' }); }
  encomendaAside(r, e); estado(r, e); guardarVista(e);
}
/* ---------- Mais ações: predefinições, colunas, linhas, filtros de coluna, vistas e Excel ---------- */
function menuMais(r: HTMLElement, e: Est): void {
  const m = r.querySelector<HTMLElement>('[data-lf2-menu="mais"]'); if (!m) return;
  m.innerHTML = `<p class="ak-menu-t">Colunas</p>
    <div class="lf2-predef" role="group" aria-label="Predefinições de colunas">${Object.entries(PREDEF).map(([k, [t]]) => `<button type="button" role="menuitemradio" aria-checked="${e.predef === k}" data-lf2-predef="${k}">${t}</button>`).join('')}</div>
    <div class="lf2-cols">${e.cols.filter((k) => k !== 'sugestao' || e.sugestao).map((k, i, xs) => { const c = col(k); return `<div class="ak-col-i"><label><input type="checkbox" data-lf2-ver="${k}"${e.ocultas.has(k) ? '' : ' checked'}${c.presa ? ' disabled' : ''}>${esc(c.t)}${c.antiga ? '' : ' <small>(nova)</small>'}</label><button type="button" data-lf2-mover="${k}:-1" aria-label="Subir ${esc(c.t)}"${i > 1 ? '' : ' disabled'}>${L(arrowUp)}</button><button type="button" data-lf2-mover="${k}:1" aria-label="Descer ${esc(c.t)}"${i && i < xs.length - 1 ? '' : ' disabled'}>${L(arrowDown)}</button></div>`; }).join('')}</div>
    <p class="ak-menu-t">Linhas</p>
    <div class="ak2-dens" role="group" aria-label="Linhas"><button type="button" role="menuitemradio" data-lf2-dens="compacta" aria-checked="${e.dens === 'compacta'}">Compactas</button><button type="button" role="menuitemradio" data-lf2-dens="normal" aria-checked="${e.dens === 'normal'}">Normais</button></div>
    <button type="button" role="menuitemcheckbox" aria-checked="${e.filtrosAbertos}" data-lf2-acao="filtros-col"><span>${L(funnel)} Filtrar por coluna</span></button>
    <p class="ak-menu-t">Vistas guardadas</p>
    ${e.vistas.map((v) => `<div class="lf2-vista"><button type="button" role="menuitem" data-lf2-vista="${v.id}">${L(bookmark)}<span>${esc(v.nome)}</span></button><button type="button" class="lf2-vista-x" data-lf2-vista-x="${v.id}" aria-label="Eliminar a vista ${esc(v.nome)}">${L(trash)}</button></div>`).join('') || '<p>Ainda não há vistas. Uma vista guarda os filtros, a visualização, as colunas e a ordem — nunca os dados.</p>'}
    <div class="lf2-vista-nova"><input type="text" maxlength="40" placeholder="Nome da vista" aria-label="Nome da vista nova" data-lf2-vista-nome><button type="button" class="ak-btn" data-lf2-acao="guardar-vista">${L(bookmark)}<span>Guardar</span></button></div>
    <p class="ak-menu-t">Exportar</p>
    <button type="button" role="menuitem" data-lf2-acao="excel"><span>${L(sheet)} Exportar para Excel</span><small>${nf(e.fase === 'ok' ? filtradas(e).length : 0)} linhas</small></button>`;
}

/* ---------- menus e diálogos ---------- */
function fecharMenus(r: HTMLElement): boolean {
  let fechou = false;
  r.querySelectorAll<HTMLElement>('[data-lf2-menu]:not([hidden])').forEach((m) => { m.hidden = true; fechou = true; m.parentElement?.querySelector('[aria-haspopup]')?.setAttribute('aria-expanded', 'false'); });
  return fechou;
}
function abrirMenu(r: HTMLElement, k: string): void {
  const m = r.querySelector<HTMLElement>(`[data-lf2-menu="${k}"]`)!, aberto = !m.hidden; fecharMenus(r);
  if (aberto) return;
  m.hidden = false; m.parentElement?.querySelector('[aria-haspopup]')?.setAttribute('aria-expanded', 'true');
  if (k === 'visualizar') { const q = m.querySelector<HTMLInputElement>('[data-lf2-vis-q]')!; q.value = ''; m.querySelectorAll<HTMLElement>('[data-lf2-modo]').forEach((b) => { b.hidden = false; }); q.focus(); }
  else m.querySelector<HTMLElement>('button:not(:disabled)')?.focus();
}
let voltaFoco: HTMLElement | null = null;
function dialogo(r: HTMLElement, html: string): void {
  const d = r.querySelector<HTMLElement>('[data-lf2-dlg]')!;
  voltaFoco = document.activeElement as HTMLElement;
  /* os ids levam o cenário: os estados do editor estão todos na página ao mesmo tempo */
  const cen = r.dataset.lf2Cenario ?? 'normal';
  d.innerHTML = `<div class="lf2-dlg" role="dialog" aria-modal="true" aria-labelledby="lf2-dlg-t">${html}</div>`.replace(/(id|for|aria-labelledby|aria-describedby)="(lf2-[a-z-]+)"/g, `$1="$2-${cen}"`); d.hidden = false;
  (d.querySelector<HTMLElement>('[data-lf2-primeiro]') ?? d.querySelector<HTMLElement>('input, select, button'))?.focus();
}
function fecharDialogo(r: HTMLElement): boolean {
  const d = r.querySelector<HTMLElement>('[data-lf2-dlg]')!; if (d.hidden) return false;
  d.hidden = true; d.innerHTML = ''; voltaFoco?.focus({ preventScroll: true }); return true;
}
const alvos = (e: Est) => { const ls = filtradas(e); const sel = ls.filter((l) => e.sel.has(l.ref)); return sel.length ? sel : ls.filter((l) => l.ref === e.ativo); };
/** Editar (F6): na janela do artigo — a que já estava aberta passa a ficha; senão abre-se uma, já em edição. */
function editarNaJanela(r: HTMLElement, e: Est, erro = '', valor_ = ''): void {
  const l = ativo(e); if (!l) return;
  abrirJanela(r, e, l.ref);
  const j = jans(e).find((x) => x.ref === l.ref)!;
  if (!j.ed) j.ed = { q: String(l.pedida), tipo: l.tipo, erro: '', sujo: false, base: { pedida: l.pedida, tipo: l.tipo } };
  if (erro) { j.ed.erro = erro; j.ed.q = valor_; j.ed.sujo = true; }
  j.min = false; desenharJanelas(r, e);
  const q = r.querySelector<HTMLInputElement>(`[data-lf2-jan="${CSS.escape(l.ref)}"] [data-lf2-ed="pedida"]`); q?.focus(); q?.select();
}
/** Gravar a edição de uma janela; `mesmo` grava por cima quando a falta mudou entretanto. */
function gravarEdicao(r: HTMLElement, e: Est, ref: string, mesmo = false): void {
  const j = jans(e).find((x) => x.ref === ref), x = j?.ed; if (!j || !x) return;
  const jan = r.querySelector<HTMLElement>(`[data-lf2-jan="${CSS.escape(ref)}"]`);
  x.q = jan?.querySelector<HTMLInputElement>('[data-lf2-ed="pedida"]')?.value.trim() ?? x.q; x.tipo = jan?.querySelector<HTMLSelectElement>('[data-lf2-ed="tipo"]')?.value ?? x.tipo;
  const foco = () => { const n = r.querySelector<HTMLInputElement>(`[data-lf2-jan="${CSS.escape(ref)}"] [data-lf2-ed="pedida"]`); n?.focus(); n?.select(); };
  const l = doArtigo(e, ref);
  if (!l) { x.erro = 'A falta já não está na lista (foi apagada ou gerada outra vez): não há o que gravar.'; desenharJanelas(r, e); return; }
  if (!/^\d{1,5}$/.test(x.q)) { x.erro = 'A quantidade em rutura é um número inteiro de 0 a 99 999.'; x.pergunta = undefined; desenharJanelas(r, e); foco(); return; }
  if (!mesmo && (l.pedida !== x.base.pedida || l.tipo !== x.base.tipo)) { x.pergunta = 'mudou'; x.erro = ''; desenharJanelas(r, e); r.querySelector<HTMLElement>(`[data-lf2-jan="${CSS.escape(ref)}"] [data-lf2-ed-acao="recarregar"]`)?.focus(); return; }
  const d = dados(); d.editadas[ref] = { pedida: +x.q, tipo: x.tipo as Linha2['tipo'] };
  if (!gravarDados(d)) { x.erro = 'Não foi possível gravar. Nada mudou; tenta outra vez.'; desenharJanelas(r, e); foco(); return; }
  j.ed = undefined; tudo(r, e); desenharJanelas(r, e);
  r.querySelector<HTMLElement>(`[data-lf2-jan="${CSS.escape(ref)}"]`)?.focus({ preventScroll: true });
  toast(r, `Falta ${ref} alterada: ${x.q} em rutura, ${x.tipo.toLowerCase()}.`);
}
function acaoEdicao(r: HTMLElement, e: Est, ref: string, k: string): void {
  const j = jans(e).find((x) => x.ref === ref), x = j?.ed; if (!j || !x) return;
  const voltar = () => { j.ed = undefined; desenharJanelas(r, e); r.querySelector<HTMLElement>(`[data-lf2-jan="${CSS.escape(ref)}"]`)?.focus({ preventScroll: true }); };
  switch (k) {
    case 'gravar': gravarEdicao(r, e, ref); return;
    case 'gravar-mesmo': gravarEdicao(r, e, ref, true); return;
    case 'recarregar': { const l = doArtigo(e, ref); if (!l) return; j.ed = { q: String(l.pedida), tipo: l.tipo, erro: '', sujo: false, base: { pedida: l.pedida, tipo: l.tipo } }; desenharJanelas(r, e); r.querySelector<HTMLElement>(`[data-lf2-jan="${CSS.escape(ref)}"] [data-lf2-ed="pedida"]`)?.focus(); return; }
    case 'cancelar': if (x.sujo && x.pergunta !== 'cancelar') { x.pergunta = 'cancelar'; desenharJanelas(r, e); r.querySelector<HTMLElement>(`[data-lf2-jan="${CSS.escape(ref)}"] [data-lf2-ed-acao="continuar"]`)?.focus(); return; } voltar(); return;
    case 'continuar': x.pergunta = undefined; desenharJanelas(r, e); r.querySelector<HTMLElement>(`[data-lf2-jan="${CSS.escape(ref)}"] [data-lf2-ed="pedida"]`)?.focus(); return;
    case 'descartar': if (x.pergunta === 'fechar') { j.ed = undefined; acaoJanela(r, e, ref, 'fechar'); return; } voltar(); return;
    default: return;
  }
}
function dlgApagar(r: HTMLElement, e: Est, todas: boolean): void {
  const ls = todas ? filtradas(e) : alvos(e); if (!ls.length) return;
  const n = ls.length, t = todas ? `Apagar as ${nf(n)} ruturas à vista?` : n === 1 ? `Apagar a falta ${ls[0].ref}?` : `Apagar as ${nf(n)} faltas escolhidas?`;
  dialogo(r, `<h2 id="lf2-dlg-t" class="is-perigo">${L(trash)}${esc(t)}</h2>
    <p>${todas ? 'Saem da lista as ruturas que passam nos filtros de agora.' : 'A falta sai da lista.'} O stock e as encomendas não mudam; voltam a aparecer com <b>Gerar ruturas</b> (Ctrl+F2) enquanto o stock estiver abaixo do mínimo.</p>
    ${n <= 6 ? `<ul class="lf2-dlg-lista">${ls.map((l) => `<li><b class="is-mono">${esc(l.ref)}</b> ${esc(l.desc)}</li>`).join('')}</ul>` : ''}
    <div class="lf2-dlg-acoes"><button type="button" class="ak-btn ak-btn--linha" data-lf2-dlg-fechar data-lf2-primeiro>${L(xIc)}<span>Manter</span><kbd>Esc</kbd></button><button type="button" class="ak-btn ak-btn--perigo" data-lf2-acao="apagar-sim" data-lf2-refs="${esc(ls.map((l) => l.ref).join('|'))}">${L(trash)}<span>Apagar ${n === 1 ? 'a falta' : `${nf(n)} faltas`}</span></button></div>`);
}
function dlgAjuda(r: HTMLElement, e: Est, por: 'tipo' | 'clRep'): void {
  const g = new Map<string, { d: string; n: number; q: number; enc: number; ru: number }>();
  filtradas(e).forEach((l) => { const k = por === 'tipo' ? l.tipo : l.clRep, x = g.get(k) ?? { d: por === 'tipo' ? '' : l.clRepDesc, n: 0, q: 0, enc: 0, ru: 0 }; x.n++; x.q += l.pedida; x.enc += l.encomendada; if (l.stock <= 0) x.ru++; g.set(k, x); });
  dialogo(r, `<h2 id="lf2-dlg-t">${L(calculator)}Ajuda por ${por === 'tipo' ? 'tipo de encomenda' : 'classe de reposição'}</h2><p class="lf2-dlg-sub">As faltas à vista, somadas. Escolhe uma linha para ver só essas.</p>
    <table class="lf2-mini lf2-mini--ajuda"><thead><tr><th>${por === 'tipo' ? 'Tipo de encomenda' : 'Classe de reposição'}</th><th class="is-num">Artigos</th><th class="is-num">Em rutura</th><th class="is-num">Qtd. em rutura</th><th class="is-num">Qtd. encomendada</th></tr></thead>
    <tbody>${[...g].sort((a, b) => a[0].localeCompare(b[0])).map(([k, x], i) => `<tr><td><button type="button" class="lf2-ajuda-ir" data-lf2-ajuda="${por}:${esc(k)}"${i ? '' : ' data-lf2-primeiro'}><b>${esc(k)}</b>${x.d ? ` <small>${esc(x.d)}</small>` : ''}</button></td><td class="is-num">${nf(x.n)}</td><td class="is-num">${nf(x.ru)}</td><td class="is-num">${nf(x.q)}</td><td class="is-num">${nf(x.enc)}</td></tr>`).join('')}</tbody></table>
    <div class="lf2-dlg-acoes"><button type="button" class="ak-btn ak-btn--linha" data-lf2-dlg-fechar>${L(xIc)}<span>Fechar</span><kbd>Esc</kbd></button></div>`);
}

/* ---------- as ações ---------- */
const emSeparador = () => window.self !== window.top;
function abrirEncomenda(r: HTMLElement, e: Est, b?: HTMLElement): void {
  const enc = e.semAtiva ? undefined : encomendaAtiva();
  if (!enc) { toast(r, 'Não há encomenda ativa. Cria uma no painel «Encomenda ativa».'); return; }
  /* dentro da área de trabalho, o separador nasce do botão (data-dk-doc); sozinho, abre o ecrã da encomenda */
  try { sessionStorage.setItem('erp:ref:compras-encomenda', JSON.stringify(enc.ref)); } catch { /* sem sessão */ }
  if (emSeparador()) { const a = b ?? r.querySelector<HTMLElement>('[data-lf2-doc]'); if (a) { a.dataset.dkDoc = 'compras.encomenda'; a.dataset.dkTitulo = enc.ref; if (!b) a.click(); } return; }
  mostrar('compras-encomenda');
}
async function paraEncomenda(r: HTMLElement, e: Est): Promise<void> {
  if (e.gravar) { toast(r, 'Já está a gravar na encomenda.'); return; }
  const enc = e.semAtiva ? undefined : encomendaAtiva(), ls = alvos(e);
  e.recusa = '';
  if (!ls.length) { toast(r, 'Escolhe os artigos na lista.'); return; }
  if (!enc) { e.recusa = 'Não há encomenda ativa: cria uma primeiro.'; encomendaAside(r, e); return; }
  const outros = ls.filter((l) => l.forn !== enc.forn);
  if (outros.length) { e.recusa = `Recusado: ${outros.map((l) => l.ref).join(', ')} ${outros.length === 1 ? 'é' : 'são'} de outro fornecedor. A ${enc.ref} é de ${fornecedor(enc.forn)?.nome ?? enc.forn}; nada se gravou.`; encomendaAside(r, e); return; }
  e.gravar = true; encomendaAside(r, e); estado(r, e);
  await new Promise((ok) => requestAnimationFrame(() => ok(null)));
  try {
    const linhas: LinhaEnc[] = enc.linhas.map((x) => ({ ...x }));
    ls.forEach((l, i) => {
      const q = l.sugestao > 0 ? l.sugestao : l.pedida > 0 ? l.pedida : l.econ, ja = linhas.find((x) => x.ref === l.ref), a = artigo(l.ref);
      if (ja) ja.qtd += q; else linhas.push({ id: `${enc.ref.replace(/\W/g, '')}-${Date.now().toString(36)}-${i}`, ref: l.ref, qtd: q, preco: a?.preco ?? null, desc: 0, iva: a?.iva ?? 23, entrega: enc.entrega, recebida: 0, rejeitada: 0 });
    });
    const g = guardar(e.perfil, { ...enc, linhas }, enc.versao);
    e.gravar = false; e.sel.clear();
    tudo(r, e); encomendaAside(r, e, true);
    toast(r, `${ls.length === 1 ? `${ls[0].ref} juntado` : `${nf(ls.length)} artigos juntados`} à ${g.ref}. Valor líquido: ${euros(totais(g).liquido)}.`);
  } catch (x) {
    e.gravar = false;
    e.recusa = x instanceof Recusa ? x.message : 'Não foi possível gravar na encomenda. Nada se gravou; tenta outra vez.';
    encomendaAside(r, e); estado(r, e);
  }
}
function criarEncomenda(r: HTMLElement, e: Est): void {
  const l = ativo(e); if (!l) return;
  try { const n = criar(e.perfil, l.forn); e.semAtiva = false; encomendaAside(r, e, true); tudo(r, e); toast(r, `Rascunho ${n.ref} criado para ${fornecedor(l.forn)?.nome ?? l.forn}. Junta os artigos com Para encomenda (Ctrl+F7).`); }
  catch (x) { toast(r, x instanceof Recusa ? x.message : 'Não foi possível criar a encomenda.'); }
}
function atualizar(r: HTMLElement, e: Est, gerar = false): void {
  if (e.fase === 'atualizar' || e.fase === 'gerar') { toast(r, 'A lista já está a ser lida.'); return; }
  e.fase = gerar ? 'gerar' : 'atualizar'; grelha(r, e); estado(r, e);
  /* o protótipo não tem servidor: lê-se logo, no fotograma seguinte */
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (gerar) { const d = dados(); const n = d.apagadas.length; d.apagadas = []; gravarDados(d); e.f.diarias = false; toast(r, `Ruturas geradas com o stock de agora: ${nf(base(e).length)} faltas${n ? ` (${nf(n)} ${n === 1 ? 'apagada voltou' : 'apagadas voltaram'})` : ''}.`); }
    else toast(r, 'Lista atualizada.');
    e.fase = 'ok'; e.hora = Date.now(); tudo(r, e, true);
  }));
}
function acaoCompra(r: HTMLElement, e: Est, k: string): void {
  fecharMenus(r);
  const escreve = pode(e.perfil, 'editar');
  if (!escreve && ['gerar', 'apagar-ruturas', 'para-encomenda'].includes(k)) { toast(r, 'O teu perfil só consulta: não gera, não apaga ruturas nem junta à encomenda.'); return; }
  if (k === 'diarias') { e.f.diarias = !e.f.diarias; tudo(r, e, true); toast(r, e.f.diarias ? `Ruturas de ${dia(HOJE)}: ${nf(filtradas(e).length)}.` : 'Todas as ruturas.'); }
  else if (k === 'gerar') atualizar(r, e, true);
  else if (k === 'ajuda') { e.sugestao = !e.sugestao; if (e.sugestao) e.ocultas.delete('sugestao'); tudo(r, e); toast(r, e.sugestao ? 'Ajuda à compra: a coluna «Qtd. sugerida» está à vista.' : 'Ajuda à compra fechada.'); }
  else if (k === 'apagar-ruturas') dlgApagar(r, e, true);
  else if (k === 'encomenda') abrirEncomenda(r, e);
  else if (k === 'para-encomenda') void paraEncomenda(r, e);
  else if (k === 'ajuda-tipo') dlgAjuda(r, e, 'tipo');
  else if (k === 'ajuda-classe') dlgAjuda(r, e, 'clRep');
  guardarVista(e);
}
function exportar(r: HTMLElement, e: Est): void {
  const ls = filtradas(e), cs = vis(e);
  try {
    const linhas: Celula[][] = ls.map((l) => cs.map((c): Celula => { const v = valor(l, c.k); return c.k === 'rutura' ? { data: l.rutura } : c.k === 'estado' || c.k === 'clRep' ? texto(l, c.k) : typeof v === 'number' ? v : v || null; }));
    descarregar(xlsx({ nome: 'Lista de Faltas', colunas: cs.map((c) => c.t), linhas, larguras: cs.map((c) => Math.round((e.larg[c.k] ?? c.w) / 7)) }), `Lista-de-Faltas-${HOJE}.xlsx`);
    e.aviso = `Exportado: Lista-de-Faltas-${HOJE}.xlsx · ${nf(ls.length)} linhas, ${cs.length} colunas.`; estado(r, e); toast(r, e.aviso);
  } catch { toast(r, 'A exportação falhou. A lista fica; tenta outra vez.'); }
}
function tirar(r: HTMLElement, e: Est, k: string): void {
  if (k === 'q') e.q = ''; else if (k === 'colunas') e.filtrosCol = {}; else if (k === 'ind' || k === 'auto' || k === 'diarias') e.f[k] = false; else (e.f as unknown as Record<string, string>)[k] = '';
  tudo(r, e, true); guardarVista(e);
}
function mudarModo(r: HTMLElement, e: Est, k: string): void {
  fecharMenus(r); if (e.modo === k) { r.querySelector<HTMLElement>('[data-lf2-q]')?.focus(); return; }
  e.modo = k; e.ordem = []; tudo(r, e, true); guardarVista(e);
  const t = r.querySelector<HTMLElement>('[data-lf2-vis-t]'); if (t && !quieto()) t.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 180, easing: 'ease-out' });
  r.querySelector<HTMLInputElement>('[data-lf2-q]')?.focus();
  toast(r, `Visualização por ${modoDe(k).t.toLowerCase()}: a lista ordena-se e a pesquisa procura aí.`);
}
function mudarComp(r: HTMLElement, e: Est, c: 'inicio' | 'contem'): void {
  e.comp = c; filtrosNaPagina(r, e); grelha(r, e, true); resumo(r, e); estado(r, e); guardarVista(e);
  r.querySelector<HTMLInputElement>('[data-lf2-q]')?.focus();
}
function predef(r: HTMLElement, e: Est, k: string): void {
  const ks = PREDEF[k][1]; e.predef = k;
  e.cols = [...ks, ...COLS2.map((c) => c.k).filter((x) => !ks.includes(x))];
  e.ocultas = new Set(COLS2.map((c) => c.k).filter((x) => !ks.includes(x)));
  tudo(r, e); guardarVista(e);
}

/* ---------- o estado de partida de cada cenário ---------- */
function armar(r: HTMLElement): void {
  if (estados.has(r)) return;
  const e = de(r), cen = r.dataset.lf2Cenario as Cen2;
  if (cen === 'normal' && !e.editor) {
    const q = repor(e);
    if (q && Date.now() - q < 12 * 3600_000) { const c = r.querySelector<HTMLElement>('[data-lf2-restaurada]')!; c.hidden = false; c.innerHTML = `${L(undo)}Reposta como a deixaste às ${new Date(q).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`; window.setTimeout(() => { c.hidden = true; }, 5000); }
  }
  const ls = () => filtradas(e);
  switch (cen) {
    case 'carregar': e.fase = 'carregar'; break;
    case 'sem-resultados': e.q = 'VKMA 9999'; break;
    case 'filtros': e.f.classe = 'C'; break;
    case 'vazia': e.vazia = true; break;
    case 'erro': e.fase = 'erro'; e.erro = 'servidor'; break;
    case 'offline': e.fase = 'erro'; e.erro = 'offline'; break;
    case 'sessao': e.fase = 'erro'; e.erro = 'sessao'; break;
    case 'sem-ativa': e.semAtiva = true; break;
    case 'sem-artigo': e.ativo = '-'; break;
    case 'det-carregar': e.detCarregar = true; break;
    case 'a-atualizar': e.fase = 'atualizar'; break;
    case 'gerar': e.fase = 'gerar'; break;
    case 'ajuda': e.sugestao = true; predef(r, e, 'reposicao'); break;
    case 'a-gravar': e.gravar = true; e.sel = new Set(ls().filter((l) => l.forn === encomendaAtiva()?.forn).slice(0, 2).map((l) => l.ref)); break;
    case 'confirmado': { const enc = encomendaAtiva(); e.aviso = `2 artigos juntados à ${enc?.ref ?? 'encomenda ativa'}. Valor líquido atualizado.`; break; }
    case 'rejeitado': { const enc = encomendaAtiva(), x = ls().find((l) => l.forn !== enc?.forn); if (x) { e.ativo = x.ref; e.recusa = `Recusado: ${x.ref} é de outro fornecedor. A ${enc?.ref} é de ${fornecedor(enc?.forn ?? '')?.nome ?? '—'}; nada se gravou.`; } break; }
    case 'permissao': e.perfil = 'financeiro'; e.aviso = 'O teu perfil (Financeiro) só consulta a Lista de Faltas.'; break;
    case 'parcial': e.dias = 120; break;
    case 'restaurada': { e.modo = 'fam'; e.f.classe = 'A'; e.ativo = 'GDB2042'; const c = r.querySelector<HTMLElement>('[data-lf2-restaurada]')!; c.hidden = false; c.innerHTML = `${L(undo)}Reposta como a deixaste às 09:12`; break; }
    default: break;
  }
  tudo(r, e);
  if (cen === 'avancados') r.querySelector<HTMLElement>('[data-lf2-av]')!.hidden = false;
  if (cen === 'visualizar') { const m = r.querySelector<HTMLElement>('[data-lf2-menu="visualizar"]')!; m.hidden = false; }
  if (cen === 'acoes') { const m = r.querySelector<HTMLElement>('[data-lf2-menu="acoes"]')!; m.hidden = false; }
  if ((cen === 'det-carregar' || cen === 'parcial') && e.ativo && e.ativo !== '-') { abrirJanela(r, e, e.ativo); r.querySelector<HTMLElement>('.lf2-jan')?.getAnimations().forEach((a) => a.finish()); }
  if (cen === 'invalido') { e.ativo = ls()[0]?.ref ?? ''; editarNaJanela(r, e, 'A quantidade em rutura é um número inteiro de 0 a 99 999.', '-3'); r.querySelectorAll<HTMLElement>('.lf2-jan').forEach((x) => x.getAnimations().forEach((a) => a.finish())); }
  if (cen === 'apagar') dlgApagar(r, e, true);
  if (cen === 'confirmado') encomendaAside(r, e, true);
  /* a entrada: curta, só a primeira vez e fora do editor */
  const aVista = !!r.closest('.ecra:not([hidden]) > .versao:not([hidden])');
  if (!e.editor && cen === 'normal' && aVista && !quieto()) r.classList.add('lf2-entra');
  if (!e.editor && cen === 'normal' && aVista && (emSeparador() || location.hash.includes('so=ecra'))) requestAnimationFrame(() => r.querySelector<HTMLElement>('[data-lf2-q]')?.focus({ preventScroll: true }));
}
/* todas, também as escondidas (os estados no editor e na medida aparecem sem eventos) */
const armarTodos = () => document.querySelectorAll<HTMLElement>('[data-lf2]').forEach(armar);

/* ---------- o teclado da grelha ---------- */
function teclaGrelha(r: HTMLElement, e: Est, ev: KeyboardEvent, tr: HTMLElement): void {
  const ls = filtradas(e), i = ls.findIndex((l) => l.ref === tr.dataset.lf2Ref);
  const ir = (j: number, estender = false) => {
    const k = Math.max(0, Math.min(ls.length - 1, j)); if (k === i && !estender) return;
    if (estender) { if (!e.ancora) e.ancora = ls[i].ref; const a = ls.findIndex((l) => l.ref === e.ancora); e.sel = new Set(ls.slice(Math.min(a, k), Math.max(a, k) + 1).map((l) => l.ref)); }
    if (!estender) e.ancora = '';
    e.ativo = ''; const ref = ls[k].ref;
    if (estender || r.querySelector<HTMLElement>('[data-lf2-grelha]')!.dataset.lf2Virtual) grelha(r, e);
    escolher(r, e, ref); estado(r, e);
    if (estender) r.querySelectorAll<HTMLElement>('tr[data-lf2-ref]').forEach((t) => { const s = e.sel.has(t.dataset.lf2Ref!); t.setAttribute('aria-selected', String(s)); const c = t.querySelector<HTMLInputElement>('[data-lf2-escolher]'); if (c) c.checked = s; });
  };
  const pagina = Math.max(1, Math.floor((r.querySelector<HTMLElement>('[data-lf2-grelha]')!.clientHeight - 40) / (e.dens === 'compacta' ? 34 : 42)));
  switch (ev.key) {
    case 'ArrowDown': ev.preventDefault(); ir(i + 1, ev.shiftKey); break;
    case 'ArrowUp': ev.preventDefault(); ir(i - 1, ev.shiftKey); break;
    case 'PageDown': ev.preventDefault(); ir(i + pagina); break;
    case 'PageUp': ev.preventDefault(); ir(i - pagina); break;
    case 'Home': ev.preventDefault(); ir(0); break;
    case 'End': ev.preventDefault(); ir(ls.length - 1); break;
    case ' ': { ev.preventDefault(); const ref = ls[i].ref; if (e.sel.has(ref)) e.sel.delete(ref); else e.sel.add(ref); tr.setAttribute('aria-selected', String(e.sel.has(ref))); const c = tr.querySelector<HTMLInputElement>('[data-lf2-escolher]'); if (c) c.checked = e.sel.has(ref); estado(r, e); encomendaAside(r, e); break; }
    case 'Enter': ev.preventDefault(); abrirJanela(r, e, ls[i].ref); break;
    default: break;
  }
}

export function iniciar(): void {
  requestAnimationFrame(armarTodos);
  ['romafe:versao', 'romafe:ecra'].forEach((y) => document.addEventListener(y, () => requestAnimationFrame(armarTodos)));
  window.addEventListener('hashchange', () => requestAnimationFrame(armarTodos));
  window.addEventListener('online', () => document.querySelectorAll<HTMLElement>('[data-lf2]').forEach((r) => { const e = estados.get(r); if (e?.erro === 'offline') toast(r, 'A ligação voltou. Tenta outra vez.'); }));

  document.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement, r = raiz(t); if (!r || editando()) return;
    const e = de(r); let b: HTMLElement | null;
    if (t.closest('[data-lf2-dlg]') && !t.closest('.lf2-dlg')) { fecharDialogo(r); return; }
    if (!t.closest('.ak-menu-c')) fecharMenus(r);
    if ((b = t.closest('[data-lf2-acao][aria-disabled="true"]'))) { toast(r, b.title || 'Não disponível.'); return; }
    if (t.closest('[data-lf2-dlg-fechar]')) { fecharDialogo(r); return; }
    if ((b = t.closest('[data-lf2-modo]'))) { mudarModo(r, e, b.dataset.lf2Modo!); return; }
    if ((b = t.closest('[data-lf2-comp]'))) { mudarComp(r, e, b.dataset.lf2Comp as 'inicio' | 'contem'); return; }
    if ((b = t.closest('[data-lf2-compra]'))) { acaoCompra(r, e, b.dataset.lf2Compra!); return; }
    if ((b = t.closest('[data-lf2-tirar]'))) { tirar(r, e, b.dataset.lf2Tirar!); return; }
    if ((b = t.closest('[data-lf2-clrep]'))) { const c = b.dataset.lf2Clrep!; e.f.clRep = e.f.clRep === c ? '' : c; tudo(r, e, true); guardarVista(e); return; }
    if ((b = t.closest('[data-lf2-ajuda]'))) { const [por, k] = b.dataset.lf2Ajuda!.split(/:(.*)/); fecharDialogo(r); if (por === 'tipo') { e.modo = 'tipo'; e.comp = 'inicio'; e.q = k; } else e.f.clRep = k; tudo(r, e, true); guardarVista(e); return; }
    if ((b = t.closest('[data-lf2-predef]'))) { predef(r, e, b.dataset.lf2Predef!); r.querySelector<HTMLElement>(`[data-lf2-predef="${e.predef}"]`)?.focus(); return; }
    if ((b = t.closest('[data-lf2-dens]'))) { e.dens = b.dataset.lf2Dens as Est['dens']; grelha(r, e); menuMais(r, e); guardarVista(e); return; }
    if ((b = t.closest('[data-lf2-mover]'))) { const [k, d] = b.dataset.lf2Mover!.split(':'), i = e.cols.indexOf(k), j = i + +d; if (j >= 1 && j < e.cols.length) { [e.cols[i], e.cols[j]] = [e.cols[j], e.cols[i]]; grelha(r, e); menuMais(r, e); guardarVista(e); r.querySelector<HTMLElement>(`[data-lf2-mover="${k}:${d}"]`)?.focus(); } return; }
    if ((b = t.closest('[data-lf2-vista]'))) { const v = e.vistas.find((x) => x.id === b!.dataset.lf2Vista); if (v) { Object.assign(e, { f: { ...F0(), ...v.f }, modo: v.modo, comp: v.comp, cols: v.cols, ocultas: new Set(v.ocultas), ordem: v.ordem, dens: v.dens }); fecharMenus(r); tudo(r, e, true); guardarVista(e); toast(r, `Vista «${v.nome}» carregada.`); } return; }
    if ((b = t.closest('[data-lf2-vista-x]'))) { const id = b.dataset.lf2VistaX, v = e.vistas.find((x) => x.id === id); if (v && gravarVistas(e, e.vistas.filter((x) => x.id !== id))) { menuMais(r, e); toast(r, `Vista «${v.nome}» eliminada.`); } return; }
    if ((b = t.closest('[data-lf2-ordenar]'))) { const k = b.dataset.lf2Ordenar!, o = e.ordem.find((x) => x.k === k); if ((ev as MouseEvent).shiftKey) { if (o) o.dir = o.dir === 1 ? -1 : 1; else e.ordem.push({ k, dir: 1 }); } else e.ordem = [{ k, dir: o && e.ordem.length === 1 && o.dir === 1 ? -1 : 1 }]; grelha(r, e, true); guardarVista(e); return; }
    if ((b = t.closest('[data-lf2-todas]'))) { const on = (b as HTMLInputElement).checked; filtradas(e).forEach((l) => on ? e.sel.add(l.ref) : e.sel.delete(l.ref)); grelha(r, e); estado(r, e); return; }
    if ((b = t.closest('[data-lf2-escolher]'))) { const ref = b.dataset.lf2Escolher!; if ((b as HTMLInputElement).checked) e.sel.add(ref); else e.sel.delete(ref); b.closest('tr')?.setAttribute('aria-selected', String(e.sel.has(ref))); estado(r, e); return; }
    if ((b = t.closest('[data-lf2-ver]'))) { const k = b.dataset.lf2Ver!; if ((b as HTMLInputElement).checked) e.ocultas.delete(k); else e.ocultas.add(k); e.predef = ''; grelha(r, e); guardarVista(e); return; }
    if ((b = t.closest('[data-lf2-acao]'))) {
      const k = b.dataset.lf2Acao!;
      switch (k) {
        case 'acoes': case 'mais': case 'visualizar': abrirMenu(r, k); return;
        case 'novo': return;
        case 'editar': editarNaJanela(r, e); return;
        case 'apagar': { const ed = alvos(e).find((l) => jans(e).some((j) => j.ref === l.ref && j.ed)); if (ed) { toast(r, `A falta ${ed.ref} está a ser editada numa janela: grava ou cancela primeiro.`); return; } dlgApagar(r, e, false); return; }
        case 'atualizar': case 'repetir': if (e.fase === 'erro') { e.fase = 'ok'; e.erro = undefined; } atualizar(r, e); return;
        case 'imprimir': window.print(); return;
        case 'gerar': atualizar(r, e, true); return;
        case 'limpar': e.f = F0(); e.q = ''; e.filtrosCol = {}; tudo(r, e, true); guardarVista(e); r.querySelector<HTMLElement>('[data-lf2-q]')?.focus(); return;
        case 'limpar-q': e.q = ''; tudo(r, e, true); guardarVista(e); r.querySelector<HTMLElement>('[data-lf2-q]')?.focus(); return;
        case 'todas-colunas': predef(r, e, 'geral'); return;
        case 'mais-filtros': { const av = r.querySelector<HTMLElement>('[data-lf2-av]')!, abrir = av.hidden; av.hidden = !abrir; b.setAttribute('aria-expanded', String(abrir)); if (abrir) { if (!quieto()) av.animate([{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], { duration: 180, easing: 'cubic-bezier(.22, 1, .36, 1)' }); av.querySelector<HTMLElement>('[data-lf2-campo]')?.focus(); } return; }
        case 'filtros-col': e.filtrosAbertos = !e.filtrosAbertos; fecharMenus(r); grelha(r, e); if (e.filtrosAbertos) r.querySelector<HTMLElement>('[data-lf2-fcol]')?.focus(); else { e.filtrosCol = {}; tudo(r, e); } return;
        case 'excel': fecharMenus(r); exportar(r, e); return;
        case 'guardar-vista': { const i = r.querySelector<HTMLInputElement>('[data-lf2-vista-nome]')!, nome = i.value.trim(); if (!nome) { i.focus(); toast(r, 'Dá um nome à vista.'); return; }
          const v: Vista = { id: Date.now().toString(36), nome, f: { ...e.f }, modo: e.modo, comp: e.comp, cols: [...e.cols], ocultas: [...e.ocultas], ordem: [...e.ordem], dens: e.dens };
          if (gravarVistas(e, [...e.vistas.filter((x) => x.nome !== nome), v])) { menuMais(r, e); toast(r, `Vista «${nome}» guardada neste computador.`); } else toast(r, 'Não foi possível guardar a vista neste computador.'); return; }
        case 'para-encomenda': void paraEncomenda(r, e); return;
        case 'encomenda': abrirEncomenda(r, e, b); return;
        case 'criar-enc': criarEncomenda(r, e); return;
        case 'ficha': case 'ficha-forn': if (!emSeparador()) toast(r, 'A ficha abre numa janela quando o ecrã está na área de trabalho.'); return;
        case 'apagar-sim': {
          const refs = b.dataset.lf2Refs!.split('|'), d = dados(); d.apagadas = [...new Set([...d.apagadas, ...refs])];
          if (!gravarDados(d)) { toast(r, 'Não foi possível apagar. Nada mudou.'); return; }
          fecharDialogo(r); e.sel.clear(); tudo(r, e, true); toast(r, `${refs.length === 1 ? 'Falta apagada' : `${nf(refs.length)} faltas apagadas`}. Voltam com Gerar ruturas (Ctrl+F2).`); return;
        }
        default: return;
      }
    }
    if ((b = t.closest('[data-lf2-ed-acao]'))) { acaoEdicao(r, e, b.closest<HTMLElement>('[data-lf2-jan]')!.dataset.lf2Jan!, b.dataset.lf2EdAcao!); return; }
    if ((b = t.closest('[data-lf2-jan-acao]'))) { acaoJanela(r, e, b.closest<HTMLElement>('[data-lf2-jan]')!.dataset.lf2Jan!, b.dataset.lf2JanAcao!); return; }
    if ((b = t.closest('tr[data-lf2-ref]')) && !t.closest('input')) { escolher(r, e, b.dataset.lf2Ref!, false); abrirJanela(r, e, b.dataset.lf2Ref!); }
  });
  document.addEventListener('change', (ev) => {
    const t = ev.target as HTMLElement, r = raiz(t); if (!r || editando()) return; const e = de(r);
    if (t.matches('[data-lf2-f]')) {
      const k = (t as HTMLElement).dataset.lf2F!;
      if (k === 'ind' || k === 'auto') e.f[k] = (t as HTMLInputElement).checked; else (e.f as unknown as Record<string, string>)[k] = (t as HTMLSelectElement).value;
      filtrosNaPagina(r, e); grelha(r, e, true); resumo(r, e); encomendaAside(r, e); inspetor(r, e); estado(r, e); guardarVista(e);
    }
  });
  /* a pesquisa e os filtros por coluna, com um pequeno intervalo enquanto se escreve */
  let espera = 0;
  /* o que se escreve na janela em edição fica nela (e o ● diz que há alterações por gravar) */
  const marcarEd = (e: Est, t: HTMLElement) => {
    const jan = t.closest<HTMLElement>('[data-lf2-jan]'), j = jan && jans(e).find((x) => x.ref === jan.dataset.lf2Jan); if (!j?.ed) return;
    if (t.dataset.lf2Ed === 'pedida') j.ed.q = (t as HTMLInputElement).value; else j.ed.tipo = (t as HTMLSelectElement).value;
    j.ed.sujo = j.ed.q.trim() !== String(j.ed.base.pedida) || j.ed.tipo !== j.ed.base.tipo;
    const h = jan!.querySelector('.lf2-jan-cab h3'), p = h?.querySelector('.dv2-sujo');
    if (j.ed.sujo && h && !p) h.insertAdjacentHTML('beforeend', ' <span class="dv2-sujo" title="Alterações por gravar">●</span>'); else if (!j.ed.sujo) p?.remove();
  };
  document.addEventListener('change', (ev) => { const t = ev.target as HTMLElement, r = raiz(t); if (r && !editando() && t.matches?.('[data-lf2-ed]')) marcarEd(de(r), t); });
  document.addEventListener('input', (ev) => {
    const t = ev.target as HTMLInputElement, r = raiz(t); if (!r || editando()) return; const e = de(r);
    if (t.matches('[data-lf2-ed]')) { marcarEd(e, t); return; }
    /* a rotatividade calcula-se ao escrever os dias (26 out., ela: «quero o cálculo automático») */
    if (t.matches('[data-lf2-dias]')) {
      clearTimeout(espera);
      espera = window.setTimeout(() => {
        const d = Math.round(+t.value);
        if (!(d >= 1 && d <= 999)) { t.setAttribute('aria-invalid', 'true'); return; }
        t.removeAttribute('aria-invalid');
        const pos = t.selectionStart, ref = t.closest<HTMLElement>('[data-lf2-jan]')?.dataset.lf2Jan, j = jans(e).find((x) => x.ref === ref); if (!j) return; j.dias = d; e.dias = d; inspetor(r, e); guardarVista(e);
        const n = r.querySelector<HTMLInputElement>(`[data-lf2-jan="${CSS.escape(ref ?? '')}"] [data-lf2-dias]`); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch { /* number */ } }
        if (!quieto()) r.querySelector<HTMLElement>(`[data-lf2-jan="${CSS.escape(ref ?? '')}"] .lf2-dl--rot`)?.animate([{ opacity: .4 }, { opacity: 1 }], { duration: 180, easing: 'ease-out' });
      }, 220);
      return;
    }
    if (t.matches('[data-lf2-vis-q]')) { const q = norm(t.value); r.querySelectorAll<HTMLElement>('[data-lf2-modo]').forEach((b) => { const m = modoDe(b.dataset.lf2Modo!); b.hidden = !!q && !norm(`${m.t} ${m.tecla}`).includes(q); }); return; }
    if (t.matches('[data-lf2-q], [data-lf2-fcol]')) {
      clearTimeout(espera);
      espera = window.setTimeout(() => {
        if (t.matches('[data-lf2-q]')) e.q = t.value.trim(); else e.filtrosCol[t.dataset.lf2Fcol!] = t.value;
        const foco = t.matches('[data-lf2-fcol]') ? t.dataset.lf2Fcol : '';
        grelha(r, e, true); resumo(r, e); etiquetas(r, e); encomendaAside(r, e); inspetor(r, e); estado(r, e); guardarVista(e);
        if (foco) { const n = r.querySelector<HTMLInputElement>(`[data-lf2-fcol="${foco}"]`); n?.focus(); n?.setSelectionRange(n.value.length, n.value.length); }
      }, 140);
    }
  });
  /* rolar a grelha virtual */
  document.addEventListener('scroll', (ev) => { const g = ev.target as HTMLElement; if (!(g instanceof HTMLElement) || !g.matches('[data-lf2-grelha]') || !g.dataset.lf2Virtual) return; const r = raiz(g); if (r) requestAnimationFrame(() => grelha(r, de(r))); }, true);

  document.addEventListener('keydown', (ev) => {
    const t = ev.target as HTMLElement, r = raiz(t) ?? visivel(); if (!r || editando()) return;
    const e = de(r), dlg = r.querySelector<HTMLElement>('[data-lf2-dlg]')!;
    /* a janela em edição: Esc cancela (pergunta, se há alterações), Ctrl+Enter grava, Enter passa ao campo seguinte e, no último, grava */
    const janEd = t.closest<HTMLElement>('[data-lf2-jan]'), jEd = janEd && jans(e).find((x) => x.ref === janEd.dataset.lf2Jan && x.ed);
    if (jEd && dlg.hidden) {
      const ref = jEd.ref;
      if (ev.key === 'Escape') { ev.preventDefault(); acaoEdicao(r, e, ref, jEd.ed!.pergunta && jEd.ed!.pergunta !== 'mudou' ? 'continuar' : 'cancelar'); return; }
      if (ev.key === 'Enter' && ev.ctrlKey) { ev.preventDefault(); gravarEdicao(r, e, ref); return; }
      const doCampo = (x: HTMLElement) => x.classList.contains('esel__nativo') ? (x.nextElementSibling as HTMLElement) : x;
      if (ev.key === 'Enter' && (t.matches('[data-lf2-ed]') || (t.matches('.esel__botao') && !!t.previousElementSibling?.matches('[data-lf2-ed]')))) {
        ev.preventDefault(); const cs = [...janEd!.querySelectorAll<HTMLElement>('[data-lf2-ed]')].map(doCampo), i = cs.indexOf(t);
        if (i >= 0 && i < cs.length - 1) cs[i + 1].focus(); else gravarEdicao(r, e, ref); return;
      }
    }
    /* as janelas dos artigos: Esc fecha a de cima (a que tem o foco, se houver); os diálogos de editar e apagar têm o seu */
    if (dlg.hidden && ev.key === 'Escape' && jans(e).length && !r.querySelector('[data-lf2-menu]:not([hidden])')) {
      const daqui = t.closest<HTMLElement>('[data-lf2-jan]')?.dataset.lf2Jan, j = daqui ?? janelaDeCima(e)?.ref;
      if (j && (daqui || !t.closest('input, select, textarea'))) { ev.preventDefault(); acaoJanela(r, e, j, 'fechar'); return; }
    }
    /* um diálogo aberto fica com o teclado: Esc fecha, Enter passa ao seguinte, Tab não sai */
    if (!dlg.hidden) {
      if (ev.key === 'Escape') { ev.preventDefault(); fecharDialogo(r); return; }
      const doCampo = (x: HTMLElement) => x.classList.contains('esel__nativo') ? (x.nextElementSibling as HTMLElement) : x;
      if (ev.key === 'Enter' && (t.matches('[data-lf2-ed]') || (t.matches('.esel__botao') && !!t.previousElementSibling?.matches('[data-lf2-ed]')))) { ev.preventDefault(); const cs = [...dlg.querySelectorAll<HTMLElement>('[data-lf2-ed]')].map(doCampo), i = cs.indexOf(t); if (i < cs.length - 1) cs[i + 1].focus(); else dlg.querySelector<HTMLElement>('[data-lf2-acao="gravar-edicao"]')?.click(); return; }
      if (ev.key === 'Tab') { const fs = [...dlg.querySelectorAll<HTMLElement>('input, select, button')]; const i = fs.indexOf(t); if (ev.shiftKey && i <= 0) { ev.preventDefault(); fs[fs.length - 1].focus(); } else if (!ev.shiftKey && i === fs.length - 1) { ev.preventDefault(); fs[0].focus(); } }
      if (/^F\d+$/.test(ev.key)) ev.preventDefault();
      return;
    }
    if (ev.key === 'Escape') { if (fecharMenus(r)) { ev.preventDefault(); return; } if (e.filtrosAbertos) { e.filtrosAbertos = false; e.filtrosCol = {}; tudo(r, e); ev.preventDefault(); } return; }
    /* menus abertos: ↑ ↓ entre as opções */
    const menu = t.closest<HTMLElement>('[data-lf2-menu]');
    if (menu && (ev.key === 'ArrowDown' || ev.key === 'ArrowUp')) { ev.preventDefault(); const bs = [...menu.querySelectorAll<HTMLElement>('button:not(:disabled):not([hidden])')], i = bs.indexOf(t); bs[(i + (ev.key === 'ArrowDown' ? 1 : -1) + bs.length) % bs.length]?.focus(); return; }
    if (menu && ev.key === 'Enter' && t.matches('[data-lf2-vis-q]')) { ev.preventDefault(); menu.querySelector<HTMLElement>('[data-lf2-modo]:not([hidden])')?.click(); return; }
    if (ev.key === 'Enter' && t.matches('[data-lf2-vista-nome]')) { ev.preventDefault(); r.querySelector<HTMLElement>('[data-lf2-acao="guardar-vista"]')?.click(); return; }
    /* as teclas do ERP antigo */
    if (/^F\d+$/.test(ev.key) && !ev.altKey && !ev.metaKey) {
      const n = +ev.key.slice(1);
      if (ev.ctrlKey && !ev.shiftKey) { const a = ACOES_COMPRA.find((x) => x.tecla === `Ctrl+F${n}`); if (a) { ev.preventDefault(); acaoCompra(r, e, a.k); } return; }
      if (ev.shiftKey && !ev.ctrlKey) { if (n === 1 || n === 2) { ev.preventDefault(); mudarComp(r, e, n === 1 ? 'inicio' : 'contem'); } return; }
      if (ev.ctrlKey || ev.shiftKey) return;
      const m = MODOS.find((x) => x.tecla === ev.key);
      if (m) { ev.preventDefault(); mudarModo(r, e, m.k); return; }
      const barra: Record<string, string> = { F5: 'novo', F6: 'editar', F8: 'apagar', F9: 'atualizar', F11: 'imprimir' };
      if (barra[ev.key]) { ev.preventDefault(); r.querySelector<HTMLElement>(`.lf2-barra [data-lf2-acao="${barra[ev.key]}"]`)?.click(); }
      return;
    }
    /* Enter nos filtros passa ao campo seguinte; na pesquisa, vai para a grelha */
    if (ev.key === 'Enter' && t.matches('[data-lf2-campo]')) {
      ev.preventDefault();
      if (t.matches('[data-lf2-q]')) { clearTimeout(espera); e.q = (t as HTMLInputElement).value.trim(); tudo(r, e, true); guardarVista(e); r.querySelector<HTMLElement>('tr.is-ativo')?.focus(); return; }
      const cs = [...r.querySelectorAll<HTMLElement>('[data-lf2-campo]')].filter((c) => !c.closest('[hidden]')), i = cs.indexOf(t);
      (i >= 0 && i < cs.length - 1 ? cs[i + 1] : r.querySelector<HTMLElement>('[data-lf2-q]'))?.focus(); return;
    }
    if (ev.key === 'Enter' && t.matches('[data-lf2-dias]')) { ev.preventDefault(); return; }
    /* os separadores do painel: ← → */
    /* o divisor: ↑ ↓ mudam a altura da lista */
    if (t.matches('[data-lf2-div]') && (ev.key === 'ArrowUp' || ev.key === 'ArrowDown')) { ev.preventDefault(); e.alt = Math.max(200, Math.min(900, e.alt + (ev.key === 'ArrowDown' ? 24 : -24))); r.style.setProperty('--lf2-alt', `${e.alt}px`); t.setAttribute('aria-valuenow', String(e.alt)); guardarVista(e); return; }
    const tr = t.closest<HTMLElement>('tr[data-lf2-ref]'); if (tr && t === tr) teclaGrelha(r, e, ev, tr);
  });

  /* alargar colunas e mudar a altura da lista (puxadores) */
  document.addEventListener('pointerdown', (ev) => {
    const t = ev.target as HTMLElement, r = raiz(t); if (!r || editando()) return; const e = de(r);
    /* as janelas: tocar traz para a frente; o cabeçalho arrasta (dentro da janela do navegador) */
    const jan = t.closest<HTMLElement>('[data-lf2-jan]');
    if (jan) {
      const j = jans(e).find((x) => x.ref === jan.dataset.lf2Jan); if (!j) return;
      if (j.z !== zTopo) { j.z = ++zTopo; jan.style.zIndex = String(j.z); }
      if (!t.closest('[data-lf2-jan-arrastar]') || t.closest('button') || j.max) return;
      ev.preventDefault(); const x0 = ev.clientX - j.x, y0 = ev.clientY - j.y; jan.classList.add('is-a-mover');
      const mover = (m: PointerEvent) => { j.x = Math.max(-j.w + 120, Math.min(innerWidth - 120, m.clientX - x0)); j.y = Math.max(0, Math.min(innerHeight - 40, m.clientY - y0)); jan.style.left = `${j.x}px`; jan.style.top = `${j.y}px`; };
      const largar = () => { document.removeEventListener('pointermove', mover); document.removeEventListener('pointerup', largar); jan.classList.remove('is-a-mover'); };
      document.addEventListener('pointermove', mover); document.addEventListener('pointerup', largar); return;
    }
    const h = t.closest<HTMLElement>('[data-lf2-redim]');
    if (h) {
      ev.preventDefault(); ev.stopPropagation(); const k = h.dataset.lf2Redim!, c = r.querySelector<HTMLElement>(`col[data-lf2-w="${k}"]`)!, x0 = ev.clientX, w0 = c.getBoundingClientRect().width || col(k).w;
      const mover = (m: PointerEvent) => { e.larg[k] = Math.max(56, Math.round(w0 + m.clientX - x0)); c.style.width = `${e.larg[k]}px`; };
      const largar = () => { document.removeEventListener('pointermove', mover); document.removeEventListener('pointerup', largar); guardarVista(e); };
      document.addEventListener('pointermove', mover); document.addEventListener('pointerup', largar); return;
    }
    const d = t.closest<HTMLElement>('[data-lf2-div]');
    if (d) {
      ev.preventDefault(); const y0 = ev.clientY, a0 = e.alt; d.setPointerCapture(ev.pointerId); r.classList.add('a-redimensionar');
      const mover = (m: PointerEvent) => { e.alt = Math.max(200, Math.min(900, Math.round(a0 + m.clientY - y0))); r.style.setProperty('--lf2-alt', `${e.alt}px`); };
      const largar = () => { d.removeEventListener('pointermove', mover); d.removeEventListener('pointerup', largar); r.classList.remove('a-redimensionar'); d.setAttribute('aria-valuenow', String(e.alt)); guardarVista(e); };
      d.addEventListener('pointermove', mover); d.addEventListener('pointerup', largar);
    }
  });
  /* o tamanho que se dá a uma janela pelo canto fica (para minimizar e voltar) */
  const medir = new ResizeObserver((xs) => xs.forEach((x) => { const jan = x.target as HTMLElement, r = raiz(jan); if (!r || jan.classList.contains('is-min') || jan.classList.contains('is-max') || jan.style.height === 'auto') return; const j = jans(de(r)).find((y) => y.ref === jan.dataset.lf2Jan); if (j) { j.w = Math.round(jan.offsetWidth); j.h = Math.round(jan.offsetHeight); } }));
  new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => { if (n instanceof HTMLElement && n.matches('[data-lf2-jan]')) medir.observe(n); }))).observe(document.body, { childList: true, subtree: true });
  document.addEventListener('dblclick', (ev) => { const h = (ev.target as HTMLElement).closest?.<HTMLElement>('[data-lf2-jan-arrastar]'); if (!h || (ev.target as HTMLElement).closest('button')) return; const r = raiz(h); if (!r || editando()) return; acaoJanela(r, de(r), h.closest<HTMLElement>('[data-lf2-jan]')!.dataset.lf2Jan!, 'max'); });
  /* reordenar colunas a arrastar o cabeçalho */
  let arrastada = '';
  document.addEventListener('dragstart', (ev) => { const th = (ev.target as HTMLElement).closest?.<HTMLElement>('th[data-lf2-col]'); if (!th || !raiz(th) || editando()) return; arrastada = th.dataset.lf2Col!; ev.dataTransfer?.setData('text/plain', arrastada); th.classList.add('is-arrastada'); });
  document.addEventListener('dragover', (ev) => { const th = (ev.target as HTMLElement).closest?.<HTMLElement>('th[data-lf2-col]'); if (th && arrastada && th.dataset.lf2Col !== 'ref') { ev.preventDefault(); th.classList.add('is-alvo'); } });
  document.addEventListener('dragleave', (ev) => { (ev.target as HTMLElement).closest?.('th[data-lf2-col]')?.classList.remove('is-alvo'); });
  document.addEventListener('drop', (ev) => {
    const th = (ev.target as HTMLElement).closest?.<HTMLElement>('th[data-lf2-col]'), r = th ? raiz(th) : null; if (!th || !r || !arrastada) return; ev.preventDefault();
    const e = de(r), para = th.dataset.lf2Col!; if (para === arrastada || arrastada === 'ref' || para === 'ref') { arrastada = ''; grelha(r, e); return; }
    e.cols.splice(e.cols.indexOf(arrastada), 1); e.cols.splice(e.cols.indexOf(para), 0, arrastada); arrastada = ''; e.predef = ''; grelha(r, e, true); menuMais(r, e); guardarVista(e);
  });
  document.addEventListener('dragend', () => { arrastada = ''; document.querySelectorAll('th.is-arrastada, th.is-alvo').forEach((x) => x.classList.remove('is-arrastada', 'is-alvo')); });
}
