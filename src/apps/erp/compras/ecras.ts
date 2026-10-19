/* =========================================================
   ERP · Compras — as páginas da fase 1 (19 out. 2026), dentro da casca do 05 · Início
   Do briefing dela «Module 01: Compras», só a fase que ela escolheu: Fornecedores + Encomendas a fornecedor
   + Receções. Na barra lateral, Compras tem só estas três entradas: o que ainda não funciona não aparece.
     10 · Compras v2      — Encomendas a fornecedor: a lista, por estado, com procura, ordenar e exportar.
     11 · Encomenda       — o editor: cabeçalho, linhas editáveis no rascunho, resumo financeiro à direita,
                            o percurso do documento, receções e histórico; só as ações válidas no estado e
                            para o perfil.
     12 · Receções        — o que está por receber e as receções registadas.
     13 · Receção         — registar uma receção (parcial ou total, aceite e rejeitado, leitura de código)
                            ou ver uma registada, com os movimentos de stock que criou.
     14 · Fornecedores    — a lista, com o desempenho calculado dos documentos.
     15 · Fornecedor      — a ficha: dados, condições, artigos com a referência do fornecedor, encomendas.
   Só desenha (estado → HTML); o comportamento está em compras/comportamento.ts e as regras em dominio.ts.
   A v1 do 10 · Compras (a moldura antiga) fica como estava.
   ========================================================= */
import type { Ecra } from '../../../comum/tipos';
import type { IdErp } from '../ids';
import { ic } from '../inicio-icones';
import { casca, estadoPadrao, btn, type Estado, type Pagina } from '../inicio';
import { PERFIS, type IdPerfil } from '../inicio-dados';
import {
  ARMAZEM, LIMITE_COMPRADOR, FORNECEDORES, ARTIGOS, encomendas, encomenda, rececoes, rececao, rececoesDe, fornecedor, artigo, totais, linhaLiquida,
  atrasada, pendente, dia, diasAtraso, euros, pct, pode, acoesDe, stock, aCaminho, desempenho, movimentosDe, HOJE, NOME_ACAO,
  problemas, type Encomenda, type EstadoEnc, type Acao, type LinhaEnc, type Totais,
} from './dominio';

export type IdCompras2 = 'compras-encomenda' | 'compras-rececoes' | 'compras-rececao' | 'compras-fornecedores' | 'compras-fornecedor'
  | 'cp-sem-acesso' | 'cp-lista-atrasadas' | 'cp-enc-aprovar' | 'cp-enc-rascunho' | 'cp-enc-erros' | 'cp-enc-recebida' | 'cp-rec-form' | 'cp-rec-vista' | 'cp-forn-skf';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const PASSOS_COMPRAS = (pag: string, ...mais: { nome: string; ir?: string; ref?: string }[]) => [{ nome: 'Compras', ir: 'compras' }, ...(pag ? [{ nome: pag, ir: pag === 'Encomendas a fornecedor' ? 'compras' : pag === 'Receções' ? 'compras-rececoes' : 'compras-fornecedores' }] : []), ...mais];

/* ---------- peças comuns ---------- */
const COR_ESTADO: Record<EstadoEnc, string> = {
  'Rascunho': 'rascunho', 'A aprovar': 'aprovar', 'Aprovada': 'aprovada', 'Emitida': 'emitida', 'Parcialmente recebida': 'parcial', 'Recebida': 'recebida', 'Fechada': 'fechada', 'Cancelada': 'cancelada',
};
export const estadoEnc = (e: Encomenda) => `<span class="cp-est cp-est--${COR_ESTADO[e.estado]}">${e.estado}</span>${atrasada(e) ? `<span class="cp-est cp-est--atraso">${ic('clock')}Atrasada ${diasAtraso(e.entrega)} d</span>` : ''}`;
const semAcesso = (o: string) => `<div class="cp-vazio cp-vazio--fechado" role="alert">${ic('lock', 'cp-vazio__icone')}<p class="cp-vazio__titulo">Sem acesso a ${o}</p><p class="cp-vazio__texto">O teu perfil não vê Compras. Se precisares, pede acesso ao administrador da tua empresa.</p></div>`;
const cabeca = (titulo: string, sub: string, accoes = '', antes = '') => `<header class="cp-cabeca">${antes}<div class="cp-cabeca__texto"><h1 class="cp-cabeca__titulo">${titulo}</h1><p class="cp-cabeca__sub">${sub}</p></div><div class="cp-cabeca__accoes">${accoes}</div></header>`;
const recebidoDe = (e: Encomenda) => { const q = e.linhas.reduce((s, l) => s + l.qtd, 0), r = e.linhas.reduce((s, l) => s + l.recebida, 0); return { q, r, p: q ? r / q : 0 }; };

/* ---------- 10 · Encomendas a fornecedor ---------- */
export type Filtro = 'todas' | 'rascunho' | 'aprovar' | 'aprovadas' | 'receber' | 'atrasadas' | 'recebidas' | 'fechadas' | 'canceladas';
export const FILTROS: [Filtro, string, (e: Encomenda) => boolean][] = [
  ['todas', 'Todas', (e) => e.estado !== 'Cancelada'],
  ['rascunho', 'Rascunhos', (e) => e.estado === 'Rascunho'],
  ['aprovar', 'A aprovar', (e) => e.estado === 'A aprovar'],
  ['aprovadas', 'Por emitir', (e) => e.estado === 'Aprovada'],
  ['receber', 'Por receber', (e) => e.estado === 'Emitida' || e.estado === 'Parcialmente recebida'],
  ['atrasadas', 'Atrasadas', atrasada],
  ['recebidas', 'Recebidas', (e) => e.estado === 'Recebida'],
  ['fechadas', 'Fechadas', (e) => e.estado === 'Fechada'],
  ['canceladas', 'Canceladas', (e) => e.estado === 'Cancelada'],
];
export interface VistaLista { filtro: Filtro; q: string; forn: string; ordem: 'ref' | 'data' | 'entrega' | 'base'; desc: boolean }
export const vistaPadrao = (): VistaLista => ({ filtro: 'todas', q: '', forn: '', ordem: 'ref', desc: true });
const sem = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export function filtrar(v: VistaLista): Encomenda[] {
  const f = FILTROS.find((x) => x[0] === v.filtro)![2];
  const q = sem(v.q.trim());
  const l = encomendas().filter((e) => f(e) && (!v.forn || e.forn === v.forn) && (!q || sem(`${e.ref} ${fornecedor(e.forn)?.nome} ${e.refForn} ${e.linhas.map((x) => `${x.ref} ${artigo(x.ref)?.desc}`).join(' ')}`).includes(q)));
  const k = (e: Encomenda) => v.ordem === 'base' ? totais(e).base : v.ordem === 'data' ? e.data : v.ordem === 'entrega' ? e.entrega : e.ref;
  return l.sort((a, b) => { const x = k(a), y = k(b); const c = typeof x === 'number' ? x - (y as number) : String(x).localeCompare(String(y)); return v.desc ? -c : c; });
}
export function tabelaEncomendas(_e: Estado, v: VistaLista): string {
  const l = filtrar(v);
  const th = (id: VistaLista['ordem'], nome: string, num = false) => `<th scope="col"${num ? ' class="cp-num"' : ''} aria-sort="${v.ordem === id ? (v.desc ? 'descending' : 'ascending') : 'none'}"><button type="button" class="cp-ordenar" data-cp-ordem="${id}">${nome}${ic(v.ordem === id ? (v.desc ? 'arrow-down' : 'arrow-up') : 'chevron-down', 'cp-ordenar__seta')}</button></th>`;
  if (!l.length) return `<div class="cp-vazio" data-cp-tabela>${ic('search', 'cp-vazio__icone')}<p class="cp-vazio__titulo">Nenhuma encomenda ${v.q ? `com «${esc(v.q)}»` : 'neste filtro'}</p><p class="cp-vazio__texto">Procura pela referência, pelo fornecedor ou pelo artigo.</p>${btn('Limpar filtros', 'x', { cls: 'btn--ghost btn--sm', attrs: 'data-cp-limpar' })}</div>`;
  return `<div class="cp-tabela-rolo" data-cp-tabela><table class="cp-tabela cp-tabela--encs">
    <caption class="sr-only">Encomendas a fornecedor: ${l.length}</caption>
    <thead><tr>${th('ref', 'Encomenda')}<th scope="col">Fornecedor</th>${th('data', 'Data')}${th('entrega', 'Entrega prevista')}<th scope="col">Recebido</th>${th('base', 'Base s/ IVA', true)}<th scope="col">Estado</th></tr></thead>
    <tbody>${l.map((x) => { const t = totais(x), r = recebidoDe(x), f = fornecedor(x.forn)!; return `<tr class="cp-linha${atrasada(x) ? ' is-atraso' : ''}" data-cp-abrir="${esc(x.ref)}">
      <td data-rotulo="Encomenda"><button type="button" class="cp-ref-btn" data-ws-ir="compras-encomenda" data-ws-ref="${esc(x.ref)}"><span class="cp-ref">${x.ref}</span></button></td>
      <td data-rotulo="Fornecedor"><span class="cp-forte">${esc(f.nome)}</span>${x.refForn ? `<span class="cp-fraco">${esc(x.refForn)}</span>` : ''}</td>
      <td data-rotulo="Data" class="cp-data">${dia(x.data)}</td>
      <td data-rotulo="Entrega prevista" class="cp-data${atrasada(x) ? ' cp-atraso' : ''}">${dia(x.entrega)}${atrasada(x) ? `<span class="cp-fraco">há ${diasAtraso(x.entrega)} dias</span>` : ''}</td>
      <td data-rotulo="Recebido">${['Rascunho', 'A aprovar', 'Aprovada', 'Cancelada'].includes(x.estado) ? '<span class="cp-fraco">—</span>' : `<span class="cp-barra" aria-hidden="true"><i style="transform: scaleX(${r.p.toFixed(3)})"></i></span><span class="cp-fraco">${r.r.toLocaleString('pt-PT')} de ${r.q.toLocaleString('pt-PT')}</span>`}</td>
      <td data-rotulo="Base s/ IVA" class="cp-num">${t.semPreco ? `<span class="cp-fraco">${t.semPreco} sem preço</span>` : ''}${euros(t.base)}</td>
      <td data-rotulo="Estado">${estadoEnc(x)}</td>
    </tr>`; }).join('')}</tbody>
  </table></div>`;
}
function lista(e: Estado, v = vistaPadrao()): Pagina {
  const p = e.perfil;
  if (!pode(p, 'ver')) return { onde: 'compras-encomendas', caminho: PASSOS_COMPRAS('Encomendas a fornecedor'), html: `<main class="cp">${semAcesso('Compras')}</main>` };
  const conta = (f: Filtro) => encomendas().filter(FILTROS.find((x) => x[0] === f)![2]).length;
  const porReceber = encomendas().filter((x) => x.estado === 'Emitida' || x.estado === 'Parcialmente recebida');
  const resumo = [
    conta('atrasadas') && `<button type="button" class="cp-resumo__item cp-resumo__item--atraso" data-cp-filtro="atrasadas"><b>${conta('atrasadas')}</b> atrasadas</button>`,
    conta('aprovar') && `<button type="button" class="cp-resumo__item" data-cp-filtro="aprovar"><b>${conta('aprovar')}</b> à espera de aprovação</button>`,
    `<button type="button" class="cp-resumo__item" data-cp-filtro="receber"><b>${porReceber.length}</b> por receber · ${euros(porReceber.reduce((s, x) => s + totais(x).base, 0))} s/ IVA</button>`,
    conta('rascunho') && `<button type="button" class="cp-resumo__item" data-cp-filtro="rascunho"><b>${conta('rascunho')}</b> ${conta('rascunho') === 1 ? 'rascunho' : 'rascunhos'}</button>`,
  ].filter(Boolean).join('');
  return { onde: 'compras-encomendas', caminho: PASSOS_COMPRAS('Encomendas a fornecedor'), html: `<main class="cp" data-cp-pagina="lista">
    ${cabeca('Encomendas a fornecedor', `${ARMAZEM} · valores sem IVA, salvo onde se diz`, `${btn('Exportar CSV', 'arrow-down', { cls: 'btn--ghost', attrs: 'data-cp-exportar' })}${pode(p, 'criar') ? btn('Nova encomenda', 'file-plus-2', { attrs: 'data-cp-nova' }) : ''}`)}
    <div class="cp-resumo">${resumo}</div>
    <section class="cp-caixa">
      <div class="cp-barra-ferr">
        <div class="cp-filtros" role="group" aria-label="Estado">${FILTROS.map(([f, nome]) => { const n = conta(f); return f === 'todas' || n ? `<button type="button" class="cp-filtro${f === 'atrasadas' ? ' cp-filtro--atraso' : ''}" aria-pressed="${v.filtro === f}" data-cp-filtro="${f}">${nome}<span class="cp-filtro__n">${n}</span></button>` : ''; }).join('')}</div>
        <div class="cp-procura">${ic('search', 'cp-procura__lupa')}<input type="search" class="cp-procura__campo" placeholder="Encomenda, fornecedor ou artigo" aria-label="Procurar encomendas" value="${esc(v.q)}" data-cp-q></div>
        <select class="cp-select" aria-label="Fornecedor" data-cp-forn><option value="">Todos os fornecedores</option>${FORNECEDORES.map((f) => `<option value="${f.id}"${v.forn === f.id ? ' selected' : ''}>${esc(f.nome)}</option>`).join('')}</select>
      </div>
      ${tabelaEncomendas(e, v)}
    </section>
  </main>` };
}

/* ---------- 11 · Encomenda ---------- */
export interface Edicao { enc: Encomenda; versao: number; sujo: boolean; erros: string[]; conflito: boolean; nova?: string }
const ICONE_ACAO: Partial<Record<Acao, string>> = { submeter: 'send', aprovar: 'check', rejeitar: 'undo-2', emitir: 'file-text', receber: 'package-check', lembrar: 'bell', fechar: 'circle-check', cancelar: 'x', duplicar: 'file-plus-2' };
/** O percurso do documento: só o que aconteceu fica feito; o próximo passo fica à espera, e nada à frente se pinta. */
function percurso(x: Encomenda): string {
  const h = x.historico;
  const quando = (re: RegExp) => h.find((v) => re.test(v.acao))?.quando.slice(0, 10);
  const recs = rececoesDe(x.ref);
  const ordem: EstadoEnc[] = ['Rascunho', 'A aprovar', 'Aprovada', 'Emitida', 'Parcialmente recebida', 'Recebida', 'Fechada'];
  const i = ordem.indexOf(x.estado);
  const passos: { nome: string; data?: string; feito: boolean; atual: boolean; doc?: string }[] = [
    { nome: 'Rascunho', data: quando(/Criou/), feito: i > 0, atual: i === 0 },
    { nome: 'Aprovação', data: quando(/Aprovou|Submeteu/), feito: i >= 2, atual: i === 1 },
    { nome: 'Emitida', data: quando(/Emitiu/), feito: i >= 3, atual: i === 2 },
    { nome: recs.length > 1 ? `Receções (${recs.length})` : 'Receção', data: recs[0] ? dia(recs[recs.length - 1].data) : undefined, feito: i >= 5, atual: i === 3 || i === 4, doc: recs[recs.length - 1]?.ref },
    { nome: 'Fechada', data: quando(/Fechou/), feito: i === 6, atual: i === 5 },
  ];
  if (x.estado === 'Cancelada') return `<ol class="cp-percurso is-cancelada"><li class="cp-passo is-feito"><span class="cp-passo__bola">${ic('file-pen')}</span><span class="cp-passo__nome">Rascunho</span></li><li class="cp-passo is-atual is-cancelada"><span class="cp-passo__bola">${ic('x')}</span><span class="cp-passo__nome">Cancelada</span><span class="cp-passo__data">${quando(/Cancelou/) ?? ''}</span></li></ol>`;
  const feitos = passos.filter((p) => p.feito).length;
  return `<ol class="cp-percurso" style="--feitos: ${feitos}; --n: ${passos.length}">${passos.map((p) => {
    const corpo = `<span class="cp-passo__bola">${ic(p.feito ? 'check' : p.atual ? 'circle-dot' : 'circle-dot')}</span><span class="cp-passo__nome">${p.nome}</span><span class="cp-passo__data">${p.data ?? (p.atual ? 'agora' : '')}</span>`;
    return `<li class="cp-passo${p.feito ? ' is-feito' : ''}${p.atual ? ' is-atual' : ''}">${p.doc ? `<button type="button" class="cp-passo__btn" data-ws-ir="compras-rececao" data-ws-ref="${p.doc}" aria-label="${p.nome}: abrir ${p.doc}">${corpo}</button>` : corpo}</li>`;
  }).join('')}</ol>`;
}
export function linhasEnc(ed: Edicao, perfil: IdPerfil): string {
  const x = ed.enc, edita = x.estado === 'Rascunho' && pode(perfil, 'editar'), mostraRec = !['Rascunho', 'A aprovar', 'Aprovada'].includes(x.estado);
  if (!x.linhas.length) return `<div class="cp-vazio cp-vazio--curto" data-cp-linhas>${ic('boxes', 'cp-vazio__icone')}<p class="cp-vazio__titulo">Ainda sem artigos</p><p class="cp-vazio__texto">Junta os artigos do fornecedor; a referência dele e o último preço vêm com eles.</p>${edita ? btn('Juntar artigo', 'plus', { cls: 'btn--ghost btn--sm', attrs: 'data-cp-juntar' }) : ''}</div>`;
  return `<div class="cp-tabela-rolo" data-cp-linhas><table class="cp-tabela cp-tabela--linhas${edita ? ' is-edita' : ''}">
    <caption class="sr-only">Linhas da ${x.ref}</caption>
    <thead><tr><th scope="col">Artigo</th><th scope="col">Ref. fornecedor</th><th scope="col" class="cp-num">Quantidade</th><th scope="col" class="cp-num">Preço</th><th scope="col" class="cp-num">Desc.</th><th scope="col" class="cp-num">IVA</th><th scope="col">Entrega</th><th scope="col" class="cp-num">Líquido</th>${mostraRec ? '<th scope="col" class="cp-num">Recebida</th><th scope="col" class="cp-num">Falta</th>' : ''}${edita ? '<th scope="col"><span class="sr-only">Tirar</span></th>' : ''}</tr></thead>
    <tbody>${x.linhas.map((l) => linhaEnc(x, l, edita, mostraRec, ed.erros)).join('')}</tbody>
  </table></div>`;
}
function linhaEnc(_x: Encomenda, l: LinhaEnc, edita: boolean, mostraRec: boolean, erros: string[]): string {
  const a = artigo(l.ref), liq = linhaLiquida(l), errQ = erros.some((m) => m.startsWith(l.ref + ': a quantidade')), errP = l.preco === null && erros.length > 0;
  const campo = (nome: string, valor: string, rot: string, cls = '', extra = '') => `<input class="cp-celula${cls}" inputmode="decimal" data-cp-campo="${nome}" data-cp-linha="${l.id}" value="${esc(valor)}" aria-label="${rot} de ${esc(l.ref)}"${extra}>`;
  return `<tr data-cp-l="${l.id}">
    <td data-rotulo="Artigo"><span class="cp-ref">${esc(l.ref)}</span><span class="cp-fraco">${esc(a?.desc ?? '')} · ${esc(a?.marca ?? '')}</span></td>
    <td data-rotulo="Ref. fornecedor"><span class="cp-ref cp-ref--fraca">${esc(a?.refForn ?? '—')}</span></td>
    <td data-rotulo="Quantidade" class="cp-num">${edita ? campo('qtd', String(l.qtd), 'Quantidade', errQ ? ' is-erro' : '', ' inputmode="numeric"') : l.qtd.toLocaleString('pt-PT')} <span class="cp-fraco cp-un">${esc(a?.un ?? '')}</span></td>
    <td data-rotulo="Preço" class="cp-num">${edita ? campo('preco', l.preco === null ? '' : (l.preco / 100).toFixed(2).replace('.', ','), 'Preço', errP ? ' is-erro' : '', l.preco === null ? ' placeholder="Sem preço"' : '') : l.preco === null ? '<span class="cp-falta">Sem preço</span>' : euros(l.preco)}</td>
    <td data-rotulo="Desconto" class="cp-num">${edita ? campo('desc', l.desc ? (l.desc / 100).toString().replace('.', ',') : '', 'Desconto', ' cp-celula--curta', ' placeholder="0"') : l.desc ? pct(l.desc) : '—'}</td>
    <td data-rotulo="IVA" class="cp-num cp-fraco">${pct(l.iva)}</td>
    <td data-rotulo="Entrega">${edita ? `<input type="date" class="cp-celula cp-celula--data" data-cp-campo="entrega" data-cp-linha="${l.id}" value="${l.entrega}" min="${HOJE}" aria-label="Entrega de ${esc(l.ref)}">` : dia(l.entrega)}</td>
    <td data-rotulo="Líquido" class="cp-num cp-forte" data-cp-liq="${l.id}">${liq === null ? '<span class="cp-falta">—</span>' : euros(liq)}</td>
    ${mostraRec ? `<td data-rotulo="Recebida" class="cp-num">${l.recebida.toLocaleString('pt-PT')}${l.rejeitada ? `<span class="cp-fraco cp-rej">${l.rejeitada} rejeitada${l.rejeitada === 1 ? '' : 's'}</span>` : ''}</td><td data-rotulo="Falta" class="cp-num${pendente(l) ? ' cp-forte' : ' cp-fraco'}">${pendente(l).toLocaleString('pt-PT')}</td>` : ''}
    ${edita ? `<td><button type="button" class="ws-ibtn ws-ibtn--sm" aria-label="Tirar ${esc(l.ref)}" data-cp-tirar="${l.id}">${ic('x')}</button></td>` : ''}
  </tr>`;
}
export function resumoEnc(x: Encomenda, perfil: IdPerfil, t: Totais = totais(x)): string {
  const edita = x.estado === 'Rascunho' && pode(perfil, 'editar');
  const f = fornecedor(x.forn);
  const n = (k: string, v: number) => `<dd data-cp-total="${k}">${euros(v)}</dd>`;
  return `<aside class="cp-resumo-fin" aria-labelledby="cp-res-t" data-cp-resumo>
    <h2 class="cp-bloco__titulo" id="cp-res-t">Resumo</h2>
    <dl class="cp-contas">
      <div><dt>Bruto</dt>${n('bruto', t.bruto)}</div>
      <div><dt>Descontos</dt><dd data-cp-total="descontos">${t.descontos ? '−' : ''}${euros(t.descontos)}</dd></div>
      <div><dt>Portes</dt>${edita ? `<dd><input class="cp-celula cp-celula--portes" inputmode="decimal" data-cp-campo="portes" value="${(x.portes / 100).toFixed(2).replace('.', ',')}" aria-label="Portes"></dd>` : n('portes', t.portes)}</div>
      <div class="cp-contas__base"><dt>Base s/ IVA</dt>${n('base', t.base)}</div>
      ${t.iva.map((v) => `<div><dt>IVA ${pct(v.taxa)} <span class="cp-fraco">sobre ${euros(v.base)}</span></dt><dd data-cp-total="iva-${v.taxa}">${euros(v.valor)}</dd></div>`).join('') || '<div><dt>IVA</dt><dd>—</dd></div>'}
      <div class="cp-contas__total"><dt>Total c/ IVA</dt>${n('total', t.total)}</div>
    </dl>
    ${t.semPreco ? `<p class="cp-aviso cp-aviso--erro" data-cp-sem-preco>${ic('circle-alert')}${t.semPreco} ${t.semPreco === 1 ? 'linha sem preço não entra' : 'linhas sem preço não entram'} nas contas.</p>` : ''}
    ${['Rascunho', 'A aprovar'].includes(x.estado) ? `<p class="cp-aviso" data-cp-limite>${ic('shield-check')}${t.base > LIMITE_COMPRADOR ? `Acima de ${euros(LIMITE_COMPRADOR)}: a aprovação é da Administração.` : `Até ${euros(LIMITE_COMPRADOR)}, fica aprovada ao submeter (limite do comprador).`}</p>` : ''}
    <dl class="cp-cond">
      <div><dt>Moeda</dt><dd>Euro <span class="cp-fraco">(outra moeda pede as regras de câmbio)</span></dd></div>
      <div><dt>Pagamento</dt><dd>${esc(x.pagamento)}</dd></div>
      <div><dt>Entrega</dt><dd>${esc(f?.entrega ?? '—')} · ${esc(x.armazem)}</dd></div>
      <div><dt>Prazo habitual</dt><dd>${f?.prazo ?? '—'} dias</dd></div>
    </dl>
  </aside>`;
}
export function editor(e: Estado, ed: Edicao | null, ref = ''): Pagina {
  const p = e.perfil;
  if (!pode(p, 'ver')) return { onde: 'compras-encomendas', caminho: PASSOS_COMPRAS('Encomendas a fornecedor'), html: `<main class="cp">${semAcesso('Compras')}</main>` };
  if (!ed) return { onde: 'compras-encomendas', caminho: PASSOS_COMPRAS('Encomendas a fornecedor', { nome: ref || '—' }), html: `<main class="cp"><div class="cp-vazio" role="alert">${ic('search', 'cp-vazio__icone')}<p class="cp-vazio__titulo">Não há a encomenda ${esc(ref)}</p><p class="cp-vazio__texto">Pode ter sido apagada, ou a ligação está errada.</p>${btn('Ver as encomendas', 'arrow-right', { cls: 'btn--ghost btn--sm', attrs: 'data-ws-ir="compras"' })}</div></main>` };
  const x = ed.enc, f = fornecedor(x.forn), edita = x.estado === 'Rascunho' && pode(p, 'editar');
  const acoes = acoesDe(x, p);
  const principais = acoes.filter((a) => !['duplicar', 'cancelar', 'fechar', 'lembrar', 'rejeitar'].includes(a));
  const secundarias = acoes.filter((a) => ['lembrar', 'fechar', 'rejeitar', 'duplicar', 'cancelar'].includes(a));
  const recs = rececoesDe(x.ref);
  return { onde: 'compras-encomendas', caminho: PASSOS_COMPRAS('Encomendas a fornecedor', { nome: x.ref }), html: `<main class="cp cp--editor" data-cp-pagina="encomenda" data-cp-ref="${esc(x.ref)}">
    ${ed.conflito ? `<div class="cp-faixa cp-faixa--conflito" role="alert">${ic('triangle-alert')}<span>Alguém guardou a ${x.ref} depois de a abrires. As tuas alterações não foram guardadas, para não apagarem as dela.</span>${btn('Recarregar a encomenda', 'rotate-ccw', { cls: 'btn--ghost btn--sm', attrs: 'data-cp-recarregar' })}</div>` : ''}
    ${ed.erros.length ? `<div class="cp-faixa cp-faixa--erro" role="alert" tabindex="-1" data-cp-erros>${ic('circle-alert')}<div><p class="cp-faixa__titulo">Antes de submeter, falta:</p><ul>${ed.erros.map((m) => `<li>${esc(m)}</li>`).join('')}</ul></div></div>` : ''}
    <header class="cp-doc">
      <div class="cp-doc__id">
        <p class="cp-doc__tipo">Encomenda a fornecedor${ed.nova ? ' · nova' : ''}</p>
        <h1 class="cp-doc__ref"><span style="view-transition-name: ws-doc">${x.ref}</span></h1>
        <p class="cp-doc__linha"><button type="button" class="cp-ligacao" data-ws-ir="compras-fornecedor" data-ws-ref="${x.forn}">${esc(f?.nome ?? '—')}</button>${estadoEnc(x)}<span class="cp-fraco">versão ${x.versao}</span>${ed.sujo ? '<span class="cp-sujo" data-cp-sujo>Alterações por guardar</span>' : ''}</p>
      </div>
      <div class="cp-doc__accoes">
        ${edita ? btn('Guardar rascunho', 'check', { cls: 'btn--ghost', attrs: `data-cp-guardar${ed.sujo ? '' : ' disabled'}` }) : ''}
        ${principais.map((a) => btn(a === 'receber' ? 'Registar receção' : NOME_ACAO[a], ICONE_ACAO[a] ?? 'check', { attrs: `data-cp-acao="${a}"` })).join('')}
        ${secundarias.length ? `<div class="cp-mais"><button type="button" class="btn btn--ghost" data-cp-mais aria-haspopup="true" aria-expanded="false">${ic('chevron-down', 'btn__icone')}<span class="btn__rotulo">Mais</span></button>
          <div class="cp-mais__menu" role="menu" hidden>${secundarias.map((a) => `<button type="button" role="menuitem" class="ws-menu__item" data-cp-acao="${a}">${ic(ICONE_ACAO[a] ?? 'check')}${NOME_ACAO[a]}</button>`).join('')}<button type="button" role="menuitem" class="ws-menu__item" data-cp-exportar-uma>${ic('arrow-down')}Exportar CSV</button></div></div>` : ''}
      </div>
    </header>
    ${percurso(x)}
    <div class="cp-editor">
      <div class="cp-editor__principal">
        <section class="cp-caixa cp-campos" aria-labelledby="cp-cab-t">
          <h2 class="cp-bloco__titulo" id="cp-cab-t">Cabeçalho</h2>
          <div class="cp-grelha">
            <label class="cp-campo"><span class="cp-campo__rotulo">Fornecedor</span>${edita && !x.linhas.length ? `<select class="cp-select" data-cp-campo="forn">${FORNECEDORES.filter((y) => y.ativo).map((y) => `<option value="${y.id}"${y.id === x.forn ? ' selected' : ''}>${esc(y.nome)}</option>`).join('')}</select>` : `<span class="cp-campo__valor">${esc(f?.nome ?? '—')}${edita ? '<small class="cp-fraco">tira os artigos para mudar</small>' : ''}</span>`}</label>
            <label class="cp-campo"><span class="cp-campo__rotulo">Ref. do fornecedor</span>${edita ? `<input class="cp-input" data-cp-campo="refForn" value="${esc(x.refForn)}" placeholder="A que ele der">` : `<span class="cp-campo__valor cp-ref">${esc(x.refForn || '—')}</span>`}</label>
            <label class="cp-campo"><span class="cp-campo__rotulo">Entrega prevista</span>${edita ? `<input type="date" class="cp-input" data-cp-campo="entrega" value="${x.entrega}" min="${HOJE}">` : `<span class="cp-campo__valor${atrasada(x) ? ' cp-atraso' : ''}">${dia(x.entrega)}</span>`}</label>
            <div class="cp-campo"><span class="cp-campo__rotulo">Data</span><span class="cp-campo__valor">${dia(x.data)}</span></div>
            <div class="cp-campo"><span class="cp-campo__rotulo">Destino</span><span class="cp-campo__valor">Romafe, SA · ${esc(x.armazem)}</span></div>
            <div class="cp-campo"><span class="cp-campo__rotulo">Comprador</span><span class="cp-campo__valor">${PERFIS[x.comprador].pessoa}</span></div>
          </div>
        </section>
        <section class="cp-caixa" aria-labelledby="cp-lin-t">
          <header class="cp-bloco__cabeca"><h2 class="cp-bloco__titulo" id="cp-lin-t">Artigos <span class="cp-fraco" data-cp-n-linhas>${x.linhas.length}</span></h2>${edita && x.linhas.length ? btn('Juntar artigo', 'plus', { cls: 'btn--ghost btn--sm', attrs: 'data-cp-juntar aria-keyshortcuts="Alt+A"' }) : ''}</header>
          ${linhasEnc(ed, p)}
        </section>
        <div class="cp-dois">
          <section class="cp-caixa" aria-labelledby="cp-notas-t"><h2 class="cp-bloco__titulo" id="cp-notas-t">Notas</h2>${edita ? `<textarea class="cp-input cp-notas" data-cp-campo="notas" rows="3" aria-labelledby="cp-notas-t" placeholder="Para o fornecedor ou para a equipa">${esc(x.notas)}</textarea>` : `<p class="cp-texto">${esc(x.notas) || '<span class="cp-fraco">Sem notas.</span>'}</p>`}</section>
          <section class="cp-caixa" aria-labelledby="cp-recs-t"><h2 class="cp-bloco__titulo" id="cp-recs-t">Receções</h2>${recs.length ? `<ul class="cp-lista-docs">${recs.map((r) => `<li><button type="button" class="cp-doc-linha" data-ws-ir="compras-rececao" data-ws-ref="${r.ref}"><span class="cp-ref">${r.ref}</span><span>${dia(r.data)} · guia ${esc(r.guia)}</span><span class="cp-fraco">${r.linhas.reduce((s, y) => s + y.aceite, 0)} aceites${r.linhas.some((y) => y.rejeitada) ? ` · ${r.linhas.reduce((s, y) => s + y.rejeitada, 0)} rejeitadas` : ''}</span>${ic('arrow-right')}</button></li>`).join('')}</ul>` : `<p class="cp-texto cp-fraco">${['Emitida'].includes(x.estado) ? 'Ainda nada chegou.' : 'Só depois de emitida.'}</p>`}</section>
        </div>
        <section class="cp-caixa" aria-labelledby="cp-hist-t"><h2 class="cp-bloco__titulo" id="cp-hist-t">Histórico</h2>
          <ol class="cp-hist">${x.historico.slice().reverse().map((h) => `<li><span class="cp-hist__quando">${h.quando}</span><span class="cp-hist__quem">${esc(h.quem)}</span><span class="cp-hist__acao">${esc(h.acao)}${h.detalhe ? ` <span class="cp-fraco">· ${esc(h.detalhe)}</span>` : ''}</span>${h.doc ? `<button type="button" class="cp-ligacao" data-ws-ir="compras-rececao" data-ws-ref="${h.doc}">${h.doc}</button>` : ''}</li>`).join('')}</ol>
        </section>
      </div>
      ${resumoEnc(x, p)}
    </div>
  </main>` };
}

/** A gaveta para juntar artigos: só os do fornecedor da encomenda (a referência dele vem com o artigo). */
export function gavetaArtigos(x: Encomenda, q = ''): string {
  const s = sem(q.trim());
  const doF = ARTIGOS.filter((a) => a.forn === x.forn);
  const l = doF.filter((a) => !s || sem(`${a.ref} ${a.refForn} ${a.desc} ${a.marca} ${a.ean}`).includes(s));
  const ja = new Set(x.linhas.map((y) => y.ref));
  return `<div class="ws-veu ws-veu--painel" data-ws-camada="painel"><aside class="ws-painel cp-gaveta" role="dialog" aria-modal="true" aria-labelledby="cp-gav-t">
    <header class="ws-painel__cabeca"><p class="ws-painel__tipo">${esc(fornecedor(x.forn)?.nome ?? '')} · ${doF.length} artigos</p><h2 class="ws-painel__titulo cp-gaveta__titulo" id="cp-gav-t">Juntar artigo</h2><button type="button" class="ws-ibtn ws-painel__fechar" aria-label="Fechar" data-ws-fechar>${ic('x')}</button></header>
    <div class="cp-gaveta__procura"><div class="cp-procura">${ic('search', 'cp-procura__lupa')}<input type="search" class="cp-procura__campo" placeholder="Referência, ref. do fornecedor, descrição, marca ou EAN" aria-label="Procurar artigo" value="${esc(q)}" data-cp-gaveta-q autocomplete="off"></div></div>
    <div class="ws-painel__corpo cp-gaveta__corpo" data-cp-gaveta-lista>${l.length ? `<ul class="cp-arts">${l.map((a) => `<li><button type="button" class="cp-art" data-cp-art="${esc(a.ref)}"${ja.has(a.ref) ? ' aria-describedby="cp-ja"' : ''}>
        <span class="cp-art__id"><span class="cp-ref">${esc(a.ref)}</span><span class="cp-fraco">${esc(a.refForn)}</span></span>
        <span class="cp-art__desc">${esc(a.desc)} <span class="cp-fraco">· ${esc(a.marca)}</span></span>
        <span class="cp-art__stock">${stock(a.ref).toLocaleString('pt-PT')} em stock${aCaminho(a.ref) ? ` · ${aCaminho(a.ref).toLocaleString('pt-PT')} a caminho` : ''}</span>
        <span class="cp-art__preco">${a.preco === null ? '<span class="cp-falta">Sem preço</span>' : euros(a.preco)}</span>
        ${ja.has(a.ref) ? '<span class="cp-art__ja">já na encomenda</span>' : ic('plus', 'cp-art__mais')}
      </button></li>`).join('')}</ul><p class="sr-only" id="cp-ja">Já está na encomenda: soma 1 à quantidade.</p>` : `<div class="cp-vazio cp-vazio--curto"><p class="cp-vazio__texto">${doF.length ? `Nenhum artigo da ${esc(fornecedor(x.forn)?.nome ?? '')} com «${esc(q)}».` : 'Este fornecedor ainda não tem artigos com referência dele.'}</p></div>`}</div>
  </aside></div>`;
}
export function dialogoMotivo(acao: Acao, ref: string): string {
  const t: Partial<Record<Acao, [string, string, string]>> = {
    rejeitar: ['Rejeitar a encomenda', 'Volta a rascunho, com o teu motivo no histórico.', 'Rejeitar'],
    cancelar: ['Cancelar a encomenda', 'Fica cancelada e não se processa mais. Não se apaga: fica no histórico.', 'Cancelar a encomenda'],
    fechar: ['Fechar com mercadoria por receber', 'O que falta deixa de se esperar. Fica no histórico porquê.', 'Fechar'],
  };
  const [titulo, sub, ok] = t[acao]!;
  return `<div class="ws-veu" data-ws-camada="personalizar"><div class="ws-dialogo cp-dialogo" role="dialog" aria-modal="true" aria-labelledby="cp-mot-t">
    <header class="ws-dialogo__cabeca"><h2 class="ws-dialogo__titulo" id="cp-mot-t">${titulo} ${ref}</h2><button type="button" class="ws-ibtn" aria-label="Fechar" data-ws-fechar>${ic('x')}</button></header>
    <div class="ws-dialogo__corpo"><p class="cp-texto">${sub}</p><label class="cp-campo"><span class="cp-campo__rotulo">Motivo</span><textarea class="cp-input" rows="3" data-cp-motivo required></textarea></label><p class="cp-campo__erro" hidden role="alert">${ic('circle-alert')}Escreve o motivo.</p></div>
    <footer class="ws-dialogo__pe">${btn('Voltar', 'arrow-right', { cls: 'btn--ghost', attrs: 'data-ws-fechar' })}${btn(ok, acao === 'cancelar' ? 'x' : 'check', { attrs: `data-cp-confirmar="${acao}"` })}</footer>
  </div></div>`;
}
export function dialogoSair(ref: string): string {
  return `<div class="ws-veu" data-ws-camada="personalizar"><div class="ws-dialogo cp-dialogo" role="alertdialog" aria-modal="true" aria-labelledby="cp-sair-t" aria-describedby="cp-sair-d">
    <header class="ws-dialogo__cabeca"><h2 class="ws-dialogo__titulo" id="cp-sair-t">Sair sem guardar?</h2></header>
    <div class="ws-dialogo__corpo"><p class="cp-texto" id="cp-sair-d">A ${ref} tem alterações que ainda não guardaste.</p></div>
    <footer class="ws-dialogo__pe">${btn('Ficar', 'arrow-right', { cls: 'btn--ghost', attrs: 'data-ws-fechar' })}<span class="cp-dialogo__dir">${btn('Sair sem guardar', 'x', { cls: 'btn--ghost', attrs: 'data-cp-sair-sem' })}${btn('Guardar e sair', 'check', { attrs: 'data-cp-sair-guardar' })}</span></footer>
  </div></div>`;
}
export function dialogoNova(forn = ''): string {
  return `<div class="ws-veu ws-veu--painel" data-ws-camada="painel"><aside class="ws-painel" role="dialog" aria-modal="true" aria-labelledby="cp-nova-t">
    <header class="ws-painel__cabeca"><p class="ws-painel__tipo">Compras</p><h2 class="ws-painel__titulo cp-gaveta__titulo" id="cp-nova-t">Nova encomenda a fornecedor</h2><button type="button" class="ws-ibtn ws-painel__fechar" aria-label="Fechar" data-ws-fechar>${ic('x')}</button></header>
    <form class="ws-painel__corpo ws-form" data-cp-nova-form>
      <label class="ws-campo"><span class="ws-campo__rotulo">Fornecedor</span><select name="forn" class="ws-campo__select" required><option value="">Escolhe…</option>${FORNECEDORES.map((f) => `<option value="${f.id}"${f.id === forn ? ' selected' : ''}${f.ativo ? '' : ' disabled'}>${esc(f.nome)}${f.ativo ? '' : ' (inativo)'}</option>`).join('')}</select></label>
      <div class="ws-campo"><span class="ws-campo__rotulo">Destino</span><span>Romafe, SA · ${ARMAZEM}</span></div>
      <p class="ws-painel__nota">Fica como rascunho com o número seguinte da série EF 2026, as condições do fornecedor e a entrega pelo prazo habitual dele. Os artigos juntam-se a seguir.</p>
      <p class="ws-campo__erro" hidden role="alert">${ic('circle-alert')}Escolhe o fornecedor.</p>
    </form>
    <footer class="ws-painel__pe">${btn('Criar rascunho', 'file-plus-2', { attrs: 'data-cp-nova-ok' })}${btn('Cancelar', 'x', { cls: 'btn--ghost', attrs: 'data-ws-fechar' })}</footer>
  </aside></div>`;
}

/* ---------- 12 · Receções ---------- */
function paginaRececoes(e: Estado): Pagina {
  const p = e.perfil;
  if (!pode(p, 'ver')) return { onde: 'compras-rececoes', caminho: PASSOS_COMPRAS('Receções'), html: `<main class="cp">${semAcesso('Compras')}</main>` };
  const por = encomendas().filter((x) => x.estado === 'Emitida' || x.estado === 'Parcialmente recebida').sort((a, b) => a.entrega.localeCompare(b.entrega));
  const recs = rececoes();
  return { onde: 'compras-rececoes', caminho: PASSOS_COMPRAS('Receções'), html: `<main class="cp" data-cp-pagina="rececoes">
    ${cabeca('Receções', `${ARMAZEM} · a mercadoria que chega, conferida contra a encomenda`, '')}
    ${pode(p, 'receber') ? '' : `<p class="cp-aviso">${ic('lock')}Vês as receções, mas registá-las é com o Armazém.</p>`}
    <section class="cp-caixa" aria-labelledby="cp-por-t">
      <header class="cp-bloco__cabeca"><h2 class="cp-bloco__titulo" id="cp-por-t">Por receber <span class="cp-fraco">${por.length}</span></h2><span class="cp-fraco">pela entrega prevista</span></header>
      ${por.length ? `<div class="cp-tabela-rolo"><table class="cp-tabela"><caption class="sr-only">Encomendas por receber</caption><thead><tr><th scope="col">Encomenda</th><th scope="col">Fornecedor</th><th scope="col">Entrega prevista</th><th scope="col">Falta</th><th scope="col">Estado</th><th scope="col"><span class="sr-only">Ação</span></th></tr></thead><tbody>
        ${por.map((x) => { const r = recebidoDe(x); return `<tr class="${atrasada(x) ? 'is-atraso' : ''}"><td data-rotulo="Encomenda"><button type="button" class="cp-ref-btn" data-ws-ir="compras-encomenda" data-ws-ref="${x.ref}"><span class="cp-ref">${x.ref}</span></button></td><td data-rotulo="Fornecedor" class="cp-forte">${esc(fornecedor(x.forn)!.nome)}</td><td data-rotulo="Entrega prevista" class="cp-data${atrasada(x) ? ' cp-atraso' : ''}">${dia(x.entrega)}${atrasada(x) ? `<span class="cp-fraco">há ${diasAtraso(x.entrega)} dias</span>` : ''}</td><td data-rotulo="Falta">${(r.q - r.r).toLocaleString('pt-PT')} de ${r.q.toLocaleString('pt-PT')} · ${x.linhas.filter((l) => pendente(l)).length} ${x.linhas.filter((l) => pendente(l)).length === 1 ? 'linha' : 'linhas'}</td><td data-rotulo="Estado">${estadoEnc(x)}</td><td>${pode(p, 'receber') ? btn('Registar receção', 'package-check', { cls: 'btn--acao btn--sm', attrs: `data-ws-ir="compras-rececao" data-ws-ref="${x.ref}"` }) : ''}</td></tr>`; }).join('')}
      </tbody></table></div>` : `<div class="cp-vazio cp-vazio--curto"><p class="cp-vazio__texto">Nada por receber.</p></div>`}
    </section>
    <section class="cp-caixa" aria-labelledby="cp-recs2-t">
      <header class="cp-bloco__cabeca"><h2 class="cp-bloco__titulo" id="cp-recs2-t">Receções registadas <span class="cp-fraco">${recs.length}</span></h2></header>
      <div class="cp-tabela-rolo"><table class="cp-tabela"><caption class="sr-only">Receções registadas</caption><thead><tr><th scope="col">Receção</th><th scope="col">Encomenda</th><th scope="col">Fornecedor</th><th scope="col">Guia</th><th scope="col">Data</th><th scope="col">Por</th><th scope="col" class="cp-num">Aceite</th><th scope="col" class="cp-num">Rejeitado</th></tr></thead><tbody>
        ${recs.map((r) => { const x = encomenda(r.enc)!; return `<tr><td data-rotulo="Receção"><button type="button" class="cp-ref-btn" data-ws-ir="compras-rececao" data-ws-ref="${r.ref}"><span class="cp-ref">${r.ref}</span></button></td><td data-rotulo="Encomenda"><button type="button" class="cp-ligacao" data-ws-ir="compras-encomenda" data-ws-ref="${r.enc}">${r.enc}</button></td><td data-rotulo="Fornecedor">${esc(fornecedor(x.forn)!.nome)}</td><td data-rotulo="Guia" class="cp-ref cp-ref--fraca">${esc(r.guia)}</td><td data-rotulo="Data" class="cp-data">${dia(r.data)}</td><td data-rotulo="Por">${PERFIS[r.por].pessoa}</td><td data-rotulo="Aceite" class="cp-num">${r.linhas.reduce((s, l) => s + l.aceite, 0).toLocaleString('pt-PT')}</td><td data-rotulo="Rejeitado" class="cp-num">${r.linhas.reduce((s, l) => s + l.rejeitada, 0) || '—'}</td></tr>`; }).join('')}
      </tbody></table></div>
    </section>
  </main>` };
}

/* ---------- 13 · Receção ---------- */
export const MOTIVOS = ['Danificado', 'Artigo errado', 'Fora do prazo de validade', 'Embalagem aberta'];
export interface FormRec { chave: string; guia: string; notas: string; linhas: Record<string, { aceite: number; rejeitada: number; motivo: string }>; erros: string[]; feita?: string }
export function linhasRececao(x: Encomenda, f: FormRec): string {
  return `<div class="cp-tabela-rolo" data-cp-rec-linhas><table class="cp-tabela cp-tabela--rec"><caption class="sr-only">Linhas a receber da ${x.ref}</caption>
    <thead><tr><th scope="col">Artigo</th><th scope="col" class="cp-num">Encomendado</th><th scope="col" class="cp-num">Já recebido</th><th scope="col" class="cp-num">Falta</th><th scope="col" class="cp-num">Chegou bom</th><th scope="col" class="cp-num">Rejeitado</th><th scope="col">Motivo</th><th scope="col">Diferença</th></tr></thead>
    <tbody>${x.linhas.map((l) => {
      const v = f.linhas[l.id] ?? { aceite: 0, rejeitada: 0, motivo: '' }, falta = pendente(l), tot = v.aceite + v.rejeitada, dif = falta - tot;
      const cel = (k: 'aceite' | 'rejeitada', rot: string) => `<input class="cp-celula cp-celula--curta${tot > falta ? ' is-erro' : ''}" inputmode="numeric" data-cp-rec="${k}" data-cp-linha="${l.id}" value="${v[k] || ''}" placeholder="0" aria-label="${rot}: ${esc(l.ref)}"${falta ? '' : ' disabled'}>`;
      return `<tr data-cp-l="${l.id}" class="${falta ? '' : 'is-completa'}">
        <td data-rotulo="Artigo"><span class="cp-ref">${esc(l.ref)}</span><span class="cp-fraco">${esc(artigo(l.ref)?.desc ?? '')} · EAN ${artigo(l.ref)?.ean ?? '—'}</span></td>
        <td data-rotulo="Encomendado" class="cp-num">${l.qtd.toLocaleString('pt-PT')}</td>
        <td data-rotulo="Já recebido" class="cp-num">${l.recebida.toLocaleString('pt-PT')}${l.rejeitada ? `<span class="cp-fraco cp-rej">${l.rejeitada} rej.</span>` : ''}</td>
        <td data-rotulo="Falta" class="cp-num cp-forte">${falta.toLocaleString('pt-PT')}</td>
        <td data-rotulo="Chegou bom" class="cp-num">${cel('aceite', 'Chegou bom')}</td>
        <td data-rotulo="Rejeitado" class="cp-num">${cel('rejeitada', 'Rejeitado')}</td>
        <td data-rotulo="Motivo"><select class="cp-select cp-select--celula${v.rejeitada && !v.motivo && f.erros.length ? ' is-erro' : ''}" data-cp-rec="motivo" data-cp-linha="${l.id}" aria-label="Motivo da rejeição: ${esc(l.ref)}"${v.rejeitada ? '' : ' disabled'}><option value="">—</option>${MOTIVOS.map((m) => `<option${m === v.motivo ? ' selected' : ''}>${m}</option>`).join('')}</select></td>
        <td data-rotulo="Diferença" data-cp-dif="${l.id}">${!falta ? '<span class="cp-fraco">completa</span>' : tot > falta ? `<span class="cp-dif cp-dif--erro">${tot - falta} a mais</span>` : !tot ? '<span class="cp-fraco">—</span>' : dif ? `<span class="cp-dif">faltam ${dif}</span>` : '<span class="cp-dif cp-dif--ok">certa</span>'}</td>
      </tr>`;
    }).join('')}</tbody></table></div>`;
}
function paginaRececao(e: Estado, ref: string, f: FormRec | null): Pagina {
  const p = e.perfil;
  const base = PASSOS_COMPRAS('Receções');
  if (!pode(p, 'ver')) return { onde: 'compras-rececoes', caminho: base, html: `<main class="cp">${semAcesso('Compras')}</main>` };
  const r = rececao(ref);
  if (r) {
    const x = encomenda(r.enc)!, mov = movimentosDe(r.ref);
    return { onde: 'compras-rececoes', caminho: [...base, { nome: r.ref }], html: `<main class="cp" data-cp-pagina="rececao-vista">
      <header class="cp-doc"><div class="cp-doc__id"><p class="cp-doc__tipo">Receção de mercadoria</p><h1 class="cp-doc__ref"><span style="view-transition-name: ws-doc">${r.ref}</span></h1>
        <p class="cp-doc__linha">da <button type="button" class="cp-ligacao" data-ws-ir="compras-encomenda" data-ws-ref="${x.ref}">${x.ref}</button> · ${esc(fornecedor(x.forn)!.nome)} · guia ${esc(r.guia)} · ${dia(r.data)} · ${PERFIS[r.por].pessoa}</p></div>
        <div class="cp-doc__accoes">${(x.estado === 'Emitida' || x.estado === 'Parcialmente recebida') && pode(p, 'receber') ? btn('Registar outra receção', 'package-check', { attrs: `data-ws-ir="compras-rececao" data-ws-ref="${x.ref}"` }) : ''}${btn('Ver a encomenda', 'arrow-right', { cls: 'btn--ghost', attrs: `data-ws-ir="compras-encomenda" data-ws-ref="${x.ref}"` })}</div></header>
      ${f?.feita === r.ref ? `<p class="cp-faixa cp-faixa--ok" role="status">${ic('circle-check')}Receção registada. A ${x.ref} está agora «${x.estado}» e o stock do ${ARMAZEM} foi atualizado.</p>` : ''}
      <section class="cp-caixa"><h2 class="cp-bloco__titulo">Linhas</h2><div class="cp-tabela-rolo"><table class="cp-tabela"><thead><tr><th scope="col">Artigo</th><th scope="col" class="cp-num">Encomendado</th><th scope="col" class="cp-num">Aceite</th><th scope="col" class="cp-num">Rejeitado</th><th scope="col">Motivo</th><th scope="col" class="cp-num">Falta na encomenda</th></tr></thead><tbody>
        ${r.linhas.map((l) => { const le = x.linhas.find((y) => y.id === l.linha)!; return `<tr><td data-rotulo="Artigo"><span class="cp-ref">${esc(l.ref)}</span><span class="cp-fraco">${esc(artigo(l.ref)?.desc ?? '')}</span></td><td data-rotulo="Encomendado" class="cp-num">${le.qtd}</td><td data-rotulo="Aceite" class="cp-num cp-forte"><span class="cp-rola" data-cp-rola>${l.aceite}</span></td><td data-rotulo="Rejeitado" class="cp-num">${l.rejeitada || '—'}</td><td data-rotulo="Motivo">${esc(l.motivo) || '—'}</td><td data-rotulo="Falta" class="cp-num">${pendente(le)}</td></tr>`; }).join('')}
      </tbody></table></div></section>
      <section class="cp-caixa"><h2 class="cp-bloco__titulo">Movimentos de stock</h2>${mov.length ? `<ul class="cp-lista-docs">${mov.map((m) => `<li class="cp-mov"><span class="cp-ref">${esc(m.ref)}</span><span class="cp-mov__qtd">+${m.qtd.toLocaleString('pt-PT')}</span><span>${esc(m.armazem)}</span><span class="cp-fraco">${m.quando} · stock agora ${stock(m.ref).toLocaleString('pt-PT')}</span></li>`).join('')}</ul>` : `<p class="cp-texto cp-fraco">${r.chave.startsWith('semente') ? 'Receção anterior ao protótipo: os movimentos estão no sistema antigo.' : 'Sem movimentos: nada foi aceite.'}</p>`}
        <p class="cp-texto cp-fraco">O stock só se mexe pelo inventário, com uma entrada por linha aceite; o rejeitado não entra.</p></section>
    </main>` };
  }
  const x = encomenda(ref);
  if (!x) return { onde: 'compras-rececoes', caminho: [...base, { nome: ref || '—' }], html: `<main class="cp"><div class="cp-vazio" role="alert">${ic('search', 'cp-vazio__icone')}<p class="cp-vazio__titulo">Não há ${esc(ref) || 'documento'}</p>${btn('Ver as receções', 'arrow-right', { cls: 'btn--ghost btn--sm', attrs: 'data-ws-ir="compras-rececoes"' })}</div></main>` };
  if (!pode(p, 'receber')) return { onde: 'compras-rececoes', caminho: [...base, { nome: `Receber ${x.ref}` }], html: `<main class="cp"><div class="cp-vazio cp-vazio--fechado" role="alert">${ic('lock', 'cp-vazio__icone')}<p class="cp-vazio__titulo">Registar receções é com o Armazém</p><p class="cp-vazio__texto">O teu perfil vê as receções mas não as regista.</p>${btn('Ver a encomenda', 'arrow-right', { cls: 'btn--ghost btn--sm', attrs: `data-ws-ir="compras-encomenda" data-ws-ref="${x.ref}"` })}</div></main>` };
  if (!['Emitida', 'Parcialmente recebida'].includes(x.estado)) return { onde: 'compras-rececoes', caminho: [...base, { nome: `Receber ${x.ref}` }], html: `<main class="cp"><div class="cp-vazio" role="alert">${ic('info', 'cp-vazio__icone')}<p class="cp-vazio__titulo">A ${x.ref} está «${x.estado}»</p><p class="cp-vazio__texto">Só se recebe mercadoria de encomendas emitidas ou parcialmente recebidas.</p>${btn('Ver a encomenda', 'arrow-right', { cls: 'btn--ghost btn--sm', attrs: `data-ws-ir="compras-encomenda" data-ws-ref="${x.ref}"` })}</div></main>` };
  const fr = f ?? { chave: '', guia: '', notas: '', linhas: {}, erros: [] };
  return { onde: 'compras-rececoes', caminho: [...base, { nome: `Receber ${x.ref}` }], html: `<main class="cp" data-cp-pagina="rececao" data-cp-ref="${x.ref}">
    ${fr.erros.length ? `<div class="cp-faixa cp-faixa--erro" role="alert" tabindex="-1" data-cp-erros>${ic('circle-alert')}<div><p class="cp-faixa__titulo">A receção não foi registada:</p><ul>${fr.erros.map((m) => `<li>${esc(m)}</li>`).join('')}</ul></div></div>` : ''}
    <header class="cp-doc"><div class="cp-doc__id"><p class="cp-doc__tipo">Registar receção</p><h1 class="cp-doc__ref"><span style="view-transition-name: ws-doc">${x.ref}</span></h1>
      <p class="cp-doc__linha">${esc(fornecedor(x.forn)!.nome)} · entrega prevista ${dia(x.entrega)}${atrasada(x) ? ` <span class="cp-atraso">(há ${diasAtraso(x.entrega)} dias)</span>` : ''} · ${esc(x.armazem)}</p></div>
      <div class="cp-doc__accoes">${btn('Receber tudo o que falta', 'list-checks', { cls: 'btn--ghost', attrs: 'data-cp-tudo' })}${btn('Registar receção', 'package-check', { attrs: 'data-cp-registar' })}</div></header>
    <section class="cp-caixa cp-campos">
      <div class="cp-grelha">
        <label class="cp-campo"><span class="cp-campo__rotulo">Guia do fornecedor <span class="cp-obrig" aria-hidden="true">*</span></span><input class="cp-input${fr.erros.some((m) => m.includes('guia')) ? ' is-erro' : ''}" data-cp-guia value="${esc(fr.guia)}" placeholder="O número que vem na guia" required></label>
        <label class="cp-campo"><span class="cp-campo__rotulo">Ler código</span><span class="cp-ler">${ic('search')}<input class="cp-input" data-cp-ler placeholder="EAN ou referência, e Enter" autocomplete="off" aria-describedby="cp-ler-d"></span><small class="cp-fraco" id="cp-ler-d">Com o leitor, cada leitura soma 1 a «Chegou bom».</small></label>
        <div class="cp-campo"><span class="cp-campo__rotulo">Recebido por</span><span class="cp-campo__valor">${PERFIS[p].pessoa} · hoje</span></div>
      </div>
    </section>
    <section class="cp-caixa"><header class="cp-bloco__cabeca"><h2 class="cp-bloco__titulo">O que chegou</h2><span class="cp-fraco" aria-live="polite" data-cp-ler-diz></span></header>${linhasRececao(x, fr)}</section>
    <section class="cp-caixa"><h2 class="cp-bloco__titulo">Notas</h2><textarea class="cp-input cp-notas" rows="2" data-cp-rec-notas aria-label="Notas da receção" placeholder="Caixas abertas, guia com erros…">${esc(fr.notas)}</textarea></section>
  </main>` };
}

/* ---------- 14 · Fornecedores e 15 · Fornecedor ---------- */
function paginaFornecedores(e: Estado, q = ''): Pagina {
  if (!pode(e.perfil, 'fornecedores')) return { onde: 'compras-fornecedores', caminho: PASSOS_COMPRAS('Fornecedores'), html: `<main class="cp">${semAcesso('Compras')}</main>` };
  return { onde: 'compras-fornecedores', caminho: PASSOS_COMPRAS('Fornecedores'), html: `<main class="cp" data-cp-pagina="fornecedores">
    ${cabeca('Fornecedores', `${FORNECEDORES.length} fornecedores · o desempenho vem das encomendas e receções deste protótipo`)}
    <p class="cp-aviso">${ic('info')}Os dados do fornecedor são de exemplo e só de leitura: virão da base de dados mestres comum, ainda por decidir. Os contactos são os da empresa, nunca pessoais.</p>
    <section class="cp-caixa">
      <div class="cp-barra-ferr"><div class="cp-procura">${ic('search', 'cp-procura__lupa')}<input type="search" class="cp-procura__campo" placeholder="Nome, NIF ou cidade" aria-label="Procurar fornecedores" value="${esc(q)}" data-cp-forn-q></div></div>
      <div class="cp-tabela-rolo" data-cp-forn-tabela>${tabelaFornecedores(q)}</div>
    </section>
  </main>` };
}
export function tabelaFornecedores(q: string): string {
  const s = sem(q.trim());
  const l = FORNECEDORES.filter((f) => !s || sem(`${f.nome} ${f.legal} ${f.nif} ${f.cidade}`).includes(s));
  if (!l.length) return `<div class="cp-vazio cp-vazio--curto"><p class="cp-vazio__texto">Nenhum fornecedor com «${esc(q)}».</p></div>`;
  return `<table class="cp-tabela"><caption class="sr-only">Fornecedores</caption><thead><tr><th scope="col">Fornecedor</th><th scope="col">NIF</th><th scope="col">Cidade</th><th scope="col">Pagamento</th><th scope="col" class="cp-num">Prazo</th><th scope="col" class="cp-num">Abertas</th><th scope="col">Entregas a tempo</th><th scope="col" class="cp-num">Comprado</th></tr></thead><tbody>
    ${l.map((f) => { const d = desempenho(f.id); return `<tr><td data-rotulo="Fornecedor"><button type="button" class="cp-ref-btn cp-forte" data-ws-ir="compras-fornecedor" data-ws-ref="${f.id}">${esc(f.nome)}</button><span class="cp-fraco">${esc(f.legal)}</span></td><td data-rotulo="NIF" class="cp-ref cp-ref--fraca">${f.nif}</td><td data-rotulo="Cidade">${esc(f.cidade)}</td><td data-rotulo="Pagamento">${f.pagamento}</td><td data-rotulo="Prazo" class="cp-num">${f.prazo} d</td><td data-rotulo="Abertas" class="cp-num">${d.abertas || '—'}${d.atrasadas ? ` <span class="cp-atraso">(${d.atrasadas} atrasada${d.atrasadas === 1 ? '' : 's'})</span>` : ''}</td><td data-rotulo="Entregas a tempo">${d.receções ? `${d.aTempo} de ${d.receções}` : '<span class="cp-fraco">sem receções</span>'}</td><td data-rotulo="Comprado" class="cp-num">${euros(d.comprado)}</td></tr>`; }).join('')}
  </tbody></table>`;
}
function paginaFornecedor(e: Estado, id: string): Pagina {
  const base = PASSOS_COMPRAS('Fornecedores');
  if (!pode(e.perfil, 'fornecedores')) return { onde: 'compras-fornecedores', caminho: base, html: `<main class="cp">${semAcesso('Compras')}</main>` };
  const f = fornecedor(id);
  if (!f) return { onde: 'compras-fornecedores', caminho: [...base, { nome: '—' }], html: `<main class="cp"><div class="cp-vazio" role="alert">${ic('search', 'cp-vazio__icone')}<p class="cp-vazio__titulo">Fornecedor desconhecido</p>${btn('Ver os fornecedores', 'arrow-right', { cls: 'btn--ghost btn--sm', attrs: 'data-ws-ir="compras-fornecedores"' })}</div></main>` };
  const d = desempenho(f.id), arts = ARTIGOS.filter((a) => a.forn === f.id), encs = encomendas().filter((x) => x.forn === f.id);
  return { onde: 'compras-fornecedores', caminho: [...base, { nome: f.nome }], html: `<main class="cp" data-cp-pagina="fornecedor" data-cp-ref="${f.id}">
    <header class="cp-doc"><div class="cp-doc__id"><p class="cp-doc__tipo">Fornecedor</p><h1 class="cp-doc__ref cp-doc__ref--nome">${esc(f.nome)}</h1><p class="cp-doc__linha">${esc(f.legal)} · <span class="cp-ref">${f.nif}</span><span class="cp-est cp-est--${f.ativo ? 'recebida' : 'cancelada'}">${f.ativo ? 'Ativo' : 'Inativo'}</span></p></div>
      <div class="cp-doc__accoes">${pode(e.perfil, 'criar') && f.ativo ? btn('Nova encomenda', 'file-plus-2', { attrs: `data-cp-nova="${f.id}"` }) : ''}</div></header>
    <div class="cp-tres">
      <section class="cp-caixa"><h2 class="cp-bloco__titulo">Contacto</h2><dl class="cp-cond"><div><dt>${esc(f.contacto.papel)}</dt><dd>${esc(f.contacto.correio)}</dd></div><div><dt>Telefone</dt><dd>${esc(f.contacto.telefone)}</dd></div><div><dt>Morada</dt><dd>${esc(f.morada)}</dd></div></dl></section>
      <section class="cp-caixa"><h2 class="cp-bloco__titulo">Condições</h2><dl class="cp-cond"><div><dt>Pagamento</dt><dd>${f.pagamento}</dd></div><div><dt>Prazo habitual</dt><dd>${f.prazo} dias</dd></div><div><dt>Entrega</dt><dd>${esc(f.entrega)}</dd></div><div><dt>Moeda</dt><dd>Euro</dd></div></dl></section>
      <section class="cp-caixa"><h2 class="cp-bloco__titulo">Desempenho</h2><dl class="cp-cond"><div><dt>Entregas a tempo</dt><dd>${d.receções ? `${d.aTempo} de ${d.receções} receções` : 'Ainda sem receções'}</dd></div><div><dt>Abertas</dt><dd>${d.abertas}${d.atrasadas ? ` · <span class="cp-atraso">${d.atrasadas} atrasada${d.atrasadas === 1 ? '' : 's'}</span>` : ''}</dd></div><div><dt>Comprado</dt><dd>${euros(d.comprado)} s/ IVA · ${d.encomendas} encomendas</dd></div></dl><p class="cp-texto cp-fraco">A tempo = receção até à data de entrega prevista. Só com os dados do protótipo.</p></section>
    </div>
    <section class="cp-caixa"><header class="cp-bloco__cabeca"><h2 class="cp-bloco__titulo">Artigos e referências <span class="cp-fraco">${arts.length}</span></h2></header><div class="cp-tabela-rolo"><table class="cp-tabela"><thead><tr><th scope="col">Artigo</th><th scope="col">Ref. do fornecedor</th><th scope="col">Descrição</th><th scope="col" class="cp-num">Último preço</th><th scope="col" class="cp-num">Stock</th><th scope="col" class="cp-num">A caminho</th></tr></thead><tbody>
      ${arts.map((a) => `<tr><td data-rotulo="Artigo" class="cp-ref">${esc(a.ref)}</td><td data-rotulo="Ref. fornecedor" class="cp-ref cp-ref--fraca">${esc(a.refForn)}</td><td data-rotulo="Descrição">${esc(a.desc)}</td><td data-rotulo="Último preço" class="cp-num">${a.preco === null ? '<span class="cp-falta">Sem preço</span>' : euros(a.preco)}</td><td data-rotulo="Stock" class="cp-num">${stock(a.ref).toLocaleString('pt-PT')}</td><td data-rotulo="A caminho" class="cp-num">${aCaminho(a.ref).toLocaleString('pt-PT') || '—'}</td></tr>`).join('')}
    </tbody></table></div></section>
    <section class="cp-caixa"><header class="cp-bloco__cabeca"><h2 class="cp-bloco__titulo">Encomendas <span class="cp-fraco">${encs.length}</span></h2></header>${encs.length ? `<ul class="cp-lista-docs">${encs.map((x) => `<li><button type="button" class="cp-doc-linha" data-ws-ir="compras-encomenda" data-ws-ref="${x.ref}"><span class="cp-ref">${x.ref}</span><span>${dia(x.data)} · ${euros(totais(x).base)} s/ IVA</span><span>${estadoEnc(x)}</span>${ic('arrow-right')}</button></li>`).join('')}</ul>` : '<p class="cp-texto cp-fraco">Sem encomendas.</p>'}</section>
  </main>` };
}

/* ---------- o registo das páginas (o comportamento redesenha por aqui) ---------- */
export interface Contexto { ref: string; vista?: VistaLista; edicao?: Edicao | null; rec?: FormRec | null; q?: string }
export function paginaCompras(id: string, e: Estado, c: Contexto): Pagina {
  switch (id) {
    case 'compras': return lista(e, c.vista);
    case 'compras-encomenda': return editor(e, c.edicao ?? null, c.ref);
    case 'compras-rececoes': return paginaRececoes(e);
    case 'compras-rececao': return paginaRececao(e, c.ref, c.rec ?? null);
    case 'compras-fornecedores': return paginaFornecedores(e, c.q);
    case 'compras-fornecedor': return paginaFornecedor(e, c.ref);
  }
  return lista(e);
}
/** A edição de partida de uma encomenda (uma cópia: só se grava ao guardar). */
export const edicaoDe = (ref: string): Edicao | null => { const x = encomenda(ref); return x ? { enc: JSON.parse(JSON.stringify(x)), versao: x.versao, sujo: false, erros: [], conflito: false } : null; };

/** Os cenários dos estados: «erros» = o rascunho com uma linha sem preço e outra com quantidade zero, já submetido. */
export function cenario(ed: Edicao | null, c?: string): Edicao | null {
  if (!ed || c !== 'erros') return ed;
  ed.enc.linhas[0].qtd = 0;
  ed.enc.linhas.push({ id: 'z', ref: '0 986 424 797', qtd: 20, preco: null, desc: 0, iva: 2300, entrega: ed.enc.entrega, recebida: 0, rejeitada: 0 });
  ed.sujo = true; ed.erros = problemas(ed.enc);
  return ed;
}

/* ---------- os ecrãs ---------- */
/* só os estados fixam o perfil e o documento; o ecrã principal usa o perfil da sessão e o documento que se abriu */
const ws = (pagina: string, html: string, o: { perfil?: IdPerfil; ref?: string; cenario?: string; fixo?: boolean } = {}) =>
  `<div class="ws" data-densidade="confortavel" data-lado="aberto" data-ws-pagina="${pagina}"${o.fixo && o.perfil ? ` data-ws-perfil="${o.perfil}"` : ''}${o.fixo && o.ref ? ` data-ws-ref="${esc(o.ref)}"` : ''}${o.cenario ? ` data-cp-cenario="${o.cenario}"` : ''}>${html}</div>`;
const desenhar = (pagina: string, o: { perfil?: IdPerfil; ref?: string; cenario?: string; fixo?: boolean; c?: Partial<Contexto> } = {}) => {
  const e = estadoPadrao(o.perfil ?? 'compras');
  const c: Contexto = { ref: o.ref ?? '', ...o.c };
  if (pagina === 'compras-encomenda' && c.edicao === undefined) c.edicao = cenario(edicaoDe(c.ref), o.cenario);
  return ws(pagina, casca(e, paginaCompras(pagina, e, c)), o);
};
const NOTA_V2 = 'A fase 1 de Compras (19 out., briefing «Module 01»): Encomendas a fornecedor na casca do Início — por estado, procura, ordenar, exportar; o editor, as receções e os fornecedores a seguir';
const NOTA = 'Fase 1 de Compras (19 out.): encomendas, receções e fornecedores com regras a funcionar no navegador (sem servidor)';

/** A v2 do 10 · Compras (a v1 fica como estava). */
export const VERSAO_COMPRAS_V2 = () => ({ id: 'v2', nota: NOTA_V2, html: desenhar('compras') });

export function ecrasCompras2(): Ecra<IdErp>[] {
  const v = (html: string) => [{ id: 'v1', nota: NOTA, html }] as Ecra<IdErp>['versoes'];
  const est = (id: IdCompras2, de: IdErp, nome: string, objetivo: string, html: string): Ecra<IdErp> => ({ id, nome, fluxo: 'Compras', estadoDe: de, objetivo, versoes: v(html) });
  return [
    { id: 'compras-encomenda', nome: '11 · Encomenda a fornecedor', fluxo: 'Compras', objetivo: 'O editor da encomenda: cabeçalho, artigos editáveis no rascunho (quantidade, preço, desconto, entrega), o resumo com o IVA por taxa, o percurso do documento, receções e histórico; só as ações que o estado e o perfil deixam.', versoes: v(desenhar('compras-encomenda', { ref: 'EF 2026/0413' })) },
    { id: 'compras-rececoes', nome: '12 · Receções', fluxo: 'Compras', objetivo: 'O que está por receber, pela entrega prevista (as atrasadas primeiro), e as receções registadas.', versoes: v(desenhar('compras-rececoes', { perfil: 'armazem' })) },
    { id: 'compras-rececao', nome: '13 · Receção', fluxo: 'Compras', objetivo: 'Registar uma receção contra a encomenda: guia do fornecedor, o que chegou bom e o que se rejeita (com motivo), leitura de código; parcial ou total; não deixa receber a mais; cria os movimentos de stock pelo inventário.', versoes: v(desenhar('compras-rececao', { perfil: 'armazem', ref: 'EF 2026/0408' })) },
    { id: 'compras-fornecedores', nome: '14 · Fornecedores', fluxo: 'Compras', objetivo: 'Os fornecedores, com as condições e o desempenho calculado das encomendas e receções.', versoes: v(desenhar('compras-fornecedores')) },
    { id: 'compras-fornecedor', nome: '15 · Fornecedor', fluxo: 'Compras', objetivo: 'A ficha do fornecedor: dados, contacto da empresa, condições, desempenho, artigos com a referência dele e as encomendas.', versoes: v(desenhar('compras-fornecedor', { ref: 'skf' })) },
    est('cp-lista-atrasadas', 'compras', '10.1 · Só as atrasadas', 'O filtro «Atrasadas»: emitidas ou parcialmente recebidas com a entrega prevista já passada (não é um estado; é uma condição).', desenhar('compras', { fixo: true, cenario: 'atrasadas', c: { vista: { ...vistaPadrao(), filtro: 'atrasadas' } } })),
    est('cp-sem-acesso', 'compras', '10.2 · Sem acesso', 'O perfil Vendas não vê Compras: o ecrã diz isso e a quem pedir, sem mostrar números.', desenhar('compras', { fixo: true, perfil: 'vendas' })),
    est('cp-enc-aprovar', 'compras-encomenda', '11.1 · Aprovar (Administração)', 'A EF 2026/0412, acima do limite do comprador, aberta pela Administração: Aprovar e, em «Mais», Rejeitar com motivo. Quem a criou não a aprova.', desenhar('compras-encomenda', { fixo: true, perfil: 'admin', ref: 'EF 2026/0412' })),
    est('cp-enc-erros', 'compras-encomenda', '11.2 · Submeter com erros', 'Submeter um rascunho incompleto: a faixa diz o que falta e as células com problema ficam marcadas; nada muda no documento.', desenhar('compras-encomenda', { fixo: true, ref: 'EF 2026/0413', cenario: 'erros' })),
    est('cp-enc-recebida', 'compras-encomenda', '11.3 · Parcialmente recebida', 'A EF 2026/0411: o percurso até à receção, o recebido e o que falta por linha, e a receção que o explica.', desenhar('compras-encomenda', { fixo: true, ref: 'EF 2026/0411' })),
    est('cp-rec-vista', 'compras-rececao', '13.1 · Receção registada', 'A RC 2026/0187: o que foi aceite e rejeitado e quanto ainda falta na encomenda.', desenhar('compras-rececao', { fixo: true, perfil: 'armazem', ref: 'RC 2026/0187' })),
    est('cp-forn-skf', 'compras-fornecedores', '14.1 · Procura', 'A lista de fornecedores com uma procura.', desenhar('compras-fornecedores', { fixo: true, c: { q: 'Lisboa' } })),
  ];
}
