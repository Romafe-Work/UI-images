/* =========================================================
   GOPARTS — 00 · A página pública: as animações ligadas ao scroll (13 out. 2026)
   - cada secção ganha .is-visivel quando entra no ecrã (as entradas são CSS);
   - os números contam de 0 até ao valor quando aparecem (1,4 s);
   - a colagem do herói segue o rato com profundidade (--px, --py, de −0,5 a 0,5);
   - «do armazém à oficina»: o progresso do scroll na secção (0 a 3) revela cada
     fotografia com um círculo (--r) e troca a cena do texto e a barra ao lado;
   - a rota desenha-se com o scroll (--traco, de 0 a 1).
   Corre também no editor (o scroll não escolhe peças); um só rAF por frame.
   Com «reduzir movimento»: as fotografias e as cenas trocam sem círculo nem rodar.
   ========================================================= */
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const limitar = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));

function contar(el: HTMLElement): void {
  if (el.dataset.contado) return;
  el.dataset.contado = '1';
  const fim = Number(el.dataset.contar), mil = el.hasAttribute('data-mil'), mais = el.hasAttribute('data-mais');
  const fmt = (n: number) => (mil ? Math.round(n).toLocaleString('pt-PT').replace(/\s|\./g, ' ') : String(Math.round(n))) + (mais ? '+' : '');
  if (quieto()) { el.textContent = fmt(fim); return; }
  const t0 = performance.now();
  const passo = (t: number) => {
    const k = limitar((t - t0) / 1400), e = 1 - Math.pow(1 - k, 4);
    el.textContent = fmt(fim * e);
    if (k < 1) requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}

let observador: IntersectionObserver | null = null;
function ligar(pub: HTMLElement): void {
  if (pub.dataset.ligada) return;
  pub.dataset.ligada = '1';
  observador = observador || new IntersectionObserver((entradas) => entradas.forEach((e) => {
    if (!e.isIntersecting) return;
    const s = e.target as HTMLElement;
    s.classList.add('is-visivel');
    s.querySelectorAll<HTMLElement>('[data-contar]').forEach(contar);
  }), { threshold: 0, rootMargin: '0px 0px -12% 0px' }); /* (com 25 %, uma secção mais alta do que 4 ecrãs nunca aparecia no telemóvel) */
  pub.querySelectorAll<HTMLElement>('section').forEach((s) => observador!.observe(s));
}

let pedido = 0;
function aoScroll(): void {
  if (pedido) return;
  pedido = requestAnimationFrame(() => {
    pedido = 0;
    const pub = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .pub');
    if (!pub) return;
    ligar(pub);
    const vh = innerHeight;
    /* a história: 0 no início da secção, 3 quando a última cena está à vista */
    const h = pub.querySelector<HTMLElement>('.pub__historia');
    if (h) {
      const r = h.getBoundingClientRect();
      const p = limitar(-r.top / (r.height - vh), 0, 1) * 3;
      h.querySelectorAll<HTMLElement>('.pub__foto').forEach((f, i) => {
        const v = i === 0 ? 1 : quieto() ? (p >= i - 0.5 ? 1 : 0) : limitar((p - i + 0.85) / 0.7);
        f.style.setProperty('--r', v.toFixed(3));
      });
      const atual = Math.min(3, Math.round(p));
      h.querySelectorAll<HTMLElement>('.pub__cena').forEach((c, i) => { if (i === atual) c.setAttribute('aria-current', 'true'); else c.removeAttribute('aria-current'); });
      h.querySelectorAll<HTMLElement>('.pub__progresso li').forEach((l, i) => l.style.setProperty('--f', limitar(p - i + 1).toFixed(3)));
    }
    /* a rota: desenha-se enquanto a secção atravessa o ecrã */
    const rota = pub.querySelector<HTMLElement>('.pub__rota');
    if (rota) {
      const r = rota.getBoundingClientRect();
      const t = quieto() ? 1 : limitar((vh - r.top) / (vh + r.height * 0.4));
      rota.style.setProperty('--traco', t.toFixed(3));
    }
  });
}

/** A colagem do herói segue o rato (só com rato e sem «reduzir movimento»). */
function aoRato(ev: PointerEvent): void {
  if (ev.pointerType !== 'mouse' || quieto()) return;
  const heroi = (ev.target as Element).closest?.('.pub__heroi');
  const col = heroi?.querySelector<HTMLElement>('.pub__colagem');
  if (!heroi || !col) return;
  const r = heroi.getBoundingClientRect();
  col.style.setProperty('--px', ((ev.clientX - r.left) / r.width - 0.5).toFixed(3));
  col.style.setProperty('--py', ((ev.clientY - r.top) / r.height - 0.5).toFixed(3));
}

/** 00.4 · Contactos: o pedido de acesso não sai daqui (é um protótipo); mostra a confirmação. */
function aoEnviar(ev: SubmitEvent): void {
  const form = (ev.target as Element).closest?.<HTMLFormElement>('.pubp__form');
  if (!form) return;
  ev.preventDefault();
  form.querySelector<HTMLElement>('.pubp__enviado')?.removeAttribute('hidden');
}

export function iniciar(): void {
  document.addEventListener('submit', aoEnviar);
  document.addEventListener('pointermove', aoRato, { passive: true });
  window.addEventListener('scroll', aoScroll, { passive: true });
  window.addEventListener('resize', aoScroll);
  ['romafe:versao', 'romafe:ecra'].forEach((e) => document.addEventListener(e, () => requestAnimationFrame(aoScroll)));
  window.addEventListener('hashchange', () => requestAnimationFrame(aoScroll));
  requestAnimationFrame(aoScroll);
}
