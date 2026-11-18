/* =========================================================
   ERP — andar nas tabelas com as setas (18 nov. 2026). Ela: «nas tabelas, depois de selecionar um item da tabela,
   permite andar com as setas».
     - com o foco numa janela de documento (a que abriu ao tocar na linha), ↑ e ↓ voltam à linha escolhida e andam na
       tabela, como se o foco lá estivesse: cada lista trata a tecla à sua maneira (escolhe, e a janela acompanha);
     - nos mapas de Stocks sem escolha própria (75, 77, 78), tocar numa linha marca-a e dá-lhe o foco, e ↑ ↓ Início Fim
       andam pelas linhas (as faixas e os totais ficam de fora).
   ========================================================= */
const JANELA = '.lf2-jan, [data-dv2-jan], [data-lf2-jan]';
const MAPAS = '.mac-tab, .mva-tab, .minv-tab';
const LINHA = 'tbody tr:not(.mac-g):not(.rc-g-cab):not(.rc-g-soma):not(.mst-det):not(.mva-abertura)';
const SETAS = ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'];

function marcar(tr: HTMLElement): void {
  tr.closest('tbody')?.querySelectorAll<HTMLElement>('tr.is-ativo').forEach((x) => { x.classList.remove('is-ativo'); x.tabIndex = -1; });
  tr.classList.add('is-ativo'); tr.tabIndex = 0; tr.focus({ preventScroll: true }); tr.scrollIntoView({ block: 'nearest' });
}

export function iniciar(): void {
  document.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement, tr = t.closest<HTMLElement>('tr');
    if (!tr || !tr.closest(MAPAS) || !tr.matches(LINHA) || t.closest('button, a, input, select')) return;
    marcar(tr);
  });
  document.addEventListener('keydown', (ev) => {
    if (!SETAS.includes(ev.key) || ev.ctrlKey || ev.altKey || ev.metaKey) return;
    const t = ev.target as HTMLElement;
    /* o foco na própria janela (não num campo dela): a tecla vai para a linha escolhida da tabela */
    if (t.matches(JANELA) && (ev.key === 'ArrowDown' || ev.key === 'ArrowUp')) {
      /* a página tem todos os ecrãs: procura-se só no que se vê */
      const r = t.closest<HTMLElement>('[data-hm]') ?? document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden])') ?? document;
      const tr = r.querySelector<HTMLElement>('tbody tr.is-ativo[tabindex], tbody tr[aria-selected="true"][tabindex]');
      if (!tr) return;
      ev.preventDefault(); tr.focus({ preventScroll: true });
      tr.dispatchEvent(new KeyboardEvent('keydown', { key: ev.key, shiftKey: ev.shiftKey, bubbles: true, cancelable: true }));
      return;
    }
    /* os mapas */
    const tr = t.matches('tr') ? t : null;
    if (!tr || !tr.closest(MAPAS) || !tr.matches(LINHA)) return;
    const ls = [...tr.closest('tbody')!.querySelectorAll<HTMLElement>(LINHA)], i = ls.indexOf(tr);
    const pag = Math.max(1, Math.floor((tr.closest('.lf2-grelha')?.clientHeight ?? 400) / Math.max(1, tr.offsetHeight)) - 1);
    const j = ev.key === 'ArrowDown' ? i + 1 : ev.key === 'ArrowUp' ? i - 1 : ev.key === 'PageDown' ? i + pag : ev.key === 'PageUp' ? i - pag : ev.key === 'Home' ? 0 : ls.length - 1;
    const n = ls[Math.max(0, Math.min(ls.length - 1, j))];
    if (n) { ev.preventDefault(); marcar(n); }
  });
}
