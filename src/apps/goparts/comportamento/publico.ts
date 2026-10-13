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
import { mostrar } from '../../../comum/ecras';

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

/** Monta o rolamento até g (0: só o anel de fora; as esferas entram uma a uma; 0,74–0,86 o anel de dentro)
 *  e roda as esferas e o anel de dentro o que o rolamento andou (x px, com tam px de diâmetro). */
function montar(el: Element, g: number, x: number, tam: number): void {
  el.querySelectorAll<SVGElement>('.pub__rolo-esfera').forEach((b, i) => {
    const k = lim((g - (0.03 + i * 0.085)) / 0.05), a = Number(b.dataset.a), d = (1 - k) * 9;
    b.style.opacity = k.toFixed(3);
    b.style.transform = `translate(${(Math.cos(a) * d).toFixed(2)}px, ${(Math.sin(a) * d).toFixed(2)}px)`;
  });
  /* o escuro entre os anéis só aparece com a primeira esfera: antes é só o anel de aço, com o furo */
  const folga = el.querySelector<SVGElement>('.pub__rolo-folga'); if (folga) folga.style.opacity = lim(g / 0.06).toFixed(3);
  const int = el.querySelector<SVGElement>('.pub__rolo-int');
  if (int) { const k = lim((g - 0.74) / 0.12); int.style.opacity = k.toFixed(3); int.style.transform = `scale(${(0.4 + k * 0.6).toFixed(3)})`; }
  const gira = el.querySelector<SVGElement>('.pub__rolo-gira');
  if (gira) gira.style.transform = quieto() ? 'none' : `rotate(${((x / (tam / 2)) * 180 / Math.PI).toFixed(1)}deg)`;
}

let pedido = 0;
function desenhar(): void {
  pedido = 0;
  const pub = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .pub');
  if (!pub) return;
  ligar(pub);
  /* a montagem ao longo das cinco páginas (ela: «o rolamento vai-se construindo ao longo dos ecrãs»):
     g de 0 (início da página pública) a 1 (fim dos Contactos) */
  const ordem = ['publico', 'publico-romafe', 'publico-entregas', 'publico-marcas', 'publico-contactos'];
  const tPag = lim(scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight));
  const g = (Math.max(0, ordem.indexOf(pub.closest<HTMLElement>('.ecra')?.dataset.ecra ?? 'publico')) + tPag) / ordem.length;
  const seg = pub.querySelector<HTMLElement>('.pub__percurso-pista'), sr = seg?.querySelector<SVGElement>('.pub__caps-rolo');
  if (seg && sr) {
    /* (anda só a largura do percurso: do «01 Início» ao «05 Contactos») */
    const lista = seg.nextElementSibling as HTMLElement | null, ult = lista?.lastElementChild as HTMLElement | null;
    const larg = ult && lista ? ult.getBoundingClientRect().right - lista.getBoundingClientRect().left : seg.clientWidth;
    const tam = sr.getBoundingClientRect().width || 44, x = g * Math.max(0, larg - tam);
    sr.style.transform = `translateX(${x.toFixed(1)}px)`;
    montar(sr, g, x, tam);
  }
  /* o rolamento do scroll: anda até ao fim da linha e roda o que andou (ângulo = distância / raio) */
  const rolo = pub.querySelector<HTMLElement>('.pub__rolo');
  if (rolo) {
    const t = lim(scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight));
    const r = rolo.querySelector<SVGElement>('.pub__rolo-rolamento'), linha = rolo.querySelector<HTMLElement>('.pub__rolo-linha');
    const tam = r?.getBoundingClientRect().width || 34, curso = rolo.clientWidth - tam, x = t * curso;
    if (linha) linha.style.transform = `scaleX(${t.toFixed(4)})`;
    if (r) { r.style.transform = `translateX(${x.toFixed(1)}px)`; r.style.setProperty('--rolo-x', `translateX(${x.toFixed(1)}px)`); }
    /* o da barra está sempre completo (ela: «o rolamento no scroll em cima estava top») */
    montar(rolo, 1, x, tam);
  }
  const abrir = pub.querySelector<HTMLElement>('.pub__abrir-fixo');
  if (abrir) abrir.style.setProperty('--k', (quieto() ? 1 : lim(progresso(abrir.parentElement!) * 1.6)).toFixed(3));
  /* como nasce um rolamento: o anel abre (clip-path --c, furo --f), as paletes SKF entram no fim (--s);
     o vídeo só corre com a secção à vista, abranda no terceiro passo e para com «reduzir movimento» */
  const nasce = pub.querySelector<HTMLElement>('.pub__nasce');
  if (nasce) {
    const n = nasce.querySelectorAll('.pub__nasce-frase').length, p = progresso(nasce) * (n - 1);
    const anel = nasce.querySelector<HTMLElement>('.pub__nasce-anel')!;
    const a = lim(p / 1.6), suave = a * a * (3 - 2 * a);
    anel.style.setProperty('--c', `${(34 + suave * 41).toFixed(2)}%`);
    anel.style.setProperty('--f', (0.5 * (1 - suave)).toFixed(3));
    anel.style.setProperty('--s', lim((p - (n - 1.6)) / 0.6).toFixed(3));
    const atual = Math.round(p);
    nasce.querySelectorAll<HTMLElement>('[data-passo]').forEach((el) => { if (Number(el.dataset.passo) === atual) el.setAttribute('aria-current', 'true'); else el.removeAttribute('aria-current'); });
    const v = nasce.querySelector<HTMLVideoElement>('.pub__nasce-video');
    const r = nasce.getBoundingClientRect(), aVista = r.top < innerHeight && r.bottom > 0;
    if (v) {
      v.playbackRate = atual === 2 ? 0.4 : 1;
      if (aVista && !quieto() && v.paused) v.play().catch(() => undefined);
      else if ((!aVista || quieto()) && !v.paused) v.pause();
    }
  }
  const h = pub.querySelector<HTMLElement>('.pub__historia');
  if (h) {
    const fotos = h.querySelectorAll<HTMLElement>('.pub__foto'), n = fotos.length;
    const p = progresso(h) * (n - 1);
    fotos.forEach((f, i) => { if (i) f.style.setProperty('--r', (quieto() ? (p >= i - 0.5 ? 1 : 0) : lim(p - i + 1)).toFixed(3)); });
    const atual = Math.round(p);
    h.querySelectorAll<HTMLElement>('[data-cap]').forEach((el) => { if (Number(el.dataset.cap) === atual) el.setAttribute('aria-current', 'true'); else el.removeAttribute('aria-current'); });
    h.querySelectorAll<HTMLElement>('.pub__caps-barra i').forEach((b, i) => b.style.setProperty('--f', lim(p - i + 1).toFixed(3)));
    /* o rolamento da história: rola por cima das barras e monta-se de 1945 a Amanhã */
    const pista = h.querySelector<HTMLElement>('.pub__caps-pista'), cr = pista?.querySelector<SVGElement>('.pub__caps-rolo');
    if (pista && cr) {
      const t2 = lim(p / (n - 1)), tam = cr.getBoundingClientRect().width || 44, x = t2 * (pista.clientWidth - tam);
      cr.style.transform = `translateX(${x.toFixed(1)}px)`;
      /* o da história monta-se nos próprios capítulos: oco em 1945, completo em Amanhã */
      montar(cr, t2, x, tam);
    }
  }
}
const pedir = () => { if (!pedido) pedido = requestAnimationFrame(desenhar); };

/** Um capítulo: leva o scroll ao ponto em que ele fica atual. */
function irCapitulo(h: HTMLElement, i: number): void {
  const n = h.querySelectorAll('.pub__foto').length, r = h.getBoundingClientRect();
  const alvo = scrollY + r.top - BARRA + (i / (n - 1)) * (r.height - (innerHeight - BARRA)) + 1;
  window.scrollTo({ top: alvo, behavior: quieto() ? 'auto' : 'smooth' });
}

/** A ligação entre as páginas públicas: a fotografia em que se carrega cresce até ser a fotografia grande da
 *  página seguinte (View Transitions; sem elas, ou com «reduzir movimento», troca-se logo). Corre na fase de
 *  captura da janela, antes da navegação do protótipo, e só nas ligações das páginas públicas. */
function ligar2(ev: MouseEvent): void {
  if (document.body.classList.contains('editando') || document.body.classList.contains('com-fluxo')) return;
  const a = (ev.target as Element).closest?.<HTMLElement>('.pub [data-ir]');
  const doc = document as Document & { startViewTransition?: (f: () => void) => { finished: Promise<void> } };
  if (!a || !doc.startViewTransition || quieto()) return;
  const destino = a.dataset.ir!;
  if (!document.querySelector(`.ecra[data-ecra="${destino}"]`)) return;
  ev.preventDefault(); ev.stopPropagation();
  const daqui = a.querySelector<HTMLElement>('.pub__seguinte-foto img') ?? document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .pub__vt');
  if (daqui) daqui.style.viewTransitionName = 'pub-foto';
  const t = doc.startViewTransition(() => {
    if (daqui) daqui.style.viewTransitionName = '';
    mostrar(destino);
    const ali = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .pub__vt');
    if (ali) ali.style.viewTransitionName = 'pub-foto';
  });
  t.finished.finally(() => document.querySelectorAll<HTMLElement>('.pub__vt').forEach((el) => { el.style.viewTransitionName = ''; }));
}

export function iniciar(): void {
  window.addEventListener('scroll', pedir, { passive: true });
  window.addEventListener('resize', pedir);
  ['romafe:versao', 'romafe:ecra'].forEach((e) => document.addEventListener(e, () => requestAnimationFrame(pedir)));
  window.addEventListener('hashchange', () => requestAnimationFrame(pedir));
  requestAnimationFrame(pedir);
  window.addEventListener('click', ligar2, true);
  document.addEventListener('click', (ev) => {
    if (document.body.classList.contains('editando')) return;
    /* «Voltar ao início»: a página sobe e o rolamento da barra rola de volta */
    if ((ev.target as Element).closest?.('.pub [data-topo]')) { window.scrollTo({ top: 0, behavior: quieto() ? 'auto' : 'smooth' }); return; }
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
