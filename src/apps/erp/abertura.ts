/* =========================================================
   ERP — 00 · Abertura (19 out. 2026): o ecrã «wow», como a do GoParts
   Ela: «quero um ecrã wow como temos no goparts». É a abertura cinematográfica do GoParts (o rolamento
   SKF 6206 que se monta, abre em vista explodida e se desfaz em partículas que formam o ROMAFE), com o
   que é do ERP:
     0–1 s     uma esfera de aço sozinha, a flutuar;
     1–2,5 s   o rolamento monta-se; a meio, uma gota de óleo cai e entra nele: a película âmbar
               espalha-se na pista e as esferas passam a rodar mais soltas;
     3–4,4 s   vista explodida, e em vez das cotas, os dados do artigo no ERP (referência, stock no
               armazém 60, fornecedor, custo médio, a compra a caminho) — a peça passa a registo;
     4,2 s     à volta, a rede da v10 começa a formar-se: as peças e os óleos da Romafe, ligados;
     4,9–6,2 s o rolamento desfaz-se em partículas que formam o ROMAFE; depois o logótipo verdadeiro
               (HTML, azul, Motor), o «ERP» ao lado como no cartão, a linha laranja e a frase do briefing;
     7,4 s     passa ao 01 · Entrar da v10: a marca voa para o cartão (View Transitions) e a rede, que é a
               mesma cena, continua sem recomeçar.
   Arrasta-se para rodar o rolamento até as partículas partirem. «Saltar» (ou Esc) vai já ao 01. A
   sequência inteira só passa uma vez por sessão; depois mostra o logótipo, com «Ver outra vez». Com
   «reduzir movimento», ou sem WebGL, mostra só o logótipo. Fundo e cores: os tokens --rede-* do 01.
   ========================================================= */
import type { EcraErp } from './ids';
import arrowRight from 'lucide-static/icons/arrow-right.svg?raw';
import rotateCcw from 'lucide-static/icons/rotate-ccw.svg?raw';
import move3d from 'lucide-static/icons/move-3d.svg?raw';

const L = (raw: string, cls = '') => raw.replace(/<!--[\s\S]*?-->/, '').replace(/\s+class="lucide lucide-([^"]*)"/, ' data-lucide="$1"').replace(/\s+class="[^"]*"/, '').replace('<svg', `<svg${cls ? ` class="${cls}"` : ''} aria-hidden="true"`).replace(/\n\s*/g, '');

/* os dados do artigo na vista explodida: a linha vai da peça (a âncora, que a cena projeta) ao texto */
const COTAS: [string, string][] = [
  ['ext', 'Artigo 6206-2RSH · SKF'],
  ['esf', 'Stock 2 400 un. · armazém 60'],
  ['gai', 'Fornecedor · SKF Portugal'],
  ['int', 'Custo médio 4,12 €'],
  ['lar', 'Compra a caminho · 1 200 un.'],
];

const html = `<main class="erp-ab" aria-label="ROMAFE ERP: a abrir">
  <div class="erp-ab__rede" aria-hidden="true"></div>
  <canvas class="erp-ab__cena" aria-hidden="true"></canvas>
  <svg class="erp-ab__cotas" aria-hidden="true">${COTAS.map(([k]) => `<g class="erp-ab__cota" data-cota="${k}"><line pathLength="1"/><circle r="3"/></g>`).join('')}</svg>
  <div class="erp-ab__rotulos" aria-hidden="true">${COTAS.map(([k, t]) => `<span class="erp-ab__rotulo" data-cota="${k}">${t}</span>`).join('')}<span class="erp-ab__rotulo erp-ab__rotulo--titulo">SKF 6206 · o artigo no ERP</span></div>
  <div class="erp-ab__centro">
    <div class="erp-ab__marca"><span class="romafe erp-ab__romafe">ROMAFE</span><span class="erp-ab__erp">ERP</span></div>
    <i class="erp-ab__linha" aria-hidden="true"></i>
    <p class="erp-ab__frase">Tudo ligado. Tudo sob controlo.</p>
  </div>
  <p class="erp-ab__dica" aria-hidden="true">${L(move3d)}Arrasta para rodar o rolamento</p>
  <p class="erp-ab__espera" role="status">A preparar a cena…</p>
  <div class="erp-ab__accoes">
    <button type="button" class="btn erp-ab__botao" data-ab-repetir hidden>${L(rotateCcw, 'btn__icone')}<span class="btn__rotulo">Ver outra vez</span></button>
    <button type="button" class="btn erp-ab__botao erp-ab__saltar" data-ir="entrada"><span class="btn__rotulo">Saltar</span>${L(arrowRight, 'btn__icone')}</button>
  </div>
</main>`;

export function ecraAbertura(): EcraErp {
  return {
    id: 'abertura', nome: '00 · Abertura', fluxo: 'Entrar',
    objetivo: 'A entrada no ERP, na primeira visita: um rolamento 3D monta-se, recebe uma gota de óleo, abre em vista explodida com os dados do artigo no ERP, desfaz-se em partículas que formam o ROMAFE, e passa ao 01 · Entrar da v10 com a rede já formada. Salta-se com «Saltar» ou Esc.',
    versoes: [{ id: 'v1', nota: 'A abertura «wow» (19 out., ela: «como temos no goparts»): o rolamento SKF 6206 monta-se e é lubrificado, abre com os dados do artigo, desfaz-se no ROMAFE; à volta forma-se a rede das peças e dos óleos, que passa ao 01 · Entrar v10', html }],
  };
}
