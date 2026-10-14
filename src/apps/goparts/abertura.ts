/* =========================================================
   GOPARTS — 00 · Abertura (14 out. 2026): a abertura cinematográfica em 3D
   A história: v1 o rolamento em fundo claro; v2 pela imagem dela; v3 as fotografias da Romafe
   numa moldura; v4 no estilo do getlayers.ai com um fumo azul e laranja («não gosto»). Depois ela
   mandou o briefing: «um rolamento mecânico 3D que se desmonta, transforma as suas peças em
   partículas e revela o logótipo ROMAFE, antes de entrar suavemente no GoParts» — abertura de
   cerca de 7 s, fundo azul-noite liso, sem brilhos nem gradientes, laranja contido, o logótipo
   verdadeiro (não refeito em 3D), saltar, e não repetir em cada navegação. E «só quero uma
   versão por screen»: esta é a única.

   A sequência (comportamento/abertura-cena.ts, Three.js, um só ciclo de animação):
     0–1 s     uma esfera de aço sozinha, a flutuar e a rodar, com profundidade;
     1–2,5 s   o rolamento monta-se: o anel exterior, as 9 esferas uma a uma, a gaiola, o anel interior
               (as medidas são as de um SKF 6206: D 62, d 30, B 16 mm, esferas de 9,525 mm);
     2,5–4,2 s vista explodida: as peças afastam-se ao longo do eixo e as cotas aparecem a laranja,
               finas, ligadas às peças; depois voltam a montar-se;
     4,2–5,5 s as peças desfazem-se em partículas, a câmara avança, e as partículas voam até à forma
               exata do ROMAFE (tirada da própria letra Motor);
     5,5–6,4 s as partículas dão lugar ao logótipo verdadeiro (HTML, azul, Motor); o GoParts aparece
               por baixo e a linha laranja desenha-se;
     6,6 s     passa ao 01 · Entrar: a marca voa para a barra de cima (View Transitions).
   (14 out.: ela mandou apagar a página pública; a abertura leva ao login.)
   Antes do logótipo, o rolamento roda com o arrasto (rato ou dedo) e a cena segue o rato.
   «Saltar» (ou Esc) vai já. A sequência inteira só passa uma vez por sessão; depois mostra o
   logótipo, com «Ver outra vez». Com «reduzir movimento», ou sem WebGL, mostra só o logótipo.
   ========================================================= */
import type { EcraGoParts } from './ids';
import arrowRight from 'lucide-static/icons/arrow-right.svg?raw';
import rotateCcw from 'lucide-static/icons/rotate-ccw.svg?raw';
import move3d from 'lucide-static/icons/move-3d.svg?raw';

const L = (raw: string, cls = '') => raw.replace(/<!--[\s\S]*?-->/, '').replace(/\s+class="lucide lucide-([^"]*)"/, ' data-i="$1"').replace(/\s+class="[^"]*"/, '').replace('<svg', `<svg${cls ? ` class="${cls}"` : ''} aria-hidden="true"`).replace(/\n\s*/g, '');

/* as cotas da vista explodida: a linha vai da peça (a âncora, que a cena projeta em cada frame) ao texto */
const COTAS: [string, string][] = [
  ['ext', 'D 62 mm · anel exterior'],
  ['esf', '9 esferas · Ø 9,525 mm'],
  ['gai', 'Gaiola'],
  ['int', 'd 30 mm · anel interior'],
  ['lar', 'B 16 mm'],
];

const html = `<main class="abertura abertura--v5" aria-label="GoParts, da Romafe: a abrir">
  <canvas class="ab5__cena" aria-hidden="true"></canvas>
  <svg class="ab5__cotas" aria-hidden="true">${COTAS.map(([k]) => `<g class="ab5__cota" data-cota="${k}"><line pathLength="1"/><circle r="3"/></g>`).join('')}</svg>
  <div class="ab5__rotulos" aria-hidden="true">${COTAS.map(([k, t]) => `<span class="ab5__rotulo" data-cota="${k}">${t}</span>`).join('')}<span class="ab5__rotulo ab5__rotulo--titulo">SKF 6206 · rolamento rígido de esferas</span></div>
  <div class="ab5__marca">
    <span class="romafe ab5__romafe">ROMAFE</span>
    <span class="ab5__goparts">GoParts</span>
    <i class="ab5__linha" aria-hidden="true"></i>
  </div>
  <p class="ab5__dica" aria-hidden="true">${L(move3d)}Arraste para rodar o rolamento</p>
  <p class="ab5__espera" role="status">A preparar a cena…</p>
  <div class="ab5__accoes">
    <button type="button" class="btn ab5__botao ab5__repetir" data-repetir hidden>${L(rotateCcw, 'btn__icone')}<span class="btn__rotulo">Ver outra vez</span></button>
    <button type="button" class="btn ab5__botao abertura__saltar" data-ir="entrada"><span class="btn__rotulo">Saltar</span>${L(arrowRight, 'btn__icone')}</button>
  </div>
</main>`;

export function ecraAbertura(): EcraGoParts {
  return {
    id: 'abertura', nome: '00 · Abertura', fluxo: 'Entrar',
    objetivo: 'A entrada no GoParts, na primeira visita: um rolamento 3D monta-se, desmonta-se em vista explodida com as cotas, desfaz-se em partículas que formam o ROMAFE, e passa ao 01 · Entrar. Salta-se com «Saltar» ou Esc.',
    /* 14 out. 2026: «só quero uma versão por screen» — as anteriores saíram */
    versoes: [{ id: 'v5', nota: 'A única (14 out.): abertura cinematográfica em 3D (Three.js) — o rolamento SKF 6206 monta-se, abre em vista explodida com as cotas a laranja, desfaz-se em partículas que formam o ROMAFE; o GoParts e a linha laranja; passa ao login', html }],
  };
}
