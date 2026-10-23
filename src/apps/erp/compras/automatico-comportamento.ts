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

type Ordem = { k: keyof LinhaAk; dir: 1 | -1 };
interface Est {
  crit: Crit; linhas: LinhaAk[] | null; fase: 'inicial' | 'a-gerar' | 'ok' | 'erro'; erro?: string; gerado?: number;
  ordem: Ordem[]; filtros: Partial<Record<keyof LinhaAk, string>>; filtrosAbertos: boolean; grupos: (keyof LinhaAk)[]; fechados: Set<string>;
  cols: (keyof LinhaAk)[]; ocultas: Set<keyof LinhaAk>; larguras: Partial<Record<keyof LinhaAk, number>>; densidade: 'compacta' | 'normal';
  sel: Set<string>; ativo: string; ancora: string; det: boolean; aviso?: string;
  /** cada geração tem um número; Cancelar (Esc) muda-o e a geração em curso deixa de contar */
  vez: number;
}
const CHAVE = 'erp:automatico:vista';
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
function lerVista(): Partial<Est> {
  try { const g = JSON.parse(localStorage.getItem(CHAVE) ?? 'null'); if (!g) return {};
    const ok = (k: string) => COLS.some((c) => c.k === k);
    return { cols: [...(g.cols ?? []).filter(ok), ...COLS.map((c) => c.k).filter((k) => !(g.cols ?? []).includes(k))], larguras: g.larguras ?? {}, grupos: (g.grupos ?? []).filter(ok), ordem: (g.ordem ?? []).filter((o: Ordem) => ok(o.k as string)) };
  } catch { return {}; }
}
function guardarVista(r: HTMLElement, e: Est): void {
  if (r.dataset.akCenario !== 'inicial') return;
  try { localStorage.setItem(CHAVE, JSON.stringify({ cols: e.cols, ocultas: [...e.ocultas], larguras: e.larguras, densidade: e.densidade, grupos: e.grupos, ordem: e.ordem })); } catch { /* */ }
}
function novo(r: HTMLElement): Est {
  const base: Est = { crit: CRIT0(), linhas: null, fase: 'inicial', ordem: [], filtros: {}, filtrosAbertos: false, grupos: [], fechados: new Set(), cols: COLS.map((c) => c.k), ocultas: new Set(['refForn', 'un', 'min'] as (keyof LinhaAk)[]), larguras: {}, densidade: 'compacta', sel: new Set(), ativo: '', ancora: '', det: false, vez: 0 };
  return r.dataset.akCenario === 'inicial' ? { ...base, ...lerVista() } : base;
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

/* ---------- desenhar ---------- */
const vis = (e: Est) => e.cols.filter((k) => !e.ocultas.has(k)).map(colDe);
function grelha(r: HTMLElement, e: Est, animar = false): void {
  const g = r.querySelector<HTMLElement>('[data-ak-grelha]')!;
  r.classList.toggle('is-compacta', e.densidade === 'compacta');
  r.classList.toggle('is-a-gerar', e.fase === 'a-gerar');
  const cs = vis(e);
  if (e.fase === 'inicial' && !e.linhas) { g.innerHTML = `<div class="ak-vazio">${L(play)}<p><b>Define os critérios e seleciona Gerar dados.</b>Carrega em F10 em qualquer sítio deste ecrã.</p></div>`; estado(r, e); return; }
  if (e.fase === 'erro' && !e.linhas) { g.innerHTML = `<div class="ak-vazio ak-vazio--erro">${L(circleAlert)}<p><b>Não foi possível gerar a análise.</b>${esc(e.erro ?? 'O servidor não respondeu.')}</p><button type="button" class="ak-btn ak-btn--acao" data-ak-acao="gerar">${L(rotateCw)}<span>Tentar outra vez</span></button></div>`; estado(r, e); return; }
  if (e.fase === 'a-gerar' && !e.linhas) { g.innerHTML = `<div class="ak-vazio ak-vazio--carga">${L(loader)}<p><b>A gerar a análise…</b>Os critérios ficam como estão.</p></div>`; estado(r, e); return; }
  if (!cs.length) { g.innerHTML = `<div class="ak-vazio">${L(columns3)}<p><b>Não há colunas à vista.</b>Escolhe pelo menos uma em Colunas.</p><button type="button" class="ak-btn" data-ak-acao="todas-colunas">${L(columns3)}<span>Mostrar todas</span></button></div>`; estado(r, e); return; }
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
  const m = r.querySelector<HTMLElement>('[data-ak-menu="colunas"]'); if (!m) return;
  m.innerHTML = `<p class="ak-menu-t">Colunas à vista</p>${e.cols.map((k, i) => `<div class="ak-col-i"><label><input type="checkbox" data-ak-ver="${k}"${e.ocultas.has(k) ? '' : ' checked'}>${esc(colDe(k).t)}</label><button type="button" data-ak-mover="${k}:-1" aria-label="Subir ${esc(colDe(k).t)}"${i ? '' : ' disabled'}>${L(arrowUp)}</button><button type="button" data-ak-mover="${k}:1" aria-label="Descer ${esc(colDe(k).t)}"${i < e.cols.length - 1 ? '' : ' disabled'}>${L(arrowDown)}</button></div>`).join('')}<button type="button" class="ak-btn" data-ak-acao="todas-colunas">Mostrar todas</button>`;
}
function estado(r: HTMLElement, e: Est): void {
  const ls = e.linhas ? filtradas(e) : [];
  const fase = e.fase === 'a-gerar' ? 'A gerar…' : e.fase === 'erro' ? 'Erro ao gerar' : e.linhas ? 'Pronto' : 'Sem dados';
  const hora = e.gerado ? new Date(e.gerado).toLocaleTimeString('pt-PT') : '—';
  const nf = Object.values(e.filtros).filter((v) => v && v.trim()).length;
  r.querySelector<HTMLElement>('[data-ak-estado]')!.innerHTML = `<span>Total de artigos <b>${e.linhas ? n(ls.length) : '—'}</b>${e.linhas && ls.length !== e.linhas.length ? ` de ${n(e.linhas.length)}` : ''}</span><span>Seleção <b>${n(e.sel.size)}</b></span><span>Última atualização <b>${hora}</b></span>${nf ? `<span>Filtros da tabela <b>${nf}</b></span>` : ''}${e.grupos.length ? `<span>Agrupado por <b>${e.grupos.map((k) => esc(colDe(k).t)).join(' › ')}</b></span>` : ''}<span class="ak-estado-f is-${e.fase}">${e.fase === 'a-gerar' ? L(loader) : ''}${fase}</span>${e.aviso ? `<span class="ak-estado-aviso">${esc(e.aviso)}</span>` : ''}`;
  const nt = r.querySelector('[data-ak-n-todos]'), ns = r.querySelector('[data-ak-n-sel]');
  if (nt) nt.textContent = `(${n(ls.length)})`; if (ns) ns.textContent = `(${n(e.sel.size)})`;
  r.querySelector('[data-ak-exportar="escolhidos"]')?.toggleAttribute('disabled', !e.sel.size);
  r.querySelectorAll<HTMLButtonElement>('[data-ak-acao="exportar"], [data-ak-acao="filtrar"], [data-ak-acao="limpar"], [data-ak-acao="imprimir"]').forEach((b) => { b.disabled = !e.linhas || !e.linhas.length; });
  r.querySelectorAll<HTMLButtonElement>('[data-ak-acao="gerar"]').forEach((b) => { b.disabled = e.fase === 'a-gerar'; b.classList.toggle('is-carregar', e.fase === 'a-gerar'); });
  r.querySelector('[data-ak-acao="filtrar"]')?.setAttribute('aria-pressed', String(e.filtrosAbertos));
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
async function gerarDados(r: HTMLElement, e: Est): Promise<void> {
  if (e.fase === 'a-gerar') return; /* nada de pedidos repetidos */
  r.querySelectorAll('[aria-invalid]').forEach((x) => x.removeAttribute('aria-invalid')); r.querySelector<HTMLElement>('[data-ak-erro-campo]')!.hidden = true;
  const c = lerCrit(r);
  if (!c.de || !c.ate) { erroCampo(r, c.de ? 'ate' : 'de', 'Escolhe o período: as duas datas.'); return; }
  if (c.de > c.ate) { erroCampo(r, 'ate', 'O fim do período tem de ser depois do início.'); return; }
  const antes = e.fase, vez = ++e.vez;
  e.fase = 'a-gerar'; e.aviso = undefined; grelha(r, e);
  /* deixa a página pintar o «A gerar…» antes de calcular (o tempo é o do cálculo, não um atraso inventado) */
  await new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)));
  if (vez !== e.vez) return; /* cancelada entretanto */
  void antes; e.crit = c;
  try {
    const ls = gerar(c);
    e.linhas = ls; e.fase = 'ok'; e.gerado = Date.now(); e.fechados.clear();
    e.sel = new Set([...e.sel].filter((k) => ls.some((l) => l.ref === k)));
    if (!ls.some((l) => l.ref === e.ativo)) { e.ativo = ls[0]?.ref ?? ''; e.det = false; }
    tudo(r, e, true);
    (r.querySelector<HTMLElement>('tbody tr[tabindex="0"]') ?? r.querySelector<HTMLElement>('tbody tr[data-ak-ref]') ?? r.querySelector<HTMLElement>('[data-ak-grelha] .ak-vazio button'))?.focus({ preventScroll: true });
  } catch (err) { e.fase = 'erro'; e.erro = `Referência ERP-MAP-${Date.now().toString(36).slice(-5).toUpperCase()}. Os resultados anteriores ficam.`; grelha(r, e); console.error(err); }
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
  } catch { e.aviso = 'A exportação falhou. Tenta outra vez.'; }
  estado(r, e);
}
/** Cancelar (Esc): pára uma geração em curso; senão repõe os critérios da última análise. Nunca apaga resultados. */
function cancelar(r: HTMLElement, e: Est): void {
  if (e.fase === 'a-gerar') { e.vez++; e.fase = e.linhas ? 'ok' : 'inicial'; e.aviso = 'Geração cancelada. Os resultados anteriores ficam.'; grelha(r, e); return; }
  const f = r.querySelector<HTMLFormElement>('[data-ak-crit]')!;
  (Object.entries(e.crit) as [string, string][]).forEach(([k, v]) => { const el = f.elements.namedItem(k) as HTMLInputElement | HTMLSelectElement | null; if (el) el.value = v; });
  subfamilias(r); (f.elements.namedItem('sub') as HTMLSelectElement).value = e.crit.sub;
  r.querySelectorAll('[aria-invalid]').forEach((x) => x.removeAttribute('aria-invalid')); r.querySelector<HTMLElement>('[data-ak-erro-campo]')!.hidden = true;
  e.aviso = e.linhas ? 'Critérios repostos como na última análise.' : 'Critérios repostos.'; estado(r, e);
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

/* ---------- ligar ---------- */
function de(r: HTMLElement): Est { let e = estados.get(r); if (!e) { e = novo(r); estados.set(r, e); } return e; }
function armar(r: HTMLElement): void {
  if (r.dataset.akPronto) return; r.dataset.akPronto = '1';
  const e = de(r), cen = r.dataset.akCenario as CenarioAk;
  subfamilias(r);
  if (cen === 'inicial' || cen === 'erro' || cen === 'a-gerar') { if (cen === 'erro') { e.fase = 'erro'; e.erro = 'Referência ERP-MAP-504. O servidor de relatórios não respondeu.'; } if (cen === 'a-gerar') e.fase = 'a-gerar'; tudo(r, e); return; }
  const c = CRIT0(); if (cen === 'vazio') { c.ref = 'VKMA 9999'; (r.querySelector('[name="ref"]') as HTMLInputElement).value = c.ref; }
  e.crit = c; e.linhas = gerar(c); e.fase = 'ok'; e.gerado = Date.now(); e.ativo = e.linhas[0]?.ref ?? ''; e.sel = new Set(e.ativo ? [e.ativo] : []);
  if (cen === 'agrupado') e.grupos = ['forn'];
  if (cen === 'detalhe') { e.det = true; e.ativo = e.linhas.find((l) => l.hist.length)?.ref ?? e.ativo; e.sel = new Set([e.ativo]); }
  if (cen === 'filtros') { e.filtrosAbertos = true; e.filtros = { desc: 'amortecedor' }; }
  if (cen === 'exportado') e.aviso = `Exportado: Artigos-Compras-${new Date().toISOString().slice(0, 10)}.xlsx · ${n(e.linhas.length)} artigos (todos os resultados).`;
  tudo(r, e);
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
    if ((b = t.closest('[data-ak-acao]'))) {
      const a = b.dataset.akAcao!;
      if (a === 'gerar') { ev.preventDefault(); void gerarDados(r, e); }
      else if (a === 'filtrar') { e.filtrosAbertos = !e.filtrosAbertos; grelha(r, e); if (e.filtrosAbertos) r.querySelector<HTMLElement>('[data-ak-filtro]')?.focus(); }
      else if (a === 'limpar') { e.filtros = {}; grelha(r, e, true); r.querySelector<HTMLElement>('[data-ak-filtro]')?.focus(); }
      else if (a === 'exportar') abrirMenu(r, 'exportar', b);
      else if (a === 'colunas') abrirMenu(r, 'colunas', b);
      else if (a === 'todas-colunas') { e.ocultas.clear(); tudo(r, e); guardarVista(r, e); }
      else if (a === 'desagrupar') { e.grupos = []; e.fechados.clear(); tudo(r, e, true); guardarVista(r, e); }
      else if (a === 'fechar-det') { e.det = false; detalhe(r, e); r.querySelector<HTMLElement>('tbody tr.is-ativo')?.focus(); }
      else if (a === 'alterar') { criterios(r, true); campos(r)[0]?.focus(); }
      else if (a === 'imprimir') { if (e.linhas?.length) window.print(); else { e.aviso = 'Gera os dados primeiro (F10).'; estado(r, e); } }
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
      grelha(r, e, true); guardarVista(r, e); r.querySelector<HTMLElement>(`[data-ak-ordenar="${k}"]`)?.focus(); return;
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
    /* as teclas do ERP antigo */
    if (['F2', 'F3', 'F4', 'F10', 'F12'].includes(ev.key) && !ev.ctrlKey && !ev.altKey && !ev.metaKey) {
      ev.preventDefault(); ev.stopPropagation();
      if (ev.key === 'F10') void gerarDados(r, e);
      else if (ev.key === 'F12') { if (e.linhas?.length) window.print(); else { e.aviso = 'Gera os dados primeiro (F10).'; estado(r, e); } }
      else if (!e.linhas?.length) { e.aviso = 'Gera os dados primeiro (F10).'; estado(r, e); }
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
