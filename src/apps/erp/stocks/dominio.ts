/* =========================================================
   ERP · Stocks — o domínio dos documentos de stock (18 nov. 2026). Ela mostrou o menu Stocks do ERP antigo
   (Inventário Inicial…, Transferências entre Armazéns…, Ajustamento em Valor…, Acréscimos…, Perdas…, Transferências
   entre Artigos…, Mapas ▸) e a janela «Documentos de Stock» do Inventário Inicial (Número, Data, Valor Total; Data de
   Emissão e Observações; <F2> Actualizar, F7 Guardar, Esc Cancelar), e pediu-o no Figma como o primeiro ecrã de Stocks.
   Como nas Compras, este ficheiro faz de API e de base de dados (localStorage, da empresa e não da pessoa). As regras:
   - UM DOCUMENTO de inventário inicial é de um armazém, com uma data de emissão, observações e linhas (artigo,
     quantidade, custo unitário). Valor total = Σ quantidade × custo, em cêntimos inteiros.
   - ESTADOS: Rascunho → lançar → Lançado. Rascunho ou Lançado → anular (com motivo) → Anulado. Só o rascunho se altera;
     um lançado corrige-se anulando-o (e fazendo outro), nunca por cima.
   - O STOCK mexe-se só pelo inventário das compras (compras/dominio.ts, lancarNoStock), tudo ou nada e idempotente
     pela chave: lançar soma as quantidades no armazém do documento; anular um lançado tira-as (movimentos de sentido
     contrário). O II 2026/0001 é o stock de partida do armazém 60 (o STOCK0 das compras): já está no stock.
   - Um artigo aparece uma só vez por documento; quantidade inteira ≥ 0; custo ≥ 0 (o custo vem do último preço do
     fornecedor e pode mudar-se). Um armazém tem um só inventário inicial lançado de cada vez.
   - PERMISSÕES: armazém, compras e administração criam, alteram, lançam e anulam; o financeiro só consulta.
   - NUMERAÇÃO pela série II 2026; VERSÃO em cada documento (gravar com uma versão antiga recusa).
   Hoje, no protótipo, é sempre segunda-feira, 19 de outubro de 2026.
   ========================================================= */
import type { IdPerfil } from '../inicio-dados';
import { PERFIS } from '../inicio-dados';
import { ARTIGOS, ARMAZEM, HOJE, Recusa, agora, artigo, stockInicial, lancarNoStock, stockEm } from '../compras/dominio';

export { HOJE, Recusa, artigo, ARTIGOS, stockEm };
/* 18 nov. (ela mostrou as Transferências de Armazém do ERP antigo): os armazéns reais da Romafe — 1 Porto, 2 Porto
   Cliente, 60 Coimbra, 88 Material Reservado e 99 Encomendas Programadas. O 60 é o do protótipo (com o stock de partida). */
export const ARMAZENS: { cod: string; nome: string }[] = [
  { cod: '1', nome: 'Armazém 1 · Porto' }, { cod: '2', nome: 'Armazém 2 · Porto Cliente' }, { cod: '60', nome: ARMAZEM },
  { cod: '88', nome: 'Armazém 88 · Material Reservado' }, { cod: '99', nome: 'Armazém 99 · Encomendas Programadas' },
];
export const armazemDe = (cod: string) => ARMAZENS.find((a) => a.cod === cod)?.nome ?? cod;

export type EstadoInv = 'Rascunho' | 'Lançado' | 'Anulado';
export interface LinhaInv { id: string; ref: string; qtd: number; custo: number }
export interface EventoInv { quando: string; quem: string; acao: string; detalhe?: string }
/** 18 nov.: uma transferência entre armazéns — de um armazém de origem para um de destino, com as linhas. */
export interface LinhaTr { id: string; ref: string; qtd: number }
export interface DocTr {
  ref: string; data: string; origem: string; destino: string; notas: string; estado: EstadoInv; linhas: LinhaTr[];
  criador: IdPerfil; alterado: IdPerfil; lancado?: string; anulado?: { quando: string; por: IdPerfil; motivo: string }; historico: EventoInv[]; versao: number;
}
export interface DocInv {
  ref: string; data: string; armazem: string; notas: string; estado: EstadoInv; linhas: LinhaInv[];
  criador: IdPerfil; alterado: IdPerfil; lancado?: string; anulado?: { quando: string; por: IdPerfil; motivo: string };
  /** o stock de partida do armazém 60: já está no stock (STOCK0), lançar não lhe soma nada */
  base?: boolean; historico: EventoInv[]; versao: number;
}
const evInv = (quando: string, quem: IdPerfil, acao: string, detalhe?: string): EventoInv => ({ quando, quem: PERFIS[quem].pessoa, acao, detalhe });

function semente() {
  const s0 = stockInicial();
  const linhas0 = ARTIGOS.filter((a) => (s0[a.ref] ?? 0) > 0).map((a, i): LinhaInv => ({ id: String.fromCharCode(97 + i), ref: a.ref, qtd: s0[a.ref], custo: a.preco ?? 0 }));
  const docs: DocInv[] = [
    { ref: 'II 2026/0001', data: '2026-01-02', armazem: '60', notas: 'Abertura do ano: contagem de 31/12/2025.', estado: 'Lançado', linhas: linhas0, criador: 'armazem', alterado: 'armazem', lancado: '02/01/2026 18:20', base: true, versao: 3,
      historico: [evInv('02/01/2026 09:10', 'armazem', 'Criou o rascunho'), evInv('02/01/2026 17:55', 'armazem', 'Gravou', `${linhas0.length} artigos`), evInv('02/01/2026 18:20', 'armazem', 'Lançou no stock', 'Armazém 60')] },
    { ref: 'II 2026/0002', data: '2026-10-16', armazem: '2', notas: 'Abertura do armazém 2 (Porto Cliente): contagem de 15/10.', estado: 'Rascunho',
      linhas: [{ id: 'a', ref: '6205-2Z', qtd: 240, custo: 344 }, { id: 'b', ref: 'GDB1330', qtd: 36, custo: 1530 }, { id: 'c', ref: 'BKR6E', qtd: 120, custo: 395 }, { id: 'd', ref: '23.443.00', qtd: 80, custo: 480 }],
      criador: 'armazem', alterado: 'armazem', versao: 2, historico: [evInv('16/10/2026 10:05', 'armazem', 'Criou o rascunho'), evInv('16/10/2026 11:30', 'armazem', 'Gravou', '4 artigos')] },
  ];
  const L = (id: string, ref: string, qtd: number): LinhaTr => ({ id, ref, qtd });
  const h = (q: string, p: IdPerfil, a: string, d?: string) => evInv(q, p, a, d);
  const tr: DocTr[] = [
    { ref: 'TA 2026/0001', data: '2026-01-06', origem: '60', destino: '1', notas: 'Transferência SNR 4', estado: 'Lançado', linhas: [L('a', '6205-2Z', 120), L('b', 'BKR6E', 40)], criador: 'armazem', alterado: 'armazem', lancado: '06/01/2026 16:40', versao: 3,
      historico: [h('06/01/2026 15:10', 'armazem', 'Criou o rascunho'), h('06/01/2026 16:40', 'armazem', 'Lançou no stock', '160 unidades · 60 → 1')] },
    { ref: 'TA 2026/0002', data: '2026-05-19', origem: '1', destino: '60', notas: 'Acerto armazém — erro na entrada', estado: 'Lançado', linhas: [L('a', '6205-2Z', 20)], criador: 'armazem', alterado: 'armazem', lancado: '19/05/2026 11:05', versao: 3,
      historico: [h('19/05/2026 10:30', 'armazem', 'Criou o rascunho'), h('19/05/2026 11:05', 'armazem', 'Lançou no stock', '20 unidades · 1 → 60')] },
    { ref: 'TA 2026/0003', data: '2026-08-17', origem: '60', destino: '99', notas: 'Acerto armazém', estado: 'Lançado', linhas: [L('a', '23.443.00', 60), L('b', '0 242 236 565', 24)], criador: 'armazem', alterado: 'armazem', lancado: '17/08/2026 09:20', versao: 3,
      historico: [h('17/08/2026 08:55', 'armazem', 'Criou o rascunho'), h('17/08/2026 09:20', 'armazem', 'Lançou no stock', '84 unidades · 60 → 99')] },
    { ref: 'TA 2026/0004', data: '2026-09-16', origem: '60', destino: '2', notas: 'Troca', estado: 'Anulado', linhas: [L('a', 'BKR6E', 12)], criador: 'compras', alterado: 'armazem', versao: 3, anulado: { quando: '16/09/2026 17:00', por: 'armazem', motivo: 'O cliente ficou com a peça antiga.' },
      historico: [h('16/09/2026 14:00', 'compras', 'Criou o rascunho'), h('16/09/2026 17:00', 'armazem', 'Anulou', 'O cliente ficou com a peça antiga.')] },
    { ref: 'TA 2026/0005', data: '2026-10-16', origem: '60', destino: '88', notas: 'Material reservado para a Portucel-Viana', estado: 'Rascunho', linhas: [L('a', '6205-2Z', 50), L('b', '23.443.00', 30), L('c', 'BKR6E', 24)], criador: 'armazem', alterado: 'armazem', versao: 2,
      historico: [h('16/10/2026 15:20', 'armazem', 'Criou o rascunho'), h('16/10/2026 15:45', 'armazem', 'Gravou', '3 artigos')] },
  ];
  return { docs, tr, series: { 'II 2026': 2, 'TA 2026': 5 } as Record<string, number> };
}

/* ---------- a «base de dados» ---------- */
const CHAVE = 'erp:stocks:v2';
type Base = ReturnType<typeof semente>;
let base: Base | null = null;
function ler(): Base { try { const v = localStorage.getItem(CHAVE); if (v) return JSON.parse(v) as Base; } catch { /* sem armazenamento */ } return semente(); }
/* as transferências da semente já lançadas entram no stock uma vez (idempotente pela chave), como se tivessem sido lançadas */
let sincronizado = false;
const db = (): Base => {
  if (!base) base = ler();
  if (!sincronizado) { sincronizado = true; const tr = base.tr.filter((t) => t.estado === 'Lançado'); if (tr.length) lancarNoStock(tr.flatMap((t) => movsTr(t))); }
  return base;
};
function gravar(): void { try { localStorage.setItem(CHAVE, JSON.stringify(base)); } catch { /* fica na memória */ } }
export function recarregar(): void { base = ler(); }
export function repor(): void { base = semente(); gravar(); }

/* ---------- consultas ---------- */
export const inventarios = () => db().docs.slice().sort((a, b) => b.ref.localeCompare(a.ref));
export const inventario = (ref: string) => db().docs.find((d) => d.ref === ref);
export const valorLinha = (l: LinhaInv) => l.qtd * l.custo;
export const valorTotal = (d: Pick<DocInv, 'linhas'>) => d.linhas.reduce((s, l) => s + valorLinha(l), 0);
export const quantidade = (d: Pick<DocInv, 'linhas'>) => d.linhas.reduce((s, l) => s + l.qtd, 0);
function proximo(serie: string): string { const s = db().series; s[serie] = (s[serie] ?? 0) + 1; return `${serie}/${String(s[serie]).padStart(4, '0')}`; }

/* ---------- transferências entre armazéns (18 nov.) ---------- */
export const transferencias = () => db().tr.slice().sort((a, b) => b.ref.localeCompare(a.ref));
export const transferencia = (ref: string) => db().tr.find((d) => d.ref === ref);
/** O custo de uma linha: o último preço do fornecedor (o protótipo não tem custo médio). */
export const custoDe = (ref: string) => artigo(ref)?.preco ?? 0;
export const valorTr = (d: Pick<DocTr, 'linhas'>) => d.linhas.reduce((s, l) => s + l.qtd * custoDe(l.ref), 0);
export const quantidadeTr = (d: Pick<DocTr, 'linhas'>) => d.linhas.reduce((s, l) => s + l.qtd, 0);
/** Os movimentos de uma transferência: sai da origem e entra no destino, linha a linha. */
function movsTr(d: DocTr, sinal = 1, sufixo = '') {
  return d.linhas.filter((l) => l.qtd).flatMap((l) => [
    { ref: l.ref, qtd: -sinal * l.qtd, armazem: armazemDe(d.origem), origem: d.ref, chave: `${d.ref}${sufixo}:${l.id}:sai` },
    { ref: l.ref, qtd: sinal * l.qtd, armazem: armazemDe(d.destino), origem: d.ref, chave: `${d.ref}${sufixo}:${l.id}:entra` },
  ]);
}
/** As linhas sem stock que chegue na origem (para lançar): artigo, pedido e o que há. */
export const faltasNaOrigem = (d: Pick<DocTr, 'linhas' | 'origem'>) => d.linhas.map((l) => ({ ref: l.ref, qtd: l.qtd, ha: stockEm(l.ref, armazemDe(d.origem)) })).filter((x) => x.qtd > x.ha);
export function porqueLancarTr(p: IdPerfil, d: DocTr | undefined): string {
  if (!d) return 'Escolhe uma transferência na lista.';
  if (!podeInv(p, 'lancar')) return 'O teu perfil só consulta os documentos de stock.';
  if (d.estado === 'Lançado') return `Já foi lançada no stock a ${d.lancado}.`;
  if (d.estado === 'Anulado') return 'A transferência está anulada.';
  if (!d.linhas.length) return 'A transferência não tem artigos.';
  const f = faltasNaOrigem(d); if (f.length) return `Não há stock que chegue no ${armazemDe(d.origem)}: ${f[0].ref} pede ${f[0].qtd} e há ${f[0].ha}${f.length > 1 ? ` (e mais ${f.length - 1})` : ''}.`;
  return '';
}
export interface PedidoTr { data: string; origem: string; destino: string; notas: string; linhas: { ref: string; qtd: number }[] }
export function problemasTr(x: PedidoTr): { msg: string; campo: string }[] {
  const ps: { msg: string; campo: string }[] = [];
  if (!ARMAZENS.some((a) => a.cod === x.origem)) ps.push({ msg: 'Escolhe o armazém de origem.', campo: 'origem' });
  if (!ARMAZENS.some((a) => a.cod === x.destino)) ps.push({ msg: 'Escolhe o armazém de destino.', campo: 'destino' });
  else if (x.origem === x.destino) ps.push({ msg: 'A origem e o destino são o mesmo armazém.', campo: 'destino' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(x.data)) ps.push({ msg: 'A data de emissão é uma data, ex.: 19/10/2026.', campo: 'data' });
  else if (x.data > HOJE) ps.push({ msg: 'A data de emissão não pode ser depois de hoje.', campo: 'data' });
  if (!x.linhas.length) ps.push({ msg: 'A transferência precisa de pelo menos um artigo.', campo: 'art-0' });
  const vistos = new Set<string>();
  x.linhas.forEach((l, i) => {
    if (!artigo(l.ref)) ps.push({ msg: l.ref ? `«${l.ref}» não é um artigo conhecido.` : 'Escreve o artigo de cada linha.', campo: `art-${i}` });
    else if (vistos.has(l.ref)) ps.push({ msg: `${l.ref} já está noutra linha: junta as quantidades numa só.`, campo: `art-${i}` });
    vistos.add(l.ref);
    if (!Number.isInteger(l.qtd) || l.qtd <= 0) ps.push({ msg: `${l.ref || `Linha ${i + 1}`}: a quantidade é um número inteiro maior do que zero.`, campo: `qtd-${i}` });
  });
  return ps;
}
const comIdsTr = (ls: PedidoTr['linhas']): LinhaTr[] => ls.map((l, i) => ({ id: String.fromCharCode(97 + i), ...l }));
const rota = (x: { origem: string; destino: string }) => `${x.origem} → ${x.destino}`;
export function criarTr(p: IdPerfil, x: PedidoTr): DocTr {
  recarregar();
  if (!podeInv(p, 'criar')) throw new Recusa('O teu perfil não faz documentos de stock.', 'permissao');
  const pr = problemasTr(x); if (pr.length) throw recusa(pr[0]);
  const d: DocTr = { ref: proximo('TA 2026'), data: x.data, origem: x.origem, destino: x.destino, notas: x.notas.trim(), estado: 'Rascunho', linhas: comIdsTr(x.linhas), criador: p, alterado: p, versao: 1,
    historico: [evInv(agora(), p, 'Criou o rascunho', `${x.linhas.length} ${x.linhas.length === 1 ? 'artigo' : 'artigos'} · ${rota(x)}`)] };
  db().tr.push(d); gravar(); return d;
}
export function guardarTr(p: IdPerfil, ref: string, x: PedidoTr, versao: number): DocTr {
  recarregar();
  if (!podeInv(p, 'editar')) throw new Recusa('O teu perfil não altera documentos de stock.', 'permissao');
  const d = transferencia(ref); if (!d) throw new Recusa('A transferência já não existe.', 'estado');
  if (d.versao !== versao) throw new Recusa(`Outra pessoa alterou a ${d.ref} entretanto: fecha e abre outra vez para ver a versão atual.`, 'conflito');
  if (d.estado !== 'Rascunho') throw new Recusa(`Uma transferência «${d.estado}» não se altera${d.estado === 'Lançado' ? ': anula-a e faz outra' : ''}.`, 'estado');
  const pr = problemasTr(x); if (pr.length) throw recusa(pr[0]);
  Object.assign(d, { data: x.data, origem: x.origem, destino: x.destino, notas: x.notas.trim(), linhas: comIdsTr(x.linhas), alterado: p, versao: d.versao + 1 });
  d.historico.push(evInv(agora(), p, 'Gravou', `${d.linhas.length} ${d.linhas.length === 1 ? 'artigo' : 'artigos'} · ${rota(d)}`));
  gravar(); return d;
}
/** Lançar: sai da origem e entra no destino, tudo ou nada; nunca deixa a origem negativa. */
export function lancarTr(p: IdPerfil, ref: string): DocTr {
  recarregar();
  const d = transferencia(ref); const porque = porqueLancarTr(p, d); if (porque) throw new Recusa(porque, d ? 'estado' : 'validacao');
  lancarNoStock(movsTr(d!));
  d!.estado = 'Lançado'; d!.lancado = agora(); d!.alterado = p; d!.versao++;
  d!.historico.push(evInv(d!.lancado, p, 'Lançou no stock', `${quantidadeTr(d!).toLocaleString('pt-PT')} unidades · ${rota(d!)}`));
  gravar(); return d!;
}
/** Anular: fica, anulada; se estava lançada, volta tudo à origem (se o destino ainda o tiver). */
export function anularTr(p: IdPerfil, ref: string, motivo: string): DocTr {
  recarregar();
  if (!podeInv(p, 'anular')) throw new Recusa('O teu perfil não anula documentos de stock.', 'permissao');
  const d = transferencia(ref); if (!d) throw new Recusa('A transferência já não existe.', 'estado');
  if (d.estado === 'Anulado') throw new Recusa('Já está anulada.', 'estado');
  if (!motivo.trim()) throw new Recusa('Diz porque se anula: fica no histórico.');
  const lancada = d.estado === 'Lançado';
  if (lancada) {
    const f = faltasNaOrigem({ origem: d.destino, linhas: d.linhas });
    if (f.length) throw new Recusa(`O ${armazemDe(d.destino)} já não tem ${f[0].ref} que chegue para voltar (tem ${f[0].ha}, a transferência levou ${f[0].qtd}): faz uma transferência de acerto.`, 'estado');
    lancarNoStock(movsTr(d, -1, ':anular'));
  }
  d.estado = 'Anulado'; d.anulado = { quando: agora(), por: p, motivo: motivo.trim() }; d.alterado = p; d.versao++;
  d.historico.push(evInv(d.anulado.quando, p, 'Anulou', `${motivo.trim()}${lancada ? ' · tudo voltou à origem' : ''}`));
  gravar(); return d;
}

/* ---------- permissões ---------- */
export type AcaoInv = 'criar' | 'editar' | 'lancar' | 'anular';
const PODE: Record<AcaoInv, IdPerfil[]> = { criar: ['armazem', 'compras', 'admin'], editar: ['armazem', 'compras', 'admin'], lancar: ['armazem', 'compras', 'admin'], anular: ['armazem', 'compras', 'admin'] };
export const podeInv = (p: IdPerfil, a: AcaoInv) => PODE[a].includes(p);
/** O inventário lançado do armazém (outro que não este), se houver. */
const lancadoDoArmazem = (armazem: string, menos = '') => db().docs.find((d) => d.armazem === armazem && d.estado === 'Lançado' && d.ref !== menos);

/** Porque não se lança (vazio = pode). */
export function porqueLancar(p: IdPerfil, d: DocInv | undefined): string {
  if (!d) return 'Escolhe um documento na lista.';
  if (!podeInv(p, 'lancar')) return 'O teu perfil só consulta os documentos de stock.';
  if (d.estado === 'Lançado') return `Já foi lançado no stock a ${d.lancado}.`;
  if (d.estado === 'Anulado') return 'O documento está anulado.';
  if (!d.linhas.length) return 'O documento não tem artigos.';
  const outro = lancadoDoArmazem(d.armazem, d.ref);
  if (outro) return `O ${armazemDe(d.armazem)} já tem o inventário inicial ${outro.ref} lançado: anula-o primeiro.`;
  return '';
}

/* ---------- escrever ---------- */
export interface Pedido { data: string; armazem: string; notas: string; linhas: { ref: string; qtd: number; custo: number }[] }
/** Os problemas de um documento antes de gravar (vazio = pode). */
export function problemasInv(x: Pedido): { msg: string; campo: string }[] {
  const ps: { msg: string; campo: string }[] = [];
  if (!ARMAZENS.some((a) => a.cod === x.armazem)) ps.push({ msg: 'Escolhe o armazém.', campo: 'armazem' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(x.data)) ps.push({ msg: 'A data de emissão é uma data, ex.: 19/10/2026.', campo: 'data' });
  else if (x.data > HOJE) ps.push({ msg: 'A data de emissão não pode ser depois de hoje.', campo: 'data' });
  if (!x.linhas.length) ps.push({ msg: 'O inventário precisa de pelo menos um artigo.', campo: 'art-0' });
  const vistos = new Set<string>();
  x.linhas.forEach((l, i) => {
    if (!artigo(l.ref)) ps.push({ msg: l.ref ? `«${l.ref}» não é um artigo conhecido.` : 'Escreve o artigo de cada linha.', campo: `art-${i}` });
    else if (vistos.has(l.ref)) ps.push({ msg: `${l.ref} já está noutra linha: junta as quantidades numa só.`, campo: `art-${i}` });
    vistos.add(l.ref);
    if (!Number.isInteger(l.qtd) || l.qtd < 0) ps.push({ msg: `${l.ref || `Linha ${i + 1}`}: a quantidade é um número inteiro, zero ou mais.`, campo: `qtd-${i}` });
    if (!Number.isInteger(l.custo) || l.custo < 0) ps.push({ msg: `${l.ref || `Linha ${i + 1}`}: o custo unitário é um valor em euros, ex.: 4,12.`, campo: `cus-${i}` });
  });
  return ps;
}
const recusa = (p: { msg: string; campo: string }) => Object.assign(new Recusa(p.msg), { campo: p.campo });
const comIds = (ls: Pedido['linhas']): LinhaInv[] => ls.map((l, i) => ({ id: String.fromCharCode(97 + i), ...l }));

export function criarInv(p: IdPerfil, x: Pedido): DocInv {
  recarregar();
  if (!podeInv(p, 'criar')) throw new Recusa('O teu perfil não faz documentos de stock.', 'permissao');
  const pr = problemasInv(x); if (pr.length) throw recusa(pr[0]);
  const d: DocInv = { ref: proximo('II 2026'), data: x.data, armazem: x.armazem, notas: x.notas.trim(), estado: 'Rascunho', linhas: comIds(x.linhas), criador: p, alterado: p, versao: 1,
    historico: [evInv(agora(), p, 'Criou o rascunho', `${x.linhas.length} ${x.linhas.length === 1 ? 'artigo' : 'artigos'} · ${armazemDe(x.armazem)}`)] };
  db().docs.push(d); gravar(); return d;
}
export function guardarInv(p: IdPerfil, ref: string, x: Pedido, versao: number): DocInv {
  recarregar();
  if (!podeInv(p, 'editar')) throw new Recusa('O teu perfil não altera documentos de stock.', 'permissao');
  const d = inventario(ref); if (!d) throw new Recusa('O documento já não existe.', 'estado');
  if (d.versao !== versao) throw new Recusa(`Outra pessoa alterou o ${d.ref} entretanto: fecha e abre outra vez para ver a versão atual.`, 'conflito');
  if (d.estado !== 'Rascunho') throw new Recusa(`Um documento «${d.estado}» não se altera${d.estado === 'Lançado' ? ': anula-o e faz outro' : ''}.`, 'estado');
  const pr = problemasInv(x); if (pr.length) throw recusa(pr[0]);
  const antes = valorTotal(d);
  Object.assign(d, { data: x.data, armazem: x.armazem, notas: x.notas.trim(), linhas: comIds(x.linhas), alterado: p, versao: d.versao + 1 });
  d.historico.push(evInv(agora(), p, 'Gravou', `${d.linhas.length} ${d.linhas.length === 1 ? 'artigo' : 'artigos'} · ${(antes / 100).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} € → ${(valorTotal(d) / 100).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} €`));
  gravar(); return d;
}
/** Lançar: as quantidades entram no stock do armazém, todas ou nenhuma. */
export function lancarInv(p: IdPerfil, ref: string): DocInv {
  recarregar();
  const d = inventario(ref); const porque = porqueLancar(p, d); if (porque) throw new Recusa(porque, d ? 'estado' : 'validacao');
  if (!d!.base) lancarNoStock(d!.linhas.filter((l) => l.qtd).map((l) => ({ ref: l.ref, qtd: l.qtd, armazem: armazemDe(d!.armazem), origem: d!.ref, chave: `${d!.ref}:${l.id}` })));
  d!.estado = 'Lançado'; d!.lancado = agora(); d!.alterado = p; d!.versao++;
  d!.historico.push(evInv(d!.lancado, p, 'Lançou no stock', `${quantidade(d!).toLocaleString('pt-PT')} unidades · ${armazemDe(d!.armazem)}`));
  gravar(); return d!;
}
/** Anular: o documento fica, anulado; se estava lançado, as quantidades saem do stock. */
export function anularInv(p: IdPerfil, ref: string, motivo: string): DocInv {
  recarregar();
  if (!podeInv(p, 'anular')) throw new Recusa('O teu perfil não anula documentos de stock.', 'permissao');
  const d = inventario(ref); if (!d) throw new Recusa('O documento já não existe.', 'estado');
  if (d.estado === 'Anulado') throw new Recusa('Já está anulado.', 'estado');
  if (!motivo.trim()) throw new Recusa('Diz porque se anula: fica no histórico.');
  const lancado = d.estado === 'Lançado';
  if (lancado) lancarNoStock(d.linhas.filter((l) => l.qtd).map((l) => ({ ref: l.ref, qtd: -l.qtd, armazem: armazemDe(d.armazem), origem: d.ref, chave: `${d.ref}:anular:${l.id}` })));
  d.estado = 'Anulado'; d.anulado = { quando: agora(), por: p, motivo: motivo.trim() }; d.alterado = p; d.versao++;
  d.historico.push(evInv(d.anulado.quando, p, 'Anulou', `${motivo.trim()}${lancado ? ' · as quantidades saíram do stock' : ''}`));
  gravar(); return d;
}
