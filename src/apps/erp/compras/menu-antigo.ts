/* =========================================================
   ERP — os ecrãs do menu Compras do ERP antigo (23 out. 2026). Ela mostrou o menu (Lista de faltas … Mapas ▸ …) e
   pediu «no figma coloca tudo available»: cada item abre agora um ecrã de consulta num separador, com a mesma forma
   dos Ficheiros (procurar, ordenar, detalhe ao lado). Os números saem todos das encomendas e das receções do
   protótipo (compras/dominio.ts) — nada se inventa:
     - o que o protótipo ainda não tem (faturas, linhas rejeitadas, o ano anterior) diz-se na nota e no vazio;
     - «Clientes — encomendas especiais» e o «automático» vêm da Lista de faltas (o cliente e o mínimo de exemplo).
   Ecrãs 40–67 (cm-<id da linha do menu>); as rotas registam-se em espaco.ts (MENU_ANTIGO).
   ========================================================= */
import type { Ecra } from '../../../comum/tipos';
import type { IdErp } from '../ids';
import { paginaTabela, familiaDe, det, type Tabela, type Linha, type Col } from '../ficheiros/ecras';
import { encomendas, rececoes, FORNECEDORES, ARTIGOS, linhaLiquida, totais, euros, dia, atrasada, pendente, diasAtraso, HOJE, type Encomenda } from './dominio';
import { faltas } from './faltas';
import { MENU_ANTIGO } from './menu-antigo-ids';

const n = (k: number) => k.toLocaleString('pt-PT');
const eur = (c: number | null) => (c === null ? '—' : euros(c));
const fNome = (id: string) => FORNECEDORES.find((f) => f.id === id)?.nome ?? id;
const art = (ref: string) => ARTIGOS.find((a) => a.ref === ref);
const encDe = (ref: string) => encomendas().find((e) => e.ref === ref);
const preco = (enc: string, ref: string) => encDe(enc)?.linhas.find((l) => l.ref === ref)?.preco ?? art(ref)?.preco ?? null;
const vivas = () => encomendas().filter((e) => e.estado !== 'Cancelada' && e.estado !== 'Rascunho');
const MES = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
const mes = (iso: string) => `${MES[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
const C = (k: string, t: string, o: Partial<Col> = {}): Col => ({ k, t, ...o });
const SEM_2025 = 'O protótipo só tem compras de 2026: a coluna de 2025 e a variação ficam por preencher até haver histórico.';

/** Agrupa as linhas das encomendas (não rascunhos nem canceladas) por uma chave e soma quantidade e valor. */
function porChave(chave: (e: Encomenda, ref: string) => string) {
  const m = new Map<string, { qtd: number; valor: number; encs: Set<string>; refs: Set<string>; forn: Set<string>; meses: Map<string, number> }>();
  for (const e of vivas()) for (const l of e.linhas) {
    const k = chave(e, l.ref), v = linhaLiquida(l) ?? 0;
    const x = m.get(k) ?? { qtd: 0, valor: 0, encs: new Set(), refs: new Set(), forn: new Set(), meses: new Map() };
    x.qtd += l.qtd; x.valor += v; x.encs.add(e.ref); x.refs.add(l.ref); x.forn.add(fNome(e.forn)); x.meses.set(mes(e.data), (x.meses.get(mes(e.data)) ?? 0) + v);
    m.set(k, x);
  }
  return [...m.entries()].sort((a, b) => b[1].valor - a[1].valor);
}
const meses = () => [...new Set(vivas().map((e) => e.data.slice(0, 7)))].sort().map((m) => mes(`${m}-01`));
/** As linhas rejeitadas nas receções (para devolver e pedir crédito). Hoje não há nenhuma no protótipo. */
const rejeitadas = () => rececoes().flatMap((r) => r.linhas.filter((l) => l.rejeitada > 0).map((l) => ({ r, l, e: encDe(r.enc) })));
const VAZIO_REJ: [string, string] = ['Nada rejeitado.', 'Nenhuma receção teve artigos rejeitados: não há nada a devolver nem crédito a pedir ao fornecedor.'];

type Def = Omit<Tabela, 'id' | 'num' | 'caminho'>;
const D: Record<typeof MENU_ANTIGO[number], Def> = {
  'compras-agendamento': { titulo: 'Agendamento de encomendas', ic: 'calendar-clock', um: 'entrega', varios: 'entregas', procura: 'Encomenda, fornecedor ou artigo', nota: 'O que falta receber das encomendas emitidas, pela data de entrega.',
    cols: [C('data', 'Entrega'), C('enc', 'Encomenda', { mono: true }), C('forn', 'Fornecedor'), C('ref', 'Artigo', { mono: true }), C('qtd', 'Por receber', { num: true }), C('est', 'Situação')],
    linhas: () => encomendas().filter((e) => ['Aprovada', 'Emitida', 'Parcialmente recebida'].includes(e.estado)).flatMap((e) => e.linhas.filter((l) => pendente(l) > 0).map((l): Linha => ({
      v: { data: dia(l.entrega), enc: e.ref, forn: fNome(e.forn), ref: l.ref, qtd: n(pendente(l)), est: l.entrega < HOJE ? `Atrasada ${diasAtraso(l.entrega)} dias` : 'No prazo' }, ord: { data: l.entrega, qtd: pendente(l) } }))) },
  'compras-especiais': { titulo: 'Clientes — encomendas especiais', ic: 'user-star', um: 'pedido', varios: 'pedidos', procura: 'Cliente ou artigo', nota: 'Os artigos em falta pedidos por clientes (da Lista de faltas; o cliente é de exemplo).',
    cols: [C('cli', 'Cliente'), C('ref', 'Artigo', { mono: true }), C('desc', 'Descrição'), C('qtd', 'Pedida', { num: true }), C('stock', 'Stock', { num: true }), C('forn', 'Fornecedor')],
    linhas: () => faltas().filter((f) => f.cliente !== '—').map((f) => ({ v: { cli: f.cliente, ref: f.ref, desc: f.desc, qtd: n(f.pedida), stock: n(f.stock), forn: f.fornNome }, ord: { qtd: f.pedida, stock: f.stock } })) },
  'compras-guias-entrada': { titulo: 'Guias de entrada', ic: 'file-input', um: 'guia', varios: 'guias', procura: 'Guia, receção, encomenda ou fornecedor', nota: 'As guias dos fornecedores registadas nas receções do armazém 60.',
    cols: [C('guia', 'Guia', { mono: true }), C('data', 'Data'), C('rec', 'Receção', { mono: true }), C('enc', 'Encomenda', { mono: true }), C('forn', 'Fornecedor'), C('qtd', 'Aceite', { num: true }), C('rej', 'Rejeitada', { num: true })],
    linhas: () => rececoes().map((r) => { const e = encDe(r.enc), q = r.linhas.reduce((s, l) => s + l.aceite, 0), j = r.linhas.reduce((s, l) => s + l.rejeitada, 0); return {
      v: { guia: r.guia, data: dia(r.data), rec: r.ref, enc: r.enc, forn: e ? fNome(e.forn) : '—', qtd: n(q), rej: n(j) }, ord: { data: r.data, qtd: q, rej: j },
      det: det(r.guia, [['Data', dia(r.data)], ['Receção', r.ref], ['Encomenda', r.enc], ['Fornecedor', e ? fNome(e.forn) : '—'], ['Armazém', r.armazem]], r.linhas.map((l) => `${l.ref} · ${n(l.aceite)} aceite${l.rejeitada ? ` · ${n(l.rejeitada)} rejeitada` : ''}`), '', 'Linhas') }; }) },
  'compras-guias-transporte': { titulo: 'Guias de transporte a fornecedor', ic: 'truck', um: 'guia', varios: 'guias', procura: 'Fornecedor ou artigo', nota: 'O que volta ao fornecedor: as linhas rejeitadas nas receções.', vazio: VAZIO_REJ,
    cols: [C('rec', 'Receção', { mono: true }), C('forn', 'Fornecedor'), C('ref', 'Artigo', { mono: true }), C('qtd', 'Quantidade', { num: true }), C('mot', 'Motivo')],
    linhas: () => rejeitadas().map(({ r, l, e }) => ({ v: { rec: r.ref, forn: e ? fNome(e.forn) : '—', ref: l.ref, qtd: n(l.rejeitada), mot: l.motivo || '—' }, ord: { qtd: l.rejeitada } })) },
  'compras-devolucoes': { titulo: 'Devoluções a fornecedor', ic: 'undo-2', um: 'devolução', varios: 'devoluções', procura: 'Fornecedor ou artigo', nota: 'As devoluções saem das linhas rejeitadas nas receções.', vazio: VAZIO_REJ,
    cols: [C('data', 'Data'), C('forn', 'Fornecedor'), C('ref', 'Artigo', { mono: true }), C('qtd', 'Quantidade', { num: true }), C('valor', 'Valor', { num: true })],
    linhas: () => rejeitadas().map(({ r, l, e }) => { const v = (preco(r.enc, l.ref) ?? 0) * l.rejeitada; return { v: { data: dia(r.data), forn: e ? fNome(e.forn) : '—', ref: l.ref, qtd: n(l.rejeitada), valor: euros(v) }, ord: { data: r.data, qtd: l.rejeitada, valor: v } }; }) },
  'compras-faturas': { titulo: 'Faturas', ic: 'receipt', um: 'receção', varios: 'receções', procura: 'Guia, encomenda ou fornecedor', nota: 'O protótipo ainda não tem faturas: aqui estão as receções à espera da fatura, com o valor recebido e o vencimento.',
    cols: [C('guia', 'Guia', { mono: true }), C('enc', 'Encomenda', { mono: true }), C('forn', 'Fornecedor'), C('valor', 'Valor recebido', { num: true }), C('pag', 'Pagamento'), C('venc', 'Vencimento')],
    linhas: () => rececoes().map((r) => { const e = encDe(r.enc), v = r.linhas.reduce((s, l) => s + (preco(r.enc, l.ref) ?? 0) * l.aceite, 0), dias = parseInt(e?.pagamento ?? '0', 10) || 0, venc = new Date(Date.parse(r.data) + dias * 864e5).toISOString().slice(0, 10); return {
      v: { guia: r.guia, enc: r.enc, forn: e ? fNome(e.forn) : '—', valor: euros(v), pag: e?.pagamento ?? '—', venc: dia(venc) }, ord: { valor: v, venc } }; }) },
  'compras-notas-credito': { titulo: 'Notas de crédito', ic: 'file-minus', um: 'nota', varios: 'notas', procura: 'Fornecedor ou artigo', nota: 'O crédito a pedir pelas linhas rejeitadas.', vazio: VAZIO_REJ,
    cols: [C('forn', 'Fornecedor'), C('rec', 'Receção', { mono: true }), C('ref', 'Artigo', { mono: true }), C('valor', 'Crédito', { num: true })],
    linhas: () => rejeitadas().map(({ r, l, e }) => { const v = (preco(r.enc, l.ref) ?? 0) * l.rejeitada; return { v: { forn: e ? fNome(e.forn) : '—', rec: r.ref, ref: l.ref, valor: euros(v) }, ord: { valor: v } }; }) },
  'compras-pendentes': { titulo: 'Pendentes de crédito de fornecedor', ic: 'hourglass', um: 'fornecedor', varios: 'fornecedores', procura: 'Fornecedor', nota: 'O crédito por receber, por fornecedor.', vazio: VAZIO_REJ,
    cols: [C('forn', 'Fornecedor'), C('linhas', 'Linhas', { num: true }), C('valor', 'Por creditar', { num: true })],
    linhas: () => { const m = new Map<string, [number, number]>(); rejeitadas().forEach(({ r, l, e }) => { const k = e ? fNome(e.forn) : '—', x = m.get(k) ?? [0, 0]; m.set(k, [x[0] + 1, x[1] + (preco(r.enc, l.ref) ?? 0) * l.rejeitada]); }); return [...m].map(([forn, [k, v]]) => ({ v: { forn, linhas: n(k), valor: euros(v) }, ord: { linhas: k, valor: v } })); } },
  'compras-verificacao': { titulo: 'Verificação de faturas', ic: 'file-check', um: 'encomenda', varios: 'encomendas', procura: 'Encomenda ou fornecedor', nota: 'O encomendado contra o recebido, para conferir a fatura do fornecedor.',
    cols: [C('enc', 'Encomenda', { mono: true }), C('forn', 'Fornecedor'), C('qe', 'Encomendado', { num: true }), C('qr', 'Recebido', { num: true }), C('ve', 'Valor encomendado', { num: true }), C('vr', 'Valor recebido', { num: true }), C('est', 'Situação')],
    linhas: () => encomendas().filter((e) => e.linhas.some((l) => l.recebida > 0)).map((e) => { const qe = e.linhas.reduce((s, l) => s + l.qtd, 0), qr = e.linhas.reduce((s, l) => s + l.recebida, 0), ve = totais(e).liquido, vr = e.linhas.reduce((s, l) => s + (l.preco ?? 0) * l.recebida, 0); return {
      v: { enc: e.ref, forn: fNome(e.forn), qe: n(qe), qr: n(qr), ve: euros(ve), vr: euros(vr), est: qr >= qe ? 'Confere' : 'Falta receber' }, ord: { qe, qr, ve, vr } }; }) },
  'mapas-tot-enc': { titulo: 'Totais de documentos de encomenda', ic: 'chart-bar', um: 'encomenda', varios: 'encomendas', procura: 'Encomenda, fornecedor ou estado', nota: 'Uma linha por encomenda, com o líquido e o total com IVA.',
    cols: [C('ref', 'Encomenda', { mono: true }), C('data', 'Data'), C('forn', 'Fornecedor'), C('est', 'Estado'), C('lin', 'Linhas', { num: true }), C('liq', 'Líquido', { num: true }), C('tot', 'Total c/ IVA', { num: true })],
    linhas: () => encomendas().map((e) => { const t = totais(e); return { v: { ref: e.ref, data: dia(e.data), forn: fNome(e.forn), est: e.estado, lin: n(e.linhas.length), liq: euros(t.liquido), tot: euros(t.total) }, ord: { data: e.data, lin: e.linhas.length, liq: t.liquido, tot: t.total } }; }) },
  'mapas-det-enc': { titulo: 'Detalhes por documentos de encomenda', ic: 'chart-bar', um: 'linha', varios: 'linhas', procura: 'Encomenda, artigo ou fornecedor', nota: 'Todas as linhas das encomendas: quantidade, preço, recebido e valor.',
    cols: [C('enc', 'Encomenda', { mono: true }), C('ref', 'Artigo', { mono: true }), C('desc', 'Descrição'), C('qtd', 'Qtd.', { num: true }), C('preco', 'Preço', { num: true }), C('rec', 'Recebida', { num: true }), C('valor', 'Valor', { num: true })],
    linhas: () => encomendas().flatMap((e) => e.linhas.map((l) => { const v = linhaLiquida(l); return { v: { enc: e.ref, ref: l.ref, desc: art(l.ref)?.desc ?? '—', qtd: n(l.qtd), preco: eur(l.preco), rec: n(l.recebida), valor: eur(v) }, ord: { qtd: l.qtd, preco: l.preco ?? -1, rec: l.recebida, valor: v ?? -1 } }; })) },
  'mapas-tot-ge': { titulo: 'Totais de documentos de guia de entrada', ic: 'chart-bar', um: 'guia', varios: 'guias', procura: 'Guia ou fornecedor', nota: 'Uma linha por guia de entrada, com a quantidade e o valor recebidos.',
    cols: [C('guia', 'Guia', { mono: true }), C('data', 'Data'), C('forn', 'Fornecedor'), C('lin', 'Linhas', { num: true }), C('qtd', 'Quantidade', { num: true }), C('valor', 'Valor', { num: true })],
    linhas: () => rececoes().map((r) => { const e = encDe(r.enc), q = r.linhas.reduce((s, l) => s + l.aceite, 0), v = r.linhas.reduce((s, l) => s + (preco(r.enc, l.ref) ?? 0) * l.aceite, 0); return { v: { guia: r.guia, data: dia(r.data), forn: e ? fNome(e.forn) : '—', lin: n(r.linhas.length), qtd: n(q), valor: euros(v) }, ord: { data: r.data, lin: r.linhas.length, qtd: q, valor: v } }; }) },
  'mapas-det-ge': { titulo: 'Detalhes por documentos de guia de entrada', ic: 'chart-bar', um: 'linha', varios: 'linhas', procura: 'Guia ou artigo', nota: 'Todas as linhas das guias de entrada.',
    cols: [C('guia', 'Guia', { mono: true }), C('ref', 'Artigo', { mono: true }), C('desc', 'Descrição'), C('ace', 'Aceite', { num: true }), C('rej', 'Rejeitada', { num: true }), C('valor', 'Valor', { num: true })],
    linhas: () => rececoes().flatMap((r) => r.linhas.map((l) => { const v = (preco(r.enc, l.ref) ?? 0) * l.aceite; return { v: { guia: r.guia, ref: l.ref, desc: art(l.ref)?.desc ?? '—', ace: n(l.aceite), rej: n(l.rejeitada), valor: euros(v) }, ord: { ace: l.aceite, rej: l.rejeitada, valor: v } }; })) },
  'mapas-recap': { titulo: 'Mapa recapitulativo de fornecedores', ic: 'chart-bar', um: 'fornecedor', varios: 'fornecedores', procura: 'Fornecedor', nota: 'Por fornecedor: encomendas, valor encomendado, recebido e em aberto.',
    cols: [C('forn', 'Fornecedor'), C('encs', 'Encomendas', { num: true }), C('enc', 'Encomendado', { num: true }), C('rec', 'Recebido', { num: true }), C('aberto', 'Em aberto', { num: true }), C('atr', 'Atrasadas', { num: true })],
    linhas: () => FORNECEDORES.map((f): Linha | null => { const es = vivas().filter((e) => e.forn === f.id); if (!es.length) return null; const enc = es.reduce((s, e) => s + totais(e).liquido, 0), rec = es.reduce((s, e) => s + e.linhas.reduce((t, l) => t + (l.preco ?? 0) * l.recebida, 0), 0), atr = es.filter(atrasada).length; return { v: { forn: f.nome, encs: n(es.length), enc: euros(enc), rec: euros(rec), aberto: euros(enc - rec), atr: n(atr) }, ord: { encs: es.length, enc, rec, aberto: enc - rec, atr } }; }).filter((x): x is Linha => !!x) },
  'analise-artigo': { titulo: 'Mapa de compras por artigo', ic: 'chart-bar', um: 'artigo', varios: 'artigos', procura: 'Artigo', nota: 'O que se comprou de cada artigo (encomendas aprovadas em diante).',
    cols: [C('ref', 'Artigo', { mono: true }), C('desc', 'Descrição'), C('qtd', 'Quantidade', { num: true }), C('encs', 'Encomendas', { num: true }), C('valor', 'Valor', { num: true }), C('medio', 'Preço médio', { num: true })],
    linhas: () => porChave((_, r) => r).map(([ref, x]) => ({ v: { ref, desc: art(ref)?.desc ?? '—', qtd: n(x.qtd), encs: n(x.encs.size), valor: euros(x.valor), medio: euros(Math.round(x.valor / Math.max(1, x.qtd))) }, ord: { qtd: x.qtd, encs: x.encs.size, valor: x.valor, medio: x.valor / Math.max(1, x.qtd) } })) },
  'analise-artigo-forn': { titulo: 'Mapa de compras por artigo/fornecedor', ic: 'chart-bar', um: 'linha', varios: 'linhas', procura: 'Artigo ou fornecedor', nota: 'Cada artigo, por fornecedor.',
    cols: [C('ref', 'Artigo', { mono: true }), C('forn', 'Fornecedor'), C('qtd', 'Quantidade', { num: true }), C('valor', 'Valor', { num: true })],
    linhas: () => porChave((e, r) => `${r}\u0000${fNome(e.forn)}`).map(([k, x]) => { const [ref, forn] = k.split('\u0000'); return { v: { ref, forn, qtd: n(x.qtd), valor: euros(x.valor) }, ord: { qtd: x.qtd, valor: x.valor } }; }) },
  'analise-familia': { titulo: 'Mapa de compras por família', ic: 'chart-bar', um: 'família', varios: 'famílias', procura: 'Família', nota: 'Por família (a família sai da descrição do artigo, de exemplo).',
    cols: [C('fam', 'Família'), C('arts', 'Artigos', { num: true }), C('qtd', 'Quantidade', { num: true }), C('valor', 'Valor', { num: true })],
    linhas: () => porChave((_, r) => familiaDe(art(r)?.desc ?? '')).map(([fam, x]) => ({ v: { fam, arts: n(x.refs.size), qtd: n(x.qtd), valor: euros(x.valor) }, ord: { arts: x.refs.size, qtd: x.qtd, valor: x.valor } })) },
  'analise-familia-forn': { titulo: 'Mapa de compras por família/fornecedor', ic: 'chart-bar', um: 'linha', varios: 'linhas', procura: 'Família ou fornecedor', nota: 'Cada família, por fornecedor.',
    cols: [C('fam', 'Família'), C('forn', 'Fornecedor'), C('qtd', 'Quantidade', { num: true }), C('valor', 'Valor', { num: true })],
    linhas: () => porChave((e, r) => `${familiaDe(art(r)?.desc ?? '')}\u0000${fNome(e.forn)}`).map(([k, x]) => { const [fam, forn] = k.split('\u0000'); return { v: { fam, forn, qtd: n(x.qtd), valor: euros(x.valor) }, ord: { qtd: x.qtd, valor: x.valor } }; }) },
  'comp-geral': { titulo: 'Comparativos de compras — geral', ic: 'chart-bar', um: 'mês', varios: 'meses', procura: 'Mês', nota: 'O valor comprado em cada mês.',
    cols: [C('mes', 'Mês'), C('encs', 'Encomendas', { num: true }), C('valor', 'Valor', { num: true })],
    linhas: () => meses().map((m) => { const es = vivas().filter((e) => mes(e.data) === m), v = es.reduce((s, e) => s + totais(e).liquido, 0); return { v: { mes: m, encs: n(es.length), valor: euros(v) }, ord: { encs: es.length, valor: v } }; }) },
  'comp-geral-var': { titulo: 'Comparativos de compras — geral (variação anual)', ic: 'chart-bar', um: 'mês', varios: 'meses', procura: 'Mês', nota: SEM_2025,
    cols: [C('mes', 'Mês'), C('a', '2026', { num: true }), C('b', '2025', { num: true }), C('var', 'Variação', { num: true })],
    linhas: () => meses().map((m) => { const v = vivas().filter((e) => mes(e.data) === m).reduce((s, e) => s + totais(e).liquido, 0); return { v: { mes: m, a: euros(v), b: '—', var: '—' }, ord: { a: v } }; }) },
  'comp-artigo': { titulo: 'Comparativos de compras — por artigo', ic: 'chart-bar', um: 'artigo', varios: 'artigos', procura: 'Artigo', nota: 'Cada artigo, mês a mês.', cols: [], linhas: () => [] },
  'comp-artigo-var': { titulo: 'Comparativos de compras — por artigo (variação anual)', ic: 'chart-bar', um: 'artigo', varios: 'artigos', procura: 'Artigo', nota: SEM_2025, cols: [], linhas: () => [] },
  'comp-familia': { titulo: 'Comparativos de compras — por família/subfamília', ic: 'chart-bar', um: 'linha', varios: 'linhas', procura: 'Família ou subfamília', nota: 'Cada família e subfamília (a descrição do artigo), mês a mês.', cols: [], linhas: () => [] },
  'comp-familia-var': { titulo: 'Comparativos de compras — por família/subfamília (variação anual)', ic: 'chart-bar', um: 'linha', varios: 'linhas', procura: 'Família ou subfamília', nota: SEM_2025, cols: [], linhas: () => [] },
  'comp-forn': { titulo: 'Comparativos de compras — por fornecedor', ic: 'chart-bar', um: 'fornecedor', varios: 'fornecedores', procura: 'Fornecedor', nota: 'Cada fornecedor, mês a mês.', cols: [], linhas: () => [] },
  'comp-forn-var': { titulo: 'Comparativos de compras — por fornecedor (variação anual)', ic: 'chart-bar', um: 'fornecedor', varios: 'fornecedores', procura: 'Fornecedor', nota: SEM_2025, cols: [], linhas: () => [] },
  'mapas-analise-forn': { titulo: 'Análise de fornecedores', ic: 'chart-bar', um: 'fornecedor', varios: 'fornecedores', procura: 'Fornecedor', nota: 'O prazo combinado contra o que acontece: encomendas, atrasadas e dias de atraso.',
    cols: [C('forn', 'Fornecedor'), C('prazo', 'Prazo (dias)', { num: true }), C('encs', 'Encomendas', { num: true }), C('atr', 'Atrasadas', { num: true }), C('no', 'No prazo', { num: true }), C('dias', 'Atraso máximo', { num: true })],
    linhas: () => FORNECEDORES.map((f): Linha | null => { const es = vivas().filter((e) => e.forn === f.id); if (!es.length) return null; const at = es.filter(atrasada), d = Math.max(0, ...at.map((e) => diasAtraso(e.entrega))); return { v: { forn: f.nome, prazo: n(f.prazo), encs: n(es.length), atr: n(at.length), no: `${Math.round(100 * (es.length - at.length) / es.length)} %`, dias: at.length ? `${d} dias` : '—' }, ord: { prazo: f.prazo, encs: es.length, atr: at.length, no: (es.length - at.length) / es.length, dias: d } }; }).filter((x): x is Linha => !!x) },
  'mapas-automatico': { titulo: 'Artigos/compras automático', ic: 'chart-bar', um: 'artigo', varios: 'artigos', procura: 'Artigo ou fornecedor', nota: 'A sugestão de compra da Lista de faltas: o que encomendar a cada fornecedor (mínimo de exemplo).',
    cols: [C('ref', 'Artigo', { mono: true }), C('desc', 'Descrição'), C('stock', 'Stock', { num: true }), C('min', 'Mínimo', { num: true }), C('enc', 'Encomendado', { num: true }), C('sug', 'Sugestão', { num: true }), C('forn', 'Fornecedor')],
    linhas: () => faltas().map((f) => ({ v: { ref: f.ref, desc: f.desc, stock: n(f.stock), min: n(f.min), enc: n(f.encomendada), sug: n(f.sugestao), forn: f.fornNome }, ord: { stock: f.stock, min: f.min, enc: f.encomendada, sug: f.sugestao } })) },
};
/* os comparativos por artigo, família e fornecedor: uma coluna por mês (ou 2026/2025/variação) */
function comparativo(id: 'comp-artigo' | 'comp-familia' | 'comp-forn', chave: (e: Encomenda, r: string) => string, rot: string, extra?: (k: string) => string): void {
  const ms = () => meses();
  D[id].cols = [C('k', rot, { mono: id === 'comp-artigo' }), ...(extra ? [C('x', 'Descrição')] : []), ...ms().map((m, i) => C(`m${i}`, m, { num: true })), C('t', 'Total', { num: true })];
  D[id].linhas = () => porChave(chave).map(([k, x]) => { const v: Record<string, string> = { k, t: euros(x.valor) }, o: Record<string, number> = { t: x.valor }; if (extra) v.x = extra(k); ms().forEach((m, i) => { v[`m${i}`] = euros(x.meses.get(m) ?? 0); o[`m${i}`] = x.meses.get(m) ?? 0; }); return { v, ord: o }; });
  const iv = `${id}-var` as const;
  D[iv].cols = [C('k', rot, { mono: id === 'comp-artigo' }), C('a', '2026', { num: true }), C('b', '2025', { num: true }), C('var', 'Variação', { num: true })];
  D[iv].linhas = () => porChave(chave).map(([k, x]) => ({ v: { k, a: euros(x.valor), b: '—', var: '—' }, ord: { a: x.valor } }));
}
comparativo('comp-artigo', (_, r) => r, 'Artigo', (k) => art(k)?.desc ?? '—');
comparativo('comp-familia', (_, r) => `${familiaDe(art(r)?.desc ?? '')} · ${art(r)?.desc ?? r}`, 'Família · subfamília');
comparativo('comp-forn', (e) => fNome(e.forn), 'Fornecedor');

const NOTA = 'Do menu Compras do ERP antigo (23 out., ela: «no figma coloca tudo available»): consulta com os números das encomendas e das receções do protótipo; o que ainda não existe diz-se na nota.';
export const DESCRICAO_MENU_ANTIGO = 'Os itens do menu Compras do ERP antigo (agendamento, guias, faturas, créditos, verificação e os mapas), cada um num ecrã de consulta.';
export function ecrasMenuAntigo(): Ecra<IdErp>[] {
  return MENU_ANTIGO.map((id, i) => {
    const t: Tabela = { ...D[id], id: `cm-${id}`, num: String(40 + i), caminho: 'Compras' };
    return { id: t.id as IdErp, nome: `${t.num} · ${t.titulo}`, fluxo: 'Compras', objetivo: `${t.titulo}: ${t.nota}`, versoes: [{ id: 'v1', nota: NOTA, html: paginaTabela(t) }] };
  });
}
