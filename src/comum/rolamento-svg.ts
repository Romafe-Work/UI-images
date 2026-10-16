/* =========================================================
   ROMAFE — um rolamento desenhado (SVG + CSS), leve, para carregamentos e estados (14 out. 2026)
   Ela: «carregar o portal deve ser com um rolamento» e «aqui também» (a manutenção). O mesmo rolamento
   das aberturas, sem 3D: anel exterior, folga, gaiola laranja, 9 esferas e anel interior.
     'carregar'   — enquanto se espera, monta-se (anel, esferas uma a uma, gaiola, anel interior) e desmonta-se,
                    em ciclo: quanto mais longa a espera, mais vezes (16 out.); 'pesquisar' é o mesmo, mais curto;
     'montar'     — monta-se uma vez e fica (confirmações);
     'progresso'  — montado na medida do progresso (`montado`, de 0 a 1), quando se sabe quanto falta;
     'manutencao' — desmonta-se e volta a montar devagar, em ciclo (está a ser afinado);
   e, do briefing dos estados do Início (14 out.: «um único componente com variantes»):
     'offline'    — roda e abranda até parar, sem travar de repente; com .is-retomar volta a rodar;
     'erro'       — roda e pára a meio do movimento, com um pequeno recuo (uma vez);
     '404'        — falta-lhe uma esfera; roda uma vez e mostra o lugar vazio.
   O CSS está em css/rolamento-svg.css (só transform, opacity e stroke-dashoffset; com «reduzir
   movimento» fica montado e parado). Cada uso dá um `id` próprio aos gradientes.
   ========================================================= */
const N = 9;
export type ModoRolamento = 'carregar' | 'montar' | 'progresso' | 'manutencao' | 'pesquisar' | 'offline' | 'erro' | '404';
export function rolamentoSvg(id: string, modo: ModoRolamento = 'carregar', cls = '', montado?: number): string {
  return `<svg class="rs rs--${modo}${cls ? ' ' + cls : ''}"${montado !== undefined ? ` style="--rs-g:${montado}"` : ''} viewBox="-112 -112 224 224" aria-hidden="true">
  <defs><linearGradient id="rs-aco-${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7f9fb"/><stop offset=".42" stop-color="#8d98a3"/><stop offset=".56" stop-color="#e9edf1"/><stop offset="1" stop-color="#4b5560"/></linearGradient>
  <radialGradient id="rs-esf-${id}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".42" stop-color="#b8c1ca"/><stop offset="1" stop-color="#36404a"/></radialGradient></defs>
  <circle class="rs__folga" r="72" fill="none" stroke="#0a2a4a" stroke-width="30"/>
  <g class="rs__ext"><circle r="96" fill="none" stroke="url(#rs-aco-${id})" stroke-width="16"/><circle r="88" fill="none" stroke="rgba(0, 0, 0, .28)" stroke-width="1.5"/></g>
  <g class="rs__gira">
    <circle class="rs__gaiola" r="72" fill="none" stroke="#ef7b10" stroke-width="4" pathLength="100" stroke-dasharray="100"/>
    ${Array.from({ length: N }, (_, i) => `<circle class="rs__esfera" r="13" fill="url(#rs-esf-${id})" style="--i:${i};--ang:${((i / N) * 360).toFixed(1)}deg"/>`).join('')}
    <g class="rs__int"><circle r="50" fill="none" stroke="url(#rs-aco-${id})" stroke-width="16"/><circle r="42" fill="none" stroke="rgba(0, 0, 0, .28)" stroke-width="1.5"/></g>
  </g>
</svg>`;
}
