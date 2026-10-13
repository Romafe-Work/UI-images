/* =========================================================
   GOPARTS — 00 · A página pública (13 out. 2026)
   A história desta página, numa linha cada:
     v1 — no estilo dos sites dos vídeos dela (Nike, F1): escuro, letra enorme, colagem de fotos;
     v2 — o reel «LUNEA»: peças desenhadas a transformar-se ao centro e uma lua atrás;
     v3 — a v2 com as fotografias no lugar da lua e as peças mais realistas.
   Ela, da v3: as peças parecem desenho, a peça por cima da fotografia confunde, não parece
   da Romafe, o texto e as letras não convencem — «mete algo da SKF» — «e não faças só na
   página pública, faz o mesmo nas outras páginas, e só quero uma versão».
   Esta é a única: clara como romafe.com (branco, o azul e o laranja da Romafe, o ROMAFE no
   próprio herói), nada desenhado — só fotografias verdadeiras da Romafe, incluindo a das
   paletes SKF de romafe.com —, frases simples e factuais. Do vídeo fica o efeito, não o estilo:
     o herói — a fotografia do corredor abre de cartão para a largura toda com o scroll;
     a história — fica parada enquanto o scroll corre: cada capítulo troca o texto e a
       fotografia entra por baixo da anterior a deslizar (fachada, paletes SKF, corredor,
       separação, oficina);
     a SKF — a fotografia das paletes a toda a largura com o cartão «Distribuidor SKF desde
       1975 · SKF CMP desde 2007» e três referências SKF verdadeiras do catálogo;
     os números contam; as marcas deslizam; no fim, «Entrar no GoParts».
   As páginas do menu (00.1 a 00.4, publico-paginas.ts) usam a mesma linguagem.
   Comportamento: comportamento/publico.ts.
   ========================================================= */
import type { EcraGoParts } from './ids';
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
import arrowUp from 'lucide-static/icons/arrow-up.svg?raw';
import logIn from 'lucide-static/icons/log-in.svg?raw';
import userPlus from 'lucide-static/icons/user-plus.svg?raw';
import award from 'lucide-static/icons/award.svg?raw';
import packageIcon from 'lucide-static/icons/package.svg?raw';

const L = (raw: string, cls = '') => raw.replace(/<!--[\s\S]*?-->/, '').replace(/\s+class="[^"]*"/, '').replace('<svg', `<svg${cls ? ` class="${cls}"` : ''} aria-hidden="true"`).replace(/\n\s*/g, '');
const LINHA = (texto: string, i: number) => `<span class="pub__linha"><span style="--i:${i}">${texto}</span></span>`;

/** A barra de cima, igual em todas as páginas públicas; a atual fica marcada. Nas páginas do menu
 *  as ligações repetem-se, por isso lá levam data-sem-seta (o mapa do fluxo desenha as desta). */
export const MENU: [string, string][] = [['publico-romafe', 'A Romafe'], ['publico-entregas', 'Entregas'], ['publico-marcas', 'Marcas'], ['publico-contactos', 'Contactos']];
/* O scroll é um rolamento (ela, 13 out.: «coloca rolamentos como scroll»): uma linha fina por baixo da barra
   enche a laranja com o scroll, e na ponta um rolamento rola — anda o que se desceu e roda o que andou
   (comportamento/publico.ts). Aço com a luz parada, a folga escura, oito esferas.
   Depois (13 out.: «quero a cena do rolamento desde o início até ao fim, de um ecrã para o outro, ele vai-se
   formando de acordo com o scroll»): monta-se ao longo da visita às cinco páginas — no início só o anel de
   fora; as esferas entram uma a uma; nos Contactos, o anel de dentro; no fim, completo, dá uma volta.
   E «quero em ecrã também»: há outro, maior, dentro do ecrã — na história (a rolar pelos capítulos) e no
   «A seguir» de cada página (a rolar pelo percurso das cinco). A montagem é a das cinco páginas juntas:
   oco no início da página pública, completo no fim dos Contactos. O da barra ficou sempre completo
   («o rolamento no scroll em cima estava top»). */
/* (os ids dos gradientes levam o nome da página: repetidos, o Chrome lia os de um ecrã escondido e não pintava) */
const esferas = (k: string) => Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2; return `<circle class="pub__rolo-esfera" data-a="${a.toFixed(3)}" cx="${(Math.cos(a) * 11.2).toFixed(2)}" cy="${(Math.sin(a) * 11.2).toFixed(2)}" r="3.1" fill="url(#rolo-esfera-${k})"/>`; }).join('');
/** O rolamento, para a barra de cima e para a história (cls diz onde está). */
const rolamentoSvg = (k: string, cls = 'pub__rolo-rolamento') => `<svg class="${cls}" viewBox="-17 -17 34 34" aria-hidden="true">
  <defs><linearGradient id="rolo-aco-${k}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7f9fb"/><stop offset=".4" stop-color="#8a95a0"/><stop offset=".55" stop-color="#e6ebef"/><stop offset="1" stop-color="#4e5761"/></linearGradient>
  <radialGradient id="rolo-esfera-${k}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="#b5bec7"/><stop offset="1" stop-color="#3a424b"/></radialGradient></defs>
  <circle r="14.8" fill="none" stroke="url(#rolo-aco-${k})" stroke-width="2.4"/><circle class="pub__rolo-folga" r="13.6" fill="#1a1f25"/>
  <g class="pub__rolo-gira">${esferas(k)}<g class="pub__rolo-int"><circle r="8.2" fill="url(#rolo-aco-${k})"/><circle r="5" fill="#faf8f5"/><circle r="5" fill="none" stroke="#000" stroke-opacity=".3"/></g></g>
</svg>`;
const ROLO = (k: string) => `<div class="pub__rolo" aria-hidden="true"><i class="pub__rolo-linha"></i>${rolamentoSvg(k)}</div>`;

export const barraPublica = (atual = '', semSeta = false) => `<header class="pub__barra">${ROLO(atual || 'inicio')}
  <a class="pub__marca" href="#" data-ir="publico"${semSeta || !atual ? ' data-sem-seta' : ''} aria-label="Romafe GoParts: a página inicial"><span class="romafe">ROMAFE</span><span class="pub__risco" aria-hidden="true"></span><span class="pub__produto">GoParts</span></a>
  <nav class="pub__nav" aria-label="Principal">${MENU.map(([id, nome]) => `<a href="#" data-ir="${id}"${semSeta ? ' data-sem-seta' : ''}${id === atual ? ' aria-current="page"' : ''}>${nome}</a>`).join('')}</nav>
  <button type="button" class="btn btn--acao pub__entrar" data-ir="entrada"${semSeta ? ' data-sem-seta' : ''}>${L(logIn, 'btn__icone')}<span class="btn__rotulo">Entrar</span></button>
</header>`;
/* A ligação entre as páginas (ela, 13 out.: «quero que haja uma ligação entre as páginas»): cada página acaba
   em «A seguir», com a fotografia da próxima; ao carregar, essa fotografia cresce até ser a fotografia grande
   da página seguinte (View Transitions, comportamento/publico.ts). A ordem é a de uma visita: a página
   pública, A Romafe, Entregas, Marcas, Contactos e, no fim, entrar. */
const SEGUINTE: Record<string, [string, string, string, string]> = {
  publico: ['publico-romafe', 'A Romafe', 'Oitenta anos de rolamentos, máquinas e ferramentas, no Porto.', fachada],
  'publico-romafe': ['publico-entregas', 'Entregas', 'De onde sai cada peça e quando chega à sua oficina.', separacao],
  'publico-entregas': ['publico-marcas', 'Marcas', 'As marcas de automóveis do catálogo, e a SKF.', skf],
  'publico-marcas': ['publico-contactos', 'Contactos', 'O Porto, Sacavém, o telefone e o pedido de acesso.', oficina],
  'publico-contactos': ['entrada', 'Entrar no GoParts', 'Com a sua conta, o stock e os preços da sua oficina.', corredor],
};
export const aSeguir = (atual: string) => {
  const [id, nome, frase, img] = SEGUINTE[atual];
  const ordem = ['publico', 'publico-romafe', 'publico-entregas', 'publico-marcas', 'publico-contactos'];
  return `<section class="pub__seguinte" aria-label="A seguir">
  <a class="pub__seguinte-cartao" href="#" data-ir="${id}">
    <span class="pub__seguinte-texto"><span class="pub__seguinte-kicker">A seguir</span><span class="pub__seguinte-nome">${nome}</span><span class="pub__seguinte-frase">${frase}</span><span class="pub__seguinte-ir">${L(arrowRight)}</span></span>
    <span class="pub__seguinte-foto"><img src="${img}" alt=""></span>
  </a>
  <div class="pub__percurso-pista" aria-hidden="true">${rolamentoSvg('seguinte-' + atual, 'pub__caps-rolo')}</div>
  <ol class="pub__percurso" aria-label="As páginas">${ordem.map((o) => `<li${o === atual ? ' aria-current="step"' : ''}><a href="#" data-ir="${o}" data-sem-seta>${o === 'publico' ? 'Início' : MENU.find((m) => m[0] === o)![1]}</a></li>`).join('')}</ol>
</section>`;
};

export const rodapePublico = `<footer class="pub__rodape"><span>2026 © Romafe SA · Porto</span><span>Distribuidor SKF desde 1975 · ISO 9001 desde 2006 · +351 226 158 300</span></footer>`;

/* os capítulos da história: a fotografia, o número grande, a frase e o texto */
const CAPITULOS: [string, string, string, string, string][] = [
  [fachada, '1945', 'Desde 1945, no Porto.', 'Rolamentos, Máquinas e Ferramentas: é daí que vem o nome. Oitenta anos depois, a mesma casa, na Rua Eng. Ezequiel de Campos.', 'A fachada da Romafe no Porto'],
  [skf, '1975', 'Distribuidor SKF desde 1975.', 'E SKF CMP desde 2007 — o único em Portugal. Rolamentos, kits de roda e de distribuição SKF, com o stock à vista.', 'Paletes e caixas SKF no armazém da Romafe'],
  [corredor, '6 000 m²', 'De armazém, no Porto e em Sacavém.', 'São 75 000 referências auto, com o stock de cada uma à vista no GoParts.', 'Um corredor do armazém, com caixas SKF'],
  [separacao, '16h', 'Pede até às 16h, sai hoje.', 'O que estiver no Porto é separado e sai no próprio dia; o de Sacavém, na manhã seguinte.', 'Uma colaboradora a separar caixas de peças'],
  [oficina, 'Amanhã', 'Na sua oficina amanhã.', 'O GoParts diz-lhe, antes de pedir, de onde sai cada peça e quando chega.', 'Uma oficina com um motor desmontado'],
];

/* o herói: o texto e a fotografia do armazém (ela, 13 out.). O fluxo de cartões que esteve por cima saiu
   («não quero isto»); a ligação entre as páginas faz-se no fim de cada uma, com «A seguir» (aSeguir()). */

/* como nasce um rolamento (ela, 13 out.: «podes meter um vídeo de um rolamento a ser feito… sê criativo»):
   não há vídeo livre de uma fábrica de rolamentos; há o de um torno a trabalhar um anel de aço (Pexels,
   licença livre, também comercial), regravado em WebM a 1280×720. O vídeo começa recortado como um anel —
   um rolamento de frente —, o furo fecha e o anel abre com o scroll; no fim dá lugar às paletes SKF. */
const NASCE = ['Começa num tubo de aço.', 'No torno, ganha a forma do anel.', 'Depois junta-se às esferas e à gaiola.', 'E chega à Romafe, em paletes SKF.'];

/* três referências SKF do próprio catálogo (catalogo-dados.ts) */
const SKF = REFERENCIAS.filter((r) => r[1] === 'SKF').slice(0, 3).map(([grupo, , ref, desc, preco, , porto, sacavem], i) =>
  `<li class="pub__ref" style="--i:${i}"><span class="pub__ref-icone">${L(packageIcon)}</span><p class="pub__ref-grupo">${grupo}</p><strong>SKF ${ref}</strong><p class="pub__ref-desc">${desc}</p><p class="pub__ref-pe"><span class="pub__ref-preco">${euros(preco)}</span><span class="pub__ref-sai${porto ? ' pub__ref-sai--hoje' : ''}">${saida(porto, sacavem)}</span></p></li>`).join('');

/* os logótipos das marcas, os mesmos do Catálogo v2 */
const logos = Array.from(catalogoV2.matchAll(/data-nome="([^"]+)">\s*<button[^>]*><span class="cat2__logo"[^>]*>(<svg[\s\S]*?<\/svg>)<\/span>/g))
  .slice(0, 16).map(([, nome, svg]) => `<li>${svg}<span class="pub__marca-nome">${nome}</span></li>`).join('');

const html = `<div class="pub">
  ${barraPublica()}

  <section class="pub__heroi" aria-label="GoParts">
    <div class="pub__heroi-topo">
    <div class="pub__heroi-texto">
      <p class="pub__kicker">O GoParts é a loja online da <span class="romafe">ROMAFE</span></p>
      <h1 class="pub__titulo">${LINHA('Peças auto com', 0)}${LINHA('o stock à vista.', 1)}</h1>
      <p class="pub__lead">75 000 referências, com o stock do Porto e de Sacavém, o preço líquido da sua oficina e a entrega no dia seguinte.</p>
      <div class="pub__accoes">
        <button type="button" class="btn btn--acao pub__cta" data-ir="entrada">${L(logIn, 'btn__icone')}<span class="btn__rotulo">Entrar no GoParts</span></button>
        <button type="button" class="btn btn--claro pub__cta pub__cta--claro" data-ir="publico-contactos">${L(userPlus, 'btn__icone')}<span class="btn__rotulo">Pedir acesso</span></button>
      </div>
    </div>
    <div class="pub__heroi-foto"><img class="pub__vt" src="${corredor}" alt="Um corredor do armazém da Romafe, com caixas SKF">
      <p class="pub__heroi-legenda">O armazém da Romafe, no Porto</p>
    </div>
  </div>
  </section>

  <section class="pub__historia" aria-label="A Romafe" style="--n:${CAPITULOS.length}">
    <div class="pub__fixo">
      <div class="pub__textos">${CAPITULOS.map(([, num, frase, texto], i) => `<article class="pub__cap" data-cap="${i}"${i ? '' : ' aria-current="true"'}><p class="pub__cap-num">${num}</p><h2 class="pub__cap-frase">${frase}</h2><p class="pub__cap-texto">${texto}</p></article>`).join('')}
        <div class="pub__caps-pista">${rolamentoSvg('historia', 'pub__caps-rolo')}</div>
        <ol class="pub__caps" aria-label="Capítulos">${CAPITULOS.map(([, num], i) => `<li><button type="button" data-cap="${i}"${i ? '' : ' aria-current="true"'}><span class="pub__caps-barra" aria-hidden="true"><i></i></span>${num}</button></li>`).join('')}</ol>
      </div>
      <div class="pub__fotos">${CAPITULOS.map(([img, , , , alt], i) => `<figure class="pub__foto" style="--i:${i}"><img src="${img}" alt="${alt}"></figure>`).join('')}</div>
    </div>
  </section>

  <section class="pub__nasce" aria-label="Como nasce um rolamento" style="--n:${NASCE.length}">
    <div class="pub__nasce-fixo">
      <div class="pub__nasce-textos">
        <p class="pub__kicker">Como nasce um rolamento</p>
        ${NASCE.map((t, i) => `<h2 class="pub__nasce-frase" data-passo="${i}"${i ? '' : ' aria-current="true"'}>${t}</h2>`).join('')}
        <ol class="pub__nasce-pontos" aria-hidden="true">${NASCE.map((_, i) => `<li data-passo="${i}"${i ? '' : ' aria-current="true"'}></li>`).join('')}</ol>
      </div>
      <figure class="pub__nasce-palco">
        <div class="pub__nasce-anel">
          <video class="pub__nasce-video" src="${tornoVideo}" poster="${tornoImg}" muted loop playsinline preload="metadata" aria-label="Um torno a trabalhar um anel de aço"></video>
          <span class="pub__nasce-furo" aria-hidden="true"></span>
          <img class="pub__nasce-skf" src="${skf}" alt="Paletes e caixas SKF no armazém da Romafe">
        </div>
        <figcaption>Vídeo: um torno a trabalhar um anel de aço (Pexels). Fotografia: paletes SKF no armazém da Romafe.</figcaption>
      </figure>
    </div>
  </section>

  <section class="pub__skf" aria-label="SKF">
    <figure class="pub__skf-foto"><img src="${skf}" alt="Paletes e caixas SKF no armazém da Romafe"></figure>
    <div class="pub__skf-cartao">
      <span class="pub__skf-selo">${L(award)}</span>
      <p class="pub__skf-marca">SKF</p>
      <h2 class="pub__h2">Distribuidor SKF desde 1975</h2>
      <p>SKF CMP desde 2007 — o único em Portugal. No GoParts encontra os rolamentos, os kits de roda e de distribuição e as bombas de água SKF, com o stock à vista.</p>
    </div>
    <ul class="pub__refs" aria-label="Referências SKF no GoParts">${SKF}</ul>
  </section>

  <section class="pub__numeros-sec" aria-label="A Romafe em números">
    <ul class="pub__numeros">
      <li><strong data-contar="75000" data-mil>0</strong><span>referências auto</span></li>
      <li><strong data-contar="14000" data-mil data-mais>0</strong><span>clientes</span></li>
      <li><strong data-contar="6000" data-mil data-mais>0</strong><span>m² de armazém</span></li>
      <li><strong data-contar="1945">0</strong><span>o ano em que começou</span></li>
    </ul>
  </section>

  <section class="pub__marcas" aria-label="Marcas">
    <p class="pub__marcas-titulo">Peças para as marcas que entram na sua oficina</p>
    <div class="pub__faixa"><ul>${logos}</ul><ul aria-hidden="true">${logos}</ul></div>
  </section>

  ${aSeguir('publico')}
  <section class="pub__fim" aria-label="Entrar">
    <h2 class="pub__h2 pub__fim-titulo">${LINHA('Entre no GoParts.', 0)}</h2>
    <p class="pub__fim-nota">Ainda não tem conta? <a href="#" data-ir="publico-contactos">Peça acesso</a> ou ligue +351 226 158 300.</p>
    <button type="button" class="btn btn--acao pub__cta pub__cta--grande" data-ir="entrada"><span class="btn__rotulo">Entrar</span>${L(arrowRight, 'btn__icone')}</button>
    <button type="button" class="pub__topo" data-topo>${L(arrowUp)}Voltar ao início</button>
  </section>
  ${rodapePublico}
</div>`;

export function ecraPublico(): EcraGoParts {
  return {
    id: 'publico', nome: '00 · A página pública', fluxo: 'Página pública',
    objetivo: 'Antes de entrar: apresenta o GoParts e a Romafe com fotografias verdadeiras (o armazém, as paletes SKF, a separação, a oficina), conta a história com o scroll e leva a «Entrar».',
    /* 13 out. 2026: ela, «só quero uma versão» — saíram a v1, a v2 e a v3 */
    versoes: [{ id: 'v4', nota: 'A única (13 out.): clara como romafe.com, só fotografias verdadeiras, a SKF; do vídeo, o efeito — o herói que abre com o scroll e a história que troca fotografia e texto', html }],
  };
}
