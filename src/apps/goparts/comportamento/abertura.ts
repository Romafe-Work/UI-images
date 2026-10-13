/* =========================================================
   GOPARTS — 00 · Abertura: passar sozinho ao login (13 out. 2026)
   Quando a abertura está à vista (fora do editor), ao fim de 3 s (1,5 s com
   «reduzir movimento») tudo desvanece em 250 ms e segue para «01 · Entrar»
   pelo próprio «Saltar». Trocar de ecrã antes disso cancela.
   ========================================================= */
const editando = () => document.body.classList.contains('editando');
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let corrida = 0;

function armar(): void {
  const eu = ++corrida;
  const ab = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .abertura');
  if (!ab || editando()) return;
  ab.classList.remove('is-a-sair');
  window.setTimeout(() => {
    if (eu !== corrida || !ab.isConnected || ab.closest('[hidden]') || editando()) return;
    ab.classList.add('is-a-sair');
    window.setTimeout(() => {
      if (eu !== corrida) return;
      ab.querySelector<HTMLElement>('.abertura__saltar')?.click();
      ab.classList.remove('is-a-sair');
    }, 250);
  }, quieto() ? 1500 : 3000);
}

export function iniciar(): void {
  requestAnimationFrame(armar);
  ['romafe:versao', 'romafe:ecra'].forEach((e) => document.addEventListener(e, () => requestAnimationFrame(armar)));
  window.addEventListener('hashchange', () => requestAnimationFrame(armar));
}
