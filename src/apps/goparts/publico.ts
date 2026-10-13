/* =========================================================
   GOPARTS — 00 · A página pública (13 out. 2026)
   Ela mandou imagens de vídeos de sites (Nike, Jordan, o site de um piloto de F1)
   e disse «quero a app web como estes vídeos… desse jeito em termos de animações
   e UI». Ficou combinado pôr esse estilo onde se apresenta o GoParts, antes de
   entrar; o catálogo e os pedidos ficam rápidos. Com o material da Romafe:
     herói — «Rolling your way.» em letra enorme, linha a linha, e uma colagem de
       fotografias da Romafe que reage ao rato (camadas, legendas, pontos no
       armazém); os números contam ao aparecer e mostram um detalhe com o rato;
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

/* a colagem do herói (ela, 13 out.: «quero imagens relacionadas com a empresa e quando passo
   o rato mostrar coisas»): três fotografias verdadeiras da Romafe em camadas; ao passar o rato,
   a que está por baixo vem para a frente e mostra a legenda, e a colagem segue o rato com
   profundidade; no corredor, pontos que se abrem com o que se vê */
const PONTOS: [number, number, string, string][] = [
  [24, 44, 'Caixas SKF', 'A Romafe distribui SKF desde 1975.'],
  [58, 30, 'Estantes azuis, travessas laranja', 'As cores da marca estão no próprio armazém.'],
  [70, 72, '6 000 m² de armazém', 'Entre o Porto e Sacavém, com 75 000 referências auto.'],
];
const ponto = ([x, y, t, d]: [number, number, string, string], i: number) =>
  `<button type="button" class="pub__ponto" style="--x:${x}%; --y:${y}%; --i:${i}" aria-label="${t}"><span class="pub__ponto-mais" aria-hidden="true"></span><span class="pub__ponto-dica" role="tooltip"><strong>${t}</strong>${d}</span></button>`;
const COLAGEM = `<div class="pub__colagem">
  <figure class="pub__ft pub__ft--grande" style="--prof:0.5"><img src="${corredor}" alt="Um corredor do armazém da Romafe, com caixas SKF em estantes azuis e travessas laranja" loading="eager"><figcaption><strong>Armazém do Porto</strong>Rua Eng. Ezequiel de Campos</figcaption>${PONTOS.map(ponto).join('')}</figure>
  <figure class="pub__ft pub__ft--separacao" style="--prof:1.2"><img src="${separacao}" alt="Uma colaboradora da Romafe a separar caixas de peças numa estante" loading="eager"><figcaption><strong>Separação</strong>O que pedir até às 16h sai hoje</figcaption></figure>
  <figure class="pub__ft pub__ft--fachada" style="--prof:2"><img src="${fachada}" alt="A fachada da Romafe com o letreiro" loading="eager"><figcaption><strong>Desde 1945</strong>Rolamentos, Máquinas e Ferramentas</figcaption></figure>
  <p class="pub__selo"><strong>SKF</strong>Distribuidor<br>desde 1975</p>
</div>`;

/* os logótipos das marcas, os mesmos do Catálogo v2 */
const logos = Array.from(catalogoV2.matchAll(/data-nome="([^"]+)">\s*<button[^>]*><span class="cat2__logo"[^>]*>(<svg[\s\S]*?<\/svg>)<\/span>/g))
  .slice(0, 14).map(([, nome, svg]) => `<li>${svg}<span class="pub__marca-nome">${nome}</span></li>`).join('');

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
    <button type="button" class="btn btn--acao pub__entrar" data-ir="entrada">${L(logIn, 'btn__icone')}<span class="btn__rotulo">Entrar</span></button>
  </header>

  <section class="pub__heroi" aria-label="GoParts">
    <div class="pub__heroi-texto">
      <h1 class="pub__titulo">${LINHA('Rolling', 0)}${LINHA('your', 1)}${LINHA('way.', 2)}</h1>
      <p class="pub__lead">O marketplace de peças auto da Romafe: 75 000 referências, com o stock do Porto e de Sacavém à vista, preço líquido e entrega no dia seguinte. Para oficinas que não podem esperar.</p>
      <div class="pub__accoes">
        <button type="button" class="btn btn--acao pub__cta" data-ir="entrada">${L(logIn, 'btn__icone')}<span class="btn__rotulo">Entrar no GoParts</span></button>
        <a class="pub__ligacao" href="tel:+351226158300">${L(phone)}Pedir acesso · 226 158 300</a>
      </div>
    </div>
    ${COLAGEM}
    <ul class="pub__numeros" aria-label="A Romafe em números">
      <li tabindex="0"><strong data-contar="75000" data-mil>0</strong><span>referências auto</span><em class="pub__mais">Travões, suspensão, distribuição, filtros, embraiagens, iluminação…</em></li>
      <li tabindex="0"><strong data-contar="1945">0</strong><span>o ano em que começou</span><em class="pub__mais">Fundada no Porto por Alfredo Pinto França.</em></li>
      <li tabindex="0"><strong data-contar="14000" data-mil data-mais>0</strong><span>clientes</span><em class="pub__mais">Oficinas, frotas e indústria, de norte a sul.</em></li>
      <li tabindex="0"><strong data-contar="2">0</strong><span>armazéns: Porto e Sacavém</span><em class="pub__mais">O Porto expede no próprio dia; Sacavém na manhã seguinte.</em></li>
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
    <button type="button" class="btn btn--acao pub__cta pub__cta--grande" data-ir="entrada"><span class="btn__rotulo">Entrar</span>${L(arrowRight, 'btn__icone')}</button>
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
