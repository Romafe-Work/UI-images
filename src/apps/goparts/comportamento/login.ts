/* =========================================================
   GOPARTS — o login (12 out. 2026): o 75 000 conta a partir de 0 sempre que
   um dos quatro ecrãs de entrar aparece (também no editor). Com «reduzir
   movimento», fica o número.
   ========================================================= */
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let corrida = 0;

function contar(): void {
  const el = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .login22__numero');
  if (!el || quieto()) return;
  const fim = Number(el.dataset.fim || (el.textContent || '').replace(/\D/g, ''));
  el.dataset.fim = String(fim);
  const eu = ++corrida;
  const t0 = performance.now() + 500, dur = 1300;
  const passo = (t: number) => {
    if (eu !== corrida) return;
    const k = Math.max(0, Math.min(1, (t - t0) / dur));
    el.textContent = Math.round(fim * (1 - Math.pow(1 - k, 3))).toLocaleString('pt-PT').replace(/ | |\./g, ' ');
    if (k < 1) requestAnimationFrame(passo);
  };
  el.textContent = '0';
  requestAnimationFrame(passo);
}

export function iniciar(): void {
  requestAnimationFrame(contar);
  document.addEventListener('romafe:versao', () => requestAnimationFrame(contar));
}
