/* =========================================================
   GOPARTS — 00 · Abertura (13 out. 2026)
   Ela: «faz um ecrã animado antes de aparecer o login». Em vez de efeitos, o
   material da própria Romafe: um rolamento (Rolamentos, Máquinas e Ferramentas:
   é daí que vem o nome) entra a rolar e, à medida que passa, o ROMAFE aparece
   (azul, em Motor, em fundo claro); depois o GoParts, e por baixo o lema
   «Rolling your way» e os factos. Uma linha fina mostra o tempo; ao fim de
   3 s passa sozinho ao login (comportamento/abertura.ts). «Saltar» vai já.
   ========================================================= */
import type { EcraGoParts } from './ids';
import arrowRight from 'lucide-static/icons/arrow-right.svg?raw';

const L = (raw: string, cls = '') => raw.replace(/<!--[\s\S]*?-->/, '').replace(/\s+class="[^"]*"/, '').replace('<svg', `<svg${cls ? ` class="${cls}"` : ''} aria-hidden="true"`).replace(/\n\s*/g, '');

/* o rolamento: anel exterior, anel interior e nove esferas entre eles */
const ESFERAS = Array.from({ length: 9 }, (_, i) => {
  const a = (i / 9) * Math.PI * 2;
  return `<circle cx="${(60 + 43 * Math.cos(a)).toFixed(2)}" cy="${(60 + 43 * Math.sin(a)).toFixed(2)}" r="8.5"/>`;
}).join('');
const ROLAMENTO = `<svg class="abertura__rolamento" viewBox="0 0 120 120" aria-hidden="true">
  <circle class="abertura__anel" cx="60" cy="60" r="55"/>
  <circle class="abertura__anel" cx="60" cy="60" r="31"/>
  <g class="abertura__esferas">${ESFERAS}</g>
  <circle class="abertura__furo" cx="60" cy="60" r="16"/>
</svg>`;

const html = `<main class="abertura" aria-label="GoParts, da Romafe: a abrir">
  <div class="abertura__centro">
    <div class="abertura__marca">
      ${ROLAMENTO}
      <span class="romafe abertura__romafe">ROMAFE</span>
    </div>
    <p class="abertura__produto"><span class="abertura__risco" aria-hidden="true"></span><strong>GoParts</strong><span>O marketplace de peças auto</span></p>
  </div>
  <p class="abertura__lema"><em>Rolling your way</em><span aria-hidden="true">·</span>Desde 1945<span aria-hidden="true">·</span>Distribuidor SKF desde 1975</p>
  <div class="abertura__tempo" aria-hidden="true"><span></span></div>
  <button type="button" class="btn btn--ghost btn--sm abertura__saltar" data-ir="entrada"><span class="btn__rotulo">Saltar</span>${L(arrowRight, 'btn__icone')}</button>
</main>`;

/* ---------- v2 (13 out.), pela segunda imagem dela: fundo claro, dois rolamentos grandes e
   suaves a sair dos cantos, a composição da v1 ao centro, a barra «A carregar…» com a
   percentagem e «Saltar» com contorno laranja; «quero animações e coisas incríveis»:
   os rolamentos dos cantos entram a rolar e seguem o rato de leve, as esferas do rolamento
   do centro acendem uma a uma, as letras do ROMAFE sobem uma a uma, a percentagem conta,
   e à saída o rolamento rola para fora antes do login. (Uma versão escura, da imagem
   anterior, ficou de lado antes de ela a ver.) */
const esferas = (n: number, cx: number, r: number, raio: number, cls: string) => Array.from({ length: n }, (_, i) => {
  const a = (i / n) * Math.PI * 2 - Math.PI / 2;
  return `<circle class="${cls}" style="--i:${i}" cx="${(cx + r * Math.cos(a)).toFixed(1)}" cy="${(cx + r * Math.sin(a)).toFixed(1)}" r="${raio}"/>`;
}).join('');
const ROLAMENTO2 = `<svg class="abertura__rolamento ab2__rolamento" viewBox="0 0 120 120" aria-hidden="true">
  <circle class="abertura__anel" cx="60" cy="60" r="55"/>
  <circle class="abertura__anel" cx="60" cy="60" r="31"/>
  <g class="abertura__esferas">${esferas(9, 60, 43, 8.5, 'ab2__esfera')}</g>
  <circle class="abertura__furo" cx="60" cy="60" r="16"/>
</svg>`;
/* os rolamentos grandes dos cantos: anéis azul-claro e esferas cor de pêssego */
const GRANDE = (cls: string) => `<svg class="ab2__grande ${cls}" viewBox="0 0 600 600" aria-hidden="true">
  <circle class="ab2__g-anel" cx="300" cy="300" r="280"/><circle class="ab2__g-anel" cx="300" cy="300" r="150"/>
  <g>${esferas(10, 300, 215, 52, 'ab2__g-esfera')}</g><circle class="ab2__g-furo" cx="300" cy="300" r="78"/>
</svg>`;
const LETRAS = 'ROMAFE'.split('').map((l, i) => `<span class="ab2__letra" style="--i:${i}" aria-hidden="true"><span>${l}</span></span>`).join('');
const htmlV2 = `<main class="abertura abertura--v2" aria-label="GoParts, da Romafe: a abrir">
  <div class="ab2__cantos" aria-hidden="true">${GRANDE('ab2__grande--cima')}${GRANDE('ab2__grande--baixo')}</div>
  <div class="abertura__centro">
    <div class="abertura__marca">
      ${ROLAMENTO2}
      <span class="romafe abertura__romafe ab2__romafe" role="img" aria-label="ROMAFE">${LETRAS}</span>
    </div>
    <p class="abertura__produto"><span class="abertura__risco" aria-hidden="true"></span><strong>GoParts</strong><span>O marketplace de peças auto</span></p>
    <p class="abertura__lema"><em>Rolling your way</em><i aria-hidden="true"></i>Desde 1945<i aria-hidden="true"></i>Distribuidor SKF desde 1975</p>
  </div>
  <div class="ab2__carga"><span class="abertura__tempo" role="progressbar" aria-label="A carregar"><span></span></span><p>A carregar… <b class="ab2__pct">0%</b></p></div>
  <button type="button" class="btn btn--ghost abertura__saltar" data-ir="entrada"><span class="btn__rotulo">Saltar</span>${L(arrowRight, 'btn__icone')}</button>
</main>`;

export function ecraAbertura(): EcraGoParts {
  return {
    id: 'abertura', nome: '00 · Abertura', fluxo: 'Entrar',
    objetivo: 'O que se vê antes do login, uma vez por sessão: o rolamento entra a rolar, o ROMAFE aparece, depois o GoParts; ao fim de 3 s passa ao login.',
    versoes: [{ id: 'v1', nota: 'Pedida a 13 out.: um ecrã animado antes do login, com o rolamento e o lema «Rolling your way»', html },
      { id: 'v2', nota: 'Pela segunda imagem dela (13 out.): fundo claro com dois rolamentos grandes nos cantos, «A carregar…» com a percentagem; animações: os rolamentos rolam e seguem o rato, as esferas acendem, as letras do ROMAFE sobem, e à saída o rolamento rola para fora', html: htmlV2 }],
  };
}
