/* =========================================================
   ROMAFE — a barra de rolar com um rolamento (18 nov. 2026). Ela, com um print da barra do Windows: «aqui quero um
   rolamento para fazer scroll e não este scroll». A barra do sistema esconde-se e no lugar dela fica um carril fino
   com um rolamento pequeno (anel, gaiola laranja, esferas) que desce pelo carril e GIRA à medida que se rola, como se
   rodasse no carril (o ângulo é a distância andada sobre o perímetro).
     - arrastar o rolamento rola; tocar no carril salta para lá; a roda do rato e o teclado rolam como sempre;
     - só aparece quando há o que rolar; fica discreto e acende ao passar o rato ou enquanto se rola;
     - serve a página (document) e as zonas que rolam dadas por seletor (os painéis da área de trabalho);
     - role="scrollbar" com aria-valuenow; com «reduzir movimento» desliza sem girar.
   CSS em src/comum/css/rolar-rolamento.css.
   ========================================================= */
const TAM = 22; // o diâmetro do rolamento, em px
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function svg(): string {
  const n = 8, esferas = Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2; return `<circle cx="${(Math.cos(a) * 7.2).toFixed(2)}" cy="${(Math.sin(a) * 7.2).toFixed(2)}" r="1.9" class="rr-esf"/>`; }).join('');
  return `<svg viewBox="-12 -12 24 24" aria-hidden="true"><circle r="10.6" class="rr-ext"/><circle r="7.2" class="rr-gaiola"/>${esferas}<circle r="4.2" class="rr-int"/><circle r="1.6" class="rr-eixo"/></svg>`;
}

interface Barra { alvo: HTMLElement; doc: boolean; carril: HTMLElement; rol: HTMLElement; ro?: ResizeObserver; t?: number }
const barras = new Map<HTMLElement, Barra>();

function medidas(b: Barra) {
  const el = b.alvo, top = b.doc ? 0 : el.getBoundingClientRect().top, alt = b.doc ? window.innerHeight : el.clientHeight;
  return { sh: el.scrollHeight, ch: b.doc ? window.innerHeight : el.clientHeight, st: el.scrollTop, top, alt };
}
function pintar(b: Barra): void {
  if (!b.alvo.isConnected) { soltar(b.alvo); return; }
  const m = medidas(b), ha = m.sh - m.ch > 2;
  b.carril.hidden = !ha; if (!ha) return;
  if (!b.doc) { const r = b.alvo.getBoundingClientRect(); Object.assign(b.carril.style, { top: `${r.top + 2}px`, height: `${r.height - 4}px`, left: `${r.right - 16}px` }); }
  const curso = (b.doc ? window.innerHeight : b.alvo.clientHeight) - 4 - TAM, p = m.st / (m.sh - m.ch);
  const y = Math.max(0, Math.min(1, p)) * curso, graus = quieto() ? 0 : (m.st / (Math.PI * TAM)) * 360;
  b.rol.style.transform = `translateY(${y.toFixed(1)}px) rotate(${graus.toFixed(1)}deg)`;
  b.carril.style.setProperty('--rr-p', `${(y + TAM / 2).toFixed(1)}px`);
  b.carril.setAttribute('aria-valuenow', String(Math.round(p * 100)));
}
function acender(b: Barra): void { b.carril.classList.add('is-a-rolar'); window.clearTimeout(b.t); b.t = window.setTimeout(() => b.carril.classList.remove('is-a-rolar'), 900); }
function irPara(b: Barra, clientY: number, suave: boolean): void {
  const r = b.carril.getBoundingClientRect(), curso = r.height - TAM, p = Math.max(0, Math.min(1, (clientY - r.top - TAM / 2) / curso));
  const m = medidas(b); b.alvo.scrollTo({ top: p * (m.sh - m.ch), behavior: suave && !quieto() ? 'smooth' : 'auto' });
}

/** Põe o rolamento num alvo: a página (document.scrollingElement) ou uma zona que rola. */
export function prender(alvo: HTMLElement, doc = false): void {
  if (barras.has(alvo)) return;
  const carril = document.createElement('div');
  carril.className = `rr${doc ? ' rr--doc' : ''}`; carril.setAttribute('role', 'scrollbar'); carril.setAttribute('aria-orientation', 'vertical');
  carril.setAttribute('aria-valuemin', '0'); carril.setAttribute('aria-valuemax', '100'); carril.setAttribute('aria-label', 'Rolar');
  carril.innerHTML = `<i class="rr-trilho" aria-hidden="true"></i><span class="rr-rol">${svg()}</span>`;
  const rol = carril.querySelector<HTMLElement>('.rr-rol')!;
  const b: Barra = { alvo, doc, carril, rol };
  barras.set(alvo, b);
  (doc ? document.documentElement : alvo).classList.add('rr-sem-barra');
  document.body.appendChild(carril);
  const onScroll = () => { pintar(b); acender(b); };
  (doc ? window : alvo).addEventListener('scroll', onScroll, { passive: true });
  b.ro = new ResizeObserver(() => pintar(b)); b.ro.observe(doc ? document.body : alvo);
  if (!doc && alvo.firstElementChild) b.ro.observe(alvo.firstElementChild);
  /* arrastar o rolamento */
  rol.addEventListener('pointerdown', (ev) => {
    ev.preventDefault(); ev.stopPropagation(); rol.setPointerCapture(ev.pointerId); carril.classList.add('is-arrastar');
    const r = rol.getBoundingClientRect(), dy = ev.clientY - (r.top + TAM / 2);
    const mover = (m: PointerEvent) => irPara(b, m.clientY - dy, false);
    const largar = () => { rol.removeEventListener('pointermove', mover); rol.removeEventListener('pointerup', largar); rol.removeEventListener('pointercancel', largar); carril.classList.remove('is-arrastar'); };
    rol.addEventListener('pointermove', mover); rol.addEventListener('pointerup', largar); rol.addEventListener('pointercancel', largar);
  });
  /* tocar no carril salta para lá */
  carril.addEventListener('pointerdown', (ev) => { if (ev.target === rol || rol.contains(ev.target as Node)) return; ev.preventDefault(); irPara(b, ev.clientY, true); });
  /* a roda por cima do carril rola o alvo (o carril está por cima, fora dele) */
  carril.addEventListener('wheel', (ev) => { ev.preventDefault(); alvo.scrollBy({ top: ev.deltaY }); }, { passive: false });
  pintar(b);
}
function soltar(alvo: HTMLElement): void {
  const b = barras.get(alvo); if (!b) return;
  b.ro?.disconnect(); b.carril.remove(); barras.delete(alvo);
}

/** Liga o rolamento à página e às zonas do seletor (as que aparecerem depois também). */
export function iniciarRolamento(seletor = ''): void {
  if (!('ResizeObserver' in window)) return;
  const se = document.scrollingElement as HTMLElement | null;
  if (se) prender(se, true);
  const pintarTodas = () => barras.forEach(pintar);
  window.addEventListener('resize', pintarTodas);
  if (!seletor) return;
  let pendente = 0;
  const procurar = () => { pendente = 0; document.querySelectorAll<HTMLElement>(seletor).forEach((el) => prender(el)); barras.forEach((b) => { if (!b.alvo.isConnected) soltar(b.alvo); else pintar(b); }); };
  procurar();
  new MutationObserver(() => { if (!pendente) pendente = window.setTimeout(procurar, 120); }).observe(document.body, { childList: true, subtree: true });
}
