/* =========================================================
   GOPARTS — 12 · Pedidos v2 (12 out. 2026), no estilo do Início v2.2
   Os separadores do estado filtram a tabela (com a contagem e o total do
   que se vê), cada pedido abre os seus artigos como um acordeão, e
   «Limpar» repõe os filtros. Os pedidos são de exemplo.
   No editor (body.editando) nada disto corre.
   ========================================================= */
const editando = () => document.body.classList.contains('editando');
const euros = (n: number) => n.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\./g, ' ') + ' €';
const valor = (tr: HTMLElement) => Number((tr.querySelector('.ped2__valor')?.textContent || '0').replace(/[^\d,]/g, '').replace(',', '.'));

function aplicar(c: HTMLElement, filtro: string): void {
  let n = 0, total = 0, k = 0;
  c.querySelectorAll<HTMLElement>('.ped2__linha').forEach((tr) => {
    const ver = filtro === 'todos' || tr.dataset.estado === filtro;
    tr.hidden = !ver;
    const det = tr.nextElementSibling as HTMLElement | null;
    if (det?.classList.contains('ped2__detalhe')) det.hidden = !ver;
    if (ver) { n++; total += valor(tr); tr.style.setProperty('--i', String(k++)); }
  });
  const tbody = c.querySelector<HTMLElement>('tbody');
  tbody?.classList.remove('is-a-entrar'); void tbody?.offsetWidth; tbody?.classList.add('is-a-entrar');
  c.querySelector('.ped2__conta')!.textContent = String(n);
  c.querySelector('.ped2__total')!.textContent = euros(total);
  c.querySelector<HTMLElement>('.ped2__vazio')!.hidden = n > 0;
  c.querySelector('.ped2__pe span')!.textContent = `A mostrar ${n} de 6 · de 01/03/2024 até hoje`;
}

export function iniciar(): void {
  document.addEventListener('click', (ev) => {
    if (editando()) return;
    const t = ev.target as Element;
    const c = t.closest<HTMLElement>('[data-pedidos]');
    if (!c) return;
    const aba = t.closest<HTMLElement>('.ped2__estado-aba');
    const abrir = t.closest<HTMLButtonElement>('.ped2__abrir');
    if (aba) {
      c.querySelectorAll('.ped2__estado-aba').forEach((a) => a.removeAttribute('aria-current'));
      aba.setAttribute('aria-current', 'true');
      aplicar(c, aba.dataset.filtro || 'todos');
    } else if (abrir) {
      const aberto = abrir.getAttribute('aria-expanded') === 'true';
      c.querySelectorAll('.ped2__abrir[aria-expanded="true"]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
      abrir.setAttribute('aria-expanded', String(!aberto));
    } else if (t.closest('.ped2__limpar')) {
      c.querySelectorAll<HTMLInputElement>('.ped2__campos input').forEach((i) => { i.value = i.id.endsWith('-de') ? '01/03/2024' : ''; });
      c.querySelector<HTMLElement>('.ped2__estado-aba[data-filtro="todos"]')?.click();
    }
  });
}
