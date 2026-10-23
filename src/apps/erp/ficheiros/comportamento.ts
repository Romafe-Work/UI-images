/* =========================================================
   ERP — Ficheiros (23 out. 2026): procurar, ordenar e escolher. Ver ficheiros/ecras.ts.
   - A procura filtra enquanto se escreve; Enter passa à primeira linha; Esc limpa.
   - Os cabeçalhos ordenam (asc → desc); as linhas escolhem-se com o rato, com ↑ ↓ e com Enter.
   - O detalhe da linha vem do seu <template>, já desenhado; nada se inventa aqui.
   ========================================================= */
const editando = () => document.body.classList.contains('editando') || document.body.classList.contains('com-fluxo');
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const raiz = (t: EventTarget | null) => (t as HTMLElement | null)?.closest?.<HTMLElement>('[data-fx]') ?? null;
const linhas = (r: HTMLElement) => [...r.querySelectorAll<HTMLTableRowElement>('[data-fx-linhas] tr')];
const visiveis = (r: HTMLElement) => linhas(r).filter((l) => !l.hidden);

function escolher(r: HTMLElement, tr: HTMLTableRowElement, foco = true): void {
  linhas(r).forEach((l) => { const sim = l === tr; l.setAttribute('aria-selected', String(sim)); l.tabIndex = sim ? 0 : -1; });
  const d = r.querySelector<HTMLElement>('[data-fx-det]'), t = r.querySelector<HTMLTemplateElement>(`template[data-fx-det-i="${tr.dataset.fxI}"]`);
  if (d && t) { d.replaceChildren(t.content.cloneNode(true)); d.classList.remove('is-entrar'); void d.offsetWidth; d.classList.add('is-entrar'); }
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

export function iniciar(): void {
  document.addEventListener('input', (ev) => { const t = ev.target as HTMLInputElement, r = raiz(t); if (r && t.matches('[data-fx-q]')) filtrar(r, t.value); });
  document.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement, r = raiz(t); if (!r || editando()) return;
    let b: HTMLElement | null;
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
