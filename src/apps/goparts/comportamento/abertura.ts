/* =========================================================
   GOPARTS — 00 · Abertura: passar sozinha à página pública (13 out. 2026)
   Quando a abertura está à vista (fora do editor), ao fim de 3 s (1,5 s com
   «reduzir movimento») sai — a moldura das fotografias cresce e tudo desvanece
   (450 ms; 250 ms com «reduzir movimento») — e segue para «00 · A página pública»
   pelo próprio «Saltar» (a ordem é abertura → página pública → login).
   Trocar de ecrã antes disso cancela. A percentagem conta de 0 a 100 % ao ritmo
   da barra (também no editor).
   ========================================================= */
const editando = () => document.body.classList.contains('editando');
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let corrida = 0;

/** A percentagem, ao mesmo ritmo da barra (começa aos 0,2 s e dura 2,8 s; 1,3 s com «reduzir movimento»). */
function contar(ab: HTMLElement, eu: number): void {
  const pct = ab.querySelector<HTMLElement>('.ab2__pct');
  if (!pct) return;
  const t0 = performance.now() + 200, dur = quieto() ? 1300 : 2800;
  const passo = (t: number) => {
    if (eu !== corrida || !ab.isConnected) return;
    const k = Math.max(0, Math.min(1, (t - t0) / dur));
    pct.textContent = `${Math.round(k * 100)}%`;
    if (k < 1) requestAnimationFrame(passo);
  };
  pct.textContent = '0%';
  requestAnimationFrame(passo);
}

function armar(): void {
  const eu = ++corrida;
  const ab = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .abertura');
  if (!ab) return;
  ab.classList.remove('is-a-sair');
  contar(ab, eu);
  if (editando()) return;
  const saida = quieto() ? 250 : 450;
  window.setTimeout(() => {
    if (eu !== corrida || !ab.isConnected || ab.closest('[hidden]') || editando()) return;
    ab.classList.add('is-a-sair');
    window.setTimeout(() => {
      if (eu !== corrida) return;
      ab.querySelector<HTMLElement>('.abertura__saltar')?.click();
      ab.classList.remove('is-a-sair');
    }, saida);
  }, quieto() ? 1500 : 3000);
}

export function iniciar(): void {
  requestAnimationFrame(armar);
  ['romafe:versao', 'romafe:ecra'].forEach((e) => document.addEventListener(e, () => requestAnimationFrame(armar)));
  window.addEventListener('hashchange', () => requestAnimationFrame(armar));
}
