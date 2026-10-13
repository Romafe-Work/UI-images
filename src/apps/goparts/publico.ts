/* =========================================================
   GOPARTS — 00 · A página pública (13 out. 2026)
   Ela mandou imagens de vídeos de sites (Nike, Jordan, o site de um piloto de F1)
   e disse «quero a app web como estes vídeos… desse jeito em termos de animações
   e UI». Ficou combinado pôr esse estilo onde se apresenta o GoParts, antes de
   entrar; o catálogo e os pedidos ficam rápidos. Com o material da Romafe:
     herói — «Rolling your way.» em letra enorme, linha a linha, e um rolamento
       grande que roda com o scroll; os números contam ao aparecer;
     do armazém à oficina — uma secção que fica parada enquanto se faz scroll:
       quatro fotografias verdadeiras trocam com uma revelação em círculo e o
       texto acompanha (fachada, corredor, separação, oficina);
     a rota — a linha Porto → Sacavém → oficina desenha-se com o scroll;
     as marcas — uma faixa que desliza devagar (para com o rato);
     o fim — «Entre no GoParts», grande.
   O ROMAFE fica azul, em Motor, na barra branca (nunca sobre o escuro).
   Comportamento: comportamento/publico.ts.
   ========================================================= */
import type { EcraGoParts } from './ids';
import catalogoV2 from './portal/catalogo-v2.html?raw';
import fachada from '../../comum/img/fachada.webp';
import corredor from '../../comum/img/corredor.webp';
import separacao from '../../comum/img/separacao.webp';
import oficina from '../../comum/img/oficina.webp';
import arrowRight from 'lucide-static/icons/arrow-right.svg?raw';
import arrowDown from 'lucide-static/icons/arrow-down.svg?raw';
import logIn from 'lucide-static/icons/log-in.svg?raw';
import phone from 'lucide-static/icons/phone.svg?raw';

const L = (raw: string, cls = '') => raw.replace(/<!--[\s\S]*?-->/, '').replace(/\s+class="[^"]*"/, '').replace('<svg', `<svg${cls ? ` class="${cls}"` : ''} aria-hidden="true"`).replace(/\n\s*/g, '');

/* o rolamento grande do herói: anéis, 12 esferas, o furo; em desenho, como a abertura */
const esferas = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2;
  return `<circle cx="${(300 + 205 * Math.cos(a)).toFixed(1)}" cy="${(300 + 205 * Math.sin(a)).toFixed(1)}" r="44"/>`;
}).join('');
const ROLAMENTO = `<svg class="pub__rolamento" viewBox="0 0 600 600" aria-hidden="true">
  <circle class="pub__r-anel" cx="300" cy="300" r="280"/><circle class="pub__r-anel" cx="300" cy="300" r="128"/>
  <g class="pub__r-esferas">${esferas}</g><circle class="pub__r-furo" cx="300" cy="300" r="62"/>
  <circle class="pub__r-fino" cx="300" cy="300" r="250"/><circle class="pub__r-fino" cx="300" cy="300" r="160"/>
</svg>`;

/* os logótipos das marcas, os mesmos do Catálogo v2 */
const logos = Array.from(catalogoV2.matchAll(/data-nome="([^"]+)">\s*<button[^>]*><span class="cat2__logo"[^>]*>(<svg[\s\S]*?<\/svg>)<\/span>/g))
  .slice(0, 14).map(([, nome, svg]) => `<li title="${nome}">${svg}</li>`).join('');

const LINHA = (texto: string, i: number) => `<span class="pub__linha"><span style="--i:${i}">${texto}</span></span>`;
const CENAS: [string, string, string, string][] = [
  [fachada, 'Desde 1945', 'No Porto, Rua Eng. Ezequiel de Campos.', 'Rolamentos, Máquinas e Ferramentas: é daí que vem o nome. Oitenta anos depois, a mesma casa.'],
  [corredor, '6 000 m²', 'De armazém, entre o Porto e Sacavém.', 'Estantes azuis, travessas laranja — as cores da marca estão no próprio armazém.'],
  [separacao, '75 000', 'Referências auto, prontas a sair.', 'Separadas por quem as conhece. Distribuidor SKF desde 1975.'],
  [oficina, 'Amanhã', 'Na sua oficina.', 'Peça até às 16h no Porto e sai no próprio dia.'],
];

const html = `<div class="pub">
  <header class="pub__barra">
    <a class="pub__marca" href="#" aria-label="Romafe GoParts"><span class="romafe">ROMAFE</span><span class="pub__risco" aria-hidden="true"></span><span class="pub__produto">GoParts</span></a>
    <nav class="pub__nav" aria-label="Principal"><a href="#pub-historia">A Romafe</a><a href="#pub-rota">Entregas</a><a href="#pub-marcas">Marcas</a><a href="tel:+351226158300">Contactos</a></nav>
    <button type="button" class="btn btn--acao pub__entrar" data-ir="abertura">${L(logIn, 'btn__icone')}<span class="btn__rotulo">Entrar</span></button>
  </header>

  <section class="pub__heroi" aria-label="GoParts">
    <div class="pub__heroi-texto">
      <h1 class="pub__titulo">${LINHA('Rolling', 0)}${LINHA('your', 1)}${LINHA('way.', 2)}</h1>
      <p class="pub__lead">O marketplace de peças auto da Romafe: 75 000 referências, com o stock do Porto e de Sacavém à vista, preço líquido e entrega no dia seguinte. Para oficinas que não podem esperar.</p>
      <div class="pub__accoes">
        <button type="button" class="btn btn--acao pub__cta" data-ir="abertura">${L(logIn, 'btn__icone')}<span class="btn__rotulo">Entrar no GoParts</span></button>
        <a class="pub__ligacao" href="tel:+351226158300">${L(phone)}Pedir acesso · 226 158 300</a>
      </div>
    </div>
    <div class="pub__heroi-roda" aria-hidden="true">${ROLAMENTO}</div>
    <ul class="pub__numeros" aria-label="A Romafe em números">
      <li><strong data-contar="75000" data-mil>0</strong><span>referências auto</span></li>
      <li><strong data-contar="1945">0</strong><span>o ano em que começou</span></li>
      <li><strong data-contar="14000" data-mil data-mais>0</strong><span>clientes</span></li>
      <li><strong data-contar="2">0</strong><span>armazéns: Porto e Sacavém</span></li>
    </ul>
    <a class="pub__descer" href="#pub-historia" aria-label="Descer">${L(arrowDown)}</a>
  </section>

  <section class="pub__historia" id="pub-historia" aria-label="Do armazém à oficina">
    <div class="pub__fixo">
      <div class="pub__fotos" aria-hidden="true">${CENAS.map(([img], i) => `<div class="pub__foto" style="--i:${i}; background-image:url('${img}')"></div>`).join('')}</div>
      <div class="pub__cenas">${CENAS.map(([, grande, linha, texto], i) => `<article class="pub__cena" data-cena="${i}"${i ? '' : ' aria-current="true"'}><p class="pub__cena-grande">${grande}</p><p class="pub__cena-linha">${linha}</p><p class="pub__cena-texto">${texto}</p></article>`).join('')}</div>
      <ol class="pub__progresso" aria-hidden="true">${CENAS.map((_, i) => `<li data-cena="${i}"></li>`).join('')}</ol>
    </div>
  </section>

  <section class="pub__rota" id="pub-rota" aria-label="Entregas">
    <div class="pub__rota-texto">
      <h2 class="pub__h2">${LINHA('Encomenda', 0)}${LINHA('hoje.', 1)}${LINHA('Monta amanhã.', 2)}</h2>
      <p>Até às 16h, o que está no Porto sai no próprio dia. O que está em Sacavém chega na manhã seguinte. O GoParts diz-lhe de onde sai cada peça antes de a pedir.</p>
    </div>
    <svg class="pub__mapa" viewBox="0 0 520 620" aria-hidden="true">
      <path class="pub__mapa-costa" d="M150 20 C 130 120, 160 180, 140 260 S 110 420, 150 520 S 200 600, 230 610"/>
      <path class="pub__mapa-rota" d="M190 120 C 260 160, 300 240, 250 330 S 200 470, 260 520"/>
      <circle class="pub__mapa-ponto" cx="190" cy="120" r="9"/><text x="210" y="112">Porto · hoje</text>
      <circle class="pub__mapa-ponto" cx="260" cy="520" r="9"/><text x="282" y="526">Sacavém · amanhã</text>
      <circle class="pub__mapa-oficina" cx="250" cy="330" r="13"/><text x="276" y="336">A sua oficina</text>
    </svg>
  </section>

  <section class="pub__marcas" id="pub-marcas" aria-label="Marcas">
    <p class="pub__marcas-titulo">Peças para as marcas que entram na sua oficina</p>
    <div class="pub__faixa"><ul>${logos}</ul><ul aria-hidden="true">${logos}</ul></div>
  </section>

  <section class="pub__fim" aria-label="Entrar">
    <h2 class="pub__h2 pub__h2--fim">${LINHA('Entre no', 0)}${LINHA('GoParts.', 1)}</h2>
    <button type="button" class="btn btn--acao pub__cta pub__cta--grande" data-ir="abertura"><span class="btn__rotulo">Entrar</span>${L(arrowRight, 'btn__icone')}</button>
    <p class="pub__fim-nota">Ainda não tem conta? Apoio Romafe · <a href="tel:+351226158300">+351 226 158 300</a></p>
  </section>

  <footer class="pub__rodape"><span>2026 © Romafe SA · Porto</span><span>Distribuidor SKF desde 1975 · ISO 9001 desde 2006</span></footer>
</div>`;

export function ecraPublico(): EcraGoParts {
  return {
    id: 'publico', nome: '00 · A página pública', fluxo: 'Entrar',
    objetivo: 'Antes de entrar: apresenta o GoParts e a Romafe com o estilo dos sites que ela mandou (letra enorme, fotografias que se transformam, scroll que conta a história) e leva a «Entrar».',
    versoes: [{ id: 'v1', nota: 'Pedida a 13 out. com imagens de vídeos de sites (Nike, Jordan, F1): herói, do armazém à oficina, a rota, as marcas e entrar; o material é o da Romafe', html }],
  };
}
