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
/** 18 nov.: um ajustamento em valor — muda o custo dos artigos sem mexer nas quantidades. `atual` e `qtd` ficam
    guardados no lançamento (o custo e o stock de então); num rascunho calculam-se na hora. */
export interface LinhaAj { id: string; ref: string; novo: number; atual?: number; qtd?: number }
export interface DocAj {
  ref: string; data: string; notas: string; estado: EstadoInv; linhas: LinhaAj[];
  criador: IdPerfil; alterado: IdPerfil; lancado?: string; anulado?: { quando: string; por: IdPerfil; motivo: string }; historico: EventoInv[]; versao: number;
}
/** 18 nov.: os Acréscimos (AC, entram) e as Perdas (QB, as «Quebras» do antigo, saem) — quantidades num armazém. */
export type TipoMov = 'AC' | 'QB';
export interface LinhaMov { id: string; ref: string; qtd: number; custo: number }
export interface DocMov {
  ref: string; tipo: TipoMov; data: string; armazem: string; notas: string; estado: EstadoInv; linhas: LinhaMov[];
  criador: IdPerfil; alterado: IdPerfil; lancado?: string; anulado?: { quando: string; por: IdPerfil; motivo: string }; historico: EventoInv[]; versao: number;
}
/** 18 nov. (ela: «transferências entre artigos — nem devia ser um screen, devia ser algo no header do stock»): passar
    quantidade de um artigo para outro no mesmo armazém, a partir do painel Stock; fica registado (TT). */
export interface PassagemArtigo { ref: string; quando: string; por: IdPerfil; armazem: string; de: string; para: string; qtd: number; notas: string }
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
  /* 18 nov. (ela: «coloca mais exemplos na tabela»): os outros armazéns, documentos anulados e o ano anterior */
  const I = (ref: string, data: string, armazem: string, notas: string, estado: EstadoInv, ls: [string, number][], quem: IdPerfil, extra: Partial<DocInv> = {}): DocInv => {
    const linhas = ls.map(([r_, q], i) => ({ id: String.fromCharCode(97 + i), ref: r_, qtd: q, custo: artigo(r_)?.preco ?? 0 }));
    const dt = `${data.slice(8, 10)}/${data.slice(5, 7)}/${data.slice(0, 4)}`;
    const hist = [evInv(`${dt} 09:00`, quem, 'Criou o rascunho'), evInv(`${dt} 11:00`, quem, 'Gravou', `${linhas.length} artigos`)];
    if (estado === 'Lançado') hist.push(evInv(`${dt} 17:30`, quem, 'Lançou no stock', armazemDe(armazem)));
    if (estado === 'Anulado' && extra.anulado) hist.push(evInv(extra.anulado.quando, extra.anulado.por, 'Anulou', extra.anulado.motivo));
    return { ref, data, armazem, notas, estado, linhas, criador: quem, alterado: quem, versao: hist.length, historico: hist, ...(estado === 'Lançado' ? { lancado: `${dt} 17:30` } : {}), ...extra };
  };
  docs.push(
    I('II 2026/0003', '2026-02-03', '1', 'Abertura do armazém 1 (Porto): contagem de 31/01.', 'Lançado', [['6205-2Z', 180], ['6206-2RSH', 60], ['30205', 24], ['GDB1330', 18], ['BKR6E', 90], ['27.A44.00', 40]], 'armazem'),
    I('II 2026/0004', '2026-03-02', '88', 'Material reservado: Portucel-Viana e Soporcel.', 'Lançado', [['VKBA 6556', 12], ['LGMT 2/1', 10], ['6PK1050', 16]], 'armazem'),
    I('II 2026/0005', '2026-03-09', '99', 'Encomendas programadas — primeira contagem.', 'Anulado', [['K015603XS', 4], ['826210', 2]], 'compras', { anulado: { quando: '10/03/2026 09:15', por: 'armazem', motivo: 'Contagem incompleta: faltou a prateleira 3.' } }),
    I('II 2026/0006', '2026-03-12', '99', 'Encomendas programadas — contagem de 11/03.', 'Lançado', [['K015603XS', 6], ['826210', 2], ['P 85 020', 20], ['09.A727.11', 8]], 'armazem'),
    I('II 2026/0007', '2026-10-15', '1', 'Recontagem do armazém 1 (só rolamentos).', 'Rascunho', [['6205-2Z', 176], ['6206-2RSH', 58], ['30205', 24]], 'armazem'),
    I('II 2025/0001', '2025-01-03', '60', 'Abertura do ano 2025: contagem de 31/12/2024.', 'Anulado', [['6205-2Z', 1100], ['BKR6E', 380], ['23.443.00', 300]], 'armazem', { anulado: { quando: '02/01/2026 09:00', por: 'armazem', motivo: 'Substituído pelo inventário de 2026.' } }),
    I('II 2025/0002', '2025-01-08', '2', 'Abertura do armazém 2 (Porto Cliente).', 'Anulado', [['GDB1330', 12], ['P 85 020', 10]], 'compras', { anulado: { quando: '20/01/2025 15:40', por: 'armazem', motivo: 'O armazém 2 só abriu em outubro de 2026.' } }),
  );
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
    ...([
      ['TA 2026/0006', '2026-02-10', '1', '2', 'Rolamentos Portucel-Viana', 'Lançado', [['6206-2RSH', 12], ['30205', 4]], 'armazem'],
      ['TA 2026/0007', '2026-02-24', '60', '1', 'Correias Soporcel', 'Lançado', [['6PK1050', 10]], 'armazem'],
      ['TA 2026/0008', '2026-03-05', '1', '88', 'ARSOPI', 'Lançado', [['GDB1330', 6], ['BKR6E', 20]], 'compras'],
      ['TA 2026/0009', '2026-03-05', '88', '1', 'Anulação movimento', 'Anulado', [['BKR6E', 20]], 'armazem'],
      ['TA 2026/0010', '2026-04-14', '60', '2', 'Troca', 'Lançado', [['P 85 020', 8], ['27.A44.00', 12]], 'armazem'],
      ['TA 2026/0011', '2026-06-02', '60', '1', 'Rolamentos SNA Europe', 'Lançado', [['6206-2RSH', 20], ['VKBA 6556', 6]], 'armazem'],
      ['TA 2026/0012', '2026-07-02', '1', '60', 'Acerto armazém', 'Lançado', [['27.A44.00', 10]], 'armazem'],
      ['TA 2026/0013', '2026-09-30', '99', '60', 'Encomenda programada entregue', 'Lançado', [['P 85 020', 6]], 'compras'],
      ['TA 2026/0014', '2026-10-14', '60', '1', 'Transferência SNR 5', 'Rascunho', [['6205-2Z', 80], ['LGMT 2/1', 6]], 'armazem'],
      ['TA 2026/0015', '2026-10-15', '2', '60', 'Devolução do Porto Cliente', 'Rascunho', [['GDB1330', 30]], 'compras'],
    ] as [string, string, string, string, string, EstadoInv, [string, number][], IdPerfil][]).map(([ref, data, origem, destino, notas, estado, ls, quem]): DocTr => {
      const dt = `${data.slice(8, 10)}/${data.slice(5, 7)}/${data.slice(0, 4)}`, linhas = ls.map(([r_, q], i) => L(String.fromCharCode(97 + i), r_, q));
      const hist = [h(`${dt} 10:00`, quem, 'Criou o rascunho')];
      if (estado === 'Lançado') hist.push(h(`${dt} 15:00`, quem, 'Lançou no stock', `${linhas.reduce((t, l) => t + l.qtd, 0)} unidades · ${origem} → ${destino}`));
      const anulado = estado === 'Anulado' ? { quando: `${dt} 16:00`, por: 'armazem' as IdPerfil, motivo: 'Lançada por engano: a ARSOPI levou do armazém 1.' } : undefined;
      if (anulado) hist.push(h(anulado.quando, 'armazem', 'Anulou', anulado.motivo));
      return { ref, data, origem, destino, notas, estado, linhas, criador: quem, alterado: estado === 'Anulado' ? 'armazem' : quem, versao: hist.length + 1, historico: hist, ...(estado === 'Lançado' ? { lancado: `${dt} 15:00` } : {}), ...(anulado ? { anulado } : {}) };
    }),
    { ref: 'TA 2026/0005', data: '2026-10-16', origem: '60', destino: '88', notas: 'Material reservado para a Portucel-Viana', estado: 'Rascunho', linhas: [L('a', '6205-2Z', 50), L('b', '23.443.00', 30), L('c', 'BKR6E', 24)], criador: 'armazem', alterado: 'armazem', versao: 2,
      historico: [h('16/10/2026 15:20', 'armazem', 'Criou o rascunho'), h('16/10/2026 15:45', 'armazem', 'Gravou', '3 artigos')] },
  ];
  /* 18 nov. (ela mostrou os Ajustamentos em Valor do ERP antigo): acertos e mudanças de referência, de entrada, desmontagens */
  const A = (ref: string, data: string, notas: string, estado: EstadoInv, ls: [string, number, number, number][], quem: IdPerfil, anulado?: DocAj['anulado']): DocAj => {
    const dt = `${data.slice(8, 10)}/${data.slice(5, 7)}/${data.slice(0, 4)}`;
    const linhas = ls.map(([r_, novo, atual, qtd], i): LinhaAj => ({ id: String.fromCharCode(97 + i), ref: r_, novo, ...(estado !== 'Rascunho' ? { atual, qtd } : {}) }));
    const hist = [h(`${dt} 09:30`, quem, 'Criou o rascunho')];
    if (estado !== 'Rascunho') hist.push(h(`${dt} 12:10`, quem, 'Lançou', `${linhas.length} ${linhas.length === 1 ? 'artigo' : 'artigos'}`));
    if (anulado) hist.push(h(anulado.quando, anulado.por, 'Anulou', `${anulado.motivo} · o custo voltou ao anterior`));
    return { ref, data, notas, estado, linhas, criador: quem, alterado: anulado?.por ?? quem, versao: hist.length + 1, historico: hist, ...(estado !== 'Rascunho' ? { lancado: `${dt} 12:10` } : {}), ...(anulado ? { anulado } : {}) };
  };
  const aj: DocAj[] = [
    A('AV 2026/0001', '2026-01-14', 'Acerto', 'Lançado', [['6206-2RSH', 405, 412, 140]], 'compras'),
    A('AV 2026/0002', '2026-03-02', 'Acerto de entrada', 'Lançado', [['P 85 020', 2350, 2300, 210]], 'compras'),
    A('AV 2026/0003', '2026-05-26', 'Troca de referência', 'Lançado', [['GDB1330', 1530, 1530, 30]], 'armazem'),
    A('AV 2026/0004', '2026-06-10', 'Desmontagem kit bujão — troca de armazém', 'Anulado', [['VKBA 6556', 4098, 4100, 64]], 'armazem', { quando: '11/06/2026 10:00', por: 'compras', motivo: 'O kit voltou a montar-se.' }),
    A('AV 2026/0005', '2026-09-14', 'Alteração de referência', 'Lançado', [['30205', 1590, 1550, 44]], 'compras'),
    A('AV 2026/0006', '2026-10-13', 'Mudar referência', 'Lançado', [['LGMT 2/1', 2520, 2500, 85], ['6PK1050', 1295, 1290, 72]], 'compras'),
    A('AV 2026/0007', '2026-10-16', 'Acerto de referência', 'Rascunho', [['BKR6E', 402, 0, 0], ['23.443.00', 470, 0, 0]], 'compras'),
    A('AV 2026/0008', '2026-10-18', 'Mudança de referência', 'Rascunho', [['6PK1050', 1310, 0, 0]], 'compras'),
  ];
  /* o custo de hoje de cada artigo: o último ajuste lançado (pela ordem dos documentos) */
  const custos: Record<string, number> = {};
  aj.filter((d) => d.estado === 'Lançado').forEach((d) => d.linhas.forEach((l) => { custos[l.ref] = l.novo; }));
  const M = (ref: string, tipo: TipoMov, data: string, armazem: string, notas: string, estado: EstadoInv, ls: [string, number][], quem: IdPerfil, anulado?: DocMov['anulado']): DocMov => {
    const dt = `${data.slice(8, 10)}/${data.slice(5, 7)}/${data.slice(0, 4)}`;
    const linhas = ls.map(([r_, q], i) => ({ id: String.fromCharCode(97 + i), ref: r_, qtd: q, custo: artigo(r_)?.preco ?? 0 }));
    const hist = [h(`${dt} 10:00`, quem, 'Criou o rascunho')];
    if (estado !== 'Rascunho') hist.push(h(`${dt} 16:30`, quem, 'Lançou no stock', `${linhas.reduce((t, l) => t + l.qtd, 0)} unidades · ${armazemDe(armazem)}`));
    if (anulado) hist.push(h(anulado.quando, anulado.por, 'Anulou', anulado.motivo));
    return { ref, tipo, data, armazem, notas, estado, linhas, criador: quem, alterado: anulado?.por ?? quem, versao: hist.length + 1, historico: hist, ...(estado !== 'Rascunho' ? { lancado: `${dt} 16:30` } : {}), ...(anulado ? { anulado } : {}) };
  };
  const mv: DocMov[] = [
    M('AC 2026/0001', 'AC', '2026-02-12', '60', 'Acerto de stock — sobra na contagem da zona 3', 'Lançado', [['6206-2RSH', 4]], 'armazem'),
    M('AC 2026/0002', 'AC', '2026-04-08', '1', 'Devolução de cliente sem documento', 'Lançado', [['GDB1330', 2], ['BKR6E', 8]], 'armazem'),
    M('AC 2026/0003', 'AC', '2026-06-19', '60', 'Peças encontradas na receção', 'Anulado', [['P 85 020', 6]], 'armazem', { quando: '20/06/2026 09:30', por: 'compras', motivo: 'Eram da encomenda EF 2026/0398: entram pela guia.' }),
    M('AC 2026/0004', 'AC', '2026-08-24', '60', 'Acerto de stock — contagem cíclica', 'Lançado', [['27.A44.00', 3], ['LGMT 2/1', 1]], 'armazem'),
    M('AC 2026/0005', 'AC', '2026-09-03', '88', 'Material devolvido pela obra', 'Lançado', [['VKBA 6556', 2]], 'compras'),
    M('AC 2026/0006', 'AC', '2026-10-15', '60', 'Acerto de stock — sobra no corredor 2', 'Rascunho', [['6205-2Z', 12], ['23.443.00', 5]], 'armazem'),
    M('QB 2026/0001', 'QB', '2026-08-24', '60', 'Acerto de stock — contagem cíclica', 'Lançado', [['6205-2Z', 3]], 'armazem'),
    M('QB 2026/0002', 'QB', '2026-08-25', '1', 'Acerto de stock — embalagem danificada', 'Lançado', [['27.A44.00', 2]], 'armazem'),
    M('QB 2026/0003', 'QB', '2026-08-26', '60', 'Acerto de stock — rolamento com ferrugem', 'Lançado', [['6206-2RSH', 2], ['VKBA 6556', 1]], 'armazem'),
    M('QB 2026/0004', 'QB', '2026-08-27', '60', 'Acerto de stock — amostra para cliente', 'Lançado', [['BKR6E', 4]], 'compras'),
    M('QB 2026/0005', 'QB', '2026-08-28', '60', 'Acerto de stock — queda no cais', 'Lançado', [['09.A727.11', 1], ['P 85 020', 2]], 'armazem'),
    M('QB 2026/0006', 'QB', '2026-08-31', '60', 'Acerto de stock — Lisnave, extravio', 'Lançado', [['23.443.00', 5]], 'armazem'),
    M('QB 2026/0007', 'QB', '2026-08-31', '1', 'Acerto de stock — contagem', 'Anulado', [['6205-2Z', 10]], 'armazem', { quando: '01/09/2026 08:40', por: 'armazem', motivo: 'As peças estavam na prateleira de cima.' }),
    M('QB 2026/0008', 'QB', '2026-09-15', '60', 'Acerto de stock — validade da massa', 'Lançado', [['LGMT 2/1', 2]], 'armazem'),
    M('QB 2026/0009', 'QB', '2026-10-12', '99', 'Acerto de stock — peça partida na montagem', 'Lançado', [['09.A727.11', 1]], 'compras'),
    M('QB 2026/0010', 'QB', '2026-10-16', '60', 'Acerto de stock — extravio na expedição', 'Rascunho', [['6PK1050', 2], ['BKR6E', 6]], 'armazem'),
  ];
  return { docs, tr, aj, mv, ta: [] as PassagemArtigo[], custos, series: { 'II 2026': 7, 'II 2025': 2, 'TA 2026': 15, 'AV 2026': 8, 'AC 2026': 6, 'QB 2026': 10, 'TT 2026': 0 } as Record<string, number> };
}

/* ---------- a «base de dados» ---------- */
const CHAVE = 'erp:stocks:v5';
type Base = ReturnType<typeof semente>;
let base: Base | null = null;
function ler(): Base { try { const v = localStorage.getItem(CHAVE); if (v) return JSON.parse(v) as Base; } catch { /* sem armazenamento */ } return semente(); }
/* as transferências da semente já lançadas entram no stock uma vez (idempotente pela chave), como se tivessem sido lançadas */
let sincronizado = false;
const db = (): Base => {
  if (!base) base = ler();
  if (!sincronizado) {
    sincronizado = true;
    /* os inventários dos outros armazéns entram antes das transferências que saem deles */
    const inv = base.docs.filter((d) => d.estado === 'Lançado' && !d.base).flatMap((d) => d.linhas.filter((l) => l.qtd).map((l) => ({ ref: l.ref, qtd: l.qtd, armazem: armazemDe(d.armazem), origem: d.ref, chave: `${d.ref}:${l.id}` })));
    const tr = base.tr.filter((t) => t.estado === 'Lançado').flatMap((t) => movsTr(t));
    const mv = base.mv.filter((m) => m.estado === 'Lançado').flatMap((m) => movsMov(m));
    if (inv.length || tr.length || mv.length) lancarNoStock([...inv, ...tr, ...mv]);
  }
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
/** O custo de um artigo: o do último ajustamento em valor lançado; sem ele, o último preço do fornecedor. */
export const custoDe = (ref: string) => db().custos[ref] ?? artigo(ref)?.preco ?? 0;
/** O stock de um artigo em todos os armazéns (o ajustamento em valor é do artigo, não de um armazém). */
export const stockTotal = (ref: string) => ARMAZENS.reduce((t, a) => t + stockEm(ref, a.nome), 0);
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

/* ---------- ajustamentos em valor (18 nov.) ---------- */
export const ajustamentos = () => db().aj.slice().sort((a, b) => b.ref.localeCompare(a.ref));
export const ajustamento = (ref: string) => db().aj.find((d) => d.ref === ref);
/** O custo antes, a quantidade e a diferença de uma linha: as guardadas no lançamento, ou as de agora num rascunho. */
export const linhaAj = (d: Pick<DocAj, 'estado'>, l: LinhaAj) => { const atual = d.estado === 'Rascunho' || l.atual === undefined ? custoDe(l.ref) : l.atual, qtd = d.estado === 'Rascunho' || l.qtd === undefined ? stockTotal(l.ref) : l.qtd; return { atual, qtd, dif: qtd * (l.novo - atual) }; };
export const valorAj = (d: DocAj) => d.linhas.reduce((t, l) => t + linhaAj(d, l).dif, 0);
export function porqueLancarAj(p: IdPerfil, d: DocAj | undefined): string {
  if (!d) return 'Escolhe um ajustamento na lista.';
  if (!podeInv(p, 'lancar')) return 'O teu perfil só consulta os documentos de stock.';
  if (d.estado === 'Lançado') return `Já foi lançado a ${d.lancado}.`;
  if (d.estado === 'Anulado') return 'O ajustamento está anulado.';
  if (!d.linhas.length) return 'O ajustamento não tem artigos.';
  return '';
}
export interface PedidoAj { data: string; notas: string; linhas: { ref: string; novo: number }[] }
export function problemasAj(x: PedidoAj): { msg: string; campo: string }[] {
  const ps: { msg: string; campo: string }[] = [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(x.data)) ps.push({ msg: 'A data de emissão é uma data, ex.: 19/10/2026.', campo: 'data' });
  else if (x.data > HOJE) ps.push({ msg: 'A data de emissão não pode ser depois de hoje.', campo: 'data' });
  if (!x.notas.trim()) ps.push({ msg: 'Diz porque se ajusta (observações): fica no documento.', campo: 'notas' });
  if (!x.linhas.length) ps.push({ msg: 'O ajustamento precisa de pelo menos um artigo.', campo: 'art-0' });
  const vistos = new Set<string>();
  x.linhas.forEach((l, i) => {
    if (!artigo(l.ref)) ps.push({ msg: l.ref ? `«${l.ref}» não é um artigo conhecido.` : 'Escreve o artigo de cada linha.', campo: `art-${i}` });
    else if (vistos.has(l.ref)) ps.push({ msg: `${l.ref} já está noutra linha.`, campo: `art-${i}` });
    vistos.add(l.ref);
    if (!Number.isInteger(l.novo) || l.novo < 0) ps.push({ msg: `${l.ref || `Linha ${i + 1}`}: o custo novo é um valor em euros, ex.: 4,12.`, campo: `nov-${i}` });
  });
  return ps;
}
export function criarAj(p: IdPerfil, x: PedidoAj): DocAj {
  recarregar();
  if (!podeInv(p, 'criar')) throw new Recusa('O teu perfil não faz documentos de stock.', 'permissao');
  const pr = problemasAj(x); if (pr.length) throw recusa(pr[0]);
  const d: DocAj = { ref: proximo('AV 2026'), data: x.data, notas: x.notas.trim(), estado: 'Rascunho', linhas: x.linhas.map((l, i) => ({ id: String.fromCharCode(97 + i), ...l })), criador: p, alterado: p, versao: 1,
    historico: [evInv(agora(), p, 'Criou o rascunho', `${x.linhas.length} ${x.linhas.length === 1 ? 'artigo' : 'artigos'}`)] };
  db().aj.push(d); gravar(); return d;
}
export function guardarAj(p: IdPerfil, ref: string, x: PedidoAj, versao: number): DocAj {
  recarregar();
  if (!podeInv(p, 'editar')) throw new Recusa('O teu perfil não altera documentos de stock.', 'permissao');
  const d = ajustamento(ref); if (!d) throw new Recusa('O ajustamento já não existe.', 'estado');
  if (d.versao !== versao) throw new Recusa(`Outra pessoa alterou o ${d.ref} entretanto: fecha e abre outra vez para ver a versão atual.`, 'conflito');
  if (d.estado !== 'Rascunho') throw new Recusa(`Um ajustamento «${d.estado}» não se altera${d.estado === 'Lançado' ? ': anula-o e faz outro' : ''}.`, 'estado');
  const pr = problemasAj(x); if (pr.length) throw recusa(pr[0]);
  Object.assign(d, { data: x.data, notas: x.notas.trim(), linhas: x.linhas.map((l, i) => ({ id: String.fromCharCode(97 + i), ...l })), alterado: p, versao: d.versao + 1 });
  d.historico.push(evInv(agora(), p, 'Gravou', `${d.linhas.length} ${d.linhas.length === 1 ? 'artigo' : 'artigos'}`));
  gravar(); return d;
}
/** Lançar: guarda o custo e o stock de agora em cada linha e o custo novo passa a ser o do artigo. */
export function lancarAj(p: IdPerfil, ref: string): DocAj {
  recarregar();
  const d = ajustamento(ref); const porque = porqueLancarAj(p, d); if (porque) throw new Recusa(porque, d ? 'estado' : 'validacao');
  d!.linhas.forEach((l) => { l.atual = custoDe(l.ref); l.qtd = stockTotal(l.ref); });
  d!.linhas.forEach((l) => { db().custos[l.ref] = l.novo; });
  d!.estado = 'Lançado'; d!.lancado = agora(); d!.alterado = p; d!.versao++;
  const v = valorAj(d!);
  d!.historico.push(evInv(d!.lancado, p, 'Lançou', `${d!.linhas.length} ${d!.linhas.length === 1 ? 'artigo' : 'artigos'} · ${v < 0 ? '−' : '+'}${(Math.abs(v) / 100).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} € no valor do stock`));
  gravar(); return d!;
}
/** Anular: o custo volta ao anterior — só se nenhum ajuste posterior o mudou entretanto. */
export function anularAj(p: IdPerfil, ref: string, motivo: string): DocAj {
  recarregar();
  if (!podeInv(p, 'anular')) throw new Recusa('O teu perfil não anula documentos de stock.', 'permissao');
  const d = ajustamento(ref); if (!d) throw new Recusa('O ajustamento já não existe.', 'estado');
  if (d.estado === 'Anulado') throw new Recusa('Já está anulado.', 'estado');
  if (!motivo.trim()) throw new Recusa('Diz porque se anula: fica no histórico.');
  const lancado = d.estado === 'Lançado';
  if (lancado) {
    const mudou = d.linhas.find((l) => custoDe(l.ref) !== l.novo);
    if (mudou) throw new Recusa(`Um ajustamento posterior já mudou o custo de ${mudou.ref}: anula esse primeiro.`, 'estado');
    d.linhas.forEach((l) => { if (l.atual !== undefined) db().custos[l.ref] = l.atual; });
  }
  d.estado = 'Anulado'; d.anulado = { quando: agora(), por: p, motivo: motivo.trim() }; d.alterado = p; d.versao++;
  d.historico.push(evInv(d.anulado.quando, p, 'Anulou', `${motivo.trim()}${lancado ? ' · o custo voltou ao anterior' : ''}`));
  gravar(); return d;
}

/* ---------- acréscimos e perdas (18 nov.) ---------- */
export const NOME_MOV: Record<TipoMov, { um: string; o: 'o' | 'a'; entra: boolean }> = { AC: { um: 'acréscimo', o: 'o', entra: true }, QB: { um: 'perda', o: 'a', entra: false } };
export const movimentos = (t: TipoMov) => db().mv.filter((m) => m.tipo === t).sort((a, b) => b.ref.localeCompare(a.ref));
export const movimento = (ref: string) => db().mv.find((m) => m.ref === ref);
export const valorMov = (d: Pick<DocMov, 'linhas'>) => d.linhas.reduce((t, l) => t + l.qtd * l.custo, 0);
export const quantidadeMov = (d: Pick<DocMov, 'linhas'>) => d.linhas.reduce((t, l) => t + l.qtd, 0);
function movsMov(d: DocMov, sinal = 1, sufixo = '') {
  const s = (NOME_MOV[d.tipo].entra ? 1 : -1) * sinal;
  return d.linhas.filter((l) => l.qtd).map((l) => ({ ref: l.ref, qtd: s * l.qtd, armazem: armazemDe(d.armazem), origem: d.ref, chave: `${d.ref}${sufixo}:${l.id}` }));
}
/** As linhas que tiram mais do que há no armazém (perda a lançar, ou acréscimo lançado a anular). */
const semStock = (armazem: string, ls: { ref: string; qtd: number }[]) => ls.map((l) => ({ ...l, ha: stockEm(l.ref, armazemDe(armazem)) })).filter((x) => x.qtd > x.ha);
export function porqueLancarMov(p: IdPerfil, d: DocMov | undefined): string {
  if (!d) return 'Escolhe um documento na lista.';
  const n = NOME_MOV[d.tipo];
  if (!podeInv(p, 'lancar')) return 'O teu perfil só consulta os documentos de stock.';
  if (d.estado === 'Lançado') return `Já foi lançad${n.o} no stock a ${d.lancado}.`;
  if (d.estado === 'Anulado') return `${n.o === 'a' ? 'A' : 'O'} ${n.um} está anulad${n.o}.`;
  if (!d.linhas.length) return 'O documento não tem artigos.';
  if (!n.entra) { const f = semStock(d.armazem, d.linhas); if (f.length) return `Não há stock que chegue no ${armazemDe(d.armazem)}: ${f[0].ref} perde ${f[0].qtd} e há ${f[0].ha}.`; }
  return '';
}
export interface PedidoMov { data: string; armazem: string; notas: string; linhas: { ref: string; qtd: number; custo: number }[] }
export function problemasMov(x: PedidoMov): { msg: string; campo: string }[] {
  const ps: { msg: string; campo: string }[] = [];
  if (!ARMAZENS.some((a) => a.cod === x.armazem)) ps.push({ msg: 'Escolhe o armazém.', campo: 'armazem' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(x.data)) ps.push({ msg: 'A data de emissão é uma data, ex.: 19/10/2026.', campo: 'data' });
  else if (x.data > HOJE) ps.push({ msg: 'A data de emissão não pode ser depois de hoje.', campo: 'data' });
  if (!x.notas.trim()) ps.push({ msg: 'Diz o motivo (observações): fica no documento.', campo: 'notas' });
  if (!x.linhas.length) ps.push({ msg: 'O documento precisa de pelo menos um artigo.', campo: 'art-0' });
  const vistos = new Set<string>();
  x.linhas.forEach((l, i) => {
    if (!artigo(l.ref)) ps.push({ msg: l.ref ? `«${l.ref}» não é um artigo conhecido.` : 'Escreve o artigo de cada linha.', campo: `art-${i}` });
    else if (vistos.has(l.ref)) ps.push({ msg: `${l.ref} já está noutra linha: junta as quantidades numa só.`, campo: `art-${i}` });
    vistos.add(l.ref);
    if (!Number.isInteger(l.qtd) || l.qtd <= 0) ps.push({ msg: `${l.ref || `Linha ${i + 1}`}: a quantidade é um número inteiro maior do que zero.`, campo: `qtd-${i}` });
    if (!Number.isInteger(l.custo) || l.custo < 0) ps.push({ msg: `${l.ref || `Linha ${i + 1}`}: o custo unitário é um valor em euros, ex.: 4,12.`, campo: `cus-${i}` });
  });
  return ps;
}
export function criarMov(p: IdPerfil, tipo: TipoMov, x: PedidoMov): DocMov {
  recarregar();
  if (!podeInv(p, 'criar')) throw new Recusa('O teu perfil não faz documentos de stock.', 'permissao');
  const pr = problemasMov(x); if (pr.length) throw recusa(pr[0]);
  const d: DocMov = { ref: proximo(`${tipo} 2026`), tipo, data: x.data, armazem: x.armazem, notas: x.notas.trim(), estado: 'Rascunho', linhas: x.linhas.map((l, i) => ({ id: String.fromCharCode(97 + i), ...l })), criador: p, alterado: p, versao: 1,
    historico: [evInv(agora(), p, 'Criou o rascunho', `${x.linhas.length} ${x.linhas.length === 1 ? 'artigo' : 'artigos'} · ${armazemDe(x.armazem)}`)] };
  db().mv.push(d); gravar(); return d;
}
export function guardarMov(p: IdPerfil, ref: string, x: PedidoMov, versao: number): DocMov {
  recarregar();
  if (!podeInv(p, 'editar')) throw new Recusa('O teu perfil não altera documentos de stock.', 'permissao');
  const d = movimento(ref); if (!d) throw new Recusa('O documento já não existe.', 'estado');
  if (d.versao !== versao) throw new Recusa(`Outra pessoa alterou o ${d.ref} entretanto: fecha e abre outra vez para ver a versão atual.`, 'conflito');
  if (d.estado !== 'Rascunho') throw new Recusa(`Um documento «${d.estado}» não se altera${d.estado === 'Lançado' ? ': anula-se e faz-se outro' : ''}.`, 'estado');
  const pr = problemasMov(x); if (pr.length) throw recusa(pr[0]);
  Object.assign(d, { data: x.data, armazem: x.armazem, notas: x.notas.trim(), linhas: x.linhas.map((l, i) => ({ id: String.fromCharCode(97 + i), ...l })), alterado: p, versao: d.versao + 1 });
  d.historico.push(evInv(agora(), p, 'Gravou', `${d.linhas.length} ${d.linhas.length === 1 ? 'artigo' : 'artigos'}`));
  gravar(); return d;
}
export function lancarMov(p: IdPerfil, ref: string): DocMov {
  recarregar();
  const d = movimento(ref); const porque = porqueLancarMov(p, d); if (porque) throw new Recusa(porque, d ? 'estado' : 'validacao');
  lancarNoStock(movsMov(d!));
  d!.estado = 'Lançado'; d!.lancado = agora(); d!.alterado = p; d!.versao++;
  d!.historico.push(evInv(d!.lancado, p, 'Lançou no stock', `${NOME_MOV[d!.tipo].entra ? '+' : '−'}${quantidadeMov(d!)} unidades · ${armazemDe(d!.armazem)}`));
  gravar(); return d!;
}
export function anularMov(p: IdPerfil, ref: string, motivo: string): DocMov {
  recarregar();
  if (!podeInv(p, 'anular')) throw new Recusa('O teu perfil não anula documentos de stock.', 'permissao');
  const d = movimento(ref); if (!d) throw new Recusa('O documento já não existe.', 'estado');
  if (d.estado === 'Anulado') throw new Recusa('Já está anulado.', 'estado');
  if (!motivo.trim()) throw new Recusa('Diz porque se anula: fica no histórico.');
  const lancado = d.estado === 'Lançado';
  if (lancado) {
    if (NOME_MOV[d.tipo].entra) { const f = semStock(d.armazem, d.linhas); if (f.length) throw new Recusa(`O ${armazemDe(d.armazem)} já não tem ${f[0].ref} que chegue para tirar (tem ${f[0].ha}, entraram ${f[0].qtd}).`, 'estado'); }
    lancarNoStock(movsMov(d, -1, ':anular'));
  }
  d.estado = 'Anulado'; d.anulado = { quando: agora(), por: p, motivo: motivo.trim() }; d.alterado = p; d.versao++;
  d.historico.push(evInv(d.anulado.quando, p, 'Anulou', `${motivo.trim()}${lancado ? ` · ${NOME_MOV[d.tipo].entra ? 'as quantidades saíram do stock' : 'as quantidades voltaram ao stock'}` : ''}`));
  gravar(); return d;
}

/* ---------- passar de um artigo para outro (18 nov., no painel Stock) ---------- */
export const passagens = (ref?: string) => db().ta.filter((t) => !ref || t.de === ref || t.para === ref).slice().reverse();
export function passarArtigo(p: IdPerfil, x: { armazem: string; de: string; para: string; qtd: number; notas: string }): PassagemArtigo {
  recarregar();
  if (!podeInv(p, 'lancar')) throw new Recusa('O teu perfil só consulta o stock.', 'permissao');
  if (!ARMAZENS.some((a) => a.cod === x.armazem)) throw new Recusa('Escolhe o armazém.');
  if (!artigo(x.de)) throw new Recusa('O artigo de origem já não existe.');
  if (!artigo(x.para)) throw new Recusa(x.para ? `«${x.para}» não é um artigo conhecido.` : 'Escreve o artigo de destino.');
  if (x.de === x.para) throw new Recusa('O artigo de destino é o mesmo.');
  if (!Number.isInteger(x.qtd) || x.qtd <= 0) throw new Recusa('A quantidade é um número inteiro maior do que zero.');
  const ha = stockEm(x.de, armazemDe(x.armazem)); if (x.qtd > ha) throw new Recusa(`No ${armazemDe(x.armazem)} só há ${ha} de ${x.de}.`);
  const t: PassagemArtigo = { ref: proximo('TT 2026'), quando: agora(), por: p, armazem: x.armazem, de: x.de, para: x.para, qtd: x.qtd, notas: x.notas.trim() };
  lancarNoStock([{ ref: x.de, qtd: -x.qtd, armazem: armazemDe(x.armazem), origem: t.ref, chave: `${t.ref}:sai` }, { ref: x.para, qtd: x.qtd, armazem: armazemDe(x.armazem), origem: t.ref, chave: `${t.ref}:entra` }]);
  db().ta.push(t); gravar(); return t;
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
