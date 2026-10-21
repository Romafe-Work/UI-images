/* =========================================================
   PEÇA A PEÇA — 10 · Início V9 (21 out. 2026): o painel em cartões
   Do briefing «Redesign clean para o marketplace Peça A Peça» («quero os cards como tinha antes»: um dashboard
   limpo, com vida e cor, sem o cinzento pesado). Por esta ordem:
   - Cabeçalho: a saudação, a data, a conta e o armazém; à direita «Atualizado», as definições, a ação do momento
     (continuar a lista em rascunho) e «Pesquisar peças». O rolamento das cotas anda.
   - (21 out., tarde) os três cartões grandes da pesquisa saíram do Início (ela: «isto deve estar no pesquisar
     peças… e não quero no início»): estão na Pesquisar peças, a rodar.
   - Os atalhos: sete cartões (Catálogo, Pedidos, Guias, Faturas, Devoluções, Informação técnica, Minha lista),
     cada um com o que interessa dele contado dos documentos (em curso, vencidas, em aberto…).
   - O centro: «Últimos pedidos» | «Requer a tua atenção» (destacado, por importância).
   - O resumo: cartões compactos — últimas guias, devoluções em curso, últimas pesquisas, listas, peças frequentes.
   - Saíram (V7/V8): os quatro números (passaram para os atalhos), o gráfico e o período.
   Os números contam-se em painel-dados.ts. Comportamento: comportamento/painel.ts. CSS: css/painel.css + limpo.css.
   ========================================================= */
import {
  HOJE, INICIO_PEDIDOS, LINHAS_TODAS, kpis, serie, alertasPn, NOME_GRUPO, periodo, textoPeriodo,
  curta, numerica, euros, type Periodo, type Kpi, type Ponto, type GrupoAlerta,
} from './painel-dados';
import { saudacao, L, atividadeInicial, quandoTexto, frequentes, liquido, CHAVE_ATIVIDADE, type Atividade } from './inicio-espaco';
import { GUIAS } from './guias-dados';
import { FATURAS } from './faturas-dados';
import { DEVOLUCOES, estadoDev } from './devolucoes-dados';
import { LISTAS } from './lista';
import clock from 'lucide-static/icons/clock.svg?raw';
import store from 'lucide-static/icons/store.svg?raw';
import undo2 from 'lucide-static/icons/undo-2.svg?raw';
import chartSpline from 'lucide-static/icons/chart-spline.svg?raw';
import triangleAlert from 'lucide-static/icons/triangle-alert.svg?raw';
import packageIcon from 'lucide-static/icons/package.svg?raw';
import zap from 'lucide-static/icons/zap.svg?raw';
import search from 'lucide-static/icons/search.svg?raw';
import receipt from 'lucide-static/icons/receipt.svg?raw';
import star from 'lucide-static/icons/star.svg?raw';
import wrench from 'lucide-static/icons/wrench.svg?raw';
import layoutGrid from 'lucide-static/icons/layout-grid.svg?raw';
import truck from 'lucide-static/icons/truck.svg?raw';
import cart from 'lucide-static/icons/shopping-cart.svg?raw';
import arrowRight from 'lucide-static/icons/arrow-right.svg?raw';
import chevronRight from 'lucide-static/icons/chevron-right.svg?raw';
import chevronDown from 'lucide-static/icons/chevron-down.svg?raw';
import settings2 from 'lucide-static/icons/settings-2.svg?raw';
import calendarRange from 'lucide-static/icons/calendar-range.svg?raw';
import mapPin from 'lucide-static/icons/map-pin.svg?raw';
import info from 'lucide-static/icons/info.svg?raw';
import check from 'lucide-static/icons/check.svg?raw';
import circleCheck from 'lucide-static/icons/circle-check.svg?raw';
import rotateCcw from 'lucide-static/icons/rotate-ccw.svg?raw';
import refreshCw from 'lucide-static/icons/refresh-cw.svg?raw';
import x from 'lucide-static/icons/x.svg?raw';
import wifiOff from 'lucide-static/icons/wifi-off.svg?raw';
import lock from 'lucide-static/icons/lock.svg?raw';
import logIn from 'lucide-static/icons/log-in.svg?raw';
import shieldAlert from 'lucide-static/icons/shield-alert.svg?raw';
import circleAlert from 'lucide-static/icons/circle-alert.svg?raw';
import chartNoAxes from 'lucide-static/icons/chart-no-axes-column.svg?raw';
import carFront from 'lucide-static/icons/car-front.svg?raw';
import car from 'lucide-static/icons/car.svg?raw';
import hash from 'lucide-static/icons/hash.svg?raw';
import history from 'lucide-static/icons/history.svg?raw';
import listChecks from 'lucide-static/icons/list-checks.svg?raw';
import sparkles from 'lucide-static/icons/sparkles.svg?raw';
import fileText from 'lucide-static/icons/file-text.svg?raw';

export const IC_PN = { clock, store, undo2, chartSpline, triangleAlert, packageIcon, zap, search, receipt, star, wrench, layoutGrid, truck, cart, arrowRight, chevronRight, chevronDown, settings2, calendarRange, mapPin, info, check, circleCheck, rotateCcw, refreshCw, x, wifiOff, lock, logIn, shieldAlert, circleAlert };
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const btn = (texto: string, icone: string, extra = '', cls = '') => `<button type="button" class="btn pn__btn${cls ? ` ${cls}` : ''}"${extra}>${L(icone, 'btn__icone')}<span class="btn__rotulo">${texto}</span></button>`;
const acao = (texto: string, icone: string, extra = '', cls = '') => btn(texto, icone, extra, `btn--acao ${cls}`.trim());

/* =========================================================
   Os blocos, os atalhos e as definições
   ========================================================= */
export type IdW = 'atalhos' | 'pedidos' | 'atencao' | 'resumo' | 'evolucao';
export const WIDGETS: Record<IdW, [string, string, string]> = {
  atalhos: ['Atalhos', 'Catálogo, documentos, informação técnica e listas', zap],
  pedidos: ['Últimos pedidos', 'Os cinco mais recentes e o estado de cada um', packageIcon],
  atencao: ['Requer a tua atenção', 'Faturas vencidas, recolhas, devoluções e entregas', triangleAlert],
  resumo: ['Resumo', 'Guias, devoluções, pesquisas, listas e peças frequentes', sparkles],
  evolucao: ['Atividade de compras', 'O valor e o número de pedidos no período', chartSpline],
};
/** (V9) os blocos que as definições ligam e desligam (o gráfico saiu do Início) */
export const ORDEM_W: IdW[] = ['atalhos', 'pedidos', 'atencao', 'resumo'];
export type IdAtalhoPn = 'pesquisa' | 'lista' | 'faturas' | 'guias' | 'tecnica' | 'pedidos' | 'devolucoes' | 'catalogo' | 'carrinho';
export const ATALHOS_PN: Record<IdAtalhoPn, [string, string]> = {
  pesquisa: ['Pesquisar peças', search], lista: ['Minha lista', star], faturas: ['Faturas', receipt], guias: ['Guias de remessa', truck], tecnica: ['Informação técnica', wrench],
  pedidos: ['Pedidos', packageIcon], devolucoes: ['Devoluções', undo2], catalogo: ['Catálogo', layoutGrid], carrinho: ['Carrinho', cart],
};
export type PrefsPn = { escondidos: IdW[]; periodo: '7' | '30' | '90'; atalhos: IdAtalhoPn[] };
export const PREFS_PN: PrefsPn = { escondidos: [], periodo: '30', atalhos: ['pesquisa', 'lista', 'faturas', 'guias', 'tecnica'] };
/** Por pessoa e por conta. Num servidor, no perfil; aqui, no navegador. */
export const CHAVE_PN = 'goparts:painel:ff-porto:v4'; // v4 a 21 out. (V9): atalhos e resumo; sem gráfico nem período

/** Os estados do Início (10.x). */
export type EstadoPn = '' | 'carga' | 'atualizar' | 'sem-pedidos' | 'sem-alertas' | 'sem-historico' | 'parcial' | 'graf-erro' | 'offline' | 'sessao' | 'sem-permissao' | 'periodo-vazio' | 'graf-carga' | 'nav-erro' | 'personalizar' | 'pedidos-n';

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
  /* (V8) o último valor destacado a laranja, com o número ao lado */
  const vFim = acumulado[n - 1] ?? 0, tFim = metrica === 'valor' ? eixo(Math.round(vFim), 'valor').replace(/^(\d+) €$/, (_m, v) => `${Number(v).toLocaleString('pt-PT')} €`) : String(vFim);
  const fim = d ? `<g class="pn__g-fim" transform="translate(${xs[n - 1].toFixed(1)} ${ys[n - 1].toFixed(1)})"><circle class="pn__g-fim-halo" r="10"/><circle r="5"/><text class="pn__g-fim-t" x="-10" y="-14" text-anchor="end">${tFim}</text></g>` : '';
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
function falha(o: string, w: string, texto = 'O resto do Início continua a funcionar.'): string {
  return `<div class="pn__falha" role="alert"><span class="pn__falha-icone">${L(circleAlert)}</span><div><b>Não foi possível carregar ${o}.</b><span>${texto}</span></div>${btn('Tentar novamente', rotateCcw, ` data-pn-tentar="${w}"`, 'pn__btn--leve')}</div>`;
}
const vazio = (ic: string, texto: string, accoes = '') => `<div class="pn__vazio">${L(ic)}<p>${texto}</p>${accoes}</div>`;
function bloco(id: IdW, corpo: string, p: PrefsPn, accoes = ''): string {
  const [nome, , ic] = WIDGETS[id];
  return `<section class="pn__w pn__w--${id}" data-w="${id}" aria-labelledby="pn-${id}-t"${p.escondidos.includes(id) ? ' hidden' : ''}>
    <header class="pn__w-cabeca"><h2 id="pn-${id}-t">${L(ic)}${nome}</h2>${accoes ? `<div class="pn__w-accoes">${accoes}</div>` : ''}</header>
    <div class="pn__w-corpo" data-corpo>${corpo}</div>
  </section>`;
}

/* ---------- os quatro números ---------- */
/* (V8) cada número com a sua cor: azul (em curso), azul vivo (transporte), verde (recolha), âmbar (devoluções) */
const KPI_IC: Record<Kpi['id'], string> = { curso: packageIcon, transporte: truck, recolha: store, devolucoes: undo2 };
export function kpiHtml(k: Kpi, i: number, carga = false): string {
  const zero = !carga && !k.valor;
  return `<li style="--i:${i}"><button type="button" class="pn__kpi pn__kpi--${k.id}" data-kpi="${k.id}" data-pn-ir="${k.ir[0]}"${k.ir[1] ? ` data-etapa="${k.ir[1]}"` : ''}${carga || zero ? ' disabled' : ''} aria-describedby="pn-kpi-${k.id}-def">
    <span class="pn__kpi-linha"><b class="pn__kpi-valor" data-valor="${k.valor}">${carga ? '–' : String(k.valor).padStart(2, '0')}</b><span class="pn__kpi-icone">${L(KPI_IC[k.id])}</span></span>
    <span class="pn__kpi-nome">${k.nome}</span>
    <span class="pn__kpi-sub" data-sub>${carga ? '' : k.sub ?? ''}</span>
    <span class="sr-only" id="pn-kpi-${k.id}-def">${k.def}</span>
    ${zero || carga ? '' : L(arrowRight, 'pn__kpi-seta')}
  </button></li>`;
}
export function kpisHtml(e: EstadoPn = ''): string {
  const ks = kpis().map((k) => (e === 'sem-pedidos' ? { ...k, valor: 0, texto: '0', sub: k.id === 'devolucoes' ? 'Nenhuma por tratar' : 'Ainda sem pedidos' } : k));
  return `<section class="pn__resumo" aria-label="Resumo dos pedidos e devoluções"><ul class="pn__kpis" role="list">${ks.map((k, i) => kpiHtml(k, i, e === 'carga')).join('')}</ul></section>`;
}

/* ---------- os últimos pedidos (o centro do Início) ----------
   (V8) o estado em pílula com a cor do passo; a linha abre-se e mostra o percurso (só os passos que os dados têm, o
   atual em destaque). «Ver» leva ao pedido. */
const ESTADO_NOME: Record<string, string> = { preparacao: 'Em preparação', preparado: 'Preparado', expedido: 'Em transporte', recolher: 'Disponível para recolha' };
const nomeEstado = (x: (typeof LINHAS_TODAS)[number]) => x.etapa.k === 'concluido' ? (x.p.percurso[x.p.percurso.length - 1][0] || 'Entregue') : x.etapa.k === 'expedido' && /parte/i.test(x.etapa.nome) ? 'Em transporte (parte)' : ESTADO_NOME[x.etapa.k] ?? x.etapa.nome;
const PASSO_NOME: Record<string, string> = { Recebido: 'Recebido', Separado: 'Em preparação', 'Em separação': 'Em preparação', 'Pronto a levantar': 'Disponível para recolha' };
function percursoHtml(x: (typeof LINHAS_TODAS)[number]): string {
  const atual = x.p.percurso.reduce((k, s, i) => (s[1] ? i : k), 0);
  return `<ol class="pn__percurso" aria-label="Percurso do pedido ${x.l.num}">${x.p.percurso.map(([nome, quando, nota], i) => `<li class="${i < atual ? 'is-feito' : i === atual ? 'is-atual' : 'is-por'}" style="--i:${i}"${i === atual ? ' aria-current="step"' : ''}>
    <span class="pn__passo-ponto" aria-hidden="true">${i <= atual ? L(check) : ''}</span><b>${esc(PASSO_NOME[nome] ?? nome)}</b><time>${quando || 'Ainda não'}</time>${nota ? `<small>${esc(nota)}</small>` : ''}</li>`).join('')}</ol>`;
}
export function pedidosHtml(prefs: PrefsPn, e: EstadoPn = ''): string {
  const linhas = e === 'sem-pedidos' ? [] : LINHAS_TODAS.slice(0, 5);
  const corpo = e === 'carga' ? `<ul class="pn__esq-linhas">${esq(5, 'pn__esq-linha')}</ul>`
    : e === 'sem-permissao' ? `<div class="pn__falha pn__falha--neutra" role="note"><span class="pn__falha-icone">${L(shieldAlert)}</span><div><b>A tua conta não tem acesso aos pedidos.</b><span>Os pedidos são da conta da oficina: pede o acesso ao administrador da conta.</span></div></div>`
    : !linhas.length ? vazio(packageIcon, 'Ainda não fizeste pedidos. O primeiro começa na pesquisa.', acao('Pesquisar peças', search, ' data-pn-ir="pesquisa"'))
    : `<table class="pn__tabela"><caption class="sr-only">Os ${linhas.length} pedidos mais recentes. Cada linha abre o pedido.</caption>
      <thead><tr><th scope="col">Pedido</th><th scope="col">Data</th><th scope="col" class="pn__num">Artigos</th><th scope="col" class="pn__num">Valor</th><th scope="col">Estado</th><th scope="col"><span class="sr-only">Ação</span></th></tr></thead>
      <tbody>${linhas.map((x, i) => `<tr class="pn__linha" data-linha="${i}" style="--i:${i}">
        <th scope="row" class="pn__pedido"><button type="button" class="pn__abrir" aria-expanded="false" aria-controls="pn-det-${i}" aria-label="Percurso do pedido ${x.l.num}">${L(chevronDown, 'pn__abrir-seta')}<span>${x.l.num}</span></button></th>
        <td data-r="Data">${x.l.data}</td><td class="pn__num" data-r="Artigos">${x.artigos}</td><td class="pn__num pn__valor" data-r="Valor">${euros(x.valor)}</td>
        <td data-r="Estado"><span class="pn__etapa pn__etapa--${x.etapa.k}"><i aria-hidden="true"></i>${nomeEstado(x)}</span></td>
        <td class="pn__acao-c"><button type="button" class="pn__ver" data-abrir-pedido="${x.l.num}" aria-label="Ver o pedido ${x.l.num}"><span>Ver</span>${L(chevronRight)}</button></td>
      </tr>
      <tr class="pn__linha-det" id="pn-det-${i}" hidden><td colspan="6">${percursoHtml(x)}</td></tr>`).join('')}</tbody></table>`;
  return bloco('pedidos', corpo, prefs, `<button type="button" class="pn__mais" data-pn-ir="pedidos">Ver todos os pedidos${L(arrowRight)}</button>`);
}

/* ---------- requer a tua atenção (por importância; cada um abre o pormenor) ---------- */
export function atencaoHtml(prefs: PrefsPn, e: EstadoPn = ''): string {
  const lista = e === 'sem-alertas' || e === 'sem-pedidos' ? [] : alertasPn();
  const grupos = (['urgente', 'tratar', 'info'] as GrupoAlerta[]).map((g) => [g, lista.filter((a) => a.grupo === g)] as const).filter(([, l]) => l.length);
  let n = 0;
  const corpo = e === 'carga' ? `<ul class="pn__alertas">${esq(3, 'pn__alerta-li')}</ul>`
    : e === 'parcial' ? falha('os alertas', 'atencao', 'As faturas e as devoluções não responderam; não dá para dizer se há algo pendente.')
    : !lista.length ? `<p class="pn__tudo-bem">${L(circleCheck)}<span><b>Está tudo em dia.</b> Não há nada à espera de ti.</span></p>`
    : grupos.map(([g, l]) => `<div class="pn__grupo pn__grupo--${g}"><h3 class="pn__grupo-t">${NOME_GRUPO[g]}</h3><ul class="pn__alertas" role="list">${l.map((a) => { const id = `pn-al-${++n}`; return `<li class="pn__alerta pn__alerta--${g}">
        <button type="button" class="pn__alerta-cab" aria-expanded="false" aria-controls="${id}"><span class="pn__alerta-ponto" aria-hidden="true"></span><span class="pn__alerta-texto"><b>${esc(a.titulo)}</b><span>${esc(a.info)} · ${esc(a.data)}</span></span>${L(chevronDown, 'pn__alerta-seta')}</button>
        <div class="pn__alerta-det" id="${id}" hidden><dl>${a.detalhe.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl><button type="button" class="btn pn__btn pn__btn--leve${g === 'urgente' ? ' btn--acao' : ''}"${a.attr}>${L(arrowRight, 'btn__icone')}<span class="btn__rotulo">${a.acao}</span></button></div>
      </li>`; }).join('')}</ul></div>`).join('');
  return bloco('atencao', corpo, prefs, lista.length && e !== 'carga' && e !== 'parcial' ? `<span class="pn__conta">${lista.length}</span>` : '');
}

/* ---------- atividade de compras (o período é o do cabeçalho) ---------- */
const SEG = (nome: string, attr: string, opcoes: [string, string][], valor: string) => `<div class="pn__seg" role="radiogroup" aria-label="${nome}">${opcoes.map(([v, t]) => `<button type="button" role="radio" class="pn__seg-op" ${attr}="${v}" aria-checked="${v === valor}" tabindex="${v === valor ? 0 : -1}">${t}</button>`).join('')}<i class="pn__seg-marca" aria-hidden="true"></i></div>`;
export function evolucaoHtml(pg: Periodo, prefs: PrefsPn, e: EstadoPn = '', metrica: Metrica = 'valor'): string {
  const pts = serie(pg);
  const accoes = SEG('O que mostra o gráfico', 'data-metrica', [['valor', 'Valor'], ['pedidos', 'N.º de pedidos']], metrica);
  const nada = !pts.some((x) => x.pedidos), semHist = pts.every((x) => x.semDados);
  const corpo = e === 'carga' || e === 'graf-carga' ? `<div class="pn__graf pn__graf--carga" aria-busy="true" role="status"><span class="sr-only">A carregar o gráfico…</span><i class="pn__esq-graf"></i></div>`
    : e === 'graf-erro' ? falha('a atividade de compras', 'evolucao')
    : e === 'sem-historico' || e === 'sem-pedidos' ? vazio(chartNoAxes, 'Ainda não há histórico de compras. O gráfico começa com o primeiro pedido.')
    : `<div class="pn__graf" data-graf data-metrica="${metrica}" data-de="${pg.de}" data-ate="${pg.ate}" tabindex="0" role="group" aria-roledescription="gráfico" aria-label="Atividade de compras, ${textoPeriodo(pg)}: ${totalGrafico(pts, metrica)}. Usa as setas para percorrer os dias." aria-describedby="pn-graf-nota">
        <p class="pn__graf-total"><b data-graf-total>${totalGrafico(pts, metrica)}</b><span>${metrica === 'valor' ? 'sem IVA' : ''} · ${textoPeriodo(pg)}</span></p>
        <div class="pn__graf-tela" data-graf-tela>${desenharGrafico(pts, metrica, 760, 220).svg}</div>
        <div class="pn__dica" data-dica hidden></div>
        ${semHist ? `<p class="pn__graf-nada">Sem histórico neste período: os pedidos começam a ${numerica(INICIO_PEDIDOS)}.</p>` : nada ? '<p class="pn__graf-nada">Nenhum pedido neste período.</p>' : ''}
      </div>
      <p class="pn__nota" id="pn-graf-nota">${L(info)}<span>Acumulado pela data de cada pedido. Dados de exemplo até ${numerica(HOJE)}.</span></p>`;
  return bloco('evolucao', corpo, prefs, accoes);
}

/* ---------- (V9) «O que procuras hoje?»: os três cartões grandes da pesquisa ---------- */
const MODOS: [string, string, string, string, 'azul' | 'laranja'][] = [
  ['Por matrícula', 'Identifica o veículo pela matrícula ou pelo n.º de chassis (VIN).', 'Identificar veículo', carFront, 'azul'],
  ['Por veículo', 'Escolhe a marca, o modelo e a motorização.', 'Selecionar veículo', car, 'azul'],
  ['Por referência', 'Encontra a peça pela referência, pela marca ou pela descrição.', 'Pesquisar referência', hash, 'laranja'],
];
export function procuraHtml(): string {
  return `<section class="pn__procura" aria-labelledby="pn-procura-t">
    <h2 class="pn__sec-t" id="pn-procura-t">O que procuras hoje?</h2>
    <ul class="pn__modos" role="list">${MODOS.map(([t, d, ir, ic, cor], i) => `<li style="--i:${i}"><button type="button" class="pn__modo pn__modo--${cor}" data-pn-modo="${i}">
      <span class="pn__modo-icone">${L(ic)}</span>
      <span class="pn__modo-texto"><b>${t}</b><span>${d}</span></span>
      <span class="pn__modo-ir">${ir}${L(arrowRight)}</span>
    </button></li>`).join('')}</ul>
  </section>`;
}

/* ---------- (V9) os atalhos: sete cartões, cada um com o que interessa dele ---------- */
type Atalho = { id: IdAtalhoPn; nome: string; desc: string; ic: string; meta: string; tom?: 'erro' | 'aviso' | 'ok' };
function atalhosV9(): Atalho[] {
  const emCurso = LINHAS_TODAS.filter((x) => x.etapa.k !== 'concluido').length;
  const vencidas = FATURAS.filter((f) => f.pagamento === 'vencida').length;
  const devAbertas = DEVOLUCOES.filter((d) => estadoDev(d) !== 'creditada').length;
  const rascunho = LISTAS.filter((l) => l.estado === 'rascunho').length;
  return [
    { id: 'catalogo', nome: 'Catálogo', desc: 'Marcas, modelos e grupos de montagem', ic: layoutGrid, meta: 'Por veículo ou universal' },
    { id: 'pedidos', nome: 'Pedidos', desc: 'Acompanhar e repetir encomendas', ic: packageIcon, meta: emCurso ? `${emCurso} em curso` : 'Nenhum em curso', tom: emCurso ? 'aviso' : undefined },
    { id: 'guias', nome: 'Guias de remessa', desc: 'O que saiu do armazém, guia a guia', ic: truck, meta: `Última a ${GUIAS[0]?.data ?? '—'}` },
    { id: 'faturas', nome: 'Faturas', desc: 'Faturas, notas de crédito e pagamentos', ic: receipt, meta: vencidas ? `${vencidas} ${vencidas === 1 ? 'vencida' : 'vencidas'}` : 'Tudo pago', tom: vencidas ? 'erro' : 'ok' },
    { id: 'devolucoes', nome: 'Devoluções', desc: 'Criar e seguir devoluções', ic: undo2, meta: devAbertas ? `${devAbertas} em aberto` : 'Nenhuma em aberto', tom: devAbertas ? 'aviso' : undefined },
    { id: 'tecnica', nome: 'Informação técnica', desc: 'Esquemas, fusíveis e manuais', ic: wrench, meta: 'Por veículo do catálogo' },
    { id: 'lista', nome: 'Minha lista', desc: 'Orçamentos com peças e mão-de-obra', ic: star, meta: rascunho ? `${rascunho} em rascunho` : `${LISTAS.length} listas` },
  ];
}
export function atalhosHtml(prefs: PrefsPn): string {
  return `<section class="pn__w pn__w--atalhos pn__sec" data-w="atalhos" aria-labelledby="pn-atalhos-t"${prefs.escondidos.includes('atalhos') ? ' hidden' : ''}>
    <h2 class="pn__sec-t" id="pn-atalhos-t">Atalhos</h2>
    <ul class="pn__cartoes" role="list">${atalhosV9().map((a, i) => `<li style="--i:${i}"><button type="button" class="pn__cartao" data-pn-atalho="${a.id}">
      <span class="pn__cartao-icone">${L(a.ic)}</span>
      <b class="pn__cartao-nome">${a.nome}</b>
      <span class="pn__cartao-desc">${a.desc}</span>
      <span class="pn__cartao-meta${a.tom ? ` pn__cartao-meta--${a.tom}` : ''}">${a.meta}</span>
      ${L(arrowRight, 'pn__cartao-seta')}
    </button></li>`).join('')}</ul>
  </section>`;
}

/* ---------- (V9) o resumo: cartões compactos ---------- */
const lerAtividade = (): Atividade[] => { try { const x = localStorage.getItem(CHAVE_ATIVIDADE); return x ? (JSON.parse(x) as Atividade[]) : atividadeInicial(); } catch { return atividadeInicial(); } };
function mini(id: string, titulo: string, ic: string, corpo: string, mais: string): string {
  return `<article class="pn__mini" aria-labelledby="pn-mini-${id}"><header class="pn__mini-cabeca"><span class="pn__mini-icone">${L(ic)}</span><h3 id="pn-mini-${id}">${titulo}</h3></header>${corpo}<footer class="pn__mini-pe">${mais}</footer></article>`;
}
const miniLinha = (attr: string, a: string, b: string, c = '') => `<li><button type="button" class="pn__mini-linha"${attr}><span><b>${esc(a)}</b><small>${esc(b)}</small></span>${c ? `<em>${esc(c)}</em>` : ''}</button></li>`;
const miniVazio = (t: string) => `<p class="pn__mini-vazio">${t}</p>`;
export function resumoHtml(prefs: PrefsPn, e: EstadoPn = ''): string {
  const sem = e === 'sem-pedidos';
  const carga = e === 'carga';
  const lista = (itens: string[], vazio: string) => carga ? `<ul class="pn__mini-lista">${esq(3, 'pn__mini-esq')}</ul>` : itens.length ? `<ul class="pn__mini-lista" role="list">${itens.join('')}</ul>` : miniVazio(vazio);
  const guias = sem ? [] : GUIAS.slice(0, 3).map((g) => miniLinha(` data-ir-doc="guias" data-chave="goparts:abrir-guia" data-valor="${g.num}"`, g.num, `${g.data} · ${g.pedido}`, g.tipo === 'credito' ? 'Crédito' : g.armazem));
  const NOME_DEV: Record<string, string> = { rascunho: 'Por enviar', enviada: 'Enviada', creditada: 'Creditada' };
  const devs = sem ? [] : DEVOLUCOES.filter((d) => estadoDev(d) !== 'creditada').map((d) => miniLinha(' data-pn-atalho="devolucoes"', d.num, d.obs, NOME_DEV[estadoDev(d)]));
  const agora = Date.now();
  const pesq = (e === 'sem-pedidos' ? [] : lerAtividade()).slice(0, 3).map((a) => miniLinha(' data-pn-atalho="pesquisa"', a.titulo, a.sub, quandoTexto(a.quando, agora)));
  const listas = (sem ? [] : LISTAS.filter((l) => l.estado !== 'enviada')).slice(0, 3).map((l) => miniLinha(' data-pn-atalho="lista"', l.nome, `${l.pecas.length} ${l.pecas.length === 1 ? 'peça' : 'peças'} · ${l.atualizada}`, l.estado === 'rascunho' ? 'Rascunho' : 'Guardada'));
  const freq = (sem ? [] : frequentes()).slice(0, 3).map((f) => miniLinha(' data-pn-atalho="pesquisa"', `${f.r[1]} ${f.r[2]}`, f.r[3], euros(liquido(f.r))));
  return `<section class="pn__w pn__w--resumo pn__sec" data-w="resumo" aria-labelledby="pn-resumo-t"${prefs.escondidos.includes('resumo') ? ' hidden' : ''}>
    <h2 class="pn__sec-t" id="pn-resumo-t">Resumo</h2>
    <div class="pn__minis">
      ${mini('guias', 'Últimas guias', truck, lista(guias, 'Ainda não há guias de remessa.'), `<button type="button" class="pn__mais" data-pn-atalho="guias">Ver guias${L(arrowRight)}</button>`)}
      ${mini('devolucoes', 'Devoluções em curso', undo2, lista(devs, 'Nenhuma devolução em curso.'), `<button type="button" class="pn__mais" data-pn-atalho="devolucoes">Ver devoluções${L(arrowRight)}</button>`)}
      ${mini('pesquisas', 'Últimas pesquisas', history, lista(pesq, 'As pesquisas que fizeres aparecem aqui.'), `<button type="button" class="pn__mais" data-pn-atalho="pesquisa">Pesquisar${L(arrowRight)}</button>`)}
      ${mini('listas', 'Listas guardadas', listChecks, lista(listas, 'Ainda não guardaste listas.'), `<button type="button" class="pn__mais" data-pn-atalho="lista">Abrir a Minha lista${L(arrowRight)}</button>`)}
      ${mini('frequentes', 'Peças frequentes', fileText, lista(freq, 'As peças que pedes mais aparecem aqui.'), `<button type="button" class="pn__mais" data-pn-atalho="catalogo">Abrir o catálogo${L(arrowRight)}</button>`)}
    </div>
  </section>`;
}

/* =========================================================
   O cabeçalho, os avisos de cima, a gaveta e o ecrã
   ========================================================= */
/* (21 out., briefing do cabeçalho) a saudação, uma linha a dizer o que é, o contexto (conta e armazém) numa linha
   curta; à direita uma só ação principal e, só em ícone, atualizar e as definições. Saíram a data, o «Continuar…»
   comprido e o rolamento decorativo (o rolamento vive agora na secção 3D, mais abaixo). Depois saiu também o
   «Pesquisar peças» (ela: «está redundante» — a pesquisa do topo e o menu já levam lá). */
export function cabecaHtml(_p: Periodo, e: EstadoPn = '', agora = Date.now()): string {
  const d = new Date(agora), hora = d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  return `<header class="pn__cabeca">
    <div class="pn__ola-caixa"><div class="pn__ola">
      <h1 class="pn__titulo"><span data-saudacao>${saudacao(d.getHours())}</span>, Fernando</h1>
      <p class="pn__sub">Resumo da tua atividade</p>
      <p class="pn__contexto"><span>${L(store)}Conta Porto</span><span class="pn__contexto-sep" aria-hidden="true">·</span><span class="pn__armazem" title="Armazém de saída">${L(mapPin)}Armazém Porto (1)</span></p>
    </div>
    <div class="pn__rolamento" data-rol-cabeca aria-hidden="true"><canvas class="pn__rolamento-tela"></canvas></div></div>
    <div class="pn__controlos">
      <span class="pn__atualizado sr-only" data-atualizado role="status">${e === 'atualizar' ? `${L(refreshCw, 'pn__roda')}A atualizar…` : `Atualizado às ${hora}`}</span>
      <button type="button" class="pn__icone" data-pn-atualizar aria-label="Atualizar os dados (atualizado às ${hora})" title="Atualizado às ${hora}"${e === 'atualizar' || e === 'offline' ? ' disabled' : ''}>${L(refreshCw)}</button>
      <button type="button" class="pn__icone" data-pn-personalizar aria-haspopup="dialog" aria-label="Definições do Início" title="Definições do Início">${L(settings2)}</button>
    </div>
  </header>
  <div class="pn__avisos" data-avisos aria-live="polite">${e === 'offline' ? avisoOffline(hora) : e === 'nav-erro' ? avisoNav('P2024/001233') : ''}</div>`;
}
export const avisoOffline = (hora: string) => `<p class="pn__aviso-linha pn__aviso-linha--offline" role="status">${L(wifiOff)}<span><b>Sem ligação.</b> Estás a ver os dados das ${hora}; atualizam-se quando a ligação voltar.</span></p>`;
export const avisoNav = (num: string) => `<p class="pn__aviso-linha pn__aviso-linha--erro" role="alert">${L(circleAlert)}<span><b>Não foi possível abrir o pedido ${num}.</b> Continuas no Início; tenta de novo.</span><button type="button" class="pn__mais" data-abrir-pedido="${num}">Tentar de novo${L(rotateCcw)}</button><button type="button" class="pn__icone" data-pn-fechar-aviso aria-label="Fechar o aviso">${L(x)}</button></p>`;
export function gavetaHtml(p: PrefsPn, aberta = false): string {
  return `<div class="pn__gaveta" data-por-cima role="dialog" aria-modal="true" aria-labelledby="pn-g-t"${aberta ? '' : ' hidden'}>
    <div class="pn__veu" data-pn-fechar></div>
    <div class="pn__gaveta-caixa">
      <header class="pn__gaveta-cabeca"><h2 id="pn-g-t">${L(settings2)}Definições do Início</h2>${btn('Fechar', x, ' data-pn-fechar')}</header>
      <div class="pn__gaveta-corpo">
        <section aria-labelledby="pn-g-blocos"><h3 id="pn-g-blocos">Blocos à vista</h3><p class="pn__ajuda">O cabeçalho fica sempre.</p>
          <ul class="pn__ordem" role="list">${ORDEM_W.map((id) => `<li class="pn__ordem-li"><span class="pn__ordem-texto">${L(WIDGETS[id][2])}<b>${WIDGETS[id][0]}</b><small>${WIDGETS[id][1]}</small></span>
            <label class="pn__interruptor"><input type="checkbox" data-pn-mostrar="${id}"${p.escondidos.includes(id) ? '' : ' checked'}><span class="sr-only">Mostrar ${WIDGETS[id][0]}</span><i aria-hidden="true"></i></label></li>`).join('')}</ul></section>
      </div>
      <footer class="pn__gaveta-pe">${btn('Repor as definições', rotateCcw, ' data-pn-repor')}${acao('Concluído', check, ' data-pn-fechar')}</footer>
    </div>
  </div>`;
}
/** A sessão expirou: o Início fica atrás, inerte, e o diálogo pede para entrar outra vez. */
const sessaoHtml = () => `<div class="pn__gaveta pn__sessao" data-por-cima role="alertdialog" aria-modal="true" aria-labelledby="pn-s-t" aria-describedby="pn-s-d"><div class="pn__veu"></div>
  <div class="pn__dialogo"><span class="pn__dialogo-icone">${L(lock)}</span><h2 id="pn-s-t">A tua sessão expirou.</h2><p id="pn-s-d">Por segurança, entra outra vez. Voltas ao Início, onde estavas.</p>${acao('Iniciar sessão', logIn, ' data-ir="entrada"')}</div></div>`;
export function blocosPn(p: Periodo, prefs: PrefsPn, e: EstadoPn = '', metrica: Metrica = 'valor'): string {
  void p; void metrica;
  return `${atalhosHtml(prefs)}<div class="pn__centro" data-pn-grelha>${pedidosHtml(prefs, e)}${atencaoHtml(prefs, e)}</div>${resumoHtml(prefs, e)}`;
}
/** O Início (ou um estado dele). */
export function painelV5(e: EstadoPn = ''): string {
  const prefs = structuredClone(PREFS_PN);
  const p = e === 'periodo-vazio' ? periodo('pers', INICIO_PEDIDOS - 40, INICIO_PEDIDOS - 10) : e === 'sem-historico' ? periodo('90') : periodo(prefs.periodo);
  return `<div class="portal portal--v3 portal--v22 portal--noite portal--ini3 portal--pn portal--pn9">
  <main class="pn"${e ? ` data-estado="${e}"` : ''}${e === 'sessao' ? ' inert aria-hidden="true"' : ''}>
    ${cabecaHtml(p, e)}
    ${blocosPn(p, prefs, e, e === 'pedidos-n' ? 'pedidos' : 'valor')}
  </main>
  ${gavetaHtml(prefs, e === 'personalizar')}${e === 'sessao' ? sessaoHtml() : ''}
  <p class="pn__aviso sr-only" role="status" aria-live="polite" data-pn-aviso></p>
</div>`;
}
export { curta };
