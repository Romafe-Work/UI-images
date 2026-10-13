/* =========================================================
   GOPARTS — 00 · Abertura (13 out. 2026)
   O que se vê ao abrir o GoParts, uma vez por sessão; ao fim de 3 s passa sozinha à
   página pública (comportamento/abertura.ts). «Saltar» vai já.
   Ela teve a v1 (o rolamento em fundo claro) e a v2 (pela imagem dela, com os
   rolamentos grandes nos cantos) — «só queria uma versão na abertura» — e depois,
   ao lado da página pública escura: «a abertura está feia». Esta v3 fica na mesma
   linguagem da página pública: azul-noite, «Rolling your way.» a subir linha a linha,
   uma moldura grande em que as fotografias da Romafe (fachada, corredor, separação)
   se abrem com um círculo, uma de cada vez, e a marca numa placa branca (o ROMAFE só
   vai em fundo claro); em baixo, a linha laranja com a percentagem. À saída, a
   moldura cresce. Os factos das legendas são os da página pública.
   Depois (13 out.), clara como a página pública: papel, tinta e o laranja só na linha do
   tempo; o lema em frase («Rolling your way.»), sem maiúsculas de cartaz.
   ========================================================= */
import type { EcraGoParts } from './ids';
import arrowRight from 'lucide-static/icons/arrow-right.svg?raw';
import fachada from '../../comum/img/fachada.webp';
import corredor from '../../comum/img/corredor.webp';
import separacao from '../../comum/img/separacao.webp';

const L = (raw: string, cls = '') => raw.replace(/<!--[\s\S]*?-->/, '').replace(/\s+class="[^"]*"/, '').replace('<svg', `<svg${cls ? ` class="${cls}"` : ''} aria-hidden="true"`).replace(/\n\s*/g, '');
const LINHA = (t: string, i: number) => `<span class="ab3__linha"><span style="--i:${i}">${t}</span></span>`;
const FOTOS: [string, string][] = [[fachada, 'Desde 1945, no Porto'], [corredor, '6 000 m² de armazém'], [separacao, '75 000 referências auto']];

const html = `<main class="abertura abertura--v3" aria-label="GoParts, da Romafe: a abrir">
  <p class="ab3__placa"><span class="romafe">ROMAFE</span><span class="ab3__risco" aria-hidden="true"></span><span class="ab3__produto">GoParts</span></p>
  <h1 class="ab3__titulo">${LINHA('Rolling', 0)}${LINHA('your way.', 1)}</h1>
  <div class="ab3__moldura" aria-hidden="true">${FOTOS.map(([img, t], i) => `<figure class="ab3__foto" style="--i:${i}"><img src="${img}" alt=""><figcaption>${t}</figcaption></figure>`).join('')}</div>
  <div class="ab3__carga"><span class="abertura__tempo" role="progressbar" aria-label="A carregar"><span></span></span><p>A carregar o GoParts <b class="ab2__pct">0%</b></p></div>
  <button type="button" class="btn btn--ghost abertura__saltar" data-ir="publico"><span class="btn__rotulo">Saltar</span>${L(arrowRight, 'btn__icone')}</button>
</main>`;

export function ecraAbertura(): EcraGoParts {
  return {
    id: 'abertura', nome: '00 · Abertura', fluxo: 'Entrar',
    objetivo: 'O que se vê ao abrir o GoParts, uma vez por sessão: «Rolling your way.» e as fotografias da Romafe a abrirem-se, a percentagem a contar; ao fim de 3 s passa à página pública.',
    /* 13 out. 2026: uma versão só (ela); a v2 (clara, com rolamentos) foi «feia» ao lado da página pública e saiu */
    versoes: [{ id: 'v3', nota: 'Na linguagem da página pública (13 out.): azul-noite, «Rolling your way.» linha a linha, as fotografias da Romafe a abrirem-se num círculo, a marca numa placa branca e a percentagem; à saída a moldura cresce', html }],
  };
}
