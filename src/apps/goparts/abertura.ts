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

export function ecraAbertura(): EcraGoParts {
  return {
    id: 'abertura', nome: '00 · Abertura', fluxo: 'Entrar',
    objetivo: 'O que se vê antes do login, uma vez por sessão: o rolamento entra a rolar, o ROMAFE aparece, depois o GoParts; ao fim de 3 s passa ao login.',
    versoes: [{ id: 'v1', nota: 'Pedida a 13 out.: um ecrã animado antes do login, com o rolamento e o lema «Rolling your way»', html }],
  };
}
