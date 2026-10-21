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
import { GUIAS, total as totalGuia } from './guias-dados';
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

/* ---------- os indicadores ----------
   (20 out., V6) o resumo operacional: quatro números do «agora», que não dependem de nenhum período (o período
   ficou só no gráfico). Cada um abre a lista certa, já filtrada. */
export type Kpi = {
  id: 'curso' | 'transporte' | 'recolha' | 'devolucoes';
  nome: string; valor: number; texto: string; sub?: string;
  /** o que se conta, dito por extenso (fica para os leitores de ecrã) */
  def: string;
  /** para onde leva: [ecrã, etapa do filtro] */
  ir: [string, string?];
};
export function kpis(): Kpi[] {
  const emCurso = LINHAS_TODAS.filter((x) => x.etapa.k !== 'concluido');
  const transporte = LINHAS_TODAS.filter((x) => x.etapa.k === 'expedido');
  const recolha = LINHAS_TODAS.filter((x) => x.etapa.k === 'recolher');
  const devAbertas = DEVOLUCOES.filter((d) => estadoDev(d) !== 'creditada');
  const prep = emCurso.filter((x) => x.etapa.k === 'preparacao' || x.etapa.k === 'preparado').length;
  return [
    { id: 'curso', nome: 'Pedidos em curso', valor: emCurso.length, texto: String(emCurso.length), sub: emCurso.length ? `${prep} em preparação` : 'Nenhum por entregar', def: 'Pedidos ainda não entregues nem levantados.', ir: ['pedidos', prep ? 'preparacao' : undefined] },
    { id: 'transporte', nome: 'Em transporte', valor: transporte.length, texto: String(transporte.length), sub: transporte.length ? transporte.map((x) => x.l.num).join(', ') : 'Nenhum a caminho', def: 'Pedidos expedidos e ainda não entregues.', ir: ['pedidos', 'expedido'] },
    { id: 'recolha', nome: 'Prontos para recolha', valor: recolha.length, texto: String(recolha.length), sub: recolha.length ? 'Prontos no balcão' : 'Nenhum pronto no balcão', def: 'Pedidos prontos a levantar no balcão.', ir: ['pedidos', 'recolher'] },
    { id: 'devolucoes', nome: 'Devoluções em aberto', valor: devAbertas.length, texto: String(devAbertas.length), sub: devAbertas.length ? `${devAbertas.filter((d) => estadoDev(d) === 'rascunho').length} por enviar · ${devAbertas.filter((d) => estadoDev(d) === 'enviada').length} à espera do crédito` : 'Nenhuma por tratar', def: 'Devoluções por enviar ou enviadas e ainda sem nota de crédito.', ir: ['devolucoes'] },
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

/* ---------- (21 out., V7) o que requer atenção, por importância ----------
   Só o que os documentos confirmam. «Urgente» só quando um prazo já passou (a fatura vencida); «Por tratar» quando a
   ação é do cliente (levantar, enviar a devolução); «Informação» quando se espera pela Romafe (o crédito, a parte de
   uma entrega que ainda vem). Cada um tem o pormenor que se abre e a ação que leva ao sítio certo. */
export type GrupoAlerta = 'urgente' | 'tratar' | 'info';
export type AlertaPn = { grupo: GrupoAlerta; titulo: string; info: string; data: string; acao: string; attr: string; detalhe: [string, string][] };
export const NOME_GRUPO: Record<GrupoAlerta, string> = { urgente: 'Urgente', tratar: 'Por tratar', info: 'Informação' };
export function alertasPn(): AlertaPn[] {
  const a: AlertaPn[] = [];
  FATURAS.filter((f) => f.pagamento === 'vencida').forEach((f) => a.push({ grupo: 'urgente', titulo: 'Fatura vencida', info: f.num, data: `Venceu a ${f.vencimento}`, acao: 'Ver fatura', attr: ` data-ir-doc="faturas" data-chave="goparts:abrir-fatura" data-valor="${f.num}"`,
    detalhe: [['Valor com IVA', euros(totalGuia(f.guia))], ['Guia', f.guia.num], ['Pedido', f.guia.pedido]] }));
  LINHAS_TODAS.filter((x) => x.etapa.k === 'recolher').forEach((x) => a.push({ grupo: 'tratar', titulo: 'Pedido disponível para recolha', info: `${x.l.num} · ${x.l.armazem}`, data: x.l.data, acao: 'Ver pedido', attr: ` data-ir-doc="pedidos" data-chave="goparts:abrir-pedido" data-valor="${x.l.num}"`,
    detalhe: [['Artigos', String(x.artigos)], ['Valor', `${euros(x.valor)} sem IVA`]] }));
  DEVOLUCOES.filter((d) => estadoDev(d) === 'rascunho').forEach((d) => a.push({ grupo: 'tratar', titulo: 'Devolução por enviar', info: d.num, data: `Criada a ${d.criada}`, acao: 'Abrir devoluções', attr: ' data-ir-filtro="devolucoes" data-etapa-alvo="rascunho"',
    detalhe: [['Artigos', d.linhas.map(([q, t]) => `${q} × ${t}`).join('; ')], ['Motivo', d.obs]] }));
  DEVOLUCOES.filter((d) => estadoDev(d) === 'enviada').forEach((d) => a.push({ grupo: 'info', titulo: 'Devolução a aguardar resposta', info: d.num, data: `Enviada a ${d.enviada}`, acao: 'Abrir devoluções', attr: ' data-ir-filtro="devolucoes" data-etapa-alvo="enviada"',
    detalhe: [['Artigos', d.linhas.map(([q, t]) => `${q} × ${t}`).join('; ')], ['À espera de', 'nota de crédito da Romafe']] }));
  /* a previsão de entrega mudou: só quando o percurso do pedido o diz (a parte que falta e quando chega) */
  LINHAS_TODAS.forEach((x) => { const passo = x.p.percurso.find((s) => !s[1] && s[2] && /chega/i.test(s[2])); if (passo) a.push({ grupo: 'info', titulo: 'Alteração na previsão de entrega', info: x.l.num, data: passo[2]!, acao: 'Ver pedido', attr: ` data-ir-doc="pedidos" data-chave="goparts:abrir-pedido" data-valor="${x.l.num}"`,
    detalhe: x.p.artigos.filter((ar) => ar[1] < ar[0]).map((ar) => [`${ar[0] - ar[1]} em falta`, ar[2]] as [string, string]) }); });
  const ordem: Record<GrupoAlerta, number> = { urgente: 0, tratar: 1, info: 2 };
  return a.sort((x, y) => ordem[x.grupo] - ordem[y.grupo]);
}
