/* =========================================================
   ERP — Ficheiros (23 out. 2026): procurar, ordenar e escolher. Ver ficheiros/ecras.ts.
   - A procura filtra enquanto se escreve; Enter passa à primeira linha; Esc limpa.
   - Os cabeçalhos ordenam (asc → desc); as linhas escolhem-se com o rato, com ↑ ↓ e com Enter.
   - O detalhe da linha vem do seu <template>, já desenhado; nada se inventa aqui.
   ========================================================= */
/* no editor, com «Interagir» ligado (26 out.), o ecrã responde como no protótipo */
const editando = () => (document.body.classList.contains('editando') && !document.body.classList.contains('ed-interagir')) || document.body.classList.contains('com-fluxo');
import { mostrar } from '../../../comum/ecras';
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const raiz = (t: EventTarget | null) => (t as HTMLElement | null)?.closest?.<HTMLElement>('[data-fx]') ?? null;
const linhas = (r: HTMLElement) => [...r.querySelectorAll<HTMLTableRowElement>('[data-fx-linhas] tr')];
const visiveis = (r: HTMLElement) => linhas(r).filter((l) => !l.hidden);

const vivo = () => document.documentElement.classList.contains('dk8-vivo') && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
/** O contador do registo («3 de 20»), pela ordem e o filtro que estão à vista. */
function contar(r: HTMLElement, tr: HTMLTableRowElement): void {
  const c = r.querySelector<HTMLElement>('[data-fx-conta]'), vs = visiveis(r); if (c) c.textContent = `${vs.indexOf(tr) + 1} de ${vs.length}`;
}
function escolher(r: HTMLElement, tr: HTMLTableRowElement, foco = true): void {
  const antes = r.querySelector<HTMLTableRowElement>('[data-fx-linhas] tr[aria-selected="true"]');
  linhas(r).forEach((l) => { const sim = l === tr; l.setAttribute('aria-selected', String(sim)); l.tabIndex = sim ? 0 : -1; });
  const d = r.querySelector<HTMLElement>('[data-fx-det]'), t = r.querySelector<HTMLTemplateElement>(`template[data-fx-det-i="${tr.dataset.fxI}"]`);
  if (d && t) {
    if (vivo()) {
      /* Início v2: a referência da linha passa ao título do detalhe; o painel fica e só os valores mudam */
      const td = tr.querySelector('td')!, de = td.getBoundingClientRect();
      d.replaceChildren(t.content.cloneNode(true)); contar(r, tr);
      const h = d.querySelector<HTMLElement>('h2');
      if (h && antes !== tr) {
        const para = h.getBoundingClientRect();
        h.animate([{ transformOrigin: '0 0', transform: `translate(${de.left - para.left + 12}px, ${de.top - para.top + 10}px) scale(.92)`, opacity: .5 }, { transformOrigin: '0 0', transform: 'none', opacity: 1 }], { duration: 260, easing: 'cubic-bezier(.22, 1, .36, 1)' });
        d.querySelectorAll<HTMLElement>('dd, .fx-jans, h3, li').forEach((x, i) => x.animate([{ opacity: 0, transform: 'translateY(3px)' }, { opacity: 1, transform: 'none' }], { duration: 180, delay: 40 + Math.min(i, 12) * 12, easing: 'ease-out', fill: 'backwards' }));
        tr.animate([{ backgroundColor: 'color-mix(in srgb, var(--h-azul) 22%, var(--h-sup))' }, { backgroundColor: 'color-mix(in srgb, var(--h-azul) 11%, var(--h-sup))' }], { duration: 300, easing: 'ease-out' });
      }
    } else { d.replaceChildren(t.content.cloneNode(true)); contar(r, tr); d.classList.remove('is-entrar'); void d.offsetWidth; d.classList.add('is-entrar'); }
  }
  if (foco) tr.focus();
}
function filtrar(r: HTMLElement, q: string): void {
  const k = norm(q.trim());
  linhas(r).forEach((l) => { l.hidden = !!k && !(l.dataset.fxTexto ?? '').includes(k); });
  const vs = visiveis(r), nEl = r.querySelector<HTMLElement>('[data-fx-n]'), um = r.querySelector<HTMLElement>('[data-fx-um]');
  if (nEl) nEl.textContent = String(vs.length);
  if (um) um.textContent = vs.length === 1 ? um.dataset.fxUm! : um.dataset.fxVarios!;
  const nada = r.querySelector<HTMLElement>('[data-fx-nada]'); if (nada) { nada.hidden = vs.length > 0; const s = nada.querySelector('[data-fx-nada-q]'); if (s) s.textContent = q.trim(); }
  r.querySelector('.fx-tab')?.toggleAttribute('hidden', vs.length === 0);
  if (vs.length && !vs.some((l) => l.getAttribute('aria-selected') === 'true')) escolher(r, vs[0], false);
}
function ordenar(r: HTMLElement, b: HTMLElement): void {
  const th = b.closest('th')!, k = b.dataset.fxOrd!, sobe = th.getAttribute('aria-sort') !== 'ascending';
  r.querySelectorAll('.fx-tab th').forEach((x) => x.setAttribute('aria-sort', 'none'));
  th.setAttribute('aria-sort', sobe ? 'ascending' : 'descending');
  const corpo = r.querySelector('[data-fx-linhas]')!, val = (l: HTMLElement) => l.getAttribute(`data-fx-v-${k}`) ?? '';
  const ls = linhas(r).sort((a, c) => { const x = val(a), y = val(c), nx = Number(x), ny = Number(y); const d = x !== '' && y !== '' && !isNaN(nx) && !isNaN(ny) ? nx - ny : x.localeCompare(y, 'pt'); return sobe ? d : -d; });
  corpo.append(...ls);
}

/** 28 out.: Totais e Detalhes no mesmo ecrã — mostra a vista k e põe o indicador debaixo do separador dela. */
function parVista(c: HTMLElement, k: string, foco = false): void {
  const p = c.querySelector<HTMLElement>(`[data-fx-par-p="${k}"]`); if (!p) return;
  const q = c.querySelector<HTMLElement>('[data-fx-par-p]:not([hidden]) [data-fx-q]') as HTMLInputElement | null;
  c.querySelectorAll<HTMLElement>('[data-fx-par-p]').forEach((x) => { x.hidden = x !== p; });
  /* a procura passa à outra vista */
  const q2 = p.querySelector<HTMLInputElement>('[data-fx-q]'); const r = p.querySelector<HTMLElement>('[data-fx]');
  if (q && q2 && q2 !== q && !q2.disabled) { q2.value = q.value; if (r) filtrar(r, q2.value); }
  const b = p.querySelector<HTMLElement>(`[data-fx-par-vista="${k}"]`), ind = p.querySelector<HTMLElement>('[data-fx-par-ind]');
  if (b && ind) requestAnimationFrame(() => { const pr = b.parentElement!.getBoundingClientRect(), x = b.getBoundingClientRect(); if (!x.width) return; ind.style.transform = `translateX(${x.left - pr.left}px) scaleX(${x.width / 100})`; ind.classList.add('is-pronto'); });
  if (foco) b?.focus();
}
const parArmar = () => document.querySelectorAll<HTMLElement>('[data-fx-par]').forEach((c) => { const m = new URLSearchParams(location.hash.slice(1)).get('modo'); parVista(c, m && c.querySelector(`[data-fx-par-p="${CSS.escape(m)}"]`) ? m : (c.querySelector<HTMLElement>('[data-fx-par-p]:not([hidden])')?.dataset.fxParP ?? 'tot')); });

export function iniciar(): void {
  /* o contador do registo escolhido à partida */
  const armar = () => document.querySelectorAll<HTMLElement>('[data-fx]').forEach((r) => { const tr = r.querySelector<HTMLTableRowElement>('[data-fx-linhas] tr[aria-selected="true"]'); if (tr) contar(r, tr); });
  requestAnimationFrame(armar); ['romafe:versao', 'romafe:ecra'].forEach((x) => document.addEventListener(x, () => requestAnimationFrame(armar)));
  requestAnimationFrame(parArmar); ['romafe:versao', 'romafe:ecra'].forEach((x) => document.addEventListener(x, () => requestAnimationFrame(parArmar)));
  document.addEventListener('click', (ev) => {
    const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-fx-par-vista]'), c = b?.closest<HTMLElement>('[data-fx-par]'); if (!b || !c || editando()) return;
    parVista(c, b.dataset.fxParVista!, true);
  });
  document.addEventListener('keydown', (ev) => {
    if (!ev.altKey || !/^[1-9]$/.test(ev.key) || editando()) return;
    const c = document.querySelector<HTMLElement>('.ecra:not([hidden]) [data-fx-par]'); if (!c) return;
    /* 29 out.: Alt+1…Alt+n, pela ordem das vistas (Totais/Detalhes; os quatro Comparativos) */
    const ks = [...c.querySelectorAll<HTMLElement>('[data-fx-par-p]')].map((x) => x.dataset.fxParP!), k = ks[Number(ev.key) - 1]; if (!k) return;
    ev.preventDefault(); parVista(c, k, true);
  });
  document.addEventListener('input', (ev) => { const t = ev.target as HTMLInputElement, r = raiz(t); if (r && t.matches('[data-fx-q]')) filtrar(r, t.value); });
  document.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement, r = raiz(t); if (!r || editando()) return;
    let b: HTMLElement | null;
    if ((b = t.closest('[data-fx-repetir]'))) { mostrar(b.dataset.fxRepetir as never); return; }
    if ((b = t.closest('[data-fx-ord]'))) { ordenar(r, b); return; }
    if (t.closest('[data-fx-limpar]')) { const q = r.querySelector<HTMLInputElement>('[data-fx-q]')!; q.value = ''; filtrar(r, ''); q.focus(); return; }
    const tr = t.closest<HTMLTableRowElement>('[data-fx-linhas] tr'); if (tr) escolher(r, tr);
  });
  document.addEventListener('keydown', (ev) => {
    const t = ev.target as HTMLElement, r = raiz(t); if (!r || editando()) return;
    if (t.matches('[data-fx-q]')) {
      if (ev.key === 'Enter') { ev.preventDefault(); const l = visiveis(r)[0]; if (l) escolher(r, l); }
      else if (ev.key === 'Escape' && (t as HTMLInputElement).value) { ev.preventDefault(); ev.stopPropagation(); (t as HTMLInputElement).value = ''; filtrar(r, ''); }
      return;
    }
    const tr = t.closest<HTMLTableRowElement>('[data-fx-linhas] tr'); if (!tr) return;
    const vs = visiveis(r), i = vs.indexOf(tr);
    const para = ev.key === 'ArrowDown' ? vs[i + 1] : ev.key === 'ArrowUp' ? vs[i - 1] : ev.key === 'Home' ? vs[0] : ev.key === 'End' ? vs[vs.length - 1] : ev.key === 'Enter' ? tr : null;
    if (para) { ev.preventDefault(); escolher(r, para); }
  });
}
