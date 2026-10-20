/* =========================================================
   GOPARTS — 10 · Início (V5, 20 out. 2026): o que o painel conta
   Do briefing «New Command Dashboard & Separate Parts Search Workspace». Nada é inventado: tudo se conta dos
   documentos de exemplo do resto do portal (pedidos-dados, guias-dados, faturas-dados, devolucoes-dados) e do
   que a pessoa fez neste navegador (a atividade da pesquisa).
   - O «hoje» dos dados: os documentos de exemplo acabam a 16/04/2024; os períodos (Hoje, 7, 30, 90 dias) contam
     para trás a partir do último dia com movimento, e o ecrã di-lo. Com o servidor, é a data do dia.
   - O histórico começa no primeiro documento que há (pedidos a 14/03/2024, guias e faturas a 01/03/2024): antes
     disso não se sabe se houve compras, por isso o gráfico marca esses dias «sem dados» em vez de os pôr a zero,
     e a comparação com o período anterior só aparece quando esse período está todo dentro do histórico.
   - Num servidor, cada número vem de um ponto de agregação (contagens e somas por período, por conta), não da
     lista inteira; aqui, os dados são poucos e contam-se no navegador.
   ========================================================= */
import { PEDIDOS, LINHAS, euros, type Pedido, type LinhaPedido } from './pedidos-dados';
import { GUIAS } from './guias-dados';
import { FATURAS } from './faturas-dados';
import { DEVOLUCOES, estadoDev } from './devolucoes-dados';
import { etapa } from './pedidos-v4';

export { euros };
/* ---------- os dias: inteiros (dias desde 1970, em UTC), para não haver horas de verão ---------- */
const DIA = 864e5;
/** «15/04/2024» → o dia. */
export const dia = (s: string): number => { const [d, m, a] = s.split('/').map(Number); return Math.round(Date.UTC(a, m - 1, d) / DIA); };
export const dataDe = (n: number) => new Date(n * DIA);
/** «16 abr.», «16 abr. 2024» */
const MESES = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
export const curta = (n: number, ano = false) => { const d = dataDe(n); return `${d.getUTCDate()} ${MESES[d.getUTCMonth()]}${ano ? ` ${d.getUTCFullYear()}` : ''}`; };
/** «16/04/2024» */
export const numerica = (n: number) => dataDe(n).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
/** «2024-04-16», para os campos de data */
export const iso = (n: number) => dataDe(n).toISOString().slice(0, 10);
export const deIso = (s: string) => { const [a, m, d] = s.split('-').map(Number); return Math.round(Date.UTC(a, m - 1, d) / DIA); };
/** «terça-feira, 16 de abril de 2024» */
export const longa = (n: number) => dataDe(n).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/* ---------- o que há nos dados ---------- */
/** O passo do percurso («15/04 09:12») com o ano do pedido: o dia e a hora em minutos. */
function quandoPasso(p: string, ano: number): { n: number; min: number } | null {
  const m = /^(\d{2})\/(\d{2}) (\d{2}):(\d{2})$/.exec(p); if (!m) return null;
  return { n: Math.round(Date.UTC(ano, +m[2] - 1, +m[1]) / DIA), min: +m[3] * 60 + +m[4] };
}
const anoDe = (l: LinhaPedido) => +l.data.slice(6);
export const pedidoDe = (num: string) => PEDIDOS.find((p) => p.num === num)!;
export const valorPedido = (p: Pedido) => +p.artigos.reduce((s, a) => s + a[3], 0).toFixed(2);
export const artigosPedido = (p: Pedido) => p.artigos.reduce((s, a) => s + a[0], 0);

/** O último dia com movimento nos documentos de exemplo: o «hoje» do protótipo. */
export const HOJE = Math.max(
  ...LINHAS.map((l) => dia(l.data)), ...GUIAS.map((g) => dia(g.data)),
  ...DEVOLUCOES.flatMap((d) => [d.criada, d.enviada].filter(Boolean).map(dia)),
  ...LINHAS.flatMap((l) => pedidoDe(l.num).percurso.map((s) => quandoPasso(s[1], anoDe(l))?.n ?? 0)),
);
/** Onde começa o histórico de cada fonte. */
export const INICIO_PEDIDOS = Math.min(...LINHAS.map((l) => dia(l.data)));
export const INICIO_DOCS = Math.min(...GUIAS.map((g) => dia(g.data)));

/* ---------- o período ---------- */
export type IdPeriodo = 'hoje' | '7' | '30' | '90' | 'pers';
export type Periodo = { id: IdPeriodo; de: number; ate: number };
export const NOME_PERIODO: Record<IdPeriodo, string> = { hoje: 'Hoje', '7': '7 dias', '30': '30 dias', '90': '90 dias', pers: 'Personalizado' };
export function periodo(id: IdPeriodo, de = INICIO_PEDIDOS, ate = HOJE): Periodo {
  if (id === 'pers') return { id, de: Math.min(de, ate), ate: Math.max(de, ate) };
  const n = id === 'hoje' ? 1 : Number(id);
  return { id, de: HOJE - n + 1, ate: HOJE };
}
export const dias = (p: Periodo) => p.ate - p.de + 1;
export const anterior = (p: Periodo): Periodo => ({ id: p.id, de: p.de - dias(p), ate: p.de - 1 });
const dentro = (n: number, p: Periodo) => n >= p.de && n <= p.ate;
/** «7 a 16 abr. 2024», «16 abr. 2024» */
export function textoPeriodo(p: Periodo): string {
  if (p.de === p.ate) return curta(p.de, true);
  const a = dataDe(p.de), b = dataDe(p.ate);
  const mesmoAno = a.getUTCFullYear() === b.getUTCFullYear(), mesmoMes = mesmoAno && a.getUTCMonth() === b.getUTCMonth();
  return `${mesmoMes ? a.getUTCDate() : curta(p.de, !mesmoAno)} a ${curta(p.ate, true)}`;
}

/* ---------- os pedidos ---------- */
export type Linha = { l: LinhaPedido; p: Pedido; n: number; valor: number; artigos: number; etapa: ReturnType<typeof etapa> };
export const LINHAS_TODAS: Linha[] = LINHAS.map((l) => { const p = pedidoDe(l.num); return { l, p, n: dia(l.data), valor: valorPedido(p), artigos: artigosPedido(p), etapa: etapa(p) }; }).sort((a, b) => b.n - a.n);
export const pedidosEm = (p: Periodo) => LINHAS_TODAS.filter((x) => dentro(x.n, p));

/* ---------- os indicadores ---------- */
export type Kpi = {
  id: 'efetuados' | 'curso' | 'valor' | 'recolha' | 'devolucoes' | 'docs';
  nome: string; valor: number; texto: string; sub?: string;
  /** o que se conta, dito por extenso (fica na dica e para os leitores de ecrã) */
  def: string;
  /** só nos que dependem do período: o mesmo número no período anterior, quando está todo dentro do histórico */
  antes?: { valor: number; texto: string };
  /** «agora»: não depende do período */
  agora?: boolean;
  /** para onde leva: [ecrã, etapa do filtro] */
  ir: [string, string?];
};
export function kpis(p: Periodo): Kpi[] {
  const ant = anterior(p);
  const comPedidos = ant.de >= INICIO_PEDIDOS, comDocs = ant.de >= INICIO_DOCS;
  const ped = pedidosEm(p), pedAnt = pedidosEm(ant);
  const soma = (xs: Linha[]) => +xs.reduce((s, x) => s + x.valor, 0).toFixed(2);
  const docs = (q: Periodo) => FATURAS.filter((f) => dentro(dia(f.guia.data), q));
  const emCurso = LINHAS_TODAS.filter((x) => x.etapa.k !== 'concluido');
  const recolha = LINHAS_TODAS.filter((x) => x.etapa.k === 'recolher');
  const devAbertas = DEVOLUCOES.filter((d) => estadoDev(d) !== 'creditada');
  const f = docs(p), nc = f.filter((x) => x.guia.tipo === 'credito').length;
  return [
    { id: 'efetuados', nome: 'Pedidos efetuados', valor: ped.length, texto: String(ped.length), def: 'Pedidos feitos no período, pela data do pedido.', antes: comPedidos ? { valor: pedAnt.length, texto: String(pedAnt.length) } : undefined, ir: ['pedidos'] },
    { id: 'curso', nome: 'Pedidos em curso', valor: emCurso.length, texto: String(emCurso.length), sub: emCurso.length ? `${emCurso.filter((x) => x.etapa.k === 'expedido').length} expedidos · ${emCurso.filter((x) => x.etapa.k === 'preparacao' || x.etapa.k === 'preparado').length} em preparação` : undefined, def: 'Pedidos ainda não entregues nem levantados, de qualquer data.', agora: true, ir: ['pedidos'] },
    { id: 'valor', nome: 'Valor das compras', valor: soma(ped), texto: euros(soma(ped)), sub: 'sem IVA', def: 'A soma dos artigos dos pedidos feitos no período, sem IVA.', antes: comPedidos ? { valor: soma(pedAnt), texto: euros(soma(pedAnt)) } : undefined, ir: ['pedidos'] },
    { id: 'recolha', nome: 'Disponíveis para recolha', valor: recolha.length, texto: String(recolha.length), sub: recolha.length ? undefined : 'Nenhum pronto no balcão', def: 'Pedidos prontos a levantar no balcão, de qualquer data.', agora: true, ir: ['pedidos', 'recolher'] },
    { id: 'devolucoes', nome: 'Devoluções em aberto', valor: devAbertas.length, texto: String(devAbertas.length), sub: devAbertas.length ? `${devAbertas.filter((d) => estadoDev(d) === 'rascunho').length} por enviar · ${devAbertas.filter((d) => estadoDev(d) === 'enviada').length} à espera do crédito` : undefined, def: 'Devoluções por enviar ou enviadas e ainda sem nota de crédito.', agora: true, ir: ['devolucoes'] },
    { id: 'docs', nome: 'Documentos recentes', valor: f.length, texto: String(f.length), sub: f.length ? `${f.length - nc} ${f.length - nc === 1 ? 'fatura' : 'faturas'}${nc ? ` · ${nc} ${nc === 1 ? 'nota de crédito' : 'notas de crédito'}` : ''}` : undefined, def: 'Faturas e notas de crédito emitidas no período (cada uma com a sua guia de remessa).', antes: comDocs ? { valor: docs(ant).length, texto: String(docs(ant).length) } : undefined, ir: ['faturas'] },
  ];
}

/* ---------- a evolução das compras ---------- */
export type Ponto = { n: number; valor: number; pedidos: number; semDados: boolean; nums: string[] };
export function serie(p: Periodo): Ponto[] {
  const r: Ponto[] = [];
  for (let n = p.de; n <= p.ate; n++) {
    const ps = LINHAS_TODAS.filter((x) => x.n === n);
    r.push({ n, valor: +ps.reduce((s, x) => s + x.valor, 0).toFixed(2), pedidos: ps.length, semDados: n < INICIO_PEDIDOS, nums: ps.map((x) => x.l.num) });
  }
  return r;
}

/* ---------- o estado das encomendas ---------- */
/** As etapas pela ordem do percurso, com os nomes das pílulas «Estado» dos Pedidos. */
export const ETAPAS: [string, string][] = [['preparacao', 'Em preparação'], ['preparado', 'Preparado'], ['expedido', 'Expedido'], ['recolher', 'Pronto a levantar'], ['concluido', 'Concluído']];
export const estadosEncomendas = () => ETAPAS.map(([k, nome]) => ({ k, nome, n: LINHAS_TODAS.filter((x) => x.etapa.k === k).length }));

/* ---------- a atividade (dos documentos) ---------- */
export type Evento = { n: number; min: number; tipo: 'pedido' | 'guia' | 'fatura' | 'credito' | 'dev-criada' | 'dev-enviada' | 'pesquisa'; titulo: string; sub: string; ir: [string, string?, string?] };
export function eventosDocs(): Evento[] {
  const ev: Evento[] = [];
  LINHAS_TODAS.forEach((x) => {
    const q = quandoPasso(x.p.percurso[0][1], anoDe(x.l));
    ev.push({ n: q?.n ?? x.n, min: q?.min ?? 0, tipo: 'pedido', titulo: `Pedido ${x.l.num}`, sub: `${x.artigos} ${x.artigos === 1 ? 'artigo' : 'artigos'} · ${euros(x.valor)} sem IVA`, ir: ['pedidos', 'goparts:abrir-pedido', x.l.num] });
  });
  GUIAS.forEach((g) => {
    ev.push({ n: dia(g.data), min: -1, tipo: 'guia', titulo: `Guia de remessa ${g.num}`, sub: `${g.armazem} · pedido ${g.pedido}`, ir: ['guias', 'goparts:abrir-guia', g.num] });
    ev.push({ n: dia(g.data), min: -2, tipo: g.tipo === 'credito' ? 'credito' : 'fatura', titulo: `${g.tipo === 'credito' ? 'Nota de crédito' : 'Fatura'} ${g.doc}`, sub: g.tipo === 'credito' ? g.obs : `Guia ${g.num}`, ir: ['faturas', 'goparts:abrir-fatura', g.doc] });
  });
  DEVOLUCOES.forEach((d) => {
    ev.push({ n: dia(d.criada), min: -3, tipo: 'dev-criada', titulo: `Devolução ${d.num} criada`, sub: `${d.utilizador} · ${d.obs}`, ir: ['devolucoes', 'filtro', estadoDev(d)] });
    if (d.enviada) ev.push({ n: dia(d.enviada), min: -4, tipo: 'dev-enviada', titulo: `Devolução ${d.num} enviada`, sub: d.credito ? 'Já creditada' : 'À espera da nota de crédito', ir: ['devolucoes', 'filtro', estadoDev(d)] });
  });
  return ev;
}
export const ordenar = (ev: Evento[]) => ev.slice().sort((a, b) => b.n - a.n || b.min - a.min);
