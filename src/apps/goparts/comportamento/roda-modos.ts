/* =========================================================
   PEÇA A PEÇA — 18 · Pesquisar peças: os três cartões a rodar (21 out. 2026)
   Ela: «isto deve estar no pesquisar peças e com movimento circular, menos quando seleciono um para escrever; no
   entanto, se eu selecionar e demorar mais de 1 minuto a escrever em algum campo, ele começa a rodar».
   - De 4 em 4 s o modo seguinte passa para o meio (Matrícula → Veículo → Referência → …); os cartões deslizam
     e o que sai por um lado volta pelo outro (esbate-se a meio). O formulário de baixo segue o do meio.
   - Para quando se escolhe um cartão, se toca, se escreve ou se usa o teclado na pesquisa; volta a rodar ao fim
     de 1 minuto sem nada disso. Parado com o rato por cima dos cartões.
   - Não roda: com resultados à vista, nos estados do mapa, no telemóvel (cartões empilhados), com «reduzir
     movimento» ou com a página escondida.
   ========================================================= */
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const editando = () => document.body.classList.contains('editando');
const vivo = () => document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .pq');
const CURVA = 'cubic-bezier(.22, 1, .36, 1)';
const PASSO = 4000, PAUSA = 60000;
let ultimo = 0, porCima = false, automatico = false;

function pode(ini: HTMLElement): boolean {
  return !quieto() && !editando() && !ini.dataset.estado && !ini.classList.contains('is-com-resultados')
    && window.matchMedia('(min-width: 768px)').matches && document.visibilityState === 'visible';
}
/** Põe o modo `m` ao meio (a ordem visual; a do teclado não muda) e anima a passagem. */
function aoMeio(ini: HTMLElement, m: number, animar: boolean): void {
  const cartoes = Array.from(ini.querySelectorAll<HTMLElement>('.pq__modo'));
  if (!pode(ini) && !ini.classList.contains('is-a-rodar')) return;
  const antes = cartoes.map((c) => c.getBoundingClientRect());
  cartoes.forEach((c, i) => { c.style.order = String((i - m + 4) % 3); });
  ini.classList.add('is-a-rodar');
  if (!animar || quieto()) return;
  cartoes.forEach((c, i) => {
    const dx = antes[i].left - c.getBoundingClientRect().left; if (Math.abs(dx) < 1) return;
    const volta = Math.abs(dx) > c.offsetWidth * 1.5; /* o que dá a volta: sai por um lado e entra pelo outro */
    c.animate(volta
      ? [{ transform: `translateX(${dx}px)`, opacity: 1 }, { transform: `translateX(${dx * .6}px) scale(.94)`, opacity: 0, offset: .45 }, { transform: `translateX(${-Math.sign(dx) * 40}px) scale(.94)`, opacity: 0, offset: .55 }, { transform: 'none' }]
      : [{ transform: `translateX(${dx}px)` }, { transform: 'none' }], { duration: 650, easing: CURVA });
  });
}
function repor(ini: HTMLElement): void {
  ini.classList.remove('is-a-rodar');
  ini.querySelectorAll<HTMLElement>('.pq__modo').forEach((c) => { c.style.order = ''; });
}
function rodar(): void {
  const ini = vivo(); if (!ini) return;
  if (!pode(ini)) { if (ini.classList.contains('is-com-resultados') || !window.matchMedia('(min-width: 768px)').matches) repor(ini); return; }
  if (porCima || Date.now() - ultimo < PAUSA) return;
  const m = (Number(ini.dataset.modo ?? 0) + 1) % 3;
  /* a rodar, o campo que tinha o cursor (sem se escrever há 1 minuto) larga-o: o cartão dele sai do meio */
  const f = document.activeElement as HTMLElement | null; if (f && ini.contains(f) && f.matches('input, select, textarea')) f.blur();
  automatico = true; ini.querySelector<HTMLElement>(`.ini3__separador[data-modo="${m}"]`)?.click(); automatico = false;
  aoMeio(ini, m, true);
}
function armar(): void { const ini = vivo(); if (ini && pode(ini)) aoMeio(ini, Number(ini.dataset.modo ?? 0), false); }

export function iniciar(): void {
  window.setInterval(rodar, PASSO);
  requestAnimationFrame(armar);
  ['romafe:versao', 'romafe:ecra'].forEach((e) => document.addEventListener(e, () => requestAnimationFrame(armar)));
  window.addEventListener('hashchange', () => requestAnimationFrame(armar));
  /* quem escolhe, toca, escreve ou usa o teclado na pesquisa para a rotação durante 1 minuto */
  const mexeu = (ev: Event) => { if (ev.isTrusted && (ev.target as Element).closest?.('.pq .pq__pesquisa')) ultimo = Date.now(); };
  ['pointerdown', 'keydown', 'input'].forEach((t) => document.addEventListener(t, mexeu, true));
  /* escolher um cartão também o traz para o meio */
  document.addEventListener('click', (ev) => {
    if (automatico) return;
    const sep = (ev.target as Element).closest?.<HTMLElement>('.pq .ini3__separador'); if (!sep) return;
    const ini = sep.closest<HTMLElement>('.pq')!;
    requestAnimationFrame(() => { if (pode(ini)) aoMeio(ini, Number(sep.dataset.modo), true); });
  });
  document.addEventListener('pointerover', (ev) => { porCima = !!(ev.target as Element).closest?.('.pq .pq__modos'); });
  window.addEventListener('resize', () => { const ini = vivo(); if (ini && !pode(ini)) repor(ini); else armar(); });
}
