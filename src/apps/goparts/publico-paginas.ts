/* =========================================================
   GOPARTS — 00.1 a 00.4 · As páginas do menu da página pública (13 out. 2026)
   Ela, a apontar para o menu da página pública (A Romafe · Entregas · Marcas ·
   Contactos): «se tenho isto, tenho de ter animações e ecrã» e «quero que o meu
   Figma consiga fazer o fluxo». Cada ligação passa a levar ao seu ecrã (data-ir),
   e daí volta-se pelo próprio menu, pelo ROMAFE ou entra-se no GoParts.
   A mesma linguagem da página pública: azul-noite, letra enorme a subir linha a
   linha, fotografias da Romafe a abrirem-se num círculo, números a contar. As
   entradas correm quando cada secção aparece (.is-visivel, comportamento/publico.ts).
   Só factos que a Romafe publica (romafe.com): 1945, SKF desde 1975, ISO 9001
   desde 2006, SKF CMP desde 2007, 60 colaboradores, 14 000+ clientes, 6 000 m²,
   Porto e Sacavém, +351 226 158 300.
   ========================================================= */
import type { EcraGoParts, IdGoParts } from './ids';
import { barraPublica, rodapePublico } from './publico';
import catalogoV2 from './portal/catalogo-v2.html?raw';
import { REFERENCIAS, saida } from './portal/catalogo-dados';
import fachada from '../../comum/img/fachada.webp';
import corredor from '../../comum/img/corredor.webp';
import separacao from '../../comum/img/separacao.webp';
import oficina from '../../comum/img/oficina.webp';
import skf from '../../comum/img/skf-paletes.webp';
import logIn from 'lucide-static/icons/log-in.svg?raw';
import truck from 'lucide-static/icons/truck.svg?raw';
import warehouse from 'lucide-static/icons/warehouse.svg?raw';
import clock from 'lucide-static/icons/clock.svg?raw';
import phone from 'lucide-static/icons/phone.svg?raw';
import mapPin from 'lucide-static/icons/map-pin.svg?raw';
import send from 'lucide-static/icons/send.svg?raw';
import check from 'lucide-static/icons/check.svg?raw';
import award from 'lucide-static/icons/award.svg?raw';

const L = (raw: string, cls = '') => raw.replace(/<!--[\s\S]*?-->/, '').replace(/\s+class="[^"]*"/, '').replace('<svg', `<svg${cls ? ` class="${cls}"` : ''} aria-hidden="true"`).replace(/\n\s*/g, '');
const LINHA = (texto: string, i: number) => `<span class="pub__linha"><span style="--i:${i}">${texto}</span></span>`;
const TITULO = (...linhas: string[]) => `<h1 class="pub__h2 pubp__titulo">${linhas.map(LINHA).join('')}</h1>`;

type IdPagina = Extract<IdGoParts, `publico-${string}`>;

const barra = (atual: IdPagina) => barraPublica(atual, true);
const fim = (texto: string) => `<section class="pubp__fim" aria-label="Entrar">
  <p class="pubp__fim-texto">${texto}</p>
  <button type="button" class="btn btn--acao pub__cta pubp__cta" data-ir="entrada">${L(logIn, 'btn__icone')}<span class="btn__rotulo">Entrar no GoParts</span></button>
</section>
${rodapePublico}`;
const pagina = (id: IdPagina, corpo: string) => `<div class="pub pubp pubp--${id.replace('publico-', '')}">${barra(id)}${corpo}${fim(id === 'publico-contactos' ? 'Já tem conta? Encomende com o stock à vista.' : '75 000 referências auto, com o stock do Porto e de Sacavém à vista.')}</div>`;
const heroi = (kicker: string, titulo: string, lead: string, img: string, alt: string, legenda: string) => `<section class="pubp__heroi">
  <div class="pubp__heroi-texto"><p class="pubp__kicker">${kicker}</p>${titulo}<p class="pubp__lead">${lead}</p></div>
  <figure class="pubp__foto"><img src="${img}" alt="${alt}"><figcaption>${legenda}</figcaption></figure>
</section>`;

/* ---------- 00.1 · A Romafe: a história em marcos, os números e o armazém ---------- */
const MARCOS: [string, string, string][] = [
  ['1945', 'Fundada no Porto', 'Por Alfredo Pinto França: Rolamentos, Máquinas e Ferramentas — é daí que vem o nome.'],
  ['1975', 'Distribuidor SKF', 'Começa a parceria que dura até hoje.'],
  ['2006', 'ISO 9001', 'A qualidade certificada, do armazém à entrega.'],
  ['2007', 'SKF CMP', 'O único em Portugal.'],
  ['Hoje', 'Porto e Sacavém', 'Dois centros logísticos e 75 000 referências auto.'],
];
const romafe = pagina('publico-romafe', `
${heroi('A Romafe', TITULO('Desde', '1945.'), 'Uma casa do Porto que vende peças há oitenta anos. Hoje com dois centros logísticos, no Porto e em Sacavém, e o GoParts para as oficinas encomendarem a qualquer hora.', fachada, 'A fachada da Romafe com o letreiro', 'Rua Eng. Ezequiel de Campos, Porto')}
<section class="pubp__marcos" aria-label="A história">
  <h2 class="pubp__h3">Oitenta anos, em cinco marcos</h2>
  <ol class="pubp__linha-tempo">${MARCOS.map(([ano, t, d], i) => `<li style="--i:${i}"><span class="pubp__ano">${ano}</span><strong>${t}</strong><p>${d}</p></li>`).join('')}</ol>
</section>
<section class="pubp__numeros" aria-label="A Romafe em números">
  <ul>
    <li style="--i:0"><strong data-contar="60">0</strong><span>colaboradores</span></li>
    <li style="--i:1"><strong data-contar="14000" data-mil data-mais>0</strong><span>clientes</span></li>
    <li style="--i:2"><strong data-contar="6000" data-mil>0</strong><span>m² de armazém</span></li>
    <li style="--i:3"><strong data-contar="75000" data-mil>0</strong><span>referências auto</span></li>
  </ul>
</section>
<section class="pubp__galeria" aria-label="O armazém">
  <figure style="--i:0"><img src="${corredor}" alt="Um corredor do armazém, com caixas SKF em estantes azuis e travessas laranja"><figcaption><strong>Estantes azuis, travessas laranja</strong>As cores da marca estão no próprio armazém.</figcaption></figure>
  <figure style="--i:1"><img src="${separacao}" alt="Uma colaboradora a separar caixas de peças"><figcaption><strong>Separadas por quem as conhece</strong>No Porto e em Sacavém.</figcaption></figure>
</section>`);

/* ---------- 00.2 · Entregas: de onde sai e quando chega ---------- */
const PRAZOS: [string, string, string, string, string][] = [
  [warehouse, 'Porto', 'Hoje', 'O que pedir até às 16h, se estiver no Porto, sai no próprio dia.', '1'],
  [truck, 'Sacavém', 'Amanhã', 'O que estiver em Sacavém chega na manhã seguinte.', '2'],
  [clock, 'Por encomenda', '3 a 5 dias', 'O que não estiver em stock pede-se ao fabricante; o GoParts diz o prazo antes de pedir.', '3'],
];
/* três linhas do próprio catálogo (catalogo-dados.ts): uma do Porto, uma de Sacavém, uma por encomenda */
const EXEMPLO = [0, 4, 7].map((k, i) => {
  const [, fab, ref, desc, , , porto, sacavem] = REFERENCIAS[k];
  const s = saida(porto, sacavem);
  return `<tr style="--i:${i}"><td><strong>${ref}</strong><span>${fab} · ${desc}</span></td><td>${porto}</td><td>${sacavem}</td><td><span class="pubp__sai${porto ? ' pubp__sai--hoje' : sacavem ? ' pubp__sai--amanha' : ''}">${s}</span></td></tr>`;
}).join('');
const entregas = pagina('publico-entregas', `
${heroi('Entregas', TITULO('Encomenda', 'hoje.', 'Monta amanhã.'), 'Antes de pedir, o GoParts diz-lhe de onde sai cada peça e quando chega à oficina.', separacao, 'Uma colaboradora a separar caixas de peças', 'Separação, no Porto')}
<section class="pubp__prazos" aria-label="Os prazos">
  ${PRAZOS.map(([ic, onde, quando, d, n], i) => `<article class="pubp__prazo" style="--i:${i}">
    <span class="pubp__prazo-icone">${L(ic)}</span>
    <p class="pubp__prazo-onde">${onde}</p><p class="pubp__prazo-quando">${quando}</p><p class="pubp__prazo-texto">${d}</p>
    <div class="pubp__pista" aria-hidden="true"><span class="pubp__carrinha" style="--ate:${n}">${L(truck)}</span></div>
  </article>`).join('')}
</section>
<section class="pubp__exemplo" aria-label="No catálogo">
  <div class="pubp__exemplo-texto"><h2 class="pubp__h3">No catálogo, em cada linha</h2><p>Cada referência mostra o stock no Porto e em Sacavém e, ao lado, o que isso quer dizer para a sua oficina.</p></div>
  <table class="pubp__tabela"><thead><tr><th>Referência</th><th>Porto</th><th>Sacavém</th><th>Sai</th></tr></thead><tbody>
    ${EXEMPLO}
  </tbody></table>
</section>`);

/* ---------- 00.3 · Marcas: os logótipos, os mesmos do Catálogo v2 ---------- */
const logos = Array.from(catalogoV2.matchAll(/data-nome="([^"]+)">\s*<button[^>]*><span class="cat2__logo"[^>]*>(<svg[\s\S]*?<\/svg>)<\/span>/g))
  .map(([, nome, svg], i) => `<li style="--i:${i}" tabindex="0"><span class="pubp__logo">${svg}</span><span class="pubp__logo-nome">${nome}</span></li>`).join('');
const marcas = pagina('publico-marcas', `
${heroi('Marcas', TITULO('As marcas', 'da sua', 'oficina.'), 'Peças para os carros que lhe entram pela porta, de fabricantes que a Romafe conhece há décadas.', skf, 'Paletes e caixas SKF no armazém da Romafe', 'Paletes SKF no armazém da Romafe')}
<section class="pubp__marcas" aria-label="Marcas de automóveis">
  <h2 class="pubp__h3">Procure pela marca do carro</h2>
  <ul class="pubp__logos">${logos}</ul>
</section>
<section class="pubp__skf" aria-label="SKF">
  <span class="pubp__skf-icone">${L(award)}</span>
  <p><strong>Distribuidor SKF desde 1975.</strong> E SKF CMP desde 2007 — o único em Portugal.</p>
</section>`);

/* ---------- 00.4 · Contactos: as duas casas, o telefone e o pedido de acesso ---------- */
const contactos = pagina('publico-contactos', `
${heroi('Contactos', TITULO('Fale com', 'a Romafe.'), 'Para abrir conta no GoParts, tirar uma dúvida sobre uma peça ou saber de uma encomenda.', oficina, 'Uma oficina', 'Para oficinas, frotas e indústria')}
<section class="pubp__casas" aria-label="Onde estamos">
  <article class="pubp__casa" style="--i:0"><img src="${fachada}" alt="A fachada da Romafe no Porto"><div><p class="pubp__kicker">${L(mapPin)}Porto</p><strong>Sede e centro logístico</strong><p>Rua Eng. Ezequiel de Campos, 164-182<br>Porto</p></div></article>
  <article class="pubp__casa pubp__casa--sem-foto" style="--i:1"><span class="pubp__casa-pino">${L(mapPin)}</span><div><p class="pubp__kicker">${L(mapPin)}Sacavém</p><strong>Centro logístico</strong><p>O que sai daqui chega<br>na manhã seguinte</p></div></article>
  <a class="pubp__telefone" href="tel:+351226158300" style="--i:2">${L(phone)}<span>Ligue-nos</span><strong>+351 226 158 300</strong></a>
</section>
<section class="pubp__acesso" aria-label="Pedir acesso">
  <div class="pubp__acesso-texto"><h2 class="pubp__h3">Pedir acesso ao GoParts</h2><p>Deixe os dados da oficina; a Romafe liga-lhe para abrir a conta.</p></div>
  <form class="pubp__form" novalidate>
    <label><span>Nome</span><input class="pubp__input" name="nome" autocomplete="name" placeholder="O seu nome"></label>
    <label><span>Oficina</span><input class="pubp__input" name="oficina" autocomplete="organization" placeholder="Nome da oficina"></label>
    <label><span>NIF</span><input class="pubp__input" name="nif" inputmode="numeric" placeholder="9 algarismos"></label>
    <label><span>Telefone</span><input class="pubp__input" name="tel" type="tel" autocomplete="tel" placeholder="+351 …"></label>
    <button type="submit" class="btn btn--acao pubp__enviar">${L(send, 'btn__icone')}<span class="btn__rotulo">Pedir acesso</span></button>
    <p class="pubp__enviado" role="status" hidden>${L(check)}Pedido enviado. A Romafe liga-lhe nos próximos dias úteis.</p>
  </form>
</section>`);

const NOTA = 'Pedida a 13 out. («se tenho isto, tenho de ter animações e ecrã»), na linguagem da página pública';
export function ecrasPublicoPaginas(): EcraGoParts[] {
  return [
    { id: 'publico-romafe', nome: '00.1 · A Romafe', fluxo: 'Página pública', objetivo: 'A história da Romafe em cinco marcos, os números a contar e o armazém.', versoes: [{ id: 'v1', nota: NOTA, html: romafe }] },
    { id: 'publico-entregas', nome: '00.2 · Entregas', fluxo: 'Página pública', objetivo: 'De onde sai cada peça e quando chega: Porto hoje, Sacavém amanhã, por encomenda 3 a 5 dias.', versoes: [{ id: 'v1', nota: NOTA, html: entregas }] },
    { id: 'publico-marcas', nome: '00.3 · Marcas', fluxo: 'Página pública', objetivo: 'As marcas de automóveis do catálogo e a SKF.', versoes: [{ id: 'v1', nota: NOTA, html: marcas }] },
    { id: 'publico-contactos', nome: '00.4 · Contactos', fluxo: 'Página pública', objetivo: 'Onde está a Romafe, o telefone e o pedido de acesso ao GoParts.', versoes: [{ id: 'v1', nota: NOTA, html: contactos }] },
  ];
}
