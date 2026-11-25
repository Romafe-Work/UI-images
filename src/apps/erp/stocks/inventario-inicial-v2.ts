/* =========================================================
   ERP — Stocks: 70 · Inventário inicial, v2 (19 nov. 2026), do briefing dela «Redesign do módulo Inventário Inicial».
   Fica no mesmo motor das listas de documentos (compras/docs-v2.ts) que a v1, por isso tudo o que a v1 faz continua
   igual: a ficha (criar e editar o rascunho, com as mesmas validações do domínio), Lançar no stock (Ctrl+F2), Anular (F8)
   com o motivo, a pesquisa F1 F2 F10 F12, as janelas dos documentos (Detalhes, Linhas, Stock, Anexos), o Excel e as
   permissões. A v2 junta:
     - indicadores entre os filtros e a lista: lançados, rascunhos e anulados (filtram pelo estado), o valor e a quantidade
       só dos lançados (a quantidade por unidade: un. e jogos não se somam); dizem quando estão filtrados;
     - o Período nos filtros rápidos (este mês, 90 dias, este ano, 2025); Mais filtros: as datas e Criado por;
     - as vistas Tabela | Cartões | Por armazém (Alt+1/2/3), com a mesma pesquisa, filtros e ordem;
     - Por armazém: armazém → ano → documento → linhas. O valor do armazém é só o do inventário em vigor (o lançado: o
       domínio só deixa um por armazém), nunca a soma dos documentos — os rascunhos e os anulados ficam à vista, à parte;
     - no detalhe, a rastreabilidade (quem criou, lançou e anulou, e quando; os movimentos que gerou) e, em Linhas, os
       movimentos de cada artigo no 77;
     - ao lançar, o resumo antes de confirmar e o efeito: soma às existências do armazém, não as substitui (lancarInv).
   O tipo do documento (abertura, recontagem…) não existe nos dados: não se inventa; o papel de cada um sai do estado.
   A data da contagem também não é um campo (vem nas observações), por isso não se mostra à parte.
   ========================================================= */
import type { Ecra } from '../../../comum/tipos';
import type { IdErp } from '../ids';
import { registar, paginaDoc, BTN, L, esc, type CfgDoc, type Doc, type EstDoc } from '../compras/docs-v2';
import { toast, tudo, ativoDe, filtradas, escolher, abrirFicha, de } from '../compras/docs-v2-comportamento';
import { CFG as V1, COLS, linhas as linhasV1, doc, celula as celulaV1, painel as painelV1, editavel, porqueLancar_, dlgLancar, badge, ESTADOS_INV } from './inventario-inicial';
import { ARMAZENS, armazemDe, artigo, valorLinha, quantidade, valorTotal, HOJE, type DocInv } from './dominio';
import { dia } from '../compras/dominio';
import { abrirEcra } from '../comportamento/abrir-ecra';
import table from 'lucide-static/icons/table.svg?raw';
import grid from 'lucide-static/icons/layout-grid.svg?raw';
import warehouse from 'lucide-static/icons/warehouse.svg?raw';
import circleCheck from 'lucide-static/icons/circle-check.svg?raw';
import clock from 'lucide-static/icons/clock.svg?raw';
import ban from 'lucide-static/icons/ban.svg?raw';
import euro from 'lucide-static/icons/euro.svg?raw';
import boxes from 'lucide-static/icons/boxes.svg?raw';
import funnel from 'lucide-static/icons/funnel.svg?raw';
import eye from 'lucide-static/icons/eye.svg?raw';
import pencil from 'lucide-static/icons/pencil.svg?raw';
import arrowDownToLine from 'lucide-static/icons/arrow-down-to-line.svg?raw';
import chevR from 'lucide-static/icons/chevron-right.svg?raw';
import chevL from 'lucide-static/icons/chevron-left.svg?raw';
import arrowLeftRight from 'lucide-static/icons/arrow-left-right.svg?raw';
import history from 'lucide-static/icons/history.svg?raw';
import searchX from 'lucide-static/icons/search-x.svg?raw';

const K = 'inv2';
/* os números com o separador dos milhares também com quatro algarismos (1 216,40 €), como nos mapas v2 */
const AG = { useGrouping: 'always' } as unknown as Intl.NumberFormatOptions;
export const nf = (n: number) => n.toLocaleString('pt-PT', AG);
export const euros = (c: number) => `${(c / 100).toLocaleString('pt-PT', { ...AG, minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
/** O que vem feito da v1 (o painel dos detalhes, as linhas do «Stock») com os milhares separados. */
export const milhares = (h: string) => h.replace(/(\d)(\d{3}),(\d{2}) €/g, '$1\u00a0$2,$3 €').replace(/>(-?\+?)(\d)(\d{3})</g, '>$1$2\u00a0$3<').replace(/(\d)(\d{3}) unidades/g, '$1\u00a0$2 unidades');
const ok = (e: EstDoc) => e.fase === 'ok' || e.fase === 'atualizar';

/* ---------- as linhas: as da v1, com o filtro Criado por ---------- */
export const resp = (e: EstDoc) => String(e.extra.resp ?? '');
function linhas(e: EstDoc): Doc[] { const r = resp(e); return linhasV1(e).filter((d) => !r || d.uIns === r); }
const pessoas = () => [...new Set(linhasV1({ extra: {} } as EstDoc).map((d) => String(d.uIns)))].sort((a, b) => a.localeCompare(b, 'pt'));

/** O papel do documento no armazém, só pelo que os dados dizem (o estado, se já foi lançado e se é o stock de partida). */
function papel(d: Doc): { k: string; t: string } {
  const x = doc(d);
  if (d.anulado) return x.lancado ? { k: 'revertido', t: 'Anulado depois de lançado: as quantidades saíram' } : { k: 'sem-efeito', t: 'Anulado antes de lançar: nunca mexeu no stock' };
  if (d.lancado) return x.base ? { k: 'vigor', t: 'Em vigor · stock de partida' } : { k: 'vigor', t: 'Em vigor' };
  const outro = linhasV1({ extra: {} } as EstDoc).find((y) => y.armazem === d.armazem && y.lancado && y.id !== d.id);
  return outro ? { k: 'espera', t: `Rascunho · o armazém já tem o ${outro.ref} em vigor` } : { k: 'rasc', t: 'Rascunho · por lançar' };
}
const estadoB = (d: Doc) => d.anulado ? badge('lf2-b--rutura', ban, 'Anulado') : d.lancado ? badge('lf2-b--pend', circleCheck, 'Lançado') : badge('lf2-b--enc', clock, 'Rascunho', 'Ainda não entrou no stock');

/** Quantidades por unidade (un. e jogos não se somam). */
export function porUnidade(ls: { ref: string; qtd: number }[], sep = ' · '): string {
  const m = new Map<string, number>(); ls.forEach((l) => { const u = artigo(l.ref)?.un ?? 'un.'; m.set(u, (m.get(u) ?? 0) + l.qtd); });
  return [...m].sort(([a], [b]) => (a === 'un.' ? 0 : 1) - (b === 'un.' ? 0 : 1)).map(([u, q]) => `${nf(q)} ${u === 'jogo' ? (q === 1 ? 'jogo' : 'jogos') : esc(u)}`).join(sep) || '0';
}
const linhasDe = (ds: Doc[]) => ds.flatMap((d) => doc(d).linhas);

/* ---------- a tabela: as colunas da v1; as observações compridas cortam com «…» e dizem-se inteiras ao passar ---------- */
function celula(d: Doc, k: string): string {
  if (k === 'valor') return euros(d.valor as number);
  if (k === 'qtd' || k === 'artigos') return nf(d[k] as number);
  if (k === 'notas') { const t = String(d.notas ?? ''); return t ? `<span class="inv2-notas" title="${esc(t)}">${esc(t)}</span>` : '<span class="is-nada">—</span>'; }
  return celulaV1(d, k);
}

/* ---------- os indicadores (reagem aos filtros; o estado escolhe-se tocando num deles) ---------- */
function kpis(r: HTMLElement, e: EstDoc): string {
  sincronizar(r, e);
  if (!ok(e)) return '';
  const est = e.f.estado; e.f.estado = ''; const ls = filtradas(r, e); e.f.estado = est;
  const todos = e.vazia ? 0 : linhasV1(e).length;
  const lanc = ls.filter((d) => d.lancado), rasc = ls.filter((d) => !d.lancado && !d.anulado), anul = ls.filter((d) => d.anulado);
  const arms = new Set(lanc.map((d) => d.armazem)).size;
  const filtrado = ls.length !== todos;
  const b = (k: string, cls: string, ic: string, t: string, n: number, ctx: string) => `<button type="button" class="minv2-kpi ${cls}" data-dv2-acao="kpi" data-inv2-k="${k}" aria-pressed="${est === k}" title="${est === k ? 'Tirar o filtro do estado' : `Mostrar só os ${t.toLowerCase()}`}"><span class="minv2-kpi-ic">${L(ic)}</span><small>${t}</small><b>${nf(n)}</b><i>${ctx}</i></button>`;
  const v = (cls: string, ic: string, t: string, val: string, ctx: string) => `<div class="minv2-kpi ${cls}"><span class="minv2-kpi-ic">${L(ic)}</span><small>${t}</small><b>${val}</b><i>${ctx}</i></div>`;
  return `${filtrado ? `<p class="minv2-kpis-f">${L(funnel)}<span>Com filtros · <b>${nf(ls.length)}</b> de ${nf(todos)} documentos</span></p>` : ''}
    ${b('lanc', 'is-com', circleCheck, 'Lançados', lanc.length, arms ? `em ${nf(arms)} ${arms === 1 ? 'armazém' : 'armazéns'}` : 'nenhum no stock')}
    ${b('rasc', 'inv2-k-rasc', clock, 'Rascunhos', rasc.length, 'ainda fora do stock')}
    ${b('anul', 'inv2-k-anul', ban, 'Anulados', anul.length, 'no histórico, sem efeito')}
    ${v('is-total', euro, 'Valor lançado', euros(lanc.reduce((s, d) => s + (d.valor as number), 0)), 'só os lançados; quantidade × custo')}
    ${v('', boxes, 'Quantidade lançada', porUnidade(linhasDe(lanc)), `${nf(new Set(linhasDe(lanc).map((l) => l.ref)).size)} artigos distintos`)}`;
}

/* ---------- o Período (rápido) e Criado por (nos avançados) ---------- */
export const ANO = HOJE.slice(0, 4);
const menos = (dias: number) => new Date(Date.parse(HOJE) - dias * 86_400_000).toISOString().slice(0, 10);
export const PERIODOS: [string, string, string, string][] = [
  ['mes', 'Este mês', `${HOJE.slice(0, 7)}-01`, HOJE], ['90', 'Últimos 90 dias', menos(90), HOJE],
  ['ano', `Este ano (${ANO})`, `${ANO}-01-01`, `${ANO}-12-31`], ['ano-1', String(+ANO - 1), `${+ANO - 1}-01-01`, `${+ANO - 1}-12-31`],
];
export const campoPeriodo = (id: (x: string) => string) => `<label class="ak-campo" for="${id('per2')}"><span>Período</span><select id="${id('per2')}" data-inv2-per data-dv2-campo><option value="">Todos</option>${PERIODOS.map(([k, t]) => `<option value="${k}">${esc(t)}</option>`).join('')}<option value="outro" hidden>Datas escolhidas</option></select></label>`;
export const campoCriadoPor = (id: (x: string) => string, ps: string[]) => `<label class="ak-campo" for="${id('resp')}"><span>Criado por</span><select id="${id('resp')}" data-inv2-resp data-dv2-campo><option value="">Todos</option>${ps.map((p) => `<option value="${esc(p)}">${esc(p)}</option>`).join('')}</select></label>`;
/** Ordenar fica nos filtros (25 nov., ela: «ordenar fica nos filtros»): a mesma ordem para a tabela e os cartões. */
export const campoOrdenar = (id: (x: string) => string, ordens: [string, string][]) => `<label class="ak-campo" for="${id('ord')}"><span>Ordenar</span><select id="${id('ord')}" data-inv2-ord data-dv2-campo>${ordens.map(([v, t]) => `<option value="${v}">${esc(t)}</option>`).join('')}<option value="_tabela" hidden>Como na tabela</option></select></label>`;
const rapidos = (id: (x: string) => string) => `${campoPeriodo(id)}${campoOrdenar(id, ORDENS)}`;
const avancados = (id: (x: string) => string) => campoCriadoPor(id, pessoas());
/** Os dois campos novos seguem o estado (as datas mudadas à mão em Mais filtros, Limpar, tirar a etiqueta). */
export function sincronizar(r: HTMLElement, e: EstDoc): void {
  const per = r.querySelector<HTMLSelectElement>('[data-inv2-per]'), rs = r.querySelector<HTMLSelectElement>('[data-inv2-resp]');
  if (per) { const p = PERIODOS.find(([, , a, b]) => a === e.f.de && b === e.f.ate); const v = p ? p[0] : e.f.de || e.f.ate ? 'outro' : ''; if (per.value !== v) per.value = v; }
  if (rs && rs.value !== resp(e)) rs.value = resp(e);
  const os = r.querySelector<HTMLSelectElement>('[data-inv2-ord]');
  if (os) { const o = e.ordem[0], v = o ? `${o.k}:${o.dir}` : '', w = [...os.options].some((x) => x.value === v) ? v : '_tabela'; if (os.value !== w) os.value = w; }
  const n = r.querySelector<HTMLElement>('[data-dv2-n-av]');
  if (n) { const k = [...r.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-dv2-av] [data-dv2-f]')].filter((x) => !!x.value).length + (resp(e) ? 1 : 0); n.textContent = k ? String(k) : ''; }
}

/* ---------- Cartões: os mesmos documentos, filtros e ordem; paginados como as tabelas ---------- */
export const OPCOES = [10, 25, 50, 0];
export const porPagina = () => { try { const v = localStorage.getItem('erp:por-pagina'); return v !== null && OPCOES.includes(Number(v)) ? Number(v) : 25; } catch { return 25; } };
const ORDENS: [string, string][] = [['', 'Número (mais recente)'], ['data:-1', 'Data de emissão (mais recente)'], ['data:1', 'Data de emissão (mais antiga)'], ['valor:-1', 'Valor (maior)'], ['armazem:1', 'Armazém']];
export const vazio = (t: string, d: string) => `<div class="ak-vazio lf2-vazio">${L(searchX)}<p><b>${t}</b>${d}</p><button type="button" class="ak-btn" data-dv2-acao="limpar"><span>Limpar filtros</span></button></div>`;
function cartao(e: EstDoc, d: Doc): string {
  const p = papel(d), pode = editavel(e, d), lancar = !porqueLancar_(e, d);
  return `<article role="listitem" class="minv2-cartao inv2-cartao is-${p.k}${e.ativo === d.id ? ' is-ativo' : ''}" data-dv2-vjan="${esc(d.id)}|detalhes" tabindex="0" aria-label="${esc(`${d.numero} · ${d.armazemNome} · ${d.estado}`)}">
    <header><b class="is-mono">${esc(String(d.numero))}</b>${estadoB(d)}</header>
    <p class="minv2-fam">Série ${esc(String(d.serie))} · ${esc(String(d.armazemNome))}</p>
    <p class="inv2-c-notas" title="${esc(String(d.notas ?? ''))}">${esc(String(d.notas ?? '')) || '<span class="is-nada">Sem observações</span>'}</p>
    <dl class="minv2-nums"><div><dt>Emissão</dt><dd>${dia(String(d.data))}</dd></div><div class="inv2-c-qtd"><dt>Quantidade</dt><dd>${porUnidade(doc(d).linhas, '<br>')}</dd></div><div class="is-valor"><dt>Valor total</dt><dd>${euros(d.valor as number)}</dd></div></dl>
    <p class="inv2-papel is-${p.k}" title="${esc(p.t)}">${esc(p.t)}</p>
    <footer>
      <button type="button" class="ak-btn ak-btn--linha" data-dv2-vjan="${esc(d.id)}|detalhes">${L(eye)}<span>Ver</span></button>
      ${pode ? `<button type="button" class="ak-btn ak-btn--linha" data-dv2-acao="c-editar" data-inv2-id="${esc(d.id)}">${L(pencil)}<span>Editar</span></button>` : ''}
      ${lancar ? `<button type="button" class="ak-btn ak-btn--acao" data-dv2-acao="c-lancar" data-inv2-id="${esc(d.id)}">${L(arrowDownToLine)}<span>Lançar</span></button>` : ''}</footer>
  </article>`;
}
function cartoes(r: HTMLElement, e: EstDoc): string {
  const ls = filtradas(r, e);
  if (!ls.length) return vazio('Nenhum documento com estes filtros.', 'Tira um filtro, ou limpa-os.');
  const pg = paginas(e, ls.length), lanc = ls.filter((d) => d.lancado);
  return `<div class="minv2-cartoes inv2-cartoes" role="list">${ls.slice(pg.de, pg.ate).map((d) => cartao(e, d)).join('')}</div>
    <p class="minv2-c-total"><span>Lançados · ${nf(lanc.length)} de ${nf(ls.length)} documentos</span><b>${porUnidade(linhasDe(lanc))}</b><b>${euros(lanc.reduce((s, d) => s + (d.valor as number), 0))}</b></p>
    ${pg.html}`;
}

/* ---------- Por armazém: armazém → ano → documento → linhas ---------- */
const fechados = (e: EstDoc) => (e.extra.fech ??= new Set<string>()) as Set<string>;
const abertos = (e: EstDoc) => (e.extra.abr ??= new Set<string>()) as Set<string>;
const aberto = (e: EstDoc, k: string) => k.startsWith('d:') ? abertos(e).has(k) : !fechados(e).has(k);
const seta = (e: EstDoc, k: string, t: string) => `<button type="button" class="inv2-seta" data-dv2-acao="arv" data-inv2-k="${esc(k)}" aria-expanded="${aberto(e, k)}" aria-label="${aberto(e, k) ? 'Recolher' : 'Expandir'} ${esc(t)}">${L(chevR)}</button>`;
function arvore(r: HTMLElement, e: EstDoc): string {
  const ls = filtradas(r, e);
  if (!ls.length) return vazio('Nenhum documento com estes filtros.', 'Tira um filtro, ou limpa-os.');
  const linhasT: string[] = []; const vigorT: Doc[] = [];
  ARMAZENS.forEach((a) => {
    const ds = ls.filter((d) => d.armazem === a.cod); if (!ds.length) return;
    const vigor = ds.find((d) => d.lancado); if (vigor) vigorT.push(vigor);
    const datas = ds.map((d) => String(d.data)).sort(), ka = `a:${a.cod}`;
    const cont = (f: (d: Doc) => boolean, t: string) => { const n = ds.filter(f).length; return n ? `<span>${nf(n)} ${t}</span>` : ''; };
    linhasT.push(`<tr class="inv2-a"><td>${seta(e, ka, a.nome)}<span class="inv2-a-n"><b>${esc(a.nome)}</b><small>${nf(ds.length)} ${ds.length === 1 ? 'documento' : 'documentos'} · ${datas.length > 1 ? `${dia(datas[0])} a ${dia(datas[datas.length - 1])}` : dia(datas[0])}</small></span></td>
      <td class="inv2-cont">${cont((d) => !!d.lancado, 'lançado')}${cont((d) => !d.lancado && !d.anulado, ds.filter((d) => !d.lancado && !d.anulado).length === 1 ? 'rascunho' : 'rascunhos')}${cont((d) => !!d.anulado, ds.filter((d) => d.anulado).length === 1 ? 'anulado' : 'anulados')}</td>
      <td class="is-num">${vigor ? `${nf(doc(vigor).linhas.length)}` : '<span class="is-nada">—</span>'}</td><td class="is-num">${vigor ? porUnidade(doc(vigor).linhas) : '<span class="is-nada">—</span>'}</td>
      <td class="is-num">${vigor ? `<b>${euros(vigor.valor as number)}</b><small>em vigor · ${esc(String(vigor.numero))}</small>` : '<span class="is-nada">sem inventário em vigor</span>'}</td></tr>`);
    if (!aberto(e, ka)) return;
    [...new Set(ds.map((d) => String(d.data).slice(0, 4)))].sort().reverse().forEach((ano) => {
      const dy = ds.filter((d) => String(d.data).startsWith(ano)), ky = `y:${a.cod}:${ano}`;
      linhasT.push(`<tr class="inv2-y"><td colspan="5">${seta(e, ky, ano)}<b>${ano}</b><small>${nf(dy.length)} ${dy.length === 1 ? 'documento' : 'documentos'}</small></td></tr>`);
      if (!aberto(e, ky)) return;
      dy.forEach((d) => {
        const kd = `d:${d.id}`, p = papel(d), x = doc(d);
        linhasT.push(`<tr class="inv2-d is-${p.k}${e.ativo === d.id ? ' is-ativo' : ''}" data-dv2-vjan="${esc(d.id)}|detalhes" tabindex="0" aria-label="${esc(`${d.numero} · ${d.estado}`)}"><td>${seta(e, kd, `as linhas de ${d.numero}`)}<span class="inv2-a-n"><b class="is-mono">${esc(String(d.numero))}</b><small>${dia(String(d.data))} · <span class="inv2-papel is-${p.k}">${esc(p.t)}</span></small></span></td>
          <td>${estadoB(d)}</td><td class="is-num">${nf(x.linhas.length)}</td><td class="is-num">${porUnidade(x.linhas)}</td><td class="is-num">${euros(d.valor as number)}</td></tr>`);
        if (!aberto(e, kd)) return;
        x.linhas.forEach((l) => { const ar = artigo(l.ref);
          linhasT.push(`<tr class="inv2-l"><td><span class="inv2-a-n"><b class="is-mono">${esc(l.ref)}</b><small>${esc(ar?.desc ?? '')}</small></span></td><td class="is-num"><small>${euros(l.custo)} / ${esc(ar?.un ?? 'un.')}</small></td><td></td><td class="is-num">${nf(l.qtd)} ${esc(ar?.un ?? '')}</td><td class="is-num">${euros(valorLinha(l))}</td></tr>`); });
      });
    });
  });
  return `<table class="lf2-tab inv2-arv" data-paginada aria-label="Inventários iniciais por armazém"><colgroup><col style="width:40%"><col style="width:20%"><col style="width:9%"><col style="width:14%"><col style="width:17%"></colgroup>
    <thead><tr><th scope="col">Armazém · ano · documento</th><th scope="col">Estados</th><th scope="col" class="is-num">Artigos</th><th scope="col" class="is-num">Quantidade</th><th scope="col" class="is-num">Valor</th></tr></thead>
    <tbody>${linhasT.join('')}</tbody>
    <tfoot><tr class="rc-total"><td><b>Em vigor · ${nf(vigorT.length)} ${vigorT.length === 1 ? 'armazém' : 'armazéns'}</b></td><td></td><td class="is-num">${nf(new Set(linhasDe(vigorT).map((l) => l.ref)).size)}</td><td class="is-num">${porUnidade(linhasDe(vigorT))}</td><td class="is-num"><b>${euros(vigorT.reduce((s, d) => s + (d.valor as number), 0))}</b></td></tr></tfoot></table>`;
}

/* ---------- o detalhe: a rastreabilidade; em Linhas, os movimentos de cada artigo ---------- */
function rastreio(d: Doc): string {
  const x = doc(d), cri = x.historico[0], lan = x.historico.find((h) => h.acao === 'Lançou no stock'), anu = x.historico.find((h) => h.acao === 'Anulou');
  const n = x.linhas.filter((l) => l.qtd).length, nome = armazemDe(x.armazem);
  const movs = x.base ? `É o stock de partida do ${esc(nome)}: no 77 aparece como «Stock de partida».`
    : d.anulado && x.lancado ? `${nf(n)} ${n === 1 ? 'entrada' : 'entradas'} no ${esc(nome)} ao lançar e ${nf(n)} ${n === 1 ? 'saída' : 'saídas'} ao anular.`
    : d.lancado ? `${nf(n)} ${n === 1 ? 'entrada' : 'entradas'} no ${esc(nome)}, uma por artigo.` : 'Nenhum: não entrou no stock.';
  const li = (t: string, h: typeof cri | undefined, extra = '') => h ? `<li><span>${t}</span><b>${esc(h.quem)}</b><time>${esc(h.quando)}</time>${extra}</li>` : '';
  return `<section class="inv2-rastro" aria-label="Rastreabilidade"><h3>${L(history)}Rastreabilidade</h3><ol>
    ${li('Criado', cri)}${x.base && !lan ? `<li><span>Lançado</span><b>${esc(String(d.uAlt))}</b><time>${esc(x.lancado ?? '')}</time></li>` : li('Lançado', lan)}${li('Anulado', anu, x.anulado ? `<small>${esc(x.anulado.motivo)}</small>` : '')}
    <li><span>Movimentos</span><b>${movs}</b>${d.lancado || (d.anulado && x.lancado) ? `<button type="button" class="ak-btn ak-btn--linha" data-inv2-tab="linhas">${L(arrowLeftRight)}<span>Por artigo, em Linhas</span></button>` : ''}</li></ol></section>`;
}
function painel(e: EstDoc, d: Doc | undefined, tab: string): string {
  if (!d) return '';
  if (tab === 'detalhes') return milhares(painelV1(e, d, tab)).replace('<details class="dv2-hist">', `${rastreio(d)}<details class="dv2-hist">`);
  if (tab === 'linhas') {
    const x = doc(d), mov = d.lancado || (d.anulado && !!x.lancado);
    return `<table class="lf2-mini dv2-linhas-t"><thead><tr><th>Artigo</th><th>Descrição</th><th class="is-num">Quantidade</th><th>Un.</th><th class="is-num">Custo unitário</th><th class="is-num">Valor</th>${mov ? '<th><span class="sr">Movimentos</span></th>' : ''}</tr></thead><tbody>${x.linhas.map((l) => { const a = artigo(l.ref);
      return `<tr><td class="is-mono">${esc(l.ref)}</td><td>${esc(a?.desc ?? '')}</td><td class="is-num">${nf(l.qtd)}</td><td>${esc(a?.un ?? '')}</td><td class="is-num">${euros(l.custo)}</td><td class="is-num"><b>${euros(valorLinha(l))}</b></td>${mov ? `<td><button type="button" class="ak-btn ak-btn--linha inv2-mov" data-inv2-mov="${esc(l.ref)}" title="Os movimentos de ${esc(l.ref)} no 77 · Movimentos de artigos">${L(arrowLeftRight)}<span>Movimentos</span></button></td>` : ''}</tr>`; }).join('')}</tbody>
      <tfoot><tr class="is-total"><td colspan="2">Total · ${nf(x.linhas.length)} ${x.linhas.length === 1 ? 'artigo' : 'artigos'}</td><td class="is-num">${nf(quantidade(x))}</td><td></td><td></td><td class="is-num"><b>${euros(valorTotal(x))}</b></td>${mov ? '<td></td>' : ''}</tr></tfoot></table>`;
  }
  return milhares(painelV1(e, d, tab));
}

/* ---------- lançar: o resumo e o efeito antes de confirmar ---------- */
function resumoLancar(r: HTMLElement, e: EstDoc): void {
  const sub = r.querySelector<HTMLElement>('[data-dv2-dlg] .lf2-dlg-sub'); if (!sub || !r.querySelector('[data-dv2-dlg] [data-dv2-acao="lancar-sim"]') || r.querySelector('[data-dv2-dlg] .inv2-lanc')) return;
  const d = ativoDe(r, e); if (!d) return; const x: DocInv = doc(d);
  const dd = (t: string, v: string) => `<div><dt>${t}</dt><dd>${v}</dd></div>`;
  /* o armazém e a data já estão na linha de cima */
  sub.insertAdjacentHTML('afterend', `<dl class="lf2-dl inv2-lanc">${dd('Artigos', nf(x.linhas.length))}${dd('Quantidade', porUnidade(x.linhas))}${dd('Valor total', `<b>${euros(valorTotal(x))}</b>`)}<div class="inv2-lanc-ef"><dt>Efeito no stock</dt><dd>${x.base ? 'Nenhum: já é o stock de partida.' : '<b>Soma</b> às existências do armazém; não as substitui.'}</dd></div></dl>`);
  /* a tabela do diálogo vem da v1: os milhares separados */
  r.querySelectorAll<HTMLElement>('[data-dv2-dlg] td.is-num, [data-dv2-dlg] td.is-num b').forEach((c) => { if (!c.children.length && c.textContent) c.textContent = c.textContent.replace(/(\d)(\d{3})(?!\d)/g, '$1\u00a0$2'); });
}

/** As ações comuns aos documentos de stock v2: o indicador do estado, as páginas dos cartões, Criado por e Limpar. */
export function acaoComum(r: HTMLElement, e: EstDoc, k: string, b: HTMLElement): boolean | null {
  if (k === 'kpi') { const v = b.dataset.inv2K!; e.f.estado = e.f.estado === v ? '' : v; e.extra.pagC = 0; tudo(r, e, true); r.querySelector<HTMLElement>(`[data-inv2-k="${v}"]`)?.focus(); return true; }
  if (k === 'pagc') { e.extra.pagC = Number(e.extra.pagC ?? 0) + Number(b.dataset.inv2Ir); tudo(r, e); r.querySelector<HTMLElement>(`[data-inv2-ir="${b.dataset.inv2Ir}"]:not(:disabled)`)?.focus(); return true; }
  if (k === 'tirar' && b.dataset.dv2Tirar === 'x:resp') { e.extra.resp = ''; tudo(r, e, true); return true; }
  if (k === 'limpar') { e.extra.resp = ''; e.extra.pagC = 0; return false; }
  return null;
}
/** As páginas dos cartões (o mesmo aspeto da paginação das tabelas). */
export function paginas(e: EstDoc, total: number): { de: number; ate: number; html: string } {
  const pp = Number(e.extra.ppC ?? porPagina()), n = Math.max(1, pp ? Math.ceil(total / pp) : 1), pg = Math.max(0, Math.min(n - 1, Number(e.extra.pagC ?? 0)));
  e.extra.pagC = pg;
  const de = pp ? pg * pp : 0, ate = pp ? Math.min(total, de + pp) : total;
  return { de, ate, html: `<nav class="pag-t inv2-pag" aria-label="Páginas dos cartões"><span class="pag-t-n">${nf(de + 1)}–${nf(ate)} de ${nf(total)}</span>
      <button type="button" class="ak-btn ak-btn--linha" data-dv2-acao="pagc" data-inv2-ir="-1" ${pg === 0 ? 'disabled' : ''} aria-label="Página anterior" title="Página anterior">${L(chevL)}</button>
      <span class="pag-t-p">Página <b>${pg + 1}</b> de ${n}</span>
      <button type="button" class="ak-btn ak-btn--linha" data-dv2-acao="pagc" data-inv2-ir="1" ${pg >= n - 1 ? 'disabled' : ''} aria-label="Página seguinte" title="Página seguinte">${L(chevR)}</button>
      <label class="pag-t-pp"><span>Por página</span><select data-inv2-pp aria-label="Cartões por página">${OPCOES.map((x) => `<option value="${x}"${x === pp ? ' selected' : ''}>${x || 'Todos'}</option>`).join('')}</select></label></nav>` };
}

/* ---------- registar ---------- */
const CFG2: CfgDoc = registar({
  ...V1, k: K,
  sub: 'Documentos de abertura de stock e respetiva valorização por armazém.',
  cols: COLS, linhas, celula, painel,
  /* a linha de totais da v1 passou aos indicadores (não se repete por cima da tabela) */
  resumo: () => '',
  barra: `${BTN('lancar', arrowDownToLine, 'Lançar no stock', 'Ctrl+F2', '', 'ak-btn--acao')}`,
  kpis, rapidos, avancados, vistasComPesquisa: true, vistasEmCima: true,
  vistas: [
    { k: 'docs', t: 'Tabela', ic: table, tecla: 'Alt+1', titulo: 'Documentos' },
    { k: 'cartoes', t: 'Cartões', ic: grid, tecla: 'Alt+2', titulo: 'Documentos', tabela: cartoes },
    { k: 'armazem', t: 'Por armazém', ic: warehouse, tecla: 'Alt+3', titulo: 'Por armazém', tabela: arvore },
  ],
  chips: (e) => resp(e) ? [['x:resp', `Criado por ${resp(e)}`]] : [],
  acao(r, e, k, b) {
    const c = acaoComum(r, e, k, b); if (c !== null) return c;
    if (k === 'arv') { const x = b.dataset.inv2K!, s = x.startsWith('d:') ? abertos(e) : fechados(e); if (s.has(x)) s.delete(x); else s.add(x); tudo(r, e); r.querySelector<HTMLElement>(`[data-inv2-k="${CSS.escape(x)}"]`)?.focus(); return true; }
    if (k === 'c-editar' || k === 'c-lancar') {
      const id = b.dataset.inv2Id!; escolher(r, e, id, false); const d = ativoDe(r, e); if (!d) return true;
      if (k === 'c-editar') abrirFicha(r, e, 'editar', d); else { dlgLancar(r, e); resumoLancar(r, e); }
      return true;
    }
    const feito = V1.acao(r, e, k, b);
    if (k === 'lancar') resumoLancar(r, e);
    return feito;
  },
  cenario(r, e, cen) {
    /* no telemóvel começa nos cartões (o briefing: «ecrãs pequenos: cartões compactos»); a tabela continua a um toque */
    if (!e.extra.vista && !e.editor && window.matchMedia('(max-width: 760px)').matches) e.extra.vista = 'cartoes';
    if (cen === 'kpi-rascunhos') e.f.estado = 'rasc';
    if (cen === 'periodo') { e.f.de = `${ANO}-01-01`; e.f.ate = `${ANO}-12-31`; }
    if (cen === 'criado-por') e.extra.resp = pessoas()[0] ?? '';
    if (cen === 'arvore-linhas') { e.extra.vista = 'armazem'; const d = linhasV1(e).find((x) => x.lancado && x.armazem === '1'); if (d) { abertos(e).add(`d:${d.id}`); e.ativo = d.id; } }
    if (cen === 'cartoes-rasc') { e.extra.vista = 'cartoes'; e.f.estado = 'rasc'; }
    V1.cenario(r, e, cen);
    if (['lancar', 'a-lancar', 'lancar-falhou'].includes(cen)) requestAnimationFrame(() => requestAnimationFrame(() => resumoLancar(r, e)));
  },
  dica: 'As datas de emissão afinam o Período. Enter passa ao campo seguinte.',
});

/* ---------- o comportamento próprio (o resto é do motor) ---------- */
/* (servem também o 71 · Transferências v2, que usa os mesmos campos: Período, Criado por, Ordenar, Por página) */
const raiz = (t: EventTarget | null) => (t as HTMLElement | null)?.closest?.<HTMLElement>(`:is([data-dv2="${K}"], [data-dv2="tra2"])`) ?? null;
export function iniciar(): void {
  document.addEventListener('change', (ev) => {
    const t = ev.target as HTMLSelectElement, r = raiz(t); if (!r) return; const e = de(r);
    if (t.matches('[data-inv2-per]')) { const p = PERIODOS.find(([k]) => k === t.value); if (t.value !== 'outro') { e.f.de = p?.[2] ?? ''; e.f.ate = p?.[3] ?? ''; } e.extra.pagC = 0; tudo(r, e, true); return; }
    if (t.matches('[data-inv2-resp]')) { e.extra.resp = t.value; e.extra.pagC = 0; tudo(r, e, true); return; }
    if (t.matches('[data-inv2-ord]')) { if (t.value === '_tabela') return; const [k, d] = t.value.split(':'); e.ordem = k ? [{ k, dir: (Number(d) === -1 ? -1 : 1) as 1 | -1 }] : []; tudo(r, e); r.querySelector<HTMLElement>('[data-inv2-ord]')?.focus(); return; }
    if (t.matches('[data-inv2-pp]')) { e.extra.ppC = Number(t.value); e.extra.pagC = 0; try { localStorage.setItem('erp:por-pagina', t.value); } catch { /* sem armazenamento */ } tudo(r, e); r.querySelector<HTMLElement>('[data-inv2-pp]')?.focus(); }
  });
  document.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement, r = raiz(t); if (!r) return;
    let b: HTMLElement | null;
    if ((b = t.closest('[data-inv2-mov]'))) { const ref = b.dataset.inv2Mov!; abrirEcra('stocks.mapa-movimentos', 'stocks-mapa-movimentos', `aba=mov;art=${ref}`, 'Movimentos de artigos'); toast(r, `Os movimentos de ${ref} abrem no 77.`); return; }
    if ((b = t.closest('[data-inv2-tab]'))) { const j = b.closest<HTMLElement>('[data-dv2-jan]'); j?.querySelector<HTMLElement>(`[data-dv2-jan-tab="${b.dataset.inv2Tab}"]`)?.click(); return; }
    /* a escolha acende-se nas outras vistas (o motor só acende as linhas da tabela) */
    if ((b = t.closest('[data-dv2-vista-g] [data-dv2-vjan]')) && !t.closest('[data-dv2-acao]')) {
      const id = b.dataset.dv2Vjan!.split('|')[0];
      r.querySelectorAll('[data-dv2-vista-g] .is-ativo').forEach((x) => x.classList.remove('is-ativo'));
      r.querySelectorAll<HTMLElement>('[data-dv2-vista-g] :is(article, tr)[data-dv2-vjan]').forEach((x) => { if (x.dataset.dv2Vjan!.startsWith(`${id}|`)) x.classList.add('is-ativo'); });
    }
  });
  document.addEventListener('keydown', (ev) => {
    const t = ev.target as HTMLElement; if (!raiz(t) || ev.key !== 'Enter' || !t.matches(':is(article, tr)[data-dv2-vjan]')) return;
    ev.preventDefault(); t.click();
  });
}

/* ---------- os ecrãs ---------- */
const NOTA = 'Inventário inicial v2 (19 nov., do briefing «Redesign do módulo Inventário Inicial»), no mesmo motor da v1 — a ficha, Lançar (Ctrl+F2), Anular (F8), a pesquisa F1 F2 F10 F12 e as janelas ficam iguais. Junta: indicadores (lançados, rascunhos e anulados filtram; valor e quantidade só dos lançados, por unidade); Período nos filtros rápidos e Criado por em Mais filtros; as vistas Tabela | Cartões | Por armazém (Alt+1/2/3) com os mesmos filtros e ordem; Por armazém em árvore (armazém → ano → documento → linhas), com o valor só do inventário em vigor; no detalhe a rastreabilidade e os movimentos de cada artigo no 77; ao lançar, o resumo e o efeito (soma às existências).';
const NOVOS: [string, string, string][] = [
  ['vista-cartoes', '70.39 · Vista cartões', 'Os mesmos documentos em cartões: estado, armazém, data, quantidade e valor; Ver, Editar e Lançar quando se pode.'],
  ['cartoes-rasc', '70.40 · Cartões só dos rascunhos', 'O indicador Rascunhos filtra também os cartões.'],
  ['vista-armazem', '70.41 · Por armazém', 'Armazém → ano → documento: o valor em vigor de cada armazém e os estados dos documentos.'],
  ['arvore-linhas', '70.42 · Por armazém com as linhas', 'Um documento aberto até às linhas: artigo, custo, quantidade e valor.'],
  ['kpi-rascunhos', '70.43 · Só os rascunhos', 'Tocar no indicador Rascunhos filtra a lista; outra vez tira.'],
  ['periodo', '70.44 · Período: este ano', 'O Período rápido põe as datas de emissão; a etiqueta tira-as.'],
  ['criado-por', '70.45 · Criado por', 'Mais filtros ▸ Criado por: só os documentos de uma pessoa.'],
];
export type IdInvV2 = `inv-${string}`;
export function ecrasInventarioInicial(): Ecra<IdErp>[] {
  const armazens = ARMAZENS.map((a): [string, string] => [a.cod, `${a.cod} · ${a.nome}`]);
  const v = (cen: string) => ({ id: 'v2', nota: NOTA, html: paginaDoc(CFG2, cen, armazens) });
  return [
    { id: 'stocks-inventario-inicial', nome: '70 · Inventário inicial', fluxo: 'Stocks', objetivo: 'Os documentos de abertura de stock de cada armazém, em tabela, cartões ou por armazém: criar o rascunho, lançar no stock (Ctrl+F2) e anular, com a rastreabilidade de cada um.', versoes: [v('normal')] as Ecra<IdErp>['versoes'] },
    ...[...ESTADOS_INV, ...NOVOS].map(([cen, nome, objetivo]) => ({ id: `inv-${cen}` as IdErp, nome, fluxo: 'Stocks', estadoDe: 'stocks-inventario-inicial' as IdErp, objetivo, versoes: [v(cen)] as Ecra<IdErp>['versoes'] })),
  ];
}
