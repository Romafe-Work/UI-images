/* =========================================================
   ERP — 00 · Abertura v5 (22 out. 2026), do briefing dela «redesenha o ecrã de abertura do ERP… mais wow,
   premium, moderno e memorável, sem perder o lado profissional e industrial»
   Substitui a v4 (uma só versão). Não é um cartão ao centro: o ecrã parte-se em dois.
     À esquerda — a marca (ROMAFE · ERP), o título «Operação ligada. Decisão rápida.», uma linha de apoio, «Entrar
                  no ERP» (laranja, com o foco a acender uma vez), «Ver módulos» e «Ajuda»; o módulo em foco —
                  Compras — com três números verdadeiros do protótipo (em aprovação, fornecedores ativos,
                  encomendas em curso); e a fila dos módulos (só Compras disponível).
     À direita  — o mapa da operação em isométrico: o núcleo do ERP ao centro, ligado por fluxos às cinco áreas
                  (compras, documentos, armazém, stock, transporte); pequenos pacotes correm devagar nos fluxos e as
                  peças respiram um pouco. Compras é a que está em foco (o laranja).
   «Sistema a ativar» (≈1,2 s, uma vez por sessão): a grelha desenha-se, as áreas acendem uma a uma, os fluxos
   ligam-se ao núcleo e o estado passa a «Sistema ativo». Diferente do Peça A Peça: sem rolamento, sem 3D de
   produto, sem montra — um mapa de operação, interno e de gestão.
   O login é o comum (ROMAFE Identity): sem sessão, «Entrar no ERP» leva lá; com sessão, abre o Início.
   Escuro por omissão; o claro existe (os tokens mudam com o tema).
   ========================================================= */
import type { EcraErp } from './ids';
import { PECAS, caixa } from './abertura-v3';
import { FORNECEDORES, encomendas } from './compras/dominio';
import arrowRight from 'lucide-static/icons/arrow-right.svg?raw';
import layoutGrid from 'lucide-static/icons/layout-grid.svg?raw';
import lifeBuoy from 'lucide-static/icons/life-buoy.svg?raw';
import shoppingCart from 'lucide-static/icons/shopping-cart.svg?raw';
import boxes from 'lucide-static/icons/boxes.svg?raw';
import trendingUp from 'lucide-static/icons/trending-up.svg?raw';
import warehouse from 'lucide-static/icons/warehouse.svg?raw';
import truck from 'lucide-static/icons/truck.svg?raw';
import landmark from 'lucide-static/icons/landmark.svg?raw';
import x from 'lucide-static/icons/x.svg?raw';
import phone from 'lucide-static/icons/phone.svg?raw';
import rotateCw from 'lucide-static/icons/rotate-cw.svg?raw';

const L = (raw: string, cls = '') => raw.replace(/<!--[\s\S]*?-->/, '').replace(/\s+class="lucide lucide-([^"]*)"/, ' data-lucide="$1"').replace(/\s+class="[^"]*"/, '').replace('<svg', `<svg${cls ? ` class="${cls}"` : ''} aria-hidden="true"`).replace(/\n\s*/g, '');

export const VERSAO_ABERTURA_V5 = 'v5';

/* ---------- o mapa: uma grelha isométrica, o núcleo e as cinco áreas, ligados por fluxos ---------- */
const C = Math.cos(Math.PI / 6), S = .5;
const H: [number, number] = [360, 300]; // o núcleo
const AREAS: { id: string; nome: string; p: [number, number]; foco?: boolean }[] = [
  { id: 'compras', nome: 'Compras', p: [170, 190], foco: true },
  { id: 'documento', nome: 'Documentos', p: [560, 170] },
  { id: 'armazem', nome: 'Armazém', p: [600, 400] },
  { id: 'pacote', nome: 'Stock', p: [370, 500] },
  { id: 'transporte', nome: 'Transporte', p: [140, 420] },
];
/** de uma área ao núcleo, só pelas direções da grelha (como num desenho técnico) */
function fluxo([nx, ny]: [number, number]): string {
  const dx = H[0] - nx, dy = H[1] - ny, a = (dx / C + dy / S) / 2;
  const mx = nx + a * C, my = ny + a * S;
  return `M${nx.toFixed(1)} ${ny.toFixed(1)} L${mx.toFixed(1)} ${my.toFixed(1)} L${H[0]} ${H[1]}`;
}
/** (22 out.) ela: «em vez de pontos, mete rolamentos» — o que corre nos fluxos é um rolamento pequeno, de frente
    (anel exterior, sete esferas e anel interior), que gira enquanto anda */
function rolamentoMini(r: number): string {
  const esferas = Array.from({ length: 7 }, (_, k) => { const t = (k / 7) * Math.PI * 2; return `<circle class="ab5__rol-esf" cx="${(Math.cos(t) * r * .62).toFixed(2)}" cy="${(Math.sin(t) * r * .62).toFixed(2)}" r="${(r * .17).toFixed(2)}"/>`; }).join('');
  return `<g class="ab5__rol"><circle class="ab5__rol-ext" r="${r}"/>${esferas}<circle class="ab5__rol-int" r="${(r * .36).toFixed(2)}"/></g>`;
}
function mapa(): string {
  const grelha: string[] = [];
  for (let k = -14; k <= 14; k++) {
    const o = k * 44;
    grelha.push(`<line x1="${(H[0] + o / S * C - 900 * C).toFixed(1)}" y1="${(H[1] - 900 * S).toFixed(1)}" x2="${(H[0] + o / S * C + 900 * C).toFixed(1)}" y2="${(H[1] + 900 * S).toFixed(1)}"/>`);
    grelha.push(`<line x1="${(H[0] + o / S * C + 900 * C).toFixed(1)}" y1="${(H[1] - 900 * S).toFixed(1)}" x2="${(H[0] + o / S * C - 900 * C).toFixed(1)}" y2="${(H[1] + 900 * S).toFixed(1)}"/>`);
  }
  const nucleo = caixa(-46, -46, 0, 92, 92, 12, ' ab5-nucleo') + caixa(-38, -38, 16, 76, 76, 12, ' ab5-nucleo') + caixa(-30, -30, 32, 60, 60, 12, ' ab5-nucleo ab5-nucleo--topo');
  return `<svg class="ab5__mapa" viewBox="0 0 720 620" aria-hidden="true" focusable="false">
    <g class="ab5__grelha">${grelha.join('')}</g>
    <g class="ab5__fluxos">${AREAS.map((a, i) => `<path class="ab5__fluxo${a.foco ? ' is-foco' : ''}" d="${fluxo(a.p)}" pathLength="1" style="--i:${i}"/>`).join('')}</g>
    ${AREAS.map((a, i) => `<g class="ab5__pacote${a.foco ? ' is-foco' : ''}" style="offset-path:path('${fluxo(a.p)}');--i:${i}">${rolamentoMini(a.foco ? 9 : 7.5)}</g>`).join('')}
    <g class="ab5__nucleo" transform="translate(${H[0]} ${H[1]})"><g class="ab5__no-in">${nucleo}<text class="ab5__nucleo-t" y="-78" text-anchor="middle">ERP</text></g></g>
    ${AREAS.map((a, i) => `<g class="ab5__area${a.foco ? ' is-foco' : ''}" transform="translate(${a.p[0]} ${a.p[1]})" style="--i:${i}"><g class="ab5__no-in">
      ${a.foco ? '<ellipse class="ab5__foco" rx="64" ry="34" cy="4"/>' : ''}
      <g transform="scale(1.15)">${PECAS.find((p) => p.id === a.id)!.svg}</g>
      <text class="ab5__area-t" y="${a.foco ? -66 : 58}" text-anchor="middle">${a.nome}${a.foco ? ' · em foco' : ''}</text>
    </g></g>`).join('')}
  </svg>`;
}

/* ---------- os números de Compras: os do protótipo, não inventados aqui ---------- */
function numeros(): [number, number, number] {
  try {
    const l = encomendas();
    return [l.filter((e) => e.estado === 'A aprovar').length, FORNECEDORES.filter((f) => f.ativo).length, l.filter((e) => e.estado === 'Aprovada' || e.estado === 'Emitida' || e.estado === 'Parcialmente recebida').length];
  } catch { return [0, FORNECEDORES.length, 0]; }
}

const MODULOS: [string, string, boolean][] = [['Compras', shoppingCart, true], ['Stocks', boxes, false], ['Vendas', trendingUp, false], ['Armazém', warehouse, false], ['Logística', truck, false], ['Financeiro', landmark, false]];

export type CenarioV5 = 'normal' | 'ativar' | 'a-entrar' | 'sem-sessao' | 'modulos' | 'ajuda' | 'offline' | 'erro' | 'claro';
export type IdAberturaV5 = `ab5-${Exclude<CenarioV5, 'normal'>}`;

function html(cen: CenarioV5): string {
  const [aprovar, forn, curso] = numeros();
  const fases = cen === 'normal' ? '' : cen === 'ativar' ? 'is-a is-b' : 'is-a is-b is-c is-ativo';
  const entrar = cen === 'a-entrar'
    ? `<button type="button" class="btn btn--acao ab5__cta is-a-entrar" disabled aria-busy="true"><span class="ab5__girador" aria-hidden="true"></span><span class="btn__rotulo">A abrir…</span></button>`
    : `<button type="button" class="btn btn--acao ab5__cta" data-ab5-entrar${cen === 'offline' ? ' disabled' : ''}><span class="btn__rotulo">Entrar no ERP</span>${L(arrowRight, 'btn__icone')}</button>`;
  return `<main class="ab5 ${fases}${cen === 'claro' ? ' ab5--claro' : ''}" data-ab5 data-ab5-cenario="${cen}" aria-label="ROMAFE ERP">
  <section class="ab5__lado">
    <header class="ab5__marca"><span class="romafe ab5__romafe">ROMAFE</span><i class="ab5__barra" aria-hidden="true"></i><span class="ab5__erp">ERP<small>Plataforma de gestão</small></span></header>
    <div class="ab5__mensagem">
      <h1 class="ab5__titulo"><span><span>Operação ligada.</span></span><span><span>Decisão rápida.</span></span></h1>
      <p class="ab5__sub">Compras, stock e logística num só sistema.</p>
      <div class="ab5__accoes">
        ${entrar}
        <button type="button" class="btn ab5__sec" data-ab5-painel="modulos" aria-expanded="${cen === 'modulos'}">${L(layoutGrid, 'btn__icone')}<span class="btn__rotulo">Ver módulos</span></button>
        <button type="button" class="ab5__ligacao" data-ab5-painel="ajuda" aria-expanded="${cen === 'ajuda'}">${L(lifeBuoy)}Ajuda</button>
      </div>
      ${cen === 'sem-sessao' ? '<p class="ab5__nota">Ainda sem sessão: «Entrar no ERP» abre o início de sessão ROMAFE.</p>' : cen === 'offline' ? `<p class="ab5__nota ab5__nota--erro">Sem ligação ao servidor. <button type="button" class="ab5__ligacao" data-ab5-repetir>${L(rotateCw)}Tentar de novo</button></p>` : cen === 'erro' ? `<p class="ab5__nota ab5__nota--erro">Não foi possível abrir o ERP (ERP-503). <button type="button" class="ab5__ligacao" data-ab5-repetir>${L(rotateCw)}Tentar de novo</button></p>` : ''}
    </div>
    <section class="ab5__foco-card" aria-label="Hoje em Compras">
      <p class="ab5__foco-titulo">${L(shoppingCart)}<span>Hoje em Compras</span><button type="button" class="ab5__foco-abrir" data-ab5-entrar data-para="compras">Abrir Compras${L(arrowRight)}</button></p>
      <dl class="ab5__numeros">
        <div><dt>Encomendas por aprovar</dt><dd data-ab5-n="aprovar">${aprovar}</dd></div>
        <div><dt>Fornecedores ativos</dt><dd data-ab5-n="forn">${forn}</dd></div>
        <div><dt>Encomendas a caminho</dt><dd data-ab5-n="curso">${curso}</dd></div>
      </dl>
    </section>
    <nav class="ab5__modulos" aria-label="Módulos">${MODULOS.map(([n, i, ok], k) => `<span class="ab5__mod${ok ? ' is-ok' : ''}" style="--i:${k}">${L(i)}${n}${ok ? '' : '<small>em breve</small>'}</span>`).join('')}</nav>
  </section>
  <section class="ab5__visual" aria-hidden="true">
    ${mapa()}
    <p class="ab5__estado"><i></i><span class="ab5__estado-a">A ativar o sistema…</span><span class="ab5__estado-b">Sistema ativo · Armazém 60 · Coimbra</span></p>
  </section>
  <div class="ab5__painel" data-ab5-qual="modulos" role="dialog" aria-label="Módulos do ERP"${cen === 'modulos' ? '' : ' hidden'}>
    <header><h2>Módulos</h2><button type="button" class="ab5__fechar" data-ab5-fechar aria-label="Fechar">${L(x)}</button></header>
    <ul>${MODULOS.map(([n, i, ok]) => `<li class="${ok ? 'is-ok' : ''}">${L(i)}<span>${n}</span>${ok ? `<button type="button" class="btn btn--acao ab5__abrir" data-ab5-entrar data-para="compras"><span class="btn__rotulo">Abrir</span>${L(arrowRight, 'btn__icone')}</button>` : '<small>Em desenvolvimento</small>'}</li>`).join('')}</ul>
  </div>
  <div class="ab5__painel ab5__painel--ajuda" data-ab5-qual="ajuda" role="dialog" aria-label="Ajuda"${cen === 'ajuda' ? '' : ' hidden'}>
    <header><h2>Ajuda</h2><button type="button" class="ab5__fechar" data-ab5-fechar aria-label="Fechar">${L(x)}</button></header>
    <p>Problemas a entrar, ou um módulo que não abre: fale com o apoio da Romafe.</p>
    <a class="ab5__tel" href="tel:+351226158300">${L(phone)}+351 226 158 300</a><small>Dias úteis, das 9h às 18h.</small>
  </div>
</main>`;
}

const NOTA = 'A abertura v5 (22 out., briefing «mais wow, premium e industrial»): a mensagem à esquerda e o mapa da operação em isométrico à direita, com Compras em foco; «Entrar no ERP», «Ver módulos» e «Ajuda»';
export const versaoAberturaV5 = () => ({ id: VERSAO_ABERTURA_V5, nota: NOTA, html: html('normal') });

export function estadosAberturaV5(): EcraErp[] {
  const e = (cen: Exclude<CenarioV5, 'normal'>, nome: string, objetivo: string): EcraErp =>
    ({ id: `ab5-${cen}` as IdAberturaV5, nome, fluxo: 'Entrar', estadoDe: 'abertura', objetivo, versoes: [{ id: VERSAO_ABERTURA_V5, nota: NOTA, html: html(cen) }] });
  return [
    e('ativar', '00.1 · Sistema a ativar', 'A entrada (≈1,2 s): a grelha desenha-se e as áreas acendem uma a uma; o estado diz «A ativar o sistema…».'),
    e('a-entrar', '00.2 · A entrar', 'Depois de «Entrar no ERP», com sessão: o botão em «A abrir…» até o Início estar pronto; depois a marca passa à da barra.'),
    e('sem-sessao', '00.3 · Sem sessão', 'Sem sessão: a mesma composição; uma nota curta diz que «Entrar no ERP» abre o início de sessão ROMAFE.'),
    e('modulos', '00.4 · Ver módulos', 'O painel dos módulos: Compras com «Abrir»; os outros em desenvolvimento.'),
    e('ajuda', '00.5 · Ajuda', 'O painel da ajuda: o apoio da Romafe e o horário.'),
    e('offline', '00.6 · Sem ligação', '«Entrar no ERP» desligado e «Tentar de novo».'),
    e('erro', '00.7 · Não abriu', 'O ERP não respondeu: a referência do erro e «Tentar de novo».'),
    e('claro', '00.8 · Tema claro', 'A mesma abertura no tema claro: fundo cinza-gelo, o mapa a traço azul.'),
  ];
}
