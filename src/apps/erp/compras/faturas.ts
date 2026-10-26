/* =========================================================
   ERP — Compras: as faturas de fornecedores e as notas de crédito (26 out. 2026), para as Faturas de Compra v2 e o Mapa
   Recapitulativo v2. O protótipo não tinha faturas: estas são de exemplo e saem das receções que existem (as mesmas
   encomendas, os mesmos artigos e os preços delas), mais uma venda a dinheiro sem encomenda. Guardam-se neste computador
   (localStorage «erp:faturas:v1»), como o resto do protótipo de Compras.
   As regras do protótipo (no produto são da API de contabilidade):
     - o período contabilístico aberto é o mês de HOJE (outubro de 2026): uma fatura de um mês fechado não se cria, não
       se altera nem se anula;
     - o mesmo documento do mesmo fornecedor não se regista duas vezes (as anuladas não contam);
     - registar e alterar: Compras, Financeiro e Administração; bloquear, creditar e anular: Financeiro e Administração;
     - uma fatura com notas de crédito não se altera nem se anula (anula-se primeiro o crédito, fora deste ecrã);
     - o crédito nunca passa o que falta creditar; a mesma chave devolve o mesmo crédito (não há créditos repetidos);
     - bloquear não é anular: a fatura bloqueada fica, à espera, e não recebe crédito até se desbloquear.
   Os valores são em cêntimos; o IVA é o da taxa de cada linha (a dos artigos), como nas encomendas.
   ========================================================= */
import { encomenda, rececao, rececoes, artigo, fornecedor, ev, agora, dia, euros, HOJE, Recusa, type Evento } from './dominio';
import type { IdPerfil } from '../inicio-dados';

export type TipoFat = 'FT' | 'VD' | 'ND';
export const NOME_TIPO: Record<TipoFat | 'NC' | 'ALD' | 'ALC', string> = { FT: 'Fatura', VD: 'Venda a dinheiro', ND: 'Nota de débito', NC: 'Nota de crédito', ALD: 'Aviso de lançamento a débito', ALC: 'Aviso de lançamento a crédito' };
export interface LinhaFat { id: string; tipo: 'artigo' | 'servico'; ref: string; desc: string; qtd: number; preco: number; desconto: number; iva: number }
export interface Fatura {
  ref: string; tipo: TipoFat; data: string; docForn: string; dataDocForn: string; forn: string; moeda: 'EUR'; enc: string; rec: string; notas: string;
  linhas: LinhaFat[]; bloqueada: boolean; motivoBloqueio: string; anulada: boolean; criador: IdPerfil; versao: number; historico: Evento[]; creditos: string[];
}
export interface NotaCredito { ref: string; fatura: string; data: string; valor: number; motivo: string; chave: string; por: IdPerfil }

const arred = (n: number, d: number) => Math.floor((n * 2 + d) / (2 * d));
export const liquidoLinha = (l: Pick<LinhaFat, 'qtd' | 'preco' | 'desconto'>) => arred(l.qtd * l.preco * (10000 - l.desconto), 10000);
export function totaisFat(f: Pick<Fatura, 'linhas'>): { liquido: number; iva: { taxa: number; base: number; valor: number }[]; total: number } {
  const m = new Map<number, number>(); let liquido = 0;
  f.linhas.forEach((l) => { const v = liquidoLinha(l); liquido += v; m.set(l.iva, (m.get(l.iva) ?? 0) + v); });
  const iva = [...m].sort((a, b) => b[0] - a[0]).map(([taxa, base]) => ({ taxa, base, valor: arred(base * taxa, 10000) }));
  return { liquido, iva, total: liquido + iva.reduce((s, x) => s + x.valor, 0) };
}

/* ---------- a semente: das receções do protótipo ---------- */
function semente(): { fat: Fatura[]; nc: NotaCredito[]; series: Record<string, number> } {
  const daRec = (rc: string, i: number, precoDe?: (ref: string, p: number) => number): LinhaFat[] => {
    const r = rececao(rc); const e = r ? encomenda(r.enc) : undefined; if (!r || !e) return [];
    return r.linhas.map((l, k) => { const le = e.linhas.find((x) => x.id === l.linha)!; const p = le.preco ?? 0; return { id: String.fromCharCode(97 + k), tipo: 'artigo' as const, ref: l.ref, desc: artigo(l.ref)?.desc ?? '', qtd: l.aceite, preco: precoDe ? precoDe(l.ref, p) : p, desconto: le.desc, iva: le.iva }; }).map((x, k) => ({ ...x, id: `${i}${String.fromCharCode(97 + k)}` }));
  };
  const h = (q: string, a: string, d?: string, doc?: string) => ev(q, 'financeiro', a, d, doc);
  const fat: Fatura[] = [
    { ref: 'FC 2026/00124', tipo: 'VD', data: '2026-10-18', docForn: 'RN-VD-3301', dataDocForn: '2026-10-18', forn: 'rnorte', moeda: 'EUR', enc: '', rec: '', notas: 'Transporte urgente de rolamentos (sem encomenda).',
      linhas: [{ id: 'a', tipo: 'servico', ref: '', desc: 'Transporte urgente Braga → Coimbra', qtd: 1, preco: 4500, desconto: 0, iva: 2300 }], bloqueada: false, motivoBloqueio: '', anulada: false, criador: 'financeiro', versao: 1, historico: [h('18/10/2026 15:20', 'Registou a venda a dinheiro')], creditos: [] },
    { ref: 'FC 2026/00123', tipo: 'FT', data: '2026-10-17', docForn: 'BR-FT-77120', dataDocForn: '2026-10-16', forn: 'brembo', moeda: 'EUR', enc: 'EF 2026/0411', rec: 'RC 2026/0187', notas: '',
      linhas: daRec('RC 2026/0187', 3), bloqueada: false, motivoBloqueio: '', anulada: false, criador: 'compras', versao: 1, historico: [h('17/10/2026 09:10', 'Registou a fatura', 'Da RC 2026/0187', 'RC 2026/0187')], creditos: [] },
    { ref: 'FC 2026/00122', tipo: 'FT', data: '2026-10-13', docForn: 'UF-F-2026-1190', dataDocForn: '2026-10-12', forn: 'ufi', moeda: 'EUR', enc: 'EF 2026/0410', rec: 'RC 2026/0185', notas: '',
      linhas: daRec('RC 2026/0185', 2), bloqueada: false, motivoBloqueio: '', anulada: false, criador: 'compras', versao: 2, historico: [h('13/10/2026 10:00', 'Registou a fatura', 'Da RC 2026/0185', 'RC 2026/0185'), h('15/10/2026 11:30', 'Lançou o crédito', 'NC 2026/0031 · 36,90 € · rappel de outubro', 'NC 2026/0031')], creditos: ['NC 2026/0031'] },
    { ref: 'FC 2026/00121', tipo: 'FT', data: '2026-10-08', docForn: 'NGK-INV-4410', dataDocForn: '2026-10-07', forn: 'ngk', moeda: 'EUR', enc: 'EF 2026/0406', rec: 'RC 2026/0183', notas: '',
      linhas: daRec('RC 2026/0183', 1, () => 410), bloqueada: true, motivoBloqueio: 'Preço da fatura acima da encomenda (3,95 € → 4,10 € no BKR6E); pedida nota de crédito à NGK.', anulada: false, criador: 'compras', versao: 2,
      historico: [h('08/10/2026 16:00', 'Registou a fatura', 'Da RC 2026/0183', 'RC 2026/0183'), h('09/10/2026 09:15', 'Bloqueou', 'Preço da fatura acima da encomenda')], creditos: [] },
    { ref: 'FC 2026/00120', tipo: 'FT', data: '2026-09-29', docForn: 'TRW-2026-88012', dataDocForn: '2026-09-28', forn: 'trw', moeda: 'EUR', enc: '', rec: '', notas: 'Registada em duplicado por engano.',
      linhas: [{ id: 'a', tipo: 'artigo', ref: 'GDB1330', desc: artigo('GDB1330')?.desc ?? '', qtd: 40, preco: 1530, desconto: 0, iva: 2300 }], bloqueada: false, motivoBloqueio: '', anulada: true, criador: 'compras', versao: 2,
      historico: [h('29/09/2026 10:00', 'Registou a fatura'), h('29/09/2026 10:40', 'Anulou', 'Registada em duplicado por engano')], creditos: [] },
  ];
  const nc: NotaCredito[] = [{ ref: 'NC 2026/0031', fatura: 'FC 2026/00122', data: '2026-10-15', valor: 3690, motivo: 'Rappel de outubro', chave: 'semente-31', por: 'financeiro' }];
  return { fat, nc, series: { 'FC 2026': 124, 'NC 2026': 31 } };
}
const CHAVE = 'erp:faturas:v1';
type Base = ReturnType<typeof semente>;
let base: Base | null = null;
function ler(): Base { try { const v = localStorage.getItem(CHAVE); if (v) return JSON.parse(v) as Base; } catch { /* sem armazenamento */ } return semente(); }
const db = (): Base => { if (!base) base = ler(); return base; };
function gravar(): void { try { localStorage.setItem(CHAVE, JSON.stringify(base)); } catch { /* fica na memória */ } }
const proximo = (s: string) => { db().series[s] = (db().series[s] ?? 0) + 1; return `${s}/${String(db().series[s]).padStart(s === 'FC 2026' ? 5 : 4, '0')}`; };
export const faturas = () => db().fat.slice().sort((a, b) => b.ref.localeCompare(a.ref));
export const fatura = (ref: string) => db().fat.find((f) => f.ref === ref);
export const notasCredito = () => db().nc.slice();
export const creditosDe = (ref: string) => db().nc.filter((n) => n.fatura === ref);
export const creditado = (f: Fatura) => creditosDe(f.ref).reduce((s, n) => s + n.valor, 0);

/* ---------- as regras ---------- */
export type AcaoFat = 'registar' | 'bloquear' | 'creditar' | 'anular';
const PODE_F: Record<AcaoFat, IdPerfil[]> = { registar: ['compras', 'financeiro', 'admin'], bloquear: ['financeiro', 'admin'], creditar: ['financeiro', 'admin'], anular: ['financeiro', 'admin'] };
export const podeF = (p: IdPerfil, a: AcaoFat) => PODE_F[a].includes(p);
export const PERIODO = HOJE.slice(0, 7);
export const periodoAberto = (iso: string) => iso.slice(0, 7) === PERIODO;
const NOME_PERIODO = 'outubro de 2026';
export function porqueAlterar(p: IdPerfil, f: Fatura): string {
  if (!podeF(p, 'registar')) return 'O teu perfil só consulta as faturas.';
  if (f.anulada) return 'A fatura está anulada: só se vê.';
  if (f.creditos.length) return 'Tem notas de crédito: já não se altera.';
  if (!periodoAberto(f.data)) return `O período de ${dia(f.data).slice(3)} está fechado: a fatura já não se altera.`;
  return '';
}
export function porqueAnular(p: IdPerfil, f: Fatura): string {
  if (!podeF(p, 'anular')) return 'Só o Financeiro e a Administração anulam faturas.';
  if (f.anulada) return 'Já está anulada.';
  if (f.creditos.length) return 'Tem notas de crédito: anula-se primeiro o crédito.';
  if (!periodoAberto(f.data)) return `O período de ${dia(f.data).slice(3)} está fechado: não se anula.`;
  return '';
}
export function porqueCreditar(p: IdPerfil, f: Fatura): string {
  if (!podeF(p, 'creditar')) return 'Só o Financeiro e a Administração lançam créditos.';
  if (f.anulada) return 'A fatura está anulada.';
  if (f.bloqueada) return 'A fatura está bloqueada: desbloqueia-a primeiro.';
  if (creditado(f) >= totaisFat(f).total) return 'Já está toda creditada.';
  return '';
}
/** Valida uma fatura nova ou alterada; o duplicado é o mesmo documento do mesmo fornecedor (anuladas à parte). */
export function problemasFat(f: Pick<Fatura, 'ref' | 'forn' | 'docForn' | 'data' | 'dataDocForn' | 'linhas'>): [string, string][] {
  const m: [string, string][] = [];
  if (!fornecedor(f.forn)) m.push(['Escolhe o fornecedor.', 'forn']);
  if (!f.docForn.trim()) m.push(['Escreve o número do documento do fornecedor.', 'docForn']);
  if (!f.data) m.push(['Diz a data da fatura.', 'data']);
  else if (!periodoAberto(f.data)) m.push([`A data tem de ser de ${NOME_PERIODO}: é o único período aberto.`, 'data']);
  if (!f.dataDocForn) m.push(['Diz a data do documento do fornecedor.', 'dataDocForn']);
  else if (f.data && f.dataDocForn > f.data) m.push(['O documento do fornecedor não pode ser posterior à fatura.', 'dataDocForn']);
  if (!f.linhas.length) m.push(['Junta pelo menos uma linha.', 'l-0']);
  const d = db().fat.find((x) => !x.anulada && x.ref !== f.ref && x.forn === f.forn && x.docForn.trim().toLowerCase() === f.docForn.trim().toLowerCase());
  if (d) m.push([`Documento repetido: a ${d.ref} já tem o documento ${d.docForn} de ${fornecedor(f.forn)?.nome}.`, 'docForn']);
  return m;
}
export function registarFat(p: IdPerfil, f: Omit<Fatura, 'ref' | 'versao' | 'historico' | 'creditos' | 'bloqueada' | 'motivoBloqueio' | 'anulada' | 'criador'>): Fatura {
  if (!podeF(p, 'registar')) throw new Recusa('O teu perfil não regista faturas.', 'permissao');
  const pr = problemasFat({ ...f, ref: '' }); if (pr.length) throw Object.assign(new Recusa(pr[0][0], pr[0][0].startsWith('Documento repetido') ? 'conflito' : 'validacao'), { campo: pr[0][1] });
  const n: Fatura = { ...f, ref: proximo('FC 2026'), bloqueada: false, motivoBloqueio: '', anulada: false, criador: p, versao: 1, creditos: [], historico: [ev(agora(), p, 'Registou a fatura', f.rec ? `Da ${f.rec}` : undefined, f.rec || undefined)] };
  db().fat.push(n); gravar(); return n;
}
export function alterarFat(p: IdPerfil, nova: Fatura, versao: number): Fatura {
  base = ler();
  const f = fatura(nova.ref); if (!f) throw new Recusa('A fatura já não existe.', 'estado');
  const porque = porqueAlterar(p, f); if (porque) throw new Recusa(porque, porque.includes('perfil') ? 'permissao' : 'estado');
  if (f.versao !== versao) throw new Recusa('Alguém gravou esta fatura depois de a abrires.', 'conflito');
  const pr = problemasFat(nova); if (pr.length) throw Object.assign(new Recusa(pr[0][0]), { campo: pr[0][1] });
  Object.assign(f, { docForn: nova.docForn, dataDocForn: nova.dataDocForn, data: nova.data, notas: nova.notas, linhas: nova.linhas.map((l) => ({ ...l })), enc: nova.enc, rec: nova.rec, tipo: nova.tipo });
  f.versao++; f.historico.push(ev(agora(), p, 'Alterou a fatura', `${f.linhas.length} linhas · ${euros(totaisFat(f).total)}`)); gravar(); return f;
}
export function bloquearFat(p: IdPerfil, ref: string, sim: boolean, motivo: string): Fatura {
  base = ler(); const f = fatura(ref); if (!f) throw new Recusa('A fatura já não existe.', 'estado');
  if (!podeF(p, 'bloquear')) throw new Recusa('Só o Financeiro e a Administração bloqueiam faturas.', 'permissao');
  if (f.anulada) throw new Recusa('A fatura está anulada.', 'estado');
  if (f.bloqueada === sim) throw new Recusa(sim ? 'Já está bloqueada.' : 'Não está bloqueada.', 'estado');
  if (sim && !motivo.trim()) throw new Recusa('Diz porque bloqueias: quem paga precisa de saber.');
  f.bloqueada = sim; f.motivoBloqueio = sim ? motivo.trim() : '';
  f.versao++; f.historico.push(ev(agora(), p, sim ? 'Bloqueou' : 'Desbloqueou', motivo.trim() || undefined)); gravar(); return f;
}
export function anularFat(p: IdPerfil, ref: string, motivo: string): Fatura {
  base = ler(); const f = fatura(ref); if (!f) throw new Recusa('A fatura já não existe.', 'estado');
  const porque = porqueAnular(p, f); if (porque) throw new Recusa(porque, porque.includes('Só o') ? 'permissao' : 'estado');
  if (!motivo.trim()) throw new Recusa('Diz porque anulas.');
  f.anulada = true; f.versao++; f.historico.push(ev(agora(), p, 'Anulou', motivo.trim())); gravar(); return f;
}
/** Lança uma nota de crédito. A mesma chave devolve a mesma nota (repetir o pedido não duplica). */
export function lancarCredito(p: IdPerfil, ref: string, valor: number, motivo: string, chave: string): { nc: NotaCredito; repetido: boolean } {
  base = ler();
  const ja = db().nc.find((n) => n.chave === chave); if (ja) return { nc: ja, repetido: true };
  const f = fatura(ref); if (!f) throw new Recusa('A fatura já não existe.', 'estado');
  const porque = porqueCreditar(p, f); if (porque) throw new Recusa(porque, porque.includes('Só o') ? 'permissao' : 'estado');
  const falta = totaisFat(f).total - creditado(f);
  if (!Number.isInteger(valor) || valor <= 0) throw Object.assign(new Recusa('O valor do crédito é maior do que zero, em euros (ex.: 25,00).'), { campo: 'valor' });
  if (valor > falta) throw Object.assign(new Recusa(`O crédito não pode passar o que falta creditar: ${euros(falta)}.`), { campo: 'valor' });
  if (!motivo.trim()) throw Object.assign(new Recusa('Diz o motivo do crédito.'), { campo: 'motivo' });
  const nc: NotaCredito = { ref: proximo('NC 2026'), fatura: f.ref, data: HOJE, valor, motivo: motivo.trim(), chave, por: p };
  db().nc.push(nc); f.creditos.push(nc.ref); f.versao++;
  f.historico.push(ev(agora(), p, 'Lançou o crédito', `${nc.ref} · ${euros(valor)} · ${motivo.trim()}`, nc.ref)); gravar();
  return { nc, repetido: false };
}

/* ---------- a verificação contra a encomenda e a receção ---------- */
export interface Verificacao { ok: boolean; linhas: { t: string; nivel: 'ok' | 'aviso' | 'erro' }[] }
export function verificar(f: Fatura): Verificacao {
  const ls: Verificacao['linhas'] = [];
  const e = f.enc ? encomenda(f.enc) : undefined, r = f.rec ? rececao(f.rec) : undefined;
  if (!f.enc) ls.push({ t: 'Sem encomenda ligada: nada a comparar.', nivel: 'aviso' });
  else if (!e) ls.push({ t: `A encomenda ${f.enc} não existe.`, nivel: 'erro' });
  if (f.rec && !r) ls.push({ t: `A receção ${f.rec} não existe.`, nivel: 'erro' });
  if (e) f.linhas.filter((l) => l.tipo === 'artigo').forEach((l) => {
    const le = e.linhas.find((x) => x.ref === l.ref);
    if (!le) { ls.push({ t: `${l.ref}: não está na ${e.ref}.`, nivel: 'erro' }); return; }
    if (le.preco !== null && le.preco !== l.preco) ls.push({ t: `${l.ref}: preço ${euros(l.preco)} na fatura, ${euros(le.preco)} na encomenda (${l.preco > le.preco ? '+' : ''}${euros(l.preco - le.preco)} por unidade).`, nivel: 'erro' });
    const aceite = r?.linhas.filter((x) => x.ref === l.ref).reduce((s, x) => s + x.aceite, 0) ?? (rececoes().filter((x) => x.enc === e.ref).flatMap((x) => x.linhas).filter((x) => x.ref === l.ref).reduce((s, x) => s + x.aceite, 0));
    if (aceite !== l.qtd) ls.push({ t: `${l.ref}: ${l.qtd} faturados, ${aceite} recebidos.`, nivel: 'erro' });
  });
  const dup = db().fat.filter((x) => x.ref !== f.ref && !x.anulada && x.forn === f.forn && x.docForn.toLowerCase() === f.docForn.toLowerCase());
  if (dup.length) ls.push({ t: `Documento do fornecedor repetido na ${dup.map((x) => x.ref).join(', ')}.`, nivel: 'erro' });
  if (!ls.some((x) => x.nivel === 'erro') && e) ls.push({ t: `Preços e quantidades batem certo com a ${e.ref}${r ? ` e a ${r.ref}` : ''}.`, nivel: 'ok' });
  return { ok: !ls.some((x) => x.nivel === 'erro'), linhas: ls };
}
