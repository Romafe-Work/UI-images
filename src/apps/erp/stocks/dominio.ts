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
export const ARMAZENS: { cod: string; nome: string }[] = [
  { cod: '60', nome: ARMAZEM }, { cod: '10', nome: 'Armazém 10 · Porto' }, { cod: '20', nome: 'Armazém 20 · Sacavém' },
];
export const armazemDe = (cod: string) => ARMAZENS.find((a) => a.cod === cod)?.nome ?? cod;

export type EstadoInv = 'Rascunho' | 'Lançado' | 'Anulado';
export interface LinhaInv { id: string; ref: string; qtd: number; custo: number }
export interface EventoInv { quando: string; quem: string; acao: string; detalhe?: string }
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
    { ref: 'II 2026/0002', data: '2026-10-16', armazem: '10', notas: 'Abertura do armazém 10: contagem de 15/10.', estado: 'Rascunho',
      linhas: [{ id: 'a', ref: '6205-2Z', qtd: 240, custo: 344 }, { id: 'b', ref: 'GDB1330', qtd: 36, custo: 1530 }, { id: 'c', ref: 'BKR6E', qtd: 120, custo: 395 }, { id: 'd', ref: '23.443.00', qtd: 80, custo: 480 }],
      criador: 'armazem', alterado: 'armazem', versao: 2, historico: [evInv('16/10/2026 10:05', 'armazem', 'Criou o rascunho'), evInv('16/10/2026 11:30', 'armazem', 'Gravou', '4 artigos')] },
  ];
  return { docs, series: { 'II 2026': 2 } as Record<string, number> };
}

/* ---------- a «base de dados» ---------- */
const CHAVE = 'erp:stocks:v1';
type Base = ReturnType<typeof semente>;
let base: Base | null = null;
function ler(): Base { try { const v = localStorage.getItem(CHAVE); if (v) return JSON.parse(v) as Base; } catch { /* sem armazenamento */ } return semente(); }
const db = (): Base => { if (!base) base = ler(); return base; };
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
