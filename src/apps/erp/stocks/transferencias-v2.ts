/* =========================================================
   ERP — Stocks: 71 · Transferências entre armazéns, v2 (19 nov. 2026), do briefing dela «Redesign do módulo
   Transferências entre Armazéns». No mesmo motor da v1 (compras/docs-v2.ts) e com as peças do 70 v2, por isso fica tudo o
   que a v1 faz: a ficha (o stock na origem por linha, Trocar), Lançar no stock (Ctrl+F2) só com stock na origem, Anular
   (F8) com o motivo (uma lançada volta à origem, se o destino ainda o tiver), a pesquisa F1 F2 F10 F12, as janelas, o Excel,
   os anexos e as permissões. Junta:
     - indicadores: lançadas, rascunhos (quantos prontos a lançar) e anuladas filtram pelo estado; as unidades e o valor
       são só das lançadas (as unidades por unidade: un. e jogos não se somam), com os movimentos que geraram (uma saída e
       uma entrada por linha) e os artigos distintos à parte;
     - filtros: o Destino e o Período nos rápidos (a Origem já lá estava); Artigo e Criado por em Mais filtros;
     - as vistas Tabela | Cartões | Por armazém | Fluxos | Transferir (Alt+1…5), com a mesma pesquisa, filtros e ordem;
     - Por armazém: pela origem ou pelo destino — armazém → o outro armazém → documentos → artigos; os totais só das
       lançadas, os rascunhos à parte;
     - Fluxos: origens à esquerda, destinos à direita, uma ligação por percurso com a espessura pela quantidade, pelo
       valor ou pelos documentos; por omissão só as lançadas, os rascunhos (tracejado) e as anuladas (pontilhado, a
       vermelho) só se se pedirem; tocar numa ligação mostra o percurso (documentos, artigos, quantidade, valor, período);
       por baixo, a mesma informação em lista (para o teclado, os leitores de ecrã e muitos percursos);
     - no detalhe, a rastreabilidade e, em Linhas, os movimentos de cada artigo no 77.
   O que os dados não têm não se mostra: não há «tipo de documento» além da série (TA), nem períodos fechados. O valor
   calcula-se ao custo de hoje (custoDe), como na v1: não fica guardado no lançamento — diz-se no detalhe.
   ========================================================= */
import type { Ecra } from '../../../comum/tipos';
import type { IdErp } from '../ids';
import { registar, paginaDoc, L, esc, type CfgDoc, type Doc, type EstDoc } from '../compras/docs-v2';
import { tudo, ativoDe, filtradas, escolher, abrirFicha, de, toast } from '../compras/docs-v2-comportamento';
import { CFG as V1, COLS, linhas as linhasV1, doc, celula as celulaV1, painel as painelV1, editavel, porqueLancar_, dlgLancar, badge, curto, ESTADOS_TRA } from './transferencias';
import { ARMAZENS, armazemDe, artigo, ARTIGOS, custoDe, stockEm, criarTr, lancarTr, podeInv, HOJE, Recusa } from './dominio';
import { dia } from '../compras/dominio';
import { nf, euros, milhares, porUnidade, resp, sincronizar, campoPeriodo, campoCriadoPor, campoOrdenar, vazio, acaoComum, paginas } from './inventario-inicial-v2';
import table from 'lucide-static/icons/table.svg?raw';
import grid from 'lucide-static/icons/layout-grid.svg?raw';
import warehouse from 'lucide-static/icons/warehouse.svg?raw';
import network from 'lucide-static/icons/network.svg?raw';
import circleCheck from 'lucide-static/icons/circle-check.svg?raw';
import clock from 'lucide-static/icons/clock.svg?raw';
import ban from 'lucide-static/icons/ban.svg?raw';
import euro from 'lucide-static/icons/euro.svg?raw';
import boxes from 'lucide-static/icons/boxes.svg?raw';
import funnel from 'lucide-static/icons/funnel.svg?raw';
import eye from 'lucide-static/icons/eye.svg?raw';
import pencil from 'lucide-static/icons/pencil.svg?raw';
import arrowDownToLine from 'lucide-static/icons/arrow-down-to-line.svg?raw';
import arrowRight from 'lucide-static/icons/arrow-right.svg?raw';
import arrowLeftRight from 'lucide-static/icons/arrow-left-right.svg?raw';
import chevR from 'lucide-static/icons/chevron-right.svg?raw';
import history from 'lucide-static/icons/history.svg?raw';
import x_ from 'lucide-static/icons/x.svg?raw';
import move from 'lucide-static/icons/move.svg?raw';
import grip from 'lucide-static/icons/grip-vertical.svg?raw';
import arrowRightLeft from 'lucide-static/icons/arrow-right-left.svg?raw';
import save from 'lucide-static/icons/save.svg?raw';
import trash from 'lucide-static/icons/trash-2.svg?raw';
import search from 'lucide-static/icons/search.svg?raw';
import packageOpen from 'lucide-static/icons/package-open.svg?raw';
import eraser from 'lucide-static/icons/eraser.svg?raw';

const K = 'tra2';
const ok = (e: EstDoc) => e.fase === 'ok' || e.fase === 'atualizar';
const pessoa0 = () => linhasV1({ extra: {} } as EstDoc);

/* ---------- as linhas: as da v1, com o Destino, o Artigo e Criado por ---------- */
const dest = (e: EstDoc) => String(e.extra.dest ?? ''), art = (e: EstDoc) => String(e.extra.art ?? '').trim();
function linhas(e: EstDoc): Doc[] {
  const r = resp(e), d0 = dest(e), a = art(e).toLowerCase();
  return linhasV1(e).filter((d) => (!r || d.uIns === r) && (!d0 || d.destino === d0) && (!a || doc(d).linhas.some((l) => l.ref.toLowerCase().includes(a))));
}
const pessoas = () => [...new Set(pessoa0().map((d) => String(d.uIns)))].sort((a, b) => a.localeCompare(b, 'pt'));
const linhasDe = (ds: Doc[]) => ds.flatMap((d) => doc(d).linhas);
const valorDe = (ls: { ref: string; qtd: number }[]) => ls.reduce((s, l) => s + l.qtd * custoDe(l.ref), 0);
const estadoB = (d: Doc) => d.anulado ? badge('lf2-b--rutura', ban, 'Anulada') : d.lancado ? badge('lf2-b--pend', circleCheck, 'Lançada') : badge('lf2-b--enc', clock, 'Rascunho', 'Ainda não mexeu no stock');
/** «60 Coimbra → 1 Porto», com os códigos. */
const rota = (o: string, d: string) => `<span class="tra2-rota"><span><b class="is-mono">${esc(o)}</b> ${esc(curto(o))}</span>${L(arrowRight)}<span><b class="is-mono">${esc(d)}</b> ${esc(curto(d))}</span></span>`;

/* ---------- a tabela: as colunas da v1, com os milhares e as observações inteiras ao passar ---------- */
function celula(d: Doc, k: string): string {
  if (k === 'valor') return euros(d.valor as number);
  if (k === 'qtd' || k === 'artigos') return nf(d[k] as number);
  if (k === 'notas') { const t = String(d.notas ?? ''); return t ? `<span class="inv2-notas" title="${esc(t)}">${esc(t)}</span>` : '<span class="is-nada">—</span>'; }
  return celulaV1(d, k);
}

/* ---------- os indicadores (o estado filtra; as unidades e o valor são só das lançadas) ---------- */
function kpis(r: HTMLElement, e: EstDoc): string {
  sincronizar(r, e); sincronizar2(r, e);
  if (!ok(e)) return '';
  const est = e.f.estado; e.f.estado = ''; const ls = filtradas(r, e); e.f.estado = est;
  const todos = e.vazia ? 0 : linhasV1(e).length;
  const lanc = ls.filter((d) => d.lancado), rasc = ls.filter((d) => !d.lancado && !d.anulado), anul = ls.filter((d) => d.anulado);
  const prontos = rasc.filter((d) => !porqueLancar_(e, d)).length, arms = new Set(lanc.flatMap((d) => [d.origem, d.destino])).size;
  const ll = linhasDe(lanc), movs = ll.filter((l) => l.qtd).length * 2;
  const b = (k: string, cls: string, ic: string, t: string, n: number, ctx: string) => `<button type="button" class="minv2-kpi ${cls}" data-dv2-acao="kpi" data-inv2-k="${k}" aria-pressed="${est === k}" title="${est === k ? 'Tirar o filtro do estado' : `Mostrar só as ${t.toLowerCase()}`}"><span class="minv2-kpi-ic">${L(ic)}</span><small>${t}</small><b>${nf(n)}</b><i>${ctx}</i></button>`;
  const v = (cls: string, ic: string, t: string, val: string, ctx: string) => `<div class="minv2-kpi ${cls}"><span class="minv2-kpi-ic">${L(ic)}</span><small>${t}</small><b>${val}</b><i>${ctx}</i></div>`;
  return `${ls.length !== todos ? `<p class="minv2-kpis-f">${L(funnel)}<span>Com filtros · <b>${nf(ls.length)}</b> de ${nf(todos)} transferências</span></p>` : ''}
    ${b('lanc', 'is-com', circleCheck, 'Lançadas', lanc.length, arms ? `entre ${nf(arms)} armazéns` : 'nenhuma no stock')}
    ${b('rasc', 'inv2-k-rasc', clock, 'Rascunhos', rasc.length, rasc.length ? `${nf(prontos)} ${prontos === 1 ? 'pronto' : 'prontos'} a lançar` : 'nenhum por lançar')}
    ${b('anul', 'inv2-k-anul', ban, 'Anuladas', anul.length, 'no histórico, sem efeito')}
    ${v('', boxes, 'Unidades transferidas', porUnidade(ll), `${nf(movs)} movimentos · ${nf(new Set(ll.map((l) => l.ref)).size)} artigos distintos`)}
    ${v('is-total', euro, 'Valor das lançadas', euros(lanc.reduce((s, d) => s + (d.valor as number), 0)), 'ao custo de hoje de cada artigo')}`;
}

/* ---------- filtros: Destino e Período (rápidos); Artigo e Criado por (Mais filtros) ---------- */
const rapidos = (id: (x: string) => string) => `<label class="ak-campo" for="${id('dest')}"><span>Armazém de destino</span><select id="${id('dest')}" data-tra2-dest data-dv2-campo><option value="">Todos</option>${ARMAZENS.map((a) => `<option value="${a.cod}">${esc(a.cod)} · ${esc(curto(a.cod))}</option>`).join('')}</select></label>${campoPeriodo(id)}${campoOrdenar(id, ORDENS)}`;
const avancados = (id: (x: string) => string) => `<label class="ak-campo" for="${id('art')}"><span>Artigo</span><input type="search" id="${id('art')}" list="${id('art-l')}" data-tra2-art data-dv2-campo placeholder="Referência, ex.: 6205-2Z" autocomplete="off"><datalist id="${id('art-l')}">${ARTIGOS.map((a) => `<option value="${esc(a.ref)}">${esc(a.desc)}</option>`).join('')}</datalist></label>${campoCriadoPor(id, pessoas())}`;
function sincronizar2(r: HTMLElement, e: EstDoc): void {
  const s = r.querySelector<HTMLSelectElement>('[data-tra2-dest]'); if (s && s.value !== dest(e)) s.value = dest(e);
  const a = r.querySelector<HTMLInputElement>('[data-tra2-art]'); if (a && a.value !== art(e) && document.activeElement !== a) a.value = art(e);
  const n = r.querySelector<HTMLElement>('[data-dv2-n-av]'); if (n && art(e)) n.textContent = String(Number(n.textContent || 0) + 1);
}

/* ---------- Cartões ---------- */
const ORDENS: [string, string][] = [['', 'Número (mais recente)'], ['data:-1', 'Data de emissão (mais recente)'], ['data:1', 'Data de emissão (mais antiga)'], ['qtd:-1', 'Quantidade (maior)'], ['valor:-1', 'Valor (maior)']];
function cartao(e: EstDoc, d: Doc): string {
  const pode = editavel(e, d), porque = porqueLancar_(e, d), x = doc(d);
  return `<article role="listitem" class="minv2-cartao inv2-cartao tra2-cartao${d.anulado ? ' is-sem-efeito' : ''}${e.ativo === d.id ? ' is-ativo' : ''}" data-dv2-vjan="${esc(d.id)}|detalhes" tabindex="0" aria-label="${esc(`${d.numero} · ${d.origem} para ${d.destino} · ${d.estado}`)}">
    <header><b class="is-mono">${esc(String(d.numero))}</b>${estadoB(d)}</header>
    <p class="minv2-fam">${dia(String(d.data))}</p>
    ${rota(String(d.origem), String(d.destino))}
    <p class="inv2-c-notas" title="${esc(String(d.notas ?? ''))}">${esc(String(d.notas ?? '')) || '<span class="is-nada">Sem observações</span>'}</p>
    <dl class="minv2-nums"><div><dt>Artigos</dt><dd>${nf(x.linhas.length)}</dd></div><div class="inv2-c-qtd"><dt>Quantidade</dt><dd>${porUnidade(x.linhas, '<br>')}</dd></div><div class="is-valor"><dt>Valor</dt><dd>${euros(d.valor as number)}</dd></div></dl>
    ${!d.lancado && !d.anulado && porque && !porque.includes('perfil') ? `<p class="inv2-papel is-espera" title="${esc(porque)}">${esc(porque)}</p>` : ''}
    <footer>
      <button type="button" class="ak-btn ak-btn--linha" data-dv2-vjan="${esc(d.id)}|detalhes">${L(eye)}<span>Ver</span></button>
      ${pode ? `<button type="button" class="ak-btn ak-btn--linha" data-dv2-acao="c-editar" data-inv2-id="${esc(d.id)}">${L(pencil)}<span>Editar</span></button>` : ''}
      ${!porque ? `<button type="button" class="ak-btn ak-btn--acao" data-dv2-acao="c-lancar" data-inv2-id="${esc(d.id)}">${L(arrowDownToLine)}<span>Lançar</span></button>` : ''}</footer>
  </article>`;
}
function cartoes(r: HTMLElement, e: EstDoc): string {
  const ls = filtradas(r, e);
  if (!ls.length) return vazio('Nenhuma transferência com estes filtros.', 'Tira um filtro, ou limpa-os.');
  const pg = paginas(e, ls.length), lanc = ls.filter((d) => d.lancado);
  return `<div class="minv2-cartoes inv2-cartoes" role="list">${ls.slice(pg.de, pg.ate).map((d) => cartao(e, d)).join('')}</div>
    <p class="minv2-c-total"><span>Lançadas · ${nf(lanc.length)} de ${nf(ls.length)} transferências</span><b>${porUnidade(linhasDe(lanc))}</b><b>${euros(lanc.reduce((s, d) => s + (d.valor as number), 0))}</b></p>
    ${pg.html}`;
}

/* ---------- Por armazém: pela origem ou pelo destino — armazém → o outro → documentos → artigos ---------- */
const fechados = (e: EstDoc) => (e.extra.fech ??= new Set<string>()) as Set<string>;
const abertos = (e: EstDoc) => (e.extra.abr ??= new Set<string>()) as Set<string>;
const aberto = (e: EstDoc, k: string) => k.startsWith('d:') ? abertos(e).has(k) : !fechados(e).has(k);
const seta = (e: EstDoc, k: string, t: string) => `<button type="button" class="inv2-seta" data-dv2-acao="arv" data-inv2-k="${esc(k)}" aria-expanded="${aberto(e, k)}" aria-label="${aberto(e, k) ? 'Recolher' : 'Expandir'} ${esc(t)}">${L(chevR)}</button>`;
const porDestino = (e: EstDoc) => e.extra.porArm === 'destino';
function arvore(r: HTMLElement, e: EstDoc): string {
  const ls = filtradas(r, e), pd = porDestino(e);
  const alt = `<div class="inv2-c-cab tra2-alt"><span class="tra2-seg" role="group" aria-label="Agrupar pelo armazém de"><button type="button" data-dv2-acao="arm-por" data-tra2-v="origem" aria-pressed="${!pd}">Origem</button><button type="button" data-dv2-acao="arm-por" data-tra2-v="destino" aria-pressed="${pd}">Destino</button></span></div>`;
  if (!ls.length) return alt + vazio('Nenhuma transferência com estes filtros.', 'Tira um filtro, ou limpa-os.');
  const meu = (d: Doc) => String(pd ? d.destino : d.origem), outro = (d: Doc) => String(pd ? d.origem : d.destino);
  const soma = (ds: Doc[]) => { const l = ds.filter((d) => d.lancado); return { l, q: porUnidade(linhasDe(l)), v: euros(l.reduce((s, d) => s + (d.valor as number), 0)) }; };
  const cont = (ds: Doc[]) => { const n = (f: (d: Doc) => boolean) => ds.filter(f).length, a = n((d) => !!d.lancado), b = n((d) => !d.lancado && !d.anulado), c = n((d) => !!d.anulado); return `${a ? `<span>${nf(a)} ${a === 1 ? 'lançada' : 'lançadas'}</span>` : ''}${b ? `<span>${nf(b)} por lançar</span>` : ''}${c ? `<span>${nf(c)} ${c === 1 ? 'anulada' : 'anuladas'}</span>` : ''}`; };
  const out: string[] = [];
  ARMAZENS.forEach((a) => {
    const ds = ls.filter((d) => meu(d) === a.cod); if (!ds.length) return;
    const ka = `a:${a.cod}`, s = soma(ds);
    out.push(`<tr class="inv2-a"><td>${seta(e, ka, a.nome)}<span class="inv2-a-n"><b>${esc(a.cod)} · ${esc(curto(a.cod))}</b><small>${nf(ds.length)} ${ds.length === 1 ? `transferência ${pd ? 'recebida' : 'enviada'}` : `transferências ${pd ? 'recebidas' : 'enviadas'}`}</small></span></td><td class="inv2-cont">${cont(ds)}</td><td class="is-num">${s.l.length ? nf(new Set(linhasDe(s.l).map((l) => l.ref)).size) : '<span class="is-nada">—</span>'}</td><td class="is-num">${s.l.length ? s.q : '<span class="is-nada">—</span>'}</td><td class="is-num">${s.l.length ? `<b>${s.v}</b><small>só as lançadas</small>` : '<span class="is-nada">nada lançado</span>'}</td></tr>`);
    if (!aberto(e, ka)) return;
    [...new Set(ds.map(outro))].forEach((o) => {
      const dc = ds.filter((d) => outro(d) === o), kc = `c:${a.cod}>${o}`, sc = soma(dc);
      out.push(`<tr class="inv2-y tra2-c"><td>${seta(e, kc, `${pd ? 'de' : 'para'} ${curto(o)}`)}<span class="inv2-a-n"><b>${pd ? 'De' : 'Para'} ${esc(o)} · ${esc(curto(o))}</b><small>${nf(dc.length)} ${dc.length === 1 ? 'documento' : 'documentos'}</small></span></td><td class="inv2-cont">${cont(dc)}</td><td></td><td class="is-num">${sc.l.length ? sc.q : '<span class="is-nada">—</span>'}</td><td class="is-num">${sc.l.length ? sc.v : '<span class="is-nada">—</span>'}</td></tr>`);
      if (!aberto(e, kc)) return;
      dc.forEach((d) => {
        const kd = `d:${d.id}`, x = doc(d);
        out.push(`<tr class="inv2-d${d.anulado ? ' is-sem-efeito' : ''}${e.ativo === d.id ? ' is-ativo' : ''}" data-dv2-vjan="${esc(d.id)}|detalhes" tabindex="0" aria-label="${esc(`${d.numero} · ${d.estado}`)}"><td>${seta(e, kd, `as linhas de ${d.numero}`)}<span class="inv2-a-n"><b class="is-mono">${esc(String(d.numero))}</b><small>${dia(String(d.data))}${d.notas ? ` · ${esc(String(d.notas))}` : ''}</small></span></td><td>${estadoB(d)}</td><td class="is-num">${nf(x.linhas.length)}</td><td class="is-num">${porUnidade(x.linhas)}</td><td class="is-num">${euros(d.valor as number)}</td></tr>`);
        if (!aberto(e, kd)) return;
        x.linhas.forEach((l) => { const ar = artigo(l.ref);
          out.push(`<tr class="inv2-l"><td><span class="inv2-a-n"><b class="is-mono">${esc(l.ref)}</b><small>${esc(ar?.desc ?? '')}</small></span></td><td class="is-num"><small>${euros(custoDe(l.ref))} / ${esc(ar?.un ?? 'un.')}</small></td><td></td><td class="is-num">${nf(l.qtd)} ${esc(ar?.un ?? '')}</td><td class="is-num">${euros(l.qtd * custoDe(l.ref))}</td></tr>`); });
      });
    });
  });
  const tl = soma(ls);
  return `${alt}<table class="lf2-tab inv2-arv" data-paginada aria-label="Transferências por armazém de ${pd ? 'destino' : 'origem'}"><colgroup><col style="width:40%"><col style="width:20%"><col style="width:9%"><col style="width:14%"><col style="width:17%"></colgroup>
    <thead><tr><th scope="col">Armazém de ${pd ? 'destino' : 'origem'} · ${pd ? 'de onde' : 'para onde'} · documento</th><th scope="col">Estados</th><th scope="col" class="is-num">Artigos</th><th scope="col" class="is-num">Quantidade</th><th scope="col" class="is-num">Valor</th></tr></thead>
    <tbody>${out.join('')}</tbody>
    <tfoot><tr class="rc-total"><td><b>Lançadas · ${nf(tl.l.length)} de ${nf(ls.length)}</b></td><td></td><td class="is-num">${nf(new Set(linhasDe(tl.l).map((l) => l.ref)).size)}</td><td class="is-num">${tl.q}</td><td class="is-num"><b>${tl.v}</b></td></tr></tfoot></table>`;
}

/* ---------- Fluxos: os percursos reais entre armazéns ---------- */
type Met = 'qtd' | 'valor' | 'docs';
const MET: [Met, string][] = [['qtd', 'Quantidade'], ['valor', 'Valor'], ['docs', 'Documentos']];
const met = (e: EstDoc) => (e.extra.met ?? 'qtd') as Met;
const incl = (e: EstDoc) => (e.extra.incl ??= new Set<string>()) as Set<string>;
interface Rota { k: string; o: string; d: string; est: 'lanc' | 'rasc' | 'anul'; docs: Doc[] }
const estDe = (d: Doc): Rota['est'] => d.anulado ? 'anul' : d.lancado ? 'lanc' : 'rasc';
const NOME_EST: Record<Rota['est'], string> = { lanc: 'lançadas', rasc: 'rascunhos', anul: 'anuladas' };
function rotas(r: HTMLElement, e: EstDoc): Rota[] {
  const m = new Map<string, Rota>(), inc = incl(e);
  filtradas(r, e).forEach((d) => { const s = estDe(d); if (s !== 'lanc' && !inc.has(s)) return; const k = `${d.origem}>${d.destino}|${s}`; if (!m.has(k)) m.set(k, { k, o: String(d.origem), d: String(d.destino), est: s, docs: [] }); m.get(k)!.docs.push(d); });
  return [...m.values()].sort((a, b) => ['lanc', 'rasc', 'anul'].indexOf(a.est) - ['lanc', 'rasc', 'anul'].indexOf(b.est) || medida(b, 'qtd') - medida(a, 'qtd'));
}
function medida(x: Rota, m: Met): number { return m === 'docs' ? x.docs.length : m === 'valor' ? x.docs.reduce((s, d) => s + (d.valor as number), 0) : x.docs.reduce((s, d) => s + (d.qtd as number), 0); }
const medTxt = (x: Rota, m: Met) => m === 'docs' ? `${nf(x.docs.length)} ${x.docs.length === 1 ? 'documento' : 'documentos'}` : m === 'valor' ? euros(medida(x, 'valor')) : porUnidade(linhasDe(x.docs));
function fluxos(r: HTMLElement, e: EstDoc): string {
  const rs = rotas(r, e), m = met(e), sel = String(e.extra.rota ?? ''), inc = incl(e);
  const ctl = `<div class="inv2-c-cab tra2-fl-ctl">
    <span class="tra2-seg" role="group" aria-label="Espessura das ligações">${MET.map(([k, t]) => `<button type="button" data-dv2-acao="fl-met" data-tra2-v="${k}" aria-pressed="${m === k}">${t}</button>`).join('')}</span>
    <span class="tra2-seg" role="group" aria-label="Incluir"><button type="button" aria-pressed="true" disabled title="As lançadas mostram-se sempre">Lançadas</button>${(['rasc', 'anul'] as const).map((k) => `<button type="button" data-dv2-acao="fl-incl" data-tra2-v="${k}" aria-pressed="${inc.has(k)}" class="is-${k}">${k === 'rasc' ? 'Rascunhos' : 'Anuladas'}</button>`).join('')}</span></div>`;
  if (!rs.length) return ctl + vazio('Nenhuma transferência lançada com estes filtros.', 'Inclui os rascunhos ou as anuladas, ou tira um filtro.');
  const os = [...new Set(rs.map((x) => x.o))].sort((a, b) => +a - +b), ds = [...new Set(rs.map((x) => x.d))].sort((a, b) => +a - +b);
  const H = Math.max(os.length, ds.length) * 70 + 30, W = 760, nw = 170, nh = 46;
  const yO = (c: string) => 15 + (H - 30) / os.length * (os.indexOf(c) + .5), yD = (c: string) => 15 + (H - 30) / ds.length * (ds.indexOf(c) + .5);
  const max = Math.max(...rs.map((x) => medida(x, m)), 1);
  /* várias ligações no mesmo percurso (lançadas e rascunhos) afastam-se um pouco para não se taparem */
  const desvio = new Map<string, number>();
  const caminhos = rs.map((x) => {
    const kk = `${x.o}>${x.d}`, i = desvio.get(kk) ?? 0; desvio.set(kk, i + 1);
    const w = 3 + 17 * medida(x, m) / max, y1 = yO(x.o) + i * 8, y2 = yD(x.d) + i * 8, x1 = nw + 10, x2 = W - nw - 10, cx = (x1 + x2) / 2;
    const lbl = `${x.o} ${curto(x.o)} para ${x.d} ${curto(x.d)}, ${NOME_EST[x.est]}: ${medTxt(x, m).replace(/<br>/g, ', ')}`;
    return `<path d="M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}" class="tra2-lig is-${x.est}${sel === x.k ? ' is-sel' : ''}${sel && sel !== x.k ? ' is-fundo' : ''}" style="stroke-width:${w.toFixed(1)}px" data-dv2-acao="rota" data-tra2-r="${esc(x.k)}" tabindex="0" role="button" aria-pressed="${sel === x.k}" aria-label="${esc(lbl)}"><title>${esc(lbl)}</title></path>`;
  }).join('');
  const no = (c: string, x: number, y: number, lado: 'o' | 'd') => { const n = rs.filter((z) => (lado === 'o' ? z.o : z.d) === c && z.est === 'lanc').reduce((s, z) => s + z.docs.length, 0);
    return `<g class="tra2-no" transform="translate(${x},${y - nh / 2})"><rect width="${nw}" height="${nh}" rx="6"/><text x="12" y="20"><tspan class="is-mono">${esc(c)}</tspan> ${esc(curto(c))}</text><text x="12" y="37" class="tra2-no-s">${nf(n)} ${n === 1 ? 'lançada' : 'lançadas'} · ${lado === 'o' ? 'envia' : 'recebe'}</text></g>`; };
  const svg = `<figure class="tra2-fig"><svg class="tra2-svg" viewBox="0 0 ${W} ${H}" role="group" aria-label="Fluxos entre armazéns: origens à esquerda, destinos à direita">
    <text x="0" y="10" class="tra2-col">Origem</text><text x="${W}" y="10" class="tra2-col" text-anchor="end">Destino</text>
    ${caminhos}${os.map((c) => no(c, 0, yO(c), 'o')).join('')}${ds.map((c) => no(c, W - nw, yD(c), 'd')).join('')}</svg>
    <figcaption class="tra2-leg"><span class="is-lanc">Lançada</span>${inc.has('rasc') ? '<span class="is-rasc">Rascunho (não mexeu no stock)</span>' : ''}${inc.has('anul') ? '<span class="is-anul">Anulada (sem efeito)</span>' : ''}<span>Espessura: ${MET.find(([k]) => k === m)![1].toLowerCase()}</span></figcaption></figure>`;
  const x = rs.find((z) => z.k === sel);
  const detalhe = x ? (() => {
    const ls = linhasDe(x.docs), datas = x.docs.map((d) => String(d.data)).sort(), porArt = new Map<string, number>(); ls.forEach((l) => porArt.set(l.ref, (porArt.get(l.ref) ?? 0) + l.qtd));
    return `<section class="tra2-rota-det" aria-label="O percurso escolhido"><header><h3>${rota(x.o, x.d)}<small>${NOME_EST[x.est]}</small></h3><button type="button" class="ak-btn ak-btn--linha" data-dv2-acao="rota" data-tra2-r="" aria-label="Fechar o percurso">${L(x_)}</button></header>
      <dl class="lf2-dl inv2-lanc"><div><dt>Documentos</dt><dd>${nf(x.docs.length)}</dd></div><div><dt>Quantidade</dt><dd>${porUnidade(ls)}</dd></div><div><dt>Valor</dt><dd><b>${euros(medida(x, 'valor'))}</b></dd></div><div><dt>Período</dt><dd>${datas.length > 1 ? `${dia(datas[0])} a ${dia(datas[datas.length - 1])}` : dia(datas[0])}</dd></div></dl>
      <div class="tra2-rota-g"><div><h4>Documentos</h4><ul class="tra2-docs">${x.docs.map((d) => `<li><button type="button" class="tra2-doc" data-dv2-vjan="${esc(d.id)}|detalhes"><b class="is-mono">${esc(String(d.numero))}</b><span>${dia(String(d.data))} · ${nf(d.qtd as number)} · ${euros(d.valor as number)}</span></button></li>`).join('')}</ul></div>
      <div><h4>Artigos (${nf(porArt.size)})</h4><table class="lf2-mini"><tbody>${[...porArt].sort((a, b) => b[1] - a[1]).map(([ref, q]) => `<tr><td class="is-mono">${esc(ref)}</td><td>${esc(artigo(ref)?.desc ?? '')}</td><td class="is-num">${nf(q)} ${esc(artigo(ref)?.un ?? '')}</td><td class="is-num">${euros(q * custoDe(ref))}</td></tr>`).join('')}</tbody></table></div></div></section>`;
  })() : '';
  const lista = `<table class="lf2-tab tra2-lista" data-paginada aria-label="Percursos (a mesma informação do gráfico)"><thead><tr><th scope="col">Percurso</th><th scope="col">Estado</th><th scope="col" class="is-num">Documentos</th><th scope="col" class="is-num">Quantidade</th><th scope="col" class="is-num">Valor</th><th scope="col">Período</th></tr></thead><tbody>${rs.map((z) => { const dt = z.docs.map((d) => String(d.data)).sort();
    return `<tr class="${sel === z.k ? 'is-ativo' : ''}${z.est !== 'lanc' ? ' is-sem-efeito' : ''}"><td><button type="button" class="tra2-doc" data-dv2-acao="rota" data-tra2-r="${esc(z.k)}" aria-pressed="${sel === z.k}">${rota(z.o, z.d)}</button></td><td>${z.est === 'lanc' ? 'Lançadas' : z.est === 'rasc' ? 'Rascunhos' : 'Anuladas'}</td><td class="is-num">${nf(z.docs.length)}</td><td class="is-num">${porUnidade(linhasDe(z.docs))}</td><td class="is-num">${euros(medida(z, 'valor'))}</td><td>${dt.length > 1 ? `${dia(dt[0])} a ${dia(dt[dt.length - 1])}` : dia(dt[0])}</td></tr>`; }).join('')}</tbody></table>`;
  return ctl + svg + detalhe + lista;
}

/* ---------- Transferir (25 nov., ela: «seleciono a origem e o destino e depois faço drop de um artigo para o outro»):
   escolhe-se a origem e o destino; os artigos com stock na origem arrastam-se para o destino (ou «Levar», no teclado e
   no telemóvel); a quantidade acerta-se na linha; Criar rascunho ou Transferir agora (cria e lança). Arrastar de volta
   para a origem tira o artigo. ---------- */
const mvO = (e: EstDoc) => String(e.extra.mvO ?? '60'), mvD = (e: EstDoc) => String(e.extra.mvD ?? '1');
const cesto = (e: EstDoc) => (e.extra.mvC ??= {}) as Record<string, number>;
const haEm = (ref: string, cod: string) => stockEm(ref, armazemDe(cod));
const unDe = (ref: string) => artigo(ref)?.un ?? 'un.';
function transferir(_r: HTMLElement, e: EstDoc): string {
  const o = mvO(e), d = mvD(e), c = cesto(e), refs = Object.keys(c), mesmo = o === d, q = String(e.extra.mvQ ?? '');
  const opArm = (sel: string) => ARMAZENS.map((a) => `<option value="${a.cod}"${a.cod === sel ? ' selected' : ''}>${esc(a.cod)} · ${esc(curto(a.cod))}</option>`).join('');
  const naOrigem = ARTIGOS.map((a) => ({ a, ha: haEm(a.ref, o) })).filter((x) => x.ha > 0);
  const filtra = (ref: string, desc: string) => !q || `${ref} ${desc}`.toLowerCase().includes(q.toLowerCase());
  const lis = naOrigem.map(({ a, ha }) => { const lev = c[a.ref] ?? 0, fica = ha - lev;
    return `<li class="tra2-mv-a${lev ? ' is-levado' : ''}" draggable="true" data-tra2-arr="${esc(a.ref)}" data-tra2-de="origem"${filtra(a.ref, a.desc) ? '' : ' hidden'} data-tra2-txt="${esc(`${a.ref} ${a.desc}`.toLowerCase())}">
      <span class="tra2-mv-grip" aria-hidden="true">${L(grip)}</span>
      <span class="tra2-mv-n"><b class="is-mono">${esc(a.ref)}</b><small>${esc(a.desc)}</small></span>
      <span class="tra2-mv-q"><b>${nf(fica)} ${esc(a.un)}</b><small>${lev ? `${nf(lev)} a levar` : `no ${esc(d)}: ${nf(haEm(a.ref, d))}`}</small></span>
      <button type="button" class="ak-btn ak-btn--linha" data-dv2-acao="mv-levar" data-tra2-ref="${esc(a.ref)}" ${fica <= 0 || mesmo ? 'disabled' : ''} aria-label="Levar 1 ${esc(a.un)} de ${esc(a.ref)} para o ${esc(d)}" title="Levar para o ${esc(d)} (ou arrastar)">${L(arrowRight)}</button></li>`; }).join('');
  const linhas_ = refs.map((ref) => { const n = c[ref], ha = haEm(ref, o), falta = n > ha;
    return `<li class="tra2-mv-l${falta ? ' is-falta' : ''}${e.extra.mvNovo === ref ? ' is-novo' : ''}" draggable="true" data-tra2-arr="${esc(ref)}" data-tra2-de="destino">
      <span class="tra2-mv-grip" aria-hidden="true">${L(grip)}</span>
      <span class="tra2-mv-n"><b class="is-mono">${esc(ref)}</b><small>${esc(artigo(ref)?.desc ?? '')}</small></span>
      <label class="tra2-mv-qtd"><span class="sr">Quantidade de ${esc(ref)}</span><input type="number" inputmode="numeric" min="1" max="${ha}" step="1" value="${n}" data-tra2-qtd="${esc(ref)}"><i>${esc(unDe(ref))}</i></label>
      <span class="tra2-mv-q"><small>${falta ? `<b class="is-erro">Só há ${nf(ha)} no ${esc(o)}</b>` : `fica ${nf(ha - n)} no ${esc(o)}`}</small><small>${esc(d)} passa a ${nf(haEm(ref, d) + n)}</small></span>
      <button type="button" class="ak-btn ak-btn--linha" data-dv2-acao="mv-tirar" data-tra2-ref="${esc(ref)}" aria-label="Tirar ${esc(ref)}" title="Tirar (ou arrastar de volta)">${L(trash)}</button></li>`; }).join('');
  const ls = refs.map((ref) => ({ ref, qtd: c[ref] })), falta = ls.some((l) => l.qtd > haEm(l.ref, o)), pode = podeInv(e.perfil, 'criar') && podeInv(e.perfil, 'lancar');
  const porque = !pode ? 'O teu perfil só consulta os documentos de stock.' : mesmo ? 'A origem e o destino são o mesmo armazém.' : !refs.length ? 'Arrasta pelo menos um artigo para o destino.' : '';
  const porqueLancar = porque || (falta ? 'Há linhas com mais do que o stock da origem: acerta a quantidade, ou cria só o rascunho.' : '');
  return `<div class="tra2-mv" data-tra2-mv>
    <div class="tra2-mv-cab">
      <label class="ak-campo"><span>Armazém de origem</span><select data-tra2-mvo>${opArm(o)}</select></label>
      <button type="button" class="ak-btn ak-btn--linha tra2-mv-trocar" data-dv2-acao="mv-trocar" title="Trocar a origem e o destino">${L(arrowRightLeft)}<span>Trocar</span></button>
      <label class="ak-campo"><span>Armazém de destino</span><select data-tra2-mvd>${opArm(d)}</select></label>
      ${mesmo ? `<p class="tra2-mv-aviso" role="alert">A origem e o destino são o mesmo armazém: escolhe outro.</p>` : ''}
    </div>
    <div class="tra2-mv-g">
      <section class="tra2-mv-col" data-tra2-zona="origem" aria-label="Artigos com stock no ${esc(armazemDe(o))}">
        <header><h3><span><b class="is-mono">${esc(o)}</b> ${esc(curto(o))}</span><small>${nf(naOrigem.length)} ${naOrigem.length === 1 ? 'artigo' : 'artigos'} com stock</small></h3>
          <label class="tra2-mv-proc">${L(search)}<input type="search" data-tra2-mvq value="${esc(q)}" placeholder="Procurar artigo" aria-label="Procurar artigo na origem" autocomplete="off"></label></header>
        ${naOrigem.length ? `<ul class="tra2-mv-lista" role="list">${lis}</ul>` : `<p class="tra2-mv-vazio">${L(packageOpen)}<span>O ${esc(armazemDe(o))} não tem stock de nenhum artigo.</span></p>`}
      </section>
      <section class="tra2-mv-col is-destino${refs.length ? '' : ' is-vazio'}" data-tra2-zona="destino" aria-label="A levar para o ${esc(armazemDe(d))}">
        <header><h3><span><b class="is-mono">${esc(d)}</b> ${esc(curto(d))}</span><small>${refs.length ? `${nf(refs.length)} ${refs.length === 1 ? 'artigo' : 'artigos'} a levar` : 'a levar'}</small></h3></header>
        ${refs.length ? `<ul class="tra2-mv-lista" role="list">${linhas_}</ul>` : `<p class="tra2-mv-largar">${L(move)}<span>Arrasta os artigos da origem para aqui</span></p>`}
        <footer class="tra2-mv-pe">
          ${refs.length ? `<p class="tra2-mv-tot"><span>${nf(refs.length)} ${refs.length === 1 ? 'artigo' : 'artigos'}</span><b>${porUnidade(ls)}</b><b>${euros(valorDe(ls))}</b></p>` : ''}
          <label class="ak-campo"><span>Observações</span><input type="text" data-tra2-mvn value="${esc(String(e.extra.mvN ?? ''))}" maxlength="200" placeholder="Opcional, ex.: reposição do Porto"></label>
          <div class="tra2-mv-acoes">
            <button type="button" class="ak-btn ak-btn--linha" data-dv2-acao="mv-limpar" ${refs.length ? '' : 'disabled'}>${L(eraser)}<span>Limpar</span></button>
            <button type="button" class="ak-btn ak-btn--linha" data-dv2-acao="mv-criar" aria-disabled="${!!porque}" title="${esc(porque || 'Fica em rascunho: ainda não mexe no stock')}">${L(save)}<span>Criar rascunho</span></button>
            <button type="button" class="ak-btn ak-btn--acao" data-dv2-acao="mv-lancar" aria-disabled="${!!porqueLancar}" title="${esc(porqueLancar || 'Cria a transferência e lança-a no stock')}">${L(arrowDownToLine)}<span>Transferir agora</span></button>
          </div>
        </footer>
      </section>
    </div>
  </div>`;
}
/** Levar um artigo (largado ou «Levar»): mais 1, até ao que há na origem. */
function levar(r: HTMLElement, e: EstDoc, ref: string): void {
  if (mvO(e) === mvD(e)) { toast(r, 'A origem e o destino são o mesmo armazém.'); return; }
  const c = cesto(e), ha = haEm(ref, mvO(e)); if ((c[ref] ?? 0) >= ha) { toast(r, `Já levas todo o stock de ${ref} no ${mvO(e)}.`); return; }
  c[ref] = (c[ref] ?? 0) + 1; e.extra.mvNovo = ref; tudo(r, e);
  r.querySelector<HTMLInputElement>(`[data-tra2-qtd="${CSS.escape(ref)}"]`)?.focus({ preventScroll: true });
  setTimeout(() => { if (e.extra.mvNovo === ref) e.extra.mvNovo = ''; }, 0);
}
function tirar(r: HTMLElement, e: EstDoc, ref: string): void { delete cesto(e)[ref]; tudo(r, e); }
function fazerTransferencia(r: HTMLElement, e: EstDoc, lancar: boolean): void {
  const b = r.querySelector<HTMLElement>(`[data-dv2-acao="${lancar ? 'mv-lancar' : 'mv-criar'}"]`);
  if (b?.getAttribute('aria-disabled') === 'true') { toast(r, b.title); return; }
  const c = cesto(e), o = mvO(e), d = mvD(e);
  try {
    const x = criarTr(e.perfil, { data: HOJE, origem: o, destino: d, notas: String(e.extra.mvN ?? ''), linhas: Object.entries(c).map(([ref, qtd]) => ({ ref, qtd })) });
    if (lancar) lancarTr(e.perfil, x.ref);
    const n = Object.values(c).reduce((s, q) => s + q, 0);
    e.extra.mvC = {}; e.extra.mvN = ''; e.ativo = x.ref;
    e.aviso = lancar ? `${x.ref} lançada: ${nf(n)} unidades passaram do ${o} para o ${d}.` : `${x.ref} criada em rascunho (${o} → ${d}): ainda não mexe no stock.`;
    tudo(r, e, true); toast(r, e.aviso);
  } catch (err) { toast(r, err instanceof Recusa ? err.message : 'Não foi possível criar a transferência.'); }
}

/* ---------- o detalhe: a rastreabilidade; em Linhas, os movimentos de cada artigo ---------- */
function rastreio(d: Doc): string {
  const x = doc(d), cri = x.historico[0], lan = x.historico.find((h) => h.acao === 'Lançou no stock'), anu = x.historico.find((h) => h.acao === 'Anulou');
  const n = x.linhas.filter((l) => l.qtd).length, o = armazemDe(x.origem), de_ = armazemDe(x.destino);
  const movs = d.anulado && x.lancado ? `${nf(n * 2)} ao lançar (${nf(n)} ${n === 1 ? 'saída' : 'saídas'} do ${esc(o)}, ${nf(n)} ${n === 1 ? 'entrada' : 'entradas'} no ${esc(de_)}) e outros ${nf(n * 2)} ao anular, ao contrário.`
    : d.lancado ? `${nf(n * 2)}: ${nf(n)} ${n === 1 ? 'saída' : 'saídas'} do ${esc(o)} e ${nf(n)} ${n === 1 ? 'entrada' : 'entradas'} no ${esc(de_)}, ligadas ao ${esc(x.ref)}.` : 'Nenhum: não mexeu no stock.';
  const li = (t: string, h: typeof cri | undefined, extra = '') => h ? `<li><span>${t}</span><b>${esc(h.quem)}</b><time>${esc(h.quando)}</time>${extra}</li>` : '';
  return `<section class="inv2-rastro" aria-label="Rastreabilidade"><h3>${L(history)}Rastreabilidade</h3><ol>
    ${li('Criada', cri)}${li('Lançada', lan)}${li('Anulada', anu, x.anulado ? `<small>${esc(x.anulado.motivo)}</small>` : '')}
    <li><span>Movimentos</span><b>${movs}</b>${d.lancado || (d.anulado && x.lancado) ? `<button type="button" class="ak-btn ak-btn--linha" data-inv2-tab="linhas">${L(arrowLeftRight)}<span>Por artigo, em Linhas</span></button>` : ''}</li>
    <li><span>Valor</span><b>Ao custo de hoje de cada artigo; não fica guardado no lançamento.</b></li></ol></section>`;
}
function painel(e: EstDoc, d: Doc | undefined, tab: string): string {
  if (!d) return '';
  if (tab === 'detalhes') return milhares(painelV1(e, d, tab)).replace('<details class="dv2-hist">', `${rastreio(d)}<details class="dv2-hist">`);
  if (tab === 'linhas') {
    const x = doc(d), mov = d.lancado || (d.anulado && !!x.lancado), q = x.linhas.reduce((s, l) => s + l.qtd, 0);
    return `<table class="lf2-mini dv2-linhas-t"><thead><tr><th>Artigo</th><th>Descrição</th><th class="is-num">Quantidade</th><th>Un.</th><th class="is-num">Custo unitário</th><th class="is-num">Valor</th>${mov ? '<th><span class="sr">Movimentos</span></th>' : ''}</tr></thead><tbody>${x.linhas.map((l) => { const a = artigo(l.ref);
      return `<tr><td class="is-mono">${esc(l.ref)}</td><td>${esc(a?.desc ?? '')}</td><td class="is-num">${nf(l.qtd)}</td><td>${esc(a?.un ?? '')}</td><td class="is-num">${euros(custoDe(l.ref))}</td><td class="is-num"><b>${euros(l.qtd * custoDe(l.ref))}</b></td>${mov ? `<td><button type="button" class="ak-btn ak-btn--linha inv2-mov" data-inv2-mov="${esc(l.ref)}" title="Os movimentos de ${esc(l.ref)} no 77 · Movimentos de artigos">${L(arrowLeftRight)}<span>Movimentos</span></button></td>` : ''}</tr>`; }).join('')}</tbody>
      <tfoot><tr class="is-total"><td colspan="2">Total · ${nf(x.linhas.length)} ${x.linhas.length === 1 ? 'linha' : 'linhas'}, ${nf(new Set(x.linhas.map((l) => l.ref)).size)} artigos distintos</td><td class="is-num">${nf(q)}</td><td></td><td></td><td class="is-num"><b>${euros(valorDe(x.linhas))}</b></td>${mov ? '<td></td>' : ''}</tr></tfoot></table>`;
  }
  return milhares(painelV1(e, d, tab));
}

/* ---------- lançar: o resumo antes de confirmar ---------- */
function resumoLancar(r: HTMLElement, e: EstDoc): void {
  const sub = r.querySelector<HTMLElement>('[data-dv2-dlg] .lf2-dlg-sub'); if (!sub || !r.querySelector('[data-dv2-dlg] [data-dv2-acao="lancar-sim"]') || r.querySelector('[data-dv2-dlg] .inv2-lanc')) return;
  const d = ativoDe(r, e); if (!d) return; const x = doc(d), n = x.linhas.filter((l) => l.qtd).length;
  const dd = (t: string, v: string) => `<div><dt>${t}</dt><dd>${v}</dd></div>`;
  sub.insertAdjacentHTML('afterend', `<dl class="lf2-dl inv2-lanc">${dd('Artigos', nf(x.linhas.length))}${dd('Quantidade', porUnidade(x.linhas))}${dd('Valor', `<b>${euros(valorDe(x.linhas))}</b>`)}<div class="inv2-lanc-ef"><dt>Movimentos</dt><dd>${nf(n)} ${n === 1 ? 'saída' : 'saídas'} do ${esc(armazemDe(x.origem))} e ${nf(n)} ${n === 1 ? 'entrada' : 'entradas'} no ${esc(armazemDe(x.destino))}, ligadas ao ${esc(x.ref)}.</dd></div></dl>`);
  r.querySelectorAll<HTMLElement>('[data-dv2-dlg] td.is-num, [data-dv2-dlg] td.is-num b').forEach((c) => { if (!c.children.length && c.textContent) c.textContent = c.textContent.replace(/(\d)(\d{3})(?!\d)/g, '$1 $2'); });
}

/* ---------- registar ---------- */
const CFG2: CfgDoc = registar({
  ...V1, k: K,
  sub: 'Consulte e acompanhe os movimentos de artigos entre armazéns.',
  cols: COLS, linhas, celula, painel,
  resumo: () => '',
  kpis, rapidos, avancados, vistasComPesquisa: true, vistasEmCima: true,
  vistas: [
    { k: 'docs', t: 'Tabela', ic: table, tecla: 'Alt+1', titulo: 'Transferências' },
    { k: 'cartoes', t: 'Cartões', ic: grid, tecla: 'Alt+2', titulo: 'Transferências', tabela: cartoes },
    { k: 'armazem', t: 'Por armazém', ic: warehouse, tecla: 'Alt+3', titulo: 'Por armazém', tabela: arvore },
    { k: 'fluxos', t: 'Fluxos', ic: network, tecla: 'Alt+4', titulo: 'Fluxos entre armazéns', tabela: fluxos },
    { k: 'transferir', t: 'Transferir', ic: move, tecla: 'Alt+5', titulo: 'Transferir artigos', tabela: transferir },
  ],
  chips: (e) => [...(dest(e) ? [['x:dest', `Destino ${dest(e)} · ${curto(dest(e))}`]] : []), ...(art(e) ? [['x:art', `Artigo ${art(e)}`]] : []), ...(resp(e) ? [['x:resp', `Criada por ${resp(e)}`]] : [])] as [string, string][],
  acao(r, e, k, b) {
    if (k === 'tirar' && b.dataset.dv2Tirar === 'x:dest') { e.extra.dest = ''; tudo(r, e, true); return true; }
    if (k === 'tirar' && b.dataset.dv2Tirar === 'x:art') { e.extra.art = ''; tudo(r, e, true); return true; }
    if (k === 'limpar') { e.extra.dest = ''; e.extra.art = ''; }
    const c = acaoComum(r, e, k, b); if (c !== null) return c;
    if (k === 'arv') { const x = b.dataset.inv2K!, s = x.startsWith('d:') ? abertos(e) : fechados(e); if (s.has(x)) s.delete(x); else s.add(x); tudo(r, e); r.querySelector<HTMLElement>(`[data-inv2-k="${CSS.escape(x)}"]`)?.focus(); return true; }
    if (k === 'arm-por') { e.extra.porArm = b.dataset.tra2V; tudo(r, e); r.querySelector<HTMLElement>(`[data-dv2-acao="arm-por"][data-tra2-v="${b.dataset.tra2V}"]`)?.focus(); return true; }
    if (k === 'fl-met') { e.extra.met = b.dataset.tra2V; tudo(r, e); r.querySelector<HTMLElement>(`[data-dv2-acao="fl-met"][data-tra2-v="${b.dataset.tra2V}"]`)?.focus(); return true; }
    if (k === 'fl-incl') { const s = incl(e), v = b.dataset.tra2V!; if (s.has(v)) s.delete(v); else s.add(v); if (String(e.extra.rota ?? '').endsWith(`|${v}`)) e.extra.rota = ''; tudo(r, e); r.querySelector<HTMLElement>(`[data-dv2-acao="fl-incl"][data-tra2-v="${v}"]`)?.focus(); return true; }
    if (k === 'rota') { const v = b.dataset.tra2R ?? ''; e.extra.rota = e.extra.rota === v ? '' : v; const foiLista = b.tagName === 'BUTTON'; tudo(r, e); (foiLista && v ? r.querySelector<HTMLElement>(`.tra2-lista [data-tra2-r="${CSS.escape(v)}"]`) : r.querySelector<HTMLElement>(`path[data-tra2-r="${CSS.escape(v)}"]`))?.focus(); return true; }
    if (k === 'c-editar' || k === 'c-lancar') {
      const id = b.dataset.inv2Id!; escolher(r, e, id, false); const d = ativoDe(r, e); if (!d) return true;
      if (k === 'c-editar') abrirFicha(r, e, 'editar', d); else { dlgLancar(r, e); resumoLancar(r, e); }
      return true;
    }
    if (k === 'mv-levar') { levar(r, e, b.dataset.tra2Ref!); return true; }
    if (k === 'mv-tirar') { const ref = b.dataset.tra2Ref!; tirar(r, e, ref); r.querySelector<HTMLElement>(`[data-dv2-acao="mv-levar"][data-tra2-ref="${CSS.escape(ref)}"]`)?.focus(); return true; }
    if (k === 'mv-trocar') { [e.extra.mvO, e.extra.mvD] = [mvD(e), mvO(e)]; e.extra.mvC = {}; tudo(r, e); r.querySelector<HTMLElement>('[data-dv2-acao="mv-trocar"]')?.focus(); return true; }
    if (k === 'mv-limpar') { e.extra.mvC = {}; tudo(r, e); return true; }
    if (k === 'mv-criar' || k === 'mv-lancar') { fazerTransferencia(r, e, k === 'mv-lancar'); return true; }
    const feito = V1.acao(r, e, k, b);
    if (k === 'lancar') resumoLancar(r, e);
    return feito;
  },
  cenario(r, e, cen) {
    if (!e.extra.vista && !e.editor && window.matchMedia('(max-width: 760px)').matches) e.extra.vista = 'cartoes';
    const ls = linhasV1(e), top = (() => { const m = new Map<string, number>(); ls.filter((d) => d.lancado).forEach((d) => { const k = `${d.origem}>${d.destino}`; m.set(k, (m.get(k) ?? 0) + (d.qtd as number)); }); return [...m].sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''; })();
    if (cen === 'kpi-rascunhos') e.f.estado = 'rasc';
    if (cen === 'filtro-destino') e.extra.dest = '1';
    if (cen === 'filtro-artigo') e.extra.art = '6205-2Z';
    if (cen === 'armazem-destino') { e.extra.vista = 'armazem'; e.extra.porArm = 'destino'; }
    if (cen === 'armazem-linhas') { e.extra.vista = 'armazem'; const d = ls.find((x) => x.lancado); if (d) { abertos(e).add(`d:${d.id}`); e.ativo = d.id; } }
    if (cen === 'fluxos-rota') { e.extra.vista = 'fluxos'; e.extra.rota = `${top}|lanc`; }
    if (cen === 'transferir') e.extra.vista = 'transferir';
    if (cen === 'transferir-cesto') { e.extra.vista = 'transferir'; e.extra.mvC = Object.fromEntries(ARTIGOS.map((a) => [a.ref, haEm(a.ref, '60')]).filter(([, h]) => (h as number) > 0).slice(0, 2).map(([ref, h]) => [ref, Math.min(10, h as number)])); }
    if (cen === 'fluxos-todos') { e.extra.vista = 'fluxos'; incl(e).add('rasc'); incl(e).add('anul'); e.extra.met = 'docs'; }
    V1.cenario(r, e, cen);
    /* a v1 escolhia o primeiro rascunho, mesmo sem stock na origem (e então o Lançar só avisava): aqui, um que se lança */
    const pronto = ls.find((d) => !d.lancado && !d.anulado && !porqueLancar_(e, d));
    if (pronto && ['lancar', 'a-lancar', 'lancar-falhou', 'lancado', 'editar'].includes(cen)) {
      e.ativo = pronto.id;
      if (cen === 'lancado') { e.extra.lancadoSim = pronto.id; requestAnimationFrame(() => requestAnimationFrame(() => { e.aviso = `${pronto.ref} lançada: ${nf(pronto.qtd as number)} unidades passaram do ${pronto.origem} para o ${pronto.destino}.`; tudo(r, e); })); }
    }
    if (['lancar', 'a-lancar', 'lancar-falhou'].includes(cen)) requestAnimationFrame(() => requestAnimationFrame(() => resumoLancar(r, e)));
  },
  dica: 'As datas de emissão afinam o Período. O Artigo procura em todas as linhas da transferência.',
});

/* ---------- o comportamento próprio (o Período, Criado por, Ordenar e Por página vêm do 70 v2) ---------- */
const raiz = (t: EventTarget | null) => (t as HTMLElement | null)?.closest?.<HTMLElement>(`[data-dv2="${K}"]`) ?? null;
export function iniciar(): void {
  document.addEventListener('change', (ev) => {
    const t = ev.target as HTMLInputElement, r = raiz(t); if (!r) return; const e = de(r);
    if (t.matches('[data-tra2-dest]')) { e.extra.dest = t.value; e.extra.pagC = 0; tudo(r, e, true); return; }
    if (t.matches('[data-tra2-art]')) { e.extra.art = t.value.trim(); e.extra.pagC = 0; tudo(r, e, true); return; }
    if (t.matches('[data-tra2-mvo], [data-tra2-mvd]')) { e.extra[t.matches('[data-tra2-mvo]') ? 'mvO' : 'mvD'] = t.value; e.extra.mvC = {}; tudo(r, e); r.querySelector<HTMLElement>(t.matches('[data-tra2-mvo]') ? '[data-tra2-mvo]' : '[data-tra2-mvd]')?.focus(); return; }
    if (t.matches('[data-tra2-qtd]')) { const ref = t.dataset.tra2Qtd!, n = Math.floor(Number(t.value)); if (n > 0) cesto(e)[ref] = n; else delete cesto(e)[ref]; tudo(r, e); r.querySelector<HTMLElement>(`[data-tra2-qtd="${CSS.escape(ref)}"]`)?.focus(); }
  });
  document.addEventListener('input', (ev) => {
    const t = ev.target as HTMLInputElement, r = raiz(t); if (!r) return;
    if (t.matches('[data-tra2-mvn]')) { de(r).extra.mvN = t.value; return; }
    if (t.matches('[data-tra2-mvq]')) { const q = t.value.trim().toLowerCase(); de(r).extra.mvQ = t.value; r.querySelectorAll<HTMLElement>('[data-tra2-zona="origem"] [data-tra2-txt]').forEach((li) => { li.hidden = !!q && !li.dataset.tra2Txt!.includes(q); }); }
  });
  /* arrastar: da origem para o destino leva 1; do destino para a origem tira */
  let arr: { ref: string; de: string } | null = null;
  const zonaDe = (t: EventTarget | null) => (t as HTMLElement | null)?.closest?.<HTMLElement>('[data-tra2-zona]') ?? null;
  const limpar = () => document.querySelectorAll('.tra2-mv.is-arrastar, .tra2-mv-col.is-alvo, .tra2-mv-a.is-agarrado, .tra2-mv-l.is-agarrado').forEach((x) => x.classList.remove('is-arrastar', 'is-alvo', 'is-agarrado'));
  document.addEventListener('dragstart', (ev) => {
    const li = (ev.target as HTMLElement).closest?.<HTMLElement>('[data-tra2-arr]'); if (!li || !raiz(li)) return;
    arr = { ref: li.dataset.tra2Arr!, de: li.dataset.tra2De! };
    ev.dataTransfer?.setData('text/plain', arr.ref); if (ev.dataTransfer) ev.dataTransfer.effectAllowed = 'move';
    li.classList.add('is-agarrado'); li.closest('.tra2-mv')?.classList.add('is-arrastar');
  });
  document.addEventListener('dragover', (ev) => {
    const z = zonaDe(ev.target); if (!arr || !z || z.dataset.tra2Zona === arr.de) return;
    ev.preventDefault(); if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'move';
    if (!z.classList.contains('is-alvo')) { document.querySelectorAll('.tra2-mv-col.is-alvo').forEach((x) => x.classList.remove('is-alvo')); z.classList.add('is-alvo'); }
  });
  document.addEventListener('dragleave', (ev) => { const z = zonaDe(ev.target); if (z && !z.contains(ev.relatedTarget as Node | null)) z.classList.remove('is-alvo'); });
  document.addEventListener('drop', (ev) => {
    const z = zonaDe(ev.target), r = raiz(z); if (!arr || !z || !r || z.dataset.tra2Zona === arr.de) return;
    ev.preventDefault(); const x = arr; arr = null; limpar();
    if (z.dataset.tra2Zona === 'destino') levar(r, de(r), x.ref); else tirar(r, de(r), x.ref);
  });
  document.addEventListener('dragend', () => { arr = null; limpar(); });
  document.addEventListener('keydown', (ev) => {
    const t = ev.target as Element; if (!raiz(t) || !(ev.key === 'Enter' || ev.key === ' ') || !t.matches('path[data-tra2-r]')) return;
    ev.preventDefault(); t.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

/* ---------- os ecrãs ---------- */
const NOTA = 'Transferências entre armazéns v2 (19 nov., do briefing «Redesign do módulo Transferências entre Armazéns»), no mesmo motor da v1 — a ficha, Lançar (Ctrl+F2) só com stock na origem, Anular (F8), a pesquisa F1 F2 F10 F12, as janelas e os anexos ficam iguais. Junta: indicadores (lançadas, rascunhos e anuladas filtram; unidades, movimentos e valor só das lançadas); Destino e Período nos filtros rápidos, Artigo e Criado por em Mais filtros; as vistas Tabela | Cartões | Por armazém (pela origem ou pelo destino) | Fluxos (espessura pela quantidade, valor ou documentos; rascunhos e anuladas só se pedidos; o percurso escolhido com documentos, artigos e período; e a lista dos percursos); no detalhe a rastreabilidade e os movimentos de cada artigo no 77; ao lançar, o resumo e os movimentos que vai gerar.';
const NOVOS: [string, string, string][] = [
  ['vista-cartoes', '71.40 · Vista cartões', 'Cada transferência num cartão: número, data, estado, o percurso, artigos, quantidade e valor; Ver, Editar e Lançar quando se pode.'],
  ['vista-armazem', '71.41 · Por armazém de origem', 'Armazém → para onde → documentos: o que cada armazém enviou, com os totais só das lançadas.'],
  ['armazem-destino', '71.42 · Por armazém de destino', 'O mesmo agrupado pelo destino: o que cada armazém recebeu e de onde.'],
  ['armazem-linhas', '71.43 · Por armazém com as linhas', 'Um documento aberto até aos artigos: quantidade, custo e valor.'],
  ['vista-fluxos', '71.44 · Fluxos entre armazéns', 'As origens à esquerda, os destinos à direita; a espessura é a quantidade lançada.'],
  ['fluxos-rota', '71.45 · Um percurso escolhido', 'Tocar numa ligação: os documentos, os artigos, a quantidade, o valor e o período desse percurso.'],
  ['fluxos-todos', '71.46 · Fluxos com rascunhos e anuladas', 'Os rascunhos (tracejado) e as anuladas (pontilhado) à parte das lançadas; espessura pelos documentos.'],
  ['kpi-rascunhos', '71.47 · Só os rascunhos', 'Tocar no indicador Rascunhos filtra; diz quantos estão prontos a lançar.'],
  ['filtro-destino', '71.48 · Filtro pelo destino', 'Só as transferências para o Armazém 1 · Porto.'],
  ['filtro-artigo', '71.49 · Filtro pelo artigo', 'Mais filtros ▸ Artigo: as transferências que levam 6205-2Z.'],
  ['transferir', '71.50 · Transferir (arrastar)', 'Escolher a origem e o destino e arrastar os artigos da origem para o destino; a quantidade acerta-se na linha; Criar rascunho ou Transferir agora.'],
  ['transferir-cesto', '71.51 · Transferir com artigos a levar', 'Dois artigos já largados no destino, com o que fica na origem e o que o destino passa a ter.'],
];
export function ecrasTransferenciasV2(): Ecra<IdErp>[] {
  const armazens = ARMAZENS.map((a): [string, string] => [a.cod, `${a.cod} · ${curto(a.cod)}`]);
  const v = (cen: string) => ({ id: 'v2', nota: NOTA, html: paginaDoc(CFG2, cen, armazens) });
  return [
    { id: 'stocks-transf-armazens', nome: '71 · Transferências entre armazéns', fluxo: 'Stocks', objetivo: 'Passar artigos de um armazém para outro e acompanhar os percursos: tabela, cartões, por armazém e fluxos; Lançar no stock (Ctrl+F2) só com stock na origem, e Anular (F8), que devolve à origem.', versoes: [v('normal')] as Ecra<IdErp>['versoes'] },
    ...[...ESTADOS_TRA, ...NOVOS].map(([cen, nome, objetivo]) => ({ id: `tra-${cen}` as IdErp, nome, fluxo: 'Stocks', estadoDe: 'stocks-transf-armazens' as IdErp, objetivo, versoes: [v(cen)] as Ecra<IdErp>['versoes'] })),
  ];
}
