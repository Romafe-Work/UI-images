/* =========================================================
   ERP · Compras — o domínio da fase 2 (19 out. 2026): requisições de compra e pedidos de cotação
   Ela: «para requisições e cotações». A mesma disciplina da fase 1 (dominio.ts): cêntimos inteiros, estados
   com transições explícitas, permissões por ação, histórico com quem, quando e o quê. A «base» é outra chave
   do navegador (erp:compras:fase2:v1); as encomendas que daqui nascem são criadas pelo domínio da fase 1.

   REQUISIÇÃO (RQ 2026/…): alguém de qualquer departamento pede artigos, com a justificação e a data em que
   precisa deles.
     Rascunho → submeter → Em aprovação (fica com um aprovador) → aprovar → Aprovada · rejeitar (motivo) → Rejeitada
     Aprovada → pedir cotação / criar encomenda → Convertida · encerrar (motivo) → Encerrada
     O aprovador: até LIMITE_REQ (2 500,00 € estimados) é Compras; acima, a Administração. Quem pede não
     aprova a sua (se quem pede é de Compras, aprova a Administração). A rejeitada guarda a decisão.
   PEDIDO DE COTAÇÃO (PC 2026/…): o comprador pergunta preço e prazo a um ou mais fornecedores.
     Rascunho → marcar como enviado → Enviado → (registar respostas) → Com respostas → escolher → Decidido
     Rascunho, Enviado, Com respostas → cancelar (motivo) → Cancelado
     «Enviado» quer dizer que o comprador o mandou: o ERP ainda não manda correio, e não finge que mandou.
     As respostas registam-se à mão (preço por linha, desconto, mínimo, prazo, portes, pagamento, validade,
     disponibilidade e a referência do fornecedor). Só euros: outra moeda pede as regras de câmbio.
     Escolher uma proposta não muda nada até se confirmar; confirmar cria a encomenda em rascunho (com os
     preços e o prazo da proposta) e marca as requisições de origem como convertidas.
   COMPARAÇÃO: tudo sem IVA (bases), com a mesma regra de arredondamento da encomenda. Não há «melhor»
   automático: mostra-se o mais barato e o mais rápido, e porquê; uma proposta caducada ou abaixo do
   mínimo do fornecedor diz-se, e a caducada não se escolhe.
   ========================================================= */
import type { IdPerfil } from '../inicio-dados';
import { PERFIS } from '../inicio-dados';
import {
  HOJE, ARMAZEM, artigo, fornecedor, criar, guardar, encomenda, anotar, ev, agora, somarDias, dia, euros, Recusa, type LinhaEnc, type Evento,
} from './dominio';

export const LIMITE_REQ = 250_000; // 2 500,00 €
const DEPARTAMENTO: Record<IdPerfil, string> = { compras: 'Compras', armazem: 'Armazém 60', vendas: 'Vendas', financeiro: 'Financeiro', admin: 'Administração' };
export const departamento = (p: IdPerfil) => DEPARTAMENTO[p];

/* ---------- tipos ---------- */
export type EstadoReq = 'Rascunho' | 'Em aprovação' | 'Aprovada' | 'Rejeitada' | 'Convertida' | 'Encerrada';
export interface LinhaReq { id: string; ref: string; qtd: number; custo: number | null }
export interface Anexo { nome: string; tamanho: number }
export interface Requisicao {
  ref: string; requerente: IdPerfil; departamento: string; data: string; necessaria: string; justificacao: string; centro: string;
  linhas: LinhaReq[]; anexos: Anexo[]; estado: EstadoReq; aprovador?: IdPerfil; destino: string[]; historico: Evento[]; versao: number;
}
export type EstadoPc = 'Rascunho' | 'Enviado' | 'Com respostas' | 'Decidido' | 'Cancelado';
export interface LinhaPc { id: string; ref: string; qtd: number }
export interface LinhaOferta { id: string; preco: number | null; desc: number; minimo: number; refForn: string }
export interface Oferta { forn: string; respondida: string; prazo: number; portes: number; pagamento: string; validade: string; moeda: 'EUR'; disponibilidade: string; notas: string; linhas: LinhaOferta[] }
export interface Cotacao {
  ref: string; comprador: IdPerfil; data: string; prazoResposta: string; entrega: string; local: string; notas: string; origem: string[];
  linhas: LinhaPc[]; fornecedores: string[]; ofertas: Oferta[]; anexos: Anexo[]; estado: EstadoPc; escolhido?: string; encomenda?: string; historico: Evento[]; versao: number;
}

/* ---------- a semente ---------- */
const lr = (id: string, ref: string, qtd: number, custo: number | null): LinhaReq => ({ id, ref, qtd, custo });
function semente() {
  const req: Requisicao[] = [
    { ref: 'RQ 2026/0052', requerente: 'compras', departamento: 'Compras', data: '2026-10-19', necessaria: '2026-11-02', justificacao: 'Kits de distribuição para a campanha de novembro.', centro: 'CC 10 · Compras', estado: 'Rascunho', destino: [], anexos: [], versao: 1,
      linhas: [lr('a', 'K015603XS', 20, 8950)], historico: [ev('19/10/2026 08:20', 'compras', 'Criou a requisição')] },
    { ref: 'RQ 2026/0051', requerente: 'armazem', departamento: 'Armazém 60', data: '2026-10-17', necessaria: '2026-10-24', justificacao: 'O 6206-2RSH está abaixo do mínimo (140 para 400) e a separação já teve faltas na posição 60 · B · 12 · 3.', centro: 'CC 60 · Armazém', estado: 'Em aprovação', aprovador: 'compras', destino: [], anexos: [{ nome: 'contagem-60-B-12-3.pdf', tamanho: 84_211 }], versao: 2,
      linhas: [lr('a', '6206-2RSH', 400, 412)], historico: [ev('17/10/2026 15:02', 'armazem', 'Criou a requisição'), ev('17/10/2026 15:10', 'armazem', 'Submeteu', 'Estimado 1 648,00 €: aprova Compras (Rui Matos)')] },
    { ref: 'RQ 2026/0050', requerente: 'vendas', departamento: 'Vendas', data: '2026-10-16', necessaria: '2026-10-21', justificacao: 'A EC 2026/1180 (Auto Peças Lima) tem falta de 10 rolamentos 30205.', centro: 'CC 20 · Vendas', estado: 'Aprovada', aprovador: 'compras', destino: [], anexos: [], versao: 3,
      linhas: [lr('a', '30205', 40, 1550)], historico: [ev('16/10/2026 10:00', 'vendas', 'Criou a requisição'), ev('16/10/2026 10:05', 'vendas', 'Submeteu', 'Estimado 620,00 €: aprova Compras (Rui Matos)'), ev('16/10/2026 11:30', 'compras', 'Aprovou', 'Pedir 40 para repor o mínimo')] },
    { ref: 'RQ 2026/0049', requerente: 'armazem', departamento: 'Armazém 60', data: '2026-10-08', necessaria: '2026-10-23', justificacao: 'Massa para a oficina e para venda ao balcão.', centro: 'CC 60 · Armazém', estado: 'Convertida', aprovador: 'compras', destino: ['PC 2026/0015', 'EF 2026/0412'], anexos: [], versao: 4,
      linhas: [lr('a', 'LGMT 2/1', 120, 2500)], historico: [ev('08/10/2026 09:00', 'armazem', 'Criou a requisição'), ev('08/10/2026 09:04', 'armazem', 'Submeteu', 'Estimado 3 000,00 €: aprova a Administração'), ev('08/10/2026 14:00', 'admin', 'Aprovou'), ev('09/10/2026 10:05', 'compras', 'Converteu', 'Na encomenda EF 2026/0412', 'EF 2026/0412')] },
    { ref: 'RQ 2026/0048', requerente: 'vendas', departamento: 'Vendas', data: '2026-10-06', necessaria: '2026-10-13', justificacao: 'Pedido de cliente para GDB2042.', centro: 'CC 20 · Vendas', estado: 'Rejeitada', aprovador: 'compras', destino: [], anexos: [], versao: 3,
      linhas: [lr('a', 'GDB2042', 50, null)], historico: [ev('06/10/2026 16:00', 'vendas', 'Criou a requisição'), ev('06/10/2026 16:02', 'vendas', 'Submeteu', 'Sem custo estimado: aprova Compras (Rui Matos)'), ev('07/10/2026 09:15', 'compras', 'Rejeitou', 'A TRW não tem preço para o GDB2042; pede ao cliente a alternativa GDB1330.')] },
  ];
  const lo = (id: string, preco: number | null, refForn: string, minimo = 0, desc = 0): LinhaOferta => ({ id, preco, desc, minimo, refForn });
  const rfq: Cotacao[] = [
    { ref: 'PC 2026/0017', comprador: 'compras', data: '2026-10-14', prazoResposta: '2026-10-20', entrega: '2026-10-28', local: ARMAZEM, notas: 'Entrega única; paletes de 1 m de altura no máximo.', origem: ['RQ 2026/0050'], estado: 'Com respostas', anexos: [], versao: 4,
      linhas: [{ id: 'a', ref: '30205', qtd: 40 }, { id: 'b', ref: '6206-2RSH', qtd: 1200 }], fornecedores: ['skf', 'rnorte', 'itrans'],
      ofertas: [
        { forn: 'skf', respondida: '2026-10-15', prazo: 10, portes: 0, pagamento: '60 dias', validade: '2026-10-31', moeda: 'EUR', disponibilidade: 'Fabrico, entrega a 10 dias', notas: '', linhas: [lo('a', 1550, '30205 J2/Q'), lo('b', 412, '6206-2RSH/C3', 100)] },
        { forn: 'rnorte', respondida: '2026-10-16', prazo: 3, portes: 4500, pagamento: '30 dias', validade: '2026-10-25', moeda: 'EUR', disponibilidade: 'Em stock (1 500 de 6206; 60 de 30205)', notas: 'Desconto de 2 % no 6206 acima de 1 000.', linhas: [lo('a', 1420, 'RN-30205'), lo('b', 395, 'RN-6206-2RS', 0, 200)] },
        { forn: 'itrans', respondida: '2026-10-09', prazo: 15, portes: 12000, pagamento: '30 dias', validade: '2026-10-15', moeda: 'EUR', disponibilidade: 'Sob encomenda', notas: '', linhas: [lo('a', 1390, 'IT 30205'), lo('b', 380, 'IT 6206 2RS', 1500)] },
      ],
      historico: [ev('14/10/2026 09:30', 'compras', 'Criou o pedido', 'A partir da RQ 2026/0050', 'RQ 2026/0050'), ev('14/10/2026 09:45', 'compras', 'Marcou como enviado', 'A 3 fornecedores'), ev('15/10/2026 12:10', 'compras', 'Registou a resposta', 'SKF Portugal'), ev('16/10/2026 17:40', 'compras', 'Registou a resposta', 'Rolamentos do Norte'), ev('16/10/2026 18:00', 'compras', 'Registou a resposta', 'Ibérica de Transmisiones (proposta de 09/10)')] },
    { ref: 'PC 2026/0016', comprador: 'compras', data: '2026-10-13', prazoResposta: '2026-10-17', entrega: '2026-11-02', local: ARMAZEM, notas: '', origem: [], estado: 'Enviado', anexos: [], versao: 2,
      linhas: [{ id: 'a', ref: 'K015603XS', qtd: 20 }], fornecedores: ['gates', 'rnorte'], ofertas: [],
      historico: [ev('13/10/2026 11:00', 'compras', 'Criou o pedido'), ev('13/10/2026 11:20', 'compras', 'Marcou como enviado', 'A 2 fornecedores')] },
    { ref: 'PC 2026/0015', comprador: 'compras', data: '2026-10-08', prazoResposta: '2026-10-09', entrega: '2026-10-23', local: ARMAZEM, notas: '', origem: ['RQ 2026/0049'], estado: 'Decidido', escolhido: 'skf', encomenda: 'EF 2026/0412', anexos: [], versao: 5,
      linhas: [{ id: 'a', ref: 'LGMT 2/1', qtd: 120 }], fornecedores: ['skf'], ofertas: [{ forn: 'skf', respondida: '2026-10-09', prazo: 10, portes: 0, pagamento: '60 dias', validade: '2026-10-30', moeda: 'EUR', disponibilidade: 'Em stock', notas: '', linhas: [lo('a', 2500, 'LGMT 2/1')] }],
      historico: [ev('08/10/2026 15:00', 'compras', 'Criou o pedido', 'A partir da RQ 2026/0049', 'RQ 2026/0049'), ev('08/10/2026 15:05', 'compras', 'Marcou como enviado', 'A 1 fornecedor'), ev('09/10/2026 09:40', 'compras', 'Registou a resposta', 'SKF Portugal'), ev('09/10/2026 10:05', 'compras', 'Escolheu a proposta', 'SKF Portugal · 3 000,00 € s/ IVA · na EF 2026/0412', 'EF 2026/0412')] },
  ];
  return { req, rfq, series: { 'RQ 2026': 52, 'PC 2026': 17 } as Record<string, number> };
}

/* ---------- a «base» ---------- */
const CHAVE = 'erp:compras:fase2:v1';
type Base = ReturnType<typeof semente>;
let base: Base | null = null;
const ler = (): Base => { try { const v = localStorage.getItem(CHAVE); if (v) return JSON.parse(v) as Base; } catch { /* */ } return semente(); };
const db = (): Base => (base ??= ler());
const gravar = () => { try { localStorage.setItem(CHAVE, JSON.stringify(base)); } catch { /* */ } };
export const recarregar2 = () => { base = ler(); };
export const CHAVE_FASE2 = CHAVE;
const proximo = (serie: string) => { const b = db(); b.series[serie] = (b.series[serie] ?? 0) + 1; return `${serie}/${String(b.series[serie]).padStart(4, '0')}`; };

export const requisicoes = () => db().req.slice().sort((a, b) => b.ref.localeCompare(a.ref));
export const requisicao = (ref: string) => db().req.find((r) => r.ref === ref);
export const cotacoes = () => db().rfq.slice().sort((a, b) => b.ref.localeCompare(a.ref));
export const cotacao = (ref: string) => db().rfq.find((r) => r.ref === ref);

/* ---------- permissões ---------- */
export type Acao2 = 'req-ver-todas' | 'req-criar' | 'req-converter' | 'pc-ver' | 'pc-gerir';
const PODE2: Record<Acao2, IdPerfil[]> = {
  'req-ver-todas': ['compras', 'admin'], 'req-criar': ['compras', 'armazem', 'vendas', 'financeiro', 'admin'], 'req-converter': ['compras', 'admin'],
  'pc-ver': ['compras', 'financeiro', 'admin'], 'pc-gerir': ['compras', 'admin'],
};
export const pode2 = (p: IdPerfil, a: Acao2) => PODE2[a].includes(p);
/** As requisições que um perfil vê: Compras e Administração veem todas; os outros, as suas e as que têm para aprovar. */
export const requisicoesDe = (p: IdPerfil) => requisicoes().filter((r) => pode2(p, 'req-ver-todas') || r.requerente === p || r.aprovador === p);

/* ---------- requisições ---------- */
export const custoReq = (r: Pick<Requisicao, 'linhas'>) => r.linhas.reduce((s, l) => s + (l.custo === null ? 0 : l.qtd * l.custo), 0);
export const semCusto = (r: Pick<Requisicao, 'linhas'>) => r.linhas.filter((l) => l.custo === null).length;
/** Quem aprova: até ao limite, Compras; acima (ou se quem pede é de Compras), a Administração. */
export const aprovadorDe = (r: Requisicao): IdPerfil => (custoReq(r) > LIMITE_REQ || r.requerente === 'compras' || r.requerente === 'admin') ? (r.requerente === 'admin' ? 'compras' : 'admin') : 'compras';
export type AcaoReq = 'editar' | 'submeter' | 'aprovar' | 'rejeitar' | 'cotar' | 'encomendar' | 'encerrar' | 'duplicar';
export function acoesReq(r: Requisicao, p: IdPerfil): AcaoReq[] {
  const a: AcaoReq[] = [];
  if (r.estado === 'Rascunho' && r.requerente === p) a.push('editar', 'submeter');
  if (r.estado === 'Em aprovação' && r.aprovador === p && r.requerente !== p) a.push('aprovar', 'rejeitar');
  if (r.estado === 'Aprovada' && pode2(p, 'req-converter')) a.push('cotar', 'encomendar', 'encerrar');
  if (pode2(p, 'req-criar')) a.push('duplicar');
  return a;
}
export const NOME_REQ: Record<AcaoReq, string> = { editar: 'Alterar', submeter: 'Submeter', aprovar: 'Aprovar', rejeitar: 'Rejeitar', cotar: 'Pedir cotação', encomendar: 'Criar encomenda', encerrar: 'Encerrar', duplicar: 'Duplicar' };

export function problemasReq(r: Pick<Requisicao, 'linhas' | 'necessaria' | 'justificacao'>): string[] {
  const m: string[] = [];
  if (!r.linhas.length) m.push('Junta pelo menos um artigo.');
  r.linhas.forEach((l) => { if (!Number.isInteger(l.qtd) || l.qtd <= 0) m.push(`${l.ref}: a quantidade tem de ser um número inteiro maior do que zero.`); });
  if (!r.necessaria) m.push('Diz para quando precisas.'); else if (r.necessaria < HOJE) m.push('A data em que precisas já passou.');
  if (r.justificacao.trim().length < 10) m.push('Explica porque precisas (quem aprova lê isto).');
  return m;
}
export function criarReq(p: IdPerfil, linhas: LinhaReq[] = []): Requisicao {
  if (!pode2(p, 'req-criar')) throw new Recusa('O teu perfil não cria requisições.', 'permissao');
  const r: Requisicao = { ref: proximo('RQ 2026'), requerente: p, departamento: departamento(p), data: HOJE, necessaria: somarDias(HOJE, 7), justificacao: '', centro: '', linhas, anexos: [], estado: 'Rascunho', destino: [], historico: [ev(agora(), p, 'Criou a requisição')], versao: 1 };
  db().req.push(r); gravar(); return r;
}
export function guardarReq(p: IdPerfil, nova: Requisicao, versao: number): Requisicao {
  recarregar2();
  const r = requisicao(nova.ref); if (!r) throw new Recusa('A requisição já não existe.', 'estado');
  if (r.requerente !== p) throw new Recusa('Só quem pediu altera a requisição.', 'permissao');
  if (r.estado !== 'Rascunho') throw new Recusa(`A requisição está «${r.estado}»: só um rascunho se altera.`, 'estado');
  if (r.versao !== versao) throw new Recusa('Alguém guardou esta requisição depois de a abrires.', 'conflito');
  Object.assign(r, { necessaria: nova.necessaria, justificacao: nova.justificacao, centro: nova.centro, linhas: nova.linhas.map((l) => ({ ...l })), anexos: nova.anexos.slice() });
  r.versao++; r.historico.push(ev(agora(), p, 'Alterou a requisição', `${r.linhas.length} ${r.linhas.length === 1 ? 'artigo' : 'artigos'} · estimado ${euros(custoReq(r))}`)); gravar();
  return r;
}
export function transitarReq(p: IdPerfil, ref: string, acao: AcaoReq, motivo = ''): Requisicao {
  recarregar2();
  const r = requisicao(ref); if (!r) throw new Recusa('A requisição já não existe.', 'estado');
  if (!acoesReq(r, p).includes(acao)) {
    if (acao === 'aprovar' && r.requerente === p) throw new Recusa('Quem pede não aprova a sua requisição.', 'permissao');
    throw new Recusa(`Não é possível ${NOME_REQ[acao].toLowerCase()} uma requisição «${r.estado}» com o teu perfil.`, 'permissao');
  }
  const antes = r.estado;
  if (acao === 'submeter') {
    const pr = problemasReq(r); if (pr.length) throw new Recusa(pr.join(' '));
    r.aprovador = aprovadorDe(r); r.estado = 'Em aprovação';
    r.historico.push(ev(agora(), p, 'Submeteu', `${semCusto(r) ? `${semCusto(r)} sem custo estimado · ` : ''}estimado ${euros(custoReq(r))}: aprova ${PERFIS[r.aprovador].nome} (${PERFIS[r.aprovador].pessoa})`));
  } else if (acao === 'aprovar') { r.estado = 'Aprovada'; r.historico.push(ev(agora(), p, 'Aprovou', motivo.trim() || undefined)); }
  else if (acao === 'rejeitar') { if (!motivo.trim()) throw new Recusa('Diz porque rejeitas: quem pediu precisa de saber.'); r.estado = 'Rejeitada'; r.historico.push(ev(agora(), p, 'Rejeitou', motivo.trim())); }
  else if (acao === 'encerrar') { if (!motivo.trim()) throw new Recusa('Diz porque encerras.'); r.estado = 'Encerrada'; r.historico.push(ev(agora(), p, 'Encerrou', motivo.trim())); }
  else throw new Recusa('Ação desconhecida.');
  r.historico[r.historico.length - 1].detalhe = `${r.historico[r.historico.length - 1].detalhe ? r.historico[r.historico.length - 1].detalhe + ' · ' : ''}${antes} → ${r.estado}`;
  r.versao++; gravar(); return r;
}
export function duplicarReq(p: IdPerfil, ref: string): Requisicao {
  const o = requisicao(ref); if (!o) throw new Recusa('A requisição já não existe.', 'estado');
  const n = criarReq(p, o.linhas.map((l) => ({ ...l, custo: artigo(l.ref)?.preco ?? l.custo })));
  n.justificacao = o.justificacao; n.historico[0].detalhe = `A partir da ${o.ref}`; gravar(); return n;
}
function converter(r: Requisicao, p: IdPerfil, destino: string): void {
  r.destino.push(destino); r.estado = 'Convertida';
  r.historico.push(ev(agora(), p, 'Converteu', `${destino.startsWith('PC') ? 'No pedido de cotação' : 'Na encomenda'} ${destino} · Aprovada → Convertida`, destino));
  r.versao++;
}
/** Criar encomendas a partir de uma requisição aprovada: uma por fornecedor do catálogo de cada artigo. */
export function encomendarReq(p: IdPerfil, ref: string): string[] {
  recarregar2();
  const r = requisicao(ref); if (!r) throw new Recusa('A requisição já não existe.', 'estado');
  if (!acoesReq(r, p).includes('encomendar')) throw new Recusa('Só uma requisição aprovada se converte, e só por Compras.', 'permissao');
  const porForn = new Map<string, LinhaReq[]>();
  r.linhas.forEach((l) => { const f = artigo(l.ref)?.forn; if (f) porForn.set(f, [...(porForn.get(f) ?? []), l]); });
  if (!porForn.size) throw new Recusa('Nenhum dos artigos tem fornecedor no catálogo: pede uma cotação.');
  const refs: string[] = [];
  porForn.forEach((ls, forn) => {
    const e = criar(p, forn);
    e.linhas = ls.map((l, i) => ({ id: String.fromCharCode(97 + i), ref: l.ref, qtd: l.qtd, preco: artigo(l.ref)?.preco ?? null, desc: 0, iva: artigo(l.ref)?.iva ?? 2300, entrega: e.entrega, recebida: 0, rejeitada: 0 }));
    e.notas = `Da requisição ${r.ref} (${r.departamento}): ${r.justificacao}`;
    guardar(p, e, e.versao);
    anotar(e.ref, p, 'Criada a partir da requisição', r.ref, r.ref);
    converter(r, p, e.ref); refs.push(e.ref);
  });
  gravar(); return refs;
}

/* ---------- pedidos de cotação ---------- */
export type AcaoPc = 'editar' | 'enviar' | 'responder' | 'escolher' | 'cancelar' | 'duplicar';
export function acoesPc(c: Cotacao, p: IdPerfil): AcaoPc[] {
  if (!pode2(p, 'pc-gerir')) return [];
  const a: AcaoPc[] = [];
  if (c.estado === 'Rascunho') a.push('editar', 'enviar');
  if (c.estado === 'Enviado' || c.estado === 'Com respostas') a.push('responder');
  if (c.estado === 'Com respostas') a.push('escolher');
  if (['Rascunho', 'Enviado', 'Com respostas'].includes(c.estado)) a.push('cancelar');
  a.push('duplicar');
  return a;
}
export const NOME_PC: Record<AcaoPc, string> = { editar: 'Alterar', enviar: 'Marcar como enviado', responder: 'Registar resposta', escolher: 'Escolher proposta', cancelar: 'Cancelar', duplicar: 'Duplicar' };
export const semResposta = (c: Cotacao) => c.fornecedores.filter((f) => !c.ofertas.some((o) => o.forn === f));
export const caducada = (o: Oferta) => o.validade < HOJE;
export const prazoPassou = (c: Cotacao) => c.prazoResposta < HOJE && (c.estado === 'Enviado' || c.estado === 'Com respostas');

export function criarPc(p: IdPerfil, o: { origem?: string[]; linhas?: LinhaPc[] } = {}): Cotacao {
  if (!pode2(p, 'pc-gerir')) throw new Recusa('O teu perfil não faz pedidos de cotação.', 'permissao');
  const c: Cotacao = { ref: proximo('PC 2026'), comprador: p, data: HOJE, prazoResposta: somarDias(HOJE, 3), entrega: somarDias(HOJE, 14), local: ARMAZEM, notas: '', origem: o.origem ?? [], linhas: o.linhas ?? [], fornecedores: [], ofertas: [], anexos: [], estado: 'Rascunho', historico: [ev(agora(), p, 'Criou o pedido', o.origem?.length ? `A partir da ${o.origem.join(', ')}` : undefined, o.origem?.[0])], versao: 1 };
  db().rfq.push(c); gravar(); return c;
}
/** Pedir cotação a partir de uma requisição aprovada: os artigos e as quantidades vêm com ela. */
export function cotarReq(p: IdPerfil, ref: string): Cotacao {
  recarregar2();
  const r = requisicao(ref); if (!r) throw new Recusa('A requisição já não existe.', 'estado');
  if (!acoesReq(r, p).includes('cotar')) throw new Recusa('Só uma requisição aprovada se converte, e só por Compras.', 'permissao');
  const c = criarPc(p, { origem: [r.ref], linhas: r.linhas.map((l) => ({ id: l.id, ref: l.ref, qtd: l.qtd })) });
  c.entrega = r.necessaria > HOJE ? r.necessaria : c.entrega;
  const f = artigo(r.linhas[0]?.ref ?? '')?.forn; if (f) c.fornecedores = [f];
  converter(r, p, c.ref); gravar();
  return c;
}
export function guardarPc(p: IdPerfil, nova: Cotacao, versao: number): Cotacao {
  recarregar2();
  const c = cotacao(nova.ref); if (!c) throw new Recusa('O pedido já não existe.', 'estado');
  if (!acoesPc(c, p).includes('editar')) throw new Recusa(`O pedido está «${c.estado}»: só um rascunho se altera.`, 'estado');
  if (c.versao !== versao) throw new Recusa('Alguém guardou este pedido depois de o abrires.', 'conflito');
  Object.assign(c, { prazoResposta: nova.prazoResposta, entrega: nova.entrega, notas: nova.notas, linhas: nova.linhas.map((l) => ({ ...l })), fornecedores: nova.fornecedores.slice(), anexos: nova.anexos.slice() });
  c.versao++; c.historico.push(ev(agora(), p, 'Alterou o pedido', `${c.linhas.length} artigos · ${c.fornecedores.length} fornecedores`)); gravar();
  return c;
}
export function problemasPc(c: Pick<Cotacao, 'linhas' | 'fornecedores' | 'prazoResposta' | 'entrega'>): string[] {
  const m: string[] = [];
  if (!c.linhas.length) m.push('Junta pelo menos um artigo.');
  c.linhas.forEach((l) => { if (!Number.isInteger(l.qtd) || l.qtd <= 0) m.push(`${l.ref}: a quantidade tem de ser um número inteiro maior do que zero.`); });
  if (!c.fornecedores.length) m.push('Escolhe pelo menos um fornecedor.');
  if (!c.prazoResposta || c.prazoResposta < HOJE) m.push('O prazo de resposta tem de ser hoje ou depois.');
  if (c.entrega && c.prazoResposta && c.entrega < c.prazoResposta) m.push('A entrega desejada é antes do prazo de resposta.');
  return m;
}
export function enviarPc(p: IdPerfil, ref: string): Cotacao {
  recarregar2();
  const c = cotacao(ref); if (!c || !acoesPc(c, p).includes('enviar')) throw new Recusa('Este pedido não se pode marcar como enviado.', 'estado');
  const pr = problemasPc(c); if (pr.length) throw new Recusa(pr.join(' '));
  c.estado = 'Enviado'; c.historico.push(ev(agora(), p, 'Marcou como enviado', `A ${c.fornecedores.length} ${c.fornecedores.length === 1 ? 'fornecedor' : 'fornecedores'} · Rascunho → Enviado`));
  c.versao++; gravar(); return c;
}
export function responderPc(p: IdPerfil, ref: string, o: Oferta): Cotacao {
  recarregar2();
  const c = cotacao(ref); if (!c || !acoesPc(c, p).includes('responder')) throw new Recusa('Este pedido já não recebe respostas.', 'estado');
  if (!c.fornecedores.includes(o.forn)) throw new Recusa('Esse fornecedor não está no pedido.');
  if (o.moeda !== 'EUR') throw new Recusa('Só euros: outra moeda pede as regras de câmbio.');
  if (!o.linhas.some((l) => l.preco !== null)) throw new Recusa('Escreve o preço de pelo menos um artigo.');
  if (!o.validade) throw new Recusa('Diz até quando vale a proposta.');
  if (!Number.isInteger(o.prazo) || o.prazo < 0) throw new Recusa('O prazo de entrega é um número de dias.');
  const ja = c.ofertas.findIndex((x) => x.forn === o.forn);
  if (ja >= 0) c.ofertas[ja] = o; else c.ofertas.push(o);
  const antes = c.estado; c.estado = 'Com respostas';
  c.historico.push(ev(agora(), p, ja >= 0 ? 'Corrigiu a resposta' : 'Registou a resposta', `${fornecedor(o.forn)?.nome}${antes !== c.estado ? ` · ${antes} → ${c.estado}` : ''}`));
  c.versao++; gravar(); return c;
}
export function cancelarPc(p: IdPerfil, ref: string, motivo: string): Cotacao {
  recarregar2();
  const c = cotacao(ref); if (!c || !acoesPc(c, p).includes('cancelar')) throw new Recusa('Este pedido não se pode cancelar.', 'estado');
  if (!motivo.trim()) throw new Recusa('Diz porque cancelas.');
  const antes = c.estado; c.estado = 'Cancelado'; c.historico.push(ev(agora(), p, 'Cancelou', `${motivo.trim()} · ${antes} → Cancelado`)); c.versao++; gravar(); return c;
}
export function duplicarPc(p: IdPerfil, ref: string): Cotacao {
  const o = cotacao(ref); if (!o) throw new Recusa('O pedido já não existe.', 'estado');
  const n = criarPc(p, { linhas: o.linhas.map((l) => ({ ...l })) }); n.fornecedores = o.fornecedores.slice(); n.notas = o.notas; n.historico[0].detalhe = `A partir do ${o.ref}`; gravar(); return n;
}

/* ---------- a comparação ---------- */
const arred = (n: number, d: number) => Math.floor((n * 2 + d) / (2 * d));
export interface Avaliacao { forn: string; linhas: { id: string; liquido: number | null; abaixoMinimo: boolean }[]; artigos: number; base: number; total: number; entrega: string; caducada: boolean; completa: boolean }
/** O que cada proposta custa, sem IVA, com a mesma regra da encomenda (desconto por linha, ao cêntimo). */
export function avaliar(c: Cotacao, o: Oferta): Avaliacao {
  const linhas = c.linhas.map((l) => {
    const x = o.linhas.find((y) => y.id === l.id);
    if (!x || x.preco === null) return { id: l.id, liquido: null, abaixoMinimo: false };
    return { id: l.id, liquido: arred(l.qtd * x.preco * (10000 - x.desc), 10000), abaixoMinimo: x.minimo > 0 && l.qtd < x.minimo };
  });
  const base = linhas.reduce((s, l) => s + (l.liquido ?? 0), 0);
  return { forn: o.forn, linhas, artigos: linhas.filter((l) => l.liquido !== null).length, base, total: base + o.portes, entrega: somarDias(HOJE, o.prazo), caducada: caducada(o), completa: linhas.every((l) => l.liquido !== null) };
}
/** Os destaques, com o critério escrito: só entre propostas válidas e completas. */
export function destaques(c: Cotacao): { barata?: string; rapida?: string; motivo: string } {
  const v = c.ofertas.map((o) => ({ o, a: avaliar(c, o) })).filter(({ a }) => !a.caducada && a.completa);
  if (!v.length) return { motivo: 'Nenhuma proposta válida tem todos os artigos: não há comparação justa.' };
  const barata = v.slice().sort((x, y) => x.a.total - y.a.total)[0].o.forn;
  const rapida = v.slice().sort((x, y) => x.o.prazo - y.o.prazo)[0].o.forn;
  return { barata, rapida, motivo: 'Mais barata = menor total sem IVA com portes; mais rápida = menor prazo de entrega. Só contam propostas dentro da validade e com todos os artigos. O mais barato não é sempre o melhor: vê o prazo, o pagamento e o mínimo.' };
}
/** Confirmar a escolha: cria a encomenda em rascunho com os preços da proposta. */
export function escolher(p: IdPerfil, ref: string, forn: string): string {
  recarregar2();
  const c = cotacao(ref); if (!c || !acoesPc(c, p).includes('escolher')) throw new Recusa('Este pedido já não admite escolha.', 'estado');
  const o = c.ofertas.find((x) => x.forn === forn); if (!o) throw new Recusa('Esse fornecedor não respondeu.');
  if (caducada(o)) throw new Recusa(`A proposta de ${fornecedor(forn)?.nome} caducou a ${dia(o.validade)}: pede uma nova.`);
  const e = criar(p, forn);
  const entrega = somarDias(HOJE, o.prazo);
  e.linhas = c.linhas.flatMap((l, i): LinhaEnc[] => { const x = o.linhas.find((y) => y.id === l.id); return x && x.preco !== null ? [{ id: String.fromCharCode(97 + i), ref: l.ref, qtd: l.qtd, preco: x.preco, desc: x.desc, iva: artigo(l.ref)?.iva ?? 2300, entrega, recebida: 0, rejeitada: 0 }] : []; });
  e.entrega = entrega; e.portes = o.portes; e.pagamento = o.pagamento; e.notas = `Do pedido de cotação ${c.ref}, proposta de ${dia(o.respondida)}.`;
  guardar(p, e, e.versao);
  anotar(e.ref, p, 'Criada a partir da cotação', `${c.ref} · proposta de ${fornecedor(forn)?.nome}`, c.ref);
  const a = avaliar(c, o);
  c.estado = 'Decidido'; c.escolhido = forn; c.encomenda = e.ref;
  c.historico.push(ev(agora(), p, 'Escolheu a proposta', `${fornecedor(forn)?.nome} · ${euros(a.total)} s/ IVA · na ${e.ref} · Com respostas → Decidido`, e.ref));
  c.versao++;
  /* as requisições de origem já estão convertidas no pedido; ficam também com a encomenda */
  c.origem.forEach((rq) => { const r = requisicao(rq); if (r && !r.destino.includes(e.ref)) { r.destino.push(e.ref); r.historico.push(ev(agora(), p, 'Encomendada', `Na ${e.ref}, pela cotação ${c.ref}`, e.ref)); } });
  gravar(); return e.ref;
}
export const encomendaExiste = (ref: string) => !!encomenda(ref);
