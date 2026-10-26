/* =========================================================
   ERP — a moldura e o Início v3: o que mexe (22 out. 2026)
   - O menu: recolher a ícones (fica guardado), abrir e fechar Compras, o indicador desliza para o ativo, os
     destinos levam aos ecrãs (data-sh-ir). No telemóvel o menu abre por cima (☰) e fecha ao escolher.
   - A entrada da página: em cascata curta (≈400 ms) ao chegar ao Início — exceto quando vem da abertura (a página
     já entrou por baixo dela: erp:sem-entrada) ou no editor.
   ========================================================= */
import { mostrar } from '../../../comum/ecras';

/* no editor, com «Interagir» ligado (26 out.), o ecrã responde como no protótipo */
const editando = () => (document.body.classList.contains('editando') && !document.body.classList.contains('ed-interagir')) || document.body.classList.contains('com-fluxo');
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const CHAVE = 'erp:menu-recolhido';
let raiz: HTMLElement | null = null;

export function indicador(r: HTMLElement | null = raiz): void {
  if (!r) return;
  const lado = r.querySelector<HTMLElement>('[data-sh-lado]'), ind = r.querySelector<HTMLElement>('[data-sh-indicador]');
  const ativo = r.querySelector<HTMLElement>('.sh-sub.is-ativo:not([hidden])') && !r.classList.contains('is-recolhido') ? r.querySelector<HTMLElement>('.sh-sub.is-ativo') : r.querySelector<HTMLElement>('.sh-item.is-ativo');
  if (!lado || !ind || !ativo || !ativo.offsetParent) { if (ind) ind.style.opacity = '0'; return; }
  const a = ativo.getBoundingClientRect(), l = lado.getBoundingClientRect();
  ind.style.opacity = '1'; ind.style.setProperty('--y', `${a.top - l.top}px`); ind.style.setProperty('--h', `${a.height}px`);
}
function armar(): void {
  const r = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) [data-sh]');
  if (r === raiz) return;
  raiz = r;
  if (!r) return;
  try { r.classList.toggle('is-recolhido', localStorage.getItem(CHAVE) === '1'); } catch { /* */ }
  requestAnimationFrame(() => indicador(r));
  if (r.hasAttribute('data-sh-abertura')) return; // a abertura trata da entrada
  let vem = false; try { vem = sessionStorage.getItem('erp:sem-entrada') === '1'; sessionStorage.removeItem('erp:sem-entrada'); } catch { /* */ }
  if (vem || editando() || quieto()) return;
  r.classList.add('is-entrar'); void r.offsetWidth;
  requestAnimationFrame(() => r.classList.remove('is-entrar'));
}
export function iniciar(): void {
  requestAnimationFrame(armar);
  ['romafe:versao', 'romafe:ecra'].forEach((x) => document.addEventListener(x, () => { raiz = null; requestAnimationFrame(armar); }));
  window.addEventListener('hashchange', () => requestAnimationFrame(armar));
  window.addEventListener('resize', () => indicador());
  document.addEventListener('click', (ev) => {
    if (!raiz || editando()) return;
    const t = ev.target as Element; if (!raiz.contains(t)) return;
    let b: HTMLElement | null;
    if ((b = t.closest('[data-sh-recolher]'))) { const sim = !raiz.classList.contains('is-recolhido'); raiz.classList.toggle('is-recolhido', sim); b.setAttribute('aria-expanded', String(!sim)); try { localStorage.setItem(CHAVE, sim ? '1' : '0'); } catch { /* */ } window.setTimeout(() => indicador(), 260); return; }
    if ((b = t.closest('[data-sh-movel]'))) { raiz.classList.toggle('is-menu-aberto'); return; }
    if ((b = t.closest('[data-sh-abrir]'))) {
      if (raiz.classList.contains('is-recolhido')) { mostrar('compras'); return; }
      const sub = raiz.querySelector<HTMLElement>(`#sh-sub-${b.dataset.shAbrir}`); if (!sub) return;
      sub.hidden = !sub.hidden; b.setAttribute('aria-expanded', String(!sub.hidden)); requestAnimationFrame(() => indicador()); return;
    }
    if ((b = t.closest('[data-sh-ir]'))) { ev.preventDefault(); raiz.classList.remove('is-menu-aberto'); const para = b.dataset.shIr!; if (para !== 'inicio') mostrar(para); }
  }, true);
}
