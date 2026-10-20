/* =========================================================
   GOPARTS — 10 · Início V5 (20 out. 2026): o painel de controlo
   Do briefing «New Command Dashboard & Separate Parts Search Workspace»: o Início deixa de ser a pesquisa de
   peças (passou ao 18 · Pesquisar peças, inicio-v3.ts) e passa a ser o painel da atividade da conta —
   acompanhar, perceber e agir.
   - Cabeçalho compacto: saudação, conta, armazém, a data e o período (Hoje, 7 dias, 30 dias, Personalizado).
     O período muda só o que depende dele (pedidos efetuados, valor, documentos, o gráfico); o que é «agora»
     (em curso, para recolha, devoluções em aberto, alertas, estado das encomendas) di-lo e não muda.
   - Resumo (6 indicadores), Evolução das compras (gráfico), Estado das encomendas, Requer a tua atenção,
     Últimos pedidos, Atividade recente e Acesso rápido — cada um carrega, falha e fica vazio sozinho.
   - Personalizar: ordem (arrastar ou ↑ ↓), mostrar e esconder, atalhos, período por omissão e repor.
   Os números contam-se em painel-dados.ts. Comportamento: comportamento/painel.ts. CSS: css/painel.css.
   ========================================================= */
import {
  HOJE, INICIO_PEDIDOS, LINHAS_TODAS, NOME_PERIODO, kpis, serie, eventosDocs, ordenar, periodo, textoPeriodo,
  curta, numerica, iso, euros, dias, type IdPeriodo, type Periodo, type Kpi, type Ponto, type Evento,
} from './painel-dados';
import { alertas, saudacao, frequentes, L } from './inicio-espaco';
import { LISTAS } from './lista';
import { saida, type Referencia } from './catalogo-dados';
import carFront from 'lucide-static/icons/car-front.svg?raw';
import car from 'lucide-static/icons/car.svg?raw';
import hash from 'lucide-static/icons/hash.svg?raw';
const liquidoRef = (r: Referencia) => Math.round(r[4] * (1 - r[5] / 100) * 100) / 100;
import shoppingBag from 'lucide-static/icons/shopping-bag.svg?raw';
import clock from 'lucide-static/icons/clock.svg?raw';
import euro from 'lucide-static/icons/euro.svg?raw';
import store from 'lucide-static/icons/store.svg?raw';
import undo2 from 'lucide-static/icons/undo-2.svg?raw';
import files from 'lucide-static/icons/files.svg?raw';
import chartSpline from 'lucide-static/icons/chart-spline.svg?raw';
import chartBar from 'lucide-static/icons/chart-bar-big.svg?raw';
import triangleAlert from 'lucide-static/icons/triangle-alert.svg?raw';
import packageIcon from 'lucide-static/icons/package.svg?raw';
import activity from 'lucide-static/icons/activity.svg?raw';
import zap from 'lucide-static/icons/zap.svg?raw';
import search from 'lucide-static/icons/search.svg?raw';
import receipt from 'lucide-static/icons/receipt.svg?raw';
import star from 'lucide-static/icons/star.svg?raw';
import wrench from 'lucide-static/icons/wrench.svg?raw';
import layoutGrid from 'lucide-static/icons/layout-grid.svg?raw';
import truck from 'lucide-static/icons/truck.svg?raw';
import cart from 'lucide-static/icons/shopping-cart.svg?raw';
import arrowRight from 'lucide-static/icons/arrow-right.svg?raw';
import arrowUpRight from 'lucide-static/icons/arrow-up-right.svg?raw';
import chevronRight from 'lucide-static/icons/chevron-right.svg?raw';
import settings2 from 'lucide-static/icons/settings-2.svg?raw';
import calendarRange from 'lucide-static/icons/calendar-range.svg?raw';
import mapPin from 'lucide-static/icons/map-pin.svg?raw';
import building from 'lucide-static/icons/building-2.svg?raw';
import info from 'lucide-static/icons/info.svg?raw';
import check from 'lucide-static/icons/check.svg?raw';
import rotateCcw from 'lucide-static/icons/rotate-ccw.svg?raw';
import gripVertical from 'lucide-static/icons/grip-vertical.svg?raw';
import x from 'lucide-static/icons/x.svg?raw';
import fileText from 'lucide-static/icons/file-text.svg?raw';
import history from 'lucide-static/icons/history.svg?raw';
import send from 'lucide-static/icons/send.svg?raw';
import chevronDown from 'lucide-static/icons/chevron-down.svg?raw';

export const IC_PN = { shoppingBag, clock, euro, store, undo2, files, chartSpline, chartBar, triangleAlert, packageIcon, activity, zap, search, receipt, star, wrench, layoutGrid, truck, cart, arrowRight, arrowUpRight, chevronRight, settings2, calendarRange, mapPin, building, info, check, rotateCcw, gripVertical, x, fileText, history, send, chevronDown };
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const btn = (texto: string, icone: string, extra = '', cls = '') => `<button type="button" class="btn pn__btn${cls ? ` ${cls}` : ''}"${extra}>${L(icone, 'btn__icone')}<span class="btn__rotulo">${texto}</span></button>`;
const acao = (texto: string, icone: string, extra = '', cls = '') => btn(texto, icone, extra, `btn--acao ${cls}`.trim());

/* =========================================================
   Os blocos, os atalhos e as preferências
   ========================================================= */
export type IdW = 'resumo' | 'evolucao' | 'atencao' | 'pedidos' | 'atividade' | 'atalhos' | 'frequentes';
/** nome · o que mostra · ícone */
export const WIDGETS: Record<IdW, [string, string, string]> = {
  resumo: ['Resumo', 'Pedidos em curso, em transporte, para recolha e devoluções abertas', layoutGrid],
  evolucao: ['Evolução das compras', 'O valor e o número de pedidos, dia a dia', chartSpline],
  atencao: ['Requer a tua atenção', 'Faturas vencidas, recolhas e devoluções por tratar', triangleAlert],
  pedidos: ['Últimos pedidos', 'Os pedidos mais recentes e a entrega de cada um', packageIcon],
  atividade: ['Atividade recente', 'Pedidos, documentos, devoluções e pesquisas', activity],
  atalhos: ['Acesso rápido', 'Os caminhos que usas mais', zap],
  frequentes: ['Referências frequentes e listas', 'O que pedes mais vezes e as listas guardadas', star],
};
/** (20 out., V6) A ordem do computador: resumo; gráfico; pedidos | atenção; atividade | atalhos; frequentes e listas. */
export const ORDEM_W: IdW[] = ['resumo', 'evolucao', 'pedidos', 'atencao', 'atividade', 'atalhos', 'frequentes'];
/** No telemóvel, sem ordem escolhida: atenção, resumo, gráfico, pedidos, atalhos, frequentes, atividade (css). */

export type IdAtalhoPn = 'pesquisa' | 'catalogo' | 'pedidos' | 'guias' | 'faturas' | 'devolucoes' | 'lista' | 'tecnica' | 'carrinho';
/** nome · o que faz · ícone */
export const ATALHOS_PN: Record<IdAtalhoPn, [string, string, string]> = {
  pesquisa: ['Pesquisar peças', 'Matrícula, veículo ou referência', search],
  pedidos: ['Consultar pedidos', 'Estado, percurso e documentos', packageIcon],
  faturas: ['Ver faturas', 'Pagamentos e notas de crédito', receipt],
  lista: ['Abrir minha lista', 'Orçamentos e listas guardadas', star],
  devolucoes: ['Ver devoluções', 'Criar e acompanhar', undo2],
  tecnica: ['Informação técnica', 'Manutenção, reparação e esquemas', wrench],
  catalogo: ['Catálogo', 'Marcas, modelos e grupos', layoutGrid],
  guias: ['Guias de remessa', 'O que foi expedido', truck],
  carrinho: ['Ver carrinho', 'A encomenda por concluir', cart],
};
export type PrefsPn = { ordem: IdW[]; escondidos: IdW[]; periodo: Exclude<IdPeriodo, 'pers' | 'hoje'>; atalhos: IdAtalhoPn[] };
export const PREFS_PN: PrefsPn = { ordem: [...ORDEM_W], escondidos: [], periodo: '7', atalhos: ['pesquisa', 'pedidos', 'faturas', 'lista', 'devolucoes', 'tecnica'] };
/** Por pessoa e por conta. Num servidor, no perfil; aqui, no navegador. */
export const CHAVE_PN = 'goparts:painel:ff-porto:v2'; // v2 a 20 out. (V6): sem o estado das encomendas, com as referências frequentes

/** Os estados do painel (10.x). */
export type EstadoPn = '' | 'carga' | 'vazio' | 'falha' | 'pers' | 'personalizar' | 'pedidos-n';

/* =========================================================
   O gráfico (desenhado aqui; o comportamento volta a desenhá-lo à largura certa e anima-o)
   ========================================================= */
export type Metrica = 'valor' | 'pedidos';
/** Uma escala «redonda» de 0 até acima do máximo (nunca começa acima de zero). */
export function escala(max: number, metrica: Metrica): number[] {
  if (max <= 0) return metrica === 'pedidos' ? [0, 1, 2, 3, 4] : [0, 250, 500, 750, 1000];
  if (metrica === 'pedidos') { const passo = Math.max(1, Math.ceil(max / 4)); return [0, 1, 2, 3, 4].map((i) => i * passo); }
  const bruto = max / 4, ordem = 10 ** Math.floor(Math.log10(bruto)), m = bruto / ordem;
  const passo = (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * ordem;
  return [0, 1, 2, 3, 4].map((i) => Math.round(i * passo));
}
const eixo = (v: number, metrica: Metrica) => (metrica === 'pedidos' ? String(v) : v >= 1000 ? `${(v / 1000).toLocaleString('pt-PT', { maximumFractionDigits: 1 })} mil €` : `${v} €`);
export type Desenho = { svg: string; xs: number[]; ys: number[]; acumulado: number[]; topo: number; base: number };
let uidG = 0;
/** O acumulado no período, em degraus (o valor só muda nos dias com pedidos), com os pontos nesses dias. */
export function desenharGrafico(pontos: Ponto[], metrica: Metrica, w: number, h: number, valores?: number[]): Desenho {
  const E = 58, D = 18, T = 16, B = 30, tracos = `pn-tracos-${++uidG}`;
  const acumulado: number[] = []; let s = 0;
  pontos.forEach((p, i) => { s += valores ? valores[i] : metrica === 'valor' ? p.valor : p.pedidos; acumulado.push(+s.toFixed(2)); });
  const tot = acumulado[acumulado.length - 1] ?? 0;
  const marcas = escala(tot, metrica), topoV = marcas[marcas.length - 1] || 1;
  const n = pontos.length, larg = w - E - D, alt = h - T - B;
  const xs = pontos.map((_, i) => E + (n === 1 ? larg / 2 : (i / (n - 1)) * larg));
  const ys = acumulado.map((v) => T + alt - (v / topoV) * alt);
  const base = T + alt;
  /* os dias sem histórico: uma faixa tracejada com «Sem dados» */
  const semIdx = pontos.findIndex((p) => !p.semDados);
  const sem = semIdx > 0 ? (() => { const x1 = (xs[semIdx - 1] + xs[semIdx]) / 2; return `<g class="pn__g-sem"><rect x="${E}" y="${T}" width="${(x1 - E).toFixed(1)}" height="${alt}" fill="url(#${tracos})"/>${x1 - E > 70 ? `<text x="${((E + x1) / 2).toFixed(1)}" y="${T + 16}" text-anchor="middle">Sem dados</text>` : ''}</g>`; })() : semIdx === -1 && n ? `<g class="pn__g-sem"><rect x="${E}" y="${T}" width="${larg}" height="${alt}" fill="url(#${tracos})"/><text x="${E + larg / 2}" y="${T + alt / 2}" text-anchor="middle">Sem dados neste período</text></g>` : '';
  const ini = Math.max(0, semIdx);
  /* a linha em degraus, a partir do primeiro dia com histórico */
  let d = '';
  if (semIdx !== -1) {
    d = `M${xs[ini].toFixed(1)} ${ys[ini].toFixed(1)}`;
    for (let i = ini + 1; i < n; i++) d += `H${xs[i].toFixed(1)}V${ys[i].toFixed(1)}`;
  }
  const area = d ? `${d}V${base}H${xs[ini].toFixed(1)}Z` : '';
  /* as datas do eixo: no máximo 7, sempre a primeira e a última */
  const passoX = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(larg / 92))));
  const datas = pontos.map((p, i) => (i % passoX === 0 || i === n - 1) && !(i !== n - 1 && n - 1 - i < passoX * .6) ? `<text x="${xs[i].toFixed(1)}" y="${h - 8}" text-anchor="${i === 0 && n > 1 ? 'start' : i === n - 1 && n > 1 ? 'end' : 'middle'}">${curta(p.n)}</text>` : '').join('');
  const grelha = marcas.map((m) => { const y = T + alt - (m / topoV) * alt; return `<line x1="${E}" x2="${w - D}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}"/><text x="${E - 10}" y="${(y + 4).toFixed(1)}" text-anchor="end">${eixo(m, metrica)}</text>`; }).join('');
  const bolas = pontos.map((p, i) => (p.pedidos ? `<circle class="pn__g-ponto" cx="${xs[i].toFixed(1)}" cy="${ys[i].toFixed(1)}" r="4" style="--i:${i}"/>` : '')).join('');
  const fim = d ? `<g class="pn__g-fim" transform="translate(${xs[n - 1].toFixed(1)} ${ys[n - 1].toFixed(1)})"><circle r="5"/></g>` : '';
  const svg = `<svg class="pn__g" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true" focusable="false">
    <defs><pattern id="${tracos}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" class="pn__g-traco"/></pattern></defs>
    <g class="pn__g-eixos">${grelha}${datas}<line class="pn__g-base" x1="${E}" x2="${w - D}" y1="${base}" y2="${base}"/></g>
    ${sem}
    ${area ? `<path class="pn__g-area" d="${area}"/>` : ''}
    ${d ? `<path class="pn__g-linha" d="${d}" pathLength="1"/>` : ''}
    <g class="pn__g-pontos">${bolas}</g>${fim}
    <line class="pn__g-cursor" x1="0" x2="0" y1="${T}" y2="${base}" hidden/>
  </svg>`;
  return { svg, xs, ys, acumulado, topo: T, base };
}
/** A frase do total, por cima do gráfico. */
export const totalGrafico = (pontos: Ponto[], m: Metrica) => { const t = pontos.reduce((s, p) => s + (m === 'valor' ? p.valor : p.pedidos), 0); return m === 'valor' ? euros(t) : `${t} ${t === 1 ? 'pedido' : 'pedidos'}`; };

/* =========================================================
   Cada bloco
   ========================================================= */
const esq = (n: number, cls: string) => Array.from({ length: n }, () => `<li class="${cls} pn__esq" aria-hidden="true"><i></i><i></i><i></i></li>`).join('');
function falha(o: string, w: IdW): string {
  return `<div class="pn__falha" role="alert"><span class="pn__falha-icone">${L(triangleAlert)}</span><div><b>Não foi possível carregar ${o}.</b><span>O resto do Início continua a funcionar.</span></div>${btn('Tentar novamente', rotateCcw, ` data-pn-tentar="${w}"`)}</div>`;
}
const vazio = (ic: string, texto: string, accoes = '') => `<div class="pn__vazio">${L(ic)}<p>${texto}</p>${accoes}</div>`;
function bloco(id: IdW, corpo: string, p: PrefsPn, o: { ambito?: string; accoes?: string; cls?: string; semCabeca?: boolean } = {}): string {
  const [nome, , ic] = WIDGETS[id];
  if (o.semCabeca) return `<section class="pn__w pn__w--${id}" data-w="${id}" aria-label="${nome}" style="order:${p.ordem.indexOf(id)}"${p.escondidos.includes(id) ? ' hidden' : ''}><div class="pn__w-corpo" data-corpo>${corpo}</div></section>`;
  return `<section class="pn__w pn__w--${id}${o.cls ? ` ${o.cls}` : ''}" data-w="${id}" aria-labelledby="pn-${id}-t" style="order:${p.ordem.indexOf(id)}"${p.escondidos.includes(id) ? ' hidden' : ''}>
    <header class="pn__w-cabeca"><h2 id="pn-${id}-t">${L(ic)}${nome}</h2>${o.ambito ? `<span class="pn__ambito" data-ambito>${o.ambito}</span>` : ''}${o.accoes ? `<div class="pn__w-accoes">${o.accoes}</div>` : ''}</header>
    <div class="pn__w-corpo" data-corpo>${corpo}</div>
  </section>`;
}
const ambitoAgora = `${L(clock)}Agora`;

/* ---------- Resumo ---------- */
const KPI_IC: Record<Kpi['id'], string> = { curso: clock, transporte: truck, recolha: store, devolucoes: undo2 };
export function kpiHtml(k: Kpi, i: number, carga = false): string {
  const zero = !carga && !k.valor;
  return `<li style="--i:${i}"><button type="button" class="pn__kpi pn__kpi--${k.id}" data-kpi="${k.id}" data-pn-ir="${k.ir[0]}"${k.ir[1] ? ` data-etapa="${k.ir[1]}"` : ''}${carga || zero ? ' disabled' : ''} aria-describedby="pn-kpi-${k.id}-def">
    <span class="pn__kpi-topo"><span class="pn__kpi-icone">${L(KPI_IC[k.id])}</span><span class="pn__kpi-nome">${k.nome}</span></span>
    <b class="pn__kpi-valor" data-valor="${k.valor}">${carga ? '–' : k.texto}</b>
    <span class="pn__kpi-sub" data-sub>${carga ? '' : k.sub ?? ''}</span>
    <span class="sr-only" id="pn-kpi-${k.id}-def">${k.def}</span>
    ${zero ? '' : L(arrowRight, 'pn__kpi-seta')}
  </button></li>`;
}
/** (V6) o resumo operacional: quatro números do «agora», sem título por cima (o cabeçalho já diz onde se está). */
export function resumoHtml(prefs: PrefsPn, e: EstadoPn = ''): string {
  const ks = kpis().map((k) => (e === 'vazio' ? { ...k, valor: 0, texto: '0', sub: undefined } : k));
  return bloco('resumo', `<ul class="pn__kpis" role="list">${ks.map((k, i) => kpiHtml(k, i, e === 'carga')).join('')}</ul>`, prefs, { semCabeca: true });
}

/* ---------- Evolução das compras ---------- */
const SEG = (nome: string, attr: string, opcoes: [string, string][], valor: string) => `<div class="pn__seg" role="radiogroup" aria-label="${nome}">${opcoes.map(([v, t]) => `<button type="button" role="radio" class="pn__seg-op" ${attr}="${v}" aria-checked="${v === valor}" tabindex="${v === valor ? 0 : -1}">${t}</button>`).join('')}<i class="pn__seg-marca" aria-hidden="true"></i></div>`;
/** (V6) o período é só do gráfico: 7, 30, 90 dias ou personalizado (as datas abrem-se dentro do bloco). */
export function persHtml(p: Periodo): string {
  return `<form class="pn__pers" data-pers${p.id === 'pers' ? '' : ' hidden'} novalidate>
        <label><span>De</span><input type="date" name="de" value="${iso(p.de)}" max="${iso(HOJE)}" required></label>
        <label><span>Até</span><input type="date" name="ate" value="${iso(p.ate)}" max="${iso(HOJE)}" required></label>
        <button type="submit" class="btn pn__btn">${L(check, 'btn__icone')}<span class="btn__rotulo">Aplicar</span></button>
        <p class="pn__pers-erro" role="alert"></p>
      </form>`;
}
export function evolucaoHtml(pg: Periodo, prefs: PrefsPn, e: EstadoPn = '', metrica: Metrica = 'valor'): string {
  const pts = serie(pg).map((x) => (e === 'vazio' ? { ...x, valor: 0, pedidos: 0, nums: [] } : x));
  const accoes = SEG('O que mostra o gráfico', 'data-metrica', [['valor', 'Valor das compras'], ['pedidos', 'Número de pedidos']], metrica)
    + SEG('Período do gráfico', 'data-graf-periodo', [['7', '7 dias'], ['30', '30 dias'], ['90', '90 dias'], ['pers', 'Personalizado']], pg.id);
  const corpo = e === 'carga' ? `<div class="pn__graf pn__graf--carga" aria-busy="true"><i class="pn__esq-graf"></i></div>`
    : e === 'falha' ? falha('a evolução das compras', 'evolucao')
    : `${persHtml(pg)}<div class="pn__graf" data-graf data-metrica="${metrica}" data-de="${pg.de}" data-ate="${pg.ate}" tabindex="0" role="group" aria-roledescription="gráfico" aria-label="Evolução das compras, ${NOME_PERIODO[pg.id]}: ${totalGrafico(pts, metrica)} acumulado. Use as setas para percorrer os dias." aria-describedby="pn-graf-nota">
        <p class="pn__graf-total"><span>${metrica === 'valor' ? 'Valor das compras' : 'Pedidos'} · ${textoPeriodo(pg)}</span><b data-graf-total>${totalGrafico(pts, metrica)}</b></p>
        <div class="pn__graf-tela" data-graf-tela>${desenharGrafico(pts, metrica, 760, 248).svg}</div>
        <div class="pn__dica" data-dica role="status" aria-live="polite" hidden></div>
        ${pts.some((x) => x.pedidos) || e === 'vazio' ? '' : `<p class="pn__graf-nada">Nenhum pedido neste período.</p>`}
        ${e === 'vazio' ? `<p class="pn__graf-nada">Ainda não fizeste compras. O gráfico começa com o primeiro pedido.</p>` : ''}
      </div>
      <p class="pn__nota" id="pn-graf-nota">${L(info)}<span>Acumulado, sem IVA, pela data de cada pedido. Dados de exemplo até ${numerica(HOJE)}; antes de ${numerica(INICIO_PEDIDOS)} não há histórico (tracejado).</span></p>`;
  return bloco('evolucao', corpo, prefs, { accoes, cls: 'pn__w--largo' });
}

/* ---------- (V6) Referências frequentes e listas ----------
   As referências contam-se nos pedidos e nas listas (as mesmas da Pesquisar peças); as listas são as guardadas. */
export function frequentesHtml(prefs: PrefsPn, e: EstadoPn = ''): string {
  const fs = e === 'vazio' ? [] : frequentes().slice(0, 5), ls = e === 'vazio' ? [] : LISTAS.slice(0, 4);
  const refs = e === 'carga' ? `<ul class="pn__esq-linhas">${esq(4, 'pn__esq-linha')}</ul>`
    : !fs.length ? vazio(star, 'Quando encomendares, as referências que pedes mais vezes aparecem aqui.')
    : `<ul class="pn__refs" role="list">${fs.map((f, i) => { const [, fab, ref, desc, , , porto, sacavem] = f.r; return `<li style="--i:${i}"><div class="pn__ref-li">
        <span class="pn__ref-txt"><span class="pn__ref-fab">${esc(fab)}</span><b>${esc(ref)}</b><span>${esc(desc)}</span></span>
        <span class="pn__ref-vezes">${f.pedidos ? `${f.pedidos} ${f.pedidos === 1 ? 'pedido' : 'pedidos'}` : ''}${f.pedidos && f.listas ? ' · ' : ''}${f.listas ? `${f.listas} ${f.listas === 1 ? 'lista' : 'listas'}` : ''}</span>
        <span class="pn__ref-preco"><b>${euros(liquidoRef(f.r))}</b><small>${saida(porto, sacavem)}</small></span>
        <button type="button" class="btn pn__btn pn__btn--leve" data-pn-ficha="${esc(ref)}" data-pn-fab="${esc(fab)}">${L(fileText, 'btn__icone')}<span class="btn__rotulo">Ficha</span></button>
        <button type="button" class="btn pn__btn pn__btn--leve btn--acao" data-pn-pedir="${esc(ref)}">${L(cart, 'btn__icone')}<span class="btn__rotulo">Adicionar</span></button>
      </div></li>`; }).join('')}</ul>`;
  const listas = e === 'carga' ? '' : !ls.length ? vazio(star, 'Ainda não guardaste listas.') : `<ul class="pn__listas" role="list">${ls.map((l) => `<li><button type="button" class="pn__lista" data-pn-lista="${l.id}">${L(star)}<span><b>${esc(l.nome)}</b><small>${l.pecas.length} ${l.pecas.length === 1 ? 'peça' : 'peças'} · ${esc(l.atualizada)}</small></span>${L(chevronRight, 'pn__evento-seta')}</button></li>`).join('')}</ul>`;
  return bloco('frequentes', `<div class="pn__freq"><div><h3 class="pn__sub-t">Referências que pedes mais</h3>${refs}</div><div><h3 class="pn__sub-t">Listas guardadas</h3>${listas}</div></div>`, prefs,
    { accoes: `<button type="button" class="pn__mais" data-pn-ir="lista" data-pn-chave="goparts:lista-vista" data-pn-valor="listas">Ver as listas${L(chevronRight)}</button>`, cls: 'pn__w--largo' });
}

/* ---------- Requer a tua atenção ---------- */
const ESTADO_ALERTA: Record<string, string> = { erro: 'Urgente', aviso: 'Por tratar', info: 'A aguardar' };
export function atencaoHtml(prefs: PrefsPn, e: EstadoPn = ''): string {
  const lista = e === 'vazio' ? [] : alertas();
  const corpo = e === 'carga' ? `<ul class="pn__alertas">${esq(3, 'pn__alerta-li')}</ul>`
    : !lista.length ? `<p class="pn__tudo-bem">${L(check)}Não tens ações pendentes.</p>`
    : `<ul class="pn__alertas" role="list">${lista.map((a, i) => `<li class="pn__alerta-li" style="--i:${i}"><div class="pn__alerta pn__alerta--${a.k}">
        <span class="pn__alerta-icone">${L(a.ic)}</span>
        <span class="pn__alerta-texto"><b>${esc(a.titulo)}</b><span><span class="pn__ref">${esc(a.ref)}</span> · ${esc(a.quando)}</span></span>
        <span class="pn__chip pn__chip--${a.k}">${ESTADO_ALERTA[a.k]}</span>
        <button type="button" class="btn pn__btn pn__alerta-acao"${a.attr}>${L(arrowRight, 'btn__icone')}<span class="btn__rotulo">${a.acao}</span></button>
      </div></li>`).join('')}</ul><p class="pn__nota">${L(info)}<span>Urgente só quando o prazo já passou (uma fatura vencida). O resto fica «por tratar» ou «a aguardar» a Romafe.</span></p>`;
  return bloco('atencao', corpo, prefs, { ambito: ambitoAgora, accoes: lista.length && e !== 'carga' ? `<span class="pn__conta">${lista.length}</span>` : '', cls: 'pn__w--atencao' });
}

/* ---------- Últimos pedidos ---------- */
export function pedidosHtml(prefs: PrefsPn, e: EstadoPn = ''): string {
  const linhas = e === 'vazio' ? [] : LINHAS_TODAS.slice(0, 5);
  const corpo = e === 'carga' ? `<ul class="pn__esq-linhas">${esq(5, 'pn__esq-linha')}</ul>`
    : e === 'falha' ? falha('os últimos pedidos', 'pedidos')
    : !linhas.length ? vazio(packageIcon, 'Ainda não fizeste pedidos.', btn('Pesquisar peças', search, ' data-pn-ir="pesquisa"'))
    : `<div class="pn__tabela-rolo"><table class="pn__tabela"><caption class="sr-only">Os ${linhas.length} pedidos mais recentes</caption>
      <thead><tr><th scope="col">Pedido</th><th scope="col">Data</th><th scope="col" class="pn__num">Artigos</th><th scope="col" class="pn__num">Total</th><th scope="col">Estado</th><th scope="col">Entrega</th></tr></thead>
      <tbody>${linhas.map((x, i) => `<tr class="pn__linha" data-abrir-pedido="${x.l.num}" style="--i:${i}">
        <th scope="row"><button type="button" class="pn__linha-btn" data-abrir-pedido="${x.l.num}">${x.l.num}</button></th>
        <td data-r="Data">${x.l.data}</td><td class="pn__num" data-r="Artigos">${x.artigos}</td><td class="pn__num" data-r="Total"><b>${euros(x.valor)}</b></td>
        <td data-r="Estado"><span class="pn__etapa pn__etapa--${x.etapa.k}">${x.etapa.icone}${x.etapa.nome}</span></td>
        <td data-r="Entrega" class="pn__entrega">${L(x.l.recolher ? store : truck)}${x.l.recolher ? `Levantar · ${esc(x.l.armazem.replace(/ \(\d\)$/, ''))}` : esc(x.l.morada[1].replace(/^\d{4}-\d{3} /, ''))}</td>
      </tr>`).join('')}</tbody></table></div>`;
  return bloco('pedidos', corpo, prefs, { accoes: `<button type="button" class="pn__mais" data-pn-ir="pedidos">Ver todos os pedidos${L(chevronRight)}</button>`, cls: 'pn__w--largo' });
}

/* ---------- Atividade recente ---------- */
const EV_IC: Record<Evento['tipo'], string> = { pedido: shoppingBag, guia: truck, fatura: receipt, credito: fileText, 'dev-criada': undo2, 'dev-enviada': send, pesquisa: search };
export function atividadeLista(ev: Evento[], max = 8): string {
  const vistos = ordenar(ev).slice(0, max);
  const grupos = new Map<number, Evento[]>();
  vistos.forEach((x) => { const g = grupos.get(x.n) ?? []; g.push(x); grupos.set(x.n, g); });
  return `<ol class="pn__dias" role="list">${[...grupos].map(([n, xs]) => `<li class="pn__dia"><h3 class="pn__dia-t">${n === HOJE ? `${curta(n, true)} · último dia com movimento` : curta(n, true)}</h3>
    <ul class="pn__eventos" role="list">${xs.map((x) => `<li><button type="button" class="pn__evento pn__evento--${x.tipo}" data-evento="${x.ir.join('|')}">
      <span class="pn__evento-icone">${L(EV_IC[x.tipo])}</span><span class="pn__evento-texto"><b>${esc(x.titulo)}</b><span>${esc(x.sub)}</span></span>${L(chevronRight, 'pn__evento-seta')}</button></li>`).join('')}</ul></li>`).join('')}</ol>`;
}
export function atividadeHtml(prefs: PrefsPn, e: EstadoPn = ''): string {
  const ev = e === 'vazio' ? [] : eventosDocs();
  const corpo = e === 'carga' ? `<ul class="pn__esq-linhas">${esq(5, 'pn__esq-linha')}</ul>`
    : !ev.length ? vazio(history, 'Ainda não há atividade. Os pedidos, os documentos, as devoluções e as pesquisas aparecem aqui, por dia.')
    : `<div data-atividade>${atividadeLista(ev)}</div>${ev.length > 8 ? `<button type="button" class="pn__mais pn__mais--baixo" data-mais-atividade aria-expanded="false">Mostrar mais${L(chevronDown)}</button>` : ''}`;
  return bloco('atividade', corpo, prefs);
}

/* ---------- Acesso rápido ---------- */
export function atalhosHtml(prefs: PrefsPn): string {
  return bloco('atalhos', `<ul class="pn__atalhos" role="list">${prefs.atalhos.map((a, i) => `<li style="--i:${i}"><button type="button" class="pn__atalho" data-pn-atalho="${a}">
      <span class="pn__atalho-icone">${L(ATALHOS_PN[a][2])}</span><span class="pn__atalho-texto"><b>${ATALHOS_PN[a][0]}</b><span>${ATALHOS_PN[a][1]}</span></span>${L(arrowUpRight, 'pn__atalho-seta')}</button></li>`).join('')}</ul>`, prefs,
    { accoes: btn('Escolher', settings2, ' data-pn-personalizar="atalhos" aria-haspopup="dialog"', 'pn__btn--leve') });
}

/* =========================================================
   O cabeçalho, a gaveta e o ecrã
   ========================================================= */
const DIAS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
export function cabecaHtml(agora = Date.now()): string {
  const d = new Date(agora), data = `${DIAS[d.getDay()]}, ${d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  return `<header class="pn__cabeca">
    <div class="pn__ola"><p class="pn__data" data-hoje>${data}</p><h1 class="pn__titulo"><span data-saudacao>${saudacao(d.getHours())}</span>, Fernando</h1></div>
    <dl class="pn__contexto">
      <div><dt>Conta</dt><dd>${L(building)}Fernando F. França · Porto</dd></div>
      <div><dt>Armazém de saída</dt><dd>${L(mapPin)}Porto (1)</dd></div>
    </dl>
    <div class="pn__controlos">${btn('Personalizar', settings2, ' data-pn-personalizar aria-haspopup="dialog"', 'pn__personalizar')}</div>
  </header>
  <nav class="pn__procura" aria-label="Pesquisar peças">
    <button type="button" class="pn__procura-campo" data-pn-pesquisa="0">${L(search)}<span>Pesquisar peças por matrícula, veículo ou referência</span></button>
    <div class="pn__procura-modos">${([['0', 'Matrícula', carFront], ['1', 'Veículo', car], ['2', 'Referência', hash]] as const).map(([m, t, ic]) => `<button type="button" class="pn__procura-modo" data-pn-pesquisa="${m}">${L(ic)}<span>${t}</span></button>`).join('')}</div>
  </nav>`;
}
export function gavetaHtml(p: PrefsPn, aberta = false): string {
  return `<div class="pn__gaveta" data-por-cima role="dialog" aria-modal="true" aria-labelledby="pn-g-t"${aberta ? '' : ' hidden'}>
    <div class="pn__veu" data-pn-fechar></div>
    <div class="pn__gaveta-caixa">
      <header class="pn__gaveta-cabeca"><h2 id="pn-g-t">${L(settings2)}Personalizar o Início</h2>${btn('Fechar', x, ' data-pn-fechar')}</header>
      <div class="pn__gaveta-corpo">
        <section aria-labelledby="pn-g-blocos"><h3 id="pn-g-blocos">Blocos</h3><p class="pn__ajuda">Arrasta pela pega para mudar a ordem (ou usa a pega com ↑ ↓). Desliga os que não usas.</p>
          <ol class="pn__ordem" data-pn-ordem>${p.ordem.map((id) => `<li class="pn__ordem-li" data-w-ordem="${id}">
            <button type="button" class="pn__pega" data-pn-pega aria-label="Mover ${WIDGETS[id][0]}" aria-describedby="pn-g-blocos">${L(gripVertical)}</button>
            <span class="pn__ordem-texto">${L(WIDGETS[id][2])}<b>${WIDGETS[id][0]}</b><small>${WIDGETS[id][1]}</small></span>
            <label class="pn__interruptor"><input type="checkbox" data-pn-mostrar="${id}"${p.escondidos.includes(id) ? '' : ' checked'}><span class="sr-only">Mostrar ${WIDGETS[id][0]}</span><i aria-hidden="true"></i></label>
          </li>`).join('')}</ol><p class="sr-only" role="status" aria-live="polite" data-pn-ordem-aviso></p></section>
        <section><h3>Período do gráfico ao abrir</h3><div class="pn__escolha" role="radiogroup" aria-label="Período do gráfico ao abrir">${(['7', '30', '90'] as const).map((v) => `<label class="pn__escolha-op"><input type="radio" name="pn-periodo-omissao" data-pn-periodo-omissao value="${v}"${v === p.periodo ? ' checked' : ''}><span>${NOME_PERIODO[v]}</span></label>`).join('')}</div></section>
        <section id="pn-g-atalhos" aria-labelledby="pn-g-atalhos-t"><h3 id="pn-g-atalhos-t">Acesso rápido</h3><p class="pn__ajuda">Até 8. Os que ficam de fora continuam no menu.</p>
          <ul class="pn__atalhos-escolha" role="list">${(Object.keys(ATALHOS_PN) as IdAtalhoPn[]).map((a) => `<li><label class="pn__marcar"><input type="checkbox" data-pn-atalho-escolha="${a}"${p.atalhos.includes(a) ? ' checked' : ''}>${L(ATALHOS_PN[a][2])}<span>${ATALHOS_PN[a][0]}</span></label></li>`).join('')}</ul></section>
      </div>
      <footer class="pn__gaveta-pe">${btn('Repor o Início de origem', rotateCcw, ' data-pn-repor')}${acao('Concluído', check, ' data-pn-fechar')}</footer>
    </div>
  </div>`;
}
export function blocosPn(p: Periodo, prefs: PrefsPn, e: EstadoPn = '', metrica: Metrica = 'valor'): string {
  const origem = prefs.ordem.join() === ORDEM_W.join();
  return `<div class="pn__grelha" data-pn-grelha${origem ? ' data-ordem="origem"' : ''}>
    ${resumoHtml(prefs, e)}${evolucaoHtml(p, prefs, e, metrica)}${pedidosHtml(prefs, e)}${atencaoHtml(prefs, e)}${atividadeHtml(prefs, e)}${atalhosHtml(prefs)}${frequentesHtml(prefs, e)}
  </div>`;
}
/** O Início (ou um estado dele). */
export function painelV5(e: EstadoPn = ''): string {
  const prefs = structuredClone(PREFS_PN);
  const p = e === 'pers' ? periodo('pers', INICIO_PEDIDOS, HOJE) : periodo(prefs.periodo);
  return `<div class="portal portal--v3 portal--v22 portal--noite portal--ini3 portal--pn">
  <main class="pn"${e ? ` data-estado="${e}"` : ''}>
    ${cabecaHtml()}
    ${blocosPn(p, prefs, e === 'pedidos-n' ? '' : e, e === 'pedidos-n' ? 'pedidos' : 'valor')}
  </main>
  ${gavetaHtml(prefs, e === 'personalizar')}
  <p class="pn__aviso sr-only" role="status" aria-live="polite" data-pn-aviso></p>
  <div class="pn__brinde" data-por-cima role="status" aria-live="polite" hidden></div>
</div>`;
}
export { dias };
