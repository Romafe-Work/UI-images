/* =========================================================
   ERP — Início v7, «The Living Workspace»: o movimento ligado (23 out. 2026). Ver espaco-vivo.ts.
   Como funciona: antes de cada redesenho, `antes()` fotografa o que importa (os separadores, o ativo, as janelas,
   os grupos do menu, a área); depois, `depois()` compara e anima a diferença — o estado já mudou e já se pode
   trabalhar; a animação corre por cima, com clones fixos que não recebem o rato (pointer-events: none).
     - separador novo de um módulo (pasta:…) → a pasta transforma-se no espaço de trabalho;
     - separador novo de um ecrã → o documento voa do cartão (ou do item) até ao separador e o ecrã abre dele;
     - separador fechado → encolhe; os outros chegam-se (FLIP); se a casa ficou à vista, o documento volta ao cartão;
     - outro separador ativo → o indicador desliza, o painel e a barra de ações entram curtos;
     - janela nova → nasce do botão que a abriu; janela fechada → volta para lá e o foco regressa ao botão;
     - menu: grupos em cascata, a guia a crescer, o indicador ativo a deslizar, recolher sem animar larguras.
   Só transform, opacidade e clip-path; posições medidas, nunca fixas. Com «reduzir movimento», nada disto corre.
   ========================================================= */
import type { Estado } from '../espaco';
import { PAGINAS_ANIMADAS } from './calmo';

const T = { press: 100, hover: 140, lado: 230, sub: 190, sep: 180, pasta: 440, janela: 260, registo: 260 };
const CURVA = 'cubic-bezier(.22, 1, .36, 1)', CURVA_IO = 'cubic-bezier(.4, 0, .2, 1)';
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const ligado = (pg: HTMLElement | null): pg is HTMLElement => !!pg && pg.classList.contains('dk8');

/* ---------- a origem do gesto: o botão em que se carregou (ou um retângulo vindo de dentro de um separador) ---------- */
let origem: { el: HTMLElement | null; r: DOMRect | null; t: number } = { el: null, r: null, t: 0 };
export function marcar(el: HTMLElement | null, r?: DOMRect): void { origem = { el, r: r ?? (el?.querySelector('svg') ?? el)?.getBoundingClientRect() ?? null, t: performance.now() }; }
/** A rota de cada separador desenhado (para saber o que se fechou). */
const rotas = new Map<string, string>();
const daOrigem = () => (performance.now() - origem.t < 1200 ? origem : null);
/** De onde nasceu cada janela, para voltar para lá e devolver o foco. */
const janelas = new Map<string, { r: DOMRect | null; el: HTMLElement | null }>();

/* ---------- a fotografia ---------- */
interface Foto { seps: Map<string, { r: DOMRect; rota: string; el: HTMLElement }>; ativo: string; area: DOMRect | null; rail: boolean; lado: Map<string, DOMRect>; ind: DOMRect | null; grupos: Map<string, { aberto: boolean; ul: HTMLElement | null; r: DOMRect | null }>; jans: Map<string, { el: HTMLElement; r: DOMRect }> }
const chaveLado = (b: HTMLElement) => b.dataset.dkAtalho ?? (b.dataset.dk7Grupo ? `g:${b.dataset.dk7Grupo}` : b.hasAttribute('data-dk-casa') ? 'casa' : b.hasAttribute('data-dk-ajuda-atalhos') ? 'atalhos' : '');
export function antes(pg: HTMLElement, e: Estado): Foto {
  const seps = new Map<string, { r: DOMRect; rota: string; el: HTMLElement }>();
  pg.querySelectorAll<HTMLElement>('[data-dk-seps] [data-dk-sep]').forEach((s) => { const id = s.dataset.dkSep!; seps.set(id, { r: s.getBoundingClientRect(), rota: id === 'inicio' ? '' : rotas.get(id) ?? e.seps.find((x) => x.id === id)?.rota ?? '', el: s.cloneNode(true) as HTMLElement }); });
  const lado = new Map<string, DOMRect>();
  pg.querySelectorAll<HTMLElement>('[data-dk7-lado] :is(.dk7-i, .dk7-g-t)').forEach((b) => { const k = chaveLado(b); if (k) lado.set(k, b.getBoundingClientRect()); });
  const grupos = new Map<string, { aberto: boolean; ul: HTMLElement | null; r: DOMRect | null }>();
  pg.querySelectorAll<HTMLElement>('[data-dk8-g]').forEach((g) => { const ul = g.querySelector<HTMLElement>(':scope > .dk7-l'); grupos.set(g.dataset.dk8G!, { aberto: g.classList.contains('is-aberto'), ul: ul && !ul.hidden ? ul.cloneNode(true) as HTMLElement : null, r: ul && !ul.hidden ? ul.getBoundingClientRect() : null }); });
  const jans = new Map<string, { el: HTMLElement; r: DOMRect }>();
  pg.querySelectorAll<HTMLElement>('[data-dk-jan]:not([hidden])').forEach((j) => jans.set(j.dataset.dkJan!, { el: j.cloneNode(true) as HTMLElement, r: j.getBoundingClientRect() }));
  return { seps, ativo: pg.querySelector<HTMLElement>('[data-dk-seps] .is-ativo')?.dataset.dkSep ?? 'inicio', area: pg.querySelector('.dk7-area')?.getBoundingClientRect() ?? null, rail: pg.classList.contains('is-rail'), lado, ind: pg.querySelector('[data-dk7-lado] .dk7-i.is-ativo')?.getBoundingClientRect() ?? null, grupos, jans };
}

/* ---------- peças voadoras ---------- */
function voador(pg: HTMLElement, cls: string, html: string, r: { left: number; top: number; width: number; height: number }): HTMLElement {
  const v = document.createElement('div');
  v.className = `dk8-voo ${cls}`; v.setAttribute('aria-hidden', 'true'); v.innerHTML = html;
  Object.assign(v.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
  pg.appendChild(v); return v;
}
const centro = (r: DOMRect) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
const DOC = '<svg viewBox="0 0 30 38"><path class="dk8-doc-f" d="M3 1h17l9 9v25a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2Z"/><path class="dk8-doc-c" d="M20 1v7a2 2 0 0 0 2 2h7"/><path class="dk8-doc-l" d="M7 17h16M7 22h16M7 27h10"/></svg>';
const PASTA = '<svg viewBox="0 0 64 50"><path class="dk8-p-fundo" d="M2 6a4 4 0 0 1 4-4h16a4 4 0 0 1 3 1.4L29 8h29a4 4 0 0 1 4 4v32a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4Z"/><rect class="dk8-p-folha" x="8" y="12" width="48" height="26" rx="2"/></svg><span class="dk8-p-frente"></span>';

/** O documento sai do sítio onde se carregou e voa, em arco, até ao separador. */
function voarDoc(pg: HTMLElement, de: DOMRect, para: DOMRect, volta = false): Animation {
  const a = centro(de), b = centro(para), w = 30, h = 38;
  const v = voador(pg, 'dk8-voo-doc', DOC, { left: a.x - w / 2, top: a.y - h / 2, width: w, height: h });
  const dx = b.x - a.x, dy = b.y - a.y, alto = Math.min(60, Math.abs(dx) * .18 + 24);
  const an = v.animate(volta
    ? [{ transform: 'translate(0,0) scale(.55)', opacity: .2 }, { transform: `translate(${dx * .5}px, ${dy * .5 - alto}px) scale(1.05)`, opacity: 1, offset: .5 }, { transform: `translate(${dx}px, ${dy}px) scale(.9)`, opacity: 0 }]
    : [{ transform: 'translate(0,0) scale(.85)', opacity: 0 }, { transform: 'translate(0,-6px) scale(1.05)', opacity: 1, offset: .18 }, { transform: `translate(${dx * .5}px, ${dy * .5 - alto}px) scale(1)`, opacity: 1, offset: .55 }, { transform: `translate(${dx}px, ${dy}px) scale(.55)`, opacity: 0 }],
  { duration: 300, easing: CURVA_IO });
  an.onfinish = () => v.remove(); return an;
}
/** O separador novo abre-se de lado, depois de o documento chegar. */
const nascerSep = (s: HTMLElement, atraso: number) => s.animate([{ clipPath: 'inset(0 100% 0 0 round 6px 6px 0 0)', opacity: .4 }, { clipPath: 'inset(0 0 0 0 round 6px 6px 0 0)', opacity: 1 }], { duration: T.sep, delay: atraso, easing: CURVA, fill: 'backwards' });
/** O painel abre-se a partir de um retângulo (o separador, a pasta), recortado. */
function revelar(painel: HTMLElement, de: DOMRect, atraso: number, dur: number): void {
  const p = painel.getBoundingClientRect(); if (!p.width) return;
  const l = Math.max(0, de.left - p.left), t = Math.max(0, de.top - p.top), r = Math.max(0, p.right - Math.max(de.right, p.left + 40)), b = Math.max(0, p.bottom - Math.max(de.bottom, p.top + 40));
  painel.animate([{ clipPath: `inset(${t}px ${r}px ${b}px ${l}px round 10px)`, opacity: .6 }, { clipPath: 'inset(0 0 0 0 round 0)', opacity: 1 }], { duration: dur, delay: atraso, easing: CURVA, fill: 'backwards' });
}

/* ---------- a assinatura: a pasta transforma-se no espaço de trabalho ---------- */
function pastaAbre(pg: HTMLElement, de: DOMRect, painel: HTMLElement, sep: HTMLElement | null): void {
  const p = painel.getBoundingClientRect(), c = centro(de);
  /* 1–3: a pasta responde, levanta-se e a aba abre em perspetiva */
  const v = voador(pg, 'dk8-voo-pasta', PASTA, { left: c.x - 32, top: c.y - 25, width: 64, height: 50 });
  const k0 = Math.max(.3, Math.min(1, de.width / 64));
  v.animate([{ transform: `scale(${k0})`, opacity: .6 }, { transform: 'translateY(-6px) scale(1.15)', opacity: 1, offset: .35 }, { transform: `translate(${(p.left + p.width / 2 - c.x) * .25}px, ${(p.top + 120 - c.y) * .25 - 6}px) scale(1.3)`, opacity: 0 }], { duration: 340, easing: CURVA }).onfinish = () => v.remove();
  v.querySelector<HTMLElement>('.dk8-p-frente')?.animate([{ transform: 'perspective(220px) rotateX(0deg)' }, { transform: 'perspective(220px) rotateX(-58deg)', offset: .5 }, { transform: 'perspective(220px) rotateX(-64deg)' }], { duration: 300, easing: CURVA, fill: 'forwards' });
  /* 4–5: o contorno cresce até à área e o explorador revela-se dentro dele */
  const ct = voador(pg, 'dk8-contorno', '', { left: p.left, top: p.top, width: p.width, height: p.height });
  ct.animate([{ transform: `translate(${c.x - 32 - p.left}px, ${c.y - 25 - p.top}px) scale(${64 / p.width}, ${50 / p.height})`, opacity: 0 }, { transform: `translate(${c.x - 32 - p.left}px, ${c.y - 25 - p.top}px) scale(${64 / p.width}, ${50 / p.height})`, opacity: 1, offset: .25 }, { transform: 'none', opacity: 1, offset: .85 }, { transform: 'none', opacity: 0 }], { duration: T.pasta, easing: CURVA }).onfinish = () => ct.remove();
  revelar(painel, new DOMRect(c.x - 32, c.y - 25, 64, 50), 130, T.pasta - 120);
  painel.querySelectorAll<HTMLElement>('.dk-fich, .dk-grelha > *, .dk-exp-cab').forEach((x, i) => x.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 220, delay: 240 + Math.min(i, 8) * 28, easing: CURVA, fill: 'backwards' }));
  /* 6: o separador nasce na barra */
  if (sep) nascerSep(sep, 190);
}
/** Ao fechar o separador da pasta, o espaço encolhe de volta para a pasta do menu e a aba fecha-se. */
function pastaFecha(pg: HTMLElement, de: DOMRect, para: DOMRect): void {
  const c = centro(para);
  const ct = voador(pg, 'dk8-contorno', '', { left: de.left, top: de.top, width: de.width, height: de.height });
  ct.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${c.x - 32 - de.left}px, ${c.y - 25 - de.top}px) scale(${64 / de.width}, ${50 / de.height})`, opacity: .9, offset: .8 }, { transform: `translate(${c.x - 32 - de.left}px, ${c.y - 25 - de.top}px) scale(${64 / de.width}, ${50 / de.height})`, opacity: 0 }], { duration: 320, easing: CURVA_IO }).onfinish = () => ct.remove();
  const v = voador(pg, 'dk8-voo-pasta', PASTA, { left: c.x - 32, top: c.y - 25, width: 64, height: 50 });
  v.querySelector<HTMLElement>('.dk8-p-frente')!.style.transform = 'perspective(220px) rotateX(-64deg)';
  v.animate([{ opacity: 0, transform: 'scale(1.15)' }, { opacity: 1, transform: 'scale(1.1)', offset: .65 }, { opacity: 0, transform: `scale(${Math.max(.3, para.width / 64)})` }], { duration: 420, easing: CURVA }).onfinish = () => v.remove();
  v.querySelector<HTMLElement>('.dk8-p-frente')!.animate([{ transform: 'perspective(220px) rotateX(-64deg)' }, { transform: 'perspective(220px) rotateX(-64deg)', offset: .6 }, { transform: 'perspective(220px) rotateX(0deg)' }], { duration: 420, easing: CURVA, fill: 'forwards' });
}

/* ---------- depois do redesenho ---------- */
const vis = (pg: HTMLElement, s: string) => [...pg.querySelectorAll<HTMLElement>(s)].find((x) => x.offsetParent !== null) ?? null;
export function depois(pg: HTMLElement, f: Foto, e: Estado): void {
  rotas.clear(); e.seps.forEach((s) => rotas.set(s.id, s.rota));
  indicadores(pg, f);
  if (quieto()) return;
  const novos = [...pg.querySelectorAll<HTMLElement>('[data-dk-seps] [data-dk-sep]')];
  const ids = new Set(novos.map((s) => s.dataset.dkSep!));
  const o = daOrigem();

  /* 26 out. (movimento calmo): mudar de página não anima — nem separadores, nem voos, nem o painel; ficam as janelas */
  if (PAGINAS_ANIMADAS) {
  /* separadores que ficam: chegam-se para o lugar novo (FLIP) */
  novos.forEach((s) => { const a = f.seps.get(s.dataset.dkSep!); if (!a) return; const dx = a.r.left - s.getBoundingClientRect().left; if (Math.abs(dx) > 1) s.animate([{ transform: `translateX(${dx}px)` }, { transform: 'none' }], { duration: T.sep + 20, easing: CURVA }); });

  /* separadores novos */
  for (const s of novos) {
    const id = s.dataset.dkSep!; if (f.seps.has(id) || id === 'inicio') continue;
    const sep = e.seps.find((x) => x.id === id); if (!sep) continue;
    const painel = pg.querySelector<HTMLElement>(`[data-painel="${CSS.escape(id)}"]`);
    if (sep.rota.startsWith('pasta:')) {
      const mod = sep.rota.slice(6);
      const de = o?.r ?? vis(pg, `[data-dk8-g="${CSS.escape(mod)}"] .dk8-pasta-ic`)?.getBoundingClientRect() ?? null;
      if (de && painel) { pastaAbre(pg, de, painel, s); origem.t = 0; continue; }
    }
    const fonte = o?.r ?? (vis(pg, `.dk7-cartao[data-dk-atalho="${CSS.escape(sep.rota)}"] .dk-cartao-ic`) ?? vis(pg, `[data-dk7-lado] [data-dk-atalho="${CSS.escape(sep.rota)}"] svg`))?.getBoundingClientRect() ?? null;
    const tr = s.getBoundingClientRect();
    if (fonte) { o?.el?.classList.add('is-soltar'); window.setTimeout(() => o?.el?.classList.remove('is-soltar'), 220); voarDoc(pg, fonte, tr); }
    nascerSep(s, fonte ? 200 : 0);
    if (painel && e.ativo === id) revelar(painel, tr, fonte ? 210 : 40, 300);
    origem.t = 0;
  }

  /* separadores fechados: encolhem; a pasta volta ao menu; o documento volta ao cartão se a casa ficou à vista */
  for (const [id, a] of f.seps) {
    if (ids.has(id) || id === 'inicio') continue;
    const g = a.el; g.classList.add('dk8-voo', 'dk8-voo-sep'); Object.assign(g.style, { left: `${a.r.left}px`, top: `${a.r.top}px`, width: `${a.r.width}px`, height: `${a.r.height}px` }); pg.appendChild(g);
    g.animate([{ transform: 'none', opacity: 1 }, { transform: 'scaleX(.15)', opacity: 0 }], { duration: T.sep, easing: CURVA_IO }).onfinish = () => g.remove();
    if (a.rota.startsWith('pasta:') && f.area) {
      const para = vis(pg, `[data-dk8-g="${CSS.escape(a.rota.slice(6))}"] .dk8-pasta-ic`)?.getBoundingClientRect();
      const area = pg.querySelector('[data-dk-paineis]')?.getBoundingClientRect();
      if (para && area) pastaFecha(pg, area, para);
    } else if (e.ativo === 'inicio') {
      const ic = vis(pg, `.dk7-cartao[data-dk-atalho="${CSS.escape(a.rota)}"] .dk-cartao-ic`);
      if (ic) { const an = voarDoc(pg, a.r, ic.getBoundingClientRect(), true); an.addEventListener('finish', () => ic.animate([{ transform: 'translateY(-3px) scale(1.12)' }, { transform: 'none' }], { duration: 220, easing: CURVA })); }
    }
  }

  /* outro separador ativo (sem ter nascido agora): o painel entra curto, a barra de ações também */
  if (f.ativo !== e.ativo) {
    const nasceu = !f.seps.has(e.ativo);
    const painel = pg.querySelector<HTMLElement>(`[data-painel="${CSS.escape(e.ativo)}"]`);
    if (painel && !nasceu) painel.animate([{ opacity: .35, transform: 'translateY(5px)' }, { opacity: 1, transform: 'none' }], { duration: T.sep, easing: CURVA });
    pg.querySelectorAll<HTMLElement>('[data-dk-acoes] > *').forEach((b, i) => b.animate([{ opacity: 0, transform: 'translateY(3px)' }, { opacity: 1, transform: 'none' }], { duration: 150, delay: i * 22, easing: CURVA, fill: 'backwards' }));
  }

  }

  /* janelas: nascem do botão que as abriu; as fechadas voltam para lá */
  pg.querySelectorAll<HTMLElement>('[data-dk-jan]:not([hidden])').forEach((j) => {
    const id = j.dataset.dkJan!; if (f.jans.has(id)) return;
    const de = o?.r ?? null; janelas.set(id, { r: de, el: o?.el ?? null });
    const r = j.getBoundingClientRect();
    if (de) j.animate([{ transformOrigin: '0 0', transform: `translate(${de.left - r.left}px, ${de.top - r.top}px) scale(${Math.max(.05, de.width / r.width)}, ${Math.max(.05, de.height / r.height)})`, opacity: .2 }, { transformOrigin: '0 0', transform: 'none', opacity: 1 }], { duration: T.janela, easing: CURVA });
    else j.animate([{ opacity: 0, transform: 'scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: CURVA });
    origem.t = 0;
    (j.querySelector<HTMLElement>('.dk-jan-corpo button, .dk-jan-corpo [tabindex]') ?? j.querySelector<HTMLElement>('[data-dk-jan-acao="fechar"]'))?.focus({ preventScroll: true });
  });
  for (const [id, a] of f.jans) {
    if (pg.querySelector(`[data-dk-jan="${CSS.escape(id)}"]:not([hidden])`)) continue;
    const ida = janelas.get(id); janelas.delete(id);
    const g = a.el; g.classList.add('dk8-voo'); Object.assign(g.style, { left: `${a.r.left}px`, top: `${a.r.top}px`, width: `${a.r.width}px`, height: `${a.r.height}px`, zIndex: '95' }); pg.appendChild(g);
    const para = ida?.el?.isConnected ? ida.el.getBoundingClientRect() : ida?.r;
    const fim = para && para.width ? { transformOrigin: '0 0', transform: `translate(${para.left - a.r.left}px, ${para.top - a.r.top}px) scale(${Math.max(.05, para.width / a.r.width)}, ${Math.max(.05, para.height / a.r.height)})`, opacity: 0 } : { transformOrigin: '50% 50%', transform: 'scale(.95)', opacity: 0 };
    g.animate([{ transformOrigin: fim.transformOrigin, transform: 'none', opacity: 1 }, fim], { duration: 220, easing: CURVA_IO }).onfinish = () => g.remove();
    if (ida?.el?.isConnected) ida.el.focus({ preventScroll: true });
  }

  /* o menu: no movimento calmo não anima (abrir grupos, recolher, o resto a chegar-se) */
  if (!PAGINAS_ANIMADAS) return;
  const rail = pg.classList.contains('is-rail');
  if (rail !== f.rail && f.area) {
    const area = pg.querySelector<HTMLElement>('.dk7-area'), lado = pg.querySelector<HTMLElement>('.dk7-lado');
    if (area && lado && getComputedStyle(lado).position !== 'fixed') {
      const dx = f.area.left - area.getBoundingClientRect().left;
      area.animate([{ transform: `translateX(${dx}px)` }, { transform: 'none' }], { duration: T.lado, easing: CURVA });
      if (dx > 0) lado.animate([{ boxShadow: `${dx}px 0 0 0 var(--k-arvore)` }, { boxShadow: '0 0 0 0 var(--k-arvore)' }], { duration: T.lado, easing: CURVA });
      lado.querySelectorAll<HTMLElement>(':is(.dk7-i, .dk7-rail) > span, .dk7-g-t').forEach((s) => s.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, delay: rail ? 0 : 90, easing: 'ease-out', fill: 'backwards' }));
    }
    return;
  }
  /* grupos abertos: os filhos em cascata e a guia a crescer; fechados: um clone sai em cascata inversa */
  pg.querySelectorAll<HTMLElement>('[data-dk8-g]').forEach((g) => {
    const id = g.dataset.dk8G!, a = f.grupos.get(id); if (!a) return;
    const agora = g.classList.contains('is-aberto'); if (agora === a.aberto) return;
    g.classList.add('is-mudou'); window.setTimeout(() => g.classList.remove('is-mudou'), 260);
    if (agora) {
      const ul = g.querySelector<HTMLElement>(':scope > .dk7-l');
      ul?.querySelectorAll<HTMLElement>(':scope > li').forEach((li, i) => li.animate([{ opacity: 0, transform: 'translateX(-6px)' }, { opacity: 1, transform: 'none' }], { duration: T.sub, delay: i * 26, easing: CURVA, fill: 'backwards' }));
      ul?.animate([{ '--guia': 0 } as Keyframe, { '--guia': 1 } as Keyframe], { duration: T.sub + 60, easing: CURVA });
    } else if (a.ul && a.r) {
      const c = a.ul; c.classList.add('dk8-voo'); c.removeAttribute('id'); Object.assign(c.style, { left: `${a.r.left}px`, top: `${a.r.top}px`, width: `${a.r.width}px`, margin: '0', zIndex: '1' });
      pg.querySelector('[data-dk7-lado]')?.appendChild(c);
      const lis = [...c.querySelectorAll<HTMLElement>(':scope > li')];
      lis.forEach((li, i) => li.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(-6px)' }], { duration: 140, delay: (lis.length - 1 - i) * 18, easing: CURVA_IO, fill: 'forwards' }));
      window.setTimeout(() => c.remove(), 140 + lis.length * 18);
    }
  });
  /* o resto do menu chega-se (FLIP vertical) */
  pg.querySelectorAll<HTMLElement>('[data-dk7-lado] :is(.dk7-i, .dk7-g-t)').forEach((b) => {
    const r0 = f.lado.get(chaveLado(b)); if (!r0) return;
    const dy = r0.top - b.getBoundingClientRect().top; if (Math.abs(dy) > 1) b.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: T.sub, easing: CURVA });
  });
}

/* ---------- os indicadores: o do separador ativo e o do item ativo do menu ---------- */
let indAntes = '';
export function indicadores(pg: HTMLElement, f?: Foto): void {
  const barra = pg.querySelector<HTMLElement>('.dk6-seps'), ind = pg.querySelector<HTMLElement>('[data-dk8-ind]'), a = pg.querySelector<HTMLElement>('[data-dk-seps] .dk-sep.is-ativo');
  if (barra && ind) {
    if (!a) ind.style.opacity = '0';
    else {
      const rb = barra.getBoundingClientRect(), ra = a.getBoundingClientRect(), x = ra.left - rb.left + barra.scrollLeft;
      const novo = `${x}|${ra.width}`;
      if (!indAntes || quieto()) ind.style.transition = 'none';
      ind.style.opacity = '1'; ind.style.width = `${ra.width}px`; ind.style.transform = `translateX(${x}px)`;
      if (ind.style.transition === 'none') requestAnimationFrame(() => { ind.style.transition = ''; });
      indAntes = novo;
    }
  }
  const lista = pg.querySelector<HTMLElement>('[data-dk7-lado] .dk7-lista'), i = lista?.querySelector<HTMLElement>('.dk7-i.is-ativo');
  if (!lista || !i || i.offsetParent === null) return;
  const bar = document.createElement('i'); bar.className = 'dk8-ind-lado'; bar.setAttribute('aria-hidden', 'true');
  const rl = lista.getBoundingClientRect(), ri = i.getBoundingClientRect();
  Object.assign(bar.style, { top: `${ri.top - rl.top + lista.scrollTop + 7}px`, height: `${ri.height - 14}px`, left: `${ri.left - rl.left}px` });
  lista.appendChild(bar);
  if (f?.ind && !quieto() && PAGINAS_ANIMADAS) { const dy = f.ind.top - ri.top; if (Math.abs(dy) > 1) bar.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 220, easing: CURVA }); }
}

/* ---------- Atualizar: o carregamento e o fim verdadeiros (o load do separador) ---------- */
export function aCarregar(pg: HTMLElement, f: HTMLIFrameElement): void {
  const b = () => pg.querySelector<HTMLElement>('[data-dk-acoes] [data-dk-acao="atualizar"]');
  b()?.classList.add('is-carregar');
  f.addEventListener('load', () => { const x = b(); x?.classList.remove('is-carregar'); x?.classList.add('is-ok'); window.setTimeout(() => b()?.classList.remove('is-ok'), 900); }, { once: true });
}
/** Dentro de um separador da v7: a página entra coordenada e o primeiro campo recebe o foco. */
export function dentro(d: Document, primeira: boolean): void {
  d.documentElement.classList.add('dk8-vivo');
  if (!primeira || quieto() || !PAGINAS_ANIMADAS) return;
  d.documentElement.classList.add('dk8-entra'); window.setTimeout(() => d.documentElement.classList.remove('dk8-entra'), 700);
}
