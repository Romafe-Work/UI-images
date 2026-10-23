/* =========================================================
   ERP — Artigos / Compras Automático: o que mexe (23 out. 2026). Ver compras/automatico.ts.
   Cada página (e cada estado no editor) tem o seu estado (WeakMap); a grelha desenha-se a partir dele.
     - Gerar (F10 ou o botão): valida o período, impede pedidos repetidos, mostra «A gerar…» enquanto o cálculo corre
       e depois as linhas; o foco vai para a grelha. Os critérios e a grelha ficam como estavam ao mudar de separador.
     - Grelha: clicar no cabeçalho ordena (Shift junta mais uma ordem); F2 abre/foca os filtros por coluna; F3 tira-os;
       arrastar um cabeçalho para outro reordena; para a zona de agrupar, agrupa (vários níveis; os grupos abrem e
       fecham; as etiquetas reordenam-se a arrastar ou com Alt+←/→ e saem com Delete). O puxador alarga a coluna.
       Teclado: ↑ ↓ mudam a linha, Shift+↑ ↓ e Espaço escolhem várias, Enter abre o detalhe, ← → fecham/abrem um grupo.
     - Critérios: Enter passa ao campo seguinte (Shift+Enter ao anterior); no último vai a Gerar dados — nunca gera
       sozinho. Esc fecha o que estiver aberto (menu, detalhe, filtros) e nunca apaga os resultados.
     - Excel (F4): um .xlsx com as linhas que passam nos filtros (ou só as escolhidas) e as colunas à vista.
     - Guarda-se neste computador só a vista (ordem e larguras das colunas, grupos) — nunca os dados.
   v2 (data-ak-v="2"), o mesmo motor e mais: os critérios recolhem-se num resumo em etiquetas depois de gerar (e
   abrem-se com «Alterar critérios» ou numa etiqueta); o resumo dos resultados por cima da grelha; Atualizar (F9) volta a
   pedir a última análise; Vistas guardadas (por utilizador e empresa, sem resultados); Mais ações (linhas e colunas);
   o menu da linha (botão direito, tecla Menu ou Shift+F10); os erros com o caminho de cada um (sem rede, tempo esgotado,
   sem permissão, sessão terminada); os botões sem dados dizem porquê. Movimento só em transform/opacity.
   ========================================================= */
import { gerar, CRIT0, COLS, type Crit, type LinhaAk, type ColAk, type CenarioAk } from './automatico';
import { xlsx, descarregar, type Celula } from './xlsx';
import { euros, dia } from './dominio';
import { L, esc, icone } from '../espaco';
import x from 'lucide-static/icons/x.svg?raw';
import chevronRight from 'lucide-static/icons/chevron-right.svg?raw';
import arrowUp from 'lucide-static/icons/arrow-up.svg?raw';
import arrowDown from 'lucide-static/icons/arrow-down.svg?raw';
import searchX from 'lucide-static/icons/search-x.svg?raw';
import circleAlert from 'lucide-static/icons/circle-alert.svg?raw';
import play from 'lucide-static/icons/play.svg?raw';
import loader from 'lucide-static/icons/loader-circle.svg?raw';
import columns3 from 'lucide-static/icons/columns-3.svg?raw';
import rotateCw from 'lucide-static/icons/rotate-cw.svg?raw';
import timer from 'lucide-static/icons/timer.svg?raw';
import wifiOff from 'lucide-static/icons/wifi-off.svg?raw';
import lock from 'lucide-static/icons/lock.svg?raw';
import logIn from 'lucide-static/icons/log-in.svg?raw';
import pencil from 'lucide-static/icons/pencil.svg?raw';
import eye from 'lucide-static/icons/eye.svg?raw';
import copy from 'lucide-static/icons/copy.svg?raw';
import fileText from 'lucide-static/icons/file-text.svg?raw';
import squareCheck from 'lucide-static/icons/square-check.svg?raw';
import trash from 'lucide-static/icons/trash-2.svg?raw';
import save from 'lucide-static/icons/save.svg?raw';
import bookmarkPlus from 'lucide-static/icons/bookmark-plus.svg?raw';

type Ordem = { k: keyof LinhaAk; dir: 1 | -1 };
interface Est {
  crit: Crit; linhas: LinhaAk[] | null; fase: 'inicial' | 'a-gerar' | 'ok' | 'erro'; erro?: string; gerado?: number;
  ordem: Ordem[]; filtros: Partial<Record<keyof LinhaAk, string>>; filtrosAbertos: boolean; grupos: (keyof LinhaAk)[]; fechados: Set<string>;
  cols: (keyof LinhaAk)[]; ocultas: Set<keyof LinhaAk>; larguras: Partial<Record<keyof LinhaAk, number>>; densidade: 'compacta' | 'normal';
  sel: Set<string>; ativo: string; ancora: string; det: boolean; aviso?: string;
  /** v2: que erro (cada um tem o seu caminho), as vistas guardadas, a ativa, a que se está a eliminar, os números do resumo */
  tipoErro?: TipoErro; vistas: Vista[]; vista?: string; apagar?: string; nums?: number[];
  /** cada geração tem um número; Cancelar (Esc) muda-o e a geração em curso deixa de contar */
  vez: number;
}
type TipoErro = 'servidor' | 'tempo' | 'offline' | 'permissao' | 'sessao';
interface Vista { id: string; nome: string; crit: Crit; cols: (keyof LinhaAk)[]; ocultas: (keyof LinhaAk)[]; larguras: Partial<Record<keyof LinhaAk, number>>; ordem: Ordem[]; grupos: (keyof LinhaAk)[]; densidade: 'compacta' | 'normal' }
const CHAVE = 'erp:automatico:vista';
const v2 = (r: HTMLElement) => r.dataset.akV === '2';
/* As vistas guardadas são de quem as guarda e da empresa em que está: a chave leva os dois (no protótipo, a sessão é a
   do Rui Matos, comprador). Guardam-se só preferências — nunca resultados. */
const SESSAO = { utilizador: 'rui.matos', empresa: 'emp-000001' };
const CHAVE_VISTAS = `erp:automatico:vistas:${SESSAO.utilizador}:${SESSAO.empresa}`;
const OCULTAS0: (keyof LinhaAk)[] = ['refForn', 'un', 'min'];
const vistaDe = (id: string, nome: string, crit: Partial<Crit>, x: Partial<Vista> = {}): Vista => ({ id, nome, crit: { ...CRIT0(), ...crit }, cols: COLS.map((c) => c.k), ocultas: OCULTAS0, larguras: {}, ordem: [], grupos: [], densidade: 'compacta', ...x });
/** Os exemplos do briefing, enquanto a pessoa não tiver guardado nenhuma. */
const EXEMPLOS = (): Vista[] => [
  vistaDe('ex-forn', 'Análise por fornecedor', {}, { grupos: ['forn'], ordem: [{ k: 'valor', dir: -1 }] }),
  vistaDe('ex-sem', 'Artigos sem compras', { tipo: 'sem' }, { ordem: [{ k: 'stock', dir: 1 }] }),
  vistaDe('ex-60', 'Armazém 60', { armazem: '60' }),
];
function lerVistas(): Vista[] {
  try { const g = JSON.parse(localStorage.getItem(CHAVE_VISTAS) ?? 'null'); if (Array.isArray(g)) return g.filter((v) => v && v.id && v.nome && v.crit); } catch { /* */ }
  return EXEMPLOS();
}
const gravarVistas = (r: HTMLElement, vs: Vista[]): boolean => { if (r.dataset.akCenario !== 'inicial') return true; try { localStorage.setItem(CHAVE_VISTAS, JSON.stringify(vs)); return true; } catch { return false; } };
const editando = () => document.body.classList.contains('editando') || document.body.classList.contains('com-fluxo');
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const estados = new WeakMap<HTMLElement, Est>();
const colDe = (k: keyof LinhaAk) => COLS.find((c) => c.k === k)!;
const raiz = (t: EventTarget | null) => (t as HTMLElement | null)?.closest?.<HTMLElement>('[data-ak]') ?? null;
const n = (v: number) => v.toLocaleString('pt-PT');
function fmt(c: ColAk, v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  if (c.tipo === 'n') return n(v as number);
  if (c.tipo === 'eur') return euros(v as number);
  if (c.tipo === 'data') return dia(v as string);
  return String(v);
}
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/* ---------- a vista (só preferências) ---------- */
function lerVista(r: HTMLElement): Partial<Est> {
  try { const g = JSON.parse(localStorage.getItem(CHAVE + (v2(r) ? ':v2' : '')) ?? 'null'); if (!g) return {};
    const ok = (k: string) => COLS.some((c) => c.k === k);
    const base: Partial<Est> = { cols: [...(g.cols ?? []).filter(ok), ...COLS.map((c) => c.k).filter((k) => !(g.cols ?? []).includes(k))], larguras: g.larguras ?? {}, grupos: (g.grupos ?? []).filter(ok), ordem: (g.ordem ?? []).filter((o: Ordem) => ok(o.k as string)) };
    /* na v2 as colunas escondidas e as linhas voltam a escolher-se (em Mais ações) */
    return v2(r) ? { ...base, ocultas: new Set((g.ocultas ?? []).filter(ok)), densidade: g.densidade === 'normal' ? 'normal' : 'compacta' } : base;
  } catch { return {}; }
}
function guardarVista(r: HTMLElement, e: Est): void {
  if (r.dataset.akCenario !== 'inicial') return;
  try { localStorage.setItem(CHAVE + (v2(r) ? ':v2' : ''), JSON.stringify({ cols: e.cols, ocultas: [...e.ocultas], larguras: e.larguras, densidade: e.densidade, grupos: e.grupos, ordem: e.ordem })); } catch { /* */ }
}
function novo(r: HTMLElement): Est {
  const base: Est = { crit: CRIT0(), linhas: null, fase: 'inicial', ordem: [], filtros: {}, filtrosAbertos: false, grupos: [], fechados: new Set(), cols: COLS.map((c) => c.k), ocultas: new Set(OCULTAS0), larguras: {}, densidade: 'compacta', sel: new Set(), ativo: '', ancora: '', det: false, vez: 0, vistas: v2(r) && r.dataset.akCenario === 'inicial' ? lerVistas() : EXEMPLOS() };
  return r.dataset.akCenario === 'inicial' ? { ...base, ...lerVista(r) } : base;
}

/* ---------- as linhas à vista: filtros da tabela, ordem, grupos ---------- */
function filtradas(e: Est): LinhaAk[] {
  const fs = Object.entries(e.filtros).filter(([, v]) => v && v.trim()) as [keyof LinhaAk, string][];
  const ls = (e.linhas ?? []).filter((l) => fs.every(([k, v]) => norm(fmt(colDe(k), l[k])).includes(norm(v.trim()))));
  const cmp = (a: LinhaAk, b: LinhaAk) => { for (const o of e.ordem) { const x = a[o.k] as unknown, y = b[o.k] as unknown; const d = typeof x === 'number' && typeof y === 'number' ? x - y : x === null ? -1 : y === null ? 1 : String(x).localeCompare(String(y), 'pt'); if (d) return d * o.dir; } return 0; };
  return e.ordem.length ? ls.slice().sort(cmp) : ls;
}
type No = { tipo: 'g'; chave: string; nivel: number; k: keyof LinhaAk; valor: string; linhas: LinhaAk[] } | { tipo: 'l'; l: LinhaAk; nivel: number };
function arvore(e: Est, ls: LinhaAk[]): No[] {
  const sai: No[] = [];
  const ramo = (xs: LinhaAk[], nivel: number, pre: string) => {
    if (nivel >= e.grupos.length) { xs.forEach((l) => sai.push({ tipo: 'l', l, nivel })); return; }
    const k = e.grupos[nivel], m = new Map<string, LinhaAk[]>();
    xs.forEach((l) => { const v = fmt(colDe(k), l[k]); m.set(v, [...(m.get(v) ?? []), l]); });
    [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], 'pt')).forEach(([v, g]) => {
      const chave = `${pre}${k}=${v}|`; sai.push({ tipo: 'g', chave, nivel, k, valor: v, linhas: g });
      if (!e.fechados.has(chave)) ramo(g, nivel + 1, chave);
    });
  };
  ramo(ls, 0, ''); return sai;
}

/* ---------- v2: o que a grelha mostra antes de haver linhas ---------- */
/** Uma grelha em traço fino (o que vai aparecer), sem imagem grande. */
const DESENHO = `<svg class="ak2-desenho" viewBox="0 0 132 84" fill="none" aria-hidden="true"><rect x="1" y="1" width="130" height="82" rx="6" stroke="currentColor" stroke-opacity=".35"/><path d="M1 17h130" stroke="currentColor" stroke-opacity=".35"/><rect x="2" y="2" width="128" height="14" rx="5" fill="currentColor" fill-opacity=".08"/><path d="M42 1v82M86 1v82" stroke="currentColor" stroke-opacity=".18"/><g stroke="currentColor" stroke-opacity=".2"><path d="M1 33h130M1 49h130M1 65h130"/></g><rect x="2" y="34" width="128" height="14" fill="rgb(0,99,170)" fill-opacity=".12"/><path d="M2 34v14" stroke="rgb(0,99,170)" stroke-width="3"/><g fill="currentColor" fill-opacity=".28"><rect x="8" y="7" width="22" height="4" rx="2"/><rect x="50" y="7" width="26" height="4" rx="2"/><rect x="100" y="7" width="22" height="4" rx="2"/><rect x="8" y="23" width="26" height="4" rx="2"/><rect x="50" y="23" width="20" height="4" rx="2"/><rect x="108" y="23" width="14" height="4" rx="2"/><rect x="8" y="55" width="20" height="4" rx="2"/><rect x="50" y="55" width="28" height="4" rx="2"/><rect x="104" y="55" width="18" height="4" rx="2"/><rect x="8" y="71" width="24" height="4" rx="2"/><rect x="50" y="71" width="18" height="4" rx="2"/><rect x="110" y="71" width="12" height="4" rx="2"/></g><g fill="rgb(0,99,170)" fill-opacity=".7"><rect x="8" y="39" width="28" height="4" rx="2"/><rect x="50" y="39" width="24" height="4" rx="2"/><rect x="102" y="39" width="20" height="4" rx="2"/></g></svg>`;
const PRONTO = `<div class="ak2-pronto">${DESENHO}<div><b>Pronto para analisar</b><p>Define os critérios e prime <kbd>F10</kbd> para gerar os resultados.</p></div></div>`;
/** A carga: a forma da grelha que vem, sem percentagens (o tempo é o do pedido). */
const ESQUELETO = `<div class="ak2-esq" aria-hidden="true">${Array.from({ length: 9 }, (_, i) => `<div class="ak2-esq-l${i ? '' : ' ak2-esq-cab'}">${[130, 220, 90, 130, 190, 140, 80, 90].map((w, j) => `<i style="width:${Math.round(w * (i ? 0.45 + ((i * 7 + j * 3) % 5) / 10 : 0.5))}px"></i>`).join('')}</div>`).join('')}</div><p class="ak2-carga" role="status">${L(loader)}A gerar a análise… <span>Os critérios ficam como estão; Esc cancela.</span></p>`;
const ERROS: Record<TipoErro, [string, string, string]> = {
  servidor: [circleAlert, 'Não foi possível gerar a análise.', ''],
  tempo: [timer, 'O servidor demorou demasiado a responder.', 'Experimenta um período mais curto, ou tenta outra vez. Os critérios ficam.'],
  offline: [wifiOff, 'Sem ligação à rede.', 'Os critérios ficam. Quando a ligação voltar, tenta outra vez.'],
  permissao: [lock, 'Não tens permissão para este mapa.', 'Pede acesso a quem gere os acessos do ERP (Compras ▸ Mapas). Os critérios ficam.'],
  sessao: [logIn, 'A sessão terminou.', 'Volta a entrar para continuar. Os critérios ficam neste ecrã.'],
};
function painelErro(e: Est): string {
  const t = e.tipoErro ?? 'servidor', [ic, titulo, texto] = ERROS[t];
  const botao = (acao: string, icn: string, txt: string, cls = '') => `<button type="button" class="ak-btn${cls}" data-ak-acao="${acao}">${L(icn)}<span>${txt}</span></button>`;
  const acoes = t === 'permissao' ? botao('alterar', pencil, 'Alterar critérios')
    : t === 'sessao' ? `<button type="button" class="ak-btn ak-btn--acao" data-login>${L(logIn)}<span>Voltar a entrar</span></button>`
    : botao('gerar', rotateCw, 'Tentar outra vez', ' ak-btn--acao') + (t === 'tempo' ? botao('alterar', pencil, 'Alterar critérios') : '');
  return `<div class="ak-vazio ak-vazio--erro ak2-erro is-${t}">${L(ic)}<p><b>${titulo}</b>${esc(texto || e.erro || 'O servidor não respondeu.')}</p><div class="ak2-erro-acoes">${acoes}</div></div>`;
}

/* ---------- desenhar ---------- */
const vis = (e: Est) => e.cols.filter((k) => !e.ocultas.has(k)).map(colDe);
function grelha(r: HTMLElement, e: Est, animar = false): void {
  const g = r.querySelector<HTMLElement>('[data-ak-grelha]')!;
  r.classList.toggle('is-compacta', e.densidade === 'compacta');
  r.classList.toggle('is-a-gerar', e.fase === 'a-gerar');
  const cs = vis(e);
  r.classList.toggle('tem-dados', !!e.linhas?.length);
  if (v2(r) && !e.linhas && e.fase !== 'ok') { g.innerHTML = e.fase === 'a-gerar' ? ESQUELETO : e.fase === 'erro' ? painelErro(e) : PRONTO; estado(r, e); return; }
  if (e.fase === 'inicial' && !e.linhas) { g.innerHTML = `<div class="ak-vazio">${L(play)}<p><b>Define os critérios e seleciona Gerar dados.</b>Carrega em F10 em qualquer sítio deste ecrã.</p></div>`; estado(r, e); return; }
  if (e.fase === 'erro' && !e.linhas) { g.innerHTML = `<div class="ak-vazio ak-vazio--erro">${L(circleAlert)}<p><b>Não foi possível gerar a análise.</b>${esc(e.erro ?? 'O servidor não respondeu.')}</p><button type="button" class="ak-btn ak-btn--acao" data-ak-acao="gerar">${L(rotateCw)}<span>Tentar outra vez</span></button></div>`; estado(r, e); return; }
  if (e.fase === 'a-gerar' && !e.linhas) { g.innerHTML = `<div class="ak-vazio ak-vazio--carga">${L(loader)}<p><b>A gerar a análise…</b>Os critérios ficam como estão.</p></div>`; estado(r, e); return; }
  if (!cs.length) { g.innerHTML = `<div class="ak-vazio">${L(columns3)}<p><b>Não há colunas à vista.</b>Escolhe pelo menos uma em ${v2(r) ? 'Mais ações' : 'Colunas'}.</p><button type="button" class="ak-btn" data-ak-acao="todas-colunas">${L(columns3)}<span>Mostrar todas</span></button></div>`; estado(r, e); return; }
  if (e.linhas && !e.linhas.length) { g.innerHTML = `<div class="ak-vazio">${L(searchX)}<p><b>Não foram encontrados artigos para os critérios selecionados.</b>Alarga o período ou tira um critério.</p><button type="button" class="ak-btn" data-ak-acao="alterar">${L(chevronRight)}<span>Alterar critérios</span></button></div>`; estado(r, e); return; }
  const ls = filtradas(e), nos = arvore(e, ls);
  /* FLIP: onde estava cada linha antes (para ordenar e agrupar sem saltos) */
  const antes = new Map<string, number>(); if (!quieto()) g.querySelectorAll<HTMLElement>('tr[data-ak-ref]').forEach((t) => antes.set(t.dataset.akRef!, t.getBoundingClientRect().top));
  const sc = g.scrollTop, sl = g.scrollLeft;
  const larg = (c: ColAk) => e.larguras[c.k] ?? c.w;
  const ordemDe = (k: keyof LinhaAk) => { const i = e.ordem.findIndex((o) => o.k === k); return i < 0 ? '' : `<span class="ak-ord">${L(e.ordem[i].dir === 1 ? arrowUp : arrowDown)}${e.ordem.length > 1 ? `<i>${i + 1}</i>` : ''}</span>`; };
  const sort = (k: keyof LinhaAk) => { const o = e.ordem.find((x) => x.k === k); return o ? (o.dir === 1 ? 'ascending' : 'descending') : 'none'; };
  const cab = `<tr>${e.grupos.length ? '<th class="ak-th-g" aria-hidden="true"></th>' : ''}<th class="ak-th-sel"><input type="checkbox" aria-label="Escolher todas" data-ak-todas${ls.length && ls.every((l) => e.sel.has(l.ref)) ? ' checked' : ''}></th>${cs.map((c) => `<th scope="col" class="${c.tipo === 'n' || c.tipo === 'eur' ? 'is-num' : ''}" style="width:${larg(c)}px" aria-sort="${sort(c.k)}" draggable="true" data-ak-col="${c.k}"><button type="button" data-ak-ordenar="${c.k}" title="Ordenar (Shift junta)">${esc(c.t)}${ordemDe(c.k)}</button><i class="ak-redim" data-ak-redim="${c.k}" aria-hidden="true"></i></th>`).join('')}</tr>`;
  const filt = e.filtrosAbertos ? `<tr class="ak-filtros">${e.grupos.length ? '<th></th>' : ''}<th></th>${cs.map((c) => `<th><input type="search" data-ak-filtro="${c.k}" value="${esc(e.filtros[c.k] ?? '')}" aria-label="Filtrar ${esc(c.t)}" placeholder="Filtrar…"></th>`).join('')}</tr>` : '';
  const soma = (xs: LinhaAk[], c: ColAk) => c.soma ? fmt(c, xs.reduce((s, l) => s + ((l[c.k] as number) ?? 0), 0)) : '';
  const corpo = nos.map((no) => {
    if (no.tipo === 'g') {
      const aberto = !e.fechados.has(no.chave), c = colDe(no.k);
      return `<tr class="ak-g" data-ak-grupo="${esc(no.chave)}" tabindex="-1" aria-expanded="${aberto}" style="--n:${no.nivel}"><td class="ak-g-c" colspan="2"><button type="button" data-ak-dobrar="${esc(no.chave)}" aria-label="${aberto ? 'Fechar' : 'Abrir'} o grupo">${L(chevronRight)}</button></td><td colspan="${cs.length}"><span class="ak-g-t"><small>${esc(c.t)}</small><b>${esc(no.valor)}</b><em>${no.linhas.length} ${no.linhas.length === 1 ? 'artigo' : 'artigos'}</em>${cs.filter((x) => x.soma).map((x) => `<span class="ak-g-s"><small>${esc(x.t)}</small>${soma(no.linhas, x)}</span>`).join('')}</span></td></tr>`;
    }
    const l = no.l, sel = e.sel.has(l.ref);
    return `<tr data-ak-ref="${esc(l.ref)}" tabindex="${l.ref === e.ativo ? 0 : -1}" aria-selected="${sel}"${l.ref === e.ativo ? ' class="is-ativo"' : ''}>${e.grupos.length ? '<td class="ak-td-g"></td>' : ''}<td class="ak-td-sel"><input type="checkbox" tabindex="-1" aria-label="Escolher ${esc(l.ref)}" data-ak-escolher="${esc(l.ref)}"${sel ? ' checked' : ''}></td>${cs.map((c) => { const v = l[c.k]; return `<td class="${c.tipo === 'n' || c.tipo === 'eur' ? 'is-num' : c.tipo === 'mono' ? 'is-mono' : ''}${v === null || v === '' ? ' is-nada' : ''}${c.k === 'stock' && (v as number) <= 0 ? ' is-rutura' : ''}">${esc(fmt(c, v))}</td>`; }).join('')}</tr>`;
  }).join('');
  const total = cs.some((c) => c.soma) && ls.length ? `<tfoot><tr>${e.grupos.length ? '<td></td>' : ''}<td></td>${cs.map((c, i) => `<td class="${c.soma ? 'is-num' : ''}">${i === 0 ? `<b>Total · ${n(ls.length)}</b>` : soma(ls, c)}</td>`).join('')}</tr></tfoot>` : '';
  const nada = !ls.length ? `<div class="ak-vazio ak-vazio--linha">${L(searchX)}<p><b>Os filtros da tabela não deixam nenhuma linha.</b>F3 tira os filtros; os critérios ficam.</p><button type="button" class="ak-btn" data-ak-acao="limpar">${L(x)}<span>Remover filtros</span></button></div>` : '';
  g.innerHTML = `<table class="ak-tab" aria-label="Artigos" aria-rowcount="${ls.length}" aria-multiselectable="true"><colgroup>${e.grupos.length ? '<col style="width:28px">' : ''}<col style="width:34px">${cs.map((c) => `<col style="width:${larg(c)}px">`).join('')}</colgroup><thead>${cab}${filt}</thead><tbody>${corpo}</tbody>${total}</table>${nada}`;
  g.scrollTop = sc; g.scrollLeft = sl;
  if (animar && !quieto()) {
    g.querySelectorAll<HTMLElement>('tbody tr').forEach((t, i) => { const a = antes.get(t.dataset.akRef ?? ''); const r0 = t.getBoundingClientRect().top;
      if (a !== undefined && Math.abs(a - r0) > 1) t.animate([{ transform: `translateY(${a - r0}px)` }, { transform: 'none' }], { duration: 220, easing: 'cubic-bezier(.22, 1, .36, 1)' });
      else if (a === undefined && i < 40) t.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 200, delay: Math.min(i, 14) * 14, easing: 'ease-out', fill: 'backwards' }); });
  }
  estado(r, e);
}
function grupos(r: HTMLElement, e: Est): void {
  const z = r.querySelector<HTMLElement>('[data-ak-grupos]')!;
  z.classList.toggle('tem-grupos', e.grupos.length > 0);
  z.innerHTML = `${L(columns3)}${e.grupos.length ? e.grupos.map((k, i) => `<span class="ak-chip" draggable="true" tabindex="0" data-ak-chip="${k}" title="Delete tira; Alt+← → muda o nível">${i ? `${L(chevronRight)}` : ''}<b>${esc(colDe(k).t)}</b><button type="button" data-ak-tirar-grupo="${k}" aria-label="Deixar de agrupar por ${esc(colDe(k).t)}">${L(x)}</button></span>`).join('') + '<button type="button" class="ak-desagrupar" data-ak-acao="desagrupar">Desagrupar</button>' : '<span class="ak-grupos-dica">Arraste para aqui o cabeçalho de uma coluna para agrupar</span>'}
    <label class="ak-agrupar-tecla"><span class="sr">Agrupar por</span><select data-ak-agrupar aria-label="Agrupar por (teclado)"><option value="">Agrupar por…</option>${COLS.filter((c) => !e.grupos.includes(c.k) && c.tipo !== 'eur').map((c) => `<option value="${c.k}">${esc(c.t)}</option>`).join('')}</select></label>`;
}
function colunasMenu(r: HTMLElement, e: Est): void {
  const m = r.querySelector<HTMLElement>('[data-ak-menu="colunas"], [data-ak-cols]'); if (!m) return;
  m.innerHTML = `<p class="ak-menu-t">Colunas à vista</p>${e.cols.map((k, i) => `<div class="ak-col-i"><label><input type="checkbox" data-ak-ver="${k}"${e.ocultas.has(k) ? '' : ' checked'}>${esc(colDe(k).t)}</label><button type="button" data-ak-mover="${k}:-1" aria-label="Subir ${esc(colDe(k).t)}"${i ? '' : ' disabled'}>${L(arrowUp)}</button><button type="button" data-ak-mover="${k}:1" aria-label="Descer ${esc(colDe(k).t)}"${i < e.cols.length - 1 ? '' : ' disabled'}>${L(arrowDown)}</button></div>`).join('')}<button type="button" class="ak-btn" data-ak-acao="todas-colunas">Mostrar todas</button>`;
}
function estado(r: HTMLElement, e: Est): void {
  const ls = e.linhas ? filtradas(e) : [];
  const fase = e.fase === 'a-gerar' ? 'A gerar…' : e.fase === 'erro' ? 'Erro ao gerar' : e.linhas ? 'Pronto' : 'Sem dados';
  const hora = e.gerado ? new Date(e.gerado).toLocaleTimeString('pt-PT') : '—';
  const nf = Object.values(e.filtros).filter((v) => v && v.trim()).length;
  if (v2(r)) { estado2(r, e, ls, nf); return; }
  r.querySelector<HTMLElement>('[data-ak-estado]')!.innerHTML = `<span>Total de artigos <b>${e.linhas ? n(ls.length) : '—'}</b>${e.linhas && ls.length !== e.linhas.length ? ` de ${n(e.linhas.length)}` : ''}</span><span>Seleção <b>${n(e.sel.size)}</b></span><span>Última atualização <b>${hora}</b></span>${nf ? `<span>Filtros da tabela <b>${nf}</b></span>` : ''}${e.grupos.length ? `<span>Agrupado por <b>${e.grupos.map((k) => esc(colDe(k).t)).join(' › ')}</b></span>` : ''}<span class="ak-estado-f is-${e.fase}">${e.fase === 'a-gerar' ? L(loader) : ''}${fase}</span>${e.aviso ? `<span class="ak-estado-aviso">${esc(e.aviso)}</span>` : ''}`;
  const nt = r.querySelector('[data-ak-n-todos]'), ns = r.querySelector('[data-ak-n-sel]');
  if (nt) nt.textContent = `(${n(ls.length)})`; if (ns) ns.textContent = `(${n(e.sel.size)})`;
  r.querySelector('[data-ak-exportar="escolhidos"]')?.toggleAttribute('disabled', !e.sel.size);
  r.querySelectorAll<HTMLButtonElement>('[data-ak-acao="exportar"], [data-ak-acao="filtrar"], [data-ak-acao="limpar"], [data-ak-acao="imprimir"]').forEach((b) => { b.disabled = !e.linhas || !e.linhas.length; });
  r.querySelectorAll<HTMLButtonElement>('[data-ak-acao="gerar"]').forEach((b) => { b.disabled = e.fase === 'a-gerar'; b.classList.toggle('is-carregar', e.fase === 'a-gerar'); });
  r.querySelector('[data-ak-acao="filtrar"]')?.setAttribute('aria-pressed', String(e.filtrosAbertos));
}
/* ---------- v2: o estado, o resumo dos resultados e os critérios em etiquetas ---------- */
const SEM_DADOS = 'Gera os dados primeiro (F10).';
function estado2(r: HTMLElement, e: Est, ls: LinhaAk[], nf: number): void {
  const fase = e.fase === 'a-gerar' ? (e.linhas ? 'A atualizar…' : 'A gerar…') : e.fase === 'erro' ? 'Erro ao gerar' : e.linhas ? 'Pronto' : 'Sem dados';
  r.querySelector<HTMLElement>('[data-ak-estado]')!.innerHTML = `<span>Seleção <b>${n(e.sel.size)}</b></span>${nf ? `<span>Filtros da tabela <b>${nf}</b></span>` : ''}${e.grupos.length ? `<span>Agrupado por <b>${e.grupos.map((k) => esc(colDe(k).t)).join(' › ')}</b></span>` : ''}<span class="ak-estado-f is-${e.fase}">${e.fase === 'a-gerar' ? L(loader) : ''}${fase}</span>${e.aviso ? `<span class="ak-estado-aviso">${esc(e.aviso)}</span>` : ''}`;
  const nt = r.querySelector('[data-ak-n-todos]'), ns = r.querySelector('[data-ak-n-sel]');
  if (nt) nt.textContent = `(${n(ls.length)})`; if (ns) ns.textContent = `(${n(e.sel.size)})`;
  r.querySelector('[data-ak-exportar="escolhidos"]')?.toggleAttribute('disabled', !e.sel.size);
  /* sem dados, os botões dizem porquê (aria-disabled deixa ver a dica e chegar-lhes com o teclado) */
  const sem = !e.linhas || !e.linhas.length;
  r.querySelectorAll<HTMLButtonElement>('.ak2-barra [data-ak-acao="exportar"], .ak2-barra [data-ak-acao="filtrar"], .ak2-barra [data-ak-acao="limpar"], .ak2-barra [data-ak-acao="imprimir"], .ak2-barra [data-ak-acao="atualizar"]').forEach((b) => {
    const ocupado = b.dataset.akAcao === 'atualizar' && e.fase === 'a-gerar';
    const porque = sem ? SEM_DADOS : ocupado ? 'A análise já está a ser pedida.' : b.dataset.akAcao === 'limpar' && !nf ? 'Não há filtros da tabela.' : '';
    b.setAttribute('aria-disabled', String(!!porque)); if (porque) b.title = porque; else b.removeAttribute('title');
  });
  r.querySelectorAll<HTMLButtonElement>('[data-ak-acao="gerar"]').forEach((b) => { b.disabled = e.fase === 'a-gerar'; b.classList.toggle('is-carregar', e.fase === 'a-gerar'); });
  r.querySelector('[data-ak-acao="filtrar"]')?.setAttribute('aria-pressed', String(e.filtrosAbertos));
  r.querySelectorAll<HTMLElement>('[data-ak-densidade]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.akDensidade === e.densidade)));
  r.querySelector<HTMLElement>('[data-ak-acao="recolher"]')?.toggleAttribute('hidden', sem);
  const va = r.querySelector<HTMLElement>('[data-ak-vista-ativa]'), at = e.vistas.find((v) => v.id === e.vista);
  if (va) { va.hidden = !at; va.innerHTML = at ? `<small>Vista</small><b>${esc(at.nome)}</b>` : ''; }
  contarMais(r);
  sumario(r, e, ls);
}
/** O resumo dos resultados: só o que vem nas linhas, e acompanha os filtros da tabela. */
function sumario(r: HTMLElement, e: Est, ls: LinhaAk[]): void {
  const s = r.querySelector<HTMLElement>('[data-ak-sumario]'); if (!s) return;
  if (!e.linhas || !e.linhas.length) { s.hidden = true; e.nums = undefined; return; }
  const nums = [ls.length, new Set(ls.map((l) => l.forn)).size, ls.reduce((t, l) => t + l.qtd, 0), ls.reduce((t, l) => t + l.valor, 0)];
  const fmtN = (i: number, v: number) => i === 3 ? euros(v) : n(Math.round(v));
  const sel = e.linhas.filter((l) => e.sel.has(l.ref));
  const hora = e.gerado ? new Date(e.gerado).toLocaleTimeString('pt-PT') : '—';
  const nomes = ['Artigos encontrados', 'Fornecedores distintos', 'Quantidade comprada', 'Valor comprado'];
  s.hidden = false;
  s.innerHTML = nomes.map((t, i) => `<span class="ak2-m${i === 3 ? ' ak2-m--valor' : ''}"><small>${t}</small><b data-ak-num="${i}">${fmtN(i, nums[i])}</b>${i === 0 && ls.length !== e.linhas!.length ? `<i>de ${n(e.linhas!.length)}</i>` : ''}</span>`).join('')
    + (sel.length > 1 ? `<span class="ak2-m ak2-m--sel"><small>Escolhidos</small><b>${n(sel.length)}</b><i>${euros(sel.reduce((t, l) => t + l.valor, 0))}</i></span>` : '')
    + `<span class="ak2-m-hora">${e.fase === 'a-gerar' ? `${L(loader)}A atualizar…` : `Gerado às <b>${hora}</b>`}</span>`;
  /* os números que mudam contam até ao novo valor (curto; sem movimento, mudam logo) */
  const antes = e.nums; e.nums = nums;
  if (!antes || quieto()) return;
  nums.forEach((v, i) => { const a = antes[i]; if (a === v) return; const b = s.querySelector<HTMLElement>(`[data-ak-num="${i}"]`); if (!b) return;
    const t0 = performance.now(), dur = 320;
    const passo = (t: number) => { const k = Math.min(1, (t - t0) / dur), f = 1 - Math.pow(1 - k, 3); b.textContent = fmtN(i, a + (v - a) * f); if (k < 1 && b.isConnected) requestAnimationFrame(passo); };
    requestAnimationFrame(passo); });
}
const TIPOS: Record<Crit['tipo'], string> = { todos: 'Todos os artigos', com: 'Com compras no período', sem: 'Sem compras no período', rutura: 'Em rutura', minimo: 'Abaixo do mínimo' };
/** As etiquetas dos critérios da análise à vista; cada uma abre os critérios nesse campo. */
function etiquetas(r: HTMLElement, e: Est): void {
  const ul = r.querySelector<HTMLElement>('[data-ak-etiquetas]'); if (!ul) return; const c = e.crit;
  const et: [string, string, boolean?][] = [['armazem', c.armazem ? `Armazém ${c.armazem}` : 'Todos os armazéns'], ['forn', c.forn || 'Todos os fornecedores'], ['de', `${dia(c.de)} – ${dia(c.ate)}`]];
  if (c.ref) et.push(['ref', `Artigo: ${c.ref}`, true]);
  if (c.fam) et.push(['fam', `Família: ${c.fam}`, true]); if (c.sub) et.push(['sub', `Subfamília: ${c.sub}`, true]);
  if (c.marca) et.push(['marca', `Marca: ${c.marca}`, true]); if (c.stock !== 'todos') et.push(['stock', c.stock === 'com' ? 'Com stock' : 'Sem stock', true]);
  if (c.tipo !== 'todos') et.push(['tipo', TIPOS[c.tipo], true]);
  ul.innerHTML = et.map(([k, t, forte]) => `<li><button type="button" class="${forte ? 'is-forte' : ''}" data-ak-etiqueta="${k}" title="Alterar">${esc(t)}</button></li>`).join('');
}
/** Quantos dos «Mais critérios» estão escolhidos (vê-se com a secção fechada). */
function contarMais(r: HTMLElement): void {
  const o = r.querySelector<HTMLElement>('[data-ak-n-mais]'); if (!o) return; const c = lerCrit(r);
  const k = [c.fam, c.sub, c.marca, c.stock !== 'todos', c.tipo !== 'todos'].filter(Boolean).length;
  o.textContent = k ? `${k} ${k === 1 ? 'escolhido' : 'escolhidos'}` : '';
}
/** Muda o que está por cima dos resultados sem saltos: a secção dos resultados parte de onde estava (FLIP, só transform). */
function deslizar(r: HTMLElement, muda: () => void): void {
  const a = r.querySelector<HTMLElement>('.ak-res'); if (!a || quieto()) { muda(); return; }
  const y0 = a.getBoundingClientRect().top; muda(); const d = y0 - a.getBoundingClientRect().top;
  if (Math.abs(d) > 1) a.animate([{ transform: `translateY(${d}px)` }, { transform: 'none' }], { duration: 220, easing: 'cubic-bezier(.22, 1, .36, 1)' });
}
/** Os critérios abertos ou em resumo. Nunca se recolhem com um erro de validação à vista. */
function resumir(r: HTMLElement, e: Est, sim: boolean, foco?: string): void {
  if (!v2(r)) return;
  if (sim && !r.querySelector<HTMLElement>('[data-ak-erro-campo]')!.hidden) return;
  if (sim) etiquetas(r, e);
  if (r.classList.contains('crit-resumo') !== sim) {
    deslizar(r, () => r.classList.toggle('crit-resumo', sim));
    const novo = r.querySelector<HTMLElement>(sim ? '[data-ak-resumo-crit]' : '[data-ak-aberto]');
    if (novo && !quieto()) novo.animate([{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: 'cubic-bezier(.22, 1, .36, 1)' });
  }
  if (!sim) {
    const alvo = foco ? r.querySelector<HTMLElement>(`[data-ak-crit] [name="${foco}"]`) : null;
    if (alvo?.closest('[data-ak-mais]')) (r.querySelector('[data-ak-mais]') as HTMLDetailsElement).open = true;
    (alvo ?? campos(r)[0])?.focus();
  }
}
/** Um aviso breve, para o que acabou de acontecer (sucesso ou erro confirmados). */
const avisos = new WeakMap<HTMLElement, number>();
function toast(r: HTMLElement, t: string): void {
  const p = r.querySelector<HTMLElement>('[data-hm-aviso]'); if (!p || !v2(r)) return;
  p.textContent = t; p.classList.add('is-visivel'); clearTimeout(avisos.get(r));
  avisos.set(r, window.setTimeout(() => p.classList.remove('is-visivel'), 2800));
}
function avisar(r: HTMLElement, e: Est, t: string): void { e.aviso = t; estado(r, e); toast(r, t); }

/* ---------- v2: vistas guardadas ---------- */
function descVista(v: Vista): string {
  const p: string[] = [];
  if (v.grupos.length) p.push(`por ${v.grupos.map((k) => colDe(k).t.toLowerCase()).join(' › ')}`);
  if (v.crit.tipo !== 'todos') p.push(TIPOS[v.crit.tipo].toLowerCase());
  if (v.crit.forn) p.push(v.crit.forn);
  p.push(v.crit.armazem ? `armazém ${v.crit.armazem}` : 'todos os armazéns');
  p.push(`${v.cols.length - v.ocultas.length} colunas`);
  return p.join(' · ');
}
function vistasMenu(r: HTMLElement, e: Est): void {
  const m = r.querySelector<HTMLElement>('[data-ak-menu="vistas"]'); if (!m) return;
  const at = e.vistas.find((v) => v.id === e.vista);
  m.innerHTML = `<p class="ak-menu-t">Vistas guardadas</p>${e.vistas.length ? `<ul class="ak2-vl">${e.vistas.map((v) => e.apagar === v.id
    ? `<li class="ak2-vl-conf"><span>Eliminar «${esc(v.nome)}»?</span><button type="button" class="ak-btn ak-btn--perigo" data-ak-vista-sim="${v.id}">${L(trash)}<span>Eliminar</span></button><button type="button" class="ak-btn" data-ak-vista-nao>${L(x)}<span>Manter</span></button></li>`
    : `<li${v.id === e.vista ? ' class="is-ativa"' : ''}><button type="button" role="menuitem" data-ak-vista-carregar="${v.id}"><b>${esc(v.nome)}</b><small>${esc(descVista(v))}</small></button><button type="button" class="ak2-vl-x" data-ak-vista-apagar="${v.id}" aria-label="Eliminar a vista ${esc(v.nome)}" title="Eliminar">${L(trash)}</button></li>`).join('')}</ul>` : '<p>Ainda não há vistas guardadas.</p>'}
  <div class="ak2-vl-acoes">
    <button type="button" class="ak-btn" data-ak-vista-atualizar${at ? '' : ' disabled title="Carrega uma vista primeiro."'}>${L(save)}<span>${at ? `Atualizar «${esc(at.nome)}»` : 'Atualizar vista'}</span></button>
    <div class="ak2-vl-nova"><input type="text" data-ak-vista-nome placeholder="Nome da nova vista" maxlength="40" aria-label="Nome da nova vista"><button type="button" class="ak-btn ak-btn--acao" data-ak-vista-guardar>${L(bookmarkPlus)}<span>Guardar vista</span></button></div>
    <p class="ak2-vl-nota" data-ak-vista-nota>Guarda os critérios, as colunas, as larguras, a ordem, os grupos e as linhas — nunca os resultados.</p>
  </div>`;
}
const vistaAtual = (r: HTMLElement, e: Est, id: string, nome: string): Vista => ({ id, nome, crit: lerCrit(r), cols: [...e.cols], ocultas: [...e.ocultas], larguras: { ...e.larguras }, ordem: e.ordem.map((o) => ({ ...o })), grupos: [...e.grupos], densidade: e.densidade });
function carregarVista(r: HTMLElement, e: Est, v: Vista): void {
  const f = r.querySelector<HTMLFormElement>('[data-ak-crit]')!;
  const ok = (k: string) => COLS.some((c) => c.k === k);
  (['armazem', 'forn', 'fam', 'de', 'ate', 'ref', 'tipo', 'marca', 'stock'] as (keyof Crit)[]).forEach((k) => { const el = f.elements.namedItem(k) as HTMLInputElement | HTMLSelectElement | null; if (el) el.value = v.crit[k] ?? ''; });
  subfamilias(r); (f.elements.namedItem('sub') as HTMLSelectElement).value = v.crit.sub ?? '';
  e.cols = [...v.cols.filter(ok), ...COLS.map((c) => c.k).filter((k) => !v.cols.includes(k))]; e.ocultas = new Set(v.ocultas.filter(ok)); e.larguras = { ...v.larguras };
  e.ordem = v.ordem.filter((o) => ok(o.k as string)); e.grupos = v.grupos.filter(ok); e.densidade = v.densidade; e.fechados.clear(); e.vista = v.id;
  guardarVista(r, e); fecharMenus(r);
  /* carregar uma vista é pedir essa análise */
  void gerarDados(r, e).then(() => { if (e.fase === 'ok') toast(r, `Vista «${v.nome}» carregada.`); });
}

/* ---------- v2: o menu da linha ---------- */
function abrirCtx(r: HTMLElement, e: Est, ref: string, x: number, y: number): void {
  const m = r.querySelector<HTMLElement>('[data-ak-ctx]'), l = e.linhas?.find((k) => k.ref === ref); if (!m || !l) return;
  const ult = l.hist[0];
  m.innerHTML = `<p class="ak-menu-t">${esc(l.ref)}</p>
    <button type="button" role="menuitem" data-ak-ctx-acao="det" data-ref="${esc(ref)}">${L(eye)}<span>Ver detalhe</span><kbd>Enter</kbd></button>
    <button type="button" role="menuitem" data-ak-ctx-acao="escolher" data-ref="${esc(ref)}">${L(squareCheck)}<span>${e.sel.has(ref) ? 'Deixar de escolher' : 'Escolher'}</span><kbd>Espaço</kbd></button>
    <button type="button" role="menuitem" data-ak-ctx-acao="copiar" data-ref="${esc(ref)}">${L(copy)}<span>Copiar a referência</span></button>
    ${ult ? `<button type="button" role="menuitem" data-dk-doc="compras.encomenda" data-dk-titulo="${esc(ult.enc)}">${L(fileText)}<span>Abrir a última encomenda</span><small>${esc(ult.enc)}</small></button>` : ''}
    <button type="button" role="menuitem" data-dk-janela="artigo:${esc(ref)}">${icone('warehouse')}<span>Stock por armazém</span></button>`;
  m.hidden = false;
  const w = m.offsetWidth, h = m.offsetHeight;
  m.style.left = `${Math.max(8, Math.min(x, innerWidth - w - 8))}px`; m.style.top = `${Math.max(8, Math.min(y, innerHeight - h - 8))}px`;
  m.querySelector<HTMLElement>('button')?.focus();
}
function fecharCtx(r: HTMLElement, voltar = false): boolean {
  const m = r.querySelector<HTMLElement>('[data-ak-ctx]'); if (!m || m.hidden) return false;
  m.hidden = true; if (voltar) r.querySelector<HTMLElement>('tbody tr.is-ativo')?.focus(); return true;
}

function detalhe(r: HTMLElement, e: Est, entrar = false): void {
  const d = r.querySelector<HTMLElement>('[data-ak-det]')!, l = e.linhas?.find((x) => x.ref === e.ativo);
  if (!e.det || !l) { if (!d.hidden) { if (quieto()) d.hidden = true; else d.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateX(24px)', opacity: 0 }], { duration: 180, easing: 'ease-in' }).onfinish = () => { d.hidden = true; }; } r.classList.remove('com-det'); return; }
  const par = (k: string, v: string) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`;
  d.innerHTML = `<header><div><small>Artigo</small><h3>${esc(l.ref)}</h3><p>${esc(l.desc)}</p></div><button type="button" class="ak-x" data-ak-acao="fechar-det" aria-label="Fechar o detalhe (Esc)">${L(x)}</button></header>
    <dl>${par('Ref. fornecedor', l.refForn)}${par('Marca', l.marca)}${par('Família', l.fam)}${par('Subfamília', l.sub)}${par('Fornecedor', l.forn)}${par('Unidade', l.un)}${par('Stock no armazém 60', n(l.stock))}${par('Mínimo', l.min === null ? '— (sem mínimo definido)' : n(l.min))}${par('Em curso', n(l.curso))}${par('Sugestão', l.sug === null ? '—' : n(l.sug))}</dl>
    <div class="ak-det-acoes"><button type="button" class="ak-btn" data-dk-janela="artigo:${esc(l.ref)}">${icone('warehouse')}<span>Stock por armazém</span></button></div>
    <h4>Compras no período <span>${l.hist.length}</span></h4>
    ${l.hist.length ? `<table class="ak-hist"><thead><tr><th>Encomenda</th><th>Data</th><th class="is-num">Qtd.</th><th class="is-num">Preço</th><th>Estado</th></tr></thead><tbody>${l.hist.map((h) => `<tr><td><button type="button" class="ak-lig" data-dk-doc="compras.encomenda" data-dk-titulo="${esc(h.enc)}">${esc(h.enc)}</button></td><td>${dia(h.data)}</td><td class="is-num">${n(h.qtd)}</td><td class="is-num">${h.preco === null ? '—' : euros(h.preco)}</td><td>${esc(h.estado)}</td></tr>`).join('')}</tbody></table>` : '<p class="ak-det-nada">Sem compras no período escolhido.</p>'}`;
  const novo = d.hidden; d.hidden = false; r.classList.add('com-det');
  if ((novo || entrar) && !quieto()) d.animate([{ transform: 'translateX(28px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 250, easing: 'cubic-bezier(.22, 1, .36, 1)' });
}
function tudo(r: HTMLElement, e: Est, animar = false): void { grupos(r, e); grelha(r, e, animar); colunasMenu(r, e); detalhe(r, e); }

/* ---------- ações ---------- */
function lerCrit(r: HTMLElement): Crit {
  const f = r.querySelector<HTMLFormElement>('[data-ak-crit]')!, v = (k: string) => (f.elements.namedItem(k) as HTMLInputElement | HTMLSelectElement | null)?.value ?? '';
  return { armazem: v('armazem'), forn: v('forn'), fam: v('fam'), sub: v('sub'), de: v('de'), ate: v('ate'), ref: v('ref'), tipo: v('tipo') as Crit['tipo'], marca: v('marca'), stock: v('stock') as Crit['stock'] };
}
function erroCampo(r: HTMLElement, campo: string, t: string): void {
  const p = r.querySelector<HTMLElement>('[data-ak-erro-campo]')!; p.hidden = false; p.textContent = t;
  const el = r.querySelector<HTMLElement>(`[data-ak-crit] [name="${campo}"]`); el?.setAttribute('aria-invalid', 'true'); el?.focus();
}
/** Gerar dados (F10) com os critérios do formulário; Atualizar (F9) passa os da última análise. */
async function gerarDados(r: HTMLElement, e: Est, usar?: Crit): Promise<void> {
  if (e.fase === 'a-gerar') return; /* nada de pedidos repetidos */
  r.querySelectorAll('[aria-invalid]').forEach((x) => x.removeAttribute('aria-invalid')); r.querySelector<HTMLElement>('[data-ak-erro-campo]')!.hidden = true;
  const c = usar ?? lerCrit(r);
  if (!c.de || !c.ate) { resumir(r, e, false); erroCampo(r, c.de ? 'ate' : 'de', 'Escolhe o período: as duas datas.'); return; }
  if (c.de > c.ate) { resumir(r, e, false); erroCampo(r, 'ate', 'O fim do período tem de ser depois do início.'); return; }
  const tinha = !!e.linhas?.length, vez = ++e.vez;
  e.fase = 'a-gerar'; e.aviso = undefined; grelha(r, e);
  /* deixa a página pintar o «A gerar…» antes de calcular (o tempo é o do cálculo, não um atraso inventado) */
  await new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)));
  if (vez !== e.vez) return; /* cancelada entretanto */
  /* v2: sem rede, o pedido nem sai — diz-se, e os critérios e os resultados anteriores ficam */
  if (v2(r) && !navigator.onLine) { falhar(r, e, 'offline'); return; }
  e.crit = c;
  try {
    const ls = gerar(c);
    e.linhas = ls; e.fase = 'ok'; e.gerado = Date.now(); e.fechados.clear(); e.tipoErro = undefined;
    e.sel = new Set([...e.sel].filter((k) => ls.some((l) => l.ref === k)));
    if (!ls.some((l) => l.ref === e.ativo)) { e.ativo = ls[0]?.ref ?? ''; e.det = false; }
    /* v2: os critérios recolhem-se num resumo e a grelha sobe para o lugar deles; depois o resumo, o cabeçalho e as linhas */
    if (v2(r)) resumir(r, e, true);
    tudo(r, e, true);
    if (v2(r) && !tinha && !quieto()) revelar(r);
    if (v2(r) && usar) toast(r, `Atualizado às ${new Date(e.gerado).toLocaleTimeString('pt-PT')}.`);
    (r.querySelector<HTMLElement>('tbody tr[tabindex="0"]') ?? r.querySelector<HTMLElement>('tbody tr[data-ak-ref]') ?? r.querySelector<HTMLElement>('[data-ak-grelha] .ak-vazio button'))?.focus({ preventScroll: true });
  } catch (err) { falhar(r, e, 'servidor'); console.error(err); }
}
function falhar(r: HTMLElement, e: Est, t: TipoErro): void {
  e.fase = 'erro'; e.tipoErro = t; e.erro = `Referência ERP-MAP-${Date.now().toString(36).slice(-5).toUpperCase()}. Os resultados anteriores ficam.`;
  grelha(r, e);
  if (v2(r) && e.linhas) toast(r, `${ERROS[t][1]} Os resultados anteriores ficam.`);
}
/** A primeira vez que chegam resultados: o resumo e a zona de agrupar entram, depois o cabeçalho (as linhas entram em grelha()). */
function revelar(r: HTMLElement): void {
  const ease = 'cubic-bezier(.22, 1, .36, 1)';
  [r.querySelector('[data-ak-sumario]'), r.querySelector('[data-ak-grupos]')].forEach((x, i) => (x as HTMLElement | null)?.animate([{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], { duration: 180, delay: i * 40, easing: ease, fill: 'backwards' }));
  r.querySelector<HTMLElement>('.ak-tab thead')?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, delay: 60, easing: 'ease-out', fill: 'backwards' });
}
function exportar(r: HTMLElement, e: Est, escopo: 'todos' | 'escolhidos'): void {
  if (!e.linhas?.length) return;
  const cs = vis(e), ls = filtradas(e).filter((l) => escopo === 'todos' || e.sel.has(l.ref));
  if (!ls.length || !cs.length) { e.aviso = 'Nada para exportar.'; estado(r, e); return; }
  e.aviso = 'A exportar…'; estado(r, e);
  try {
    const cel = (c: ColAk, v: unknown): Celula => v === null || v === undefined || v === '' ? null : c.tipo === 'n' ? v as number : c.tipo === 'eur' ? { euros: v as number } : c.tipo === 'data' ? { data: v as string } : String(v);
    /* os grupos vão como colunas à frente, para o Excel poder filtrar e somar por eles */
    const gcols = e.grupos.map(colDe), todas = [...gcols, ...cs.filter((c) => !e.grupos.includes(c.k))];
    const nome = `Artigos-Compras-${new Date().toISOString().slice(0, 10)}.xlsx`;
    descarregar(xlsx({ nome: 'Artigos Compras', colunas: todas.map((c) => c.t), linhas: ls.map((l) => todas.map((c) => cel(c, l[c.k]))), larguras: todas.map((c) => Math.round((e.larguras[c.k] ?? c.w) / 7)) }), nome);
    e.aviso = `Exportado: ${nome} · ${n(ls.length)} ${ls.length === 1 ? 'artigo' : 'artigos'} (${escopo === 'todos' ? 'todos os resultados' : 'só os escolhidos'}).`;
  } catch { e.aviso = 'A exportação falhou. Os resultados ficam; tenta outra vez (F4).'; }
  estado(r, e); toast(r, e.aviso);
}
/** Cancelar (Esc): pára uma geração em curso; senão repõe os critérios da última análise. Nunca apaga resultados. */
function cancelar(r: HTMLElement, e: Est): void {
  if (e.fase === 'a-gerar') { e.vez++; e.fase = e.linhas ? 'ok' : 'inicial'; e.aviso = 'Geração cancelada. Os resultados anteriores ficam.'; grelha(r, e); return; }
  const f = r.querySelector<HTMLFormElement>('[data-ak-crit]')!;
  (Object.entries(e.crit) as [string, string][]).forEach(([k, v]) => { const el = f.elements.namedItem(k) as HTMLInputElement | HTMLSelectElement | null; if (el) el.value = v; });
  subfamilias(r); (f.elements.namedItem('sub') as HTMLSelectElement).value = e.crit.sub;
  r.querySelectorAll('[aria-invalid]').forEach((x) => x.removeAttribute('aria-invalid')); r.querySelector<HTMLElement>('[data-ak-erro-campo]')!.hidden = true;
  e.aviso = e.linhas ? 'Critérios repostos como na última análise.' : 'Critérios repostos.'; estado(r, e);
  /* v2: com resultados, Cancelar volta ao resumo e à grelha */
  if (v2(r) && e.linhas?.length) { resumir(r, e, true); r.querySelector<HTMLElement>('tbody tr.is-ativo, tbody tr[data-ak-ref]')?.focus(); }
}
function criterios(r: HTMLElement, mostrar?: boolean): void {
  const vai = mostrar ?? r.classList.contains('sem-crit'); r.classList.toggle('sem-crit', !vai);
  const b = r.querySelector<HTMLElement>('[data-ak-acao="criterios"]')!; b.setAttribute('aria-expanded', String(vai)); b.title = vai ? 'Esconder os critérios' : 'Mostrar os critérios';
  b.querySelector('span')!.textContent = vai ? 'Esconder' : 'Mostrar';
  if (vai) campos(r)[0]?.focus();
}
function fecharMenus(r: HTMLElement): boolean {
  let fechou = false;
  r.querySelectorAll<HTMLElement>('[data-ak-menu]:not([hidden])').forEach((m) => { m.hidden = true; fechou = true; m.parentElement?.querySelector('[aria-haspopup]')?.setAttribute('aria-expanded', 'false'); });
  return fechou;
}
function abrirMenu(r: HTMLElement, qual: string, b: HTMLElement): void {
  const m = r.querySelector<HTMLElement>(`[data-ak-menu="${qual}"]`)!, ia = m.hidden; fecharMenus(r);
  if (!ia) return;
  m.hidden = false; b.setAttribute('aria-expanded', 'true');
  m.querySelector<HTMLElement>('button:not([disabled]), input')?.focus();
}
function escolherLinha(r: HTMLElement, e: Est, ref: string, modo: 'um' | 'alternar' | 'faixa', det = e.det): void {
  const ordem = [...r.querySelectorAll<HTMLElement>('tbody tr[data-ak-ref]')].map((t) => t.dataset.akRef!);
  if (modo === 'um') { e.sel = new Set([ref]); e.ancora = ref; }
  else if (modo === 'alternar') { e.sel.has(ref) ? e.sel.delete(ref) : e.sel.add(ref); e.ancora = ref; }
  else { const a = ordem.indexOf(e.ancora || ref), b = ordem.indexOf(ref); e.sel = new Set(ordem.slice(Math.min(a, b), Math.max(a, b) + 1)); }
  e.ativo = ref; e.det = det;
  r.querySelectorAll<HTMLElement>('tbody tr[data-ak-ref]').forEach((t) => { const k = t.dataset.akRef!; t.setAttribute('aria-selected', String(e.sel.has(k))); t.tabIndex = k === ref ? 0 : -1; t.classList.toggle('is-ativo', k === ref); const c = t.querySelector<HTMLInputElement>('[data-ak-escolher]'); if (c) c.checked = e.sel.has(k); });
  r.querySelector<HTMLElement>(`tbody tr[data-ak-ref="${CSS.escape(ref)}"]`)?.focus({ preventScroll: false });
  estado(r, e); detalhe(r, e);
}

function guardarNova(r: HTMLElement, e: Est): void {
  const i = r.querySelector<HTMLInputElement>('[data-ak-vista-nome]'), nota = r.querySelector<HTMLElement>('[data-ak-vista-nota]'); if (!i) return;
  const nome = i.value.trim().replace(/\s+/g, ' ');
  const diz = (t: string) => { if (nota) { nota.textContent = t; nota.classList.add('is-erro'); } i.setAttribute('aria-invalid', 'true'); i.focus(); };
  if (!nome) return diz('Escreve o nome da vista.');
  if (e.vistas.some((v) => v.nome.toLowerCase() === nome.toLowerCase())) return diz(`Já existe «${nome}». Carrega-a e usa Atualizar, ou escolhe outro nome.`);
  const v = vistaAtual(r, e, `v-${Date.now().toString(36)}`, nome), lista = [...e.vistas, v];
  if (!gravarVistas(r, lista)) return diz('Não foi possível guardar neste computador. Tenta outra vez.');
  e.vistas = lista; e.vista = v.id; vistasMenu(r, e); estado(r, e); toast(r, `Vista «${nome}» guardada.`);
  r.querySelector<HTMLElement>(`[data-ak-vista-carregar="${v.id}"]`)?.focus();
}

/* ---------- ligar ---------- */
function de(r: HTMLElement): Est { let e = estados.get(r); if (!e) { e = novo(r); estados.set(r, e); } return e; }
function armar(r: HTMLElement): void {
  if (r.dataset.akPronto) return; r.dataset.akPronto = '1';
  const e = de(r), cen = r.dataset.akCenario as CenarioAk;
  subfamilias(r);
  const erros: Partial<Record<CenarioAk, TipoErro>> = { erro: 'servidor', offline: 'offline', tempo: 'tempo', permissao: 'permissao', sessao: 'sessao' };
  if (cen === 'inicial' || cen === 'a-gerar' || cen === 'mais-criterios' || cen === 'invalido' || erros[cen]) {
    if (erros[cen]) { e.fase = 'erro'; e.tipoErro = erros[cen]; e.erro = 'Referência ERP-MAP-504. O servidor de relatórios não respondeu.'; }
    if (cen === 'a-gerar') e.fase = 'a-gerar';
    tudo(r, e);
    if (cen === 'invalido') { const f = r.querySelector<HTMLFormElement>('[data-ak-crit]')!; (f.elements.namedItem('de') as HTMLInputElement).value = '2026-10-19'; (f.elements.namedItem('ate') as HTMLInputElement).value = '2026-09-01'; r.querySelector<HTMLElement>('[name="ate"]')!.setAttribute('aria-invalid', 'true'); const p = r.querySelector<HTMLElement>('[data-ak-erro-campo]')!; p.hidden = false; p.textContent = 'O fim do período tem de ser depois do início.'; }
    return;
  }
  const c = CRIT0(); if (cen === 'vazio') { c.ref = 'VKMA 9999'; (r.querySelector('[name="ref"]') as HTMLInputElement).value = c.ref; }
  e.crit = c; e.linhas = gerar(c); e.fase = 'ok'; e.gerado = Date.now(); e.ativo = e.linhas[0]?.ref ?? ''; e.sel = new Set(e.ativo ? [e.ativo] : []);
  if (cen === 'agrupado') e.grupos = ['forn'];
  if (cen === 'detalhe') { e.det = true; e.ativo = e.linhas.find((l) => l.hist.length)?.ref ?? e.ativo; e.sel = new Set([e.ativo]); }
  if (cen === 'filtros') { e.filtrosAbertos = true; e.filtros = { desc: 'amortecedor' }; }
  if (cen === 'exportado') e.aviso = `Exportado: Artigos-Compras-${new Date().toISOString().slice(0, 10)}.xlsx · ${n(e.linhas.length)} artigos (todos os resultados).`;
  if (cen === 'export-falhou') e.aviso = 'A exportação falhou. Os resultados ficam; tenta outra vez (F4).';
  if (cen === 'a-atualizar') e.fase = 'a-gerar';
  if (cen === 'vistas') { e.vista = 'ex-forn'; e.grupos = ['forn']; e.ordem = [{ k: 'valor', dir: -1 }]; }
  if (v2(r)) { etiquetas(r, e); r.classList.add('crit-resumo'); }
  tudo(r, e);
  if (cen === 'vistas') { const b = r.querySelector<HTMLElement>('[data-ak-acao="vistas"]')!; vistasMenu(r, e); r.querySelector<HTMLElement>('[data-ak-menu="vistas"]')!.hidden = false; b.setAttribute('aria-expanded', 'true'); }
}
function subfamilias(r: HTMLElement): void {
  const f = r.querySelector<HTMLFormElement>('[data-ak-crit]')!, fam = (f.elements.namedItem('fam') as HTMLSelectElement).value, s = r.querySelector<HTMLSelectElement>('[data-ak-sub]')!, antes = s.value;
  const subs = [...new Set(gerar({ ...CRIT0(), de: '2000-01-01', ate: '2999-12-31', armazem: '' }).filter((l) => !fam || l.fam === fam).map((l) => l.sub))].sort((a, b) => a.localeCompare(b, 'pt'));
  s.innerHTML = `<option value="">Todas</option>${subs.map((x) => `<option${x === antes ? ' selected' : ''}>${esc(x)}</option>`).join('')}`;
}
const armarTodos = () => document.querySelectorAll<HTMLElement>('.ecra:not([hidden]) [data-ak]').forEach(armar);
/** Os campos onde o Enter passa: à vista e ligados. */
const campos = (r: HTMLElement) => [...r.querySelectorAll<HTMLElement>('[data-ak-crit] :is(input, select)')].filter((x) => !(x as HTMLInputElement).disabled && x.offsetParent !== null);

export function iniciar(): void {
  requestAnimationFrame(armarTodos);
  ['romafe:versao', 'romafe:ecra'].forEach((x) => document.addEventListener(x, () => requestAnimationFrame(armarTodos)));
  window.addEventListener('hashchange', () => requestAnimationFrame(armarTodos));

  document.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement, r = raiz(t); if (!r || editando()) return;
    const e = de(r); let b: HTMLElement | null;
    if (!t.closest('.ak-menu-c')) fecharMenus(r);
    /* v2: o menu da linha */
    if ((b = t.closest('[data-ak-ctx-acao]'))) {
      const ref = b.dataset.ref!, a = b.dataset.akCtxAcao; fecharCtx(r);
      if (a === 'det') { e.det = true; escolherLinha(r, e, ref, 'um', true); r.querySelector<HTMLElement>('[data-ak-det] .ak-x')?.focus(); }
      else if (a === 'escolher') escolherLinha(r, e, ref, 'alternar');
      else if (a === 'copiar') { navigator.clipboard?.writeText(ref).then(() => toast(r, `Referência ${ref} copiada.`), () => toast(r, 'Não foi possível copiar a referência.')); r.querySelector<HTMLElement>('tbody tr.is-ativo')?.focus(); }
      return;
    }
    if (!t.closest('[data-ak-ctx]')) fecharCtx(r);
    if (t.closest('[data-ak-ctx] [data-dk-doc], [data-ak-ctx] [data-dk-janela]')) { fecharCtx(r); return; }
    /* v2: os botões sem dados não fazem nada, mas dizem porquê */
    if ((b = t.closest('[data-ak-acao][aria-disabled="true"]'))) { toast(r, b.title || SEM_DADOS); return; }
    if ((b = t.closest('[data-ak-etiqueta]'))) { resumir(r, e, false, b.dataset.akEtiqueta); return; }
    if ((b = t.closest('[data-ak-densidade]'))) { e.densidade = b.dataset.akDensidade as Est['densidade']; grelha(r, e); guardarVista(r, e); return; }
    if ((b = t.closest('[data-ak-vista-carregar]'))) { const v = e.vistas.find((x) => x.id === b!.dataset.akVistaCarregar); if (v) carregarVista(r, e, v); return; }
    if ((b = t.closest('[data-ak-vista-apagar]'))) { e.apagar = b.dataset.akVistaApagar; vistasMenu(r, e); r.querySelector<HTMLElement>('[data-ak-vista-nao]')?.focus(); return; }
    if (t.closest('[data-ak-vista-nao]')) { const id = e.apagar; e.apagar = undefined; vistasMenu(r, e); r.querySelector<HTMLElement>(`[data-ak-vista-apagar="${id}"]`)?.focus(); return; }
    if ((b = t.closest('[data-ak-vista-sim]'))) {
      const v = e.vistas.find((x) => x.id === b!.dataset.akVistaSim), resto = e.vistas.filter((x) => x !== v);
      if (!v) return; e.apagar = undefined;
      if (!gravarVistas(r, resto)) { toast(r, 'Não foi possível eliminar a vista. Tenta outra vez.'); vistasMenu(r, e); return; }
      e.vistas = resto; if (e.vista === v.id) e.vista = undefined; vistasMenu(r, e); estado(r, e); toast(r, `Vista «${v.nome}» eliminada.`);
      r.querySelector<HTMLElement>('[data-ak-vista-carregar], [data-ak-vista-nome]')?.focus(); return;
    }
    if (t.closest('[data-ak-vista-atualizar]')) {
      const at = e.vistas.find((x) => x.id === e.vista); if (!at) return;
      const nova = vistaAtual(r, e, at.id, at.nome), lista = e.vistas.map((x) => x.id === at.id ? nova : x);
      if (!gravarVistas(r, lista)) { toast(r, 'Não foi possível atualizar a vista. Tenta outra vez.'); return; }
      e.vistas = lista; vistasMenu(r, e); toast(r, `Vista «${at.nome}» atualizada.`); return;
    }
    if (t.closest('[data-ak-vista-guardar]')) { guardarNova(r, e); return; }
    if ((b = t.closest('[data-ak-acao]'))) {
      const a = b.dataset.akAcao!;
      if (a === 'gerar') { ev.preventDefault(); void gerarDados(r, e); }
      else if (a === 'atualizar') void gerarDados(r, e, e.crit);
      else if (a === 'vistas') { e.apagar = undefined; vistasMenu(r, e); abrirMenu(r, 'vistas', b); }
      else if (a === 'mais') { colunasMenu(r, e); abrirMenu(r, 'mais', b); }
      else if (a === 'recolher') { resumir(r, e, true); r.querySelector<HTMLElement>('tbody tr.is-ativo, tbody tr[data-ak-ref]')?.focus(); }
      else if (a === 'filtrar') { e.filtrosAbertos = !e.filtrosAbertos; grelha(r, e); if (e.filtrosAbertos) r.querySelector<HTMLElement>('[data-ak-filtro]')?.focus(); }
      else if (a === 'limpar') { e.filtros = {}; grelha(r, e, true); r.querySelector<HTMLElement>('[data-ak-filtro]')?.focus(); }
      else if (a === 'exportar') abrirMenu(r, 'exportar', b);
      else if (a === 'colunas') abrirMenu(r, 'colunas', b);
      else if (a === 'todas-colunas') { e.ocultas.clear(); tudo(r, e); guardarVista(r, e); }
      else if (a === 'desagrupar') { e.grupos = []; e.fechados.clear(); tudo(r, e, true); guardarVista(r, e); }
      else if (a === 'fechar-det') { e.det = false; detalhe(r, e); r.querySelector<HTMLElement>('tbody tr.is-ativo')?.focus(); }
      else if (a === 'alterar') { if (v2(r)) resumir(r, e, false); else { criterios(r, true); campos(r)[0]?.focus(); } }
      else if (a === 'imprimir') { if (e.linhas?.length) window.print(); else avisar(r, e, SEM_DADOS); }
      else if (a === 'cancelar') cancelar(r, e);
      else if (a === 'criterios') criterios(r);
      return;
    }
    if ((b = t.closest('[data-ak-exportar]'))) { fecharMenus(r); exportar(r, e, b.dataset.akExportar as 'todos' | 'escolhidos'); r.querySelector<HTMLElement>('[data-ak-acao="exportar"]')?.focus(); return; }
    if ((b = t.closest('[data-ak-mover]'))) { const [k, d] = b.dataset.akMover!.split(':'), i = e.cols.indexOf(k as keyof LinhaAk), j = i + Number(d); if (j < 0 || j >= e.cols.length) return; e.cols.splice(j, 0, ...e.cols.splice(i, 1)); grelha(r, e); colunasMenu(r, e); guardarVista(r, e); r.querySelector<HTMLElement>(`[data-ak-mover="${k}:${d}"]`)?.focus(); return; }
    if ((b = t.closest('[data-ak-tirar-grupo]'))) { e.grupos = e.grupos.filter((k) => k !== b!.dataset.akTirarGrupo); e.fechados.clear(); tudo(r, e, true); guardarVista(r, e); return; }
    if ((b = t.closest('[data-ak-ordenar]'))) {
      const k = b.dataset.akOrdenar as keyof LinhaAk, o = e.ordem.find((x) => x.k === k);
      if ((ev as MouseEvent).shiftKey) { if (o) o.dir = o.dir === 1 ? -1 : 1; else e.ordem.push({ k, dir: 1 }); }
      else e.ordem = !o ? [{ k, dir: 1 }] : o.dir === 1 ? [{ k, dir: -1 }] : [];
      grelha(r, e, true); guardarVista(r, e); r.querySelector<HTMLElement>(`[data-ak-ordenar="${k}"]`)?.focus();
      /* v2: mexe só o indicador da ordem, não a tabela */
      if (v2(r) && !quieto()) r.querySelector<HTMLElement>(`th[data-ak-col="${k}"] .ak-ord`)?.animate([{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], { duration: 160, easing: 'cubic-bezier(.22, 1, .36, 1)' });
      return;
    }
    if ((b = t.closest('[data-ak-dobrar]'))) { const k = b.dataset.akDobrar!; e.fechados.has(k) ? e.fechados.delete(k) : e.fechados.add(k); grelha(r, e, true); r.querySelector<HTMLElement>(`[data-ak-grupo="${CSS.escape(k)}"]`)?.focus(); return; }
    if ((b = t.closest('[data-ak-escolher]'))) { escolherLinha(r, e, b.dataset.akEscolher!, 'alternar'); return; }
    if (t.closest('[data-ak-todas]')) { const ls = filtradas(e), tudoSel = ls.every((l) => e.sel.has(l.ref)); e.sel = tudoSel ? new Set() : new Set(ls.map((l) => l.ref)); grelha(r, e); return; }
    const tr = t.closest<HTMLElement>('tbody tr[data-ak-ref]');
    if (tr) { const me = ev as MouseEvent; escolherLinha(r, e, tr.dataset.akRef!, me.shiftKey ? 'faixa' : me.ctrlKey || me.metaKey ? 'alternar' : 'um', me.shiftKey || me.ctrlKey || me.metaKey ? e.det : true); }
  });
  document.addEventListener('change', (ev) => {
    const t = ev.target as HTMLElement, r = raiz(t); if (!r) return; const e = de(r);
    if (t.matches('[data-ak-ver]')) { const k = (t as HTMLInputElement).dataset.akVer as keyof LinhaAk; (t as HTMLInputElement).checked ? e.ocultas.delete(k) : e.ocultas.add(k); grelha(r, e); guardarVista(r, e); }
    if (t.matches('[name="fam"]')) subfamilias(r);
    if (v2(r) && t.closest('[data-ak-crit]')) contarMais(r);
    if (t.matches('[data-ak-agrupar]')) { const k = (t as HTMLSelectElement).value as keyof LinhaAk; if (k) { e.grupos.push(k); tudo(r, e, true); guardarVista(r, e); r.querySelector<HTMLElement>('[data-ak-agrupar]')?.focus(); } }
  });
  document.addEventListener('input', (ev) => {
    const t = ev.target as HTMLInputElement, r = raiz(t); if (!r || !t.matches('[data-ak-filtro]')) return;
    const e = de(r), k = t.dataset.akFiltro as keyof LinhaAk, pos = t.selectionStart; e.filtros[k] = t.value; grelha(r, e);
    const n2 = r.querySelector<HTMLInputElement>(`[data-ak-filtro="${k}"]`); n2?.focus(); if (pos !== null) n2?.setSelectionRange(pos, pos);
  });

  document.addEventListener('keydown', (ev) => {
    const t = ev.target as HTMLElement;
    const r = raiz(t) ?? document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) [data-ak]');
    if (!r || editando() || r.closest('[hidden]')) return;
    const e = de(r);
    /* v2: o menu da linha — tecla Menu ou Shift+F10 numa linha; dentro dele, ↑ ↓ e Esc */
    const ctx = t.closest<HTMLElement>('[data-ak-ctx]');
    if (ctx) {
      const bs = [...ctx.querySelectorAll<HTMLElement>('button')].filter((b) => b.offsetParent !== null), i = bs.indexOf(t);
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); bs[(i + (ev.key === 'ArrowDown' ? 1 : -1) + bs.length) % bs.length]?.focus(); }
      else if (ev.key === 'Escape' || ev.key === 'Tab') { ev.preventDefault(); fecharCtx(r, true); }
      return;
    }
    if (v2(r) && (ev.key === 'ContextMenu' || (ev.shiftKey && ev.key === 'F10'))) {
      const tr = t.closest<HTMLElement>('tbody tr[data-ak-ref]');
      if (tr) { ev.preventDefault(); ev.stopPropagation(); const q = tr.getBoundingClientRect(); abrirCtx(r, e, tr.dataset.akRef!, q.left + 40, q.bottom); return; }
    }
    /* v2: o nome da nova vista — Enter guarda */
    if (ev.key === 'Enter' && t.matches('[data-ak-vista-nome]')) { ev.preventDefault(); guardarNova(r, e); return; }
    /* as teclas do ERP antigo (e, na v2, F9 Atualizar) */
    if ((['F2', 'F3', 'F4', 'F10', 'F12'].includes(ev.key) || (ev.key === 'F9' && v2(r))) && !ev.ctrlKey && !ev.altKey && !ev.metaKey) {
      ev.preventDefault(); ev.stopPropagation();
      if (ev.key === 'F10') void gerarDados(r, e);
      else if (ev.key === 'F12') { if (e.linhas?.length) window.print(); else avisar(r, e, SEM_DADOS); }
      else if (!e.linhas?.length) avisar(r, e, SEM_DADOS);
      else if (ev.key === 'F9') { if (e.fase === 'a-gerar') toast(r, 'A análise já está a ser pedida.'); else void gerarDados(r, e, e.crit); }
      else if (ev.key === 'F2') { if (!e.filtrosAbertos) { e.filtrosAbertos = true; grelha(r, e); } r.querySelector<HTMLElement>('[data-ak-filtro]')?.focus(); }
      else if (ev.key === 'F3') { e.filtros = {}; grelha(r, e, true); e.aviso = 'Filtros da tabela removidos; os critérios ficam.'; estado(r, e); }
      else if (ev.key === 'F4') exportar(r, e, e.sel.size > 1 ? 'escolhidos' : 'todos');
      return;
    }
    if (ev.key === 'Escape') {
      if (fecharMenus(r)) { ev.preventDefault(); return; }
      if (e.det && (t.closest('[data-ak-det]') || t.closest('tbody'))) { ev.preventDefault(); e.det = false; detalhe(r, e); r.querySelector<HTMLElement>('tbody tr.is-ativo')?.focus(); return; }
      if (t.matches('[data-ak-filtro]')) { ev.preventDefault(); e.filtrosAbertos = false; grelha(r, e); r.querySelector<HTMLElement>('tbody tr[tabindex="0"]')?.focus(); return; }
      /* uma geração em curso, ou os critérios a meio: Cancelar */
      if (e.fase === 'a-gerar' || t.closest('[data-ak-crit]')) { ev.preventDefault(); cancelar(r, e); }
      return; /* nunca apaga os resultados */
    }
    /* Enter nos critérios: o campo seguinte (Shift: o anterior); no último, Gerar dados — nunca gera sozinho */
    if (ev.key === 'Enter' && t.closest('[data-ak-crit]') && t.matches('input, select')) {
      const cs = campos(r), i = cs.indexOf(t); if (i < 0) return;
      ev.preventDefault();
      if (ev.shiftKey) { cs[Math.max(0, i - 1)].focus(); return; }
      if (i < cs.length - 1) cs[i + 1].focus(); else r.querySelector<HTMLElement>('[data-ak-gerar-crit]')?.focus();
      return;
    }
    if (ev.key === 'Enter' && t.matches('[data-ak-filtro]')) { ev.preventDefault(); r.querySelector<HTMLElement>('tbody tr[tabindex="0"], tbody tr[data-ak-ref]')?.focus(); return; }
    /* as etiquetas dos grupos: Delete tira; Alt+← → muda de nível */
    const chip = t.closest<HTMLElement>('[data-ak-chip]');
    if (chip) { const k = chip.dataset.akChip as keyof LinhaAk, i = e.grupos.indexOf(k);
      if (ev.key === 'Delete' || ev.key === 'Backspace') { ev.preventDefault(); e.grupos.splice(i, 1); e.fechados.clear(); tudo(r, e, true); guardarVista(r, e); r.querySelector<HTMLElement>('[data-ak-chip], [data-ak-agrupar]')?.focus(); }
      else if (ev.altKey && (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight')) { ev.preventDefault(); const j = i + (ev.key === 'ArrowRight' ? 1 : -1); if (j >= 0 && j < e.grupos.length) { e.grupos.splice(j, 0, ...e.grupos.splice(i, 1)); e.fechados.clear(); tudo(r, e, true); guardarVista(r, e); r.querySelector<HTMLElement>(`[data-ak-chip="${k}"]`)?.focus(); } }
      return; }
    /* a grelha */
    const linha = t.closest<HTMLElement>('tbody tr');
    if (!linha || t.matches('input:not([type="checkbox"])')) return;
    const todas = [...r.querySelectorAll<HTMLElement>('tbody tr')], i = todas.indexOf(linha);
    const ir = (j: number) => { const x = todas[Math.max(0, Math.min(todas.length - 1, j))]; if (!x) return; if (x.dataset.akRef) escolherLinha(r, e, x.dataset.akRef, ev.shiftKey ? 'faixa' : 'um', e.det); else { todas.forEach((y) => { y.tabIndex = -1; }); x.tabIndex = 0; x.focus(); } };
    if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); ir(i + (ev.key === 'ArrowDown' ? 1 : -1)); return; }
    if (ev.key === 'Home' || ev.key === 'End') { ev.preventDefault(); ir(ev.key === 'Home' ? 0 : todas.length - 1); return; }
    if (ev.key === 'PageDown' || ev.key === 'PageUp') { ev.preventDefault(); ir(i + (ev.key === 'PageDown' ? 15 : -15)); return; }
    if (linha.dataset.akGrupo && (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight' || ev.key === 'Enter')) {
      ev.preventDefault(); const k = linha.dataset.akGrupo, aberto = !e.fechados.has(k);
      if (ev.key === 'Enter' || (ev.key === 'ArrowLeft') === aberto) { aberto ? e.fechados.add(k) : e.fechados.delete(k); grelha(r, e, true); r.querySelector<HTMLElement>(`[data-ak-grupo="${CSS.escape(k)}"]`)?.focus(); }
      return;
    }
    if (linha.dataset.akRef && ev.key === ' ') { ev.preventDefault(); escolherLinha(r, e, linha.dataset.akRef, 'alternar'); return; }
    if (linha.dataset.akRef && ev.key === 'Enter') { ev.preventDefault(); e.det = true; escolherLinha(r, e, linha.dataset.akRef, 'um', true); r.querySelector<HTMLElement>('[data-ak-det] .ak-x')?.focus(); return; }
  });

  /* v2: o botão direito numa linha abre o menu da linha (e escolhe-a, como no Explorador) */
  document.addEventListener('contextmenu', (ev) => {
    const t = ev.target as HTMLElement, r = raiz(t); if (!r || !v2(r) || editando()) return;
    const tr = t.closest<HTMLElement>('tbody tr[data-ak-ref]'); if (!tr) return;
    ev.preventDefault(); const e = de(r), ref = tr.dataset.akRef!;
    if (!e.sel.has(ref)) escolherLinha(r, e, ref, 'um');
    abrirCtx(r, e, ref, ev.clientX, ev.clientY);
  });
  /* v2: a ligação voltou — diz-se (não se pede nada sozinho) */
  window.addEventListener('online', () => document.querySelectorAll<HTMLElement>('[data-ak-v="2"]').forEach((r) => { const e = estados.get(r); if (e?.tipoErro === 'offline') toast(r, 'A ligação voltou. Tenta outra vez (F10).'); }));

  /* arrastar: cabeçalhos (reordenar; para a zona, agrupar) e etiquetas dos grupos (mudar de nível) */
  let arr: { tipo: 'col' | 'chip'; k: keyof LinhaAk } | null = null;
  document.addEventListener('dragstart', (ev) => {
    const t = ev.target as HTMLElement, r = raiz(t); if (!r) return;
    const th = t.closest?.<HTMLElement>('th[data-ak-col]'), ch = t.closest?.<HTMLElement>('[data-ak-chip]');
    if (th) { arr = { tipo: 'col', k: th.dataset.akCol as keyof LinhaAk }; th.classList.add('is-arrasta'); r.classList.add('a-arrastar'); }
    else if (ch) { arr = { tipo: 'chip', k: ch.dataset.akChip as keyof LinhaAk }; ch.classList.add('is-arrasta'); }
    else return;
    ev.dataTransfer?.setData('text/plain', String(arr.k)); if (ev.dataTransfer) ev.dataTransfer.effectAllowed = 'move';
  });
  document.addEventListener('dragover', (ev) => {
    if (!arr) return; const t = ev.target as HTMLElement, r = raiz(t); if (!r) return;
    const zona = t.closest('[data-ak-grupos]'), th = t.closest<HTMLElement>('th[data-ak-col]'), ch = t.closest<HTMLElement>('[data-ak-chip]');
    r.querySelectorAll('.is-alvo, .is-alvo-esq, .is-alvo-dir').forEach((x) => x.classList.remove('is-alvo', 'is-alvo-esq', 'is-alvo-dir'));
    if (zona && (arr.tipo === 'chip' || !de(r).grupos.includes(arr.k))) { ev.preventDefault(); zona.classList.add('is-alvo'); if (ch) { const rr = ch.getBoundingClientRect(); ch.classList.add(ev.clientX < rr.left + rr.width / 2 ? 'is-alvo-esq' : 'is-alvo-dir'); } }
    else if (th && arr.tipo === 'col' && th.dataset.akCol !== arr.k) { ev.preventDefault(); const rr = th.getBoundingClientRect(); th.classList.add(ev.clientX < rr.left + rr.width / 2 ? 'is-alvo-esq' : 'is-alvo-dir'); }
  });
  document.addEventListener('drop', (ev) => {
    if (!arr) return; const t = ev.target as HTMLElement, r = raiz(t); if (!r) return;
    const e = de(r), zona = t.closest('[data-ak-grupos]'), th = t.closest<HTMLElement>('th[data-ak-col]'), ch = t.closest<HTMLElement>('[data-ak-chip]');
    ev.preventDefault();
    if (zona) {
      const sem = e.grupos.filter((k) => k !== arr!.k); let j = sem.length;
      if (ch && ch.dataset.akChip !== arr.k) { const rr = ch.getBoundingClientRect(); j = sem.indexOf(ch.dataset.akChip as keyof LinhaAk) + (ev.clientX < rr.left + rr.width / 2 ? 0 : 1); }
      sem.splice(j, 0, arr.k); e.grupos = sem; e.fechados.clear(); tudo(r, e, true); guardarVista(r, e);
      if (!quieto()) r.querySelector<HTMLElement>(`[data-ak-chip="${arr.k}"]`)?.animate([{ transform: 'scale(.85)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 180, easing: 'cubic-bezier(.22, 1, .36, 1)' });
    } else if (th && arr.tipo === 'col') {
      const rr = th.getBoundingClientRect(), alvo = th.dataset.akCol as keyof LinhaAk, sem = e.cols.filter((k) => k !== arr!.k);
      sem.splice(sem.indexOf(alvo) + (ev.clientX < rr.left + rr.width / 2 ? 0 : 1), 0, arr.k); e.cols = sem; grelha(r, e); colunasMenu(r, e); guardarVista(r, e);
    }
  });
  document.addEventListener('dragend', () => { arr = null; document.querySelectorAll('.ak .is-arrasta, .ak .is-alvo, .ak .is-alvo-esq, .ak .is-alvo-dir').forEach((x) => x.classList.remove('is-arrasta', 'is-alvo', 'is-alvo-esq', 'is-alvo-dir')); document.querySelectorAll('.ak.a-arrastar').forEach((x) => x.classList.remove('a-arrastar')); });

  /* alargar uma coluna: o puxador do cabeçalho */
  let red: { r: HTMLElement; k: keyof LinhaAk; x: number; w: number } | null = null;
  document.addEventListener('pointerdown', (ev) => { const h = (ev.target as HTMLElement).closest?.<HTMLElement>('[data-ak-redim]'); const r = raiz(h); if (!h || !r) return; ev.preventDefault(); ev.stopPropagation(); const k = h.dataset.akRedim as keyof LinhaAk; red = { r, k, x: ev.clientX, w: de(r).larguras[k] ?? colDe(k).w }; });
  document.addEventListener('pointermove', (ev) => { if (!red) return; const e = de(red.r), w = Math.max(56, Math.min(520, red.w + ev.clientX - red.x)); e.larguras[red.k] = w; const i = vis(e).findIndex((c) => c.k === red!.k); const col = red.r.querySelectorAll<HTMLElement>('.ak-tab col')[i + (e.grupos.length ? 2 : 1)]; if (col) col.style.width = `${w}px`; });
  document.addEventListener('pointerup', () => { if (red) { guardarVista(red.r, de(red.r)); red = null; } });
}
