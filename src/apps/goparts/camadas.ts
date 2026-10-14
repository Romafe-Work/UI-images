/* =========================================================
   GOPARTS — os ecrãs iniciais no estilo do getlayers.ai (14 out. 2026)
   Ela: «quero aqui para go parts este tipo de uis https://www.getlayers.ai/ — principalmente
   nos ecrãs iniciais». Versões novas, ao lado das que ela já viu:
     00 · Abertura v4, 00 · A página pública v5 e os quatro ecrãs de entrar v3 (entrar-v22.ts).
   Do getlayers fica a linguagem: o herói num painel de cantos redondos, afastado 16 px das
   margens, com um gradiente granulado que se mexe devagar e segue o rato (WebGL,
   comportamento/camadas.ts); títulos finos (Jost 300) com o fim da frase mais apagado; etiquetas
   em pílula; a barra com o menu numa pílula; cartões com a fotografia, o nome e a categoria em
   letra de máquina; o percurso numerado; perguntas frequentes; o painel final igual ao herói.
   Da Romafe fica o resto: o ROMAFE azul em Motor (nunca em cima de fotografias: a barra é opaca),
   o laranja na ação, só fotografias e o vídeo verdadeiros, e os factos de romafe.com.
   Claro e escuro: o painel é prata no claro e grafite azulado no escuro (tokens em camadas.css).
   ========================================================= */
import { MENU } from './publico';
import catalogoV2 from './portal/catalogo-v2.html?raw';
import { REFERENCIAS, saida, euros } from './portal/catalogo-dados';
import fachada from '../../comum/img/fachada.webp';
import corredor from '../../comum/img/corredor.webp';
import separacao from '../../comum/img/separacao.webp';
import oficina from '../../comum/img/oficina.webp';
import skf from '../../comum/img/skf-paletes.webp';
import tornoVideo from '../../comum/video/torno-anel.webm';
import tornoImg from '../../comum/img/torno-anel.webp';
import arrowRight from 'lucide-static/icons/arrow-right.svg?raw';
import arrowUpRight from 'lucide-static/icons/arrow-up-right.svg?raw';
import logIn from 'lucide-static/icons/log-in.svg?raw';
import userPlus from 'lucide-static/icons/user-plus.svg?raw';
import search from 'lucide-static/icons/search.svg?raw';
import warehouse from 'lucide-static/icons/warehouse.svg?raw';
import shoppingCart from 'lucide-static/icons/shopping-cart.svg?raw';
import truck from 'lucide-static/icons/truck.svg?raw';
import plus from 'lucide-static/icons/plus.svg?raw';
import play from 'lucide-static/icons/play.svg?raw';
import phone from 'lucide-static/icons/phone.svg?raw';

export const L = (raw: string, cls = '') => raw.replace(/<!--[\s\S]*?-->/, '').replace(/\s+class="[^"]*"/, '').replace('<svg', `<svg${cls ? ` class="${cls}"` : ''} aria-hidden="true"`).replace(/\n\s*/g, '');

/** O fundo animado de um painel: o canvas é desenhado por comportamento/camadas.ts; sem WebGL fica o gradiente do CSS. */
export const SHADER = '<canvas class="ly-shader" aria-hidden="true"></canvas><span class="ly-grao" aria-hidden="true"></span>';
/** Um título fino com o fim mais apagado, como o «made easy» do getlayers. */
const titulo = (tag: string, cls: string, forte: string, fraco: string) => `<${tag} class="ly-titulo ${cls}"><span>${forte}</span> <span class="ly-titulo__fraco">${fraco}</span></${tag}>`;
const pilula = (t: string) => `<p class="ly-pilula">${t}</p>`;

/** A marca: o ROMAFE azul em Motor e o GoParts, sempre em fundo liso. */
export const MARCA_LY = (ir = 'publico') => `<a class="ly-marca" href="#" data-ir="${ir}" data-ir-v="v5" data-sem-seta aria-label="Romafe GoParts: a página inicial"><span class="romafe">ROMAFE</span><span class="ly-marca__risco" aria-hidden="true"></span><span class="ly-marca__produto">GoParts</span></a>`;

const barra = `<header class="ly-barra">
  ${MARCA_LY()}
  <nav class="ly-barra__meio" aria-label="Principal">
    <button type="button" class="ly-barra__procura" data-ir="entrada" data-ir-v="v3" data-sem-seta aria-label="Procurar uma referência">${L(search)}<kbd>/</kbd></button>
    <span class="ly-barra__menu"><a href="#" aria-current="page" data-sem-seta>Início</a>${MENU.map(([id, nome]) => `<a href="#" data-ir="${id}">${nome}</a>`).join('')}</span>
  </nav>
  <button type="button" class="btn btn--acao ly-barra__entrar" data-ir="entrada" data-ir-v="v3">${L(logIn, 'btn__icone')}<span class="btn__rotulo">Entrar</span></button>
</header>`;

/* ---------- os cartões: as fotografias da Romafe, com o nome e a categoria ---------- */
const CARTOES: [string, string, string, string, string?][] = [
  [fachada, 'Desde 1945, no Porto', 'A Romafe', 'A fachada da Romafe no Porto'],
  [skf, 'Distribuidor SKF desde 1975', 'SKF', 'Paletes e caixas SKF no armazém da Romafe'],
  [corredor, '6 000 m² de armazém', 'Porto · Sacavém', 'Um corredor do armazém, com caixas SKF'],
  [separacao, 'Pede até às 16h, sai hoje', 'Expedição', 'Uma colaboradora a separar caixas de peças'],
  [oficina, 'Na sua oficina amanhã', 'Entrega', 'Uma oficina com um motor desmontado'],
  [tornoImg, 'Como nasce um rolamento', 'Vídeo', 'Um torno a trabalhar um anel de aço', tornoVideo],
];
const cartao = ([img, nome, cat, alt, video]: (typeof CARTOES)[number], i: number) => `<li class="ly-cartao" style="--i:${i}">
  <a href="#" data-ir="publico-romafe" data-sem-seta class="ly-cartao__ligacao">
    <span class="ly-cartao__media">${video ? `<video class="ly-cartao__video" src="${video}" poster="${img}" muted loop playsinline preload="none" aria-label="${alt}"></video><span class="ly-cartao__selo">${L(play)}Vídeo</span>` : `<img src="${img}" alt="${alt}" loading="lazy">`}</span>
    <span class="ly-cartao__meta"><span class="ly-cartao__nome">${nome}<span class="ly-cartao__seta">${L(arrowRight)}</span></span><span class="ly-cartao__cat">${cat}</span></span>
  </a>
</li>`;

/* ---------- do pedido à oficina: os quatro passos, cada um com o pedaço do GoParts que lhe corresponde ---------- */
const [grupo, , ref, , preco, , porto, sacavem] = REFERENCIAS.find((r) => r[1] === 'SKF' && r[6] > 0)!;
const PASSOS: [string, string, string, string][] = [
  [search, 'Procure', 'Pela referência, pela matrícula ou pela marca e modelo.', `<span class="ly-mini__campo">${L(search)}<span class="ly-mini__escrito">SKF ${ref}</span><i class="ly-mini__cursor"></i></span>`],
  [warehouse, 'Veja o stock', 'O do Porto e o de Sacavém, antes de pedir.', `<span class="ly-mini__linha"><b>Porto</b><span>${porto} un.</span><em>hoje</em></span><span class="ly-mini__linha"><b>Sacavém</b><span>${sacavem} un.</span><em>amanhã</em></span>`],
  [shoppingCart, 'Encomende', 'Com o preço líquido da sua oficina.', `<span class="ly-mini__linha"><b>${grupo}</b><span>${euros(preco)}</span></span><span class="ly-mini__botao">${L(plus)}Encomendar</span>`],
  [truck, 'Receba', 'O que sai do Porto até às 16h chega no dia seguinte.', `<span class="ly-mini__linha"><b>${saida(porto, sacavem)}</b><em>a separar</em></span><span class="ly-mini__barra"><i></i></span>`],
];

/* ---------- referências SKF, como cartões de catálogo ---------- */
const REFS = REFERENCIAS.filter((r) => r[1] === 'SKF').slice(0, 4).map(([g, , r, d, p, , po, sa], i) => `<li class="ly-ref" style="--i:${i}">
  <p class="ly-ref__topo"><span>${g}</span><span>${po + sa} un.</span></p>
  <strong class="ly-ref__nome">SKF ${r}</strong><p class="ly-ref__desc">${d}</p>
  <p class="ly-ref__pe"><span>${euros(p)}</span><span class="ly-ref__sai${po ? ' ly-ref__sai--hoje' : ''}">${saida(po, sa)}</span></p>
</li>`).join('');

const logos = Array.from(catalogoV2.matchAll(/data-nome="([^"]+)">\s*<button[^>]*><span class="cat2__logo"[^>]*>(<svg[\s\S]*?<\/svg>)<\/span>/g))
  .slice(0, 16).map(([, nome, svg]) => `<li>${svg}<span>${nome}</span></li>`).join('');
const nomes = Array.from(catalogoV2.matchAll(/data-nome="([^"]+)">\s*<button[^>]*><span class="cat2__logo"/g)).slice(0, 16).map((m) => m[1]).join(', ');

/* as perguntas: só o que a página pública e o login já dizem */
const PERGUNTAS: [string, string][] = [
  ['Como peço acesso ao GoParts?', 'Em Contactos, com o pedido de acesso, ou pelo telefone +351 226 158 300. A conta fica com os preços da sua oficina.'],
  ['Quando chega o que encomendo?', 'O que estiver no Porto e for pedido até às 16h sai no próprio dia e chega no dia seguinte; o de Sacavém sai na manhã seguinte. O GoParts diz-lhe antes de pedir.'],
  ['Que peças encontro?', '75 000 referências auto: rolamentos, kits de roda e de distribuição, bombas de água, travagem e mais, das marcas que entram na sua oficina.'],
  ['A minha empresa tem conta própria. Como entro?', 'Em «Entrar com a conta da empresa»: escreve o endereço e segue para a página de entrar da empresa, com o segundo fator.'],
  ['Posso vender peças no GoParts?', 'Sim: em «Abrir loja no GoParts», no ecrã de entrar.'],
];

const htmlPublico = `<div class="ly ly-pub">
  ${barra}
  <section class="ly-painel ly-heroi" aria-label="GoParts">
    ${SHADER}
    <div class="ly-heroi__texto">
      ${pilula('Distribuidor SKF desde 1975 · 75 000 referências auto')}
      ${titulo('h1', 'ly-heroi__titulo', 'Peças auto,', 'com o stock à vista.')}
      <p class="ly-heroi__lead">O stock do Porto e de Sacavém e o preço líquido da sua oficina. Encomende até às 16h e sai hoje.</p>
      <div class="ly-heroi__accoes">
        <button type="button" class="btn btn--acao ly-cta" data-ir="entrada" data-ir-v="v3"><span class="btn__rotulo">Entrar no GoParts</span><span class="ly-cta__disco">${L(logIn, 'btn__icone')}</span></button>
        <button type="button" class="btn ly-cta ly-cta--vidro" data-ir="publico-contactos">${L(userPlus, 'btn__icone')}<span class="btn__rotulo">Pedir acesso</span></button>
      </div>
    </div>
    <ul class="ly-heroi__factos" aria-label="A Romafe">
      <li><b data-contar="75000" data-mil>0</b> referências</li><li><b data-contar="14000" data-mil data-mais>0</b> clientes</li><li><b data-contar="6000" data-mil data-mais>0</b> m² de armazém</li><li><b>Porto · Sacavém</b></li>
    </ul>
  </section>

  <section class="ly-sec" aria-label="A Romafe">
    <div class="ly-sec__cabeca">
      <div>${pilula('Oitenta anos de rolamentos')}${titulo('h2', '', 'A Romafe,', 'por dentro.')}</div>
      <a href="#" class="ly-sec__todos" data-ir="publico-romafe">A Romafe${L(arrowRight)}</a>
    </div>
    <ul class="ly-grelha">${CARTOES.map(cartao).join('')}</ul>
  </section>

  <section class="ly-sec" aria-label="Do pedido à oficina">
    <div class="ly-sec__cabeca"><div>${pilula('Em quatro passos')}${titulo('h2', '', 'Do pedido', 'à sua oficina.')}</div></div>
    <ol class="ly-passos">${PASSOS.map(([ic, t, d, mini], i) => `<li class="ly-passo" style="--i:${i}">
      <p class="ly-passo__num">${String(i + 1).padStart(2, '0')}</p>
      <div class="ly-mini" aria-hidden="true">${mini}</div>
      <h3 class="ly-passo__titulo">${L(ic)}${t}</h3><p class="ly-passo__texto">${d}</p>
    </li>`).join('')}</ol>
  </section>

  <section class="ly-sec" aria-label="Referências SKF">
    <div class="ly-sec__cabeca">
      <div>${pilula('SKF CMP desde 2007 · o único em Portugal')}${titulo('h2', '', 'SKF,', 'com o stock à vista.')}</div>
      <a href="#" class="ly-sec__todos" data-ir="publico-marcas">Marcas${L(arrowRight)}</a>
    </div>
    <ul class="ly-refs">${REFS}</ul>
    <p class="sr-only">Marcas de automóveis: ${nomes}.</p><div class="ly-faixa" aria-hidden="true"><ul>${logos}</ul><ul>${logos}</ul></div>
  </section>

  <section class="ly-sec ly-perguntas" aria-label="Perguntas frequentes">
    <div class="ly-sec__cabeca"><div>${titulo('h2', '', 'Perguntas', 'frequentes.')}</div></div>
    <div class="ly-perguntas__lista">${PERGUNTAS.map(([p, r], i) => `<details class="ly-pergunta"${i ? '' : ' open'}><summary>${p}<span class="ly-pergunta__mais">${L(plus)}</span></summary><p>${r}</p></details>`).join('')}</div>
  </section>

  <section class="ly-painel ly-fim" aria-label="Entrar">
    ${SHADER}
    <div class="ly-fim__texto">
      ${titulo('h2', 'ly-fim__titulo', 'Entre no GoParts.', 'Rolling your way.')}
      <p class="ly-heroi__lead">Ainda não tem conta? Peça acesso ou ligue +351 226 158 300.</p>
      <div class="ly-heroi__accoes">
        <button type="button" class="btn btn--acao ly-cta" data-ir="entrada" data-ir-v="v3"><span class="btn__rotulo">Entrar</span><span class="ly-cta__disco">${L(arrowRight, 'btn__icone')}</span></button>
        <button type="button" class="btn ly-cta ly-cta--vidro" data-ir="publico-contactos">${L(arrowUpRight, 'btn__icone')}<span class="btn__rotulo">Contactos</span></button>
      </div>
    </div>
  </section>

  <footer class="ly-rodape">
    ${MARCA_LY()}
    <span>Rua Eng. Ezequiel de Campos, 164-182 · Porto</span>
    <span>ISO 9001 desde 2006</span>
    <a href="tel:+351226158300">${L(phone)}+351 226 158 300</a>
    <span>2026 © Romafe SA</span>
  </footer>
</div>`;

/* ---------- 00 · Abertura v4: o painel do herói, a marca e o lema; a percentagem conta ---------- */
const LINHA = (t: string, i: number) => `<span class="ly-ab__linha"><span style="--i:${i}">${t}</span></span>`;
const htmlAbertura = `<main class="abertura abertura--ly ly" aria-label="GoParts, da Romafe: a abrir">
  <header class="ly-ab__topo">${MARCA_LY()}<button type="button" class="btn ly-cta ly-cta--vidro abertura__saltar" data-ir="publico" data-ir-v="v5"><span class="btn__rotulo">Saltar</span>${L(arrowRight, 'btn__icone')}</button></header>
  <section class="ly-painel ly-ab__painel">
    ${SHADER}
    <div class="ly-ab__centro">
      ${pilula('Desde 1945, no Porto')}
      <h1 class="ly-titulo ly-ab__titulo">${LINHA('Rolling', 0)}${LINHA('<span class="ly-titulo__fraco">your way.</span>', 1)}</h1>
    </div>
    <div class="ly-ab__carga"><span class="abertura__tempo" role="progressbar" aria-label="A carregar"><span></span></span><p>A carregar o GoParts <b class="ab2__pct">0%</b></p></div>
  </section>
</main>`;

export function versaoAberturaLy() {
  return { id: 'v4', nota: 'No estilo do getlayers.ai (14 out.): o painel com o gradiente granulado que se mexe e segue o rato, «Rolling your way.» fino ao centro, a percentagem em letra de máquina; passa à página pública aos 3 s', html: htmlAbertura };
}
export function versaoPublicoLy() {
  return { id: 'v5', nota: 'No estilo do getlayers.ai (14 out.): o herói num painel com o gradiente granulado animado, títulos finos, pílulas, cartões com as fotografias e o vídeo da Romafe, os quatro passos, a SKF, perguntas e o painel final', html: htmlPublico };
}
