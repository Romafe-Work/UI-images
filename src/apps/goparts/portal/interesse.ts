/* =========================================================
   PEÇA A PEÇA — «Tenho interesse» (26 nov. 2026)
   Ela: «para isto existir tem de existir um botão de tenho interesse naquilo que não está disponível, para depois
   aparecer aqui [nos Alertas de disponibilidade]». O botão aparece em toda a peça sem stock (referências do
   Catálogo, ficha, resultados da pesquisa, comparador); o clique cria o alerta (comportamento/sugestoes.ts).
   ========================================================= */
const SINO = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn__icone" aria-hidden="true"><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/><path d="M15 8h6M18 5v6"/><path d="M20.4 14.5c.4 1.1 1 1.6 1.6 2.5H2c1.3-1.4 2.6-2.7 2.6-7.4A7.4 7.4 0 0 1 14 4.3"/></svg>';
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
export const interesseBtn = (ref: string, cls = '') => `<button type="button" class="btn sg__interesse${cls ? ` ${cls}` : ''}" data-sg-interesse="${esc(ref)}" title="Avisar quando houver stock">${SINO}<span class="btn__rotulo">Tenho interesse</span></button>`;
