/* =========================================================
   GOPARTS — 00 · A página pública e as do menu: o que mexe com o scroll (13 out. 2026)
   - cada secção ganha .is-visivel quando entra no ecrã (as entradas são CSS);
   - os números contam de 0 até ao valor quando aparecem (1,4 s);
   - o herói: a fotografia abre de cartão para a largura toda (--k, de 0 a 1);
   - a história: o progresso (0 ao último capítulo) faz entrar cada fotografia por baixo
     (--r), enche a barra de cada capítulo (--f) e marca o capítulo atual;
   - os capítulos levam o scroll ao sítio; «Pedir acesso» (00.4) mostra a confirmação.
   Corre também no editor (o scroll não escolhe peças); um só rAF por frame.
   Com «reduzir movimento», as fotografias trocam sem deslizar.
   ========================================================= */
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const lim = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const BARRA = 72;

function contar(el: HTMLElement): void {
  if (el.dataset.contado) return;
  el.dataset.contado = '1';
  const fim = Number(el.dataset.contar), mil = el.hasAttribute('data-mil'), mais = el.hasAttribute('data-mais');
  /* (à mão: o pt-PT não agrupa os números de quatro algarismos, e «6000» ao lado de «75 000» parecia erro) */
  const fmt = (n: number) => (mil ? String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : String(Math.round(n))) + (mais ? '+' : '');
  if (quieto()) { el.textContent = fmt(fim); return; }
  const t0 = performance.now();
  const passo = (t: number) => {
    const k = lim((t - t0) / 1400), e = 1 - Math.pow(1 - k, 4);
    el.textContent = fmt(fim * e);
    if (k < 1) requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}

let observador: IntersectionObserver | null = null;
function ligar(pub: HTMLElement): void {
  if (pub.dataset.ligada) return;
  pub.dataset.ligada = '1';
  /* (com 25 % visível, uma secção mais alta do que quatro ecrãs nunca aparecia no telemóvel) */
  observador = observador || new IntersectionObserver((entradas) => entradas.forEach((e) => {
    if (!e.isIntersecting) return;
    const s = e.target as HTMLElement;
    s.classList.add('is-visivel');
    s.querySelectorAll<HTMLElement>('[data-contar]').forEach(contar);
  }), { threshold: 0, rootMargin: '0px 0px -12% 0px' });
  pub.querySelectorAll<HTMLElement>('section').forEach((s) => observador!.observe(s));
}

/** O progresso numa secção alta com uma parte parada: 0 quando a parte prende, 1 quando solta. */
const progresso = (sec: HTMLElement) => { const r = sec.getBoundingClientRect(); return lim((BARRA - r.top) / Math.max(1, r.height - (innerHeight - BARRA))); };

let pedido = 0;
function desenhar(): void {
  pedido = 0;
  const pub = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .pub');
  if (!pub) return;
  ligar(pub);
  const abrir = pub.querySelector<HTMLElement>('.pub__abrir-fixo');
  if (abrir) abrir.style.setProperty('--k', (quieto() ? 1 : lim(progresso(abrir.parentElement!) * 1.6)).toFixed(3));
  const h = pub.querySelector<HTMLElement>('.pub__historia');
  if (h) {
    const fotos = h.querySelectorAll<HTMLElement>('.pub__foto'), n = fotos.length;
    const p = progresso(h) * (n - 1);
    fotos.forEach((f, i) => { if (i) f.style.setProperty('--r', (quieto() ? (p >= i - 0.5 ? 1 : 0) : lim(p - i + 1)).toFixed(3)); });
    const atual = Math.round(p);
    h.querySelectorAll<HTMLElement>('[data-cap]').forEach((el) => { if (Number(el.dataset.cap) === atual) el.setAttribute('aria-current', 'true'); else el.removeAttribute('aria-current'); });
    h.querySelectorAll<HTMLElement>('.pub__caps-barra i').forEach((b, i) => b.style.setProperty('--f', lim(p - i + 1).toFixed(3)));
  }
}
const pedir = () => { if (!pedido) pedido = requestAnimationFrame(desenhar); };

/** Um capítulo: leva o scroll ao ponto em que ele fica atual. */
function irCapitulo(h: HTMLElement, i: number): void {
  const n = h.querySelectorAll('.pub__foto').length, r = h.getBoundingClientRect();
  const alvo = scrollY + r.top - BARRA + (i / (n - 1)) * (r.height - (innerHeight - BARRA)) + 1;
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
    const b = (ev.target as Element).closest?.<HTMLElement>('.pub__caps button[data-cap]');
    const h = b?.closest<HTMLElement>('.pub__historia');
    if (b && h) irCapitulo(h, Number(b.dataset.cap));
  });
  /* 00.4 · Contactos: o pedido de acesso não sai daqui (é um protótipo); mostra a confirmação */
  document.addEventListener('submit', (ev) => {
    const form = (ev.target as Element).closest?.<HTMLFormElement>('.pubp__form');
    if (!form) return;
    ev.preventDefault();
    form.querySelector<HTMLElement>('.pubp__enviado')?.removeAttribute('hidden');
  });
}
