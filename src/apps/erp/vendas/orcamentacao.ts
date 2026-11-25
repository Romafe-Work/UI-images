/* =========================================================
   ERP — Vendas: 80 · Orçamentação (25 nov. 2026). Ela mostrou a janela do ERP antigo «Gestão de Orçamentos de Clientes
   - Orçamentação» (Número, Data, Nr. Consulta, #Cliente, Nome, Fase, Aceite, Anulado, #Moeda, Valor, #Utilizador;
   Novo F5, Editar F6, Anular F8, Refrescar F9, Imprimir F11; F1 F2 F7 F10 F12, Shift+F1/F2; Ctrl+F9 Fluxo do documento,
   Anexos) e pediu: «para a parte da orçamentação em vendas, base e avançado no mesmo screen».
   O mesmo motor das listas de Stocks e Compras (compras/docs-v2.ts), com janelas. Junta:
     - Base e Avançada num ecrã só: o tipo é do orçamento (filtro, coluna e indicador). Na ficha, Base pede artigo,
       quantidade, preço e desconto; Avançada junta o 2.º desconto, o custo, a margem e o prazo de entrega por linha;
     - as fases do submenu do antigo numa coluna só: Orçamentação → Negociação → Fecho (Aceite sim ou não); Anular (F8)
       com motivo, nada se apaga; o Histórico é o filtro dos fechados e anulados;
     - Fluxo do documento (Ctrl+F9): consulta → orçamento → negociação → fecho → encomenda do cliente;
     - a pesquisa do antigo: Número (F1), Data (F2), Código do cliente (F10) e Nome (F12); a Nr. Consulta (o F7 do
       antigo) procura-se em «Contendo» no Nome, que inclui a consulta.
   Este ficheiro faz de API e de base de dados (localStorage), como os Stocks.
   ========================================================= */
import type { Ecra } from '../../../comum/tipos';
import type { IdErp } from '../ids';
import { registar, paginaDoc, BTN, L, esc, type CfgDoc, type Doc, type EstDoc, type Ficha } from '../compras/docs-v2';
import { toast, dialogo, fecharDialogo, tudo, ativoDe, nf, de } from '../compras/docs-v2-comportamento';
import { ARTIGOS, artigo, euros, dia, HOJE, Recusa, agora } from '../compras/dominio';
import { CLIENTES, cliente, precoVenda } from '../stocks/vendas';
import { custoDe } from '../stocks/dominio';
import { PERFIS, type IdPerfil } from '../inicio-dados';
import fileSpreadsheet from 'lucide-static/icons/file-spreadsheet.svg?raw';
import info from 'lucide-static/icons/info.svg?raw';
import list from 'lucide-static/icons/list.svg?raw';
import paperclip from 'lucide-static/icons/paperclip.svg?raw';
import xIc from 'lucide-static/icons/x.svg?raw';
import circleAlert from 'lucide-static/icons/circle-alert.svg?raw';
import circleCheck from 'lucide-static/icons/circle-check.svg?raw';
import circleX from 'lucide-static/icons/circle-x.svg?raw';
import clock from 'lucide-static/icons/clock.svg?raw';
import ban from 'lucide-static/icons/ban.svg?raw';
import plus from 'lucide-static/icons/plus.svg?raw';
import trash from 'lucide-static/icons/trash-2.svg?raw';
import save from 'lucide-static/icons/save.svg?raw';
import arrowLeft from 'lucide-static/icons/arrow-left.svg?raw';
import handshake from 'lucide-static/icons/handshake.svg?raw';
import flag from 'lucide-static/icons/flag.svg?raw';
import gitFork from 'lucide-static/icons/git-fork.svg?raw';
import chevR from 'lucide-static/icons/chevron-right.svg?raw';

/* ---------- o domínio ---------- */
export type TipoOrc = 'Base' | 'Avançada';
export type FaseOrc = 'Orçamentação' | 'Negociação' | 'Fecho';
export interface LinhaOrc { id: string; ref: string; qtd: number; preco: number; d1: number; d2: number; prazo: number }
interface Evento { quando: string; quem: string; acao: string; detalhe?: string }
export interface DocOrc {
  ref: string; data: string; validade: string; consulta: string; cliente: string; tipo: TipoOrc; fase: FaseOrc; aceite: boolean | null;
  notas: string; moeda: 'EUR'; linhas: LinhaOrc[]; criador: IdPerfil; alterado: IdPerfil; versao: number; historico: Evento[];
  anulado?: { quando: string; por: string; motivo: string };
}
const pessoa = (p: IdPerfil) => PERFIS[p].pessoa;
/** preço líquido da linha (cêntimos): o preço com o desconto 1 e depois o desconto 2 */
export const liquido = (l: LinhaOrc) => Math.round(l.preco * (1 - l.d1 / 100) * (1 - l.d2 / 100));
export const valorLinha = (l: LinhaOrc) => liquido(l) * l.qtd;
export const valorOrc = (d: Pick<DocOrc, 'linhas'>) => d.linhas.reduce((s, l) => s + valorLinha(l), 0);
const custoOrc = (d: Pick<DocOrc, 'linhas'>) => d.linhas.reduce((s, l) => s + custoDe(l.ref) * l.qtd, 0);
/** a margem sobre a venda, em %, ou null sem valor */
export const margem = (d: Pick<DocOrc, 'linhas'>) => { const v = valorOrc(d); return v ? Math.round(((v - custoOrc(d)) / v) * 1000) / 10 : null; };
const margemLinha = (l: LinhaOrc) => { const v = liquido(l); return v ? Math.round(((v - custoDe(l.ref)) / v) * 1000) / 10 : null; };
const mais = (iso: string, dias: number) => { const d = new Date(`${iso}T12:00:00`); d.setDate(d.getDate() + dias); return d.toISOString().slice(0, 10); };

function semente() {
  const ev = (quando: string, quem: IdPerfil, acao: string, detalhe?: string): Evento => ({ quando, quem: pessoa(quem), acao, detalhe });
  const ln = (xs: [string, number, number?, number?, number?][]): LinhaOrc[] => xs.map(([ref, qtd, d1 = 0, d2 = 0, prazo = 0], i) => ({ id: String.fromCharCode(97 + i), ref, qtd, preco: precoVenda(ref), d1, d2, prazo }));
  const O = (n: number, data: string, consulta: string, cli: string, tipo: TipoOrc, fase: FaseOrc, aceite: boolean | null, notas: string, linhas: LinhaOrc[], anulado?: DocOrc['anulado']): DocOrc => {
    const dt = `${data.slice(8, 10)}/${data.slice(5, 7)}/${data.slice(0, 4)}`;
    const h = [ev(`${dt} 09:40`, 'vendas', 'Criou o orçamento', `${tipo} · ${linhas.length} ${linhas.length === 1 ? 'artigo' : 'artigos'}`)];
    if (fase !== 'Orçamentação') h.push(ev(`${dt} 15:10`, 'vendas', 'Passou a negociação'));
    if (fase === 'Fecho') h.push(ev(`${dt} 17:25`, 'vendas', 'Fechou', aceite ? 'Aceite pelo cliente' : 'Não aceite'));
    if (anulado) h.push({ quando: anulado.quando, quem: anulado.por, acao: 'Anulou', detalhe: anulado.motivo });
    return { ref: `OR 2026/${String(n).padStart(4, '0')}`, data, validade: mais(data, 30), consulta, cliente: cli, tipo, fase, aceite, notas, moeda: 'EUR', linhas, criador: 'vendas', alterado: 'vendas', versao: h.length, historico: h, ...(anulado ? { anulado } : {}) };
  };
  const orc: DocOrc[] = [
    O(1, '2026-07-02', 'PC 2026/0101', '10231', 'Base', 'Fecho', true, 'Reposição de rolamentos para a loja.', ln([['6206-2RSH', 40, 10], ['6205-2Z', 60, 10]])),
    O(2, '2026-07-15', 'PC 2026/0108', '10604', 'Avançada', 'Fecho', true, 'Paragem anual da fábrica: rolamentos e massa.', ln([['6206-2RSH', 120, 15, 5, 7], ['LGMT 2/1', 20, 10, 0, 3], ['VKBA 6556', 8, 12, 3, 10]])),
    O(3, '2026-08-04', 'Email 04/08', '10345', 'Base', 'Fecho', false, 'O cliente comprou noutro fornecedor.', ln([['GDB1330', 6, 5], ['BKR6E', 24, 5]])),
    O(4, '2026-08-21', 'PC 2026/0122', '10302', 'Avançada', 'Negociação', null, 'Frota de 14 camiões: contrato de travões para o ano.', ln([['GDB1330', 56, 18, 4, 5], ['27.A44.00', 28, 15, 2, 5], ['09.A727.11', 28, 15, 2, 7]])),
    O(5, '2026-09-03', 'Telefone', '10490', 'Base', 'Orçamentação', null, 'Revisão de três viaturas.', ln([['BKR6E', 12], ['6PK1050', 3], ['P 85 020', 3]])),
    O(6, '2026-09-11', 'PC 2026/0131', '10533', 'Avançada', 'Negociação', null, 'Tratores: kit de rolamentos por modelo, entrega faseada.', ln([['6205-2Z', 80, 12, 3, 14], ['6206-2RSH', 80, 12, 3, 14], ['LGMT 2/1', 10, 8, 0, 3]])),
    O(7, '2026-09-24', 'PC 2026/0137', '10457', 'Base', 'Orçamentação', null, '', ln([['23.443.00', 15, 5], ['VKBA 6556', 4]])),
    O(8, '2026-10-01', 'Email 01/10', '10264', 'Base', 'Fecho', true, 'Encomenda feita no mesmo dia.', ln([['GDB1330', 4], ['P 85 020', 6]])),
    O(9, '2026-10-06', 'PC 2026/0144', '10692', 'Avançada', 'Orçamentação', null, 'Linha de vidragem: rolamentos de alta temperatura.', ln([['6206-2RSH', 30, 10, 0, 21], ['LGMT 2/1', 6, 5, 0, 3]])),
    O(10, '2026-10-08', 'Telefone', '10648', 'Base', 'Fecho', false, '', ln([['GDB1330', 10, 5]]), { quando: '09/10/2026 10:20', por: 'Pedro Sousa', motivo: 'Orçamento em duplicado: ficou o OR 2026/0011.' }),
    O(11, '2026-10-08', 'Telefone', '10648', 'Base', 'Negociação', null, 'Pastilhas e discos para a oficina.', ln([['GDB1330', 10, 8], ['09.A727.11', 4, 5]])),
    O(12, '2026-10-14', 'PC 2026/0150', '10388', 'Avançada', 'Orçamentação', null, 'Máquinas agrícolas: preço por volume.', ln([['6205-2Z', 200, 20, 5, 10], ['6206-2RSH', 150, 20, 5, 10], ['LGMT 2/1', 30, 12, 0, 5]])),
    O(13, '2026-10-16', 'Email 16/10', '10571', 'Base', 'Orçamentação', null, '', ln([['VKBA 6556', 2], ['23.443.00', 5]])),
    O(14, '2026-10-17', 'PC 2026/0153', '10412', 'Avançada', 'Negociação', null, 'Autocarros urbanos: travões e correias.', ln([['GDB1330', 40, 15, 5, 7], ['6PK1050', 40, 10, 0, 7]])),
  ];
  return { orc, n: orc.length };
}
const CHAVE = 'erp:vendas:orc:v1';
type Base_ = ReturnType<typeof semente>;
let base: Base_ | null = null;
const db = (): Base_ => { if (!base) { try { const v = localStorage.getItem(CHAVE); base = v ? JSON.parse(v) as Base_ : semente(); } catch { base = semente(); } } return base; };
function gravarDb(): void { try { localStorage.setItem(CHAVE, JSON.stringify(base)); } catch { /* fica na memória */ } }
function recarregar(): void { base = null; db(); }
export const orcamentos = () => db().orc.slice().sort((a, b) => b.ref.localeCompare(a.ref));
export const orcamento = (ref: string) => db().orc.find((d) => d.ref === ref);
const podeV = (p: IdPerfil) => ['vendas', 'admin', 'compras'].includes(p);

export interface PedidoOrc { data: string; validade: string; consulta: string; cliente: string; tipo: TipoOrc; notas: string; linhas: Omit<LinhaOrc, 'id'>[] }
function problemas(x: PedidoOrc): { msg: string; campo: string }[] {
  const ps: { msg: string; campo: string }[] = [];
  if (!cliente(x.cliente)) ps.push({ msg: 'Escolhe o cliente.', campo: 'cliente' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(x.data)) ps.push({ msg: 'A data é uma data, ex.: 19/10/2026.', campo: 'data' });
  else if (x.data > HOJE) ps.push({ msg: 'A data não pode ser depois de hoje.', campo: 'data' });
  if (x.validade && x.validade < x.data) ps.push({ msg: 'A validade não pode ser antes da data do orçamento.', campo: 'validade' });
  if (!x.linhas.length) ps.push({ msg: 'O orçamento precisa de pelo menos um artigo.', campo: 'art-0' });
  const vistos = new Set<string>();
  x.linhas.forEach((l, i) => {
    if (!artigo(l.ref)) ps.push({ msg: l.ref ? `«${l.ref}» não é um artigo conhecido.` : 'Escreve o artigo de cada linha.', campo: `art-${i}` });
    else if (vistos.has(l.ref)) ps.push({ msg: `${l.ref} já está noutra linha: junta as quantidades numa só.`, campo: `art-${i}` });
    vistos.add(l.ref);
    if (!Number.isInteger(l.qtd) || l.qtd <= 0) ps.push({ msg: `${l.ref || `Linha ${i + 1}`}: a quantidade é um número inteiro maior do que zero.`, campo: `qtd-${i}` });
    if (!Number.isFinite(l.preco) || l.preco <= 0) ps.push({ msg: `${l.ref || `Linha ${i + 1}`}: o preço tem de ser maior do que zero.`, campo: `preco-${i}` });
    if (l.d1 < 0 || l.d1 >= 100 || l.d2 < 0 || l.d2 >= 100) ps.push({ msg: `${l.ref || `Linha ${i + 1}`}: os descontos vão de 0 a 99 %.`, campo: `d1-${i}` });
  });
  return ps;
}
const recusa = (p: { msg: string; campo: string }) => Object.assign(new Recusa(p.msg), { campo: p.campo });
const comIds = (ls: PedidoOrc['linhas'], tipo: TipoOrc): LinhaOrc[] => ls.map((l, i) => ({ id: String.fromCharCode(97 + i), ...l, d2: tipo === 'Avançada' ? l.d2 : 0, prazo: tipo === 'Avançada' ? l.prazo : 0 }));
export function criarOrc(p: IdPerfil, x: PedidoOrc): DocOrc {
  recarregar();
  if (!podeV(p)) throw new Recusa('O teu perfil não faz orçamentos.', 'permissao');
  const pr = problemas(x); if (pr.length) throw recusa(pr[0]);
  const b = db(); b.n += 1;
  const d: DocOrc = { ref: `OR 2026/${String(b.n).padStart(4, '0')}`, data: x.data, validade: x.validade || mais(x.data, 30), consulta: x.consulta.trim(), cliente: x.cliente, tipo: x.tipo, fase: 'Orçamentação', aceite: null, notas: x.notas.trim(), moeda: 'EUR', linhas: comIds(x.linhas, x.tipo), criador: p, alterado: p, versao: 1, historico: [{ quando: agora(), quem: pessoa(p), acao: 'Criou o orçamento', detalhe: `${x.tipo} · ${x.linhas.length} ${x.linhas.length === 1 ? 'artigo' : 'artigos'}` }] };
  b.orc.push(d); gravarDb(); return d;
}
export function guardarOrc(p: IdPerfil, ref: string, x: PedidoOrc, versao: number): DocOrc {
  recarregar();
  if (!podeV(p)) throw new Recusa('O teu perfil não altera orçamentos.', 'permissao');
  const d = orcamento(ref); if (!d) throw new Recusa('O orçamento já não existe.', 'estado');
  if (d.versao !== versao) throw new Recusa(`Outra pessoa alterou o ${d.ref} entretanto: fecha e abre outra vez para ver a versão atual.`, 'conflito');
  if (d.anulado || d.fase === 'Fecho') throw new Recusa(`O ${d.ref} está ${d.anulado ? 'anulado' : 'fechado'}: já não se altera.`, 'estado');
  const pr = problemas(x); if (pr.length) throw recusa(pr[0]);
  Object.assign(d, { data: x.data, validade: x.validade || d.validade, consulta: x.consulta.trim(), cliente: x.cliente, tipo: x.tipo, notas: x.notas.trim(), linhas: comIds(x.linhas, x.tipo), alterado: p, versao: d.versao + 1 });
  d.historico.push({ quando: agora(), quem: pessoa(p), acao: 'Gravou', detalhe: `${d.tipo} · ${euros(valorOrc(d))}` });
  gravarDb(); return d;
}
function mudarFase(p: IdPerfil, ref: string, fase: FaseOrc, aceite: boolean | null): DocOrc {
  recarregar();
  const d = orcamento(ref); if (!d) throw new Recusa('O orçamento já não existe.', 'estado');
  if (!podeV(p)) throw new Recusa('O teu perfil só consulta os orçamentos.', 'permissao');
  if (d.anulado) throw new Recusa('O orçamento está anulado.', 'estado');
  if (d.fase === 'Fecho') throw new Recusa('O orçamento já está fechado.', 'estado');
  d.fase = fase; d.aceite = aceite; d.alterado = p; d.versao += 1;
  d.historico.push({ quando: agora(), quem: pessoa(p), acao: fase === 'Negociação' ? 'Passou a negociação' : 'Fechou', detalhe: fase === 'Fecho' ? (aceite ? 'Aceite pelo cliente' : 'Não aceite') : undefined });
  gravarDb(); return d;
}
function anularOrc(p: IdPerfil, ref: string, motivo: string): DocOrc {
  recarregar();
  if (!podeV(p)) throw new Recusa('O teu perfil não anula orçamentos.', 'permissao');
  const d = orcamento(ref); if (!d) throw new Recusa('O orçamento já não existe.', 'estado');
  if (d.anulado) throw new Recusa('Já está anulado.', 'estado');
  if (!motivo.trim()) throw new Recusa('Escreve o motivo: fica no histórico.', 'validacao');
  d.anulado = { quando: agora(), por: pessoa(p), motivo: motivo.trim() }; d.alterado = p; d.versao += 1;
  d.historico.push({ quando: d.anulado.quando, quem: pessoa(p), acao: 'Anulou', detalhe: d.anulado.motivo });
  gravarDb(); return d;
}

/* ---------- as linhas da lista ---------- */
const nomeCli = (n: string) => cliente(n)?.nome ?? n;
function linhas(e: EstDoc): Doc[] {
  return orcamentos().map((d): Doc => {
    const anulado = !!d.anulado || e.extra.anuladoSim === d.ref;
    return { id: d.ref, ref: d.ref, numero: d.ref, n: d.ref.split(' ')[1] ?? d.ref, serie: d.ref.split('/')[0], data: d.data, consulta: d.consulta, cliente: d.cliente, nome: `${nomeCli(d.cliente)}${d.consulta ? ` · ${d.consulta}` : ''}`, nomeCli: nomeCli(d.cliente),
      tipo: d.tipo, fase: d.fase, aceite: d.aceite === null ? '' : d.aceite ? 'Sim' : 'Não', anulado, estado: anulado ? 'Anulado' : d.fase, moeda: d.moeda, valor: valorOrc(d), margem: margem(d) ?? 0, artigos: d.linhas.length,
      validade: d.validade, uIns: pessoa(d.criador), uAlt: pessoa(d.alterado) };
  });
}
export const doc = (d: Doc) => orcamento(String(d.ref))!;
const COLS: CfgDoc['cols'] = [
  { k: 'numero', t: 'Número', tipo: 'mono', w: 150, presa: true, antiga: true },
  { k: 'data', t: 'Data', tipo: 'data', w: 110, antiga: true },
  { k: 'consulta', t: 'Nr. Consulta', tipo: 'txt', w: 125, antiga: true },
  { k: 'cliente', t: '#Cliente', tipo: 'mono', w: 85, antiga: true },
  { k: 'nomeCli', t: 'Nome', tipo: 'txt', w: 230, antiga: true },
  { k: 'tipo', t: 'Tipo', tipo: 'txt', w: 100 },
  { k: 'fase', t: 'Fase', tipo: 'estado', w: 165, antiga: true },
  { k: 'aceite', t: 'Aceite', tipo: 'txt', w: 85, antiga: true },
  { k: 'valor', t: 'Valor', tipo: 'eur', w: 120, antiga: true },
  { k: 'margem', t: 'Margem', tipo: 'n', w: 90 },
  { k: 'validade', t: 'Válido até', tipo: 'data', w: 105 },
  { k: 'moeda', t: '#Moeda', tipo: 'txt', w: 75, antiga: true },
  { k: 'artigos', t: 'Artigos', tipo: 'n', w: 75 },
  { k: 'uIns', t: '#Utilizador', tipo: 'txt', w: 140, antiga: true },
];
const badge = (cls: string, ic: string, t: string, title = '') => `<span class="lf2-b ${cls}"${title ? ` title="${esc(title)}"` : ''}>${L(ic)}${t}</span>`;
const faseB = (d: Doc) => d.anulado ? badge('lf2-b--rutura', ban, 'Anulado') : d.fase === 'Fecho' ? badge(d.aceite === 'Sim' ? 'lf2-b--pend' : 'lf2-b--rasc', flag, 'Fechado') : d.fase === 'Negociação' ? badge('lf2-b--baixo', handshake, 'Negociação') : badge('lf2-b--enc', clock, 'Orçamentação');
const margemTxt = (m: number | null) => m === null ? '<span class="is-nada">—</span>' : `${m.toLocaleString('pt-PT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;
function celula(d: Doc, k: string): string {
  switch (k) {
    case 'numero': return `<span class="lf2-art"><b>${esc(String(d.numero))}</b></span>`;
    case 'data': case 'validade': return dia(String(d[k]));
    case 'cliente': return `<span class="is-mono">${esc(String(d.cliente))}</span>`;
    case 'tipo': return `<span class="orcv-tipo is-${d.tipo === 'Base' ? 'base' : 'av'}">${esc(String(d.tipo))}</span>`;
    case 'fase': return `<span class="lf2-badges">${faseB(d)}</span>`;
    case 'aceite': return d.aceite === 'Sim' ? `<span class="orcv-sim">${L(circleCheck)}Sim</span>` : d.aceite === 'Não' ? `<span class="orcv-nao">${L(circleX)}Não</span>` : '<span class="is-nada">—</span>';
    case 'valor': return euros(d.valor as number);
    case 'margem': return d.tipo === 'Avançada' ? margemTxt(d.margem as number) : '<span class="is-nada" title="Só nos orçamentos avançados">—</span>';
    case 'artigos': return nf(d.artigos as number);
    default: return esc(String(d[k] ?? '')) || '<span class="is-nada">—</span>';
  }
}
const editavel = (e: EstDoc, d: Doc | undefined) => !!d && !d.anulado && d.fase !== 'Fecho' && podeV(e.perfil);
const porqueFase = (e: EstDoc, d: Doc | undefined, alvo: 'neg' | 'fecho') => !d ? 'Escolhe um orçamento na lista.' : !podeV(e.perfil) ? 'O teu perfil só consulta os orçamentos.' : d.anulado ? 'O orçamento está anulado.' : d.fase === 'Fecho' ? 'O orçamento já está fechado.' : alvo === 'neg' && d.fase === 'Negociação' ? 'Já está em negociação.' : '';

/* ---------- o painel (Detalhes, Linhas, Anexos) ---------- */
const dd = (t: string, v: string, cls = '') => `<div${cls ? ` class="${cls}"` : ''}><dt>${t}</dt><dd>${v}</dd></div>`;
function painel(e: EstDoc, d: Doc | undefined, tab: string): string {
  if (!d) return '';
  const x = doc(d), c = cliente(x.cliente), av = x.tipo === 'Avançada';
  if (tab === '_alvo') return `<b>${esc(x.ref)}</b><span>${esc(nomeCli(x.cliente))} · ${esc(x.tipo)} · ${euros(valorOrc(x))}</span>`;
  if (tab === 'detalhes') {
    const faixa = d.anulado ? `${L(ban)}<span><b>Anulado a ${esc(x.anulado?.quando ?? '')}.</b> ${esc(x.anulado?.motivo ?? '')} Fica no histórico.</span>`
      : x.fase === 'Fecho' ? `${L(flag)}<span><b>Fechado: ${x.aceite ? 'aceite pelo cliente' : 'não aceite'}.</b> ${x.aceite ? 'Segue para a encomenda do cliente.' : 'Fica no histórico.'}</span>`
      : x.fase === 'Negociação' ? `${L(handshake)}<span><b>Em negociação.</b> Os preços e os descontos ainda se alteram; Fechar (Ctrl+F2) quando o cliente responder.</span>`
      : `${L(clock)}<span><b>Em orçamentação.</b> Válido até ${dia(x.validade)}. Negociar quando o cliente responder; Fechar (Ctrl+F2) com a resposta.</span>`;
    return `${e.recusa ? `<p class="lf2-recusa" role="alert">${L(circleAlert)}${esc(e.recusa)}</p>` : ''}
      <div class="dv2-estado-faixa ${d.anulado ? 'is-anulado' : x.fase === 'Fecho' ? 'is-ok' : 'is-pronto'}">${faixa}</div>
      <dl class="lf2-dl dv2-dl">${dd('Número', `<b class="is-mono">${esc(x.ref)}</b>`)}${dd('Tipo', esc(x.tipo))}${dd('Data', dia(x.data))}${dd('Válido até', dia(x.validade))}
        ${dd('Cliente', `${esc(c?.nome ?? x.cliente)}<small>N.º ${esc(x.cliente)} · ${esc(c?.cidade ?? '')} · NIF ${esc(c?.nif ?? '')}</small>`, 'is-largo')}
        ${dd('Nr. Consulta', esc(x.consulta) || '<span class="is-nada">—</span>')}${dd('Fase', esc(x.fase))}${dd('Aceite', x.aceite === null ? '<span class="is-nada">—</span>' : x.aceite ? 'Sim' : 'Não')}${dd('Moeda', 'EUR')}
        ${dd('Observações', esc(x.notas) || '<span class="is-nada">—</span>', 'is-largo')}
        ${dd('Artigos', nf(x.linhas.length))}${dd('Valor', `<b>${euros(valorOrc(x))}</b><small>Sem IVA, com os descontos</small>`)}${av ? dd('Margem', `${margemTxt(margem(x))}<small>Sobre a venda, ao custo de hoje</small>`) : ''}
        ${dd('Inserido por', esc(pessoa(x.criador)))}${dd('Alterado por', `${esc(pessoa(x.alterado))}<small>${esc(x.historico[x.historico.length - 1]?.quando ?? '')}</small>`)}</dl>
      <details class="dv2-hist"><summary>Histórico do orçamento (${x.historico.length})</summary><ol>${x.historico.slice().reverse().map((h) => `<li><time>${esc(h.quando)}</time><b>${esc(h.acao)}</b>${h.detalhe ? ` · ${esc(h.detalhe)}` : ''}<small>${esc(h.quem)}</small></li>`).join('')}</ol></details>`;
  }
  if (tab === 'linhas') {
    return `<table class="lf2-mini dv2-linhas-t"><thead><tr><th>Artigo</th><th>Descrição</th><th class="is-num">Qt.</th><th class="is-num">Preço</th><th class="is-num">Desc. 1</th>${av ? '<th class="is-num">Desc. 2</th><th class="is-num">Custo</th><th class="is-num">Margem</th><th class="is-num">Prazo</th>' : ''}<th class="is-num">Valor</th></tr></thead><tbody>${x.linhas.map((l) => `<tr><td class="is-mono">${esc(l.ref)}</td><td>${esc(artigo(l.ref)?.desc ?? '')}</td><td class="is-num">${nf(l.qtd)}</td><td class="is-num">${euros(l.preco)}</td><td class="is-num">${l.d1 ? `${l.d1} %` : '—'}</td>${av ? `<td class="is-num">${l.d2 ? `${l.d2} %` : '—'}</td><td class="is-num">${euros(custoDe(l.ref))}</td><td class="is-num">${margemTxt(margemLinha(l))}</td><td class="is-num">${l.prazo ? `${l.prazo} dias` : '—'}</td>` : ''}<td class="is-num"><b>${euros(valorLinha(l))}</b></td></tr>`).join('')}</tbody>
      <tfoot><tr class="is-total"><td colspan="${av ? 9 : 5}">Total · sem IVA</td><td class="is-num"><b>${euros(valorOrc(x))}</b></td></tr></tfoot></table>`;
  }
  return '';
}

/* ---------- a ficha: Base ou Avançada ---------- */
const campo = (k: string, t: string, input: string, cls = '') => `<label class="ak-campo${cls ? ` ${cls}` : ''}" for="dv2-ff-${k}"><span>${t}</span>${input}</label>`;
const datalist = `<datalist id="orcv-artigos">${ARTIGOS.map((a) => `<option value="${esc(a.ref)}">${esc(a.desc)} · ${esc(a.marca)}</option>`).join('')}</datalist>`;
const pc = (c: number) => (c / 100).toFixed(2).replace('.', ',');
function linhaFicha(i: number, l: Partial<LinhaOrc> = {}, dis = false): string {
  const a = artigo(l.ref ?? ''), D = dis ? ' disabled' : '';
  const inp = (k: string, v: string, rot: string, cls = 'is-num') => `<input type="text" inputmode="decimal" class="${cls}" value="${esc(v)}" data-dv2-ff="${k}-${i}" data-dv2-l="${k}" aria-label="${rot} da linha ${i + 1}"${D}>`;
  return `<tr data-dv2-linha="${i}"><td><input type="text" list="orcv-artigos" value="${esc(l.ref ?? '')}" data-dv2-ff="art-${i}" data-dv2-l="ref" aria-label="Artigo da linha ${i + 1}" placeholder="Referência"${D}></td><td data-dv2-l-desc>${esc(a?.desc ?? '')}</td>
    <td>${inp('qtd', l.qtd ? String(l.qtd) : '', 'Quantidade')}</td><td>${inp('preco', l.preco ? pc(l.preco) : '', 'Preço')}</td><td>${inp('d1', l.d1 ? String(l.d1) : '', 'Desconto 1')}</td>
    <td class="is-av">${inp('d2', l.d2 ? String(l.d2) : '', 'Desconto 2')}</td><td class="is-av is-num" data-dv2-l-custo>${a ? euros(custoDe(a.ref)) : '—'}</td><td class="is-av is-num" data-dv2-l-margem>—</td><td class="is-av">${inp('prazo', l.prazo ? String(l.prazo) : '', 'Prazo em dias')}</td>
    <td class="is-num" data-dv2-l-valor>—</td><td>${dis ? '' : `<button type="button" class="dv2-x" data-dv2-acao="del-linha" aria-label="Tirar a linha ${i + 1}">${L(trash)}</button>`}</td></tr>`;
}
function ficha(e: EstDoc, f: Ficha, d: Doc | undefined): string {
  const x = d ? doc(d) : undefined, ver = f.modo === 'editar' && !editavel(e, d), dis = ver ? ' disabled' : '';
  const tipo: TipoOrc = x?.tipo ?? (e.extra.tipoNovo === 'Avançada' ? 'Avançada' : 'Base');
  const titulo = f.modo === 'criar' ? 'Novo orçamento' : `${x!.ref} · ${nomeCli(x!.cliente)}`;
  const cab = `<header class="dv2-ficha-cab"><span class="dv2-ficha-ic">${L(fileSpreadsheet)}</span><div><small>${f.modo === 'criar' ? 'Criação' : ver ? 'Visualização' : 'Edição'}</small><h2>${esc(titulo)}</h2></div>
    <div class="dv2-ficha-acoes"><button type="button" class="ak-btn ak-btn--linha" data-dv2-acao="fechar-ficha">${L(arrowLeft)}<span>${ver ? 'Voltar à lista' : 'Cancelar'}</span><kbd>Esc</kbd></button>${ver ? '' : `<button type="button" class="ak-btn ak-btn--acao" data-dv2-acao="gravar">${L(save)}<span>Gravar</span><kbd>Ctrl Enter</kbd></button>`}</div></header>
    <p class="lf2-recusa" data-dv2-ficha-erro role="alert" hidden></p>`;
  const pe = ver ? (d!.anulado ? 'O orçamento está anulado: só se vê.' : 'Fechado: já não se altera.') : f.modo === 'criar' ? 'Nasce em orçamentação. O preço vem da tabela de venda; Avançada junta o 2.º desconto, o custo, a margem e o prazo de cada linha.' : `Em ${x!.fase.toLowerCase()}: tudo se altera até se fechar.`;
  const ls = x?.linhas ?? [];
  const seg = `<div class="ak-campo"><span>Tipo</span><span class="orcv-seg" role="radiogroup" aria-label="Tipo de orçamento">${(['Base', 'Avançada'] as const).map((t) => `<button type="button" role="radio" aria-checked="${t === tipo}" data-dv2-acao="orc-tipo" data-orcv-tipo="${t}"${dis}>${t}</button>`).join('')}</span><input type="hidden" data-dv2-ff="tipo" value="${tipo}"></div>`;
  return `<div class="dv2-ficha-c orcv-ficha${tipo === 'Avançada' ? ' is-avancada' : ''}" data-orcv-ficha>${cab}<p class="dv2-ficha-modo">${pe}</p>
    <input type="hidden" data-dv2-ff-versao value="${x?.versao ?? 0}">
    <div class="dv2-ficha-g">
      ${seg}
      ${campo('numero', 'Número', `<input type="text" id="dv2-ff-numero" value="${esc(x?.ref ?? 'Atribuído ao gravar')}" readonly>`)}
      ${campo('data', 'Data', `<input type="date" id="dv2-ff-data" value="${x?.data ?? HOJE}" max="${HOJE}" data-dv2-ff="data"${dis}>`)}
      ${campo('validade', 'Válido até', `<input type="date" id="dv2-ff-validade" value="${x?.validade ?? mais(HOJE, 30)}" data-dv2-ff="validade"${dis}>`)}
      ${campo('cliente', 'Cliente', `<select id="dv2-ff-cliente" data-dv2-ff="cliente"${dis}>${x ? '' : '<option value="">Escolhe o cliente…</option>'}${CLIENTES.map((c) => `<option value="${c.num}"${c.num === x?.cliente ? ' selected' : ''}>${esc(c.num)} · ${esc(c.nome)}</option>`).join('')}</select>`, 'is-largo2')}
      ${campo('consulta', 'Nr. Consulta', `<input type="text" id="dv2-ff-consulta" value="${esc(x?.consulta ?? '')}" data-dv2-ff="consulta" placeholder="Ex.: PC 2026/0150, Email, Telefone"${dis}>`)}
      ${campo('notas', 'Observações', `<textarea id="dv2-ff-notas" rows="2" data-dv2-ff="notas"${dis}>${esc(x?.notas ?? '')}</textarea>`, 'is-largo')}
    </div>
    <h3 class="dv2-h3">Artigos</h3>${datalist}
    <div class="dv2-linhas-rolo"><table class="lf2-mini dv2-linhas-ed orcv-linhas"><thead><tr><th>Artigo</th><th>Descrição</th><th class="is-num">Qt.</th><th class="is-num">Preço (€)</th><th class="is-num">Desc. 1 %</th><th class="is-num is-av">Desc. 2 %</th><th class="is-num is-av">Custo</th><th class="is-num is-av">Margem</th><th class="is-num is-av">Prazo (dias)</th><th class="is-num">Valor</th><th><span class="sr">Tirar</span></th></tr></thead>
      <tbody data-dv2-linhas>${(ls.length ? ls : [{}]).map((l, i) => linhaFicha(i, l, ver)).join('')}</tbody>
      <tfoot><tr class="is-total"><td colspan="9" class="orcv-tot-t">Total · sem IVA</td><td class="is-num" data-dv2-r-total>—</td><td></td></tr><tr class="is-total is-av"><td colspan="9">Margem do orçamento</td><td class="is-num" data-orcv-margem>—</td><td></td></tr></tfoot></table></div>
    ${ver ? '' : `<button type="button" class="ak-btn ak-btn--linha dv2-mais-linha" data-dv2-acao="add-linha">${L(plus)}<span>Juntar artigo</span></button>`}
    <p class="dv2-ficha-dica">Enter passa ao campo seguinte. O preço vem da tabela de venda e altera-se. Ctrl+Enter grava; Esc fecha.</p></div>`;
}
const numero = (s: string) => { const v = s.trim().replace(/\s/g, '').replace(',', '.'); return v ? Number(v) : NaN; };
function lerFicha(r: HTMLElement): PedidoOrc & { versao: number } {
  const v = (k: string) => r.querySelector<HTMLInputElement>(`[data-dv2-ficha] [data-dv2-ff="${k}"]`)?.value ?? '';
  const tipo = (v('tipo') === 'Avançada' ? 'Avançada' : 'Base') as TipoOrc;
  const linhas = [...r.querySelectorAll<HTMLElement>('[data-dv2-ficha] [data-dv2-linhas] tr')].map((tr) => {
    const g = (k: string) => tr.querySelector<HTMLInputElement>(`[data-dv2-l="${k}"]`)?.value ?? '';
    const n0 = (k: string) => { const x = numero(g(k)); return Number.isNaN(x) ? 0 : x; };
    return { ref: g('ref').trim(), qtd: numero(g('qtd')), preco: Math.round(numero(g('preco')) * 100), d1: n0('d1'), d2: n0('d2'), prazo: Math.round(n0('prazo')) };
  }).filter((l) => l.ref || !Number.isNaN(l.qtd));
  return { data: v('data'), validade: v('validade'), consulta: v('consulta'), cliente: v('cliente'), tipo, notas: r.querySelector<HTMLTextAreaElement>('[data-dv2-ficha] [data-dv2-ff="notas"]')?.value ?? '', versao: Number(r.querySelector<HTMLInputElement>('[data-dv2-ficha] [data-dv2-ff-versao]')?.value ?? 0), linhas };
}
function gravar(r: HTMLElement, e: EstDoc, f: Ficha): { ref: string; msg: string } {
  const x = lerFicha(r), { versao, ...pedido } = x;
  if (f.modo === 'criar') { const d = criarOrc(e.perfil, pedido); return { ref: d.ref, msg: `${d.ref} criado (${d.tipo}) para ${nomeCli(d.cliente)}: ${euros(valorOrc(d))}.` }; }
  const d = ativoDe(r, e); if (!d) throw new Recusa('O orçamento já não está na lista.');
  const g = guardarOrc(e.perfil, String(d.ref), pedido, versao);
  return { ref: g.ref, msg: `${g.ref} gravado: ${euros(valorOrc(g))}.` };
}
/** Na ficha: a descrição, o preço da tabela ao escolher o artigo, o valor de cada linha, a margem e o total. */
function recalcular(r: HTMLElement, novoRef?: HTMLInputElement): void {
  let t = 0, c = 0;
  if (novoRef) { const tr = novoRef.closest('tr')!, a = artigo(novoRef.value.trim()); tr.querySelector('[data-dv2-l-desc]')!.textContent = a?.desc ?? ''; tr.querySelector('[data-dv2-l-custo]')!.textContent = a ? euros(custoDe(a.ref)) : '—'; const p = tr.querySelector<HTMLInputElement>('[data-dv2-l="preco"]')!; if (a && !p.value) p.value = pc(precoVenda(a.ref)); }
  const av = r.querySelector<HTMLInputElement>('[data-dv2-ficha] [data-dv2-ff="tipo"]')?.value === 'Avançada';
  r.querySelectorAll<HTMLElement>('[data-dv2-ficha] [data-dv2-linhas] tr').forEach((tr) => {
    const g = (k: string) => numero(tr.querySelector<HTMLInputElement>(`[data-dv2-l="${k}"]`)?.value ?? '');
    const ref = tr.querySelector<HTMLInputElement>('[data-dv2-l="ref"]')!.value.trim(), a = artigo(ref), q = g('qtd'), p = Math.round(g('preco') * 100);
    const l: LinhaOrc = { id: '', ref, qtd: q, preco: p, d1: g('d1') || 0, d2: av ? g('d2') || 0 : 0, prazo: 0 };
    const ok = !!a && Number.isInteger(q) && q > 0 && p > 0;
    tr.querySelector<HTMLElement>('[data-dv2-l-valor]')!.textContent = ok ? euros(valorLinha(l)) : '—';
    tr.querySelector<HTMLElement>('[data-dv2-l-margem]')!.innerHTML = ok ? margemTxt(margemLinha(l)) : '—';
    if (ok) { t += valorLinha(l); c += custoDe(ref) * q; }
  });
  const rt = r.querySelector<HTMLElement>('[data-dv2-ficha] [data-dv2-r-total]'); if (rt) rt.textContent = euros(t);
  const rm = r.querySelector<HTMLElement>('[data-dv2-ficha] [data-orcv-margem]'); if (rm) rm.innerHTML = t ? margemTxt(Math.round(((t - c) / t) * 1000) / 10) : '—';
}

/* ---------- Fechar (Ctrl+F2), Negociar e o Fluxo do documento (Ctrl+F9) ---------- */
function dlgFechar(r: HTMLElement, e: EstDoc): void {
  const d = ativoDe(r, e), porque = porqueFase(e, d, 'fecho'); if (porque) { toast(r, porque); return; }
  const x = doc(d!);
  dialogo(r, `<h2 id="dv2-dlg-t">${L(flag)}Fechar o orçamento</h2><p class="lf2-dlg-sub"><b class="is-mono">${esc(x.ref)}</b> · ${esc(nomeCli(x.cliente))} · ${euros(valorOrc(x))}</p>
    <p>O cliente aceitou? Fechado, o orçamento já não se altera e passa ao histórico.</p>
    <div class="lf2-dlg-acoes"><button type="button" class="ak-btn ak-btn--linha" data-dv2-dlg-fechar>${L(xIc)}<span>Cancelar</span><kbd>Esc</kbd></button><button type="button" class="ak-btn ak-btn--linha" data-dv2-acao="fechar-nao">${L(circleX)}<span>Não aceite</span></button><button type="button" class="ak-btn ak-btn--acao" data-dv2-acao="fechar-sim" data-dv2-primeiro>${L(circleCheck)}<span>Aceite</span></button></div>`);
}
function fase(r: HTMLElement, e: EstDoc, f: FaseOrc, aceite: boolean | null): void {
  const d = ativoDe(r, e); if (!d) return;
  try { const x = mudarFase(e.perfil, String(d.ref), f, aceite); fecharDialogo(r); e.aviso = f === 'Negociação' ? `${x.ref} passou a negociação.` : `${x.ref} fechado: ${aceite ? 'aceite pelo cliente' : 'não aceite'}.`; tudo(r, e, true); toast(r, e.aviso); }
  catch (x) { fecharDialogo(r); toast(r, x instanceof Recusa ? x.message : 'Não foi possível mudar a fase.'); }
}
function dlgFluxo(r: HTMLElement, e: EstDoc): void {
  const d = ativoDe(r, e); if (!d) { toast(r, 'Escolhe um orçamento na lista.'); return; }
  const x = doc(d), passo = (feito: boolean, atual: boolean, t: string, s: string) => `<li class="${feito ? 'is-feito' : ''}${atual ? ' is-atual' : ''}"><b>${t}</b><small>${s}</small></li>`;
  const h = (a: string) => x.historico.find((y) => y.acao === a)?.quando ?? '';
  const fechado = x.fase === 'Fecho';
  dialogo(r, `<h2 id="dv2-dlg-t">${L(gitFork)}Fluxo do documento</h2><p class="lf2-dlg-sub"><b class="is-mono">${esc(x.ref)}</b> · ${esc(nomeCli(x.cliente))}</p>
    <ol class="orcv-fluxo">${passo(!!x.consulta, false, 'Consulta do cliente', esc(x.consulta || 'Sem número de consulta'))}${L(chevR)}${passo(true, x.fase === 'Orçamentação' && !x.anulado, 'Orçamento', `${esc(x.tipo)} · ${dia(x.data)}`)}${L(chevR)}${passo(x.fase !== 'Orçamentação', x.fase === 'Negociação' && !x.anulado, 'Negociação', esc(h('Passou a negociação') || 'Ainda não'))}${L(chevR)}${passo(fechado, fechado, 'Fecho', fechado ? (x.aceite ? 'Aceite' : 'Não aceite') : x.anulado ? 'Anulado' : 'Por fechar')}${L(chevR)}${passo(false, false, 'Encomenda do cliente', fechado && x.aceite ? 'Por criar (Vendas ▸ Pedidos de Clientes)' : '—')}</ol>
    <div class="lf2-dlg-acoes"><button type="button" class="ak-btn ak-btn--linha" data-dv2-dlg-fechar data-dv2-primeiro>${L(xIc)}<span>Fechar</span><kbd>Esc</kbd></button></div>`);
}

/* ---------- os indicadores e os filtros ---------- */
const tipoF = (e: EstDoc) => String(e.extra.tipo ?? '');
function kpis(r: HTMLElement, e: EstDoc): string {
  const s = r.querySelector<HTMLSelectElement>('[data-orcv-tipo-f]'); if (s && s.value !== tipoF(e)) s.value = tipoF(e);
  if (e.fase !== 'ok' && e.fase !== 'atualizar') return '';
  const ls = linhas(e).filter((d) => !tipoF(e) || d.tipo === tipoF(e)), abertos = ls.filter((d) => !d.anulado && d.fase !== 'Fecho'), fech = ls.filter((d) => !d.anulado && d.fase === 'Fecho'), ac = fech.filter((d) => d.aceite === 'Sim');
  const soma = (xs: Doc[]) => euros(xs.reduce((t, d) => t + (d.valor as number), 0));
  const k = (cls: string, ic: string, t: string, v: string, ctx: string) => `<div class="minv2-kpi ${cls}"><span class="minv2-kpi-ic">${L(ic)}</span><small>${t}</small><b>${v}</b><i>${ctx}</i></div>`;
  return `${k('is-total', clock, 'Em aberto', soma(abertos), `${nf(abertos.length)} ${abertos.length === 1 ? 'orçamento' : 'orçamentos'} · ${nf(abertos.filter((d) => d.fase === 'Negociação').length)} em negociação`)}
    ${k('is-com', circleCheck, 'Aceites', soma(ac), `${nf(ac.length)} de ${nf(fech.length)} fechados`)}
    ${k('', flag, 'Taxa de aceitação', fech.length ? `${Math.round((ac.length / fech.length) * 100)} %` : '—', 'dos fechados')}`;
}
const rapidos = (id: (x: string) => string) => `<label class="ak-campo" for="${id('tipo')}"><span>Tipo</span><select id="${id('tipo')}" data-orcv-tipo-f data-dv2-campo><option value="">Base e Avançada</option><option value="Base">Base</option><option value="Avançada">Avançada</option></select></label>`;

/* ---------- registar ---------- */
const CFG = registar({
  k: 'orcv', titulo: 'Orçamentação', sub: 'Orçamentos a clientes, base e avançados: da consulta ao fecho.', icone: fileSpreadsheet, um: 'orçamento', o: 'o',
  caminho: [['ERP', 'inicio'], ['Vendas', ''], ['Orçamentação', '']],
  cols: COLS, verIniciais: ['numero', 'data', 'consulta', 'cliente', 'nomeCli', 'tipo', 'fase', 'aceite', 'valor', 'uIns'], ajustar: true,
  campos: { numero: 'n', data: 'data', consulta: 'consulta', codigo: 'cliente', descricao: 'nomeCli' },
  rotuloForn: 'Cliente', phCodigo: 'Número do cliente, ex.: 10231',
  linhas: (e) => linhas(e).filter((d) => !tipoF(e) || d.tipo === tipoF(e)),
  series: () => [...new Set(orcamentos().map((d) => d.ref.split('/')[0]))], serieDe: (d) => String(d.serie), fornDe: (d) => String(d.cliente), dataDe: (d) => String(d.data), moedaDe: (d) => String(d.moeda),
  estados: [['', 'Todos'], ['orc', 'Em orçamentação'], ['neg', 'Em negociação'], ['abertos', 'Em aberto'], ['hist', 'Histórico (fechados e anulados)'], ['aceite', 'Aceites'], ['anul', 'Anulados']],
  estadoPassa: (d, v) => v === 'orc' ? !d.anulado && d.fase === 'Orçamentação' : v === 'neg' ? !d.anulado && d.fase === 'Negociação' : v === 'abertos' ? !d.anulado && d.fase !== 'Fecho' : v === 'hist' ? !!d.anulado || d.fase === 'Fecho' : v === 'aceite' ? !d.anulado && d.aceite === 'Sim' : v === 'anul' ? !!d.anulado : true,
  celula, valor: (d, k) => (k === 'fase' ? String(d.estado) : (d[k] as string | number) ?? ''),
  resumo: (ls) => { const a = ls.filter((d) => !d.anulado && d.fase !== 'Fecho').length; return ls.length ? `<span><b>${nf(a)}</b> em aberto</span><span>Soma <b>${euros(ls.filter((d) => !d.anulado).reduce((t, d) => t + (d.valor as number), 0))}</b> s/ IVA</span>` : ''; },
  barra: `${BTN('negociar', handshake, 'Negociar', '')}${BTN('fechar-orc', flag, 'Fechar', 'Ctrl+F2', '', 'ak-btn--acao')}${BTN('fluxo', gitFork, 'Fluxo do documento', 'Ctrl+F9')}`, teclasExtra: '',
  janelas: { titulo: 'Orçamento', icone: fileSpreadsheet, estados: ['gravado', 'anulado', 'janela', 'fechado'] },
  tabs: [{ k: 'detalhes', t: 'Detalhes', ic: info }, { k: 'linhas', t: 'Linhas', ic: list }, { k: 'anexos', t: 'Anexos', ic: paperclip }],
  painel, ficha, gravar, kpis, rapidos,
  porque: {
    novo: (e) => podeV(e.perfil) ? '' : 'O teu perfil só consulta os orçamentos.',
    editar: (e, d) => !d ? 'Escolhe um orçamento na lista.' : !podeV(e.perfil) ? 'O teu perfil só consulta os orçamentos.' : editavel(e, d) ? '' : d.anulado ? 'O orçamento está anulado: só se vê (Enter).' : 'Fechado: já não se altera. Enter abre-o para ver.',
    anular: (e, d) => !d ? 'Escolhe um orçamento na lista.' : !podeV(e.perfil) ? 'O teu perfil não anula orçamentos.' : d.anulado ? 'Já está anulado.' : '',
  },
  anular: {
    texto: (d) => [`Anular o ${String(d.ref)}?`, 'Nada se apaga: fica no histórico, anulado, com o motivo.'],
    fazer: (e, d, motivo) => { const x = anularOrc(e.perfil, String(d.ref), motivo); return `${x.ref} anulado. Fica no histórico.`; },
  },
  docAnexo: (d) => d.id,
  teclas: [{ tecla: 'Ctrl+F2', acao: 'fechar-orc' }, { tecla: 'Ctrl+F9', acao: 'fluxo' }],
  acao(r, e, k, b) {
    if (k === '_barra') {
      const d = ativoDe(r, e), set = (a: string, t: string, tit: string) => { const x = r.querySelector<HTMLElement>(`.dv2-barra [data-dv2-acao="${a}"]`); if (x && !e.ocupado) { x.setAttribute('aria-disabled', String(!!t)); x.title = t || tit; } };
      set('negociar', porqueFase(e, d, 'neg'), 'Passar a negociação'); set('fechar-orc', porqueFase(e, d, 'fecho'), 'Fechar o orçamento (Ctrl+F2)'); set('fluxo', d ? '' : 'Escolhe um orçamento na lista.', 'Fluxo do documento (Ctrl+F9)');
      return true;
    }
    if (k === '_ficha-aberta') { recalcular(r); return true; }
    if (k === '_ficha-input') { const i = b as HTMLInputElement; recalcular(r, i.dataset.dv2L === 'ref' ? i : undefined); return true; }
    if (k === 'orc-tipo') {
      const t = b.dataset.orcvTipo!, fx = r.querySelector<HTMLElement>('[data-orcv-ficha]'); if (!fx) return true;
      fx.classList.toggle('is-avancada', t === 'Avançada'); fx.querySelector<HTMLInputElement>('[data-dv2-ff="tipo"]')!.value = t;
      fx.querySelectorAll<HTMLElement>('[data-orcv-tipo]').forEach((x) => x.setAttribute('aria-checked', String(x.dataset.orcvTipo === t)));
      if (e.ficha) e.ficha.sujo = true; recalcular(r); return true;
    }
    if (k === 'negociar') { const p = porqueFase(e, ativoDe(r, e), 'neg'); if (p) toast(r, p); else fase(r, e, 'Negociação', null); return true; }
    if (k === 'fechar-orc') { dlgFechar(r, e); return true; }
    if (k === 'fechar-sim' || k === 'fechar-nao') { fase(r, e, 'Fecho', k === 'fechar-sim'); return true; }
    if (k === 'fluxo') { dlgFluxo(r, e); return true; }
    if (k === 'add-linha') { const tb = r.querySelector<HTMLElement>('[data-dv2-ficha] [data-dv2-linhas]')!; tb.insertAdjacentHTML('beforeend', linhaFicha(tb.children.length)); (tb.lastElementChild as HTMLElement).querySelector<HTMLElement>('input')?.focus(); if (e.ficha) e.ficha.sujo = true; return true; }
    if (k === 'del-linha') { const tr = b.closest('tr'), tb = tr?.parentElement; if (tr && tb && tb.children.length > 1) { tr.remove(); recalcular(r); if (e.ficha) e.ficha.sujo = true; (tb.querySelector('input') as HTMLElement | null)?.focus(); } else toast(r, 'O orçamento precisa de pelo menos um artigo.'); return true; }
    if (k === 'limpar') e.extra.tipo = '';
    return false;
  },
  cenario(r, e, cen) {
    const ls = linhas(e), aberto = ls.find((d) => !d.anulado && d.fase === 'Orçamentação'), av = ls.find((d) => !d.anulado && d.tipo === 'Avançada' && d.fase !== 'Fecho');
    if (cen === 'so-base') e.extra.tipo = 'Base';
    if (cen === 'so-avancada') e.extra.tipo = 'Avançada';
    if (cen === 'historico') e.f.estado = 'hist';
    /* 25 nov.: as outras opções do submenu Orçamentação abrem este ecrã já filtrado */
    if (cen === 'neg-base') { e.extra.tipo = 'Base'; e.f.estado = 'neg'; }
    if (cen === 'neg-avancada') { e.extra.tipo = 'Avançada'; e.f.estado = 'neg'; }
    if (cen === 'fecho') e.f.estado = 'abertos';
    if (cen === 'editar' && aberto) e.ativo = aberto.id;
    if (cen === 'criar-avancada') e.extra.tipoNovo = 'Avançada';
    if ((cen === 'janela' || cen === 'linhas-avancada') && av) { e.ativo = av.id; if (cen === 'linhas-avancada') e.tab = 'linhas'; }
    requestAnimationFrame(() => {
      if (cen === 'fechar' && aberto) { e.ativo = aberto.id; tudo(r, e); dlgFechar(r, e); }
      if (cen === 'fluxo') { const f = ls.find((d) => d.fase === 'Fecho' && d.aceite === 'Sim'); if (f) { e.ativo = f.id; tudo(r, e); dlgFluxo(r, e); } }
      if (cen === 'criar-avancada') r.querySelector<HTMLElement>('[data-dv2-acao="novo"]')?.click();
    });
  },
  dica: 'O tipo (Base ou Avançada) filtra a lista. Ctrl+F2 fecha o orçamento; Ctrl+F9 mostra o fluxo.',
} as CfgDoc);

/* ---------- os ecrãs ---------- */
const NOTA = 'Orçamentação (25 nov., da janela «Gestão de Orçamentos de Clientes - Orçamentação» do ERP antigo; ela: «base e avançado no mesmo screen»): as colunas do antigo (Número, Data, Nr. Consulta, #Cliente, Nome, Fase, Aceite, #Moeda, Valor, #Utilizador) mais o Tipo; Base e Avançada no mesmo ecrã (filtro Tipo, e a ficha muda com o tipo: a Avançada junta o 2.º desconto, o custo, a margem e o prazo por linha); as fases do submenu do antigo (Orçamentação → Negociação → Fecho, com Aceite) e o Histórico como filtro; Anular (F8) com motivo; Fluxo do documento (Ctrl+F9); a pesquisa F1 F2 F10 F12; as janelas e os anexos.';
const ESTADOS: [string, string, string][] = [
  ['so-base', '80.1 · Só os orçamentos base', 'O filtro Tipo em Base.'],
  ['so-avancada', '80.2 · Só os avançados', 'O filtro Tipo em Avançada: a margem de cada um.'],
  ['historico', '80.3 · Histórico', 'Os fechados e os anulados (o «Histórico…» do submenu do antigo).'],
  ['neg-base', '80.17 · Negociação base', 'Vendas ▸ Orçamentação ▸ Negociação Base: os orçamentos base em negociação.'],
  ['neg-avancada', '80.18 · Negociação avançada', 'Vendas ▸ Orçamentação ▸ Negociação Avançada: os avançados em negociação, com a margem.'],
  ['fecho', '80.19 · Fecho', 'Vendas ▸ Orçamentação ▸ Fecho: os orçamentos em aberto, para fechar com Ctrl+F2 (aceite ou não).'],
  ['janela', '80.4 · Um orçamento numa janela', 'Detalhes, Linhas e Anexos; a lista fica à vista.'],
  ['linhas-avancada', '80.5 · As linhas de um avançado', 'Desconto 1 e 2, custo, margem e prazo por linha.'],
  ['criar', '80.6 · Novo orçamento (base)', 'Novo (F5): cliente, consulta, validade e artigos; o preço vem da tabela.'],
  ['criar-avancada', '80.7 · Novo orçamento avançado', 'O tipo Avançada mostra o 2.º desconto, o custo, a margem e o prazo.'],
  ['editar', '80.8 · Editar', 'Até se fechar, tudo se altera.'],
  ['fechar', '80.9 · Fechar (Ctrl+F2)', 'O cliente aceitou? Aceite ou Não aceite; fechado, já não se altera.'],
  ['fluxo', '80.10 · Fluxo do documento (Ctrl+F9)', 'Consulta → orçamento → negociação → fecho → encomenda do cliente.'],
  ['anular', '80.11 · Anular (F8)', 'Nada se apaga: pede o motivo.'],
  ['vazia', '80.12 · Sem orçamentos', 'Ainda não há orçamentos: Novo (F5).'],
  ['sem-resultados', '80.13 · Pesquisa sem resultados', 'Diz em que modo se procurou; oferece Contendo e Limpar.'],
  ['carregar', '80.14 · A carregar', 'A lista em esqueleto.'],
  ['permissao', '80.15 · Sem permissão', 'O perfil só consulta: as ações dizem porquê.'],
  ['offline', '80.16 · Sem ligação', 'Sem rede: a pesquisa e os filtros ficam.'],
];
export type IdOrcV = 'vendas-orcamentacao' | `orcv-${string}`;
const clientesDaLista = (): [string, string][] => CLIENTES.map((c) => [c.num, `${c.num} · ${c.nome}`]);
export function ecrasOrcamentacao(): Ecra<IdErp>[] {
  const v = (cen: string) => ({ id: 'v1', nota: NOTA, html: paginaDoc(CFG, cen, clientesDaLista()) });
  return [
    { id: 'vendas-orcamentacao', nome: '80 · Orçamentação', fluxo: 'Vendas', objetivo: 'Os orçamentos a clientes, base e avançados no mesmo ecrã: da consulta à negociação e ao fecho (aceite ou não), com o fluxo do documento.', versoes: [v('normal')] as Ecra<IdErp>['versoes'] },
    ...ESTADOS.map(([cen, nome, objetivo]) => ({ id: `orcv-${cen}` as IdErp, nome, fluxo: 'Vendas', estadoDe: 'vendas-orcamentacao' as IdErp, objetivo, versoes: [v(cen)] as Ecra<IdErp>['versoes'] })),
  ];
}
/** O filtro Tipo (Base / Avançada): o resto do comportamento é do motor. */
export function iniciar(): void {
  document.addEventListener('change', (ev) => {
    const t = ev.target as HTMLSelectElement; if (!t.matches?.('[data-orcv-tipo-f]')) return;
    const r = t.closest<HTMLElement>('[data-dv2="orcv"]'); if (!r) return; const e = de(r);
    e.extra.tipo = t.value; tudo(r, e, true);
  });
}
