/* =========================================================
   GOPARTS — o movimento com o scroll (20 out. 2026, V6)
   Pedido dela: «scroll trigger, scroll linked, parallax, sticky, horizontal scroll». No Início e na Pesquisar peças,
   onde cada um serve para alguma coisa:
   - Ao entrar no ecrã (scroll-triggered): os blocos abaixo da dobra aparecem quando chegam (opacidade e 12 px,
     380 ms), uma vez só por visita ao ecrã. O que já está à vista não se mexe.
   - Ligado ao scroll (scroll-linked): a barra fina de progresso no cimo da janela; a saudação do Início esbate-se
     e encolhe enquanto sai de vista. Em CSS (animation-timeline) quando o navegador o tem; senão, aqui.
   - Parallax: os desenhos dos carros (veículo identificado, garagem) andam um pouco mais devagar do que a página.
   - Sticky: o atalho da pesquisa do Início e os três cartões da Pesquisar peças (com resultados) ficam presos em
     cima; quando estão presos ganham a linha de baixo (is-preso), vista por uma sentinela.
   - Horizontal: as Categorias da Pesquisar peças ficam presas e deslizam para o lado à medida que se desce (a
     altura da secção é a do caminho a percorrer). No telemóvel, é uma faixa que se arrasta, com encaixe.
   Só transform e opacity. Com «reduzir movimento», no editor e nos estados do protótipo, nada disto corre.
   ========================================================= */
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const editando = () => document.body.classList.contains('editando') || document.body.classList.contains('com-fluxo');
const visivel = (): HTMLElement | null => document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .portal');
const CSS_LIGADO = typeof CSS !== 'undefined' && CSS.supports?.('animation-timeline: scroll()');
const CURVA = 'cubic-bezier(.22, 1, .36, 1)';
/** O que aparece ao entrar no ecrã. */
const BLOCOS = '.pn__w, .pn__procura, .ini4__bloco, .pq__avancada';

/* ---------- ao entrar no ecrã ---------- */
let obs: IntersectionObserver | null = null;
function aparecer(portal: HTMLElement): void {
  obs?.disconnect();
  if (quieto() || editando() || portal.querySelector('[data-estado]')) return;
  obs = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target as HTMLElement; obs!.unobserve(el);
    el.classList.remove('rl-espera');
    el.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: CURVA });
  }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  const alto = window.innerHeight;
  portal.querySelectorAll<HTMLElement>(BLOCOS).forEach((el) => {
    if (el.hidden || el.getBoundingClientRect().top < alto * .92) return;
    el.classList.add('rl-espera'); obs!.observe(el);
  });
}

/* ---------- presos em cima ----------
   Sem elementos a mais: observa-se o próprio bloco com a margem de cima do sítio onde fica preso; quando deixa de
   caber inteiro e está nesse sítio, está preso. */
const presosObs: IntersectionObserver[] = [];
function presos(portal: HTMLElement): void {
  presosObs.splice(0).forEach((o) => o.disconnect());
  portal.querySelectorAll<HTMLElement>('.pn__procura, .pq__modos').forEach((alvo) => {
    const top = parseFloat(getComputedStyle(alvo).top) || 0;
    const o = new IntersectionObserver(([e]) => { alvo.classList.toggle('is-preso', e.intersectionRatio < 1 && e.boundingClientRect.top <= top + 1.5); }, { rootMargin: `${-(top + 1)}px 0px 0px 0px`, threshold: [1] });
    o.observe(alvo); presosObs.push(o);
  });
}

/* ---------- a faixa horizontal das categorias ---------- */
type Faixa = { sec: HTMLElement; janela: HTMLElement; pista: HTMLElement; dx: number };
const TOPO = 16;
let faixas: Faixa[] = [];
function medirFaixas(portal: HTMLElement): void {
  faixas = [];
  portal.querySelectorAll<HTMLElement>('.pq .ini4__bloco--categorias').forEach((sec) => {
    const pista = sec.querySelector<HTMLElement>('.ini4__categorias'); if (!pista) return;
    /* o conteúdo numa janela que fica presa (uma vez) */
    let janela = sec.querySelector<HTMLElement>(':scope > .rl-janela');
    if (!janela) { janela = document.createElement('div'); janela.className = 'rl-janela'; janela.dataset.faixa = ''; janela.append(...Array.from(sec.childNodes)); sec.append(janela); }
    const ligar = !quieto() && !editando() && window.matchMedia('(min-width: 768px)').matches && !sec.closest('[data-estado]');
    sec.classList.toggle('rl-horizontal', ligar);
    pista.style.transform = '';
    if (!ligar) { sec.style.removeProperty('height'); return; }
    const cs = getComputedStyle(janela), livre = janela.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const dx = Math.max(0, pista.scrollWidth - livre);
    /* a secção é tão alta como a janela mais o caminho para o lado: desce-se dx px enquanto ela anda dx px */
    sec.style.height = `${Math.round(janela.offsetHeight + dx)}px`;
    faixas.push({ sec, janela, pista, dx });
  });
  andar();
}
function andar(): void {
  faixas.forEach(({ sec, janela, pista, dx }) => {
    /* presa ao meio da janela (css): o caminho começa quando a secção chega a esse sítio */
    const topo = parseFloat(getComputedStyle(janela).top) || TOPO;
    const r = sec.getBoundingClientRect(), percurso = r.height - janela.offsetHeight;
    const p = percurso > 0 ? Math.min(1, Math.max(0, (topo - r.top) / percurso)) : 0;
    pista.style.transform = `translate3d(${(-dx * p).toFixed(1)}px, 0, 0)`;
    janela.style.setProperty('--rl-p', p.toFixed(3));
  });
}

/* ---------- o que o CSS não faz sozinho (sem animation-timeline) ---------- */
function ligadoSemCss(): void {
  if (CSS_LIGADO || quieto()) return;
  const h = document.documentElement, p = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
  document.querySelectorAll<HTMLElement>('.ecra:not([hidden]) .rl-progresso').forEach((b) => { b.style.transform = `scaleX(${p.toFixed(4)})`; });
}

/* ---------- ligar ---------- */
let atual: HTMLElement | null = null;
function armar(): void {
  const portal = visivel();
  if (!portal || portal === atual) { if (!portal) atual = null; return; }
  atual = portal;
  if (!portal.querySelector(':scope > .rl-progresso') && (portal.classList.contains('portal--pn') || portal.classList.contains('portal--pq'))) portal.insertAdjacentHTML('afterbegin', '<i class="rl-progresso" aria-hidden="true"></i>');
  requestAnimationFrame(() => { aparecer(portal); presos(portal); medirFaixas(portal); ligadoSemCss(); });
}

export function iniciar(): void {
  requestAnimationFrame(armar);
  document.addEventListener('romafe:versao', () => { atual = null; requestAnimationFrame(armar); });
  let raf = 0;
  window.addEventListener('scroll', () => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; andar(); ligadoSemCss(); }); }, { passive: true });
  let rt = 0;
  window.addEventListener('resize', () => { window.clearTimeout(rt); rt = window.setTimeout(() => { const p = visivel(); if (p) medirFaixas(p); }, 150); });
  /* as categorias redesenham-se (a pesquisa refaz os blocos): volta a medir */
  new MutationObserver(() => { const p = visivel(); if (p && faixas.some((f) => !f.sec.isConnected)) medirFaixas(p); }).observe(document.body, { childList: true, subtree: true });
}
