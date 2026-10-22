/* =========================================================
   PICK — 00 · Abertura: o que mexe (22 out. 2026)
   A história corre cada vez que a abertura aparece (≈1,5 s): is-a 0 ms, is-b 150, is-c 800, is-d 900, is-fim 1100.
   Tocar no ecrã acaba-a (tudo no sítio); «Entrar» e os atalhos funcionam desde o início (levam ao 01 · Entrar).
   Nos estados, no editor e com «reduzir movimento», fica logo no fim.
   ========================================================= */
const editando = () => document.body.classList.contains('editando') || document.body.classList.contains('com-fluxo');
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const FASES = ['is-a', 'is-b', 'is-c', 'is-d', 'is-fim'];
let raiz: HTMLElement | null = null;
let tempos: number[] = [];
const limpar = () => { tempos.forEach((t) => window.clearTimeout(t)); tempos = []; };

function acabar(): void { if (!raiz) return; limpar(); raiz.classList.add(...FASES, 'is-ja'); }
function correr(): void {
  if (!raiz || /pkb--/.test(raiz.className)) return;
  limpar(); raiz.classList.remove(...FASES, 'is-ja'); void raiz.offsetWidth;
  if (editando() || quieto()) { acabar(); return; }
  ([[0, 'is-a'], [150, 'is-b'], [800, 'is-c'], [900, 'is-d'], [1100, 'is-fim']] as [number, string][]).forEach(([ms, c]) => tempos.push(window.setTimeout(() => raiz?.classList.add(c), ms)));
}
function armar(): void {
  const r = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) [data-pkb]');
  if (r === raiz) return;
  limpar(); raiz = r;
  if (r) requestAnimationFrame(correr);
}
export function iniciar(): void {
  requestAnimationFrame(armar);
  ['romafe:versao', 'romafe:ecra'].forEach((x) => document.addEventListener(x, () => requestAnimationFrame(armar)));
  window.addEventListener('hashchange', () => requestAnimationFrame(armar));
  document.addEventListener('pointerdown', (ev) => { if (raiz && !editando() && raiz.contains(ev.target as Node) && !raiz.classList.contains('is-fim')) acabar(); }, true);
}
