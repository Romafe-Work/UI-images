/* =========================================================
   PEÇA A PEÇA — 00 · Abertura no telemóvel: o que mexe (22 out. 2026)
   Até 700 px: a composição de telemóvel (abertura-movel.ts) entra em ≈1 s — is-a 0 ms, is-b 150, is-c 400,
   is-d 750 — e fica; não sai sozinha («Começar» leva ao Início, «Mudar conta» ao login comum). «Ajuda» mostra o
   apoio. No editor e com «reduzir movimento», tudo no sítio logo.
   ========================================================= */
export const movel = () => window.matchMedia('(max-width: 700px)').matches;
const editando = () => document.body.classList.contains('editando') || document.body.classList.contains('com-fluxo');
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const FASES = ['is-a', 'is-b', 'is-c', 'is-d'];
let raiz: HTMLElement | null = null;
let tempos: number[] = [];
const limpar = () => { tempos.forEach((t) => window.clearTimeout(t)); tempos = []; };

function correr(): void {
  if (!raiz) return;
  limpar(); raiz.classList.remove(...FASES, 'is-ja'); void raiz.offsetWidth;
  if (editando() || quieto()) { raiz.classList.add(...FASES, 'is-ja'); return; }
  ([[0, 'is-a'], [150, 'is-b'], [400, 'is-c'], [750, 'is-d']] as [number, string][]).forEach(([ms, c]) => tempos.push(window.setTimeout(() => raiz?.classList.add(c), ms)));
}
function armar(): void {
  const r = movel() ? document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) [data-pam]') : null;
  if (r === raiz) return;
  limpar(); raiz = r;
  if (r) requestAnimationFrame(correr);
}
export function iniciar(): void {
  requestAnimationFrame(armar);
  ['romafe:versao', 'romafe:ecra'].forEach((x) => document.addEventListener(x, () => requestAnimationFrame(armar)));
  window.addEventListener('hashchange', () => requestAnimationFrame(armar));
  window.matchMedia('(max-width: 700px)').addEventListener('change', () => { raiz = null; requestAnimationFrame(armar); });
  document.addEventListener('click', (ev) => {
    const b = (ev.target as Element).closest?.<HTMLElement>('[data-pam-ajuda]');
    if (!b || !raiz?.contains(b)) return;
    const t = raiz.querySelector<HTMLElement>('[data-pam-ajuda-texto]')!;
    t.hidden = !t.hidden; b.setAttribute('aria-expanded', String(!t.hidden));
  });
}
