/* =========================================================
   GOPARTS — 00 · Abertura: passar sozinho ao login (13 out. 2026)
   Quando a abertura está à vista (fora do editor), ao fim de 3 s (1,5 s com
   «reduzir movimento») sai — na v1 tudo desvanece (250 ms); na v2 o rolamento
   rola para fora (450 ms) — e segue para «01 · Entrar» pelo próprio «Saltar».
   Trocar de ecrã antes disso cancela.
   Na v2: a percentagem conta de 0 a 100 % ao ritmo da barra (também no editor),
   e os rolamentos dos cantos seguem o rato de leve (só com rato, fora do editor).
   ========================================================= */
const editando = () => document.body.classList.contains('editando');
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let corrida = 0;

/** A percentagem da v2, ao mesmo ritmo da barra (começa aos 0,2 s e dura 2,8 s; 1,3 s com «reduzir movimento»). */
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
  const saida = ab.classList.contains('abertura--v2') && !quieto() ? 450 : 250;
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
  /* os rolamentos dos cantos seguem o rato (−0,5 a 0,5 em cada eixo) */
  document.addEventListener('pointermove', (ev) => {
    if (ev.pointerType !== 'mouse' || editando() || quieto()) return;
    const cantos = (ev.target as Element).closest?.('.abertura--v2')?.querySelector<HTMLElement>('.ab2__cantos');
    if (!cantos) return;
    cantos.style.setProperty('--px', (ev.clientX / innerWidth - 0.5).toFixed(3));
    cantos.style.setProperty('--py', (ev.clientY / innerHeight - 0.5).toFixed(3));
  });
}
