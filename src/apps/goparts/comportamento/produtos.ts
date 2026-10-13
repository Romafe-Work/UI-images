/* =========================================================
   GOPARTS — 00 · A página pública v2 (os produtos Romafe): o scroll manda (13 out. 2026)
   O progresso no palco vai de 0 à última cena (--n − 1); a cada frame:
     - cada peça vale entre data-de e data-ate; fora disso sobe, roda, encolhe e
       desvanece (d = distância à sua cena);
     - o rolamento abre-se de 0,15 a 0,85: os anéis afastam-se e as esferas soltam-se;
     - o disco claro passa de sítio em sítio; as esferas soltas sobem a ritmos diferentes;
     - a cena mais próxima fica atual (texto, pontos e menu).
   Pontos, menu e «Seguinte» levam o scroll à cena (suave, salvo «reduzir movimento»).
   No editor não se clica (as peças escolhem-se); o scroll continua a mexer.
   ========================================================= */
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const lim = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const suave = (t: number) => 1 - Math.pow(1 - t, 3);
const BARRA = 72;
/* onde está o disco claro em cada cena: x, y (fração do palco) e escala */
const LUA: [number, number, number][] = [[0.66, 0.14, 1], [0.6, 0.32, 1.3], [0.74, 0.1, 0.85], [0.52, 0.42, 1.1], [0.7, 0.22, 0.95]];
/* v3: as fotografias da Romafe no lugar da lua — mexem pouco (um encaixe, não um astro) */
const FOTO: [number, number, number][] = [[0.73, 0.4, 1], [0.7, 0.44, 1.04], [0.75, 0.38, 0.98], [0.71, 0.42, 1.02], [0.74, 0.4, 1]];

const palcoVisivel = () => document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .pp__palco');

function progresso(palco: HTMLElement): number {
  const n = Number(getComputedStyle(palco).getPropertyValue('--n')) || 5;
  const r = palco.getBoundingClientRect(), curso = r.height - (innerHeight - BARRA);
  return lim((BARRA - r.top) / Math.max(1, curso)) * (n - 1);
}

let pedido = 0;
function desenhar(): void {
  pedido = 0;
  const palco = palcoVisivel();
  if (!palco) return;
  const p = progresso(palco), q = quieto();
  const fixo = palco.querySelector<HTMLElement>('.pp__fixo')!;
  palco.querySelectorAll<SVGElement>('.pp__peca').forEach((el) => {
    const de = Number(el.dataset.de), ate = Number(el.dataset.ate);
    const d = p < de ? p - de : p > ate ? p - ate : 0, a = Math.abs(d);
    el.style.opacity = lim(1 - (a - 0.12) / 0.38).toFixed(3);
    el.style.transform = q ? 'none' : `translate(${(d * -8).toFixed(2)}%, ${(d * -16).toFixed(2)}%) rotate(${(d * -40).toFixed(1)}deg) scale(${(1 - Math.min(a, 1) * 0.35).toFixed(3)})`;
  });
  /* o rolamento abre-se */
  const rol = palco.querySelector<SVGElement>('.pp__rolamento');
  if (rol) {
    const e = q ? (p > 0.5 ? 1 : 0) : suave(lim((p - 0.15) / 0.7));
    const set = (sel: string, t: string) => { const g = rol.querySelector<SVGElement>(sel); if (g) g.style.transform = t; };
    set('.pp__ext', `translate(${-e * 46}px, ${-e * 34}px) scale(${1 + e * 0.12})`);
    set('.pp__int', `translate(${e * 34}px, ${e * 42}px) scale(${1 - e * 0.12})`);
    set('.pp__gaiola', `scale(${1 + e * 0.32})`);
    const gaiola = rol.querySelector<SVGElement>('.pp__gaiola'); if (gaiola) gaiola.style.opacity = (1 - e * 0.75).toFixed(3);
    /* v3: a folga escura entre os anéis só existe com o rolamento fechado */
    const folga = rol.querySelector<SVGElement>('.pp__folga'); if (folga) folga.style.opacity = (1 - e).toFixed(3);
    rol.querySelectorAll<SVGElement>('.pp__esfera').forEach((b, k) => {
      const ang = (Number(b.dataset.a) * Math.PI) / 180, dist = e * (50 + (k % 3) * 42);
      b.style.transform = `translate(${(Math.cos(ang) * dist).toFixed(1)}px, ${(Math.sin(ang) * dist).toFixed(1)}px)`;
    });
  }
  /* o disco claro */
  const lua = palco.querySelector<HTMLElement>('.pp__lua');
  if (lua) {
    const i = Math.min(LUA.length - 2, Math.floor(p)), t = q ? Math.round(p - i) : (() => { const x = lim(p - i); return x * x * (3 - 2 * x); })();
    const foto = lua.classList.contains('pp__lua--foto'), POS = foto ? FOTO : LUA;
    const [x1, y1, s1] = POS[i], [x2, y2, s2] = POS[i + 1];
    const W = fixo.clientWidth, H = fixo.clientHeight, tam = lua.offsetWidth, alt = lua.offsetHeight;
    /* no telemóvel o texto fica em cima: o disco anda só na metade de baixo */
    const movel = W < 900, fx = (v: number) => (movel ? 0.15 + v * 0.8 : v), fy = (v: number) => (movel ? 0.5 + v * 0.55 : v);
    /* (no telemóvel a fotografia fica centrada por baixo do texto) */
    const x = (movel && foto ? 0.5 : fx(x1 + (x2 - x1) * t)) * W - tam / 2, y = (movel && foto ? 0.68 : fy(y1 + (y2 - y1) * t)) * H - alt / 2, s = s1 + (s2 - s1) * t;
    lua.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${s.toFixed(3)})`;
    /* cada fotografia vale na sua família e troca com a seguinte a meio do caminho */
    if (foto) lua.querySelectorAll<HTMLElement>('figure').forEach((fig, k) => { fig.style.opacity = lim(1 - Math.abs(p - k) * (q ? 2 : 1.6)).toFixed(3); });
  }
  /* as esferas soltas sobem, cada uma ao seu ritmo */
  if (!q) palco.querySelectorAll<HTMLElement>('.pp__solta').forEach((s) => { s.style.transform = `translateY(${(-p * Number(s.dataset.v) * 0.4).toFixed(1)}px)`; });
  /* a cena atual */
  const atual = Math.round(p);
  const marcar = (els: NodeListOf<HTMLElement>) => els.forEach((el) => { if (Number(el.dataset.cena) === atual) el.setAttribute('aria-current', 'true'); else el.removeAttribute('aria-current'); });
  marcar(palco.querySelectorAll<HTMLElement>('.pp__cena, .pp__ponto'));
  const pp = palco.closest('.pp');
  if (pp) marcar(pp.querySelectorAll<HTMLElement>('.pp__nav a'));
  palco.classList.toggle('is-a-meio', p > 0.1);
}
const pedir = () => { if (!pedido) pedido = requestAnimationFrame(desenhar); };

/** Leva o scroll à cena i. */
function irPara(palco: HTMLElement, i: number): void {
  const n = Number(getComputedStyle(palco).getPropertyValue('--n')) || 5;
  const r = palco.getBoundingClientRect(), curso = r.height - (innerHeight - BARRA);
  const alvo = scrollY + r.top - BARRA + (lim(i, 0, n - 1) / (n - 1)) * curso + 1;
  window.scrollTo({ top: alvo, behavior: quieto() ? 'auto' : 'smooth' });
}

export function iniciar(): void {
  window.addEventListener('scroll', pedir, { passive: true });
  window.addEventListener('resize', pedir);
  ['romafe:versao', 'romafe:ecra'].forEach((e) => document.addEventListener(e, () => requestAnimationFrame(pedir)));
  window.addEventListener('hashchange', () => requestAnimationFrame(pedir));
  requestAnimationFrame(pedir);
  document.addEventListener('click', (ev) => {
    if (document.body.classList.contains('editando')) return;
    const alvo = (ev.target as Element).closest?.<HTMLElement>('.pp [data-cena]:not(.pp__cena), .pp [data-seguinte]');
    const palco = palcoVisivel();
    if (!alvo || !palco) return;
    ev.preventDefault();
    const i = alvo.hasAttribute('data-seguinte') ? Math.min(Math.round(progresso(palco)) + 1, palco.querySelectorAll('.pp__cena').length) : Number(alvo.dataset.cena);
    if (i >= palco.querySelectorAll('.pp__cena').length) palco.closest('.pp')?.querySelector('.pp__fim')?.scrollIntoView({ behavior: quieto() ? 'auto' : 'smooth' });
    else irPara(palco, i);
  });
}
