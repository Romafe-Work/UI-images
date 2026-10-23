/* =========================================================
   ERP — Compras ▸ Mapas ▸ Comparativos de compras ▸ Por fornecedor (variação anual), v2 (23 out. 2026), do briefing
   «Comparativo por Fornecedor V2». A v1 (a tabela de consulta de menu-antigo.ts) fica.
   O que o ERP antigo faz e se mantém: Nº e nome do fornecedor, três anos seguidos (Ano inicial → Ano final), a
   quantidade e o líquido de cada ano, a variação de um ano para o seguinte, agrupar e filtrar a grelha, os
   Somatórios, Excel e imprimir com as teclas de sempre.
   A conta (a mesma em todo o lado — linhas, grupos e totais):
     - quantidade = soma das quantidades encomendadas no ano; líquido = soma dos líquidos das linhas, sem IVA
       (encomendas que não são rascunho nem canceladas);
     - variação = (líquido do ano seguinte − líquido do ano) ÷ líquido do ano. Nos grupos e no total, a variação faz-se
       com as somas — nunca se somam percentagens;
     - sem compras no ano de base: N/D (nunca «infinito»); sem compras nos dois: «—».
   Dados: 2026 são as encomendas do protótipo (compras/dominio.ts); 2024 e 2025, o histórico de exemplo
   (compras/historico.ts). Um ano sem nenhuma compra no ERP fica «sem dados» — nada se interpola.
   O Nº do fornecedor é de exemplo (o protótipo não tinha numeração). Comportamento: comparativo-comportamento.ts.
   ========================================================= */
import type { Ecra } from '../../../comum/tipos';
import type { IdErp } from '../ids';
import { topoErp } from '../inicio-v2';
import { L } from '../espaco';
import { encomendas, FORNECEDORES, ARTIGOS, linhaLiquida, HOJE, dia } from './dominio';
import { familiaDe } from '../ficheiros/ecras';
import { historico } from './historico';
import funnel from 'lucide-static/icons/funnel.svg?raw';
import funnelX from 'lucide-static/icons/funnel-x.svg?raw';
import sheet from 'lucide-static/icons/file-spreadsheet.svg?raw';
import printer from 'lucide-static/icons/printer.svg?raw';
import play from 'lucide-static/icons/play.svg?raw';
import xIc from 'lucide-static/icons/x.svg?raw';
import layers from 'lucide-static/icons/layers.svg?raw';
import chart from 'lucide-static/icons/chart-column-increasing.svg?raw';
import sigma from 'lucide-static/icons/sigma.svg?raw';
import bookmark from 'lucide-static/icons/bookmark.svg?raw';
import refresh from 'lucide-static/icons/refresh-cw.svg?raw';
import ellipsis from 'lucide-static/icons/ellipsis.svg?raw';
import pencil from 'lucide-static/icons/pencil.svg?raw';
import chevronsUp from 'lucide-static/icons/chevrons-up.svg?raw';
import arrowRight from 'lucide-static/icons/arrow-right.svg?raw';
import calendarRange from 'lucide-static/icons/calendar-range.svg?raw';
import calendarDays from 'lucide-static/icons/calendar-days.svg?raw';
import chartLine from 'lucide-static/icons/chart-line.svg?raw';
import packageIc from 'lucide-static/icons/package.svg?raw';
import folderTree from 'lucide-static/icons/folder-tree.svg?raw';

/* ---------- os dados ---------- */
export const ANO_ATUAL = Number(HOJE.slice(0, 4));
export const MES_ATUAL = Number(HOJE.slice(5, 7));
export const ANO_MIN = 2000;
export interface EncCf { ref: string; data: string; qtd: number; liq: number; arquivo: boolean }
/** futuro: o mês ainda não chegou (só no Geral, que tem uma linha por mês) */
export interface AnoCf { qtd: number; liq: number; encs: EncCf[]; futuro?: boolean }
/** Os filtros que o relatório sabe aplicar (os mesmos nos dois modos). */
export interface FiltrosCf { ref?: string; fam?: string; sub?: string; marca?: string; forn?: string }
export type FiltroCf = keyof FiltrosCf;
/** Uma linha: os campos que a descrevem (Nº, nome, país… conforme a dimensão) e os três anos. */
export interface LinhaCf { id: string; c: Record<string, string>; anos: AnoCf[]; /** mensal: um por mês do período */ mes?: AnoCf[]; /** mensal detalhado: a linha de que este mês é */ ent?: string }
/** per: o período mensal (AAAA-MM, por ordem); detalhe: as linhas do relatório mensal original (uma por mês e linha) */
export interface RelCf { anos: number[]; semDados: number[]; linhas: LinhaCf[]; filtros: FiltrosCf; per?: { meses: string[] }; detalhe?: LinhaCf[] }
const PAISES: Record<string, string> = { PT: 'Portugal', ES: 'Espanha', BE: 'Bélgica', DE: 'Alemanha' };
export const MES_NOME = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const fNome = (id: string) => FORNECEDORES.find((f) => f.id === id)?.nome ?? id;
/* as famílias e as subfamílias do protótipo, com códigos (de exemplo, pela ordem alfabética: 01, 0101…) */
export const FAMILIAS = [...new Set(ARTIGOS.map((a) => familiaDe(a.desc)))].sort((a, b) => a.localeCompare(b, 'pt'));
export const subfamiliasDe = (fam: string) => [...new Set(ARTIGOS.filter((a) => !fam || familiaDe(a.desc) === fam).map((a) => a.desc))].sort((a, b) => a.localeCompare(b, 'pt'));
export const codFam = (fam: string) => String(FAMILIAS.indexOf(fam) + 1).padStart(2, '0');
export const codSub = (fam: string, sub: string) => `${codFam(fam)}${String(subfamiliasDe(fam).indexOf(sub) + 1).padStart(2, '0')}`;
export const MARCAS = [...new Set(ARTIGOS.map((a) => a.marca))].sort((a, b) => a.localeCompare(b, 'pt'));
export const fornecedorNome = fNome;
/** O Nº do fornecedor (de exemplo: o protótipo não o tinha). */
export const numForn = (id: string) => String(2001 + FORNECEDORES.findIndex((f) => f.id === id));
/** (B − A) ÷ A. null: sem base (A = 0, B ≠ 0) — N/D; undefined: nada nos dois anos. */
export function variacao(a: number, b: number): number | null | undefined {
  if (a === 0) return b === 0 ? undefined : null;
  return (b - a) / a;
}
/** A tendência do último ano face ao anterior (para agrupar). */
function tendencia(a: AnoCf, b: AnoCf): string {
  if (b.futuro) return 'Ainda por chegar';
  const v = variacao(a.liq, b.liq);
  if (v === undefined) return 'Sem compras nos dois anos';
  if (v === null) return 'Novo no último ano';
  if (v <= -0.999) return 'Sem compras no último ano';
  if (Math.abs(v) < 0.02) return 'Estável';
  return v > 0 ? 'Sobe' : 'Desce';
}

/* ---------- as dimensões: o mesmo ecrã para Geral, Por artigo, Por família/subfamília e Por fornecedor ---------- */
export type DimCf = 'geral' | 'artigo' | 'familia' | 'forn' | 'analise';
export interface ColDesc { k: string; t: string; tipo: 'txt' | 'mono'; w: number; agrupa?: boolean; fixa?: boolean }
/** Uma linha de encomenda (de 2026 ou do histórico), a unidade de tudo o que se soma. */
interface Fonte { enc: string; forn: string; data: string; ref: string; qtd: number; liq: number; arquivo: boolean }
export interface DimDef {
  id: DimCf; base: string; pre: string; titulo: string; sub: string; caminho: string; ficheiro: string;
  um: string; varios: string; nenhum: string; descr: ColDesc[]; ocultas0: string[]; esconder: [string, string][]; grupos0: string[];
  /** há o modo Mês a mês (o Geral já é por mês) */
  mensal: boolean; exemplo: string; grupoEx: string;
  /** os filtros que esta dimensão oferece; a vista mensal por omissão (linhas = o relatório original) */
  filtros: FiltroCf[]; vistaM: 'linhas' | 'quadro';
  /** o gráfico da evolução por cima da grelha (o Geral) */
  grafico?: boolean;
  /** a Análise de compras: um mapa por documento (sem anos nem variações), com quatro modos */
  mapa?: boolean;
  chave: (f: Fonte) => string; campos: (id: string) => Record<string, string>; todas?: () => string[];
  /** o cabeçalho do detalhe: o que é, o nome e uma linha */
  cab: (l: LinhaCf) => [string, string, string]; janelas: (l: LinhaCf) => [string, string, string][];
}
const art = (ref: string) => ARTIGOS.find((a) => a.ref === ref);
const famKey = (ref: string) => { const a = art(ref); return `${familiaDe(a?.desc ?? '')}|${a?.desc ?? ref}`; };
const TEND: ColDesc = { k: 'tend', t: 'Tendência', tipo: 'txt', w: 170, agrupa: true };
export const DIMS: Record<DimCf, DimDef> = {
  geral: { id: 'geral', base: 'cm-comp-geral-var', pre: 'compgeral', titulo: 'Comparativo Geral de Compras', sub: 'Analisa a evolução global das compras ao longo do tempo.', caminho: 'Geral', ficheiro: 'geral',
    um: 'mês', varios: 'meses', nenhum: 'nenhum mês', mensal: true, filtros: [], vistaM: 'linhas', grafico: true, exemplo: '10', grupoEx: 'tri', grupos0: [], ocultas0: ['tend'],
    descr: [{ k: 'mes', t: 'Mês', tipo: 'txt', w: 130, fixa: true }, { k: 'tri', t: 'Trimestre', tipo: 'txt', w: 120, agrupa: true }, TEND],
    esconder: [['tri', 'Trimestre'], ['tend', 'Tendência'], ['qtd', 'Quantidades'], ['var', 'Variações']],
    chave: (f) => f.data.slice(5, 7), todas: () => MES_NOME.map((_, i) => String(i + 1).padStart(2, '0')),
    campos: (id) => ({ mes: MES_NOME[Number(id) - 1], tri: `${Math.ceil(Number(id) / 3)}.º trimestre` }),
    cab: (l) => l.id === 'tudo' ? ['Geral', 'Todas as compras', 'o período escolhido'] : ['Mês', l.c.mes, l.c.tri], janelas: () => [] },
  artigo: { id: 'artigo', base: 'cm-comp-artigo-var', pre: 'compartigo', titulo: 'Comparativo de Compras por Artigo', sub: 'Analisa quantidades e valores de compra por artigo ao longo do tempo.', caminho: 'Por artigo', ficheiro: 'artigos',
    um: 'artigo', varios: 'artigos', nenhum: 'nenhum artigo', mensal: true, filtros: ['ref', 'fam', 'sub', 'marca', 'forn'], vistaM: 'linhas', exemplo: '6206-2RSH', grupoEx: 'fam', grupos0: [], ocultas0: ['marca', 'sub', 'tend'],
    descr: [{ k: 'ref', t: 'Referência', tipo: 'mono', w: 130, fixa: true }, { k: 'desc', t: 'Descrição', tipo: 'txt', w: 210, fixa: true }, { k: 'marca', t: 'Marca', tipo: 'txt', w: 90, agrupa: true }, { k: 'fam', t: 'Família', tipo: 'txt', w: 130, agrupa: true }, { k: 'sub', t: 'Subfamília', tipo: 'txt', w: 200, agrupa: true }, { k: 'forn', t: 'Fornecedor', tipo: 'txt', w: 140, agrupa: true }, TEND],
    esconder: [['marca', 'Marca'], ['fam', 'Família'], ['sub', 'Subfamília'], ['forn', 'Fornecedor'], ['tend', 'Tendência'], ['qtd', 'Quantidades'], ['var', 'Variações']],
    chave: (f) => f.ref, todas: () => ARTIGOS.map((a) => a.ref),
    campos: (id) => { const a = art(id); return { ref: id, desc: a?.desc ?? '—', marca: a?.marca ?? '—', fam: familiaDe(a?.desc ?? ''), sub: a?.desc ?? '—', forn: a ? fNome(a.forn) : '—' }; },
    cab: (l) => ['Artigo', l.c.ref, `${l.c.desc} · ${l.c.fam} · ${l.c.marca} · ${l.c.forn}`], janelas: (l) => [[`artigo:${l.c.ref}`, 'package', 'Ver artigo'], [`artigo:${l.c.ref}`, 'warehouse', 'Stock por armazém']] },
  familia: { id: 'familia', base: 'cm-comp-familia-var', pre: 'compfamilia', titulo: 'Comparativo por Família / Subfamília', sub: 'Analisa a evolução das compras de cada família e subfamília ao longo dos anos.', caminho: 'Por família/subfamília', ficheiro: 'familias',
    um: 'subfamília', varios: 'subfamílias', nenhum: 'nenhuma subfamília', mensal: true, filtros: ['fam', 'sub', 'forn'], vistaM: 'linhas', exemplo: `Rolamentos|Rolamento rígido de esferas`, grupoEx: 'fam', grupos0: ['fam'], ocultas0: ['tend'],
    descr: [{ k: 'codFam', t: 'Cód.', tipo: 'mono', w: 60, fixa: true }, { k: 'fam', t: 'Família', tipo: 'txt', w: 150, agrupa: true, fixa: true }, { k: 'codSub', t: 'Cód.', tipo: 'mono', w: 70, fixa: true }, { k: 'sub', t: 'Subfamília', tipo: 'txt', w: 220, fixa: true }, { k: 'arts', t: 'Artigos', tipo: 'txt', w: 90 }, TEND],
    esconder: [['codFam', 'Código da família'], ['codSub', 'Código da subfamília'], ['arts', 'Artigos'], ['tend', 'Tendência'], ['qtd', 'Quantidades'], ['var', 'Variações']],
    chave: (f) => famKey(f.ref),
    campos: (id) => { const [fam, sub] = id.split('|'); const n = ARTIGOS.filter((a) => a.desc === sub).length; return { codFam: codFam(fam), fam, codSub: codSub(fam, sub), sub, arts: `${n} ${n === 1 ? 'artigo' : 'artigos'}` }; },
    cab: (l) => [`Subfamília · ${l.c.codSub}`, l.c.sub, `${l.c.codFam} · ${l.c.fam} · ${l.c.arts}`], janelas: () => [] },
  forn: { id: 'forn', base: 'cm-comp-forn-var', pre: 'compforn', titulo: 'Comparativo por Fornecedor', sub: 'Analisa a evolução das compras por fornecedor ao longo dos anos.', caminho: 'Por fornecedor', ficheiro: 'fornecedores',
    um: 'fornecedor', varios: 'fornecedores', nenhum: 'nenhum fornecedor', mensal: true, filtros: ['forn'], vistaM: 'quadro', exemplo: 'skf', grupoEx: 'pais', grupos0: [], ocultas0: ['cidade', 'tend'],
    descr: [{ k: 'num', t: 'Nº', tipo: 'mono', w: 72, fixa: true }, { k: 'nome', t: 'Nome', tipo: 'txt', w: 200, fixa: true }, { k: 'pais', t: 'País', tipo: 'txt', w: 104, agrupa: true }, { k: 'cidade', t: 'Cidade', tipo: 'txt', w: 110, agrupa: true }, TEND],
    esconder: [['num', 'Nº'], ['pais', 'País'], ['cidade', 'Cidade'], ['tend', 'Tendência'], ['qtd', 'Quantidades'], ['var', 'Variações']],
    chave: (f) => f.forn, todas: () => FORNECEDORES.map((f) => f.id),
    campos: (id) => { const f = FORNECEDORES.find((x) => x.id === id); return { num: numForn(id), nome: f?.nome ?? id, pais: f ? PAISES[f.nif.slice(0, 2)] ?? f.nif.slice(0, 2) : '—', cidade: f?.cidade ?? '—' }; },
    cab: (l) => [`Fornecedor · Nº ${l.c.num}`, l.c.nome, `${l.c.cidade}, ${l.c.pais} · ${l.c.tend}`], janelas: (l) => [[`fornecedor:${l.id}`, 'users', 'Ver fornecedor']] },
  /* a Análise de compras (os quatro «Mapa de compras por …» do ERP antigo num ecrã): as colunas vêm do modo (MAPA_COLS) */
  analise: { id: 'analise', base: 'cm-analise-artigo', pre: 'analise', titulo: 'Análise de Compras', sub: 'Consulta quantidades e valores de compras por artigo, fornecedor e família.', caminho: 'Análise de compras', ficheiro: 'analise-compras',
    um: 'linha', varios: 'linhas', nenhum: 'nenhuma linha', mensal: false, filtros: [], vistaM: 'linhas', mapa: true, exemplo: '', grupoEx: 'forn', grupos0: [], ocultas0: ['data'],
    descr: [], esconder: [['data', 'Data do documento'], ['conta', 'Conta'], ['codFam', 'Código da família'], ['codSub', 'Código da subfamília']],
    chave: (f) => f.ref, campos: () => ({}),
    cab: (l) => [`Documento · ${l.c.doc} · ${l.c.data}`, l.c.desc || l.c.sub || l.c.doc, [l.c.ref, l.c.fam, l.c.forn && `${l.c.forn} (conta ${l.c.conta})`].filter(Boolean).join(' · ')],
    janelas: (l) => [...(l.c.ref ? [[`artigo:${l.c.ref}`, 'package', 'Ver artigo'] as [string, string, string]] : []), ...(l.c.fornId ? [[`fornecedor:${l.c.fornId}`, 'users', 'Ver fornecedor'] as [string, string, string]] : [])] },
};

/* ---------- a Análise de compras: quatro mapas, um ecrã ---------- */
export type ModoMapa = 'artigo' | 'artigo-forn' | 'familia' | 'familia-forn';
export const MODOS_MAPA: [ModoMapa, string, string][] = [
  ['artigo', 'Artigo', 'Mapa de compras por artigo'], ['artigo-forn', 'Artigo / Fornecedor', 'Mapa de compras por artigo/fornecedor'],
  ['familia', 'Família / Subfamília', 'Mapa de compras por família/subfamília'], ['familia-forn', 'Família / Subfamília / Fornecedor', 'Mapa de compras por família/subfamília/fornecedor'],
];
/** As colunas originais de cada mapa (Documento à frente, Quantidade e Líquido no fim). */
export const MAPA_COLS: Record<ModoMapa, ColDesc[]> = (() => {
  const doc: ColDesc = { k: 'doc', t: 'Documento', tipo: 'mono', w: 120, fixa: true, agrupa: true }, data: ColDesc = { k: 'data', t: 'Data', tipo: 'mono', w: 92 };
  const forn: ColDesc = { k: 'forn', t: 'Fornecedor', tipo: 'txt', w: 170, agrupa: true }, conta: ColDesc = { k: 'conta', t: 'Conta', tipo: 'mono', w: 100 };
  const ref: ColDesc = { k: 'ref', t: 'Nº artigo', tipo: 'mono', w: 130, agrupa: true }, desc: ColDesc = { k: 'desc', t: 'Descrição', tipo: 'txt', w: 230 };
  const fam: ColDesc[] = [{ k: 'codFam', t: 'Cód. família', tipo: 'mono', w: 86 }, { k: 'fam', t: 'Família', tipo: 'txt', w: 160, agrupa: true }, { k: 'codSub', t: 'Cód. subfamília', tipo: 'mono', w: 100 }, { k: 'sub', t: 'Subfamília', tipo: 'txt', w: 230, agrupa: true }];
  return { artigo: [doc, data, ref, desc], 'artigo-forn': [doc, data, forn, conta, ref, desc], familia: [doc, data, ...fam], 'familia-forn': [doc, data, forn, conta, ...fam] };
})();
/** Os grupos por omissão de cada mapa (a hierarquia: Família → Subfamília; Fornecedor → Família → Subfamília). */
export const MAPA_GRUPOS: Record<ModoMapa, string[]> = { artigo: [], 'artigo-forn': ['forn'], familia: ['fam', 'sub'], 'familia-forn': ['forn', 'fam', 'sub'] };
/** A conta do fornecedor (de exemplo, como no plano de contas: 2211 · Fornecedores c/c + o Nº) — não é o Nº do fornecedor. */
export const contaForn = (id: string) => `2211${numForn(id)}`;
/** Os intervalos do ERP antigo: de … a … (vazio = sem limite; os extremos contam). */
export interface CritMapa { di: string; df: string; ai?: string; af?: string; fi?: string; ff?: string; gi?: string; gf?: string; si?: string; sf?: string }
export function analisar(modo: ModoMapa, c: CritMapa): RelCf {
  const dentro = (v: string, a?: string, b?: string, cmp = (x: string, y: string) => x.localeCompare(y, 'pt', { numeric: true, sensitivity: 'base' })) => (!a || cmp(v, a) >= 0) && (!b || cmp(v, b) <= 0);
  const comForn = modo.endsWith('-forn'), porFam = modo.startsWith('familia');
  const fs = fontes().filter((f) => {
    if (f.data < c.di || f.data > c.df) return false;
    const a = art(f.ref), fam = familiaDe(a?.desc ?? '');
    if (modo === 'artigo' && !dentro(f.ref, c.ai, c.af)) return false;
    if (comForn && !dentro(numForn(f.forn), c.fi, c.ff)) return false;
    if (porFam && (!dentro(codFam(fam), c.gi, c.gf) || !dentro(codSub(fam, a?.desc ?? ''), c.si, c.sf))) return false;
    return true;
  });
  /* uma linha por documento e por artigo (ou subfamília), como os mapas antigos */
  const m = new Map<string, LinhaCf>();
  fs.forEach((f) => {
    const a = art(f.ref), fam = familiaDe(a?.desc ?? ''), sub = a?.desc ?? f.ref, k = `${f.enc}|${porFam ? codSub(fam, sub) : f.ref}`;
    let l = m.get(k);
    if (!l) {
      const cc: Record<string, string> = { doc: f.enc, data: dia(f.data), dataIso: f.data };
      if (comForn) Object.assign(cc, { forn: fNome(f.forn), conta: contaForn(f.forn), fornId: f.forn });
      if (porFam) Object.assign(cc, { codFam: codFam(fam), fam, codSub: codSub(fam, sub), sub });
      else Object.assign(cc, { ref: f.ref, desc: a?.desc ?? '—' });
      l = { id: k, c: cc, anos: [{ qtd: 0, liq: 0, encs: [] }, { qtd: 0, liq: 0, encs: [] }, { qtd: 0, liq: 0, encs: [{ ref: f.enc, data: f.data, qtd: 0, liq: 0, arquivo: f.arquivo }] }] };
      m.set(k, l);
    }
    l.anos[2].qtd += f.qtd; l.anos[2].liq += f.liq; l.anos[2].encs[0].qtd += f.qtd; l.anos[2].encs[0].liq += f.liq;
  });
  const linhas = [...m.values()].sort((p, q) => p.c.dataIso.localeCompare(q.c.dataIso) || p.c.doc.localeCompare(q.c.doc) || p.id.localeCompare(q.id));
  return { anos: [Number(c.di.slice(0, 4)), Number(c.di.slice(0, 4)), Number(c.df.slice(0, 4))], semDados: [], linhas, filtros: {} };
}
function fontes(): Fonte[] {
  return [
    ...encomendas().filter((e) => e.estado !== 'Rascunho' && e.estado !== 'Cancelada').flatMap((e) => e.linhas.map((l) => ({ enc: e.ref, forn: e.forn, data: e.data, ref: l.ref, qtd: l.qtd, liq: linhaLiquida(l) ?? 0, arquivo: false }))),
    ...historico().flatMap((h) => h.linhas.map((l) => ({ enc: h.ref, forn: h.forn, data: h.data, ref: l.ref, qtd: l.qtd, liq: l.qtd * l.preco, arquivo: true }))),
  ];
}
/** Uma linha passa nos filtros? A referência procura a referência exata e, se não houver, na descrição. */
function passa(f: Fonte, x: FiltrosCf): boolean {
  const a = art(f.ref), q = x.ref?.trim().toLowerCase();
  if (q && !(f.ref.toLowerCase() === q || (!ARTIGOS.some((y) => y.ref.toLowerCase() === q) && `${f.ref} ${a?.desc ?? ''} ${a?.refForn ?? ''}`.toLowerCase().includes(q)))) return false;
  if (x.fam && familiaDe(a?.desc ?? '') !== x.fam) return false;
  if (x.sub && a?.desc !== x.sub) return false;
  if (x.marca && a?.marca !== x.marca) return false;
  if (x.forn && f.forn !== x.forn) return false;
  return true;
}
const vazios = (x: FiltrosCf): FiltrosCf => Object.fromEntries(Object.entries(x).filter(([, v]) => v && String(v).trim()));
const somaAno = (ys: Fonte[], futuro = false): AnoCf => {
  const porEnc = new Map<string, EncCf>();
  ys.forEach((y) => { const e = porEnc.get(y.enc) ?? { ref: y.enc, data: y.data, qtd: 0, liq: 0, arquivo: y.arquivo }; e.qtd += y.qtd; e.liq += y.liq; porEnc.set(y.enc, e); });
  return { qtd: ys.reduce((s, y) => s + y.qtd, 0), liq: ys.reduce((s, y) => s + y.liq, 0), encs: [...porEnc.values()].sort((p, q) => q.data.localeCompare(p.data)), futuro };
};
/** O pedido mensal: do mês ini ao mês fim (AAAA-MM), uma coluna por mês; e as linhas do relatório original. */
export function compararMensal(dim: DimCf, ini: string, fim: string, filtros: FiltrosCf = {}): RelCf {
  const d = DIMS[dim], x = vazios(filtros), meses: string[] = [];
  for (let [y, m] = [Number(ini.slice(0, 4)), Number(ini.slice(5, 7))]; `${y}-${String(m).padStart(2, '0')}` <= fim; m === 12 ? (y++, m = 1) : m++) meses.push(`${y}-${String(m).padStart(2, '0')}`);
  /* no Geral mensal há uma só linha (todas as compras); o detalhe é o relatório original, um mês por linha */
  const chave = dim === 'geral' ? () => 'tudo' : d.chave, campos = dim === 'geral' ? (): Record<string, string> => ({ mes: 'Todas as compras', tri: '' }) : d.campos;
  const fs = fontes().filter((f) => meses.includes(f.data.slice(0, 7)) && passa(f, x)), porChave = new Map<string, Fonte[]>();
  fs.forEach((f) => { const k = chave(f); porChave.set(k, [...(porChave.get(k) ?? []), f]); });
  const ids = (dim !== 'geral' && d.todas ? d.todas() : [...porChave.keys()].sort((a, b) => a.localeCompare(b, 'pt'))).filter((k) => porChave.has(k));
  const anos = [...new Set(meses.map((m) => Number(m.slice(0, 4))))];
  const linhas = ids.map((id): LinhaCf => { const xs = porChave.get(id)!, mes = meses.map((m) => somaAno(xs.filter((y) => y.data.startsWith(m))));
    const z: AnoCf = { qtd: 0, liq: 0, encs: [] };
    return { id, c: { ...campos(id), tend: '' }, anos: [z, z, somaAno(xs)], mes }; });
  /* o relatório mensal original: uma linha por mês e por linha da dimensão, só onde houve compras */
  const detalhe = meses.flatMap((m, i) => linhas.filter((l) => dim === 'geral' || l.mes![i].encs.length).map((l): LinhaCf => ({ id: `${m}|${l.id}`, ent: l.id,
    c: { ano: m.slice(0, 4), mesN: m.slice(5, 7), mesDesc: MES_NOME[Number(m.slice(5, 7)) - 1], ...l.c }, anos: [l.anos[0], l.anos[1], l.mes![i]] })));
  return { anos: [anos[0], anos[0], anos[anos.length - 1]], semDados: [], linhas, filtros: x, per: { meses }, detalhe };
}
/** O pedido ao «servidor»: três anos seguidos a partir de a0, por dimensão. */
export function comparar(dim: DimCf, a0: number, filtros: FiltrosCf = {}): RelCf {
  const d = DIMS[dim], anos = [a0, a0 + 1, a0 + 2], x = vazios(filtros), fs = fontes().filter((f) => passa(f, x));
  const comDados = new Set(fs.map((f) => Number(f.data.slice(0, 4))));
  const semDados = anos.filter((a) => !comDados.has(a));
  const porChave = new Map<string, Fonte[]>(); fs.forEach((f) => { if (!anos.includes(Number(f.data.slice(0, 4)))) return; const k = d.chave(f); porChave.set(k, [...(porChave.get(k) ?? []), f]); });
  const ids = d.todas ? d.todas().filter((k) => dim === 'geral' || porChave.has(k)) : [...porChave.keys()].sort((a, b) => a.localeCompare(b, 'pt'));
  if (semDados.length === 3) return { anos, semDados, linhas: [], filtros: x };
  const linhas = ids.map((id): LinhaCf => {
    const xs = porChave.get(id) ?? [];
    const porAno = anos.map((a): AnoCf => somaAno(xs.filter((y) => y.data.startsWith(`${a}-`)), dim === 'geral' && a === ANO_ATUAL && Number(id) > MES_ATUAL));
    return { id, c: { ...d.campos(id), tend: tendencia(porAno[1], porAno[2]) }, anos: porAno };
  });
  return { anos, semDados, linhas, filtros: x };
}

/* ---------- a página ---------- */
export type CenarioCf = 'inicial' | 'mensal' | 'modo-artigo-forn' | 'modo-familia' | 'modo-familia-forn' | 'quadro' | 'outro-modo' | 'restaurado' | 'grafico-qtd' | 'grafico-oculto' | 'grafico-vazio' | 'editar' | 'invalido' | 'a-gerar' | 'resultados' | 'parcial' | 'vazio' | 'a-atualizar' | 'agrupado' | 'filtros' | 'detalhe'
  | 'exportado' | 'export-falhou' | 'erro' | 'tempo' | 'offline' | 'permissao' | 'sessao';
const B = (k: string, ic: string, t: string, tecla: string, extra = '', cls = '') => `<button type="button" class="ak-btn${cls ? ` ${cls}` : ''}" data-cf-acao="${k}"${extra}>${L(ic)}<span>${t}</span>${tecla ? `<kbd>${tecla}</kbd>` : ''}</button>`;
const MES_OPC = (sel: number) => MES_NOME.map((m, i) => `<option value="${String(i + 1).padStart(2, '0')}"${i + 1 === sel ? ' selected' : ''}>${m}</option>`).join('');
const opc = (v: string, t: string) => `<option value="${v.replace(/"/g, '&quot;')}">${t}</option>`;
/** Os filtros de cada dimensão (só o que o relatório sabe aplicar). */
function campoFiltro(k: FiltroCf, id: (x: string) => string): string {
  const lab = (t: string, inp: string) => `<label class="ak-campo cf-filtro cf-f-${k}" for="${id(k)}"><span>${t}</span>${inp}</label>`;
  if (k === 'ref') return lab('Artigo / Referência', `<input type="search" id="${id(k)}" name="ref" list="${id('refs')}" placeholder="Referência ou descrição" autocomplete="off"><datalist id="${id('refs')}">${ARTIGOS.map((a) => `<option value="${a.ref}">${a.desc} · ${a.marca}</option>`).join('')}</datalist>`);
  if (k === 'fam') return lab('Família', `<select id="${id(k)}" name="fam">${opc('', 'Todas')}${FAMILIAS.map((f) => opc(f, `${codFam(f)} · ${f}`)).join('')}</select>`);
  if (k === 'sub') return lab('Subfamília', `<select id="${id(k)}" name="sub" data-cf-sub>${opc('', 'Todas')}${subfamiliasDe('').map((x) => opc(x, x)).join('')}</select>`);
  if (k === 'marca') return lab('Marca', `<select id="${id(k)}" name="marca">${opc('', 'Todas')}${MARCAS.map((m) => opc(m, m)).join('')}</select>`);
  return lab('Fornecedor', `<select id="${id(k)}" name="forn">${opc('', 'Todos')}${FORNECEDORES.map((f) => opc(f.id, f.nome)).join('')}</select>`);
}
/** Os critérios da Análise de compras: as datas e os intervalos de cada mapa antigo (de … a …; vazio = sem limite). */
function criteriosMapa(id: (x: string) => string): string {
  const fams = FAMILIAS.map((f) => opc(codFam(f), `${codFam(f)} · ${f}`)).join(''), subs = FAMILIAS.flatMap((f) => subfamiliasDe(f).map((x) => opc(codSub(f, x), `${codSub(f, x)} · ${x}`))).join('');
  const forns = [...FORNECEDORES].sort((a, b) => numForn(a.id).localeCompare(numForn(b.id))).map((f) => opc(numForn(f.id), `${numForn(f.id)} · ${f.nome}`)).join('');
  const par = (so: string, rot: string, a: string, b: string, inp: (k: string, ph: string) => string) => `<div class="cf-intervalo" data-so="${so}"><span class="cf-int-t">${rot}</span><label class="ak-campo" for="${id(a)}"><span>Inicial</span>${inp(a, 'de')}</label><span class="cf-seta" aria-hidden="true">${L(arrowRight)}</span><label class="ak-campo" for="${id(b)}"><span>Final</span>${inp(b, 'até')}</label></div>`;
  const sel = (ops: string, todos: string) => (k: string) => `<select id="${id(k)}" name="${k}">${opc('', todos)}${ops}</select>`;
  return `<div class="ak2-campos cf-anos cf-mapa-c">
    <div class="cf-per cf-datas">
      <label class="ak-campo" for="${id('di')}"><span>Data inicial</span><input type="date" id="${id('di')}" name="di" value="${ANO_ATUAL}-01-01" data-cf-primeiro></label>
      <span class="cf-seta" aria-hidden="true">${L(arrowRight)}</span>
      <label class="ak-campo" for="${id('df')}"><span>Data final</span><input type="date" id="${id('df')}" name="df" value="${HOJE}"></label>
    </div>
    <div class="cf-intervalos">
      ${par('artigo', 'Artigo', 'ai', 'af', (k, ph) => `<input type="search" id="${id(k)}" name="${k}" list="${id('refs')}" placeholder="${ph === 'de' ? 'Do primeiro' : 'Ao último'}" autocomplete="off">`)}
      <datalist id="${id('refs')}">${[...ARTIGOS].sort((a, b) => a.ref.localeCompare(b.ref, 'pt', { numeric: true })).map((a) => `<option value="${a.ref}">${a.desc} · ${a.marca}</option>`).join('')}</datalist>
      ${par('artigo-forn familia-forn', 'Fornecedor', 'fi', 'ff', (k) => sel(forns, k === 'fi' ? 'Do primeiro' : 'Ao último')(k))}
      ${par('familia familia-forn', 'Família', 'gi', 'gf', (k) => sel(fams, k === 'gi' ? 'Da primeira' : 'À última')(k))}
      ${par('familia familia-forn', 'Subfamília', 'si', 'sf', (k) => sel(subs, k === 'si' ? 'Da primeira' : 'À última')(k))}
    </div>
    <p class="cf-dica">Os intervalos são os do ERP antigo: de … a …, com os extremos; vazio é sem limite. Valores líquidos, sem IVA. Enter passa ao campo seguinte.</p>
  </div>`;
}
function html(d: DimDef, cen: CenarioCf): string {
  const id = (x: string) => `cf-${d.id}-${x}-${cen}`, a0 = ANO_ATUAL - 2, mensal = cen === 'mensal' || cen === 'quadro';
  const mm: ModoMapa = cen.startsWith('modo-') ? cen.slice(5) as ModoMapa : cen === 'outro-modo' ? 'artigo' : 'artigo';
  const modoIni = d.mapa ? mm : mensal ? 'mensal' : 'anual';
  const agr = d.descr.filter((c) => c.agrupa).map((c) => c.t), dica = `Arraste para aqui o cabeçalho ${agr.length > 1 ? `${agr.slice(0, -1).join(', ')} ou ${agr[agr.length - 1]}` : agr[0]} para agrupar`;
  return `<div class="hm ak ak2 cf${mensal ? ' cf-mensal' : ''}${d.mapa ? ` cf-mapa cf-m-${mm}` : ''}" data-hm data-cf data-cf-dim="${d.id}" data-cf-modo-form="${modoIni}" data-cf-cenario="${cen}" data-teclas="F2 F3 F4 F9 F10 F12">
  ${topoErp([['ERP', 'inicio'], ['Compras', 'compras'], ['Mapas', ''], ['Comparativos', ''], [d.caminho, '']])}
  <header class="ak-cab">
    <span class="ak-cab-ic">${L(chart)}</span>
    <div><h1>${d.titulo}</h1><p>${d.sub}</p></div>
    <span class="ak2-vista-ativa" data-cf-vista hidden></span>
  </header>
  ${d.mapa ? `<div class="cf-modos cf-modos--4" role="radiogroup" aria-label="Tipo de análise" style="--i:${MODOS_MAPA.findIndex(([k]) => k === mm)}"><i class="cf-modos-ind" aria-hidden="true"></i>${MODOS_MAPA.map(([k, t, legado]) => `<button type="button" role="radio" data-cf-modo="${k}" aria-checked="${k === mm}" title="${legado}">${L(k.startsWith('familia') ? folderTree : packageIc)}<span>${t}</span></button>`).join('')}</div>` : ''}
  ${d.mensal ? `<div class="cf-modos" role="radiogroup" aria-label="Tipo de análise"><i class="cf-modos-ind" aria-hidden="true"></i><button type="button" role="radio" data-cf-modo="mensal" aria-checked="${mensal}">${L(calendarDays)}<span>Mensal</span></button><button type="button" role="radio" data-cf-modo="anual" aria-checked="${!mensal}">${L(calendarRange)}<span>Variações anuais</span></button></div>` : ''}
  <div class="ak-barra ak2-barra" role="toolbar" aria-label="Ações do comparativo">
    ${B('filtrar', funnel, 'Filtrar', 'F2', ' aria-pressed="false"')}
    ${B('limpar', funnelX, 'Remover filtros', 'F3')}
    <i class="ak-sep" aria-hidden="true"></i>
    <span class="ak-menu-c">${B('exportar', sheet, 'Exportar Excel', 'F4', ' aria-haspopup="menu" aria-expanded="false"')}
      <div class="ak-menu" role="menu" data-cf-menu="exportar" hidden>
        <button type="button" role="menuitem" data-cf-exportar="todos">Todas as linhas <small data-cf-n-todos></small></button>
        <button type="button" role="menuitem" data-cf-exportar="escolhidos">Só as escolhidas <small data-cf-n-sel></small></button>
        <p>Leva o modo à vista (mensal ou variações anuais), as linhas que passam nos filtros, as colunas à vista e, com Somatórios, o total. As variações vão como percentagem.</p>
      </div></span>
    ${B('imprimir', printer, 'Imprimir', 'F12')}
    <i class="ak-sep" aria-hidden="true"></i>
    ${B('somas', sigma, 'Somatórios', '', ' aria-pressed="true" title="Totais dos grupos e total geral"')}
    ${d.grafico ? B('grafico', chartLine, 'Gráfico', '', ' aria-pressed="true" title="Mostrar ou esconder o gráfico da evolução"') : ''}
    <span class="ak2-esp"></span>
    <span class="ak-menu-c">${B('vistas', bookmark, 'Vistas guardadas', '', ' aria-haspopup="menu" aria-expanded="false"')}
      <div class="ak-menu ak-menu--dir ak2-vistas" role="menu" data-cf-menu="vistas" hidden></div></span>
    ${B('atualizar', refresh, 'Atualizar', 'F9')}
    <span class="ak-menu-c">${B('mais', ellipsis, 'Mais ações', '', ' aria-haspopup="menu" aria-expanded="false"')}
      <div class="ak-menu ak-menu--dir ak2-mais-menu" role="menu" data-cf-menu="mais" hidden>
        <p class="ak-menu-t">Linhas</p>
        <div class="ak2-dens" role="group" aria-label="Linhas"><button type="button" role="menuitemradio" data-cf-densidade="compacta" aria-checked="true">Compactas</button><button type="button" role="menuitemradio" data-cf-densidade="normal" aria-checked="false">Normais</button></div>
        <p class="ak-menu-t">Anos</p>
        <div class="ak2-dens" role="group" aria-label="Ordem dos anos"><button type="button" role="menuitemradio" data-cf-anos="antigos" aria-checked="true">Mais antigo primeiro</button><button type="button" role="menuitemradio" data-cf-anos="recentes" aria-checked="false">Mais recente primeiro</button></div>
        <div data-cf-cols></div>
      </div></span>
  </div>

  <form class="ak-crit ak2-crit cf-crit" data-cf-crit novalidate>
    <div class="ak2-resumo-crit">
      <h2>Filtros aplicados</h2><ul class="ak2-etiquetas" data-cf-etiquetas></ul>
      <span class="cf-gerado" data-cf-gerado></span>
      <button type="button" class="ak-btn ak-btn--linha" data-cf-acao="alterar">${L(pencil)}<span>Alterar critérios</span></button>
    </div>
    <div class="ak2-aberto">
      <div class="ak-crit-cab"><h2>Filtros e critérios</h2><button type="button" class="ak-crit-x" data-cf-acao="recolher" title="Recolher os critérios num resumo" hidden>${L(chevronsUp)}<span>Recolher</span></button></div>
      <div class="ak-crit-c">
        ${d.mapa ? criteriosMapa(id) : `<div class="ak2-campos cf-anos">
          <div class="cf-per cf-so-anual">
            <label class="ak-campo" for="${id('ini')}"><span>Ano inicial</span><input type="number" id="${id('ini')}" name="ini" value="${a0}" min="${ANO_MIN}" max="${ANO_ATUAL - 2}" step="1" inputmode="numeric" data-cf-primeiro></label>
            <span class="cf-seta" aria-hidden="true">${L(arrowRight)}</span>
            <label class="ak-campo" for="${id('fim')}"><span>Ano final</span><input type="number" id="${id('fim')}" name="fim" value="${a0 + 2}" min="${ANO_MIN + 2}" max="${ANO_ATUAL}" step="1" inputmode="numeric"></label>
          </div>
          <div class="cf-per cf-so-mensal">
            <label class="ak-campo cf-ano" for="${id('mai')}"><span>Ano inicial</span><input type="number" id="${id('mai')}" name="mai" value="${ANO_ATUAL}" min="${ANO_MIN}" max="${ANO_ATUAL}" step="1" inputmode="numeric"></label>
            <label class="ak-campo cf-mes" for="${id('mmi')}"><span>Mês inicial</span><select id="${id('mmi')}" name="mmi">${MES_OPC(1)}</select></label>
            <span class="cf-seta" aria-hidden="true">${L(arrowRight)}</span>
            <label class="ak-campo cf-ano" for="${id('maf')}"><span>Ano final</span><input type="number" id="${id('maf')}" name="maf" value="${ANO_ATUAL}" min="${ANO_MIN}" max="${ANO_ATUAL}" step="1" inputmode="numeric"></label>
            <label class="ak-campo cf-mes" for="${id('mmf')}"><span>Mês final</span><select id="${id('mmf')}" name="mmf">${MES_OPC(MES_ATUAL)}</select></label>
          </div>
          ${d.filtros.length ? `<div class="cf-filtros">${d.filtros.map((k) => campoFiltro(k, id)).join('')}</div>` : ''}
          <p class="cf-dica"><span class="cf-so-anual">Três anos seguidos, como no ERP antigo: mudar um ano acerta o outro.</span><span class="cf-so-mensal">De um mês a outro (até 24 meses, até ao mês corrente).</span> Valores líquidos, sem IVA. Enter passa ao campo seguinte.</p>
        </div>`}
        <div class="ak-crit-acoes">
          ${B('gerar', play, 'Gerar dados', 'F10', ' data-cf-gerar-crit', 'ak-btn--acao')}
          ${B('cancelar', xIc, 'Cancelar', 'Esc', '', 'ak-btn--linha')}
        </div>
      </div>
      <p class="ak-erro-campo" data-cf-erro role="alert" hidden></p>
    </div>
  </form>

  <section class="ak-res" aria-label="Resultados">
    <p class="cf-imprimir-t" data-cf-imprimir-t></p>
    <p class="cf-outro" data-cf-outro role="status" hidden></p>
    <div class="ak2-sumario cf-sumario" data-cf-sumario role="status" aria-live="polite" hidden></div>
    ${d.grafico ? '<div class="cf-grafico" data-cf-graf hidden></div>' : ''}
    <div class="ak-grupos" data-cf-grupos aria-label="Agrupar por">${L(layers)}<span class="ak-grupos-dica">${dica}</span></div>
    <div class="ak-corpo">
      <div class="ak-grelha cf-grelha" data-cf-grelha tabindex="-1"></div>
      <aside class="ak-det cf-det" data-cf-det aria-label="Detalhe" hidden></aside>
    </div>
  </section>
  <footer class="ak-estado" data-cf-estado role="status" aria-live="polite"></footer>
  <p class="hm-aviso" data-hm-aviso role="status" aria-live="polite"></p>
</div>`;
}

/** Os estados de cada comparativo (o texto diz o caso desta dimensão). */
function estadosDe(d: DimDef): [Exclude<CenarioCf, 'inicial'>, string, string][] {
  if (d.mapa) return [
    ['resultados', 'Artigo', 'Mapa de compras por artigo: Documento, Nº artigo, Descrição, Quantidade e Líquido, de 1 de janeiro até hoje; os critérios recolhidos em «Filtros aplicados».'],
    ['modo-artigo-forn', 'Artigo / Fornecedor', 'Mapa de compras por artigo/fornecedor: entram o Fornecedor e a Conta (a conta não é o Nº do fornecedor); agrupado por fornecedor.'],
    ['modo-familia', 'Família / Subfamília', 'Mapa de compras por família/subfamília: códigos e nomes; Família → Subfamília em grupos que abrem e fecham, com as somas sem contar duas vezes.'],
    ['modo-familia-forn', 'Família / Subfamília / Fornecedor', 'O mapa com fornecedor: Fornecedor → Família → Subfamília.'],
    ['outro-modo', 'A mudar de modo', 'Escolhido «Artigo / Fornecedor» com o mapa por artigo à vista: os intervalos de fornecedor aparecem, os resultados ficam marcados como do outro mapa até Gerar dados.'],
    ['editar', 'A alterar os critérios', 'Os critérios abertos por cima dos resultados (o rascunho); os resultados continuam a ser os dos critérios aplicados.'],
    ['invalido', 'Critérios inválidos', 'A data inicial depois da final: o campo marcado e a mensagem; nada se pede.'],
    ['a-gerar', 'A gerar', 'O pedido a correr: a forma da grelha, sem percentagens inventadas; Esc cancela.'],
    ['vazio', 'Sem resultados', 'Um intervalo sem compras: diz-se, e «Alterar critérios».'],
    ['agrupado', 'Agrupado', 'Por documento na zona de agrupar: cada documento com as suas linhas e somas.'],
    ['filtros', 'Filtros da tabela', 'F2: filtros por coluna — texto, ou «>1000» no Líquido.'],
    ['detalhe', 'Detalhe', 'A linha escolhida à direita: o documento, o artigo ou a subfamília, o fornecedor e as outras linhas do mesmo documento.'],
    ['restaurado', 'Área de trabalho reposta', 'Ao voltar ao separador: o modo, os critérios, os resultados e a linha escolhida como estavam.'],
    ['exportado', 'Exportado', 'O Excel foi gerado: o mapa à vista, com as colunas originais.'],
    ['export-falhou', 'A exportação falhou', 'O Excel não foi gerado: diz-se, e os resultados ficam.'],
    ['erro', 'Servidor indisponível', 'O servidor de relatórios falhou: «Tentar outra vez»; os critérios ficam.'],
    ['tempo', 'Tempo esgotado', 'O servidor demorou demasiado: tentar outra vez.'],
    ['offline', 'Sem ligação', 'Sem rede: os critérios ficam; tenta-se quando a ligação voltar.'],
    ['permissao', 'Sem permissão', 'O utilizador não tem acesso a este mapa.'],
    ['sessao', 'Sessão terminada', 'Voltar a entrar pelo login comum; os critérios ficam.'],
  ];
  if (d.id === 'geral') d = { ...d, exemplo: '10' };
  const V = d.varios, ex = d.cab({ id: d.exemplo, c: { ...d.campos(d.exemplo), tend: '' }, anos: [] })[1];
  const lista: [Exclude<CenarioCf, 'inicial'>, string, string][] = [
    ['resultados', 'Variações anuais', `2024–2026: os critérios recolhidos em «Filtros aplicados», o resumo, os anos revelados da esquerda para a direita (as variações depois dos valores) e os Somatórios.`],
    ['mensal', 'Mensal · vista detalhada', `Janeiro a ${MES_NOME[MES_ATUAL - 1].toLowerCase()} de ${ANO_ATUAL}: o relatório mensal original — Ano, Mês, Descrição do mês, ${d.descr.filter((c) => c.fixa).map((c) => c.t).join(', ')}, Quantidade e Valor — uma linha por mês.`],
    ['quadro', 'Mensal · vista por períodos', `O mesmo período com um grupo de colunas por mês (Quantidade e Valor) e o total; os totais são os mesmos da vista detalhada.`],
    ['outro-modo', 'A mudar de modo', `Escolhido «Mensal» com os resultados das variações anuais à vista: os critérios abrem-se nos campos do mês e os resultados ficam marcados como anuais até Gerar dados.`],
    ['editar', 'A alterar os critérios', 'Os critérios abertos por cima dos resultados; Cancelar (Esc) volta ao resumo sem perder nada.'],
    ['invalido', 'Período inválido', `O ano final é ${ANO_ATUAL + 1}: ainda não começou. O campo marcado e a mensagem; nada se pede.`],
    ['a-gerar', 'A gerar', 'O pedido a correr: a forma da grelha, sem percentagens inventadas; Esc cancela.'],
    ['parcial', 'Dados parciais', `2023–2025: 2023 não tem compras no ERP — as colunas ficam vazias e a variação 2023→2024 fica N/D.`],
    ['vazio', 'Sem resultados', `2018–2020: nenhum dos ${V} tem compras nesses anos; «Alterar critérios».`],
    ['a-atualizar', 'A atualizar (F9)', 'O mesmo pedido outra vez: as linhas ficam à vista, esbatidas, até chegar a resposta.'],
    ['agrupado', 'Agrupado', `${d.descr.find((c) => c.k === d.grupoEx)?.t ?? ''} na zona de agrupar: cada grupo abre e fecha, com as somas e a variação calculada sobre elas (sem contar duas vezes).`],
    ['filtros', 'Filtros da tabela', 'F2: filtros por coluna — texto, ou «>10000» nos valores e «<0» nas variações.'],
    ['detalhe', 'Detalhe', `${ex} à direita: as barras de cada ano, a tabela e as encomendas.`],
    ['restaurado', 'Área de trabalho reposta', 'Ao voltar ao separador: os critérios, os resultados, os grupos e a linha escolhida como estavam, sem gerar outra vez.'],
    ['exportado', 'Exportado', 'O Excel foi gerado: o nome do ficheiro e o que levou.'],
    ['export-falhou', 'A exportação falhou', 'O Excel não foi gerado: diz-se, e os resultados ficam.'],
    ['erro', 'Servidor indisponível', 'O servidor de relatórios falhou: «Tentar outra vez»; os critérios ficam.'],
    ['tempo', 'Tempo esgotado', 'O servidor demorou demasiado: tentar outra vez.'],
    ['offline', 'Sem ligação', 'Sem rede: os critérios ficam; tenta-se quando a ligação voltar.'],
    ['permissao', 'Sem permissão', 'O utilizador não tem acesso a este mapa.'],
    ['sessao', 'Sessão terminada', 'Voltar a entrar pelo login comum; os critérios ficam.'],
  ];
  if (d.grafico) lista.splice(3, 0, ['grafico-qtd', 'Gráfico · quantidades', 'O gráfico da evolução em quantidades (o eixo diz «un.»); passar o rato mostra o valor exato e clicar num mês escolhe a linha na grelha.'], ['grafico-oculto', 'Gráfico escondido', 'O gráfico fechado: a grelha ganha a altura; «Gráfico» na barra volta a abri-lo.'], ['grafico-vazio', 'Gráfico indisponível', 'Um período sem compras: o gráfico diz que não há nada para desenhar, em vez de mostrar barras a zero.']);
  return lista;
}
const NOTA_D = (d: DimDef) => d.mapa ? 'Análise de Compras v2 (23 out., briefing «Unified Purchasing Analysis V3»): os quatro «Mapa de compras por …» do ERP antigo num só ecrã — Artigo, Artigo / Fornecedor, Família / Subfamília e Família / Subfamília / Fornecedor — com as datas e os intervalos de cada um (de … a …), as colunas originais (Documento, Conta…), os grupos em hierarquia, Somatórios, detalhe, vistas guardadas, Excel e imprimir. Os quatro itens antigos do menu abrem este separador, cada um no seu modo. 2024 e 2025 são histórico de exemplo; os códigos de família/subfamília e a conta do fornecedor também.' : `${d.titulo} v2 (23 out., ela: «quero num só ecrã»${d.id === 'familia' ? ' e o briefing «Unified Family / Subfamily Purchasing Comparison»' : d.id === 'artigo' ? ' e o briefing «Comparativo de Compras por Artigo V2»' : d.id === 'forn' ? ' e o briefing «Comparativo por Fornecedor V2»' : ''}): ${d.mensal ? 'Mensal ou Variações anuais no mesmo ecrã (os dois itens antigos do menu abrem este separador, cada um no seu modo); o mensal tem a vista detalhada (o relatório original) e a vista por períodos;' : 'uma linha por mês e os três anos lado a lado;'} anos em grupos, N/D sem base, Somatórios sobre as somas, detalhe, vistas guardadas, Excel e imprimir. 2024 e 2025 são histórico de exemplo; os códigos de família e subfamília e o Nº do fornecedor também.`;
/** A v2 do ecrã e os seus estados (o ecrã base recebe a v2 ao lado da v1 de menu-antigo.ts). */
export function versaoComparativo(dim: DimCf): Ecra<IdErp>['versoes'][number] { const d = DIMS[dim]; return { id: 'v2', nota: NOTA_D(d), html: html(d, 'inicial') }; }
export function estadosComparativo(dim: DimCf, num: string): Ecra<IdErp>[] {
  const d = DIMS[dim];
  return estadosDe(d).map(([cen, nome, objetivo], i) => ({ id: `cm-${d.pre}-${cen}` as IdErp, nome: `${num}.${i + 1} · ${nome}`, fluxo: 'Compras', estadoDe: d.base as IdErp, objetivo, versoes: [{ id: 'v2', nota: NOTA_D(d), html: html(d, cen) }] }));
}
