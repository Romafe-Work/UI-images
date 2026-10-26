/* =========================================================
   ERP — os Comparativos de compras v2: o que mexe (23 out. 2026). Ver compras/comparativo.ts (os dados e a conta).
   Um só ecrã para Geral, Por artigo, Por família/subfamília e Por fornecedor (ela: «quero num só ecrã»), com os dois
   modos do ERP antigo — Mensal e Variações anuais — e a grelha, os filtros, as vistas e as teclas em comum.
   Cada página (e cada estado no editor) tem o seu estado (WeakMap); a grelha desenha-se a partir dele.
     - Modo: «Mensal | Variações anuais» por baixo do título. O modo é um critério: os resultados à vista ficam com o
       modo em que foram gerados (e um aviso diz que é preciso Gerar dados) até ao próximo F10.
     - Critérios: Variações anuais — Ano inicial e Ano final, três anos seguidos (um acerta o outro); Mensal — Ano e
       Mês inicial, Ano e Mês final (até 24 meses, até ao mês corrente); e os filtros que o relatório sabe aplicar
       (Artigo/Referência, Família, Subfamília dependente da família, Marca, Fornecedor). Enter passa ao campo
       seguinte e, no último, vai a Gerar dados; nunca gera sozinho. Depois de gerar, recolhem-se em etiquetas
       («Filtros aplicados»); o × de uma etiqueta tira esse filtro e volta a gerar.
     - Mensal: a vista detalhada é o relatório original (uma linha por mês: Ano, Mês, Descrição do mês…); a vista
       por períodos põe os meses em colunas (Quantidade e Valor) — os totais são os mesmos.
     - Gerar: valida, impede pedidos repetidos, mostra a forma da grelha (sem percentagens), revela os grupos de
       colunas da esquerda para a direita, as variações a contar e os totais no fim; o foco vai para a grelha.
     - Grelha: dois níveis de cabeçalho, identificação presa à esquerda, ordenar (os meses pela ordem do calendário),
       filtros por coluna (F2; «>10000», «<0»), F3, agrupar (arrastar ou «Agrupar por…»), Somatórios (as variações
       dos grupos e do total vêm das somas), alargar colunas, escolher várias, ↑ ↓ Enter Espaço Esc.
     - Geral: o gráfico da evolução (valores ou quantidades, nunca no mesmo eixo), ligado à grelha.
     - Vistas guardadas (por utilizador e empresa): guardar, carregar, mudar o nome, eliminar — critérios e grelha,
       nunca resultados.
   Movimento só em transform/opacity; com «reduzir movimento», tudo aparece logo.
   ========================================================= */
import { comparar, compararMensal, variacao, DIMS, ANO_ATUAL, ANO_MIN, MES_ATUAL, subfamiliasDe, fornecedorNome, codFam, type RelCf, type LinhaCf, type CenarioCf, type DimCf, type DimDef, type FiltrosCf, type FiltroCf, type AnoCf, analisar, MODOS_MAPA, MAPA_COLS, MAPA_GRUPOS, type ModoMapa, type CritMapa } from './comparativo';
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
import trash from 'lucide-static/icons/trash-2.svg?raw';
import bookmarkPlus from 'lucide-static/icons/bookmark-plus.svg?raw';
import play from 'lucide-static/icons/play.svg?raw';
import check from 'lucide-static/icons/check.svg?raw';
import rows3 from 'lucide-static/icons/rows-3.svg?raw';
import table2 from 'lucide-static/icons/table-2.svg?raw';

type TipoErro = 'servidor' | 'tempo' | 'offline' | 'permissao' | 'sessao';
type Ordem = { k: string; dir: 1 | -1 };
/** 'anual' | 'mensal' nos comparativos; o mapa (ModoMapa) na Análise de compras */
type Modo = string;
/** O pedido que deu os resultados à vista (Atualizar repete-o; as etiquetas descrevem-no). */
interface Pedido { modo: Modo; a0: number; ini: string; fim: string; filtros: FiltrosCf; mapa?: CritMapa }
interface Crit { modo: Modo; ini: string; fim: string; mai: string; mmi: string; maf: string; mmf: string; filtros: FiltrosCf; mapa?: CritMapa }
interface Layout { ocultas: string[]; larguras: Record<string, number>; ordem: Ordem[]; grupos: string[]; densidade: 'compacta' | 'normal'; recentes: boolean; somas: boolean; vistaM: 'linhas' | 'quadro'; grafico: boolean; metrica: 'liq' | 'qtd' }
interface Vista { id: string; nome: string; crit: Crit; layout: Layout }
interface Est {
  d: DimDef; rel: RelCf | null; pedido?: Pedido; modo: Modo; fase: 'inicial' | 'a-gerar' | 'ok' | 'erro'; tipoErro?: TipoErro; erro?: string; gerado?: number;
  ordem: Ordem[]; filtros: Record<string, string>; filtrosAbertos: boolean; grupos: string[]; fechados: Set<string>;
  ocultas: Set<string>; larguras: Record<string, number>; densidade: 'compacta' | 'normal'; recentes: boolean; somas: boolean;
  vistaM: 'linhas' | 'quadro'; grafico: boolean; metrica: 'liq' | 'qtd'; grafAssin?: string;
  sel: Set<string>; ativo: string; ancora: string; det: boolean; aviso?: string; vez: number; nums?: number[];
  vistas: Vista[]; vista?: string; apagar?: string; renomear?: string;
}
const SESSAO = { utilizador: 'rui.matos', empresa: 'emp-000001' };
const chaveVistas = (d: DimDef) => `erp:comparativo-${d.id}:vistas:${SESSAO.utilizador}:${SESSAO.empresa}`;
const SEM_DADOS = 'Gera os dados primeiro (F10).';
const MES3 = ['Jan.', 'Fev.', 'Mar.', 'Abr.', 'Mai.', 'Jun.', 'Jul.', 'Ago.', 'Set.', 'Out.', 'Nov.', 'Dez.'];
const rotMes = (ym: string) => `${MES3[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;
const estados = new WeakMap<HTMLElement, Est>();
/* no editor, com «Interagir» ligado (26 out.), o ecrã responde como no protótipo */
const editando = () => (document.body.classList.contains('editando') && !document.body.classList.contains('ed-interagir')) || document.body.classList.contains('com-fluxo');
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const raiz = (t: EventTarget | null) => (t as HTMLElement | null)?.closest?.<HTMLElement>('[data-cf]') ?? null;
const n = (v: number) => Math.round(v).toLocaleString('pt-PT');
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const ease = 'cubic-bezier(.22, 1, .36, 1)';
const cap = (t: string) => t[0].toUpperCase() + t.slice(1);
const modoForm = (r: HTMLElement): Modo => r.dataset.cfModoForm || (r.classList.contains('cf-mensal') ? 'mensal' : 'anual');
const MODO_NOME: Record<Modo, string> = { mensal: 'Mensal', anual: 'Variações anuais', ...Object.fromEntries(MODOS_MAPA.map(([k, t]) => [k, t])) };
/** Como se diz no aviso de «outro modo»: «a análise mensal», «o mapa por artigo/fornecedor». */
const modoFrase = (m: Modo) => MODOS_MAPA.find(([k]) => k === m)?.[2].replace('Mapa de compras', 'o mapa') ?? `a análise ${MODO_NOME[m].toLowerCase()}`;
const CAMPOS_MAPA = ['di', 'df', 'ai', 'af', 'fi', 'ff', 'gi', 'gf', 'si', 'sf'] as const;
/** «+12,4 %» / «−8,7 %» (o sinal de menos tipográfico) */
const pct = (v: number) => `${v > 0.00049 ? '+' : v < -0.00049 ? '−' : ''}${(Math.abs(v) * 100).toLocaleString('pt-PT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;

/* ---------- as colunas (dependem do modo, da vista e dos anos/meses) ---------- */
type Tipo = 'txt' | 'mono' | 'n' | 'eur' | 'pct';
interface Col { k: string; t: string; tipo: Tipo; w: number; banda: number; ano?: number; i?: number; agrupa?: boolean; fixa?: boolean; futuro?: boolean; xl?: string }
interface Banda { t: string; sub?: string; cols: Col[]; tipo: 'forn' | 'ano' | 'var' | 'tot'; vazia?: boolean }
const descr = (e: Est): Col[] => (e.d.mapa ? MAPA_COLS[(MAPA_COLS[e.modo as ModoMapa] ? e.modo : 'artigo') as ModoMapa] : e.d.descr).map((c) => ({ ...c, banda: 0 }));
/** As colunas do período no relatório mensal original (o Geral: Ano, Descrição do mês, Mês). */
const periodoCols = (e: Est): Col[] => {
  const ano: Col = { k: 'ano', t: 'Ano', tipo: 'mono', w: 64, banda: 0, agrupa: true, fixa: true }, nm: Col = { k: 'mesN', t: 'Mês', tipo: 'mono', w: 56, banda: 0, fixa: true }, ds: Col = { k: 'mesDesc', t: 'Descrição do mês', tipo: 'txt', w: 130, banda: 0, agrupa: true, fixa: true };
  return e.d.id === 'geral' ? [ano, ds, nm] : [ano, nm, ds];
};
const esconde = (e: Est, c: Col) => e.ocultas.has(c.k);
function bandas(e: Est): Banda[] {
  const anos = e.rel?.anos ?? [], sd = new Set(e.rel?.semDados ?? []);
  if (e.d.mapa) {
    /* um mapa antigo: as suas colunas e, no fim, Quantidade e Líquido */
    const bs: Banda[] = [{ t: MODO_NOME[e.modo] ?? 'Linha', tipo: 'forn', cols: descr(e).filter((c) => !esconde(e, c)) }, { t: 'Valores', tipo: 'tot', cols: [{ k: 'tq', t: 'Quantidade', tipo: 'n', w: 104, banda: 1, xl: 'Quantidade' }, { k: 't', t: 'Líquido', tipo: 'eur', w: 128, banda: 1, xl: 'Líquido' }] }];
    return bs;
  }
  if (e.modo === 'mensal') {
    const ms = e.rel?.per?.meses ?? [], qtd = !e.ocultas.has('qtd');
    const tot: Col[] = [...(qtd ? [{ k: 'tq', t: 'Quantidade', tipo: 'n' as Tipo, w: 104, banda: 0 }] : []), { k: 't', t: 'Valor', tipo: 'eur', w: 128, banda: 0 }];
    if (e.vistaM === 'linhas') {
      /* a vista detalhada: o relatório original, uma linha por mês */
      const ident = e.d.id === 'geral' ? [] : descr(e).filter((c) => c.k !== 'tend' && !esconde(e, c)).map((c) => ({ ...c, fixa: false }));
      const bs: Banda[] = [{ t: e.d.id === 'geral' ? 'Período' : `Período e ${e.d.um}`, tipo: 'forn', cols: [...periodoCols(e), ...ident] }, { t: 'Compras do mês', tipo: 'tot', cols: tot.map((c) => ({ ...c, xl: c.t })) }];
      bs.forEach((b, k) => b.cols.forEach((c) => { c.banda = k; })); return bs;
    }
    /* a vista por períodos: um grupo de colunas por mês e o total */
    const bs: Banda[] = [{ t: cap(e.d.um), tipo: 'forn', cols: descr(e).filter((c) => c.k !== 'tend' && !esconde(e, c)) },
      ...ms.map((m, i): Banda => ({ t: rotMes(m), tipo: 'ano', cols: [...(qtd ? [{ k: `mq${i}`, t: 'Quantidade', tipo: 'n' as Tipo, w: 96, banda: 0, xl: `${rotMes(m)} — Quantidade` }] : []), { k: `m${i}`, t: 'Valor', tipo: 'eur', w: 112, banda: 0, xl: `${rotMes(m)} — Valor` }] })),
      { t: `Total ${ms.length ? `${rotMes(ms[0])} – ${rotMes(ms[ms.length - 1])}` : ''}`, tipo: 'tot', cols: tot.map((c) => ({ ...c, xl: `Total — ${c.t}` })) }];
    bs.forEach((b, k) => b.cols.forEach((c) => { c.banda = k; })); return bs;
  }
  const forn: Banda = { t: cap(e.d.um), tipo: 'forn', cols: descr(e).filter((c) => !esconde(e, c)) };
  const ano = (i: number): Banda => ({ t: String(anos[i]), sub: sd.has(anos[i]) ? 'sem dados' : anos[i] === ANO_ATUAL ? 'até hoje' : undefined, tipo: 'ano', vazia: sd.has(anos[i]),
    cols: [...(e.ocultas.has('qtd') ? [] : [{ k: `q${i}`, t: 'Quantidade', tipo: 'n' as Tipo, w: 96, banda: 0, ano: anos[i], i, xl: `Quantidade ${anos[i]}` }]), { k: `l${i}`, t: 'Líquido', tipo: 'eur', w: 124, banda: 0, ano: anos[i], i, xl: `Líquido ${anos[i]}` }] });
  const vr = (i: number): Banda => ({ t: `${anos[i]} → ${anos[i + 1]}`, tipo: 'var', cols: [{ k: `v${i}`, t: 'Variação', tipo: 'pct', w: 124, banda: 0, i, xl: `Variação ${anos[i]}→${anos[i + 1]}` }] });
  const ordem = e.recentes ? [2, 1, 0] : [0, 1, 2], sai: Banda[] = [forn];
  ordem.forEach((i, j) => { sai.push(ano(i)); const prox = ordem[j + 1]; if (prox !== undefined && !e.ocultas.has('var')) sai.push(vr(Math.min(i, prox))); });
  sai.forEach((b, k) => b.cols.forEach((c) => { c.banda = k; }));
  return sai;
}
const folhas = (e: Est) => bandas(e).flatMap((b) => b.cols);
const colDe = (e: Est, k: string): Col => folhas(e).find((c) => c.k === k) ?? [...descr(e), ...periodoCols(e)].find((c) => c.k === k) ?? { k, t: k, tipo: 'txt', w: 100, banda: 0 };
/** O que se pode agrupar no modo e na vista à vista. */
const agrupaveis = (e: Est): Col[] => { const vs = new Map<string, Col>(); [...folhas(e), ...(e.modo === 'mensal' && e.vistaM === 'linhas' ? [] : descr(e))].filter((c) => c.agrupa).forEach((c) => { if (!vs.has(c.k)) vs.set(c.k, c); }); return [...vs.values()]; };
/** As linhas do modo e da vista à vista (a vista detalhada usa as linhas do relatório mensal original). */
const linhasBase = (e: Est): LinhaCf[] => !e.rel ? [] : e.modo === 'mensal' && e.vistaM === 'linhas' ? e.rel.detalhe ?? [] : e.rel.linhas;
/** O valor de uma coluna numa linha (ou nas somas de várias). */
function valor(l: LinhaCf, k: string): unknown {
  if (k in l.c) return l.c[k];
  if (k === 't') return l.anos[2].liq;
  if (k === 'tq') return l.anos[2].qtd;
  if (k.startsWith('mq')) return l.mes?.[Number(k.slice(2))]?.qtd;
  if (k[0] === 'm') return l.mes?.[Number(k.slice(1))]?.liq;
  const i = Number(k.slice(1));
  /* um mês que ainda não chegou (Geral) não é zero: fica «—» e não entra nas variações */
  if (k[0] === 'q') return l.anos[i].futuro ? undefined : l.anos[i].qtd;
  if (k[0] === 'l') return l.anos[i].futuro ? undefined : l.anos[i].liq;
  if (l.anos[i].futuro || l.anos[i + 1].futuro) return undefined;
  return variacao(l.anos[i].liq, l.anos[i + 1].liq);
}
/** As somas de um conjunto, como se fosse uma linha (a variação vem das somas, não das percentagens). */
const somaAno = (as: AnoCf[]): AnoCf => ({ qtd: as.reduce((s, a) => s + (a.futuro ? 0 : a.qtd), 0), liq: as.reduce((s, a) => s + (a.futuro ? 0 : a.liq), 0), encs: as.flatMap((a) => a.encs) });
const soma = (ls: LinhaCf[]): LinhaCf => ({ id: '', c: {}, anos: [0, 1, 2].map((i) => somaAno(ls.map((l) => l.anos[i]))), mes: ls[0]?.mes ? ls[0].mes.map((_, i) => somaAno(ls.map((l) => l.mes![i]))) : undefined });
const nomeDe = (e: Est, l: LinhaCf) => l.c.mesDesc ? `${l.c.mesDesc} ${l.c.ano}${l.c.desc || l.c.nome || l.c.sub ? ` · ${l.c.desc || l.c.nome || l.c.sub}` : ''}` : e.d.mapa ? `${l.c.doc} · ${l.c.desc ?? l.c.sub ?? ''}` : l.c[e.d.descr.filter((c) => c.fixa).slice(-1)[0]?.k ?? e.d.descr[0]?.k ?? ''] ?? l.id;

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
const fmtTexto = (c: Col, l: LinhaCf) => { const v = valor(l, c.k); return c.tipo === 'pct' ? (v === null ? 'N/D' : v === undefined ? '—' : pct(v as number)) : c.tipo === 'eur' ? (v === undefined ? '—' : euros(v as number)) : c.tipo === 'n' ? (v === undefined ? '—' : n(v as number)) : String(v ?? ''); };

/* ---------- filtros da tabela, ordem, grupos ---------- */
/** «>10000», «<=0», «=5» comparam números (euros nos valores, % nas variações); o resto procura no texto. */
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
/** A chave de ordem: os meses pela ordem do calendário (nunca pelo nome). */
const chaveOrdem = (l: LinhaCf, k: string): unknown => k === 'data' ? l.c.dataIso : k === 'mesDesc' || k === 'mesN' ? `${l.c.ano ?? ''}-${l.c.mesN}` : k === 'mes' ? l.id : k === 'tri' ? l.id : valor(l, k);
function filtradas(e: Est): LinhaCf[] {
  const fs = Object.entries(e.filtros).filter(([, v]) => v && v.trim());
  const ls = linhasBase(e).filter((l) => fs.every(([k, v]) => passa(colDe(e, k), l, v)));
  const num = (v: unknown) => typeof v === 'number' ? v : null;
  const cmp = (a: LinhaCf, b: LinhaCf) => { for (const o of e.ordem) { const xa = chaveOrdem(a, o.k), ya = chaveOrdem(b, o.k);
    const nx = num(xa), ny = num(ya);
    let d: number;
    if (typeof xa === 'string' && typeof ya === 'string') d = xa.localeCompare(ya, 'pt', { numeric: true });
    else if (nx === null && ny === null) d = 0; else if (nx === null) return 1; else if (ny === null) return -1; else d = nx - ny; /* N/D e «—» ficam sempre no fim */
    if (d) return d * o.dir; } return 0; };
  /* sem ordem escolhida: o Geral e o mensal detalhado pela ordem do calendário; o resto pelo valor do último ano */
  if (e.ordem.length) return ls.slice().sort(cmp);
  if (e.d.id === 'geral' || e.d.mapa || (e.modo === 'mensal' && e.vistaM === 'linhas')) return ls;
  return ls.slice().sort((a, b) => b.anos[2].liq - a.anos[2].liq || b.anos[1].liq - a.anos[1].liq);
}
type No = { tipo: 'g'; chave: string; nivel: number; k: string; valor: string; linhas: LinhaCf[] } | { tipo: 'l'; l: LinhaCf };
function arvore(e: Est, ls: LinhaCf[]): No[] {
  const sai: No[] = [];
  const ramo = (xs: LinhaCf[], nivel: number, pre: string) => {
    if (nivel >= e.grupos.length) { xs.forEach((l) => sai.push({ tipo: 'l', l })); return; }
    const k = e.grupos[nivel], m = new Map<string, LinhaCf[]>(), ord = new Map<string, string>();
    xs.forEach((l) => { const v = String(valor(l, k)); m.set(v, [...(m.get(v) ?? []), l]); ord.set(v, String(chaveOrdem(l, k))); });
    [...m.entries()].sort((a, b) => ord.get(a[0])!.localeCompare(ord.get(b[0])!, 'pt', { numeric: true })).forEach(([v, g]) => { const chave = `${pre}${k}=${v}|`; sai.push({ tipo: 'g', chave, nivel, k, valor: v, linhas: g }); if (!e.fechados.has(chave)) ramo(g, nivel + 1, chave); });
  };
  ramo(ls, 0, ''); return sai;
}

/* ---------- o formulário ---------- */
const form = (r: HTMLElement) => r.querySelector<HTMLFormElement>('[data-cf-crit]')!;
const campo = (r: HTMLElement, k: string) => form(r).elements.namedItem(k) as HTMLInputElement | HTMLSelectElement | null;
const val = (r: HTMLElement, k: string) => campo(r, k)?.value.trim() ?? '';
function lerFiltros(r: HTMLElement, e: Est): FiltrosCf { const f: FiltrosCf = {}; e.d.filtros.forEach((k) => { const v = val(r, k); if (v) f[k] = v; }); return f; }
const lerMapa = (r: HTMLElement): CritMapa => Object.fromEntries(CAMPOS_MAPA.map((k) => [k, val(r, k)]).filter(([, v]) => v)) as unknown as CritMapa;
function lerCrit(r: HTMLElement, e: Est): Crit { return { modo: modoForm(r), ini: val(r, 'ini'), fim: val(r, 'fim'), mai: val(r, 'mai'), mmi: val(r, 'mmi'), maf: val(r, 'maf'), mmf: val(r, 'mmf'), filtros: lerFiltros(r, e), ...(e.d.mapa ? { mapa: lerMapa(r) } : {}) }; }
function porCrit(r: HTMLElement, e: Est, c: Partial<Crit>): void {
  if (c.modo) modoEm(r, c.modo);
  (['ini', 'fim', 'mai', 'mmi', 'maf', 'mmf'] as const).forEach((k) => { const el = campo(r, k); if (el && c[k]) el.value = c[k]!; });
  if (c.mapa) CAMPOS_MAPA.forEach((k) => { const el = campo(r, k); if (el) el.value = c.mapa![k] ?? ''; });
  e.d.filtros.forEach((k) => { const el = campo(r, k); if (el) el.value = c.filtros?.[k] ?? ''; if (k === 'fam') subfamilias(r); });
  const sub = campo(r, 'sub'); if (sub) sub.value = c.filtros?.sub ?? '';
}
/** A subfamília depende da família: as opções mudam e uma subfamília de outra família sai (e diz-se). */
function subfamilias(r: HTMLElement, avisa = false): void {
  const s = campo(r, 'sub') as HTMLSelectElement | null; if (!s) return;
  const fam = val(r, 'fam'), antes = s.value, ops = subfamiliasDe(fam);
  s.innerHTML = `<option value="">Todas</option>${ops.map((y) => `<option value="${esc(y)}">${esc(y)}</option>`).join('')}`;
  if (antes && ops.includes(antes)) s.value = antes;
  else if (antes && avisa) toast(r, `«${antes}» não é da família ${fam}: a subfamília voltou a «Todas».`);
}
const campos = (r: HTMLElement) => [...r.querySelectorAll<HTMLElement>('[data-cf-crit] :is(input, select)')].filter((i) => i.offsetParent !== null && !(i as HTMLInputElement).disabled);
function erroCampo(r: HTMLElement, k: string, t: string): void {
  const p = r.querySelector<HTMLElement>('[data-cf-erro]')!; p.hidden = false; p.textContent = t;
  const el = campo(r, k); el?.setAttribute('aria-invalid', 'true'); el?.focus();
}
function limparErro(r: HTMLElement): void { r.querySelectorAll('[data-cf-crit] [aria-invalid]').forEach((y) => y.removeAttribute('aria-invalid')); r.querySelector<HTMLElement>('[data-cf-erro]')!.hidden = true; }
/** Valida os critérios do modo escolhido; devolve o pedido, ou null (com o erro à vista). */
function validar(r: HTMLElement, e: Est): Pedido | null {
  const filtros = lerFiltros(r, e);
  if (e.d.mapa) {
    const m = lerMapa(r), modo = modoForm(r) as ModoMapa, cmp = (a: string, b: string) => a.localeCompare(b, 'pt', { numeric: true, sensitivity: 'base' });
    if (!m.di) { erroCampo(r, 'di', 'Escolhe a data inicial.'); return null; }
    if (!m.df) { erroCampo(r, 'df', 'Escolhe a data final.'); return null; }
    if (m.di > m.df) { erroCampo(r, 'df', 'A data inicial não pode ser depois da data final.'); return null; }
    /* os intervalos (só os do mapa escolhido): o inicial não pode vir depois do final, pela regra de cada código */
    const pares: [keyof CritMapa, keyof CritMapa, string, ModoMapa[]][] = [['ai', 'af', 'artigo', ['artigo']], ['fi', 'ff', 'fornecedor', ['artigo-forn', 'familia-forn']], ['gi', 'gf', 'família', ['familia', 'familia-forn']], ['si', 'sf', 'subfamília', ['familia', 'familia-forn']]];
    for (const [a, b, t, ms] of pares) { if (!ms.includes(modo)) { delete m[a]; delete m[b]; continue; } if (m[a] && m[b] && cmp(m[a]!, m[b]!) > 0) { erroCampo(r, b, `O ${t} final tem de vir depois do inicial (${m[a]} → ${m[b]}).`); return null; } }
    return { modo, a0: Number(m.di.slice(0, 4)), ini: m.di, fim: m.df, filtros: {}, mapa: m };
  }
  if (modoForm(r) === 'mensal') {
    const [ya, yb] = [val(r, 'mai'), val(r, 'maf')];
    if (!/^\d{4}$/.test(ya)) { erroCampo(r, 'mai', 'Escreve o ano inicial com quatro algarismos.'); return null; }
    if (!/^\d{4}$/.test(yb)) { erroCampo(r, 'maf', 'Escreve o ano final com quatro algarismos.'); return null; }
    const ini = `${ya}-${val(r, 'mmi')}`, fim = `${yb}-${val(r, 'mmf')}`, hoje = `${ANO_ATUAL}-${String(MES_ATUAL).padStart(2, '0')}`;
    if (Number(ya) < ANO_MIN) { erroCampo(r, 'mai', `O ERP não tem compras antes de ${ANO_MIN}.`); return null; }
    if (fim > hoje) { erroCampo(r, Number(yb) > ANO_ATUAL ? 'maf' : 'mmf', `${rotMes(fim)} ainda não chegou: o período pode ir até ${rotMes(hoje)}.`); return null; }
    if (ini > fim) { erroCampo(r, 'mmf', 'O fim do período tem de ser depois do início.'); return null; }
    const meses = (Number(yb) - Number(ya)) * 12 + Number(val(r, 'mmf')) - Number(val(r, 'mmi')) + 1;
    if (meses > 24) { erroCampo(r, 'mai', `São ${meses} meses: o comparativo mensal vai até 24. Encurta o período.`); return null; }
    return { modo: 'mensal', a0: Number(ya), ini, fim, filtros };
  }
  const [ini, fim] = [val(r, 'ini'), val(r, 'fim')], a = Number(ini), b = Number(fim);
  if (!/^\d{4}$/.test(ini)) { erroCampo(r, 'ini', 'Escreve o ano inicial com quatro algarismos.'); return null; }
  if (!/^\d{4}$/.test(fim)) { erroCampo(r, 'fim', 'Escreve o ano final com quatro algarismos.'); return null; }
  if (a < ANO_MIN) { erroCampo(r, 'ini', `O ERP não tem compras antes de ${ANO_MIN}.`); return null; }
  if (b > ANO_ATUAL) { erroCampo(r, 'fim', `${b} ainda não começou: o ano final pode ir até ${ANO_ATUAL}.`); return null; }
  if (b - a !== 2) { erroCampo(r, 'fim', `O comparativo tem três anos seguidos: com ${a} no início, o ano final é ${a + 2}.`); return null; }
  return { modo: 'anual', a0: a, ini, fim, filtros };
}
/** O modo do formulário (Mensal ou Variações anuais); só conta depois de Gerar dados. */
function modoEm(r: HTMLElement, m: Modo, animar = false): void {
  if (modoForm(r) === m && !animar) { marcarModo(r, m); return; }
  const antes = new Set([...r.querySelectorAll<HTMLElement>('[data-so]')].filter((x) => x.offsetParent !== null));
  r.classList.toggle('cf-mensal', m === 'mensal'); marcarModo(r, m);
  if (!animar || quieto()) return;
  /* os campos que o novo modo traz entram; os que ficam não mexem */
  const novos = MAPA_COLS[m as ModoMapa] ? [...r.querySelectorAll<HTMLElement>('[data-so]')].filter((x) => x.offsetParent !== null && !antes.has(x)) : [r.querySelector<HTMLElement>(m === 'mensal' ? '.cf-per.cf-so-mensal' : '.cf-per.cf-so-anual')];
  novos.forEach((x, i) => x?.animate([{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }], { duration: 200, delay: i * 40, easing: ease, fill: 'backwards' }));
}
function marcarModo(r: HTMLElement, m: Modo): void {
  r.dataset.cfModoForm = m;
  r.querySelectorAll<HTMLElement>('[data-cf-modo]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.cfModo === m)));
  if (MAPA_COLS[m as ModoMapa]) { MODOS_MAPA.forEach(([k]) => r.classList.toggle(`cf-m-${k}`, k === m)); r.querySelector<HTMLElement>('.cf-modos--4')?.style.setProperty('--i', String(MODOS_MAPA.findIndex(([k]) => k === m))); }
}

/* ---------- vistas guardadas ---------- */
const layoutDe = (e: Est): Layout => ({ ocultas: [...e.ocultas], larguras: { ...e.larguras }, ordem: e.ordem.map((o) => ({ ...o })), grupos: [...e.grupos], densidade: e.densidade, recentes: e.recentes, somas: e.somas, vistaM: e.vistaM, grafico: e.grafico, metrica: e.metrica });
function lerVistas(d: DimDef): Vista[] { try { const g = JSON.parse(localStorage.getItem(chaveVistas(d)) ?? 'null'); return Array.isArray(g) ? g.filter((v) => v && v.id && v.nome && v.crit && v.layout) : []; } catch { return []; } }
const gravarVistas = (r: HTMLElement, e: Est, vs: Vista[]): boolean => { if (r.dataset.cfCenario !== 'inicial') return true; try { localStorage.setItem(chaveVistas(e.d), JSON.stringify(vs)); return true; } catch { return false; } };
function descVista(e: Est, v: Vista): string {
  const c = v.crit, p = c.modo === 'mensal' ? `${rotMes(`${c.mai}-${c.mmi}`)} – ${rotMes(`${c.maf}-${c.mmf}`)}` : `${c.ini}–${c.fim}`;
  const f = Object.entries(c.filtros).map(([k, y]) => k === 'forn' ? fornecedorNome(y!) : y).join(' · ');
  return [MODO_NOME[c.modo], p, f, v.layout.grupos.length ? `por ${v.layout.grupos.map((k) => colDe(e, k).t.toLowerCase()).join(' › ')}` : ''].filter(Boolean).join(' · ');
}
function vistasMenu(r: HTMLElement, e: Est): void {
  const m = r.querySelector<HTMLElement>('[data-cf-menu="vistas"]'); if (!m) return;
  m.innerHTML = `<p class="ak-menu-t">Vistas guardadas</p>${e.vistas.length ? `<ul class="ak2-vl">${e.vistas.map((v) => e.apagar === v.id
    ? `<li class="ak2-vl-conf"><span>Eliminar «${esc(v.nome)}»?</span><button type="button" class="ak-btn ak-btn--perigo" data-cf-vista-sim="${v.id}">${L(trash)}<span>Eliminar</span></button><button type="button" class="ak-btn" data-cf-vista-nao>${L(x)}<span>Manter</span></button></li>`
    : e.renomear === v.id
    ? `<li class="cf-vl-nome"><input type="text" value="${esc(v.nome)}" maxlength="40" data-cf-vista-novo-nome="${v.id}" aria-label="Novo nome da vista"><button type="button" class="ak-btn" data-cf-vista-ok="${v.id}">${L(check)}<span>Mudar</span></button></li>`
    : `<li class="cf-vl${v.id === e.vista ? ' is-ativa' : ''}"><button type="button" role="menuitem" data-cf-vista-carregar="${v.id}"><b>${esc(v.nome)}</b><small>${esc(descVista(e, v))}</small></button><button type="button" class="ak2-vl-x cf-vl-ren" data-cf-vista-ren="${v.id}" aria-label="Mudar o nome de ${esc(v.nome)}" title="Mudar o nome">${L(pencil)}</button><button type="button" class="ak2-vl-x" data-cf-vista-apagar="${v.id}" aria-label="Eliminar ${esc(v.nome)}" title="Eliminar">${L(trash)}</button></li>`).join('')}</ul>` : '<p>Ainda não há vistas guardadas.</p>'}
  <div class="ak2-vl-acoes"><div class="ak2-vl-nova"><input type="text" data-cf-vista-nome placeholder="Nome da nova vista" maxlength="40" aria-label="Nome da nova vista"><button type="button" class="ak-btn ak-btn--acao" data-cf-vista-guardar>${L(bookmarkPlus)}<span>Guardar vista</span></button></div>
  <p class="ak2-vl-nota" data-cf-vista-nota>Guarda o modo, os critérios, as colunas, a ordem, os grupos, as linhas${e.d.grafico ? ' e o gráfico' : ''} — nunca os resultados.</p></div>`;
}
function guardarNova(r: HTMLElement, e: Est): void {
  const i = r.querySelector<HTMLInputElement>('[data-cf-vista-nome]'), nota = r.querySelector<HTMLElement>('[data-cf-vista-nota]'); if (!i) return;
  const nome = i.value.trim().replace(/\s+/g, ' ');
  const diz = (t: string) => { if (nota) { nota.textContent = t; nota.classList.add('is-erro'); } i.setAttribute('aria-invalid', 'true'); i.focus(); };
  if (!nome) return diz('Escreve o nome da vista.');
  if (e.vistas.some((v) => v.nome.toLowerCase() === nome.toLowerCase())) return diz(`Já existe «${nome}». Escolhe outro nome.`);
  const v: Vista = { id: `v-${Date.now().toString(36)}`, nome, crit: lerCrit(r, e), layout: layoutDe(e) }, lista = [...e.vistas, v];
  if (!gravarVistas(r, e, lista)) return diz('Não foi possível guardar neste computador. Tenta outra vez.');
  e.vistas = lista; e.vista = v.id; vistasMenu(r, e); estado(r, e); toast(r, `Vista «${nome}» guardada.`);
  r.querySelector<HTMLElement>(`[data-cf-vista-carregar="${v.id}"]`)?.focus();
}
function renomear(r: HTMLElement, e: Est, id: string): void {
  const i = r.querySelector<HTMLInputElement>(`[data-cf-vista-novo-nome="${id}"]`), v = e.vistas.find((y) => y.id === id); if (!i || !v) return;
  const nome = i.value.trim().replace(/\s+/g, ' ');
  if (!nome || e.vistas.some((y) => y.id !== id && y.nome.toLowerCase() === nome.toLowerCase())) { i.setAttribute('aria-invalid', 'true'); toast(r, nome ? `Já existe «${nome}».` : 'O nome não pode ficar vazio.'); i.focus(); return; }
  const lista = e.vistas.map((y) => y.id === id ? { ...y, nome } : y);
  if (!gravarVistas(r, e, lista)) { toast(r, 'Não foi possível mudar o nome. Tenta outra vez.'); return; }
  e.vistas = lista; e.renomear = undefined; vistasMenu(r, e); estado(r, e); toast(r, `A vista chama-se agora «${nome}».`);
  r.querySelector<HTMLElement>(`[data-cf-vista-carregar="${id}"]`)?.focus();
}
function carregarVista(r: HTMLElement, e: Est, v: Vista): void {
  porCrit(r, e, v.crit);
  const l = v.layout; e.ocultas = new Set(l.ocultas); e.larguras = { ...l.larguras }; e.ordem = l.ordem.map((o) => ({ ...o })); e.grupos = [...l.grupos]; e.densidade = l.densidade; e.recentes = l.recentes; e.somas = l.somas; e.vistaM = l.vistaM; e.grafico = l.grafico; e.metrica = l.metrica;
  e.vista = v.id; e.fechados.clear(); fecharMenus(r);
  /* carregar uma vista é pedir essa análise */
  void gerarDados(r, e).then(() => { if (e.fase === 'ok') toast(r, `Vista «${v.nome}» carregada.`); });
}

function novo(r: HTMLElement): Est {
  const d = DIMS[(r.dataset.cfDim as DimCf) || 'forn'];
  return { d, rel: null, modo: modoForm(r), fase: 'inicial', ordem: [], filtros: {}, filtrosAbertos: false, grupos: [...d.grupos0], fechados: new Set(), ocultas: new Set(d.ocultas0), larguras: {}, densidade: 'compacta', recentes: false, somas: true,
    vistaM: d.vistaM, grafico: !!d.grafico, metrica: 'liq', sel: new Set(), ativo: '', ancora: '', det: false, vez: 0, vistas: r.dataset.cfCenario === 'inicial' ? lerVistas(d) : [] };
}

/* ---------- antes de haver linhas ---------- */
const PRONTO = `<div class="ak2-pronto cf-pronto">${L(calendarRange, 'cf-pronto-ic')}<div><b>Pronto para comparar</b><p>Escolhe o período e prime <kbd>F10</kbd> para gerar o comparativo.</p></div></div>`;
const ESQUELETO = `<div class="ak2-esq" aria-hidden="true">${Array.from({ length: 9 }, (_, i) => `<div class="ak2-esq-l${i ? '' : ' ak2-esq-cab'}">${[64, 180, 80, 70, 100, 90, 70, 100, 90, 70, 100].map((w, j) => `<i style="width:${Math.round(w * (i ? 0.5 + ((i * 7 + j * 3) % 5) / 10 : 0.55))}px"></i>`).join('')}</div>`).join('')}</div><p class="ak2-carga" role="status">${L(loader)}A gerar o comparativo… <span>Os critérios ficam como estão; Esc cancela.</span></p>`;
const ERROS: Record<TipoErro, [string, string, string]> = {
  servidor: [circleAlert, 'Não foi possível gerar o comparativo.', ''],
  tempo: [timer, 'O servidor demorou demasiado a responder.', 'Tenta outra vez. Os critérios ficam.'],
  offline: [wifiOff, 'Sem ligação à rede.', 'Os critérios ficam. Quando a ligação voltar, tenta outra vez.'],
  permissao: [lock, 'Não tens permissão para este mapa.', 'Pede acesso a quem gere os acessos do ERP (Compras ▸ Mapas ▸ Comparativos).'],
  sessao: [logIn, 'A sessão terminou.', 'Volta a entrar para continuar. Os critérios ficam neste ecrã.'],
};
function painelErro(e: Est): string {
  const t = e.tipoErro ?? 'servidor', [ic, titulo, texto] = ERROS[t];
  const acoes = t === 'permissao' ? `<button type="button" class="ak-btn" data-cf-acao="alterar">${L(pencil)}<span>Alterar critérios</span></button>`
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
  r.classList.toggle('cf-res-mensal', !!e.rel && e.modo === 'mensal');
  if (!e.rel) { g.innerHTML = e.fase === 'a-gerar' ? ESQUELETO : e.fase === 'erro' ? painelErro(e) : e.d.mapa ? PRONTO.replace('Pronto para comparar', 'Pronto para analisar').replace('Escolhe o período', 'Escolhe o mapa, as datas e os intervalos').replace('gerar o comparativo', 'gerar o mapa') : PRONTO; estado(r, e); return; }
  if (!e.rel.linhas.length) {
    const quando = e.modo === 'mensal' ? `de ${rotMes(e.pedido!.ini)} a ${rotMes(e.pedido!.fim)}` : `de ${e.rel.anos[0]} a ${e.rel.anos[2]}`, filt = Object.keys(e.rel.filtros).length;
    g.innerHTML = `<div class="ak-vazio ak2-erro">${L(searchX)}<p><b>Não há compras ${quando}${filt ? ' com estes filtros' : ''}.</b>${filt ? 'Tira um filtro ou escolhe outro período.' : 'Escolhe outro período.'}</p><div class="ak2-erro-acoes"><button type="button" class="ak-btn" data-cf-acao="alterar">${L(pencil)}<span>Alterar critérios</span></button></div></div>`; estado(r, e); return;
  }
  const ks = new Set(agrupaveis(e).map((c) => c.k)); e.grupos = e.grupos.filter((k) => ks.has(k));
  const bs = bandas(e), cs = bs.flatMap((b) => b.cols), ls = filtradas(e), nos = arvore(e, ls);
  const antes = new Map<string, number>(); if (animar === 'linhas' && !quieto()) g.querySelectorAll<HTMLElement>('tr[data-cf-id]').forEach((t) => antes.set(t.dataset.cfId!, t.getBoundingClientRect().top));
  const sc = g.scrollTop, sl = g.scrollLeft;
  const larg = (c: Col) => e.larguras[c.k] ?? c.w;
  /* a identificação presa à esquerda: só as primeiras colunas seguidas (as posições somam as larguras à frente) */
  const fixas: Col[] = []; for (const c of cs) { if (!c.fixa) break; fixas.push(c); }
  const esq = new Map<string, number>(); let acc = 34; fixas.forEach((c) => { esq.set(c.k, acc); acc += larg(c); });
  const ultFixa = fixas[fixas.length - 1]?.k;
  const fx = (c: Col) => esq.has(c.k) ? ` is-fixa${c.k === ultFixa ? ' is-fixa-ult' : ''}" style="left:${esq.get(c.k)}px` : '';
  const cls = (c: Col) => `${c.tipo === 'n' || c.tipo === 'eur' || c.tipo === 'pct' ? 'is-num' : c.tipo === 'mono' ? 'is-mono' : ''} cf-b-${bs[c.banda].tipo}${c === bs[c.banda].cols[0] ? ' is-b-ini' : ''}`;
  const ordemDe = (k: string) => { const i = e.ordem.findIndex((o) => o.k === k); return i < 0 ? '' : `<span class="ak-ord">${L(e.ordem[i].dir === 1 ? arrowUp : arrowDown)}${e.ordem.length > 1 ? `<i>${i + 1}</i>` : ''}</span>`; };
  const sort = (k: string) => { const o = e.ordem.find((y) => y.k === k); return o ? (o.dir === 1 ? 'ascending' : 'descending') : 'none'; };
  const cab1 = `<tr class="cf-bandas"><th class="ak-th-sel is-fixa" style="left:0" rowspan="2"><input type="checkbox" aria-label="Escolher todas" data-cf-todas${ls.length && ls.every((l) => e.sel.has(l.id)) ? ' checked' : ''}></th>${bs.map((b, k) => `<th scope="colgroup" colspan="${b.cols.length}" class="cf-banda cf-b-${b.tipo}${b.vazia ? ' is-vazia' : ''}${b.tipo === 'forn' && fixas.length ? ' is-fixa" style="left:34px' : ''}" data-g="${k}"><span>${b.tipo === 'var' ? `<small>Variação</small> ${esc(b.t)}` : esc(b.t)}${b.sub ? `<em>${b.sub}</em>` : ''}</span></th>`).join('')}</tr>`;
  const cab2 = `<tr class="cf-folhas">${cs.map((c) => `<th scope="col" class="${cls(c)}${fx(c)}" aria-sort="${sort(c.k)}" data-g="${c.banda}" data-cf-col="${c.k}"${c.agrupa ? ' draggable="true"' : ''}><button type="button" data-cf-ordenar="${c.k}" title="Ordenar (Shift junta)">${esc(c.t)}${ordemDe(c.k)}</button><i class="ak-redim" data-cf-redim="${c.k}" aria-hidden="true"></i></th>`).join('')}</tr>`;
  const filt = e.filtrosAbertos ? `<tr class="ak-filtros"><th class="is-fixa" style="left:0"></th>${cs.map((c) => `<th class="${fx(c) ? fx(c).slice(1) : ''}"><input type="search" data-cf-filtro="${c.k}" value="${esc(e.filtros[c.k] ?? '')}" aria-label="Filtrar ${esc(c.xl ?? c.t)}" placeholder="${c.tipo === 'txt' || c.tipo === 'mono' ? 'Filtrar…' : c.tipo === 'pct' ? '<0' : '>0'}"></th>`).join('')}</tr>` : '';
  const desc = cs.filter((c) => c.banda === 0).length;
  const linhaSoma = (s: LinhaCf) => cs.filter((c) => c.banda > 0).map((c) => `<td class="${cls(c)}" data-g="${c.banda}">${cel(e, c, s)}</td>`).join('');
  const corpo = nos.map((no) => {
    if (no.tipo === 'g') {
      const aberto = !e.fechados.has(no.chave), c = colDe(e, no.k), cod = no.k === 'fam' && no.linhas[0].c.codFam ? `<i class="cf-cod">${esc(no.linhas[0].c.codFam)}</i>` : '';
      return `<tr class="ak-g cf-g" data-cf-grupo="${esc(no.chave)}" tabindex="-1" aria-expanded="${aberto}" style="--n:${no.nivel}"><td class="ak-g-c is-fixa" style="left:0"><button type="button" data-cf-dobrar="${esc(no.chave)}" aria-label="${aberto ? 'Fechar' : 'Abrir'} o grupo">${L(chevronRight)}</button></td><td colspan="${desc}" class="is-fixa is-fixa-ult" style="left:34px"><span class="ak-g-t"><small>${esc(c.t)}</small>${cod}<b>${esc(no.valor)}</b><em>${no.linhas.length} ${no.linhas.length === 1 ? 'linha' : 'linhas'}</em></span></td>${e.somas ? linhaSoma(soma(no.linhas)) : `<td colspan="${cs.length - desc}"></td>`}</tr>`;
    }
    const l = no.l, sel = e.sel.has(l.id);
    return `<tr data-cf-id="${esc(l.id)}" tabindex="${l.id === e.ativo ? 0 : -1}" aria-selected="${sel}"${l.id === e.ativo ? ' class="is-ativo"' : ''}><td class="ak-td-sel is-fixa" style="left:0"><input type="checkbox" tabindex="-1" aria-label="Escolher ${esc(nomeDe(e, l))}" data-cf-escolher="${esc(l.id)}"${sel ? ' checked' : ''}></td>${cs.map((c) => { const t = cel(e, c, l); return `<td class="${cls(c)}${fx(c)}${t === '—' ? ' is-nada' : (c.tipo === 'n' || c.tipo === 'eur') && valor(l, c.k) === 0 ? ' is-zero' : ''}" data-g="${c.banda}">${t}</td>`; }).join('')}</tr>`;
  }).join('');
  const um = e.modo === 'mensal' && e.vistaM === 'linhas' ? ['linha', 'linhas'] : [e.d.um, e.d.varios];
  const total = e.somas && ls.length ? `<tfoot><tr><td class="is-fixa" style="left:0"></td><td colspan="${desc}" class="is-fixa is-fixa-ult" style="left:34px"><b>Total · ${n(ls.length)} ${ls.length === 1 ? um[0] : um[1]}</b></td>${linhaSoma(soma(ls))}</tr></tfoot>` : '';
  const nada = !ls.length ? `<div class="ak-vazio ak-vazio--linha">${L(searchX)}<p><b>Os filtros da tabela não deixam nenhuma linha.</b>F3 tira os filtros; os critérios ficam.</p><button type="button" class="ak-btn" data-cf-acao="limpar">${L(x)}<span>Remover filtros</span></button></div>` : '';
  g.innerHTML = `<table class="ak-tab cf-tab" aria-label="${esc(e.d.titulo)} · ${MODO_NOME[e.modo]}" aria-rowcount="${ls.length}" aria-multiselectable="true"><colgroup><col style="width:34px">${cs.map((c) => `<col style="width:${larg(c)}px">`).join('')}</colgroup><thead>${cab1}${cab2}${filt}</thead><tbody>${corpo}</tbody>${total}</table>${nada}`;
  g.scrollTop = sc; g.scrollLeft = sl;
  if (!quieto()) {
    if (animar === 'revelar') revelarGrelha(g, e.modo === 'mensal' && e.vistaM === 'quadro' ? 36 : 70);
    else if (animar === 'linhas') g.querySelectorAll<HTMLElement>('tbody tr').forEach((t, i) => { const a = antes.get(t.dataset.cfId ?? ''), r0 = t.getBoundingClientRect().top;
      if (a !== undefined && Math.abs(a - r0) > 1) t.animate([{ transform: `translateY(${a - r0}px)` }, { transform: 'none' }], { duration: 220, easing: ease });
      else if (a === undefined && i < 40) t.animate([{ opacity: 0, transform: 'translateY(-3px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: ease }); });
  }
  estado(r, e); grafico(r, e);
}
/** A revelação: os grupos de colunas entram da esquerda para a direita, as variações contam até ao valor (depois
    dos valores) e as barras crescem; os totais chegam no fim. Só as primeiras 40 linhas mexem. */
function revelarGrelha(g: HTMLElement, passo: number): void {
  const linhas = [...g.querySelectorAll<HTMLElement>('tbody tr')].slice(0, 40), dur = 240;
  const gs = [...g.querySelectorAll<HTMLElement>('thead th[data-g]')].map((t) => Number(t.dataset.g)), ultimo = Math.min(Math.max(0, ...gs), 14);
  const atraso = (k: number) => Math.min(k, 14) * passo;
  g.querySelectorAll<HTMLElement>('thead th[data-g]').forEach((th) => th.animate([{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], { duration: dur, delay: atraso(Number(th.dataset.g)), easing: ease, fill: 'backwards' }));
  linhas.forEach((tr, i) => tr.querySelectorAll<HTMLElement>('td[data-g]').forEach((td) => td.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: atraso(Number(td.dataset.g)) + 40 + Math.min(i, 12) * 10, easing: 'ease-out', fill: 'backwards' })));
  const pcts = linhas.flatMap((tr) => [...tr.querySelectorAll<HTMLElement>('[data-cf-pct]')]);
  pcts.forEach((s) => s.querySelector<HTMLElement>('.cf-barra > i')?.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(var(--p))' }], { duration: 320, delay: atraso(Number(s.closest('td')!.dataset.g)) + 120, easing: ease, fill: 'backwards' }));
  contar(pcts.map((s) => [s.querySelector('b')!, Number(s.dataset.cfPct)] as [HTMLElement, number]), (v) => pct(v), 360, 160);
  g.querySelector<HTMLElement>('tfoot')?.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 220, delay: atraso(ultimo) + 120, easing: ease, fill: 'backwards' });
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

/* ---------- o gráfico da evolução (Geral) ---------- */
/** Os pontos do gráfico: do que passa nos filtros da tabela — o mesmo que a grelha e o total mostram. */
function pontos(e: Est): { rot: string; v: number; alvo: string }[] {
  if (!e.rel) return [];
  const ls = filtradas(e), m = e.metrica;
  if (e.modo === 'mensal') {
    const ms = e.rel.per?.meses ?? [];
    if (e.vistaM === 'linhas') return ms.map((ym) => { const xs = ls.filter((l) => `${l.c.ano}-${l.c.mesN}` === ym); return { rot: rotMes(ym), v: xs.reduce((s, l) => s + (m === 'liq' ? l.anos[2].liq : l.anos[2].qtd), 0), alvo: xs[0]?.id ?? '' }; });
    const t = soma(ls); return ms.map((ym, i) => ({ rot: rotMes(ym), v: m === 'liq' ? t.mes![i].liq : t.mes![i].qtd, alvo: `g:${i + 1}` }));
  }
  const t = soma(ls); return e.rel.anos.map((a, i) => ({ rot: String(a), v: m === 'liq' ? t.anos[i].liq : t.anos[i].qtd, alvo: `l${i}` }));
}
function grafico(r: HTMLElement, e: Est): void {
  const caixa = r.querySelector<HTMLElement>('[data-cf-graf]'); if (!caixa) return;
  r.querySelector('[data-cf-acao="grafico"]')?.setAttribute('aria-pressed', String(e.grafico));
  if (!e.rel?.linhas.length || !e.grafico) { caixa.hidden = true; return; }
  caixa.hidden = false;
  const ps = pontos(e), max = Math.max(0, ...ps.map((p) => p.v)), liq = e.metrica === 'liq';
  const fmt = (v: number) => liq ? euros(v) : `${n(v)} un.`, eixo = (v: number) => liq ? `${Math.round(v / 100).toLocaleString('pt-PT')} €` : `${n(v)} un.`;
  const cab = `<header><b>Evolução das compras</b><small>${e.modo === 'mensal' ? 'por mês' : 'por ano'} · ${liq ? 'valor líquido, sem IVA' : 'quantidade'}</small><span class="cf-seg cf-seg--p" role="radiogroup" aria-label="O que o gráfico mostra"><button type="button" role="radio" data-cf-metrica="liq" aria-checked="${liq}">Valores</button><button type="button" role="radio" data-cf-metrica="qtd" aria-checked="${!liq}">Quantidades</button></span><button type="button" class="ak-x" data-cf-acao="grafico" aria-label="Esconder o gráfico" title="Esconder o gráfico">${L(x)}</button></header>`;
  if (!max) { caixa.innerHTML = `${cab}<p class="cf-graf-vazio">${L(circleAlert)}Não há ${liq ? 'valores' : 'quantidades'} para desenhar neste período: o gráfico fica vazio em vez de mostrar barras a zero.</p>`; return; }
  /* a grelha é a ferramenta principal: o gráfico encolhe em ecrãs baixos */
  const W = Math.max(320, caixa.clientWidth - 24), H = innerHeight < 860 ? 104 : 144, esqE = 74, base = H - 22, alto = base - 14, k = ps.length, slot = (W - esqE - 8) / k, bw = Math.min(56, Math.max(10, slot * 0.6));
  const y = (v: number) => base - (v / max) * alto;
  const linhasEixo = [0, 0.5, 1].map((f) => `<g class="cf-g-eixo"><line x1="${esqE}" x2="${W}" y1="${y(max * f)}" y2="${y(max * f)}"/><text x="${esqE - 6}" y="${y(max * f) + 4}" text-anchor="end">${eixo(max * f)}</text></g>`).join('');
  const barras = ps.map((p, i) => { const cx = esqE + slot * i + slot / 2, h = Math.max(p.v ? 2 : 0, base - y(p.v));
    const varTxt = e.modo === 'anual' && i ? (() => { const v = variacao(ps[i - 1].v, p.v); return v === undefined ? '' : v === null ? 'N/D' : pct(v); })() : '';
    return `<g class="cf-g-b${p.alvo ? '' : ' is-sem'}" tabindex="0" role="button" data-cf-ponto="${i}" data-cf-alvo="${esc(p.alvo)}" aria-label="${p.rot}: ${fmt(p.v)}${varTxt ? ` (${varTxt} face ao ano anterior)` : ''}"><rect class="cf-g-zona" x="${cx - slot / 2}" y="0" width="${slot}" height="${H}"/><rect class="cf-bar${i === k - 1 ? ' is-ult' : ''}" x="${cx - bw / 2}" y="${base - h}" width="${bw}" height="${h}" rx="3" style="--i:${Math.min(i, 24) / (k > 6 ? 4 : 1)}"/>${varTxt ? `<text class="cf-g-var" x="${cx}" y="${Math.max(10, base - h - 6)}" text-anchor="middle">${varTxt}</text>` : ''}<text class="cf-bar-a" x="${cx}" y="${H - 6}" text-anchor="middle">${k > 14 && i % 2 ? '' : p.rot}</text></g>`; }).join('');
  const assin = `${e.modo}|${e.metrica}|${ps.map((p) => p.v).join(',')}`, novo = assin !== e.grafAssin; e.grafAssin = assin;
  caixa.innerHTML = `${cab}<div class="cf-graf-area"><svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="group" aria-label="Evolução das compras ${e.modo === 'mensal' ? 'por mês' : 'por ano'}" class="${novo && !quieto() ? 'is-novo' : ''}">${linhasEixo}${barras}<line class="cf-bar-base" x1="${esqE}" x2="${W}" y1="${base}" y2="${base}"/></svg><p class="cf-dica-g" data-cf-tip hidden></p></div>`;
}
/** Escolher um ponto do gráfico mostra o que lhe corresponde na grelha (a linha do mês, ou as colunas do ano). */
function irPonto(r: HTMLElement, e: Est, alvo: string): void {
  if (!alvo) return;
  const g = r.querySelector<HTMLElement>('[data-cf-grelha]')!;
  if (alvo.startsWith('g:') || /^l\d$/.test(alvo)) {
    const cells = alvo.startsWith('g:') ? g.querySelectorAll<HTMLElement>(`[data-g="${alvo.slice(2)}"]`) : g.querySelectorAll<HTMLElement>(`[data-g="${g.querySelector<HTMLElement>(`th[data-cf-col="${alvo}"]`)?.dataset.g}"]`);
    cells[0]?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: quieto() ? 'auto' : 'smooth' });
    cells.forEach((c) => { c.classList.remove('cf-realce'); void c.offsetWidth; c.classList.add('cf-realce'); });
    window.setTimeout(() => cells.forEach((c) => c.classList.remove('cf-realce')), 1200);
    return;
  }
  escolher(r, e, alvo, 'um', e.det);
}

function zonaGrupos(r: HTMLElement, e: Est): void {
  const z = r.querySelector<HTMLElement>('[data-cf-grupos]')!, ag = agrupaveis(e);
  z.classList.toggle('tem-grupos', e.grupos.length > 0);
  const nome = (k: string) => colDe(e, k).t, agr = ag.map((c) => c.t);
  z.innerHTML = `${L(columns3)}${e.grupos.length ? e.grupos.map((k, i) => `<span class="ak-chip" draggable="true" tabindex="0" data-cf-chip="${k}" title="Delete tira; Alt+← → muda o nível">${i ? L(chevronRight) : ''}<b>${esc(nome(k))}</b><button type="button" data-cf-tirar-grupo="${k}" aria-label="Deixar de agrupar por ${esc(nome(k))}">${L(x)}</button></span>`).join('') + '<button type="button" class="ak-desagrupar" data-cf-acao="desagrupar">Desagrupar</button>' : `<span class="ak-grupos-dica">Arraste para aqui o cabeçalho ${agr.length > 1 ? `${agr.slice(0, -1).join(', ')} ou ${agr[agr.length - 1]}` : agr[0] ?? ''} para agrupar</span>`}
    ${e.rel && e.modo === 'mensal' ? `<span class="cf-vistas-m" role="radiogroup" aria-label="Vista mensal"><button type="button" role="radio" data-cf-vista-m="linhas" aria-checked="${e.vistaM === 'linhas'}" title="Vista detalhada: o relatório original, uma linha por mês">${L(rows3)}<span>Vista detalhada</span></button><button type="button" role="radio" data-cf-vista-m="quadro" aria-checked="${e.vistaM === 'quadro'}" title="Vista por períodos: um grupo de colunas por mês">${L(table2)}<span>Vista por períodos</span></button></span>` : ''}
    <label class="ak-agrupar-tecla"><span class="sr">Agrupar por</span><select data-cf-agrupar aria-label="Agrupar por (teclado)"><option value="">Agrupar por…</option>${ag.filter((c) => !e.grupos.includes(c.k)).map((c) => `<option value="${c.k}">${esc(c.t)}</option>`).join('')}</select></label>`;
}
function colunasMenu(r: HTMLElement, e: Est): void {
  const m = r.querySelector<HTMLElement>('[data-cf-cols]'); if (!m) return;
  m.innerHTML = `<p class="ak-menu-t">Colunas à vista</p>${e.d.esconder.map(([k, t]) => `<div class="ak-col-i cf-col-i"><label><input type="checkbox" data-cf-ver="${k}"${e.ocultas.has(k) ? '' : ' checked'}>${t}</label></div>`).join('')}<p>${esc(descr(e).filter((c) => c.fixa).map((c) => c.t).join(', '))} e os valores ficam sempre.</p>`;
  r.querySelectorAll<HTMLElement>('[data-cf-densidade]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.cfDensidade === e.densidade)));
  r.querySelectorAll<HTMLElement>('[data-cf-anos]').forEach((b) => b.setAttribute('aria-checked', String((b.dataset.cfAnos === 'recentes') === e.recentes)));
}
const periodoTxt = (e: Est) => !e.pedido ? '—' : e.d.mapa ? `${dia(e.pedido.ini)} – ${dia(e.pedido.fim)}` : e.pedido.modo === 'mensal' ? `${rotMes(e.pedido.ini)} – ${rotMes(e.pedido.fim)}` : `${e.pedido.a0}–${e.pedido.a0 + 2}`;
function estado(r: HTMLElement, e: Est): void {
  const ls = e.rel ? filtradas(e) : [], nf = Object.values(e.filtros).filter((v) => v && v.trim()).length;
  const fase = e.fase === 'a-gerar' ? (e.rel ? 'A atualizar…' : 'A gerar…') : e.fase === 'erro' ? 'Erro ao gerar' : e.rel ? 'Pronto' : 'Sem dados';
  const ents = e.rel ? new Set(ls.map((l) => l.ent ?? l.id)).size : 0;
  r.querySelector<HTMLElement>('[data-cf-estado]')!.innerHTML = `<span class="ak-estado-f is-${e.fase}">${e.fase === 'a-gerar' ? L(loader) : ''}${fase}</span>${e.rel ? `<span>${e.d.mapa ? `Linhas <b>${n(ls.length)}</b> · documentos <b>${n(new Set(ls.map((l) => l.c.doc)).size)}</b>` : `${cap(e.d.varios)} <b>${n(ents)}</b>`}</span><span>Período analisado <b>${periodoTxt(e)}</b> · ${MODO_NOME[e.modo]}</span>` : ''}<span>Seleção <b>${n(e.sel.size)}</b></span>${nf ? `<span>Filtros da tabela <b>${nf}</b></span>` : ''}${e.grupos.length ? `<span>Agrupado por <b>${e.grupos.map((k) => esc(colDe(e, k).t)).join(' › ')}</b></span>` : ''}${e.aviso ? `<span class="ak-estado-aviso">${esc(e.aviso)}</span>` : ''}`;
  const nt = r.querySelector('[data-cf-n-todos]'), ns = r.querySelector('[data-cf-n-sel]');
  if (nt) nt.textContent = `(${n(ls.length)})`; if (ns) ns.textContent = `(${n(e.sel.size)})`;
  r.querySelector('[data-cf-exportar="escolhidos"]')?.toggleAttribute('disabled', !e.sel.size);
  const sem = !e.rel?.linhas.length;
  r.querySelectorAll<HTMLButtonElement>('.ak2-barra [data-cf-acao="exportar"], .ak2-barra [data-cf-acao="filtrar"], .ak2-barra [data-cf-acao="limpar"], .ak2-barra [data-cf-acao="imprimir"], .ak2-barra [data-cf-acao="atualizar"], .ak2-barra [data-cf-acao="grafico"]').forEach((b) => {
    const porque = sem ? SEM_DADOS : b.dataset.cfAcao === 'atualizar' && e.fase === 'a-gerar' ? 'O comparativo já está a ser pedido.' : b.dataset.cfAcao === 'limpar' && !nf ? 'Não há filtros da tabela.' : '';
    b.setAttribute('aria-disabled', String(!!porque)); if (porque) b.title = porque; else b.removeAttribute('title');
  });
  r.querySelectorAll<HTMLButtonElement>('[data-cf-acao="gerar"]').forEach((b) => { b.disabled = e.fase === 'a-gerar'; b.classList.toggle('is-carregar', e.fase === 'a-gerar'); });
  r.querySelector('[data-cf-acao="filtrar"]')?.setAttribute('aria-pressed', String(e.filtrosAbertos));
  r.querySelector('[data-cf-acao="somas"]')?.setAttribute('aria-pressed', String(e.somas));
  r.querySelector<HTMLElement>('[data-cf-acao="recolher"]')?.toggleAttribute('hidden', sem);
  const va = r.querySelector<HTMLElement>('[data-cf-vista]'), at = e.vistas.find((v) => v.id === e.vista);
  if (va) { va.hidden = !at; va.innerHTML = at ? `<small>Vista</small><b>${esc(at.nome)}</b>` : ''; }
  outroModo(r, e);
  sumario(r, e, ls);
}
/** Os resultados à vista são de outro modo: diz-se (nunca se mudam os rótulos de uns dados para os do outro modo). */
function outroModo(r: HTMLElement, e: Est): void {
  const p = r.querySelector<HTMLElement>('[data-cf-outro]'); if (!p) return;
  const outro = !!e.rel && modoForm(r) !== e.modo;
  if (outro) p.innerHTML = `${L(circleAlert)}<span>Os resultados abaixo são d<b>${modoFrase(e.modo)}</b> (${periodoTxt(e)}). Prime <kbd>F10</kbd> para gerar <b>${modoFrase(modoForm(r))}</b>.</span><button type="button" class="ak-btn" data-cf-acao="gerar">${L(play)}<span>Gerar dados</span></button>`;
  if (outro && p.hidden && !quieto()) p.animate([{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: ease });
  p.hidden = !outro; r.classList.toggle('cf-desatual', outro);
}
/** O resumo: só o que vem nas linhas e acompanha os filtros da tabela. */
function sumario(r: HTMLElement, e: Est, ls: LinhaCf[]): void {
  const s = r.querySelector<HTMLElement>('[data-cf-sumario]')!, pt = r.querySelector<HTMLElement>('[data-cf-imprimir-t]')!;
  if (!e.rel?.linhas.length) { s.hidden = true; e.nums = undefined; return; }
  const t = soma(ls), [a0, a1, a2] = e.rel.anos, sd = new Set(e.rel.semDados);
  const hora = e.gerado ? new Date(e.gerado).toLocaleTimeString('pt-PT') : '—';
  r.querySelector<HTMLElement>('[data-cf-gerado]')!.innerHTML = `Gerado às <b>${hora}</b>`;
  const ents = new Set(ls.map((l) => l.ent ?? l.id)).size, fams = e.d.id === 'familia' || e.d.id === 'artigo' ? new Set(ls.map((l) => l.c.fam)).size : 0;
  const quantos = `${fams ? `<span class="ak2-m"><small>Famílias</small><b>${n(fams)}</b></span>` : ''}${e.d.id === 'geral' ? '' : `<span class="ak2-m"><small>${cap(e.d.varios)}</small><b data-cf-num="0">${n(ents)}</b>${ents !== new Set(linhasBase(e).map((l) => l.ent ?? l.id)).size ? `<i>de ${n(new Set(linhasBase(e).map((l) => l.ent ?? l.id)).size)}</i>` : ''}</span>`}`;
  s.hidden = false;
  if (e.d.mapa) {
    /* o mapa: documentos, o que se conta em cada modo, quantidade e líquido — do que passa nos filtros */
    const conta = (k: string) => new Set(ls.map((l) => l.c[k]).filter(Boolean)).size;
    const extra = e.modo === 'artigo' ? [['Artigos', conta('ref')]] : e.modo === 'artigo-forn' ? [['Fornecedores', conta('forn')], ['Artigos', conta('ref')]] : e.modo === 'familia' ? [['Famílias', conta('fam')], ['Subfamílias', conta('sub')]] : [['Fornecedores', conta('forn')], ['Famílias', conta('fam')], ['Subfamílias', conta('sub')]];
    s.innerHTML = `<span class="ak2-m"><small>Documentos</small><b data-cf-num="0">${n(conta('doc'))}</b></span>${(extra as [string, number][]).map(([t, v]) => `<span class="ak2-m"><small>${t}</small><b>${n(v)}</b></span>`).join('')}<span class="ak2-m"><small>Quantidade total</small><b>${n(t.anos[2].qtd)}</b></span><span class="ak2-m"><small>Líquido total</small><b data-cf-num="3">${euros(t.anos[2].liq)}</b></span>${e.fase === 'a-gerar' ? `<span class="ak2-m-hora">${L(loader)}A atualizar…</span>` : ''}`;
    pt.textContent = `${e.d.titulo} · ${MODO_NOME[e.modo]} · ${periodoTxt(e)} · ${n(ls.length)} linhas · gerado às ${hora}`;
    e.nums = [conta('doc'), 0, 0, t.anos[2].liq]; return;
  }
  if (e.modo === 'mensal') {
    const ms = e.rel.per?.meses ?? [], porMes = ms.map((ym, i) => e.vistaM === 'linhas' ? ls.filter((l) => `${l.c.ano}-${l.c.mesN}` === ym).reduce((a, l) => a + l.anos[2].liq, 0) : t.mes![i].liq), top = porMes.indexOf(Math.max(...porMes));
    s.innerHTML = `${quantos}<span class="ak2-m"><small>Meses analisados</small><b>${ms.length}</b></span><span class="ak2-m"><small>Quantidade total</small><b>${n(t.anos[2].qtd)}</b></span><span class="ak2-m"><small>Valor líquido total</small><b data-cf-num="3">${euros(t.anos[2].liq)}</b></span>${porMes[top] > 0 ? `<span class="ak2-m"><small>Mês com mais compras</small><b>${rotMes(ms[top])}</b><i>${euros(porMes[top])}</i></span>` : ''}${e.fase === 'a-gerar' ? `<span class="ak2-m-hora">${L(loader)}A atualizar…</span>` : ''}`;
    pt.textContent = `${e.d.titulo} · Mensal · ${periodoTxt(e)} · ${n(ls.length)} linhas · gerado às ${hora}`;
    e.nums = [ents, 0, 0, t.anos[2].liq]; return;
  }
  const ano = (i: number) => `<span class="ak2-m cf-m-ano${sd.has(e.rel!.anos[i]) ? ' is-vazio' : ''}"><small>Líquido ${e.rel!.anos[i]}</small><b data-cf-num="${i + 1}">${sd.has(e.rel!.anos[i]) ? 'sem dados' : euros(t.anos[i].liq)}</b><i>${sd.has(e.rel!.anos[i]) ? '' : `${n(t.anos[i].qtd)} un.`}</i></span>`;
  const vr = (i: number) => `<span class="cf-m-var">${celVar(variacao(t.anos[i].liq, t.anos[i + 1].liq), e.rel!.anos[i], e.rel!.anos[i + 1])}</span>`;
  s.innerHTML = `${quantos}${ano(0)}${vr(0)}${ano(1)}${vr(1)}${ano(2)}<span class="ak2-m cf-m-global"><small>Variação ${a0} → ${a2}</small>${celVar(variacao(t.anos[0].liq, t.anos[2].liq), a0, a2)}</span>${e.fase === 'a-gerar' ? `<span class="ak2-m-hora">${L(loader)}A atualizar…</span>` : ''}`
    + (sd.size ? `<p class="cf-parcial">${L(circleAlert)}<span><b>Dados parciais.</b> ${[...sd].join(' e ')} não ${sd.size === 1 ? 'tem' : 'têm'} compras registadas no ERP: ${sd.size === 1 ? 'a coluna fica vazia' : 'as colunas ficam vazias'} e as variações a partir ${sd.size === 1 ? 'desse ano' : 'desses anos'} ficam N/D. Nada é estimado.</span></p>` : '');
  pt.textContent = `${e.d.titulo} · Variações anuais · ${a0}–${a2} · ${n(ls.length)} ${e.d.varios} · ${a1 === ANO_ATUAL || a2 === ANO_ATUAL ? `${ANO_ATUAL} até hoje · ` : ''}gerado às ${hora}`;
  const nums = [ents, t.anos[0].liq, t.anos[1].liq, t.anos[2].liq], antes = e.nums; e.nums = nums;
  if (!antes || quieto()) return;
  nums.forEach((v, i) => { if (antes[i] === v || (i && sd.has(e.rel!.anos[i - 1]))) return; const b = s.querySelector<HTMLElement>(`[data-cf-num="${i}"]`); if (b) contar([[b, v, antes[i]]], (y) => i === 0 ? n(y) : euros(Math.round(y))); });
}
/** As etiquetas dos critérios da análise à vista; o × de um filtro tira-o e volta a gerar. */
function etiquetas(r: HTMLElement, e: Est): void {
  const ul = r.querySelector<HTMLElement>('[data-cf-etiquetas]'); if (!ul || !e.pedido) return;
  if (e.d.mapa && e.pedido.mapa) {
    const m = e.pedido.mapa, int = (t: string, a?: string, b?: string) => a || b ? `<li><button type="button" data-cf-etiqueta="intervalo" title="Alterar">${t}: ${esc(a || 'do primeiro')} – ${esc(b || 'ao último')}</button></li>` : '';
    ul.innerHTML = `<li><button type="button" class="is-forte" data-cf-etiqueta="modo" title="Alterar">${MODO_NOME[e.pedido.modo]}</button></li><li><button type="button" class="is-forte" data-cf-etiqueta="periodo" title="Alterar o período">${periodoTxt(e)}</button></li>${int('Artigos', m.ai, m.af)}${int('Fornecedores', m.fi, m.ff)}${int('Famílias', m.gi, m.gf)}${int('Subfamílias', m.si, m.sf)}${!m.ai && !m.af && !m.fi && !m.ff && !m.gi && !m.gf && !m.si && !m.sf ? '<li><span class="cf-etq">Todos os intervalos</span></li>' : ''}<li><span class="cf-etq">líquido sem IVA</span></li>`;
    return;
  }
  const p = e.pedido, nomes: Record<FiltroCf, string> = { ref: 'Artigo', fam: 'Família', sub: 'Subfamília', marca: 'Marca', forn: 'Fornecedor' };
  const f = (Object.entries(p.filtros) as [FiltroCf, string][]).map(([k, v]) => `<li class="cf-etq-f"><button type="button" data-cf-etiqueta="${k}" title="Alterar">${nomes[k]}: ${esc(k === 'forn' ? fornecedorNome(v) : k === 'fam' ? `${codFam(v)} · ${v}` : v)}</button><button type="button" class="cf-etq-x" data-cf-tirar-filtro="${k}" aria-label="Tirar o filtro ${nomes[k]}" title="Tirar e gerar outra vez">${L(x)}</button></li>`).join('');
  const todos = e.d.filtros.length && !Object.keys(p.filtros).length ? `<li><span class="cf-etq">${e.d.id === 'artigo' ? 'Todos os artigos' : e.d.id === 'familia' ? 'Todas as famílias' : 'Todos os fornecedores'}</span></li>` : '';
  ul.innerHTML = `${e.d.mensal ? `<li><button type="button" class="is-forte" data-cf-etiqueta="modo" title="Alterar">${MODO_NOME[p.modo]}</button></li>` : ''}<li><button type="button" class="is-forte" data-cf-etiqueta="periodo" title="Alterar o período">${periodoTxt(e)}</button></li>${f}${todos}<li><span class="cf-etq">líquido sem IVA${(p.modo === 'anual' ? p.a0 + 2 : Number(p.fim.slice(0, 4))) === ANO_ATUAL ? ' · até hoje' : ''}</span></li>`;
}
function detalheMapa(d: HTMLElement, e: Est, l: LinhaCf): void {
  const doc = l.anos[2].encs[0], irmas = (e.rel?.linhas ?? []).filter((y) => y.c.doc === l.c.doc), [cabP, cabT, cabL] = e.d.cab(l), jan = e.d.janelas(l);
  const par = (k: string, v?: string) => v ? `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>` : '';
  d.innerHTML = `<header><div><small>${esc(cabP)}</small><h3>${esc(cabT)}</h3><p>${esc(cabL)}</p></div><button type="button" class="ak-x" data-cf-acao="fechar-det" aria-label="Fechar o detalhe (Esc)">${L(x)}</button></header>
    <dl class="cf-det-dl">${par('Documento', `${l.c.doc} · ${l.c.data}`)}${par('Fornecedor', l.c.forn)}${par('Conta', l.c.conta)}${par('Nº artigo', l.c.ref)}${par('Descrição', l.c.desc)}${par('Família', l.c.fam && `${l.c.codFam} · ${l.c.fam}`)}${par('Subfamília', l.c.sub && `${l.c.codSub} · ${l.c.sub}`)}${par('Quantidade', n(l.anos[2].qtd))}${par('Líquido', euros(l.anos[2].liq))}</dl>
    <div class="ak-det-acoes">${doc && !doc.arquivo ? `<button type="button" class="ak-btn" data-dk-doc="compras.encomenda" data-dk-titulo="${esc(doc.ref)}">${icone('file-text')}<span>Abrir a encomenda</span></button>` : `<span class="cf-arq" title="Encomenda fechada (arquivo)">${esc(l.c.doc)} · arquivo</span>`}${jan.map(([j, ic, t]) => `<button type="button" class="ak-btn" data-dk-janela="${esc(j)}">${icone(ic)}<span>${t}</span></button>`).join('')}</div>
    <h4>Linhas deste documento <span>${irmas.length}</span></h4>
    <table class="ak-hist"><thead><tr><th>${l.c.ref !== undefined ? 'Artigo' : 'Subfamília'}</th><th class="is-num">Qtd.</th><th class="is-num">Líquido</th></tr></thead><tbody>${irmas.map((y) => `<tr${y.id === l.id ? ' class="is-ativo"' : ''}><td>${esc(y.c.ref ?? y.c.sub ?? '')}</td><td class="is-num">${n(y.anos[2].qtd)}</td><td class="is-num">${euros(y.anos[2].liq)}</td></tr>`).join('')}</tbody></table>`;
}
function detalhe(r: HTMLElement, e: Est, entrar = false): void {
  const d = r.querySelector<HTMLElement>('[data-cf-det]')!, sel = linhasBase(e).find((y) => y.id === e.ativo);
  const l = sel?.ent ? e.rel?.linhas.find((y) => y.id === sel.ent) : sel;
  if (!e.det || !l || !e.rel) { if (!d.hidden) { if (quieto()) d.hidden = true; else d.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateX(24px)', opacity: 0 }], { duration: 180, easing: 'ease-in' }).onfinish = () => { d.hidden = true; }; } r.classList.remove('com-det'); return; }
  if (e.d.mapa) { detalheMapa(d, e, l); const vem = d.hidden; d.hidden = false; r.classList.add('com-det'); if ((vem || entrar) && !quieto()) d.animate([{ transform: 'translateX(28px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 250, easing: ease }); return; }
  const anos = e.rel.anos, sd = new Set(e.rel.semDados), mensal = e.modo === 'mensal', ms = e.rel.per?.meses ?? [];
  /* as barras: o valor de cada ano (ou de cada mês do período), à mesma escala */
  const serie: [string, number | null][] = mensal ? ms.map((ym, i) => [MES3[Number(ym.slice(5, 7)) - 1].slice(0, 3), l.mes![i].liq]) : l.anos.map((a, i) => [String(anos[i]), sd.has(anos[i]) || a.futuro ? null : a.liq]);
  const max = Math.max(1, ...serie.map(([, v]) => v ?? 0));
  const W = 300, H = 132, k = serie.length, bw = mensal ? Math.max(6, Math.min(18, 220 / k)) : 54, gap = (W - k * bw) / k;
  const curto = (v: number) => mensal ? '' : euros(v).replace(/,\d\d €$/, ' €');
  const destaque = sel?.ent ? ms.indexOf(`${sel.c.ano}-${sel.c.mesN}`) : -1;
  const barras = serie.map(([rot, v], i) => { const h = Math.round(((v ?? 0) / max) * (H - 34)), xx = Math.round(gap / 2 + i * (bw + gap));
    return `<g><title>${rot}: ${v === null ? 'sem dados' : euros(v)}</title><rect class="cf-bar${i === (destaque >= 0 ? destaque : k - 1) ? ' is-ult' : ''}" x="${xx}" y="${H - 18 - h}" width="${bw}" height="${Math.max(h, v ? 2 : 0)}" rx="3" style="--i:${mensal ? i / 3 : i}"/><text class="cf-bar-v" x="${xx + bw / 2}" y="${H - 22 - h}" text-anchor="middle">${v === null ? (mensal ? '' : 'sem dados') : curto(v)}</text><text class="cf-bar-a" x="${xx + bw / 2}" y="${H - 4}" text-anchor="middle">${k > 12 && i % 2 ? '' : rot}</text></g>`; }).join('');
  const tab = mensal
    ? ms.map((ym, i) => `<tr${i === destaque ? ' class="is-ativo"' : ''}><th scope="row">${rotMes(ym)}</th><td class="is-num">${n(l.mes![i].qtd)}</td><td class="is-num">${euros(l.mes![i].liq)}</td></tr>`).join('')
    : l.anos.map((a, i) => `<tr><th scope="row">${anos[i]}</th><td class="is-num">${sd.has(anos[i]) || a.futuro ? '—' : n(a.qtd)}</td><td class="is-num">${sd.has(anos[i]) || a.futuro ? '—' : euros(a.liq)}</td><td class="is-num">${i ? celVar(valor(l, `v${i - 1}`), anos[i - 1], anos[i]) : ''}</td></tr>`).join('');
  const encs = mensal ? l.anos[2].encs.map((y) => ({ ...y })) : l.anos.flatMap((a) => a.encs);
  const [cabP, cabT, cabL] = e.d.cab(l), jan = e.d.janelas(l);
  d.innerHTML = `<header><div><small>${esc(cabP)}</small><h3>${esc(cabT)}</h3><p>${esc(cabL === 'o período escolhido' ? periodoTxt(e) : cabL)}</p></div><button type="button" class="ak-x" data-cf-acao="fechar-det" aria-label="Fechar o detalhe (Esc)">${L(x)}</button></header>
    <figure class="cf-graf"><figcaption>${mensal ? `Valor por mês · ${periodoTxt(e)}` : 'Líquido por ano'}</figcaption><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${serie.map(([rt, v]) => `${rt} ${v === null ? 'sem dados' : euros(v)}`).join(', ')}">${barras}<line x1="0" x2="${W}" y1="${H - 18}" y2="${H - 18}" class="cf-bar-base"/></svg></figure>
    <table class="ak-hist cf-det-tab"><thead><tr><th>${mensal ? 'Mês' : 'Ano'}</th><th class="is-num">Quantidade</th><th class="is-num">${mensal ? 'Valor' : 'Líquido'}</th>${mensal ? '' : '<th class="is-num">Variação</th>'}</tr></thead><tbody>${tab}</tbody></table>
    ${jan.length ? `<div class="ak-det-acoes">${jan.map(([j, ic, t]) => `<button type="button" class="ak-btn" data-dk-janela="${esc(j)}">${icone(ic)}<span>${t}</span></button>`).join('')}</div>` : ''}
    <h4>Encomendas no período <span>${encs.length}</span></h4>
    ${encs.length ? `<table class="ak-hist"><thead><tr><th>Encomenda</th><th>Data</th><th class="is-num">Qtd.</th><th class="is-num">Líquido</th></tr></thead><tbody>${encs.map((y) => `<tr><td>${y.arquivo ? `<span class="cf-arq" title="Encomenda fechada (arquivo)">${esc(y.ref)}</span>` : `<button type="button" class="ak-lig" data-dk-doc="compras.encomenda" data-dk-titulo="${esc(y.ref)}">${esc(y.ref)}</button>`}</td><td>${dia(y.data)}</td><td class="is-num">${n(y.qtd)}</td><td class="is-num">${euros(y.liq)}</td></tr>`).join('')}</tbody></table>` : '<p class="ak-det-nada">Sem encomendas no período.</p>'}`;
  const vem = d.hidden; d.hidden = false; r.classList.add('com-det');
  if ((vem || entrar) && !quieto()) d.animate([{ transform: 'translateX(28px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 250, easing: ease });
}
function tudo(r: HTMLElement, e: Est, animar: 'nada' | 'linhas' | 'revelar' = 'nada'): void { zonaGrupos(r, e); grelha(r, e, animar); zonaGrupos(r, e); colunasMenu(r, e); detalhe(r, e); }

/* ---------- avisos breves ---------- */
const avisos = new WeakMap<HTMLElement, number>();
function toast(r: HTMLElement, t: string): void {
  const p = r.querySelector<HTMLElement>('[data-hm-aviso]'); if (!p) return;
  p.textContent = t; p.classList.add('is-visivel'); clearTimeout(avisos.get(r));
  avisos.set(r, window.setTimeout(() => p.classList.remove('is-visivel'), 2800));
}
function avisar(r: HTMLElement, e: Est, t: string): void { e.aviso = t; estado(r, e); toast(r, t); }

/* ---------- gerar ---------- */
function resumir(r: HTMLElement, e: Est, sim: boolean, foco?: string): void {
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
  if (!sim) (((foco ? campo(r, foco) : null) as HTMLElement | null) ?? campos(r)[0])?.focus();
}
async function gerarDados(r: HTMLElement, e: Est, mesmo = false): Promise<void> {
  if (e.fase === 'a-gerar') return; /* nada de pedidos repetidos */
  limparErro(r);
  const p = mesmo && e.pedido ? e.pedido : validar(r, e);
  if (!p) { const k = r.querySelector('[data-cf-crit] [aria-invalid]')?.getAttribute('name') ?? undefined; resumir(r, e, false, k); validar(r, e); return; }
  const tinha = !!e.rel?.linhas.length, vez = ++e.vez;
  e.fase = 'a-gerar'; e.aviso = undefined; grelha(r, e);
  /* deixa a página pintar a carga antes de calcular (o tempo é o do cálculo, não um atraso inventado) */
  await new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)));
  if (vez !== e.vez) return;
  if (!navigator.onLine) { falhar(r, e, 'offline'); return; }
  try {
    const rel = e.d.mapa ? analisar(p.modo as ModoMapa, p.mapa!) : p.modo === 'mensal' ? compararMensal(e.d.id, p.ini, p.fim, p.filtros) : comparar(e.d.id, p.a0, p.filtros);
    /* um mapa novo traz a sua hierarquia (Família → Subfamília…); o mesmo mapa guarda os grupos escolhidos */
    if (e.d.mapa && e.pedido?.modo !== p.modo) { e.grupos = [...MAPA_GRUPOS[p.modo as ModoMapa]]; e.ordem = []; e.filtros = {}; }
    const mudou = !e.pedido || JSON.stringify(e.pedido) !== JSON.stringify(p);
    e.rel = rel; e.pedido = p; e.modo = p.modo; e.fase = 'ok'; e.gerado = Date.now(); e.tipoErro = undefined; if (mudou) e.fechados.clear();
    const ids = new Set(linhasBase(e).map((l) => l.id));
    e.sel = new Set([...e.sel].filter((k) => ids.has(k)));
    if (!ids.has(e.ativo)) { e.ativo = filtradas(e)[0]?.id ?? ''; e.det = false; }
    if (mudou) e.nums = undefined;
    resumir(r, e, true);
    tudo(r, e, !tinha || mudou ? 'revelar' : 'linhas');
    if (!quieto() && (!tinha || mudou)) [r.querySelector('[data-cf-sumario]'), r.querySelector('[data-cf-graf]'), r.querySelector('[data-cf-grupos]')].forEach((y, i) => (y as HTMLElement | null)?.animate([{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], { duration: 220, delay: i * 50, easing: ease, fill: 'backwards' }));
    if (mesmo) toast(r, `Atualizado às ${new Date(e.gerado).toLocaleTimeString('pt-PT')}.`);
    (r.querySelector<HTMLElement>('tbody tr[tabindex="0"]') ?? r.querySelector<HTMLElement>('tbody tr[data-cf-id]') ?? r.querySelector<HTMLElement>('[data-cf-grelha] .ak-vazio button'))?.focus({ preventScroll: true });
  } catch (err) { falhar(r, e, 'servidor'); console.error(err); }
}
function falhar(r: HTMLElement, e: Est, t: TipoErro): void {
  e.tipoErro = t; e.erro = `Referência ERP-MAP-${Date.now().toString(36).slice(-5).toUpperCase()}. Os critérios ficam.`;
  if (e.rel) { e.fase = 'ok'; grelha(r, e); avisar(r, e, `${ERROS[t][1]} Os resultados anteriores ficam.`); }
  else { e.fase = 'erro'; grelha(r, e); }
}
function cancelar(r: HTMLElement, e: Est): void {
  if (e.fase === 'a-gerar') { e.vez++; e.fase = e.rel ? 'ok' : 'inicial'; grelha(r, e); avisar(r, e, e.rel ? 'Pedido cancelado. Os resultados anteriores ficam.' : 'Pedido cancelado.'); return; }
  /* repõe os critérios do que está à vista */
  if (e.pedido) { const p = e.pedido; porCrit(r, e, e.d.mapa ? { modo: p.modo, mapa: p.mapa } : p.modo === 'mensal' ? { modo: 'mensal', mai: p.ini.slice(0, 4), mmi: p.ini.slice(5, 7), maf: p.fim.slice(0, 4), mmf: p.fim.slice(5, 7), filtros: p.filtros } : { modo: 'anual', ini: String(p.a0), fim: String(p.a0 + 2), filtros: p.filtros }); }
  limparErro(r); outroModo(r, e);
  if (e.rel?.linhas.length) { resumir(r, e, true); r.querySelector<HTMLElement>('tbody tr.is-ativo, tbody tr[data-cf-id]')?.focus(); }
  else { e.aviso = 'Critérios repostos.'; estado(r, e); }
}
function exportar(r: HTMLElement, e: Est, escopo: 'todos' | 'escolhidos'): void {
  if (!e.rel?.linhas.length) return;
  const cs = folhas(e), ls = filtradas(e).filter((l) => escopo === 'todos' || e.sel.has(l.id)), sd = new Set(e.rel.semDados);
  if (!ls.length) { avisar(r, e, 'Nada para exportar.'); return; }
  try {
    const titulo = (c: Col) => c.xl ?? c.t;
    const celula = (c: Col, l: LinhaCf): Celula => { const v = valor(l, c.k);
      if ((c.ano !== undefined && sd.has(c.ano)) || c.futuro) return null;
      return c.tipo === 'pct' ? (typeof v === 'number' ? { pct: v } : v === null ? 'N/D' : null) : c.tipo === 'eur' ? (v === undefined ? null : { euros: v as number }) : c.tipo === 'n' ? (v === undefined ? null : v as number) : ['num', 'ano', 'mesN'].includes(c.k) ? Number(v) : v === undefined ? null : String(v); };
    const gcols = e.grupos.map((k) => colDe(e, k)), todas = [...gcols, ...cs.filter((c) => !e.grupos.includes(c.k))];
    const linhas = ls.map((l) => todas.map((c) => celula(c, l)));
    if (e.somas) { const t = soma(ls); linhas.push(todas.map((c, i) => c.banda === 0 || e.grupos.includes(c.k) ? (i === 0 ? `Total (${ls.length})` : null) : celula(c, t))); }
    const p = e.pedido!, per = e.d.mapa ? `${p.modo}-${p.ini}-a-${p.fim}` : p.modo === 'mensal' ? `${p.ini}-a-${p.fim}-mensal${e.vistaM === 'quadro' ? '-por-periodos' : ''}` : `${p.a0}-${p.a0 + 2}`, nome = e.d.mapa ? `Analise-compras-${per}.xlsx` : `Comparativo-${e.d.ficheiro}-${per}.xlsx`;
    descarregar(xlsx({ nome: e.d.mapa ? `Analise ${MODO_NOME[p.modo]}`.replace(/\//g, '-').slice(0, 31) : `Comparativo ${p.modo === 'mensal' ? 'mensal' : 'anual'}`, colunas: todas.map(titulo), linhas, larguras: todas.map((c) => Math.max(10, Math.round((e.larguras[c.k] ?? c.w) / 7))) }), nome);
    avisar(r, e, `Exportado: ${nome} · ${n(ls.length)} ${ls.length === 1 ? 'linha' : 'linhas'} (${MODO_NOME[e.modo].toLowerCase()}, ${escopo === 'todos' ? 'todas' : 'só as escolhidas'})${e.somas ? ', com o total' : ''}.`);
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
function mudarVistaM(r: HTMLElement, e: Est, v: 'linhas' | 'quadro'): void {
  if (e.vistaM === v) return;
  e.vistaM = v; e.sel = new Set(); e.fechados.clear(); e.filtros = {}; e.ordem = [];
  const sel = e.ativo; e.ativo = v === 'quadro' ? (linhasBase(e).find((l) => sel.endsWith(`|${l.id}`))?.id ?? filtradas(e)[0]?.id ?? '') : (filtradas(e).find((l) => l.ent === sel)?.id ?? filtradas(e)[0]?.id ?? '');
  e.nums = undefined; tudo(r, e, 'revelar');
}

/* ---------- ligar ---------- */
function de(r: HTMLElement): Est { let e = estados.get(r); if (!e) { e = novo(r); estados.set(r, e); } return e; }
function armar(r: HTMLElement): void {
  if (r.dataset.cfPronto) return; r.dataset.cfPronto = '1';
  const e = de(r), cen = r.dataset.cfCenario as CenarioCf;
  const erros: Partial<Record<CenarioCf, TipoErro>> = { erro: 'servidor', tempo: 'tempo', offline: 'offline', permissao: 'permissao', sessao: 'sessao' };
  /* o modo pedido pelo menu (os itens antigos abrem este separador, cada um no seu modo) */
  const pedidoModo = new URLSearchParams(location.hash.slice(1)).get('modo');
  if (cen === 'inicial' && pedidoModo && ((e.d.mensal && (pedidoModo === 'mensal' || pedidoModo === 'anual')) || (e.d.mapa && MAPA_COLS[pedidoModo as ModoMapa]))) modoEm(r, pedidoModo);
  if (cen === 'inicial' || cen === 'a-gerar' || cen === 'invalido' || erros[cen]) {
    if (erros[cen]) { e.fase = 'erro'; e.tipoErro = erros[cen]; e.erro = 'Referência ERP-MAP-504. O servidor de relatórios não respondeu.'; }
    if (cen === 'a-gerar') e.fase = 'a-gerar';
    tudo(r, e);
    if (cen === 'invalido' && e.d.mapa) { porCrit(r, e, { mapa: { di: `${ANO_ATUAL}-10-19`, df: `${ANO_ATUAL}-09-01` } }); const p = r.querySelector<HTMLElement>('[data-cf-erro]')!; p.hidden = false; p.textContent = 'A data inicial não pode ser depois da data final.'; campo(r, 'df')!.setAttribute('aria-invalid', 'true'); return; }
    if (cen === 'invalido') { porCrit(r, e, { ini: String(ANO_ATUAL - 1), fim: String(ANO_ATUAL + 1) }); const p = r.querySelector<HTMLElement>('[data-cf-erro]')!; p.hidden = false; p.textContent = `${ANO_ATUAL + 1} ainda não começou: o ano final pode ir até ${ANO_ATUAL}.`; campo(r, 'fim')!.setAttribute('aria-invalid', 'true'); }
    return;
  }
  if (e.d.mapa) {
    /* os mapas: de 1 de janeiro até hoje, cada um com a sua hierarquia */
    const modo: ModoMapa = cen === 'outro-modo' ? 'artigo' : cen.startsWith('modo-') ? cen.slice(5) as ModoMapa : 'artigo';
    const mp: CritMapa = cen === 'vazio' ? { di: `${ANO_ATUAL}-04-01`, df: `${ANO_ATUAL}-05-31` } : { di: `${ANO_ATUAL}-01-01`, df: `${ANO_ATUAL}-10-19` };
    porCrit(r, e, { modo, mapa: mp });
    e.pedido = { modo, a0: ANO_ATUAL, ini: mp.di, fim: mp.df, filtros: {}, mapa: mp }; e.modo = modo; e.rel = analisar(modo, mp); e.fase = 'ok'; e.gerado = Date.now();
    e.grupos = cen === 'agrupado' ? ['doc'] : [...MAPA_GRUPOS[modo]];
    e.ativo = filtradas(e)[0]?.id ?? ''; e.sel = new Set(e.ativo ? [e.ativo] : []);
    if (cen === 'detalhe') e.det = true;
    if (cen === 'filtros') { e.filtrosAbertos = true; e.filtros = { t: '>1000' }; }
    if (cen === 'a-atualizar') e.fase = 'a-gerar';
    if (cen === 'exportado') e.aviso = `Exportado: Analise-compras-${modo}-${mp.di}-a-${mp.df}.xlsx · ${n(e.rel.linhas.length)} linhas (todas), com o total.`;
    if (cen === 'export-falhou') e.aviso = 'A exportação falhou. Os resultados ficam; tenta outra vez (F4).';
    if (cen === 'restaurado') e.aviso = 'Área de trabalho reposta: o modo, os critérios, os resultados, os grupos e a linha escolhida como estavam — sem gerar outra vez.';
    etiquetas(r, e);
    if (cen !== 'editar' && cen !== 'outro-modo' && e.rel.linhas.length) r.classList.add('crit-resumo');
    tudo(r, e);
    if (cen === 'outro-modo') { modoEm(r, 'artigo-forn'); outroModo(r, e); }
    return;
  }
  const mensal = cen === 'mensal' || cen === 'quadro';
  const a0 = cen === 'parcial' ? ANO_ATUAL - 3 : cen === 'vazio' ? ANO_ATUAL - 8 : ANO_ATUAL - 2;
  const p: Pedido = mensal ? { modo: 'mensal', a0: ANO_ATUAL, ini: `${ANO_ATUAL}-01`, fim: `${ANO_ATUAL}-${String(MES_ATUAL).padStart(2, '0')}`, filtros: {} } : { modo: 'anual', a0, ini: String(a0), fim: String(a0 + 2), filtros: {} };
  porCrit(r, e, mensal ? { modo: 'mensal' } : { modo: 'anual', ini: String(a0), fim: String(a0 + 2) });
  e.pedido = p; e.modo = p.modo; e.rel = mensal ? compararMensal(e.d.id, p.ini, p.fim) : comparar(e.d.id, a0); e.fase = 'ok'; e.gerado = Date.now();
  if (cen === 'quadro') e.vistaM = 'quadro'; if (cen === 'mensal') e.vistaM = 'linhas';
  if (cen === 'grafico-oculto') e.grafico = false;
  if (cen === 'grafico-qtd') e.metrica = 'qtd';
  if (cen === 'grafico-vazio') { const v = { ...p, modo: 'mensal' as Modo, ini: `${ANO_ATUAL}-04`, fim: `${ANO_ATUAL}-05` }; e.pedido = v; e.modo = 'mensal'; e.rel = compararMensal(e.d.id, v.ini, v.fim); porCrit(r, e, { modo: 'mensal', mmi: '04', mmf: '05' }); }
  e.ativo = filtradas(e)[0]?.id ?? ''; e.sel = new Set(e.ativo ? [e.ativo] : []);
  if (cen === 'agrupado') { e.grupos = [e.d.grupoEx]; e.ocultas.delete(e.d.grupoEx); }
  if (cen === 'detalhe') { e.det = true; e.ativo = e.d.id === 'geral' ? '10' : e.d.exemplo; e.sel = new Set([e.ativo]); }
  if (cen === 'filtros') { e.filtrosAbertos = true; e.filtros = { v1: '<0' }; }
  if (cen === 'a-atualizar') e.fase = 'a-gerar';
  if (cen === 'exportado') e.aviso = `Exportado: Comparativo-${e.d.ficheiro}-${a0}-${a0 + 2}.xlsx · ${n(e.rel.linhas.length)} linhas (variações anuais, todas), com o total.`;
  if (cen === 'export-falhou') e.aviso = 'A exportação falhou. Os resultados ficam; tenta outra vez (F4).';
  if (cen === 'restaurado') e.aviso = `Área de trabalho reposta: os critérios, os resultados das ${new Date(Date.now() - 42 * 60000).toLocaleTimeString('pt-PT').slice(0, 5)}, os grupos e a linha escolhida como estavam — sem gerar outra vez.`;
  etiquetas(r, e);
  if (cen !== 'editar' && cen !== 'outro-modo' && e.rel.linhas.length) r.classList.add('crit-resumo');
  tudo(r, e);
  if (cen === 'outro-modo') { modoEm(r, 'mensal'); outroModo(r, e); }
}
const armarTodos = () => document.querySelectorAll<HTMLElement>('.ecra:not([hidden]) [data-cf]').forEach(armar);

export function iniciar(): void {
  requestAnimationFrame(armarTodos);
  ['romafe:versao', 'romafe:ecra'].forEach((y) => document.addEventListener(y, () => requestAnimationFrame(armarTodos)));
  window.addEventListener('hashchange', () => requestAnimationFrame(armarTodos));
  /* a área de trabalho pede um modo a um separador já aberto (o outro item do menu antigo) */
  window.addEventListener('message', (ev) => {
    const dado = ev.data as { romafe?: string; modo?: Modo } | null; if (dado?.romafe !== 'cf-modo' || !dado.modo) return;
    const m = dado.modo;
    document.querySelectorAll<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) [data-cf]').forEach((r) => { const e = de(r); if ((!e.d.mensal && !e.d.mapa) || modoForm(r) === m) return;
      modoEm(r, m, true); if (e.rel) { resumir(r, e, false); outroModo(r, e); } toast(r, `${MODO_NOME[m]}: prime F10 para gerar.`); });
  });
  /* o gráfico acompanha a largura */
  const ro = new ResizeObserver((xs) => xs.forEach((y) => { const r = raiz(y.target); if (r) { const e = estados.get(r); if (e) { e.grafAssin = `${e.grafAssin}`; grafico(r, e); } } }));
  const observar = () => document.querySelectorAll<HTMLElement>('[data-cf-graf]').forEach((g) => ro.observe(g));
  requestAnimationFrame(observar); document.addEventListener('romafe:ecra', () => requestAnimationFrame(observar));

  document.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement, r = raiz(t); if (!r || editando()) return;
    const e = de(r); let b: HTMLElement | null;
    if (!t.closest('.ak-menu-c')) fecharMenus(r);
    if ((b = t.closest('[data-cf-acao][aria-disabled="true"]'))) { toast(r, b.title || SEM_DADOS); return; }
    if ((b = t.closest('[data-cf-modo]'))) {
      const m = b.dataset.cfModo as Modo; if (modoForm(r) === m) return;
      modoEm(r, m, true); limparErro(r);
      if (r.classList.contains('crit-resumo')) resumir(r, e, false);
      outroModo(r, e);
      campos(r)[0]?.focus(); return;
    }
    if ((b = t.closest('[data-cf-tirar-filtro]'))) { const k = b.dataset.cfTirarFiltro!, el = campo(r, k); if (el) el.value = ''; if (k === 'fam') subfamilias(r); void gerarDados(r, e); return; }
    if ((b = t.closest('[data-cf-etiqueta]'))) { const k = b.dataset.cfEtiqueta!; resumir(r, e, false, k === 'modo' || k === 'periodo' ? undefined : k); return; }
    if ((b = t.closest('[data-cf-vista-m]'))) { mudarVistaM(r, e, b.dataset.cfVistaM as 'linhas' | 'quadro'); return; }
    if ((b = t.closest('[data-cf-metrica]'))) { e.metrica = b.dataset.cfMetrica as 'liq' | 'qtd'; grafico(r, e); r.querySelector<HTMLElement>(`[data-cf-metrica="${e.metrica}"]`)?.focus(); return; }
    if ((b = t.closest('[data-cf-ponto]'))) { irPonto(r, e, b.dataset.cfAlvo ?? ''); return; }
    if ((b = t.closest('[data-cf-densidade]'))) { e.densidade = b.dataset.cfDensidade as Est['densidade']; grelha(r, e); colunasMenu(r, e); return; }
    if ((b = t.closest('[data-cf-anos]'))) { e.recentes = b.dataset.cfAnos === 'recentes'; grelha(r, e, 'revelar'); colunasMenu(r, e); return; }
    /* vistas guardadas */
    if ((b = t.closest('[data-cf-vista-carregar]'))) { const v = e.vistas.find((y) => y.id === b!.dataset.cfVistaCarregar); if (v) carregarVista(r, e, v); return; }
    if ((b = t.closest('[data-cf-vista-ren]'))) { e.renomear = b.dataset.cfVistaRen; e.apagar = undefined; vistasMenu(r, e); const i = r.querySelector<HTMLInputElement>('[data-cf-vista-novo-nome]'); i?.focus(); i?.select(); return; }
    if ((b = t.closest('[data-cf-vista-ok]'))) { renomear(r, e, b.dataset.cfVistaOk!); return; }
    if ((b = t.closest('[data-cf-vista-apagar]'))) { e.apagar = b.dataset.cfVistaApagar; e.renomear = undefined; vistasMenu(r, e); r.querySelector<HTMLElement>('[data-cf-vista-nao]')?.focus(); return; }
    if (t.closest('[data-cf-vista-nao]')) { const id = e.apagar; e.apagar = undefined; vistasMenu(r, e); r.querySelector<HTMLElement>(`[data-cf-vista-apagar="${id}"]`)?.focus(); return; }
    if ((b = t.closest('[data-cf-vista-sim]'))) {
      const v = e.vistas.find((y) => y.id === b!.dataset.cfVistaSim), resto = e.vistas.filter((y) => y !== v); if (!v) return; e.apagar = undefined;
      if (!gravarVistas(r, e, resto)) { toast(r, 'Não foi possível eliminar a vista. Tenta outra vez.'); vistasMenu(r, e); return; }
      e.vistas = resto; if (e.vista === v.id) e.vista = undefined; vistasMenu(r, e); estado(r, e); toast(r, `Vista «${v.nome}» eliminada.`);
      r.querySelector<HTMLElement>('[data-cf-vista-carregar], [data-cf-vista-nome]')?.focus(); return;
    }
    if (t.closest('[data-cf-vista-guardar]')) { guardarNova(r, e); return; }
    if ((b = t.closest('[data-cf-acao]'))) {
      const a = b.dataset.cfAcao!;
      if (a === 'gerar') { ev.preventDefault(); void gerarDados(r, e); }
      else if (a === 'atualizar') void gerarDados(r, e, true);
      else if (a === 'filtrar') { e.filtrosAbertos = !e.filtrosAbertos; grelha(r, e); if (e.filtrosAbertos) r.querySelector<HTMLElement>('[data-cf-filtro]')?.focus(); }
      else if (a === 'limpar') { e.filtros = {}; grelha(r, e, 'linhas'); avisar(r, e, 'Filtros da tabela removidos; os critérios ficam.'); }
      else if (a === 'exportar') abrirMenu(r, 'exportar', b);
      else if (a === 'mais') { colunasMenu(r, e); abrirMenu(r, 'mais', b); }
      else if (a === 'vistas') { e.apagar = undefined; e.renomear = undefined; vistasMenu(r, e); abrirMenu(r, 'vistas', b); }
      else if (a === 'imprimir') imprimir(r, e);
      else if (a === 'somas') { e.somas = !e.somas; grelha(r, e); r.querySelector<HTMLElement>('tfoot')?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180 }); }
      else if (a === 'grafico') { e.grafico = !e.grafico; const gr = r.querySelector<HTMLElement>('[data-cf-graf]'); grafico(r, e); if (e.grafico && gr && !quieto()) gr.animate([{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: ease }); if (!e.grafico) r.querySelector<HTMLElement>('.ak2-barra [data-cf-acao="grafico"]')?.focus(); }
      else if (a === 'desagrupar') { e.grupos = []; e.fechados.clear(); tudo(r, e, 'linhas'); }
      else if (a === 'fechar-det') { e.det = false; detalhe(r, e); r.querySelector<HTMLElement>('tbody tr.is-ativo')?.focus(); }
      else if (a === 'alterar') resumir(r, e, false);
      else if (a === 'recolher' || a === 'cancelar') cancelar(r, e);
      return;
    }
    if ((b = t.closest('[data-cf-exportar]'))) { fecharMenus(r); exportar(r, e, b.dataset.cfExportar as 'todos' | 'escolhidos'); r.querySelector<HTMLElement>('[data-cf-acao="exportar"]')?.focus(); return; }
    if ((b = t.closest('[data-cf-tirar-grupo]'))) { e.grupos = e.grupos.filter((k) => k !== b!.dataset.cfTirarGrupo); e.fechados.clear(); tudo(r, e, 'linhas'); return; }
    if ((b = t.closest('[data-cf-ordenar]'))) {
      const k = b.dataset.cfOrdenar!, o = e.ordem.find((y) => y.k === k);
      if ((ev as MouseEvent).shiftKey) { if (o) o.dir = o.dir === 1 ? -1 : 1; else e.ordem.push({ k, dir: 1 }); }
      /* texto e meses: do primeiro para o último; números: do maior para o menor primeiro */
      else { const tipo = colDe(e, k).tipo, d1: 1 | -1 = tipo === 'txt' || tipo === 'mono' ? 1 : -1; e.ordem = !o ? [{ k, dir: d1 }] : o.dir === d1 ? [{ k, dir: d1 === 1 ? -1 : 1 }] : []; }
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
  /* o valor exato ao passar o rato num ponto do gráfico */
  document.addEventListener('pointerover', (ev) => {
    const g = (ev.target as Element).closest?.<SVGGElement>('[data-cf-ponto]'), r = raiz(ev.target); if (!r) return;
    const tip = r.querySelector<HTMLElement>('[data-cf-tip]'); if (!tip) return;
    if (!g) { tip.hidden = true; return; }
    const area = tip.parentElement!.getBoundingClientRect(), q = g.querySelector('.cf-bar')!.getBoundingClientRect();
    tip.textContent = g.getAttribute('aria-label'); tip.hidden = false;
    tip.style.left = `${Math.min(area.width - tip.offsetWidth - 4, Math.max(4, q.left - area.left + q.width / 2 - tip.offsetWidth / 2))}px`; tip.style.top = `${Math.max(0, q.top - area.top - 30)}px`;
  });
  document.addEventListener('change', (ev) => {
    const t = ev.target as HTMLElement, r = raiz(t); if (!r) return; const e = de(r);
    if (t.matches('[data-cf-crit] [name="fam"]')) subfamilias(r, true);
    if (t.matches('[data-cf-ver]')) { const k = (t as HTMLInputElement).dataset.cfVer!; (t as HTMLInputElement).checked ? e.ocultas.delete(k) : e.ocultas.add(k); if (e.ocultas.has(k)) e.grupos = e.grupos.filter((g) => g !== k); tudo(r, e); }
    if (t.matches('[data-cf-agrupar]')) { const k = (t as HTMLSelectElement).value; if (k) { e.grupos.push(k); e.ocultas.delete(k); tudo(r, e, 'linhas'); r.querySelector<HTMLElement>('[data-cf-agrupar]')?.focus(); } }
  });
  document.addEventListener('input', (ev) => {
    const t = ev.target as HTMLInputElement, r = raiz(t); if (!r) return; const e = de(r);
    /* três anos seguidos: mudar um acerta o outro */
    if (t.matches('[data-cf-crit] [name="ini"], [data-cf-crit] [name="fim"]') && /^\d{4}$/.test(t.value)) {
      const outro = campo(r, t.name === 'ini' ? 'fim' : 'ini') as HTMLInputElement;
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
      else if (ev.key === 'F3') { e.filtros = {}; grelha(r, e, 'linhas'); avisar(r, e, 'Filtros da tabela removidos; os critérios ficam.'); }
      else if (ev.key === 'F4') exportar(r, e, e.sel.size > 1 ? 'escolhidos' : 'todos');
      return;
    }
    if (ev.key === 'Enter' && t.matches('[data-cf-vista-nome]')) { ev.preventDefault(); guardarNova(r, e); return; }
    if (t.matches('[data-cf-vista-novo-nome]')) { if (ev.key === 'Enter') { ev.preventDefault(); renomear(r, e, t.dataset.cfVistaNovoNome!); } else if (ev.key === 'Escape') { ev.preventDefault(); e.renomear = undefined; vistasMenu(r, e); r.querySelector<HTMLElement>(`[data-cf-vista-ren="${t.dataset.cfVistaNovoNome}"]`)?.focus(); } return; }
    if ((ev.key === 'Enter' || ev.key === ' ') && t.matches('[data-cf-ponto]')) { ev.preventDefault(); irPonto(r, e, t.dataset.cfAlvo ?? ''); return; }
    if (ev.key === 'Escape') {
      if (fecharMenus(r)) { ev.preventDefault(); return; }
      if (e.det && (t.closest('[data-cf-det]') || t.closest('tbody'))) { ev.preventDefault(); e.det = false; detalhe(r, e); r.querySelector<HTMLElement>('tbody tr.is-ativo')?.focus(); return; }
      if (t.matches('[data-cf-filtro]')) { ev.preventDefault(); e.filtrosAbertos = false; grelha(r, e); r.querySelector<HTMLElement>('tbody tr[tabindex="0"]')?.focus(); return; }
      if (e.fase === 'a-gerar' || t.closest('[data-cf-crit]')) { ev.preventDefault(); cancelar(r, e); }
      return;
    }
    /* Enter nos critérios: o campo seguinte; no último, Gerar dados (nunca gera sozinho). Uma lista de sugestões aberta fica com o Enter. */
    if (ev.key === 'Enter' && t.matches('[data-cf-crit] :is(input, select)')) {
      const cs = campos(r), i = cs.indexOf(t); ev.preventDefault();
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

  /* arrastar: os cabeçalhos agrupáveis para a zona de agrupar; as etiquetas mudam de nível */
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
  document.addEventListener('pointermove', (ev) => { if (!red) return; const e = de(red.r), w = Math.max(48, Math.min(480, red.w + ev.clientX - red.x)); e.larguras[red.k] = w; const i = folhas(e).findIndex((c) => c.k === red!.k); const col = red.r.querySelectorAll<HTMLElement>('.cf-tab col')[i + 1]; if (col) col.style.width = `${w}px`; });
  document.addEventListener('pointerup', () => { if (red) { const r = red.r; red = null; grelha(r, de(r)); } });
}
