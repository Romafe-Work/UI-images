/* =========================================================
   ROMAFE — tema
   A mesma chave e o mesmo contrato do site do manual: claro, escuro, auto.
   O tema guardado aplica-se num <script> pequeno no <head> de cada página,
   antes de o corpo pintar; este módulo trata dos botões.
   ========================================================= */
export type Tema = 'light' | 'dark' | 'auto';

const CHAVE = 'uiux:tema';

export function actual(): Tema {
  try { return (localStorage.getItem(CHAVE) as Tema | null) || 'auto'; } catch { return 'auto'; }
}

function marcar(modo: Tema): void {
  document.querySelectorAll<HTMLElement>('.segmented__btn[data-tema]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.tema === modo));
  });
}

export function aplicar(modo: Tema): void {
  const raiz = document.documentElement;
  // "auto" não escreve nada: quem decide é o sistema, pela regra
  // prefers-color-scheme em tokens.css.
  if (modo === 'auto') raiz.removeAttribute('data-theme');
  else raiz.setAttribute('data-theme', modo);
  try { localStorage.setItem(CHAVE, modo); } catch { /* sem armazenamento */ }
  marcar(modo);
}

export function iniciar(): void {
  aplicar(actual());
  document.addEventListener('click', (ev) => {
    const btn = (ev.target as Element).closest<HTMLElement>('.segmented__btn[data-tema]');
    if (btn) aplicar(btn.dataset.tema as Tema);
  });
}
