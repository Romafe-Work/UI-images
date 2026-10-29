/* =========================================================
   ERP — listas de escolha interativas (26 out. 2026). Ela, na Lista de Faltas v2: «quero selects interativos».
   A lista de um <select> nativo é do sistema e não se anima nem segue as cores do ERP; por isso, nos ecrãs v2 de
   Compras (.lf2: Lista de Faltas, Orçamentos, Encomendas, Faturas e Mapa recapitulativo), cada <select> ganha por cima um
   botão e uma lista própria (como no Peça A Peça, comportamento/select.ts de lá). O <select> continua por baixo e manda:
   escolher na lista muda o valor dele e dispara «change»; quando o código lhe muda o valor, as opções ou o desliga, o
   botão acompanha.
   - Teclado: com a lista fechada, ↓ ↑ Espaço ou Alt+↓ abrem-na e o Enter continua a passar ao campo seguinte (as páginas
     tratam disso); aberta, ↑ ↓ Home End mudam, uma letra salta para a opção, Enter escolhe, Esc e Tab fecham.
   - A lista vive no <body> (os cartões e os diálogos cortam o que sai deles) e copia as cores (--h-*) do ecrã.
   - Movimento só em transform/opacity: abre em 160 ms, as opções em cascata; com «reduzir movimento», abre logo.
   - O evento «esel:abrir» no <select> abre a lista (F4 na Série, como no ERP antigo).
   ========================================================= */
const ALVO = '.lf2 select:not([multiple]):not([data-esel-nao])';
const SETA = '<svg class="esel__seta" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" data-lucide="chevron-down"><path d="m6 9 6 6 6-6"/></svg>';
const VISTO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" data-lucide="check"><path d="M20 6 9 17l-5-5"/></svg>';
const TOKENS = ['--h-sup', '--h-sup-2', '--h-borda', '--h-borda-forte', '--h-tinta', '--h-tinta-2', '--h-tinta-3', '--h-azul', '--h-laranja'];
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
/* no editor, com «Interagir» ligado (26 out.), o ecrã responde como no protótipo */
const editando = () => (document.body.classList.contains('editando') && !document.body.classList.contains('ed-interagir')) || document.body.classList.contains('com-fluxo');
let n = 0;
const botoes = new WeakMap<HTMLSelectElement, HTMLButtonElement>();
let aberta: { sel: HTMLSelectElement; botao: HTMLButtonElement; lista: HTMLUListElement; ativa: number } | null = null;

function pintar(sel: HTMLSelectElement): void {
  const b = botoes.get(sel); if (!b) return;
  const o = sel.options[sel.selectedIndex];
  b.querySelector('.esel__texto')!.textContent = o ? o.text : '';
  b.disabled = sel.disabled;
  b.toggleAttribute('aria-invalid', sel.getAttribute('aria-invalid') === 'true');
  if (aberta?.sel === sel) desenharLista();
}
/** Põe o botão por cima de um <select>. Os atributos «-campo» (o Enter passa ao seguinte) mudam-se para o botão. */
function melhorar(sel: HTMLSelectElement): void {
  if (botoes.has(sel) || !sel.isConnected) return;
  const id = sel.id || `esel-${++n}`; if (!sel.id) sel.id = id;
  const caixa = document.createElement('div'); caixa.className = 'esel';
  const b = document.createElement('button'); b.type = 'button'; b.className = 'esel__botao'; b.id = `${id}-esel`;
  b.setAttribute('aria-haspopup', 'listbox'); b.setAttribute('aria-expanded', 'false');
  b.innerHTML = `<span class="esel__texto"></span>${SETA}`;
  [...sel.attributes].forEach((a) => { if (/^data-(lf2|dv2|rc)-campo$/.test(a.name) || a.name === 'data-ak-primeiro' || a.name === 'data-dv2-primeiro' || a.name === 'data-lf2-primeiro') { b.setAttribute(a.name, a.value); sel.removeAttribute(a.name); } });
  /* 29 out. (ela: «porque a minha demonstração do erp é tão lenta?»): o rótulo procura-se no ecrã do select e não na
     página inteira — com os 552 ecrãs na página (≈270 mil nós), cada procura no documento custava, e são centenas de selects */
  const raiz: ParentNode = sel.closest('.ecra') ?? document;
  const rot = sel.getAttribute('aria-label') ?? raiz.querySelector(`label[for="${CSS.escape(id)}"]`)?.querySelector('span')?.textContent ?? sel.closest('label')?.querySelector('span')?.textContent ?? '';
  if (rot) b.setAttribute('aria-label', rot.trim());
  sel.parentNode!.insertBefore(caixa, sel); caixa.append(sel, b);
  sel.tabIndex = -1; sel.setAttribute('aria-hidden', 'true'); sel.classList.add('esel__nativo');
  raiz.querySelectorAll<HTMLLabelElement>(`label[for="${CSS.escape(id)}"]`).forEach((l) => { l.htmlFor = b.id; });
  botoes.set(sel, b); pintar(sel);
  if (document.activeElement === sel) b.focus({ preventScroll: true });
  new MutationObserver(() => pintar(sel)).observe(sel, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'aria-invalid'] });
}
/* o código muda o valor (sel.value = …) sem «change»: o botão tem de acompanhar */
for (const prop of ['value', 'selectedIndex'] as const) {
  const d = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, prop)!;
  Object.defineProperty(HTMLSelectElement.prototype, prop, { ...d, set(this: HTMLSelectElement, v: never) { d.set!.call(this, v); if (botoes.has(this)) pintar(this); } });
}

function desenharLista(): void {
  if (!aberta) return;
  const { sel, lista } = aberta;
  lista.innerHTML = [...sel.options].map((o, i) => `<li role="option" id="${sel.id}-o${i}" data-i="${i}" aria-selected="${i === sel.selectedIndex}"${o.disabled ? ' aria-disabled="true"' : ''} class="${i === aberta!.ativa ? 'is-ativa' : ''}" style="--i:${Math.min(i, 10)}">${VISTO}<span>${o.text.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</span></li>`).join('');
  lista.setAttribute('aria-activedescendant', `${sel.id}-o${aberta.ativa}`);
}
function posicionar(): void {
  if (!aberta) return;
  const r = aberta.botao.getBoundingClientRect(), l = aberta.lista;
  const alt = Math.min(l.scrollHeight, 300), abaixo = innerHeight - r.bottom, cima = abaixo < alt + 12 && r.top > abaixo;
  l.style.left = `${Math.max(8, Math.min(r.left, innerWidth - Math.max(r.width, 180) - 8))}px`; l.style.minWidth = `${r.width}px`;
  l.style.top = cima ? `${r.top - alt - 4}px` : `${r.bottom + 4}px`; l.style.maxHeight = `${Math.max(140, cima ? r.top - 16 : abaixo - 16)}px`;
  l.style.transformOrigin = cima ? 'bottom' : 'top';
}
function abrir(sel: HTMLSelectElement): void {
  const b = botoes.get(sel); if (!b || b.disabled) return;
  fechar();
  const lista = document.createElement('ul'); lista.className = 'esel__lista'; lista.setAttribute('role', 'listbox'); lista.id = `${sel.id}-lista`; lista.tabIndex = -1;
  lista.setAttribute('aria-labelledby', b.id);
  const cs = getComputedStyle(b); TOKENS.forEach((t) => lista.style.setProperty(t, cs.getPropertyValue(t)));
  lista.style.fontFamily = cs.fontFamily;
  document.body.appendChild(lista);
  aberta = { sel, botao: b, lista, ativa: Math.max(0, sel.selectedIndex) };
  b.setAttribute('aria-expanded', 'true'); b.setAttribute('aria-controls', lista.id); b.classList.add('is-aberto');
  desenharLista(); posicionar();
  lista.querySelector('.is-ativa')?.scrollIntoView({ block: 'nearest' });
  if (!quieto()) {
    lista.animate([{ opacity: 0, transform: 'scaleY(.92) translateY(-3px)' }, { opacity: 1, transform: 'none' }], { duration: 160, easing: 'cubic-bezier(.22, 1, .36, 1)' });
    lista.querySelectorAll<HTMLElement>('li').forEach((li, i) => li.animate([{ opacity: 0, transform: 'translateY(-3px)' }, { opacity: 1, transform: 'none' }], { duration: 160, delay: Math.min(i, 10) * 14, easing: 'ease-out', fill: 'backwards' }));
  }
}
function fechar(focar = false): void {
  if (!aberta) return;
  const { botao, lista } = aberta; aberta = null;
  botao.setAttribute('aria-expanded', 'false'); botao.removeAttribute('aria-controls'); botao.classList.remove('is-aberto');
  if (quieto()) lista.remove(); else lista.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(-2px)' }], { duration: 100, easing: 'ease-in' }).finished.then(() => lista.remove(), () => lista.remove());
  if (focar) botao.focus();
}
function escolher(i: number): void {
  if (!aberta) return;
  const { sel } = aberta, o = sel.options[i]; if (!o || o.disabled) return;
  const mudou = sel.selectedIndex !== i;
  sel.selectedIndex = i; fechar(true);
  if (mudou) { sel.dispatchEvent(new Event('input', { bubbles: true })); sel.dispatchEvent(new Event('change', { bubbles: true })); }
  const b = botoes.get(sel); if (b && mudou && !quieto()) b.querySelector('.esel__texto')?.animate([{ opacity: .3, transform: 'translateY(3px)' }, { opacity: 1, transform: 'none' }], { duration: 160, easing: 'ease-out' });
}
function mover(d: number, abs?: number): void {
  if (!aberta) return;
  const os = aberta.sel.options; let i = abs ?? aberta.ativa;
  if (abs === undefined) { do { i = Math.max(0, Math.min(os.length - 1, i + d)); } while (os[i]?.disabled && i > 0 && i < os.length - 1); }
  aberta.ativa = i;
  aberta.lista.querySelectorAll('li').forEach((li) => li.classList.toggle('is-ativa', Number((li as HTMLElement).dataset.i) === i));
  aberta.lista.setAttribute('aria-activedescendant', `${aberta.sel.id}-o${i}`);
  aberta.lista.querySelector('.is-ativa')?.scrollIntoView({ block: 'nearest' });
}

export function iniciar(): void {
  const varrer = (r: ParentNode = document) => r.querySelectorAll<HTMLSelectElement>(ALVO).forEach(melhorar);
  requestAnimationFrame(() => varrer());
  /* só o que entrou, e não a página toda de cada vez que um ecrã se redesenha */
  new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((x) => { if (!(x instanceof Element)) return; if (x.matches(ALVO)) melhorar(x as HTMLSelectElement); else varrer(x); }))).observe(document.body, { childList: true, subtree: true });
  document.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement;
    const li = t.closest<HTMLElement>('.esel__lista li'); if (li) { escolher(Number(li.dataset.i)); return; }
    const b = t.closest<HTMLButtonElement>('.esel__botao');
    if (b && !editando()) { const sel = b.parentElement!.querySelector('select')!; if (aberta?.sel === sel) fechar(true); else abrir(sel); return; }
    if (aberta && !t.closest('.esel__lista')) fechar();
  }, true);
  document.addEventListener('mouseover', (ev) => { const li = (ev.target as HTMLElement).closest<HTMLElement>('.esel__lista li'); if (li && aberta) mover(0, Number(li.dataset.i)); });
  document.addEventListener('esel:abrir', (ev) => { const s = ev.target as HTMLSelectElement; if (botoes.has(s)) { botoes.get(s)!.focus(); abrir(s); } }, true);
  /* o teclado corre antes do das páginas (captura): com a lista aberta, as teclas são dela */
  document.addEventListener('keydown', (ev) => {
    const t = ev.target as HTMLElement;
    if (aberta) {
      const k = ev.key, para = () => { ev.preventDefault(); ev.stopImmediatePropagation(); };
      if (k === 'ArrowDown') { para(); mover(1); } else if (k === 'ArrowUp') { para(); mover(-1); }
      else if (k === 'Home') { para(); mover(0, 0); } else if (k === 'End') { para(); mover(0, aberta.sel.options.length - 1); }
      else if (k === 'Enter' || k === ' ') { para(); escolher(aberta.ativa); }
      else if (k === 'Escape') { para(); fechar(true); }
      else if (k === 'Tab') fechar();
      else if (k.length === 1 && /\S/.test(k)) { para(); const os = [...aberta.sel.options], i0 = aberta.ativa + 1, l = k.toLowerCase(); const j = [...os.slice(i0), ...os.slice(0, i0)].findIndex((o) => o.text.trim().toLowerCase().startsWith(l)); if (j >= 0) mover(0, (i0 + j) % os.length); }
      return;
    }
    if (!t.classList?.contains('esel__botao') || editando()) return;
    if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp' || ev.key === ' ' || (ev.altKey && ev.key === 'ArrowDown')) { ev.preventDefault(); ev.stopImmediatePropagation(); abrir(t.parentElement!.querySelector('select')!); }
  }, true);
  /* o foco que vá parar ao <select> escondido passa para o botão dele */
  document.addEventListener('focusin', (ev) => { const s = ev.target as HTMLSelectElement; if (s.classList?.contains('esel__nativo')) botoes.get(s)?.focus({ preventScroll: true }); });
  window.addEventListener('resize', () => fechar());
  document.addEventListener('scroll', (ev) => { if (aberta && !(ev.target as HTMLElement).closest?.('.esel__lista')) posicionar(); }, true);
}
