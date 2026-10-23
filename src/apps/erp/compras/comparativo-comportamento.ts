/* =========================================================
   ERP — Comparativo por Fornecedor v2: o que mexe (23 out. 2026). Ver compras/comparativo.ts (os dados e a conta).
   Cada página (e cada estado no editor) tem o seu estado (WeakMap); a grelha desenha-se a partir dele.
     - Período: Ano inicial e Ano final, três anos seguidos (mudar um acerta o outro); Enter passa ao seguinte e, no
       último, vai a Gerar dados; F10 gera; nunca gera sozinho. Depois de gerar, recolhe-se em «Período: 2024–2026».
     - Gerar: valida, impede pedidos repetidos, mostra a forma da grelha enquanto o pedido corre (sem percentagens),
       e depois revela os anos da esquerda para a direita, as variações a contar até ao valor e os totais por último;
       o foco vai para a primeira linha. Com erro, o período e os resultados anteriores ficam.
     - Grelha: cabeçalho em dois níveis (Fornecedor | ano | variação | ano …), Nº e Nome presos à esquerda; ordenar
       (Shift junta), filtros por coluna (F2; «>10000», «<0»), F3 tira-os, agrupar por País, Cidade ou Tendência
       (arrastar o cabeçalho ou «Agrupar por…»), Somatórios (grupos e total, com variações feitas sobre as somas),
       alargar colunas, escolher várias, ↑ ↓ Enter Espaço; Enter abre o detalhe e Esc fecha-o.
     - Excel (F4) com os números como números e as variações como percentagem; Imprimir (F12) imprime a grelha.
     - Guardar vista: colunas, larguras, ordem, grupos, ordem dos anos, linhas e Somatórios, por utilizador e empresa.
     - Mês a mês (23 out., ela: «quero num só ecrã»): o antigo «Por fornecedor» — um ano, os doze meses e o total; o
       modo é um critério (só conta depois de Gerar dados), e os meses que ainda não chegaram ficam «—».
   Movimento só em transform/opacity; com «reduzir movimento», tudo aparece logo.
   ========================================================= */
import { comparar, variacao, DIMS, ANO_ATUAL, ANO_MIN, MES_ATUAL, type RelCf, type LinhaCf, type CenarioCf, type DimCf, type DimDef } from './comparativo';
import { xlsx, descarregar, type Celula } from './xlsx';
import { euros, dia } from './dominio';
import { L, esc, icone } from '../espaco';
import x from 'lucide-static/icons/x.svg?raw';
import chevronRight from 'lucide-static/icons/chevron-right.svg?raw';
import arrowUp from 'lucide-static/icons/arrow-up.svg?raw';
import arrowDown from 'lucide-static/icons/arrow-down.svg?raw';
import arrowUpRight from 'lucide-static/icons/arrow-up-right.svg?raw';
import arrowDownRight from 'lucide-static/icons/arrow-down-right.svg?raw';
import minus from 'lucide-static/icons/minus.svg?raw';
import searchX from 'lucide-static/icons/search-x.svg?raw';
import circleAlert from 'lucide-static/icons/circle-alert.svg?raw';
import loader from 'lucide-static/icons/loader-circle.svg?raw';
import rotateCw from 'lucide-static/icons/rotate-cw.svg?raw';
import timer from 'lucide-static/icons/timer.svg?raw';
import wifiOff from 'lucide-static/icons/wifi-off.svg?raw';
import lock from 'lucide-static/icons/lock.svg?raw';
import logIn from 'lucide-static/icons/log-in.svg?raw';
import pencil from 'lucide-static/icons/pencil.svg?raw';
import calendarRange from 'lucide-static/icons/calendar-range.svg?raw';
import columns3 from 'lucide-static/icons/columns-3.svg?raw';

type TipoErro = 'servidor' | 'tempo' | 'offline' | 'permissao' | 'sessao';
type Ordem = { k: string; dir: 1 | -1 };
interface Est {
  rel: RelCf | null; fase: 'inicial' | 'a-gerar' | 'ok' | 'erro'; tipoErro?: TipoErro; erro?: string; gerado?: number; ini: number;
  ordem: Ordem[]; filtros: Record<string, string>; filtrosAbertos: boolean; grupos: string[]; fechados: Set<string>;
  ocultas: Set<string>; larguras: Record<string, number>; densidade: 'compacta' | 'normal'; recentes: boolean; somas: boolean;
  sel: Set<string>; ativo: string; ancora: string; det: boolean; aviso?: string; vez: number; nums?: number[];
  /** o modo dos resultados à vista (o do formulário é a classe cf-mensal da página) */
  modo: 'anual' | 'mensal';
  /** a dimensão do ecrã (Geral, Por artigo, Por família/subfamília, Por fornecedor) */
  d: DimDef;
}
const MESES = ['Jan.', 'Fev.', 'Mar.', 'Abr.', 'Mai.', 'Jun.', 'Jul.', 'Ago.', 'Set.', 'Out.', 'Nov.', 'Dez.'];
const modoForm = (r: HTMLElement): Est['modo'] => r.classList.contains('cf-mensal') ? 'mensal' : 'anual';
const SESSAO = { utilizador: 'rui.matos', empresa: 'emp-000001' };
const chaveVista = (d: DimDef) => `erp:comparativo-${d.id}:vista:${SESSAO.utilizador}:${SESSAO.empresa}`;
const cap = (t: string) => t[0].toUpperCase() + t.slice(1);
const SEM_DADOS = 'Gera os dados primeiro (F10).';
const estados = new WeakMap<HTMLElement, Est>();
const editando = () => document.body.classList.contains('editando') || document.body.classList.contains('com-fluxo');
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const raiz = (t: EventTarget | null) => (t as HTMLElement | null)?.closest?.<HTMLElement>('[data-cf]') ?? null;
const n = (v: number) => Math.round(v).toLocaleString('pt-PT');
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const ease = 'cubic-bezier(.22, 1, .36, 1)';
/** «+12,4 %» / «−8,7 %» (o sinal de menos tipográfico) */
const pct = (v: number) => `${v > 0.00049 ? '+' : v < -0.00049 ? '−' : ''}${(Math.abs(v) * 100).toLocaleString('pt-PT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;

/* ---------- as colunas (dependem dos anos) ---------- */
type Tipo = 'txt' | 'mono' | 'n' | 'eur' | 'pct';
interface Col { k: string; t: string; tipo: Tipo; w: number; banda: number; ano?: number; i?: number; agrupa?: boolean; futuro?: boolean }
interface Banda { t: string; sub?: string; cols: Col[]; tipo: 'forn' | 'ano' | 'var' | 'tot'; vazia?: boolean }
/** As colunas que descrevem a linha (Nº, Nome, País… conforme a dimensão). */
const descr = (e: Est): Col[] => e.d.descr.map((c) => ({ ...c, banda: 0 }));
const nomeDe = (e: Est, l: LinhaCf) => l.c[e.d.descr.filter((c) => c.fixa).slice(-1)[0]?.k ?? e.d.descr[0].k] ?? l.id;
function bandas(e: Est): Banda[] {
  const anos = e.rel?.anos ?? [], sd = new Set(e.rel?.semDados ?? []);
  const forn: Banda = { t: cap(e.d.um), tipo: 'forn', cols: descr(e).filter((c) => !e.ocultas.has(c.k)) };
  if (e.modo === 'mensal') {
    /* um ano, os doze meses e o total; os meses que ainda não chegaram ficam «—» */
    const y = anos[2], meses: Col[] = MESES.map((m, i) => ({ k: `m${i}`, t: m, tipo: 'eur', w: 100, banda: 1, ano: y, futuro: y === ANO_ATUAL && i + 1 > MES_ATUAL }));
    const tot: Col[] = [...(e.ocultas.has('qtd') ? [] : [{ k: 'tq', t: 'Quantidade', tipo: 'n' as Tipo, w: 100, banda: 2, ano: y }]), { k: 't', t: 'Líquido', tipo: 'eur', w: 128, banda: 2, ano: y }];
    return [forn, { t: String(y), sub: y === ANO_ATUAL ? 'até hoje' : undefined, tipo: 'ano', cols: meses }, { t: `Total ${y}`, tipo: 'tot', cols: tot }];
  }
  const ano = (i: number): Banda => ({ t: String(anos[i]), sub: sd.has(anos[i]) ? 'sem dados' : anos[i] === ANO_ATUAL ? 'até hoje' : undefined, tipo: 'ano', vazia: sd.has(anos[i]),
    cols: [...(e.ocultas.has('qtd') ? [] : [{ k: `q${i}`, t: 'Quantidade', tipo: 'n' as Tipo, w: 96, banda: 0, ano: anos[i], i }]), { k: `l${i}`, t: 'Líquido', tipo: 'eur', w: 124, banda: 0, ano: anos[i], i }] });
  const vr = (i: number): Banda => ({ t: `${anos[i]} → ${anos[i + 1]}`, tipo: 'var', cols: [{ k: `v${i}`, t: 'Variação', tipo: 'pct', w: 124, banda: 0, i }] });
  const ordem = e.recentes ? [2, 1, 0] : [0, 1, 2], sai: Banda[] = [forn];
  ordem.forEach((i, j) => { sai.push(ano(i)); const prox = ordem[j + 1]; if (prox !== undefined && !e.ocultas.has('var')) sai.push(vr(Math.min(i, prox))); });
  sai.forEach((b, k) => b.cols.forEach((c) => { c.banda = k; }));
  return sai;
}
const folhas = (e: Est) => bandas(e).flatMap((b) => b.cols);
const colDe = (e: Est, k: string) => folhas(e).find((c) => c.k === k) ?? descr(e).find((c) => c.k === k)!;
/** O valor de uma coluna numa linha (ou nas somas de várias). */
function valor(l: LinhaCf, k: string): unknown {
  if (k in l.c) return l.c[k];
  if (k === 't') return l.anos[2].liq;
  if (k === 'tq') return l.anos[2].qtd;
  if (k[0] === 'm') { const mm = `-${String(Number(k.slice(1)) + 1).padStart(2, '0')}-`; return l.anos[2].encs.filter((x) => x.data.slice(4, 8) === mm).reduce((s, x) => s + x.liq, 0); }
  const i = Number(k.slice(1));
  /* um mês que ainda não chegou (Geral) não é zero: fica «—» e não entra nas variações */
  if (k[0] === 'q') return l.anos[i].futuro ? undefined : l.anos[i].qtd;
  if (k[0] === 'l') return l.anos[i].futuro ? undefined : l.anos[i].liq;
  if (l.anos[i].futuro || l.anos[i + 1].futuro) return undefined;
  return variacao(l.anos[i].liq, l.anos[i + 1].liq);
}
/** As somas de um conjunto, como se fosse uma linha (a variação vem das somas, não das percentagens). */
const soma = (ls: LinhaCf[]): LinhaCf => ({ id: '', c: {}, anos: [0, 1, 2].map((i) => ({ qtd: ls.reduce((s, l) => s + l.anos[i].qtd, 0), liq: ls.reduce((s, l) => s + l.anos[i].liq, 0), encs: ls.flatMap((l) => l.anos[i].encs) })) });

/* ---------- células ---------- */
function celVar(v: unknown, anoA: number | undefined, anoB: number | undefined): string {
  if (v === undefined) return `<span class="cf-var is-nada" title="Sem compras em ${anoA} nem em ${anoB}.">—</span>`;
  if (v === null) return `<span class="cf-var is-nd" title="Sem compras em ${anoA}: não há base para calcular a variação.">N/D</span>`;
  const p = v as number, dir = p > 0.00049 ? 'sobe' : p < -0.00049 ? 'desce' : 'igual';
  return `<span class="cf-var is-${dir}" data-cf-pct="${p}">${L(dir === 'sobe' ? arrowUpRight : dir === 'desce' ? arrowDownRight : minus)}<b>${pct(p)}</b><i class="cf-barra" aria-hidden="true"><i style="--p:${Math.min(1, Math.abs(p)).toFixed(3)}"></i></i></span>`;
}
function cel(e: Est, c: Col, l: LinhaCf): string {
  const v = valor(l, c.k), anos = e.rel!.anos, sd = new Set(e.rel!.semDados);
  if (c.tipo === 'pct') return celVar(v, anos[c.i!], anos[c.i! + 1]);
  if ((c.tipo === 'n' || c.tipo === 'eur') && ((c.ano !== undefined && sd.has(c.ano)) || c.futuro || v === undefined)) return '—';
  if (c.tipo === 'n') return n(v as number);
  if (c.tipo === 'eur') return euros(v as number);
  return esc(String(v ?? '—'));
}
const fmtTexto = (c: Col, l: LinhaCf) => { const v = valor(l, c.k); return c.tipo === 'pct' ? (v === null ? 'N/D' : v === undefined ? '—' : pct(v as number)) : c.tipo === 'eur' ? euros(v as number) : c.tipo === 'n' ? n(v as number) : String(v); };

/* ---------- filtros, ordem, grupos ---------- */
/** «>10000», «<=0», «=5» comparam números (euros nos líquidos, % nas variações); o resto procura no texto. */
function passa(c: Col, l: LinhaCf, f: string): boolean {
  const m = f.trim().match(/^(>=|<=|>|<|=)\s*(-?[\d.\s]*,?\d*)\s*%?$/);
  if (m && (c.tipo === 'n' || c.tipo === 'eur' || c.tipo === 'pct')) {
    const alvo = Number(m[2].replace(/[\s.]/g, '').replace(',', '.')), v0 = valor(l, c.k);
    if (typeof v0 !== 'number' || Number.isNaN(alvo)) return false;
    const v = c.tipo === 'eur' ? v0 / 100 : c.tipo === 'pct' ? v0 * 100 : v0;
    return m[1] === '>' ? v > alvo : m[1] === '<' ? v < alvo : m[1] === '>=' ? v >= alvo : m[1] === '<=' ? v <= alvo : Math.abs(v - alvo) < 0.05;
  }
  return norm(fmtTexto(c, l)).includes(norm(f.trim()));
}
function filtradas(e: Est): LinhaCf[] {
  const fs = Object.entries(e.filtros).filter(([, v]) => v && v.trim());
  const ls = (e.rel?.linhas ?? []).filter((l) => fs.every(([k, v]) => passa(colDe(e, k), l, v)));
  const num = (v: unknown) => typeof v === 'number' ? v : null;
  const cmp = (a: LinhaCf, b: LinhaCf) => { for (const o of e.ordem) { const x = valor(a, o.k), y = valor(b, o.k);
    const nx = num(x), ny = num(y);
    let d: number;
    if (typeof x === 'string' && typeof y === 'string') d = x.localeCompare(y, 'pt', { numeric: true });
    else if (nx === null && ny === null) d = 0; else if (nx === null) return 1; else if (ny === null) return -1; else d = nx - ny; /* N/D e «—» ficam sempre no fim */
    if (d) return d * o.dir; } return 0; };
  return e.ordem.length ? ls.slice().sort(cmp) : e.d.id === 'geral' ? ls : ls.slice().sort((a, b) => b.anos[2].liq - a.anos[2].liq || b.anos[1].liq - a.anos[1].liq);
}
type No = { tipo: 'g'; chave: string; nivel: number; k: string; valor: string; linhas: LinhaCf[] } | { tipo: 'l'; l: LinhaCf };
function arvore(e: Est, ls: LinhaCf[]): No[] {
  const sai: No[] = [];
  const ramo = (xs: LinhaCf[], nivel: number, pre: string) => {
    if (nivel >= e.grupos.length) { xs.forEach((l) => sai.push({ tipo: 'l', l })); return; }
    const k = e.grupos[nivel], m = new Map<string, LinhaCf[]>();
    xs.forEach((l) => { const v = String(valor(l, k)); m.set(v, [...(m.get(v) ?? []), l]); });
    [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], 'pt')).forEach(([v, g]) => { const chave = `${pre}${k}=${v}|`; sai.push({ tipo: 'g', chave, nivel, k, valor: v, linhas: g }); if (!e.fechados.has(chave)) ramo(g, nivel + 1, chave); });
  };
  ramo(ls, 0, ''); return sai;
}

/* ---------- a vista guardada ---------- */
function lerVista(d: DimDef): Partial<Est> {
  try { const g = JSON.parse(localStorage.getItem(chaveVista(d)) ?? 'null'); if (!g) return {};
    const ok = (k: string) => d.esconder.some(([x]) => x === k), okG = (k: string) => d.descr.some((c) => c.k === k && c.agrupa);
    return { ocultas: new Set((g.ocultas ?? []).filter(ok)), larguras: g.larguras ?? {}, ordem: (g.ordem ?? []).filter((o: Ordem) => typeof o.k === 'string'), grupos: (g.grupos ?? []).filter(okG), densidade: g.densidade === 'normal' ? 'normal' : 'compacta', recentes: !!g.recentes, somas: g.somas !== false };
  } catch { return {}; }
}
function guardarVista(r: HTMLElement, e: Est): void {
  const ok = r.dataset.cfCenario !== 'inicial' || (() => { try { localStorage.setItem(chaveVista(e.d), JSON.stringify({ ocultas: [...e.ocultas], larguras: e.larguras, ordem: e.ordem, grupos: e.grupos, densidade: e.densidade, recentes: e.recentes, somas: e.somas })); return true; } catch { return false; } })();
  if (!ok) { toast(r, 'Não foi possível guardar a vista neste computador.'); return; }
  r.querySelector<HTMLElement>('[data-cf-vista]')!.hidden = false;
  toast(r, 'Vista guardada: colunas, larguras, ordem, grupos, anos, linhas e Somatórios.');
}
function novo(r: HTMLElement): Est {
  const d = DIMS[(r.dataset.cfDim as DimCf) || 'forn'];
  const base: Est = { rel: null, fase: 'inicial', ini: ANO_ATUAL - 2, ordem: [], filtros: {}, filtrosAbertos: false, grupos: [...d.grupos0], fechados: new Set(), ocultas: new Set(d.ocultas0), larguras: {}, densidade: 'compacta', recentes: false, somas: true, sel: new Set(), ativo: '', ancora: '', det: false, vez: 0, modo: modoForm(r), d };
  if (r.dataset.cfCenario !== 'inicial') return base;
  const v = lerVista(d); if (Object.keys(v).length) r.querySelector<HTMLElement>('[data-cf-vista]')!.hidden = false;
  return { ...base, ...v };
}

/* ---------- antes de haver linhas ---------- */
const PRONTO = `<div class="ak2-pronto cf-pronto">${L(calendarRange, 'cf-pronto-ic')}<div><b>Pronto para comparar</b><p>Escolhe o período e prime <kbd>F10</kbd> para gerar o comparativo.</p></div></div>`;
const ESQUELETO = `<div class="ak2-esq" aria-hidden="true">${Array.from({ length: 9 }, (_, i) => `<div class="ak2-esq-l${i ? '' : ' ak2-esq-cab'}">${[64, 180, 80, 70, 100, 90, 70, 100, 90, 70, 100].map((w, j) => `<i style="width:${Math.round(w * (i ? 0.5 + ((i * 7 + j * 3) % 5) / 10 : 0.55))}px"></i>`).join('')}</div>`).join('')}</div><p class="ak2-carga" role="status">${L(loader)}A gerar o comparativo… <span>O período fica como está; Esc cancela.</span></p>`;
const ERROS: Record<TipoErro, [string, string, string]> = {
  servidor: [circleAlert, 'Não foi possível gerar o comparativo.', ''],
  tempo: [timer, 'O servidor demorou demasiado a responder.', 'Tenta outra vez. O período fica.'],
  offline: [wifiOff, 'Sem ligação à rede.', 'O período fica. Quando a ligação voltar, tenta outra vez.'],
  permissao: [lock, 'Não tens permissão para este mapa.', 'Pede acesso a quem gere os acessos do ERP (Compras ▸ Mapas ▸ Comparativos).'],
  sessao: [logIn, 'A sessão terminou.', 'Volta a entrar para continuar. O período fica neste ecrã.'],
};
function painelErro(e: Est): string {
  const t = e.tipoErro ?? 'servidor', [ic, titulo, texto] = ERROS[t];
  const acoes = t === 'permissao' ? `<button type="button" class="ak-btn" data-cf-acao="alterar">${L(pencil)}<span>Alterar período</span></button>`
    : t === 'sessao' ? `<button type="button" class="ak-btn ak-btn--acao" data-login>${L(logIn)}<span>Voltar a entrar</span></button>`
    : `<button type="button" class="ak-btn ak-btn--acao" data-cf-acao="gerar">${L(rotateCw)}<span>Tentar outra vez</span></button>`;
  return `<div class="ak-vazio ak-vazio--erro ak2-erro is-${t}">${L(ic)}<p><b>${titulo}</b>${esc(texto || e.erro || 'O servidor não respondeu.')}</p><div class="ak2-erro-acoes">${acoes}</div></div>`;
}

/* ---------- desenhar ---------- */
function grelha(r: HTMLElement, e: Est, animar: 'nada' | 'linhas' | 'revelar' = 'nada'): void {
  const g = r.querySelector<HTMLElement>('[data-cf-grelha]')!;
  r.classList.toggle('is-compacta', e.densidade === 'compacta');
  r.classList.toggle('is-a-gerar', e.fase === 'a-gerar');
  r.classList.toggle('tem-dados', !!e.rel?.linhas.length);
  if (!e.rel) { g.innerHTML = e.fase === 'a-gerar' ? ESQUELETO : e.fase === 'erro' ? painelErro(e) : PRONTO; estado(r, e); return; }
  if (!e.rel.linhas.length) { const [a, , c] = e.rel.anos; g.innerHTML = `<div class="ak-vazio ak2-erro">${L(searchX)}<p><b>Não há compras de ${a} a ${c}.</b>Não há encomendas nesses anos. Escolhe outro período.</p><div class="ak2-erro-acoes"><button type="button" class="ak-btn" data-cf-acao="alterar">${L(pencil)}<span>Alterar período</span></button></div></div>`; estado(r, e); return; }
  const bs = bandas(e), cs = bs.flatMap((b) => b.cols), ls = filtradas(e), nos = arvore(e, ls);
  const antes = new Map<string, number>(); if (animar === 'linhas' && !quieto()) g.querySelectorAll<HTMLElement>('tr[data-cf-id]').forEach((t) => antes.set(t.dataset.cfId!, t.getBoundingClientRect().top));
  const sc = g.scrollTop, sl = g.scrollLeft;
  const larg = (c: Col) => e.larguras[c.k] ?? c.w;
  /* Nº e Nome presos à esquerda: as posições somam as larguras à frente */
  const fixas = cs.filter((c) => e.d.descr.find((y) => y.k === c.k)?.fixa), esq = new Map<string, number>(); let acc = 34;
  fixas.forEach((c) => { esq.set(c.k, acc); acc += larg(c); });
  const ultFixa = fixas[fixas.length - 1]?.k;
  const fx = (c: Col) => esq.has(c.k) ? ` is-fixa${c.k === ultFixa ? ' is-fixa-ult' : ''}" style="left:${esq.get(c.k)}px` : '';
  const cls = (c: Col) => `${c.tipo === 'n' || c.tipo === 'eur' || c.tipo === 'pct' ? 'is-num' : c.tipo === 'mono' ? 'is-mono' : ''} cf-b-${bs[c.banda].tipo}${c === bs[c.banda].cols[0] ? ' is-b-ini' : ''}`;
  const ordemDe = (k: string) => { const i = e.ordem.findIndex((o) => o.k === k); return i < 0 ? '' : `<span class="ak-ord">${L(e.ordem[i].dir === 1 ? arrowUp : arrowDown)}${e.ordem.length > 1 ? `<i>${i + 1}</i>` : ''}</span>`; };
  const sort = (k: string) => { const o = e.ordem.find((y) => y.k === k); return o ? (o.dir === 1 ? 'ascending' : 'descending') : 'none'; };
  const cab1 = `<tr class="cf-bandas"><th class="ak-th-sel is-fixa" style="left:0" rowspan="2"><input type="checkbox" aria-label="Escolher todas" data-cf-todas${ls.length && ls.every((l) => e.sel.has(l.id)) ? ' checked' : ''}></th>${bs.map((b, k) => `<th scope="colgroup" colspan="${b.cols.length}" class="cf-banda cf-b-${b.tipo}${b.vazia ? ' is-vazia' : ''}${b.tipo === 'forn' ? ' is-fixa" style="left:34px' : ''}" data-g="${k}"><span>${b.tipo === 'var' ? `<small>Variação</small> ${esc(b.t)}` : esc(b.t)}${b.sub ? `<em>${b.sub}</em>` : ''}</span></th>`).join('')}</tr>`;
  const cab2 = `<tr class="cf-folhas">${cs.map((c) => `<th scope="col" class="${cls(c)}${fx(c)}" aria-sort="${sort(c.k)}" data-g="${c.banda}" data-cf-col="${c.k}"${c.agrupa ? ' draggable="true"' : ''}><button type="button" data-cf-ordenar="${c.k}" title="Ordenar${c.ano ? ` ${c.t.toLowerCase()} de ${c.ano}` : ''} (Shift junta)">${esc(c.t)}${ordemDe(c.k)}</button><i class="ak-redim" data-cf-redim="${c.k}" aria-hidden="true"></i></th>`).join('')}</tr>`;
  const filt = e.filtrosAbertos ? `<tr class="ak-filtros"><th class="is-fixa" style="left:0"></th>${cs.map((c) => `<th class="${fx(c) ? fx(c).slice(1) : ''}"><input type="search" data-cf-filtro="${c.k}" value="${esc(e.filtros[c.k] ?? '')}" aria-label="Filtrar ${esc(c.t)}${c.ano ? ` ${c.ano}` : ''}" placeholder="${c.tipo === 'txt' || c.tipo === 'mono' ? 'Filtrar…' : c.tipo === 'pct' ? '<0' : '>0'}"></th>`).join('')}</tr>` : '';
  const desc = cs.filter((c) => c.banda === 0).length;
  const linhaSoma = (s: LinhaCf, rot: string, extra = '') => cs.filter((c) => c.banda > 0).map((c) => `<td class="${cls(c)}" data-g="${c.banda}">${cel(e, c, s)}</td>`).join('') + extra + rot;
  const corpo = nos.map((no) => {
    if (no.tipo === 'g') {
      const aberto = !e.fechados.has(no.chave), c = colDe(e, no.k);
      return `<tr class="ak-g cf-g" data-cf-grupo="${esc(no.chave)}" tabindex="-1" aria-expanded="${aberto}" style="--n:${no.nivel}"><td class="ak-g-c is-fixa" style="left:0"><button type="button" data-cf-dobrar="${esc(no.chave)}" aria-label="${aberto ? 'Fechar' : 'Abrir'} o grupo">${L(chevronRight)}</button></td><td colspan="${desc}" class="is-fixa is-fixa-ult" style="left:34px"><span class="ak-g-t"><small>${esc(c.t)}</small><b>${esc(no.valor)}</b><em>${no.linhas.length} ${no.linhas.length === 1 ? e.d.um : e.d.varios}</em></span></td>${e.somas ? linhaSoma(soma(no.linhas), '') : `<td colspan="${cs.length - desc}"></td>`}</tr>`;
    }
    const l = no.l, sel = e.sel.has(l.id);
    return `<tr data-cf-id="${esc(l.id)}" tabindex="${l.id === e.ativo ? 0 : -1}" aria-selected="${sel}"${l.id === e.ativo ? ' class="is-ativo"' : ''}><td class="ak-td-sel is-fixa" style="left:0"><input type="checkbox" tabindex="-1" aria-label="Escolher ${esc(nomeDe(e, l))}" data-cf-escolher="${esc(l.id)}"${sel ? ' checked' : ''}></td>${cs.map((c) => { const t = cel(e, c, l); return `<td class="${cls(c)}${fx(c)}${t === '—' ? ' is-nada' : (c.tipo === 'n' || c.tipo === 'eur') && valor(l, c.k) === 0 ? ' is-zero' : ''}" data-g="${c.banda}">${t}</td>`; }).join('')}</tr>`;
  }).join('');
  const total = e.somas && ls.length ? `<tfoot><tr><td class="is-fixa" style="left:0"></td><td colspan="${desc}" class="is-fixa is-fixa-ult" style="left:34px"><b>Total · ${n(ls.length)} ${ls.length === 1 ? e.d.um : e.d.varios}</b></td>${linhaSoma(soma(ls), '')}</tr></tfoot>` : '';
  const nada = !ls.length ? `<div class="ak-vazio ak-vazio--linha">${L(searchX)}<p><b>Os filtros da tabela não deixam ${e.d.nenhum}.</b>F3 tira os filtros; o período fica.</p><button type="button" class="ak-btn" data-cf-acao="limpar">${L(x)}<span>Remover filtros</span></button></div>` : '';
  g.innerHTML = `<table class="ak-tab cf-tab" aria-label="${esc(e.d.titulo)}" aria-rowcount="${ls.length}" aria-multiselectable="true"><colgroup><col style="width:34px">${cs.map((c) => `<col style="width:${larg(c)}px">`).join('')}</colgroup><thead>${cab1}${cab2}${filt}</thead><tbody>${corpo}</tbody>${total}</table>${nada}`;
  g.scrollTop = sc; g.scrollLeft = sl;
  if (!quieto()) {
    if (animar === 'revelar') revelarGrelha(g);
    else if (animar === 'linhas') g.querySelectorAll<HTMLElement>('tbody tr').forEach((t, i) => { const a = antes.get(t.dataset.cfId ?? ''), r0 = t.getBoundingClientRect().top;
      if (a !== undefined && Math.abs(a - r0) > 1) t.animate([{ transform: `translateY(${a - r0}px)` }, { transform: 'none' }], { duration: 220, easing: ease });
      else if (a === undefined && i < 40) t.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: 'ease-out' }); });
  }
  estado(r, e);
}
/** A revelação: os anos entram da esquerda para a direita (banda a banda), as variações contam até ao valor e as
    barras crescem; os totais chegam no fim. Só as primeiras 40 linhas mexem — o resto aparece logo. */
function revelarGrelha(g: HTMLElement): void {
  const linhas = [...g.querySelectorAll<HTMLElement>('tbody tr')].slice(0, 40);
  const passo = 70, dur = 240;
  g.querySelectorAll<HTMLElement>('thead th[data-g]').forEach((th) => th.animate([{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], { duration: dur, delay: Number(th.dataset.g) * passo, easing: ease, fill: 'backwards' }));
  linhas.forEach((tr, i) => tr.querySelectorAll<HTMLElement>('td[data-g]').forEach((td) => td.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: Number(td.dataset.g) * passo + 40 + Math.min(i, 12) * 10, easing: 'ease-out', fill: 'backwards' })));
  const pcts = linhas.flatMap((tr) => [...tr.querySelectorAll<HTMLElement>('[data-cf-pct]')]);
  pcts.forEach((s) => s.querySelector<HTMLElement>('.cf-barra > i')?.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(var(--p))' }], { duration: 320, delay: Number(s.closest('td')!.dataset.g) * passo + 80, easing: ease, fill: 'backwards' }));
  contar(pcts.map((s) => [s.querySelector('b')!, Number(s.dataset.cfPct)] as [HTMLElement, number]), (v) => pct(v), 360, 120);
  g.querySelector<HTMLElement>('tfoot')?.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 220, delay: 5 * passo + 120, easing: ease, fill: 'backwards' });
}
/** Os números contam de 0 (ou do valor anterior) até ao real, todos no mesmo ciclo. */
function contar(alvos: [HTMLElement, number, number?][], fmt: (v: number) => string, dur = 320, atraso = 0): void {
  if (!alvos.length || quieto()) return;
  const t0 = performance.now() + atraso;
  alvos.forEach(([b, , de]) => { b.textContent = fmt(de ?? 0); });
  const passo = (t: number) => { const k = Math.max(0, Math.min(1, (t - t0) / dur)), f = 1 - Math.pow(1 - k, 3);
    alvos.forEach(([b, v, de]) => { if (b.isConnected) b.textContent = fmt((de ?? 0) + (v - (de ?? 0)) * f); });
    if (k < 1) requestAnimationFrame(passo); };
  requestAnimationFrame(passo);
}
function zonaGrupos(r: HTMLElement, e: Est): void {
  const z = r.querySelector<HTMLElement>('[data-cf-grupos]')!;
  z.classList.toggle('tem-grupos', e.grupos.length > 0);
  const nome = (k: string) => colDe(e, k).t, agr = descr(e).filter((c) => c.agrupa).map((c) => c.t);
  z.innerHTML = `${L(columns3)}${e.grupos.length ? e.grupos.map((k, i) => `<span class="ak-chip" draggable="true" tabindex="0" data-cf-chip="${k}" title="Delete tira; Alt+← → muda o nível">${i ? L(chevronRight) : ''}<b>${esc(nome(k))}</b><button type="button" data-cf-tirar-grupo="${k}" aria-label="Deixar de agrupar por ${esc(nome(k))}">${L(x)}</button></span>`).join('') + '<button type="button" class="ak-desagrupar" data-cf-acao="desagrupar">Desagrupar</button>' : `<span class="ak-grupos-dica">Arraste para aqui o cabeçalho ${agr.length > 1 ? `${agr.slice(0, -1).join(', ')} ou ${agr[agr.length - 1]}` : agr[0]} para agrupar</span>`}
    <label class="ak-agrupar-tecla"><span class="sr">Agrupar por</span><select data-cf-agrupar aria-label="Agrupar por (teclado)"><option value="">Agrupar por…</option>${descr(e).filter((c) => c.agrupa && !e.grupos.includes(c.k)).map((c) => `<option value="${c.k}">${esc(c.t)}</option>`).join('')}</select></label>`;
}
function colunasMenu(r: HTMLElement, e: Est): void {
  const m = r.querySelector<HTMLElement>('[data-cf-cols]'); if (!m) return;
  m.innerHTML = `<p class="ak-menu-t">Colunas à vista</p>${e.d.esconder.map(([k, t]) => `<div class="ak-col-i cf-col-i"><label><input type="checkbox" data-cf-ver="${k}"${e.ocultas.has(k) ? '' : ' checked'}>${t}</label></div>`).join('')}<p>${esc(e.d.descr.filter((c) => c.fixa).map((c) => c.t).join(' e '))} e os líquidos ficam sempre.</p>`;
  r.querySelectorAll<HTMLElement>('[data-cf-densidade]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.cfDensidade === e.densidade)));
  r.querySelectorAll<HTMLElement>('[data-cf-anos]').forEach((b) => b.setAttribute('aria-checked', String((b.dataset.cfAnos === 'recentes') === e.recentes)));
}
function estado(r: HTMLElement, e: Est): void {
  const ls = e.rel ? filtradas(e) : [], nf = Object.values(e.filtros).filter((v) => v && v.trim()).length;
  const fase = e.fase === 'a-gerar' ? (e.rel ? 'A atualizar…' : 'A gerar…') : e.fase === 'erro' ? 'Erro ao gerar' : e.rel ? 'Pronto' : 'Sem dados';
  r.querySelector<HTMLElement>('[data-cf-estado]')!.innerHTML = `<span>Seleção <b>${n(e.sel.size)}</b></span>${nf ? `<span>Filtros da tabela <b>${nf}</b></span>` : ''}${e.grupos.length ? `<span>Agrupado por <b>${e.grupos.map((k) => esc(colDe(e, k).t)).join(' › ')}</b></span>` : ''}<span>Somatórios <b>${e.somas ? 'sim' : 'não'}</b></span><span class="ak-estado-f is-${e.fase}">${e.fase === 'a-gerar' ? L(loader) : ''}${fase}</span>${e.aviso ? `<span class="ak-estado-aviso">${esc(e.aviso)}</span>` : ''}`;
  const nt = r.querySelector('[data-cf-n-todos]'), ns = r.querySelector('[data-cf-n-sel]');
  if (nt) nt.textContent = `(${n(ls.length)})`; if (ns) ns.textContent = `(${n(e.sel.size)})`;
  r.querySelector('[data-cf-exportar="escolhidos"]')?.toggleAttribute('disabled', !e.sel.size);
  const sem = !e.rel?.linhas.length;
  r.querySelectorAll<HTMLButtonElement>('.ak2-barra [data-cf-acao="exportar"], .ak2-barra [data-cf-acao="filtrar"], .ak2-barra [data-cf-acao="limpar"], .ak2-barra [data-cf-acao="imprimir"], .ak2-barra [data-cf-acao="atualizar"]').forEach((b) => {
    const porque = sem ? SEM_DADOS : b.dataset.cfAcao === 'atualizar' && e.fase === 'a-gerar' ? 'O comparativo já está a ser pedido.' : b.dataset.cfAcao === 'limpar' && !nf ? 'Não há filtros da tabela.' : '';
    b.setAttribute('aria-disabled', String(!!porque)); if (porque) b.title = porque; else b.removeAttribute('title');
  });
  r.querySelectorAll<HTMLButtonElement>('[data-cf-acao="gerar"]').forEach((b) => { b.disabled = e.fase === 'a-gerar'; b.classList.toggle('is-carregar', e.fase === 'a-gerar'); });
  r.querySelector('[data-cf-acao="filtrar"]')?.setAttribute('aria-pressed', String(e.filtrosAbertos));
  r.querySelector('[data-cf-acao="somas"]')?.setAttribute('aria-pressed', String(e.somas));
  r.querySelector<HTMLElement>('[data-cf-acao="recolher"]')?.toggleAttribute('hidden', sem);
  sumario(r, e, ls);
}
/** O resumo: fornecedores, o líquido e a quantidade de cada ano, as variações e a global — do que passa nos filtros. */
function sumario(r: HTMLElement, e: Est, ls: LinhaCf[]): void {
  const s = r.querySelector<HTMLElement>('[data-cf-sumario]')!, pt = r.querySelector<HTMLElement>('[data-cf-imprimir-t]')!;
  if (!e.rel?.linhas.length) { s.hidden = true; e.nums = undefined; return; }
  const t = soma(ls), [a0, a1, a2] = e.rel.anos, sd = new Set(e.rel.semDados);
  const hora = e.gerado ? new Date(e.gerado).toLocaleTimeString('pt-PT') : '—';
  r.querySelector<HTMLElement>('[data-cf-gerado]')!.innerHTML = `Gerado às <b>${hora}</b>`;
  if (e.modo === 'mensal') {
    /* mês a mês: o ano, a quantidade, as encomendas e o mês com mais compras */
    const ms = MESES.map((_, i) => valor(t, `m${i}`) as number), top = ms.indexOf(Math.max(...ms));
    s.hidden = false;
    s.innerHTML = `<span class="ak2-m"><small>${cap(e.d.varios)}</small><b data-cf-num="0">${n(ls.length)}</b>${ls.length !== e.rel.linhas.length ? `<i>de ${n(e.rel.linhas.length)}</i>` : ''}</span><span class="ak2-m"><small>Líquido ${a2}</small><b data-cf-num="3">${euros(t.anos[2].liq)}</b><i>${n(t.anos[2].qtd)} un.</i></span><span class="ak2-m"><small>Encomendas</small><b>${n(new Set(t.anos[2].encs.map((x) => x.ref)).size)}</b></span>${ms[top] > 0 ? `<span class="ak2-m"><small>Mês com mais compras</small><b>${MESES[top].replace('.', '')} ${a2}</b><i>${euros(ms[top])}</i></span>` : ''}${e.fase === 'a-gerar' ? `<span class="ak2-m-hora">${L(loader)}A atualizar…</span>` : ''}`;
    pt.textContent = `${e.d.titulo} · ${a2} mês a mês · ${n(ls.length)} ${e.d.varios} · gerado às ${hora}`;
    e.nums = [ls.length, 0, 0, t.anos[2].liq]; return;
  }
  const ano = (i: number) => `<span class="ak2-m cf-m-ano${sd.has(e.rel!.anos[i]) ? ' is-vazio' : ''}"><small>Líquido ${e.rel!.anos[i]}</small><b data-cf-num="${i + 1}">${sd.has(e.rel!.anos[i]) ? 'sem dados' : euros(t.anos[i].liq)}</b><i>${sd.has(e.rel!.anos[i]) ? '' : `${n(t.anos[i].qtd)} un.`}</i></span>`;
  const vr = (i: number) => `<span class="cf-m-var">${celVar(variacao(t.anos[i].liq, t.anos[i + 1].liq), e.rel!.anos[i], e.rel!.anos[i + 1])}</span>`;
  s.hidden = false;
  s.innerHTML = `<span class="ak2-m"><small>${cap(e.d.varios)} ${e.d.id === 'geral' ? 'comparados' : e.d.id === 'familia' ? 'analisadas' : 'analisados'}</small><b data-cf-num="0">${n(ls.length)}</b>${ls.length !== e.rel.linhas.length ? `<i>de ${n(e.rel.linhas.length)}</i>` : ''}</span>${ano(0)}${vr(0)}${ano(1)}${vr(1)}${ano(2)}<span class="ak2-m cf-m-global"><small>Variação ${a0} → ${a2}</small>${celVar(variacao(t.anos[0].liq, t.anos[2].liq), a0, a2)}</span>${e.fase === 'a-gerar' ? `<span class="ak2-m-hora">${L(loader)}A atualizar…</span>` : ''}`
    + (sd.size ? `<p class="cf-parcial">${L(circleAlert)}<span><b>Dados parciais.</b> ${[...sd].join(' e ')} não ${sd.size === 1 ? 'tem' : 'têm'} compras registadas no ERP: ${sd.size === 1 ? 'a coluna fica vazia' : 'as colunas ficam vazias'} e as variações a partir ${sd.size === 1 ? 'desse ano' : 'desses anos'} ficam N/D. Nada é estimado.</span></p>` : '');
  pt.textContent = `${e.d.titulo} · ${a0}–${a2} · ${n(ls.length)} ${e.d.varios} · ${a1 === ANO_ATUAL || a2 === ANO_ATUAL ? `${ANO_ATUAL} até hoje · ` : ''}gerado às ${hora}`;
  const nums = [ls.length, t.anos[0].liq, t.anos[1].liq, t.anos[2].liq], antes = e.nums; e.nums = nums;
  if (!antes || quieto()) return;
  const alvos: [HTMLElement, number, number?][] = [];
  nums.forEach((v, i) => { if (antes[i] === v || (i && sd.has(e.rel!.anos[i - 1]))) return; const b = s.querySelector<HTMLElement>(`[data-cf-num="${i}"]`); if (b) alvos.push([b, v, antes[i]]); });
  alvos.forEach(([b, v, de]) => contar([[b, v, de]], (y) => b.dataset.cfNum === '0' ? n(y) : euros(Math.round(y))));
}
/** As etiquetas do período, no resumo dos critérios. */
function etiquetas(r: HTMLElement, e: Est): void {
  const ul = r.querySelector<HTMLElement>('[data-cf-etiquetas]'); if (!ul || !e.rel) return; const [a0, , a2] = e.rel.anos;
  ul.innerHTML = e.modo === 'mensal'
    ? `<li><button type="button" class="is-forte" data-cf-etiqueta title="Alterar o período">${a2}</button></li><li><button type="button" data-cf-etiqueta title="Alterar o período">Mês a mês</button></li><li><span class="cf-etq">líquido sem IVA${a2 === ANO_ATUAL ? ' · até hoje' : ''}</span></li>`
    : `<li><button type="button" class="is-forte" data-cf-etiqueta title="Alterar o período">${a0}–${a2}</button></li><li><button type="button" data-cf-etiqueta title="Alterar o período">Variação anual</button></li><li><span class="cf-etq">três anos · líquido sem IVA${a2 === ANO_ATUAL ? ` · ${ANO_ATUAL} até hoje` : ''}</span></li>`;
}
function detalhe(r: HTMLElement, e: Est, entrar = false): void {
  const d = r.querySelector<HTMLElement>('[data-cf-det]')!, l = e.rel?.linhas.find((y) => y.id === e.ativo);
  if (!e.det || !l || !e.rel) { if (!d.hidden) { if (quieto()) d.hidden = true; else d.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateX(24px)', opacity: 0 }], { duration: 180, easing: 'ease-in' }).onfinish = () => { d.hidden = true; }; } r.classList.remove('com-det'); return; }
  const anos = e.rel.anos, sd = new Set(e.rel.semDados), mensal = e.modo === 'mensal';
  /* as barras: o líquido de cada ano (ou de cada mês, no mês a mês), à mesma escala */
  const serie: [string, number | null][] = mensal
    ? MESES.map((m, i) => [m.slice(0, 3), anos[2] === ANO_ATUAL && i + 1 > MES_ATUAL ? null : valor(l, `m${i}`) as number])
    : l.anos.map((a, i) => [String(anos[i]), sd.has(anos[i]) ? null : a.liq]);
  const max = Math.max(1, ...serie.map(([, v]) => v ?? 0));
  const W = 300, H = 132, k = serie.length, bw = mensal ? 16 : 54, gap = (W - k * bw) / k;
  const curto = (v: number) => mensal ? (v >= 100000 ? `${Math.round(v / 100000)} mil` : v ? String(Math.round(v / 100)) : '') : euros(v).replace(/,\d\d €$/, ' €');
  const barras = serie.map(([rot, v], i) => { const h = Math.round(((v ?? 0) / max) * (H - 34)), xx = Math.round(gap / 2 + i * (bw + gap));
    return `<g><rect class="cf-bar${i === k - 1 || (mensal && v === max) ? ' is-ult' : ''}" x="${xx}" y="${H - 18 - h}" width="${bw}" height="${Math.max(h, v ? 2 : 0)}" rx="3" style="--i:${mensal ? i / 3 : i}"/><text class="cf-bar-v" x="${xx + bw / 2}" y="${H - 22 - h}" text-anchor="middle">${v === null ? (mensal ? '' : 'sem dados') : curto(v)}</text><text class="cf-bar-a" x="${xx + bw / 2}" y="${H - 4}" text-anchor="middle">${rot}</text></g>`; }).join('');
  const linhasAno = l.anos.map((a, i) => `<tr><th scope="row">${anos[i]}</th><td class="is-num">${sd.has(anos[i]) ? '—' : n(a.qtd)}</td><td class="is-num">${sd.has(anos[i]) ? '—' : euros(a.liq)}</td><td class="is-num">${i ? celVar(variacao(l.anos[i - 1].liq, a.liq), anos[i - 1], anos[i]) : ''}</td></tr>`).join('');
  const encs = l.anos.flatMap((a, i) => a.encs.map((y) => ({ ...y, ano: anos[i] })));
  const [cabP, cabT, cabL] = e.d.cab(l), jan = e.d.janelas(l);
  d.innerHTML = `<header><div><small>${esc(cabP)}</small><h3>${esc(cabT)}</h3><p>${esc(cabL)}</p></div><button type="button" class="ak-x" data-cf-acao="fechar-det" aria-label="Fechar o detalhe (Esc)">${L(x)}</button></header>
    <figure class="cf-graf"><figcaption>${mensal ? `Líquido por mês · ${anos[2]}` : 'Líquido por ano'}</figcaption><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Líquido: ${l.anos.map((a, i) => `${anos[i]} ${euros(a.liq)}`).join(', ')}">${barras}<line x1="0" x2="${W}" y1="${H - 18}" y2="${H - 18}" class="cf-bar-base"/></svg></figure>
    <table class="ak-hist cf-det-tab"><thead><tr><th>Ano</th><th class="is-num">Quantidade</th><th class="is-num">Líquido</th><th class="is-num">Variação</th></tr></thead><tbody>${linhasAno}</tbody></table>
    ${jan.length ? `<div class="ak-det-acoes">${jan.map(([j, ic, t]) => `<button type="button" class="ak-btn" data-dk-janela="${esc(j)}">${icone(ic)}<span>${t}</span></button>`).join('')}</div>` : ''}
    <h4>Encomendas no período <span>${encs.length}</span></h4>
    ${encs.length ? `<table class="ak-hist"><thead><tr><th>Encomenda</th><th>Data</th><th class="is-num">Qtd.</th><th class="is-num">Líquido</th></tr></thead><tbody>${encs.map((y) => `<tr><td>${y.arquivo ? `<span class="cf-arq" title="Encomenda fechada (arquivo de ${y.ano})">${esc(y.ref)}</span>` : `<button type="button" class="ak-lig" data-dk-doc="compras.encomenda" data-dk-titulo="${esc(y.ref)}">${esc(y.ref)}</button>`}</td><td>${dia(y.data)}</td><td class="is-num">${n(y.qtd)}</td><td class="is-num">${euros(y.liq)}</td></tr>`).join('')}</tbody></table>` : '<p class="ak-det-nada">Sem encomendas no período.</p>'}`;
  const vem = d.hidden; d.hidden = false; r.classList.add('com-det');
  if ((vem || entrar) && !quieto()) d.animate([{ transform: 'translateX(28px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 250, easing: ease });
}
function tudo(r: HTMLElement, e: Est, animar: 'nada' | 'linhas' | 'revelar' = 'nada'): void { zonaGrupos(r, e); grelha(r, e, animar); colunasMenu(r, e); detalhe(r, e); }

/** O modo do formulário (Variação anual ou Mês a mês); só conta depois de Gerar dados. */
function modoEm(r: HTMLElement, m: Est['modo']): void {
  r.classList.toggle('cf-mensal', m === 'mensal');
  r.querySelectorAll<HTMLElement>('[data-cf-modo]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.cfModo === m)));
}

/* ---------- avisos breves ---------- */
const avisos = new WeakMap<HTMLElement, number>();
function toast(r: HTMLElement, t: string): void {
  const p = r.querySelector<HTMLElement>('[data-hm-aviso]'); if (!p) return;
  p.textContent = t; p.classList.add('is-visivel'); clearTimeout(avisos.get(r));
  avisos.set(r, window.setTimeout(() => p.classList.remove('is-visivel'), 2800));
}
function avisar(r: HTMLElement, e: Est, t: string): void { e.aviso = t; estado(r, e); toast(r, t); }

/* ---------- o período ---------- */
const campos = (r: HTMLElement) => [...r.querySelectorAll<HTMLInputElement>('[data-cf-crit] input')].filter((i) => i.offsetParent !== null);
const ler = (r: HTMLElement) => { const f = r.querySelector<HTMLFormElement>('[data-cf-crit]')!; return { ini: (f.elements.namedItem('ini') as HTMLInputElement).value.trim(), fim: (f.elements.namedItem('fim') as HTMLInputElement).value.trim() }; };
function erroCampo(r: HTMLElement, campo: string, t: string): void {
  const p = r.querySelector<HTMLElement>('[data-cf-erro]')!; p.hidden = false; p.textContent = t;
  const el = r.querySelector<HTMLElement>(`[data-cf-crit] [name="${campo}"]`); el?.setAttribute('aria-invalid', 'true'); el?.focus();
}
function limparErro(r: HTMLElement): void { r.querySelectorAll('[data-cf-crit] [aria-invalid]').forEach((y) => y.removeAttribute('aria-invalid')); r.querySelector<HTMLElement>('[data-cf-erro]')!.hidden = true; }
/** Valida o período; devolve o ano inicial, ou null (com o erro à vista). */
function validar(r: HTMLElement): number | null {
  const { ini, fim } = ler(r), a = Number(ini), b = Number(fim);
  if (modoForm(r) === 'mensal') {
    if (!/^\d{4}$/.test(fim)) { erroCampo(r, 'fim', 'Escreve o ano com quatro algarismos.'); return null; }
    if (b > ANO_ATUAL) { erroCampo(r, 'fim', `${b} ainda não começou: o ano pode ir até ${ANO_ATUAL}.`); return null; }
    if (b < ANO_MIN) { erroCampo(r, 'fim', `O ERP não tem compras antes de ${ANO_MIN}.`); return null; }
    return b - 2;
  }
  if (!/^\d{4}$/.test(ini)) { erroCampo(r, 'ini', 'Escreve o ano inicial com quatro algarismos.'); return null; }
  if (!/^\d{4}$/.test(fim)) { erroCampo(r, 'fim', 'Escreve o ano final com quatro algarismos.'); return null; }
  if (a < ANO_MIN) { erroCampo(r, 'ini', `O ERP não tem compras antes de ${ANO_MIN}.`); return null; }
  if (b > ANO_ATUAL) { erroCampo(r, 'fim', `${b} ainda não começou: o ano final pode ir até ${ANO_ATUAL}.`); return null; }
  if (b - a !== 2) { erroCampo(r, 'fim', `O comparativo tem três anos seguidos: com ${a} no início, o ano final é ${a + 2}.`); return null; }
  return a;
}
function resumir(r: HTMLElement, e: Est, sim: boolean): void {
  if (sim && !r.querySelector<HTMLElement>('[data-cf-erro]')!.hidden) return;
  if (sim) etiquetas(r, e);
  if (r.classList.contains('crit-resumo') !== sim) {
    const a = r.querySelector<HTMLElement>('.ak-res')!, y0 = a.getBoundingClientRect().top;
    r.classList.toggle('crit-resumo', sim);
    if (!quieto()) {
      const d = y0 - a.getBoundingClientRect().top; if (Math.abs(d) > 1) a.animate([{ transform: `translateY(${d}px)` }, { transform: 'none' }], { duration: 220, easing: ease });
      r.querySelector<HTMLElement>(sim ? '.ak2-resumo-crit' : '.ak2-aberto')?.animate([{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: ease });
    }
  }
  if (!sim) campos(r)[0]?.focus();
}
async function gerarDados(r: HTMLElement, e: Est, mesmo = false): Promise<void> {
  if (e.fase === 'a-gerar') return; /* nada de pedidos repetidos */
  limparErro(r);
  const a0 = mesmo && e.rel ? e.rel.anos[0] : validar(r);
  if (a0 === null) { resumir(r, e, false); validar(r); return; }
  const tinha = !!e.rel?.linhas.length, vez = ++e.vez;
  e.fase = 'a-gerar'; e.aviso = undefined; grelha(r, e);
  /* deixa a página pintar a carga antes de calcular (o tempo é o do cálculo, não um atraso inventado) */
  await new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)));
  if (vez !== e.vez) return;
  if (!navigator.onLine) { falhar(r, e, 'offline'); return; }
  try {
    const modo = mesmo ? e.modo : modoForm(r), base = comparar(e.d.id, a0);
    /* mês a mês: só os fornecedores com compras nesse ano */
    const rel: RelCf = modo === 'mensal' ? { ...base, linhas: base.linhas.filter((l) => l.anos[2].encs.length), semDados: base.semDados.filter((y) => y === base.anos[2]) } : base;
    const mudou = !e.rel || e.rel.anos[0] !== rel.anos[0] || e.modo !== modo;
    e.rel = rel; e.modo = modo; e.ini = a0; e.fase = 'ok'; e.gerado = Date.now(); e.tipoErro = undefined; e.fechados.clear();
    e.sel = new Set([...e.sel].filter((k) => rel.linhas.some((l) => l.id === k)));
    if (!rel.linhas.some((l) => l.id === e.ativo)) { e.ativo = filtradas(e)[0]?.id ?? ''; e.det = false; }
    resumir(r, e, true);
    if (mudou) e.nums = undefined;
    tudo(r, e, !tinha || mudou ? 'revelar' : 'linhas');
    if (!quieto() && (!tinha || mudou)) [r.querySelector('[data-cf-sumario]'), r.querySelector('[data-cf-grupos]')].forEach((y, i) => (y as HTMLElement | null)?.animate([{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], { duration: 200, delay: i * 40, easing: ease, fill: 'backwards' }));
    if (mesmo) toast(r, `Atualizado às ${new Date(e.gerado).toLocaleTimeString('pt-PT')}.`);
    (r.querySelector<HTMLElement>('tbody tr[tabindex="0"]') ?? r.querySelector<HTMLElement>('tbody tr[data-cf-id]') ?? r.querySelector<HTMLElement>('[data-cf-grelha] .ak-vazio button'))?.focus({ preventScroll: true });
  } catch (err) { falhar(r, e, 'servidor'); console.error(err); }
}
function falhar(r: HTMLElement, e: Est, t: TipoErro): void {
  e.fase = e.rel ? 'ok' : 'erro'; e.tipoErro = t; e.erro = `Referência ERP-MAP-${Date.now().toString(36).slice(-5).toUpperCase()}. O período fica.`;
  if (e.rel) { e.fase = 'ok'; grelha(r, e); avisar(r, e, `${ERROS[t][1]} Os resultados anteriores ficam.`); }
  else { e.fase = 'erro'; grelha(r, e); }
}
function cancelar(r: HTMLElement, e: Est): void {
  if (e.fase === 'a-gerar') { e.vez++; e.fase = e.rel ? 'ok' : 'inicial'; grelha(r, e); avisar(r, e, e.rel ? 'Pedido cancelado. Os resultados anteriores ficam.' : 'Pedido cancelado.'); return; }
  const f = r.querySelector<HTMLFormElement>('[data-cf-crit]')!, a0 = e.rel?.anos[0] ?? e.ini;
  if (e.rel) modoEm(r, e.modo);
  (f.elements.namedItem('ini') as HTMLInputElement).value = String(a0); (f.elements.namedItem('fim') as HTMLInputElement).value = String(a0 + 2);
  limparErro(r);
  if (e.rel?.linhas.length) { resumir(r, e, true); r.querySelector<HTMLElement>('tbody tr.is-ativo, tbody tr[data-cf-id]')?.focus(); }
  else { e.aviso = 'Período reposto.'; estado(r, e); }
}
function exportar(r: HTMLElement, e: Est, escopo: 'todos' | 'escolhidos'): void {
  if (!e.rel?.linhas.length) return;
  const cs = folhas(e), ls = filtradas(e).filter((l) => escopo === 'todos' || e.sel.has(l.id)), sd = new Set(e.rel.semDados);
  if (!ls.length) { avisar(r, e, 'Nada para exportar.'); return; }
  try {
    const titulo = (c: Col) => c.tipo === 'pct' ? `Variação ${e.rel!.anos[c.i!]}→${e.rel!.anos[c.i! + 1]}` : c.k === 't' || c.k === 'tq' ? `${c.t} ${c.ano} (total)` : c.ano ? `${c.t} ${c.ano}` : c.t;
    const celula = (c: Col, l: LinhaCf): Celula => { const v = valor(l, c.k);
      if ((c.ano !== undefined && sd.has(c.ano)) || c.futuro) return null;
      return c.tipo === 'pct' ? (typeof v === 'number' ? { pct: v } : v === null ? 'N/D' : null) : c.tipo === 'eur' ? { euros: v as number } : c.tipo === 'n' ? v as number : c.k === 'num' ? Number(v) : v === undefined ? null : String(v); };
    const gcols = e.grupos.map((k) => colDe(e, k)), todas = [...gcols, ...cs.filter((c) => !e.grupos.includes(c.k))];
    const linhas = ls.map((l) => todas.map((c) => celula(c, l)));
    if (e.somas) { const t = soma(ls); linhas.push(todas.map((c, i) => c.banda === 0 || e.grupos.includes(c.k) ? (i === 0 ? `Total (${ls.length})` : null) : celula(c, t))); }
    const [a0, , a2] = e.rel.anos, nome = e.modo === 'mensal' ? `Comparativo-${e.d.ficheiro}-${a2}-mensal.xlsx` : `Comparativo-${e.d.ficheiro}-${a0}-${a2}.xlsx`;
    descarregar(xlsx({ nome: e.modo === 'mensal' ? `Comparativo ${a2} mensal` : `Comparativo ${a0}-${a2}`, colunas: todas.map(titulo), linhas, larguras: todas.map((c) => Math.max(10, Math.round((e.larguras[c.k] ?? c.w) / 7))) }), nome);
    avisar(r, e, `Exportado: ${nome} · ${n(ls.length)} ${ls.length === 1 ? e.d.um : e.d.varios} (${escopo === 'todos' ? 'todas as linhas' : 'só as escolhidas'})${e.somas ? ', com o total' : ''}.`);
  } catch { avisar(r, e, 'A exportação falhou. Os resultados ficam; tenta outra vez (F4).'); }
}
function imprimir(r: HTMLElement, e: Est): void { if (e.rel?.linhas.length) window.print(); else avisar(r, e, SEM_DADOS); }
function fecharMenus(r: HTMLElement): boolean {
  let fechou = false;
  r.querySelectorAll<HTMLElement>('[data-cf-menu]:not([hidden])').forEach((m) => { m.hidden = true; fechou = true; m.parentElement?.querySelector('[aria-haspopup]')?.setAttribute('aria-expanded', 'false'); });
  return fechou;
}
function abrirMenu(r: HTMLElement, qual: string, b: HTMLElement): void {
  const m = r.querySelector<HTMLElement>(`[data-cf-menu="${qual}"]`)!, ia = m.hidden; fecharMenus(r); if (!ia) return;
  m.hidden = false; b.setAttribute('aria-expanded', 'true'); m.querySelector<HTMLElement>('button:not([disabled]), input')?.focus();
}
function escolher(r: HTMLElement, e: Est, id: string, modo: 'um' | 'alternar' | 'faixa', det = e.det): void {
  const ordem = [...r.querySelectorAll<HTMLElement>('tbody tr[data-cf-id]')].map((t) => t.dataset.cfId!);
  if (modo === 'um') { e.sel = new Set([id]); e.ancora = id; }
  else if (modo === 'alternar') { e.sel.has(id) ? e.sel.delete(id) : e.sel.add(id); e.ancora = id; }
  else { const a = ordem.indexOf(e.ancora || id), b = ordem.indexOf(id); e.sel = new Set(ordem.slice(Math.min(a, b), Math.max(a, b) + 1)); }
  e.ativo = id; e.det = det;
  r.querySelectorAll<HTMLElement>('tbody tr[data-cf-id]').forEach((t) => { const k = t.dataset.cfId!; t.setAttribute('aria-selected', String(e.sel.has(k))); t.tabIndex = k === id ? 0 : -1; t.classList.toggle('is-ativo', k === id); const c = t.querySelector<HTMLInputElement>('[data-cf-escolher]'); if (c) c.checked = e.sel.has(k); });
  r.querySelector<HTMLElement>(`tbody tr[data-cf-id="${CSS.escape(id)}"]`)?.focus();
  estado(r, e); detalhe(r, e);
}

/* ---------- ligar ---------- */
function de(r: HTMLElement): Est { let e = estados.get(r); if (!e) { e = novo(r); estados.set(r, e); } return e; }
function armar(r: HTMLElement): void {
  if (r.dataset.cfPronto) return; r.dataset.cfPronto = '1';
  const e = de(r), cen = r.dataset.cfCenario as CenarioCf, f = r.querySelector<HTMLFormElement>('[data-cf-crit]')!;
  const anos = (a: number, b = a + 2) => { (f.elements.namedItem('ini') as HTMLInputElement).value = String(a); (f.elements.namedItem('fim') as HTMLInputElement).value = String(b); };
  const erros: Partial<Record<CenarioCf, TipoErro>> = { erro: 'servidor', tempo: 'tempo', offline: 'offline', permissao: 'permissao', sessao: 'sessao' };
  if (cen === 'inicial' || cen === 'a-gerar' || cen === 'invalido' || erros[cen]) {
    if (erros[cen]) { e.fase = 'erro'; e.tipoErro = erros[cen]; e.erro = 'Referência ERP-MAP-504. O servidor de relatórios não respondeu.'; }
    if (cen === 'a-gerar') e.fase = 'a-gerar';
    tudo(r, e);
    if (cen === 'invalido') { anos(ANO_ATUAL - 1, ANO_ATUAL + 1); const p = r.querySelector<HTMLElement>('[data-cf-erro]')!; p.hidden = false; p.textContent = `${ANO_ATUAL + 1} ainda não começou: o ano final pode ir até ${ANO_ATUAL}.`; f.querySelector('[name="fim"]')!.setAttribute('aria-invalid', 'true'); }
    return;
  }
  const a0 = cen === 'parcial' ? ANO_ATUAL - 3 : cen === 'vazio' ? ANO_ATUAL - 8 : ANO_ATUAL - 2;
  anos(a0); e.rel = comparar(e.d.id, a0);
  if (cen === 'mensal') { e.modo = 'mensal'; e.rel = { ...e.rel, linhas: e.rel.linhas.filter((l) => l.anos[2].encs.length), semDados: [] }; } e.ini = a0; e.fase = 'ok'; e.gerado = Date.now();
  e.ativo = filtradas(e)[0]?.id ?? ''; e.sel = new Set(e.ativo ? [e.ativo] : []);
  if (cen === 'agrupado') { e.grupos = [e.d.grupoEx]; e.ocultas.delete(e.d.grupoEx); }
  if (cen === 'detalhe') { e.det = true; e.ativo = e.d.exemplo; e.sel = new Set([e.d.exemplo]); }
  if (cen === 'filtros') { e.filtrosAbertos = true; e.filtros = { v1: '<0' }; }
  if (cen === 'a-atualizar') e.fase = 'a-gerar';
  if (cen === 'exportado') e.aviso = `Exportado: Comparativo-${e.d.ficheiro}-${a0}-${a0 + 2}.xlsx · ${n(e.rel.linhas.length)} ${e.d.varios} (todas as linhas), com o total.`;
  if (cen === 'export-falhou') e.aviso = 'A exportação falhou. Os resultados ficam; tenta outra vez (F4).';
  etiquetas(r, e);
  if (cen !== 'editar' && e.rel.linhas.length) r.classList.add('crit-resumo');
  tudo(r, e);
}
const armarTodos = () => document.querySelectorAll<HTMLElement>('.ecra:not([hidden]) [data-cf]').forEach(armar);

export function iniciar(): void {
  requestAnimationFrame(armarTodos);
  ['romafe:versao', 'romafe:ecra'].forEach((y) => document.addEventListener(y, () => requestAnimationFrame(armarTodos)));
  window.addEventListener('hashchange', () => requestAnimationFrame(armarTodos));

  document.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement, r = raiz(t); if (!r || editando()) return;
    const e = de(r); let b: HTMLElement | null;
    if (!t.closest('.ak-menu-c')) fecharMenus(r);
    if ((b = t.closest('[data-cf-acao][aria-disabled="true"]'))) { toast(r, b.title || SEM_DADOS); return; }
    if (t.closest('[data-cf-etiqueta]')) { resumir(r, e, false); return; }
    if ((b = t.closest('[data-cf-modo]'))) { modoEm(r, b.dataset.cfModo as Est['modo']); limparErro(r); campos(r).find((i) => i.name === (modoForm(r) === 'mensal' ? 'fim' : 'ini'))?.focus(); return; }
    if ((b = t.closest('[data-cf-densidade]'))) { e.densidade = b.dataset.cfDensidade as Est['densidade']; grelha(r, e); colunasMenu(r, e); return; }
    if ((b = t.closest('[data-cf-anos]'))) { e.recentes = b.dataset.cfAnos === 'recentes'; grelha(r, e, 'revelar'); colunasMenu(r, e); return; }
    if ((b = t.closest('[data-cf-acao]'))) {
      const a = b.dataset.cfAcao!;
      if (a === 'gerar') { ev.preventDefault(); void gerarDados(r, e); }
      else if (a === 'atualizar') void gerarDados(r, e, true);
      else if (a === 'filtrar') { e.filtrosAbertos = !e.filtrosAbertos; grelha(r, e); if (e.filtrosAbertos) r.querySelector<HTMLElement>('[data-cf-filtro]')?.focus(); }
      else if (a === 'limpar') { e.filtros = {}; grelha(r, e, 'linhas'); avisar(r, e, 'Filtros da tabela removidos; o período fica.'); }
      else if (a === 'exportar') abrirMenu(r, 'exportar', b);
      else if (a === 'mais') { colunasMenu(r, e); abrirMenu(r, 'mais', b); }
      else if (a === 'imprimir') imprimir(r, e);
      else if (a === 'somas') { e.somas = !e.somas; grelha(r, e); r.querySelector<HTMLElement>('tfoot')?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180 }); }
      else if (a === 'guardar') guardarVista(r, e);
      else if (a === 'desagrupar') { e.grupos = []; e.fechados.clear(); tudo(r, e, 'linhas'); }
      else if (a === 'fechar-det') { e.det = false; detalhe(r, e); r.querySelector<HTMLElement>('tbody tr.is-ativo')?.focus(); }
      else if (a === 'alterar') resumir(r, e, false);
      else if (a === 'recolher') { cancelar(r, e); }
      else if (a === 'cancelar') cancelar(r, e);
      return;
    }
    if ((b = t.closest('[data-cf-exportar]'))) { fecharMenus(r); exportar(r, e, b.dataset.cfExportar as 'todos' | 'escolhidos'); r.querySelector<HTMLElement>('[data-cf-acao="exportar"]')?.focus(); return; }
    if ((b = t.closest('[data-cf-tirar-grupo]'))) { e.grupos = e.grupos.filter((k) => k !== b!.dataset.cfTirarGrupo); e.fechados.clear(); tudo(r, e, 'linhas'); return; }
    if ((b = t.closest('[data-cf-ordenar]'))) {
      const k = b.dataset.cfOrdenar!, o = e.ordem.find((y) => y.k === k);
      if ((ev as MouseEvent).shiftKey) { if (o) o.dir = o.dir === 1 ? -1 : 1; else e.ordem.push({ k, dir: 1 }); }
      /* texto: A→Z, Z→A, sem ordem; números: do maior para o menor primeiro */
      else { const d1: 1 | -1 = descr(e).some((c) => c.k === k) ? 1 : -1; e.ordem = !o ? [{ k, dir: d1 }] : o.dir === d1 ? [{ k, dir: d1 === 1 ? -1 : 1 }] : []; }
      grelha(r, e, 'linhas'); r.querySelector<HTMLElement>(`[data-cf-ordenar="${k}"]`)?.focus();
      if (!quieto()) r.querySelector<HTMLElement>(`th[data-cf-col="${k}"] .ak-ord`)?.animate([{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], { duration: 160, easing: ease });
      return;
    }
    if ((b = t.closest('[data-cf-dobrar]'))) { const k = b.dataset.cfDobrar!; e.fechados.has(k) ? e.fechados.delete(k) : e.fechados.add(k); grelha(r, e, 'linhas'); r.querySelector<HTMLElement>(`[data-cf-grupo="${CSS.escape(k)}"]`)?.focus(); return; }
    if ((b = t.closest('[data-cf-escolher]'))) { escolher(r, e, b.dataset.cfEscolher!, 'alternar'); return; }
    if (t.closest('[data-cf-todas]')) { const ls = filtradas(e), todos = ls.every((l) => e.sel.has(l.id)); e.sel = todos ? new Set() : new Set(ls.map((l) => l.id)); grelha(r, e); return; }
    const tr = t.closest<HTMLElement>('tbody tr[data-cf-id]');
    if (tr) { const me = ev as MouseEvent; escolher(r, e, tr.dataset.cfId!, me.shiftKey ? 'faixa' : me.ctrlKey || me.metaKey ? 'alternar' : 'um', me.shiftKey || me.ctrlKey || me.metaKey ? e.det : true); }
  });
  document.addEventListener('change', (ev) => {
    const t = ev.target as HTMLElement, r = raiz(t); if (!r) return; const e = de(r);
    if (t.matches('[data-cf-ver]')) { const k = (t as HTMLInputElement).dataset.cfVer!; (t as HTMLInputElement).checked ? e.ocultas.delete(k) : e.ocultas.add(k); if (e.ocultas.has(k)) e.grupos = e.grupos.filter((g) => g !== k); tudo(r, e); }
    if (t.matches('[data-cf-agrupar]')) { const k = (t as HTMLSelectElement).value; if (k) { e.grupos.push(k); e.ocultas.delete(k); tudo(r, e, 'linhas'); r.querySelector<HTMLElement>('[data-cf-agrupar]')?.focus(); } }
  });
  document.addEventListener('input', (ev) => {
    const t = ev.target as HTMLInputElement, r = raiz(t); if (!r) return; const e = de(r);
    /* três anos seguidos: mudar um acerta o outro */
    if (t.matches('[data-cf-crit] [name="ini"], [data-cf-crit] [name="fim"]') && /^\d{4}$/.test(t.value)) {
      const f = r.querySelector<HTMLFormElement>('[data-cf-crit]')!, outro = f.elements.namedItem(t.name === 'ini' ? 'fim' : 'ini') as HTMLInputElement;
      outro.value = String(Number(t.value) + (t.name === 'ini' ? 2 : -2)); limparErro(r);
      outro.animate?.([{ backgroundColor: 'color-mix(in srgb, var(--h-azul) 14%, var(--h-sup))' }, { backgroundColor: 'var(--h-sup)' }], { duration: 500 });
      return;
    }
    if (!t.matches('[data-cf-filtro]')) return;
    const k = t.dataset.cfFiltro!, pos = t.selectionStart; e.filtros[k] = t.value; grelha(r, e);
    const n2 = r.querySelector<HTMLInputElement>(`[data-cf-filtro="${k}"]`); n2?.focus(); if (pos !== null) n2?.setSelectionRange(pos, pos);
  });

  document.addEventListener('keydown', (ev) => {
    const t = ev.target as HTMLElement;
    const r = raiz(t) ?? document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) [data-cf]');
    if (!r || editando() || r.closest('[hidden]')) return;
    const e = de(r);
    if (['F2', 'F3', 'F4', 'F9', 'F10', 'F12'].includes(ev.key) && !ev.ctrlKey && !ev.altKey && !ev.metaKey && !ev.shiftKey) {
      ev.preventDefault(); ev.stopPropagation();
      if (ev.key === 'F10') void gerarDados(r, e);
      else if (ev.key === 'F12') imprimir(r, e);
      else if (!e.rel?.linhas.length) avisar(r, e, SEM_DADOS);
      else if (ev.key === 'F9') { if (e.fase === 'a-gerar') toast(r, 'O comparativo já está a ser pedido.'); else void gerarDados(r, e, true); }
      else if (ev.key === 'F2') { if (!e.filtrosAbertos) { e.filtrosAbertos = true; grelha(r, e); } r.querySelector<HTMLElement>('[data-cf-filtro]')?.focus(); }
      else if (ev.key === 'F3') { e.filtros = {}; grelha(r, e, 'linhas'); avisar(r, e, 'Filtros da tabela removidos; o período fica.'); }
      else if (ev.key === 'F4') exportar(r, e, e.sel.size > 1 ? 'escolhidos' : 'todos');
      return;
    }
    if (ev.key === 'Escape') {
      if (fecharMenus(r)) { ev.preventDefault(); return; }
      if (e.det && (t.closest('[data-cf-det]') || t.closest('tbody'))) { ev.preventDefault(); e.det = false; detalhe(r, e); r.querySelector<HTMLElement>('tbody tr.is-ativo')?.focus(); return; }
      if (t.matches('[data-cf-filtro]')) { ev.preventDefault(); e.filtrosAbertos = false; grelha(r, e); r.querySelector<HTMLElement>('tbody tr[tabindex="0"]')?.focus(); return; }
      if (e.fase === 'a-gerar' || t.closest('[data-cf-crit]')) { ev.preventDefault(); cancelar(r, e); }
      return;
    }
    /* Enter no período: o campo seguinte; no último, Gerar dados (nunca gera sozinho) */
    if (ev.key === 'Enter' && t.matches('[data-cf-crit] input')) {
      const cs = campos(r), i = cs.indexOf(t as HTMLInputElement); ev.preventDefault();
      if (ev.shiftKey) { cs[Math.max(0, i - 1)]?.focus(); return; }
      if (i < cs.length - 1) cs[i + 1].focus(); else r.querySelector<HTMLElement>('[data-cf-gerar-crit]')?.focus();
      return;
    }
    if (ev.key === 'Enter' && t.matches('[data-cf-filtro]')) { ev.preventDefault(); r.querySelector<HTMLElement>('tbody tr[tabindex="0"], tbody tr[data-cf-id]')?.focus(); return; }
    const chip = t.closest<HTMLElement>('[data-cf-chip]');
    if (chip) { const k = chip.dataset.cfChip!, i = e.grupos.indexOf(k);
      if (ev.key === 'Delete' || ev.key === 'Backspace') { ev.preventDefault(); e.grupos.splice(i, 1); e.fechados.clear(); tudo(r, e, 'linhas'); r.querySelector<HTMLElement>('[data-cf-chip], [data-cf-agrupar]')?.focus(); }
      else if (ev.altKey && (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight')) { ev.preventDefault(); const j = i + (ev.key === 'ArrowRight' ? 1 : -1); if (j >= 0 && j < e.grupos.length) { e.grupos.splice(j, 0, ...e.grupos.splice(i, 1)); e.fechados.clear(); tudo(r, e, 'linhas'); r.querySelector<HTMLElement>(`[data-cf-chip="${k}"]`)?.focus(); } }
      return; }
    const linha = t.closest<HTMLElement>('tbody tr');
    if (!linha || t.matches('input:not([type="checkbox"])')) return;
    const todas = [...r.querySelectorAll<HTMLElement>('tbody tr')], i = todas.indexOf(linha);
    const ir = (j: number) => { const y = todas[Math.max(0, Math.min(todas.length - 1, j))]; if (!y) return; if (y.dataset.cfId) escolher(r, e, y.dataset.cfId, ev.shiftKey ? 'faixa' : 'um', e.det); else { todas.forEach((z) => { z.tabIndex = -1; }); y.tabIndex = 0; y.focus(); } };
    if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); ir(i + (ev.key === 'ArrowDown' ? 1 : -1)); return; }
    if (ev.key === 'Home' || ev.key === 'End') { ev.preventDefault(); ir(ev.key === 'Home' ? 0 : todas.length - 1); return; }
    if (ev.key === 'PageDown' || ev.key === 'PageUp') { ev.preventDefault(); ir(i + (ev.key === 'PageDown' ? 15 : -15)); return; }
    if (linha.dataset.cfGrupo && (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight' || ev.key === 'Enter')) {
      ev.preventDefault(); const k = linha.dataset.cfGrupo, aberto = !e.fechados.has(k);
      if (ev.key === 'Enter' || (ev.key === 'ArrowLeft') === aberto) { aberto ? e.fechados.add(k) : e.fechados.delete(k); grelha(r, e, 'linhas'); r.querySelector<HTMLElement>(`[data-cf-grupo="${CSS.escape(k)}"]`)?.focus(); }
      return;
    }
    if (linha.dataset.cfId && ev.key === ' ') { ev.preventDefault(); escolher(r, e, linha.dataset.cfId, 'alternar'); return; }
    if (linha.dataset.cfId && ev.key === 'Enter') { ev.preventDefault(); e.det = true; escolher(r, e, linha.dataset.cfId, 'um', true); r.querySelector<HTMLElement>('[data-cf-det] .ak-x')?.focus(); return; }
  });
  window.addEventListener('online', () => document.querySelectorAll<HTMLElement>('[data-cf]').forEach((r) => { if (estados.get(r)?.tipoErro === 'offline') toast(r, 'A ligação voltou. Tenta outra vez (F10).'); }));

  /* arrastar: País, Cidade ou Tendência para a zona de agrupar; as etiquetas mudam de nível */
  let arr: { tipo: 'col' | 'chip'; k: string } | null = null;
  document.addEventListener('dragstart', (ev) => {
    const t = ev.target as HTMLElement, r = raiz(t); if (!r) return;
    const th = t.closest?.<HTMLElement>('th[data-cf-col][draggable="true"]'), ch = t.closest?.<HTMLElement>('[data-cf-chip]');
    if (th) { arr = { tipo: 'col', k: th.dataset.cfCol! }; th.classList.add('is-arrasta'); r.classList.add('a-arrastar'); }
    else if (ch) { arr = { tipo: 'chip', k: ch.dataset.cfChip! }; ch.classList.add('is-arrasta'); }
    else return;
    ev.dataTransfer?.setData('text/plain', arr.k); if (ev.dataTransfer) ev.dataTransfer.effectAllowed = 'move';
  });
  document.addEventListener('dragover', (ev) => {
    if (!arr) return; const t = ev.target as HTMLElement, r = raiz(t); if (!r) return;
    const zona = t.closest('[data-cf-grupos]'), ch = t.closest<HTMLElement>('[data-cf-chip]');
    r.querySelectorAll('.is-alvo, .is-alvo-esq, .is-alvo-dir').forEach((y) => y.classList.remove('is-alvo', 'is-alvo-esq', 'is-alvo-dir'));
    if (zona && (arr.tipo === 'chip' || !de(r).grupos.includes(arr.k))) { ev.preventDefault(); zona.classList.add('is-alvo'); if (ch) { const q = ch.getBoundingClientRect(); ch.classList.add(ev.clientX < q.left + q.width / 2 ? 'is-alvo-esq' : 'is-alvo-dir'); } }
  });
  document.addEventListener('drop', (ev) => {
    if (!arr) return; const t = ev.target as HTMLElement, r = raiz(t); if (!r) return;
    const e = de(r), zona = t.closest('[data-cf-grupos]'), ch = t.closest<HTMLElement>('[data-cf-chip]'); if (!zona) return;
    ev.preventDefault();
    const sem = e.grupos.filter((k) => k !== arr!.k); let j = sem.length;
    if (ch && ch.dataset.cfChip !== arr.k) { const q = ch.getBoundingClientRect(); j = sem.indexOf(ch.dataset.cfChip!) + (ev.clientX < q.left + q.width / 2 ? 0 : 1); }
    sem.splice(j, 0, arr.k); e.grupos = sem; e.fechados.clear(); tudo(r, e, 'linhas');
    if (!quieto()) r.querySelector<HTMLElement>(`[data-cf-chip="${arr.k}"]`)?.animate([{ transform: 'scale(.85)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 180, easing: ease });
  });
  document.addEventListener('dragend', () => { arr = null; document.querySelectorAll('.cf .is-arrasta, .cf .is-alvo, .cf .is-alvo-esq, .cf .is-alvo-dir').forEach((y) => y.classList.remove('is-arrasta', 'is-alvo', 'is-alvo-esq', 'is-alvo-dir')); document.querySelectorAll('.cf.a-arrastar').forEach((y) => y.classList.remove('a-arrastar')); });

  /* alargar uma coluna */
  let red: { r: HTMLElement; k: string; x: number; w: number } | null = null;
  document.addEventListener('pointerdown', (ev) => { const h = (ev.target as HTMLElement).closest?.<HTMLElement>('[data-cf-redim]'); const r = raiz(h); if (!h || !r) return; ev.preventDefault(); ev.stopPropagation(); const k = h.dataset.cfRedim!; red = { r, k, x: ev.clientX, w: de(r).larguras[k] ?? colDe(de(r), k).w }; });
  document.addEventListener('pointermove', (ev) => { if (!red) return; const e = de(red.r), w = Math.max(56, Math.min(480, red.w + ev.clientX - red.x)); e.larguras[red.k] = w; const i = folhas(e).findIndex((c) => c.k === red!.k); const col = red.r.querySelectorAll<HTMLElement>('.cf-tab col')[i + 1]; if (col) col.style.width = `${w}px`; });
  document.addEventListener('pointerup', () => { if (red) { const r = red.r; red = null; grelha(r, de(r)); } });
}
